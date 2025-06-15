'use client';

import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { getEnvironmentConfig } from '@/lib/environments';

interface GraphQLPageHeaderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  selectedEnvironment: string;
  environmentOptions: Array<{ key: string; name: string }>;
  onEnvironmentChange: (event: SelectChangeEvent) => void;
  additionalInfo?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function GraphQLPageHeader({
  title,
  description,
  icon,
  selectedEnvironment,
  environmentOptions,
  onEnvironmentChange,
  additionalInfo,
  onRefresh,
  isLoading = false
}: GraphQLPageHeaderProps) {
  const currentEnv = getEnvironmentConfig(selectedEnvironment);
  const systemType = selectedEnvironment.includes('mogs') ? 'MOGS' : 'MGQL';

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                {icon}
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 rounded-xl blur-md opacity-60 -z-10"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-gray-600 mt-1">{description}</p>
              {currentEnv && (
                <div className="flex items-center space-x-2 mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {systemType}
                  </span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-600">{currentEnv.name}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Environment Selector and Controls */}
          <div className="flex items-center space-x-4">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="environment-select-label">Select Environment</InputLabel>
              <Select
                labelId="environment-select-label"
                value={selectedEnvironment}
                label="Select Environment"
                onChange={onEnvironmentChange}
                sx={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e5e7eb',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#d1d5db',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3b82f6',
                  }
                }}
              >
                {environmentOptions.map(env => (
                  <MenuItem key={env.key} value={env.key}>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {env.key.includes('mogs') ? 'MOGS' : 'MGQL'}
                      </span>
                      <span>{env.name}</span>
                    </div>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Refresh Button and Additional Info */}
            {onRefresh && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="inline-flex items-center p-1.5 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded-md text-gray-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh schema"
                >
                  <svg className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                {additionalInfo && (
                  <span className="text-xs text-gray-600">{additionalInfo}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
