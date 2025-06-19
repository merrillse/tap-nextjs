'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

interface MissionaryTestDataset {
  missionaryNumber: number;
  missionaryName: string;
  cmisUUID: string;
  legacyCmisId: number;
  assignmentLocationId: number;
  assignmentStatus: number;
  homeUnitNumber: number;
  membershipUnitNumber: number;
  missionaryType: number;
  statusCode: number;
  missionId: number;
  missionName: string;
  proselytingAreaId: number;
  proselytingAreaName: string;
  districtId: number;
  districtName: string;
  zoneId: number;
  zoneName: string;
  leaderCmisId: number;
  leaderName: string;
  ecclesiasticalUnitId: number;
  ecclesiasticalUnitName: string;
  ecclesiasticalUnitType: string;
  candidateUnitId: number;
}

interface SearchHistory {
  timestamp: string;
  resultsCount: number;
}

export default function MissionaryTestDataPage() {
  const [testData, setTestData] = useState<MissionaryTestDataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [sortField, setSortField] = useState<keyof MissionaryTestDataset>('missionaryName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterMission, setFilterMission] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [showOnlyWithLeaders, setShowOnlyWithLeaders] = useState(false);

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
    const savedHistory = localStorage.getItem('missionaryTestDataSearchHistory');
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
    localStorage.setItem('missionaryTestDataSearchHistory', JSON.stringify(history));
    setSearchHistory(history);
  };

  const addToSearchHistory = (resultsCount: number) => {
    const newEntry: SearchHistory = {
      timestamp: new Date().toISOString(),
      resultsCount
    };
    const updatedHistory = [newEntry, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
    saveSearchHistory(updatedHistory);
  };

  const clearSearchHistory = () => {
    localStorage.removeItem('missionaryTestDataSearchHistory');
    setSearchHistory([]);
  };

  const fetchTestData = async () => {
    if (!apiClient) {
      setError('API client not initialized. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError(null);
    setTestData([]);

    try {
      const query = `
        query MissionaryTestDataIds {
          missionaryDataIds {
            missionaryNumber
            missionaryName
            cmisUUID
            legacyCmisId
            assignmentLocationId
            assignmentStatus
            homeUnitNumber
            membershipUnitNumber
            missionaryType
            statusCode
            missionId
            missionName
            proselytingAreaId
            proselytingAreaName
            districtId
            districtName
            zoneId
            zoneName
            leaderCmisId
            leaderName
            ecclesiasticalUnitId
            ecclesiasticalUnitName
            ecclesiasticalUnitType
            candidateUnitId
          }
        }
      `;

      const response = await apiClient.executeGraphQLQuery(query);
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const data = response.data as { missionaryDataIds: MissionaryTestDataset[] };
      const testDatasets = Array.isArray(data.missionaryDataIds) ? data.missionaryDataIds : [];
      setTestData(testDatasets);
      addToSearchHistory(testDatasets.length);
      
      if (testDatasets.length === 0) {
        setError('No test data available');
      }
    } catch (err: any) {
      console.error('Error fetching test data:', err);
      setError(err.message || 'Failed to fetch missionary test data');
      addToSearchHistory(0);
    } finally {
      setLoading(false);
    }
  };

  const sortedAndFilteredData = Array.isArray(testData) ? testData
    .filter(item => {
      if (filterMission && !item.missionName?.toLowerCase().includes(filterMission.toLowerCase())) {
        return false;
      }
      if (filterType && !item.missionaryType.toString().includes(filterType)) {
        return false;
      }
      if (showOnlyWithLeaders && !item.leaderName) {
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

  const uniqueMissions = Array.from(new Set(Array.isArray(testData) ? testData.map(item => item.missionName).filter(Boolean) : []));
  const uniqueTypes = Array.from(new Set(Array.isArray(testData) ? testData.map(item => item.missionaryType).filter(Boolean) : []));

  const exportToCsv = () => {
    if (sortedAndFilteredData.length === 0) return;
    
    const headers = [
      'Missionary Number',
      'Name',
      'CMIS UUID',
      'Legacy CMIS ID',
      'Assignment Location ID',
      'Assignment Status',
      'Home Unit',
      'Membership Unit',
      'Missionary Type',
      'Status Code',
      'Mission ID',
      'Mission Name',
      'Proselyting Area ID',
      'Proselyting Area Name',
      'District ID',
      'District Name',
      'Zone ID',
      'Zone Name',
      'Leader CMIS ID',
      'Leader Name',
      'Ecclesiastical Unit ID',
      'Ecclesiastical Unit Name',
      'Ecclesiastical Unit Type',
      'Candidate Unit ID'
    ];
    
    const csvContent = [
      headers.join(','),
      ...sortedAndFilteredData.map(item => [
        item.missionaryNumber || '',
        `"${item.missionaryName || ''}"`,
        item.cmisUUID || '',
        item.legacyCmisId || '',
        item.assignmentLocationId || '',
        item.assignmentStatus || '',
        item.homeUnitNumber || '',
        item.membershipUnitNumber || '',
        item.missionaryType || '',
        item.statusCode || '',
        item.missionId || '',
        `"${item.missionName || ''}"`,
        item.proselytingAreaId || '',
        `"${item.proselytingAreaName || ''}"`,
        item.districtId || '',
        `"${item.districtName || ''}"`,
        item.zoneId || '',
        `"${item.zoneName || ''}"`,
        item.leaderCmisId || '',
        `"${item.leaderName || ''}"`,
        item.ecclesiasticalUnitId || '',
        `"${item.ecclesiasticalUnitName || ''}"`,
        `"${item.ecclesiasticalUnitType || ''}"`,
        item.candidateUnitId || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `missionary-test-data-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log(`${type} copied to clipboard: ${text}`);
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
    });
  };

  const generateTestIds = () => {
    if (!Array.isArray(testData)) {
      return {
        missionaryNumbers: [],
        cmisUUIDs: [],
        assignmentLocationIds: []
      };
    }

    const missionaryNumbers = sortedAndFilteredData.map(item => item.missionaryNumber).filter(Boolean);
    const cmisUUIDs = sortedAndFilteredData.map(item => item.cmisUUID).filter(Boolean);
    const assignmentLocationIds = sortedAndFilteredData.map(item => item.assignmentLocationId).filter(Boolean);
    
    return {
      missionaryNumbers: [...new Set(missionaryNumbers)],
      cmisUUIDs: [...new Set(cmisUUIDs)],
      assignmentLocationIds: [...new Set(assignmentLocationIds)]
    };
  };

  const testIds = generateTestIds();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Missionary Test Data</h1>
          <p className="mt-2 text-lg text-gray-600">
            Retrieve random missionary IDs and test data for API testing and development
          </p>
        </div>

        {/* Fetch Button */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Test Dataset</h3>
              <p className="text-sm text-gray-600">
                Fetch a random set of missionary IDs and associated data for testing purposes
              </p>
            </div>
            <button
              onClick={fetchTestData}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Fetching...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Generate Test Data
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Fetches</h3>
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
                    <span className="text-sm font-medium text-gray-900">
                      Data Fetch
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.resultsCount > 0
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.resultsCount} records
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
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
                <h3 className="text-sm font-medium text-red-800">Fetch Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Test IDs Section */}
        {testData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">🔧 Quick Test IDs</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Missionary Numbers */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Missionary Numbers ({testIds.missionaryNumbers.length})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {testIds.missionaryNumbers.slice(0, 10).map((id, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded text-sm">
                      <span className="font-mono text-blue-800">{id}</span>
                      <button
                        onClick={() => copyToClipboard(id.toString(), 'Missionary Number')}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
                {testIds.missionaryNumbers.length > 10 && (
                  <p className="text-xs text-blue-600 mt-2">
                    +{testIds.missionaryNumbers.length - 10} more available
                  </p>
                )}
              </div>

              {/* CMIS UUIDs */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">
                  CMIS UUIDs ({testIds.cmisUUIDs.length})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {testIds.cmisUUIDs.slice(0, 5).map((id, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded text-sm">
                      <span className="font-mono text-green-800 truncate pr-2">{id}</span>
                      <button
                        onClick={() => copyToClipboard(id, 'CMIS UUID')}
                        className="text-green-600 hover:text-green-800 text-xs flex-shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
                {testIds.cmisUUIDs.length > 5 && (
                  <p className="text-xs text-green-600 mt-2">
                    +{testIds.cmisUUIDs.length - 5} more available
                  </p>
                )}
              </div>

              {/* Assignment Location IDs */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2">
                  Assignment Location IDs ({testIds.assignmentLocationIds.length})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {testIds.assignmentLocationIds.slice(0, 10).map((id, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded text-sm">
                      <span className="font-mono text-purple-800">{id}</span>
                      <button
                        onClick={() => copyToClipboard(id.toString(), 'Assignment Location ID')}
                        className="text-purple-600 hover:text-purple-800 text-xs"
                      >
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
                {testIds.assignmentLocationIds.length > 10 && (
                  <p className="text-xs text-purple-600 mt-2">
                    +{testIds.assignmentLocationIds.length - 10} more available
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {testData.length > 0 && (
          <>
            {/* Results Summary and Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Test Dataset: {sortedAndFilteredData.length} records
                  </h2>
                  <p className="text-gray-600">Random missionary data for API testing</p>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  {/* Mission Filter */}
                  <select
                    value={filterMission}
                    onChange={(e) => setFilterMission(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Missions</option>
                    {uniqueMissions.map(mission => (
                      <option key={mission} value={mission}>
                        {mission}
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
                      <option key={type} value={type.toString()}>
                        Type {type}
                      </option>
                    ))}
                  </select>

                  {/* Leader Filter */}
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showOnlyWithLeaders}
                      onChange={(e) => setShowOnlyWithLeaders(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Has Leader</span>
                  </label>

                  {/* Sort Controls */}
                  <select
                    value={`${sortField}-${sortDirection}`}
                    onChange={(e) => {
                      const [field, direction] = e.target.value.split('-');
                      setSortField(field as keyof MissionaryTestDataset);
                      setSortDirection(direction as 'asc' | 'desc');
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="missionaryName-asc">Name (A-Z)</option>
                    <option value="missionaryName-desc">Name (Z-A)</option>
                    <option value="missionaryNumber-asc">Number (Low-High)</option>
                    <option value="missionaryNumber-desc">Number (High-Low)</option>
                    <option value="missionName-asc">Mission (A-Z)</option>
                    <option value="missionName-desc">Mission (Z-A)</option>
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
                        Missionary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IDs
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mission Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Organizational Structure
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Leader & Units
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedAndFilteredData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {/* Missionary Info */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.missionaryName || 'Unknown Name'}
                            </div>
                            <div className="text-sm text-gray-500">
                              #{item.missionaryNumber}
                            </div>
                            <div className="text-xs text-gray-400">
                              Type: {item.missionaryType} | Status: {item.statusCode}
                            </div>
                          </div>
                        </td>

                        {/* IDs */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">CMIS:</span>
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                {item.cmisUUID || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">Legacy:</span>
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                {item.legacyCmisId || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">Assign:</span>
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                {item.assignmentLocationId || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Mission Info */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.missionName || 'Unknown Mission'}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {item.missionId}
                            </div>
                            <div className="text-xs text-gray-400">
                              Assignment Status: {item.assignmentStatus}
                            </div>
                          </div>
                        </td>

                        {/* Organizational Structure */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="space-y-1">
                            {item.zoneName && (
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-600">🗺️</span>
                                <span>{item.zoneName} ({item.zoneId})</span>
                              </div>
                            )}
                            {item.districtName && (
                              <div className="flex items-center space-x-2">
                                <span className="text-green-600">🏘️</span>
                                <span>{item.districtName} ({item.districtId})</span>
                              </div>
                            )}
                            {item.proselytingAreaName && (
                              <div className="flex items-center space-x-2">
                                <span className="text-purple-600">📍</span>
                                <span>{item.proselytingAreaName} ({item.proselytingAreaId})</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Leader & Units */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="space-y-1">
                            {item.leaderName && (
                              <div className="flex items-center space-x-2">
                                <span className="text-orange-600">👔</span>
                                <span>{item.leaderName}</span>
                              </div>
                            )}
                            {item.ecclesiasticalUnitName && (
                              <div className="flex items-center space-x-2">
                                <span className="text-indigo-600">🏛️</span>
                                <span>{item.ecclesiasticalUnitName} ({item.ecclesiasticalUnitType})</span>
                              </div>
                            )}
                            <div className="text-xs text-gray-400 space-y-1">
                              <div>Home Unit: {item.homeUnitNumber}</div>
                              <div>Member Unit: {item.membershipUnitNumber}</div>
                            </div>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Dataset Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    {Array.isArray(testData) ? testData.length : 0}
                  </div>
                  <div className="text-sm text-blue-700">Total Records</div>
                </div>
                <div className="bg-green-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">
                    {uniqueMissions.length}
                  </div>
                  <div className="text-sm text-green-700">Unique Missions</div>
                </div>
                <div className="bg-purple-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-900">
                    {Array.isArray(testData) ? testData.filter(item => item.leaderName).length : 0}
                  </div>
                  <div className="text-sm text-purple-700">With Leaders</div>
                </div>
                <div className="bg-orange-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-900">
                    {uniqueTypes.length}
                  </div>
                  <div className="text-sm text-orange-700">Missionary Types</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">💡 How to Use Missionary Test Data</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• Click "Generate Test Data" to fetch a random set of missionary IDs and related information</p>
            <p>• Use the "Quick Test IDs" section to copy specific IDs for testing other API endpoints</p>
            <p>• Filter data by mission, missionary type, or presence of leader information</p>
            <p>• Sort results by name, missionary number, or mission name</p>
            <p>• Export filtered data to CSV for external testing tools or documentation</p>
            <p>• This data is specifically designed for API testing and development purposes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
