'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

interface MissionBoundaryChangeSendingMission {
  unitNumber: number;
}

interface MissionBoundaryChangeReceivingMission {
  unitName: string;
  unitId: number;
  churchUnitId: string;
}

interface Option {
  id: string;
  name: string;
  description?: string;
}

interface MissionBoundaryChange {
  availableDate: string;
  effectiveDate: string;
  finalizedDate: string;
  imosStatus: string;
  missionBoundaryAdjustmentId: string;
  name: string;
  modifiedByValue: string;
  modifiedOn: string;
  missionBoundaryChangeStateCode: Option;
  missionBoundaryChangeStatusCode: Option;
  sendingMission: MissionBoundaryChangeSendingMission;
  receivingMissions: MissionBoundaryChangeReceivingMission[];
}

interface SearchParams {
  sendingMissionUnitNumbers: string[];
  missionBoundaryAdjustmentIds: string[];
  statuses: string[];
}

interface SearchHistory {
  timestamp: string;
  params: SearchParams;
  resultsCount: number;
}

type MissionBoundaryChangeStatus = 'ACTIVE' | 'INACTIVE' | 'SENDING_TO_IMOS' | 'SENT_TO_IMOS' | 'CREATE' | 'BULK_CHANGES_CREATED';

export default function MissionBoundaryChangesPage() {
  const [changes, setChanges] = useState<MissionBoundaryChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  
  // Search form state
  const [sendingMissionUnitNumbers, setSendingMissionUnitNumbers] = useState<string>('');
  const [missionBoundaryAdjustmentIds, setMissionBoundaryAdjustmentIds] = useState<string>('');
  const [selectedStatuses, setSelectedStatuses] = useState<MissionBoundaryChangeStatus[]>([]);

  // Filtering and sorting
  const [sortField, setSortField] = useState<keyof MissionBoundaryChange>('effectiveDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterMission, setFilterMission] = useState<string>('');

  const statusOptions: MissionBoundaryChangeStatus[] = [
    'ACTIVE', 'INACTIVE', 'SENDING_TO_IMOS', 'SENT_TO_IMOS', 'CREATE', 'BULK_CHANGES_CREATED'
  ];

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
    const savedHistory = localStorage.getItem('missionBoundaryChangesSearchHistory');
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
    localStorage.setItem('missionBoundaryChangesSearchHistory', JSON.stringify(history));
    setSearchHistory(history);
  };

  const addToSearchHistory = (params: SearchParams, resultsCount: number) => {
    const newEntry: SearchHistory = {
      timestamp: new Date().toISOString(),
      params,
      resultsCount
    };
    const updatedHistory = [newEntry, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
    saveSearchHistory(updatedHistory);
  };

  const clearSearchHistory = () => {
    localStorage.removeItem('missionBoundaryChangesSearchHistory');
    setSearchHistory([]);
  };

  const parseCommaSeparatedValues = (value: string): string[] => {
    return value
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0);
  };

  const searchMissionBoundaryChanges = async () => {
    if (!apiClient) {
      setError('API client not initialized. Please refresh the page.');
      return;
    }

    // Build search parameters
    const unitNumbers = parseCommaSeparatedValues(sendingMissionUnitNumbers);
    const adjustmentIds = parseCommaSeparatedValues(missionBoundaryAdjustmentIds);

    // Validate that at least one search parameter is provided
    if (unitNumbers.length === 0 && adjustmentIds.length === 0 && selectedStatuses.length === 0) {
      setError('Please provide at least one search parameter: Mission Unit Numbers, Adjustment IDs, or Status filters.');
      return;
    }

    setLoading(true);
    setError(null);
    setChanges([]);

    try {
      // Build the input object dynamically
      const inputParts: string[] = [];
      
      if (unitNumbers.length > 0 || adjustmentIds.length > 0) {
        const idsParts: string[] = [];
        if (unitNumbers.length > 0) {
          idsParts.push(`sendingMissionUnitNumbers: [${unitNumbers.map(id => `"${id}"`).join(', ')}]`);
        }
        if (adjustmentIds.length > 0) {
          idsParts.push(`missionBoundaryAdjustmentIds: [${adjustmentIds.map(id => `"${id}"`).join(', ')}]`);
        }
        inputParts.push(`ids: { ${idsParts.join(', ')} }`);
      }

      if (selectedStatuses.length > 0) {
        inputParts.push(`filters: { statuses: [${selectedStatuses.join(', ')}] }`);
      }

      const inputString = inputParts.length > 0 ? `input: { ${inputParts.join(', ')} }` : '';

      const query = `
        query MissionBoundaryChanges {
          missionBoundaryChanges(${inputString}) {
            availableDate
            effectiveDate
            finalizedDate
            imosStatus
            missionBoundaryAdjustmentId
            name
            modifiedByValue
            modifiedOn
            missionBoundaryChangeStateCode {
              id
              name
              description
            }
            missionBoundaryChangeStatusCode {
              id
              name
              description
            }
            sendingMission {
              unitNumber
            }
            receivingMissions {
              unitName
              unitId
              churchUnitId
            }
          }
        }
      `;

      const response = await apiClient.executeGraphQLQuery(query);
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const data = response.data as { missionBoundaryChanges: MissionBoundaryChange[] };
      const boundaryChanges = Array.isArray(data.missionBoundaryChanges) ? data.missionBoundaryChanges : [];
      setChanges(boundaryChanges);
      
      const searchParams: SearchParams = {
        sendingMissionUnitNumbers: unitNumbers,
        missionBoundaryAdjustmentIds: adjustmentIds,
        statuses: selectedStatuses
      };
      addToSearchHistory(searchParams, boundaryChanges.length);
      
      if (boundaryChanges.length === 0) {
        setError('No mission boundary changes found matching your criteria');
      }
    } catch (err: any) {
      console.error('Error searching mission boundary changes:', err);
      setError(err.message || 'Failed to search mission boundary changes');
      const searchParams: SearchParams = {
        sendingMissionUnitNumbers: parseCommaSeparatedValues(sendingMissionUnitNumbers),
        missionBoundaryAdjustmentIds: parseCommaSeparatedValues(missionBoundaryAdjustmentIds),
        statuses: selectedStatuses
      };
      addToSearchHistory(searchParams, 0);
    } finally {
      setLoading(false);
    }
  };

  const sortedAndFilteredChanges = Array.isArray(changes) ? changes
    .filter(change => {
      if (filterStatus && change.missionBoundaryChangeStatusCode?.name !== filterStatus) {
        return false;
      }
      if (filterMission && !change.name?.toLowerCase().includes(filterMission.toLowerCase())) {
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

  const uniqueStatuses = Array.from(new Set(Array.isArray(changes) ? changes.map(change => change.missionBoundaryChangeStatusCode?.name).filter(Boolean) : []));

  const handleStatusChange = (status: MissionBoundaryChangeStatus, checked: boolean) => {
    if (checked) {
      setSelectedStatuses([...selectedStatuses, status]);
    } else {
      setSelectedStatuses(selectedStatuses.filter(s => s !== status));
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const exportToCsv = () => {
    if (sortedAndFilteredChanges.length === 0) return;
    
    const headers = [
      'Adjustment ID',
      'Name',
      'Available Date',
      'Effective Date',
      'Finalized Date',
      'IMOS Status',
      'State Code',
      'Status Code',
      'Sending Mission Unit',
      'Receiving Missions',
      'Modified By',
      'Modified On'
    ];
    
    const csvContent = [
      headers.join(','),
      ...sortedAndFilteredChanges.map(change => [
        `"${change.missionBoundaryAdjustmentId || ''}"`,
        `"${change.name || ''}"`,
        formatDate(change.availableDate),
        formatDate(change.effectiveDate),
        formatDate(change.finalizedDate),
        `"${change.imosStatus || ''}"`,
        `"${change.missionBoundaryChangeStateCode?.name || ''}"`,
        `"${change.missionBoundaryChangeStatusCode?.name || ''}"`,
        change.sendingMission?.unitNumber || '',
        `"${change.receivingMissions?.map(m => `${m.unitName} (${m.unitId})`).join('; ') || ''}"`,
        `"${change.modifiedByValue || ''}"`,
        formatDate(change.modifiedOn)
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mission-boundary-changes-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const repeatSearch = (historyItem: SearchHistory) => {
    setSendingMissionUnitNumbers(historyItem.params.sendingMissionUnitNumbers.join(', '));
    setMissionBoundaryAdjustmentIds(historyItem.params.missionBoundaryAdjustmentIds.join(', '));
    setSelectedStatuses(historyItem.params.statuses as MissionBoundaryChangeStatus[]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mission Boundary Changes</h1>
          <p className="mt-2 text-lg text-gray-600">
            Search mission boundary adjustments and changes from IMOS system
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Search Parameters</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mission Unit Numbers */}
            <div>
              <label htmlFor="sendingMissionUnitNumbers" className="block text-sm font-medium text-gray-700 mb-2">
                Sending Mission Unit Numbers
              </label>
              <textarea
                id="sendingMissionUnitNumbers"
                value={sendingMissionUnitNumbers}
                onChange={(e) => setSendingMissionUnitNumbers(e.target.value)}
                placeholder="Enter mission unit numbers separated by commas&#10;Example: 12345, 67890"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <p className="mt-1 text-xs text-gray-500">
                Comma-separated list of mission unit numbers
              </p>
            </div>

            {/* Adjustment IDs */}
            <div>
              <label htmlFor="missionBoundaryAdjustmentIds" className="block text-sm font-medium text-gray-700 mb-2">
                Mission Boundary Adjustment IDs
              </label>
              <textarea
                id="missionBoundaryAdjustmentIds"
                value={missionBoundaryAdjustmentIds}
                onChange={(e) => setMissionBoundaryAdjustmentIds(e.target.value)}
                placeholder="Enter adjustment IDs separated by commas&#10;Example: 123-xxx-xxx-xxx-abc, 23434234"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <p className="mt-1 text-xs text-gray-500">
                Comma-separated list of boundary adjustment IDs
              </p>
            </div>
          </div>

          {/* Status Filters */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Status Filters (Optional)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {statusOptions.map(status => (
                <label key={status} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={(e) => handleStatusChange(status, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{status.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Search Button */}
          <div className="mt-6">
            <button
              onClick={searchMissionBoundaryChanges}
              disabled={loading}
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
                  Search Boundary Changes
                </>
              )}
            </button>
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
                        {item.params.sendingMissionUnitNumbers.length > 0 && (
                          <span className="text-blue-600">Units: {item.params.sendingMissionUnitNumbers.slice(0, 2).join(', ')}{item.params.sendingMissionUnitNumbers.length > 2 ? '...' : ''}</span>
                        )}
                        {item.params.missionBoundaryAdjustmentIds.length > 0 && (
                          <span className="text-green-600 ml-2">IDs: {item.params.missionBoundaryAdjustmentIds.slice(0, 1).join(', ')}{item.params.missionBoundaryAdjustmentIds.length > 1 ? '...' : ''}</span>
                        )}
                        {item.params.statuses.length > 0 && (
                          <span className="text-purple-600 ml-2">Status: {item.params.statuses.join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.resultsCount > 0
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.resultsCount} results
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
        {changes.length > 0 && (
          <>
            {/* Results Summary and Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Mission Boundary Changes: {sortedAndFilteredChanges.length} results
                  </h2>
                  <p className="text-gray-600">IMOS mission boundary adjustment records</p>
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

                  {/* Name Filter */}
                  <input
                    type="text"
                    placeholder="Filter by name..."
                    value={filterMission}
                    onChange={(e) => setFilterMission(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {/* Sort Controls */}
                  <select
                    value={`${sortField}-${sortDirection}`}
                    onChange={(e) => {
                      const [field, direction] = e.target.value.split('-');
                      setSortField(field as keyof MissionBoundaryChange);
                      setSortDirection(direction as 'asc' | 'desc');
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="effectiveDate-desc">Effective Date (Newest)</option>
                    <option value="effectiveDate-asc">Effective Date (Oldest)</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="modifiedOn-desc">Modified (Newest)</option>
                    <option value="modifiedOn-asc">Modified (Oldest)</option>
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
                        Boundary Change Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dates & Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sending Mission
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receiving Missions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Modification Info
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedAndFilteredChanges.map((change, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {/* Boundary Change Details */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {change.name || 'Unnamed Change'}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {change.missionBoundaryAdjustmentId}
                            </div>
                            <div className="text-xs text-gray-400">
                              IMOS: {change.imosStatus || 'N/A'}
                            </div>
                          </div>
                        </td>

                        {/* Dates & Status */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">Available:</span>
                              <span className="font-mono text-xs bg-blue-100 px-2 py-1 rounded">
                                {formatDate(change.availableDate)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">Effective:</span>
                              <span className="font-mono text-xs bg-green-100 px-2 py-1 rounded">
                                {formatDate(change.effectiveDate)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">Finalized:</span>
                              <span className="font-mono text-xs bg-purple-100 px-2 py-1 rounded">
                                {formatDate(change.finalizedDate)}
                              </span>
                            </div>
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                change.missionBoundaryChangeStatusCode?.name === 'ACTIVE'
                                  ? 'bg-green-100 text-green-800'
                                  : change.missionBoundaryChangeStatusCode?.name === 'INACTIVE'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {change.missionBoundaryChangeStatusCode?.name || 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Sending Mission */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-900">
                              {change.sendingMission?.unitNumber || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">Unit Number</div>
                          </div>
                        </td>

                        {/* Receiving Missions */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {change.receivingMissions && change.receivingMissions.length > 0 ? (
                              change.receivingMissions.map((mission, missionIndex) => (
                                <div key={missionIndex} className="bg-gray-50 p-2 rounded text-sm">
                                  <div className="font-medium text-gray-900">
                                    {mission.unitName || `Unit ${mission.unitId}`}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    ID: {mission.unitId} | Church Unit: {mission.churchUnitId}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-gray-400 italic">
                                No receiving missions
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Modification Info */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div>
                            <div className="text-gray-900 font-medium truncate">
                              {change.modifiedByValue || 'Unknown'}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {formatDate(change.modifiedOn)}
                            </div>
                            {change.missionBoundaryChangeStateCode && (
                              <div className="mt-1">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                  {change.missionBoundaryChangeStateCode.name}
                                </span>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Summary Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    {Array.isArray(changes) ? changes.length : 0}
                  </div>
                  <div className="text-sm text-blue-700">Total Changes</div>
                </div>
                <div className="bg-green-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">
                    {Array.isArray(changes) ? changes.filter(c => c.missionBoundaryChangeStatusCode?.name === 'ACTIVE').length : 0}
                  </div>
                  <div className="text-sm text-green-700">Active Changes</div>
                </div>
                <div className="bg-purple-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-900">
                    {Array.from(new Set(Array.isArray(changes) ? changes.map(c => c.sendingMission?.unitNumber).filter(Boolean) : [])).length}
                  </div>
                  <div className="text-sm text-purple-700">Sending Missions</div>
                </div>
                <div className="bg-orange-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-900">
                    {Array.isArray(changes) ? changes.reduce((total, c) => total + (c.receivingMissions?.length || 0), 0) : 0}
                  </div>
                  <div className="text-sm text-orange-700">Receiving Missions</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">💡 How to Use Mission Boundary Changes Search</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• <strong>Mission Unit Numbers:</strong> Enter numeric mission unit numbers (e.g., 12345, 67890)</p>
            <p>• <strong>Adjustment IDs:</strong> Enter boundary adjustment IDs (e.g., 123-xxx-xxx-xxx-abc)</p>
            <p>• <strong>Status Filters:</strong> Select one or more status types to filter results</p>
            <p>• <strong>Flexible Search:</strong> Use any combination of the above parameters</p>
            <p>• <strong>Multiple Values:</strong> Separate multiple values with commas for unit numbers and IDs</p>
            <p>• View detailed information about effective dates, sending/receiving missions, and modification history</p>
          </div>
        </div>
      </div>
    </div>
  );
}
