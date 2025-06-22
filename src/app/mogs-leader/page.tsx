'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

// TypeScript interfaces matching the MOGS GraphQL schema
interface MMSLocation {
  id?: string;
  iso3Code?: string;
  name?: string;
  shortName?: string;
  abbreviation?: string;
}

interface MMSOrganization {
  id?: string;
  organizationId?: number;
  name?: string;
  officialName?: string;
  shortName?: string;
}

interface Leader {
  id?: string;
  leaderId?: number;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  preferredName?: string;
  title?: string;
  fullName?: string;
  gender?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  nationality?: MMSLocation;
  citizenship?: MMSLocation;
  homeCountry?: MMSLocation;
  homeLocation?: MMSLocation;
  emailPersonal?: string;
  phonePersonal?: string;
  phoneBusiness?: string;
  spouseName?: string;
  spouseEmail?: string;
  spousePhone?: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  emergencyContactEmail?: string;
  maritalStatus?: string;
  children?: number;
  education?: string;
  yearsInMinistry?: number;
  yearsWithOrganization?: number;
  bio?: string;
  primaryOrganization?: MMSOrganization;
  primaryLocation?: MMSLocation;
  currentAssignment?: string;
  currentAssignmentStartDate?: string;
  currentAssignmentEndDate?: string;
  currentAssignmentStatus?: string;
  supervisor?: Leader;
  skills?: string[];
  languages?: string[];
  ministryExperience?: string[];
  specialInterests?: string[];
  notes?: string;
  status?: string;
  active?: boolean;
  createDate?: string;
  createdBy?: string;
  updateDate?: string;
  updatedBy?: string;
}

interface SearchHistory {
  id: string;
  leaderId: string;
  timestamp: Date;
  resultFound: boolean;
  leaderName?: string;
}

export default function MOGSLeaderPage() {
  const [selectedEnvironment, setSelectedEnvironment] = useState('mogs-gql-dev');
  const [leaderId, setLeaderId] = useState('');
  const [leader, setLeader] = useState<Leader | null>(null);
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
    if (!leader) return;
    
    const dataStr = JSON.stringify(leader, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `leader-${leader.leaderId}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const clearSearch = () => {
    setLeaderId('');
    setLeader(null);
    setError(null);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('mogs-leader-search-history');
  };

  const handleLoadFromHistory = (entry: SearchHistory) => {
    setLeaderId(entry.leaderId);
  };

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mogs-leader-search-history');
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

  const saveSearchHistory = (searchLeaderId: string, found: boolean, leaderName?: string) => {
    const newEntry: SearchHistory = {
      id: Date.now().toString(),
      leaderId: searchLeaderId,
      timestamp: new Date(),
      resultFound: found,
      leaderName
    };
    
    const updatedHistory = [newEntry, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
    setSearchHistory(updatedHistory);
    localStorage.setItem('mogs-leader-search-history', JSON.stringify(updatedHistory));
  };

  const searchLeader = async () => {
    if (!apiClient) {
      setError('API client not initialized. Please refresh the page.');
      return;
    }

    if (!leaderId.trim()) {
      setError('Please enter a Leader ID');
      return;
    }

    setLoading(true);
    setError(null);
    setLeader(null);

    const query = `
      query GetLeader($id: Int!) {
        leader(id: $id) {
          id
          leaderId
          firstName
          lastName
          middleName
          preferredName
          title
          fullName
          gender
          dateOfBirth
          placeOfBirth
          nationality {
            id
            iso3Code
            name
            shortName
            abbreviation
          }
          citizenship {
            id
            iso3Code
            name
            shortName
            abbreviation
          }
          homeCountry {
            id
            iso3Code
            name
            shortName
            abbreviation
          }
          homeLocation {
            id
            iso3Code
            name
            shortName
            abbreviation
          }
          emailPersonal
          phonePersonal
          phoneBusiness
          spouseName
          spouseEmail
          spousePhone
          emergencyContactName
          emergencyContactRelationship
          emergencyContactPhone
          emergencyContactEmail
          maritalStatus
          children
          education
          yearsInMinistry
          yearsWithOrganization
          bio
          primaryOrganization {
            id
            organizationId
            name
            officialName
            shortName
          }
          primaryLocation {
            id
            iso3Code
            name
            shortName
            abbreviation
          }
          currentAssignment
          currentAssignmentStartDate
          currentAssignmentEndDate
          currentAssignmentStatus
          supervisor {
            id
            leaderId
            firstName
            lastName
            fullName
          }
          skills
          languages
          ministryExperience
          specialInterests
          notes
          status
          active
          createDate
          createdBy
          updateDate
          updatedBy
        }
      }
    `;

    const variables = { id: parseInt(leaderId.trim()) };

    try {
      const response = await apiClient.executeGraphQLQuery(query, variables);

      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors.map(err => err.message).join(', '));
      }

      if (response.data && (response.data as any).leader) {
        const leaderData = (response.data as any).leader;
        setLeader(leaderData);
        saveSearchHistory(leaderId.trim(), true, leaderData.fullName);
      } else {
        setError('No leader found with the provided ID');
        saveSearchHistory(leaderId.trim(), false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      saveSearchHistory(leaderId.trim(), false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">👤</span>
        <h1 className="text-2xl font-bold">MOGS Leader</h1>
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Search Leader by ID</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="leader-id" className="block text-sm font-medium text-gray-700 mb-1">Leader ID (Required)</label>
            <input
              id="leader-id"
              type="text"
              placeholder="Enter leader ID"
              value={leaderId}
              onChange={(e) => setLeaderId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchLeader()}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={searchLeader}
            disabled={loading || !leaderId.trim() || !apiClient}
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

      {/* Leader Details */}
      {leader && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Leader Details</h2>
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
                      <span className="text-gray-600">Leader ID:</span>
                      <span className="font-mono">{leader.leaderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Full Name:</span>
                      <span>{leader.fullName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">First Name:</span>
                      <span>{leader.firstName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Name:</span>
                      <span>{leader.lastName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Title:</span>
                      <span>{leader.title || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Personal Email:</span>
                      <span>{leader.emailPersonal || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Personal Phone:</span>
                      <span>{leader.phonePersonal || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Business Phone:</span>
                      <span>{leader.phoneBusiness || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        leader.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {leader.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Details */}
            {(leader.gender || leader.dateOfBirth || leader.maritalStatus || leader.children) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gender:</span>
                      <span>{leader.gender || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date of Birth:</span>
                      <span>{formatDate(leader.dateOfBirth)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Marital Status:</span>
                      <span>{leader.maritalStatus || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Children:</span>
                      <span>{leader.children || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Organization Information */}
            {leader.primaryOrganization && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Organization Information</h3>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Primary Organization</h4>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">Name: {leader.primaryOrganization.name || 'N/A'}</div>
                    <div className="text-sm text-gray-600">Official Name: {leader.primaryOrganization.officialName || 'N/A'}</div>
                    <div className="text-sm text-gray-600">Short Name: {leader.primaryOrganization.shortName || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Skills and Experience */}
            {(leader.skills?.length || leader.languages?.length || leader.ministryExperience?.length || leader.specialInterests?.length) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills & Experience</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {leader.skills?.length && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Skills:</h4>
                      <div className="flex flex-wrap gap-2">
                        {leader.skills.map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {leader.languages?.length && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Languages:</h4>
                      <div className="flex flex-wrap gap-2">
                        {leader.languages.map((language, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                            {language}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Biography */}
            {leader.bio && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Biography</h3>
                <p className="text-gray-700 leading-relaxed">{leader.bio}</p>
              </div>
            )}

            {/* Notes */}
            {leader.notes && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                <p className="text-gray-700 leading-relaxed">{leader.notes}</p>
              </div>
            )}

            {/* System Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">System Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Creation Info</h4>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">Created By: {leader.createdBy || 'N/A'}</div>
                    <div className="text-sm text-gray-600">Date Created: {formatDate(leader.createDate)}</div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Modification Info</h4>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">Updated By: {leader.updatedBy || 'N/A'}</div>
                    <div className="text-sm text-gray-600">Date Updated: {formatDate(leader.updateDate)}</div>
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
                    <div className="font-medium">Leader ID: {entry.leaderId}</div>
                    {entry.leaderName && (
                      <div className="text-sm text-gray-600">{entry.leaderName}</div>
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

      {!loading && !leader && !error && (
        <div className="text-center py-8 text-gray-500">
          Enter a Leader ID to search for leader details.
        </div>
      )}
    </div>
  );
}
