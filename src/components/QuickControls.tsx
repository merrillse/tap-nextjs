import React from 'react';
import { AdjustmentsHorizontalIcon, ArrowPathIcon, EyeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface QuickControlsProps {
  pageSize: number;
  setPageSize: (n: number) => void;
  orderBy: string;
  setOrderBy: (s: string) => void;
  showAdvanced: boolean;
  setShowAdvanced: (b: boolean) => void;
  fetchData: () => void;
  isLoading: boolean;
  getClientSecretStatus: () => boolean;
  isDemoMode: boolean;
  setIsDemoMode: (b: boolean) => void;
  checkSecretStatus: () => Promise<boolean>;
  setError: (msg: string) => void;
  selectedEnvironment: { envVarSuffix: string };
  PAGE_SIZE_OPTIONS: number[];
  ORDER_BY_OPTIONS: { name: string; value: string }[];
}

const QuickControls: React.FC<QuickControlsProps> = ({
  pageSize,
  setPageSize,
  orderBy,
  setOrderBy,
  showAdvanced,
  setShowAdvanced,
  fetchData,
  isLoading,
  getClientSecretStatus,
  isDemoMode,
  setIsDemoMode,
  checkSecretStatus,
  setError,
  selectedEnvironment,
  PAGE_SIZE_OPTIONS,
  ORDER_BY_OPTIONS,
}) => (
  <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">Page Size:</label>
      <select
        value={pageSize}
        onChange={e => {
          setPageSize(Number(e.target.value));
        }}
        className="border border-gray-300 rounded px-2 py-1 text-sm"
        title="Recommended: 25-100 for good performance"
      >
        {PAGE_SIZE_OPTIONS.map(size => (
          <option key={size} value={size}>
            {size}
            {isDemoMode && size <= 10
              ? ' (demo)'
              : size >= 200
                ? ' (large)'
                : size >= 25 && size <= 100
                  ? ' (recommended)'
                  : ''}
          </option>
        ))}
      </select>
    </div>
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">Order By:</label>
      <select
        value={orderBy}
        onChange={e => setOrderBy(e.target.value)}
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
      onClick={fetchData}
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
    {!isDemoMode && (
      <button
        onClick={async () => {
          const hasSecret = await checkSecretStatus();
          if (hasSecret) {
            setError('');
            fetchData();
          } else {
            setError(`Secret check failed: INQ_CLIENT_SECRET_${selectedEnvironment.envVarSuffix} is not configured. Please set this environment variable and restart the server.`);
          }
        }}
        className="flex items-center gap-1 px-3 py-1 border border-blue-300 bg-blue-50 text-blue-700 rounded text-sm hover:bg-blue-100"
      >
        <MagnifyingGlassIcon className="h-4 w-4" />
        Check Status
      </button>
    )}
  </div>
);

export default QuickControls;
