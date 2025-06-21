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
  Badge,
  School,
  Assignment,
  Security,
  Info
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

interface AssignmentLocation {
  id: string;
  name?: string;
  assignmentMeetingName?: string;
  legacyId?: number;
  effectiveDate?: string;
  componentOvertolerancePercentage?: number;
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
  pendingMapEffectiveDate?: string;
  nameExportDate?: string;
}

interface EnabledMember {
  id: string;
  legacyMissId?: number;
  cmisId?: string;
  ldsAccountId?: string;
  enabledMemberDate?: string;
  procstatDate?: string;
  currentAvailabilityDate?: string;
  releaseInfoAuthDate?: string;
  pendingPapers?: boolean;
  alert?: string;
  hold?: boolean;
  createdBy?: string;
  dateCreated?: string;
  modifiedBy?: string;
  dateModified?: string;
  legacy?: boolean;
  missionStartDate?: string;
  releaseDate?: string;
  anniversaryDate?: string;
  leaderVisibility?: boolean;
  termMonths?: number;
  homeUnit?: MMSOrganization;
  tempUnit?: MMSOrganization;
}

interface MissionaryIdentity {
  id: string;
  missionaryNameId?: number;
  enabledMember?: EnabledMember;
  legacyMissId?: number;
  issueCountry?: MMSLocation;
  issueState?: string;
  suspended?: boolean;
  documentExpireDate?: string;
  documentId?: string;
  altIdType?: string;
  nameTypeCode?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  suffix?: string;
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

interface MissionaryHistory {
  legacyMissId?: number;
  assignmentLocationId?: number;
  assignmentLocationName?: string;
  effectiveDate?: string;
  effectiveEndDate?: string;
  proselytingAreaId?: number;
  areaName?: string;
  areaDate?: string;
  areaEndDate?: string;
  roleId?: number;
  roleType?: string;
  roleDate?: string;
  roleEndDate?: string;
  companionshipDate?: string;
  companionshipEndDate?: string;
  unitNumber?: number;
  assignmentLocation?: AssignmentLocation;
}

interface WSMissionaryHistory {
  id: string;
  legacyMissId?: number;
  cmisId?: number;
  startDate?: string;
  position?: string;
  companionship?: string;
  areaName?: string;
  missionUnit?: MMSOrganization;
  assignmentLocation?: AssignmentLocation;
}

interface Missionary {
  id: string;
  missionaryId?: number;
  enabledMember?: EnabledMember;
  appMissionaryType?: string;
  lastName?: string;
  middleName?: string;
  firstName?: string;
  birthDate?: string;
  mrn?: string;
  appLivesWith?: string;
  ifOtherWho?: string;
  legacyMissId?: number;
  churchCallings?: string;
  passportExpireDate?: string;
  driverLicenseExpireDate?: string;
  suffix?: string;
  confirmationDate?: string;
  callLetterLanguageId?: number;
  placeOfBirth?: string;
  passportNumber?: string;
  preferredLastName?: string;
  preferredMiddleName?: string;
  preferredFirstName?: string;
  genderCode?: string;
  emailAddress?: string;
  preferredSuffix?: string;
  ldsAccountId?: string;
  mobilePhone?: string;
  cmisId?: number;
  driverLicenseState?: string;
  homeAirportCode?: string;
  homeAirportText?: string;
  personalMobileDeviceProfileOverrideId?: number;
  birthLocationId?: number;
  driverLicenseLocationId?: number;
  passportLocationId?: number;
  personalEmailAddress?: string;
  mobilePhoneLocation?: MMSLocation;
  canReceiveTextMessage?: boolean;
  dentalEvaluationOralExamDate?: string;
  healthEvaluationPhysicalExamDate?: string;
  caseManagementTypeId?: number;
  workforceEnabled?: boolean;
  loadDate?: string;
  certificateRequestDate?: string;
  myPlanMissionary?: MyPlanMissionary;
  missionaryIdentity?: MissionaryIdentity[];
  wsMissionaryHistories?: WSMissionaryHistory[];
  missionaryHistories?: MissionaryHistory[];
  leaderPermissionData?: string;
  proselytingEmailStatus?: string;
  assignmentPackageXml?: string;
  afabEnabledYN?: string;
  onlineProselytingEnabledYN?: string;
  pmdProfileOverride?: string;
  pmdEnabledYN?: string;
  socialMediaSpecialistOrganizations?: string;
  missionComponentLanguagesList?: string;
  englishConnectEligible?: boolean;
}

interface SearchHistoryItem {
  id: string;
  timestamp: string;
  found: boolean;
}

const MISSIONARY_QUERY = `
  query GetMissionary($id: ID!) {
    missionary(id: $id) {
      id
      missionaryId
      enabledMember {
        id
        legacyMissId
        cmisId
        ldsAccountId
        enabledMemberDate
        procstatDate
        currentAvailabilityDate
        releaseInfoAuthDate
        pendingPapers
        alert
        hold
        createdBy
        dateCreated
        modifiedBy
        dateModified
        legacy
        missionStartDate
        releaseDate
        anniversaryDate
        leaderVisibility
        termMonths
        homeUnit {
          id
          organizationId
          name
          officialName
          shortName
        }
        tempUnit {
          id
          organizationId
          name
          officialName
          shortName
        }
      }
      appMissionaryType
      lastName
      middleName
      firstName
      birthDate
      mrn
      appLivesWith
      ifOtherWho
      legacyMissId
      churchCallings
      passportExpireDate
      driverLicenseExpireDate
      suffix
      confirmationDate
      callLetterLanguageId
      placeOfBirth
      passportNumber
      preferredLastName
      preferredMiddleName
      preferredFirstName
      genderCode
      emailAddress
      preferredSuffix
      ldsAccountId
      mobilePhone
      cmisId
      driverLicenseState
      homeAirportCode
      homeAirportText
      personalMobileDeviceProfileOverrideId
      birthLocationId
      driverLicenseLocationId
      passportLocationId
      personalEmailAddress
      mobilePhoneLocation {
        id
        iso3Code
        name
        shortName
        abbreviation
        smsIso3Code
      }
      canReceiveTextMessage
      dentalEvaluationOralExamDate
      healthEvaluationPhysicalExamDate
      caseManagementTypeId
      workforceEnabled
      loadDate
      certificateRequestDate
      myPlanMissionary {
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
          legacyId
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
      missionaryIdentity {
        id
        missionaryNameId
        enabledMember {
          id
          legacyMissId
          cmisId
          ldsAccountId
        }
        legacyMissId
        issueCountry {
          id
          iso3Code
          name
          shortName
          abbreviation
          smsIso3Code
        }
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
        missionUnit {
          id
          organizationId
          name
          officialName
          shortName
        }
        assignmentLocation {
          id
          name
          assignmentMeetingName
          legacyId
        }
      }
      missionaryHistories {
        legacyMissId
        assignmentLocationId
        assignmentLocationName
        effectiveDate
        effectiveEndDate
        proselytingAreaId
        areaName
        areaDate
        areaEndDate
        roleId
        roleType
        roleDate
        roleEndDate
        companionshipDate
        companionshipEndDate
        unitNumber
        assignmentLocation {
          id
          name
          assignmentMeetingName
          legacyId
        }
      }
      leaderPermissionData
      proselytingEmailStatus
      assignmentPackageXml
      afabEnabledYN
      onlineProselytingEnabledYN
      pmdProfileOverride
      pmdEnabledYN
      socialMediaSpecialistOrganizations
      missionComponentLanguagesList
      englishConnectEligible
    }
  }
`;

export default function MOGSMissionaryPage() {
  const [missionaryId, setMissionaryId] = useState('');
  const [missionary, setMissionary] = useState<Missionary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>(getDefaultEnvironment('mogs'));
  const [showHistory, setShowHistory] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic', 'contact', 'identity']));

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
    const savedHistory = localStorage.getItem('mogs-missionary-search-history');
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
    localStorage.setItem('mogs-missionary-search-history', JSON.stringify(updatedHistory));
  };

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('mogs-missionary-search-history');
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
    if (!missionaryId.trim()) {
      setError('Please enter a Missionary ID');
      return;
    }

    if (!apiClient) {
      setError('API client not initialized. Please wait a moment or try refreshing the page.');
      return;
    }

    setLoading(true);
    setError(null);
    setMissionary(null);

    try {
      const variables = { id: missionaryId.trim() };
      const response = await apiClient.executeGraphQLQuery(MISSIONARY_QUERY, variables);

      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const result = response.data as { missionary: Missionary };
      
      if (result.missionary) {
        setMissionary(result.missionary);
        saveSearchHistory(missionaryId.trim(), true);
        
        // Scroll to results
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        setError('Missionary not found');
        saveSearchHistory(missionaryId.trim(), false);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during search');
      saveSearchHistory(missionaryId.trim(), false);
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
    if (!missionary) return;

    const dataStr = JSON.stringify(missionary, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `missionary-${missionary.id}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateTimeString?: string) => {
    if (!dateTimeString) return 'N/A';
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString();
    } catch {
      return dateTimeString;
    }
  };

  const renderSection = (title: string, sectionKey: string, icon: React.ReactNode, content: React.ReactNode) => {
    const isExpanded = expandedSections.has(sectionKey);
    return (
      <div className="bg-white rounded-lg shadow-md mb-6">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 rounded-t-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            {icon}
            <span>{title}</span>
          </h3>
          {isExpanded ? (
            <ExpandLess className="h-5 w-5 text-gray-500" />
          ) : (
            <ExpandMore className="h-5 w-5 text-gray-500" />
          )}
        </button>
        {isExpanded && (
          <div className="px-6 pb-6">
            {content}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">MOGS Missionary Search</h1>
        <p className="text-gray-600 mb-4">Search for missionary details by ID (legacy_miss_id)</p>
        
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

      {/* Search Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Search Missionary by ID</h2>
        
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="missionary-id" className="block text-sm font-medium text-gray-700 mb-1">Missionary ID (legacy_miss_id)</label>
            <input
              id="missionary-id"
              type="text"
              placeholder="Enter missionary ID"
              value={missionaryId}
              onChange={(e) => setMissionaryId(e.target.value)}
              onKeyPress={handleKeyPress}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !apiClient}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                    onClick={() => setMissionaryId(item.id)}
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
      {missionary && (
        <div ref={resultRef} className="space-y-6">
          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={exportToJson}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FileDownload className="h-4 w-4 mr-2" />
              Export JSON
            </button>
          </div>

          {/* Basic Information */}
          {renderSection(
            'Basic Information',
            'basic',
            <Person className="h-5 w-5 text-blue-500" />,
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">ID</span>
                <p className="font-mono text-sm">{missionary.id}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Missionary ID</span>
                <p className="text-sm">{missionary.missionaryId || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Legacy Miss ID</span>
                <p className="text-sm">{missionary.legacyMissId || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">CMIS ID</span>
                <p className="text-sm">{missionary.cmisId || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Full Name</span>
                <p className="text-sm font-semibold">
                  {[missionary.firstName, missionary.middleName, missionary.lastName, missionary.suffix].filter(Boolean).join(' ') || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Preferred Name</span>
                <p className="text-sm">
                  {[missionary.preferredFirstName, missionary.preferredMiddleName, missionary.preferredLastName, missionary.preferredSuffix].filter(Boolean).join(' ') || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Gender</span>
                <p className="text-sm">{missionary.genderCode || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Birth Date</span>
                <p className="text-sm">{formatDate(missionary.birthDate)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Place of Birth</span>
                <p className="text-sm">{missionary.placeOfBirth || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">MRN</span>
                <p className="text-sm font-mono">{missionary.mrn || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">LDS Account ID</span>
                <p className="text-sm font-mono">{missionary.ldsAccountId || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Missionary Type</span>
                <p className="text-sm">{missionary.appMissionaryType || 'N/A'}</p>
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
                <span className="text-sm font-medium text-gray-500">Email Address</span>
                <p className="text-sm break-all">{missionary.emailAddress || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Personal Email</span>
                <p className="text-sm break-all">{missionary.personalEmailAddress || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Mobile Phone</span>
                <p className="text-sm">{missionary.mobilePhone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Can Receive Text Messages</span>
                <p className="text-sm">{missionary.canReceiveTextMessage ? 'Yes' : 'No'}</p>
              </div>
              {missionary.mobilePhoneLocation && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Mobile Phone Location</span>
                  <p className="text-sm">{missionary.mobilePhoneLocation.name || missionary.mobilePhoneLocation.id}</p>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-gray-500">Living Arrangements</span>
                <p className="text-sm">{missionary.appLivesWith || 'N/A'}</p>
              </div>
              {missionary.ifOtherWho && (
                <div>
                  <span className="text-sm font-medium text-gray-500">If Other, Who</span>
                  <p className="text-sm">{missionary.ifOtherWho}</p>
                </div>
              )}
            </div>
          )}

          {/* Documents & Identification */}
          {renderSection(
            'Documents & Identification',
            'documents',
            <Badge className="h-5 w-5 text-purple-500" />,
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Passport Number</span>
                <p className="text-sm font-mono">{missionary.passportNumber || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Passport Expiry</span>
                <p className="text-sm">{formatDate(missionary.passportExpireDate)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Driver License State</span>
                <p className="text-sm">{missionary.driverLicenseState || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Driver License Expiry</span>
                <p className="text-sm">{formatDate(missionary.driverLicenseExpireDate)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Confirmation Date</span>
                <p className="text-sm">{formatDate(missionary.confirmationDate)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Church Callings</span>
                <p className="text-sm">{missionary.churchCallings || 'N/A'}</p>
              </div>
            </div>
          )}

          {/* Travel Information */}
          {renderSection(
            'Travel Information',
            'travel',
            <Home className="h-5 w-5 text-orange-500" />,
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Home Airport Code</span>
                <p className="text-sm font-mono">{missionary.homeAirportCode || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Home Airport Text</span>
                <p className="text-sm">{missionary.homeAirportText || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Birth Location ID</span>
                <p className="text-sm">{missionary.birthLocationId || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Driver License Location ID</span>
                <p className="text-sm">{missionary.driverLicenseLocationId || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Passport Location ID</span>
                <p className="text-sm">{missionary.passportLocationId || 'N/A'}</p>
              </div>
            </div>
          )}

          {/* Health & Medical */}
          {renderSection(
            'Health & Medical Information',
            'health',
            <Info className="h-5 w-5 text-red-500" />,
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Dental Evaluation Date</span>
                <p className="text-sm">{formatDate(missionary.dentalEvaluationOralExamDate)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Physical Exam Date</span>
                <p className="text-sm">{formatDate(missionary.healthEvaluationPhysicalExamDate)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Case Management Type ID</span>
                <p className="text-sm">{missionary.caseManagementTypeId || 'N/A'}</p>
              </div>
            </div>
          )}

          {/* Technology & Digital */}
          {renderSection(
            'Technology & Digital Services',
            'technology',
            <Security className="h-5 w-5 text-indigo-500" />,
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">PMD Profile Override ID</span>
                <p className="text-sm">{missionary.personalMobileDeviceProfileOverrideId || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">PMD Enabled</span>
                <p className="text-sm">{missionary.pmdEnabledYN || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">AFAB Enabled</span>
                <p className="text-sm">{missionary.afabEnabledYN || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Online Proselyting Enabled</span>
                <p className="text-sm">{missionary.onlineProselytingEnabledYN || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Proselyting Email Status</span>
                <p className="text-sm">{missionary.proselytingEmailStatus || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Workforce Enabled</span>
                <p className="text-sm">{missionary.workforceEnabled ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">English Connect Eligible</span>
                <p className="text-sm">{missionary.englishConnectEligible ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Call Letter Language ID</span>
                <p className="text-sm">{missionary.callLetterLanguageId || 'N/A'}</p>
              </div>
            </div>
          )}

          {/* Special Assignments */}
          {(missionary.socialMediaSpecialistOrganizations || missionary.missionComponentLanguagesList) && renderSection(
            'Special Assignments',
            'assignments',
            <Assignment className="h-5 w-5 text-yellow-500" />,
            <div className="space-y-4">
              {missionary.socialMediaSpecialistOrganizations && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Social Media Specialist Organizations</span>
                  <p className="text-sm">{missionary.socialMediaSpecialistOrganizations}</p>
                </div>
              )}
              {missionary.missionComponentLanguagesList && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Mission Component Languages List</span>
                  <p className="text-sm">{missionary.missionComponentLanguagesList}</p>
                </div>
              )}
            </div>
          )}

          {/* Enabled Member */}
          {missionary.enabledMember && renderSection(
            'Enabled Member Information',
            'enabledMember',
            <Person className="h-5 w-5 text-cyan-500" />,
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Enabled Member ID</span>
                <p className="font-mono text-sm">{missionary.enabledMember.id}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">CMIS ID</span>
                <p className="text-sm">{missionary.enabledMember.cmisId || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Full Name</span>
                <p className="text-sm font-semibold">
                  {[missionary.firstName, missionary.middleName, missionary.lastName, missionary.suffix].filter(Boolean).join(' ') || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Birth Date</span>
                <p className="text-sm">{formatDate(missionary.birthDate)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Gender</span>
                <p className="text-sm">{missionary.genderCode || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">MRN</span>
                <p className="text-sm font-mono">{missionary.mrn || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">LDS Account ID</span>
                <p className="text-sm font-mono">{missionary.enabledMember.ldsAccountId || 'N/A'}</p>
              </div>
            </div>
          )}

          {/* MyPlan Missionary */}
          {missionary.myPlanMissionary && renderSection(
            'MyPlan Information',
            'myplan',
            <School className="h-5 w-5 text-teal-500" />,
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">MyPlan ID</span>
                <p className="font-mono text-sm">{missionary.myPlanMissionary.id}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Mission Name</span>
                <p className="text-sm font-semibold">{missionary.myPlanMissionary.missionName || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Missionary Type</span>
                <p className="text-sm">{missionary.myPlanMissionary.missionaryType || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Assignment End Date</span>
                <p className="text-sm">{formatDate(missionary.myPlanMissionary.assignmentEndDate)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">CMIS Unit</span>
                <p className="text-sm">{missionary.myPlanMissionary.cmisUnitName || missionary.myPlanMissionary.cmisUnitId || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Parent Unit</span>
                <p className="text-sm">{missionary.myPlanMissionary.parentUnitName || missionary.myPlanMissionary.parentUnitId || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Course Status</span>
                <p className="text-sm">{missionary.myPlanMissionary.courseStatusName || missionary.myPlanMissionary.courseStatusCode || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Enrolled</span>
                <p className="text-sm">{formatDateTime(missionary.myPlanMissionary.enrolledTimestamp)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Started</span>
                <p className="text-sm">{formatDateTime(missionary.myPlanMissionary.startTimestamp)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Completed</span>
                <p className="text-sm">{formatDateTime(missionary.myPlanMissionary.myPlanCompletionTimestamp)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">MyPlan Sharing</span>
                <p className="text-sm">{missionary.myPlanMissionary.myPlanSharing ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">IMOS Report</span>
                <p className="text-sm">{missionary.myPlanMissionary.imosReport ? 'Yes' : 'No'}</p>
              </div>
              {missionary.myPlanMissionary.myPlanURL && (
                <div className="col-span-full">
                  <span className="text-sm font-medium text-gray-500">MyPlan URL</span>
                  <p className="text-sm break-all">
                    <a href={missionary.myPlanMissionary.myPlanURL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                      {missionary.myPlanMissionary.myPlanURL}
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Missionary Identity */}
          {missionary.missionaryIdentity && missionary.missionaryIdentity.length > 0 && renderSection(
            'Identity Documents',
            'identity',
            <Badge className="h-5 w-5 text-pink-500" />,
            <div className="space-y-4">
              {missionary.missionaryIdentity.map((identity, index) => (
                <div key={identity.id} className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-3">Identity Document #{index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Document ID</span>
                      <p className="text-sm font-mono">{identity.documentId || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Document Type</span>
                      <p className="text-sm">{identity.altIdType || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Name Type</span>
                      <p className="text-sm">{identity.nameTypeCode || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Issue State</span>
                      <p className="text-sm">{identity.issueState || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Suspended</span>
                      <p className="text-sm">{identity.suspended ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Expire Date</span>
                      <p className="text-sm">{formatDate(identity.documentExpireDate)}</p>
                    </div>
                    <div className="col-span-full">
                      <span className="text-sm font-medium text-gray-500">Name on Document</span>
                      <p className="text-sm font-semibold">
                        {[identity.firstName, identity.middleName, identity.lastName, identity.suffix].filter(Boolean).join(' ') || 'N/A'}
                      </p>
                    </div>
                    {identity.issueCountry && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Issue Country</span>
                        <p className="text-sm">{identity.issueCountry.name || identity.issueCountry.id}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* History Sections */}
          {((missionary.missionaryHistories && missionary.missionaryHistories.length > 0) || 
            (missionary.wsMissionaryHistories && missionary.wsMissionaryHistories.length > 0)) && renderSection(
            'History Information',
            'history',
            <AccessTime className="h-5 w-5 text-gray-500" />,
            <div className="space-y-6">
              {missionary.missionaryHistories && missionary.missionaryHistories.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Missionary Histories</h4>
                  <div className="space-y-3">
                    {missionary.missionaryHistories.map((history, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <span className="text-sm font-medium text-gray-500">Legacy Miss ID</span>
                            <p className="text-sm font-mono">{history.legacyMissId || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Assignment Location</span>
                            <p className="text-sm">{history.assignmentLocationName || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Area Name</span>
                            <p className="text-sm">{history.areaName || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Role Type</span>
                            <p className="text-sm">{history.roleType || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Effective Date</span>
                            <p className="text-sm">{formatDate(history.effectiveDate)}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Effective End Date</span>
                            <p className="text-sm">{formatDate(history.effectiveEndDate)}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Role Date</span>
                            <p className="text-sm">{formatDate(history.roleDate)}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Unit Number</span>
                            <p className="text-sm">{history.unitNumber || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {missionary.wsMissionaryHistories && missionary.wsMissionaryHistories.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">WS Missionary Histories</h4>
                  <div className="space-y-3">
                    {missionary.wsMissionaryHistories.map((history, index) => (
                      <div key={history.id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <span className="text-sm font-medium text-gray-500">WS History ID</span>
                            <p className="text-sm font-mono">{history.id}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Legacy Miss ID</span>
                            <p className="text-sm">{history.legacyMissId || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">CMIS ID</span>
                            <p className="text-sm">{history.cmisId || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Start Date</span>
                            <p className="text-sm">{formatDate(history.startDate)}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Position</span>
                            <p className="text-sm">{history.position || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Companionship</span>
                            <p className="text-sm">{history.companionship || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Area Name</span>
                            <p className="text-sm">{history.areaName || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Mission Unit</span>
                            <p className="text-sm">{history.missionUnit?.name || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Technical Data */}
          {(missionary.leaderPermissionData || missionary.assignmentPackageXml || missionary.pmdProfileOverride) && renderSection(
            'Technical Data',
            'technical',
            <Info className="h-5 w-5 text-gray-500" />,
            <div className="space-y-4">
              {missionary.leaderPermissionData && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Leader Permission Data</span>
                  <div className="mt-1 p-3 bg-gray-50 rounded border max-h-32 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap">{missionary.leaderPermissionData}</pre>
                  </div>
                </div>
              )}
              {missionary.assignmentPackageXml && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Assignment Package XML</span>
                  <div className="mt-1 p-3 bg-gray-50 rounded border max-h-32 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap">{missionary.assignmentPackageXml}</pre>
                  </div>
                </div>
              )}
              {missionary.pmdProfileOverride && (
                <div>
                  <span className="text-sm font-medium text-gray-500">PMD Profile Override</span>
                  <div className="mt-1 p-3 bg-gray-50 rounded border max-h-32 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap">{missionary.pmdProfileOverride}</pre>
                  </div>
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
                <p className="text-sm">{formatDate(missionary.loadDate)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Certificate Request Date</span>
                <p className="text-sm">{formatDate(missionary.certificateRequestDate)}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
