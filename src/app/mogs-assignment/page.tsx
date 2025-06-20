'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS, getEnvironmentConfigSafe, getDefaultEnvironment } from '@/lib/environments';

interface Assignment {
  id: string;
  assignmentLocation?: AssignmentLocation;
  component?: Component;
  enabledMember?: EnabledMember;
  callType?: AssignmentCallType;
  status?: AssignmentStatus;
  statusDate?: string;
  earlyRelease?: boolean;
  createdBy?: string;
  dateCreated?: string;
  modifiedBy?: string;
  dateModified?: string;
  trainingFacility?: TrainingFacility;
  arrivalDate?: ArrivalDate;
  onleaveReason?: LabelValueOrder;
  onleave?: boolean;
  missionarySupported?: boolean;
  startDate?: string;
  endDate?: string;
  position?: PositionNameTranslation;
  spousePosition?: PositionNameTranslation;
  trackSchedule?: TrackSchedule;
  approver?: string;
  releaseType?: LabelValue;
  mtcDate?: string;
  chqPaysTravelTo?: boolean;
  chqPaysTravelFrom?: boolean;
  seniorSlot?: SeniorSlot;
  twoTransfer?: boolean;
  hush?: boolean;
  shortTerm?: boolean;
  procstatReason?: ProcstatReason;
  reassignmentStatus?: number;
  seniorDelayedStart?: boolean;
  seniorDelayedReason?: LabelValueOrder;
  onleaveAudit?: OnleaveAudit;
}

interface AssignmentLocation {
  id: string;
  name?: string;
  assignmentMeetingName?: string;
}

interface Component {
  id: string;
  description?: string;
  assignmentMeetingName?: string;
}

interface EnabledMember {
  id: string;
  legacyMissId?: number;
}

interface AssignmentCallType {
  id: string;
  code?: string;
  description?: string;
}

interface AssignmentStatus {
  id: string;
  description?: string;
  sortNumber?: number;
}

interface LabelValue {
  value: number;
  label: string;
}

interface LabelValueOrder extends LabelValue {
  order: number;
}

interface PositionNameTranslation {
  id: string;
  name?: string;
  description?: string;
}

interface TrainingFacility {
  id: string;
}

interface ArrivalDate {
  id: string;
}

interface TrackSchedule {
  id: string;
}

interface SeniorSlot {
  id: string;
}

interface ProcstatReason {
  id: string;
}

interface OnleaveAudit {
  id: string;
  onleaveDate?: string;
  endDate?: string;
  createdBy?: string;
  createdDate?: string;
}

interface SearchHistory {
  id: string;
  timestamp: Date;
  assignmentId: string;
  resultFound: boolean;
  assignmentDescription?: string;
}

export default function MOGSAssignmentPage() {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  
  // Search state
  const [assignmentId, setAssignmentId] = useState('');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>(getDefaultEnvironment('mogs'));

  // Initialize API client
  useEffect(() => {
    try {
      const { config, key } = getEnvironmentConfigSafe(selectedEnvironment, 'mogs');
      console.log(`Initializing API client for environment: ${key}`);
      setApiClient(new ApiClient(config, key));
      setError(null); // Clear any previous errors when switching environments
      
      // Update selected environment if it was corrected
      if (key !== selectedEnvironment) {
        setSelectedEnvironment(key);
      }
    } catch (error) {
      console.error('Failed to initialize API client:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize API client');
      setApiClient(null);
    }
  }, [selectedEnvironment]);

  // Load search history on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('mogs-assignment-search-history');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setSearchHistory(history.map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp)
        })));
      } catch (e) {
        console.error('Failed to load search history:', e);
      }
    }
  }, []);

  // Save search history
  const saveSearchHistory = (id: string, found: boolean, description?: string) => {
    const newEntry: SearchHistory = {
      id: Date.now().toString(),
      timestamp: new Date(),
      assignmentId: id,
      resultFound: found,
      assignmentDescription: description
    };
    
    const updatedHistory = [newEntry, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
    setSearchHistory(updatedHistory);
    localStorage.setItem('mogs-assignment-search-history', JSON.stringify(updatedHistory));
  };

  const searchAssignment = async () => {
    if (!assignmentId.trim()) {
      setError('Please enter an Assignment ID');
      return;
    }

    if (!apiClient) {
      setError('API client not initialized. Please wait a moment or try refreshing the page. If the issue persists, check your environment configuration.');
      return;
    }

    setLoading(true);
    setError(null);
    setAssignment(null);
    
    try {
      const query = `
        query GetAssignment($id: ID!) {
          assignment(id: $id) {
            id
            assignmentLocation {
              id
              name
              assignmentMeetingName
            }
            component {
              id
              description
              assignmentMeetingName
            }
            enabledMember {
              id
              legacyMissId
            }
            callType {
              id
              code
              description
            }
            status {
              id
              description
              sortNumber
            }
            statusDate
            earlyRelease
            createdBy
            dateCreated
            modifiedBy
            dateModified
            trainingFacility {
              id
            }
            arrivalDate {
              id
            }
            onleaveReason {
              value
              label
              order
            }
            onleave
            missionarySupported
            startDate
            endDate
            position {
              id
              name
              description
            }
            spousePosition {
              id
              name
              description
            }
            trackSchedule {
              id
            }
            approver
            releaseType {
              value
              label
            }
            mtcDate
            chqPaysTravelTo
            chqPaysTravelFrom
            seniorSlot {
              id
            }
            twoTransfer
            hush
            shortTerm
            procstatReason {
              id
            }
            reassignmentStatus
            seniorDelayedStart
            seniorDelayedReason {
              value
              label
              order
            }
            onleaveAudit {
              id
              onleaveDate
              endDate
              createdBy
              createdDate
            }
          }
        }
      `;

      const variables = { id: assignmentId };
      const response = await apiClient.executeGraphQLQuery(query, variables);

      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const result = response.data as { assignment: Assignment };
      setAssignment(result.assignment);
      
      // Save to search history
      const description = result.assignment?.assignmentLocation?.name || result.assignment?.component?.description || 'Assignment';
      saveSearchHistory(assignmentId, !!result.assignment, description);
      
      if (!result.assignment) {
        setError(`No assignment found with ID: ${assignmentId}`);
      }
      
    } catch (err) {
      console.error('Error fetching assignment:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assignment');
      saveSearchHistory(assignmentId, false);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFromHistory = (historyEntry: SearchHistory) => {
    setAssignmentId(historyEntry.assignmentId);
    setAssignmentId(historyEntry.assignmentId);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('mogs-assignment-search-history');
  };

  const clearSearch = () => {
    setAssignmentId('');
    setAssignment(null);
    setError(null);
  };

  const exportToJson = () => {
    if (!assignment) return;
    
    const dataStr = JSON.stringify(assignment, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assignment-${assignment.id}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">📋</span>
        <h1 className="text-2xl font-bold">MOGS Assignment</h1>
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Search Assignment by ID</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="assignment-id" className="block text-sm font-medium text-gray-700 mb-1">Assignment ID</label>
            <input
              id="assignment-id"
              type="text"
              placeholder="Enter assignment ID"
              value={assignmentId}
              onChange={(e) => setAssignmentId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchAssignment()}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={searchAssignment}
            disabled={loading || !assignmentId.trim()}
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

      {/* Assignment Details */}
      {assignment && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Assignment Details</h2>
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
                      <span className="text-gray-600">Assignment ID:</span>
                      <span className="font-mono">{assignment.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span>{formatDate(assignment.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span>{formatDate(assignment.endDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status Date:</span>
                      <span>{formatDateTime(assignment.statusDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">MTC Date:</span>
                      <span>{formatDate(assignment.mtcDate)}</span>
                    </div>
                  </div>
                </div>

                {assignment.status && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Description:</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">{assignment.status.description}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sort Number:</span>
                        <span>{assignment.status.sortNumber}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {assignment.assignmentLocation && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Assignment Location</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID:</span>
                        <span className="font-mono">{assignment.assignmentLocation.id}</span>
                      </div>
                      {assignment.assignmentLocation.name && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name:</span>
                          <span>{assignment.assignmentLocation.name}</span>
                        </div>
                      )}
                      {assignment.assignmentLocation.assignmentMeetingName && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Meeting Name:</span>
                          <span>{assignment.assignmentLocation.assignmentMeetingName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {assignment.component && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Component</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID:</span>
                        <span className="font-mono">{assignment.component.id}</span>
                      </div>
                      {assignment.component.description && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Description:</span>
                          <span>{assignment.component.description}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {assignment.callType && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Call Type</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Code:</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{assignment.callType.code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Description:</span>
                        <span>{assignment.callType.description}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Positions */}
            {(assignment.position || assignment.spousePosition) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Positions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignment.position && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Primary Position</h4>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">Name: {assignment.position.name}</div>
                        {assignment.position.description && (
                          <div className="text-sm text-gray-600">Description: {assignment.position.description}</div>
                        )}
                      </div>
                    </div>
                  )}
                  {assignment.spousePosition && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Spouse Position</h4>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">Name: {assignment.spousePosition.name}</div>
                        {assignment.spousePosition.description && (
                          <div className="text-sm text-gray-600">Description: {assignment.spousePosition.description}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Flags and Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Flags & Settings</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${assignment.earlyRelease ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Early Release</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${assignment.onleave ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">On Leave</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${assignment.missionarySupported ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Missionary Supported</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${assignment.hush ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Hush</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${assignment.shortTerm ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Short Term</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${assignment.twoTransfer ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Two Transfer</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${assignment.chqPaysTravelTo ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">CHQ Pays Travel To</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${assignment.chqPaysTravelFrom ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">CHQ Pays Travel From</span>
                </div>
              </div>
            </div>

            {/* Administrative Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Administrative</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created By:</span>
                    <span>{assignment.createdBy || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date Created:</span>
                    <span>{formatDateTime(assignment.dateCreated)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Modified By:</span>
                    <span>{assignment.modifiedBy || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date Modified:</span>
                    <span>{formatDateTime(assignment.dateModified)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Approver:</span>
                    <span>{assignment.approver || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reassignment Status:</span>
                    <span>{assignment.reassignmentStatus || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Senior Delayed Start:</span>
                    <span>{assignment.seniorDelayedStart ? 'Yes' : 'No'}</span>
                  </div>
                </div>
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
            {searchHistory.map((entry) => (
              <div key={entry.id} className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => handleLoadFromHistory(entry)}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">Assignment ID: {entry.assignmentId}</div>
                    {entry.assignmentDescription && (
                      <div className="text-sm text-gray-600">{entry.assignmentDescription}</div>
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

      {!loading && !assignment && !error && (
        <div className="text-center py-8 text-gray-500">
          Enter an Assignment ID to search for assignment details.
        </div>
      )}
    </div>
  );
}
