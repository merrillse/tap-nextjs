/**
 * Enhanced GraphQL Editor with Schema-Aware Autocomplete
 * Uses cm6-graphql with introspected schema for intelligent completions
 */

'use client';

import { useState, useMemo, useRef, useEffect, forwardRef } from 'react';
import { Box, Paper, Typography, IconButton, Tooltip, useTheme, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider } from '@mui/material';
import { ContentCopy, Fullscreen, FullscreenExit, AutoFixHigh, Casino, Save, LibraryBooks, FileCopy, Help, NoteAdd, Schema } from '@mui/icons-material';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import { StateField, StateEffect, Range, Prec } from '@codemirror/state';
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

// Helper function to find all matches in the entire document (for search logic, not decorations)
function findMatches(text: string, query: string): Range<Decoration>[] {
  if (!query) return [];
  const matches: Range<Decoration>[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let index = 0;
  while ((index = lowerText.indexOf(lowerQuery, index)) !== -1) {
    matches.push(Decoration.mark({ class: 'cm-search-match' }).range(index, index + query.length));
    index += 1;
  }
  return matches;
}

// Helper function to find all matches (optimized: only scan visible ranges)
function findMatchesInRanges(view: EditorView, query: string): Range<Decoration>[] {
  if (!query) return [];
  const matches: Range<Decoration>[] = [];
  const lowerQuery = query.toLowerCase();
  // Only scan visible ranges
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to).toLowerCase();
    let index = 0;
    while ((index = text.indexOf(lowerQuery, index)) !== -1) {
      matches.push(Decoration.mark({ class: 'cm-search-match' }).range(from + index, from + index + query.length));
      index += 1;
    }
  }
  return matches;
}

// View plugin for search decorations (no widget, just highlights)
const createSearchPlugin = (updateSearchState: (state: unknown) => void) => ViewPlugin.fromClass(class {
  decorations: DecorationSet;
  lastState: any;
  debouncedUpdateReactStateTimeout: NodeJS.Timeout | null = null; // For debouncing React state updates

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view);
    this.lastState = null;
  }

  update(update: ViewUpdate) {
    // Only update if search state or visible ranges changed
    const search = update.view.state.field(searchState);
    const visibleRangesString = update.view.visibleRanges.map(r => `${r.from}-${r.to}`).join(','); // Create a string representation for easy comparison
    const stateKey = `${search.query}|${search.currentMatch}|${visibleRangesString}`;

    if (this.lastState !== stateKey) {
      this.decorations = this.buildDecorations(update.view);
      this.lastState = stateKey;

      // Debounce the React state update for the search UI
      if (this.debouncedUpdateReactStateTimeout) {
        clearTimeout(this.debouncedUpdateReactStateTimeout);
      }
      this.debouncedUpdateReactStateTimeout = setTimeout(() => {
        updateSearchState({
          active: search.active,
          query: search.query,
          currentMatch: search.currentMatch,
          totalMatches: search.matches.length
        });
      }, 150); // Debounce delay of 150ms
    }
  }

  buildDecorations(view: EditorView): DecorationSet {
    const search = view.state.field(searchState);
    const decorations: Range<Decoration>[] = [];
    // Only decorate visible matches
    const visibleMatches = findMatchesInRanges(view, search.query);
    visibleMatches.forEach((match, index) => {
      if (index === search.currentMatch) {
        decorations.push(Decoration.mark({ class: 'cm-search-current-match' }).range(match.from, match.to));
      } else {
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
    key: 'Ctrl-j',
    run(view) {
      // Start Ace Jump mode
      view.dispatch({ effects: startAceJump.of(true) });
      return true;
    }
  },
  {
    key: 'Escape',
    run(view) {
      const search = view.state.field(searchState);
      const aceJump = view.state.field(aceJumpState);
      
      if (aceJump.active) {
        view.dispatch({ effects: exitAceJump.of(true) });
        return true;
      }
      
      if (search.active) {
        view.dispatch({ effects: exitSearch.of(true) });
        return true;
      }
      return false;
    }
  },
  {
    key: 'Ctrl-k',
    run(view) {
      // Kill to end of line (traditional Emacs/Unix behavior)
      const selection = view.state.selection.main;
      const line = view.state.doc.lineAt(selection.head);
      const from = selection.head;
      const to = line.to;
      
      if (from < to) {
        // Delete from cursor to end of line
        view.dispatch({
          changes: { from, to },
          selection: { anchor: from, head: from }
        });
      } else if (from === to && from < view.state.doc.length) {
        // If at end of line, delete the line break
        view.dispatch({
          changes: { from, to: from + 1 },
          selection: { anchor: from, head: from }
        });
      }
      return true;
    }
  },
  {
    key: 'Ctrl-n',
    run(view) {
      const search = view.state.field(searchState);
      if (search.active) {
        // Exit search mode
        view.dispatch({ effects: exitSearch.of(true) });
        return true;
      }
      
      const completions = currentCompletions(view.state);
      if (completions.length > 0) {
        return moveCompletionSelection(true)(view);
      }
      
      // Move cursor to next line (traditional behavior)
      const { state } = view;
      const selection = state.selection.main;
      const line = state.doc.lineAt(selection.head);
      
      if (line.number < state.doc.lines) {
        const nextLine = state.doc.line(line.number + 1);
        const col = selection.head - line.from;
        const newPos = Math.min(nextLine.from + col, nextLine.to);
        
        view.dispatch({
          selection: { anchor: newPos, head: newPos },
          scrollIntoView: true
        });
        return true;
      }
      
      return false;
    }
  },
  {
    key: 'Ctrl-p',
    run(view) {
      const search = view.state.field(searchState);
      if (search.active) {
        // Exit search mode
        view.dispatch({ effects: exitSearch.of(true) });
        return true;
      }
      
      const completions = currentCompletions(view.state);
      if (completions.length > 0) {
        return moveCompletionSelection(false)(view);
      }
      
      // Move cursor to previous line (traditional behavior)  
      const { state } = view;
      const selection = state.selection.main;
      const line = state.doc.lineAt(selection.head);
      
      if (line.number > 1) {
        const prevLine = state.doc.line(line.number - 1);
        const col = selection.head - line.from;
        const newPos = Math.min(prevLine.from + col, prevLine.to);
        
        view.dispatch({
          selection: { anchor: newPos, head: newPos },
          scrollIntoView: true
        });
        return true;
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
        
        // Build the transaction spec properly
        const transactionSpec: any = { effects: setSearchQuery.of(newQuery) };

        // If we have matches, move cursor to the first one
        if (newMatches.length > 0) {
          transactionSpec.selection = { anchor: newMatches[0].from, head: newMatches[0].from };
          transactionSpec.scrollIntoView = true;
        }
        
        view.dispatch(transactionSpec);
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
  }
]);

// Custom input handler for incremental search, autocomplete navigation, and Ace Jump
const searchInputHandler = EditorView.domEventHandlers({
  keydown(event, view) {
    // Handle navigation key combinations for autocomplete
    const isAltN = event.altKey && (event.key === 'n' || event.code === 'KeyN');
    const isAltP = event.altKey && (event.key === 'p' || event.code === 'KeyP');
    const isCtrlN = event.ctrlKey && (event.key === 'n' || event.code === 'KeyN');
    const isCtrlP = event.ctrlKey && (event.key === 'p' || event.code === 'KeyP');
    const isCtrlDown = event.ctrlKey && event.key === 'ArrowDown';
    const isCtrlUp = event.ctrlKey && event.key === 'ArrowUp';
    
    // Check Ace Jump state first
    const aceJump = view.state.field(aceJumpState);
    
    if (aceJump.active) {
      if (aceJump.waitingForTarget) {
        // Waiting for target character
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          event.stopPropagation();
          
          view.dispatch({ effects: setAceJumpTarget.of(event.key) });
          return true;
        }
      } else if (aceJump.waitingForJump) {
        // Waiting for jump label
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          event.stopPropagation();
          
          // Find matching jump label
          const targetLabel = aceJump.jumpLabels.find(label => 
            label.label.toLowerCase().startsWith(event.key.toLowerCase())
          );
          
          if (targetLabel) {
            // Jump to the position
            view.dispatch({
              effects: jumpToPosition.of(targetLabel.from),
              selection: { anchor: targetLabel.from, head: targetLabel.from },
              scrollIntoView: true
            });
            return true;
          }
        }
      }
      
      return false; // Let escape key be handled by keymap
    }
    
    if (isAltN || isAltP || isCtrlN || isCtrlP || isCtrlDown || isCtrlUp) {
      const completions = currentCompletions(view.state);
      
      if (completions.length > 0) {
        event.preventDefault();
        event.stopPropagation();
        
        const isNext = isAltN || isCtrlN || isCtrlDown;
        moveCompletionSelection(isNext)(view);
        return true;
      }
      
      // For Ctrl+Arrow keys, only handle when completions are active
      if ((isCtrlDown || isCtrlUp) && completions.length === 0) {
        return false;
      }
      
      // For Ctrl+N and Ctrl+P, let the keymap handle them when no completions
      if ((isCtrlN || isCtrlP) && completions.length === 0) {
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
        const exitKeys = ['f', 'b', 'a', 'e', 'n', 'p', 'v', 'l', 'd', 'h', 'w', 'u', 'i', 'o', 't', 'y', 'x', 'c', 'z'];
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
        
        // Build the transaction spec properly
        const transactionSpec: any = { effects: setSearchQuery.of(newQuery) };

        // If we have matches, move cursor to the first one
        if (newMatches.length > 0) {
          transactionSpec.selection = { anchor: newMatches[0].from, head: newMatches[0].from };
          transactionSpec.scrollIntoView = true;
        }
        
        view.dispatch(transactionSpec);
        return true;
      }
      
      // Handle regular character input in search mode
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        event.stopPropagation();
        
        // Add character to search and move cursor to first match
        const newQuery = search.query + event.key;
        const newMatches = findMatches(view.state.doc.toString(), newQuery);
        
        if (newMatches.length > 0) {
          // If we have matches, move cursor to the first one
          view.dispatch({
            effects: setSearchQuery.of(newQuery),
            selection: { anchor: newMatches[0].from, head: newMatches[0].from },
            scrollIntoView: true
          });
        } else {
          // No matches, just update the search query
          view.dispatch({
            effects: setSearchQuery.of(newQuery)
          });
        }
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
  schema?: Record<string, unknown>; // GraphQL schema from introspection
  readOnly?: boolean;
  onExecute?: () => void; // Added for Ctrl+Enter functionality
  onSwitchFocus?: () => void; // Added for Ctrl+X O functionality
  hasFocus?: boolean; // Added to track focus state for visual feedback
}

export const EnhancedGraphQLEditor = forwardRef<HTMLDivElement, EnhancedGraphQLEditorProps>(function EnhancedGraphQLEditor({
  value,
  onChange,
  placeholder,
  height = '300px',
  label = 'GraphQL Query',
  schema,
  readOnly = false,
  onExecute,
  onSwitchFocus,
  hasFocus = false
}, ref) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [reactSearchState, setReactSearchState] = useState({
    active: false,
    query: '',
    currentMatch: -1,
    totalMatches: 0
  });
  const editorRef = useRef<ReactCodeMirrorRef | null>(null);
  const codeMirrorRef = useRef<any>(null); // Add separate ref for CodeMirror
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

  // Handle Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        console.log('🔍 DEBUG: Escape key pressed, fullscreen:', isFullscreen);
        if (isFullscreen) {
          // Exit fullscreen
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
  }, [isFullscreen]);

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
    if (!schema || !('data' in schema) || !(schema as any).data?.__schema) {
      return null;
    }

    try {
      // Convert introspection result to executable schema
      return buildClientSchema((schema as any).data);
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
        // Ace Jump styling
        ".ace-jump-highlight": { 
          backgroundColor: isDark ? "#4a90e2" : "#87ceeb", 
          color: isDark ? "#fff" : "#000"
        },
        ".ace-jump-label-widget": {
          backgroundColor: isDark ? "#ff6b6b" : "#ff4444",
          color: "#fff",
          padding: "1px 4px",
          borderRadius: "2px",
          fontSize: "10px",
          fontWeight: "bold",
          marginLeft: "2px",
          display: "inline-block",
          minWidth: "14px",
          textAlign: "center"
        },
      }),
      syntaxHighlighting(graphQLHighlight), // Use the defined graphQLHighlight
      Prec.high(keymap.of(completionKeymap)), // Ensure completion keymap has high precedence
      Prec.high(searchInputHandler), // Add the searchInputHandler with high precedence
      Prec.high(emacsSearchKeymap), // High precedence for Emacs-style search and completion navigation
      // Custom keymap for Ctrl+Enter execute and Ctrl+X O focus switching
      keymap.of([
        {
          key: 'Ctrl-Enter',
          run() {
            if (onExecute) {
              onExecute();
              return true;
            }
            return false;
          }
        },
        {
          key: 'Ctrl-x o',
          run() {
            if (onSwitchFocus) {
              onSwitchFocus();
              return true;
            }
            return false;
          }
        },

      ]),
      searchState, // State for Emacs-style search
      aceJumpState, // State for Ace Jump
      aceJumpPlugin, // Plugin for Ace Jump decorations
      createSearchPlugin((state: any) => setReactSearchState(state)), // Instantiate the search plugin
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
  }, [isDark, builtSchema, graphQLHighlight, setReactSearchState, onExecute, onSwitchFocus]); // Add dependencies

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

  // Refactor nested ternary for outline
  let outlineStyle = 'none';
  if (hasFocus) {
    outlineStyle = '2px solid #1976d2';
  } else if (isFullscreen) {
    outlineStyle = '5px solid red';
  }
  // Refactor nested ternary for outlineOffset
  let outlineOffsetStyle = '0';
  if (hasFocus) {
    outlineOffsetStyle = '-2px';
  } else if (isFullscreen) {
    outlineOffsetStyle = '-5px';
  }

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
        ref={ref}
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
          overflow: isFullscreen ? 'hidden' : 'visible', // Allow overflow for sticky to work in non-fullscreen
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
          }),
          // Focus indication
          outline: outlineStyle,
          outlineOffset: outlineOffsetStyle,
          transition: 'outline 0.2s ease-in-out'
        }}
      >
        {/* Main Content Area */}
        <Box 
          data-testid="main-content"
          sx={{ 
            display: 'flex', 
            flex: 1, 
            overflow: isFullscreen ? 'hidden' : 'visible', // Allow overflow for sticky positioning
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
            minHeight: 0, // Allow shrinking
            position: 'relative',
            ...(isFullscreen && {
              padding: 0,
              margin: 0
            })
          }}>


        {/* Editor - Full height content */}
        <Box sx={{ 
          position: 'relative',
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          '& .cm-editor': {
            height: '100%',
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
          </Box>
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
              <ListItem>
                <ListItemText 
                  primary="Kill to End of Line" 
                  secondary={<><kbd>Ctrl+K</kbd> - Delete from cursor to end of line</>}
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
              <ListItem>
                <ListItemText 
                  primary="Ace Jump" 
                  secondary={<><kbd>Ctrl+J</kbd> - Jump to any character on screen</>}
                />
              </ListItem>
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>Editor Actions</Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Execute Query" 
                  secondary={<><kbd>Ctrl+Enter</kbd> - Run the current GraphQL query</>}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Switch Focus" 
                  secondary={<><kbd>Ctrl+X O</kbd> - Switch between editor and response panel</>}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Schema Browser" 
                  secondary={<><kbd>Ctrl+Shift+S</kbd> - Open the GraphQL schema browser</>}
                />
              </ListItem>
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
              <ListItem>
                <ListItemText 
                  primary="Next Line / AutoComplete Down" 
                  secondary={<><kbd>Ctrl+N</kbd> - Move to next line, or navigate autocomplete down</>}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Previous Line / AutoComplete Up" 
                  secondary={<><kbd>Ctrl+P</kbd> - Move to previous line, or navigate autocomplete up</>}
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
});

// Ace Jump functionality
interface AceJumpState {
  active: boolean;
  targetChar: string;
  jumpLabels: { from: number; to: number; label: string }[];
  waitingForTarget: boolean;
  waitingForJump: boolean;
}

// Effects for managing Ace Jump state
const setAceJumpTarget = StateEffect.define<string>();
const startAceJump = StateEffect.define<boolean>();
const exitAceJump = StateEffect.define<boolean>();
const jumpToPosition = StateEffect.define<number>();

// Generate jump labels (a-z, aa-zz, etc.)
function generateJumpLabels(count: number): string[] {
  const labels: string[] = [];
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  
  // Single character labels (a-z)
  for (let i = 0; i < Math.min(count, 26); i++) {
    labels.push(chars[i]);
  }
  
  // Double character labels (aa-zz)
  if (count > 26) {
    for (let i = 0; i < 26 && labels.length < count; i++) {
      for (let j = 0; j < 26 && labels.length < count; j++) {
        labels.push(chars[i] + chars[j]);
      }
    }
  }
  
  return labels;
}

// Ace Jump decoration
const aceJumpHighlightDecoration = Decoration.mark({
  class: 'ace-jump-highlight'
});

// State field for Ace Jump
const aceJumpState = StateField.define<AceJumpState>({
  create() {
    return {
      active: false,
      targetChar: '',
      jumpLabels: [],
      waitingForTarget: false,
      waitingForJump: false
    };
  },
  update(state, tr) {
    const newState = { ...state };
    
    for (const effect of tr.effects) {
      if (effect.is(startAceJump)) {
        newState.active = true;
        newState.waitingForTarget = true;
        newState.waitingForJump = false;
        newState.targetChar = '';
        newState.jumpLabels = [];
      } else if (effect.is(setAceJumpTarget)) {
        newState.targetChar = effect.value;
        newState.waitingForTarget = false;
        newState.waitingForJump = true;
        
        // Find all occurrences of the target character in the document
        // For better performance, we could limit this to visible range in the future
        const doc = tr.state.doc;
        const from = 0;
        const to = doc.length;
        const text = doc.sliceString(from, to);
        const matches: { from: number; to: number; label: string }[] = [];
        
        // Limit the number of matches to prevent too many labels
        const maxMatches = 52; // a-z + aa-zz
        let matchCount = 0;
        
        for (let i = 0; i < text.length && matchCount < maxMatches; i++) {
          if (text[i].toLowerCase() === effect.value.toLowerCase()) {
            matches.push({
              from: from + i,
              to: from + i + 1,
              label: ''
            });
            matchCount++;
          }
        }
        
        // Sort matches by position (should already be sorted, but ensure it)
        matches.sort((a, b) => a.from - b.from);
        
        // Assign jump labels
        const labels = generateJumpLabels(matches.length);
        newState.jumpLabels = matches.map((match, index) => ({
          ...match,
          label: labels[index] || 'z'
        }));
        
      } else if (effect.is(jumpToPosition)) {
        newState.active = false;
        newState.waitingForTarget = false;
        newState.waitingForJump = false;
        newState.targetChar = '';
        newState.jumpLabels = [];
      } else if (effect.is(exitAceJump)) {
        newState.active = false;
        newState.waitingForTarget = false;
        newState.waitingForJump = false;
        newState.targetChar = '';
        newState.jumpLabels = [];
      }
    }
    
    return newState;
  }
});

// View plugin for Ace Jump decorations
const aceJumpPlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet;
  
  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view);
  }
  
  update(update: ViewUpdate) {
    if (update.docChanged || update.state.field(aceJumpState) !== update.startState.field(aceJumpState)) {
      this.decorations = this.buildDecorations(update.view);
    }
  }
  
  buildDecorations(view: EditorView): DecorationSet {
    const state = view.state.field(aceJumpState);
    if (!state.active || !state.waitingForJump) {
      return Decoration.none;
    }
    
    // Sort jump labels by position
    const sortedJumpLabels = [...state.jumpLabels].sort((a, b) => a.from - b.from);
    
    if (sortedJumpLabels.length === 0) {
      return Decoration.none;
    }
    
    const decorations: Range<Decoration>[] = [];
    
    // Process each jump label
    for (const jumpLabel of sortedJumpLabels) {
      // Add highlight decoration
      decorations.push(aceJumpHighlightDecoration.range(jumpLabel.from, jumpLabel.to));
      
      // Add widget decoration with side: 1 to ensure it comes after the highlight
      const labelWidget = Decoration.widget({
        widget: new class extends WidgetType {
          toDOM() {
            const span = document.createElement('span');
            span.className = 'ace-jump-label-widget';
            span.textContent = jumpLabel.label;
            return span;
          }
        }(),
        side: 1  // Place widget after the character
      });
      
      decorations.push(labelWidget.range(jumpLabel.to)); // Place widget at the end of the character
    }
    
    // Decorations should already be sorted by position since we process sorted labels
    // But let's ensure they are properly sorted
    decorations.sort((a, b) => {
      if (a.from !== b.from) return a.from - b.from;
      if (a.to !== b.to) return a.to - b.to;
      
      // Ensure marks come before widgets when at same position
      const aIsWidget = a.value.spec && 'widget' in a.value.spec;
      const bIsWidget = b.value.spec && 'widget' in b.value.spec;
      
      if (!aIsWidget && bIsWidget) return -1;
      if (aIsWidget && !bIsWidget) return 1;
      
      return 0;
    });
    
    return Decoration.set(decorations);
  }
}, {
  decorations: v => v.decorations
});
