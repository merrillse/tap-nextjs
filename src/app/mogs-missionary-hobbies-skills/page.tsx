'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  ExpandMore, 
  ExpandLess, 
  SportsBaseball, 
  CheckCircle, 
  Warning, 
  FileDownload, 
  PersonPin,
  EmojiObjects
} from '@mui/icons-material';
import { ApiClient } from '@/lib/api-client';
import { getEnvironmentConfigSafe, getDefaultEnvironment, getEnvironmentNames } from '@/lib/environments';

// Types based on the GraphQL schema
interface MissionaryHobbiesSkills {
  /** id is the Legacy Missionary Id for this Missionary */
  missionaryNumber: string;
  skillsHobbiesOverview?: string;
}

interface SearchHistoryItem {
  id: string;
  timestamp: string;
  found: boolean;
}

const STORAGE_KEY = 'mogs-missionary-hobbies-skills-history';

const HOBBIES_SKILLS_QUERY = `
  query GetMissionaryHobbiesSkills($id: ID!) {
    missionaryHobbiesSkills(id: $id) {
      missionaryNumber
      skillsHobbiesOverview
    }
  }
`;

export default function MissionaryHobbiesSkillsPage() {
  const [selectedEnvironment, setSelectedEnvironment] = useState(getDefaultEnvironment('mogs'));
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [missionaryId, setMissionaryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [hobbiesSkills, setHobbiesSkills] = useState<MissionaryHobbiesSkills | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic', 'skills']));

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
    if (!missionaryId.trim()) {
      setError('Please enter a Legacy Missionary ID');
      return;
    }

    if (!apiClient) {
      setError('API client not initialized. Please wait a moment or try refreshing the page.');
      return;
    }

    setLoading(true);
    setError(null);
    setHobbiesSkills(null);

    try {
      const variables = { id: missionaryId.trim() };
      const response = await apiClient.executeGraphQLQuery(HOBBIES_SKILLS_QUERY, variables);

      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const result = response.data as { missionaryHobbiesSkills: MissionaryHobbiesSkills };
      
      if (result.missionaryHobbiesSkills) {
        setHobbiesSkills(result.missionaryHobbiesSkills);
        saveSearchHistory(missionaryId.trim(), true);
        
        // Scroll to results
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        setError('Missionary hobbies & skills not found');
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
    if (!hobbiesSkills) return;

    const dataStr = JSON.stringify(hobbiesSkills, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `missionary-hobbies-skills-${hobbiesSkills.missionaryNumber}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const useHistoryItem = (id: string) => {
    setMissionaryId(id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <SportsBaseball className="text-3xl text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">MOGS Missionary Hobbies & Skills</h1>
              <p className="text-lg text-gray-600 mt-1">
                Query missionary hobbies and skills data by Legacy Missionary ID
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <EmojiObjects className="text-blue-600 mt-1" />
              <div className="text-blue-800">
                <p className="font-medium mb-2">MOGS Missionary Hobbies & Skills Query</p>
                <p className="text-sm mb-2">
                  This page queries the <code className="bg-blue-100 px-2 py-1 rounded">missionaryHobbiesSkills(id: ID!)</code> endpoint from MOGS.
                </p>
                <p className="text-sm">
                  <strong>Input:</strong> Legacy Missionary ID (legacy_miss_id)<br/>
                  <strong>Returns:</strong> Missionary hobbies and skills overview data
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
                <label htmlFor="missionaryId" className="block text-sm font-medium text-gray-700 mb-2">
                  Legacy Missionary ID
                </label>
                <input
                  type="text"
                  id="missionaryId"
                  value={missionaryId}
                  onChange={(e) => setMissionaryId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter Legacy Missionary ID..."
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
        {hobbiesSkills && (
          <div ref={resultRef} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <EmojiObjects className="text-2xl text-green-600" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Missionary Hobbies & Skills</h2>
                    <p className="text-gray-600">Missionary Number: {hobbiesSkills.missionaryNumber}</p>
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
                        <h4 className="font-semibold text-gray-900 mb-3">Missionary Number</h4>
                        <p className="text-gray-700">{hobbiesSkills.missionaryNumber || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Skills & Hobbies */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('skills')}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <EmojiObjects className="text-gray-600" />
                    <span className="text-lg font-semibold text-gray-900">Skills & Hobbies Overview</span>
                  </div>
                  {expandedSections.has('skills') ? <ExpandLess /> : <ExpandMore />}
                </button>
                
                {expandedSections.has('skills') && (
                  <div className="p-6 border-t border-gray-200">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      {hobbiesSkills.skillsHobbiesOverview ? (
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-2">Skills & Hobbies Overview</h4>
                          <p className="text-blue-800 whitespace-pre-wrap">{hobbiesSkills.skillsHobbiesOverview}</p>
                        </div>
                      ) : (
                        <div className="text-gray-500 italic">No skills and hobbies overview available</div>
                      )}
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
            <p><strong>Query:</strong> <code>missionaryHobbiesSkills(id: ID!): MissionaryHobbiesSkills</code></p>
            <p><strong>Input:</strong> Legacy Missionary ID (legacy_miss_id)</p>
            <p><strong>Returns:</strong> Missionary hobbies and skills overview information</p>
            <p><strong>Use Case:</strong> Access detailed information about a missionary's hobbies, skills, and personal interests</p>
          </div>
        </div>
      </div>
    </div>
  );
}
