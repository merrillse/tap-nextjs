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
  value: string;
  label: string;
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
  const [selectedEnvironment, setSelectedEnvironment] = useState('development');
  
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
    if (typeof window !== 'undefined') {
      const savedEnvironment = localStorage.getItem('selectedEnvironment') || 'development';
      setSelectedEnvironment(savedEnvironment);
      const config = ENVIRONMENTS[savedEnvironment as keyof typeof ENVIRONMENTS];
      
      if (config) {
        setApiClient(new ApiClient(config, savedEnvironment));
      }
    }
  }, []);

  // Load search history from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('missionBoundaryChangesSearchHistory');
      if (savedHistory) {
        try {
          setSearchHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to parse search history:', e);
        }
      }
    }
  }, []);

  // Save search history to localStorage
  const saveSearchHistory = (history: SearchHistory[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('missionBoundaryChangesSearchHistory', JSON.stringify(history));
    }
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('missionBoundaryChangesSearchHistory');
    }
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
      // Build the input object properly
      let input: any = null;
      
      // Only create input object if we have search criteria
      if (unitNumbers.length > 0 || adjustmentIds.length > 0 || selectedStatuses.length > 0) {
        input = {};
        
        if (unitNumbers.length > 0 || adjustmentIds.length > 0) {
          input.ids = {};
          if (unitNumbers.length > 0) {
            input.ids.sendingMissionUnitNumbers = unitNumbers;
          }
          if (adjustmentIds.length > 0) {
            input.ids.missionBoundaryAdjustmentIds = adjustmentIds;
          }
        }

        if (selectedStatuses.length > 0) {
          input.filters = {
            statuses: selectedStatuses
          };
        }
      }

      const query = `
        query MissionBoundaryChanges${input ? '($input: MissionBoundaryChangeInput)' : ''} {
          missionBoundaryChanges${input ? '(input: $input)' : ''} {
            availableDate
            effectiveDate
            finalizedDate
            imosStatus
            missionBoundaryAdjustmentId
            name
            modifiedByValue
            modifiedOn
            missionBoundaryChangeStateCode {
              value
              label
            }
            missionBoundaryChangeStatusCode {
              value
              label
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

      const response = await apiClient.executeGraphQLQuery(query, input ? { input } : undefined);
      
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
      if (filterStatus && change.missionBoundaryChangeStatusCode?.label !== filterStatus) {
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

  const uniqueStatuses = Array.from(new Set(Array.isArray(changes) ? changes.map(change => change.missionBoundaryChangeStatusCode?.label).filter(Boolean) : []));

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
        `"${change.missionBoundaryChangeStateCode?.label || ''}"`,
        `"${change.missionBoundaryChangeStatusCode?.label || ''}"`,
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🗺️</span>
        <h1 className="text-2xl font-bold">Mission Boundary Changes</h1>
        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Missionary Information System</span>
      </div>

      {/* Environment Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <label htmlFor="environment" className="text-sm font-medium text-gray-700">Environment:</label>
          <select
            id="environment"
            value={selectedEnvironment}
            onChange={(e) => {
              setSelectedEnvironment(e.target.value);
              if (typeof window !== 'undefined') {
                localStorage.setItem('selectedEnvironment', e.target.value);
              }
              const config = ENVIRONMENTS[e.target.value as keyof typeof ENVIRONMENTS];
              if (config) {
                setApiClient(new ApiClient(config, e.target.value));
              }
            }}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(ENVIRONMENTS).map(([key, env]) => (
              <option key={key} value={key}>
                {env.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Search Mission Boundary Changes</h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mission Unit Numbers */}
            <div>
              <label htmlFor="sendingMissionUnitNumbers" className="block text-sm font-medium text-gray-700 mb-1">
                Sending Mission Unit Numbers
              </label>
              <textarea
                id="sendingMissionUnitNumbers"
                value={sendingMissionUnitNumbers}
                onChange={(e) => setSendingMissionUnitNumbers(e.target.value)}
                placeholder="Enter mission unit numbers separated by commas&#10;Example: 12345, 67890"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <p className="mt-1 text-xs text-gray-500">
                Comma-separated list of mission unit numbers
              </p>
            </div>

            {/* Adjustment IDs */}
            <div>
              <label htmlFor="missionBoundaryAdjustmentIds" className="block text-sm font-medium text-gray-700 mb-1">
                Mission Boundary Adjustment IDs
              </label>
              <textarea
                id="missionBoundaryAdjustmentIds"
                value={missionBoundaryAdjustmentIds}
                onChange={(e) => setMissionBoundaryAdjustmentIds(e.target.value)}
                placeholder="Enter adjustment IDs separated by commas&#10;Example: 123-xxx-xxx-xxx-abc, 23434234"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <p className="mt-1 text-xs text-gray-500">
                Comma-separated list of boundary adjustment IDs
              </p>
            </div>
          </div>

          {/* Status Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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

          {/* Search Buttons */}
          <div className="flex gap-4 items-center">
            <button
              onClick={searchMissionBoundaryChanges}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={() => {
                setSendingMissionUnitNumbers('');
                setMissionBoundaryAdjustmentIds('');
                setSelectedStatuses([]);
                setChanges([]);
                setError(null);
              }}
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

      {/* Results Section */}
      {changes.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Mission Boundary Changes ({sortedAndFilteredChanges.length} results)</h2>
            <button
              onClick={exportToCsv}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
            >
              📥 Export CSV
            </button>
          </div>

          {/* Filters and Sorting */}
          <div className="mb-6 flex flex-wrap gap-4 items-center">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Filter by name..."
              value={filterMission}
              onChange={(e) => setFilterMission(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                setSortField(field as keyof MissionBoundaryChange);
                setSortDirection(direction as 'asc' | 'desc');
              }}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="effectiveDate-desc">Effective Date (Newest)</option>
              <option value="effectiveDate-asc">Effective Date (Oldest)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="modifiedOn-desc">Modified (Newest)</option>
              <option value="modifiedOn-asc">Modified (Oldest)</option>
            </select>
          </div>

          {/* Results Grid */}
          <div className="space-y-4">
            {sortedAndFilteredChanges.map((change, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Basic Information */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Boundary Change Details</h3>
                    <div className="space-y-1 text-sm">
                      <div><span className="font-medium">ID:</span> {change.missionBoundaryAdjustmentId}</div>
                      <div><span className="font-medium">Name:</span> {change.name || 'N/A'}</div>
                      <div><span className="font-medium">IMOS Status:</span> {change.imosStatus || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Dates and Status */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Dates & Status</h3>
                    <div className="space-y-1 text-sm">
                      <div><span className="font-medium">Available:</span> {formatDate(change.availableDate)}</div>
                      <div><span className="font-medium">Effective:</span> {formatDate(change.effectiveDate)}</div>
                      <div><span className="font-medium">Finalized:</span> {formatDate(change.finalizedDate)}</div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Status:</span>
                        <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                          {change.missionBoundaryChangeStatusCode?.label || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mission Information */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Mission Information</h3>
                    <div className="space-y-1 text-sm">
                      <div><span className="font-medium">Sending Unit:</span> {change.sendingMission?.unitNumber || 'N/A'}</div>
                      <div><span className="font-medium">Modified By:</span> {change.modifiedByValue || 'N/A'}</div>
                      <div><span className="font-medium">Modified On:</span> {formatDate(change.modifiedOn)}</div>
                      {change.receivingMissions && change.receivingMissions.length > 0 && (
                        <div>
                          <span className="font-medium">Receiving Missions:</span>
                          <div className="mt-1 space-y-1">
                            {change.receivingMissions.map((mission, idx) => (
                              <div key={idx} className="text-xs px-2 py-1 bg-green-50 rounded">
                                {mission.unitName} ({mission.unitId})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">📜 Search History</h2>
            <button
              onClick={clearSearchHistory}
              className="px-3 py-1 text-red-600 border border-red-300 rounded-md hover:bg-red-50"
            >
              🗑️ Clear History
            </button>
          </div>
          <div className="space-y-2">
            {searchHistory.map((item, index) => (
              <div
                key={index}
                className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => repeatSearch(item)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">
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
                    <div className="text-sm text-gray-500">
                      {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${item.resultsCount > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {item.resultsCount} results
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && changes.length === 0 && !error && (
        <div className="text-center py-8 text-gray-500">
          Enter search parameters to find mission boundary changes.
        </div>
      )}
    </div>
  );
}
