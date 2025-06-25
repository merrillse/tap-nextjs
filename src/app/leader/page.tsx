'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

// TypeScript interfaces based on the GraphQL schema
interface LeaderCitizenship {
  // Define citizenship fields if needed
}

interface LeaderImage {
  id?: string;
  cmisId?: string;
  photo?: string;
}

interface Leader {
  cmisId?: string;
  spouseCmisId?: string;
  mrn?: string;
  genderCode?: string;
  homeUnitNumber?: number;
  surname?: string;
  givenName?: string;
  preferredSurname?: string;
  preferredGivenName?: string;
  leaderUnitNumber?: number;
  startDate?: string;
  endDate?: string;
  ldsEmail?: string;
  personalEmail?: string;
  phone?: string;
  homeAddress?: string;
  homeLocationId?: number;
  birthDate?: string;
  birthPlace?: string;
  birthLocationId?: number;
  passportNumber?: string;
  passportExpirationDate?: string;
  contactName?: string;
  contactRelationship?: string;
  contactAddress?: string;
  contactEmail?: string;
  contactPhone?: string;
  leaderImage?: LeaderImage;
  citizenships?: LeaderCitizenship[];
}

interface SearchHistory {
  fieldName: string;
  value: string;
  timestamp: number;
}

export default function LeaderPage() {
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState('mis-gql-dev');
  
  const [cmisId, setCmisId] = useState('');
  const [leader, setLeader] = useState<Leader | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  // Initialize API client when environment changes
  useEffect(() => {
    const config = ENVIRONMENTS[selectedEnvironment];
    if (config) {
      setApiClient(new ApiClient(config, selectedEnvironment));
    }
  }, [selectedEnvironment]);

  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('leader-search-history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setSearchHistory(parsedHistory);
      } catch (err) {
        console.error('Error loading search history:', err);
      }
    }
    setIsHistoryLoaded(true);
  }, []);

  // Save search history to localStorage whenever it changes (but not on initial load)
  useEffect(() => {
    if (isHistoryLoaded) {
      localStorage.setItem('leader-search-history', JSON.stringify(searchHistory));
    }
  }, [searchHistory, isHistoryLoaded]);

  const addToSearchHistory = (fieldName: string, value: string) => {
    if (!value.trim()) return;
    
    const newEntry: SearchHistory = {
      fieldName,
      value: value.trim(),
      timestamp: Date.now()
    };
    
    setSearchHistory(prev => {
      // Remove any existing entries with the same field and value
      const filtered = prev.filter(entry => 
        !(entry.fieldName === fieldName && entry.value === value.trim())
      );
      
      // Add new entry at the beginning and keep only last 10
      return [newEntry, ...filtered].slice(0, 10);
    });
  };

  const buildLeaderQuery = (cmisId: string) => {
    return `
      query GetLeader {
        leader(cmisId: "${cmisId}") {
          cmisId
          spouseCmisId
          mrn
          genderCode
          homeUnitNumber
          surname
          givenName
          preferredSurname
          preferredGivenName
          leaderUnitNumber
          leaderImage {
            id
            cmisId
            photo
          } 
          startDate
          endDate
          ldsEmail
          personalEmail
          phone
          homeAddress
          homeLocationId
          birthDate
          birthPlace
          birthLocationId
          contactName
          contactRelationship
          contactAddress
          contactEmail
          contactPhone
        }
      }
    `;
  };

  const handleSearch = async () => {
    if (!apiClient) {
      setError('API client not initialized');
      return;
    }

    if (!cmisId.trim()) {
      setError('Please provide a CMIS ID');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Add to search history
      addToSearchHistory('cmisId', cmisId);

      const query = buildLeaderQuery(cmisId.trim());
      console.log('Executing GraphQL query:', query);

      const response = await apiClient.executeGraphQLQuery(query);
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const data = response.data as { leader: Leader };
      setLeader(data.leader || null);
      
      // Debug logging for photo data
      if (data.leader?.leaderImage) {
        console.log('Leader image data:', data.leader.leaderImage);
        console.log('Photo URL:', data.leader.leaderImage.photo);
      } else {
        console.log('No leader image data found');
      }
      
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
      setLeader(null);
    } finally {
      setLoading(false);
    }
  };

  const useHistoryValue = (fieldName: string, value: string) => {
    if (fieldName === 'cmisId') {
      setCmisId(value);
    }
  };

  const getFieldLabel = (fieldName: string) => {
    const labels: Record<string, string> = {
      cmisId: 'CMIS ID'
    };
    return labels[fieldName] || fieldName;
  };

  // Helper function to format photo URL for display
  const formatPhotoUrl = (photoData?: string) => {
    if (!photoData) return null;
    
    // If it's already a data URL, use as-is
    if (photoData.startsWith('data:')) {
      return photoData;
    }
    
    // If it's base64 data without the data URL prefix, add it
    // Most leader photos from the GraphQL API are JPEG format
    if (photoData.match(/^[A-Za-z0-9+/]+=*$/)) {
      return `data:image/jpeg;base64,${photoData}`;
    }
    
    // If it's a regular URL, use as-is
    return photoData;
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

  // Get only MIS environments for leader search
  const misEnvironments = Object.entries(ENVIRONMENTS).filter(([key]) => 
    key.startsWith('mis-gql-')
  );

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
    
    const exportFileDefaultName = `leader-${leader.cmisId}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const clearSearch = () => {
    setCmisId('');
    setLeader(null);
    setError(null);
    setHasSearched(false);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('leader-search-history');
  };

  const handleLoadFromHistory = (entry: SearchHistory) => {
    setCmisId(entry.value);
    if (apiClient) {
      handleSearch();
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">👤</span>
        <h1 className="text-2xl font-bold">Leader Search</h1>
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
            {misEnvironments.map(([key, env]) => (
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
                  setCmisId(e.target.value);
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Search Leader by CMIS ID</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="cmis-id" className="block text-sm font-medium text-gray-700 mb-1">CMIS ID (Required)</label>
            <input
              id="cmis-id"
              type="text"
              placeholder="Enter CMIS ID"
              value={cmisId}
              onChange={(e) => setCmisId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !cmisId.trim() || !apiClient}
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
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((entry, index) => (
              <button
                key={`${entry.fieldName}-${entry.value}-${index}`}
                onClick={() => useHistoryValue(entry.fieldName, entry.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-300"
              >
                {getFieldLabel(entry.fieldName)}: {entry.value}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">Click any value to use it in your search</p>
        </div>
      )}

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
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-lg">
                {leader.leaderImage?.photo && formatPhotoUrl(leader.leaderImage.photo) ? (
                  <img
                    src={formatPhotoUrl(leader.leaderImage.photo) || ''}
                    alt={`${getDisplayName(leader)} photo`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Failed to load leader image:', leader.leaderImage?.photo);
                      console.error('Formatted URL:', formatPhotoUrl(leader.leaderImage?.photo));
                      // Replace with fallback
                      const target = e.target as HTMLImageElement;
                      target.outerHTML = `
                        <div class="w-full h-full bg-blue-600 flex items-center justify-center">
                          <span class="text-white text-xl">👤</span>
                        </div>
                      `;
                    }}
                    onLoad={() => {
                      console.log('Leader photo loaded successfully');
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-xl">👤</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-gray-900">{getDisplayName(leader)}</h3>
                {leader.cmisId && (
                  <p className="text-gray-600">CMIS ID: {leader.cmisId}</p>
                )}
                {leader.leaderImage?.photo && (
                  <p className="text-xs text-gray-500 mt-1">📷 Photo loaded ({leader.leaderImage.photo.length} chars)</p>
                )}
              </div>
            </div>

            {/* Basic Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Leader Photo (if available) */}
              {leader.leaderImage?.photo && formatPhotoUrl(leader.leaderImage.photo) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Leader Photo</h3>
                  <div className="flex justify-center">
                    <div className="w-48 h-48 rounded-lg overflow-hidden border-2 border-gray-200 shadow-md">
                      <img
                        src={formatPhotoUrl(leader.leaderImage.photo) || ''}
                        alt={`${getDisplayName(leader)} photo`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Failed to load leader image:', leader.leaderImage?.photo);
                          console.error('Formatted URL:', formatPhotoUrl(leader.leaderImage?.photo));
                          const target = e.target as HTMLImageElement;
                          target.outerHTML = `
                            <div class="w-full h-full bg-gray-100 flex items-center justify-center">
                              <div class="text-center">
                                <span class="text-gray-400 text-4xl block">👤</span>
                                <span class="text-gray-500 text-sm">Photo unavailable</span>
                              </div>
                            </div>
                          `;
                        }}
                        onLoad={() => {
                          console.log('Large leader photo loaded successfully');
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    {leader.leaderImage.id && (
                      <p className="text-xs text-gray-500">Image ID: {leader.leaderImage.id}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Base64 data: {leader.leaderImage.photo.substring(0, 50)}...
                    </p>
                  </div>
                </div>
              )}

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
                  {leader.leaderUnitNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Leader Unit:</span>
                      <span>{leader.leaderUnitNumber}</span>
                    </div>
                  )}
                  {leader.homeUnitNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Home Unit:</span>
                      <span>{leader.homeUnitNumber}</span>
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
          </div>
        </div>
      )}

      {!hasSearched && !loading && (
        <div className="text-center py-8 text-gray-500">
          Enter a CMIS ID to search for leader details.
        </div>
      )}

      {hasSearched && !leader && !loading && !error && (
        <div className="text-center py-8 text-gray-500">
          No leader found with the provided CMIS ID.
        </div>
      )}
    </div>
  );
}
