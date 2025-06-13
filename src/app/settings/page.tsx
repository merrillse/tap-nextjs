'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    environment: 'development',
    oktaClientId: '',
    apiEndpoint: 'https://api.dev.example.com/graphql',
    enableAuth: true,
    requestTimeout: 30,
    maxRetries: 3,
    enableLogging: true,
    logLevel: 'info'
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Simulate saving
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings({
      environment: 'development',
      oktaClientId: '',
      apiEndpoint: 'https://api.dev.example.com/graphql',
      enableAuth: true,
      requestTimeout: 30,
      maxRetries: 3,
      enableLogging: true,
      logLevel: 'info'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">Configure your API testing environment and authentication</p>
        </div>

        {/* Success Message */}
        {saved && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-800">Settings saved successfully!</span>
            </div>
          </div>
        )}

        <div className="space-y-8">
          
          {/* Environment Configuration */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Environment Configuration</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Environment
                </label>
                <select
                  value={settings.environment}
                  onChange={(e) => setSettings({...settings, environment: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Select your target environment</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Endpoint
                </label>
                <input
                  type="url"
                  value={settings.apiEndpoint}
                  onChange={(e) => setSettings({...settings, apiEndpoint: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://api.example.com/graphql"
                />
                <p className="text-xs text-gray-500 mt-1">Base URL for API requests</p>
              </div>
            </div>
          </div>

          {/* Authentication Settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Authentication Settings</h2>
            
            <div className="space-y-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableAuth"
                  checked={settings.enableAuth}
                  onChange={(e) => setSettings({...settings, enableAuth: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enableAuth" className="ml-2 block text-sm text-gray-900">
                  Enable Okta Authentication
                </label>
              </div>
              
              {settings.enableAuth && (
                <div className="grid md:grid-cols-1 gap-6 ml-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Okta Client ID
                    </label>
                    <input
                      type="text"
                      value={settings.oktaClientId}
                      onChange={(e) => setSettings({...settings, oktaClientId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your Okta Client ID"
                    />
                    <p className="text-xs text-gray-500 mt-1">Your application's Okta Client ID</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Request Settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Request Settings</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Timeout (seconds)
                </label>
                <input
                  type="number"
                  value={settings.requestTimeout}
                  onChange={(e) => setSettings({...settings, requestTimeout: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="5"
                  max="120"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum time to wait for API response</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Retries
                </label>
                <input
                  type="number"
                  value={settings.maxRetries}
                  onChange={(e) => setSettings({...settings, maxRetries: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="10"
                />
                <p className="text-xs text-gray-500 mt-1">Number of retry attempts for failed requests</p>
              </div>
            </div>
          </div>

          {/* Logging Settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Logging Settings</h2>
            
            <div className="space-y-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableLogging"
                  checked={settings.enableLogging}
                  onChange={(e) => setSettings({...settings, enableLogging: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enableLogging" className="ml-2 block text-sm text-gray-900">
                  Enable Request/Response Logging
                </label>
              </div>
              
              {settings.enableLogging && (
                <div className="ml-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Log Level
                  </label>
                  <select
                    value={settings.logLevel}
                    onChange={(e) => setSettings({...settings, logLevel: e.target.value})}
                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Minimum level for logged messages</p>
                </div>
              )}
            </div>
          </div>

          {/* Environment Presets */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Environment Presets</h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={() => setSettings({...settings, 
                  environment: 'development',
                  apiEndpoint: 'https://api.dev.example.com/graphql',
                  requestTimeout: 30
                })}
                className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-medium text-gray-900">Development</h3>
                <p className="text-sm text-gray-600 mt-1">Default dev environment settings</p>
              </button>
              
              <button
                onClick={() => setSettings({...settings, 
                  environment: 'staging',
                  apiEndpoint: 'https://api.staging.example.com/graphql',
                  requestTimeout: 45
                })}
                className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-medium text-gray-900">Staging</h3>
                <p className="text-sm text-gray-600 mt-1">Pre-production testing environment</p>
              </button>
              
              <button
                onClick={() => setSettings({...settings, 
                  environment: 'production',
                  apiEndpoint: 'https://api.example.com/graphql',
                  requestTimeout: 60
                })}
                className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-medium text-gray-900">Production</h3>
                <p className="text-sm text-gray-600 mt-1">Live production environment</p>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleReset}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
