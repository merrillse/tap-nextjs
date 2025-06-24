'use client';

import { useState, useEffect, useRef } from 'react';
import { getEnvironmentKeys, getEnvironmentConfig, getEnvironmentNames } from '@/lib/environments';

export default function EnvironmentIndicator() {
  const [currentEnvironment, setCurrentEnvironment] = useState<string>('mis-gql-dev');
  const [config, setConfig] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateEnvironment = () => {
    // Get environment from localStorage or default to staging
    const savedEnv = localStorage.getItem('selectedEnvironment') || 'mis-gql-stage';
    setCurrentEnvironment(savedEnv);
    setConfig(getEnvironmentConfig(savedEnv));
  };

  useEffect(() => {
    updateEnvironment();

    // Listen for localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedEnvironment') {
        updateEnvironment();
      }
    };

    // Listen for custom events when environment changes within the same tab
    const handleEnvironmentChange = () => {
      updateEnvironment();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('environmentChanged', handleEnvironmentChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('environmentChanged', handleEnvironmentChange);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEnvironmentChange = (newEnvironment: string) => {
    setCurrentEnvironment(newEnvironment);
    setConfig(getEnvironmentConfig(newEnvironment));
    localStorage.setItem('selectedEnvironment', newEnvironment);
    window.dispatchEvent(new Event('environmentChanged'));
    setIsDropdownOpen(false);
  };

  if (!config) return null;

  const getEnvironmentStyle = (env: string) => {
    switch (env) {
      case 'mis-gql-prod':
        return {
          bg: 'bg-red-50',
          text: 'text-red-800',
          border: 'border-red-200',
          label: 'PROD',
          icon: '🔴',
          warning: true
        };
      case 'mis-gql-stage':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-800',
          border: 'border-amber-200',
          label: 'STAGE',
          icon: '🟡',
          warning: false
        };
      case 'mis-gql-dev':
        return {
          bg: 'bg-green-50',
          text: 'text-green-800',
          border: 'border-green-200',
          label: 'DEV',
          icon: '🟢',
          warning: false
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-800',
          border: 'border-gray-200',
          label: 'UNKNOWN',
          icon: '⚪',
          warning: false
        };
    }
  };

  const style = getEnvironmentStyle(currentEnvironment);
  const allEnvironments = getEnvironmentNames();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`${style.bg} ${style.text} ${style.border} border rounded-full px-3 py-1 flex items-center space-x-1.5 text-xs font-medium hover:opacity-80 transition-opacity duration-200`}
        title={`${config.name} - Click to switch environments`}
      >
        <span className="text-xs">{style.icon}</span>
        <span>{style.label}</span>
        {style.warning && (
          <span className="text-red-600 font-bold">⚠️</span>
        )}
        <svg 
          className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Environment Dropdown */}
      {isDropdownOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
            Switch Environment
          </div>
          {allEnvironments.map((env) => {
            const envStyle = getEnvironmentStyle(env.key);
            const isActive = env.key === currentEnvironment;
            
            return (
              <button
                key={env.key}
                onClick={() => handleEnvironmentChange(env.key)}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors duration-200 ${
                  isActive ? 'bg-blue-50' : ''
                }`}
              >
                <span className="text-sm">{envStyle.icon}</span>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                    {env.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {env.key.replace('mis-gql-', '')}
                  </div>
                </div>
                {envStyle.warning && (
                  <span className="text-red-600 text-xs">⚠️</span>
                )}
                {isActive && (
                  <span className="text-blue-600 text-xs">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
