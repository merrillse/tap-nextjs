'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

// TypeScript interfaces based on the GraphQL schema
interface Option {
  value?: string;
  label?: string;
}

interface SearchHistory {
  id: string;
  entity: string;
  attributeName: string;
  timestamp: Date;
  resultCount: number;
}

// Entity enum values from schema
const ENTITY_OPTIONS = [
  { value: 'ASSIGNMENT', label: 'Missionary Call Assignment' },
  { value: 'MISSIONARY', label: 'Missionary Call' },
  { value: 'CANDIDATE', label: 'Candidate (Enabled Member)' },
  { value: 'RELATION', label: 'Missionary Call Relations' },
  { value: 'GEOPOLITICAL_LOCATION', label: 'Geopolitical Location' },
  { value: 'MISSION_BOUNDARY_CHANGE', label: 'Mission Boundary Change' },
  { value: 'RECOMMENDATION', label: 'Missionary Recommendation System (MRS)' },
  { value: 'MISSIONARY_LANGUAGE', label: 'Missionary Language' },
  { value: 'MISSIONARY_MEDICAL_LEG_NOTES', label: 'Missionary Medical Leg Notes' },
  { value: 'MISSIONARY_MEDICAL_SCREENING_RESULTS', label: 'Missionary Medical Screening Information' },
  { value: 'SCREENING_MASTER', label: 'Missionary Recommend System (MRS) Screening master' }
];

// AttributeName enum values from schema (commonly used ones)
const ATTRIBUTE_NAME_OPTIONS = [
  // Missionary attributes
  { value: 'ASSAULT_SURVIVOR', label: 'Assault Survivor', entity: 'MISSIONARY' },
  { value: 'ASSIGNED_CHURCH_OWNED_VEHICLE', label: 'Assigned Church Owned Vehicle', entity: 'MISSIONARY' },
  { value: 'CALL_ACCEPTED', label: 'Call Accepted', entity: 'MISSIONARY' },
  { value: 'CALL_LETTER_LANGUAGE', label: 'Call Letter Language', entity: 'MISSIONARY' },
  { value: 'CALL_LETTER_TYPE', label: 'Call Letter Type', entity: 'MISSIONARY' },
  { value: 'CALL_TYPE_CODE', label: 'Call Type Code', entity: 'MISSIONARY' },
  { value: 'CAN_TEXT_MOBILE_PHONE', label: 'Can Text Mobile Phone', entity: 'MISSIONARY' },
  { value: 'CERTIFICATE_REQUESTED', label: 'Certificate Requested', entity: 'MISSIONARY' },
  { value: 'COMPONENT', label: 'Component', entity: 'MISSIONARY' },
  { value: 'DO_NOT_PURGE', label: 'Do Not Purge', entity: 'MISSIONARY' },
  { value: 'GENDER', label: 'Gender', entity: 'MISSIONARY' },
  { value: 'HOUSING_SWEEP_PARTICIPATION', label: 'Housing Sweep Participation', entity: 'MISSIONARY' },
  { value: 'IMMUNIZATION_STATUS', label: 'Immunization Status', entity: 'MISSIONARY' },
  { value: 'MISSIONARY_TYPE', label: 'Missionary Type', entity: 'MISSIONARY' },
  { value: 'OUTBOUND_TRAVEL_PAID_BY', label: 'Outbound Travel Paid By', entity: 'MISSIONARY' },
  { value: 'PRIMARY_MISSIONARY', label: 'Primary Missionary', entity: 'MISSIONARY' },
  { value: 'READY_TO_TRAVEL', label: 'Ready To Travel', entity: 'MISSIONARY' },
  { value: 'RETURN_TRAVEL_PAID_BY', label: 'Return Travel Paid By', entity: 'MISSIONARY' },
  { value: 'SOURCE_OF_DATA', label: 'Source Of Data', entity: 'MISSIONARY' },
  { value: 'WORKFORCE_ENABLED', label: 'Workforce Enabled', entity: 'MISSIONARY' },
  { value: 'RECOMMEND_TYPE', label: 'Recommend Type', entity: 'MISSIONARY' },
  
  // Assignment attributes
  { value: 'COUNCIL_APPROVED', label: 'Council Approved', entity: 'ASSIGNMENT' },
  { value: 'IS_PERMANENT', label: 'Is Permanent', entity: 'ASSIGNMENT' },
  { value: 'SEND_TO_SMMS', label: 'Send To SMMS', entity: 'ASSIGNMENT' },
  { value: 'START_DATE_VERIFIED', label: 'Start Date Verified', entity: 'ASSIGNMENT' },
  { value: 'ASSIGNMENT_TYPE', label: 'Assignment Type', entity: 'ASSIGNMENT' },
  { value: 'SERVICE_METHOD', label: 'Service Method', entity: 'ASSIGNMENT' },
  
  // Relations attributes
  { value: 'CAN_RECEIVE_TEXT_MESSAGES', label: 'Can Receive Text Messages', entity: 'RELATION' },
  { value: 'DO_NOT_CONTACT', label: 'Do Not Contact', entity: 'RELATION' },
  { value: 'EMERGENCY_CONTACT_RELATIONSHIP', label: 'Emergency Contact Relationship', entity: 'RELATION' },
  { value: 'HAS_RELATIVE_SERVING', label: 'Has Relative Serving', entity: 'RELATION' },
  { value: 'IS_DECEASED', label: 'Is Deceased', entity: 'RELATION' },
  { value: 'IS_MEMBER', label: 'Is Member', entity: 'RELATION' },
  { value: 'PARENTAL_RELATIONSHIP_LABEL', label: 'Parental Relationship Label', entity: 'RELATION' },
  { value: 'PHONE_COUNTRY_CODE', label: 'Phone Country Code', entity: 'RELATION' },
  { value: 'RELATIONS_SERVING', label: 'Relations Serving', entity: 'RELATION' },
  
  // Geopolitical Location attributes
  { value: 'GEOPOLITICAL_CLASS', label: 'Geopolitical Class', entity: 'GEOPOLITICAL_LOCATION' },
  { value: 'GEOPOLITICAL_TYPE', label: 'Geopolitical Type', entity: 'GEOPOLITICAL_LOCATION' },
  
  // Medical Screening attributes
  { value: 'CASE_MANAGEMENT', label: 'Case Management', entity: 'MISSIONARY_MEDICAL_SCREENING_RESULTS' },
  { value: 'INSURANCE_STATUS', label: 'Insurance Status', entity: 'MISSIONARY_MEDICAL_SCREENING_RESULTS' },
  
  // Recommendation attributes
  { value: 'COVERAGE_BY_LOCATION_WITHIN_REGION', label: 'Coverage By Location Within Region', entity: 'RECOMMENDATION' },
  { value: 'COVERAGE_BY_LOCATION_OUTSIDE_REGION', label: 'Coverage By Location Outside Region', entity: 'RECOMMENDATION' },
  { value: 'COVERAGE_BY_LOCATION_OUTSIDE_COUNTRY', label: 'Coverage By Location Outside Country', entity: 'RECOMMENDATION' },
  { value: 'PRIMARY_LANGUAGE_DETAILS', label: 'Primary Language Details', entity: 'RECOMMENDATION' },
  { value: 'LANGUAGE_GRADE', label: 'Language Grade', entity: 'RECOMMENDATION' },
  { value: 'PROFICIENCY', label: 'Proficiency', entity: 'RECOMMENDATION' },
  
  // Multi-entity attributes
  { value: 'STATE_CODE', label: 'State Code', entity: 'MULTIPLE' },
  { value: 'STATUS_CODE', label: 'Status Code', entity: 'MULTIPLE' }
];

export default function OptionsPage() {
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState('mis-gql-dev');
  
  const [selectedEntity, setSelectedEntity] = useState('');
  const [selectedAttributeName, setSelectedAttributeName] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);

  // Get only MIS/MGQL environments (no MOGS)
  const mgqlEnvironments = Object.entries(ENVIRONMENTS).filter(([key]) => 
    key.startsWith('mis-gql-')
  );

  // Utility functions
  const exportToJson = () => {
    if (options.length === 0) return;
    
    const exportData = {
      entity: selectedEntity,
      attributeName: selectedAttributeName,
      optionsCount: options.length,
      options: options,
      timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `options-${selectedEntity}-${selectedAttributeName}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const clearSearch = () => {
    setSelectedEntity('');
    setSelectedAttributeName('');
    setOptions([]);
    setError(null);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('options-search-history');
    }
  };

  const handleLoadFromHistory = (entry: SearchHistory) => {
    setSelectedEntity(entry.entity);
    setSelectedAttributeName(entry.attributeName);
  };

  // Load search history from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('options-search-history');
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

  const saveSearchHistory = (entity: string, attributeName: string, resultCount: number) => {
    const newEntry: SearchHistory = {
      id: Date.now().toString(),
      entity,
      attributeName,
      timestamp: new Date(),
      resultCount
    };
    
    const updatedHistory = [newEntry, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
    setSearchHistory(updatedHistory);
    if (typeof window !== 'undefined') {
      localStorage.setItem('options-search-history', JSON.stringify(updatedHistory));
    }
  };

  const buildOptionsQuery = (entity: string, attributeName: string) => {
    return `
      query GetOptions {
        options(entity: ${entity}, attributeName: ${attributeName}) {
          value
          label
        }
      }
    `;
  };

  const handleSearch = async () => {
    if (!apiClient) {
      setError('API client not initialized. Please refresh the page.');
      return;
    }

    if (!selectedEntity.trim() || !selectedAttributeName.trim()) {
      setError('Please select both Entity and Attribute Name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const query = buildOptionsQuery(selectedEntity, selectedAttributeName);
      const response = await apiClient.executeGraphQLQuery(query);
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors.map(err => err.message).join(', '));
      }

      const data = response.data as { options: Option[] };
      const optionsResult = data.options || [];
      setOptions(optionsResult);
      
      // Save to search history
      saveSearchHistory(selectedEntity, selectedAttributeName, optionsResult.length);
      
      if (optionsResult.length === 0) {
        setError('No options found for the selected entity and attribute');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      saveSearchHistory(selectedEntity, selectedAttributeName, 0);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAttributeNames = () => {
    if (!selectedEntity) return ATTRIBUTE_NAME_OPTIONS;
    return ATTRIBUTE_NAME_OPTIONS.filter(attr => 
      attr.entity === selectedEntity || attr.entity === 'MULTIPLE'
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">⚙️</span>
        <h1 className="text-2xl font-bold">Options Search</h1>
        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Missionary Information System</span>
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
            {mgqlEnvironments.map(([key, env]) => (
              <option key={key} value={key}>
                {env.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Search Options by Entity and Attribute</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label htmlFor="entity" className="block text-sm font-medium text-gray-700 mb-1">Entity (Required)</label>
              <select
                id="entity"
                value={selectedEntity}
                onChange={(e) => {
                  setSelectedEntity(e.target.value);
                  setSelectedAttributeName(''); // Reset attribute when entity changes
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an entity...</option>
                {ENTITY_OPTIONS.map((entity) => (
                  <option key={entity.value} value={entity.value}>
                    {entity.label} ({entity.value})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="attribute" className="block text-sm font-medium text-gray-700 mb-1">Attribute Name (Required)</label>
              <select
                id="attribute"
                value={selectedAttributeName}
                onChange={(e) => setSelectedAttributeName(e.target.value)}
                disabled={!selectedEntity}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select an attribute...</option>
                {getFilteredAttributeNames().map((attr) => (
                  <option key={attr.value} value={attr.value}>
                    {attr.label} ({attr.value})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
            <button
              onClick={handleSearch}
              disabled={loading || !selectedEntity.trim() || !selectedAttributeName.trim() || !apiClient}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Get Options'}
            </button>
            <button
              onClick={clearSearch}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Options Results */}
      {options.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Options Results ({options.length} found)</h2>
            <button
              onClick={exportToJson}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
            >
              📥 Export JSON
            </button>
          </div>

          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Search Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Entity:</span>
                  <span className="ml-2 font-medium">{ENTITY_OPTIONS.find(e => e.value === selectedEntity)?.label}</span>
                </div>
                <div>
                  <span className="text-gray-600">Attribute:</span>
                  <span className="ml-2 font-medium">{ATTRIBUTE_NAME_OPTIONS.find(a => a.value === selectedAttributeName)?.label}</span>
                </div>
              </div>
            </div>

            {/* Options Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <span className="mr-2">🔤</span>
                        Value
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <span className="mr-2">📝</span>
                        Label
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {options.map((option, index) => (
                    <tr key={`option-${index}-${option.value || 'undefined'}-${option.label || 'undefined'}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {option.value || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {option.label || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                    <div className="font-medium">{ENTITY_OPTIONS.find(e => e.value === entry.entity)?.label || entry.entity}</div>
                    <div className="text-sm text-gray-600">{ATTRIBUTE_NAME_OPTIONS.find(a => a.value === entry.attributeName)?.label || entry.attributeName}</div>
                    <div className="text-sm text-gray-500">
                      {entry.timestamp.toLocaleDateString()} at {entry.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${entry.resultCount > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {entry.resultCount} options
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && options.length === 0 && !error && (
        <div className="text-center py-8 text-gray-500">
          Select an entity and attribute name to search for available options.
        </div>
      )}
    </div>
  );
}
