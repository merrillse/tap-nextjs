'use client';

import { useMemo, useEffect, useState } from 'react';
import { ApiClient } from '@/lib/api-client';
import { getEnvironmentConfigWithClient } from '@/lib/environments';
import { useClientSelection } from '@/contexts/ClientSelectionContext';

/**
 * Hook to create an API client with the currently selected clientId
 * This ensures all API calls use the selected client for authentication
 * and automatically refreshes when users switch
 */
export function useApiClient(environmentKey: string) {
  const { selectedClientId } = useClientSelection();
  const [forceRefresh, setForceRefresh] = useState(0);

  // Listen for user switch events to force refresh of API client
  useEffect(() => {
    const handleUserSwitch = () => {
      setForceRefresh(prev => prev + 1);
    };

    const handleClientSwitch = (event: CustomEvent) => {
      if (event.detail.switched) {
        setForceRefresh(prev => prev + 1);
      }
    };

    window.addEventListener('userSwitch', handleUserSwitch);
    window.addEventListener('clientSwitch', handleClientSwitch as EventListener);

    return () => {
      window.removeEventListener('userSwitch', handleUserSwitch);
      window.removeEventListener('clientSwitch', handleClientSwitch as EventListener);
    };
  }, []);

  return useMemo(() => {
    const config = getEnvironmentConfigWithClient(environmentKey, selectedClientId);
    if (!config) {
      throw new Error(`Environment '${environmentKey}' not found`);
    }
    
    const client = new ApiClient(config, environmentKey);
    
    // Force invalidate any cached tokens when user switches
    if (forceRefresh > 0) {
      client.invalidateToken();
    }
    
    return client;
  }, [environmentKey, selectedClientId, forceRefresh]);
}
