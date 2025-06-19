'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS } from '@/lib/environments';

interface Option {
  value: string;
  label: string;
}

interface Candidate {
  missionaryNumber: number;
  membershipUnitId: number;
  homeUnitId: number;
  submittingUnitId: number;
  ldsAccountId: string;
  missionaryType: Option;
  cmisId: number;
  emailAddress: string;
  recommendStartDate: string;
  recommendLastName: string;
  recommendFirstName: string;
  recommendMiddleName: string;
  recommendNameSuffix: string;
  birthdate: string;
  currentAvailabilityDate: string;
  sourceSystem: string;
}

interface SearchHistory {
  timestamp: string;
  membershipUnitId: string;
  resultsCount: number;
}

export default function CandidatesByMembershipUnitPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  
  // Search form state
  const [membershipUnitId, setMembershipUnitId] = useState<string>('');

  // Filtering and sorting
  const [sortField, setSortField] = useState<keyof Candidate>('recommendLastName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterType, setFilterType] = useState<string>('');
  const [filterSourceSystem, setFilterSourceSystem] = useState<string>('');
  const [showRecentOnly, setShowRecentOnly] = useState(false);

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
    const savedHistory = localStorage.getItem('candidatesByMembershipUnitSearchHistory');
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
    localStorage.setItem('candidatesByMembershipUnitSearchHistory', JSON.stringify(history));
    setSearchHistory(history);
  };

  const addToSearchHistory = (unitId: string, resultsCount: number) => {
    const newEntry: SearchHistory = {
      timestamp: new Date().toISOString(),
      membershipUnitId: unitId,
      resultsCount
    };
    const updatedHistory = [newEntry, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
    saveSearchHistory(updatedHistory);
  };

  const clearSearchHistory = () => {
    localStorage.removeItem('candidatesByMembershipUnitSearchHistory');
    setSearchHistory([]);
  };

  const searchCandidatesByMembershipUnit = async () => {
    if (!apiClient) {
      setError('API client not initialized. Please refresh the page.');
      return;
    }

    if (!membershipUnitId.trim()) {
      setError('Please provide a Membership Unit ID to search for candidates.');
      return;
    }

    setLoading(true);
    setError(null);
    setCandidates([]);

    try {
      const query = `
        query CandidatesByMembershipUnit($id: ID) {
          candidatesByMembershipUnit(id: $id) {
            missionaryNumber
            membershipUnitId
            homeUnitId
            submittingUnitId
            ldsAccountId
            missionaryType {
              value
              label
            }
            cmisId
            emailAddress
            recommendStartDate
            recommendLastName
            recommendFirstName
            recommendMiddleName
            recommendNameSuffix
            birthdate
            currentAvailabilityDate
            sourceSystem
          }
        }
      `;

      const response = await apiClient.executeGraphQLQuery(query, { id: membershipUnitId.trim() });
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
      }

      const data = response.data as { candidatesByMembershipUnit: Candidate[] };
      const candidateList = Array.isArray(data.candidatesByMembershipUnit) ? data.candidatesByMembershipUnit : [];
      setCandidates(candidateList);
      addToSearchHistory(membershipUnitId.trim(), candidateList.length);
      
      if (candidateList.length === 0) {
        setError(`No candidates found for membership unit ID: ${membershipUnitId.trim()}`);
      }
    } catch (err: any) {
      console.error('Error searching candidates by membership unit:', err);
      setError(err.message || 'Failed to search candidates by membership unit');
      addToSearchHistory(membershipUnitId.trim(), 0);
    } finally {
      setLoading(false);
    }
  };

  const sortedAndFilteredCandidates = Array.isArray(candidates) ? candidates
    .filter(candidate => {
      if (filterType && candidate.missionaryType?.label !== filterType) {
        return false;
      }
      if (filterSourceSystem && candidate.sourceSystem !== filterSourceSystem) {
        return false;
      }
      if (showRecentOnly) {
        // Show only candidates with recommend start date within last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const startDate = new Date(candidate.recommendStartDate);
        if (startDate < sixMonthsAgo) {
          return false;
        }
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

  const uniqueTypes = Array.from(new Set(Array.isArray(candidates) ? candidates.map(c => c.missionaryType?.label).filter(Boolean) : []));
  const uniqueSourceSystems = Array.from(new Set(Array.isArray(candidates) ? candidates.map(c => c.sourceSystem).filter(Boolean) : []));

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getFullName = (candidate: Candidate) => {
    const parts = [
      candidate.recommendFirstName,
      candidate.recommendMiddleName,
      candidate.recommendLastName,
      candidate.recommendNameSuffix
    ].filter(Boolean);
    return parts.join(' ') || 'Unknown Name';
  };

  const exportToCsv = () => {
    if (sortedAndFilteredCandidates.length === 0) return;
    
    const headers = [
      'Missionary Number',
      'Name',
      'CMIS ID',
      'LDS Account ID',
      'Email Address',
      'Membership Unit ID',
      'Home Unit ID',
      'Submitting Unit ID',
      'Missionary Type',
      'Recommend Start Date',
      'Birth Date',
      'Availability Date',
      'Source System'
    ];
    
    const csvContent = [
      headers.join(','),
      ...sortedAndFilteredCandidates.map(candidate => [
        candidate.missionaryNumber || '',
        `"${getFullName(candidate)}"`,
        candidate.cmisId || '',
        `"${candidate.ldsAccountId || ''}"`,
        `"${candidate.emailAddress || ''}"`,
        candidate.membershipUnitId || '',
        candidate.homeUnitId || '',
        candidate.submittingUnitId || '',
        `"${candidate.missionaryType?.label || ''}"`,
        formatDate(candidate.recommendStartDate),
        formatDate(candidate.birthdate),
        formatDate(candidate.currentAvailabilityDate),
        `"${candidate.sourceSystem || ''}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `candidates-by-unit-${membershipUnitId}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const repeatSearch = (historyItem: SearchHistory) => {
    setMembershipUnitId(historyItem.membershipUnitId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchCandidatesByMembershipUnit();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Candidates by Membership Unit</h1>
          <p className="mt-2 text-lg text-gray-600">
            Find all candidates who have started a recommend by their current membership unit number
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Search Parameters</h3>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="membershipUnitId" className="block text-sm font-medium text-gray-700 mb-2">
                Membership Unit ID <span className="text-red-500">*</span>
              </label>
              <input
                id="membershipUnitId"
                type="text"
                value={membershipUnitId}
                onChange={(e) => setMembershipUnitId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter membership unit ID (e.g., 12345)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the membership unit ID to find all candidates with recommends started in that unit
              </p>
            </div>

            <div className="flex items-end">
              <button
                onClick={searchCandidatesByMembershipUnit}
                disabled={loading || !membershipUnitId.trim()}
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
                    Search Candidates
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
                        Unit ID: <span className="text-blue-600">{item.membershipUnitId}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.resultsCount > 0
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.resultsCount} candidates
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
        {candidates.length > 0 && (
          <>
            {/* Results Summary and Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Candidates for Unit {membershipUnitId}: {sortedAndFilteredCandidates.length} results
                  </h2>
                  <p className="text-gray-600">Candidates with recommends started in membership unit {membershipUnitId}</p>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
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

                  {/* Source System Filter */}
                  <select
                    value={filterSourceSystem}
                    onChange={(e) => setFilterSourceSystem(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Sources</option>
                    {uniqueSourceSystems.map(system => (
                      <option key={system} value={system}>
                        {system}
                      </option>
                    ))}
                  </select>

                  {/* Recent Filter */}
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showRecentOnly}
                      onChange={(e) => setShowRecentOnly(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Recent (6 months)</span>
                  </label>

                  {/* Sort Controls */}
                  <select
                    value={`${sortField}-${sortDirection}`}
                    onChange={(e) => {
                      const [field, direction] = e.target.value.split('-');
                      setSortField(field as keyof Candidate);
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
                    <option value="recommendStartDate-desc">Start Date (Newest)</option>
                    <option value="recommendStartDate-asc">Start Date (Oldest)</option>
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
                        Candidate Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact & IDs
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recommend Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Information
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        System & Dates
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedAndFilteredCandidates.map((candidate, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {/* Candidate Info */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getFullName(candidate)}
                            </div>
                            <div className="text-sm text-gray-500">
                              #{candidate.missionaryNumber}
                            </div>
                            <div className="text-xs text-gray-400">
                              {candidate.missionaryType?.label}
                            </div>
                            <div className="text-xs text-gray-400">
                              Born: {formatDate(candidate.birthdate)}
                            </div>
                          </div>
                        </td>

                        {/* Contact & IDs */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">CMIS:</span>
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                {candidate.cmisId || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">LDS ID:</span>
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                {candidate.ldsAccountId || 'N/A'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-700">
                              📧 {candidate.emailAddress || 'No email'}
                            </div>
                          </div>
                        </td>

                        {/* Recommend Details */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">Started:</span>
                              <span className="font-mono text-xs bg-blue-100 px-2 py-1 rounded">
                                {formatDate(candidate.recommendStartDate)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">Available:</span>
                              <span className="font-mono text-xs bg-green-100 px-2 py-1 rounded">
                                {formatDate(candidate.currentAvailabilityDate)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Unit Information */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="space-y-1">
                            <div className="text-gray-700">
                              <span className="text-gray-500">Membership:</span> {candidate.membershipUnitId}
                            </div>
                            <div className="text-gray-700">
                              <span className="text-gray-500">Home:</span> {candidate.homeUnitId}
                            </div>
                            <div className="text-gray-700">
                              <span className="text-gray-500">Submitting:</span> {candidate.submittingUnitId}
                            </div>
                          </div>
                        </td>

                        {/* System & Dates */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="space-y-1">
                            <div className="text-gray-700">
                              <span className="text-gray-500">Source:</span> {candidate.sourceSystem || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Recommend: {formatDate(candidate.recommendStartDate)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Available: {formatDate(candidate.currentAvailabilityDate)}
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Membership Unit Summary Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    {Array.isArray(candidates) ? candidates.length : 0}
                  </div>
                  <div className="text-sm text-blue-700">Total Candidates</div>
                </div>
                <div className="bg-green-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">
                    {Array.isArray(candidates) ? candidates.filter(c => {
                      const sixMonthsAgo = new Date();
                      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                      return new Date(c.recommendStartDate) >= sixMonthsAgo;
                    }).length : 0}
                  </div>
                  <div className="text-sm text-green-700">Recent (6 months)</div>
                </div>
                <div className="bg-purple-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-900">
                    {uniqueTypes.length}
                  </div>
                  <div className="text-sm text-purple-700">Missionary Types</div>
                </div>
                <div className="bg-orange-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-900">
                    {uniqueSourceSystems.length}
                  </div>
                  <div className="text-sm text-orange-700">Source Systems</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">💡 How to Use Candidates by Membership Unit Search</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• <strong>Membership Unit ID:</strong> Enter the specific unit ID to find all candidates who started recommends in that unit</p>
            <p>• <strong>Candidate Tracking:</strong> View detailed candidate profiles including recommend start dates and availability</p>
            <p>• <strong>Unit Context:</strong> See membership, home, and submitting unit relationships for each candidate</p>
            <p>• <strong>Filter Options:</strong> Filter by missionary type, source system, or recent recommend starts</p>
            <p>• <strong>Sort Capabilities:</strong> Sort by name, missionary number, or recommend start date</p>
            <p>• <strong>Export Data:</strong> Export filtered results to CSV for external analysis</p>
            <p>• <strong>Search History:</strong> Easily repeat previous searches with the search history feature</p>
          </div>
        </div>
      </div>
    </div>
  );
}
