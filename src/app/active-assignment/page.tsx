'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

interface Option {
  value: string;
  label: string;
}

interface Mission {
  id: string;
  name: string;
  address: string;
  email: string;
  leaderName: string;
  leaderEmail: string;
  phone: string;
  zones: Array<{
    id: string;
    name: string;
  }>;
}

interface Missionary {
  missionaryNumber: number;
  latinFirstName: string;
  latinLastName: string;
}

interface AssignmentLocationComponent {
  id: number;
}

interface Assignment {
  id: string;
  assignmentChurchUnitNumber: number;
  assignmentType: Option;
  assignmentStatus: Option;
  serviceMethod: Option;
  isPermanent: boolean;
  assignmentStartDate: string;
  assignmentEndDate: string;
  curriculumName: string;
  trainingTrackName: string;
  courseName: string;
  trainingFacilityName: string;
  component: AssignmentLocationComponent;
  mission: Mission;
  missionary: Missionary;
  callId: number;
  positionId: number;
}

interface SearchHistory {
  missionaryNumber: string;
  timestamp: string;
  resultFound: boolean;
}

export default function ActiveAssignmentPage() {
  const [missionaryNumber, setMissionaryNumber] = useState('');
  const [assignment, setAssignment] = useState<Assignment | null>(null);
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
    const savedHistory = localStorage.getItem('activeAssignmentSearchHistory');
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
      localStorage.setItem('activeAssignmentSearchHistory', JSON.stringify(searchHistory));
    }
  }, [searchHistory, isHistoryLoaded]);

  const addToHistory = (missionaryNum: string, resultFound: boolean) => {
    if (!missionaryNum.trim()) return;
    
    const newHistoryItem: SearchHistory = {
      missionaryNumber: missionaryNum.trim(),
      timestamp: new Date().toISOString(),
      resultFound
    };

    setSearchHistory(prev => {
      // Remove existing entry if it exists
      const filtered = prev.filter(item => item.missionaryNumber !== missionaryNum.trim());
      // Add new entry at the beginning
      const updated = [newHistoryItem, ...filtered];
      // Keep only the last 10 items
      return updated.slice(0, 10);
    });
  };

  const removeFromHistory = (missionaryNum: string) => {
    setSearchHistory(prev => prev.filter(item => item.missionaryNumber !== missionaryNum));
  };

  const clearHistory = () => {
    setSearchHistory([]);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!missionaryNumber.trim()) return;

    if (!apiClient) {
      setError('API client not initialized. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError(null);
    setAssignment(null);

    try {
      const query = `
        query ActiveAssignment($missionaryNumber: ID!) {
          activeAssignment(missionaryNumber: $missionaryNumber) {
            id
            assignmentChurchUnitNumber
            assignmentType {
              value
              label
            }
            assignmentStatus {
              value
              label
            }
            serviceMethod {
              value
              label
            }
            isPermanent
            assignmentStartDate
            assignmentEndDate
            curriculumName
            trainingTrackName
            courseName
            trainingFacilityName
            callId
            positionId
            component {
              id
            }
            mission {
              id
              name
              address
              email
              leaderName
              leaderEmail
              phone
              zones {
                id
                name
              }
            }
            missionary {
              missionaryNumber
              latinFirstName
              latinLastName
            }
          }
        }
      `;

      const variables = { missionaryNumber };
      const response = await apiClient.executeGraphQLQuery(query, variables);
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const data = response.data as { activeAssignment: Assignment | null };
      if (data.activeAssignment) {
        setAssignment(data.activeAssignment);
        addToHistory(missionaryNumber, true);
      } else {
        setError('No active assignment found for this missionary number');
        addToHistory(missionaryNumber, false);
      }
    } catch (err: any) {
      console.error('Error searching for active assignment:', err);
      setError(err.message || 'Failed to search for active assignment');
      addToHistory(missionaryNumber, false);
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

  const handleClear = () => {
    setMissionaryNumber('');
    setAssignment(null);
    setError(null);
  };

  const clearSearchHistory = () => {
    clearHistory();
  };

  const useHistorySearch = (historyItem: SearchHistory) => {
    setMissionaryNumber(historyItem.missionaryNumber);
  };

  const exportToJson = () => {
    if (!assignment) return;
    
    const dataStr = JSON.stringify(assignment, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `active-assignment-${assignment.missionary?.missionaryNumber}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">📋</span>
        <h1 className="text-2xl font-bold">Active Assignment Search</h1>
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
            <label htmlFor="missionary-quick-select" className="text-sm font-medium text-gray-700">Quick Select:</label>
            <select
              id="missionary-quick-select"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  setMissionaryNumber(e.target.value);
                }
              }}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Missionary Number</option>
              <option value="989034">989034</option>
              <option value="120555">120555</option>
              <option value="967179">967179</option>
              <option value="998412">998412</option>
              <option value="113639">113639</option>
              <option value="946181">946181</option>
              <option value="979369">979369</option>
              <option value="138129">138129</option>
              <option value="138130">138130</option>
              <option value="968694">968694</option>
              <option value="982017">982017</option>
              <option value="120555">120555</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Search Active Assignment by Missionary Number</h2>
        <form onSubmit={handleSearch} className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="missionary-number" className="block text-sm font-medium text-gray-700 mb-1">Missionary Number / Legacy Miss ID (Required)</label>
            <input
              id="missionary-number"
              type="text"
              placeholder="Enter missionary number (e.g., 123456)"
              value={missionaryNumber}
              onChange={(e) => setMissionaryNumber(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || !missionaryNumber.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Assignment Results */}
      {assignment && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Active Assignment Details</h2>
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Assignment Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assignment ID:</span>
                      <span className="font-mono">{assignment.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assignment Type:</span>
                      <span>{assignment.assignmentType?.label || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assignment Status:</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        assignment.assignmentStatus?.label === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                        assignment.assignmentStatus?.label === 'INACTIVE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.assignmentStatus?.label || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service Method:</span>
                      <span>{assignment.serviceMethod?.label || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Is Permanent:</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        assignment.isPermanent ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.isPermanent ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Assignment Timeline</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span>{formatDate(assignment.assignmentStartDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span>{formatDate(assignment.assignmentEndDate)}</span>
                    </div>
                    {assignment.assignmentChurchUnitNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Church Unit Number:</span>
                        <span>{assignment.assignmentChurchUnitNumber}</span>
                      </div>
                    )}
                    {assignment.callId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Call ID:</span>
                        <span>{assignment.callId}</span>
                      </div>
                    )}
                    {assignment.positionId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Position ID:</span>
                        <span>{assignment.positionId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Missionary Information */}
            {assignment.missionary && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Missionary Information</h3>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Missionary Number: {assignment.missionary.missionaryNumber}</div>
                      <div className="text-sm text-gray-600">Name: {assignment.missionary.latinFirstName} {assignment.missionary.latinLastName}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Assignment Location Component */}
            {assignment.component && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Assignment Location Component</h3>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-gray-600">Component ID: {assignment.component.id}</div>
                </div>
              </div>
            )}

            {/* Mission Information */}
            {assignment.mission && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Mission Information</h3>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Mission ID: {assignment.mission.id}</div>
                      <div className="text-sm text-gray-600">Mission Name: {assignment.mission.name || 'N/A'}</div>
                    </div>
                    <div>
                      {assignment.mission.address && (
                        <div className="text-sm text-gray-600">Address: {assignment.mission.address}</div>
                      )}
                      {assignment.mission.phone && (
                        <div className="text-sm text-gray-600">Phone: {assignment.mission.phone}</div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {assignment.mission.email && (
                      <div>
                        <div className="text-sm text-gray-600">Email: {assignment.mission.email}</div>
                      </div>
                    )}
                    {assignment.mission.leaderName && (
                      <div>
                        <div className="text-sm text-gray-600">Mission Leader: {assignment.mission.leaderName}</div>
                        {assignment.mission.leaderEmail && (
                          <div className="text-sm text-gray-600">Leader Email: {assignment.mission.leaderEmail}</div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {assignment.mission.zones && assignment.mission.zones.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-600 mb-2">
                        Zones ({assignment.mission.zones.length}):
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {assignment.mission.zones.map((zone) => (
                          <span
                            key={zone.id}
                            className="px-2 py-1 text-xs rounded bg-green-100 text-green-800"
                          >
                            {zone.name} (ID: {zone.id})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Training Information */}
            {(assignment.curriculumName || assignment.trainingTrackName || assignment.courseName || assignment.trainingFacilityName) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Training Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignment.curriculumName && (
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-900">Curriculum</div>
                      <div className="text-sm text-gray-600">{assignment.curriculumName}</div>
                    </div>
                  )}
                  {assignment.trainingTrackName && (
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-900">Training Track</div>
                      <div className="text-sm text-gray-600">{assignment.trainingTrackName}</div>
                    </div>
                  )}
                  {assignment.courseName && (
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-900">Course</div>
                      <div className="text-sm text-gray-600">{assignment.courseName}</div>
                    </div>
                  )}
                  {assignment.trainingFacilityName && (
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-900">Training Facility</div>
                      <div className="text-sm text-gray-600">{assignment.trainingFacilityName}</div>
                    </div>
                  )}
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
            {searchHistory.map((entry, index) => (
              <div key={index} className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => useHistorySearch(entry)}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">Missionary Number: {entry.missionaryNumber}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(entry.timestamp).toLocaleDateString()} at {new Date(entry.timestamp).toLocaleTimeString()}
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

      {!loading && !assignment && !error && (
        <div className="text-center py-8 text-gray-500">
          Enter a Missionary Number to search for their active assignment.
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">💡 How to Use Active Assignment Search</h2>
        <ul className="text-blue-800 space-y-1 text-sm">
          <li>• Enter a missionary number (also known as Legacy Miss ID) to find their current active assignment</li>
          <li>• The search will return comprehensive assignment details including mission, location, training, and status information</li>
          <li>• Recent searches are automatically saved and can be accessed from the search history section</li>
          <li>• Click on any item in the search history to quickly repeat that search</li>
          <li>• Assignment data includes current mission details, assignment location, training information, and system identifiers</li>
        </ul>
      </div>
    </div>
  );
}
