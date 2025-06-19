'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

interface Country {
  id: string;
  name: string;
  shortName: string;
  parentId: string;
  iso2Code: string;
  iso3Code: string;
  effectiveIso2Code: string;
  effectiveIso3Code: string;
}

interface CountriesFilters {
  ids?: string[];
  iso3Codes?: string[];
  iso2Codes?: string[];
}

interface SearchHistory {
  timestamp: string;
  filterType: string;
  filterValue: string;
  resultsCount: number;
}

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  
  // Search form state
  const [filterType, setFilterType] = useState<'all' | 'ids' | 'iso2Codes' | 'iso3Codes'>('all');
  const [filterValue, setFilterValue] = useState<string>('');

  // Display and sorting
  const [sortField, setSortField] = useState<keyof Country>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [showSubunitsOnly, setShowSubunitsOnly] = useState(false);
  const [showCountriesOnly, setShowCountriesOnly] = useState(false);

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
    const savedHistory = localStorage.getItem('countriesSearchHistory');
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
    localStorage.setItem('countriesSearchHistory', JSON.stringify(history));
    setSearchHistory(history);
  };

  const addToSearchHistory = (filterType: string, filterValue: string, resultsCount: number) => {
    const newEntry: SearchHistory = {
      timestamp: new Date().toISOString(),
      filterType,
      filterValue,
      resultsCount
    };
    const updatedHistory = [newEntry, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
    saveSearchHistory(updatedHistory);
  };

  const clearSearchHistory = () => {
    localStorage.removeItem('countriesSearchHistory');
    setSearchHistory([]);
  };

  const searchCountries = async () => {
    if (!apiClient) {
      setError('API client not initialized. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError(null);
    setCountries([]);

    try {
      let input: CountriesFilters = {};
      let searchDescription = 'All countries';

      // Build filters based on user input
      if (filterType !== 'all' && filterValue.trim()) {
        const values = filterValue.split(',').map(v => v.trim()).filter(v => v);
        if (values.length > 0) {
          switch (filterType) {
            case 'ids':
              input.ids = values;
              searchDescription = `Countries by IDs: ${values.join(', ')}`;
              break;
            case 'iso2Codes':
              input.iso2Codes = values.map(v => v.toUpperCase());
              searchDescription = `Countries by ISO2 codes: ${values.join(', ')}`;
              break;
            case 'iso3Codes':
              input.iso3Codes = values.map(v => v.toUpperCase());
              searchDescription = `Countries by ISO3 codes: ${values.join(', ')}`;
              break;
          }
        }
      }

      const query = `
        query Countries($input: CountriesFilters) {
          countries(input: $input) {
            id
            name
            shortName
            parentId
            iso2Code
            iso3Code
            effectiveIso2Code
            effectiveIso3Code
          }
        }
      `;

      const variables = Object.keys(input).length > 0 ? { input } : {};
      const response = await apiClient.executeGraphQLQuery(query, variables);
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const data = response.data as { countries: Country[] };
      const countryList = Array.isArray(data.countries) ? data.countries : [];
      setCountries(countryList);
      
      addToSearchHistory(
        filterType,
        filterType === 'all' ? 'All countries' : filterValue,
        countryList.length
      );
      
      if (countryList.length === 0) {
        setError(`No countries found for: ${searchDescription}`);
      }
    } catch (err: any) {
      console.error('Error searching countries:', err);
      setError(err.message || 'Failed to search countries');
      addToSearchHistory(filterType, filterValue || 'All countries', 0);
    } finally {
      setLoading(false);
    }
  };

  // Load all countries on component mount
  useEffect(() => {
    if (apiClient) {
      searchCountries();
    }
  }, [apiClient]);

  const sortedAndFilteredCountries = Array.isArray(countries) ? countries
    .filter(country => {
      // Text search filter
      if (searchFilter) {
        const search = searchFilter.toLowerCase();
        return (
          country.name?.toLowerCase().includes(search) ||
          country.shortName?.toLowerCase().includes(search) ||
          country.iso2Code?.toLowerCase().includes(search) ||
          country.iso3Code?.toLowerCase().includes(search)
        );
      }
      return true;
    })
    .filter(country => {
      // Subunits/Countries filter
      if (showSubunitsOnly && !country.parentId) return false;
      if (showCountriesOnly && country.parentId) return false;
      return true;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const aStr = (aValue || '').toLowerCase();
        const bStr = (bValue || '').toLowerCase();
        return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      }
      
      return 0;
    }) : [];

  const exportToCsv = () => {
    if (sortedAndFilteredCountries.length === 0) return;
    
    const headers = [
      'ID',
      'Name',
      'Short Name',
      'Parent ID',
      'ISO2 Code',
      'ISO3 Code',
      'Effective ISO2',
      'Effective ISO3',
      'Type'
    ];
    
    const csvContent = [
      headers.join(','),
      ...sortedAndFilteredCountries.map(country => [
        `"${country.id || ''}"`,
        `"${country.name || ''}"`,
        `"${country.shortName || ''}"`,
        `"${country.parentId || ''}"`,
        `"${country.iso2Code || ''}"`,
        `"${country.iso3Code || ''}"`,
        `"${country.effectiveIso2Code || ''}"`,
        `"${country.effectiveIso3Code || ''}"`,
        `"${country.parentId ? 'Subunit' : 'Country'}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `countries-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const repeatSearch = (historyItem: SearchHistory) => {
    setFilterType(historyItem.filterType as any);
    setFilterValue(historyItem.filterValue === 'All countries' ? '' : historyItem.filterValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchCountries();
    }
  };

  const getCountryFlag = (iso2Code: string) => {
    if (!iso2Code) return '🌍';
    try {
      // Convert ISO2 code to flag emoji
      const codePoints = iso2Code.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch {
      return '🌍';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Countries</h1>
          <p className="mt-2 text-lg text-gray-600">
            Search and browse countries with filtering by IDs, ISO2 codes, or ISO3 codes
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Search Parameters</h3>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="filterType" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter Type
                </label>
                <select
                  id="filterType"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Countries</option>
                  <option value="ids">Filter by IDs</option>
                  <option value="iso2Codes">Filter by ISO2 Codes</option>
                  <option value="iso3Codes">Filter by ISO3 Codes</option>
                </select>
              </div>

              {filterType !== 'all' && (
                <div className="flex-1">
                  <label htmlFor="filterValue" className="block text-sm font-medium text-gray-700 mb-2">
                    {filterType === 'ids' ? 'Country IDs' : 
                     filterType === 'iso2Codes' ? 'ISO2 Codes (e.g., US, CA, GB)' :
                     'ISO3 Codes (e.g., USA, CAN, GBR)'}
                  </label>
                  <input
                    id="filterValue"
                    type="text"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      filterType === 'ids' ? 'Enter country IDs (comma-separated)' :
                      filterType === 'iso2Codes' ? 'Enter ISO2 codes (comma-separated)' :
                      'Enter ISO3 codes (comma-separated)'
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="flex items-end">
                <button
                  onClick={searchCountries}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Searching...
                    </>
                  ) : (
                    <>
                      <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search Countries
                    </>
                  )}
                </button>
              </div>
            </div>
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
                        {item.filterType}: <span className="text-blue-600">{item.filterValue}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.resultsCount > 0
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.resultsCount} countries
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                    <button
                      onClick={() => repeatSearch(item)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Repeat
                    </button>
                  </div>
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
                <h3 className="text-sm font-medium text-red-800">Search Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {countries.length > 0 && (
          <>
            {/* Results Summary and Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Countries: {sortedAndFilteredCountries.length} of {countries.length} results
                  </h2>
                  <p className="text-gray-600">Browse and filter countries and subunits</p>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  {/* Text Search Filter */}
                  <input
                    type="text"
                    placeholder="Search countries..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {/* Type Filters */}
                  <div className="flex space-x-2">
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={showCountriesOnly}
                        onChange={(e) => {
                          setShowCountriesOnly(e.target.checked);
                          if (e.target.checked) setShowSubunitsOnly(false);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Countries Only</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={showSubunitsOnly}
                        onChange={(e) => {
                          setShowSubunitsOnly(e.target.checked);
                          if (e.target.checked) setShowCountriesOnly(false);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Subunits Only</span>
                    </label>
                  </div>

                  {/* Sort Controls */}
                  <select
                    value={`${sortField}-${sortDirection}`}
                    onChange={(e) => {
                      const [field, direction] = e.target.value.split('-');
                      setSortField(field as keyof Country);
                      setSortDirection(direction as 'asc' | 'desc');
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="shortName-asc">Short Name (A-Z)</option>
                    <option value="shortName-desc">Short Name (Z-A)</option>
                    <option value="iso2Code-asc">ISO2 (A-Z)</option>
                    <option value="iso2Code-desc">ISO2 (Z-A)</option>
                    <option value="iso3Code-asc">ISO3 (A-Z)</option>
                    <option value="iso3Code-desc">ISO3 (Z-A)</option>
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

            {/* Countries Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {sortedAndFilteredCountries.map((country, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getCountryFlag(country.effectiveIso2Code || country.iso2Code || '')}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{country.name}</h3>
                        {country.shortName && country.shortName !== country.name && (
                          <p className="text-xs text-gray-500">{country.shortName}</p>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      country.parentId 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {country.parentId ? 'Subunit' : 'Country'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">ID:</span>
                      <span className="font-mono bg-gray-100 px-1 rounded">{country.id}</span>
                    </div>
                    
                    {country.iso2Code && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">ISO2:</span>
                        <span className="font-mono bg-blue-100 px-1 rounded text-blue-800">{country.iso2Code}</span>
                      </div>
                    )}
                    
                    {country.iso3Code && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">ISO3:</span>
                        <span className="font-mono bg-blue-100 px-1 rounded text-blue-800">{country.iso3Code}</span>
                      </div>
                    )}

                    {(country.effectiveIso2Code && country.effectiveIso2Code !== country.iso2Code) && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Effective ISO2:</span>
                        <span className="font-mono bg-purple-100 px-1 rounded text-purple-800">{country.effectiveIso2Code}</span>
                      </div>
                    )}

                    {(country.effectiveIso3Code && country.effectiveIso3Code !== country.iso3Code) && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Effective ISO3:</span>
                        <span className="font-mono bg-purple-100 px-1 rounded text-purple-800">{country.effectiveIso3Code}</span>
                      </div>
                    )}

                    {country.parentId && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Parent ID:</span>
                        <span className="font-mono bg-orange-100 px-1 rounded text-orange-800">{country.parentId}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Statistics */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Countries Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    {Array.isArray(countries) ? countries.length : 0}
                  </div>
                  <div className="text-sm text-blue-700">Total Results</div>
                </div>
                <div className="bg-green-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">
                    {Array.isArray(countries) ? countries.filter(c => !c.parentId).length : 0}
                  </div>
                  <div className="text-sm text-green-700">Countries</div>
                </div>
                <div className="bg-orange-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-900">
                    {Array.isArray(countries) ? countries.filter(c => c.parentId).length : 0}
                  </div>
                  <div className="text-sm text-orange-700">Subunits</div>
                </div>
                <div className="bg-purple-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-900">
                    {Array.isArray(countries) ? countries.filter(c => c.iso2Code).length : 0}
                  </div>
                  <div className="text-sm text-purple-700">With ISO Codes</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">💡 How to Use Countries Search</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• <strong>All Countries:</strong> Load all available countries and subunits from the system</p>
            <p>• <strong>Filter by IDs:</strong> Search for specific countries using their internal IDs (comma-separated)</p>
            <p>• <strong>Filter by ISO2 Codes:</strong> Search using 2-letter country codes like US, CA, GB (comma-separated)</p>
            <p>• <strong>Filter by ISO3 Codes:</strong> Search using 3-letter country codes like USA, CAN, GBR (comma-separated)</p>
            <p>• <strong>Countries vs Subunits:</strong> Filter to show only main countries or only subunits (territories, dependencies)</p>
            <p>• <strong>Text Search:</strong> Quick filter by country name, short name, or ISO codes</p>
            <p>• <strong>Sort Options:</strong> Sort by name, short name, or ISO codes in ascending or descending order</p>
            <p>• <strong>Export Data:</strong> Export filtered results to CSV for external analysis</p>
            <p>• <strong>Search History:</strong> Track your searches and easily repeat previous queries</p>
          </div>
        </div>
      </div>
    </div>
  );
}
