'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

interface Zone {
  id: string;
  name: string;
  districts?: District[];
}

interface District {
  id: string;
  name: string;
}

interface Mission {
  id: string;
  name: string;
  address?: string;
  mailingAddress?: string;
  phoneInternationalCode?: string;
  phone?: string;
  phoneExtension?: string;
  faxInternationalCode?: string;
  fax?: string;
  faxExtension?: string;
  email?: string;
  leaderCmisId?: number;
  leaderName?: string;
  leaderHomeAddress?: string;
  leaderPhoneInternationalCode?: string;
  leaderPhone?: string;
  leaderPhoneExtension?: string;
  leaderCellInternationalCode?: string;
  leaderCell?: string;
  leaderCellExtension?: string;
  leaderEmail?: string;
  mobileDevice?: boolean;
  missionaryAllocation?: number;
  assignmentLocationStatusId?: number;
  assignmentLocationStatusDescription?: string;
  zones?: Zone[];
}

interface SearchHistory {
  id: string;
  missionId: string;
  timestamp: Date;
  resultFound: boolean;
  missionName?: string;
}

const SEARCH_HISTORY_KEY = 'mission-search-history';
const MAX_HISTORY_ITEMS = 10;

export default function MissionPage() {
  const [missionId, setMissionId] = useState('');
  const [mission, setMission] = useState<Mission | null>(null);
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
    const savedHistory = localStorage.getItem('mission-search-history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setSearchHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (e) {
        console.error('Error parsing search history:', e);
      }
    }
    setIsHistoryLoaded(true);
  }, []);

  // Save search history to localStorage automatically
  useEffect(() => {
    if (isHistoryLoaded && searchHistory.length > 0) {
      localStorage.setItem('mission-search-history', JSON.stringify(searchHistory));
    }
  }, [searchHistory, isHistoryLoaded]);

  const saveSearchHistory = (missionId: string, found: boolean, missionName?: string) => {
    const newEntry: SearchHistory = {
      id: Date.now().toString(),
      missionId: missionId,
      timestamp: new Date(),
      resultFound: found,
      missionName: missionName
    };
    
    const updatedHistory = [newEntry, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
    setSearchHistory(updatedHistory);
  };

  const handleLoadFromHistory = (entry: SearchHistory) => {
    setMissionId(entry.missionId);
    if (apiClient) {
      searchMission(entry.missionId);
    }
  };

  const clearHistory = () => {
    setSearchHistory([]);
  };

  const searchMission = async (searchId?: string) => {
    const idToSearch = searchId || missionId;
    if (!idToSearch.trim()) {
      setError('Please enter a Mission ID');
      return;
    }

    if (!apiClient) {
      setError('API client not initialized');
      return;
    }

    setLoading(true);
    setError(null);
    setMission(null);

    try {
      const query = `
        query GetMission($id: ID!) {
          mission(id: $id) {
            id
            name
            address
            mailingAddress
            phoneInternationalCode
            phone
            phoneExtension
            faxInternationalCode
            fax
            faxExtension
            email
            leaderCmisId
            leaderName
            leaderHomeAddress
            leaderPhoneInternationalCode
            leaderPhone
            leaderPhoneExtension
            leaderCellInternationalCode
            leaderCell
            leaderCellExtension
            leaderEmail
            mobileDevice
            missionaryAllocation
            assignmentLocationStatusId
            assignmentLocationStatusDescription
            zones {
              id
              name
              districts {
                id
                name
              }
            }
          }
        }
      `;

      const variables = { id: idToSearch };
      const response = await apiClient.executeGraphQLQuery(query, variables);
      const data = response.data as { mission: Mission };

      if (data?.mission) {
        setMission(data.mission);
        saveSearchHistory(idToSearch, true, data.mission.name);
        if (searchId) {
          setMissionId(searchId);
        }
      } else {
        setError('No mission found with that ID');
        saveSearchHistory(idToSearch, false);
      }
    } catch (err) {
      console.error('GraphQL Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchMission();
  };

  const handleClear = () => {
    setMissionId('');
    setMission(null);
    setError(null);
  };

  const formatPhoneNumber = (intlCode?: string, phone?: string, extension?: string) => {
    if (!phone) return 'N/A';
    let formatted = phone;
    if (intlCode) formatted = `+${intlCode} ${formatted}`;
    if (extension) formatted = `${formatted} ext. ${extension}`;
    return formatted;
  };

  const exportToJson = () => {
    if (!mission) return;
    
    const dataStr = JSON.stringify(mission, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `mission-${mission.id}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🏢</span>
        <h1 className="text-2xl font-bold">Mission Search</h1>
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
            <label htmlFor="mission-quick-select" className="text-sm font-medium text-gray-700">Quick Select:</label>
            <select
              id="mission-quick-select"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  setMissionId(e.target.value);
                }
              }}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Mission ID</option>
              <option value="2019701">2019701</option>
              <option value="2017032">2017032</option>
              <option value="2012200">2012200</option>
              <option value="2010585">2010585</option>
              <option value="2012081">2012081</option>
              <option value="2012448">2012448</option>
              <option value="2011980">2011980</option>
              <option value="2013177">2013177</option>
              <option value="2012944">2012944</option>
              <option value="2011212">2011212</option>
              <option value="2011352">2011352</option>
              <option value="2012669">2012669</option>
              <option value="2019000">2019000</option>
              <option value="2014513">2014513</option>
              <option value="374229">374229</option>
              <option value="2011891">2011891</option>
              <option value="2012499">2012499</option>
              <option value="2019418">2019418</option>
              <option value="2012049">2012049</option>
              <option value="412953">412953</option>
              <option value="2016745">2016745</option>
              <option value="2015900">2015900</option>
              <option value="2014459">2014459</option>
              <option value="2011034">2011034</option>
              <option value="2012529">2012529</option>
              <option value="2010364">2010364</option>
              <option value="2016818">2016818</option>
              <option value="2010763">2010763</option>
              <option value="2015501">2015501</option>
              <option value="2011050">2011050</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Search Mission by ID</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="mission-id" className="block text-sm font-medium text-gray-700 mb-1">Mission ID (Required)</label>
            <input
              id="mission-id"
              type="text"
              placeholder="Enter mission organization number"
              value={missionId}
              onChange={(e) => setMissionId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchMission()}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => searchMission()}
            disabled={loading || !missionId.trim() || !apiClient}
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

      {/* Mission Details */}
      {mission && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Mission Details</h2>
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
                      <span className="text-gray-600">Organization Number:</span>
                      <span className="font-mono">{mission.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mission Name:</span>
                      <span>{mission.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Missionary Allocation:</span>
                      <span>{mission.missionaryAllocation || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mobile Device:</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        mission.mobileDevice ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {mission.mobileDevice ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assignment Status:</span>
                      <span>{mission.assignmentLocationStatusDescription || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Addresses */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Addresses</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Physical Address:</span>
                      <div className="text-sm text-gray-600 ml-4 whitespace-pre-line">
                        {mission.address || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Mailing Address:</span>
                      <div className="text-sm text-gray-600 ml-4 whitespace-pre-line">
                        {mission.mailingAddress || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span>{formatPhoneNumber(mission.phoneInternationalCode, mission.phone, mission.phoneExtension)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fax:</span>
                      <span>{formatPhoneNumber(mission.faxInternationalCode, mission.fax, mission.faxExtension)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span>{mission.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Mission Leadership */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Mission Leadership</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Leader Name:</span>
                      <span>{mission.leaderName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CMIS ID:</span>
                      <span>{mission.leaderCmisId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Leader Email:</span>
                      <span>{mission.leaderEmail || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Leader Phone:</span>
                      <span>{formatPhoneNumber(mission.leaderPhoneInternationalCode, mission.leaderPhone, mission.leaderPhoneExtension)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Leader Cell:</span>
                      <span>{formatPhoneNumber(mission.leaderCellInternationalCode, mission.leaderCell, mission.leaderCellExtension)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Leader Home Address */}
            {mission.leaderHomeAddress && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Leader Home Address</h4>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-700 whitespace-pre-line">{mission.leaderHomeAddress}</div>
                </div>
              </div>
            )}

            {/* Zones and Districts */}
            {mission.zones && mission.zones.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Zones and Districts ({mission.zones.length} zones)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mission.zones.map((zone) => (
                    <div key={zone.id} className="p-4 bg-blue-50 rounded-lg">
                      <div className="space-y-2">
                        <div className="font-medium text-gray-900">{zone.name}</div>
                        <div className="text-sm text-gray-600">Zone ID: {zone.id}</div>
                        {zone.districts && zone.districts.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-1">Districts ({zone.districts.length}):</div>
                            <div className="flex flex-wrap gap-1">
                              {zone.districts.map((district) => (
                                <span
                                  key={district.id}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                                >
                                  {district.name}
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
            )}

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{mission.zones ? mission.zones.length : 0}</div>
                <div className="text-sm text-gray-600">Total Zones</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {mission.zones ? mission.zones.reduce((count, zone) => count + (zone.districts?.length || 0), 0) : 0}
                </div>
                <div className="text-sm text-gray-600">Total Districts</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{mission.missionaryAllocation || 0}</div>
                <div className="text-sm text-gray-600">Missionary Allocation</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{mission.assignmentLocationStatusId || 'N/A'}</div>
                <div className="text-sm text-gray-600">Status ID</div>
              </div>
            </div>
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
            {searchHistory.map((entry: SearchHistory) => (
              <div key={entry.id} className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => handleLoadFromHistory(entry)}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">Mission ID: {entry.missionId}</div>
                    {entry.missionName && (
                      <div className="text-sm text-gray-600">{entry.missionName}</div>
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

      {!loading && !mission && !error && (
        <div className="text-center py-8 text-gray-500">
          Enter a Mission ID to search for mission details.
        </div>
      )}
    </div>
  );
}
