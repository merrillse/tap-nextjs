'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  ExpandMore, 
  ExpandLess, 
  Business, 
  CheckCircle, 
  Warning, 
  FileDownload, 
  AccessTime, 
  Home,
  Email,
  Phone,
  ContactMail,
  Badge,
  Assignment,
  Security,
  Info,
  LocationOn,
  Language,
  ArrowLeft,
  Search,
  History,
  Download,
  ChevronRight,
  KeyboardArrowDown,
  Fax,
  Person,
  Group,
  PhoneAndroid
} from '@mui/icons-material';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS, getEnvironmentConfigSafe, getDefaultEnvironment } from '@/lib/environments';

// TypeScript interfaces based on WSMission type from MOGS schema
interface WSZone {
  id: string
  name?: string
  wsDistricts?: WSDistrict[]
}

interface WSDistrict {
  id: string
  name?: string
  wsProselytingAreas?: WSProselytingArea[]
}

interface WSProselytingArea {
  id: string
  name?: string
}

interface WSMission {
  id: string
  name?: string
  address?: string
  mailingAddress?: string
  phoneInternationalCode?: string
  phone?: string
  phoneExtension?: string
  faxInternationalCode?: string
  fax?: string
  faxExtension?: string
  email?: string
  leaderCmisId?: number
  leaderName?: string
  leaderHomeAddress?: string
  leaderPhoneInternationalCode?: string
  leaderPhone?: string
  leaderPhoneExtension?: string
  leaderCellInternationalCode?: string
  leaderCell?: string
  leaderCellExtension?: string
  leaderEmail?: string
  mobileDevice?: boolean
  missionaryAllocation?: number
  assignmentLocationStatusId?: number
  assignmentLocationStatusDescription?: string
  wsZones?: WSZone[]
}

interface GraphQLQueryResponse {
  data: {
    wsMission?: WSMission
  }
  errors?: Array<{
    message: string
    path?: string[]
  }>
}

const WS_MISSION_QUERY = `
  query GetWSMission($id: ID!) {
    wsMission(id: $id) {
      id
      name
      address
      mailingAddress
      phoneInternationalCode
      phone
      phoneExtension
      faxInternationalCode
      fax
      faxExtension
      email
      leaderCmisId
      leaderName
      leaderHomeAddress
      leaderPhoneInternationalCode
      leaderPhone
      leaderPhoneExtension
      leaderCellInternationalCode
      leaderCell
      leaderCellExtension
      leaderEmail
      mobileDevice
      missionaryAllocation
      assignmentLocationStatusId
      assignmentLocationStatusDescription
      wsZones {
        id
        name
        wsDistricts {
          id
          name
          wsProselytingAreas {
            id
            name
          }
        }
      }
    }
  }
`;

export default function MogsWSMissionPage() {
  const [missionId, setMissionId] = useState('');
  const [wsMission, setWSMission] = useState<WSMission | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>(getDefaultEnvironment('mogs'));
  const [showHistory, setShowHistory] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic', 'contact', 'leader']));

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
    const savedHistory = localStorage.getItem('mogs-ws-mission-search-history');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setSearchHistory(history);
      } catch (error) {
        console.error('Failed to parse search history:', error);
      }
    }
  }, []);

  const saveToHistory = (id: string) => {
    if (!id.trim()) return;
    
    const newHistory = [id, ...searchHistory.filter(item => item !== id)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('mogs-ws-mission-search-history', JSON.stringify(newHistory));
  };

  const handleSearch = async () => {
    if (!missionId.trim()) {
      setError('Please enter a mission ID');
      return;
    }

    if (!apiClient) {
      setError('API client not initialized. Please select a valid environment.');
      return;
    }

    setLoading(true);
    setError(null);
    setWSMission(null);

    try {
      const variables = { id: missionId.trim() };
      const response = await apiClient.executeGraphQLQuery(WS_MISSION_QUERY, variables) as GraphQLQueryResponse;

      if (response.errors && response.errors.length > 0) {
        setError(`GraphQL Error: ${response.errors.map((e: any) => e.message).join(', ')}`);
      } else if (response.data?.wsMission) {
        setWSMission(response.data.wsMission);
        saveToHistory(missionId.trim());
        
        // Scroll to results
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        setError('No WS mission found with the provided ID');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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
    if (!wsMission) return;
    
    const dataStr = JSON.stringify(wsMission, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ws-mission-${wsMission.id || 'unknown'}.json`;
    link.click();
    URL.revokeObjectURL(url);
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

  const selectFromHistory = (id: string) => {
    setMissionId(id);
    setShowHistory(false);
  };

  const formatPhone = (intlCode?: string, phone?: string, extension?: string) => {
    if (!phone) return 'N/A';
    let formatted = phone;
    if (intlCode) formatted = `+${intlCode} ${formatted}`;
    if (extension) formatted = `${formatted} ext. ${extension}`;
    return formatted;
  };

  const availableEnvironments = Object.keys(ENVIRONMENTS).filter(key => 
    ENVIRONMENTS[key].graph_url
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/documentation" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Documentation
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MOGS WS Mission</h1>
          <p className="text-lg text-gray-600">
            Query Web Service mission information by ID using the MOGS GraphQL API
          </p>
        </div>

        {/* Environment Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Environment
          </label>
          <select
            value={selectedEnvironment}
            onChange={(e) => setSelectedEnvironment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableEnvironments.map((envKey) => (
              <option key={envKey} value={envKey}>
                {ENVIRONMENTS[envKey].name} - {ENVIRONMENTS[envKey].graph_url}
              </option>
            ))}
          </select>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={missionId}
                onChange={(e) => setMissionId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter mission ID..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchHistory.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600"
                  title="Search History"
                >
                  <History className="w-4 h-4" />
                </button>
              )}
              
              {/* Search History Dropdown */}
              {showHistory && searchHistory.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                  {searchHistory.map((id, index) => (
                    <button
                      key={index}
                      onClick={() => selectFromHistory(id)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                    >
                      {id}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Warning className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Results Section */}
        {wsMission && (
          <div ref={resultRef} className="space-y-6">
            {/* Export Button */}
            <div className="flex justify-end">
              <button
                onClick={exportToJson}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
            </div>

            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('basic')}
                  className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-900 hover:bg-gray-50"
                >
                  <span>Basic Information</span>
                  {expandedSections.has('basic') ? <KeyboardArrowDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                
                {expandedSections.has('basic') && (
                  <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mission ID</label>
                      <p className="text-gray-900">{wsMission.id || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mission Name</label>
                      <p className="text-gray-900">{wsMission.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Missionary Allocation</label>
                      <p className="text-gray-900">{wsMission.missionaryAllocation || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mobile Device</label>
                      <p className="text-gray-900">{wsMission.mobileDevice ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Assignment Location Status ID</label>
                      <p className="text-gray-900">{wsMission.assignmentLocationStatusId || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Assignment Location Status</label>
                      <p className="text-gray-900">{wsMission.assignmentLocationStatusDescription || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('contact')}
                  className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-900 hover:bg-gray-50"
                >
                  <span>Contact Information</span>
                  {expandedSections.has('contact') ? <KeyboardArrowDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                
                {expandedSections.has('contact') && (
                  <div className="px-4 pb-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <p className="text-gray-900 whitespace-pre-line">{wsMission.address || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Mailing Address</label>
                        <p className="text-gray-900 whitespace-pre-line">{wsMission.mailingAddress || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <p className="text-gray-900">{formatPhone(wsMission.phoneInternationalCode, wsMission.phone, wsMission.phoneExtension)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Fax</label>
                        <p className="text-gray-900">{formatPhone(wsMission.faxInternationalCode, wsMission.fax, wsMission.faxExtension)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="text-gray-900">{wsMission.email || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Leader Information */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('leader')}
                  className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-900 hover:bg-gray-50"
                >
                  <span>Leader Information</span>
                  {expandedSections.has('leader') ? <KeyboardArrowDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                
                {expandedSections.has('leader') && (
                  <div className="px-4 pb-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Leader CMIS ID</label>
                        <p className="text-gray-900">{wsMission.leaderCmisId || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Leader Name</label>
                        <p className="text-gray-900">{wsMission.leaderName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Leader Home Address</label>
                        <p className="text-gray-900 whitespace-pre-line">{wsMission.leaderHomeAddress || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Leader Email</label>
                        <p className="text-gray-900">{wsMission.leaderEmail || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Leader Phone</label>
                        <p className="text-gray-900">{formatPhone(wsMission.leaderPhoneInternationalCode, wsMission.leaderPhone, wsMission.leaderPhoneExtension)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Leader Cell</label>
                        <p className="text-gray-900">{formatPhone(wsMission.leaderCellInternationalCode, wsMission.leaderCell, wsMission.leaderCellExtension)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Zones */}
            {wsMission.wsZones && wsMission.wsZones.length > 0 && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection('zones')}
                    className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-900 hover:bg-gray-50"
                  >
                    <span>Zones ({wsMission.wsZones.length})</span>
                    {expandedSections.has('zones') ? <KeyboardArrowDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  
                  {expandedSections.has('zones') && (
                    <div className="px-4 pb-4 space-y-4">
                      {wsMission.wsZones.map((zone, index) => (
                        <div key={zone.id} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Zone {index + 1}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Zone ID</label>
                              <p className="text-gray-900">{zone.id}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Zone Name</label>
                              <p className="text-gray-900">{zone.name || 'N/A'}</p>
                            </div>
                          </div>
                          
                          {zone.wsDistricts && zone.wsDistricts.length > 0 && (
                            <div className="mt-4">
                              <h5 className="font-medium text-gray-800 mb-2">Districts ({zone.wsDistricts.length})</h5>
                              <div className="space-y-2">
                                {zone.wsDistricts.map((district, districtIndex) => (
                                  <div key={district.id} className="bg-gray-50 p-3 rounded">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600">District ID</label>
                                        <p className="text-sm text-gray-900">{district.id}</p>
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600">District Name</label>
                                        <p className="text-sm text-gray-900">{district.name || 'N/A'}</p>
                                      </div>
                                    </div>
                                    
                                    {district.wsProselytingAreas && district.wsProselytingAreas.length > 0 && (
                                      <div className="mt-2">
                                        <label className="block text-xs font-medium text-gray-600">Proselyting Areas ({district.wsProselytingAreas.length})</label>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                          {district.wsProselytingAreas.map((area) => (
                                            <span key={area.id} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                              {area.name || area.id}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
