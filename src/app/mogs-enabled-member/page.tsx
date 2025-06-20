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
  Public, 
  Home 
} from '@mui/icons-material';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS, getEnvironmentConfigSafe, getDefaultEnvironment } from '@/lib/environments';

// Types based on the GraphQL schema
interface MMSOrganization {
  id: string;
  organizationId?: number;
  name?: string;
  officialName?: string;
  shortName?: string;
  officialShortName?: string;
}

interface MissionaryType {
  id: string;
  minimumMonthsSinceRelease?: number;
  minimumAgeDefault?: number;
  maximumAgeDefault?: number;
  abbreviation?: string;
  senior?: boolean;
  seniorAssignmentMeetingAbbreviation?: string;
  missionaryTypeGroup?: string;
  missionaryTypeName?: string;
  missionaryTypeCode?: string;
}

interface LanguageAddendum {
  id: string;
  languageGroupId?: number;
  lastUpdateDate?: string;
  recentryLanguage?: boolean;
  metadataTranslated?: boolean;
  seniorSiteLanguageStatus?: number;
  napiLanguageStatus?: number;
}

interface Procstat {
  id?: number;
  description?: string;
  enabledMemberProcstatLocationId?: number;
  key?: string;
  dataArchitectComment?: string;
  active?: boolean;
  shortDescription?: string;
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
}

interface SearchHistoryItem {
  id: string;
  timestamp: string;
  found: boolean;
}

const ENABLED_MEMBER_QUERY = `
  query EnabledMemberQuery($id: ID!) {
    enabledMember(id: $id) {
      id
      enabledMemberDate
      homeUnit {
        id
        organizationId
        name
        officialName
        shortName
        officialShortName
      }
      tempUnit {
        id
        organizationId
        name
        officialName
        shortName
        officialShortName
      }
      missionaryType {
        id
        minimumMonthsSinceRelease
        minimumAgeDefault
        maximumAgeDefault
        abbreviation
        senior
        seniorAssignmentMeetingAbbreviation
        missionaryTypeGroup
        missionaryTypeName
        missionaryTypeCode
      }
      language {
        id
        languageGroupId
        lastUpdateDate
        recentryLanguage
        metadataTranslated
        seniorSiteLanguageStatus
        napiLanguageStatus
      }
      procstat {
        id
        description
        enabledMemberProcstatLocationId
        key
        dataArchitectComment
        active
        shortDescription
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
    }
  }
`;

export default function MOGSEnabledMemberPage() {
  const [enabledMemberId, setEnabledMemberId] = useState('');
  const [enabledMember, setEnabledMember] = useState<EnabledMember | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>(getDefaultEnvironment('mogs'));
  const [showHistory, setShowHistory] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic', 'units', 'dates']));

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
    if (!enabledMemberId.trim()) {
      setError('Please enter an Enabled Member ID');
      return;
    }

    if (!apiClient) {
      setError('API client not initialized. Please wait a moment or try refreshing the page.');
      return;
    }

    setLoading(true);
    setError(null);
    setEnabledMember(null);

    try {
      const variables = { id: enabledMemberId.trim() };
      const response = await apiClient.executeGraphQLQuery(ENABLED_MEMBER_QUERY, variables);

      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const result = response.data as { enabledMember: EnabledMember };
      
      if (result.enabledMember) {
        setEnabledMember(result.enabledMember);
        setSearchHistory(prev => [{
          id: enabledMemberId.trim(),
          timestamp: new Date().toLocaleString(),
          found: true
        }, ...prev.slice(0, 9)]);
        
        // Scroll to results
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        setError('Enabled Member not found');
        setSearchHistory(prev => [{
          id: enabledMemberId.trim(),
          timestamp: new Date().toLocaleString(),
          found: false
        }, ...prev.slice(0, 9)]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during search');
      setSearchHistory(prev => [{
        id: enabledMemberId.trim(),
        timestamp: new Date().toLocaleString(),
        found: false
      }, ...prev.slice(0, 9)]);
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
    if (!enabledMember) return;

    const dataStr = JSON.stringify(enabledMember, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `enabled-member-${enabledMember.id}.json`;
    
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">MOGS Enabled Member Search</h1>
        <p className="text-gray-600">Search for enabled member information by ID in the Missionary Oracle Graph Service.</p>
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

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="enabledMemberId" className="block text-sm font-medium text-gray-700 mb-2">
              Enabled Member ID
            </label>
            <input
              type="text"
              id="enabledMemberId"
              value={enabledMemberId}
              onChange={(e) => setEnabledMemberId(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter enabled member ID"
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
            <div className="mt-4 space-y-2">
              {searchHistory.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100"
                  onClick={() => setEnabledMemberId(item.id)}
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
      {enabledMember && (
        <div ref={resultRef} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Person className="h-6 w-6" />
                <span>Enabled Member: {enabledMember.id}</span>
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
                  <p className="font-mono text-sm">{enabledMember.id}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Enabled Date</span>
                  <p className="text-sm">{formatDate(enabledMember.enabledMemberDate)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Legacy Miss ID</span>
                  <p className="text-sm">{enabledMember.legacyMissId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Spouse Legacy Miss ID</span>
                  <p className="text-sm">{enabledMember.legacySpouseMissId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">LDS Account ID</span>
                  <p className="text-sm font-mono">{enabledMember.ldsAccountId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Spouse LDS Account ID</span>
                  <p className="text-sm font-mono">{enabledMember.spouseLdsAccountId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">CMIS ID</span>
                  <p className="text-sm font-mono">{enabledMember.cmisId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Spouse CMIS ID</span>
                  <p className="text-sm font-mono">{enabledMember.spouseCmisId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">CMIS Unit ID</span>
                  <p className="text-sm">{enabledMember.cmisUnitId || 'N/A'}</p>
                </div>
              </div>
            )}

            {/* Units and Organization */}
            {renderSection(
              'Units & Organization',
              'units',
              <Home className="h-5 w-5 text-green-500" />,
              <div className="space-y-6">
                {enabledMember.homeUnit && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Home Unit</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-blue-200">
                      <div>
                        <span className="text-sm font-medium text-gray-500">ID</span>
                        <p className="text-sm font-mono">{enabledMember.homeUnit.id}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Organization ID</span>
                        <p className="text-sm">{enabledMember.homeUnit.organizationId || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Name</span>
                        <p className="text-sm">{enabledMember.homeUnit.name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Official Name</span>
                        <p className="text-sm">{enabledMember.homeUnit.officialName || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Short Name</span>
                        <p className="text-sm">{enabledMember.homeUnit.shortName || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Official Short Name</span>
                        <p className="text-sm">{enabledMember.homeUnit.officialShortName || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {enabledMember.tempUnit && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Temporary Unit</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-green-200">
                      <div>
                        <span className="text-sm font-medium text-gray-500">ID</span>
                        <p className="text-sm font-mono">{enabledMember.tempUnit.id}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Organization ID</span>
                        <p className="text-sm">{enabledMember.tempUnit.organizationId || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Name</span>
                        <p className="text-sm">{enabledMember.tempUnit.name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Official Name</span>
                        <p className="text-sm">{enabledMember.tempUnit.officialName || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Short Name</span>
                        <p className="text-sm">{enabledMember.tempUnit.shortName || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Official Short Name</span>
                        <p className="text-sm">{enabledMember.tempUnit.officialShortName || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mission & Assignment Details */}
            {renderSection(
              'Mission & Assignment Details',
              'mission',
              <Public className="h-5 w-5 text-purple-500" />,
              <div className="space-y-6">
                {enabledMember.missionaryType && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Missionary Type</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-4 border-l-2 border-purple-200">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Type Name</span>
                        <p className="text-sm">{enabledMember.missionaryType.missionaryTypeName || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Code</span>
                        <p className="text-sm font-mono">{enabledMember.missionaryType.missionaryTypeCode || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Abbreviation</span>
                        <p className="text-sm">{enabledMember.missionaryType.abbreviation || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Senior</span>
                        <p className="text-sm">{formatBoolean(enabledMember.missionaryType.senior)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Min Age</span>
                        <p className="text-sm">{enabledMember.missionaryType.minimumAgeDefault || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Max Age</span>
                        <p className="text-sm">{enabledMember.missionaryType.maximumAgeDefault || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Group</span>
                        <p className="text-sm">{enabledMember.missionaryType.missionaryTypeGroup || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Term Months</span>
                        <p className="text-sm">{enabledMember.termMonths || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {enabledMember.procstat && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Processing Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-yellow-200">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Description</span>
                        <p className="text-sm">{enabledMember.procstat.description || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Short Description</span>
                        <p className="text-sm">{enabledMember.procstat.shortDescription || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Key</span>
                        <p className="text-sm font-mono">{enabledMember.procstat.key || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Active</span>
                        <p className="text-sm">{formatBoolean(enabledMember.procstat.active)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Procstat Date</span>
                        <p className="text-sm">{formatDate(enabledMember.procstatDate)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Important Dates */}
            {renderSection(
              'Important Dates',
              'dates',
              <AccessTime className="h-5 w-5 text-orange-500" />,
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Mission Start Date</span>
                  <p className="text-sm">{formatDate(enabledMember.missionStartDate)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Release Date</span>
                  <p className="text-sm">{formatDate(enabledMember.releaseDate)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Anniversary Date</span>
                  <p className="text-sm">{formatDate(enabledMember.anniversaryDate)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Initial Assignment Date</span>
                  <p className="text-sm">{formatDate(enabledMember.initialAssignmentDate)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Current Availability Date</span>
                  <p className="text-sm">{formatDate(enabledMember.currentAvailabilityDate)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Call Letter Sent Date</span>
                  <p className="text-sm">{formatDate(enabledMember.callLetterSentDate)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Release Info Auth Date</span>
                  <p className="text-sm">{formatDate(enabledMember.releaseInfoAuthDate)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Spouse Release Info Auth Date</span>
                  <p className="text-sm">{formatDate(enabledMember.spouseReleaseInfoAuthDate)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">PIN Entered Date</span>
                  <p className="text-sm">{formatDate(enabledMember.pinEnteredDate)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Release Date Change Date</span>
                  <p className="text-sm">{formatDate(enabledMember.releaseDateChangeDate)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Hush End Date</span>
                  <p className="text-sm">{formatDate(enabledMember.hushEndDate)}</p>
                </div>
              </div>
            )}

            {/* Status & Flags */}
            {renderSection(
              'Status & Flags',
              'status',
              <CheckCircle className="h-5 w-5 text-red-500" />,
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Pending Papers</span>
                  <p className="text-sm">{formatBoolean(enabledMember.pendingPapers)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Hold</span>
                  <p className="text-sm">{formatBoolean(enabledMember.hold)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Legacy</span>
                  <p className="text-sm">{formatBoolean(enabledMember.legacy)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Leader Visibility</span>
                  <p className="text-sm">{formatBoolean(enabledMember.leaderVisibility)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Address Confirm Pending</span>
                  <p className="text-sm">{formatBoolean(enabledMember.addressConfirmPending)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Image Processed</span>
                  <p className="text-sm">{formatBoolean(enabledMember.imageProcessed)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Call Packet Immunization</span>
                  <p className="text-sm">{formatBoolean(enabledMember.callPacketImmunization)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Call Packet Portal</span>
                  <p className="text-sm">{formatBoolean(enabledMember.callPacketPortal)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Missionary Search OTX</span>
                  <p className="text-sm">{formatBoolean(enabledMember.missionarySearchOTX)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Do Not Purge</span>
                  <p className="text-sm">{formatBoolean(enabledMember.doNotPurge)}</p>
                </div>
              </div>
            )}

            {/* Additional Information */}
            {renderSection(
              'Additional Information',
              'additional',
              <Warning className="h-5 w-5 text-gray-500" />,
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Alert</span>
                  <p className="text-sm">{enabledMember.alert || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Inindrfn</span>
                  <p className="text-sm font-mono">{enabledMember.inindrfn || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Spouse Inindrfn</span>
                  <p className="text-sm font-mono">{enabledMember.spouseInindrfn || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Enabled By Role ID</span>
                  <p className="text-sm">{enabledMember.enabledByRoleId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Recommend Form Type ID</span>
                  <p className="text-sm">{enabledMember.recommendFormTypeId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Missionary Auth PIN</span>
                  <p className="text-sm">{enabledMember.missionaryAuthPin || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Call Notification ID</span>
                  <p className="text-sm">{enabledMember.callNotificationId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">OTX Sync Col</span>
                  <p className="text-sm font-mono">{enabledMember.otxSyncCol || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Initiated Version</span>
                  <p className="text-sm">{enabledMember.initiatedVersion || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Pending Translation State</span>
                  <p className="text-sm">{enabledMember.pendingTranslationState || 'N/A'}</p>
                </div>
              </div>
            )}

            {/* Audit Information */}
            {renderSection(
              'Audit Information',
              'audit',
              <AccessTime className="h-5 w-5 text-gray-500" />,
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Created By</span>
                  <p className="text-sm">{enabledMember.createdBy || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Date Created</span>
                  <p className="text-sm">{formatDate(enabledMember.dateCreated)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Modified By</span>
                  <p className="text-sm">{enabledMember.modifiedBy || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Date Modified</span>
                  <p className="text-sm">{formatDate(enabledMember.dateModified)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
