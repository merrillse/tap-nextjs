'use client';

import { useState } from 'react';
import { Box, Paper, Typography, IconButton, Tooltip, useTheme } from '@mui/material';
import { ContentCopy, Fullscreen, FullscreenExit, AutoFixHigh } from '@mui/icons-material';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { graphql } from 'cm6-graphql';
import { formatGraphQLQuery } from '@/lib/graphql-formatter';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: 'graphql' | 'json';
  readOnly?: boolean;
  height?: string;
  label?: string;
  placeholder?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = 'graphql',
  readOnly = false,
  height = '300px',
  label,
  placeholder
}: CodeEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleFormat = async () => {
    if (language !== 'graphql' || !onChange) return;
    
    try {
      const formatted = formatGraphQLQuery(value);
      onChange(formatted);
    } catch (err) {
      console.error('Failed to format GraphQL:', err);
      // Could show a toast notification here
    }
  };

  // Custom syntax highlighting themes
  const lightGraphQLHighlight = HighlightStyle.define([
    { tag: t.keyword, color: '#d73a49' }, // GraphQL keywords (query, mutation, subscription)
    { tag: t.typeName, color: '#6f42c1' }, // Type names
    { tag: t.propertyName, color: '#005cc5' }, // Field names
    { tag: t.string, color: '#032f62' }, // String values
    { tag: t.number, color: '#005cc5' }, // Numbers
    { tag: t.bool, color: '#005cc5' }, // Booleans
    { tag: t.null, color: '#6a737d' }, // null values
    { tag: t.comment, color: '#6a737d', fontStyle: 'italic' }, // Comments
    { tag: t.punctuation, color: '#24292e' }, // Punctuation
    { tag: t.bracket, color: '#24292e' }, // Brackets
    { tag: t.variableName, color: '#e36209' }, // Variables
  ]);

  const darkGraphQLHighlight = HighlightStyle.define([
    { tag: t.keyword, color: '#f97583' }, // GraphQL keywords
    { tag: t.typeName, color: '#b392f0' }, // Type names
    { tag: t.propertyName, color: '#79b8ff' }, // Field names
    { tag: t.string, color: '#9ecbff' }, // String values
    { tag: t.number, color: '#79b8ff' }, // Numbers
    { tag: t.bool, color: '#79b8ff' }, // Booleans
    { tag: t.null, color: '#959da5' }, // null values
    { tag: t.comment, color: '#959da5', fontStyle: 'italic' }, // Comments
    { tag: t.punctuation, color: '#e1e4e8' }, // Punctuation
    { tag: t.bracket, color: '#e1e4e8' }, // Brackets
    { tag: t.variableName, color: '#ffab70' }, // Variables
  ]);

  const lightJSONHighlight = HighlightStyle.define([
    { tag: t.propertyName, color: '#005cc5' }, // JSON keys
    { tag: t.string, color: '#032f62' }, // String values
    { tag: t.number, color: '#005cc5' }, // Numbers
    { tag: t.bool, color: '#005cc5' }, // Booleans
    { tag: t.null, color: '#6a737d' }, // null values
    { tag: t.punctuation, color: '#24292e' }, // Punctuation
    { tag: t.bracket, color: '#24292e' }, // Brackets
  ]);

  const darkJSONHighlight = HighlightStyle.define([
    { tag: t.propertyName, color: '#79b8ff' }, // JSON keys
    { tag: t.string, color: '#9ecbff' }, // String values
    { tag: t.number, color: '#79b8ff' }, // Numbers
    { tag: t.bool, color: '#79b8ff' }, // Booleans
    { tag: t.null, color: '#959da5' }, // null values
    { tag: t.punctuation, color: '#e1e4e8' }, // Punctuation
    { tag: t.bracket, color: '#e1e4e8' }, // Brackets
  ]);

  const extensions = [
    language === 'json' ? json() : graphql(),
    syntaxHighlighting(
      language === 'json' 
        ? (isDark ? darkJSONHighlight : lightJSONHighlight)
        : (isDark ? darkGraphQLHighlight : lightGraphQLHighlight)
    ),
    EditorView.theme({
      '&': {
        fontSize: '14px',
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
      }
    })
  ].filter(Boolean);

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
      autocompletion: language === 'graphql',
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
        <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
          {label || `${language.toUpperCase()} ${readOnly ? 'Response' : 'Editor'}`}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {language === 'graphql' && !readOnly && onChange && (
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
    </Paper>
  );
}

// Specialized components for different use cases
export function GraphQLEditor({ value, onChange, placeholder }: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <CodeEditor
      value={value}
      onChange={onChange}
      language="graphql"
      height="300px"
      label="GraphQL Query"
      placeholder={placeholder || "Enter your GraphQL query here..."}
    />
  );
}

export interface JSONViewerProps {
  value: string;
  readOnly?: boolean;
  height?: string;
  label?: string; // Added label to match usage
}

export function JSONViewer({ 
  value, 
  readOnly = true, // Default to true for a viewer
  height = '100%', 
  label // Added label
}: JSONViewerProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Custom syntax highlighting themes
  const lightJSONHighlight = HighlightStyle.define([
    { tag: t.propertyName, color: '#005cc5' }, // JSON keys
    { tag: t.string, color: '#032f62' }, // String values
    { tag: t.number, color: '#005cc5' }, // Numbers
    { tag: t.bool, color: '#005cc5' }, // Booleans
    { tag: t.null, color: '#6a737d' }, // null values
    { tag: t.punctuation, color: '#24292e' }, // Punctuation
    { tag: t.bracket, color: '#24292e' }, // Brackets
  ]);

  const darkJSONHighlight = HighlightStyle.define([
    { tag: t.propertyName, color: '#79b8ff' }, // JSON keys
    { tag: t.string, color: '#9ecbff' }, // String values
    { tag: t.number, color: '#79b8ff' }, // Numbers
    { tag: t.bool, color: '#79b8ff' }, // Booleans
    { tag: t.null, color: '#959da5' }, // null values
    { tag: t.punctuation, color: '#e1e4e8' }, // Punctuation
    { tag: t.bracket, color: '#e1e4e8' }, // Brackets
  ]);

  return (
    <Box sx={{ height, position: 'relative', border: `1px solid ${theme.palette.divider}`, borderRadius: '4px', overflow: 'hidden' }}>
      {label && (
        <Typography 
          variant="caption" 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            p: '2px 8px', 
            backgroundColor: theme.palette.background.paper, 
            borderBottomRightRadius: '4px', 
            borderBottom: `1px solid ${theme.palette.divider}`,
            borderRight: `1px solid ${theme.palette.divider}`,
            zIndex: 1 
          }}
        >
          {label}
        </Typography>
      )}
      <CodeMirror
        value={value}
        height={height}
        extensions={[
          json(),
          EditorView.lineWrapping,
          isDark ? syntaxHighlighting(darkJSONHighlight) : syntaxHighlighting(lightJSONHighlight),
          EditorView.theme({
            "&": {
              fontSize: "0.875rem",
              backgroundColor: isDark ? theme.palette.grey[900] : theme.palette.background.default,
              color: isDark ? theme.palette.common.white : theme.palette.common.black,
            },
            ".cm-gutters": {
              backgroundColor: isDark ? theme.palette.grey[800] : theme.palette.grey[100],
              color: theme.palette.text.secondary,
              borderRight: `1px solid ${theme.palette.divider}`,
            },
            ".cm-content": {
              caretColor: theme.palette.primary.main,
            },
            "&.cm-focused .cm-cursor": {
              borderLeftColor: theme.palette.primary.main,
            },
            "&.cm-focused .cm-selectionBackground, ::selection": {
              backgroundColor: theme.palette.action.selected,
            },
            ".cm-activeLine": {
              backgroundColor: theme.palette.action.hover,
            },
            ".cm-activeLineGutter": {
              backgroundColor: theme.palette.action.hover,
            }
          })
        ]}
        readOnly={readOnly}
      />
    </Box>
  );
}
