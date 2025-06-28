'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ChevronDoubleLeftIcon, 
  ChevronDoubleRightIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface Environment {
  name: string;
  baseUrl: string;
  clientId: string;
  scope: string;
  description: string;
  envVarSuffix: string;
}

interface PaginationData {
  success: boolean;
  environment: string;
  currentPage: number;
  pageSize: number;
  totalPages?: number; // May not be available with Dataverse pagination
  totalRecords?: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  data: any;
  queryUrl: string;
  timestamp: string;
  nextSkipToken?: string; // For Dataverse cookie-based pagination
}

const INQ_ENVIRONMENTS: Environment[] = [
  {
    name: 'Dev',
    baseUrl: 'https://inq-dev.api.crm.dynamics.com/api/data/v9.2',
    clientId: '563efa39-c095-4882-a49d-3ecd0cca40e3',
    scope: 'https://inq-dev.crm.dynamics.com/.default',
    description: 'Development environment',
    envVarSuffix: 'DEV'
  },
  {
    name: 'Test',
    baseUrl: 'https://inq-test.api.crm.dynamics.com/api/data/v9.2',
    clientId: '563efa39-c095-4882-a49d-3ecd0cca40e3',
    scope: 'https://inq-test.crm.dynamics.com/.default',
    description: 'Test environment',
    envVarSuffix: 'TEST'
  },
  {
    name: 'Stage',
    baseUrl: 'https://inq-stage.api.crm.dynamics.com/api/data/v9.2',
    clientId: '563efa39-c095-4882-a49d-3ecd0cca40e3',
    scope: 'https://inq-stage.crm.dynamics.com/.default',
    description: 'Staging environment',
    envVarSuffix: 'STAGE'
  },
  {
    name: 'Prod',
    baseUrl: 'https://inq.api.crm.dynamics.com/api/data/v9.2',
    clientId: '5e6b7d0b-7247-429b-b8c1-d911d8f13d40',
    scope: 'https://inq.crm.dynamics.com/.default',
    description: 'Production environment',
    envVarSuffix: 'PROD'
  }
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250];

const COMMON_FILTERS = [
  { name: 'All Records', filter: '' },
  { name: 'In-field Only', filter: "inq_calculatedstatus eq 'In-field'" },
  { name: 'Released Only', filter: "inq_calculatedstatus eq 'Released'" },
  { name: 'Preparing Only', filter: "inq_calculatedstatus eq 'Preparing'" },
  { name: 'Recent Start (2025)', filter: 'inq_startdate ge 2025-01-01' },
  { name: 'Has Email', filter: 'inq_personalemail ne null' },
];

const COMMON_SELECTS = [
  { name: 'All Fields', select: '' },
  { name: 'Basic Info', select: 'inq_name,inq_missionarynumber,inq_calculatedstatus,inq_startdate' },
  { name: 'Contact Info', select: 'inq_name,inq_missionarynumber,inq_personalemail,inq_mobilephone' },
  { name: 'Service Dates', select: 'inq_name,inq_missionarynumber,inq_startdate,inq_calculatedreleasedate' },
  { name: 'Home Info', select: 'inq_name,inq_homeunitname,inq_parentunitname,inq_membershipmission' },
];

const ORDER_BY_OPTIONS = [
  { name: 'Name (A-Z)', value: 'inq_name' },
  { name: 'Name (Z-A)', value: 'inq_name desc' },
  { name: 'Number (Low-High)', value: 'inq_missionarynumber' },
  { name: 'Number (High-Low)', value: 'inq_missionarynumber desc' },
  { name: 'Start Date (Newest)', value: 'inq_startdate desc' },
  { name: 'Start Date (Oldest)', value: 'inq_startdate' },
];

export default function INQDataExplorerPage() {
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>(INQ_ENVIRONMENTS[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filter, setFilter] = useState('');
  const [customFilter, setCustomFilter] = useState('');
  const [select, setSelect] = useState('');
  const [customSelect, setCustomSelect] = useState('');
  const [orderBy, setOrderBy] = useState('inq_name');
  const [isLoading, setIsLoading] = useState(false);
  const [paginationData, setPaginationData] = useState<PaginationData | null>(null);
  const [error, setError] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [secretStatus, setSecretStatus] = useState<{ [key: string]: boolean }>({});
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Track skipTokens for Dataverse pagination
  const [skipTokenHistory, setSkipTokenHistory] = useState<string[]>([]);
  const [currentSkipToken, setCurrentSkipToken] = useState<string | undefined>(undefined);

  // Check secret status
  const checkSecretStatus = async (environment: Environment) => {
    try {
      const response = await fetch(`/api/inq-secret-status?env=${environment.envVarSuffix}`);
      const data = await response.json();
      return data.hasSecret;
    } catch (error) {
      console.error('Error checking secret status:', error);
      return false;
    }
  };

  // Load secret status when environment changes
  useEffect(() => {
    const loadStatus = async () => {
      const hasSecret = await checkSecretStatus(selectedEnvironment);
      setSecretStatus(prev => ({
        ...prev,
        [selectedEnvironment.envVarSuffix]: hasSecret
      }));
    };
    loadStatus();
  }, [selectedEnvironment]);

  const getClientSecretStatus = () => {
    return secretStatus[selectedEnvironment.envVarSuffix] || false;
  };

  const fetchData = async (skipToken?: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Demo mode - use test endpoint
      if (isDemoMode) {
        const demoQuery = `inq_missionaries?$top=${pageSize}`;
        const response = await fetch('/api/inq/test-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            environment: selectedEnvironment.envVarSuffix,
            query: demoQuery
          })
        });

        const result = await response.json();
        if (response.ok) {
          // Transform demo response to match pagination format
          const demoData = {
            success: true,
            environment: selectedEnvironment.envVarSuffix,
            currentPage: currentPage,
            pageSize: pageSize,
            totalPages: Math.ceil(result.totalCount / pageSize),
            totalRecords: result.totalCount,
            hasNextPage: result.hasNextPage,
            hasPreviousPage: currentPage > 1,
            data: result.data,
            queryUrl: result.queryUrl,
            timestamp: result.timestamp,
            nextSkipToken: result.hasNextPage ? `demo-token-${currentPage}` : undefined
          };
          setPaginationData(demoData);
          setCurrentSkipToken(skipToken);
        } else {
          setError(`Demo query failed: ${result.error}`);
        }
        setIsLoading(false);
        return;
      }

      // Real mode - check for secrets
      const hasSecret = await checkSecretStatus(selectedEnvironment);
      if (!hasSecret) {
        setError(`Client secret not configured for ${selectedEnvironment.name} environment. Set INQ_CLIENT_SECRET_${selectedEnvironment.envVarSuffix} and restart the server.`);
        setIsLoading(false);
        return;
      }

      const requestBody = {
        environment: selectedEnvironment.envVarSuffix,
        pageSize,
        currentPage,
        filter: customFilter || filter,
        select: customSelect || select,
        orderBy,
        skipToken
      };

      const response = await fetch('/api/inq/paginate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (!response.ok) {
        setError(`Query failed: ${result.error}. ${JSON.stringify(result.details, null, 2)}`);
        return;
      }

      setPaginationData(result);
      setCurrentSkipToken(skipToken);
      
    } catch (err) {
      setError(`Error: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const goToNextPage = () => {
    if (paginationData?.nextSkipToken) {
      // Save current skip token to history for back navigation
      setSkipTokenHistory(prev => [...prev, currentSkipToken || '']);
      setCurrentPage(prev => prev + 1);
      fetchData(paginationData.nextSkipToken);
    }
  };

  const goToPreviousPage = () => {
    if (skipTokenHistory.length > 0) {
      // Get the previous skip token from history
      const prevToken = skipTokenHistory[skipTokenHistory.length - 1];
      setSkipTokenHistory(prev => prev.slice(0, -1));
      setCurrentPage(prev => prev - 1);
      fetchData(prevToken === '' ? undefined : prevToken);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
    setSkipTokenHistory([]);
    setCurrentSkipToken(undefined);
    fetchData();
  };

  // Trigger fetch when pagination parameters change
  useEffect(() => {
    if (getClientSecretStatus() || isDemoMode) {
      // Reset pagination state when filters change
      setCurrentPage(1);
      setSkipTokenHistory([]);
      setCurrentSkipToken(undefined);
      fetchData();
    }
  }, [pageSize, filter, customFilter, select, customSelect, orderBy, selectedEnvironment, isDemoMode]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">📄</span>
        <h1 className="text-2xl font-bold">INQ Data Explorer</h1>
        <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Advanced Pagination</span>
      </div>

      {/* Environment Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Environment & Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {INQ_ENVIRONMENTS.map((env) => (
            <button
              key={env.name}
              onClick={() => {
                setSelectedEnvironment(env);
                setCurrentPage(1); // Reset to first page when switching environments
              }}
              className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                selectedEnvironment.name === env.name
                  ? 'border-purple-500 bg-purple-50 text-purple-900'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-semibold text-lg">{env.name}</div>
              <div className="text-sm text-gray-600 mt-1">{env.description}</div>
              <div className="mt-2">
                {isDemoMode ? (
                  <span className="text-blue-600 text-xs">🎭 Demo Mode Active</span>
                ) : getClientSecretStatus() ? (
                  <span className="text-green-600 text-xs">✓ Secret configured</span>
                ) : (
                  <span className="text-red-600 text-xs">❌ Secret missing</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Quick Controls */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Page Size:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {PAGE_SIZE_OPTIONS.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Order By:</label>
            <select
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {ORDER_BY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>

          <button
            onClick={() => fetchData()}
            disabled={isLoading || (!getClientSecretStatus() && !isDemoMode)}
            className="flex items-center gap-1 px-4 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>

          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`flex items-center gap-1 px-3 py-1 border rounded text-sm ${
              isDemoMode 
                ? 'border-green-500 bg-green-50 text-green-700' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <EyeIcon className="h-4 w-4" />
            {isDemoMode ? 'Demo Mode' : 'Real Mode'}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Query Options</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter ($filter)</label>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {COMMON_FILTERS.map(f => (
                    <button
                      key={f.name}
                      onClick={() => {
                        setFilter(f.filter);
                        setCustomFilter('');
                        setCurrentPage(1);
                      }}
                      className={`text-left p-2 rounded border text-xs ${
                        filter === f.filter && !customFilter
                          ? 'border-purple-500 bg-purple-50 text-purple-900'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Custom filter (e.g., inq_name eq 'Smith')"
                  value={customFilter}
                  onChange={(e) => {
                    setCustomFilter(e.target.value);
                    setFilter('');
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>

            {/* Select Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fields ($select)</label>
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  {COMMON_SELECTS.map(s => (
                    <button
                      key={s.name}
                      onClick={() => {
                        setSelect(s.select);
                        setCustomSelect('');
                      }}
                      className={`text-left p-2 rounded border text-xs ${
                        select === s.select && !customSelect
                          ? 'border-purple-500 bg-purple-50 text-purple-900'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Custom select (e.g., inq_name,inq_missionarynumber)"
                  value={customSelect}
                  onChange={(e) => {
                    setCustomSelect(e.target.value);
                    setSelect('');
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-2 text-red-800 mb-2">
            <span className="text-lg">❌</span>
            <span className="font-semibold">Query Error</span>
          </div>
          <pre className="text-red-700 text-sm whitespace-pre-wrap">{error}</pre>
          {!getClientSecretStatus() && !isDemoMode && (
            <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded">
              <div className="text-yellow-800 text-sm">
                <strong>Setup Required:</strong> Set environment variable <code>INQ_CLIENT_SECRET_{selectedEnvironment.envVarSuffix}</code> and restart the server, or use Demo Mode for testing.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {paginationData && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Query Results</h2>
              <p className="text-sm text-gray-600">
                Showing {((paginationData.currentPage - 1) * paginationData.pageSize) + 1} to{' '}
                {Math.min(paginationData.currentPage * paginationData.pageSize, paginationData.totalRecords || 0)} 
                {paginationData.totalRecords ? ` of ${paginationData.totalRecords}` : ''} records
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(JSON.stringify(paginationData.data, null, 2))}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded px-2 py-1"
              >
                <DocumentDuplicateIcon className="h-4 w-4" />
                Copy JSON
              </button>
            </div>
          </div>

          {/* Pagination Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="text-purple-800 text-sm font-medium">Current Page</div>
              <div className="text-purple-900 text-xl font-bold">{paginationData.currentPage}</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-blue-800 text-sm font-medium">Total Pages</div>
              <div className="text-blue-900 text-xl font-bold">{paginationData.totalPages || '?'}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-green-800 text-sm font-medium">Total Records</div>
              <div className="text-green-900 text-xl font-bold">{paginationData.totalRecords || '?'}</div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="text-orange-800 text-sm font-medium">Page Size</div>
              <div className="text-orange-900 text-xl font-bold">{paginationData.pageSize}</div>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <button
                onClick={goToFirstPage}
                disabled={!paginationData.hasPreviousPage}
                className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="First page"
              >
                <ChevronDoubleLeftIcon className="h-4 w-4" />
              </button>
              <button
                onClick={goToPreviousPage}
                disabled={!paginationData.hasPreviousPage}
                className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous page"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Page {paginationData.currentPage}
                {paginationData.totalPages ? ` of ${paginationData.totalPages}` : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={goToNextPage}
                disabled={!paginationData.hasNextPage}
                className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next page"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
              <button
                onClick={goToFirstPage}
                disabled={!paginationData.hasNextPage || !paginationData.totalPages}
                className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Last page (approximation)"
              >
                <ChevronDoubleRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Data Table */}
          {paginationData.data.value && paginationData.data.value.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginationData.data.value.map((missionary: any, index: number) => (
                    <tr key={missionary.inq_missionaryid || index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">
                          {missionary.inq_name || `${missionary.inq_officialfirstname || ''} ${missionary.inq_officiallastname || ''}`.trim() || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                        {missionary.inq_missionarynumber || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          missionary.inq_calculatedstatus === 'In-field' 
                            ? 'bg-green-100 text-green-800'
                            : missionary.inq_calculatedstatus === 'Released'
                            ? 'bg-gray-100 text-gray-800'
                            : missionary.inq_calculatedstatus === 'Preparing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {missionary.inq_calculatedstatus || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {missionary.inq_startdate ? new Date(missionary.inq_startdate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {missionary.inq_personalemail ? (
                          <a href={`mailto:${missionary.inq_personalemail}`} className="text-purple-600 hover:text-purple-800">
                            {missionary.inq_personalemail}
                          </a>
                        ) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(missionary, null, 2))}
                          className="text-gray-400 hover:text-gray-600"
                          title="Copy record"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📭</div>
              <div className="text-lg font-medium">No Records Found</div>
              <div className="text-sm">Try adjusting your filters or search criteria.</div>
            </div>
          )}

          {/* Query Info */}
          <details className="mt-6 bg-gray-50 rounded-lg p-4">
            <summary className="cursor-pointer font-medium text-gray-900 hover:text-gray-700">
              View Query Details
            </summary>
            <div className="mt-3 space-y-2 text-sm">
              <div><strong>Query URL:</strong> <code className="bg-white px-1 rounded">{paginationData.queryUrl}</code></div>
              <div><strong>Environment:</strong> {paginationData.environment}</div>
              <div><strong>Timestamp:</strong> {new Date(paginationData.timestamp).toLocaleString()}</div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
