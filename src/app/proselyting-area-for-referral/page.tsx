'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

interface GeopoliticalLocation {
  geopoliticalLocationId: string;
  locationCodeNumber: number;
  commonName: string;
  concatenatedName: string;
  officialName: string;
  abbreviatedName: string;
}

interface District {
  id: string;
  name: string;
  zone?: {
    id: string;
    name: string;
    mission?: {
      id: string;
      name: string;
    };
  };
}

interface EcclesiasticalUnit {
  id: string;
  name: string;
  missionaryDeptUnitId: number;
  type: string;
  cdolUnitTypeId: number;
}

interface Assignment {
  id: string;
  assignmentStartDate: string;
  assignmentEndDate: string;
  missionary: {
    missionaryNumber: number;
    recommendFirstName: string;
    recommendLastName: string;
  };
}

interface ProselytingAreaPhone {
  id: string;
  phoneNumber: string;
  primary: boolean;
}

interface ProselytingArea {
  id: string;
  name: string;
  district: District;
  address: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: GeopoliticalLocation;
  vehicleId: string;
  vehicleUnitOfMeasureCode: string;
  vehicleUnitOfMeasureLimit: number;
  vehicleSTWD: boolean;
  emailAddress: string;
  updatedDate: string;
  ecclesiasticalUnitsList: string;
  ecclesiasticalUnits: EcclesiasticalUnit[];
  activeAssignments: Assignment[];
  proselytingAreaPhones: ProselytingAreaPhone[];
  ecclesiasticalAreaNumber: number;
  ecclesiasticalAreaName: string;
}

interface SearchHistory {
  timestamp: string;
  unitId: string;
  resultsCount: number;
}

export default function ProselytingAreaForReferralPage() {
  const [proselytingAreas, setProselytingAreas] = useState<ProselytingArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  
  // Search form state
  const [unitId, setUnitId] = useState<string>('');

  // Filtering and sorting
  const [sortField, setSortField] = useState<keyof ProselytingArea>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterCountry, setFilterCountry] = useState<string>('');
  const [filterState, setFilterState] = useState<string>('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Initialize API client
  useEffect(() => {
    const selectedEnvironment = localStorage.getItem('selectedEnvironment') || 'development';
    const config = ENVIRONMENTS[selectedEnvironment as keyof typeof ENVIRONMENTS];
    
    if (config) {
      setApiClient(new ApiClient(config, selectedEnvironment));
    }
  }, []);

  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('proselytingAreaForReferralSearchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse search history:', e);
      }
    }
  }, []);

  // Save search history to localStorage
  const saveSearchHistory = (history: SearchHistory[]) => {
    localStorage.setItem('proselytingAreaForReferralSearchHistory', JSON.stringify(history));
    setSearchHistory(history);
  };

  const addToSearchHistory = (unitId: string, resultsCount: number) => {
    const newEntry: SearchHistory = {
      timestamp: new Date().toISOString(),
      unitId,
      resultsCount
    };
    const updatedHistory = [newEntry, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
    saveSearchHistory(updatedHistory);
  };

  const clearSearchHistory = () => {
    localStorage.removeItem('proselytingAreaForReferralSearchHistory');
    setSearchHistory([]);
  };

  const searchProselytingAreaForReferral = async () => {
    if (!apiClient) {
      setError('API client not initialized. Please refresh the page.');
      return;
    }

    if (!unitId.trim()) {
      setError('Please provide a Unit ID to search for proselyting areas.');
      return;
    }

    setLoading(true);
    setError(null);
    setProselytingAreas([]);

    try {
      const query = `
        query ProselytingAreaForReferral($id: ID) {
          proselytingAreaForReferral(id: $id) {
            id
            name
            district {
              id
              name
              zone {
                id
                name
                mission {
                  id
                  name
                }
              }
            }
            address
            city
            stateProvince
            postalCode
            country {
              geopoliticalLocationId
              locationCodeNumber
              commonName
              concatenatedName
              officialName
              abbreviatedName
            }
            vehicleId
            vehicleUnitOfMeasureCode
            vehicleUnitOfMeasureLimit
            vehicleSTWD
            emailAddress
            updatedDate
            ecclesiasticalUnitsList
            ecclesiasticalUnits {
              id
              name
              missionaryDeptUnitId
              type
              cdolUnitTypeId
            }
            activeAssignments {
              id
              assignmentStartDate
              assignmentEndDate
              missionary {
                missionaryNumber
                recommendFirstName
                recommendLastName
              }
            }
            proselytingAreaPhones {
              id
              phoneNumber
              primary
            }
            ecclesiasticalAreaNumber
            ecclesiasticalAreaName
          }
        }
      `;

      const response = await apiClient.executeGraphQLQuery(query, { id: unitId.trim() });
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const data = response.data as { proselytingAreaForReferral: ProselytingArea[] };
      const areaList = Array.isArray(data.proselytingAreaForReferral) ? data.proselytingAreaForReferral : [];
      setProselytingAreas(areaList);
      addToSearchHistory(unitId.trim(), areaList.length);
      
      if (areaList.length === 0) {
        setError(`No proselyting areas found for referrals to unit ID: ${unitId.trim()}`);
      }
    } catch (err: any) {
      console.error('Error searching proselyting areas for referral:', err);
      setError(err.message || 'Failed to search proselyting areas for referral');
      addToSearchHistory(unitId.trim(), 0);
    } finally {
      setLoading(false);
    }
  };

  const sortedAndFilteredAreas = Array.isArray(proselytingAreas) ? proselytingAreas
    .filter(area => {
      if (filterCountry && area.country?.commonName !== filterCountry) {
        return false;
      }
      if (filterState && area.stateProvince !== filterState) {
        return false;
      }
      if (showActiveOnly && (!area.activeAssignments || area.activeAssignments.length === 0)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const aStr = aValue.toLowerCase();
        const bStr = bValue.toLowerCase();
        return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    }) : [];

  const uniqueCountries = Array.from(new Set(Array.isArray(proselytingAreas) ? proselytingAreas.map(a => a.country?.commonName).filter(Boolean) : []));
  const uniqueStates = Array.from(new Set(Array.isArray(proselytingAreas) ? proselytingAreas.map(a => a.stateProvince).filter(Boolean) : []));

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getFullAddress = (area: ProselytingArea) => {
    const parts = [
      area.address,
      area.city,
      area.stateProvince,
      area.postalCode,
      area.country?.commonName
    ].filter(Boolean);
    return parts.join(', ') || 'No address available';
  };

  const exportToCsv = () => {
    if (sortedAndFilteredAreas.length === 0) return;
    
    const headers = [
      'Area ID',
      'Area Name',
      'District',
      'Zone',
      'Mission',
      'Address',
      'City',
      'State/Province',
      'Postal Code',
      'Country',
      'Email',
      'Vehicle ID',
      'Vehicle Limit',
      'STWD',
      'Active Assignments',
      'Phone Numbers',
      'Ecclesiastical Units',
      'Last Updated'
    ];
    
    const csvContent = [
      headers.join(','),
      ...sortedAndFilteredAreas.map(area => [
        `"${area.id || ''}"`,
        `"${area.name || ''}"`,
        `"${area.district?.name || ''}"`,
        `"${area.district?.zone?.name || ''}"`,
        `"${area.district?.zone?.mission?.name || ''}"`,
        `"${area.address || ''}"`,
        `"${area.city || ''}"`,
        `"${area.stateProvince || ''}"`,
        `"${area.postalCode || ''}"`,
        `"${area.country?.commonName || ''}"`,
        `"${area.emailAddress || ''}"`,
        `"${area.vehicleId || ''}"`,
        area.vehicleUnitOfMeasureLimit || '',
        area.vehicleSTWD ? 'Yes' : 'No',
        area.activeAssignments?.length || 0,
        `"${area.proselytingAreaPhones?.map(p => `${p.phoneNumber}${p.primary ? ' (Primary)' : ''}`).join('; ') || ''}"`,
        area.ecclesiasticalUnits?.length || 0,
        formatDate(area.updatedDate)
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `proselyting-areas-referral-${unitId}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const repeatSearch = (historyItem: SearchHistory) => {
    setUnitId(historyItem.unitId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchProselytingAreaForReferral();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Proselyting Area for Referral</h1>
          <p className="mt-2 text-lg text-gray-600">
            Find proselyting areas configured to receive referrals for a specific unit
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Search Parameters</h3>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="unitId" className="block text-sm font-medium text-gray-700 mb-2">
                Unit ID <span className="text-red-500">*</span>
              </label>
              <input
                id="unitId"
                type="text"
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter unit ID (e.g., 12345)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the unit ID to find proselyting areas configured to receive referrals for that unit
              </p>
            </div>

            <div className="flex items-end">
              <button
                onClick={searchProselytingAreaForReferral}
                disabled={loading || !unitId.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search Areas
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Search History</h3>
              <button
                onClick={clearSearchHistory}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear History
              </button>
            </div>
            <div className="space-y-2">
              {searchHistory.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        Unit ID: <span className="text-blue-600">{item.unitId}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.resultsCount > 0
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.resultsCount} areas
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                    <button
                      onClick={() => repeatSearch(item)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Repeat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Search Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {proselytingAreas.length > 0 && (
          <>
            {/* Results Summary and Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Referral Areas for Unit {unitId}: {sortedAndFilteredAreas.length} results
                  </h2>
                  <p className="text-gray-600">Proselyting areas configured to receive referrals for unit {unitId}</p>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  {/* Country Filter */}
                  <select
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Countries</option>
                    {uniqueCountries.map(country => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>

                  {/* State Filter */}
                  <select
                    value={filterState}
                    onChange={(e) => setFilterState(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All States</option>
                    {uniqueStates.map(state => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>

                  {/* Active Only Filter */}
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showActiveOnly}
                      onChange={(e) => setShowActiveOnly(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Active Only</span>
                  </label>

                  {/* Sort Controls */}
                  <select
                    value={`${sortField}-${sortDirection}`}
                    onChange={(e) => {
                      const [field, direction] = e.target.value.split('-');
                      setSortField(field as keyof ProselytingArea);
                      setSortDirection(direction as 'asc' | 'desc');
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="city-asc">City (A-Z)</option>
                    <option value="city-desc">City (Z-A)</option>
                    <option value="stateProvince-asc">State (A-Z)</option>
                    <option value="stateProvince-desc">State (Z-A)</option>
                  </select>

                  {/* Export Button */}
                  <button
                    onClick={exportToCsv}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Areas Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {sortedAndFilteredAreas.map((area, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{area.name}</h3>
                      <p className="text-sm text-gray-500">ID: {area.id}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        {area.district?.zone?.mission?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {area.district?.zone?.name} → {area.district?.name}
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">📍 Location</h4>
                    <div className="text-sm text-gray-700">
                      {getFullAddress(area)}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">📞 Contact</h4>
                    <div className="space-y-1">
                      {area.emailAddress && (
                        <div className="text-sm text-gray-700">
                          📧 {area.emailAddress}
                        </div>
                      )}
                      {area.proselytingAreaPhones && area.proselytingAreaPhones.map((phone, idx) => (
                        <div key={idx} className="text-sm text-gray-700">
                          📱 {phone.phoneNumber}{phone.primary ? ' (Primary)' : ''}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vehicle Information */}
                  {area.vehicleId && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">🚗 Vehicle</h4>
                      <div className="text-sm text-gray-700">
                        ID: {area.vehicleId}
                        {area.vehicleUnitOfMeasureLimit && (
                          <span> • Limit: {area.vehicleUnitOfMeasureLimit} {area.vehicleUnitOfMeasureCode}</span>
                        )}
                        {area.vehicleSTWD && <span> • STWD</span>}
                      </div>
                    </div>
                  )}

                  {/* Active Assignments */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      👥 Active Assignments ({area.activeAssignments?.length || 0})
                    </h4>
                    {area.activeAssignments && area.activeAssignments.length > 0 ? (
                      <div className="space-y-1">
                        {area.activeAssignments.slice(0, 3).map((assignment, idx) => (
                          <div key={idx} className="text-sm text-gray-700">
                            #{assignment.missionary.missionaryNumber} - {assignment.missionary.recommendFirstName} {assignment.missionary.recommendLastName}
                          </div>
                        ))}
                        {area.activeAssignments.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{area.activeAssignments.length - 3} more...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No active assignments</div>
                    )}
                  </div>

                  {/* Ecclesiastical Units */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      🏛️ Ecclesiastical Units ({area.ecclesiasticalUnits?.length || 0})
                    </h4>
                    {area.ecclesiasticalUnits && area.ecclesiasticalUnits.length > 0 ? (
                      <div className="space-y-1">
                        {area.ecclesiasticalUnits.slice(0, 2).map((unit, idx) => (
                          <div key={idx} className="text-sm text-gray-700">
                            #{unit.missionaryDeptUnitId} - {unit.name} ({unit.type})
                          </div>
                        ))}
                        {area.ecclesiasticalUnits.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{area.ecclesiasticalUnits.length - 2} more units...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No ecclesiastical units</div>
                    )}
                  </div>

                  {/* Last Updated */}
                  <div className="text-xs text-gray-500 border-t border-gray-200 pt-2">
                    Last updated: {formatDate(area.updatedDate)}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Statistics */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Referral Areas Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    {Array.isArray(proselytingAreas) ? proselytingAreas.length : 0}
                  </div>
                  <div className="text-sm text-blue-700">Total Areas</div>
                </div>
                <div className="bg-green-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">
                    {Array.isArray(proselytingAreas) ? proselytingAreas.filter(a => a.activeAssignments && a.activeAssignments.length > 0).length : 0}
                  </div>
                  <div className="text-sm text-green-700">With Active Assignments</div>
                </div>
                <div className="bg-purple-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-900">
                    {uniqueCountries.length}
                  </div>
                  <div className="text-sm text-purple-700">Countries</div>
                </div>
                <div className="bg-orange-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-900">
                    {Array.isArray(proselytingAreas) ? proselytingAreas.reduce((sum, a) => sum + (a.ecclesiasticalUnits?.length || 0), 0) : 0}
                  </div>
                  <div className="text-sm text-orange-700">Total Ecclesiastical Units</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">💡 How to Use Proselyting Area for Referral Search</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• <strong>Unit ID:</strong> Enter the specific unit ID to find proselyting areas configured to receive referrals for that unit</p>
            <p>• <strong>Referral Configuration:</strong> View areas that are set up to receive and process referrals from the specified unit</p>
            <p>• <strong>Area Details:</strong> See comprehensive information including location, contact details, and current assignments</p>
            <p>• <strong>Filter Options:</strong> Filter by country, state/province, or show only areas with active assignments</p>
            <p>• <strong>Sort Capabilities:</strong> Sort by area name, city, or state for easier browsing</p>
            <p>• <strong>Export Data:</strong> Export filtered results to CSV for external analysis or reporting</p>
            <p>• <strong>Search History:</strong> Track your searches and easily repeat previous queries</p>
          </div>
        </div>
      </div>
    </div>
  );
}
