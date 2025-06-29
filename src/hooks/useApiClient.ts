'use client';

import { useMemo, useEffect, useState } from 'react';
import { ApiClient } from '@/lib/api-client';
import { getEnvironmentConfig } from '@/lib/environments';

/**
 * Hook to create an API client with the currently selected environment
 * This ensures all API calls use the environment config for authentication
 * and automatically refreshes when users switch environments
 */
export function useApiClient(environmentKey: string) {
  const [forceRefresh, setForceRefresh] = useState(0);

  // Listen for user switch events to force refresh of API client
  useEffect(() => {
    const handleUserSwitch = () => {
      setForceRefresh(prev => prev + 1);
    };

    window.addEventListener('userSwitch', handleUserSwitch);

    return () => {
      window.removeEventListener('userSwitch', handleUserSwitch);
    };
  }, []);

  return useMemo(() => {
    const config = getEnvironmentConfig(environmentKey);
    if (!config) {
      throw new Error(`Environment '${environmentKey}' not found`);
    }
    const client = new ApiClient(config, environmentKey);
    // Force invalidate any cached tokens when user switches
    if (forceRefresh > 0) {
      client.invalidateToken();
    }
    return client;
  }, [environmentKey, forceRefresh]);
}
