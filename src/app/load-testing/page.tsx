'use client';

import { useState } from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';

export default function LoadTestingPage() {
  const [isRunning, setIsRunning] = useState(false);
  const handleEndpointChange = (event: SelectChangeEvent) => {
    setTestConfig({...testConfig, endpoint: event.target.value});
  };
  const [testResults, setTestResults] = useState<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    throughput: number;
    testDuration: number;
    timestamps: Array<{
      time: number;
      responseTime: number;
      rps: number;
      errors: number;
    }>;
  } | null>(null);
  const [testConfig, setTestConfig] = useState({
    concurrentUsers: 10,
    duration: 60,
    rampUp: 10,
    endpoint: 'graphql'
  });

  const handleStartTest = async () => {
    setIsRunning(true);
    setTestResults(null);
    
    // Simulate load test
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const mockResults = {
      totalRequests: 1250,
      successfulRequests: 1235,
      failedRequests: 15,
      averageResponseTime: 245,
      minResponseTime: 89,
      maxResponseTime: 1250,
      requestsPerSecond: 20.8,
      errorRate: 1.2,
      throughput: 145.6,
      testDuration: testConfig.duration,
      timestamps: Array.from({length: 12}, (_, i) => ({
        time: i * 5,
        responseTime: Math.floor(Math.random() * 300) + 150,
        rps: Math.floor(Math.random() * 25) + 15,
        errors: Math.floor(Math.random() * 5)
      }))
    };
    
    setTestResults(mockResults);
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Load Testing</h1>
          <p className="mt-2 text-gray-600">Simulate concurrent requests to test API performance</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Test Configuration</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Concurrent Users
                  </label>
                  <input
                    type="number"
                    value={testConfig.concurrentUsers}
                    onChange={(e) => setTestConfig({...testConfig, concurrentUsers: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of simultaneous users (1-100)</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={testConfig.duration}
                    onChange={(e) => setTestConfig({...testConfig, duration: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="10"
                    max="300"
                  />
                  <p className="text-xs text-gray-500 mt-1">How long to run the test (10-300s)</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ramp-up Time (seconds)
                  </label>
                  <input
                    type="number"
                    value={testConfig.rampUp}
                    onChange={(e) => setTestConfig({...testConfig, rampUp: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="60"
                  />
                  <p className="text-xs text-gray-500 mt-1">Time to reach full user load</p>
                </div>
                
                <div>
                  <FormControl fullWidth>
                    <InputLabel id="endpoint-select-label">Target Endpoint</InputLabel>
                    <Select
                      labelId="endpoint-select-label"
                      value={testConfig.endpoint}
                      label="Target Endpoint"
                      onChange={handleEndpointChange}
                    >
                      <MenuItem value="graphql">GraphQL - Missionary Query</MenuItem>
                      <MenuItem value="rest">REST - Missionary API</MenuItem>
                    </Select>
                  </FormControl>
                </div>
                
                <button
                  onClick={handleStartTest}
                  disabled={isRunning}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRunning ? 'Running Test...' : 'Start Load Test'}
                </button>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            
            {/* Running Test Indicator */}
            {isRunning && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600 mr-3"></div>
                  <div>
                    <h3 className="text-lg font-medium text-yellow-800">Load Test in Progress</h3>
                    <p className="text-yellow-700">Testing with {testConfig.concurrentUsers} concurrent users...</p>
                  </div>
                </div>
                <div className="mt-4 bg-yellow-200 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                </div>
              </div>
            )}

            {/* Results Summary */}
            {testResults && (
              <div className="space-y-6">
                
                {/* Key Metrics */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="text-2xl font-bold text-blue-600">{testResults.totalRequests}</div>
                    <div className="text-sm text-gray-600">Total Requests</div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="text-2xl font-bold text-green-600">{testResults.averageResponseTime}ms</div>
                    <div className="text-sm text-gray-600">Avg Response Time</div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="text-2xl font-bold text-purple-600">{testResults.requestsPerSecond}</div>
                    <div className="text-sm text-gray-600">Requests/Second</div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="text-2xl font-bold text-red-600">{testResults.errorRate}%</div>
                    <div className="text-sm text-gray-600">Error Rate</div>
                  </div>
                </div>

                {/* Detailed Results */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results Summary</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Requests:</span>
                        <span className="font-medium">{testResults.totalRequests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Successful:</span>
                        <span className="font-medium text-green-600">{testResults.successfulRequests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Failed:</span>
                        <span className="font-medium text-red-600">{testResults.failedRequests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Test Duration:</span>
                        <span className="font-medium">{testResults.testDuration}s</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Min Response Time:</span>
                        <span className="font-medium">{testResults.minResponseTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Response Time:</span>
                        <span className="font-medium">{testResults.maxResponseTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Throughput:</span>
                        <span className="font-medium">{testResults.throughput} KB/s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Success Rate:</span>
                        <span className="font-medium text-green-600">{(100 - testResults.errorRate).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Chart */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Over Time</h3>
                  <div className="h-64 flex items-end space-x-2">
                    {testResults.timestamps.map((point, index: number) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-blue-500 rounded-t"
                          style={{height: `${(point.responseTime / testResults.maxResponseTime) * 200}px`}}
                        ></div>
                        <div className="text-xs text-gray-500 mt-1">{point.time}s</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-sm text-gray-600 text-center">
                    Response Time (ms) over Test Duration
                  </div>
                </div>
              </div>
            )}

            {/* No Results State */}
            {!testResults && !isRunning && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Results</h3>
                <p className="text-gray-600">Configure your test parameters and start a load test to see performance metrics.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
