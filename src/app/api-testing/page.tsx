'use client';

import { useState, useEffect, useMemo, type JSX, useRef } from 'react';
import { getEnvironmentConfig, getEnvironmentNames } from '@/lib/environments';
import { ApiClient } from '@/lib/api-client';
import { cleanupExpiredTokens } from '@/lib/token-cache';
import { safeStringify } from '@/lib/utils';
import { RandomQueryGenerator, INTROSPECTION_QUERY, type IntrospectionResult } from '@/lib/random-query-generator';
import { type SavedQuery } from '@/lib/query-library';
import { SaveQueryDialog, QueryLibraryDrawer } from '@/components/QueryLibraryDrawer';
import { SchemaBrowserDrawer } from '@/components/SchemaBrowserDrawer';
import { useApiClient } from '@/hooks/useApiClient';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Box, 
  Typography, 
  Button, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  Tabs, 
  Tab, 
  Paper, 
  IconButton, 
  Snackbar, 
  Alert,
  Tooltip,
  CircularProgress, // Added CircularProgress
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ContentCopy as ContentCopyIcon, Fullscreen as FullscreenIcon, FullscreenExit as FullscreenExitIcon, Casino, LibraryBooks, Schema, NoteAdd, Save, FileCopy, AutoFixHigh, ContentCopy, Help, Fullscreen } from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material/Select';
import { CodeEditor, JSONViewer } from '@/components/CodeEditor'; // JSONViewer might be CodeEditor with readOnly
import { EnhancedGraphQLEditor } from '@/components/EnhancedGraphQLEditor';
import { formatGraphQLQuery } from '@/lib/graphql-formatter';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps): JSX.Element {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`response-tabpanel-${index}`}
      aria-labelledby={`response-tab-${index}`}
      {...other}
      style={{ height: '100%', overflow: 'auto' }}
    >
      {value === index && (
        <Box sx={{ p: 3, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `response-tab-${index}`,
    'aria-controls': `response-tabpanel-${index}`,
  };
}

export default function APITestingPage() {
  const selectedEndpoint = 'graphql'; // Fixed to GraphQL only
  const [selectedEnvironment, setSelectedEnvironment] = useState('mis-gql-dev');
  const [queryInput, setQueryInput] = useState('');
  const [graphqlVariables, setGraphqlVariables] = useState('{}'); // Default to empty JSON object
  const [httpHeaders, setHttpHeaders] = useState('{}'); // Default to empty JSON object
  const [response, setResponse] = useState<{
    status: number;
    data?: unknown;
    error?: string;
    executionTime: string;
    timestamp: string;
    headers?: Record<string, string>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Use hook to get API client with selected environment only
  const apiClient = useApiClient(selectedEnvironment);
  const [generatingQuery, setGeneratingQuery] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schema, setSchema] = useState<IntrospectionResult | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [showLibraryDialog, setShowLibraryDialog] = useState(false);
  const [showSchemaBrowserDrawer, setShowSchemaBrowserDrawer] = useState(false);
  const [editingQuery, setEditingQuery] = useState<SavedQuery | null>(null);
  const [responseTabValue, setResponseTabValue] = useState(0);
  const [isResponsePanelFullscreen, setIsResponsePanelFullscreen] = useState(false);
  const [copySnackbarOpen, setCopySnackbarOpen] = useState(false);
  const [copySnackbarMessage, setCopySnackbarMessage] = useState('');
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);

  // Multiple operations support
  const [operationName, setOperationName] = useState<string>('');
  const [availableOperations, setAvailableOperations] = useState<string[]>([]);

  // Function to parse operation names from GraphQL query
  const parseOperations = (query: string): string[] => {
    if (!query.trim()) return [];
    
    try {
      // Simple regex to find operation names
      // Matches: query OperationName, mutation OperationName, subscription OperationName
      const operationRegex = /(?:query|mutation|subscription)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
      const operations: string[] = [];
      let match;
      
      while ((match = operationRegex.exec(query)) !== null) {
        operations.push(match[1]);
      }
      
      return operations;
    } catch (error) {
      console.warn('Error parsing operations:', error);
      return [];
    }
  };

  // State for sent request details
  const [sentRequestBody, setSentRequestBody] = useState<string | null>(null);
  const [sentRequestHeaders, setSentRequestHeaders] = useState<Record<string, string> | null>(null);

  // State for focus management (Ctrl+X O functionality)
  const [currentFocus, setCurrentFocus] = useState<'editor' | 'response'>('editor');
  const editorRef = useRef<HTMLDivElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  const handleResponseTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setResponseTabValue(newValue);
  };

  const handleEnvironmentChange = (event: SelectChangeEvent) => {
    setSelectedEnvironment(event.target.value);
  };

  const environmentOptions = getEnvironmentNames();

  // Focus switching handler for Ctrl+X O
  const handleSwitchFocus = () => {
    if (currentFocus === 'editor') {
      // Switch to response panel
      setCurrentFocus('response');
      if (responseRef.current) {
        // Focus on the response panel - try to focus on the first focusable element
        const focusableElements = responseRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          (focusableElements[0] as HTMLElement).focus();
        } else {
          responseRef.current.focus();
        }
      }
    } else {
      // Switch back to editor
      setCurrentFocus('editor');
      if (editorRef.current) {
        // Try to focus on the CodeMirror editor
        const cmEditor = editorRef.current.querySelector('.cm-editor .cm-content');
        if (cmEditor) {
          (cmEditor as HTMLElement).focus();
        } else {
          editorRef.current.focus();
        }
      }
    }
  };

  // Sample queries definition - moved here to be available for initialization
  const sampleQueries = useMemo(() => ({
    graphql: `query Missionary($missionaryNumber: ID = "916793") {
  missionary(missionaryId: $missionaryNumber) {
    latinFirstName
    latinLastName
    missionaryNumber
    emailAddress
    mobilePhone
    birthDate
    missionaryStatus {
      value
      label
    }
    missionaryType {
      value
      label
    }
    assignments {
      assignmentId
      componentName
      assignmentStartDate
      assignmentEndDate
      mission {
        name
      }
      location {
        assignmentName
      }
    }
    languages {
      languageDetail {
        languageName
        languageAbbreviation
      }
      preferredLanguage
    }
  }
}

# This is a long comment to test sticky header behavior
# when scrolling through a GraphQL query with many lines
# The header should remain visible at all times
# Even when scrolling to the bottom of the editor
# Let's add more content to ensure we need to scroll

query AnotherQuery {
  missionary(missionaryId: "123456") {
    latinFirstName
    latinLastName
    missionaryNumber
    emailAddress
    mobilePhone
    birthDate
    assignments {
      assignmentId
      componentName
      assignmentStartDate
      assignmentEndDate
    }
  }
}

# More comments to increase the content height
# This will force the editor to be scrollable
# The sticky header should always remain visible
# at the top of the editor container
# regardless of scroll position

query ThirdQuery {
  missionary(missionaryId: "789012") {
    latinFirstName
    latinLastName
    assignments {
      assignmentId
      mission {
        name
      }
    }
  }
}`
  }), []);

  // Load saved environment on component mount
  useEffect(() => {
    const savedEnv = localStorage.getItem('selectedEnvironment') || 'mis-gql-dev';
    setSelectedEnvironment(savedEnv);

    // Clean up expired tokens on page load
    cleanupExpiredTokens();

    // Robust loading for graphqlVariables
    let savedVars = localStorage.getItem('graphqlVariables');
    try {
      if (savedVars) {
        JSON.parse(savedVars); // Validate if it's valid JSON
      } else {
        savedVars = '{}'; // Default if not found
      }
    } catch {
      savedVars = '{}'; // Default if invalid JSON
    }
    setGraphqlVariables(savedVars);

    // Robust loading for httpHeaders
    let savedHeaders = localStorage.getItem('httpHeaders');
    try {
      if (savedHeaders) {
        JSON.parse(savedHeaders); // Validate if it's valid JSON
      } else {
        savedHeaders = '{}'; // Default if not found
      }
    } catch {
      savedHeaders = '{}'; // Default if invalid JSON
    }
    setHttpHeaders(savedHeaders);

    // Focus the editor after a short delay to ensure it's fully rendered
    const focusTimer = setTimeout(() => {
      if (editorRef.current) {
        // Try to focus on the CodeMirror editor
        const cmEditor = editorRef.current.querySelector('.cm-editor .cm-content');
        if (cmEditor) {
          (cmEditor as HTMLElement).focus();
          // Also try to set cursor to the beginning
          const cmView = editorRef.current.querySelector('.cm-editor');
          if (cmView && (cmView as any).view) {
            const view = (cmView as any).view;
            view.dispatch({
              selection: { anchor: 0, head: 0 },
              scrollIntoView: true
            });
          }
        } else {
          editorRef.current.focus();
        }
      }
    }, 100); // Small delay to ensure the editor is fully mounted

    return () => clearTimeout(focusTimer);
  }, [selectedEndpoint]); // Add selectedEndpoint as dependency

  // Separate effect for initializing the default query - runs when sampleQueries is available
  useEffect(() => {
    console.log('[Query Init] Initializing default query, sampleQueries available:', !!sampleQueries.graphql);
    
    // Load saved query input
    const savedQuery = localStorage.getItem('queryInput');
    if (savedQuery) {
      console.log('[Query Init] Loading saved query from localStorage');
      setQueryInput(savedQuery);
    } else if (sampleQueries.graphql) {
      console.log('[Query Init] Setting default sample query');
      // Only set default query if no saved query exists and sampleQueries is available
      const defaultQuery = sampleQueries[selectedEndpoint as keyof typeof sampleQueries];
      setQueryInput(defaultQuery);
      
      // Set up editingQuery with proper name for the default query
      if (selectedEndpoint === 'graphql') {
        const savedEnv = localStorage.getItem('selectedEnvironment') || 'mis-gql-dev';
        
        console.log('[Query Init] Setting editingQuery with name "Sample Missionary Query"');
        setEditingQuery({
          id: 'default-missionary-query',
          name: 'Sample Missionary Query',
          query: defaultQuery,
          variables: { missionaryNumber: "916793" },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        // Also set the default variables for the editor if not already set
        const currentVars = localStorage.getItem('graphqlVariables');
        if (!currentVars || currentVars === '{}' || currentVars.trim() === '') {
          console.log('[Query Init] Setting default variables');
          setGraphqlVariables('{"missionaryNumber": "916793"}');
          localStorage.setItem('graphqlVariables', '{"missionaryNumber": "916793"}');
        }
      }
    } else {
      console.log('[Query Init] sampleQueries.graphql not available yet');
    }
  }, [sampleQueries, selectedEndpoint]); // Depend on sampleQueries and selectedEndpoint

  // Save query input to local storage whenever it changes
  useEffect(() => {
    if (queryInput) {
      localStorage.setItem('queryInput', queryInput);
    }
  }, [queryInput]);

  // Update available operations when query changes
  useEffect(() => {
    const operations = parseOperations(queryInput);
    setAvailableOperations(operations);
    
    // Reset operation name if it's no longer available
    if (operationName && !operations.includes(operationName)) {
      setOperationName('');
    }
    
    // Auto-select first operation if operations exist and no operation is selected
    if (operations.length > 0 && !operationName) {
      setOperationName(operations[0]);
    }
  }, [queryInput, operationName]);

  // Save variables and headers to local storage
  useEffect(() => {
    localStorage.setItem('graphqlVariables', graphqlVariables);
  }, [graphqlVariables]);

  useEffect(() => {
    localStorage.setItem('httpHeaders', httpHeaders);
  }, [httpHeaders]);


  // Handle environment changes
  useEffect(() => {
    // Save selected environment
    localStorage.setItem('selectedEnvironment', selectedEnvironment);
    // Dispatch custom event to update indicator
    window.dispatchEvent(new Event('environmentChanged'));
    
    // Clear schema when environment changes - it will be loaded on demand
    setSchema(null);
  }, [selectedEnvironment]);

  // Auto-load schema for autocomplete when API client is ready
  useEffect(() => {
    const loadSchemaForAutocomplete = async () => {
      if (schema) return; // Don't reload if already have schema
      
      setSchemaLoading(true);
      try {
        console.log('Loading schema for autocomplete...');
        const schemaResult = await apiClient.executeGraphQLQuery(INTROSPECTION_QUERY, {});
        setSchema(schemaResult as IntrospectionResult);
        console.log('Schema loaded for autocomplete');
      } catch (err) {
        console.warn('Failed to load schema for autocomplete:', err);
        // Don't show error to user - autocomplete will just be limited
      } finally {
        setSchemaLoading(false);
      }
    };

    // Load schema after a short delay to avoid blocking the UI
    const timeoutId = setTimeout(loadSchemaForAutocomplete, 1000);
    return () => clearTimeout(timeoutId);
  }, [apiClient, schema]);

  // Manual refresh schema function
  const refreshSchema = async () => {
    setSchemaLoading(true);
    try {
      console.log('Refreshing schema...');
      const schemaResult = await apiClient.executeGraphQLQuery(INTROSPECTION_QUERY, {});
      setSchema(schemaResult as IntrospectionResult);
      console.log('Schema refreshed successfully');
    } catch (err) {
      console.warn('Failed to refresh schema:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh schema');
    } finally {
      setSchemaLoading(false);
    }
  };

  const handleTest = async () => {
    console.log('[Apex Debug] handleTest called');

    console.log('[Apex Debug] apiClient is available, proceeding.');

    setLoading(true);
    setError(null);
    setResponse(null);
    setSentRequestBody(null); // Clear previous sent request
    setSentRequestHeaders(null); // Clear previous sent request
    
    const startTime = Date.now();
    let parsedVariables = {}; // Initialize as empty object
    let parsedHeaders = {};   // Initialize as empty object

    console.log('[Apex Debug] About to parse variables and headers.'); // New log

    try {
      if (graphqlVariables && graphqlVariables.trim() !== '') {
        parsedVariables = JSON.parse(graphqlVariables);
      }
      console.log('[Apex Debug] Parsed variables:', parsedVariables);
    } catch (e) {
      console.error('[Apex Debug] Error parsing GraphQL Variables:', e); // Log the actual error
      setError('GraphQL Variables are not valid JSON. Please ensure it is a valid JSON object or empty.');
      setLoading(false);
      setResponse({
        status: 400,
        error: 'GraphQL Variables are not valid JSON. Please ensure it is a valid JSON object or empty.',
        executionTime: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString(),
        headers: {},
      });
      setResponseTabValue(2); // Switch to error tab
      return;
    }

    try {
      if (httpHeaders && httpHeaders.trim() !== '') {
        parsedHeaders = JSON.parse(httpHeaders);
      }
      console.log('[Apex Debug] Parsed headers:', parsedHeaders);
    } catch (e) {
      console.error('[Apex Debug] Error parsing HTTP Headers:', e); // Log the actual error
      setError('HTTP Headers are not valid JSON. Please ensure it is a valid JSON object or empty.');
      setLoading(false);
      setResponse({
        status: 400,
        error: 'HTTP Headers are not valid JSON. Please ensure it is a valid JSON object or empty.',
        executionTime: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString(),
        headers: {},
      });
      setResponseTabValue(2); // Switch to error tab
      return;
    }
    
    console.log('[Apex Debug] Variables and headers parsed. About to execute API call.'); // New log

    try {
      if (selectedEndpoint === 'graphql') {
        console.log(`[Apex Debug] Executing GraphQL query for endpoint: ${selectedEndpoint}`);
        console.log(`[Apex Debug] Query: ${queryInput}`);
        
        // Check if multiple operations exist and an operation name is required
        const currentOperations = parseOperations(queryInput);
        console.log(`[Apex Debug] Current operations:`, currentOperations);
        console.log(`[Apex Debug] Available operations state:`, availableOperations);
        console.log(`[Apex Debug] Operation name state:`, operationName);
        
        // If multiple operations but no operationName, try to auto-select
        if (currentOperations.length > 1 && (!operationName || operationName.trim() === '')) {
          console.log('[Apex Debug] Multiple operations detected but no operation selected, attempting auto-select');
          if (currentOperations.length > 0) {
            const autoSelectedOperation = currentOperations[0];
            console.log('[Apex Debug] Auto-selecting operation:', autoSelectedOperation);
            setOperationName(autoSelectedOperation);
            // Use the auto-selected operation for this request
            console.log('[Apex Debug] Using auto-selected operation for this request:', autoSelectedOperation);
          } else {
            console.error('[Apex Debug] No operations available for auto-selection');
            setError('Multiple operations detected. Please select an operation to execute.');
            setLoading(false);
            setResponse({
              status: 400,
              error: 'Multiple operations detected. Please select an operation to execute.',
              executionTime: `${Date.now() - startTime}ms`,
              timestamp: new Date().toISOString(),
              headers: {},
            });
            setResponseTabValue(2); // Switch to error tab
            return;
          }
        }
        
        // Use the current operationName or the auto-selected one
        const finalOperationName = operationName && operationName.trim() !== '' ? operationName : (currentOperations.length > 0 ? currentOperations[0] : '');
        console.log(`[Apex Debug] Final operation name to use:`, finalOperationName);
        
        console.log(`[Apex Debug] Selected operation: ${finalOperationName || 'none (single operation)'}`);
        
        // Capture request details before sending - include ALL headers that will be sent
        const requestDetailsToStore = {
          query: queryInput,
          variables: parsedVariables,
        };
        
        // Build the complete headers object that will actually be sent to the proxy
        // This includes system headers (proxy-client, environment) + user's custom headers
        // Note: The OAuth token is sent in the request body and converted to 'Authorization' header by the proxy
        const completeHeaders = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'x-selected-environment': selectedEnvironment,
          ...parsedHeaders, // User's custom headers override defaults
        };
        
        // Store the complete request details including authentication info
        const completeRequestDetails = {
          query: queryInput,
          variables: parsedVariables,
          ...(finalOperationName && { operationName: finalOperationName }),
          access_token: apiClient.getCurrentToken() ? `${apiClient.getCurrentToken()!.access_token.substring(0, 20)}...` : null,
          note: "Access token is sent in request body and converted to 'Authorization: Bearer <token>' header by the Next.js proxy"
        };
        
        setSentRequestBody(safeStringify(completeRequestDetails));
        setSentRequestHeaders(completeHeaders);

        const result = await apiClient.executeGraphQLQuery(
          queryInput, 
          parsedVariables, 
          parsedHeaders as Record<string, string>, 
          undefined, // Remove selectedProxyClient
          finalOperationName || undefined
        );
        console.log('[Apex Debug] GraphQL execution result:', result);
        const executionTime = Date.now() - startTime;
        
        setResponse({
          status: (result.errors || (result.data && Object.keys(result.data).length === 0 && !result.errors)) ? (result.status || 500) : 200, // Infer status
          data: result.data,
          error: result.errors ? safeStringify(result.errors) : undefined,
          executionTime: `${executionTime}ms`,
          timestamp: new Date().toISOString(),
          headers: result.responseHeaders || { 'content-type': 'application/json', 'cache-control': 'no-cache' } // Changed from result.headers
        });
        if (result.errors) {
          setResponseTabValue(2); // Switch to error tab if GraphQL errors exist
        } else {
          setResponseTabValue(0); // Switch to body tab
        }
      } else {
        console.warn('[Apex Debug] REST endpoint selected, not implemented.'); // New log
        throw new Error('REST endpoint testing not yet implemented');
      }
    } catch (err) {
      console.error('[Apex Debug] Error during API test execution:', err); // New log
      const executionTime = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during testing';
      setError(errorMessage);
      
      setResponse({
        status: 500, // Default to 500 for catch-all errors
        error: errorMessage,
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        headers: {},
      });
      setResponseTabValue(2); // Switch to error tab
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRandomQuery = async () => {
    setGeneratingQuery(true);
    setError(null);
    
    try {
      let currentSchema = schema;
      if (!currentSchema) {
        console.log('Fetching schema...');
        setSchemaLoading(true);
        const schemaResult = await apiClient.executeGraphQLQuery(INTROSPECTION_QUERY, {});
        currentSchema = schemaResult as IntrospectionResult;
        setSchema(currentSchema);
        setSchemaLoading(false);
      }

      const generator = new RandomQueryGenerator(currentSchema);
      const randomQuery = generator.generateRandomQuery();
      
      setQueryInput(randomQuery);
      
    } catch (err) {
      console.error('Random query generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate random query');
      setSchemaLoading(false); // Make sure to clear loading state on error
      setResponseTabValue(2);
    } finally {
      setGeneratingQuery(false);
    }
  };

  const handleSaveQuery = () => {
    if (!queryInput.trim()) {
      setError('No query to save');
      setResponseTabValue(2);
      return;
    }
    setEditingQuery(null);
    setShowSaveDialog(true);
  };

  const handleDuplicateQuery = () => {
    if (!queryInput.trim()) {
      setError('No query to duplicate');
      setResponseTabValue(2);
      return;
    }
    setEditingQuery(null);
    setShowDuplicateDialog(true);
  };

  const handleQuerySaved = (savedQuery: SavedQuery) => {
    console.log('Query saved:', savedQuery.name);
  };

  const handleNewQuery = () => {
    const confirmed = confirm('Start a new query? This will clear the current editor content.');
    if (confirmed) {
      setQueryInput('');
      setGraphqlVariables('{}');
      setEditingQuery(null); // Clear editing query so header shows "Unnamed"
      localStorage.removeItem('queryInput'); // Clear saved query
      // Show feedback
      setCopySnackbarMessage('Started new query');
      setCopySnackbarOpen(true);
      
      // Focus the editor
      setTimeout(() => {
        if (editorRef.current) {
          const cmEditor = editorRef.current.querySelector('.cm-editor .cm-content');
          if (cmEditor) {
            (cmEditor as HTMLElement).focus();
          }
        }
      }, 100);
    }
  };

  // Schema Browser handlers
  const handleShowSchemaBrowser = () => {
    setShowSchemaBrowserDrawer(true);
  };

  const handleCloseSchemaBrowser = () => {
    setShowSchemaBrowserDrawer(false);
  };

  // Focus switching and other handlers

  // Insert type name at cursor position in the editor
  const handleInsertType = (typeName: string) => {
    const currentValue = queryInput;
    // Insert at the end for now - could be enhanced to insert at cursor position
    const newValue = currentValue + (currentValue.trim() ? '\n' : '') + typeName;
    setQueryInput(newValue);
    
    // Show feedback
    setCopySnackbarMessage(`Type "${typeName}" inserted`);
    setCopySnackbarOpen(true);
    
    // Focus the editor
    setTimeout(() => {
      if (editorRef.current) {
        const cmEditor = editorRef.current.querySelector('.cm-editor .cm-content');
        if (cmEditor) {
          (cmEditor as HTMLElement).focus();
        }
      }
    }, 100);
  };

  // Insert field name and optionally build query structure
  const handleInsertField = (fieldName: string, typeName: string) => {
    const currentValue = queryInput;
    // Insert field name - could be enhanced to be context-aware
    const newValue = currentValue + (currentValue.trim() ? '\n' : '') + fieldName;
    setQueryInput(newValue);
    
    // Show feedback
    setCopySnackbarMessage(`Field "${fieldName}" inserted`);
    setCopySnackbarOpen(true);
    
    // Focus the editor
    setTimeout(() => {
      if (editorRef.current) {
        const cmEditor = editorRef.current.querySelector('.cm-editor .cm-content');
        if (cmEditor) {
          (cmEditor as HTMLElement).focus();
        }
      }
    }, 100);
  };

  // Generate a query skeleton from a GraphQL type
  const handleGenerateQuery = (type: any) => {
    if (!type || !type.fields) return;
    
    // Generate a basic query structure
    const typeName = type.name;
    const rootField = typeName.toLowerCase();
    
    // Build field list (first few fields as example)
    const fields = type.fields
      .slice(0, 5) // Limit to first 5 fields
      .map((field: any) => {
        if (field.type.kind === 'SCALAR' || field.type.name === 'String' || field.type.name === 'Int' || field.type.name === 'Boolean') {
          return `    ${field.name}`;
        } else {
          return `    ${field.name} {\n      # Add nested fields here\n    }`;
        }
      })
      .join('\n');

    const queryTemplate = `query Get${typeName} {
  ${rootField} {
${fields}
  }
}`;

    setQueryInput(queryTemplate);
    
    // Show feedback
    setCopySnackbarMessage(`Query skeleton for "${typeName}" generated`);
    setCopySnackbarOpen(true);
    
    // Close the schema browser and focus the editor
    setShowSchemaBrowserDrawer(false);
    setTimeout(() => {
      if (editorRef.current) {
        const cmEditor = editorRef.current.querySelector('.cm-editor .cm-content');
        if (cmEditor) {
          (cmEditor as HTMLElement).focus();
        }
      }
    }, 100);
  };

  const handleSelectQuery = (query: SavedQuery) => {
    setQueryInput(query.query);
    setGraphqlVariables(query.variables ? safeStringify(query.variables) : '{}'); // Stringify variables
    setEditingQuery(query); // Set the editing query so the header shows the name
    // We don't save/load HTTP headers with queries for now
    setShowLibraryDialog(false);
    
    // Show feedback that query was loaded
    setCopySnackbarMessage(`Query "${query.name}" loaded successfully`);
    setCopySnackbarOpen(true);
    
    // Focus the editor after a brief delay to allow dialog to close
    setTimeout(() => {
      if (editorRef.current) {
        const cmEditor = editorRef.current.querySelector('.cm-editor .cm-content');
        if (cmEditor) {
          (cmEditor as HTMLElement).focus();
        }
      }
    }, 100);
  };

  const handleRunSavedQuery = async (query: SavedQuery) => {
    setQueryInput(query.query);
    setGraphqlVariables(query.variables ? safeStringify(query.variables) : '{}'); // Stringify variables
    setEditingQuery(query); // Set the editing query so the header shows the name
    setShowLibraryDialog(false);
    
    // Run the query with current environment and proxy settings
    setTimeout(() => {
      handleTest();
    }, 100);
  };

  const toggleResponsePanelFullscreen = () => {
    setIsResponsePanelFullscreen(!isResponsePanelFullscreen);
  };

  const handleCopyResponseContent = async () => {
    let contentToCopy = '';
    let contentType = '';

    if (responseTabValue === 0 && response?.data) {
      contentToCopy = safeStringify(response.data);
      contentType = 'Response body';
    } else if (responseTabValue === 1 && response?.headers) {
      contentToCopy = safeStringify(response.headers);
      contentType = 'Response headers';
    } else if (responseTabValue === 2) {
      if (error) {
        contentToCopy = error;
        contentType = 'Error message';
      } else if (response?.error) {
        contentToCopy = typeof response.error === 'string' ? response.error : safeStringify(response.error);
        contentType = 'Error details';
      }
    }

    if (contentToCopy) {
      try {
        await navigator.clipboard.writeText(contentToCopy);
        setCopySnackbarMessage(`${contentType} copied to clipboard!`);
        setCopySnackbarOpen(true);
      } catch (err) {
        console.error('Failed to copy content:', err);
        setCopySnackbarMessage('Failed to copy content.');
        setCopySnackbarOpen(true);
      }
    } else {
      setCopySnackbarMessage('No content to copy in the current tab.');
      setCopySnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setCopySnackbarOpen(false);
  };

  // Global keyboard event handler for focus switching
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Ctrl+X O: Switch focus between editor and response panel
      if (event.ctrlKey && event.key === 'x') {
        // We need to wait for the next key press (o)
        const handleNextKey = (nextEvent: KeyboardEvent) => {
          if (nextEvent.key === 'o' || nextEvent.key === 'O') {
            nextEvent.preventDefault();
            nextEvent.stopPropagation();
            handleSwitchFocus();
          }
          document.removeEventListener('keydown', handleNextKey);
        };
        document.addEventListener('keydown', handleNextKey);
        return;
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [currentFocus]); // Re-add listener when currentFocus changes

  return (
    <div className={`min-h-screen bg-gray-50 ${isResponsePanelFullscreen ? 'overflow-hidden' : ''}`}>
      
      {/* Modern Container with Perfect Spacing */}
      <div className={`max-w-[2000px] mx-auto p-6 ${isResponsePanelFullscreen ? 'h-screen flex flex-col' : 'min-h-screen'}`}>

        {/* Seamless Two-Panel Layout */}
        <div className={`flex ${isResponsePanelFullscreen ? 'flex-grow contents' : 'gap-4 min-h-0 flex-1'}`}>
          
          {/* LEFT PANEL - GraphQL Editor */}
          {!isResponsePanelFullscreen && (
            <div className="flex-1 min-w-0 flex flex-col">
              
              {/* Modern Editor Card */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col" style={{ height: '65vh', minHeight: '500px', overflowY: 'auto' }}>
                
                {/* Minimal Header Bar */}
                <div className="bg-gray-50/50 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                  
                  {/* Query Name Only */}
                  <div className="flex items-center space-x-2 text-sm min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5 px-2 py-1 bg-white rounded-md shadow-sm border border-gray-200">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-gray-900 truncate">
                        {editingQuery?.name || 'Unnamed Query'}
                      </span>
                    </div>

                    {/* Operation Name Selector */}
                    {availableOperations.length > 1 && (
                      <div className="flex items-center space-x-1.5 px-2 py-1 bg-white rounded-md shadow-sm border border-gray-200">
                        <span className="text-xs text-gray-500 font-medium">Op:</span>
                        <select
                          value={operationName}
                          onChange={(e) => setOperationName(e.target.value)}
                          className="text-xs border-0 bg-transparent text-gray-700 focus:outline-none focus:ring-0 pr-6"
                          style={{ backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMUw2IDZMMTEgMSIgc3Ryb2tlPSIjNkI3MjgwIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right center', backgroundSize: '12px' }}
                        >
                          {availableOperations.map((operation) => (
                            <option key={operation} value={operation}>
                              {operation}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Toolbar */}
                  <div className="flex items-center space-x-1 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                    {/* Execute Button - Primary Action */}
                    <Tooltip title={loading ? "Executing query..." : "Execute GraphQL query"}>
                      <button
                        onClick={handleTest}
                        disabled={loading}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          loading 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        }`}
                      >
                        {loading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            <span>Running</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1.5">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                            <span>Run</span>
                          </div>
                        )}
                      </button>
                    </Tooltip>
                    
                    <div className="w-px h-6 bg-gray-200"></div>
                    
                    {/* Schema Refresh */}
                    <Tooltip title="Refresh schema">
                      <button
                        onClick={refreshSchema}
                        disabled={schemaLoading}
                        className="p-1.5 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50"
                      >
                        {schemaLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                        ) : (
                          <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                      </button>
                    </Tooltip>
                  
                    {/* Action Icons */}
                    {selectedEndpoint === 'graphql' && !loading && (
                      <>
                        {/* Generate Random Query */}
                        <Tooltip title="Generate Random Query">
                          <button 
                            onClick={handleGenerateRandomQuery} 
                            disabled={generatingQuery}
                            className="p-1.5 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50"
                          >
                            {generatingQuery ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                            ) : (
                              <Casino className="h-4 w-4 text-gray-600" />
                            )}
                          </button>
                        </Tooltip>
                        
                        {/* Query Library */}
                        <Tooltip title="Query Library">
                          <button 
                            onClick={() => setShowLibraryDialog(true)}
                            className="p-1.5 hover:bg-gray-50 rounded-md transition-colors"
                          >
                            <LibraryBooks className="h-4 w-4 text-gray-600" />
                          </button>
                        </Tooltip>
                        
                        {/* Schema Browser */}
                        <Tooltip title="Schema Browser">
                          <button 
                            onClick={handleShowSchemaBrowser}
                            className="p-1.5 hover:bg-gray-50 rounded-md transition-colors"
                          >
                            <Schema className="h-4 w-4 text-gray-600" />
                          </button>
                        </Tooltip>
                        
                        <div className="w-px h-6 bg-gray-200"></div>
                        
                        {/* File Actions */}
                        <Tooltip title="New Query">
                          <button 
                            onClick={handleNewQuery}
                            className="p-1.5 hover:bg-gray-50 rounded-md transition-colors"
                          >
                            <NoteAdd className="h-4 w-4 text-gray-600" />
                          </button>
                        </Tooltip>
                        
                        <Tooltip title="Save Query">
                          <button 
                            onClick={handleSaveQuery} 
                            disabled={!queryInput.trim()}
                            className="p-1.5 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-30"
                          >
                            <Save className="h-4 w-4 text-gray-600" />
                          </button>
                        </Tooltip>
                        
                        <Tooltip title="Duplicate Query">
                          <button 
                            onClick={handleDuplicateQuery} 
                            disabled={!queryInput.trim()}
                            className="p-1.5 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-30"
                          >
                            <FileCopy className="h-4 w-4 text-gray-600" />
                          </button>
                        </Tooltip>
                        
                        <div className="w-px h-6 bg-gray-200"></div>
                        
                        {/* Editor Actions */}
                        <Tooltip title="Format GraphQL">
                          <button 
                            onClick={() => {
                              try {
                                const formatted = formatGraphQLQuery(queryInput);
                                setQueryInput(formatted);
                              } catch (error) {
                                console.error('Failed to format GraphQL:', error);
                              }
                            }}
                            className="p-1.5 hover:bg-gray-50 rounded-md transition-colors"
                          >
                            <AutoFixHigh className="h-4 w-4 text-gray-600" />
                          </button>
                        </Tooltip>
                        
                        <Tooltip title="Copy to clipboard">
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(queryInput);
                              setCopySnackbarMessage('Query copied to clipboard');
                              setCopySnackbarOpen(true);
                            }}
                            className="p-1.5 hover:bg-gray-50 rounded-md transition-colors"
                          >
                            <ContentCopy className="h-4 w-4 text-gray-600" />
                          </button>
                        </Tooltip>
                        
                        <Tooltip title="Keyboard shortcuts">
                          <button 
                            onClick={() => setShowKeyboardShortcuts(true)}
                            className="p-1.5 hover:bg-gray-50 rounded-md transition-colors"
                          >
                            <Help className="h-4 w-4 text-gray-600" />
                          </button>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Modern Editor Container */}
                <div className="flex-1 min-h-0 bg-white h-[65vh]" style={{ overflowY: 'auto' }}>
                  <EnhancedGraphQLEditor
                    ref={editorRef}
                    value={queryInput}
                    onChange={setQueryInput}
                    placeholder={selectedEndpoint === 'graphql' ? sampleQueries.graphql : 'Enter your query here...'}
                    schema={schema as unknown as Record<string, unknown> | undefined}
                    height="100%"
                    onExecute={selectedEndpoint === 'graphql' ? handleTest : undefined}
                    onSwitchFocus={handleSwitchFocus}
                    hasFocus={currentFocus === 'editor'}
                    variables={graphqlVariables}
                    onVariablesChange={setGraphqlVariables}
                    headers={httpHeaders}
                    onHeadersChange={setHttpHeaders}
                    apiClient={apiClient}
                    schemaLoading={schemaLoading}
                    loading={loading}
                    generatingQuery={generatingQuery}
                  />
                </div>
              </div>

              {/* Modern Collapsible Panels */}
              <div className="flex flex-col space-y-3 max-h-[35vh] min-h-0">
                
                {/* Status Panel - Modern Design */}
                {(schemaLoading || loading || generatingQuery || !apiClient.getCurrentToken()) && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {schemaLoading && 'Loading Schema...'}
                          {loading && 'Executing Query...'}
                          {generatingQuery && 'Generating Query...'}
                          {!apiClient.getCurrentToken() && 'Connecting...'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {schemaLoading && 'Fetching GraphQL schema for autocomplete'}
                          {loading && 'Sending request to API endpoint'}
                          {generatingQuery && 'Creating random query from schema'}
                          {!apiClient.getCurrentToken() && 'Authenticating with OAuth'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* RIGHT PANEL - Response Viewer */}
          <div className={`flex-1 min-w-0 ${isResponsePanelFullscreen ? 'w-full h-full fixed inset-0 z-[2000]' : ''}`}>
            <div 
              ref={responseRef}
              className={`bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col ${
                isResponsePanelFullscreen ? '!rounded-none h-full' : 'h-[65vh]'
              }`}
              tabIndex={-1}
              style={{
                outline: currentFocus === 'response' ? '2px solid #3b82f6' : 'none',
                outlineOffset: '-2px',
              }}
            >
              {/* Modern Response Header */}
              <div className="bg-gray-50/50 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                
                {/* Left: Status Information */}
                <div className="flex items-center space-x-3">
                  {response && (
                    <>
                      <div className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                        response.status >= 200 && response.status < 300 && !response.error
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {response.status} {response.status >= 200 && response.status < 300 && !response.error ? 'Success' : 'Error'}
                      </div>
                      <div className="text-sm text-gray-600 font-mono">
                        {response.executionTime}
                      </div>
                    </>
                  )}
                  {!response && (
                    <span className="text-sm text-gray-500">Ready to execute</span>
                  )}
                </div>

                {/* Center: Environment and Proxy Controls */}
                <div className="flex items-center space-x-3">
                  {/* Environment Selector */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 font-medium">Environment:</span>
                    <select
                      value={selectedEnvironment}
                      onChange={(e) => setSelectedEnvironment(e.target.value)}
                      className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {environmentOptions.map((env) => (
                        <option key={env.key} value={env.key}>
                          {env.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-1 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                  <Tooltip title="Copy current tab content">
                    <button 
                      onClick={handleCopyResponseContent} 
                      disabled={!((responseTabValue === 0 && response?.data) || (responseTabValue === 1 && response?.headers) || (responseTabValue === 2 && (error || response?.error)))}
                      className="p-1.5 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-30"
                    >
                      <ContentCopyIcon className="h-4 w-4 text-gray-600" />
                    </button>
                  </Tooltip>
                  <Tooltip title={isResponsePanelFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                    <button 
                      onClick={toggleResponsePanelFullscreen}
                      className="p-1.5 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      {isResponsePanelFullscreen ? 
                        <FullscreenExitIcon className="h-4 w-4 text-gray-600" /> : 
                        <FullscreenIcon className="h-4 w-4 text-gray-600" />
                      }
                    </button>
                  </Tooltip>
                </div>
              </div>
              
              {/* Modern Tab Navigation */}
              <div className="border-b border-gray-100">
                <nav className="flex">
                  <button
                    type="button"
                    onClick={() => setResponseTabValue(0)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 focus:outline-none transition-colors
                      ${responseTabValue === 0
                        ? 'border-blue-500 text-blue-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-blue-600 hover:bg-gray-50'}`}
                  >
                    Response
                  </button>
                  <button
                    type="button"
                    onClick={() => setResponseTabValue(1)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 focus:outline-none transition-colors
                      ${responseTabValue === 1
                        ? 'border-blue-500 text-blue-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-blue-600 hover:bg-gray-50'}`}
                  >
                    Headers
                  </button>
                  <button
                    type="button"
                    onClick={() => setResponseTabValue(2)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 focus:outline-none transition-colors
                      ${responseTabValue === 2
                        ? 'border-blue-500 text-blue-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-blue-600 hover:bg-gray-50'}`}
                  >
                    Errors
                  </button>
                </nav>
              </div>
              
              {/* Tab Content */}
              <div className="flex-1 min-h-0" style={{ overflowY: 'auto' }}>
                {/* Response Tab */}
                {responseTabValue === 0 && (
                  <div className="h-full p-4" style={{ overflowY: 'auto' }}>
                    {loading && (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-600">Executing query...</p>
                      </div>
                    )}
                    {!loading && response?.data !== undefined && response.data !== null && (
                      <div className="h-full" style={{ overflowY: 'auto' }}>
                        <JSONViewer value={safeStringify(response.data)} />
                      </div>
                    )}
                    {!loading && !response?.data && !response?.error && !error && (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          <p className="text-gray-500">Execute a query to see the response</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Headers Tab */}
                {responseTabValue === 1 && (
                  <div className="h-full p-4" style={{ overflowY: 'auto' }}>
                    {response?.headers ? (
                      <div style={{ overflowY: 'auto' }}>
                        <JSONViewer value={safeStringify(response.headers)} />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No headers to display</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Errors Tab */}
                {responseTabValue === 2 && (
                  <div className="h-full p-4" style={{ overflowY: 'auto' }}>
                    {error && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Request Error</h3>
                            <div className="mt-2 text-sm text-red-700">
                              <p>{error}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {response?.error && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg mt-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">API Error</h3>
                            <div className="mt-2 text-sm text-red-700 font-mono whitespace-pre-wrap">
                              {typeof response.error === 'string' ? response.error : safeStringify(response.error)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {!error && !response?.error && (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="text-gray-500">No errors to display</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {showSaveDialog && (
          <SaveQueryDialog
            open={showSaveDialog}
            onClose={() => setShowSaveDialog(false)}
            onSave={handleQuerySaved}
            query={queryInput}
            variables={graphqlVariables}
            editingQuery={editingQuery} // Changed from existingQuery to editingQuery
          />
        )}
        {showDuplicateDialog && (
          <SaveQueryDialog
            open={showDuplicateDialog}
            onClose={() => setShowDuplicateDialog(false)}
            onSave={handleQuerySaved}
            query={queryInput}
            variables={graphqlVariables}
            editingQuery={{
              id: `temp-${Date.now()}`,
              name: 'Current Query',
              query: queryInput,
              variables: graphqlVariables ? JSON.parse(graphqlVariables) : {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }}
            isDuplicating={true}
          />
        )}
        {showLibraryDialog && (
          <QueryLibraryDrawer
            open={showLibraryDialog}
            onClose={() => setShowLibraryDialog(false)}
            onSelectQuery={handleSelectQuery}
            onRunQuery={handleRunSavedQuery}
            onEditQuery={(query: SavedQuery) => {
              setEditingQuery(query);
              setQueryInput(query.query);
              setGraphqlVariables(query.variables ? safeStringify(query.variables) : '{}');
              setShowLibraryDialog(false);
              // Potentially open save dialog directly or indicate editing mode
              // For now, just loads it into editor, user can click save
            }}
            currentEnvironment={selectedEnvironment} // Added missing currentEnvironment prop
          />
        )}
        {showSchemaBrowserDrawer && (
          <SchemaBrowserDrawer
            open={showSchemaBrowserDrawer}
            onClose={handleCloseSchemaBrowser}
            onInsertType={handleInsertType}
            onInsertField={handleInsertField}
            onGenerateQuery={handleGenerateQuery}
            schema={schema}
            loading={loading}
            error={error}
          />
        )}
        
        {/* Keyboard Shortcuts Dialog */}
        {showKeyboardShortcuts && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 relative animate-fade-in">
              <button
                onClick={() => setShowKeyboardShortcuts(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Keyboard Shortcuts</h2>
              <div className="space-y-8 max-h-[70vh] overflow-y-auto">
                {/* Key Bindings Section */}
                <div>
                  <h3 className="text-lg font-semibold text-blue-700 mb-2">Key Bindings</h3>
                  <ul className="space-y-1 text-sm">
                    <li><span className="font-medium">Run Query:</span> <kbd className="kbd">Ctrl+Enter</kbd> (Cmd+Enter on Mac)</li>
                    <li><span className="font-medium">Format Query:</span> <kbd className="kbd">Shift+Alt+F</kbd></li>
                    <li><span className="font-medium">Switch Focus (Editor ↔ Response):</span> <kbd className="kbd">Ctrl+X</kbd> then <kbd className="kbd">O</kbd></li>
                    <li><span className="font-medium">Open Schema Browser:</span> <kbd className="kbd">Ctrl+Shift+S</kbd></li>
                    <li><span className="font-medium">New Query:</span> <kbd className="kbd">Ctrl+N</kbd></li>
                    <li><span className="font-medium">Save Query:</span> <kbd className="kbd">Ctrl+S</kbd></li>
                    <li><span className="font-medium">Duplicate Query:</span> <kbd className="kbd">Ctrl+D</kbd></li>
                    <li><span className="font-medium">Copy Query:</span> <kbd className="kbd">Ctrl+C</kbd></li>
                    <li><span className="font-medium">Fullscreen Editor:</span> <kbd className="kbd">F11</kbd></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-700 mb-2">Search & Replace</h3>
                  <ul className="space-y-1 text-sm">
                    <li><span className="font-medium">Find:</span> <kbd className="kbd">Cmd+F</kbd> (Mac) / <kbd className="kbd">Ctrl+F</kbd> (Win/Linux)</li>
                    <li><span className="font-medium">Find and Replace:</span> <kbd className="kbd">Cmd+Shift+H</kbd> / <kbd className="kbd">Ctrl+H</kbd></li>
                    <li><span className="font-medium">Incremental Search (Emacs):</span> <kbd className="kbd">Ctrl+S</kbd> (forward), <kbd className="kbd">Ctrl+R</kbd> (back), <kbd className="kbd">Ctrl+G</kbd> or <kbd className="kbd">Esc</kbd> (exit)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-700 mb-2">Navigation</h3>
                  <ul className="space-y-1 text-sm">
                    <li><span className="font-medium">Move cursor up/down:</span> <kbd className="kbd">Ctrl+P</kbd> / <kbd className="kbd">Ctrl+N</kbd> or arrow keys</li>
                    <li><span className="font-medium">Beginning/End of line:</span> <kbd className="kbd">Ctrl+A</kbd> / <kbd className="kbd">Ctrl+E</kbd></li>
                    <li><span className="font-medium">Beginning/End of document:</span> <kbd className="kbd">Cmd+Home</kbd> / <kbd className="kbd">Cmd+End</kbd> (Mac) or <kbd className="kbd">Ctrl+Home</kbd> / <kbd className="kbd">Ctrl+End</kbd></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-700 mb-2">Editing</h3>
                  <ul className="space-y-1 text-sm">
                    <li><span className="font-medium">Delete line:</span> <kbd className="kbd">Ctrl+K</kbd></li>
                    <li><span className="font-medium">Backspace:</span> <kbd className="kbd">Backspace</kbd> or <kbd className="kbd">Ctrl+H</kbd></li>
                    <li><span className="font-medium">Auto-complete:</span> <kbd className="kbd">Ctrl+Space</kbd></li>
                    <li><span className="font-medium">Format GraphQL:</span> <kbd className="kbd">Shift+Alt+F</kbd></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-700 mb-2">Application</h3>
                  <ul className="space-y-1 text-sm">
                    <li><span className="font-medium">Execute Query:</span> <kbd className="kbd">Ctrl+Enter</kbd></li>
                    <li><span className="font-medium">Switch Focus (Editor ↔ Response):</span> <kbd className="kbd">Ctrl+X</kbd> then <kbd className="kbd">O</kbd></li>
                    <li><span className="font-medium">Schema Browser:</span> <kbd className="kbd">Ctrl+Shift+S</kbd></li>
                    <li><span className="font-medium">Ace Jump (Quick Navigation):</span> <kbd className="kbd">Ctrl+;</kbd> then type</li>
                    <li><span className="font-medium">Fullscreen Editor:</span> <kbd className="kbd">F11</kbd> or click fullscreen, <kbd className="kbd">Esc</kbd> to exit</li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setShowKeyboardShortcuts(false)}
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Snackbar/Toast Notification */}
        <div
          className={`fixed bottom-6 left-1/2 z-[4000] transform -translate-x-1/2 transition-all duration-300 ${copySnackbarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          role="alert"
        >
          <div
            className={`px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 text-sm font-medium
              ${copySnackbarMessage.startsWith('Failed') || copySnackbarMessage.startsWith('No content')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'}`}
          >
            <span>{copySnackbarMessage}</span>
            <button
              onClick={handleCloseSnackbar}
              className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Close notification"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
