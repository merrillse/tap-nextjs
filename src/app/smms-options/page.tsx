'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

interface SmmsOptions {
  assignmentApprovalStates: string[];
  assignmentStatuses: string[];
  assignmentTypes: string[];
  opportunityStatuses: string[];
  opportunityTypeStatuses: string[];
  serviceTypes: string[];
}

interface SearchHistory {
  id: string;
  timestamp: Date;
  resultFound: boolean;
  optionsCount: number;
}

export default function SmmsOptionsPage() {
  const [options, setOptions] = useState<SmmsOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState('development');
  
  // Filter and display state
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Utility functions
  const exportToJson = () => {
    if (!options) return;
    
    const exportData = {
      smmsOptions: options,
      timestamp: new Date().toISOString(),
      totalOptionsCount: getTotalOptionsCount(),
      filteredOptionsCount: getFilteredOptionsCount()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `smms-options-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const clearSearch = () => {
    setOptions(null);
    setError(null);
    setSearchFilter('');
    setSelectedCategory('all');
    setSortOrder('asc');
  };

  const clearHistory = () => {
    setSearchHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('smms-options-search-history');
    }
  };

  const handleLoadFromHistory = (entry: SearchHistory) => {
    // For SMMS options, we just trigger a fresh fetch since there are no parameters
    fetchSmmsOptions();
  };

  // Load search history from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smms-options-search-history');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSearchHistory(parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          })));
        } catch (error) {
          console.error('Error loading search history:', error);
        }
      }
    }
  }, []);

  // Initialize API client when environment changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEnvironment = localStorage.getItem('selectedEnvironment') || 'development';
      setSelectedEnvironment(savedEnvironment);
      
      try {
        const config = ENVIRONMENTS[savedEnvironment as keyof typeof ENVIRONMENTS];
        if (config) {
          setApiClient(new ApiClient(config, savedEnvironment));
        }
      } catch (err) {
        console.error('Error initializing API client:', err);
        setError('Failed to initialize API client');
      }
    }
  }, []);

  const saveSearchHistory = (optionsCount: number, resultFound: boolean) => {
    const newEntry: SearchHistory = {
      id: Date.now().toString(),
      timestamp: new Date(),
      resultFound,
      optionsCount
    };
    
    const updatedHistory = [newEntry, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
    setSearchHistory(updatedHistory);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smms-options-search-history', JSON.stringify(updatedHistory));
    }
  };

  const fetchSmmsOptions = async () => {
    if (!apiClient) {
      setError('API client not initialized. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError(null);
    setOptions(null);

    try {
      const query = `
        query SmmsOptions {
          smmsOptions {
            assignmentApprovalStates
            assignmentStatuses
            assignmentTypes
            opportunityStatuses
            opportunityTypeStatuses
            serviceTypes
          }
        }
      `;

      const response = await apiClient.executeGraphQLQuery(query, {});
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors.map(err => err.message).join(', '));
      }

      const data = response.data as { smmsOptions: SmmsOptions };
      const smmsOptions = data.smmsOptions;
      
      if (!smmsOptions) {
        throw new Error('No SMMS options data returned');
      }

      setOptions(smmsOptions);
      
      // Calculate total options count
      const totalCount = Object.values(smmsOptions).reduce((sum, arr) => sum + (arr?.length || 0), 0);
      saveSearchHistory(totalCount, true);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch SMMS options';
      setError(errorMessage);
      saveSearchHistory(0, false);
    } finally {
      setLoading(false);
    }
  };

  // Get filtered options based on search and category
  const getFilteredOptions = () => {
    if (!options) return {};

    const categories = {
      assignmentApprovalStates: 'Assignment Approval States',
      assignmentStatuses: 'Assignment Statuses',
      assignmentTypes: 'Assignment Types',
      opportunityStatuses: 'Opportunity Statuses',
      opportunityTypeStatuses: 'Opportunity Type Statuses',
      serviceTypes: 'Service Types'
    };

    let filteredOptions: { [key: string]: { name: string; values: string[] } } = {};

    Object.entries(categories).forEach(([key, name]) => {
      if (selectedCategory === 'all' || selectedCategory === key) {
        const values = options[key as keyof SmmsOptions] || [];
        const filteredValues = values.filter(value => 
          searchFilter === '' || value.toLowerCase().includes(searchFilter.toLowerCase())
        );
        
        if (filteredValues.length > 0) {
          const sortedValues = [...filteredValues].sort((a, b) => {
            return sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
          });
          filteredOptions[key] = { name, values: sortedValues };
        }
      }
    });

    return filteredOptions;
  };

  const exportToCsv = () => {
    if (!options) return;
    
    const filteredOptions = getFilteredOptions();
    
    let csvContent = 'Category,Option Value\n';
    
    Object.entries(filteredOptions).forEach(([key, data]) => {
      data.values.forEach(value => {
        csvContent += `"${data.name}","${value}"\n`;
      });
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `smms-options-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTotalOptionsCount = () => {
    if (!options) return 0;
    return Object.values(options).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  };

  const getFilteredOptionsCount = () => {
    const filtered = getFilteredOptions();
    return Object.values(filtered).reduce((sum, data) => sum + data.values.length, 0);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚙️</span>
        <h1 className="text-3xl font-bold text-gray-900">SMMS Options</h1>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
          Service Missionary Management System
        </span>
      </div>

      {/* Environment Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🌍 Environment Selection</h2>
        <div className="flex items-center gap-4">
          <label htmlFor="environment" className="text-sm font-medium text-gray-700">
            Select Environment:
          </label>
          <select
            id="environment"
            value={selectedEnvironment}
            onChange={(e) => {
              setSelectedEnvironment(e.target.value);
              if (typeof window !== 'undefined') {
                localStorage.setItem('selectedEnvironment', e.target.value);
              }
              const config = ENVIRONMENTS[e.target.value as keyof typeof ENVIRONMENTS];
              if (config) {
                setApiClient(new ApiClient(config, e.target.value));
              }
            }}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Object.entries(ENVIRONMENTS).map(([key, env]) => (
              <option key={key} value={key}>
                {env.name}
              </option>
            ))}
          </select>
          {selectedEnvironment && (
            <span className="text-xs text-gray-500">
              Connected to {ENVIRONMENTS[selectedEnvironment as keyof typeof ENVIRONMENTS]?.name}
            </span>
          )}
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Fetch SMMS Options</h2>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Retrieve all available option values for the Service Missionary Management System (SMMS).
          </p>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchSmmsOptions}
              disabled={loading || !apiClient}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Fetching Options...
                </>
              ) : (
                'Fetch SMMS Options'
              )}
            </button>
            
            <button
              onClick={clearSearch}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear
            </button>
            
            {options && (
              <>
                <button
                  onClick={exportToJson}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  📥 Export JSON
                </button>
                
                <button
                  onClick={exportToCsv}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  📊 Export CSV
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* SMMS Options Results */}
      {options && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              🎯 SMMS Options Results
              <span className="ml-2 text-sm text-gray-500">
                ({getTotalOptionsCount()} total options)
              </span>
            </h2>
          </div>

          {/* Filter Controls */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Filter Options</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  placeholder="Search option values..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="assignmentApprovalStates">Assignment Approval States</option>
                <option value="assignmentStatuses">Assignment Statuses</option>
                <option value="assignmentTypes">Assignment Types</option>
                <option value="opportunityStatuses">Opportunity Statuses</option>
                <option value="opportunityTypeStatuses">Opportunity Type Statuses</option>
                <option value="serviceTypes">Service Types</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="asc">Sort A-Z</option>
                <option value="desc">Sort Z-A</option>
              </select>
            </div>
            
            {searchFilter && (
              <div className="mt-2 text-sm text-gray-600">
                Showing {getFilteredOptionsCount()} of {getTotalOptionsCount()} options
              </div>
            )}
          </div>

          {/* Options Display */}
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Options Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-blue-600">{options.assignmentApprovalStates?.length || 0}</div>
                  <div className="text-gray-600">Approval States</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600">{options.assignmentStatuses?.length || 0}</div>
                  <div className="text-gray-600">Assignment Statuses</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-purple-600">{options.assignmentTypes?.length || 0}</div>
                  <div className="text-gray-600">Assignment Types</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-orange-600">{options.opportunityStatuses?.length || 0}</div>
                  <div className="text-gray-600">Opportunity Statuses</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-pink-600">{options.opportunityTypeStatuses?.length || 0}</div>
                  <div className="text-gray-600">Opportunity Types</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-indigo-600">{options.serviceTypes?.length || 0}</div>
                  <div className="text-gray-600">Service Types</div>
                </div>
              </div>
            </div>

            {/* Options Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {Object.entries(getFilteredOptions()).map(([key, data]) => {
                const categoryColors = {
                  assignmentApprovalStates: 'bg-blue-50 border-blue-200',
                  assignmentStatuses: 'bg-green-50 border-green-200',
                  assignmentTypes: 'bg-purple-50 border-purple-200',
                  opportunityStatuses: 'bg-orange-50 border-orange-200',
                  opportunityTypeStatuses: 'bg-pink-50 border-pink-200',
                  serviceTypes: 'bg-indigo-50 border-indigo-200'
                };

                const headerColors = {
                  assignmentApprovalStates: 'text-blue-900',
                  assignmentStatuses: 'text-green-900',
                  assignmentTypes: 'text-purple-900',
                  opportunityStatuses: 'text-orange-900',
                  opportunityTypeStatuses: 'text-pink-900',
                  serviceTypes: 'text-indigo-900'
                };

                const badgeColors = {
                  assignmentApprovalStates: 'bg-blue-100 text-blue-800',
                  assignmentStatuses: 'bg-green-100 text-green-800',
                  assignmentTypes: 'bg-purple-100 text-purple-800',
                  opportunityStatuses: 'bg-orange-100 text-orange-800',
                  opportunityTypeStatuses: 'bg-pink-100 text-pink-800',
                  serviceTypes: 'bg-indigo-100 text-indigo-800'
                };

                return (
                  <div 
                    key={key} 
                    className={`border rounded-lg p-4 ${categoryColors[key as keyof typeof categoryColors] || 'bg-gray-50 border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`font-medium ${headerColors[key as keyof typeof headerColors] || 'text-gray-900'}`}>
                        {data.name}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded ${badgeColors[key as keyof typeof badgeColors] || 'bg-gray-100 text-gray-800'}`}>
                        {data.values.length}
                      </span>
                    </div>
                    
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {data.values.map((value, index) => (
                        <div 
                          key={index}
                          className="bg-white rounded p-2 text-sm border border-gray-200"
                        >
                          <span className="font-mono text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">📜 Search History</h2>
            <button
              onClick={clearHistory}
              className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              🗑️ Clear History
            </button>
          </div>
          <div className="space-y-3">
            {searchHistory.map((entry) => (
              <div 
                key={entry.id} 
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors" 
                onClick={() => handleLoadFromHistory(entry)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">SMMS Options Fetch</span>
                      {entry.resultFound && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Success
                        </span>
                      )}
                      {!entry.resultFound && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Error
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {entry.timestamp.toLocaleDateString()} at {entry.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">{entry.optionsCount}</div>
                    <div className="text-sm text-gray-500">options</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !options && !error && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Ready to Fetch SMMS Options</h3>
            <p className="mt-2 text-sm text-gray-500">
              Click "Fetch SMMS Options" to retrieve all available option values from the Service Missionary Management System.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
