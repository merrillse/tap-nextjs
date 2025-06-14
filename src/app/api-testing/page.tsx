'use client';

import { useState, useEffect, useMemo } from 'react';
import { getEnvironmentConfig, getEnvironmentNames } from '@/lib/environments';
import { ApiClient } from '@/lib/api-client';
import { safeStringify } from '@/lib/utils';

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
  }, [selectedEnvironment]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">API Testing</h1>
          <p className="mt-2 text-gray-600">Test GraphQL and REST APIs with authentication support</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Request Panel */}
          <div className="space-y-6">
            
            {/* Endpoint Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Endpoint Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Type</label>
                  <div className="flex space-x-4">
                    {['graphql', 'rest'].map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedEndpoint(type);
                          setQueryInput(sampleQueries[type as keyof typeof sampleQueries]);
                        }}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                          selectedEndpoint === type
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Environment</label>
                  <select 
                    value={selectedEnvironment}
                    onChange={(e) => setSelectedEnvironment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {environmentOptions.map(env => (
                      <option key={env.key} value={env.key}>{env.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Query Input */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedEndpoint === 'graphql' ? 'GraphQL Query' : 'REST Request'}
                </h2>
                <button
                  onClick={handleTest}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Test API'}
                </button>
              </div>
              
              <textarea
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder={`Enter your ${selectedEndpoint.toUpperCase()} ${selectedEndpoint === 'graphql' ? 'query' : 'request'} here...`}
              />
            </div>

            {/* Authentication */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Authentication Status</h2>
              {apiClient && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">OAuth Client Configured</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    <p>Client ID: {apiClient.getConfig().client_id}</p>
                    <p>Token URL: {apiClient.getConfig().access_token_url}</p>
                    <p>Scope: {apiClient.getConfig().scope}</p>
                  </div>
                  {apiClient.getCurrentToken() && (
                    <div className="text-xs text-green-600">
                      <p>✓ Access token acquired</p>
                      <p>Expires: {new Date(apiClient.getCurrentToken()!.expires_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Response Panel */}
          <div className="space-y-6">
            
            {/* Response Display */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Response</h2>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
              
              {loading && (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Testing API...</span>
                </div>
              )}
              
              {response && !loading && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      response.status === 200 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {response.status}
                    </span>
                    <span className="text-sm text-gray-600">
                      Execution Time: {response.executionTime}
                    </span>
                  </div>
                  
                  {response.data !== undefined && (
                    <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
                      <code>{safeStringify(response.data)}</code>
                    </pre>
                  )}
                  
                  {response.error && (
                    <div className="bg-red-50 p-4 rounded-md">
                      <p className="text-red-800 text-sm font-medium">Error:</p>
                      <p className="text-red-700 text-sm mt-1">{response.error}</p>
                    </div>
                  )}
                </div>
              )}
              
              {!response && !loading && (
                <div className="text-center py-12 text-gray-500">
                  <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.001 8.001 0 01-7.846-6.284l-1.096-4.88L3.249 8l1.438-.124C5.45 4.73 8.42 2 12 2c4.418 0 8 3.582 8 8z" />
                  </svg>
                  <p>Run a test to see the API response</p>
                </div>
              )}
            </div>

            {/* Response Headers */}
            {response && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Response Information</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={response.status === 200 ? 'text-green-600' : 'text-red-600'}>
                      {response.status} {response.status === 200 ? 'OK' : 'Error'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Content-Type:</span>
                    <span>application/json</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Execution Time:</span>
                    <span>{response.executionTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Timestamp:</span>
                    <span>{new Date(response.timestamp).toLocaleString()}</span>
                  </div>
                  {response.headers && Object.entries(response.headers).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600">{key}:</span>
                      <span>{value as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
