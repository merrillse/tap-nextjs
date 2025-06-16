/**
 * Enhanced GraphQL Editor with Schema-Aware Autocomplete
 * Uses cm6-graphql with introspected schema for intelligent completions
 */

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, Tooltip, useTheme, List, ListItem, ListItemText, ListItemSecondaryAction, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider } from '@mui/material';
import { ContentCopy, Fullscreen, FullscreenExit, AutoFixHigh, Casino, Save, LibraryBooks, PlayArrow, FileCopy, Help } from '@mui/icons-material';
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
import { QueryLibrary, type SavedQuery } from '@/lib/query-library';
import { 
  moveCompletionSelection,
  currentCompletions,
  completionKeymap
} from '@codemirror/autocomplete';
import { search, searchKeymap } from '@codemirror/search'; // Added for standard search/replace

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
  },
  {
    key: 'Ctrl-f',
    run(view) {
      const search = view.state.field(searchState);
      if (search.active) {
        // Exit search and move cursor forward one character
        const currentPos = view.state.selection.main.head;
        view.dispatch({
          effects: exitSearch.of(true),
          selection: { anchor: currentPos + 1, head: currentPos + 1 },
          scrollIntoView: true
        });
        return true;
      }
      return false;
    }
  },
  {
    key: 'Escape',
    run(view) {
      const search = view.state.field(searchState);
      if (search.active) {
        // Exit search mode
        view.dispatch({ effects: exitSearch.of(true) });
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
      // Handle search-specific control keys first (these should NOT exit search)
      if (event.ctrlKey || event.metaKey) {
        const key = event.key.toLowerCase();
        
        // These keys should continue search mode - don't exit
        if (key === 's' || key === 'r' || key === 'g') {
          return false; // Let the keymap handle these
        }
        
        // Handle other specific control keys that should exit search
        const exitKeys = ['f', 'b', 'a', 'e', 'k', 'n', 'p', 'v', 'l', 'd', 'h', 'w', 'u', 'i', 'o', 't', 'y', 'x', 'c', 'z'];
        if (exitKeys.includes(key)) {
          view.dispatch({ effects: exitSearch.of(true) });
          // Don't prevent default - let the control key do its normal action
          return false;
        }
      }
      
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

// Side Panel Library Component for Fullscreen Mode
interface SidePanelLibraryProps {
  onSelectQuery: (query: SavedQuery) => void;
  onRunQuery: (query: SavedQuery) => void;
}

function SidePanelLibrary({ onSelectQuery, onRunQuery }: SidePanelLibraryProps) {
  const [queries, setQueries] = useState<SavedQuery[]>([]);

  useEffect(() => {
    const loadQueries = () => {
      const allQueries = QueryLibrary.getQueries();
      setQueries(allQueries);
    };

    loadQueries();
    // Refresh queries when the component mounts
    window.addEventListener('storage', loadQueries);
    return () => window.removeEventListener('storage', loadQueries);
  }, []);

  if (queries.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No saved queries yet
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Save a query to see it here
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ p: 0 }}>
      {queries.map((query) => (
        <ListItem 
          key={query.id}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                  {query.name}
                </Typography>
                <Chip 
                  label={query.environment} 
                  size="small" 
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: '20px' }}
                />
              </Box>
            }
            secondary={
              <Box>
                {query.description && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {query.description}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  {new Date(query.updatedAt).toLocaleDateString()}
                </Typography>
              </Box>
            }
          />
          <ListItemSecondaryAction>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Load Query">
                <IconButton 
                  size="small" 
                  onClick={() => onSelectQuery(query)}
                  sx={{ fontSize: '0.8rem' }}
                >
                  <span>📝</span>
                </IconButton>
              </Tooltip>
              <Tooltip title="Run Query">
                <IconButton 
                  size="small" 
                  onClick={() => onRunQuery(query)}
                >
                  <PlayArrow fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );
}

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
  onSaveQuery?: () => void;
  onDuplicateQuery?: () => void;
  onShowLibrary?: () => void;
  canSaveQuery?: boolean;
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
  isGeneratingQuery = false,
  onSaveQuery,
  onDuplicateQuery,
  onShowLibrary,
  canSaveQuery = false
}: EnhancedGraphQLEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidePanelLibrary, setShowSidePanelLibrary] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [reactSearchState, setReactSearchState] = useState({
    active: false,
    query: '',
    currentMatch: -1,
    totalMatches: 0
  });
  const editorRef = useRef<any>(null);
  const theme = useTheme();

  // Debug fullscreen state changes
  useEffect(() => {
    console.log('🔍 DEBUG: Fullscreen state changed:', isFullscreen);
    console.log('🔍 DEBUG: Document body style:', document.body.style.overflow);
    console.log('🔍 DEBUG: Window dimensions:', window.innerWidth, 'x', window.innerHeight);
    
    // Add/remove fullscreen styles
    if (isFullscreen) {
      // Inject CSS to prevent parent containers from clipping
      const style = document.createElement('style');
      style.id = 'graphql-editor-fullscreen-styles';
      style.textContent = `
        .graphql-editor-fullscreen [data-testid="graphql-editor-paper"] {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 9999 !important;
          transform: none !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      // Remove injected styles
      const style = document.getElementById('graphql-editor-fullscreen-styles');
      if (style) {
        style.remove();
      }
    }
    
    // Check if Paper element exists and has correct styles
    setTimeout(() => {
      const paperElement = document.querySelector('[data-testid="graphql-editor-paper"]');
      if (paperElement) {
        const styles = window.getComputedStyle(paperElement);
        console.log('🔍 DEBUG: Paper element position:', styles.position);
        console.log('🔍 DEBUG: Paper element zIndex:', styles.zIndex);
        console.log('🔍 DEBUG: Paper element width:', styles.width);
        console.log('🔍 DEBUG: Paper element height:', styles.height);
        console.log('🔍 DEBUG: Paper element top:', styles.top);
        console.log('🔍 DEBUG: Paper element left:', styles.left);
        
        // Check CodeMirror editor
        const editorElement = paperElement.querySelector('.cm-editor');
        if (editorElement) {
          const editorStyles = window.getComputedStyle(editorElement);
          console.log('🔍 DEBUG: CodeMirror editor height:', editorStyles.height);
          console.log('🔍 DEBUG: CodeMirror editor width:', editorStyles.width);
          console.log('🔍 DEBUG: CodeMirror editor display:', editorStyles.display);
        }
        
        // Check main content area
        const mainContent = paperElement.querySelector('div[data-testid="main-content"]');
        if (mainContent) {
          const mainStyles = window.getComputedStyle(mainContent);
          console.log('🔍 DEBUG: Main content height:', mainStyles.height);
          console.log('🔍 DEBUG: Main content flex:', mainStyles.flex);
        }
      } else {
        console.log('🔍 DEBUG: Paper element not found');
      }
    }, 100);
  }, [isFullscreen]);

  // Function to handle fullscreen toggle with debugging
  const handleFullscreenToggle = () => {
    console.log('🔍 DEBUG: Fullscreen button clicked, current state:', isFullscreen);
    const newState = !isFullscreen;
    setIsFullscreen(newState);
    console.log('🔍 DEBUG: Setting fullscreen to:', newState);
    
    // Close side panel when entering fullscreen
    if (newState) {
      setShowSidePanelLibrary(false);
      console.log('🔍 DEBUG: Closed side panel for fullscreen');
    }
    
    // Prevent body scroll and add fullscreen class when in fullscreen
    if (newState) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('graphql-editor-fullscreen');
      console.log('🔍 DEBUG: Set body overflow to hidden and added fullscreen class');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('graphql-editor-fullscreen');
      console.log('🔍 DEBUG: Reset body overflow and removed fullscreen class');
    }
  };
  const isDark = theme.palette.mode === 'dark';

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

  // Handle Escape key to close side panel or exit fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        console.log('🔍 DEBUG: Escape key pressed, fullscreen:', isFullscreen, 'sidePanelLibrary:', showSidePanelLibrary);
        if (showSidePanelLibrary && isFullscreen) {
          // Close side panel first
          event.preventDefault();
          setShowSidePanelLibrary(false);
          console.log('🔍 DEBUG: Closing side panel');
        } else if (isFullscreen) {
          // Exit fullscreen if no side panel is open
          event.preventDefault();
          console.log('🔍 DEBUG: Exiting fullscreen via Escape');
          setIsFullscreen(false);
          document.body.style.overflow = '';
          document.body.classList.remove('graphql-editor-fullscreen');
        }
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showSidePanelLibrary, isFullscreen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up body classes and styles on unmount
      document.body.style.overflow = '';
      document.body.classList.remove('graphql-editor-fullscreen');
      const style = document.getElementById('graphql-editor-fullscreen-styles');
      if (style) {
        style.remove();
      }
    };
  }, []);

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

  const baseExtensions = useMemo(() => {
    const extensions = [
      EditorView.lineWrapping,
      EditorView.theme({
        "&": {
          fontSize: "13px",
          height: "100%",
          backgroundColor: isDark ? '#282c34' : '#ffffff',
        },
        ".cm-content": {
          caretColor: isDark ? "#ffffff" : "#000000",
          fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
        },
        ".cm-gutters": {
          backgroundColor: isDark ? '#282c34' : '#f0f0f0',
          color: isDark ? "#888" : "#666",
          borderRight: isDark ? "1px solid #333" : "1px solid #ddd",
        },
        ".cm-activeLineGutter": {
          backgroundColor: isDark ? '#333a4a' : '#e0e0e0',
        },
        ".cm-tooltip-autocomplete": {
          backgroundColor: isDark ? "#333a4a" : "#f0f0f0",
          border: isDark ? "1px solid #444" : "1px solid #ccc",
          borderRadius: "4px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          maxHeight: "200px",
          overflowY: "auto",
        },
        ".cm-tooltip-autocomplete ul li": {
          padding: "4px 8px",
          color: isDark ? "#abb2bf" : "#333",
        },
        ".cm-tooltip-autocomplete ul li[aria-selected]": {
          backgroundColor: isDark ? "#3b4048" : "#d4e2f0",
          color: isDark ? "#ffffff" : "#000",
        },
        // Search match styling (for Emacs-style search)
        ".cm-search-match": { backgroundColor: "yellow", color: "black" },
        ".cm-search-current-match": { backgroundColor: "orange", color: "black" },
      }),
      syntaxHighlighting(graphQLHighlight), // Use the defined graphQLHighlight
      Prec.high(keymap.of(completionKeymap)), // Ensure completion keymap has high precedence
      Prec.high(searchInputHandler), // Add the searchInputHandler with high precedence
      emacsSearchKeymap, // Keep Emacs-style search
      searchState, // State for Emacs-style search
      createSearchPlugin(setReactSearchState), // Instantiate the search plugin
      search(), // Added for standard search panel functionality
      keymap.of(searchKeymap), // Added for standard search keybindings (Cmd/Ctrl-F)
    ];

    if (builtSchema) { // Use builtSchema
      extensions.push(
        graphql(builtSchema), // Use builtSchema
        // Add any other schema-specific extensions here
      );
    } else {
      extensions.push(
        graphql(), // Empty schema for syntax highlighting only
      );
    }

    return extensions;
  }, [isDark, builtSchema, graphQLHighlight, setReactSearchState]); // Add dependencies

  const editorProps = {
    value,
    onChange: onChange || (() => {}),
    extensions: baseExtensions,
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
    <>
      {/* Fullscreen Backdrop - Render before Paper so it appears behind */}
      {isFullscreen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9998,
            pointerEvents: 'none'
          }}
        />
      )}
      
      <Paper 
        elevation={isFullscreen ? 24 : 1}
        data-testid="graphql-editor-paper"
        sx={{ 
          position: isFullscreen ? 'fixed' : 'relative',
          top: isFullscreen ? 0 : 'auto',
          left: isFullscreen ? 0 : 'auto',
          right: isFullscreen ? 0 : 'auto',
          bottom: isFullscreen ? 0 : 'auto',
          zIndex: isFullscreen ? 9999 : 'auto',
          width: isFullscreen ? '100vw' : 'auto',
          height: isFullscreen ? '100vh' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: isFullscreen ? 'background.paper' : 'inherit',
          ...(isFullscreen && {
            borderRadius: 0,
            maxWidth: 'none',
            maxHeight: 'none',
            // Debug styling - use outline instead of border to not affect layout
            outline: '5px solid red',
            outlineOffset: '-5px',
            padding: 0,
            margin: 0
          })
        }}
      >
        {/* Main Content Area */}
        <Box 
          data-testid="main-content"
          sx={{ 
            display: 'flex', 
            flex: 1, 
            overflow: 'hidden',
            position: 'relative',
            ...(isFullscreen && {
              padding: 0,
              margin: 0
            })
          }}
        >
          {/* Editor Section */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            // Remove margin in fullscreen mode - side panel is disabled
            transition: 'none',
            marginRight: '0px',
            ...(isFullscreen && {
              padding: 0,
              margin: 0
            })
          }}>
            {/* Header */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              p: isFullscreen ? 1 : 2, 
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
            
            {/* Query Management Buttons */}
            {!readOnly && (onShowLibrary || onSaveQuery || onDuplicateQuery) && (
              <>
                {onGenerateRandomQuery && (
                  <Box sx={{ width: '1px', height: '20px', bgcolor: 'divider', mx: 0.5 }} />
                )}
                {onShowLibrary && !isFullscreen && (
                  <Tooltip title="Query Library">
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        if (isFullscreen) {
                          setShowSidePanelLibrary(!showSidePanelLibrary);
                        } else {
                          onShowLibrary();
                        }
                      }}
                    >
                      <LibraryBooks fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {onSaveQuery && (
                  <Tooltip title="Save Query">
                    <IconButton size="small" onClick={onSaveQuery} disabled={!canSaveQuery}>
                      <Save fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {onDuplicateQuery && (
                  <Tooltip title="Duplicate Query">
                    <IconButton size="small" onClick={onDuplicateQuery} disabled={!canSaveQuery}>
                      <FileCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            )}
            
            {/* Editor Actions */}
            {((onGenerateRandomQuery || onShowLibrary || onSaveQuery || onDuplicateQuery) && !readOnly) && (
              <Box sx={{ width: '1px', height: '20px', bgcolor: 'divider', mx: 0.5 }} />
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
            <Tooltip title="Keyboard shortcuts">
              <IconButton size="small" onClick={() => setShowKeyboardShortcuts(true)}>
                <Help fontSize="small" />
              </IconButton>
            </Tooltip>
            <Box sx={{ width: '1px', height: '20px', bgcolor: 'divider', mx: 0.5 }} />
            <Tooltip title={isFullscreen ? "Exit fullscreen (ESC)" : "Enter fullscreen"}>
              <IconButton 
                size="small" 
                onClick={handleFullscreenToggle}
                sx={{
                  backgroundColor: isFullscreen ? 'primary.main' : 'transparent',
                  color: isFullscreen ? 'primary.contrastText' : 'inherit',
                  '&:hover': {
                    backgroundColor: isFullscreen ? 'primary.dark' : 'action.hover'
                  }
                }}
              >
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
          display: 'flex',
          flexDirection: 'column',
          '& .cm-editor': {
            height: isFullscreen ? '100%' : height,
            flex: isFullscreen ? 1 : 'none',
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
          </Box>
          
          {/* Side Panel Library (Disabled in fullscreen mode for true fullscreen experience) */}
          {false && isFullscreen && (
            <Box sx={{
              position: 'fixed',
              top: 0,
              right: showSidePanelLibrary ? 0 : '-400px',
              bottom: 0,
              width: '400px',
              bgcolor: 'background.paper',
              borderLeft: 1,
              borderColor: 'divider',
              zIndex: 10000,
              transition: 'right 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: showSidePanelLibrary ? '0 0 20px rgba(0,0,0,0.1)' : 'none'
            }}>
              {/* Side Panel Header */}
              <Box sx={{
                p: 2,
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: 'grey.50'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                  Query Library
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => setShowSidePanelLibrary(false)}
                  sx={{ ml: 1 }}
                >
                  <span style={{ fontSize: '18px' }}>×</span>
                </IconButton>
              </Box>
              
              {/* Side Panel Content */}
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <SidePanelLibrary 
                  onSelectQuery={(query) => {
                    if (onChange) {
                      onChange(query.query);
                    }
                    setShowSidePanelLibrary(false);
                  }}
                  onRunQuery={(query) => {
                    if (onChange) {
                      onChange(query.query);
                    }
                    setShowSidePanelLibrary(false);
                    // TODO: Trigger query execution
                  }}
                />
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Keyboard Shortcuts Dialog */}
      <Dialog 
        open={showKeyboardShortcuts} 
        onClose={() => setShowKeyboardShortcuts(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Keyboard Shortcuts</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="h6" gutterBottom>Search & Replace</Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Find" 
                  secondary={<><kbd>Cmd+F</kbd> (Mac) / <kbd>Ctrl+F</kbd> (Windows/Linux)</>}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Find and Replace" 
                  secondary={<><kbd>Cmd+Option+F</kbd> (Mac) / <kbd>Ctrl+H</kbd> (Windows/Linux)</>}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Find Next" 
                  secondary={<><kbd>Cmd+G</kbd> (Mac) / <kbd>F3</kbd> (Windows/Linux)</>}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Find Previous" 
                  secondary={<><kbd>Cmd+Shift+G</kbd> (Mac) / <kbd>Shift+F3</kbd> (Windows/Linux)</>}
                />
              </ListItem>
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>Editing</Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Select All" 
                  secondary={<><kbd>Cmd+A</kbd> (Mac) / <kbd>Ctrl+A</kbd> (Windows/Linux)</>}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Undo" 
                  secondary={<><kbd>Cmd+Z</kbd> (Mac) / <kbd>Ctrl+Z</kbd> (Windows/Linux)</>}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Redo" 
                  secondary={<><kbd>Cmd+Shift+Z</kbd> (Mac) / <kbd>Ctrl+Y</kbd> (Windows/Linux)</>}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Comment/Uncomment Line" 
                  secondary={<><kbd>Cmd+/</kbd> (Mac) / <kbd>Ctrl+/</kbd> (Windows/Linux)</>}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Indent Line" 
                  secondary={<kbd>Tab</kbd>}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Unindent Line" 
                  secondary={<kbd>Shift+Tab</kbd>}
                />
              </ListItem>
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>Navigation</Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Go to Line" 
                  secondary={<><kbd>Cmd+G</kbd> (Mac) / <kbd>Ctrl+G</kbd> (Windows/Linux)</>}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Jump to Matching Bracket" 
                  secondary={<><kbd>Cmd+]</kbd> (Mac) / <kbd>Ctrl+]</kbd> (Windows/Linux)</>}
                />
              </ListItem>
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>Editor Actions</Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Format GraphQL" 
                  secondary="Click the format icon in the toolbar"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Toggle Fullscreen" 
                  secondary={<><kbd>ESC</kbd> to exit</>}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="AutoComplete" 
                  secondary={<><kbd>Ctrl+Space</kbd> to trigger (when schema is loaded)</>}
                />
              </ListItem>
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowKeyboardShortcuts(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
