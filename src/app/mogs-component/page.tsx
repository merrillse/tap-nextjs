'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

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

interface AssignmentLocation {
  id: string;
  name?: string;
  assignmentMeetingName?: string;
  type?: LabelValue;
  status?: LabelValue;
  colOrganization?: MMSOrganization;
  complement?: number;
  maxTransfer?: number;
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

interface LabelValue {
  value: number;
  label: string;
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

interface MMSOrganization {
  id: string;
  organizationId?: number;
  name?: string;
  officialName?: string;
  shortName?: string;
  officialShortName?: string;
}

// Enums from schema
type MissionaryTypeEnum = 'ELDER' | 'SISTER' | 'SR_SISTER' | 'SR_COUPLE' | 'SR_ELDER' | 'PT_ELDER' | 'PT_SISTER' | 'PT_COUPLE';
type ComponentStatusEnum = 'ACTIVE' | 'PENDING_ACTIVATION' | 'DEACTIVATED' | 'PENDING_DEACTIVATION';

interface SearchHistory {
  id: string;
  componentId: string;
  timestamp: Date;
  resultFound: boolean;
  componentDescription?: string;
  missionaryTypes?: MissionaryTypeEnum[];
  statuses?: ComponentStatusEnum[];
}

export default function MOGSComponentPage() {
  const [componentId, setComponentId] = useState('');
  const [selectedMissionaryTypes, setSelectedMissionaryTypes] = useState<MissionaryTypeEnum[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<ComponentStatusEnum[]>(['ACTIVE']);
  const [component, setComponent] = useState<Component | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState('mogs-gql-dev');
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [useFilters, setUseFilters] = useState(false);

  // Available options
  const missionaryTypeOptions: { value: MissionaryTypeEnum; label: string; description: string }[] = [
    { value: 'ELDER', label: 'Elder', description: 'Full-time male missionary' },
    { value: 'SISTER', label: 'Sister', description: 'Full-time female missionary' },
    { value: 'SR_ELDER', label: 'Senior Elder', description: 'Senior male missionary' },
    { value: 'SR_SISTER', label: 'Senior Sister', description: 'Senior female missionary' },
    { value: 'SR_COUPLE', label: 'Senior Couple', description: 'Senior missionary couple' },
    { value: 'PT_ELDER', label: 'Part-time Elder', description: 'Part-time male missionary' },
    { value: 'PT_SISTER', label: 'Part-time Sister', description: 'Part-time female missionary' },
    { value: 'PT_COUPLE', label: 'Part-time Couple', description: 'Part-time missionary couple' },
  ];

  const statusOptions: { value: ComponentStatusEnum; label: string; description: string }[] = [
    { value: 'ACTIVE', label: 'Active', description: 'Currently active component' },
    { value: 'PENDING_ACTIVATION', label: 'Pending Activation', description: 'Awaiting activation' },
    { value: 'DEACTIVATED', label: 'Deactivated', description: 'Currently deactivated' },
    { value: 'PENDING_DEACTIVATION', label: 'Pending Deactivation', description: 'Awaiting deactivation' },
  ];

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mogs-component-search-history');
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

  const saveSearchHistory = (compId: string, found: boolean, description?: string) => {
    const newEntry: SearchHistory = {
      id: Date.now().toString(),
      componentId: compId,
      timestamp: new Date(),
      resultFound: found,
      componentDescription: description,
      missionaryTypes: useFilters ? selectedMissionaryTypes : undefined,
      statuses: useFilters ? selectedStatuses : undefined
    };
    
    const updatedHistory = [newEntry, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
    setSearchHistory(updatedHistory);
    localStorage.setItem('mogs-component-search-history', JSON.stringify(updatedHistory));
  };

  const searchComponent = async () => {
    if (!apiClient) {
      setError('API client not initialized. Please refresh the page.');
      return;
    }

    if (!componentId.trim()) {
      setError('Please enter a Component ID');
      return;
    }

    setLoading(true);
    setError(null);
    setComponent(null);

    const query = `
      query GetComponent($id: ID!, $missionaryTypes: [MissionaryTypeEnum], $statuses: [ComponentStatusEnum]) {
        component(id: $id, missionaryTypes: $missionaryTypes, statuses: $statuses) {
          id
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
          department {
            id
            name
            activationDate
            colOrganization {
              id
              organizationId
              name
              officialName
              shortName
              officialShortName
            }
          }
          assignmentLocation {
            id
            name
            assignmentMeetingName
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
              name
              officialName
              shortName
            }
            complement
            maxTransfer
          }
          priority {
            id
            sortOrder
            description
            active
          }
          position {
            id
            positionSpecialty {
              id
              name
              description
            }
            name
            description
          }
          complement
          replacement
          origin {
            id
            name
            description
            code
            defaultSet
            createDate
          }
          status {
            value
            label
          }
          facilityOverTransfer
          plannedTransferNumber
          noTrainingAvailable
          language {
            id
            languageGroupId
            lastUpdateDate
            recentryLanguage
            metadataTranslated
            seniorSiteLanguageStatus
            napiLanguageStatus
          }
          description
          assignmentLocationDefault
          assignmentMeetingName
          createdBy
          dateCreated
          modifiedBy
          dateModified
          spouseCallPhrase
          responsibleOrgNumber
          firstMonthExpense
          subMissionType
          subCode
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
          needsDisplayRange
          subMissionName
          spousePosition {
            id
            name
            description
          }
          notes
          filterSet
          housingExpense
          transportationExpense
          personalExpense
          sweep
          assignmentMeetingShortName
          sixMonthCompatible
          notesModifiedBy
          notesModifiedDate
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
          defaultTransferLocation {
            id
            iso3Code
            name
            shortName
            abbreviation
            smsIso3Code
          }
          urgentComplementNumber
          urgentComplementEndDate
          growthDirection
          displayInSeniorMissionaryWebsite
          languageImportanceId
          shortTerm
        }
      }
    `;

    try {
      const variables: any = { id: componentId };
      
      if (useFilters) {
        if (selectedMissionaryTypes.length > 0) {
          variables.missionaryTypes = selectedMissionaryTypes;
        }
        if (selectedStatuses.length > 0) {
          variables.statuses = selectedStatuses;
        }
      }

      const result = await apiClient.executeGraphQLQuery(query, variables);
      
      const data = result.data as { component: Component | null };
      setComponent(data.component);
      
      const description = data.component?.description || data.component?.assignmentMeetingName || 'Component';
      saveSearchHistory(componentId, !!data.component, description);
      
      if (!data.component) {
        setError(`No component found with ID: ${componentId}`);
      }
      
    } catch (err) {
      console.error('Error fetching component:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch component');
      saveSearchHistory(componentId, false);
    } finally {
      setLoading(false);
    }
  };

  const handleMissionaryTypeToggle = (type: MissionaryTypeEnum) => {
    setSelectedMissionaryTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleStatusToggle = (status: ComponentStatusEnum) => {
    setSelectedStatuses(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const handleLoadFromHistory = (historyEntry: SearchHistory) => {
    setComponentId(historyEntry.componentId);
    if (historyEntry.missionaryTypes) {
      setSelectedMissionaryTypes(historyEntry.missionaryTypes);
      setUseFilters(true);
    }
    if (historyEntry.statuses) {
      setSelectedStatuses(historyEntry.statuses);
      setUseFilters(true);
    }
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('mogs-component-search-history');
  };

  const clearSearch = () => {
    setComponentId('');
    setComponent(null);
    setError(null);
  };

  const exportToJson = () => {
    if (!component) return;
    
    const dataStr = JSON.stringify(component, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `component-${component.id}.json`;
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

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🧩</span>
        <h1 className="text-2xl font-bold">MOGS Component</h1>
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

      {/* Filter Toggle */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useFilters}
              onChange={(e) => setUseFilters(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Use optional filters</span>
          </label>
          <span className="text-xs text-gray-500">Enable to filter by missionary types and statuses</span>
        </div>
      </div>

      {/* Optional Filters */}
      {useFilters && (
        <>
          {/* Missionary Type Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">👥 Missionary Types Filter (Optional)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {missionaryTypeOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMissionaryTypes.includes(option.value)}
                    onChange={() => handleMissionaryTypeToggle(option.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-3 text-sm text-gray-600">
              Selected: {selectedMissionaryTypes.length === 0 ? 'None (all types)' : selectedMissionaryTypes.join(', ')}
            </div>
          </div>

          {/* Status Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Component Status Filter (Optional)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {statusOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(option.value)}
                    onChange={() => handleStatusToggle(option.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-3 text-sm text-gray-600">
              Selected: {selectedStatuses.length === 0 ? 'None (all statuses)' : selectedStatuses.join(', ')}
            </div>
          </div>
        </>
      )}

      {/* Search Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Search Component by ID</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="component-id" className="block text-sm font-medium text-gray-700 mb-1">Component ID (Required)</label>
            <input
              id="component-id"
              type="text"
              placeholder="Enter component ID"
              value={componentId}
              onChange={(e) => setComponentId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchComponent()}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={searchComponent}
            disabled={loading || !componentId.trim() || !apiClient}
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

      {/* Component Details */}
      {component && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Component Details</h2>
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
                      <span className="text-gray-600">Component ID:</span>
                      <span className="font-mono">{component.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Description:</span>
                      <span>{component.description || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Complement:</span>
                      <span>{component.complement || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Meeting Name:</span>
                      <span>{component.assignmentMeetingName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Meeting Short Name:</span>
                      <span>{component.assignmentMeetingShortName || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {component.status && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Label:</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          component.status.label === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                          component.status.label === 'PENDING_ACTIVATION' ? 'bg-yellow-100 text-yellow-800' :
                          component.status.label === 'DEACTIVATED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {component.status.label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Value:</span>
                        <span>{component.status.value}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {component.missionaryType && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Missionary Type</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {component.missionaryType.missionaryTypeName || component.missionaryType.abbreviation}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Code:</span>
                        <span>{component.missionaryType.missionaryTypeCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Group:</span>
                        <span>{component.missionaryType.missionaryTypeGroup || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Senior:</span>
                        <span>{component.missionaryType.senior ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Min Age:</span>
                        <span>{component.missionaryType.minimumAgeDefault || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Age:</span>
                        <span>{component.missionaryType.maximumAgeDefault || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {component.priority && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Priority</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Description:</span>
                        <span>{component.priority.description}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sort Order:</span>
                        <span>{component.priority.sortOrder}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active:</span>
                        <span>{component.priority.active ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Positions */}
            {(component.position || component.spousePosition) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Positions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {component.position && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Primary Position</h4>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">Name: {component.position.name}</div>
                        {component.position.description && (
                          <div className="text-sm text-gray-600">Description: {component.position.description}</div>
                        )}
                        {component.position.positionSpecialty && (
                          <div className="text-sm text-gray-600">
                            Specialty: {component.position.positionSpecialty.name}
                            {component.position.positionSpecialty.description && 
                              ` - ${component.position.positionSpecialty.description}`
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {component.spousePosition && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Spouse Position</h4>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">Name: {component.spousePosition.name}</div>
                        {component.spousePosition.description && (
                          <div className="text-sm text-gray-600">Description: {component.spousePosition.description}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Assignment Location */}
            {component.assignmentLocation && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Assignment Location</h3>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">ID: {component.assignmentLocation.id}</div>
                      <div className="text-sm text-gray-600">Name: {component.assignmentLocation.name || 'N/A'}</div>
                      <div className="text-sm text-gray-600">Meeting: {component.assignmentLocation.assignmentMeetingName || 'N/A'}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">Complement: {component.assignmentLocation.complement || 'N/A'}</div>
                      <div className="text-sm text-gray-600">Max Transfer: {component.assignmentLocation.maxTransfer || 'N/A'}</div>
                      {component.assignmentLocation.status && (
                        <div className="text-sm text-gray-600">
                          Status: <span className="px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                            {component.assignmentLocation.status.label}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {component.assignmentLocation.colOrganization && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="text-sm font-medium text-gray-700">Organization:</div>
                      <div className="text-sm text-gray-600">{component.assignmentLocation.colOrganization.name || component.assignmentLocation.colOrganization.officialName}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Department */}
            {component.department && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Department</h3>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">ID: {component.department.id}</div>
                    <div className="text-sm text-gray-600">Name: {component.department.name}</div>
                    <div className="text-sm text-gray-600">Activation Date: {formatDate(component.department.activationDate)}</div>
                  </div>
                  {component.department.colOrganization && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <div className="text-sm font-medium text-gray-700">Organization:</div>
                      <div className="text-sm text-gray-600">{component.department.colOrganization.name || component.department.colOrganization.officialName}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Resources & Logistics */}
            {(component.transportation || component.housing || component.availableMedicalCare) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Resources & Logistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {component.transportation && (
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Transportation</h4>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">Description: {component.transportation.description}</div>
                        <div className="text-sm text-gray-600">Sort Order: {component.transportation.sortOrder}</div>
                        <div className="text-sm text-gray-600">Active: {component.transportation.active ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                  )}
                  {component.housing && (
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Housing</h4>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">Description: {component.housing.description}</div>
                        <div className="text-sm text-gray-600">Sort Order: {component.housing.sortOrder}</div>
                        <div className="text-sm text-gray-600">Active: {component.housing.active ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                  )}
                  {component.availableMedicalCare && (
                    <div className="p-4 bg-red-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Medical Care</h4>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">Name: {component.availableMedicalCare.name}</div>
                        <div className="text-sm text-gray-600">Short Name: {component.availableMedicalCare.shortName}</div>
                        <div className="text-sm text-gray-600">Code: {component.availableMedicalCare.code}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Complement Numbers */}
            {(component.topComplementNumber || component.highComplementNumber || component.mediumComplementNumber || component.lowComplementNumber || component.urgentComplementNumber) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Complement Numbers</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {component.topComplementNumber && (
                    <div className="text-center p-3 bg-green-100 rounded-lg">
                      <div className="text-lg font-bold text-green-800">{component.topComplementNumber}</div>
                      <div className="text-sm text-green-600">Top</div>
                    </div>
                  )}
                  {component.highComplementNumber && (
                    <div className="text-center p-3 bg-blue-100 rounded-lg">
                      <div className="text-lg font-bold text-blue-800">{component.highComplementNumber}</div>
                      <div className="text-sm text-blue-600">High</div>
                    </div>
                  )}
                  {component.mediumComplementNumber && (
                    <div className="text-center p-3 bg-yellow-100 rounded-lg">
                      <div className="text-lg font-bold text-yellow-800">{component.mediumComplementNumber}</div>
                      <div className="text-sm text-yellow-600">Medium</div>
                    </div>
                  )}
                  {component.lowComplementNumber && (
                    <div className="text-center p-3 bg-orange-100 rounded-lg">
                      <div className="text-lg font-bold text-orange-800">{component.lowComplementNumber}</div>
                      <div className="text-sm text-orange-600">Low</div>
                    </div>
                  )}
                  {component.urgentComplementNumber && (
                    <div className="text-center p-3 bg-red-100 rounded-lg">
                      <div className="text-lg font-bold text-red-800">{component.urgentComplementNumber}</div>
                      <div className="text-sm text-red-600">Urgent</div>
                      {component.urgentComplementEndDate && (
                        <div className="text-xs text-red-500 mt-1">Until: {formatDate(component.urgentComplementEndDate)}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Expenses */}
            {(component.firstMonthExpense || component.housingExpense || component.transportationExpense || component.personalExpense) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Expenses</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {component.firstMonthExpense && (
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="font-bold text-gray-800">{formatCurrency(component.firstMonthExpense)}</div>
                      <div className="text-sm text-gray-600">First Month</div>
                    </div>
                  )}
                  {component.housingExpense && (
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="font-bold text-gray-800">{formatCurrency(component.housingExpense)}</div>
                      <div className="text-sm text-gray-600">Housing</div>
                    </div>
                  )}
                  {component.transportationExpense && (
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="font-bold text-gray-800">{formatCurrency(component.transportationExpense)}</div>
                      <div className="text-sm text-gray-600">Transportation</div>
                    </div>
                  )}
                  {component.personalExpense && (
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="font-bold text-gray-800">{formatCurrency(component.personalExpense)}</div>
                      <div className="text-sm text-gray-600">Personal</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Flags and Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Flags & Settings</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${component.replacement ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Replacement</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${component.facilityOverTransfer ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Facility Over Transfer</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${component.noTrainingAvailable ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">No Training Available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${component.assignmentLocationDefault ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Assignment Location Default</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${component.sweep ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Sweep</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${component.sixMonthCompatible ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Six Month Compatible</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${component.shortTerm ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Short Term</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${component.displayInSeniorMissionaryWebsite ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">Display in Senior Website</span>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Planned Transfer Number:</span>
                    <span>{component.plannedTransferNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Responsible Org Number:</span>
                    <span>{component.responsibleOrgNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sub Mission Type:</span>
                    <span>{component.subMissionType || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sub Code:</span>
                    <span>{component.subCode || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sub Mission Name:</span>
                    <span>{component.subMissionName || 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Needs Display Range:</span>
                    <span>{component.needsDisplayRange || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Filter Set:</span>
                    <span>{component.filterSet || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Growth Direction:</span>
                    <span>{component.growthDirection || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Language Importance ID:</span>
                    <span>{component.languageImportanceId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Spouse Call Phrase:</span>
                    <span>{component.spouseCallPhrase || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {component.notes && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">{component.notes}</div>
                  {(component.notesModifiedBy || component.notesModifiedDate) && (
                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                      Modified by: {component.notesModifiedBy || 'Unknown'} on {formatDateTime(component.notesModifiedDate)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Administrative Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Administrative</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created By:</span>
                    <span>{component.createdBy || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date Created:</span>
                    <span>{formatDateTime(component.dateCreated)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Modified By:</span>
                    <span>{component.modifiedBy || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date Modified:</span>
                    <span>{formatDateTime(component.dateModified)}</span>
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
                    <div className="font-medium">Component ID: {entry.componentId}</div>
                    {entry.componentDescription && (
                      <div className="text-sm text-gray-600">{entry.componentDescription}</div>
                    )}
                    {entry.missionaryTypes && entry.missionaryTypes.length > 0 && (
                      <div className="text-sm text-gray-600">Types: {entry.missionaryTypes.join(', ')}</div>
                    )}
                    {entry.statuses && entry.statuses.length > 0 && (
                      <div className="text-sm text-gray-600">Statuses: {entry.statuses.join(', ')}</div>
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

      {!loading && !component && !error && (
        <div className="text-center py-8 text-gray-500">
          Enter a Component ID to search for component details.
        </div>
      )}
    </div>
  );
}
