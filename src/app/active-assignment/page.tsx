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
  legalFirstName: string;
  legalLastName: string;
  preferredFirstName: string;
  gender: string;
  birthCountry: string;
}

interface AssignmentLocationComponent {
  id: number;
  name: string;
  assignmentLocationName: string;
  language: string;
  statusDescription: string;
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
    const savedHistory = localStorage.getItem('activeAssignmentSearchHistory');
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
    localStorage.setItem('activeAssignmentSearchHistory', JSON.stringify(history));
    setSearchHistory(history);
  };

  const addToSearchHistory = (missionaryNum: string, resultFound: boolean) => {
    const newEntry: SearchHistory = {
      missionaryNumber: missionaryNum,
      timestamp: new Date().toISOString(),
      resultFound
    };
    const updatedHistory = [newEntry, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
    saveSearchHistory(updatedHistory);
  };

  const clearSearchHistory = () => {
    localStorage.removeItem('activeAssignmentSearchHistory');
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
              name
              assignmentLocationName
              language
              statusDescription
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
              legalFirstName
              legalLastName
              preferredFirstName
              gender
              birthCountry
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
        addToSearchHistory(missionaryNumber, true);
      } else {
        setError('No active assignment found for this missionary number');
        addToSearchHistory(missionaryNumber, false);
      }
    } catch (err: any) {
      console.error('Error searching for active assignment:', err);
      setError(err.message || 'Failed to search for active assignment');
      addToSearchHistory(missionaryNumber, false);
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
    setMissionaryNumber(historyItem.missionaryNumber);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Active Assignment Search</h1>
          <p className="mt-2 text-lg text-gray-600">
            Find a missionary's current active assignment by their missionary number
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="missionaryNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Missionary Number / Legacy Miss ID
              </label>
              <input
                type="text"
                id="missionaryNumber"
                value={missionaryNumber}
                onChange={(e) => setMissionaryNumber(e.target.value)}
                placeholder="Enter missionary number (e.g., 123456)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !missionaryNumber.trim()}
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
                  Search Assignment
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
                      Missionary #{item.missionaryNumber}
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

        {/* Assignment Results */}
        {assignment && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-blue-900">Active Assignment Details</h2>
              <p className="text-blue-700">Assignment ID: {assignment.id}</p>
            </div>

            <div className="p-6">
              {/* Missionary Information */}
              {assignment.missionary && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">👤 Missionary Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Missionary Number:</span>
                        <p className="font-medium">{assignment.missionary.missionaryNumber}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Legal Name:</span>
                        <p className="font-medium">
                          {assignment.missionary.legalFirstName} {assignment.missionary.legalLastName}
                        </p>
                      </div>
                      {assignment.missionary.preferredFirstName && (
                        <div>
                          <span className="text-sm text-gray-500">Preferred Name:</span>
                          <p className="font-medium">{assignment.missionary.preferredFirstName}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-sm text-gray-500">Gender:</span>
                        <p className="font-medium">{assignment.missionary.gender}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Birth Country:</span>
                        <p className="font-medium">{assignment.missionary.birthCountry}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Assignment Details */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">📋 Assignment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <span className="text-sm text-blue-600">Assignment Type:</span>
                    <p className="font-medium text-blue-900">
                      {assignment.assignmentType?.label || 'Not specified'}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <span className="text-sm text-green-600">Assignment Status:</span>
                    <p className="font-medium text-green-900">
                      {assignment.assignmentStatus?.label || 'Not specified'}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <span className="text-sm text-purple-600">Service Method:</span>
                    <p className="font-medium text-purple-900">
                      {assignment.serviceMethod?.label || 'Not specified'}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <span className="text-sm text-orange-600">Start Date:</span>
                    <p className="font-medium text-orange-900">
                      {formatDate(assignment.assignmentStartDate)}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <span className="text-sm text-red-600">End Date:</span>
                    <p className="font-medium text-red-900">
                      {formatDate(assignment.assignmentEndDate)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <span className="text-sm text-gray-600">Is Permanent:</span>
                    <p className="font-medium text-gray-900">
                      {assignment.isPermanent ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assignment Location Component */}
              {assignment.component && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">📍 Assignment Location</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-blue-600">Location Name:</span>
                        <p className="font-medium text-blue-900">{assignment.component.assignmentLocationName}</p>
                      </div>
                      <div>
                        <span className="text-sm text-blue-600">Component Name:</span>
                        <p className="font-medium text-blue-900">{assignment.component.name}</p>
                      </div>
                      <div>
                        <span className="text-sm text-blue-600">Language:</span>
                        <p className="font-medium text-blue-900">{assignment.component.language}</p>
                      </div>
                      <div>
                        <span className="text-sm text-blue-600">Status:</span>
                        <p className="font-medium text-blue-900">{assignment.component.statusDescription}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mission Information */}
              {assignment.mission && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">🌍 Mission Information</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-green-600">Mission Name:</span>
                        <p className="font-medium text-green-900">{assignment.mission.name}</p>
                      </div>
                      <div>
                        <span className="text-sm text-green-600">Mission ID:</span>
                        <p className="font-medium text-green-900">{assignment.mission.id}</p>
                      </div>
                      {assignment.mission.address && (
                        <div>
                          <span className="text-sm text-green-600">Address:</span>
                          <p className="font-medium text-green-900">{assignment.mission.address}</p>
                        </div>
                      )}
                      {assignment.mission.phone && (
                        <div>
                          <span className="text-sm text-green-600">Phone:</span>
                          <p className="font-medium text-green-900">{assignment.mission.phone}</p>
                        </div>
                      )}
                      {assignment.mission.email && (
                        <div>
                          <span className="text-sm text-green-600">Email:</span>
                          <p className="font-medium text-green-900">{assignment.mission.email}</p>
                        </div>
                      )}
                      {assignment.mission.leaderName && (
                        <div>
                          <span className="text-sm text-green-600">Mission Leader:</span>
                          <p className="font-medium text-green-900">{assignment.mission.leaderName}</p>
                        </div>
                      )}
                    </div>
                    
                    {assignment.mission.zones && assignment.mission.zones.length > 0 && (
                      <div>
                        <span className="text-sm text-green-600">Zones ({assignment.mission.zones.length}):</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {assignment.mission.zones.map((zone) => (
                            <span
                              key={zone.id}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                            >
                              {zone.name}
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
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">🎓 Training Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignment.curriculumName && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <span className="text-sm text-purple-600">Curriculum:</span>
                        <p className="font-medium text-purple-900">{assignment.curriculumName}</p>
                      </div>
                    )}
                    {assignment.trainingTrackName && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <span className="text-sm text-purple-600">Training Track:</span>
                        <p className="font-medium text-purple-900">{assignment.trainingTrackName}</p>
                      </div>
                    )}
                    {assignment.courseName && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <span className="text-sm text-purple-600">Course:</span>
                        <p className="font-medium text-purple-900">{assignment.courseName}</p>
                      </div>
                    )}
                    {assignment.trainingFacilityName && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <span className="text-sm text-purple-600">Training Facility:</span>
                        <p className="font-medium text-purple-900">{assignment.trainingFacilityName}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional IDs */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">🔗 System Identifiers</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {assignment.assignmentChurchUnitNumber && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="text-sm text-gray-600">Church Unit Number:</span>
                      <p className="font-medium text-gray-900">{assignment.assignmentChurchUnitNumber}</p>
                    </div>
                  )}
                  {assignment.callId && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="text-sm text-gray-600">Call ID:</span>
                      <p className="font-medium text-gray-900">{assignment.callId}</p>
                    </div>
                  )}
                  {assignment.positionId && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="text-sm text-gray-600">Position ID:</span>
                      <p className="font-medium text-gray-900">{assignment.positionId}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">💡 How to Use Active Assignment Search</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• Enter a missionary number (also known as Legacy Miss ID) to find their current active assignment</p>
            <p>• The search will return comprehensive assignment details including mission, location, training, and status information</p>
            <p>• Recent searches are automatically saved and can be accessed from the search history section</p>
            <p>• Click on any item in the search history to quickly repeat that search</p>
            <p>• Assignment data includes current mission details, assignment location, training information, and system identifiers</p>
          </div>
        </div>
      </div>
    </div>
  );
}
