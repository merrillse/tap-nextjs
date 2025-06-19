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
  timestamp: string;
  resultFound: boolean;
}

export default function AssignmentLocationPage() {
  const [assignmentLocationId, setAssignmentLocationId] = useState('');
  const [assignmentLocation, setAssignmentLocation] = useState<AssignmentLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);

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
    const savedHistory = localStorage.getItem('assignmentLocationSearchHistory');
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
    localStorage.setItem('assignmentLocationSearchHistory', JSON.stringify(history));
    setSearchHistory(history);
  };

  const addToSearchHistory = (id: string, resultFound: boolean) => {
    const newEntry: SearchHistory = {
      id,
      timestamp: new Date().toISOString(),
      resultFound
    };
    const updatedHistory = [newEntry, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
    saveSearchHistory(updatedHistory);
  };

  const clearSearchHistory = () => {
    localStorage.removeItem('assignmentLocationSearchHistory');
    setSearchHistory([]);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentLocationId.trim()) return;

    if (!apiClient) {
      setError('API client not initialized. Please refresh the page.');
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

      const variables = { id: assignmentLocationId };
      const response = await apiClient.executeGraphQLQuery(query, variables);
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const data = response.data as { assignmentLocation: AssignmentLocation | null };
      if (data.assignmentLocation) {
        setAssignmentLocation(data.assignmentLocation);
        addToSearchHistory(assignmentLocationId, true);
      } else {
        setError('No assignment location found for this ID');
        addToSearchHistory(assignmentLocationId, false);
      }
    } catch (err: any) {
      console.error('Error searching for assignment location:', err);
      setError(err.message || 'Failed to search for assignment location');
      addToSearchHistory(assignmentLocationId, false);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Assignment Location Search</h1>
          <p className="mt-2 text-lg text-gray-600">
            Find detailed information about an assignment location by ID
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="assignmentLocationId" className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Location ID
              </label>
              <input
                type="text"
                id="assignmentLocationId"
                value={assignmentLocationId}
                onChange={(e) => setAssignmentLocationId(e.target.value)}
                placeholder="Enter assignment location ID (e.g., 12345)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !assignmentLocationId.trim()}
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
                  Search Location
                </>
              )}
            </button>
          </form>
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Searches</h3>
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
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => useHistorySearch(item)}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">
                      Location ID: {item.id}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.resultFound 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.resultFound ? 'Found' : 'Not Found'}
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
                <h3 className="text-sm font-medium text-red-800">Search Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Location Results */}
        {assignmentLocation && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-blue-900">Assignment Location Details</h2>
              <p className="text-blue-700">Location ID: {assignmentLocation.id}</p>
            </div>

            <div className="p-6">
              {/* Basic Location Information */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">📍 Location Information</h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-blue-600">Location Name:</span>
                      <p className="font-medium text-blue-900">{assignmentLocation.name || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-blue-600">Location ID:</span>
                      <p className="font-medium text-blue-900">{assignmentLocation.id}</p>
                    </div>
                    {assignmentLocation.type && (
                      <div>
                        <span className="text-sm text-blue-600">Location Type:</span>
                        <p className="font-medium text-blue-900">
                          {assignmentLocation.type.label} (ID: {assignmentLocation.type.value})
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Missionary Histories */}
              {assignmentLocation.missionaryHistories && assignmentLocation.missionaryHistories.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    👥 Missionary Assignment History ({assignmentLocation.missionaryHistories.length} records)
                  </h3>
                  
                  {(() => {
                    const groupedHistories = groupHistoriesByMissionary(assignmentLocation.missionaryHistories);
                    return (
                      <div className="space-y-6">
                        {Object.entries(groupedHistories).map(([missionaryId, histories]) => (
                          <div key={missionaryId} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                            <h4 className="text-md font-semibold text-gray-900 mb-4">
                              🏷️ Missionary #{missionaryId} ({histories.length} assignment{histories.length > 1 ? 's' : ''})
                            </h4>
                            
                            <div className="space-y-4">
                              {histories.map((history, index) => (
                                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Assignment Period */}
                                    <div className="col-span-full mb-3">
                                      <div className="flex items-center space-x-4">
                                        <div className="bg-green-100 px-3 py-1 rounded-full">
                                          <span className="text-sm font-medium text-green-800">
                                            Assignment: {formatDate(history.effectiveDate)} - {formatDate(history.effectiveEndDate)}
                                          </span>
                                        </div>
                                        {history.roleType && (
                                          <div className="bg-blue-100 px-3 py-1 rounded-full">
                                            <span className="text-sm font-medium text-blue-800">
                                              Role: {history.roleType}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Assignment Details */}
                                    <div>
                                      <span className="text-sm text-gray-500">Assignment Location:</span>
                                      <p className="font-medium text-gray-900">
                                        {history.assignmentLocationName} (ID: {history.assignmentLocationId})
                                      </p>
                                    </div>
                                    
                                    {history.areaName && (
                                      <div>
                                        <span className="text-sm text-gray-500">Proselyting Area:</span>
                                        <p className="font-medium text-gray-900">
                                          {history.areaName} (ID: {history.proselytingAreaId})
                                        </p>
                                      </div>
                                    )}

                                    {history.areaDate && (
                                      <div>
                                        <span className="text-sm text-gray-500">Area Period:</span>
                                        <p className="font-medium text-gray-900">
                                          {formatDate(history.areaDate)} - {formatDate(history.areaEndDate)}
                                        </p>
                                      </div>
                                    )}

                                    {history.roleDate && (
                                      <div>
                                        <span className="text-sm text-gray-500">Role Period:</span>
                                        <p className="font-medium text-gray-900">
                                          {formatDate(history.roleDate)} - {formatDate(history.roleEndDate)}
                                        </p>
                                      </div>
                                    )}

                                    {history.roleId && (
                                      <div>
                                        <span className="text-sm text-gray-500">Role ID:</span>
                                        <p className="font-medium text-gray-900">{history.roleId}</p>
                                      </div>
                                    )}

                                    {history.companionshipDate && (
                                      <div>
                                        <span className="text-sm text-gray-500">Companionship Period:</span>
                                        <p className="font-medium text-gray-900">
                                          {formatDate(history.companionshipDate)} - {formatDate(history.companionshipEndDate)}
                                        </p>
                                      </div>
                                    )}

                                    {/* Companions */}
                                    {history.companions && history.companions.length > 0 && (
                                      <div className="col-span-full mt-4">
                                        <span className="text-sm text-gray-500">Companions ({history.companions.length}):</span>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {history.companions.map((companion, compIndex) => (
                                            <span
                                              key={compIndex}
                                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
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
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Summary Statistics */}
              {assignmentLocation.missionaryHistories && assignmentLocation.missionaryHistories.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Location Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-100 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-900">
                        {new Set(assignmentLocation.missionaryHistories.map(h => h.legacyMissId)).size}
                      </div>
                      <div className="text-sm text-blue-700">Total Missionaries</div>
                    </div>
                    <div className="bg-green-100 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-900">
                        {assignmentLocation.missionaryHistories.length}
                      </div>
                      <div className="text-sm text-green-700">Assignment Records</div>
                    </div>
                    <div className="bg-purple-100 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-900">
                        {assignmentLocation.missionaryHistories.reduce((total, h) => total + (h.companions?.length || 0), 0)}
                      </div>
                      <div className="text-sm text-purple-700">Total Companions</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">💡 How to Use Assignment Location Search</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• Enter an assignment location ID to find detailed information about that location</p>
            <p>• View location details including name, type, and associated missionary histories</p>
            <p>• Explore comprehensive missionary assignment records including dates, roles, and companions</p>
            <p>• Recent searches are automatically saved and can be accessed from the search history section</p>
            <p>• Assignment histories are grouped by missionary and sorted by most recent assignment first</p>
            <p>• View statistics including total missionaries, assignment records, and companion relationships</p>
          </div>
        </div>
      </div>
    </div>
  );
}
