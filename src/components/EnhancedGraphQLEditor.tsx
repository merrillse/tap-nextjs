/**
 * Enhanced GraphQL Editor with Schema-Aware Autocomplete
 * Uses cm6-graphql with introspected schema for intelligent completions
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Box, Paper, Typography, IconButton, Tooltip, useTheme } from '@mui/material';
import { ContentCopy, Fullscreen, FullscreenExit, AutoFixHigh, Casino } from '@mui/icons-material';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import { EditorState, StateField, StateEffect, Range } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { oneDark } from '@codemirror/theme-one-dark';
import { graphql } from 'cm6-graphql';
import { buildSchema, buildClientSchema, getIntrospectionQuery, IntrospectionQuery } from 'graphql';
import { formatGraphQLQuery } from '@/lib/graphql-formatter';

// Emacs-style incremental search implementation
interface SearchState {
  active: boolean;
  query: string;
  originalPosition: number;
  currentMatch: number;
  matches: Range<Decoration>[];
}

// Effects for managing search state
const setSearchQuery = StateEffect.define<string>();
const toggleSearch = StateEffect.define<boolean>();
const exitSearch = StateEffect.define<boolean>();
const setCurrentMatch = StateEffect.define<number>();

// State field for incremental search
const searchState = StateField.define<SearchState>({
  create() {
    return {
      active: false,
      query: '',
      originalPosition: 0,
      currentMatch: -1,
      matches: []
    };
  },
  update(state, tr) {
    let newState = { ...state };
    
    for (let effect of tr.effects) {
      if (effect.is(setSearchQuery)) {
        newState.query = effect.value;
        newState.matches = findMatches(tr.state.doc.toString(), effect.value);
        // Move to first match if query is not empty
        if (effect.value && newState.matches.length > 0) {
          newState.currentMatch = 0;
        } else {
          newState.currentMatch = -1;
        }
      } else if (effect.is(toggleSearch)) {
        if (!newState.active) {
          newState.active = true;
          newState.originalPosition = tr.state.selection.main.head;
          newState.query = '';
          newState.matches = [];
          newState.currentMatch = -1;
        }
      } else if (effect.is(exitSearch)) {
        newState.active = false;
        newState.query = '';
        newState.matches = [];
        newState.currentMatch = -1;
      } else if (effect.is(setCurrentMatch)) {
        newState.currentMatch = effect.value;
      }
    }
    
    return newState;
  }
});

// Helper function to find all matches
function findMatches(text: string, query: string): Range<Decoration>[] {
  if (!query) return [];
  
  const matches: Range<Decoration>[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let index = 0;
  
  while ((index = lowerText.indexOf(lowerQuery, index)) !== -1) {
    matches.push(Decoration.mark({
      class: 'cm-search-match'
    }).range(index, index + query.length));
    index += 1;
  }
  
  return matches;
}

// Search input widget
class SearchWidget extends WidgetType {
  constructor(
    private query: string, 
    private active: boolean, 
    private currentMatch: number = -1,
    private totalMatches: number = 0
  ) {
    super();
  }
  
  toDOM() {
    const div = document.createElement('div');
    div.className = 'cm-search-widget';
    div.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: #333;
      color: white;
      border: 1px solid #555;
      border-radius: 4px;
      padding: 4px 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 100;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;
    
    let text = `I-search: ${this.query}`;
    if (this.totalMatches > 0) {
      text += ` (${this.currentMatch + 1}/${this.totalMatches})`;
    } else if (this.query && this.totalMatches === 0) {
      text += ' (no matches)';
    }
    
    div.textContent = text;
    return div;
  }
  
  eq(widget: SearchWidget) {
    return widget.query === this.query && 
           widget.active === this.active &&
           widget.currentMatch === this.currentMatch &&
           widget.totalMatches === this.totalMatches;
  }
}

// View plugin for search decorations and widget
const searchPlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet;
  
  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view);
  }
  
  update(update: ViewUpdate) {
    this.decorations = this.buildDecorations(update.view);
  }
  
  buildDecorations(view: EditorView): DecorationSet {
    const search = view.state.field(searchState);
    const decorations: Range<Decoration>[] = [];
    
    // Add search widget at position 0 (always first)
    if (search.active) {
      decorations.push(Decoration.widget({
        widget: new SearchWidget(search.query, search.active, search.currentMatch, search.matches.length),
        side: 1
      }).range(0));
    }
    
    // Add match highlights, but use different class for current match
    search.matches.forEach((match, index) => {
      if (index === search.currentMatch) {
        // Current match gets special highlighting
        decorations.push(Decoration.mark({
          class: 'cm-search-current-match'
        }).range(match.from, match.to));
      } else {
        // Regular match highlighting
        decorations.push(match);
      }
    });
    
    return Decoration.set(decorations);
  }
}, {
  decorations: v => v.decorations
});

// Keymap for Emacs-style incremental search
const emacsSearchKeymap = keymap.of([
  {
    key: 'Ctrl-s',
    run(view) {
      const search = view.state.field(searchState);
      if (!search.active) {
        // Start search mode
        view.dispatch({ effects: toggleSearch.of(true) });
        return true;
      } else {
        // Already in search mode - advance to next match
        if (search.matches.length > 0) {
          const nextMatch = (search.currentMatch + 1) % search.matches.length;
          const match = search.matches[nextMatch];
          
          view.dispatch({
            effects: setCurrentMatch.of(nextMatch),
            selection: { anchor: match.from, head: match.from },
            scrollIntoView: true
          });
        }
        return true;
      }
    }
  },
  {
    key: 'Ctrl-r',
    run(view) {
      const search = view.state.field(searchState);
      if (!search.active) {
        // Start reverse search mode
        view.dispatch({ effects: toggleSearch.of(true) });
        return true;
      } else {
        // Already in search mode - go to previous match (reverse direction)
        if (search.matches.length > 0) {
          const prevMatch = search.currentMatch <= 0 
            ? search.matches.length - 1 
            : search.currentMatch - 1;
          const match = search.matches[prevMatch];
          
          view.dispatch({
            effects: setCurrentMatch.of(prevMatch),
            selection: { anchor: match.from, head: match.from },
            scrollIntoView: true
          });
        }
        return true;
      }
    }
  },
  {
    key: 'Ctrl-g',
    run(view) {
      const search = view.state.field(searchState);
      if (search.active) {
        // Return to original position
        view.dispatch({
          effects: exitSearch.of(true),
          selection: { anchor: search.originalPosition, head: search.originalPosition },
          scrollIntoView: true
        });
        return true;
      }
      return false;
    }
  },
  {
    key: 'Ctrl-n',
    run(view) {
      const search = view.state.field(searchState);
      if (search.active) {
        view.dispatch({ effects: exitSearch.of(true) });
        // Let the default Ctrl-n behavior continue (move down)
        return false;
      }
      return false;
    }
  },
  {
    key: 'Ctrl-p',
    run(view) {
      const search = view.state.field(searchState);
      if (search.active) {
        view.dispatch({ effects: exitSearch.of(true) });
        // Let the default Ctrl-p behavior continue (move up)
        return false;
      }
      return false;
    }
  },
  {
    key: 'Escape',
    run(view) {
      const search = view.state.field(searchState);
      if (search.active) {
        view.dispatch({ effects: exitSearch.of(true) });
        return true;
      }
      return false;
    }
  }
]);

// Custom input handler for incremental search
const searchInputHandler = EditorView.domEventHandlers({
  keydown(event, view) {
    const search = view.state.field(searchState);
    
    if (search.active) {
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        // Add character to search and move cursor to first match
        const newQuery = search.query + event.key;
        const newMatches = findMatches(view.state.doc.toString(), newQuery);
        
        const transaction: any = { effects: setSearchQuery.of(newQuery) };
        
        // If we have matches, move cursor to the first one
        if (newMatches.length > 0) {
          transaction.selection = { anchor: newMatches[0].from, head: newMatches[0].from };
          transaction.scrollIntoView = true;
        }
        
        view.dispatch(transaction);
        event.preventDefault();
        return true;
      } else if (event.key === 'Backspace') {
        // Remove character from search and move cursor to first match
        const newQuery = search.query.slice(0, -1);
        const newMatches = findMatches(view.state.doc.toString(), newQuery);
        
        const transaction: any = { effects: setSearchQuery.of(newQuery) };
        
        // If we have matches, move cursor to the first one
        if (newMatches.length > 0) {
          transaction.selection = { anchor: newMatches[0].from, head: newMatches[0].from };
          transaction.scrollIntoView = true;
        }
        
        view.dispatch(transaction);
        event.preventDefault();
        return true;
      }
    }
    
    return false;
  }
});

interface EnhancedGraphQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  label?: string;
  schema?: any; // GraphQL schema from introspection
  readOnly?: boolean;
  onGenerateRandomQuery?: () => void;
  isGeneratingQuery?: boolean;
}

export function EnhancedGraphQLEditor({
  value,
  onChange,
  placeholder,
  height = '300px',
  label = 'GraphQL Query',
  schema,
  readOnly = false,
  onGenerateRandomQuery,
  isGeneratingQuery = false
}: EnhancedGraphQLEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Build GraphQL schema for autocomplete
  const builtSchema = useMemo(() => {
    if (!schema?.data?.__schema) {
      return null;
    }

    try {
      // Convert introspection result to executable schema
      return buildClientSchema(schema.data);
    } catch (error) {
      console.warn('Failed to build GraphQL schema for autocomplete:', error);
      return null;
    }
  }, [schema]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleFormat = async () => {
    if (!onChange) return;
    
    try {
      const formatted = formatGraphQLQuery(value);
      onChange(formatted);
    } catch (err) {
      console.error('Failed to format GraphQL:', err);
    }
  };

  // Custom syntax highlighting
  const graphQLHighlight = HighlightStyle.define([
    { tag: t.keyword, color: isDark ? '#f97583' : '#d73a49' }, // GraphQL keywords
    { tag: t.typeName, color: isDark ? '#b392f0' : '#6f42c1' }, // Type names
    { tag: t.propertyName, color: isDark ? '#79b8ff' : '#005cc5' }, // Field names
    { tag: t.string, color: isDark ? '#9ecbff' : '#032f62' }, // String values
    { tag: t.number, color: isDark ? '#79b8ff' : '#005cc5' }, // Numbers
    { tag: t.bool, color: isDark ? '#79b8ff' : '#005cc5' }, // Booleans
    { tag: t.null, color: isDark ? '#959da5' : '#6a737d' }, // null values
    { tag: t.comment, color: isDark ? '#959da5' : '#6a737d', fontStyle: 'italic' }, // Comments
    { tag: t.punctuation, color: isDark ? '#e1e4e8' : '#24292e' }, // Punctuation
    { tag: t.bracket, color: isDark ? '#e1e4e8' : '#24292e' }, // Brackets
    { tag: t.variableName, color: isDark ? '#ffab70' : '#e36209' }, // Variables
  ]);

  const extensions = [
    // Emacs-style incremental search
    searchState,
    searchPlugin,
    emacsSearchKeymap,
    searchInputHandler,
    // GraphQL language support with optional schema
    graphql(builtSchema || undefined),
    syntaxHighlighting(graphQLHighlight),
    EditorView.theme({
      '&': {
        fontSize: '14px',
        position: 'relative',
      },
      '.cm-content': {
        padding: '16px',
        minHeight: height,
      },
      '.cm-focused': {
        outline: 'none',
      },
      '.cm-editor': {
        borderRadius: '8px',
      },
      '.cm-scroller': {
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      },
      '.cm-activeLine': {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      },
      '.cm-activeLineGutter': {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      },
      '.cm-tooltip-autocomplete': {
        backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
        border: isDark ? '1px solid #404040' : '1px solid #d1d5db',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
      '.cm-tooltip-autocomplete ul li': {
        padding: '4px 8px',
      },
      '.cm-tooltip-autocomplete ul li[aria-selected]': {
        backgroundColor: isDark ? '#374151' : '#f3f4f6',
      },
      // Emacs-style search styling
      '.cm-search-match': {
        backgroundColor: isDark ? 'rgba(255, 255, 0, 0.3)' : 'rgba(255, 215, 0, 0.3)',
        border: isDark ? '1px solid rgba(255, 255, 0, 0.5)' : '1px solid rgba(255, 215, 0, 0.5)',
      },
      '.cm-search-current-match': {
        backgroundColor: isDark ? 'rgba(255, 165, 0, 0.6)' : 'rgba(255, 140, 0, 0.6)',
        border: isDark ? '2px solid rgba(255, 165, 0, 0.8)' : '2px solid rgba(255, 140, 0, 0.8)',
        borderRadius: '2px',
      },
      '.cm-search-widget': {
        backgroundColor: isDark ? '#2d2d2d !important' : '#f8f9fa !important',
        color: isDark ? '#ffffff !important' : '#333333 !important',
        border: isDark ? '1px solid #555555 !important' : '1px solid #cccccc !important',
      },
    })
  ];

  const editorProps = {
    value,
    onChange: onChange || (() => {}),
    extensions,
    readOnly,
    theme: isDark ? oneDark : undefined,
    placeholder,
    basicSetup: {
      lineNumbers: true,
      foldGutter: true,
      dropCursor: false,
      allowMultipleSelections: false,
      indentOnInput: true,
      bracketMatching: true,
      closeBrackets: true,
      autocompletion: true, // Enable autocomplete
      highlightSelectionMatches: true,
      searchKeymap: true,
    }
  };

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        right: isFullscreen ? 0 : 'auto',
        bottom: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto',
        height: isFullscreen ? '100vh' : 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: 'grey.50'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
            {label}
          </Typography>
          {builtSchema && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 'medium' }}>
                Schema Loaded
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!readOnly && onGenerateRandomQuery && (
            <Tooltip title="Generate Random Query">
              <IconButton size="small" onClick={onGenerateRandomQuery} disabled={isGeneratingQuery}>
                {isGeneratingQuery ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                ) : (
                  <Casino fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          )}
          {!readOnly && (
            <Tooltip title="Format GraphQL">
              <IconButton size="small" onClick={handleFormat}>
                <AutoFixHigh fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Copy to clipboard">
            <IconButton size="small" onClick={handleCopy}>
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
            <IconButton size="small" onClick={() => setIsFullscreen(!isFullscreen)}>
              {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Editor */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        '& .cm-editor': {
          height: isFullscreen ? 'calc(100vh - 80px)' : height,
        }
      }}>
        <CodeMirror {...editorProps} />
      </Box>

      {/* Schema Status */}
      {!builtSchema && !readOnly && (
        <Box sx={{ 
          p: 2, 
          borderTop: 1, 
          borderColor: 'divider',
          bgcolor: 'warning.50',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <Typography variant="caption" sx={{ color: 'warning.main' }}>
            Schema not loaded - autocomplete limited to syntax only
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
