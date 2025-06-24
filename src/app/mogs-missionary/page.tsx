'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

// TypeScript interfaces matching the MOGS GraphQL schema
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

interface EnabledMember {
  id: string;
  enabledMemberDate?: string;
  homeUnit?: MMSOrganization;
  tempUnit?: MMSOrganization;
  missionaryType?: any; // MissionaryType
  language?: any; // LanguageAddendum
  procstat?: any; // Procstat
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

interface WSMissionaryHistory {
  id: string;
  legacyMissId?: number;
  cmisId?: number;
  missionary?: Missionary;
  // wsMissionary?: WSMissionary;
  missionUnit?: MMSOrganization;
  assignmentLocation?: {
    id: string;
    name?: string;
  };
  startDate?: string;
  position?: string;
  companionship?: string;
  areaName?: string;
}

interface MissionaryHistory {
  legacyMissId?: number;
  assignmentLocationId?: number;
  assignmentLocationName?: string;
  assignmentLocation?: {
    id: string;
    name?: string;
  };
  effectiveDate?: string;
  effectiveEndDate?: string;
  proselytingAreaId?: number;
  wsProselytingArea?: {
    id: string;
    name?: string;
  };
  areaName?: string;
  areaDate?: string;
  areaEndDate?: string;
  roleId?: number;
  roleType?: string;
  roleDate?: string;
  roleEndDate?: string;
  // companions?: Companion[];
  companionshipDate?: string;
  companionshipEndDate?: string;
  unitNumber?: number;
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
  // missionAssignmentLocation?: AssignmentLocation;
  // missionOrgNumber?: MMSOrganization;
  missionName?: string;
  assignmentEndDate?: string;
  // procstat?: Procstat;
  cmisUnitId?: number;
  cmisUnitName?: string;
  parentUnitId?: number;
  parentUnitName?: string;
  netdUid?: string;
}

interface Missionary {
  id: string; // legacy_miss_id
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

interface SearchHistory {
  id: string;
  timestamp: Date;
  missionaryId: string;
  resultFound: boolean;
  missionaryName?: string;
}

export default function MOGSMissionaryPage() {
  const [missionary, setMissionary] = useState<Missionary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  
  // Search state
  const [missionaryId, setMissionaryId] = useState('');
  const [selectedEnvironment, setSelectedEnvironment] = useState('mogs-gql-dev');

  // Utility functions
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatBoolean = (val?: boolean) => {
    if (val === undefined || val === null) return 'N/A';
    return val ? 'Yes' : 'No';
  };

  const exportToJson = () => {
    if (!missionary) return;
    
    const dataStr = JSON.stringify(missionary, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `missionary-${missionary.legacyMissId}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const clearSearch = () => {
    setMissionaryId('');
    setMissionary(null);
    setError(null);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('mogs-missionary-search-history');
  };

  const handleLoadFromHistory = (entry: SearchHistory) => {
    setMissionaryId(entry.missionaryId || '');
  };

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mogs-missionary-search-history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSearchHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
          missionaryId: item.missionaryId || '' // Ensure missionaryId is never undefined
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

  const saveSearchHistory = (searchMissionaryId: string, found: boolean, missionaryName?: string) => {
    const newEntry: SearchHistory = {
      id: Date.now().toString(),
      timestamp: new Date(),
      missionaryId: searchMissionaryId,
      resultFound: found,
      missionaryName
    };
    
    const updatedHistory = [newEntry, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
    setSearchHistory(updatedHistory);
    localStorage.setItem('mogs-missionary-search-history', JSON.stringify(updatedHistory));
  };

  const searchMissionary = async () => {
    if (!missionaryId?.trim()) {
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

    const query = `
      query GetMissionary($id: ID!) {
        missionary(id: $id) {
          id
          missionaryId
          enabledMember {
            id
            enabledMemberDate
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
            name
            shortName
            iso3Code
            abbreviation
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
            missionName
            assignmentEndDate
            cmisUnitId
            cmisUnitName
            parentUnitId
            parentUnitName
            netdUid
          }
          missionaryIdentity {
            id
            missionaryNameId
            legacyMissId
            issueCountry {
              id
              name
              shortName
              iso3Code
              abbreviation
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
            }
            startDate
            position
            companionship
            areaName
          }
          missionaryHistories {
            legacyMissId
            assignmentLocationId
            assignmentLocationName
            assignmentLocation {
              id
              name
            }
            effectiveDate
            effectiveEndDate
            proselytingAreaId
            wsProselytingArea {
              id
              name
            }
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

    const variables = { id: missionaryId?.trim() || '' };

    try {
      const response = await apiClient.executeGraphQLQuery(query, variables);

      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors.map(err => err.message).join(', '));
      }

      if (response.data && (response.data as any).missionary) {
        const missionaryData = (response.data as any).missionary;
        setMissionary(missionaryData);
        const fullName = `${missionaryData.firstName || ''} ${missionaryData.lastName || ''}`.trim();
        saveSearchHistory(missionaryId?.trim() || '', true, fullName || undefined);
      } else {
        setError('No missionary found with the provided ID');
        saveSearchHistory(missionaryId?.trim() || '', false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      saveSearchHistory(missionaryId?.trim() || '', false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🙏</span>
        <h1 className="text-2xl font-bold">MOGS Missionary</h1>
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Search Missionary by ID</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="missionary-id" className="block text-sm font-medium text-gray-700 mb-1">Missionary ID (legacy_miss_id)</label>
            <input
              id="missionary-id"
              type="text"
              placeholder="Enter missionary ID"
              value={missionaryId || ''}
              onChange={(e) => setMissionaryId(e.target.value || '')}
              onKeyPress={(e) => e.key === 'Enter' && searchMissionary()}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={searchMissionary}
            disabled={loading || !missionaryId?.trim()}
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
            <h2 className="text-lg font-semibold text-gray-900">📈 Recent Searches</h2>
            <button
              onClick={clearHistory}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear History
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {searchHistory.slice(0, 6).map((entry) => (
              <div
                key={entry.id}
                onClick={() => handleLoadFromHistory(entry)}
                className="p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 flex items-center justify-between"
              >
                <div>
                  <div className="font-mono text-sm">{entry.missionaryId}</div>
                  {entry.missionaryName && (
                    <div className="text-xs text-gray-600 truncate">{entry.missionaryName}</div>
                  )}
                  <div className="text-xs text-gray-500">
                    {entry.timestamp.toLocaleDateString()}
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  entry.resultFound ? 'bg-green-500' : 'bg-red-500'
                }`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Missionary Details */}
      {missionary && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Missionary Details</h2>
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
                      <span className="text-gray-600">Missionary ID:</span>
                      <span className="font-mono">{missionary.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Legacy Miss ID:</span>
                      <span className="font-mono">{missionary.legacyMissId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">First Name:</span>
                      <span>{missionary.firstName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Name:</span>
                      <span>{missionary.lastName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Middle Name:</span>
                      <span>{missionary.middleName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Birth Date:</span>
                      <span>{formatDate(missionary.birthDate)}</span>
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
                      <span>{missionary.personalEmailAddress || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mobile Phone:</span>
                      <span>{missionary.mobilePhone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Can Receive Text:</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        missionary.canReceiveTextMessage ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {formatBoolean(missionary.canReceiveTextMessage)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gender:</span>
                      <span>{missionary.genderCode || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email Address:</span>
                      <span>{missionary.emailAddress || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">LDS Account ID:</span>
                      <span className="font-mono">{missionary.ldsAccountId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Preferred Name:</span>
                      <span>{`${missionary.preferredFirstName || ''} ${missionary.preferredLastName || ''}`.trim() || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enabled Member Information */}
            {missionary.enabledMember && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Enabled Member Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Enabled Date:</span>
                      <span>{formatDate(missionary.enabledMember.enabledMemberDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mission Start:</span>
                      <span>{formatDate(missionary.enabledMember.missionStartDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Release Date:</span>
                      <span>{formatDate(missionary.enabledMember.releaseDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Term Months:</span>
                      <span>{missionary.enabledMember.termMonths || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pending Papers:</span>
                      <span>{formatBoolean(missionary.enabledMember.pendingPapers)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hold:</span>
                      <span>{formatBoolean(missionary.enabledMember.hold)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Legacy:</span>
                      <span>{formatBoolean(missionary.enabledMember.legacy)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Leader Visibility:</span>
                      <span>{formatBoolean(missionary.enabledMember.leaderVisibility)}</span>
                    </div>
                  </div>
                </div>

                {/* Home Unit */}
                {missionary.enabledMember.homeUnit && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Home Unit</h4>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">Organization ID: {missionary.enabledMember.homeUnit.organizationId}</div>
                      <div className="text-sm text-gray-600">Name: {missionary.enabledMember.homeUnit.name || 'N/A'}</div>
                      <div className="text-sm text-gray-600">Official Name: {missionary.enabledMember.homeUnit.officialName || 'N/A'}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Document Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 mb-2">Document Information</h4>
                <div className="flex justify-between">
                  <span className="text-gray-600">Passport Number:</span>
                  <span>{missionary.passportNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Passport Expires:</span>
                  <span>{formatDate(missionary.passportExpireDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Driver License Expires:</span>
                  <span>{formatDate(missionary.driverLicenseExpireDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Driver License State:</span>
                  <span>{missionary.driverLicenseState || 'N/A'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 mb-2">Additional Information</h4>
                <div className="flex justify-between">
                  <span className="text-gray-600">CMIS ID:</span>
                  <span className="font-mono">{missionary.cmisId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Place of Birth:</span>
                  <span>{missionary.placeOfBirth || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confirmation Date:</span>
                  <span>{formatDate(missionary.confirmationDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Church Callings:</span>
                  <span>{missionary.churchCallings || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">English Connect Eligible:</span>
                  <span>{formatBoolean(missionary.englishConnectEligible)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Workforce Enabled:</span>
                  <span>{formatBoolean(missionary.workforceEnabled)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
