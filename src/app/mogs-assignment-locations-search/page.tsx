'use client';

import { useState, useEffect, useRef } from 'react';
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

// Missionary Type Enum from schema
type MissionaryTypeEnum = 'ELDER' | 'SISTER' | 'SR_SISTER' | 'SR_COUPLE' | 'SR_ELDER' | 'PT_ELDER' | 'PT_SISTER' | 'PT_COUPLE';

interface SearchHistory {
  id: string;
  nameSearch: string;
  missionaryTypes: MissionaryTypeEnum[];
  timestamp: Date;
  resultCount: number;
}

export default function MOGSAssignmentLocationsWithComponentsPage() {
  const [nameSearch, setNameSearch] = useState('');
  const [selectedMissionaryTypes, setSelectedMissionaryTypes] = useState<MissionaryTypeEnum[]>(['ELDER', 'SISTER']);
  const [assignmentLocations, setAssignmentLocations] = useState<AssignmentLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState('mogs-gql-dev');
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(-1);
  
  // Refs for type-ahead functionality
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Available missionary types
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

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mogs-assignment-locations-components-search-history');
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

  // Debounced search effect
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (nameSearch.trim().length >= 2) {
      setIsTyping(true);
      debounceRef.current = setTimeout(() => {
        searchAssignmentLocations();
        setIsTyping(false);
      }, 500);
    } else {
      setAssignmentLocations([]);
      setShowSuggestions(false);
      setIsTyping(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [nameSearch, selectedMissionaryTypes]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions || assignmentLocations.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedLocationIndex(prev => 
            prev < assignmentLocations.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedLocationIndex(prev => 
            prev > 0 ? prev - 1 : assignmentLocations.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedLocationIndex >= 0) {
            selectLocation(assignmentLocations[selectedLocationIndex]);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          setSelectedLocationIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSuggestions, assignmentLocations, selectedLocationIndex]);

  const saveSearchHistory = (search: string, types: MissionaryTypeEnum[], resultCount: number) => {
    const newEntry: SearchHistory = {
      id: Date.now().toString(),
      nameSearch: search,
      missionaryTypes: types,
      timestamp: new Date(),
      resultCount
    };
    
    const updatedHistory = [newEntry, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
    setSearchHistory(updatedHistory);
    localStorage.setItem('mogs-assignment-locations-components-search-history', JSON.stringify(updatedHistory));
  };

  const searchAssignmentLocations = async () => {
    if (!apiClient) {
      setError('API client not initialized. Please refresh the page.');
      return;
    }

    if (!nameSearch.trim() || nameSearch.trim().length < 2) {
      setAssignmentLocations([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    setError(null);

    const query = `
      query GetAssignmentLocationsWithComponents($nameSearch: String, $missionaryTypes: [MissionaryTypeEnum]) {
        assignmentLocationsWithComponents(nameSearch: $nameSearch, missionaryTypes: $missionaryTypes) {
          id
          name
          assignmentMeetingName
          effectiveDate
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
          bikeCost
          timeDiffMST
          transferDay
          parent {
            id
            name
            assignmentMeetingName
          }
          components(missionaryTypes: $missionaryTypes, statuses: [ACTIVE]) {
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
        }
      }
    `;

    try {
      const variables = { 
        nameSearch: nameSearch.trim(),
        missionaryTypes: selectedMissionaryTypes
      };
      const result = await apiClient.executeGraphQLQuery(query, variables);
      
      const data = result.data as { assignmentLocationsWithComponents: AssignmentLocation[] };
      const locations = data.assignmentLocationsWithComponents || [];
      
      setAssignmentLocations(locations);
      setShowSuggestions(locations.length > 0);
      setSelectedLocationIndex(-1);
      
      // Save search history only for meaningful searches
      if (nameSearch.trim().length >= 3) {
        saveSearchHistory(nameSearch.trim(), selectedMissionaryTypes, locations.length);
      }
      
    } catch (err) {
      console.error('Error fetching assignment locations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assignment locations');
      setAssignmentLocations([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = (location: AssignmentLocation) => {
    setNameSearch(location.name || location.assignmentMeetingName || `Location ${location.id}`);
    setShowSuggestions(false);
    setSelectedLocationIndex(-1);
    // You could navigate to the location detail page here if desired
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

  const handleLoadFromHistory = (historyEntry: SearchHistory) => {
    setNameSearch(historyEntry.nameSearch);
    setSelectedMissionaryTypes(historyEntry.missionaryTypes);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('mogs-assignment-locations-components-search-history');
  };

  const clearSearch = () => {
    setNameSearch('');
    setAssignmentLocations([]);
    setError(null);
    setShowSuggestions(false);
    setSelectedLocationIndex(-1);
  };

  const exportToJson = () => {
    if (assignmentLocations.length === 0) return;
    
    const dataStr = JSON.stringify(assignmentLocations, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assignment-locations-search-${nameSearch.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
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

  const getComponentsMatchingTypes = (location: AssignmentLocation) => {
    if (!location.components) return [];
    return location.components.filter(comp => 
      selectedMissionaryTypes.some(type => 
        comp.missionaryType?.missionaryTypeCode === type || 
        comp.missionaryType?.abbreviation === type.replace('_', ' ')
      )
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🔍</span>
        <h1 className="text-2xl font-bold">MOGS Assignment Locations Search</h1>
        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Type-ahead Search</span>
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

      {/* Missionary Type Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">👥 Missionary Types Filter</h2>
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
          Selected: {selectedMissionaryTypes.length === 0 ? 'None' : selectedMissionaryTypes.join(', ')}
        </div>
      </div>

      {/* Type-ahead Search Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 relative">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Type-ahead Search</h2>
        <div className="relative">
          <div className="flex gap-4 items-end">
            <div className="flex-1 relative">
              <label htmlFor="name-search" className="block text-sm font-medium text-gray-700 mb-1">
                Assignment Location Name
              </label>
              <input
                ref={searchInputRef}
                id="name-search"
                type="text"
                placeholder="Start typing to search assignment locations..."
                value={nameSearch}
                onChange={(e) => {
                  setNameSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => assignmentLocations.length > 0 && setShowSuggestions(true)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {(loading || isTyping) && (
                <div className="absolute right-3 top-8 text-gray-400">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
            <button
              onClick={clearSearch}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear
            </button>
          </div>

          {/* Type-ahead Suggestions */}
          {showSuggestions && assignmentLocations.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto"
            >
              {assignmentLocations.map((location, index) => {
                const matchingComponents = getComponentsMatchingTypes(location);
                return (
                  <div
                    key={location.id}
                    className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 ${
                      index === selectedLocationIndex ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => selectLocation(location)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {location.name || location.assignmentMeetingName || `Location ${location.id}`}
                        </div>
                        {location.colOrganization && (
                          <div className="text-sm text-gray-600">
                            {location.colOrganization.name || location.colOrganization.officialName}
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>ID: {location.id}</span>
                          {location.complement && <span>Complement: {location.complement}</span>}
                          {location.effectiveDate && <span>Effective: {formatDate(location.effectiveDate)}</span>}
                        </div>
                        {matchingComponents.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs font-medium text-gray-700 mb-1">
                              Matching Components ({matchingComponents.length}):
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {matchingComponents.slice(0, 3).map((comp) => (
                                <span
                                  key={comp.id}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                >
                                  {comp.missionaryType?.abbreviation || comp.missionaryType?.missionaryTypeCode} - {comp.position?.name || 'Unknown Position'}
                                </span>
                              ))}
                              {matchingComponents.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                  +{matchingComponents.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-1">
                        {location.status && (
                          <span className={`px-2 py-1 text-xs rounded ${
                            location.status.label === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {location.status.label}
                          </span>
                        )}
                        {location.type && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {location.type.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {assignmentLocations.length > 0 && (
                <div className="p-3 bg-gray-50 border-t text-center">
                  <div className="text-sm text-gray-600">
                    Found {assignmentLocations.length} location{assignmentLocations.length !== 1 ? 's' : ''}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Use arrow keys to navigate, Enter to select, Esc to close
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {nameSearch.trim().length > 0 && nameSearch.trim().length < 2 && (
          <div className="mt-2 text-sm text-gray-500">
            Type at least 2 characters to start searching...
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Results Summary */}
      {!loading && assignmentLocations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Search Results ({assignmentLocations.length})
            </h2>
            <button
              onClick={exportToJson}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
            >
              📥 Export JSON
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignmentLocations.map((location) => {
              const matchingComponents = getComponentsMatchingTypes(location);
              return (
                <div key={location.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm">
                      {location.name || location.assignmentMeetingName || `Location ${location.id}`}
                    </h3>
                    <div className="flex gap-1">
                      {location.status && (
                        <span className={`px-1 py-0.5 text-xs rounded ${
                          location.status.label === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {location.status.label}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {location.colOrganization && (
                    <div className="text-xs text-gray-600 mb-2">
                      {location.colOrganization.name || location.colOrganization.officialName}
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mb-3">
                    ID: {location.id} | Complement: {location.complement || 'N/A'}
                  </div>

                  {matchingComponents.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        Components ({matchingComponents.length}):
                      </div>
                      <div className="space-y-1">
                        {matchingComponents.slice(0, 2).map((comp) => (
                          <div key={comp.id} className="text-xs p-2 bg-blue-50 rounded">
                            <div className="font-medium text-blue-900">
                              {comp.missionaryType?.abbreviation || comp.missionaryType?.missionaryTypeCode}
                            </div>
                            <div className="text-blue-700">
                              {comp.position?.name || 'Unknown Position'} ({comp.complement || 0})
                            </div>
                          </div>
                        ))}
                        {matchingComponents.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{matchingComponents.length - 2} more components
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
              <div 
                key={entry.id} 
                className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50" 
                onClick={() => handleLoadFromHistory(entry)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">"{entry.nameSearch}"</div>
                    <div className="text-sm text-gray-600">
                      Types: {entry.missionaryTypes.join(', ')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {entry.timestamp.toLocaleDateString()} at {entry.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {entry.resultCount} results
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 How to Use This Search</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Select the missionary types you want to filter by (e.g., Elder, Sister, Senior Couple)</li>
          <li>• Start typing in the search box - results appear as you type (minimum 2 characters)</li>
          <li>• Use arrow keys to navigate suggestions, Enter to select, Esc to close</li>
          <li>• Only locations with active components matching your selected missionary types will appear</li>
          <li>• Click on any suggestion to select it or any result card to view details</li>
        </ul>
      </div>

      {!loading && assignmentLocations.length === 0 && nameSearch.trim().length >= 2 && !error && (
        <div className="text-center py-8 text-gray-500">
          No assignment locations found matching "{nameSearch}" with the selected missionary types.
        </div>
      )}
    </div>
  );
}
