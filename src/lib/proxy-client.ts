// Utility functions for managing proxy client selection

export function getSelectedProxyClient(): string {
  if (typeof window === 'undefined') {
    return 'primary'; // Default for server-side
  }
  
  const savedProxyClient = localStorage.getItem('selectedProxyClient');
  if (savedProxyClient) {
    return savedProxyClient;
  }
  
  // Check if it's stored in settings
  const savedSettings = localStorage.getItem('tap-settings');
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      return parsed.proxyClient || 'primary';
    } catch {
      return 'primary';
    }
  }
  
  return 'primary';
}

export function setSelectedProxyClient(clientId: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.setItem('selectedProxyClient', clientId);
  
  // Also update settings if they exist
  const savedSettings = localStorage.getItem('tap-settings');
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      parsed.proxyClient = clientId;
      localStorage.setItem('tap-settings', JSON.stringify(parsed));
    } catch {
      // If settings are corrupted, just continue
    }
  }
}
