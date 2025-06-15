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
import GraphQLPageHeader from '@/components/GraphQLPageHeader';

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

// Available proxy clients - sorted by name for easy discovery
const proxyClients = [
  { name: 'Primary', clientId: '0oak0jqakvevwjWrp357' },
  { name: 'CCDOPS - Church Calendar', clientId: '0oa17jzhwi9uusIoz358' },
  { name: 'CCDOPS - Church Calendar [non-prod]', clientId: '0oaki3kbszeewJmMX357' },
  { name: 'CCDOPS - Church Calendar [PROD]', clientId: '0oaki3swtbO6fOZ9x357' },
  { name: 'CES', clientId: '0oa16arpkjgDezdcI358' },
  { name: 'CMIS Authorization Service', clientId: '0oao4ayxo9fgtnKYj357' },
  { name: 'CMIS Callings', clientId: '0oa1joivv92SShYCD358' },
  { name: 'CMIS Services Team', clientId: '0oan0z1efagK9cXWu357' },
  { name: 'DMBA Group [non-prod]', clientId: '0oan1043xxD4cTtoU357' },
  { name: 'DMBA Group [PROD]', clientId: '0oan1036pnukfeJSi357' },
  { name: 'EDUINT - Education Integrations', clientId: '0oagzh13nq0zK7c5I357' },
  { name: 'English Connect', clientId: '0oaixehfyryjaiS7M357' },
  { name: 'GVM Travel [non-prod]', clientId: '0oartjtss42ayIfJl357' },
  { name: 'GVM Travel [PROD]', clientId: '0oartjm5nguKZFN2c357' },
  { name: 'HR:MSR:Emergency Contact', clientId: '0oavpvglc1wJ9hVKv357' },
  { name: 'Identity', clientId: '0oa1099z1t0ZRaFwP358' },
  { name: 'ISR - Non-prod', clientId: '0oaqbq6isq9sDyIdx357' },
  { name: 'ISR - Prod', clientId: '0oapmoioz2z64riCE357' },
  { name: 'LCR [non-prod]', clientId: '0oalni75ar2LGLtVR357' },
  { name: 'LCR [PROD]', clientId: '0oalni7s7aEWlSTHQ357' },
  { name: 'Maps Service', clientId: '0oajrl8w5aVKhlkgq357' },
  { name: 'MBI', clientId: 'MBI' },
  { name: 'Member Tools', clientId: '0oakhtcbhyLVVeYFj357' },
  { name: 'Missionary Areabook [non-prod]', clientId: '0oasw5r8hmlOJ5GG0357' },
  { name: 'Missionary Areabook [PROD]', clientId: '0oasw6uegahMJ8N9Y357' },
  { name: 'Missionary Connect [non-prod]', clientId: '0oap88us4pbRI1HX3357' },
  { name: 'Missionary Connect [PROD]', clientId: '0oap88ozbhEr8UKIQ357' },
  { name: 'Missionary Graph Service Team', clientId: '0oak0jqakvevwjWrp357' },
  { name: 'Missionary History [non-prod]', clientId: '0oartk3ix1S0lvthA357' },
  { name: 'Missionary History [PROD]', clientId: '0oartjyikqPqM5LZm357' },
  { name: 'Missionary Portal [non-prod]', clientId: '0oa1gg8qdjlQh49GY358' },
  { name: 'Missionary Portal [PROD]', clientId: '0oa1gg90u4erOhnH2358' },
  { name: 'Missionary WORKS [non-prod]', clientId: '0oaoywrjdh16anAjm357' },
  { name: 'Missionary WORKS [PROD]', clientId: '0oaoypfnvzf56iHqv357' },
  { name: 'MTC Tech [non-prod]', clientId: '0oan0z7opvD8AseBb357' },
  { name: 'MTC Tech [PROD]', clientId: '0oan0z9i7ax38R7Tx357' },
  { name: 'Pathway Anthology [non-prod]', clientId: '0oa10ty566kw1iqcC358' },
  { name: 'Pathway Anthology [PROD]', clientId: '0oa18avadd4EBvHhP358' },
  { name: 'QuickReg [non-prod]', clientId: '0oavlgns0tNH0dvXb357' },
  { name: 'QuickReg [PROD]', clientId: '0oaxn76jai315m4i5357' },
  { name: 'RISK-MDQ', clientId: '0oa11ext3xoSIlS9S358' },
  { name: 'ServiceNow & Missionary Integration', clientId: '0oa1iwzkz1dcZvAIL358' },
  { name: 'TallEmbark', clientId: '0oa11j79yw80Y9jwj358' },
  { name: 'WAS - Ward Activity Sharing [non-prod]', clientId: '0oa1dfokrc9S2D5aO358' },
  { name: 'WAS - Ward Activity Sharing [PROD]', clientId: '0oa19kxjttvFItg3y358' },
  { name: 'Ward Directory & Map', clientId: '0oamyits9uliqoOn7357' },
  { name: 'WSR', clientId: '0oa1gs5l1prHsbDUc358' },
].sort((a, b) => a.name.localeCompare(b.name));

export default function APITestingPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('graphql');
  const [selectedEnvironment, setSelectedEnvironment] = useState('mis-gql-stage');
  const [selectedProxyClient, setSelectedProxyClient] = useState('0oak0jqakvevwjWrp357'); // Default to primary
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

  // State for sent request details
  const [sentRequestBody, setSentRequestBody] = useState<string | null>(null);
  const [sentRequestHeaders, setSentRequestHeaders] = useState<Record<string, string> | null>(null);

  const handleResponseTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setResponseTabValue(newValue);
  };

  const handleEnvironmentChange = (event: SelectChangeEvent) => {
    setSelectedEnvironment(event.target.value);
  };

  const handleProxyClientChange = (clientId: string) => {
    setSelectedProxyClient(clientId);
    localStorage.setItem('selectedProxyClient', clientId);
  };

  const environmentOptions = getEnvironmentNames();

  // Load saved environment on component mount
  useEffect(() => {
    const savedEnv = localStorage.getItem('selectedEnvironment') || 'mis-gql-stage';
    setSelectedEnvironment(savedEnv);

    const savedProxyClient = localStorage.getItem('selectedProxyClient') || '0oak0jqakvevwjWrp357';
    setSelectedProxyClient(savedProxyClient);

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

  // Manual refresh schema function
  const refreshSchema = async () => {
    if (!apiClient) return;
    
    try {
      console.log('Refreshing schema...');
      const schemaResult = await apiClient.executeGraphQLQuery(INTROSPECTION_QUERY, {});
      setSchema(schemaResult as IntrospectionResult);
      console.log('Schema refreshed successfully');
    } catch (err) {
      console.warn('Failed to refresh schema:', err);
    }
  };

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
        
        // Capture request details before sending
        const requestDetailsToStore = {
          query: queryInput,
          variables: parsedVariables,
        };
        setSentRequestBody(safeStringify(requestDetailsToStore));
        setSentRequestHeaders(parsedHeaders as Record<string, string>);

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
      
      {/* Enhanced Header (conditionally hidden in fullscreen) */}
      {!isResponsePanelFullscreen && (
        <GraphQLPageHeader
          title="GraphQL Testing Platform"
          description="Execute GraphQL queries with real-time authentication and schema validation for both MGQL and MOGS systems"
          icon={
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          }
          selectedEnvironment={selectedEnvironment}
          environmentOptions={environmentOptions}
          onEnvironmentChange={handleEnvironmentChange}
          selectedProxyClient={selectedProxyClient}
          proxyClients={proxyClients}
          onProxyClientChange={handleProxyClientChange}
          onRefresh={refreshSchema}
          additionalInfo={schema ? 'Schema loaded for autocomplete' : 'Schema not loaded'}
        />
      )}
      
      <div className={`max-w-full mx-auto px-6 py-6 ${isResponsePanelFullscreen ? 'h-screen flex flex-col' : ''}`}>

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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
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
              
              {/* Sent Request Details Viewer */}
              {sentRequestBody && sentRequestHeaders && (
                <Accordion sx={{ borderRadius: '1rem', boxShadow: 'lg', border: '1px solid rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)' }} defaultExpanded={false}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="sent-request-content" id="sent-request-header" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle1" fontWeight="medium">Sent Request Details</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="overline" display="block" gutterBottom sx={{ color: 'text.secondary' }}>
                        Request Body
                      </Typography>
                      <Paper elevation={0} sx={{ p: 1.5, borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.03)'}}>
                        <JSONViewer value={sentRequestBody} />
                      </Paper>
                    </Box>
                    <Box>
                      <Typography variant="overline" display="block" gutterBottom sx={{ color: 'text.secondary' }}>
                        Request Headers
                      </Typography>
                      <Paper elevation={0} sx={{ p: 1.5, borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.03)'}}>
                        <JSONViewer value={safeStringify(sentRequestHeaders)} />
                      </Paper>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}
              
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
