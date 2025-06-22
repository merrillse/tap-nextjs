'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

// TypeScript interfaces matching the MOGS GraphQL schema
interface LabelValue {
  value: number;
  label: string;
}

interface LanguageTranslation {
  id: string;
  langId?: number;
  text?: string;
  translateDate?: string;
  createdBy?: string;
  dateCreated?: string;
  modifiedBy?: string;
  dateModified?: string;
}

interface CurriculumOverlap {
  id: string;
  name?: string;
  description?: string;
}

interface Facility {
  id?: string;
  name?: string;
}

interface Curriculum {
  id: string;
  description?: string;
  effectiveDate?: string;
  decommissionDate?: string;
  canAssign?: boolean;
  phased?: boolean;
  duration?: number;
  languagePrerequisitePhrase?: string;
  teachingLanguage?: LanguageTranslation;
  subjectLanguage?: LanguageTranslation;
  type?: string;
  status?: LabelValue;
  intendedAudience?: string;
  overlap?: CurriculumOverlap;
  facilities?: Facility[];
}

interface SearchHistory {
  id: string;
  curriculumId: string;
  timestamp: Date;
  resultFound: boolean;
  curriculumDescription?: string;
}

export default function MOGSCurriculumPage() {
  const [selectedEnvironment, setSelectedEnvironment] = useState('mogs-gql-dev');
  const [curriculumId, setCurriculumId] = useState('');
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);

  // Utility functions
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const exportToJson = () => {
    if (!curriculum) return;
    
    const dataStr = JSON.stringify(curriculum, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `curriculum-${curriculum.id}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const clearSearch = () => {
    setCurriculumId('');
    setCurriculum(null);
    setError(null);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('mogs-curriculum-search-history');
  };

  const handleLoadFromHistory = (entry: SearchHistory) => {
    setCurriculumId(entry.curriculumId);
    // Optionally trigger a search immediately
    if (apiClient) {
      searchCurriculum();
    }
  };

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mogs-curriculum-search-history');
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

  const saveSearchHistory = (currId: string, found: boolean, description?: string) => {
    const newEntry: SearchHistory = {
      id: Date.now().toString(),
      curriculumId: currId,
      timestamp: new Date(),
      resultFound: found,
      curriculumDescription: description
    };
    
    const updatedHistory = [newEntry, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
    setSearchHistory(updatedHistory);
    localStorage.setItem('mogs-curriculum-search-history', JSON.stringify(updatedHistory));
  };

  const searchCurriculum = async () => {
    if (!apiClient) {
      setError('API client not initialized. Please refresh the page.');
      return;
    }

    if (!curriculumId.trim()) {
      setError('Please enter a Curriculum ID');
      return;
    }

    setLoading(true);
    setError(null);
    setCurriculum(null);

    const query = `
      query GetCurriculum($id: ID!) {
        curriculum(id: $id) {
          id
          description
          effectiveDate
          decommissionDate
          canAssign
          phased
          duration
          languagePrerequisitePhrase
          teachingLanguage {
            id
            langId
            text
            translateDate
            createdBy
            dateCreated
            modifiedBy
            dateModified
          }
          subjectLanguage {
            id
            langId
            text
            translateDate
            createdBy
            dateCreated
            modifiedBy
            dateModified
          }
          type
          status {
            value
            label
          }
          intendedAudience
          overlap {
            id
            name
            description
          }
          facilities {
            id
            name
          }
        }
      }
    `;

    const variables = { id: curriculumId.trim() };

    try {
      const response = await apiClient.executeGraphQLQuery(query, variables);

      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors.map(err => err.message).join(', '));
      }

      if (response.data && (response.data as any).curriculum) {
        const curriculumData = (response.data as any).curriculum;
        setCurriculum(curriculumData);
        saveSearchHistory(curriculumId.trim(), true, curriculumData.description);
      } else {
        setError('No curriculum found with the provided ID');
        saveSearchHistory(curriculumId.trim(), false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      saveSearchHistory(curriculumId.trim(), false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">📚</span>
        <h1 className="text-2xl font-bold">MOGS Curriculum</h1>
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Search Curriculum by ID</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="curriculum-id" className="block text-sm font-medium text-gray-700 mb-1">Curriculum ID (Required)</label>
            <input
              id="curriculum-id"
              type="text"
              placeholder="Enter curriculum ID"
              value={curriculumId}
              onChange={(e) => setCurriculumId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchCurriculum()}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={searchCurriculum}
            disabled={loading || !curriculumId.trim() || !apiClient}
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

      {/* Curriculum Details */}
      {curriculum && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Curriculum Details</h2>
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
                      <span className="text-gray-600">Curriculum ID:</span>
                      <span className="font-mono">{curriculum.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Description:</span>
                      <span>{curriculum.description || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span>{curriculum.type || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Intended Audience:</span>
                      <span>{curriculum.intendedAudience || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration (hours):</span>
                      <span>{curriculum.duration || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {curriculum.status && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Label:</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          curriculum.status.label === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                          curriculum.status.label === 'INACTIVE' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {curriculum.status.label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Value:</span>
                        <span>{curriculum.status.value}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Properties</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Can Assign:</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        curriculum.canAssign ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {curriculum.canAssign ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phased:</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        curriculum.phased ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {curriculum.phased ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Effective Date:</span>
                      <span>{formatDate(curriculum.effectiveDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Decommission Date:</span>
                      <span>{formatDate(curriculum.decommissionDate)}</span>
                    </div>
                  </div>
                </div>

                {curriculum.languagePrerequisitePhrase && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Language Prerequisites</h4>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{curriculum.languagePrerequisitePhrase}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Language Information */}
            {(curriculum.teachingLanguage || curriculum.subjectLanguage) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Language Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {curriculum.teachingLanguage && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Teaching Language</h4>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">ID: {curriculum.teachingLanguage.id}</div>
                        <div className="text-sm text-gray-600">Text: {curriculum.teachingLanguage.text || 'N/A'}</div>
                        <div className="text-sm text-gray-600">Language ID: {curriculum.teachingLanguage.langId || 'N/A'}</div>
                        <div className="text-sm text-gray-600">Translate Date: {formatDate(curriculum.teachingLanguage.translateDate)}</div>
                      </div>
                    </div>
                  )}
                  {curriculum.subjectLanguage && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Subject Language</h4>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">ID: {curriculum.subjectLanguage.id}</div>
                        <div className="text-sm text-gray-600">Text: {curriculum.subjectLanguage.text || 'N/A'}</div>
                        <div className="text-sm text-gray-600">Language ID: {curriculum.subjectLanguage.langId || 'N/A'}</div>
                        <div className="text-sm text-gray-600">Translate Date: {formatDate(curriculum.subjectLanguage.translateDate)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Overlap Information */}
            {curriculum.overlap && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Overlap Information</h3>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">Overlap ID: {curriculum.overlap.id}</div>
                    <div className="text-sm text-gray-600">Name: {curriculum.overlap.name || 'N/A'}</div>
                    <div className="text-sm text-gray-600">Description: {curriculum.overlap.description || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Facilities */}
            {curriculum.facilities && curriculum.facilities.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Facilities ({curriculum.facilities.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {curriculum.facilities.map((facility, index) => (
                    <div key={facility.id || index} className="p-4 bg-orange-50 rounded-lg">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">Facility {index + 1}</div>
                        <div className="text-sm text-gray-600">ID: {facility.id || 'N/A'}</div>
                        <div className="text-sm text-gray-600">Name: {facility.name || 'N/A'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                    <div className="font-medium">Curriculum ID: {entry.curriculumId}</div>
                    {entry.curriculumDescription && (
                      <div className="text-sm text-gray-600">{entry.curriculumDescription}</div>
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

      {!loading && !curriculum && !error && (
        <div className="text-center py-8 text-gray-500">
          Enter a Curriculum ID to search for curriculum details.
        </div>
      )}
    </div>
  );
}
