/**
 * Enhanced GraphQL Editor with Schema-Aware Autocomplete
 * Uses cm6-graphql with introspected schema for intelligent completions
 */

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, Tooltip, useTheme } from '@mui/material';
import { ContentCopy, Fullscreen, FullscreenExit, AutoFixHigh, Casino } from '@mui/icons-material';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import { StateField, StateEffect, Range, Prec, EditorState } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { oneDark } from '@codemirror/theme-one-dark';
import { graphql } from 'cm6-graphql';
import { buildClientSchema } from 'graphql';
import { formatGraphQLQuery } from '@/lib/graphql-formatter';
import { 
  moveCompletionSelection,
  currentCompletions,
  completionKeymap
} from '@codemirror/autocomplete';

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
    const newState = { ...state };
    
    for (const effect of tr.effects) {
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

// View plugin for search decorations (no widget, just highlights)
const createSearchPlugin = (updateSearchState: (state: any) => void) => ViewPlugin.fromClass(class {
  decorations: DecorationSet;
  
  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view);
  }
  
  update(update: ViewUpdate) {
    this.decorations = this.buildDecorations(update.view);
    // Update React state when search state changes
    const search = update.view.state.field(searchState);
    updateSearchState({
      active: search.active,
      query: search.query,
      currentMatch: search.currentMatch,
      totalMatches: search.matches.length
    });
  }
  
  buildDecorations(view: EditorView): DecorationSet {
    const search = view.state.field(searchState);
    const decorations: Range<Decoration>[] = [];
    
    // Add match highlights
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

// Keymap for Emacs-style incremental search and autocomplete navigation
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
    key: 'Alt-n',
    run(view) {
      const completions = currentCompletions(view.state);
      if (completions.length > 0) {
        return moveCompletionSelection(true)(view);
      }
      return false;
    }
  },
  {
    key: 'Alt-p',
    run(view) {
      const completions = currentCompletions(view.state);
      if (completions.length > 0) {
        return moveCompletionSelection(false)(view);
      }
      return false;
    }
  },
  {
    key: 'Ctrl-j',
    run(view) {
      const completions = currentCompletions(view.state);
      if (completions.length > 0) {
        return moveCompletionSelection(true)(view);
      }
      return false;
    }
  },
  {
    key: 'Ctrl-k',
    run(view) {
      const completions = currentCompletions(view.state);
      if (completions.length > 0) {
        return moveCompletionSelection(false)(view);
      }
      return false;
    }
  },
  {
    key: 'Ctrl-n',
    run(view) {
      const completions = currentCompletions(view.state);
      if (completions.length > 0) {
        return moveCompletionSelection(true)(view);
      }
      return false;
    }
  },
  {
    key: 'Ctrl-p',
    run(view) {
      const completions = currentCompletions(view.state);
      if (completions.length > 0) {
        return moveCompletionSelection(false)(view);
      }
      return false;
    }
  },
  {
    key: 'ArrowDown',
    run(view) {
      const completions = currentCompletions(view.state);
      if (completions.length > 0) {
        return moveCompletionSelection(true)(view);
      }
      return false;
    }
  },
  {
    key: 'ArrowUp',
    run(view) {
      const completions = currentCompletions(view.state);
      if (completions.length > 0) {
        return moveCompletionSelection(false)(view);
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
  },
  {
    key: 'Backspace',
    run(view) {
      const search = view.state.field(searchState);
      if (search.active) {
        // Remove character from search query
        const newQuery = search.query.slice(0, -1);
        const newMatches = findMatches(view.state.doc.toString(), newQuery);
        
        const transaction: any = { effects: setSearchQuery.of(newQuery) };
        
        // If we have matches, move cursor to the first one
        if (newMatches.length > 0) {
          transaction.selection = { anchor: newMatches[0].from, head: newMatches[0].from };
          transaction.scrollIntoView = true;
        }
        
        view.dispatch(transaction);
        return true;
      }
      return false;
    }
  }
]);

// Custom input handler for incremental search and autocomplete navigation
const searchInputHandler = EditorView.domEventHandlers({
  keydown(event, view) {
    // Handle navigation key combinations for autocomplete
    const isAltN = event.altKey && (event.key === 'n' || event.code === 'KeyN');
    const isAltP = event.altKey && (event.key === 'p' || event.code === 'KeyP');
    const isCtrlJ = event.ctrlKey && (event.key === 'j' || event.code === 'KeyJ');
    const isCtrlK = event.ctrlKey && (event.key === 'k' || event.code === 'KeyK');
    const isCtrlDown = event.ctrlKey && event.key === 'ArrowDown';
    const isCtrlUp = event.ctrlKey && event.key === 'ArrowUp';
    
    if (isAltN || isAltP || isCtrlJ || isCtrlK || isCtrlDown || isCtrlUp) {
      const completions = currentCompletions(view.state);
      
      if (completions.length > 0) {
        event.preventDefault();
        event.stopPropagation();
        
        const isNext = isAltN || isCtrlJ || isCtrlDown;
        moveCompletionSelection(isNext)(view);
        return true;
      }
      
      // For Ctrl+Arrow keys, only handle when completions are active
      if ((isCtrlDown || isCtrlUp) && completions.length === 0) {
        return false;
      }
      
      return true; // Prevent default for Alt keys even if no completions
    }
    
    const search = view.state.field(searchState);
    
    if (search.active) {
      // Handle backspace and delete in search mode - highest priority
      if (event.key === 'Backspace') {
        event.preventDefault();
        event.stopPropagation();
        
        // Remove last character from search query
        const newQuery = search.query.slice(0, -1);
        const newMatches = findMatches(view.state.doc.toString(), newQuery);
        
        const transaction: any = { effects: setSearchQuery.of(newQuery) };
        
        // If we have matches, move cursor to the first one
        if (newMatches.length > 0) {
          transaction.selection = { anchor: newMatches[0].from, head: newMatches[0].from };
          transaction.scrollIntoView = true;
        }
        
        view.dispatch(transaction);
        return true;
      }
      
      // Handle regular character input in search mode
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        event.stopPropagation();
        
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
  const [reactSearchState, setReactSearchState] = useState({
    active: false,
    query: '',
    currentMatch: -1,
    totalMatches: 0
  });
  const editorRef = useRef<any>(null);
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
    // GraphQL language support with optional schema
    graphql(builtSchema || undefined),
    // Emacs-style incremental search (CodeMirror state field)
    searchState, // This is the CodeMirror StateField, not React state
    createSearchPlugin((state) => setReactSearchState(state)),
    searchInputHandler,
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
        minWidth: '200px',
      },
      '.cm-tooltip-autocomplete ul': {
        maxHeight: '200px',
        overflowY: 'auto',
      },
      '.cm-tooltip-autocomplete ul li': {
        padding: '6px 12px',
        cursor: 'pointer',
        borderRadius: '4px',
        margin: '1px 4px',
        color: isDark ? '#e1e4e8' : '#24292e',
        backgroundColor: 'transparent',
        fontSize: '13px',
        lineHeight: '1.4',
      },
      '.cm-tooltip-autocomplete ul li:hover': {
        backgroundColor: isDark ? '#2d3748' : '#f7fafc',
      },
      '.cm-tooltip-autocomplete ul li[aria-selected]': {
        backgroundColor: isDark ? '#3182ce' : '#2563eb',
        color: '#ffffff',
        fontWeight: '500',
      },
      '.cm-tooltip-autocomplete ul li[aria-selected]:hover': {
        backgroundColor: isDark ? '#2c5aa0' : '#1d4ed8',
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
      // Mode line at bottom (Emacs-style)
      '.cm-search-mode-line': {
        position: 'relative !important',
        backgroundColor: isDark ? '#2d3748 !important' : '#f1f5f9 !important',
        color: isDark ? '#e2e8f0 !important' : '#334155 !important',
        borderTop: isDark ? '1px solid #4a5568 !important' : '1px solid #cbd5e1 !important',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important',
      },
      // Ensure editor container has relative positioning for mode line
      '.cm-editor.cm-focused': {
        position: 'relative',
      },
    }),
    // Our custom keymap with HIGHEST precedence to override default Ctrl+K
    Prec.highest(emacsSearchKeymap)
  ];

  const editorProps = {
    value,
    onChange: onChange || (() => {}),
    extensions,
    readOnly,
    theme: isDark ? oneDark : undefined,
    placeholder,
    ref: editorRef,
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
        position: 'relative',
        '& .cm-editor': {
          height: isFullscreen ? 'calc(100vh - 80px)' : height,
          '&.cm-focused': {
            position: 'relative',
          }
        }
      }}>
        <CodeMirror {...editorProps} />
        
        {/* Emacs-style Search Mode Line */}
        {reactSearchState.active && (
          <Box sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: isDark ? '#2d3748' : '#f1f5f9',
            color: isDark ? '#e2e8f0' : '#334155',
            borderTop: 1,
            borderColor: isDark ? '#4a5568' : '#cbd5e1',
            px: 2,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: '12px',
            fontWeight: 500,
            zIndex: 1000,
            boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
            minHeight: '32px'
          }}>
            {/* Left side: I-search prompt and query */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography component="span" sx={{ color: '#81c784', mr: 1, fontWeight: 'bold', fontSize: '12px' }}>
                I-search:
              </Typography>
              <Box sx={{
                color: isDark ? '#ffffff' : '#000000',
                bgcolor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                minWidth: '20px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                {reactSearchState.query || ''}
              </Box>
            </Box>
            
            {/* Right side: match counter and help */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '11px' }}>
              <Box sx={{
                color: reactSearchState.totalMatches > 0 ? '#90cdf4' : 
                       (reactSearchState.query && reactSearchState.totalMatches === 0) ? '#fc8181' : '#a0aec0',
                fontWeight: reactSearchState.totalMatches > 0 ? 'bold' : 'normal',
                bgcolor: reactSearchState.totalMatches > 0 ? 'rgba(144, 205, 244, 0.1)' :
                         (reactSearchState.query && reactSearchState.totalMatches === 0) ? 'rgba(252, 129, 129, 0.1)' : 'transparent',
                px: reactSearchState.totalMatches > 0 || (reactSearchState.query && reactSearchState.totalMatches === 0) ? 1 : 0,
                py: reactSearchState.totalMatches > 0 || (reactSearchState.query && reactSearchState.totalMatches === 0) ? 0.5 : 0,
                borderRadius: 1,
                fontSize: '11px'
              }}>
                {reactSearchState.totalMatches > 0 
                  ? `(${reactSearchState.currentMatch + 1}/${reactSearchState.totalMatches})`
                  : reactSearchState.query && reactSearchState.totalMatches === 0 
                    ? '(no matches)'
                    : '(type to search)'
                }
              </Box>
              <Typography component="span" sx={{ color: '#a0aec0', fontSize: '11px' }}>
                C-s: next • C-r: prev • C-g: exit • Esc: cancel
              </Typography>
            </Box>
          </Box>
        )}
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
