'use client';

import { useState } from 'react';

export default function APITestingPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('graphql');
  const [queryInput, setQueryInput] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const sampleQueries = {
    graphql: `query Missionary($missionaryNumber: ID = "163385") {
  missionary(missionaryId: $missionaryNumber) {
    latinFirstName
    latinLastName
    missionaryNumber
    missionaryStatus {
      value
      label
    }
    assignments {
      componentName
      mission {
        name
      }
    }
  }
}`,
    rest: `GET /api/missionaries/163385
Authorization: Bearer <token>
Content-Type: application/json`
  };

  const handleTest = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockResponse = {
      status: 200,
      data: {
        missionary: {
          latinFirstName: "John",
          latinLastName: "Smith",
          missionaryNumber: "163385",
          missionaryStatus: {
            value: "ACTIVE",
            label: "Active"
          }
        }
      },
      executionTime: "245ms",
      timestamp: new Date().toISOString()
    };
    
    setResponse(mockResponse);
    setLoading(false);
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
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Development</option>
                    <option>Staging</option>
                    <option>Production</option>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Authentication</h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="auth" className="rounded" defaultChecked />
                  <label htmlFor="auth" className="text-sm text-gray-700">Enable Okta Authentication</label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client ID</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter Okta Client ID..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">JWT Token</label>
                  <textarea
                    className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                    placeholder="Paste JWT token here..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Response Panel */}
          <div className="space-y-6">
            
            {/* Response Display */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Response</h2>
              
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
                  
                  <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
                    <code>{JSON.stringify(response.data, null, 2)}</code>
                  </pre>
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
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Response Headers</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Content-Type:</span>
                    <span>application/json</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cache-Control:</span>
                    <span>no-cache</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Server:</span>
                    <span>nginx/1.18.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Timestamp:</span>
                    <span>{new Date(response.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
