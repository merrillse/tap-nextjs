'use client';

import { useState, useEffect, useMemo, type ReactNode, type JSX } from 'react';
import { getEnvironmentConfig, getEnvironmentNames } from '@/lib/environments';
import { ApiClient } from '@/lib/api-client';
import { safeStringify } from '@/lib/utils';
import { RandomQueryGenerator, INTROSPECTION_QUERY, type IntrospectionResult } from '@/lib/random-query-generator';
import { type SavedQuery } from '@/lib/query-library';
import { SaveQueryDialog, QueryLibraryDialog } from '@/components/QueryLibraryDialog';
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
  CircularProgress // Added CircularProgress
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ContentCopy as ContentCopyIcon, Fullscreen as FullscreenIcon, FullscreenExit as FullscreenExitIcon } from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material/Select';
import { CodeEditor, JSONViewer } from '@/components/CodeEditor'; // JSONViewer might be CodeEditor with readOnly
import { EnhancedGraphQLEditor } from '@/components/EnhancedGraphQLEditor';

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
  const [selectedEndpoint, setSelectedEndpoint] = useState('graphql');
  const [selectedEnvironment, setSelectedEnvironment] = useState('mis-gql-stage');
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
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [generatingQuery, setGeneratingQuery] = useState(false);
  const [schema, setSchema] = useState<IntrospectionResult | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLibraryDialog, setShowLibraryDialog] = useState(false);
  const [editingQuery, setEditingQuery] = useState<SavedQuery | null>(null);
  const [responseTabValue, setResponseTabValue] = useState(0);
  const [isResponsePanelFullscreen, setIsResponsePanelFullscreen] = useState(false);
  const [copySnackbarOpen, setCopySnackbarOpen] = useState(false);
  const [copySnackbarMessage, setCopySnackbarMessage] = useState('');

  const handleResponseTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setResponseTabValue(newValue);
  };

  const handleEnvironmentChange = (event: SelectChangeEvent) => {
    setSelectedEnvironment(event.target.value);
  };

  const environmentOptions = getEnvironmentNames();

  // Load saved environment on component mount
  useEffect(() => {
    const savedEnv = localStorage.getItem('selectedEnvironment') || 'mis-gql-stage';
    setSelectedEnvironment(savedEnv);

    // Robust loading for graphqlVariables
    let savedVars = localStorage.getItem('graphqlVariables');
    try {
      if (savedVars) {
        JSON.parse(savedVars); // Validate if it's valid JSON
      } else {
        savedVars = '{}'; // Default if not found
      }
    } catch (e) {
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
    } catch (e) {
      savedHeaders = '{}'; // Default if invalid JSON
    }
    setHttpHeaders(savedHeaders);

  }, []);

  // Save variables and headers to local storage
  useEffect(() => {
    localStorage.setItem('graphqlVariables', graphqlVariables);
  }, [graphqlVariables]);

  useEffect(() => {
    localStorage.setItem('httpHeaders', httpHeaders);
  }, [httpHeaders]);


  // Initialize API client when environment changes
  useEffect(() => {
    const config = getEnvironmentConfig(selectedEnvironment);
    if (config) {
      setApiClient(new ApiClient(config, selectedEnvironment));
    }
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
      if (!apiClient || schema) return; // Don't reload if already have schema
      
      try {
        console.log('Loading schema for autocomplete...');
        const schemaResult = await apiClient.executeGraphQLQuery(INTROSPECTION_QUERY, {});
        setSchema(schemaResult as IntrospectionResult);
        console.log('Schema loaded for autocomplete');
      } catch (err) {
        console.warn('Failed to load schema for autocomplete:', err);
        // Don't show error to user - autocomplete will just be limited
      }
    };

    // Load schema after a short delay to avoid blocking the UI
    const timeoutId = setTimeout(loadSchemaForAutocomplete, 1000);
    return () => clearTimeout(timeoutId);
  }, [apiClient, schema]);

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
}`
  }), []);

  // Set initial query
  useEffect(() => {
    if (!queryInput) {
      setQueryInput(sampleQueries[selectedEndpoint as keyof typeof sampleQueries]);
    }
  }, [selectedEndpoint, queryInput, sampleQueries]);

  const handleTest = async () => {
    console.log('[Apex Debug] handleTest called');

    if (!apiClient) {
      console.error('[Apex Debug] apiClient is null in handleTest');
      setError('API client not initialized. Please select an environment.');
      return;
    }
    console.log('[Apex Debug] apiClient is available, proceeding.');

    setLoading(true);
    setError(null);
    setResponse(null);
    
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
        const result = await apiClient.executeGraphQLQuery(queryInput, parsedVariables, parsedHeaders as Record<string, string>);
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
    if (!apiClient) {
      setError('API client not initialized. Please select an environment.');
      return;
    }

    setGeneratingQuery(true);
    setError(null);
    
    try {
      let currentSchema = schema;
      if (!currentSchema) {
        console.log('Fetching schema...');
        const schemaResult = await apiClient.executeGraphQLQuery(INTROSPECTION_QUERY, {});
        currentSchema = schemaResult as IntrospectionResult;
        setSchema(currentSchema);
      }

      const generator = new RandomQueryGenerator(currentSchema);
      const randomQuery = generator.generateRandomQuery();
      
      setQueryInput(randomQuery);
      
    } catch (err) {
      console.error('Random query generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate random query');
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

  const handleQuerySaved = (savedQuery: SavedQuery) => {
    console.log('Query saved:', savedQuery.name);
  };

  const handleSelectQuery = (query: SavedQuery) => {
    setQueryInput(query.query);
    setGraphqlVariables(query.variables ? safeStringify(query.variables) : '{}'); // Stringify variables
    // We don't save/load HTTP headers with queries for now
    setShowLibraryDialog(false);
    
    if (query.environment !== selectedEnvironment) {
      const switchEnv = confirm(
        `This query was saved for environment "${query.environment}". \\n        Would you like to switch to that environment?`
      );
      if (switchEnv) {
        setSelectedEnvironment(query.environment);
      }
    }
  };

  const handleRunSavedQuery = async (query: SavedQuery) => {
    setQueryInput(query.query);
    setGraphqlVariables(query.variables ? safeStringify(query.variables) : '{}'); // Stringify variables
    setShowLibraryDialog(false);
    
    if (query.environment !== selectedEnvironment) {
      setSelectedEnvironment(query.environment);
      setTimeout(() => {
        handleTest();
      }, 100);
    } else {
      handleTest();
    }
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

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ${isResponsePanelFullscreen ? 'overflow-hidden' : ''}`}>
      <div className={`max-w-full mx-auto px-6 py-6 ${isResponsePanelFullscreen ? 'h-screen flex flex-col' : ''}`}>
        
        {/* Enhanced Header with Gradient (conditionally hidden in fullscreen) */}
        {!isResponsePanelFullscreen && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 rounded-xl blur-md opacity-60 -z-10"></div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                    GraphQL Testing Platform
                  </h1>
                  <p className="text-gray-600 mt-1">Execute GraphQL queries with real-time authentication and schema validation</p>
                </div>
              </div>
              
              {/* Environment Selector in Header */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">Environment:</span>
                </div>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel id="environment-select-label">Select Environment</InputLabel>
                  <Select
                    labelId="environment-select-label"
                    value={selectedEnvironment}
                    label="Select Environment"
                    onChange={handleEnvironmentChange}
                    sx={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e5e7eb',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3b82f6',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3b82f6',
                      },
                    }}
                  >
                    {environmentOptions.map(env => (
                      <MenuItem key={env.key} value={env.key}>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span>{env.name}</span>
                        </div>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid - Full Width Side by Side */}
        <div className={`grid lg:grid-cols-2 gap-8 ${isResponsePanelFullscreen ? 'flex-grow contents' : 'h-[calc(100vh-200px)]'}`}>
          
          {/* Request Panel - Left Side (conditionally hidden in fullscreen) */}
          {!isResponsePanelFullscreen && (
            <div className="flex flex-col space-y-4 overflow-y-auto pr-2">
              
              {/* Query Editor with Enhanced Header */}
              <Paper elevation={2} className="bg-white rounded-lg shadow-md flex flex-col flex-grow overflow-hidden">
                {/* Updated Header for GraphQL Query Panel */}
                <div className="bg-slate-50 p-3 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-700">GraphQL Query</h2>
                        <p className="text-slate-500 text-sm">Define your GraphQL operation</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="contained"
                        onClick={handleTest}
                        disabled={loading}
                        size="medium"
                        sx={{
                          // Using theme colors for a more standard look
                          // backgroundColor: loading ? 'grey.300' : 'primary.main',
                          // color: loading ? 'text.disabled' : 'primary.contrastText',
                          // '&:hover': {
                          //   backgroundColor: loading ? 'grey.300' : 'primary.dark',
                          // },
                          minWidth: 110,
                          fontWeight: 'medium',
                        }}
                        startIcon={loading ? (
                          <div className="w-4 h-4 border-2 border-inherit border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z" />
                          </svg>
                        )}
                      >
                        {loading ? 'Executing...' : 'Execute'}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex-grow p-0 overflow-y-auto" style={{ minHeight: '250px' }}> {/* Added overflow-y-auto here */}
                  <EnhancedGraphQLEditor
                    value={queryInput}
                    onChange={setQueryInput}
                    placeholder="Enter your GraphQL query here..."
                    schema={schema}
                    height="100%" // Will fill the parent
                    onGenerateRandomQuery={handleGenerateRandomQuery}
                    isGeneratingQuery={generatingQuery}
                    onSaveQuery={selectedEndpoint === 'graphql' ? handleSaveQuery : undefined}
                    onShowLibrary={selectedEndpoint === 'graphql' ? () => setShowLibraryDialog(true) : undefined}
                    canSaveQuery={selectedEndpoint === 'graphql' && queryInput.trim().length > 0}
                  />
                </div>
              </Paper>

              {/* GraphQL Variables Editor */}
              <Accordion sx={{ borderRadius: '1rem', boxShadow: 'lg', border: '1px solid rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="variables-content" id="variables-header" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="subtitle1" fontWeight="medium">GraphQL Variables (JSON)</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <CodeEditor
                    value={graphqlVariables}
                    onChange={setGraphqlVariables}
                    language="json"
                    height="150px"
                    placeholder='{ "key": "value" }'
                  />
                </AccordionDetails>
              </Accordion>

              {/* HTTP Headers Editor */}
              <Accordion sx={{ borderRadius: '1rem', boxShadow: 'lg', border: '1px solid rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="headers-content" id="headers-header" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="subtitle1" fontWeight="medium">HTTP Headers (JSON)</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <CodeEditor
                    value={httpHeaders}
                    onChange={setHttpHeaders}
                    language="json"
                    height="150px"
                    placeholder='{ "Authorization": "Bearer YOUR_TOKEN" }'
                  />
                </AccordionDetails>
              </Accordion>
              
              {/* Authentication Status - Compact Card */}
              {apiClient && (
                <Paper elevation={2} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Authentication Status</h3>
                        <p className="text-sm text-gray-600">OAuth Client Configured & Active</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full animate-pulse ${apiClient.getCurrentToken() ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                      <span className={`text-sm font-medium ${apiClient.getCurrentToken() ? 'text-green-600' : 'text-yellow-600'}`}>
                        {apiClient.getCurrentToken() ? 'Connected' : 'Acquiring Token...'}
                      </span>
                    </div>
                  </div>
                  {apiClient.getCurrentToken() && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <div className="text-xs text-green-700">
                        <p className="font-medium">✓ Access token acquired</p>
                        <p>Expires: {new Date(apiClient.getCurrentToken()!.expires_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </Paper>
              )}
            </div>
          )}
          
          {/* Response Panel - Right Side */}
          <div className={`flex flex-col space-y-6 h-full ${isResponsePanelFullscreen ? 'col-span-2 w-full h-full fixed inset-0 z-[2000]' : ''}`}>
            <Paper 
              elevation={isResponsePanelFullscreen ? 12 : 2} 
              className={`bg-white rounded-lg shadow-md flex flex-col flex-grow overflow-hidden h-full ${isResponsePanelFullscreen ? '!rounded-none' : ''}`}
            >
              {/* Updated Header for API Response Panel */}
              <div className="bg-slate-50 p-3 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  {/* ITEM 1: Left side (title/description) */}
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-700">API Response</h2>
                      <p className="text-slate-500 text-sm">Query results and diagnostics</p>
                    </div>
                  </div>

                  {/* ITEM 2: Middle part (status and execution time) */}
                  {response && ( 
                    <div className="flex items-center space-x-3">
                      <div className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                        response.status >= 200 && response.status < 300 && !response.error
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {response.status} {response.status >= 200 && response.status < 300 && !response.error ? 'SUCCESS' : 'ERROR'}
                      </div>
                      <div className="text-slate-600 text-sm font-medium">
                        <span role="img" aria-label="lightning">⚡</span> {response.executionTime}
                      </div>
                    </div>
                  )}

                  {/* ITEM 3: Right side (Copy and Fullscreen icons) */}
                  <div className="flex items-center flex-shrink-0"> {/* Added flex-shrink-0 */}
                    <Tooltip title="Copy current tab content">
                      <span> {/* Span for Tooltip when button is disabled */}
                        <IconButton 
                          onClick={handleCopyResponseContent} 
                          size="small"
                          disabled={!((responseTabValue === 0 && response?.data) || (responseTabValue === 1 && response?.headers) || (responseTabValue === 2 && (error || response?.error)))}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={isResponsePanelFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                      <IconButton onClick={toggleResponsePanelFullscreen} size="small">
                        {isResponsePanelFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
              </div>
              
              <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}> {/* Changed bgcolor for tabs */}
                <Tabs value={responseTabValue} onChange={handleResponseTabChange} aria-label="response tabs" variant="fullWidth">
                  <Tab label="Body" {...a11yProps(0)} />
                  <Tab label="Headers" {...a11yProps(1)} />
                  <Tab label="Error" {...a11yProps(2)} />
                </Tabs>
              </Box>
              <div className="flex-grow overflow-auto"> {/* This div will handle scrolling for tab panels */}
                <TabPanel value={responseTabValue} index={0}>
                  {loading && (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" textAlign="center">
                      <CircularProgress />
                      <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
                        Fetching response...
                      </Typography>
                    </Box>
                  )}
                  {!loading && response?.data !== undefined && response.data !== null && (() => {
                    const stringifiedData: string = safeStringify(response.data);
                    return <JSONViewer value={stringifiedData} />;
                  })()}
                  {!loading && !response?.data && !response?.error && !error && (
                     <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <Typography variant="body1" color="textSecondary">Execute a query to see the response body.</Typography>
                     </Box>
                  )}
                </TabPanel>
                <TabPanel value={responseTabValue} index={1}>
                  {response?.headers ? (() => {
                    const stringifiedHeaders: string = safeStringify(response.headers);
                    return <JSONViewer value={stringifiedHeaders} />;
                  })() : (
                     <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <Typography variant="body1" color="textSecondary">No headers to display.</Typography>
                     </Box>
                  )}
                </TabPanel>
                <TabPanel value={responseTabValue} index={2}>
                  {error && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                      <div className="flex items-center">
                        <div className="w-6 h-6 text-red-400 mr-3">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-red-800 font-medium">{error}</p>
                      </div>
                    </div>
                  )}
                  {response?.error && (
                     <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg mt-4">
                       <div className="flex items-center">
                         <div className="w-6 h-6 text-red-400 mr-3">
                           <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                           </svg>
                         </div>
                         <Typography variant="body2" color="error" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                           {typeof response.error === 'string' ? response.error : safeStringify(response.error)}
                         </Typography>
                       </div>
                     </div>
                  )}
                  {!error && !response?.error && (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <Typography variant="body1" color="textSecondary">No errors to display.</Typography>
                    </Box>
                  )}
                </TabPanel>
              </div>
            </Paper>
          </div>
        </div>

        {showSaveDialog && (
          <SaveQueryDialog
            open={showSaveDialog}
            onClose={() => setShowSaveDialog(false)}
            onSave={handleQuerySaved}
            query={queryInput}
            variables={graphqlVariables}
            environment={selectedEnvironment}
            editingQuery={editingQuery} // Changed from existingQuery to editingQuery
          />
        )}
        {showLibraryDialog && (
          <QueryLibraryDialog
            open={showLibraryDialog}
            onClose={() => setShowLibraryDialog(false)}
            onSelectQuery={handleSelectQuery}
            onRunQuery={handleRunSavedQuery}
            onEditQuery={(query) => {
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
        
        <Snackbar open={copySnackbarOpen} autoHideDuration={3000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={copySnackbarMessage.startsWith('Failed') || copySnackbarMessage.startsWith('No content') ? "error" : "success"} sx={{ width: '100%' }}>
            {copySnackbarMessage}
          </Alert>
        </Snackbar>

      </div>
    </div>
  );
}
