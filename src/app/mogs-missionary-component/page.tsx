'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

interface MissionaryComponent {
  id: string;
  missionaryTypeId?: number;
  missionaryType?: string;
  unitNumber?: number;
  parentUnitNumber?: number;
  status?: string;
  name?: string;
  missionMcsLanguageId?: number;
  assignmentLocationId?: number;
  missionLanguageId?: number;
  withinMissionUnitNumber?: number;
  assignmentMeetingName?: string;
  assignmentMeetingShortName?: string;
  componentMcsLanguageId?: number;
  componentLanguageId?: number;
  positionId?: number;
  positionAbbreviation?: string;
  positionName?: string;
  positionNameLangId?: number;
  responsibleOrganizationNumber?: number;
  responsibleOrganizationName?: string;
}

interface SearchHistory {
  id: string;
  componentId: string;
  timestamp: Date;
  resultFound: boolean;
  componentName?: string;
}

export default function MOGSMissionaryComponentPage() {
  const [componentId, setComponentId] = useState('');
  const [missionaryComponent, setMissionaryComponent] = useState<MissionaryComponent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState('mogs-gql-dev');
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mogs-missionary-component-search-history');
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
  }, []);

  // Initialize API client when environment changes
  useEffect(() => {
    try {
      const config = ENVIRONMENTS[selectedEnvironment];
      if (!config) {
        setError(`Environment "${selectedEnvironment}" not found`);
        return;
      }
      setApiClient(new ApiClient(config, selectedEnvironment));
      setError(null);
    } catch (err) {
      console.error('Error initializing API client:', err);
      setError('Failed to initialize API client');
    }
  }, [selectedEnvironment]);

  const saveSearchHistory = (compId: string, found: boolean, name?: string) => {
    const newEntry: SearchHistory = {
      id: Date.now().toString(),
      componentId: compId,
      timestamp: new Date(),
      resultFound: found,
      componentName: name
    };
    
    const updatedHistory = [newEntry, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
    setSearchHistory(updatedHistory);
    localStorage.setItem('mogs-missionary-component-search-history', JSON.stringify(updatedHistory));
  };

  const searchMissionaryComponent = async () => {
    if (!apiClient) {
      setError('API client not initialized. Please refresh the page.');
      return;
    }

    if (!componentId.trim()) {
      setError('Please enter a Component ID');
      return;
    }

    setLoading(true);
    setError(null);
    setMissionaryComponent(null);

    const query = `
      query GetMissionaryComponent($id: ID!) {
        missionaryComponent(id: $id) {
          id
          missionaryTypeId
          missionaryType
          unitNumber
          parentUnitNumber
          status
          name
          missionMcsLanguageId
          assignmentLocationId
          missionLanguageId
          withinMissionUnitNumber
          assignmentMeetingName
          assignmentMeetingShortName
          componentMcsLanguageId
          componentLanguageId
          positionId
          positionAbbreviation
          positionName
          positionNameLangId
          responsibleOrganizationNumber
          responsibleOrganizationName
        }
      }
    `;

    try {
      const variables = { id: componentId };
      
      const result = await apiClient.executeGraphQLQuery(query, variables);
      
      const data = result.data as { missionaryComponent: MissionaryComponent | null };
      setMissionaryComponent(data.missionaryComponent);
      
      const name = data.missionaryComponent?.name || data.missionaryComponent?.assignmentMeetingName || 'Missionary Component';
      saveSearchHistory(componentId, !!data.missionaryComponent, name);
      
      if (!data.missionaryComponent) {
        setError(`No missionary component found with ID: ${componentId}`);
      }
      
    } catch (err) {
      console.error('Error fetching missionary component:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch missionary component');
      saveSearchHistory(componentId, false);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFromHistory = (historyEntry: SearchHistory) => {
    setComponentId(historyEntry.componentId);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('mogs-missionary-component-search-history');
  };

  const clearSearch = () => {
    setComponentId('');
    setMissionaryComponent(null);
    setError(null);
  };

  const exportToJson = () => {
    if (!missionaryComponent) return;
    
    const dataStr = JSON.stringify(missionaryComponent, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `missionary-component-${missionaryComponent.id}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🎯</span>
        <h1 className="text-2xl font-bold">MOGS Missionary Component</h1>
        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Missionary Oracle Graph Service</span>
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
            <option value="mogs-gql-dev">MOGS Development</option>
            <option value="mogs-gql-local">MOGS Local</option>
            <option value="mogs-gql-prod">MOGS Production</option>
          </select>
          {apiClient ? (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Connected
            </span>
          ) : (
            <span className="text-sm text-yellow-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              Initializing...
            </span>
          )}
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Search Missionary Component by ID</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="component-id" className="block text-sm font-medium text-gray-700 mb-1">Component ID (Required)</label>
            <input
              id="component-id"
              type="text"
              placeholder="Enter missionary component ID"
              value={componentId}
              onChange={(e) => setComponentId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchMissionaryComponent()}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={searchMissionaryComponent}
            disabled={loading || !componentId.trim() || !apiClient}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button
            onClick={clearSearch}
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

      {/* Missionary Component Details */}
      {missionaryComponent && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Missionary Component Details</h2>
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
                      <span className="text-gray-600">Component ID:</span>
                      <span className="font-mono">{missionaryComponent.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span>{missionaryComponent.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        missionaryComponent.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                        missionaryComponent.status === 'INACTIVE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {missionaryComponent.status || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Missionary Type:</span>
                      <span>{missionaryComponent.missionaryType || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Missionary Type ID:</span>
                      <span>{missionaryComponent.missionaryTypeId || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Assignment Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Meeting Name:</span>
                      <span>{missionaryComponent.assignmentMeetingName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Meeting Short Name:</span>
                      <span>{missionaryComponent.assignmentMeetingShortName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assignment Location ID:</span>
                      <span>{missionaryComponent.assignmentLocationId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unit Number:</span>
                      <span>{missionaryComponent.unitNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Parent Unit Number:</span>
                      <span>{missionaryComponent.parentUnitNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Position Information */}
            {(missionaryComponent.positionName || missionaryComponent.positionAbbreviation || missionaryComponent.positionId) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Position Information</h3>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">Position ID: {missionaryComponent.positionId || 'N/A'}</div>
                      <div className="text-sm text-gray-600">Position Name: {missionaryComponent.positionName || 'N/A'}</div>
                      <div className="text-sm text-gray-600">Position Abbreviation: {missionaryComponent.positionAbbreviation || 'N/A'}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">Position Name Lang ID: {missionaryComponent.positionNameLangId || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Language Information */}
            {(missionaryComponent.missionMcsLanguageId || missionaryComponent.missionLanguageId || missionaryComponent.componentMcsLanguageId || missionaryComponent.componentLanguageId) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Language Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Mission Languages</h4>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">Mission MCS Language ID: {missionaryComponent.missionMcsLanguageId || 'N/A'}</div>
                      <div className="text-sm text-gray-600">Mission Language ID: {missionaryComponent.missionLanguageId || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Component Languages</h4>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">Component MCS Language ID: {missionaryComponent.componentMcsLanguageId || 'N/A'}</div>
                      <div className="text-sm text-gray-600">Component Language ID: {missionaryComponent.componentLanguageId || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Organization Information */}
            {(missionaryComponent.responsibleOrganizationNumber || missionaryComponent.responsibleOrganizationName || missionaryComponent.withinMissionUnitNumber) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Organization Information</h3>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Responsible Org Number:</span>
                        <span>{missionaryComponent.responsibleOrganizationNumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Responsible Org Name:</span>
                        <span>{missionaryComponent.responsibleOrganizationName || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Within Mission Unit Number:</span>
                        <span>{missionaryComponent.withinMissionUnitNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
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
              onClick={clearHistory}
              className="px-3 py-1 text-red-600 border border-red-300 rounded-md hover:bg-red-50"
            >
              🗑️ Clear History
            </button>
          </div>
          <div className="space-y-2">
            {searchHistory.map((entry) => (
              <div key={entry.id} className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => handleLoadFromHistory(entry)}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">Component ID: {entry.componentId}</div>
                    {entry.componentName && (
                      <div className="text-sm text-gray-600">{entry.componentName}</div>
                    )}
                    <div className="text-sm text-gray-500">
                      {entry.timestamp.toLocaleDateString()} at {entry.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${entry.resultFound ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {entry.resultFound ? "Found" : "Not Found"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !missionaryComponent && !error && (
        <div className="text-center py-8 text-gray-500">
          Enter a Component ID to search for missionary component details.
        </div>
      )}
    </div>
  );
}
