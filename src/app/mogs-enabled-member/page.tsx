'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

// TypeScript interfaces matching the MOGS GraphQL schema
interface MMSOrganization {
  id?: string;
  name?: string;
  unitNumber?: number;
  type?: string;
}

interface MMSLocation {
  id?: string;
  name?: string;
  code?: string;
}

interface MissionaryType {
  id?: string;
  name?: string;
  description?: string;
}

interface LanguageAddendum {
  id?: string;
  name?: string;
  code?: string;
}

interface Procstat {
  id?: string;
  name?: string;
  description?: string;
}

interface InHushPeriod {
  id?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
}

interface EnabledMember {
  id: string;
  enabledMemberDate?: string;
  homeUnit?: MMSOrganization;
  tempUnit?: MMSOrganization;
  missionaryType?: MissionaryType;
  language?: LanguageAddendum;
  procstat?: Procstat;
  inindrfn?: string;
  spouseInindrfn?: string;
  procstatDate?: string;
  legacyMissId?: number;
  legacySpouseMissId?: number;
  currentAvailabilityDate?: string;
  releaseInfoAuthDate?: string;
  enabledByRoleId?: number;
  pendingPapers?: boolean;
  alert?: string;
  spouseReleaseInfoAuthDate?: string;
  callLetterSentDate?: string;
  hold?: boolean;
  createdBy?: string;
  dateCreated?: string;
  modifiedBy?: string;
  dateModified?: string;
  legacy?: boolean;
  initiatedVersion?: number;
  pendingTranslationState?: number;
  missionStartDate?: string;
  releaseDate?: string;
  anniversaryDate?: string;
  releaseDateChangeDate?: string;
  leaderVisibility?: boolean;
  termMonths?: number;
  recommendFormTypeId?: number;
  addressConfirmPending?: boolean;
  initialAssignmentDate?: string;
  otxSyncCol?: string;
  imageProcessed?: boolean;
  missionaryAuthPin?: number;
  pinEnteredDate?: string;
  callPacketImmunization?: boolean;
  callPacketPortal?: boolean;
  cmisUnitId?: number;
  missionarySearchOTX?: boolean;
  ldsAccountId?: string;
  spouseLdsAccountId?: string;
  cmisId?: string;
  spouseCmisId?: string;
  doNotPurge?: boolean;
  hushEndDate?: string;
  callNotificationId?: number;
  callLetterPageVisitTimestamp?: string;
  inqMigrationDate?: string;
  inHushPeriod?: InHushPeriod;
}

interface SearchHistory {
  id: string;
  enabledMemberId: string;
  timestamp: Date;
  resultFound: boolean;
  enabledMemberData?: string;
}

export default function MOGSEnabledMemberPage() {
  const [selectedEnvironment, setSelectedEnvironment] = useState('mogs-gql-dev');
  const [enabledMemberId, setEnabledMemberId] = useState('');
  const [enabledMember, setEnabledMember] = useState<EnabledMember | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);

  // Utility functions
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const exportToJson = () => {
    if (!enabledMember) return;
    
    const dataStr = JSON.stringify(enabledMember, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `enabled-member-${enabledMember.id}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const clearSearch = () => {
    setEnabledMemberId('');
    setEnabledMember(null);
    setError(null);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('mogs-enabled-member-search-history');
  };

  const handleLoadFromHistory = (entry: SearchHistory) => {
    setEnabledMemberId(entry.enabledMemberId);
    // Optionally trigger a search immediately
    if (apiClient) {
      searchEnabledMember();
    }
  };

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mogs-enabled-member-search-history');
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

  const saveSearchHistory = (memberId: string, found: boolean, memberData?: string) => {
    const newEntry: SearchHistory = {
      id: Date.now().toString(),
      enabledMemberId: memberId,
      timestamp: new Date(),
      resultFound: found,
      enabledMemberData: memberData
    };
    
    const updatedHistory = [newEntry, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
    setSearchHistory(updatedHistory);
    localStorage.setItem('mogs-enabled-member-search-history', JSON.stringify(updatedHistory));
  };

  const searchEnabledMember = async () => {
    if (!apiClient) {
      setError('API client not initialized. Please refresh the page.');
      return;
    }

    if (!enabledMemberId.trim()) {
      setError('Please enter an Enabled Member ID');
      return;
    }

    setLoading(true);
    setError(null);
    setEnabledMember(null);

    const query = `
      query GetEnabledMember($id: ID!) {
        enabledMember(id: $id) {
          id
          enabledMemberDate
          homeUnit {
            id
            name
            unitNumber
            type
          }
          tempUnit {
            id
            name
            unitNumber
            type
          }
          missionaryType {
            id
            name
            description
          }
          language {
            id
            name
            code
          }
          procstat {
            id
            name
            description
          }
          inindrfn
          spouseInindrfn
          procstatDate
          legacyMissId
          legacySpouseMissId
          currentAvailabilityDate
          releaseInfoAuthDate
          enabledByRoleId
          pendingPapers
          alert
          spouseReleaseInfoAuthDate
          callLetterSentDate
          hold
          createdBy
          dateCreated
          modifiedBy
          dateModified
          legacy
          initiatedVersion
          pendingTranslationState
          missionStartDate
          releaseDate
          anniversaryDate
          releaseDateChangeDate
          leaderVisibility
          termMonths
          recommendFormTypeId
          addressConfirmPending
          initialAssignmentDate
          otxSyncCol
          imageProcessed
          missionaryAuthPin
          pinEnteredDate
          callPacketImmunization
          callPacketPortal
          cmisUnitId
          missionarySearchOTX
          ldsAccountId
          spouseLdsAccountId
          cmisId
          spouseCmisId
          doNotPurge
          hushEndDate
          callNotificationId
          callLetterPageVisitTimestamp
          inqMigrationDate
          inHushPeriod {
            id
            startDate
            endDate
            reason
          }
        }
      }
    `;

    const variables = { id: enabledMemberId.trim() };

    try {
      const response = await apiClient.executeGraphQLQuery(query, variables);

      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors.map(err => err.message).join(', '));
      }

      if (response.data && (response.data as any).enabledMember) {
        const enabledMemberData = (response.data as any).enabledMember;
        setEnabledMember(enabledMemberData);
        saveSearchHistory(enabledMemberId.trim(), true, enabledMemberData.id);
      } else {
        setError('No enabled member found with the provided ID');
        saveSearchHistory(enabledMemberId.trim(), false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      saveSearchHistory(enabledMemberId.trim(), false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">👤</span>
        <h1 className="text-2xl font-bold">MOGS Enabled Member</h1>
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
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Search Enabled Member by ID</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="enabled-member-id" className="block text-sm font-medium text-gray-700 mb-1">Enabled Member ID (Required)</label>
            <input
              id="enabled-member-id"
              type="text"
              placeholder="Enter enabled member ID"
              value={enabledMemberId}
              onChange={(e) => setEnabledMemberId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchEnabledMember()}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={searchEnabledMember}
            disabled={loading || !enabledMemberId.trim() || !apiClient}
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

      {/* Enabled Member Details */}
      {enabledMember && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Enabled Member Details</h2>
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
                      <span className="text-gray-600">Member ID:</span>
                      <span className="font-mono">{enabledMember.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Enabled Date:</span>
                      <span>{formatDate(enabledMember.enabledMemberDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CMIS ID:</span>
                      <span className="font-mono">{enabledMember.cmisId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">LDS Account ID:</span>
                      <span className="font-mono">{enabledMember.ldsAccountId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Legacy Miss ID:</span>
                      <span>{enabledMember.legacyMissId || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Status Flags</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pending Papers:</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        enabledMember.pendingPapers ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {enabledMember.pendingPapers ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hold:</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        enabledMember.hold ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {enabledMember.hold ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Legacy:</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        enabledMember.legacy ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {enabledMember.legacy ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Leader Visibility:</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        enabledMember.leaderVisibility ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {enabledMember.leaderVisibility ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Mission Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mission Start Date:</span>
                      <span>{formatDate(enabledMember.missionStartDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Release Date:</span>
                      <span>{formatDate(enabledMember.releaseDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Anniversary Date:</span>
                      <span>{formatDate(enabledMember.anniversaryDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Term (Months):</span>
                      <span>{enabledMember.termMonths || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Availability:</span>
                      <span>{formatDate(enabledMember.currentAvailabilityDate)}</span>
                    </div>
                  </div>
                </div>

                {enabledMember.alert && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Alert</h4>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">{enabledMember.alert}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Organization Information */}
            {(enabledMember.homeUnit || enabledMember.tempUnit) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Organization Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enabledMember.homeUnit && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Home Unit</h4>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">ID: {enabledMember.homeUnit.id || 'N/A'}</div>
                        <div className="text-sm text-gray-600">Name: {enabledMember.homeUnit.name || 'N/A'}</div>
                        <div className="text-sm text-gray-600">Unit Number: {enabledMember.homeUnit.unitNumber || 'N/A'}</div>
                        <div className="text-sm text-gray-600">Type: {enabledMember.homeUnit.type || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                  {enabledMember.tempUnit && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Temporary Unit</h4>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">ID: {enabledMember.tempUnit.id || 'N/A'}</div>
                        <div className="text-sm text-gray-600">Name: {enabledMember.tempUnit.name || 'N/A'}</div>
                        <div className="text-sm text-gray-600">Unit Number: {enabledMember.tempUnit.unitNumber || 'N/A'}</div>
                        <div className="text-sm text-gray-600">Type: {enabledMember.tempUnit.type || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Language and Type Information */}
            {(enabledMember.language || enabledMember.missionaryType || enabledMember.procstat) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Language & Type Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {enabledMember.language && (
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Language</h4>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">ID: {enabledMember.language.id}</div>
                        <div className="text-sm text-gray-600">Name: {enabledMember.language.name || 'N/A'}</div>
                        <div className="text-sm text-gray-600">Code: {enabledMember.language.code || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                  {enabledMember.missionaryType && (
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Missionary Type</h4>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">ID: {enabledMember.missionaryType.id}</div>
                        <div className="text-sm text-gray-600">Name: {enabledMember.missionaryType.name || 'N/A'}</div>
                        <div className="text-sm text-gray-600">Description: {enabledMember.missionaryType.description || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                  {enabledMember.procstat && (
                    <div className="p-4 bg-teal-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Process Status</h4>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">ID: {enabledMember.procstat.id}</div>
                        <div className="text-sm text-gray-600">Name: {enabledMember.procstat.name || 'N/A'}</div>
                        <div className="text-sm text-gray-600">Description: {enabledMember.procstat.description || 'N/A'}</div>
                        <div className="text-sm text-gray-600">Date: {formatDate(enabledMember.procstatDate)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Hush Period Information */}
            {enabledMember.inHushPeriod && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Hush Period Information</h3>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">ID: {enabledMember.inHushPeriod.id}</div>
                    <div className="text-sm text-gray-600">Start Date: {formatDate(enabledMember.inHushPeriod.startDate)}</div>
                    <div className="text-sm text-gray-600">End Date: {formatDate(enabledMember.inHushPeriod.endDate)}</div>
                    <div className="text-sm text-gray-600">Reason: {enabledMember.inHushPeriod.reason || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* System Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">System Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Creation Info</h4>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">Created By: {enabledMember.createdBy || 'N/A'}</div>
                    <div className="text-sm text-gray-600">Date Created: {formatDate(enabledMember.dateCreated)}</div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Modification Info</h4>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">Modified By: {enabledMember.modifiedBy || 'N/A'}</div>
                    <div className="text-sm text-gray-600">Date Modified: {formatDate(enabledMember.dateModified)}</div>
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
                    <div className="font-medium">Enabled Member ID: {entry.enabledMemberId}</div>
                    {entry.enabledMemberData && (
                      <div className="text-sm text-gray-600">Member Data: {entry.enabledMemberData}</div>
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

      {!loading && !enabledMember && !error && (
        <div className="text-center py-8 text-gray-500">
          Enter an Enabled Member ID to search for member details.
        </div>
      )}
    </div>
  );
}
