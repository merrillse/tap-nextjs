'use client';

import { useState, useEffect } from 'react';
import { ENVIRONMENTS, getEnvironmentConfig, getEnvironmentNames, EnvironmentConfig } from '@/lib/environments';
import { safeStringify } from '@/lib/utils';

export default function SettingsPage() {
  const [selectedEnvKey, setSelectedEnvKey] = useState('mis-gql-stage');
  const [currentConfig, setCurrentConfig] = useState<EnvironmentConfig | null>(null);
  const [settings, setSettings] = useState({
    environment: 'mis-gql-stage',
    requestTimeout: 30,
    maxRetries: 3,
    enableLogging: true,
    logLevel: 'info'
  });

  const [saved, setSaved] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    status: string;
    error?: string;
    data?: Record<string, unknown>;
  } | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  useEffect(() => {
    const config = getEnvironmentConfig(selectedEnvKey);
    setCurrentConfig(config);
    setSettings(prev => ({ ...prev, environment: selectedEnvKey }));
  }, [selectedEnvKey]);

  // Load saved environment on component mount
  useEffect(() => {
    const savedEnv = localStorage.getItem('selectedEnvironment') || 'mis-gql-stage';
    const savedSettings = localStorage.getItem('tap-settings');
    
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        setSelectedEnvKey(parsed.environment || savedEnv);
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
        setSelectedEnvKey(savedEnv);
      }
    } else {
      setSelectedEnvKey(savedEnv);
    }
  }, []);

  const handleSave = () => {
    // Save to localStorage or your preferred storage
    localStorage.setItem('tap-settings', JSON.stringify(settings));
    localStorage.setItem('selectedEnvironment', selectedEnvKey);
    // Dispatch custom event to update indicator
    window.dispatchEvent(new Event('environmentChanged'));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings({
      environment: 'mis-gql-stage',
      requestTimeout: 30,
      maxRetries: 3,
      enableLogging: true,
      logLevel: 'info'
    });
    setSelectedEnvKey('mis-gql-stage');
  };

  const checkHealth = async () => {
    if (!currentConfig) return;
    
    setCheckingHealth(true);
    try {
      const response = await fetch('/api/health/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          health_url: currentConfig.health_url
        }),
      });

      const healthData = await response.json();

      if (response.ok && healthData.success) {
        setHealthStatus({ status: 'UP', data: healthData.data });
      } else {
        setHealthStatus({ 
          status: 'DOWN', 
          error: healthData.error || `HTTP ${healthData.status}: ${healthData.statusText}` 
        });
      }
    } catch (error) {
      setHealthStatus({ 
        status: 'DOWN', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
    setCheckingHealth(false);
  };

  const environmentOptions = getEnvironmentNames();

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
          
          {/* Environment Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Environment Selection</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Environment
                </label>
                <select
                  value={selectedEnvKey}
                  onChange={(e) => setSelectedEnvKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {environmentOptions.map(env => (
                    <option key={env.key} value={env.key}>{env.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Select your target environment</p>
              </div>
              
              <div className="flex flex-col justify-end">
                <button
                  onClick={checkHealth}
                  disabled={checkingHealth || !currentConfig}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingHealth ? 'Checking...' : 'Check Health'}
                </button>
              </div>
            </div>

            {/* Health Status */}
            {healthStatus && (
              <div className={`mt-4 p-4 rounded-lg ${
                healthStatus.status === 'UP' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    healthStatus.status === 'UP' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className={`font-medium ${
                    healthStatus.status === 'UP' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {healthStatus.status === 'UP' ? 'Service is healthy' : 'Service is down'}
                  </span>
                </div>
                {healthStatus.error && (
                  <p className="text-red-700 mt-2 text-sm">{healthStatus.error}</p>
                )}
                {healthStatus.data !== undefined && (
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {safeStringify(healthStatus.data)}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Current Environment Configuration Display */}
          {currentConfig && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Current Environment Configuration</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">GraphQL Endpoint</label>
                  <p className="mt-1 text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded break-all">
                    {currentConfig.graph_url}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Health Check URL</label>
                  <p className="mt-1 text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded break-all">
                    {currentConfig.health_url}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">OAuth Token URL</label>
                  <p className="mt-1 text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded break-all">
                    {currentConfig.access_token_url}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Client ID</label>
                  <p className="mt-1 text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded">
                    {currentConfig.client_id || 'Not configured'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Scope</label>
                  <p className="mt-1 text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded">
                    {currentConfig.scope}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Client Secret</label>
                  <p className="mt-1 text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded">
                    🔒 Configured server-side
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Client secrets are managed securely via environment variables
                  </p>
                </div>
              </div>
            </div>
          )}

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

          {/* Environment Quick Switch */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Environment Switch</h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              {environmentOptions.map((env) => (
                <button
                  key={env.key}
                  onClick={() => setSelectedEnvKey(env.key)}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    selectedEnvKey === env.key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <h3 className="font-medium text-gray-900">{env.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {ENVIRONMENTS[env.key].domain}
                  </p>
                  {selectedEnvKey === env.key && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Active
                      </span>
                    </div>
                  )}
                </button>
              ))}
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
