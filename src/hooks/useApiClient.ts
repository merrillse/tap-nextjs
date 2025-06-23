'use client';

import { useMemo } from 'react';
import { ApiClient } from '@/lib/api-client';
import { getEnvironmentConfigWithClient } from '@/lib/environments';
import { useClientSelection } from '@/contexts/ClientSelectionContext';

/**
 * Hook to create an API client with the currently selected clientId
 * This ensures all API calls use the selected client for authentication
 */
export function useApiClient(environmentKey: string) {
  const { selectedClientId } = useClientSelection();

  return useMemo(() => {
    const config = getEnvironmentConfigWithClient(environmentKey, selectedClientId);
    if (!config) {
      throw new Error(`Environment '${environmentKey}' not found`);
    }
    
    return new ApiClient(config, environmentKey);
  }, [environmentKey, selectedClientId]);
}
