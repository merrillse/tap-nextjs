'use client';

import { useState, useEffect } from 'react';
import { getEnvironmentKeys, getEnvironmentConfig } from '@/lib/environments';

export default function EnvironmentIndicator() {
  const [currentEnvironment, setCurrentEnvironment] = useState<string>('mis-gql-stage');
  const [config, setConfig] = useState<any>(null);

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

  return (
    <div 
      className={`${style.bg} ${style.text} ${style.border} border rounded-full px-3 py-1 flex items-center space-x-1.5 text-xs font-medium cursor-default`}
      title={config.name}
    >
      <span className="text-xs">{style.icon}</span>
      <span>{style.label}</span>
      {style.warning && (
        <span className="text-red-600 font-bold">⚠️</span>
      )}
    </div>
  );
}
