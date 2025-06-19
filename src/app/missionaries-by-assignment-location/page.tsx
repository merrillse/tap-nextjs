'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

interface Option {
  value: string;
  label: string;
}

interface Assignment {
  mission?: {
    name?: string;
  };
  component?: {
    assignmentLanguage?: {
      languageName?: string;
    };
    missionLanguage?: {
      languageName?: string;
    };
  };
}

interface Missionary {
  id?: string;
  missionaryNumber?: number;
  recommendFirstName?: string;
  recommendMiddleName?: string;
  recommendLastName?: string;
  recommendNameSuffix?: string;
  membershipUnitNumber?: number;
  homeUnitNumber?: number;
  submittingUnitNumber?: number;
  fundingUnitNumber?: number;
  missionaryStatus?: Option;
  missionaryType?: Option;
  callSentDate?: string;
  startDate?: string;
  releaseDate?: string;
  infieldDate?: string;
  emailAddress?: string;
  proselytingEmailAddress?: string;
  mobilePhone?: string;
  homePhone?: string;
  birthDate?: string;
  birthPlace?: string;
  gender?: Option;
  assignments?: Assignment[];
}

interface SearchHistory {
  assignmentLocationId: string;
  timestamp: string;
  resultCount: number;
}

export default function MissionariesByAssignmentLocationPage() {
  const [assignmentLocationId, setAssignmentLocationId] = useState('');
  const [missionaries, setMissionaries] = useState<Missionary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [sortField, setSortField] = useState<keyof Missionary>('recommendLastName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<string>('');

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
    const savedHistory = localStorage.getItem('missionariesByAssignmentLocationSearchHistory');
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
    localStorage.setItem('missionariesByAssignmentLocationSearchHistory', JSON.stringify(history));
    setSearchHistory(history);
  };

  const addToSearchHistory = (locationId: string, resultCount: number) => {
    const newEntry: SearchHistory = {
      assignmentLocationId: locationId,
      timestamp: new Date().toISOString(),
      resultCount
    };
    const updatedHistory = [newEntry, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
    saveSearchHistory(updatedHistory);
  };

  const clearSearchHistory = () => {
    localStorage.removeItem('missionariesByAssignmentLocationSearchHistory');
    setSearchHistory([]);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentLocationId.trim()) return;

    if (!apiClient) {
      setError('API client not initialized. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError(null);
    setMissionaries([]);

    try {
      const query = `
        query MissionariesByAssignmentLocation($assignmentLocationId: ID!) {
          missionariesByAssignmentLocation(assignmentLocationId: $assignmentLocationId) {
            id
            missionaryNumber
            recommendFirstName
            recommendMiddleName
            recommendLastName
            recommendNameSuffix
            membershipUnitNumber
            homeUnitNumber
            submittingUnitNumber
            fundingUnitNumber
            missionaryStatus {
              value
              label
            }
            missionaryType {
              value
              label
            }
            gender {
              value
              label
            }
            callSentDate
            startDate
            releaseDate
            infieldDate
            emailAddress
            proselytingEmailAddress
            mobilePhone
            homePhone
            birthDate
            birthPlace
            assignments(input: {}) {
              mission {
                name
              }
              component {
                assignmentLanguage {
                  languageName
                }
                missionLanguage {
                  languageName
                }
              }
            }
          }
        }
      `;

      const variables = { assignmentLocationId };
      const response = await apiClient.executeGraphQLQuery(query, variables);
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const data = response.data as { missionariesByAssignmentLocation: Missionary[] };
      const missionaries = data.missionariesByAssignmentLocation || [];
      setMissionaries(missionaries);
      addToSearchHistory(assignmentLocationId, missionaries.length);
      
      if (missionaries.length === 0) {
        setError('No missionaries found for this assignment location ID');
      }
    } catch (err: any) {
      console.error('Error searching for missionaries:', err);
      setError(err.message || 'Failed to search for missionaries');
      addToSearchHistory(assignmentLocationId, 0);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const useHistorySearch = (historyItem: SearchHistory) => {
    setAssignmentLocationId(historyItem.assignmentLocationId);
  };

  const getFullName = (missionary: Missionary) => {
    const parts = [
      missionary.recommendFirstName,
      missionary.recommendMiddleName,
      missionary.recommendLastName,
      missionary.recommendNameSuffix
    ].filter(Boolean);
    return parts.join(' ') || 'Unknown Name';
  };

  const sortedAndFilteredMissionaries = missionaries
    .filter(missionary => {
      if (!filterStatus) return true;
      return missionary.missionaryStatus?.value === filterStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortField === 'recommendLastName' || sortField === 'recommendFirstName') {
        const aStr = (aValue as string || '').toLowerCase();
        const bStr = (bValue as string || '').toLowerCase();
        return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      }
      
      if (sortField === 'missionaryNumber') {
        const aNum = aValue as number || 0;
        const bNum = bValue as number || 0;
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      return 0;
    });

  const uniqueStatuses = Array.from(new Set(
    missionaries
      .map(m => m.missionaryStatus?.value)
      .filter(Boolean)
  ));

  const exportToCsv = () => {
    if (missionaries.length === 0) return;
    
    const headers = [
      'Missionary Number',
      'Name',
      'Status',
      'Type',
      'Gender',
      'Email',
      'Phone',
      'Start Date',
      'Release Date',
      'Birth Date',
      'Birth Place',
      'Home Unit',
      'Membership Unit'
    ];
    
    const csvContent = [
      headers.join(','),
      ...sortedAndFilteredMissionaries.map(missionary => [
        missionary.missionaryNumber || '',
        `"${getFullName(missionary)}"`,
        `"${missionary.missionaryStatus?.label || ''}"`,
        `"${missionary.missionaryType?.label || ''}"`,
        `"${missionary.gender?.label || ''}"`,
        missionary.emailAddress || '',
        missionary.mobilePhone || missionary.homePhone || '',
        missionary.startDate || '',
        missionary.releaseDate || '',
        missionary.birthDate || '',
        `"${missionary.birthPlace || ''}"`,
        missionary.homeUnitNumber || '',
        missionary.membershipUnitNumber || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `missionaries-assignment-location-${assignmentLocationId}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Missionaries by Assignment Location</h1>
          <p className="mt-2 text-lg text-gray-600">
            Find all missionaries assigned to a specific assignment location
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="assignmentLocationId" className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Location ID
              </label>
              <input
                type="text"
                id="assignmentLocationId"
                value={assignmentLocationId}
                onChange={(e) => setAssignmentLocationId(e.target.value)}
                placeholder="Enter assignment location ID (e.g., 12345)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !assignmentLocationId.trim()}
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
          </form>
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Searches</h3>
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
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => useHistorySearch(item)}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">
                      Location ID: {item.assignmentLocationId}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.resultCount > 0
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.resultCount} missionaries
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Search Results: {sortedAndFilteredMissionaries.length} missionaries
                  </h2>
                  <p className="text-gray-600">Assignment Location ID: {assignmentLocationId}</p>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    {uniqueStatuses.map(status => {
                      const missionary = missionaries.find(m => m.missionaryStatus?.value === status);
                      return (
                        <option key={status} value={status}>
                          {missionary?.missionaryStatus?.label}
                        </option>
                      );
                    })}
                  </select>

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
                    <option value="missionaryNumber-asc">Missionary # (Low-High)</option>
                    <option value="missionaryNumber-desc">Missionary # (High-Low)</option>
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

            {/* Missionaries Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedAndFilteredMissionaries.map((missionary) => (
                <div key={missionary.id || missionary.missionaryNumber} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getFullName(missionary)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Missionary #{missionary.missionaryNumber}
                      </p>
                    </div>
                    {missionary.gender && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {missionary.gender.label}
                      </span>
                    )}
                  </div>

                  {/* Status and Type */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {missionary.missionaryStatus && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        missionary.missionaryStatus.value === 'IN_FIELD' ? 'bg-green-100 text-green-800' :
                        missionary.missionaryStatus.value === 'RELEASED' ? 'bg-gray-100 text-gray-800' :
                        missionary.missionaryStatus.value === 'ONSITE_MTC' || missionary.missionaryStatus.value === 'REMOTE_MTC' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {missionary.missionaryStatus.label}
                      </span>
                    )}
                    {missionary.missionaryType && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {missionary.missionaryType.label}
                      </span>
                    )}
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-2 mb-4">
                    {missionary.emailAddress && (
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {missionary.emailAddress}
                      </div>
                    )}
                    {(missionary.mobilePhone || missionary.homePhone) && (
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {missionary.mobilePhone || missionary.homePhone}
                      </div>
                    )}
                  </div>

                  {/* Service Dates */}
                  <div className="border-t pt-4 space-y-1">
                    {missionary.startDate && (
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Start:</span> {formatDate(missionary.startDate)}
                      </div>
                    )}
                    {missionary.infieldDate && (
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">In-field:</span> {formatDate(missionary.infieldDate)}
                      </div>
                    )}
                    {missionary.releaseDate && (
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Release:</span> {formatDate(missionary.releaseDate)}
                      </div>
                    )}
                  </div>

                  {/* Additional Info */}
                  {(missionary.birthPlace || missionary.homeUnitNumber) && (
                    <div className="border-t pt-3 mt-3 space-y-1">
                      {missionary.birthPlace && (
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Birth Place:</span> {missionary.birthPlace}
                        </div>
                      )}
                      {missionary.homeUnitNumber && (
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Home Unit:</span> {missionary.homeUnitNumber}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mission Assignment */}
                  {missionary.assignments && missionary.assignments.length > 0 && missionary.assignments[0].mission?.name && (
                    <div className="border-t pt-3 mt-3">
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Mission:</span> {missionary.assignments[0].mission.name}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Summary Statistics */}
            <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Summary Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    {missionaries.length}
                  </div>
                  <div className="text-sm text-blue-700">Total Missionaries</div>
                </div>
                <div className="bg-green-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">
                    {missionaries.filter(m => m.missionaryStatus?.value === 'IN_FIELD').length}
                  </div>
                  <div className="text-sm text-green-700">In Field</div>
                </div>
                <div className="bg-purple-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-900">
                    {new Set(missionaries.map(m => m.missionaryType?.value).filter(Boolean)).size}
                  </div>
                  <div className="text-sm text-purple-700">Missionary Types</div>
                </div>
                <div className="bg-orange-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-900">
                    {missionaries.filter(m => m.emailAddress).length}
                  </div>
                  <div className="text-sm text-orange-700">With Email</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">💡 How to Use Missionaries by Assignment Location</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• Enter an assignment location ID to find all missionaries currently or previously assigned to that location</p>
            <p>• Use the status filter to view only missionaries with specific statuses (In Field, Released, etc.)</p>
            <p>• Sort results by name or missionary number using the sort dropdown</p>
            <p>• Export search results to CSV format for external analysis or record keeping</p>
            <p>• Recent searches are automatically saved and can be accessed from the search history section</p>
            <p>• Each missionary card shows contact information, service dates, and current assignment details</p>
          </div>
        </div>
      </div>
    </div>
  );
}
