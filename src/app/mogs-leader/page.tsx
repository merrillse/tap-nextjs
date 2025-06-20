'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  ExpandMore, 
  ExpandLess, 
  Person, 
  CheckCircle, 
  Warning, 
  FileDownload, 
  AccessTime, 
  Home,
  Email,
  Phone,
  ContactMail,
  AttachFile,
  Note,
  Photo
} from '@mui/icons-material';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS, getEnvironmentConfigSafe, getDefaultEnvironment } from '@/lib/environments';

// Types based on the GraphQL schema
interface MMSLocation {
  id: string;
  iso3Code?: string;
  name?: string;
  shortName?: string;
  abbreviation?: string;
  smsIso3Code?: string;
}

interface MMSOrganization {
  id: string;
  organizationId?: number;
  name?: string;
  officialName?: string;
  shortName?: string;
  officialShortName?: string;
}

interface DocumentType {
  id: string;
  description?: string;
  noteType?: boolean;
  attachmentType?: boolean;
  addPermissionId?: number;
  deletePermissionId?: number;
  editPermissionId?: number;
  viewPermissionId?: number;
  confidential?: boolean;
}

interface LeaderAttachment {
  id: string;
  cmisId?: number;
  documentType?: DocumentType;
  title?: string;
  sourceFileLocation?: string;
  fileType?: string;
  fileSize?: number;
  fileContent?: string;
  createDate?: string;
  createdBy?: string;
  updateDate?: string;
  updatedBy?: string;
}

interface LeaderCitizenship {
  id: string;
  cmisId?: number;
  location?: MMSLocation;
  current?: boolean;
  loadDate?: string;
  updateDate?: string;
}

interface LeaderNote {
  id: string;
  cmisId?: number;
  subNotes?: LeaderNote[];
  documentType?: DocumentType;
  title?: string;
  content?: string;
  createdDate?: string;
  createdBy?: string;
  updatedDate?: string;
  updatedBy?: string;
}

interface LeaderPhoto {
  id: string;
  cmisId?: number;
  photo?: string;
  createdDate?: string;
  updatedDate?: string;
}

interface Leader {
  id: string;
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

interface SearchHistoryItem {
  id: string;
  timestamp: string;
  found: boolean;
}

const LEADER_QUERY = `
  query LeaderQuery($id: ID!) {
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
        officialShortName
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
        officialShortName
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
        smsIso3Code
      }
      birthDate
      birthPlace
      birthLocation {
        id
        iso3Code
        name
        shortName
        abbreviation
        smsIso3Code
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
        cmisId
        documentType {
          id
          description
          noteType
          attachmentType
          addPermissionId
          deletePermissionId
          editPermissionId
          viewPermissionId
          confidential
        }
        title
        sourceFileLocation
        fileType
        fileSize
        fileContent
        createDate
        createdBy
        updateDate
        updatedBy
      }
      citizenships {
        id
        cmisId
        location {
          id
          iso3Code
          name
          shortName
          abbreviation
          smsIso3Code
        }
        current
        loadDate
        updateDate
      }
      notes {
        id
        cmisId
        documentType {
          id
          description
          noteType
          attachmentType
          addPermissionId
          deletePermissionId
          editPermissionId
          viewPermissionId
          confidential
        }
        title
        content
        createdDate
        createdBy
        updatedDate
        updatedBy
        subNotes {
          id
          cmisId
          title
          content
          createdDate
          createdBy
          updatedDate
          updatedBy
        }
      }
      photo {
        id
        cmisId
        photo
        createdDate
        updatedDate
      }
    }
  }
`;

export default function MOGSLeaderPage() {
  const [leaderId, setLeaderId] = useState('');
  const [leader, setLeader] = useState<Leader | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>(getDefaultEnvironment('mogs'));
  const [showHistory, setShowHistory] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic', 'contact', 'units']));

  const resultRef = useRef<HTMLDivElement>(null);

  // Initialize API client
  useEffect(() => {
    try {
      const { config, key } = getEnvironmentConfigSafe(selectedEnvironment, 'mogs');
      console.log(`Initializing API client for environment: ${key}`);
      setApiClient(new ApiClient(config, key));
      setError(null);
      
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
    const savedHistory = localStorage.getItem('mogs-leader-search-history');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setSearchHistory(history);
      } catch (e) {
        console.error('Failed to load search history:', e);
      }
    }
  }, []);

  // Save search history to localStorage
  const saveSearchHistory = (id: string, found: boolean) => {
    const newEntry: SearchHistoryItem = {
      id: id,
      timestamp: new Date().toLocaleString(),
      found: found
    };
    
    const updatedHistory = [newEntry, ...searchHistory.filter(item => item.id !== id).slice(0, 9)]; // Keep last 10 unique searches
    setSearchHistory(updatedHistory);
    localStorage.setItem('mogs-leader-search-history', JSON.stringify(updatedHistory));
  };

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('mogs-leader-search-history');
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleSearch = async () => {
    if (!leaderId.trim()) {
      setError('Please enter a Leader ID');
      return;
    }

    if (!apiClient) {
      setError('API client not initialized. Please wait a moment or try refreshing the page.');
      return;
    }

    setLoading(true);
    setError(null);
    setLeader(null);

    try {
      const variables = { id: leaderId.trim() };
      const response = await apiClient.executeGraphQLQuery(LEADER_QUERY, variables);

      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const result = response.data as { leader: Leader };
      
      if (result.leader) {
        setLeader(result.leader);
        saveSearchHistory(leaderId.trim(), true);
        
        // Scroll to results
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        setError('Leader not found');
        saveSearchHistory(leaderId.trim(), false);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during search');
      saveSearchHistory(leaderId.trim(), false);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const exportToJson = () => {
    if (!leader) return;

    const dataStr = JSON.stringify(leader, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `leader-${leader.id}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const formatBoolean = (val?: boolean) => {
    if (val === undefined || val === null) return 'N/A';
    return val ? 'Yes' : 'No';
  };

  const renderSection = (title: string, sectionKey: string, icon: React.ReactNode, content: React.ReactNode) => {
    const isExpanded = expandedSections.has(sectionKey);
    
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left font-medium text-gray-900"
        >
          <div className="flex items-center space-x-2">
            {icon}
            <span>{title}</span>
          </div>
          {isExpanded ? (
            <ExpandLess className="h-5 w-5 text-gray-500" />
          ) : (
            <ExpandMore className="h-5 w-5 text-gray-500" />
          )}
        </button>
        {isExpanded && (
          <div className="px-4 py-3 bg-white">
            {content}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">MOGS Leader Search</h1>
        <p className="text-gray-600">Search for leader information by ID in the Missionary Oracle Graph Service.</p>
      </div>

      {/* Environment Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
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

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="leaderId" className="block text-sm font-medium text-gray-700 mb-2">
              Leader ID
            </label>
            <input
              type="text"
              id="leaderId"
              value={leaderId}
              onChange={(e) => setLeaderId(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter leader ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Person className="h-4 w-4" />
                <span>Search</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <AccessTime className="h-5 w-5" />
              <span>Search History</span>
            </h3>
            {showHistory ? (
              <ExpandLess className="h-5 w-5 text-gray-500" />
            ) : (
              <ExpandMore className="h-5 w-5 text-gray-500" />
            )}
          </button>
          {showHistory && (
            <div className="mt-4">
              <div className="flex justify-end mb-2">
                <button
                  onClick={clearSearchHistory}
                  className="text-xs text-red-600 hover:text-red-800 underline"
                >
                  Clear History
                </button>
              </div>
              <div className="space-y-2">
                {searchHistory.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100"
                    onClick={() => setLeaderId(item.id)}
                  >
                    <div className="flex items-center space-x-3">
                      {item.found ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Warning className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-mono text-sm">{item.id}</span>
                    </div>
                    <span className="text-xs text-gray-500">{item.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-center space-x-2">
            <Warning className="h-5 w-5 text-red-400" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {leader && (
        <div ref={resultRef} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Person className="h-6 w-6" />
                <span>Leader: {leader.preferredGivenName || leader.givenName} {leader.preferredSurname || leader.surname}</span>
              </h2>
              <button
                onClick={exportToJson}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center space-x-2"
              >
                <FileDownload className="h-4 w-4" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Basic Information */}
            {renderSection(
              'Basic Information',
              'basic',
              <Person className="h-5 w-5 text-blue-500" />,
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">ID</span>
                  <p className="font-mono text-sm">{leader.id}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">MRN</span>
                  <p className="text-sm">{leader.mrn || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Gender Code</span>
                  <p className="text-sm">{leader.genderCode || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Surname</span>
                  <p className="text-sm">{leader.surname || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Given Name</span>
                  <p className="text-sm">{leader.givenName || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Preferred Surname</span>
                  <p className="text-sm">{leader.preferredSurname || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Preferred Given Name</span>
                  <p className="text-sm">{leader.preferredGivenName || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Spouse CMIS ID</span>
                  <p className="text-sm">{leader.spouseCmisId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Birth Date</span>
                  <p className="text-sm">{formatDate(leader.birthDate)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Birth Place</span>
                  <p className="text-sm">{leader.birthPlace || 'N/A'}</p>
                </div>
              </div>
            )}

            {/* Contact Information */}
            {renderSection(
              'Contact Information',
              'contact',
              <ContactMail className="h-5 w-5 text-green-500" />,
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">LDS Email</span>
                  <p className="text-sm break-all">{leader.ldsEmail || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Personal Email</span>
                  <p className="text-sm break-all">{leader.personalEmail || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Phone</span>
                  <p className="text-sm">{leader.phone || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Home Address</span>
                  <p className="text-sm">{leader.homeAddress || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Contact Name</span>
                  <p className="text-sm">{leader.contactName || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Contact Relationship</span>
                  <p className="text-sm">{leader.contactRelationship || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Contact Address</span>
                  <p className="text-sm">{leader.contactAddress || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Contact Email</span>
                  <p className="text-sm break-all">{leader.contactEmail || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Contact Phone</span>
                  <p className="text-sm">{leader.contactPhone || 'N/A'}</p>
                </div>
              </div>
            )}

            {/* Units & Organization */}
            {renderSection(
              'Units & Organization',
              'units',
              <Home className="h-5 w-5 text-purple-500" />,
              <div className="space-y-6">
                {leader.unit && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Current Unit</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-purple-200">
                      <div>
                        <span className="text-sm font-medium text-gray-500">ID</span>
                        <p className="text-sm font-mono">{leader.unit.id}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Organization ID</span>
                        <p className="text-sm">{leader.unit.organizationId || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Name</span>
                        <p className="text-sm">{leader.unit.name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Official Name</span>
                        <p className="text-sm">{leader.unit.officialName || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {leader.homeUnit && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Home Unit</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-blue-200">
                      <div>
                        <span className="text-sm font-medium text-gray-500">ID</span>
                        <p className="text-sm font-mono">{leader.homeUnit.id}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Organization ID</span>
                        <p className="text-sm">{leader.homeUnit.organizationId || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Name</span>
                        <p className="text-sm">{leader.homeUnit.name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Official Name</span>
                        <p className="text-sm">{leader.homeUnit.officialName || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Start Date</span>
                    <p className="text-sm">{formatDate(leader.startDate)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">End Date</span>
                    <p className="text-sm">{formatDate(leader.endDate)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Locations */}
            {(leader.homeLocation || leader.birthLocation) && renderSection(
              'Locations',
              'locations',
              <Home className="h-5 w-5 text-orange-500" />,
              <div className="space-y-6">
                {leader.homeLocation && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Home Location</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-orange-200">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Name</span>
                        <p className="text-sm">{leader.homeLocation.name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">ISO3 Code</span>
                        <p className="text-sm font-mono">{leader.homeLocation.iso3Code || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Short Name</span>
                        <p className="text-sm">{leader.homeLocation.shortName || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Abbreviation</span>
                        <p className="text-sm">{leader.homeLocation.abbreviation || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {leader.birthLocation && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Birth Location</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-green-200">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Name</span>
                        <p className="text-sm">{leader.birthLocation.name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">ISO3 Code</span>
                        <p className="text-sm font-mono">{leader.birthLocation.iso3Code || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Short Name</span>
                        <p className="text-sm">{leader.birthLocation.shortName || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Abbreviation</span>
                        <p className="text-sm">{leader.birthLocation.abbreviation || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Passport Information */}
            {(leader.passportNumber || leader.passportExpirationDate) && renderSection(
              'Passport Information',
              'passport',
              <ContactMail className="h-5 w-5 text-indigo-500" />,
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Passport Number</span>
                  <p className="text-sm font-mono">{leader.passportNumber || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Passport Expiration Date</span>
                  <p className="text-sm">{formatDate(leader.passportExpirationDate)}</p>
                </div>
              </div>
            )}

            {/* Citizenships */}
            {leader.citizenships && leader.citizenships.length > 0 && renderSection(
              'Citizenships',
              'citizenships',
              <Home className="h-5 w-5 text-teal-500" />,
              <div className="space-y-4">
                {leader.citizenships.map((citizenship, index) => (
                  <div key={citizenship.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Citizenship {index + 1}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Current</span>
                        <p className="text-sm">{formatBoolean(citizenship.current)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">CMIS ID</span>
                        <p className="text-sm">{citizenship.cmisId || 'N/A'}</p>
                      </div>
                      {citizenship.location && (
                        <>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Location</span>
                            <p className="text-sm">{citizenship.location.name || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">ISO3 Code</span>
                            <p className="text-sm font-mono">{citizenship.location.iso3Code || 'N/A'}</p>
                          </div>
                        </>
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-500">Load Date</span>
                        <p className="text-sm">{formatDate(citizenship.loadDate)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Update Date</span>
                        <p className="text-sm">{formatDate(citizenship.updateDate)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            {leader.notes && leader.notes.length > 0 && renderSection(
              'Notes',
              'notes',
              <Note className="h-5 w-5 text-yellow-500" />,
              <div className="space-y-4">
                {leader.notes.map((note, index) => (
                  <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{note.title || `Note ${index + 1}`}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Created By</span>
                        <p className="text-sm">{note.createdBy || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Created Date</span>
                        <p className="text-sm">{formatDate(note.createdDate)}</p>
                      </div>
                    </div>
                    {note.content && (
                      <div className="mb-4">
                        <span className="text-sm font-medium text-gray-500">Content</span>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{note.content}</p>
                      </div>
                    )}
                    {note.subNotes && note.subNotes.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Sub-Notes ({note.subNotes.length})</span>
                        <div className="mt-2 space-y-2">
                          {note.subNotes.map((subNote, subIndex) => (
                            <div key={subNote.id} className="bg-gray-50 rounded p-3">
                              <h5 className="text-sm font-medium">{subNote.title || `Sub-note ${subIndex + 1}`}</h5>
                              {subNote.content && <p className="text-sm text-gray-600 mt-1">{subNote.content}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Attachments */}
            {leader.attachments && leader.attachments.length > 0 && renderSection(
              'Attachments',
              'attachments',
              <AttachFile className="h-5 w-5 text-red-500" />,
              <div className="space-y-4">
                {leader.attachments.map((attachment, index) => (
                  <div key={attachment.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{attachment.title || `Attachment ${index + 1}`}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">File Type</span>
                        <p className="text-sm">{attachment.fileType || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">File Size</span>
                        <p className="text-sm">{attachment.fileSize ? `${attachment.fileSize} bytes` : 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Created By</span>
                        <p className="text-sm">{attachment.createdBy || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Create Date</span>
                        <p className="text-sm">{formatDate(attachment.createDate)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Source File Location</span>
                        <p className="text-sm break-all">{attachment.sourceFileLocation || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Photo */}
            {leader.photo && renderSection(
              'Photo',
              'photo',
              <Photo className="h-5 w-5 text-pink-500" />,
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">CMIS ID</span>
                  <p className="text-sm">{leader.photo.cmisId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Created Date</span>
                  <p className="text-sm">{formatDate(leader.photo.createdDate)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Updated Date</span>
                  <p className="text-sm">{formatDate(leader.photo.updatedDate)}</p>
                </div>
                {leader.photo.photo && (
                  <div className="col-span-full">
                    <span className="text-sm font-medium text-gray-500">Photo</span>
                    <div className="mt-2 flex justify-center">
                      <img 
                        src={`data:image/jpeg;base64,${leader.photo.photo}`}
                        alt="Leader Photo"
                        className="max-w-xs max-h-64 rounded-lg shadow-md border border-gray-200"
                        onError={(e) => {
                          // Fallback to try different image formats if JPEG doesn't work
                          const target = e.target as HTMLImageElement;
                          const photoData = leader.photo?.photo;
                          if (photoData) {
                            if (target.src.includes('jpeg')) {
                              target.src = `data:image/png;base64,${photoData}`;
                            } else if (target.src.includes('png')) {
                              target.src = `data:image/gif;base64,${photoData}`;
                            } else {
                              target.style.display = 'none';
                              const errorDiv = document.createElement('div');
                              errorDiv.className = 'text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3';
                              errorDiv.textContent = 'Unable to display image. The photo data may be corrupted or in an unsupported format.';
                              target.parentElement?.appendChild(errorDiv);
                            }
                          }
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Base64 encoded image data ({leader.photo.photo.length} characters)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Audit Information */}
            {renderSection(
              'Audit Information',
              'audit',
              <AccessTime className="h-5 w-5 text-gray-500" />,
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Load Date</span>
                  <p className="text-sm">{formatDate(leader.loadDate)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Update Date</span>
                  <p className="text-sm">{formatDate(leader.updateDate)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
