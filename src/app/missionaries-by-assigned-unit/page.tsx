'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

interface Option {
  value: string;
  label: string;
}

interface Assignment {
  id: string;
  assignmentStartDate: string;
  assignmentEndDate: string;
  assignmentType: Option;
  assignmentStatus: Option;
}

interface Missionary {
  missionaryNumber: number;
  cmisUUID: string;
  id: string;
  legacyCmisId: number;
  recommendFirstName: string;
  recommendMiddleName: string;
  recommendLastName: string;
  birthDate: string;
  emailAddress: string;
  proselytingEmailAddress: string;
  homeUnitNumber: number;
  membershipUnitNumber: number;
  missionaryStatus: Option;
  startDate: string;
  releaseDate: string;
  infieldDate: string;
  missionaryType: Option;
  gender: Option;
  callLetterLanguage: Option;
  anniversaryDate: string;
  mobilePhone: string;
  homePhone: string;
  primaryMissionary: boolean;
  readyToTravel: boolean;
  callAccepted: boolean;
  homeAirport: string;
  assignments: Assignment[];
}

interface SearchHistory {
  timestamp: string;
  unitId: string;
  resultsCount: number;
}

export default function MissionariesByAssignedUnitPage() {
  const [missionaries, setMissionaries] = useState<Missionary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  
  // Search form state
  const [unitId, setUnitId] = useState<string>('');

  // Filtering and sorting
  const [sortField, setSortField] = useState<keyof Missionary>('recommendLastName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterGender, setFilterGender] = useState<string>('');
  const [showOnlyActive, setShowOnlyActive] = useState(false);

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
    const savedHistory = localStorage.getItem('missionariesByAssignedUnitSearchHistory');
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
    localStorage.setItem('missionariesByAssignedUnitSearchHistory', JSON.stringify(history));
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
    localStorage.removeItem('missionariesByAssignedUnitSearchHistory');
    setSearchHistory([]);
  };

  const searchMissionariesByUnit = async () => {
    if (!apiClient) {
      setError('API client not initialized. Please refresh the page.');
      return;
    }

    if (!unitId.trim()) {
      setError('Please provide a Unit ID to search for missionaries.');
      return;
    }

    setLoading(true);
    setError(null);
    setMissionaries([]);

    try {
      const query = `
        query MissionariesByAssignedUnit($unitId: ID!) {
          missionariesByAssignedUnit(unitId: $unitId) {
            missionaryNumber
            cmisUUID
            id
            legacyCmisId
            recommendFirstName
            recommendMiddleName
            recommendLastName
            birthDate
            emailAddress
            proselytingEmailAddress
            homeUnitNumber
            membershipUnitNumber
            missionaryStatus {
              value
              label
            }
            startDate
            releaseDate
            infieldDate
            missionaryType {
              value
              label
            }
            gender {
              value
              label
            }
            callLetterLanguage {
              value
              label
            }
            anniversaryDate
            mobilePhone
            homePhone
            primaryMissionary
            readyToTravel
            callAccepted
            homeAirport
            assignments(input: {}) {
              id
              assignmentStartDate
              assignmentEndDate
              assignmentType {
                value
                label
              }
              assignmentStatus {
                value
                label
              }
            }
          }
        }
      `;

      const response = await apiClient.executeGraphQLQuery(query, { unitId: unitId.trim() });
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const data = response.data as { missionariesByAssignedUnit: Missionary[] };
      const missionaryList = Array.isArray(data.missionariesByAssignedUnit) ? data.missionariesByAssignedUnit : [];
      setMissionaries(missionaryList);
      addToSearchHistory(unitId.trim(), missionaryList.length);
      
      if (missionaryList.length === 0) {
        setError(`No missionaries found for unit ID: ${unitId.trim()}`);
      }
    } catch (err: any) {
      console.error('Error searching missionaries by unit:', err);
      setError(err.message || 'Failed to search missionaries by assigned unit');
      addToSearchHistory(unitId.trim(), 0);
    } finally {
      setLoading(false);
    }
  };

  const sortedAndFilteredMissionaries = Array.isArray(missionaries) ? missionaries
    .filter(missionary => {
      if (filterStatus && missionary.missionaryStatus?.label !== filterStatus) {
        return false;
      }
      if (filterType && missionary.missionaryType?.label !== filterType) {
        return false;
      }
      if (filterGender && missionary.gender?.label !== filterGender) {
        return false;
      }
      if (showOnlyActive && !missionary.assignments?.some(a => !a.assignmentEndDate)) {
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
      
      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        return sortDirection === 'asc' ? (aValue ? 1 : -1) : (bValue ? 1 : -1);
      }
      
      return 0;
    }) : [];

  const uniqueStatuses = Array.from(new Set(Array.isArray(missionaries) ? missionaries.map(m => m.missionaryStatus?.label).filter(Boolean) : []));
  const uniqueTypes = Array.from(new Set(Array.isArray(missionaries) ? missionaries.map(m => m.missionaryType?.label).filter(Boolean) : []));
  const uniqueGenders = Array.from(new Set(Array.isArray(missionaries) ? missionaries.map(m => m.gender?.label).filter(Boolean) : []));

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getFullName = (missionary: Missionary) => {
    const parts = [
      missionary.recommendFirstName,
      missionary.recommendMiddleName,
      missionary.recommendLastName
    ].filter(Boolean);
    return parts.join(' ') || 'Unknown Name';
  };

  const exportToCsv = () => {
    if (sortedAndFilteredMissionaries.length === 0) return;
    
    const headers = [
      'Missionary Number',
      'Name',
      'CMIS UUID',
      'Legacy CMIS ID',
      'Birth Date',
      'Email',
      'Proselyting Email',
      'Home Unit',
      'Membership Unit',
      'Status',
      'Type',
      'Gender',
      'Start Date',
      'Release Date',
      'In Field Date',
      'Mobile Phone',
      'Home Phone',
      'Primary Missionary',
      'Ready to Travel',
      'Call Accepted',
      'Home Airport',
      'Active Assignments'
    ];
    
    const csvContent = [
      headers.join(','),
      ...sortedAndFilteredMissionaries.map(missionary => [
        missionary.missionaryNumber || '',
        `"${getFullName(missionary)}"`,
        missionary.cmisUUID || '',
        missionary.legacyCmisId || '',
        formatDate(missionary.birthDate),
        `"${missionary.emailAddress || ''}"`,
        `"${missionary.proselytingEmailAddress || ''}"`,
        missionary.homeUnitNumber || '',
        missionary.membershipUnitNumber || '',
        `"${missionary.missionaryStatus?.label || ''}"`,
        `"${missionary.missionaryType?.label || ''}"`,
        `"${missionary.gender?.label || ''}"`,
        formatDate(missionary.startDate),
        formatDate(missionary.releaseDate),
        formatDate(missionary.infieldDate),
        `"${missionary.mobilePhone || ''}"`,
        `"${missionary.homePhone || ''}"`,
        missionary.primaryMissionary ? 'Yes' : 'No',
        missionary.readyToTravel ? 'Yes' : 'No',
        missionary.callAccepted ? 'Yes' : 'No',
        `"${missionary.homeAirport || ''}"`,
        missionary.assignments?.filter(a => !a.assignmentEndDate).length || 0
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `missionaries-by-unit-${unitId}-${new Date().toISOString().split('T')[0]}.csv`);
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
      searchMissionariesByUnit();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Missionaries by Assigned Unit</h1>
          <p className="mt-2 text-lg text-gray-600">
            Find all missionaries assigned to a specific unit by Unit ID
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
                Enter the unit ID to find all missionaries assigned to that unit
              </p>
            </div>

            <div className="flex items-end">
              <button
                onClick={searchMissionariesByUnit}
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
                    Search Missionaries
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
                      {item.resultsCount} missionaries
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
        {missionaries.length > 0 && (
          <>
            {/* Results Summary and Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Missionaries for Unit {unitId}: {sortedAndFilteredMissionaries.length} results
                  </h2>
                  <p className="text-gray-600">Missionaries assigned to unit ID {unitId}</p>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    {uniqueStatuses.map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  {/* Type Filter */}
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    {uniqueTypes.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  {/* Gender Filter */}
                  <select
                    value={filterGender}
                    onChange={(e) => setFilterGender(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Genders</option>
                    {uniqueGenders.map(gender => (
                      <option key={gender} value={gender}>
                        {gender}
                      </option>
                    ))}
                  </select>

                  {/* Active Assignment Filter */}
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showOnlyActive}
                      onChange={(e) => setShowOnlyActive(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Active Assignments Only</span>
                  </label>

                  {/* Sort Controls */}
                  <select
                    value={`${sortField}-${sortDirection}`}
                    onChange={(e) => {
                      const [field, direction] = e.target.value.split('-');
                      setSortField(field as keyof Missionary);
                      setSortDirection(direction as 'asc' | 'desc');
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="recommendLastName-asc">Last Name (A-Z)</option>
                    <option value="recommendLastName-desc">Last Name (Z-A)</option>
                    <option value="recommendFirstName-asc">First Name (A-Z)</option>
                    <option value="recommendFirstName-desc">First Name (Z-A)</option>
                    <option value="missionaryNumber-asc">Number (Low-High)</option>
                    <option value="missionaryNumber-desc">Number (High-Low)</option>
                    <option value="startDate-desc">Start Date (Newest)</option>
                    <option value="startDate-asc">Start Date (Oldest)</option>
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

            {/* Data Grid */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Missionary Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact & IDs
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service Dates
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Units & Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assignments
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedAndFilteredMissionaries.map((missionary, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {/* Missionary Info */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getFullName(missionary)}
                            </div>
                            <div className="text-sm text-gray-500">
                              #{missionary.missionaryNumber}
                            </div>
                            <div className="text-xs text-gray-400">
                              {missionary.gender?.label} | {missionary.missionaryType?.label}
                            </div>
                            <div className="text-xs text-gray-400">
                              Born: {formatDate(missionary.birthDate)}
                            </div>
                          </div>
                        </td>

                        {/* Contact & IDs */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">CMIS:</span>
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                {missionary.cmisUUID || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">Legacy:</span>
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                {missionary.legacyCmisId || 'N/A'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-700">
                              📧 {missionary.emailAddress || 'No email'}
                            </div>
                            <div className="text-xs text-gray-700">
                              📱 {missionary.mobilePhone || 'No mobile'}
                            </div>
                          </div>
                        </td>

                        {/* Service Dates */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">Start:</span>
                              <span className="font-mono text-xs bg-green-100 px-2 py-1 rounded">
                                {formatDate(missionary.startDate)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">Field:</span>
                              <span className="font-mono text-xs bg-blue-100 px-2 py-1 rounded">
                                {formatDate(missionary.infieldDate)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">Release:</span>
                              <span className="font-mono text-xs bg-purple-100 px-2 py-1 rounded">
                                {formatDate(missionary.releaseDate)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Units & Status */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="space-y-1">
                            <div className="text-gray-700">
                              Home Unit: {missionary.homeUnitNumber}
                            </div>
                            <div className="text-gray-700">
                              Member Unit: {missionary.membershipUnitNumber}
                            </div>
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                missionary.missionaryStatus?.label === 'Active'
                                  ? 'bg-green-100 text-green-800'
                                  : missionary.missionaryStatus?.label === 'Released'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {missionary.missionaryStatus?.label || 'Unknown'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>✈️ {missionary.readyToTravel ? 'Ready' : 'Not Ready'}</div>
                              <div>📞 {missionary.callAccepted ? 'Accepted' : 'Not Accepted'}</div>
                            </div>
                          </div>
                        </td>

                        {/* Assignments */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {missionary.assignments && missionary.assignments.length > 0 ? (
                              missionary.assignments.slice(0, 3).map((assignment, assignmentIndex) => (
                                <div key={assignmentIndex} className="bg-gray-50 p-2 rounded text-xs">
                                  <div className="font-medium text-gray-900">
                                    {assignment.assignmentType?.label || 'Unknown Type'}
                                  </div>
                                  <div className="text-gray-500">
                                    {formatDate(assignment.assignmentStartDate)} - {
                                      assignment.assignmentEndDate ? formatDate(assignment.assignmentEndDate) : 'Current'
                                    }
                                  </div>
                                  <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                    assignment.assignmentStatus?.label === 'Active'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {assignment.assignmentStatus?.label || 'Unknown'}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-gray-400 italic">
                                No assignments available
                              </div>
                            )}
                            {missionary.assignments && missionary.assignments.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{missionary.assignments.length - 3} more assignments
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Unit Summary Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    {Array.isArray(missionaries) ? missionaries.length : 0}
                  </div>
                  <div className="text-sm text-blue-700">Total Missionaries</div>
                </div>
                <div className="bg-green-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">
                    {Array.isArray(missionaries) ? missionaries.filter(m => m.assignments?.some(a => !a.assignmentEndDate)).length : 0}
                  </div>
                  <div className="text-sm text-green-700">Active Assignments</div>
                </div>
                <div className="bg-purple-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-900">
                    {uniqueTypes.length}
                  </div>
                  <div className="text-sm text-purple-700">Missionary Types</div>
                </div>
                <div className="bg-orange-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-900">
                    {Array.isArray(missionaries) ? missionaries.filter(m => m.readyToTravel).length : 0}
                  </div>
                  <div className="text-sm text-orange-700">Ready to Travel</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">💡 How to Use Missionaries by Assigned Unit Search</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• <strong>Unit ID:</strong> Enter the specific unit ID to find all missionaries assigned to that unit</p>
            <p>• <strong>Comprehensive Data:</strong> View detailed missionary profiles including contact info, service dates, and assignments</p>
            <p>• <strong>Filter Results:</strong> Use status, type, gender, and active assignment filters to narrow results</p>
            <p>• <strong>Sort Options:</strong> Sort by name, missionary number, or service dates</p>
            <p>• <strong>Export Data:</strong> Export filtered results to CSV for external analysis</p>
            <p>• <strong>Search History:</strong> Easily repeat previous searches with the search history feature</p>
          </div>
        </div>
      </div>
    </div>
  );
}
