/**
 * Enhanced GraphQL Editor with Schema-Aware Autocomplete
 * Uses cm6-graphql with introspected schema for intelligent completions
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Box, Paper, Typography, IconButton, Tooltip, useTheme } from '@mui/material';
import { ContentCopy, Fullscreen, FullscreenExit, AutoFixHigh } from '@mui/icons-material';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { oneDark } from '@codemirror/theme-one-dark';
import { graphql } from 'cm6-graphql';
import { buildSchema, buildClientSchema, getIntrospectionQuery, IntrospectionQuery } from 'graphql';
import { formatGraphQLQuery } from '@/lib/graphql-formatter';

interface EnhancedGraphQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  label?: string;
  schema?: any; // GraphQL schema from introspection
  readOnly?: boolean;
}

export function EnhancedGraphQLEditor({
  value,
  onChange,
  placeholder,
  height = '300px',
  label = 'GraphQL Query',
  schema,
  readOnly = false
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
    // GraphQL language support with optional schema
    graphql(builtSchema || undefined),
    syntaxHighlighting(graphQLHighlight),
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
