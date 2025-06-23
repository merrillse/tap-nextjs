'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

interface GeopoliticalLocation {
  locationCodeNumber: number;
  geopoliticalLocationId: number;
  name: string;
}

interface ProselytingArea {
  id: string;
  name: string;
  address?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: GeopoliticalLocation;
  vehicleId?: string;
  vehicleUnitOfMeasureCode?: string;
  vehicleUnitOfMeasureLimit?: number;
  vehicleSTWD?: boolean;
  emailAddress?: string;
  updatedDate?: string;
  ecclesiasticalAreaNumber?: number;
  ecclesiasticalAreaName?: string;
}

interface Mission {
  id: string;
  name: string;
  address?: string;
  mailingAddress?: string;
  phone?: string;
  email?: string;
  leaderName?: string;
  leaderCmisId?: number;
  missionaryAllocation?: number;
}

interface Zone {
  id: string;
  name: string;
  mission?: Mission;
}

interface District {
  id: string;
  name: string;
  zone?: Zone;
  proselytingAreas?: ProselytingArea[];
}

interface SearchHistory {
  id: string;
  districtId: string;
  timestamp: Date;
  resultFound: boolean;
  districtName?: string;
}

export default function DistrictPage() {
  const [selectedEnvironment, setSelectedEnvironment] = useState('mis-gql-dev');
  const [districtId, setDistrictId] = useState('');
  const [district, setDistrict] = useState<District | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);

  // Get only MGQL/MIS environments (no MOGS)
  const mgqlEnvironments = Object.entries(ENVIRONMENTS).filter(([key]) => 
    key.startsWith('mis-gql-')
  );

  // Utility functions
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatAddress = (area: ProselytingArea) => {
    const parts = [area.address, area.city, area.stateProvince, area.postalCode].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const exportToJson = () => {
    if (!district) return;
    
    const dataStr = JSON.stringify(district, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `district-${district.id}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const clearSearch = () => {
    setDistrictId('');
    setDistrict(null);
    setError(null);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('district-search-history');
  };

  const handleLoadFromHistory = (entry: SearchHistory) => {
    setDistrictId(entry.districtId);
    if (apiClient) {
      searchDistrict();
    }
  };

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('district-search-history');
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

  const saveSearchHistory = (distId: string, found: boolean, name?: string) => {
    const newEntry: SearchHistory = {
      id: Date.now().toString(),
      districtId: distId,
      timestamp: new Date(),
      resultFound: found,
      districtName: name
    };
    
    const updatedHistory = [newEntry, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
    setSearchHistory(updatedHistory);
    localStorage.setItem('district-search-history', JSON.stringify(updatedHistory));
  };

  const searchDistrict = async () => {
    if (!apiClient) {
      setError('API client not initialized. Please refresh the page.');
      return;
    }

    if (!districtId.trim()) {
      setError('Please enter a District ID');
      return;
    }

    setLoading(true);
    setError(null);
    setDistrict(null);

    const query = `
      query GetDistrict($id: ID!) {
        district(id: $id) {
          id
          name
          zone {
            id
            name
            mission {
              id
              name
              address
              mailingAddress
              phone
              email
              leaderName
              leaderCmisId
              missionaryAllocation
            }
          }
          proselytingAreas {
            id
            name
            address
            city
            stateProvince
            postalCode
            country {
              locationCodeNumber
              geopoliticalLocationId
              name
            }
            vehicleId
            vehicleUnitOfMeasureCode
            vehicleUnitOfMeasureLimit
            vehicleSTWD
            emailAddress
            updatedDate
            ecclesiasticalAreaNumber
            ecclesiasticalAreaName
          }
        }
      }
    `;

    const variables = { id: districtId.trim() };

    try {
      const response = await apiClient.executeGraphQLQuery(query, variables);

      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors.map(err => err.message).join(', '));
      }

      if (response.data && (response.data as any).district) {
        const districtData = (response.data as any).district;
        setDistrict(districtData);
        saveSearchHistory(districtId.trim(), true, districtData.name);
      } else {
        setError('No district found with the provided ID');
        saveSearchHistory(districtId.trim(), false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      saveSearchHistory(districtId.trim(), false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🏢</span>
        <h1 className="text-2xl font-bold">District Search</h1>
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Search District by ID</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="district-id" className="block text-sm font-medium text-gray-700 mb-1">District ID (Required)</label>
            <input
              id="district-id"
              type="text"
              placeholder="Enter district ID"
              value={districtId}
              onChange={(e) => setDistrictId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchDistrict()}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={searchDistrict}
            disabled={loading || !districtId.trim() || !apiClient}
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

      {/* District Details */}
      {district && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">District Details</h2>
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
                      <span className="text-gray-600">District ID:</span>
                      <span className="font-mono">{district.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">District Name:</span>
                      <span>{district.name || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {district.proselytingAreas?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Proselyting Areas</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {district.zone?.mission?.missionaryAllocation || 0}
                      </div>
                      <div className="text-sm text-gray-600">Mission Allocation</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Zone Information */}
            {district.zone && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Zone Information</h3>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Zone ID: {district.zone.id}</div>
                      <div className="text-sm text-gray-600">Zone Name: {district.zone.name || 'N/A'}</div>
                    </div>
                    {district.zone.mission && (
                      <div>
                        <div className="text-sm text-gray-600">Mission ID: {district.zone.mission.id}</div>
                        <div className="text-sm text-gray-600">Mission Name: {district.zone.mission.name || 'N/A'}</div>
                      </div>
                    )}
                  </div>

                  {/* Mission Details */}
                  {district.zone.mission && (
                    <div className="mt-4 p-4 bg-white rounded-lg border">
                      <h4 className="font-medium text-gray-900 mb-3">Mission Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          {district.zone.mission.leaderName && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Leader:</span>
                              <span>{district.zone.mission.leaderName}</span>
                            </div>
                          )}
                          {district.zone.mission.leaderCmisId && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Leader CMIS ID:</span>
                              <span>{district.zone.mission.leaderCmisId}</span>
                            </div>
                          )}
                          {district.zone.mission.phone && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Phone:</span>
                              <span>{district.zone.mission.phone}</span>
                            </div>
                          )}
                          {district.zone.mission.email && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Email:</span>
                              <span>{district.zone.mission.email}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          {district.zone.mission.address && (
                            <div>
                              <span className="text-gray-600 block mb-1">Address:</span>
                              <div className="text-sm bg-gray-50 p-2 rounded whitespace-pre-line">
                                {district.zone.mission.address}
                              </div>
                            </div>
                          )}
                          {district.zone.mission.mailingAddress && (
                            <div>
                              <span className="text-gray-600 block mb-1">Mailing Address:</span>
                              <div className="text-sm bg-gray-50 p-2 rounded whitespace-pre-line">
                                {district.zone.mission.mailingAddress}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Proselyting Areas */}
            {district.proselytingAreas && district.proselytingAreas.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Proselyting Areas ({district.proselytingAreas.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {district.proselytingAreas.map((area) => (
                    <div key={area.id} className="p-4 bg-orange-50 rounded-lg border">
                      <div className="space-y-2">
                        <div className="font-medium text-gray-900">{area.name || `Area ${area.id}`}</div>
                        <div className="text-sm text-gray-600">ID: {area.id}</div>
                        
                        {area.ecclesiasticalAreaNumber && (
                          <div className="text-sm text-gray-600">
                            Ecclesiastical Area: #{area.ecclesiasticalAreaNumber}
                            {area.ecclesiasticalAreaName && ` - ${area.ecclesiasticalAreaName}`}
                          </div>
                        )}
                        
                        {formatAddress(area) !== 'N/A' && (
                          <div className="text-sm text-gray-600">
                            Address: {formatAddress(area)}
                          </div>
                        )}
                        
                        {area.country && (
                          <div className="text-sm text-gray-600">
                            Country: {area.country.name} (Code: {area.country.locationCodeNumber})
                          </div>
                        )}
                        
                        {area.emailAddress && (
                          <div className="text-sm text-gray-600">Email: {area.emailAddress}</div>
                        )}
                        
                        {area.vehicleId && (
                          <div className="text-sm text-gray-600">
                            Vehicle: {area.vehicleId}
                            {area.vehicleUnitOfMeasureCode && (
                              <span className="ml-2 px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                {area.vehicleUnitOfMeasureCode}: {area.vehicleUnitOfMeasureLimit}
                              </span>
                            )}
                            {area.vehicleSTWD && (
                              <span className="ml-1 px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                                STWD
                              </span>
                            )}
                          </div>
                        )}
                        
                        {area.updatedDate && (
                          <div className="text-sm text-gray-500">
                            Updated: {formatDate(area.updatedDate)}
                          </div>
                        )}
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
                    <div className="font-medium">District ID: {entry.districtId}</div>
                    {entry.districtName && (
                      <div className="text-sm text-gray-600">{entry.districtName}</div>
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

      {!loading && !district && !error && (
        <div className="text-center py-8 text-gray-500">
          Enter a District ID to search for district details.
        </div>
      )}
    </div>
  );
}