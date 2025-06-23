'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

// TypeScript interfaces based on the GraphQL schema
interface ProselytingArea {
  // Define proselyting area fields if needed
}

interface Missionary {
  id?: string;
  missionaryNumber?: number;
  recommendFirstName?: string;
  recommendLastName?: string;
}

interface EcclesiasticalUnit {
  id?: string;
  missionaryDeptUnitId?: number;
  name?: string;
  type?: string;
  cdolUnitTypeId?: number;
  cdolParentUnit?: number;
  cdolParentUnitTypeId?: number;
  parentUnit?: EcclesiasticalUnit;
  childUnits?: EcclesiasticalUnit[];
  missionOrgNumber?: number;
  proselytingAreas?: ProselytingArea[];
  missionaries?: Missionary[];
}

interface SearchHistory {
  fieldName: string;
  value: string;
  timestamp: number;
}

export default function EcclesiasticalUnitPage() {
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState('mis-gql-dev');
  
  const [unitId, setUnitId] = useState('');
  const [ecclesiasticalUnit, setEcclesiasticalUnit] = useState<EcclesiasticalUnit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  // Initialize API client when environment changes
  useEffect(() => {
    const config = ENVIRONMENTS[selectedEnvironment];
    if (config) {
      setApiClient(new ApiClient(config, selectedEnvironment));
    }
  }, [selectedEnvironment]);

  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('ecclesiastical-unit-search-history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setSearchHistory(parsedHistory);
      } catch (err) {
        console.error('Error loading search history:', err);
      }
    }
    setIsHistoryLoaded(true);
  }, []);

  // Save search history to localStorage whenever it changes (but not on initial load)
  useEffect(() => {
    if (isHistoryLoaded) {
      localStorage.setItem('ecclesiastical-unit-search-history', JSON.stringify(searchHistory));
    }
  }, [searchHistory, isHistoryLoaded]);

  const addToSearchHistory = (fieldName: string, value: string) => {
    if (!value.trim()) return;
    
    const newEntry: SearchHistory = {
      fieldName,
      value: value.trim(),
      timestamp: Date.now()
    };
    
    setSearchHistory(prev => {
      // Remove any existing entries with the same field and value
      const filtered = prev.filter(entry => 
        !(entry.fieldName === fieldName && entry.value === value.trim())
      );
      
      // Add new entry at the beginning and keep only last 10
      return [newEntry, ...filtered].slice(0, 10);
    });
  };

  const buildEcclesiasticalUnitQuery = (id: string) => {
    return `
      query GetEcclesiasticalUnit {
        ecclesiasticalUnit(id: "${id}") {
          id
          missionaryDeptUnitId
          name
          type
          cdolUnitTypeId
          cdolParentUnit
          cdolParentUnitTypeId
          missionOrgNumber
          parentUnit {
            id
            name
            type
            missionaryDeptUnitId
          }
          childUnits {
            id
            name
            type
            missionaryDeptUnitId
          }
          missionaries {
            id
            missionaryNumber
            recommendFirstName
            recommendLastName
          }
          proselytingAreas {
            # Add proselyting area fields if needed
          }
        }
      }
    `;
  };

  const handleSearch = async () => {
    if (!apiClient) {
      setError('API client not initialized');
      return;
    }

    if (!unitId.trim()) {
      setError('Please provide an Ecclesiastical Unit ID');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Add to search history
      addToSearchHistory('unitId', unitId);

      const query = buildEcclesiasticalUnitQuery(unitId.trim());
      console.log('Executing GraphQL query:', query);

      const response = await apiClient.executeGraphQLQuery(query);
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const data = response.data as { ecclesiasticalUnit: EcclesiasticalUnit };
      setEcclesiasticalUnit(data.ecclesiasticalUnit || null);
      
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
      setEcclesiasticalUnit(null);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setUnitId('');
    setEcclesiasticalUnit(null);
    setError(null);
    setHasSearched(false);
  };

  const useHistoryValue = (fieldName: string, value: string) => {
    if (fieldName === 'unitId') {
      setUnitId(value);
    }
  };

  const getFieldLabel = (fieldName: string) => {
    const labels: Record<string, string> = {
      unitId: 'Unit ID'
    };
    return labels[fieldName] || fieldName;
  };

  const renderChildUnits = (units: EcclesiasticalUnit[]) => {
    if (!units || units.length === 0) return null;

    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Child Units ({units.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {units.map((unit, index) => (
            <div key={unit.id || index} className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center mb-2">
                <span className="text-blue-600 mr-2">🏢</span>
                <div className="font-semibold text-gray-900">
                  {unit.name || 'Unknown Unit'}
                </div>
              </div>
              {unit.type && (
                <div className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Type:</span> {unit.type}
                </div>
              )}
              {unit.id && (
                <div className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">ID:</span> {unit.id}
                </div>
              )}
              {unit.missionaryDeptUnitId && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Dept Unit ID:</span> {unit.missionaryDeptUnitId}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMissionaries = (missionaries: Missionary[]) => {
    if (!missionaries || missionaries.length === 0) return null;

    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Missionaries ({missionaries.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {missionaries.map((missionary, index) => (
            <div key={missionary.id || index} className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center mb-2">
                <span className="text-green-600 mr-2">👥</span>
                <div className="font-semibold text-gray-900">
                  {`${missionary.recommendFirstName || ''} ${missionary.recommendLastName || ''}`.trim() || 'Unknown'}
                </div>
              </div>
              {missionary.missionaryNumber && (
                <div className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Missionary #:</span> {missionary.missionaryNumber}
                </div>
              )}
              {missionary.id && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">ID:</span> {missionary.id}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('ecclesiastical-unit-search-history');
  };

  const exportToJson = () => {
    if (!ecclesiasticalUnit) return;
    
    const dataStr = JSON.stringify(ecclesiasticalUnit, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `ecclesiastical-unit-${ecclesiasticalUnit.id}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🏛️</span>
        <h1 className="text-2xl font-bold">Ecclesiastical Unit Search</h1>
        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Missionary Information System</span>
      </div>

      {/* Environment Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <label htmlFor="environment" className="text-sm font-medium text-gray-700">Environment:</label>
          <select
            id="environment"
            value={selectedEnvironment}
            onChange={(e) => setSelectedEnvironment(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(ENVIRONMENTS).map(([key, env]) => (
              <option key={key} value={key}>
                {env.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Search by Unit ID</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="unit-id" className="block text-sm font-medium text-gray-700 mb-1">Ecclesiastical Unit ID (Required)</label>
            <input
              id="unit-id"
              type="text"
              placeholder="Enter unit ID"
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Enter the unique identifier for the ecclesiastical unit</p>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !unitId.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button
            onClick={clearSearch}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">📜 Recent Searches</h2>
            <button
              onClick={clearSearchHistory}
              className="px-3 py-1 text-red-600 border border-red-300 rounded-md hover:bg-red-50"
            >
              🗑️ Clear History
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((entry, index) => (
              <button
                key={`${entry.fieldName}-${entry.value}-${index}`}
                onClick={() => useHistoryValue(entry.fieldName, entry.value)}
                className="px-3 py-1 text-sm border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 cursor-pointer"
              >
                {getFieldLabel(entry.fieldName)}: {entry.value}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">Click any value to use it in your search</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Results */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ecclesiastical Unit Details</h2>
        
        {!hasSearched ? (
          <div className="text-center py-8">
            <span className="text-6xl text-gray-400 mb-4 block">🏛️</span>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Ready to Search</h3>
            <p className="text-gray-500">
              Enter a unit ID above and click "Search" to find ecclesiastical unit information
            </p>
          </div>
        ) : !ecclesiasticalUnit && !loading ? (
          <div className="text-center py-8">
            <span className="text-6xl text-gray-400 mb-4 block">🏛️</span>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No unit found</h3>
            <p className="text-gray-500">
              No ecclesiastical unit found for this ID
            </p>
          </div>
        ) : ecclesiasticalUnit ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏛️</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {ecclesiasticalUnit.name || 'Unknown Unit'}
                  </h3>
                  {ecclesiasticalUnit.type && (
                    <p className="text-gray-600">Type: {ecclesiasticalUnit.type}</p>
                  )}
                </div>
              </div>
              <button
                onClick={exportToJson}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
              >
                📥 Export JSON
              </button>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h4>
                  <div className="space-y-2">
                    {ecclesiasticalUnit.id && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID:</span>
                        <span className="font-mono">{ecclesiasticalUnit.id}</span>
                      </div>
                    )}
                    {ecclesiasticalUnit.missionaryDeptUnitId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Missionary Dept Unit ID:</span>
                        <span>{ecclesiasticalUnit.missionaryDeptUnitId}</span>
                      </div>
                    )}
                    {ecclesiasticalUnit.missionOrgNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mission Org Number:</span>
                        <span>{ecclesiasticalUnit.missionOrgNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">CDOL Information</h4>
                  <div className="space-y-2">
                    {ecclesiasticalUnit.cdolUnitTypeId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">CDOL Unit Type ID:</span>
                        <span>{ecclesiasticalUnit.cdolUnitTypeId}</span>
                      </div>
                    )}
                    {ecclesiasticalUnit.cdolParentUnit && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">CDOL Parent Unit:</span>
                        <span>{ecclesiasticalUnit.cdolParentUnit}</span>
                      </div>
                    )}
                    {ecclesiasticalUnit.cdolParentUnitTypeId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">CDOL Parent Unit Type ID:</span>
                        <span>{ecclesiasticalUnit.cdolParentUnitTypeId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Parent Unit */}
            {ecclesiasticalUnit.parentUnit && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Parent Unit</h4>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-orange-600 mr-2">🔗</span>
                    <div className="font-semibold text-gray-900">
                      {ecclesiasticalUnit.parentUnit.name || 'Unknown Parent Unit'}
                    </div>
                  </div>
                  {ecclesiasticalUnit.parentUnit.type && (
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Type:</span> {ecclesiasticalUnit.parentUnit.type}
                    </div>
                  )}
                  {ecclesiasticalUnit.parentUnit.id && (
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">ID:</span> {ecclesiasticalUnit.parentUnit.id}
                    </div>
                  )}
                  {ecclesiasticalUnit.parentUnit.missionaryDeptUnitId && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Dept Unit ID:</span> {ecclesiasticalUnit.parentUnit.missionaryDeptUnitId}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Child Units */}
            {ecclesiasticalUnit.childUnits && ecclesiasticalUnit.childUnits.length > 0 && 
              renderChildUnits(ecclesiasticalUnit.childUnits)
            }

            {/* Missionaries */}
            {ecclesiasticalUnit.missionaries && ecclesiasticalUnit.missionaries.length > 0 && 
              renderMissionaries(ecclesiasticalUnit.missionaries)
            }

            {/* Proselyting Areas */}
            {ecclesiasticalUnit.proselytingAreas && ecclesiasticalUnit.proselytingAreas.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Proselyting Areas ({ecclesiasticalUnit.proselytingAreas.length})
                </h4>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    {ecclesiasticalUnit.proselytingAreas.length} proselyting area(s) associated with this unit
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
