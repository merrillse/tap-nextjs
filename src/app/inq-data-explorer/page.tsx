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
import { Environment } from '../../types/inq';
import EnvironmentSelector from '../../components/EnvironmentSelector';
import QuickControls from '../../components/QuickControls';
import AdvancedFilters from '../../components/AdvancedFilters';
import ErrorDisplay from '../../components/ErrorDisplay';
import ResultsTable from '../../components/ResultsTable';

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

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100, 200, 500];

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
  const [pageSize, setPageSize] = useState(5);
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
  
  // Preserve total count across pages (only available on first page)
  const [totalRecordCount, setTotalRecordCount] = useState<number | undefined>(undefined);
  const [totalPageCount, setTotalPageCount] = useState<number | undefined>(undefined);

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
        let detailsString = '';
        try {
          detailsString = typeof result.details === 'object'
            ? JSON.stringify(result.details, null, 2)
            : String(result.details);
        } catch {
          detailsString = 'Unserializable error details';
        }
        setError(`Query failed: ${result.error}. ${detailsString}`);
        return;
      }

      console.log('Pagination Data Received:', {
        currentPage: result.currentPage,
        pageSize: result.pageSize,
        totalRecords: result.totalRecords,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPreviousPage: result.hasPreviousPage,
        nextSkipToken: result.nextSkipToken,
        dataLength: result.data?.value?.length
      });

      // Preserve total counts from first page
      if (result.totalRecords !== undefined && result.totalRecords !== null) {
        setTotalRecordCount(result.totalRecords);
        setTotalPageCount(result.totalPages);
      }

      // Enhance result with preserved totals - use state values if backend doesn't provide them
      const enhancedResult = {
        ...result,
        totalRecords: result.totalRecords !== undefined ? result.totalRecords : totalRecordCount,
        totalPages: result.totalPages !== undefined ? result.totalPages : totalPageCount
      };

      // Debug: Enhanced result with preserved totals
      console.log('Enhanced Result:', {
        totalRecords: enhancedResult.totalRecords,
        totalPages: enhancedResult.totalPages,
        preservedTotalRecords: totalRecordCount,
        preservedTotalPages: totalPageCount
      });

      setPaginationData(enhancedResult);
      setCurrentSkipToken(skipToken);
      
    } catch (err) {
      let errorMsg = 'Unknown error';
      if (err instanceof Error) {
        errorMsg = err.message;
      } else if (typeof err === 'string') {
        errorMsg = err;
      } else {
        try {
          errorMsg = JSON.stringify(err);
        } catch {
          errorMsg = 'Unserializable error object';
        }
      }
      setError(`Error: ${errorMsg}`);
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

  const goToLastPage = () => {
    // For Dataverse, we can't directly jump to last page due to skiptoken pagination
    // This button will be disabled unless we have totalPages info
    if (paginationData?.totalPages) {
      // This is a simplified implementation - would need multiple API calls to truly reach last page
      setError('Direct navigation to last page is not supported with Dataverse pagination. Use Next/Previous buttons to navigate.');
    }
  };

  // Trigger fetch when pagination parameters change
  useEffect(() => {
    if (getClientSecretStatus() || isDemoMode) {
      // Reset pagination state when filters change
      setCurrentPage(1);
      setSkipTokenHistory([]);
      setCurrentSkipToken(undefined);
      setTotalRecordCount(undefined);
      setTotalPageCount(undefined);
      fetchData();
    }
  }, [pageSize, filter, customFilter, select, customSelect, orderBy, selectedEnvironment, isDemoMode, secretStatus]);

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
        {isDemoMode && (
          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">🎭 Demo Mode</span>
        )}
      </div>

      {/* Environment Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Environment & Configuration</h2>
        <EnvironmentSelector
          environments={INQ_ENVIRONMENTS}
          selectedEnvironment={selectedEnvironment}
          setSelectedEnvironment={setSelectedEnvironment}
          setCurrentPage={setCurrentPage}
          isDemoMode={isDemoMode}
          getClientSecretStatus={getClientSecretStatus}
        />
        {/* Quick Controls */}
        <QuickControls
          pageSize={pageSize}
          setPageSize={n => { setPageSize(n); setCurrentPage(1); }}
          orderBy={orderBy}
          setOrderBy={setOrderBy}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          fetchData={fetchData}
          isLoading={isLoading}
          getClientSecretStatus={getClientSecretStatus}
          isDemoMode={isDemoMode}
          setIsDemoMode={setIsDemoMode}
          checkSecretStatus={() => checkSecretStatus(selectedEnvironment)}
          setError={setError}
          selectedEnvironment={selectedEnvironment}
          PAGE_SIZE_OPTIONS={PAGE_SIZE_OPTIONS}
          ORDER_BY_OPTIONS={ORDER_BY_OPTIONS}
        />
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <AdvancedFilters
          COMMON_FILTERS={COMMON_FILTERS}
          COMMON_SELECTS={COMMON_SELECTS}
          filter={filter}
          setFilter={setFilter}
          customFilter={customFilter}
          setCustomFilter={setCustomFilter}
          select={select}
          setSelect={setSelect}
          customSelect={customSelect}
          setCustomSelect={setCustomSelect}
          setCurrentPage={setCurrentPage}
        />
      )}

      {/* Error Display */}
      {error && (
        <ErrorDisplay
          error={error}
          getClientSecretStatus={getClientSecretStatus}
          isDemoMode={isDemoMode}
          selectedEnvironment={selectedEnvironment}
        />
      )}

      {/* Results */}
      {paginationData && (
        <ResultsTable
          paginationData={paginationData}
          isDemoMode={isDemoMode}
          copyToClipboard={copyToClipboard}
          goToFirstPage={goToFirstPage}
          goToPreviousPage={goToPreviousPage}
          goToNextPage={goToNextPage}
          goToLastPage={goToLastPage}
        />
      )}
    </div>
  );
}
