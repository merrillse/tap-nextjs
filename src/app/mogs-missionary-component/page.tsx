'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  ExpandMore, 
  ExpandLess, 
  Engineering, 
  CheckCircle, 
  Warning, 
  FileDownload, 
  PersonPin,
  BusinessCenter,
  Language,
  LocationOn,
  Group
} from '@mui/icons-material';
import { ApiClient } from '@/lib/api-client';
import { getEnvironmentConfigSafe, getDefaultEnvironment, getEnvironmentNames } from '@/lib/environments';

// Types based on the GraphQL schema
interface MissionaryComponent {
  /** id is component id which is comp_id */
  id?: string;
  /** Type of missionaries that can be assigned to this component */
  missionaryTypeId?: number;
  /** Description of type of missionaries that can be assigned to this component */
  missionaryType?: string;
  /** CDOL org number of the assignment location this component is part of */
  unitNumber?: number;
  /** CDOL org number of the parent assignment location number this component is part of */
  parentUnitNumber?: number;
  /** Status of the component */
  status?: string;
  /** Name of component */
  name?: string;
  /** CDSCODE Language ID of the primary language spoken in this mission */
  missionMcsLanguageId?: number;
  /** This is the ASGLOC id (deprecated: use CDOL unitNumber) */
  assignmentLocationId?: number;
  missionLanguageId?: number;
  withinMissionUnitNumber?: number;
  assignmentMeetingName?: string;
  assignmentMeetingShortName?: string;
  componentMcsLanguageId?: number;
  componentLanguageId?: number;
  positionId?: number;
  positionAbbreviation?: string;
  positionName?: string;
  positionNameLangId?: number;
  responsibleOrganizationNumber?: number;
  responsibleOrganizationName?: string;
}

interface SearchHistoryItem {
  id: string;
  timestamp: string;
  found: boolean;
}

const STORAGE_KEY = 'mogs-missionary-component-history';

const MISSIONARY_COMPONENT_QUERY = `
  query GetMissionaryComponent($id: ID) {
    missionaryComponent(id: $id) {
      id
      missionaryTypeId
      missionaryType
      unitNumber
      parentUnitNumber
      status
      name
      missionMcsLanguageId
      assignmentLocationId
      missionLanguageId
      withinMissionUnitNumber
      assignmentMeetingName
      assignmentMeetingShortName
      componentMcsLanguageId
      componentLanguageId
      positionId
      positionAbbreviation
      positionName
      positionNameLangId
      responsibleOrganizationNumber
      responsibleOrganizationName
    }
  }
`;

export default function MissionaryComponentPage() {
  const [selectedEnvironment, setSelectedEnvironment] = useState(getDefaultEnvironment('mogs'));
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [componentId, setComponentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [component, setComponent] = useState<MissionaryComponent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic', 'assignment', 'language', 'position']));

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
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setSearchHistory(history);
      } catch (error) {
        console.error('Failed to parse search history:', error);
      }
    }
  }, []);

  // Save search to history
  const saveSearchHistory = (id: string, found: boolean) => {
    const newItem: SearchHistoryItem = {
      id,
      timestamp: new Date().toISOString(),
      found
    };
    
    const updatedHistory = [newItem, ...searchHistory.filter(item => item.id !== id)].slice(0, 10);
    setSearchHistory(updatedHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  };

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(STORAGE_KEY);
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
    if (!componentId.trim()) {
      setError('Please enter a Component ID');
      return;
    }

    if (!apiClient) {
      setError('API client not initialized. Please wait a moment or try refreshing the page.');
      return;
    }

    setLoading(true);
    setError(null);
    setComponent(null);

    try {
      const variables = { id: componentId.trim() };
      const response = await apiClient.executeGraphQLQuery(MISSIONARY_COMPONENT_QUERY, variables);

      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const result = response.data as { missionaryComponent: MissionaryComponent };
      
      if (result.missionaryComponent) {
        setComponent(result.missionaryComponent);
        saveSearchHistory(componentId.trim(), true);
        
        // Scroll to results
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        setError('Missionary component not found');
        saveSearchHistory(componentId.trim(), false);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during search');
      saveSearchHistory(componentId.trim(), false);
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
    if (!component) return;

    const dataStr = JSON.stringify(component, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `missionary-component-${component.id}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const useHistoryItem = (id: string) => {
    setComponentId(id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Engineering className="text-3xl text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">MOGS Missionary Component</h1>
              <p className="text-lg text-gray-600 mt-1">
                Query missionary component details by Component ID (comp_id)
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <BusinessCenter className="text-blue-600 mt-1" />
              <div className="text-blue-800">
                <p className="font-medium mb-2">MOGS Missionary Component Query</p>
                <p className="text-sm mb-2">
                  This page queries the <code className="bg-blue-100 px-2 py-1 rounded">missionaryComponent(id: ID)</code> endpoint from MOGS.
                </p>
                <p className="text-sm">
                  <strong>Input:</strong> Component ID (comp_id)<br/>
                  <strong>Returns:</strong> Individual components of a missionary assignment with organizational details
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Environment Selection */}
              <div className="md:col-span-3">
                <label htmlFor="environment" className="block text-sm font-medium text-gray-700 mb-2">
                  Environment
                </label>
                <select
                  id="environment"
                  value={selectedEnvironment}
                  onChange={(e) => setSelectedEnvironment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {getEnvironmentNames().map(env => (
                    <option key={env.key} value={env.key}>{env.name}</option>
                  ))}
                </select>
              </div>

              {/* Search Input */}
              <div className="md:col-span-7">
                <label htmlFor="componentId" className="block text-sm font-medium text-gray-700 mb-2">
                  Component ID (comp_id)
                </label>
                <input
                  type="text"
                  id="componentId"
                  value={componentId}
                  onChange={(e) => setComponentId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter Component ID..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Search Button */}
              <div className="md:col-span-2">
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Searches</h3>
                <button
                  onClick={clearSearchHistory}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  Clear History
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.slice(0, 10).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => useHistoryItem(item.id)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
                      item.found 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {item.found ? <CheckCircle className="w-4 h-4 mr-1" /> : <Warning className="w-4 h-4 mr-1" />}
                    {item.id}
                    <span className="ml-2 text-xs opacity-70">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-start space-x-3">
              <Warning className="text-red-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">Error</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {component && (
          <div ref={resultRef} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Engineering className="text-2xl text-green-600" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Missionary Component</h2>
                    <p className="text-gray-600">Component ID: {component.id}</p>
                  </div>
                </div>
                <button
                  onClick={exportToJson}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                >
                  <FileDownload className="w-4 h-4 mr-2" />
                  Export JSON
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('basic')}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <PersonPin className="text-gray-600" />
                    <span className="text-lg font-semibold text-gray-900">Basic Information</span>
                  </div>
                  {expandedSections.has('basic') ? <ExpandLess /> : <ExpandMore />}
                </button>
                
                {expandedSections.has('basic') && (
                  <div className="p-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Component Details</h4>
                        <div className="space-y-2">
                          <p className="text-sm"><span className="font-medium">ID:</span> {component.id || 'Not specified'}</p>
                          <p className="text-sm"><span className="font-medium">Name:</span> {component.name || 'Not specified'}</p>
                          <p className="text-sm"><span className="font-medium">Status:</span> {component.status || 'Not specified'}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Missionary Type</h4>
                        <div className="space-y-2">
                          <p className="text-sm"><span className="font-medium">Type ID:</span> {component.missionaryTypeId || 'Not specified'}</p>
                          <p className="text-sm"><span className="font-medium">Type Description:</span> {component.missionaryType || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Assignment Location */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('assignment')}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <LocationOn className="text-gray-600" />
                    <span className="text-lg font-semibold text-gray-900">Assignment Location</span>
                  </div>
                  {expandedSections.has('assignment') ? <ExpandLess /> : <ExpandMore />}
                </button>
                
                {expandedSections.has('assignment') && (
                  <div className="p-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Unit Numbers</h4>
                        <div className="space-y-2">
                          <p className="text-sm"><span className="font-medium">Unit Number:</span> {component.unitNumber || 'Not specified'}</p>
                          <p className="text-sm"><span className="font-medium">Parent Unit Number:</span> {component.parentUnitNumber || 'Not specified'}</p>
                          <p className="text-sm"><span className="font-medium">Within Mission Unit:</span> {component.withinMissionUnitNumber || 'Not specified'}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Assignment Meeting</h4>
                        <div className="space-y-2">
                          <p className="text-sm"><span className="font-medium">Meeting Name:</span> {component.assignmentMeetingName || 'Not specified'}</p>
                          <p className="text-sm"><span className="font-medium">Short Name:</span> {component.assignmentMeetingShortName || 'Not specified'}</p>
                          <p className="text-sm"><span className="font-medium">Assignment Location ID:</span> {component.assignmentLocationId || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Language Information */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('language')}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <Language className="text-gray-600" />
                    <span className="text-lg font-semibold text-gray-900">Language Information</span>
                  </div>
                  {expandedSections.has('language') ? <ExpandLess /> : <ExpandMore />}
                </button>
                
                {expandedSections.has('language') && (
                  <div className="p-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Mission Languages</h4>
                        <div className="space-y-2">
                          <p className="text-sm"><span className="font-medium">Mission MCS Language ID:</span> {component.missionMcsLanguageId || 'Not specified'}</p>
                          <p className="text-sm"><span className="font-medium">Mission Language ID:</span> {component.missionLanguageId || 'Not specified'}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Component Languages</h4>
                        <div className="space-y-2">
                          <p className="text-sm"><span className="font-medium">Component MCS Language ID:</span> {component.componentMcsLanguageId || 'Not specified'}</p>
                          <p className="text-sm"><span className="font-medium">Component Language ID:</span> {component.componentLanguageId || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Position & Organization */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('position')}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <Group className="text-gray-600" />
                    <span className="text-lg font-semibold text-gray-900">Position & Organization</span>
                  </div>
                  {expandedSections.has('position') ? <ExpandLess /> : <ExpandMore />}
                </button>
                
                {expandedSections.has('position') && (
                  <div className="p-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Position Details</h4>
                        <div className="space-y-2">
                          <p className="text-sm"><span className="font-medium">Position ID:</span> {component.positionId || 'Not specified'}</p>
                          <p className="text-sm"><span className="font-medium">Position Name:</span> {component.positionName || 'Not specified'}</p>
                          <p className="text-sm"><span className="font-medium">Position Abbreviation:</span> {component.positionAbbreviation || 'Not specified'}</p>
                          <p className="text-sm"><span className="font-medium">Position Name Language ID:</span> {component.positionNameLangId || 'Not specified'}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Responsible Organization</h4>
                        <div className="space-y-2">
                          <p className="text-sm"><span className="font-medium">Organization Number:</span> {component.responsibleOrganizationNumber || 'Not specified'}</p>
                          <p className="text-sm"><span className="font-medium">Organization Name:</span> {component.responsibleOrganizationName || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Usage Information */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-amber-800 mb-3">Usage Information</h3>
          <div className="text-amber-700 space-y-2">
            <p><strong>Query:</strong> <code>missionaryComponent(id: ID): MissionaryComponent</code></p>
            <p><strong>Input:</strong> Component ID (comp_id)</p>
            <p><strong>Returns:</strong> Individual components of a missionary assignment</p>
            <p><strong>Use Case:</strong> Access detailed information about missionary assignment components including organizational structure, language requirements, and position details</p>
            <p><strong>Note:</strong> The assignmentLocationId field is deprecated; use unitNumber instead</p>
          </div>
        </div>
      </div>
    </div>
  );
}
