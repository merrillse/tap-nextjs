'use client';

import { useState, useEffect, useRef } from 'react';
import { getEnvironmentConfig } from '@/lib/environments';
import { ApiClient } from '@/lib/api-client';

interface MissionaryData {
  latinFirstName: string;
  latinLastName: string;
  missionaryNumber: string;
  emailAddress?: string;
  mobilePhone?: string;
  birthDate?: string;
  missionaryStatus?: {
    value: string;
    label: string;
  };
  missionaryType?: {
    value: string;
    label: string;
  };
  assignments?: Array<{
    assignmentId: string;
    componentName?: string;
    assignmentStartDate?: string;
    assignmentEndDate?: string;
    mission?: {
      name: string;
    };
    location?: {
      assignmentName: string;
    };
  }>;
  languages?: Array<{
    languageDetail: {
      languageName: string;
      languageAbbreviation: string;
    };
    preferredLanguage: boolean;
  }>;
  relations?: Array<{
    relationId: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    suffix?: string;
    name?: string;
    parentalRelationshipLabel?: string;
    emergencyContractualRelationship?: string;
    email?: string;
    phone?: string;
    occupation?: string;
    doNotContact?: boolean;
    isDeceased?: boolean;
    isMember?: boolean;
    canReceiveTextMessages?: boolean;
    birthPlace?: string;
    address?: {
      addressLine1?: string;
      addressLine2?: string;
      addressLine3?: string;
      city?: string;
      stateProvince?: string;
      zipcode?: string;
      country?: {
        commonName?: string;
        officialName?: string;
        concatenatedName?: string;
      };
      countryCode?: string;
    };
  }>;
}

// Sample data to demonstrate the layout
const sampleMissionaryData: MissionaryData = {
  latinFirstName: "John",
  latinLastName: "Smith",
  missionaryNumber: "916793",
  emailAddress: "john.smith@example.com",
  mobilePhone: "+1-555-0123",
  birthDate: "1995-03-15",
  missionaryStatus: {
    value: "ACTIVE",
    label: "Active"
  },
  missionaryType: {
    value: "FULL_TIME",
    label: "Full-time"
  },
  assignments: [
    {
      assignmentId: "1",
      componentName: "Zone Leader",
      assignmentStartDate: "2024-01-15",
      assignmentEndDate: "2024-12-15",
      mission: {
        name: "California Los Angeles Mission"
      },
      location: {
        assignmentName: "Downtown District"
      }
    }
  ],
  languages: [
    {
      languageDetail: {
        languageName: "English",
        languageAbbreviation: "EN"
      },
      preferredLanguage: true
    },
    {
      languageDetail: {
        languageName: "Spanish",
        languageAbbreviation: "ES"
      },
      preferredLanguage: false
    }
  ],
  relations: [
    {
      relationId: "1",
      firstName: "Michael",
      lastName: "Smith",
      parentalRelationshipLabel: "Father",
      email: "michael.smith@example.com",
      phone: "+1-555-0456",
      occupation: "Engineer",
      doNotContact: false,
      isDeceased: false,
      isMember: true,
      canReceiveTextMessages: true,
      address: {
        addressLine1: "123 Main Street",
        city: "Provo",
        stateProvince: "Utah",
        zipcode: "84604",
        countryCode: "US",
        country: {
          commonName: "United States",
          officialName: "United States of America"
        }
      }
    },
    {
      relationId: "2",
      firstName: "Sarah",
      lastName: "Smith",
      parentalRelationshipLabel: "Mother",
      email: "sarah.smith@example.com",
      phone: "+1-555-0789",
      occupation: "Teacher",
      doNotContact: false,
      isDeceased: false,
      isMember: true,
      canReceiveTextMessages: true,
      address: {
        addressLine1: "123 Main Street",
        city: "Provo",
        stateProvince: "Utah",
        zipcode: "84604",
        countryCode: "US",
        country: {
          commonName: "United States",
          officialName: "United States of America"
        }
      }
    },
    {
      relationId: "3",
      firstName: "Emma",
      lastName: "Johnson",
      emergencyContractualRelationship: "Emergency Contact",
      email: "emma.johnson@example.com",
      phone: "+1-555-0321",
      doNotContact: false,
      isDeceased: false,
      isMember: false,
      canReceiveTextMessages: true
    }
  ]
};

export default function MissionaryPage() {
  const [missionaryNumber, setMissionaryNumber] = useState('916793');
  const [loading, setLoading] = useState(false);
  const [missionaryData, setMissionaryData] = useState<MissionaryData | null>(null);
  const [showQuery, setShowQuery] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [recentNumbers, setRecentNumbers] = useState<string[]>([]);
  const [showRecentNumbers, setShowRecentNumbers] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize API client with default environment
  useEffect(() => {
    const savedSettings = localStorage.getItem('tap-settings');
    const settings = savedSettings ? JSON.parse(savedSettings) : { environment: 'mis-gql-dev' };
    
    const config = getEnvironmentConfig(settings.environment);
    if (config) {
      setApiClient(new ApiClient(config, settings.environment));
    }
  }, []);

  // Load recent missionary numbers from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recent-missionary-numbers');
      if (saved) {
        setRecentNumbers(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Error loading recent missionary numbers:', error);
    }
  }, []);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRecentNumbers(false);
      }
    };

    if (showRecentNumbers) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showRecentNumbers]);

  // Function to save a missionary number to recent list
  const saveRecentNumber = (number: string) => {
    if (!number.trim()) return;
    
    setRecentNumbers(prev => {
      // Remove if already exists
      const filtered = prev.filter(n => n !== number);
      // Add to beginning and keep only 10 most recent
      const updated = [number, ...filtered].slice(0, 10);
      
      // Save to localStorage
      try {
        localStorage.setItem('recent-missionary-numbers', JSON.stringify(updated));
      } catch (error) {
        console.warn('Error saving recent missionary numbers:', error);
      }
      
      return updated;
    });
  };

  const graphqlQuery = `query Missionary($missionaryNumber: ID = "${missionaryNumber}") {
  missionary(missionaryId: $missionaryNumber) {
    latinFirstName
    missionaryNumber
    cmisUUID
    id
    ldsAccountId
    recommendFirstName
    recommendMiddleName
    recommendLastName
    recommendNameSuffix
    latinMiddleName
    latinLastName
    latinNameSuffix
    birthDate
    birthPlace
    emailAddress
    proselytingEmailAddress
    mobilePhone
    canTextMobilePhone
    homePhone
    homeUnitNumber
    membershipUnitNumber
    submittingUnitNumber
    fundingUnitNumber
    missionaryStatus {
      value
      label
    }
    startDate
    releaseDate
    infieldDate
    missionaryTypeId
    missionaryType {
      value
      label
    }
    assignments {
      assignmentId
      componentName
      assignmentStartDate
      assignmentEndDate
      mission {
        name
      }
      location {
        assignmentName
      }
    }
    languages {
      languageDetail {
        languageName
        languageAbbreviation
      }
      preferredLanguage
    }
    relations {
      relationId
      firstName
      middleName
      lastName
      suffix
      name
      parentalRelationshipLabel
      emergencyContractualRelationship
      email
      phone
      occupation
      doNotContact
      isDeceased
      isMember
      canReceiveTextMessages
      birthPlace
      address {
        addressLine1
        addressLine2
        addressLine3
        city
        stateProvince
        zipcode
        country {
          commonName
          officialName
          concatenatedName
        }
        countryCode
      }
    }
  }
}`;

  const handleSearch = async () => {
    if (!apiClient) {
      setError('API client not initialized. Please check your settings.');
      return;
    }

    setLoading(true);
    setError(null);
    setMissionaryData(null);
    
    // Save the missionary number to recent list
    saveRecentNumber(missionaryNumber);
    
    try {
      const result = await apiClient.executeGraphQLQuery(graphqlQuery, {
        missionaryNumber: missionaryNumber
      });
      
      if (result.data && typeof result.data === 'object' && 'missionary' in result.data) {
        setMissionaryData((result.data as { missionary: MissionaryData }).missionary);
      } else {
        setError('No missionary found with that number.');
      }
    } catch (err) {
      console.error('API Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data.');
      
      // Show sample data in case of API error for demonstration
      setMissionaryData(sampleMissionaryData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Missionary Search</h1>
          <p className="mt-2 text-gray-600">Search for missionary information using GraphQL queries</p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="missionaryNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Missionary Number (legacy_miss_id)
              </label>
              <div className="relative" ref={dropdownRef}>
                <input
                  type="text"
                  id="missionaryNumber"
                  value={missionaryNumber}
                  onChange={(e) => setMissionaryNumber(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    } else if (e.key === 'Escape') {
                      setShowRecentNumbers(false);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-24"
                  placeholder="Enter missionary number..."
                />
                {/* Recent numbers button */}
                {recentNumbers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowRecentNumbers(!showRecentNumbers)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-gray-400 hover:text-gray-600 focus:outline-none bg-white"
                    title="Recent numbers"
                    style={{ padding: 0, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                )}
              
                {/* Recent Numbers Dropdown */}
                {showRecentNumbers && recentNumbers.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                      Recent Searches (Click to select)
                    </div>
                    {recentNumbers.map((number, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setMissionaryNumber(number);
                          setShowRecentNumbers(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-sm"
                      >
                        {number}
                      </button>
                    ))}
                    <div className="px-3 py-2 border-t">
                      <button
                        onClick={() => {
                          setRecentNumbers([]);
                          setShowRecentNumbers(false);
                          localStorage.removeItem('recent-missionary-numbers');
                        }}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Clear all recent numbers
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col justify-end space-y-2">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
              <button
                onClick={() => setShowQuery(!showQuery)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                {showQuery ? 'Hide Query' : 'Show Query'}
              </button>
            </div>
          </div>

          {/* GraphQL Query Display */}
          {showQuery && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">GraphQL Query</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
                <code>{graphqlQuery}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
            <p className="text-red-600 mt-2 text-sm">Showing sample data for demonstration purposes.</p>
          </div>
        )}

        {/* Results Section */}
        {missionaryData && (
          <div className="space-y-6">
            
            {/* Basic Information Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  missionaryData.missionaryStatus?.value === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {missionaryData.missionaryStatus?.label}
                </span>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Full Name</label>
                  <p className="mt-1 text-lg font-medium text-gray-900">
                    {missionaryData.latinFirstName} {missionaryData.latinLastName}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Missionary Number</label>
                  <p className="mt-1 text-lg font-medium text-gray-900">{missionaryData.missionaryNumber}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Type</label>
                  <p className="mt-1 text-lg font-medium text-gray-900">{missionaryData.missionaryType?.label}</p>
                </div>
                
                {missionaryData.emailAddress && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-lg font-medium text-gray-900">{missionaryData.emailAddress}</p>
                  </div>
                )}
                
                {missionaryData.mobilePhone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Mobile Phone</label>
                    <p className="mt-1 text-lg font-medium text-gray-900">{missionaryData.mobilePhone}</p>
                  </div>
                )}
                
                {missionaryData.birthDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Birth Date</label>
                    <p className="mt-1 text-lg font-medium text-gray-900">
                      {new Date(missionaryData.birthDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Assignments Card */}
            {missionaryData.assignments && missionaryData.assignments.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Assignments</h2>
                <div className="space-y-4">
                  {missionaryData.assignments.map((assignment, index) => (
                    <div key={assignment.assignmentId || index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Position</label>
                          <p className="mt-1 font-medium text-gray-900">{assignment.componentName || 'N/A'}</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Mission</label>
                          <p className="mt-1 font-medium text-gray-900">{assignment.mission?.name || 'N/A'}</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Location</label>
                          <p className="mt-1 font-medium text-gray-900">{assignment.location?.assignmentName || 'N/A'}</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Duration</label>
                          <p className="mt-1 font-medium text-gray-900">
                            {assignment.assignmentStartDate ? new Date(assignment.assignmentStartDate).toLocaleDateString() : 'N/A'}
                            {assignment.assignmentEndDate && ` - ${new Date(assignment.assignmentEndDate).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Languages Card */}
            {missionaryData.languages && missionaryData.languages.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Languages</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {missionaryData.languages.map((lang, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{lang.languageDetail.languageName}</p>
                        <p className="text-sm text-gray-500">{lang.languageDetail.languageAbbreviation}</p>
                      </div>
                      {lang.preferredLanguage && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          Preferred
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Relations Card */}
            {missionaryData.relations && missionaryData.relations.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Relations ({missionaryData.relations.length})</h2>
                <div className="space-y-4">
                  {missionaryData.relations.map((relation, index) => (
                    <div key={relation.relationId || index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Basic Information */}
                        <div className="space-y-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-500">Name</label>
                            <p className="font-medium text-gray-900">
                              {relation.name || `${relation.firstName || ''} ${relation.middleName || ''} ${relation.lastName || ''}`.trim() || 'Unknown'}
                              {relation.suffix && ` ${relation.suffix}`}
                            </p>
                          </div>
                          
                          {(relation.parentalRelationshipLabel || relation.emergencyContractualRelationship) && (
                            <div>
                              <label className="block text-sm font-medium text-gray-500">Relationship</label>
                              <p className="font-medium text-gray-900">
                                {relation.parentalRelationshipLabel || relation.emergencyContractualRelationship}
                              </p>
                            </div>
                          )}

                          {relation.occupation && (
                            <div>
                              <label className="block text-sm font-medium text-gray-500">Occupation</label>
                              <p className="font-medium text-gray-900">{relation.occupation}</p>
                            </div>
                          )}
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-2">
                          {relation.email && (
                            <div>
                              <label className="block text-sm font-medium text-gray-500">Email</label>
                              <p className="font-medium text-gray-900">{relation.email}</p>
                            </div>
                          )}
                          
                          {relation.phone && (
                            <div>
                              <label className="block text-sm font-medium text-gray-500">Phone</label>
                              <p className="font-medium text-gray-900">{relation.phone}</p>
                            </div>
                          )}

                          {relation.birthPlace && (
                            <div>
                              <label className="block text-sm font-medium text-gray-500">Birth Place</label>
                              <p className="font-medium text-gray-900">{relation.birthPlace}</p>
                            </div>
                          )}
                        </div>

                        {/* Address & Status */}
                        <div className="space-y-2">
                          {relation.address && (
                            <div>
                              <label className="block text-sm font-medium text-gray-500">Address</label>
                              <div className="text-sm text-gray-900">
                                {relation.address.addressLine1 && <p>{relation.address.addressLine1}</p>}
                                {relation.address.addressLine2 && <p>{relation.address.addressLine2}</p>}
                                {relation.address.addressLine3 && <p>{relation.address.addressLine3}</p>}
                                <p>
                                  {relation.address.city}
                                  {relation.address.stateProvince && `, ${relation.address.stateProvince}`}
                                  {relation.address.zipcode && ` ${relation.address.zipcode}`}
                                </p>
                                {(relation.address.country?.commonName || relation.address.country?.officialName || relation.address.country?.concatenatedName) && (
                                  <p>{relation.address.country.commonName || relation.address.country.officialName || relation.address.country.concatenatedName}</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Status Indicators */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {relation.isMember && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                Member
                              </span>
                            )}
                            {relation.canReceiveTextMessages && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                Can Text
                              </span>
                            )}
                            {relation.doNotContact && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                Do Not Contact
                              </span>
                            )}
                            {relation.isDeceased && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                                Deceased
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Results */}
        {!loading && !missionaryData && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-600">Try searching with a different missionary number.</p>
          </div>
        )}
      </div>
    </div>
  );
}
