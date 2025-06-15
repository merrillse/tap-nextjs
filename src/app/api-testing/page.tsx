'use client';

import { useState, useEffect, useMemo } from 'react';
import { getEnvironmentConfig, getEnvironmentNames } from '@/lib/environments';
import { ApiClient } from '@/lib/api-client';
import { safeStringify } from '@/lib/utils';
import { RandomQueryGenerator, INTROSPECTION_QUERY, type IntrospectionResult } from '@/lib/random-query-generator';
import { type SavedQuery } from '@/lib/query-library';
import { SaveQueryDialog, QueryLibraryDialog } from '@/components/QueryLibraryDialog';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography, Button } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { JSONViewer } from '@/components/CodeEditor';
import { EnhancedGraphQLEditor } from '@/components/EnhancedGraphQLEditor';

export default function APITestingPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('graphql');
  const [selectedEnvironment, setSelectedEnvironment] = useState('mis-gql-stage');
  const [queryInput, setQueryInput] = useState('');
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

  const handleEnvironmentChange = (event: SelectChangeEvent) => {
    setSelectedEnvironment(event.target.value);
  };

  const environmentOptions = getEnvironmentNames();

  // Load saved environment on component mount
  useEffect(() => {
    const savedEnv = localStorage.getItem('selectedEnvironment') || 'mis-gql-stage';
    setSelectedEnvironment(savedEnv);
  }, []);

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
}`,
    rest: `GET /api/missionaries/916793
Authorization: Bearer <token>
Content-Type: application/json`
  }), []);

  // Set initial query
  useEffect(() => {
    if (!queryInput) {
      setQueryInput(sampleQueries[selectedEndpoint as keyof typeof sampleQueries]);
    }
  }, [selectedEndpoint, queryInput, sampleQueries]);

  const handleTest = async () => {
    if (!apiClient) {
      setError('API client not initialized. Please select an environment.');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);
    
    const startTime = Date.now();
    
    try {
      if (selectedEndpoint === 'graphql') {
        // Parse GraphQL query to extract variables
        const variables = { missionaryNumber: "916793" }; // Default for demo
        
        const result = await apiClient.executeGraphQLQuery(queryInput, variables);
        const executionTime = Date.now() - startTime;
        
        setResponse({
          status: 200,
          data: result.data,
          executionTime: `${executionTime}ms`,
          timestamp: new Date().toISOString(),
          headers: {
            'content-type': 'application/json',
            'cache-control': 'no-cache'
          }
        });
      } else {
        // REST endpoint not implemented yet
        throw new Error('REST endpoint testing not yet implemented');
      }
    } catch (err) {
      console.error('API Test Error:', err);
      const executionTime = Date.now() - startTime;
      
      setError(err instanceof Error ? err.message : 'An error occurred during testing');
      
      // Show mock response in case of error for demonstration
      const mockResponse = {
        status: 500,
        error: err instanceof Error ? err.message : 'Unknown error',
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString()
      };
      
      setResponse(mockResponse);
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
      // First, get the schema if we don't have it
      let currentSchema = schema;
      if (!currentSchema) {
        console.log('Fetching schema...');
        const schemaResult = await apiClient.executeGraphQLQuery(INTROSPECTION_QUERY, {});
        currentSchema = schemaResult as IntrospectionResult;
        setSchema(currentSchema);
      }

      // Generate random query
      const generator = new RandomQueryGenerator(currentSchema);
      const randomQuery = generator.generateRandomQuery();
      
      setQueryInput(randomQuery);
      
    } catch (err) {
      console.error('Random query generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate random query');
    } finally {
      setGeneratingQuery(false);
    }
  };

  const handleSaveQuery = () => {
    if (!queryInput.trim()) {
      setError('No query to save');
      return;
    }
    setEditingQuery(null);
    setShowSaveDialog(true);
  };

  const handleQuerySaved = (savedQuery: SavedQuery) => {
    // Query saved successfully, could show a toast notification here
    console.log('Query saved:', savedQuery.name);
  };

  const handleSelectQuery = (query: SavedQuery) => {
    setQueryInput(query.query);
    setShowLibraryDialog(false);
    
    // If query is for a different environment, optionally switch
    if (query.environment !== selectedEnvironment) {
      const switchEnv = confirm(
        `This query was saved for environment "${query.environment}". 
        Would you like to switch to that environment?`
      );
      if (switchEnv) {
        setSelectedEnvironment(query.environment);
      }
    }
  };

  const handleRunSavedQuery = async (query: SavedQuery) => {
    // Load the query and run it immediately
    setQueryInput(query.query);
    setShowLibraryDialog(false);
    
    // Switch environment if needed
    if (query.environment !== selectedEnvironment) {
      setSelectedEnvironment(query.environment);
      // Wait a moment for the environment to switch and API client to update
      setTimeout(() => {
        handleTest();
      }, 100);
    } else {
      handleTest();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-full mx-auto px-6 py-6">
        
        {/* Enhanced Header with Gradient */}
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

        {/* Main Content Grid - Full Width Side by Side */}
        <div className="grid lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
          
          {/* Request Panel - Left Side */}
          <div className="flex flex-col space-y-6">
            
            {/* Query Editor with Enhanced Header */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 flex flex-col flex-grow overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">GraphQL Query Editor</h2>
                      <p className="text-white/80 text-sm">Build and test your GraphQL queries</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="contained"
                      onClick={handleTest}
                      disabled={loading}
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        minWidth: 120,
                        fontWeight: 'bold',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&:disabled': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'rgba(255, 255, 255, 0.6)',
                        }
                      }}
                      startIcon={loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z" />
                        </svg>
                      )}
                    >
                      {loading ? 'Executing...' : 'Execute Query'}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex-grow p-0">
                <EnhancedGraphQLEditor
                  value={queryInput}
                  onChange={setQueryInput}
                  placeholder="Enter your GraphQL query here..."
                  schema={schema}
                  height="100%"
                  onGenerateRandomQuery={handleGenerateRandomQuery}
                  isGeneratingQuery={generatingQuery}
                  onSaveQuery={selectedEndpoint === 'graphql' ? handleSaveQuery : undefined}
                  onShowLibrary={selectedEndpoint === 'graphql' ? () => setShowLibraryDialog(true) : undefined}
                  canSaveQuery={selectedEndpoint === 'graphql' && queryInput.trim().length > 0}
                />
              </div>
            </div>

            {/* Authentication Status - Compact Card */}
            {apiClient && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4">
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
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-600">Connected</span>
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
              </div>
            )}
          </div>

          {/* Response Panel - Right Side */}
          <div className="flex flex-col space-y-6">
            
            {/* Response Display with Enhanced Header */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 flex flex-col flex-grow overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">API Response</h2>
                      <p className="text-white/80 text-sm">Real-time query results and diagnostics</p>
                    </div>
                  </div>
                  
                  {response && (
                    <div className="flex items-center space-x-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                        response.status === 200 
                          ? 'bg-green-400/20 text-green-100 border border-green-300/30' 
                          : 'bg-red-400/20 text-red-100 border border-red-300/30'
                      }`}>
                        {response.status} {response.status === 200 ? 'SUCCESS' : 'ERROR'}
                      </div>
                      <div className="text-white/90 text-sm font-medium">
                        ⚡ {response.executionTime}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-grow p-6 overflow-auto">
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
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
                
                {loading && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-600 rounded-full animate-spin animation-delay-75"></div>
                    </div>
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Executing Query...</h3>
                      <p className="text-gray-600">Processing GraphQL request with authentication</p>
                      <div className="flex items-center justify-center mt-4 space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce animation-delay-100"></div>
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce animation-delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
                
                {response && !loading && (
                  <div className="space-y-6">
                    {response.data !== undefined && (
                      <div className="bg-gray-50 rounded-xl p-1">
                        <JSONViewer
                          value={safeStringify(response.data)}
                          label="Response Data"
                        />
                      </div>
                    )}
                    
                    {response.error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center mb-2">
                          <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h4 className="text-red-800 font-semibold">GraphQL Error</h4>
                        </div>
                        <p className="text-red-700 text-sm leading-relaxed">{response.error}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {!response && !loading && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.001 8.001 0 01-7.846-6.284l-1.096-4.88L3.249 8l1.438-.124C5.45 4.73 8.42 2 12 2c4.418 0 8 3.582 8 8z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Execute</h3>
                    <p className="text-gray-600 max-w-sm">Write your GraphQL query in the editor and click "Execute Query" to see the results here.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Response Metadata - Enhanced */}
            {response && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Response Metadata
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status Code</div>
                    <div className={`text-lg font-bold ${response.status === 200 ? 'text-green-600' : 'text-red-600'}`}>
                      {response.status} {response.status === 200 ? 'OK' : 'Error'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Execution Time</div>
                    <div className="text-lg font-bold text-blue-600">{response.executionTime}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Content Type</div>
                    <div className="text-sm font-medium text-gray-900">application/json</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Timestamp</div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(response.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                {response.headers && Object.keys(response.headers).length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Response Headers</h4>
                    <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
                      {Object.entries(response.headers).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600 font-medium">{key}:</span>
                          <span className="text-gray-900">{value as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Query Library Dialogs */}
      <SaveQueryDialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleQuerySaved}
        queryString={queryInput}
        environment={selectedEnvironment}
        editingQuery={editingQuery}
      />

      <QueryLibraryDialog
        open={showLibraryDialog}
        onClose={() => setShowLibraryDialog(false)}
        onSelectQuery={handleSelectQuery}
        onRunQuery={handleRunSavedQuery}
        currentEnvironment={selectedEnvironment}
      />
    </div>
  );
}
