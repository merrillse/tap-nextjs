'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
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
  Badge,
  Assignment,
  Security,
  Info,
  DriveEta,
  Language,
  ArrowLeft,
  Search,
  History,
  Download,
  ChevronRight,
  KeyboardArrowDown
} from '@mui/icons-material';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS, getEnvironmentConfigSafe, getDefaultEnvironment } from '@/lib/environments';

// TypeScript interfaces based on WSMissionary type from MOGS schema
interface MissionaryIdentity {
  id: string
  missionaryNameId?: number
  legacyMissId?: number
  issueCountry?: any
  issueState?: string
  suspended?: boolean
  documentExpireDate?: string
  documentId?: string
  altIdType?: string
  nameTypeCode?: string
  firstName?: string
  lastName?: string
  middleName?: string
  suffix?: string
}

interface WSMissionaryAssignment {
  id: string
  cmisId?: number
  assignmentTypeCode?: string
  assignmentStatusCode?: string
  assignmentComponentId?: number
  assignmentStartDate?: string
  assignmentEndDate?: string
  roleId?: number
  assignmentLocationUnitNumber?: number
  positionId?: number
  positionAbbreviation?: string
  positionDescription?: string
  assignmentComponentDescription?: string
  assignmentLocationTypeId?: number
  assignmentLocationTypeDescription?: string
  legacyMissId?: number
}

interface WSMissionaryHistory {
  id: string
  legacyMissId?: number
  cmisId?: number
  startDate?: string
  position?: string
  companionship?: string
  areaName?: string
}

interface WSMissionary {
  id: string
  missionaryId?: number
  cmisId?: number
  applicationId?: number
  mrn?: string
  preferredFirstName?: string
  preferredMiddleName?: string
  preferredLastName?: string
  preferredSuffix?: string
  officialFirstName?: string
  officialMiddleName?: string
  officialLastName?: string
  officialSuffix?: string
  birthDate?: string
  homeUnitNumber?: number
  missionStartDate?: string
  releaseDate?: string
  emailAddress?: string
  proselytingEmailAddress?: string
  missionaryStatus?: number
  typeCode?: string
  drivingStatus?: boolean
  designatedDriver?: boolean
  issuingStateOrCountry?: string
  issuingState?: string
  issuingCountry?: string
  licenseExpirationDate?: string
  ecclesiasticalUnitNumber?: number
  myPlanCompletionTimestamp?: string
  myPlanSharing?: boolean
  myPlanURL?: string
  callLetterLanguageISO3?: string
  legacyMissId?: number
  seniorDelayStart?: boolean
  wsMissionaryAssignment?: WSMissionaryAssignment
  missionaryIdentity?: MissionaryIdentity[]
  wsMissionaryHistories?: WSMissionaryHistory[]
}

interface ApiResponse {
  data?: {
    wsMissionary?: WSMissionary
  }
  errors?: Array<{
    message: string
    path?: string[]
  }>
}

interface GraphQLQueryResponse {
  data: {
    wsMissionary?: WSMissionary
  }
  errors?: Array<{
    message: string
    path?: string[]
  }>
}

const WS_MISSIONARY_QUERY = `
  query GetWSMissionary($id: ID!) {
    wsMissionary(id: $id) {
      id
      missionaryId
      cmisId
      applicationId
      mrn
      preferredFirstName
      preferredMiddleName
      preferredLastName
      preferredSuffix
      officialFirstName
      officialMiddleName
      officialLastName
      officialSuffix
      birthDate
      homeUnitNumber
      missionStartDate
      releaseDate
      emailAddress
      proselytingEmailAddress
      missionaryStatus
      typeCode
      drivingStatus
      designatedDriver
      issuingStateOrCountry
      issuingState
      issuingCountry
      licenseExpirationDate
      ecclesiasticalUnitNumber
      myPlanCompletionTimestamp
      myPlanSharing
      myPlanURL
      callLetterLanguageISO3
      legacyMissId
      seniorDelayStart
      wsMissionaryAssignment {
        id
        cmisId
        assignmentTypeCode
        assignmentStatusCode
        assignmentComponentId
        assignmentStartDate
        assignmentEndDate
        roleId
        assignmentLocationUnitNumber
        positionId
        positionAbbreviation
        positionDescription
        assignmentComponentDescription
        assignmentLocationTypeId
        assignmentLocationTypeDescription
        legacyMissId
      }
      missionaryIdentity {
        id
        missionaryNameId
        legacyMissId
        issueState
        suspended
        documentExpireDate
        documentId
        altIdType
        nameTypeCode
        firstName
        lastName
        middleName
        suffix
      }
      wsMissionaryHistories {
        id
        legacyMissId
        cmisId
        startDate
        position
        companionship
        areaName
      }
    }
  }
`

export default function MogsWSMissionaryPage() {
  const [missionaryId, setMissionaryId] = useState('');
  const [wsMissionary, setWSMissionary] = useState<WSMissionary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>(getDefaultEnvironment('mogs'));
  const [showHistory, setShowHistory] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['personal', 'names', 'mission']));

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
    const savedHistory = localStorage.getItem('mogs-ws-missionary-search-history');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setSearchHistory(history);
      } catch (error) {
        console.error('Failed to parse search history:', error);
      }
    }
  }, []);

  const saveToHistory = (id: string) => {
    if (!id.trim()) return;
    
    const newHistory = [id, ...searchHistory.filter(item => item !== id)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('mogs-ws-missionary-search-history', JSON.stringify(newHistory));
  };

  const handleSearch = async () => {
    if (!missionaryId.trim()) {
      setError('Please enter a missionary ID');
      return;
    }

    if (!apiClient) {
      setError('API client not initialized. Please select a valid environment.');
      return;
    }

    setLoading(true);
    setError(null);
    setWSMissionary(null);

    try {
      const variables = { id: missionaryId.trim() };
      const response = await apiClient.executeGraphQLQuery(WS_MISSIONARY_QUERY, variables) as GraphQLQueryResponse;

      if (response.errors && response.errors.length > 0) {
        setError(`GraphQL Error: ${response.errors.map((e: any) => e.message).join(', ')}`);
      } else if (response.data?.wsMissionary) {
        setWSMissionary(response.data.wsMissionary);
        saveToHistory(missionaryId.trim());
        
        // Scroll to results
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        setError('No WS missionary found with the provided ID');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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
    if (!wsMissionary) return;
    
    const dataStr = JSON.stringify(wsMissionary, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ws-missionary-${wsMissionary.id || 'unknown'}.json`;
    link.click();
    URL.revokeObjectURL(url);
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

  const selectFromHistory = (id: string) => {
    setMissionaryId(id);
    setShowHistory(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const availableEnvironments = Object.keys(ENVIRONMENTS).filter(key => 
    ENVIRONMENTS[key].graph_url
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/documentation" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Documentation
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MOGS WS Missionary</h1>
          <p className="text-lg text-gray-600">
            Query Web Service missionary information by ID using the MOGS GraphQL API
          </p>
        </div>

        {/* Environment Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Environment
          </label>
          <select
            value={selectedEnvironment}
            onChange={(e) => setSelectedEnvironment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableEnvironments.map((envKey) => (
              <option key={envKey} value={envKey}>
                {ENVIRONMENTS[envKey].name} - {ENVIRONMENTS[envKey].graph_url}
              </option>
            ))}
          </select>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={missionaryId}
                onChange={(e) => setMissionaryId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter missionary ID (legacy_miss_id)..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchHistory.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600"
                  title="Search History"
                >
                  <History className="w-4 h-4" />
                </button>
              )}
              
              {/* Search History Dropdown */}
              {showHistory && searchHistory.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                  {searchHistory.map((id, index) => (
                    <button
                      key={index}
                      onClick={() => selectFromHistory(id)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                    >
                      {id}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Results */}
        {wsMissionary && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">WS Missionary Details</h2>
              <button
                onClick={exportToJson}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
            </div>

            <div className="space-y-4">
              {/* Personal Information */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('personal')}
                  className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-900 hover:bg-gray-50"
                >
                  <span>Personal Information</span>
                  {expandedSections.has('personal') ? <KeyboardArrowDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                
                {expandedSections.has('personal') && (
                  <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ID</label>
                      <p className="text-gray-900">{wsMissionary.id || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Missionary ID</label>
                      <p className="text-gray-900">{wsMissionary.missionaryId || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">CMIS ID</label>
                      <p className="text-gray-900">{wsMissionary.cmisId || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Legacy Miss ID</label>
                      <p className="text-gray-900">{wsMissionary.legacyMissId || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Application ID</label>
                      <p className="text-gray-900">{wsMissionary.applicationId || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">MRN</label>
                      <p className="text-gray-900">{wsMissionary.mrn || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Birth Date</label>
                      <p className="text-gray-900">{formatDate(wsMissionary.birthDate)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type Code</label>
                      <p className="text-gray-900">{wsMissionary.typeCode || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Names */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('names')}
                  className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-900 hover:bg-gray-50"
                >
                  <span>Names</span>
                  {expandedSections.has('names') ? <KeyboardArrowDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                
                {expandedSections.has('names') && (
                  <div className="px-4 pb-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <h4 className="font-medium text-gray-800 mb-2">Preferred Names</h4>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                        <p className="text-gray-900">{wsMissionary.preferredFirstName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Middle Name</label>
                        <p className="text-gray-900">{wsMissionary.preferredMiddleName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                        <p className="text-gray-900">{wsMissionary.preferredLastName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Suffix</label>
                        <p className="text-gray-900">{wsMissionary.preferredSuffix || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <h4 className="font-medium text-gray-800 mb-2">Official Names</h4>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                        <p className="text-gray-900">{wsMissionary.officialFirstName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Middle Name</label>
                        <p className="text-gray-900">{wsMissionary.officialMiddleName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                        <p className="text-gray-900">{wsMissionary.officialLastName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Suffix</label>
                        <p className="text-gray-900">{wsMissionary.officialSuffix || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mission Information */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('mission')}
                  className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-900 hover:bg-gray-50"
                >
                  <span>Mission Information</span>
                  {expandedSections.has('mission') ? <KeyboardArrowDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                
                {expandedSections.has('mission') && (
                  <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mission Start Date</label>
                      <p className="text-gray-900">{formatDate(wsMissionary.missionStartDate)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Release Date</label>
                      <p className="text-gray-900">{formatDate(wsMissionary.releaseDate)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Home Unit Number</label>
                      <p className="text-gray-900">{wsMissionary.homeUnitNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ecclesiastical Unit Number</label>
                      <p className="text-gray-900">{wsMissionary.ecclesiasticalUnitNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Missionary Status</label>
                      <p className="text-gray-900">{wsMissionary.missionaryStatus || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Call Letter Language ISO3</label>
                      <p className="text-gray-900">{wsMissionary.callLetterLanguageISO3 || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Senior Delay Start</label>
                      <p className="text-gray-900">{wsMissionary.seniorDelayStart ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('contact')}
                  className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-900 hover:bg-gray-50"
                >
                  <span>Contact Information</span>
                  {expandedSections.has('contact') ? <KeyboardArrowDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                
                {expandedSections.has('contact') && (
                  <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email Address</label>
                      <p className="text-gray-900">{wsMissionary.emailAddress || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Proselyting Email Address</label>
                      <p className="text-gray-900">{wsMissionary.proselytingEmailAddress || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Driving Information */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('driving')}
                  className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-900 hover:bg-gray-50"
                >
                  <span>Driving Information</span>
                  {expandedSections.has('driving') ? <KeyboardArrowDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                
                {expandedSections.has('driving') && (
                  <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Driving Status</label>
                      <p className="text-gray-900">{wsMissionary.drivingStatus ? 'Authorized' : 'Not Authorized'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Designated Driver</label>
                      <p className="text-gray-900">{wsMissionary.designatedDriver ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Issuing State or Country</label>
                      <p className="text-gray-900">{wsMissionary.issuingStateOrCountry || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Issuing State</label>
                      <p className="text-gray-900">{wsMissionary.issuingState || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Issuing Country</label>
                      <p className="text-gray-900">{wsMissionary.issuingCountry || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">License Expiration Date</label>
                      <p className="text-gray-900">{formatDate(wsMissionary.licenseExpirationDate)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* MyPlan Information */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('myplan')}
                  className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-900 hover:bg-gray-50"
                >
                  <span>MyPlan Information</span>
                  {expandedSections.has('myplan') ? <KeyboardArrowDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                
                {expandedSections.has('myplan') && (
                  <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">MyPlan Completion Timestamp</label>
                      <p className="text-gray-900">{wsMissionary.myPlanCompletionTimestamp || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">MyPlan Sharing</label>
                      <p className="text-gray-900">{wsMissionary.myPlanSharing ? 'Enabled' : 'Disabled'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">MyPlan URL</label>
                      <p className="text-gray-900 break-all">{wsMissionary.myPlanURL || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Assignment Information */}
              {wsMissionary.wsMissionaryAssignment && (
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection('assignment')}
                    className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-900 hover:bg-gray-50"
                  >
                    <span>Current Assignment</span>
                    {expandedSections.has('assignment') ? <KeyboardArrowDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  
                  {expandedSections.has('assignment') && (
                    <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Assignment ID</label>
                        <p className="text-gray-900">{wsMissionary.wsMissionaryAssignment.id || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Assignment Type</label>
                        <p className="text-gray-900">{wsMissionary.wsMissionaryAssignment.assignmentTypeCode || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Assignment Status</label>
                        <p className="text-gray-900">{wsMissionary.wsMissionaryAssignment.assignmentStatusCode || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Component ID</label>
                        <p className="text-gray-900">{wsMissionary.wsMissionaryAssignment.assignmentComponentId || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Start Date</label>
                        <p className="text-gray-900">{formatDate(wsMissionary.wsMissionaryAssignment.assignmentStartDate)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">End Date</label>
                        <p className="text-gray-900">{formatDate(wsMissionary.wsMissionaryAssignment.assignmentEndDate)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Position</label>
                        <p className="text-gray-900">{wsMissionary.wsMissionaryAssignment.positionDescription || wsMissionary.wsMissionaryAssignment.positionAbbreviation || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Assignment Location Unit</label>
                        <p className="text-gray-900">{wsMissionary.wsMissionaryAssignment.assignmentLocationUnitNumber || 'N/A'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Component Description</label>
                        <p className="text-gray-900">{wsMissionary.wsMissionaryAssignment.assignmentComponentDescription || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Identity Information */}
              {wsMissionary.missionaryIdentity && wsMissionary.missionaryIdentity.length > 0 && (
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection('identity')}
                    className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-900 hover:bg-gray-50"
                  >
                    <span>Identity Information ({wsMissionary.missionaryIdentity.length})</span>
                    {expandedSections.has('identity') ? <KeyboardArrowDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  
                  {expandedSections.has('identity') && (
                    <div className="px-4 pb-4 space-y-4">
                      {wsMissionary.missionaryIdentity.map((identity, index) => (
                        <div key={identity.id} className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-800 mb-2">Identity {index + 1}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">ID</label>
                              <p className="text-gray-900">{identity.id || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Document ID</label>
                              <p className="text-gray-900">{identity.documentId || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Alt ID Type</label>
                              <p className="text-gray-900">{identity.altIdType || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Issue State</label>
                              <p className="text-gray-900">{identity.issueState || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Suspended</label>
                              <p className="text-gray-900">{identity.suspended ? 'Yes' : 'No'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Document Expire Date</label>
                              <p className="text-gray-900">{formatDate(identity.documentExpireDate)}</p>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700">Name</label>
                              <p className="text-gray-900">
                                {[identity.firstName, identity.middleName, identity.lastName, identity.suffix].filter(Boolean).join(' ') || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* History Information */}
              {wsMissionary.wsMissionaryHistories && wsMissionary.wsMissionaryHistories.length > 0 && (
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection('history')}
                    className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-900 hover:bg-gray-50"
                  >
                    <span>Mission History ({wsMissionary.wsMissionaryHistories.length})</span>
                    {expandedSections.has('history') ? <KeyboardArrowDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  
                  {expandedSections.has('history') && (
                    <div className="px-4 pb-4 space-y-4">
                      {wsMissionary.wsMissionaryHistories.map((history, index) => (
                        <div key={history.id} className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-800 mb-2">History {index + 1}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">ID</label>
                              <p className="text-gray-900">{history.id || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Start Date</label>
                              <p className="text-gray-900">{formatDate(history.startDate)}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Position</label>
                              <p className="text-gray-900">{history.position || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Area Name</label>
                              <p className="text-gray-900">{history.areaName || 'N/A'}</p>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700">Companionship</label>
                              <p className="text-gray-900">{history.companionship || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Query Information */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Query Information</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Query:</strong> wsMissionary(id: ID!): WSMissionary</p>
            <p><strong>Parameter:</strong> id (required) - The missionary ID (legacy_miss_id)</p>
            <p><strong>Description:</strong> Retrieves Web Service missionary information including personal details, mission assignments, identity documents, and historical data</p>
            <p><strong>Use Case:</strong> Access comprehensive missionary data from the Web Service layer, including current assignments and historical information</p>
          </div>
        </div>
      </div>
    </div>
  )
}
