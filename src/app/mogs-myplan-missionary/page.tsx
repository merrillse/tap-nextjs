'use client';

import { useState, useEffect } from 'react';
import { ENVIRONMENTS, getEnvironmentConfigSafe, getDefaultEnvironment } from '@/lib/environments';
import { ApiClient } from '@/lib/api-client';

// TypeScript interfaces matching the MOGS GraphQL schema
interface LabelValue {
  value: number;
  label: string;
}

interface MMSOrganization {
  id: string;
  organizationId?: number;
  name?: string;
  officialName?: string;
  shortName?: string;
  officialShortName?: string;
}

interface AssignmentLocation {
  id: string;
  name?: string;
  ecclesiasticAssignmentLocation?: AssignmentLocation;
  effectiveDate?: string;
  componentOvertolerancePercentage?: number;
  type?: LabelValue;
  status?: LabelValue;
  colOrganization?: MMSOrganization;
  faxRecommends?: boolean;
  bikeCost?: number;
  complement?: number;
  maxTransfer?: number;
  returnOnLaborRating?: string;
  timeDiffMST?: string;
  createdDate?: string;
  airportCode?: number;
  closingPlannedDate?: string;
  privateFlag?: boolean;
  transferDay?: string;
  parent?: AssignmentLocation;
  legacyId?: number;
  pendingMapEffectiveDate?: string;
  nameExportDate?: string;
  assignmentMeetingName?: string;
}

interface Procstat {
  id?: number;
  description?: string;
  enabledMemberProcstatLocationId?: number;
  key?: string;
  dataArchitectComment?: string;
  active?: boolean;
  shortDescription?: string;
}

interface MyPlanMissionary {
  id: string;
  missionaryId?: number;
  cmisId?: number;
  ldsAccountId?: string;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  suffix?: string;
  missionaryType?: string;
  missionAssignmentLocation?: AssignmentLocation;
  missionOrgNumber?: MMSOrganization;
  missionName?: string;
  assignmentEndDate?: string;
  procstat?: Procstat;
  cmisUnitId?: number;
  cmisUnitName?: string;
  parentUnitId?: number;
  parentUnitName?: string;
  netdUid?: string;
  imltModule?: string;
  netdCourseId?: string;
  courseStatusCode?: string;
  courseStatusName?: string;
  enrolledTimestamp?: string;
  startTimestamp?: string;
  myPlanCompletionTimestamp?: string;
  myPlanSharing?: boolean;
  imosReport?: boolean;
  myPlanURL?: string;
}

interface MyPlanMissionaryData {
  myPlanMissionary: MyPlanMissionary;
}

interface SearchHistoryItem {
  id: string;
  timestamp: string;
  environment: string;
}

export default function MOGSMyPlanMissionaryPage() {
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>(getDefaultEnvironment('mogs'));
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [missionaryId, setMissionaryId] = useState('');
  const [missionaryData, setMissionaryData] = useState<MyPlanMissionary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Initialize API client when environment changes
  useEffect(() => {
    try {
      const { config, key } = getEnvironmentConfigSafe(selectedEnvironment, 'mogs');
      setApiClient(new ApiClient(config, key));

      // Update selected environment if it was corrected
      if (key !== selectedEnvironment) {
        setSelectedEnvironment(key);
      }
    } catch (error) {
      console.error('Failed to initialize API client:', error);
      setApiClient(null);
    }
  }, [selectedEnvironment]);

  // Load search history from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('mogs-myplan-missionary-search-history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse search history:', e);
      }
    }
  }, []);

  // Save search history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mogs-myplan-missionary-search-history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  const addToSearchHistory = (id: string, env: string) => {
    const newItem: SearchHistoryItem = {
      id,
      timestamp: new Date().toISOString(),
      environment: env
    };
    setSearchHistory(prev => [newItem, ...prev.filter(item => !(item.id === id && item.environment === env))].slice(0, 10));
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('mogs-myplan-missionary-search-history');
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const searchMissionary = async () => {
    if (!apiClient) {
      setError('API client not initialized');
      return;
    }

    if (!missionaryId.trim()) {
      setError('Please enter a missionary ID (legacy_miss_id)');
      return;
    }

    setLoading(true);
    setError(null);
    setMissionaryData(null);

    const query = `
      query GetMyPlanMissionary($id: ID!) {
        myPlanMissionary(id: $id) {
          id
          missionaryId
          cmisId
          ldsAccountId
          lastName
          firstName
          middleName
          suffix
          missionaryType
          missionAssignmentLocation {
            id
            name
            assignmentMeetingName
            type {
              value
              label
            }
            status {
              value
              label
            }
            colOrganization {
              id
              organizationId
              name
              officialName
              shortName
              officialShortName
            }
          }
          missionOrgNumber {
            id
            organizationId
            name
            officialName
            shortName
            officialShortName
          }
          missionName
          assignmentEndDate
          procstat {
            id
            description
            enabledMemberProcstatLocationId
            key
            dataArchitectComment
            active
            shortDescription
          }
          cmisUnitId
          cmisUnitName
          parentUnitId
          parentUnitName
          netdUid
          imltModule
          netdCourseId
          courseStatusCode
          courseStatusName
          enrolledTimestamp
          startTimestamp
          myPlanCompletionTimestamp
          myPlanSharing
          imosReport
          myPlanURL
        }
      }
    `;

    const variables = { id: missionaryId.trim() };

    try {
      const response = await apiClient.executeGraphQLQuery(query, variables);

      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors.map(err => err.message).join(', '));
      }

      const data = response.data as MyPlanMissionaryData;
      if (data?.myPlanMissionary) {
        setMissionaryData(data.myPlanMissionary);
        addToSearchHistory(missionaryId.trim(), selectedEnvironment);
        setExpandedSections(new Set(['basic', 'mission', 'training', 'units'])); // Auto-expand main sections
      } else {
        setError('No MyPlan missionary found with the provided ID');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exportToJson = () => {
    if (!missionaryData) return;

    const dataStr = JSON.stringify(missionaryData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `myplan-missionary-${missionaryData.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchMissionary();
    }
  };

  const loadFromHistory = (item: SearchHistoryItem) => {
    setSelectedEnvironment(item.environment);
    setMissionaryId(item.id);
  };

  const formatDateTime = (dateTime?: string) => {
    if (!dateTime) return null;
    try {
      return new Date(dateTime).toLocaleString();
    } catch {
      return dateTime;
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return null;
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return date;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">MOGS MyPlan Missionary Query</h1>
            <p className="mt-1 text-sm text-gray-600">
              Search for MyPlan missionary information using the myPlanMissionary(id: ID!) query
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Note: The ID parameter is legacy_miss_id
            </p>
          </div>

          {/* Search Form */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-4 mb-4">
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
                  ✓ Connected
                </span>
              ) : (
                <span className="text-sm text-red-600 flex items-center gap-1">
                  ✗ Not Connected
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="missionaryId" className="block text-sm font-medium text-gray-700 mb-1">
                  Missionary ID (legacy_miss_id)
                </label>
                <input
                  type="text"
                  id="missionaryId"
                  value={missionaryId}
                  onChange={(e) => setMissionaryId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter legacy missionary ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={searchMissionary}
                disabled={loading || !apiClient}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Search MyPlan Missionary'}
              </button>
              {missionaryData && (
                <button
                  onClick={exportToJson}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Export JSON
                </button>
              )}
            </div>
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Recent Searches</h3>
                <button
                  onClick={clearSearchHistory}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear History
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.slice(0, 5).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => loadFromHistory(item)}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {item.id} ({item.environment})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
              <div className="text-sm text-red-800">
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          {/* Results */}
          {missionaryData && (
            <div className="px-6 py-4">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection('basic')}
                    className="w-full px-4 py-3 text-left font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span>Basic Information</span>
                      <span className="text-gray-500">
                        {expandedSections.has('basic') ? '−' : '+'}
                      </span>
                    </div>
                  </button>
                  {expandedSections.has('basic') && (
                    <div className="px-4 py-3 border-t border-gray-200">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">ID (legacy_miss_id)</dt>
                          <dd className="mt-1 text-sm text-gray-900">{missionaryData.id}</dd>
                        </div>
                        {missionaryData.missionaryId && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Missionary ID</dt>
                            <dd className="mt-1 text-sm text-gray-900">{missionaryData.missionaryId}</dd>
                          </div>
                        )}
                        {missionaryData.cmisId && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">CMIS ID</dt>
                            <dd className="mt-1 text-sm text-gray-900">{missionaryData.cmisId}</dd>
                          </div>
                        )}
                        {missionaryData.ldsAccountId && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">LDS Account ID</dt>
                            <dd className="mt-1 text-sm text-gray-900">{missionaryData.ldsAccountId}</dd>
                          </div>
                        )}
                        {(missionaryData.firstName || missionaryData.lastName) && (
                          <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500">Name</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {[missionaryData.firstName, missionaryData.middleName, missionaryData.lastName, missionaryData.suffix]
                                .filter(Boolean)
                                .join(' ')}
                            </dd>
                          </div>
                        )}
                        {missionaryData.missionaryType && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Missionary Type</dt>
                            <dd className="mt-1 text-sm text-gray-900">{missionaryData.missionaryType}</dd>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Mission Information */}
                {(missionaryData.missionAssignmentLocation || missionaryData.missionOrgNumber || missionaryData.missionName || missionaryData.assignmentEndDate) && (
                  <div className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection('mission')}
                      className="w-full px-4 py-3 text-left font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span>Mission Information</span>
                        <span className="text-gray-500">
                          {expandedSections.has('mission') ? '−' : '+'}
                        </span>
                      </div>
                    </button>
                    {expandedSections.has('mission') && (
                      <div className="px-4 py-3 border-t border-gray-200">
                        <div className="space-y-4">
                          {missionaryData.missionName && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Mission Name</dt>
                              <dd className="mt-1 text-sm text-gray-900">{missionaryData.missionName}</dd>
                            </div>
                          )}
                          {missionaryData.assignmentEndDate && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Assignment End Date</dt>
                              <dd className="mt-1 text-sm text-gray-900">{formatDate(missionaryData.assignmentEndDate)}</dd>
                            </div>
                          )}
                          {missionaryData.missionAssignmentLocation && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500 mb-2">Mission Assignment Location</dt>
                              <dd className="pl-4 border-l-2 border-gray-200">
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                  <div>
                                    <span className="text-xs font-medium text-gray-400">ID:</span>
                                    <span className="ml-1 text-sm text-gray-900">{missionaryData.missionAssignmentLocation.id}</span>
                                  </div>
                                  {missionaryData.missionAssignmentLocation.name && (
                                    <div>
                                      <span className="text-xs font-medium text-gray-400">Name:</span>
                                      <span className="ml-1 text-sm text-gray-900">{missionaryData.missionAssignmentLocation.name}</span>
                                    </div>
                                  )}
                                  {missionaryData.missionAssignmentLocation.assignmentMeetingName && (
                                    <div>
                                      <span className="text-xs font-medium text-gray-400">Meeting Name:</span>
                                      <span className="ml-1 text-sm text-gray-900">{missionaryData.missionAssignmentLocation.assignmentMeetingName}</span>
                                    </div>
                                  )}
                                  {missionaryData.missionAssignmentLocation.status && (
                                    <div>
                                      <span className="text-xs font-medium text-gray-400">Status:</span>
                                      <span className="ml-1 text-sm text-gray-900">
                                        {missionaryData.missionAssignmentLocation.status.label} ({missionaryData.missionAssignmentLocation.status.value})
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </dd>
                            </div>
                          )}
                          {missionaryData.missionOrgNumber && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500 mb-2">Mission Organization</dt>
                              <dd className="pl-4 border-l-2 border-gray-200">
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                  <div>
                                    <span className="text-xs font-medium text-gray-400">ID:</span>
                                    <span className="ml-1 text-sm text-gray-900">{missionaryData.missionOrgNumber.id}</span>
                                  </div>
                                  {missionaryData.missionOrgNumber.organizationId && (
                                    <div>
                                      <span className="text-xs font-medium text-gray-400">Org ID:</span>
                                      <span className="ml-1 text-sm text-gray-900">{missionaryData.missionOrgNumber.organizationId}</span>
                                    </div>
                                  )}
                                  {missionaryData.missionOrgNumber.name && (
                                    <div>
                                      <span className="text-xs font-medium text-gray-400">Name:</span>
                                      <span className="ml-1 text-sm text-gray-900">{missionaryData.missionOrgNumber.name}</span>
                                    </div>
                                  )}
                                  {missionaryData.missionOrgNumber.officialName && (
                                    <div>
                                      <span className="text-xs font-medium text-gray-400">Official Name:</span>
                                      <span className="ml-1 text-sm text-gray-900">{missionaryData.missionOrgNumber.officialName}</span>
                                    </div>
                                  )}
                                </div>
                              </dd>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Training & Learning */}
                {(missionaryData.netdUid || missionaryData.imltModule || missionaryData.netdCourseId || 
                  missionaryData.courseStatusCode || missionaryData.enrolledTimestamp || missionaryData.startTimestamp || 
                  missionaryData.myPlanCompletionTimestamp || missionaryData.myPlanURL) && (
                  <div className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection('training')}
                      className="w-full px-4 py-3 text-left font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span>Training & Learning</span>
                        <span className="text-gray-500">
                          {expandedSections.has('training') ? '−' : '+'}
                        </span>
                      </div>
                    </button>
                    {expandedSections.has('training') && (
                      <div className="px-4 py-3 border-t border-gray-200">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {missionaryData.netdUid && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">NETD UID</dt>
                              <dd className="mt-1 text-sm text-gray-900">{missionaryData.netdUid}</dd>
                            </div>
                          )}
                          {missionaryData.imltModule && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">IMLT Module</dt>
                              <dd className="mt-1 text-sm text-gray-900">{missionaryData.imltModule}</dd>
                            </div>
                          )}
                          {missionaryData.netdCourseId && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">NETD Course ID</dt>
                              <dd className="mt-1 text-sm text-gray-900">{missionaryData.netdCourseId}</dd>
                            </div>
                          )}
                          {missionaryData.courseStatusCode && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Course Status</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {missionaryData.courseStatusName ? 
                                  `${missionaryData.courseStatusName} (${missionaryData.courseStatusCode})` : 
                                  missionaryData.courseStatusCode}
                              </dd>
                            </div>
                          )}
                          {missionaryData.enrolledTimestamp && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Enrolled</dt>
                              <dd className="mt-1 text-sm text-gray-900">{formatDateTime(missionaryData.enrolledTimestamp)}</dd>
                            </div>
                          )}
                          {missionaryData.startTimestamp && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Started</dt>
                              <dd className="mt-1 text-sm text-gray-900">{formatDateTime(missionaryData.startTimestamp)}</dd>
                            </div>
                          )}
                          {missionaryData.myPlanCompletionTimestamp && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">MyPlan Completed</dt>
                              <dd className="mt-1 text-sm text-gray-900">{formatDateTime(missionaryData.myPlanCompletionTimestamp)}</dd>
                            </div>
                          )}
                          <div>
                            <dt className="text-sm font-medium text-gray-500">MyPlan Sharing</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {missionaryData.myPlanSharing ? 'Enabled' : 'Disabled'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">IMOS Report</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {missionaryData.imosReport ? 'Yes' : 'No'}
                            </dd>
                          </div>
                          {missionaryData.myPlanURL && (
                            <div className="sm:col-span-2">
                              <dt className="text-sm font-medium text-gray-500">MyPlan URL</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                <a 
                                  href={missionaryData.myPlanURL} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  {missionaryData.myPlanURL}
                                </a>
                              </dd>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Unit Information */}
                {(missionaryData.cmisUnitId || missionaryData.parentUnitId || missionaryData.procstat) && (
                  <div className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection('units')}
                      className="w-full px-4 py-3 text-left font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span>Unit & Processing Information</span>
                        <span className="text-gray-500">
                          {expandedSections.has('units') ? '−' : '+'}
                        </span>
                      </div>
                    </button>
                    {expandedSections.has('units') && (
                      <div className="px-4 py-3 border-t border-gray-200">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {missionaryData.cmisUnitId && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">CMIS Unit ID</dt>
                              <dd className="mt-1 text-sm text-gray-900">{missionaryData.cmisUnitId}</dd>
                            </div>
                          )}
                          {missionaryData.cmisUnitName && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">CMIS Unit Name</dt>
                              <dd className="mt-1 text-sm text-gray-900">{missionaryData.cmisUnitName}</dd>
                            </div>
                          )}
                          {missionaryData.parentUnitId && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Parent Unit ID</dt>
                              <dd className="mt-1 text-sm text-gray-900">{missionaryData.parentUnitId}</dd>
                            </div>
                          )}
                          {missionaryData.parentUnitName && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Parent Unit Name</dt>
                              <dd className="mt-1 text-sm text-gray-900">{missionaryData.parentUnitName}</dd>
                            </div>
                          )}
                        </div>
                        {missionaryData.procstat && (
                          <div className="mt-4">
                            <dt className="text-sm font-medium text-gray-500 mb-2">Processing Status (Procstat)</dt>
                            <dd className="pl-4 border-l-2 border-gray-200">
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {missionaryData.procstat.id && (
                                  <div>
                                    <span className="text-xs font-medium text-gray-400">ID:</span>
                                    <span className="ml-1 text-sm text-gray-900">{missionaryData.procstat.id}</span>
                                  </div>
                                )}
                                {missionaryData.procstat.key && (
                                  <div>
                                    <span className="text-xs font-medium text-gray-400">Key:</span>
                                    <span className="ml-1 text-sm text-gray-900">{missionaryData.procstat.key}</span>
                                  </div>
                                )}
                                {missionaryData.procstat.description && (
                                  <div className="sm:col-span-2">
                                    <span className="text-xs font-medium text-gray-400">Description:</span>
                                    <span className="ml-1 text-sm text-gray-900">{missionaryData.procstat.description}</span>
                                  </div>
                                )}
                                {missionaryData.procstat.shortDescription && (
                                  <div className="sm:col-span-2">
                                    <span className="text-xs font-medium text-gray-400">Short Description:</span>
                                    <span className="ml-1 text-sm text-gray-900">{missionaryData.procstat.shortDescription}</span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-xs font-medium text-gray-400">Active:</span>
                                  <span className="ml-1 text-sm text-gray-900">
                                    {missionaryData.procstat.active ? 'Yes' : 'No'}
                                  </span>
                                </div>
                              </div>
                            </dd>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
