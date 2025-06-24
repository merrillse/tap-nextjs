'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

interface LabelValue {
  value: number;
  label: string;
}

interface Companion {
  name: string;
  legacyMissId: number;
}

interface MissionaryHistory {
  legacyMissId: number;
  assignmentLocationId: number;
  assignmentLocationName: string;
  effectiveDate: string;
  effectiveEndDate: string;
  proselytingAreaId: number;
  areaName: string;
  areaDate: string;
  areaEndDate: string;
  roleId: number;
  roleType: string;
  roleDate: string;
  roleEndDate: string;
  companions: Companion[];
  companionshipDate: string;
  companionshipEndDate: string;
}

interface AssignmentLocation {
  id: string;
  name: string;
  type: LabelValue;
  missionaryHistories: MissionaryHistory[];
}

interface SearchHistory {
  id: string;
  searchedAt: string;
}

const SEARCH_HISTORY_KEY = 'assignment-location-search-history';
const MAX_HISTORY_ITEMS = 10;

export default function AssignmentLocationPage() {
  const [assignmentLocationId, setAssignmentLocationId] = useState('');
  const [assignmentLocation, setAssignmentLocation] = useState<AssignmentLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState('mis-gql-dev');
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);

  // Get only MGQL/MIS environments (no MOGS)
  const mgqlEnvironments = Object.entries(ENVIRONMENTS).filter(([key]) => 
    key.startsWith('mis-gql-')
  );

  // Initialize API client with default MIS development environment
  useEffect(() => {
    const savedEnvironment = localStorage.getItem('selectedEnvironment');
    const environmentToUse = (savedEnvironment && ENVIRONMENTS[savedEnvironment] && savedEnvironment.startsWith('mis-gql-')) 
      ? savedEnvironment 
      : 'mis-gql-dev';
    
    setSelectedEnvironment(environmentToUse);
    const config = ENVIRONMENTS[environmentToUse];
    
    if (config) {
      setApiClient(new ApiClient(config, environmentToUse));
    }
  }, []);

  // Update API client when environment changes
  useEffect(() => {
    const config = ENVIRONMENTS[selectedEnvironment];
    if (config) {
      setApiClient(new ApiClient(config, selectedEnvironment));
      localStorage.setItem('selectedEnvironment', selectedEnvironment);
    }
  }, [selectedEnvironment]);

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setSearchHistory(parsed);
      } catch (e) {
        console.error('Error parsing search history:', e);
      }
    }
    setIsHistoryLoaded(true);
  }, []);

  // Save search history to localStorage
  useEffect(() => {
    if (isHistoryLoaded) {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
    }
  }, [searchHistory, isHistoryLoaded]);

  const addToHistory = (id: string) => {
    if (!id.trim()) return;
    
    const newHistoryItem: SearchHistory = {
      id: id.trim(),
      searchedAt: new Date().toISOString()
    };

    setSearchHistory(prev => {
      // Remove existing entry if it exists
      const filtered = prev.filter(item => item.id !== id.trim());
      // Add new entry at the beginning
      const updated = [newHistoryItem, ...filtered];
      // Keep only the last MAX_HISTORY_ITEMS
      return updated.slice(0, MAX_HISTORY_ITEMS);
    });
  };

  const removeFromHistory = (id: string) => {
    setSearchHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    setSearchHistory([]);
  };

  const searchAssignmentLocation = async (searchId?: string) => {
    const idToSearch = searchId || assignmentLocationId;
    if (!idToSearch.trim()) {
      setError('Please enter an Assignment Location ID');
      return;
    }

    if (!apiClient) {
      setError('API client not initialized');
      return;
    }

    setLoading(true);
    setError(null);
    setAssignmentLocation(null);

    try {
      const query = `
        query AssignmentLocation($id: ID!) {
          assignmentLocation(id: $id) {
            id
            name
            type {
              value
              label
            }
            missionaryHistories {
              legacyMissId
              assignmentLocationId
              assignmentLocationName
              effectiveDate
              effectiveEndDate
              proselytingAreaId
              areaName
              areaDate
              areaEndDate
              roleId
              roleType
              roleDate
              roleEndDate
              companions {
                name
                legacyMissId
              }
              companionshipDate
              companionshipEndDate
            }
          }
        }
      `;

      const variables = { id: idToSearch };
      const response = await apiClient.executeGraphQLQuery(query, variables);
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const data = response.data as { assignmentLocation: AssignmentLocation | null };
      if (data.assignmentLocation) {
        setAssignmentLocation(data.assignmentLocation);
        addToHistory(idToSearch);
        if (searchId) {
          setAssignmentLocationId(searchId);
        }
      } else {
        setError('No assignment location found for this ID');
      }
    } catch (err: any) {
      console.error('Error searching for assignment location:', err);
      setError(err instanceof Error ? err.message : 'Failed to search for assignment location');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setAssignmentLocationId('');
    setAssignmentLocation(null);
    setError(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const useHistorySearch = (historyItem: SearchHistory) => {
    setAssignmentLocationId(historyItem.id);
    if (apiClient) {
      searchAssignmentLocation(historyItem.id);
    }
  };

  const groupHistoriesByMissionary = (histories: MissionaryHistory[]) => {
    const grouped = histories.reduce((acc, history) => {
      const missionaryId = history.legacyMissId.toString();
      if (!acc[missionaryId]) {
        acc[missionaryId] = [];
      }
      acc[missionaryId].push(history);
      return acc;
    }, {} as Record<string, MissionaryHistory[]>);

    // Sort histories within each missionary by effective date (most recent first)
    Object.keys(grouped).forEach(missionaryId => {
      grouped[missionaryId].sort((a, b) => {
        const dateA = new Date(a.effectiveDate || '1900-01-01').getTime();
        const dateB = new Date(b.effectiveDate || '1900-01-01').getTime();
        return dateB - dateA;
      });
    });

    return grouped;
  };

  const clearSearchHistory = () => {
    clearHistory();
  };

  const exportToJson = () => {
    if (!assignmentLocation) return;
    
    const dataStr = JSON.stringify(assignmentLocation, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `assignment-location-${assignmentLocation.id}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">📍</span>
        <h1 className="text-2xl font-bold">Assignment Location Search</h1>
        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Missionary Information System</span>
      </div>

      {/* Environment Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <label htmlFor="environment" className="text-sm font-medium text-gray-700">Environment:</label>
          <select
            id="environment"
            value={selectedEnvironment}
            onChange={(e) => setSelectedEnvironment(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {mgqlEnvironments.map(([key, env]) => (
              <option key={key} value={key}>
                {env.name}
              </option>
            ))}
          </select>
          
          <div className="flex items-center gap-2">
            <label htmlFor="location-quick-select" className="text-sm font-medium text-gray-700">Quick Select:</label>
            <select
              id="location-quick-select"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  setAssignmentLocationId(e.target.value);
                }
              }}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Assignment Location ID</option>
              <option value="14380">14380</option>
              <option value="14384">14384</option>
              <option value="14393">14393</option>
              <option value="14398">14398</option>
              <option value="14403">14403</option>
              <option value="14407">14407</option>
              <option value="14417">14417</option>
              <option value="14422">14422</option>
              <option value="14426">14426</option>
              <option value="14465">14465</option>
              <option value="14550">14550</option>
              <option value="14300">14300</option>
              <option value="14486">14486</option>
              <option value="14594">14594</option>
              <option value="14450">14450</option>
              <option value="14483">14483</option>
              <option value="14289">14289</option>
              <option value="14382">14382</option>
              <option value="14529">14529</option>
              <option value="14453">14453</option>
              <option value="14454">14454</option>
              <option value="14455">14455</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Search Assignment Location by ID</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="assignment-location-id" className="block text-sm font-medium text-gray-700 mb-1">Assignment Location ID (Required)</label>
            <input
              id="assignment-location-id"
              type="text"
              placeholder="Enter assignment location ID"
              value={assignmentLocationId}
              onChange={(e) => setAssignmentLocationId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchAssignmentLocation()}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => searchAssignmentLocation()}
            disabled={loading || !assignmentLocationId.trim() || !apiClient}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Assignment Location Details */}
      {assignmentLocation && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Assignment Location Details</h2>
            <button
              onClick={exportToJson}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
            >
              📥 Export JSON
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location ID:</span>
                      <span className="font-mono">{assignmentLocation.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location Name:</span>
                      <span>{assignmentLocation.name || 'N/A'}</span>
                    </div>
                    {assignmentLocation.type && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location Type:</span>
                        <span>{assignmentLocation.type.label} (ID: {assignmentLocation.type.value})</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {assignmentLocation.missionaryHistories ? new Set(assignmentLocation.missionaryHistories.map(h => h.legacyMissId)).size : 0}
                      </div>
                      <div className="text-sm text-gray-600">Total Missionaries</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {assignmentLocation.missionaryHistories?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Assignment Records</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Missionary Histories */}
            {assignmentLocation.missionaryHistories && assignmentLocation.missionaryHistories.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Missionary Assignment History ({assignmentLocation.missionaryHistories.length} records)
                </h3>
                <div className="space-y-4">
                  {(() => {
                    const groupedHistories = groupHistoriesByMissionary(assignmentLocation.missionaryHistories);
                    return Object.entries(groupedHistories).map(([missionaryId, histories]) => (
                      <div key={missionaryId} className="p-4 bg-purple-50 rounded-lg border">
                        <div className="space-y-3">
                          <div className="font-medium text-gray-900">
                            Missionary #{missionaryId} ({histories.length} assignment{histories.length > 1 ? 's' : ''})
                          </div>
                          
                          <div className="space-y-3">
                            {histories.map((history, index) => (
                              <div key={index} className="p-3 bg-white rounded-lg border border-gray-200">
                                <div className="space-y-2">
                                  {/* Assignment Period */}
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                                      Assignment: {formatDate(history.effectiveDate)} - {formatDate(history.effectiveEndDate)}
                                    </span>
                                    {history.roleType && (
                                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                                        Role: {history.roleType}
                                      </span>
                                    )}
                                  </div>

                                  {/* Assignment Details */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    <div>
                                      <div className="text-xs text-gray-500">Assignment Location:</div>
                                      <div className="text-sm font-medium">
                                        {history.assignmentLocationName} (ID: {history.assignmentLocationId})
                                      </div>
                                    </div>
                                    
                                    {history.areaName && (
                                      <div>
                                        <div className="text-xs text-gray-500">Proselyting Area:</div>
                                        <div className="text-sm font-medium">
                                          {history.areaName} (ID: {history.proselytingAreaId})
                                        </div>
                                      </div>
                                    )}

                                    {history.areaDate && (
                                      <div>
                                        <div className="text-xs text-gray-500">Area Period:</div>
                                        <div className="text-sm font-medium">
                                          {formatDate(history.areaDate)} - {formatDate(history.areaEndDate)}
                                        </div>
                                      </div>
                                    )}

                                    {history.roleDate && (
                                      <div>
                                        <div className="text-xs text-gray-500">Role Period:</div>
                                        <div className="text-sm font-medium">
                                          {formatDate(history.roleDate)} - {formatDate(history.roleEndDate)}
                                        </div>
                                      </div>
                                    )}

                                    {history.roleId && (
                                      <div>
                                        <div className="text-xs text-gray-500">Role ID:</div>
                                        <div className="text-sm font-medium">{history.roleId}</div>
                                      </div>
                                    )}

                                    {history.companionshipDate && (
                                      <div>
                                        <div className="text-xs text-gray-500">Companionship Period:</div>
                                        <div className="text-sm font-medium">
                                          {formatDate(history.companionshipDate)} - {formatDate(history.companionshipEndDate)}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Companions */}
                                  {history.companions && history.companions.length > 0 && (
                                    <div className="mt-3">
                                      <div className="text-xs text-gray-500 mb-2">
                                        Companions ({history.companions.length}):
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {history.companions.map((companion, compIndex) => (
                                          <span
                                            key={compIndex}
                                            className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-800"
                                          >
                                            {companion.name} (#{companion.legacyMissId})
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">📜 Search History</h2>
            <button
              onClick={clearSearchHistory}
              className="px-3 py-1 text-red-600 border border-red-300 rounded-md hover:bg-red-50"
            >
              🗑️ Clear History
            </button>
          </div>
          <div className="space-y-2">
            {searchHistory.map((entry) => (
              <div key={entry.id} className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => useHistorySearch(entry)}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">Location ID: {entry.id}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(entry.searchedAt).toLocaleDateString()} at {new Date(entry.searchedAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                    Click to Search
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !assignmentLocation && !error && (
        <div className="text-center py-8 text-gray-500">
          Enter an Assignment Location ID to search for assignment details.
        </div>
      )}
    </div>
  );
}
