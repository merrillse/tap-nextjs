'use client';

import { useState } from 'react';
import { useApiClient } from '@/hooks/useApiClient';

export default function DebugTestPage() {
  const apiClient = useApiClient('mis-gql-stage');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const runDebugTest = async () => {
    if (!apiClient) {
      setResult('❌ No API client available');
      return;
    }

    setLoading(true);
    setResult('🔄 Running debug test...');

    try {
      console.group('🧪 DEBUG TEST START');
      console.log('✅ This is a test GraphQL request to demonstrate debugging');
      console.log('📋 Check the console for detailed request/response debug information');
      console.groupEnd();

      // Simple test query
      const testQuery = `
        query DebugTest {
          __typename
        }
      `;

      const response = await apiClient.executeGraphQLQuery(testQuery);
      
      if (response.data) {
        setResult('✅ Debug test completed successfully! Check the browser console for detailed debug information.');
      } else if (response.errors) {
        setResult(`⚠️ GraphQL errors: ${response.errors.map((e: any) => e.message).join(', ')}`);
      } else {
        setResult('❓ Unexpected response format');
      }
    } catch (error) {
      console.error('Debug test error:', error);
      setResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🐛 Debug Information Test</h1>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <h2 className="font-bold text-yellow-800">How to See Debug Information:</h2>
          <ul className="mt-2 text-yellow-700 space-y-1">
            <li><strong>1. Debug Panel:</strong> Press <kbd className="bg-yellow-200 px-1 rounded">Ctrl+Shift+D</kbd> or look for the "🐛 Debug" button in the bottom-left corner</li>
            <li><strong>2. Browser Console:</strong> Open DevTools (F12) → Console tab, then click the button below</li>
            <li><strong>3. Network Tab:</strong> Check response headers in DevTools → Network tab</li>
          </ul>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Test GraphQL Request with Debug Logging</h2>
          <p className="text-gray-600 mb-4">
            Click the button below to make a test GraphQL request. Open your browser's console (F12) to see detailed debug information including:
          </p>
          <ul className="text-sm text-gray-600 mb-4 space-y-1">
            <li>• <strong>Client ID:</strong> Your OAuth client identifier</li>
            <li>• <strong>Target URL:</strong> The GraphQL endpoint URL (the "lane")</li>
            <li>• <strong>Environment:</strong> Which environment configuration is active</li>
            <li>• <strong>Request/Response:</strong> Complete request and response details</li>
          </ul>
          
          <button
            onClick={runDebugTest}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '🔄 Running Test...' : '🚀 Run Debug Test'}
          </button>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-50 border rounded">
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
          <h3 className="font-bold text-blue-800">Debug Panel Instructions:</h3>
          <p className="text-blue-700 mt-1">
            The debug panel should appear as a floating panel. If you don't see it:
          </p>
          <ol className="mt-2 text-blue-700 space-y-1 list-decimal list-inside">
            <li>Look for a small "🐛 Debug" button in the bottom-left corner of the screen</li>
            <li>Try pressing <kbd className="bg-blue-200 px-1 rounded">Ctrl+Shift+D</kbd> (or <kbd className="bg-blue-200 px-1 rounded">Cmd+Shift+D</kbd> on Mac)</li>
            <li>Refresh the page if the panel doesn't appear</li>
            <li>Check the browser console for any JavaScript errors</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
