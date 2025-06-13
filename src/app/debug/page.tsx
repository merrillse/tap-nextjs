'use client';

import { useState } from 'react';
import { getEnvironmentConfig } from '@/lib/environments';
import { ApiClient } from '@/lib/api-client';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  details?: string;
}

export default function DebugPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    setTestResults([]);
    
    const config = getEnvironmentConfig('mis-gql-stage');
    if (!config) {
      setTestResults([{ test: 'Config', status: 'FAIL', message: 'No config found' }]);
      setTesting(false);
      return;
    }

    const results: TestResult[] = [];

    // Run comprehensive OAuth tests
    try {
      const response = await fetch('/api/oauth/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token_url: config.access_token_url,
          client_id: config.client_id,
          client_secret: config.client_secret,
          scope: config.scope,
        }),
      });

      const testData = await response.json();
      
      if (response.ok && testData.results) {
        testData.results.forEach((result: any) => {
          results.push({
            test: result.method,
            status: result.success ? 'PASS' : 'FAIL',
            message: result.success ? 
              `Status: ${result.status} - Token acquired` : 
              `Status: ${result.status} - ${result.statusText}`,
            details: JSON.stringify({
              status: result.status,
              headers: result.headers,
              body: result.body,
              error: result.error
            }, null, 2)
          });
        });

        // Add summary
        results.push({
          test: 'Test Summary',
          status: testData.summary.successful > 0 ? 'PASS' : 'FAIL',
          message: `${testData.summary.successful}/${testData.summary.total_tests} tests passed`,
          details: JSON.stringify(testData.summary, null, 2)
        });
      } else {
        results.push({
          test: 'OAuth Test Suite',
          status: 'FAIL',
          message: 'Failed to run comprehensive tests',
          details: JSON.stringify(testData, null, 2)
        });
      }
    } catch (error) {
      results.push({
        test: 'OAuth Test Suite',
        status: 'FAIL',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test GraphQL endpoint with detailed logging
    try {
      // First get a token
      const tokenResponse = await fetch('/api/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token_url: config.access_token_url,
          client_id: config.client_id,
          client_secret: config.client_secret,
          scope: config.scope,
          method: 'basic'
        }),
      });

      if (!tokenResponse.ok) {
        results.push({
          test: 'GraphQL Schema Query',
          status: 'FAIL',
          message: 'Failed to get OAuth token for GraphQL test',
          details: await tokenResponse.text()
        });
      } else {
        const tokenData = await tokenResponse.json();
        
        // Now test GraphQL with the token
        const graphqlResponse = await fetch('/api/graphql/proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: 'query { __schema { queryType { name } } }',
            access_token: tokenData.access_token
          }),
        });

        const graphqlData = await graphqlResponse.json();
        results.push({
          test: 'GraphQL Schema Query',
          status: graphqlResponse.ok && graphqlData.data ? 'PASS' : 'FAIL',
          message: graphqlResponse.ok && graphqlData.data ? 
            'GraphQL schema query successful' : 
            `GraphQL query failed: ${graphqlResponse.status}`,
          details: JSON.stringify(graphqlData, null, 2)
        });
      }
    } catch (error) {
      results.push({
        test: 'GraphQL Schema Query',
        status: 'FAIL',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test GraphQL endpoint connectivity via proxy (no direct CORS request)
    try {
      // Use ApiClient which now uses the cleaner proxy approach
      const apiClient = new ApiClient(config);
      const result = await apiClient.executeGraphQLQuery('query { __schema { queryType { name } } }');
      
      results.push({
        test: 'GraphQL via ApiClient',
        status: result.data ? 'PASS' : 'FAIL',
        message: result.data ? 
          'GraphQL endpoint accessible via ApiClient' : 
          'GraphQL query returned no data',
        details: JSON.stringify(result, null, 2)
      });
    } catch (error) {
      results.push({
        test: 'GraphQL via ApiClient',
        status: 'FAIL',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test health endpoint via server proxy
    try {
      const response = await fetch('/api/health/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          health_url: config.health_url
        }),
      });

      const healthData = await response.json();
      results.push({
        test: 'Health Check via Proxy',
        status: response.ok && healthData.success ? 'PASS' : 'FAIL',
        message: response.ok && healthData.success ? 
          `Status: ${healthData.status} - Service healthy` : 
          `Health check failed: ${healthData.error}`,
        details: JSON.stringify(healthData, null, 2)
      });
    } catch (error) {
      results.push({
        test: 'Health Check via Proxy',
        status: 'FAIL',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    setTestResults(results);
    setTesting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">OAuth Debug Tool</h1>
          <p className="mt-2 text-gray-600">
            Comprehensive OAuth authentication debugging for MIS GraphQL Staging
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>OAuth Endpoint:</strong><br />
              <code className="text-xs bg-gray-100 p-1 rounded">
                {getEnvironmentConfig('mis-gql-stage')?.access_token_url}
              </code>
            </div>
            <div>
              <strong>GraphQL Endpoint:</strong><br />
              <code className="text-xs bg-gray-100 p-1 rounded">
                {getEnvironmentConfig('mis-gql-stage')?.graph_url}
              </code>
            </div>
            <div>
              <strong>Client ID:</strong><br />
              <code className="text-xs bg-gray-100 p-1 rounded">
                {getEnvironmentConfig('mis-gql-stage')?.client_id.substring(0, 8)}...
              </code>
            </div>
            <div>
              <strong>Scope:</strong><br />
              <code className="text-xs bg-gray-100 p-1 rounded">
                {getEnvironmentConfig('mis-gql-stage')?.scope}
              </code>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <button
            onClick={runTests}
            disabled={testing}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? 'Running Tests...' : 'Run Comprehensive OAuth Tests'}
          </button>
          <p className="mt-2 text-sm text-gray-600">
            This will test multiple OAuth authentication methods and endpoints
          </p>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Test Results</h2>
            {testResults.map((result, index) => (
              <div key={index} className={`p-6 rounded-lg border ${
                result.status === 'PASS' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{result.test}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.status === 'PASS' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.status}
                  </span>
                </div>
                <p className="text-gray-700 mb-3">{result.message}</p>
                {result.details && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
                      Show Details
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto max-h-96">
                      {result.details}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        {testResults.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Next Steps</h3>
            <div className="text-blue-800">
              <p className="mb-2">Based on the test results:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>If all tests fail with 403: Check if client credentials are correct</li>
                <li>If tests fail with CORS: Server-side proxy should handle this</li>
                <li>If Basic Auth passes: Use that method for production</li>
                <li>If Form Auth passes: Alternative method available</li>
                <li>If health check fails: Check if the MIS service is running</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
