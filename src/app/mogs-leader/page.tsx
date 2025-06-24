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

interface LeaderAttachment {
  id?: string;
  type?: string;
  filename?: string;
  url?: string;
}

interface LeaderCitizenship {
  id?: string;
  country?: MMSLocation;
  type?: string;
}

interface LeaderNote {
  id?: string;
  note?: string;
  author?: string;
  createDate?: string;
}

interface LeaderPhoto {
  id?: string;
  url?: string;
  filename?: string;
}

interface Leader {
  id?: string;
  spouseCmisId?: number;
  mrn?: string;
  genderCode?: string;
  homeUnit?: MMSOrganization;
  surname?: string;
  givenName?: string;
  preferredSurname?: string;
  preferredGivenName?: string;
  unit?: MMSOrganization;
  startDate?: string;
  endDate?: string;
  ldsEmail?: string;
  personalEmail?: string;
  phone?: string;
  homeAddress?: string;
  homeLocation?: MMSLocation;
  birthDate?: string;
  birthPlace?: string;
  birthLocation?: MMSLocation;
  passportNumber?: string;
  passportExpirationDate?: string;
  contactName?: string;
  contactRelationship?: string;
  contactAddress?: string;
  contactEmail?: string;
  contactPhone?: string;
  loadDate?: string;
  updateDate?: string;
  attachments?: LeaderAttachment[];
  citizenships?: LeaderCitizenship[];
  notes?: LeaderNote[];
  photo?: LeaderPhoto;
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

  const getDisplayName = (leader: Leader) => {
    if (leader.preferredGivenName && leader.preferredSurname) {
      return `${leader.preferredGivenName} ${leader.preferredSurname}`;
    }
    if (leader.givenName && leader.surname) {
      return `${leader.givenName} ${leader.surname}`;
    }
    return 'Unknown';
  };

  const exportToJson = () => {
    if (!leader) return;
    
    const dataStr = JSON.stringify(leader, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `leader-${leader.id}-${new Date().toISOString().split('T')[0]}.json`;
    
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
      query GetLeader($id: ID!) {
        leader(id: $id) {
          id
          spouseCmisId
          mrn
          genderCode
          homeUnit {
            id
            organizationId
            name
            officialName
            shortName
          }
          surname
          givenName
          preferredSurname
          preferredGivenName
          unit {
            id
            organizationId
            name
            officialName
            shortName
          }
          startDate
          endDate
          ldsEmail
          personalEmail
          phone
          homeAddress
          homeLocation {
            id
            iso3Code
            name
            shortName
            abbreviation
          }
          birthDate
          birthPlace
          birthLocation {
            id
            iso3Code
            name
            shortName
            abbreviation
          }
          passportNumber
          passportExpirationDate
          contactName
          contactRelationship
          contactAddress
          contactEmail
          contactPhone
          loadDate
          updateDate
          attachments {
            id
            type
            filename
            url
          }
          citizenships {
            id
            type
            country {
              id
              iso3Code
              name
              shortName
              abbreviation
            }
          }
          notes {
            id
            note
            author
            createDate
          }
          photo {
            id
            url
            filename
          }
        }
      }
    `;

    const variables = { id: leaderId.trim() };

    try {
      const response = await apiClient.executeGraphQLQuery(query, variables);

      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors.map(err => err.message).join(', '));
      }

      if (response.data && (response.data as any).leader) {
        const leaderData = (response.data as any).leader;
        setLeader(leaderData);
        const displayName = getDisplayName(leaderData);
        saveSearchHistory(leaderId.trim(), true, displayName);
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
        <div className="flex items-center gap-4 flex-wrap">
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
          
          <div className="flex items-center gap-2">
            <label htmlFor="leader-quick-select" className="text-sm font-medium text-gray-700">Quick Select:</label>
            <select
              id="leader-quick-select"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  setLeaderId(e.target.value);
                }
              }}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Leader ID</option>
              <option value="24357414916">24357414916</option>
              <option value="2897413143">2897413143</option>
              <option value="1693320715">1693320715</option>
              <option value="11939508170">11939508170</option>
              <option value="11029532291">11029532291</option>
              <option value="10429770569">10429770569</option>
              <option value="24339111456">24339111456</option>
              <option value="23087964784">23087964784</option>
              <option value="24339110473">24339110473</option>
              <option value="22353114287">22353114287</option>
              <option value="7363502601">7363502601</option>
              <option value="2935183935">2935183935</option>
              <option value="2935182952">2935182952</option>
              <option value="2943579738">2943579738</option>
              <option value="3645136025">3645136025</option>
              <option value="3645135042">3645135042</option>
              <option value="17570469339">17570469339</option>
              <option value="18333942830">18333942830</option>
              <option value="3389593379">3389593379</option>
              <option value="3333999814">3333999814</option>
              <option value="20627102924">20627102924</option>
              <option value="484753671">484753671</option>
              <option value="3533289302">3533289302</option>
              <option value="1934172426">1934172426</option>
              <option value="1337986858">1337986858</option>
              <option value="18280619012">18280619012</option>
              <option value="2895739094">2895739094</option>
              <option value="1337987841">1337987841</option>
              <option value="2895741060">2895741060</option>
              <option value="1749978869">1749978869</option>
              <option value="1749979852">1749979852</option>
              <option value="12464193267">12464193267</option>
              <option value="2902811779">2902811779</option>
              <option value="3060591143">3060591143</option>
              <option value="3060592126">3060592126</option>
              <option value="23022500916">23022500916</option>
              <option value="6205793028">6205793028</option>
              <option value="1198986726">1198986726</option>
              <option value="318879302">318879302</option>
              <option value="318878319">318878319</option>
              <option value="2061476824">2061476824</option>
              <option value="3614195117">3614195117</option>
              <option value="19122145652">19122145652</option>
              <option value="20714659717">20714659717</option>
              <option value="1591689328">1591689328</option>
              <option value="5878106046">5878106046</option>
              <option value="1228590754">1228590754</option>
              <option value="13746403722">13746403722</option>
              <option value="13355884363">13355884363</option>
              <option value="346134943">346134943</option>
            </select>
          </div>
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
            {/* Leader Header */}
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">👤</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{getDisplayName(leader)}</h3>
                {leader.id && (
                  <p className="text-gray-600">Leader ID: {leader.id}</p>
                )}
              </div>
            </div>

            {/* Basic Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                <div className="space-y-3">
                  {leader.mrn && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">MRN:</span>
                      <span className="font-mono">{leader.mrn}</span>
                    </div>
                  )}
                  {leader.genderCode && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gender:</span>
                      <span>{leader.genderCode}</span>
                    </div>
                  )}
                  {leader.birthDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Birth Date:</span>
                      <span>{formatDate(leader.birthDate)}</span>
                    </div>
                  )}
                  {leader.birthPlace && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Birth Place:</span>
                      <span>{leader.birthPlace}</span>
                    </div>
                  )}
                  {leader.homeAddress && (
                    <div>
                      <span className="text-gray-600 block mb-1">Home Address:</span>
                      <div className="text-sm bg-gray-50 p-2 rounded whitespace-pre-line">
                        {leader.homeAddress}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Leadership Assignment */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Leadership Assignment</h3>
                <div className="space-y-3">
                  {leader.unit && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unit:</span>
                      <span>{leader.unit.name || leader.unit.shortName || 'N/A'}</span>
                    </div>
                  )}
                  {leader.homeUnit && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Home Unit:</span>
                      <span>{leader.homeUnit.name || leader.homeUnit.shortName || 'N/A'}</span>
                    </div>
                  )}
                  {leader.startDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span>{formatDate(leader.startDate)}</span>
                    </div>
                  )}
                  {leader.endDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span>{formatDate(leader.endDate)}</span>
                    </div>
                  )}
                  {leader.spouseCmisId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Spouse CMIS ID:</span>
                      <span className="font-mono">{leader.spouseCmisId}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {leader.ldsEmail && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">LDS Email:</span>
                      <span className="text-blue-600">{leader.ldsEmail}</span>
                    </div>
                  )}
                  {leader.personalEmail && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Personal Email:</span>
                      <span className="text-blue-600">{leader.personalEmail}</span>
                    </div>
                  )}
                  {leader.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span>{leader.phone}</span>
                    </div>
                  )}
                </div>

                {/* Emergency Contact */}
                {leader.contactName && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Emergency Contact</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span>{leader.contactName}</span>
                      </div>
                      {leader.contactRelationship && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Relationship:</span>
                          <span>{leader.contactRelationship}</span>
                        </div>
                      )}
                      {leader.contactPhone && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span>{leader.contactPhone}</span>
                        </div>
                      )}
                      {leader.contactEmail && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="text-blue-600">{leader.contactEmail}</span>
                        </div>
                      )}
                      {leader.contactAddress && (
                        <div>
                          <span className="text-gray-600 block mb-1">Address:</span>
                          <div className="text-sm bg-white p-2 rounded">
                            {leader.contactAddress}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Location Information */}
            {(leader.homeLocation || leader.birthLocation) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Location Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {leader.homeLocation && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Home Location</h4>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">Name: {leader.homeLocation.name || 'N/A'}</div>
                        <div className="text-sm text-gray-600">Code: {leader.homeLocation.iso3Code || 'N/A'}</div>
                        <div className="text-sm text-gray-600">Short Name: {leader.homeLocation.shortName || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                  {leader.birthLocation && (
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Birth Location</h4>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">Name: {leader.birthLocation.name || 'N/A'}</div>
                        <div className="text-sm text-gray-600">Code: {leader.birthLocation.iso3Code || 'N/A'}</div>
                        <div className="text-sm text-gray-600">Short Name: {leader.birthLocation.shortName || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Passport Information */}
            {(leader.passportNumber || leader.passportExpirationDate) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Passport Information</h3>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="space-y-2">
                    {leader.passportNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Passport Number:</span>
                        <span className="font-mono">{leader.passportNumber}</span>
                      </div>
                    )}
                    {leader.passportExpirationDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expiration Date:</span>
                        <span>{formatDate(leader.passportExpirationDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Citizenships */}
            {leader.citizenships && leader.citizenships.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Citizenships</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {leader.citizenships.map((citizenship, index) => (
                    <div key={index} className="p-4 bg-blue-50 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span>{citizenship.type || 'N/A'}</span>
                        </div>
                        {citizenship.country && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Country:</span>
                              <span>{citizenship.country.name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Code:</span>
                              <span>{citizenship.country.iso3Code || 'N/A'}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {leader.notes && leader.notes.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                <div className="space-y-3">
                  {leader.notes.map((note, index) => (
                    <div key={index} className="p-4 bg-yellow-50 rounded-lg">
                      <div className="mb-2">
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-gray-600">Author: {note.author || 'N/A'}</span>
                          <span className="text-sm text-gray-500">{formatDate(note.createDate)}</span>
                        </div>
                      </div>
                      <p className="text-gray-700">{note.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">System Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Load Information</h4>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">Load Date: {formatDate(leader.loadDate)}</div>
                    <div className="text-sm text-gray-600">Update Date: {formatDate(leader.updateDate)}</div>
                  </div>
                </div>
                {leader.attachments && leader.attachments.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Attachments ({leader.attachments.length})</h4>
                    <div className="space-y-1">
                      {leader.attachments.slice(0, 3).map((attachment, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          {attachment.filename || attachment.type || 'Attachment'}
                        </div>
                      ))}
                      {leader.attachments.length > 3 && (
                        <div className="text-sm text-gray-500">... and {leader.attachments.length - 3} more</div>
                      )}
                    </div>
                  </div>
                )}
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
