'use client';

import { useState, useEffect } from 'react';
import { ENVIRONMENTS, getEnvironmentConfigSafe, getDefaultEnvironment } from '@/lib/environments';
import { ApiClient } from '@/lib/api-client';

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

interface CurriculumData {
  curriculum: Curriculum;
}

interface CurriculumResponse {
  data?: CurriculumData;
  errors?: Array<{ message: string }>;
}

interface SearchHistoryItem {
  id: string;
  timestamp: string;
  environment: string;
}

export default function MOGSCurriculumPage() {
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>(getDefaultEnvironment('mogs'));
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [curriculumId, setCurriculumId] = useState('');
  const [curriculumData, setCurriculumData] = useState<Curriculum | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Initialize API client when environment changes
  useEffect(() => {
    try {
      const { config, key } = getEnvironmentConfigSafe(selectedEnvironment, 'mogs');
      setApiClient(new ApiClient(config, key));

      // Update selected environment if it was corrected
      if (key !== selectedEnvironment) {
        setSelectedEnvironment(key);
      }
    } catch (error) {
      console.error('Failed to initialize API client:', error);
      setApiClient(null);
    }
  }, [selectedEnvironment]);

  // Load search history from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('mogs-curriculum-search-history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse search history:', e);
      }
    }
  }, []);

  // Save search history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mogs-curriculum-search-history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  const addToSearchHistory = (id: string, env: string) => {
    const newItem: SearchHistoryItem = {
      id,
      timestamp: new Date().toISOString(),
      environment: env
    };
    setSearchHistory(prev => [newItem, ...prev.filter(item => !(item.id === id && item.environment === env))].slice(0, 10));
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('mogs-curriculum-search-history');
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

  const searchCurriculum = async () => {
    if (!apiClient) {
      setError('API client not initialized');
      return;
    }

    if (!curriculumId.trim()) {
      setError('Please enter a curriculum ID');
      return;
    }

    setLoading(true);
    setError(null);
    setCurriculumData(null);

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
          }
          subjectLanguage {
            id
            langId
            text
            translateDate
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

      const data = response.data as CurriculumData;
      if (data?.curriculum) {
        setCurriculumData(data.curriculum);
        addToSearchHistory(curriculumId.trim(), selectedEnvironment);
        setExpandedSections(new Set(['basic', 'languages', 'details'])); // Auto-expand main sections
      } else {
        setError('No curriculum found with the provided ID');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exportToJson = () => {
    if (!curriculumData) return;

    const dataStr = JSON.stringify(curriculumData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `curriculum-${curriculumData.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchCurriculum();
    }
  };

  const loadFromHistory = (item: SearchHistoryItem) => {
    setSelectedEnvironment(item.environment);
    setCurriculumId(item.id);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">MOGS Curriculum Query</h1>
            <p className="mt-1 text-sm text-gray-600">
              Search for curriculum information using the curriculum(id: ID!) query
            </p>
          </div>

          {/* Search Form */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-4 mb-4">
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
                  ✓ Connected
                </span>
              ) : (
                <span className="text-sm text-red-600 flex items-center gap-1">
                  ✗ Not Connected
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="curriculumId" className="block text-sm font-medium text-gray-700 mb-1">
                  Curriculum ID
                </label>
                <input
                  type="text"
                  id="curriculumId"
                  value={curriculumId}
                  onChange={(e) => setCurriculumId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter curriculum ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={searchCurriculum}
                disabled={loading || !apiClient}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Search Curriculum'}
              </button>
              {curriculumData && (
                <button
                  onClick={exportToJson}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Export JSON
                </button>
              )}
            </div>
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Recent Searches</h3>
                <button
                  onClick={clearSearchHistory}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear History
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.slice(0, 5).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => loadFromHistory(item)}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {item.id} ({item.environment})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
              <div className="text-sm text-red-800">
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          {/* Results */}
          {curriculumData && (
            <div className="px-6 py-4">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection('basic')}
                    className="w-full px-4 py-3 text-left font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span>Basic Information</span>
                      <span className="text-gray-500">
                        {expandedSections.has('basic') ? '−' : '+'}
                      </span>
                    </div>
                  </button>
                  {expandedSections.has('basic') && (
                    <div className="px-4 py-3 border-t border-gray-200">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">ID</dt>
                          <dd className="mt-1 text-sm text-gray-900">{curriculumData.id}</dd>
                        </div>
                        {curriculumData.description && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Description</dt>
                            <dd className="mt-1 text-sm text-gray-900">{curriculumData.description}</dd>
                          </div>
                        )}
                        {curriculumData.type && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Type</dt>
                            <dd className="mt-1 text-sm text-gray-900">{curriculumData.type}</dd>
                          </div>
                        )}
                        {curriculumData.status && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {curriculumData.status.label} ({curriculumData.status.value})
                            </dd>
                          </div>
                        )}
                        {curriculumData.effectiveDate && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Effective Date</dt>
                            <dd className="mt-1 text-sm text-gray-900">{curriculumData.effectiveDate}</dd>
                          </div>
                        )}
                        {curriculumData.decommissionDate && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Decommission Date</dt>
                            <dd className="mt-1 text-sm text-gray-900">{curriculumData.decommissionDate}</dd>
                          </div>
                        )}
                        {curriculumData.duration !== undefined && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Duration</dt>
                            <dd className="mt-1 text-sm text-gray-900">{curriculumData.duration}</dd>
                          </div>
                        )}
                        {curriculumData.intendedAudience && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Intended Audience</dt>
                            <dd className="mt-1 text-sm text-gray-900">{curriculumData.intendedAudience}</dd>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Flags */}
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection('flags')}
                    className="w-full px-4 py-3 text-left font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span>Flags & Settings</span>
                      <span className="text-gray-500">
                        {expandedSections.has('flags') ? '−' : '+'}
                      </span>
                    </div>
                  </button>
                  {expandedSections.has('flags') && (
                    <div className="px-4 py-3 border-t border-gray-200">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Can Assign</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {curriculumData.canAssign ? 'Yes' : 'No'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Phased</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {curriculumData.phased ? 'Yes' : 'No'}
                          </dd>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Languages */}
                {(curriculumData.teachingLanguage || curriculumData.subjectLanguage || curriculumData.languagePrerequisitePhrase) && (
                  <div className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection('languages')}
                      className="w-full px-4 py-3 text-left font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span>Language Information</span>
                        <span className="text-gray-500">
                          {expandedSections.has('languages') ? '−' : '+'}
                        </span>
                      </div>
                    </button>
                    {expandedSections.has('languages') && (
                      <div className="px-4 py-3 border-t border-gray-200">
                        <div className="space-y-4">
                          {curriculumData.teachingLanguage && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500 mb-2">Teaching Language</dt>
                              <dd className="pl-4 border-l-2 border-gray-200">
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                  <div>
                                    <span className="text-xs font-medium text-gray-400">ID:</span>
                                    <span className="ml-1 text-sm text-gray-900">{curriculumData.teachingLanguage.id}</span>
                                  </div>
                                  {curriculumData.teachingLanguage.langId && (
                                    <div>
                                      <span className="text-xs font-medium text-gray-400">Lang ID:</span>
                                      <span className="ml-1 text-sm text-gray-900">{curriculumData.teachingLanguage.langId}</span>
                                    </div>
                                  )}
                                  {curriculumData.teachingLanguage.text && (
                                    <div>
                                      <span className="text-xs font-medium text-gray-400">Text:</span>
                                      <span className="ml-1 text-sm text-gray-900">{curriculumData.teachingLanguage.text}</span>
                                    </div>
                                  )}
                                  {curriculumData.teachingLanguage.translateDate && (
                                    <div>
                                      <span className="text-xs font-medium text-gray-400">Translate Date:</span>
                                      <span className="ml-1 text-sm text-gray-900">{curriculumData.teachingLanguage.translateDate}</span>
                                    </div>
                                  )}
                                </div>
                              </dd>
                            </div>
                          )}
                          {curriculumData.subjectLanguage && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500 mb-2">Subject Language</dt>
                              <dd className="pl-4 border-l-2 border-gray-200">
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                  <div>
                                    <span className="text-xs font-medium text-gray-400">ID:</span>
                                    <span className="ml-1 text-sm text-gray-900">{curriculumData.subjectLanguage.id}</span>
                                  </div>
                                  {curriculumData.subjectLanguage.langId && (
                                    <div>
                                      <span className="text-xs font-medium text-gray-400">Lang ID:</span>
                                      <span className="ml-1 text-sm text-gray-900">{curriculumData.subjectLanguage.langId}</span>
                                    </div>
                                  )}
                                  {curriculumData.subjectLanguage.text && (
                                    <div>
                                      <span className="text-xs font-medium text-gray-400">Text:</span>
                                      <span className="ml-1 text-sm text-gray-900">{curriculumData.subjectLanguage.text}</span>
                                    </div>
                                  )}
                                  {curriculumData.subjectLanguage.translateDate && (
                                    <div>
                                      <span className="text-xs font-medium text-gray-400">Translate Date:</span>
                                      <span className="ml-1 text-sm text-gray-900">{curriculumData.subjectLanguage.translateDate}</span>
                                    </div>
                                  )}
                                </div>
                              </dd>
                            </div>
                          )}
                          {curriculumData.languagePrerequisitePhrase && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Language Prerequisite Phrase</dt>
                              <dd className="mt-1 text-sm text-gray-900">{curriculumData.languagePrerequisitePhrase}</dd>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Overlap */}
                {curriculumData.overlap && (
                  <div className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection('overlap')}
                      className="w-full px-4 py-3 text-left font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span>Curriculum Overlap</span>
                        <span className="text-gray-500">
                          {expandedSections.has('overlap') ? '−' : '+'}
                        </span>
                      </div>
                    </button>
                    {expandedSections.has('overlap') && (
                      <div className="px-4 py-3 border-t border-gray-200">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">ID</dt>
                            <dd className="mt-1 text-sm text-gray-900">{curriculumData.overlap.id}</dd>
                          </div>
                          {curriculumData.overlap.name && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Name</dt>
                              <dd className="mt-1 text-sm text-gray-900">{curriculumData.overlap.name}</dd>
                            </div>
                          )}
                          {curriculumData.overlap.description && (
                            <div className="sm:col-span-2">
                              <dt className="text-sm font-medium text-gray-500">Description</dt>
                              <dd className="mt-1 text-sm text-gray-900">{curriculumData.overlap.description}</dd>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Facilities */}
                {curriculumData.facilities && curriculumData.facilities.length > 0 && (
                  <div className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection('facilities')}
                      className="w-full px-4 py-3 text-left font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span>Facilities ({curriculumData.facilities.length})</span>
                        <span className="text-gray-500">
                          {expandedSections.has('facilities') ? '−' : '+'}
                        </span>
                      </div>
                    </button>
                    {expandedSections.has('facilities') && (
                      <div className="px-4 py-3 border-t border-gray-200">
                        <div className="space-y-3">
                          {curriculumData.facilities.map((facility, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-md">
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {facility.id && (
                                  <div>
                                    <span className="text-xs font-medium text-gray-400">ID:</span>
                                    <span className="ml-1 text-sm text-gray-900">{facility.id}</span>
                                  </div>
                                )}
                                {facility.name && (
                                  <div>
                                    <span className="text-xs font-medium text-gray-400">Name:</span>
                                    <span className="ml-1 text-sm text-gray-900">{facility.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
