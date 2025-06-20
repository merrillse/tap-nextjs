'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

interface AssignmentLocation {
  id: string;
  ecclesiasticAssignmentLocation?: AssignmentLocation;
  effectiveDate?: string;
  componentOvertolerancePercentage?: number;
  type?: LabelValue;
  status?: LabelValue;
  colOrganization?: MMSOrganization;
  faxRecommends?: boolean;
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
  parent?: AssignmentLocation;
  legacyId?: number;
  pendingMapEffectiveDate?: string;
  nameExportDate?: string;
  name?: string;
  assignmentMeetingName?: string;
  components?: Component[];
  curricula?: LabelValue[];
  missionaryHistories?: MissionaryHistory[];
}

interface LabelValue {
  value: number;
  label: string;
}

interface MMSOrganization {
  id: string;
  organizationId?: number;
  name?: string;
  officialName?: string;
  shortName?: string;
  officialShortName?: string;
}

interface Component {
  id: string;
  missionaryType?: MissionaryType;
  department?: Department;
  assignmentLocation?: AssignmentLocation;
  priority?: ComponentPriority;
  position?: PositionNameTranslation;
  complement?: number;
  replacement?: boolean;
  origin?: CitizenshipSet;
  status?: LabelValue;
  facilityOverTransfer?: boolean;
  plannedTransferNumber?: number;
  noTrainingAvailable?: boolean;
  language?: LanguageAddendum;
  description?: string;
  assignmentLocationDefault?: boolean;
  assignmentMeetingName?: string;
  createdBy?: string;
  dateCreated?: string;
  modifiedBy?: string;
  dateModified?: string;
  spouseCallPhrase?: string;
  responsibleOrgNumber?: number;
  firstMonthExpense?: number;
  subMissionType?: number;
  subCode?: string;
  transportation?: ComponentTransportation;
  housing?: ComponentHousing;
  needsDisplayRange?: number;
  subMissionName?: string;
  spousePosition?: PositionNameTranslation;
  notes?: string;
  filterSet?: string;
  housingExpense?: number;
  transportationExpense?: number;
  personalExpense?: number;
  sweep?: boolean;
  assignmentMeetingShortName?: string;
  sixMonthCompatible?: boolean;
  notesModifiedBy?: string;
  notesModifiedDate?: string;
  availableMedicalCare?: MedicalCare;
  topComplementNumber?: number;
  highComplementNumber?: number;
  mediumComplementNumber?: number;
  lowComplementNumber?: number;
  defaultTransferLocation?: MMSLocation;
  urgentComplementNumber?: number;
  urgentComplementEndDate?: string;
  growthDirection?: string;
  displayInSeniorMissionaryWebsite?: boolean;
  languageImportanceId?: number;
  shortTerm?: boolean;
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

interface Department {
  id: string;
  name?: string;
  activationDate?: string;
  colOrganization?: MMSOrganization;
}

interface ComponentPriority {
  id: string;
  sortOrder?: number;
  description?: string;
  active?: boolean;
}

interface PositionNameTranslation {
  id: string;
  positionSpecialty?: PositionSpecialty;
  name?: string;
  description?: string;
}

interface PositionSpecialty {
  id: string;
  name?: string;
  description?: string;
}

interface CitizenshipSet {
  id: string;
  name?: string;
  description?: string;
  code?: string;
  defaultSet?: boolean;
  createDate?: string;
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

interface ComponentTransportation {
  id: string;
  sortOrder?: number;
  description?: string;
  active?: boolean;
}

interface ComponentHousing {
  id: string;
  sortOrder?: number;
  description?: string;
  active?: boolean;
}

interface MedicalCare {
  id: string;
  code?: string;
  name?: string;
  shortName?: string;
}

interface MMSLocation {
  id: string;
  iso3Code?: string;
  name?: string;
  shortName?: string;
  abbreviation?: string;
  smsIso3Code?: string;
}

interface MissionaryHistory {
  legacyMissId?: number;
  assignmentLocationId?: number;
  assignmentLocationName?: string;
  assignmentLocation?: AssignmentLocation;
  effectiveDate?: string;
  effectiveEndDate?: string;
  proselytingAreaId?: number;
  wsProselytingArea?: WSProselytingArea;
  areaName?: string;
  areaDate?: string;
  areaEndDate?: string;
  roleId?: number;
  roleType?: string;
  roleDate?: string;
  roleEndDate?: string;
  companions?: Companion[];
  companionshipDate?: string;
  companionshipEndDate?: string;
  unitNumber?: number;
}

interface WSProselytingArea {
  id?: string;
  name?: string;
}

interface Companion {
  name?: string;
  legacyMissId?: number;
}

interface SearchHistory {
  id: string;
  assignmentLocationId: string;
  timestamp: Date;
  resultFound: boolean;
  assignmentLocationName?: string;
}

export default function MOGSAssignmentLocationPage() {
  const [assignmentLocationId, setAssignmentLocationId] = useState('');
  const [assignmentLocation, setAssignmentLocation] = useState<AssignmentLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState('mogs-gql-dev');
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mogs-assignment-location-search-history');
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

  const saveSearchHistory = (locationId: string, found: boolean, locationName?: string) => {
    const newEntry: SearchHistory = {
      id: Date.now().toString(),
      assignmentLocationId: locationId,
      timestamp: new Date(),
      resultFound: found,
      assignmentLocationName: locationName
    };
    
    const updatedHistory = [newEntry, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
    setSearchHistory(updatedHistory);
    localStorage.setItem('mogs-assignment-location-search-history', JSON.stringify(updatedHistory));
  };

  const searchAssignmentLocation = async () => {
    if (!apiClient) {
      setError('API client not initialized. Please refresh the page.');
      return;
    }

    if (!assignmentLocationId.trim()) {
      setError('Please enter an Assignment Location ID');
      return;
    }

    setLoading(true);
    setError(null);
    setAssignmentLocation(null);

    const query = `
      query GetAssignmentLocation($id: ID!) {
        assignmentLocation(id: $id) {
          id
          ecclesiasticAssignmentLocation {
            id
            name
            assignmentMeetingName
          }
          effectiveDate
          componentOvertolerancePercentage
          type {
            value
            label
          }
          status {
            value
            label
          }
          colOrganization {
            id
            organizationId
            name
            officialName
            shortName
            officialShortName
          }
          faxRecommends
          bikeCost
          complement
          maxTransfer
          returnOnLaborRating
          timeDiffMST
          createdDate
          airportCode
          closingPlannedDate
          privateFlag
          transferDay
          parent {
            id
            name
            assignmentMeetingName
          }
          legacyId
          pendingMapEffectiveDate
          nameExportDate
          name
          assignmentMeetingName
          components(missionaryTypes: [ELDER, SISTER], statuses: [ACTIVE]) {
            id
            missionaryType {
              id
              abbreviation
              missionaryTypeName
              missionaryTypeCode
            }
            department {
              id
              name
            }
            priority {
              id
              sortOrder
              description
              active
            }
            position {
              id
              name
              description
            }
            complement
            replacement
            status {
              value
              label
            }
            description
            assignmentLocationDefault
            assignmentMeetingName
            createdBy
            dateCreated
            modifiedBy
            dateModified
            language {
              id
              languageGroupId
              recentryLanguage
              metadataTranslated
            }
            transportation {
              id
              sortOrder
              description
              active
            }
            housing {
              id
              sortOrder
              description
              active
            }
            availableMedicalCare {
              id
              code
              name
              shortName
            }
            topComplementNumber
            highComplementNumber
            mediumComplementNumber
            lowComplementNumber
            urgentComplementNumber
            urgentComplementEndDate
            growthDirection
            displayInSeniorMissionaryWebsite
            shortTerm
          }
          curricula(missionaryType: ELDER) {
            value
            label
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
          }
        }
      }
    `;

    try {
      const variables = { id: assignmentLocationId };
      const result = await apiClient.executeGraphQLQuery(query, variables);
      
      const data = result.data as { assignmentLocation: AssignmentLocation | null };
      setAssignmentLocation(data.assignmentLocation);
      
      const locationName = data.assignmentLocation?.name || data.assignmentLocation?.assignmentMeetingName || 'Assignment Location';
      saveSearchHistory(assignmentLocationId, !!data.assignmentLocation, locationName);
      
      if (!data.assignmentLocation) {
        setError(`No assignment location found with ID: ${assignmentLocationId}`);
      }
      
    } catch (err) {
      console.error('Error fetching assignment location:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assignment location');
      saveSearchHistory(assignmentLocationId, false);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFromHistory = (historyEntry: SearchHistory) => {
    setAssignmentLocationId(historyEntry.assignmentLocationId);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('mogs-assignment-location-search-history');
  };

  const clearSearch = () => {
    setAssignmentLocationId('');
    setAssignmentLocation(null);
    setError(null);
  };

  const exportToJson = () => {
    if (!assignmentLocation) return;
    
    const dataStr = JSON.stringify(assignmentLocation, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assignment-location-${assignmentLocation.id}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">📍</span>
        <h1 className="text-2xl font-bold">MOGS Assignment Location</h1>
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Search Assignment Location by ID</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="assignment-location-id" className="block text-sm font-medium text-gray-700 mb-1">Assignment Location ID</label>
            <input
              id="assignment-location-id"
              type="text"
              placeholder="Enter assignment location ID"
              value={assignmentLocationId}
              onChange={(e) => setAssignmentLocationId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchAssignmentLocation()}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={searchAssignmentLocation}
            disabled={loading || !assignmentLocationId.trim() || !apiClient}
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

      {/* Assignment Location Details */}
      {assignmentLocation && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Assignment Location Details</h2>
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
                      <span className="text-gray-600">Location ID:</span>
                      <span className="font-mono">{assignmentLocation.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span>{assignmentLocation.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Meeting Name:</span>
                      <span>{assignmentLocation.assignmentMeetingName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Effective Date:</span>
                      <span>{formatDate(assignmentLocation.effectiveDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created Date:</span>
                      <span>{formatDateTime(assignmentLocation.createdDate)}</span>
                    </div>
                  </div>
                </div>

                {assignmentLocation.type && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Type</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Label:</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{assignmentLocation.type.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Value:</span>
                        <span>{assignmentLocation.type.value}</span>
                      </div>
                    </div>
                  </div>
                )}

                {assignmentLocation.status && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Label:</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">{assignmentLocation.status.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Value:</span>
                        <span>{assignmentLocation.status.value}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {assignmentLocation.colOrganization && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">COL Organization</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID:</span>
                        <span className="font-mono">{assignmentLocation.colOrganization.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span>{assignmentLocation.colOrganization.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Official Name:</span>
                        <span>{assignmentLocation.colOrganization.officialName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Short Name:</span>
                        <span>{assignmentLocation.colOrganization.shortName || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Configuration</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Complement:</span>
                      <span>{assignmentLocation.complement || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Transfer:</span>
                      <span>{assignmentLocation.maxTransfer || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bike Cost:</span>
                      <span>{assignmentLocation.bikeCost ? `$${assignmentLocation.bikeCost}` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Airport Code:</span>
                      <span>{assignmentLocation.airportCode || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time Diff MST:</span>
                      <span>{assignmentLocation.timeDiffMST || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transfer Day:</span>
                      <span>{assignmentLocation.transferDay || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Flags */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Flags</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${assignmentLocation.faxRecommends ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Fax Recommends</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${assignmentLocation.privateFlag ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Private Flag</span>
                </div>
              </div>
            </div>

            {/* Parent/Ecclesiastic Assignment Location */}
            {(assignmentLocation.parent || assignmentLocation.ecclesiasticAssignmentLocation) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Relationships</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignmentLocation.parent && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Parent Location</h4>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">ID: {assignmentLocation.parent.id}</div>
                        <div className="text-sm text-gray-600">Name: {assignmentLocation.parent.name || 'N/A'}</div>
                        {assignmentLocation.parent.assignmentMeetingName && (
                          <div className="text-sm text-gray-600">Meeting: {assignmentLocation.parent.assignmentMeetingName}</div>
                        )}
                      </div>
                    </div>
                  )}
                  {assignmentLocation.ecclesiasticAssignmentLocation && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Ecclesiastic Assignment Location</h4>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">ID: {assignmentLocation.ecclesiasticAssignmentLocation.id}</div>
                        <div className="text-sm text-gray-600">Name: {assignmentLocation.ecclesiasticAssignmentLocation.name || 'N/A'}</div>
                        {assignmentLocation.ecclesiasticAssignmentLocation.assignmentMeetingName && (
                          <div className="text-sm text-gray-600">Meeting: {assignmentLocation.ecclesiasticAssignmentLocation.assignmentMeetingName}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Components */}
            {assignmentLocation.components && assignmentLocation.components.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Components ({assignmentLocation.components.length})</h3>
                <div className="space-y-4">
                  {assignmentLocation.components.map((component) => (
                    <div key={component.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Component {component.id}</h4>
                        {component.status && (
                          <span className={`px-2 py-1 text-xs rounded ${
                            component.status.label === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {component.status.label}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {component.missionaryType && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">Missionary Type</div>
                            <div className="text-sm text-gray-600">{component.missionaryType.missionaryTypeName || component.missionaryType.abbreviation}</div>
                          </div>
                        )}
                        {component.position && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">Position</div>
                            <div className="text-sm text-gray-600">{component.position.name}</div>
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-700">Complement</div>
                          <div className="text-sm text-gray-600">{component.complement || 'N/A'}</div>
                        </div>
                        {component.department && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">Department</div>
                            <div className="text-sm text-gray-600">{component.department.name}</div>
                          </div>
                        )}
                        {component.housing && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">Housing</div>
                            <div className="text-sm text-gray-600">{component.housing.description}</div>
                          </div>
                        )}
                        {component.transportation && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">Transportation</div>
                            <div className="text-sm text-gray-600">{component.transportation.description}</div>
                          </div>
                        )}
                      </div>
                      {component.description && (
                        <div className="mt-2">
                          <div className="text-sm font-medium text-gray-700">Description</div>
                          <div className="text-sm text-gray-600">{component.description}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Curricula */}
            {assignmentLocation.curricula && assignmentLocation.curricula.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Available Curricula</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {assignmentLocation.curricula.map((curriculum, index) => (
                    <div key={index} className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-center">
                      <div className="text-sm font-medium text-blue-900">{curriculum.label}</div>
                      <div className="text-xs text-blue-600">ID: {curriculum.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missionary Histories */}
            {assignmentLocation.missionaryHistories && assignmentLocation.missionaryHistories.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Missionary Histories ({assignmentLocation.missionaryHistories.length})</h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {assignmentLocation.missionaryHistories.map((history, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg text-sm">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <span className="font-medium text-gray-700">Miss ID:</span> {history.legacyMissId}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Role:</span> {history.roleType || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Start:</span> {formatDate(history.effectiveDate)}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">End:</span> {formatDate(history.effectiveEndDate)}
                        </div>
                      </div>
                      {history.areaName && (
                        <div className="mt-1 text-gray-600">Area: {history.areaName}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Administrative Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Administrative</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Legacy ID:</span>
                    <span>{assignmentLocation.legacyId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Component Overtolerance %:</span>
                    <span>{assignmentLocation.componentOvertolerancePercentage || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Return On Labor Rating:</span>
                    <span>{assignmentLocation.returnOnLaborRating || 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Closing Planned Date:</span>
                    <span>{formatDate(assignmentLocation.closingPlannedDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending Map Effective Date:</span>
                    <span>{formatDate(assignmentLocation.pendingMapEffectiveDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name Export Date:</span>
                    <span>{formatDate(assignmentLocation.nameExportDate)}</span>
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
                    <div className="font-medium">Assignment Location ID: {entry.assignmentLocationId}</div>
                    {entry.assignmentLocationName && (
                      <div className="text-sm text-gray-600">{entry.assignmentLocationName}</div>
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

      {!loading && !assignmentLocation && !error && (
        <div className="text-center py-8 text-gray-500">
          Enter an Assignment Location ID to search for assignment location details.
        </div>
      )}
    </div>
  );
}
