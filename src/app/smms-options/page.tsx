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
  timestamp: string;
  optionsCount: number;
}

export default function SmmsOptionsPage() {
  const [options, setOptions] = useState<SmmsOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  
  // Filter and display state
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Initialize API client
  useEffect(() => {
    const selectedEnvironment = localStorage.getItem('selectedEnvironment') || 'development';
    const config = ENVIRONMENTS[selectedEnvironment as keyof typeof ENVIRONMENTS];
    
    if (config) {
      setApiClient(new ApiClient(config, selectedEnvironment));
    }
  }, []);

  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('smmsOptionsSearchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse search history:', e);
      }
    }
  }, []);

  // Save search history to localStorage
  const saveSearchHistory = (history: SearchHistory[]) => {
    localStorage.setItem('smmsOptionsSearchHistory', JSON.stringify(history));
    setSearchHistory(history);
  };

  const addToSearchHistory = (optionsCount: number) => {
    const newEntry: SearchHistory = {
      timestamp: new Date().toISOString(),
      optionsCount
    };
    const updatedHistory = [newEntry, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
    saveSearchHistory(updatedHistory);
  };

  const clearSearchHistory = () => {
    localStorage.removeItem('smmsOptionsSearchHistory');
    setSearchHistory([]);
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
        throw new Error(response.errors[0].message);
      }

      const data = response.data as { smmsOptions: SmmsOptions };
      const smmsOptions = data.smmsOptions;
      
      if (!smmsOptions) {
        throw new Error('No SMMS options data returned');
      }

      setOptions(smmsOptions);
      
      // Calculate total options count
      const totalCount = Object.values(smmsOptions).reduce((sum, arr) => sum + (arr?.length || 0), 0);
      addToSearchHistory(totalCount);
      
    } catch (err: any) {
      console.error('Error fetching SMMS options:', err);
      setError(err.message || 'Failed to fetch SMMS options');
      addToSearchHistory(0);
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SMMS Options</h1>
          <p className="mt-2 text-lg text-gray-600">
            List of option values that are returned for SMMS (Service Missionary Management System)
          </p>
        </div>

        {/* Action Button */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Fetch SMMS Options</h3>
              <p className="mt-1 text-sm text-gray-500">
                Retrieve all available option values for SMMS system components
              </p>
            </div>
            
            <button
              onClick={fetchSmmsOptions}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading Options...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Fetch SMMS Options
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Search History</h3>
              <button
                onClick={clearSearchHistory}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear History
              </button>
            </div>
            <div className="space-y-2">
              {searchHistory.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        SMMS Options Retrieved
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.optionsCount > 0
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.optionsCount} options
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Fetch Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {options && (
          <>
            {/* Filter and Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    SMMS Options: {getFilteredOptionsCount()} of {getTotalOptionsCount()} options
                  </h2>
                  <p className="text-gray-600">Service Missionary Management System option values</p>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  {/* Search Filter */}
                  <input
                    type="text"
                    placeholder="Filter options..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {/* Category Filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="assignmentApprovalStates">Assignment Approval States</option>
                    <option value="assignmentStatuses">Assignment Statuses</option>
                    <option value="assignmentTypes">Assignment Types</option>
                    <option value="opportunityStatuses">Opportunity Statuses</option>
                    <option value="opportunityTypeStatuses">Opportunity Type Statuses</option>
                    <option value="serviceTypes">Service Types</option>
                  </select>

                  {/* Sort Order */}
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="asc">Sort A-Z</option>
                    <option value="desc">Sort Z-A</option>
                  </select>

                  {/* Export Button */}
                  <button
                    onClick={exportToCsv}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Options Display */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
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
                    className={`rounded-lg border p-6 ${categoryColors[key as keyof typeof categoryColors] || 'bg-gray-50 border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-lg font-semibold ${headerColors[key as keyof typeof headerColors] || 'text-gray-900'}`}>
                        {data.name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColors[key as keyof typeof badgeColors] || 'bg-gray-100 text-gray-800'}`}>
                        {data.values.length} options
                      </span>
                    </div>
                    
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {data.values.map((value, index) => (
                        <div 
                          key={index}
                          className="bg-white rounded-md p-3 text-sm border border-gray-200 shadow-sm"
                        >
                          <span className="font-mono text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Statistics */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📊 SMMS Options Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-blue-100 rounded-lg p-4 text-center">
                  <div className="text-xl font-bold text-blue-900">
                    {options.assignmentApprovalStates?.length || 0}
                  </div>
                  <div className="text-xs text-blue-700">Approval States</div>
                </div>
                <div className="bg-green-100 rounded-lg p-4 text-center">
                  <div className="text-xl font-bold text-green-900">
                    {options.assignmentStatuses?.length || 0}
                  </div>
                  <div className="text-xs text-green-700">Assignment Statuses</div>
                </div>
                <div className="bg-purple-100 rounded-lg p-4 text-center">
                  <div className="text-xl font-bold text-purple-900">
                    {options.assignmentTypes?.length || 0}
                  </div>
                  <div className="text-xs text-purple-700">Assignment Types</div>
                </div>
                <div className="bg-orange-100 rounded-lg p-4 text-center">
                  <div className="text-xl font-bold text-orange-900">
                    {options.opportunityStatuses?.length || 0}
                  </div>
                  <div className="text-xs text-orange-700">Opportunity Statuses</div>
                </div>
                <div className="bg-pink-100 rounded-lg p-4 text-center">
                  <div className="text-xl font-bold text-pink-900">
                    {options.opportunityTypeStatuses?.length || 0}
                  </div>
                  <div className="text-xs text-pink-700">Opportunity Types</div>
                </div>
                <div className="bg-indigo-100 rounded-lg p-4 text-center">
                  <div className="text-xl font-bold text-indigo-900">
                    {options.serviceTypes?.length || 0}
                  </div>
                  <div className="text-xs text-indigo-700">Service Types</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">💡 How to Use SMMS Options</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• <strong>Fetch Options:</strong> Click "Fetch SMMS Options" to retrieve all available option values from the SMMS system</p>
            <p>• <strong>Filter Options:</strong> Use the search box to filter option values by text content</p>
            <p>• <strong>Category Selection:</strong> Filter by specific option categories (assignment types, statuses, etc.)</p>
            <p>• <strong>Sort Options:</strong> Sort option values alphabetically in ascending or descending order</p>
            <p>• <strong>Export Data:</strong> Export filtered options to CSV for external analysis or documentation</p>
            <p>• <strong>Search History:</strong> Track your option fetch history with timestamps and counts</p>
            <p>• <strong>SMMS Integration:</strong> These options are used throughout the Service Missionary Management System for data validation and form controls</p>
          </div>
        </div>
      </div>
    </div>
  );
}
