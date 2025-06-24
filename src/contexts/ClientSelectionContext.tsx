'use client';

import React, { createContext, useContext } from 'react';

export interface ClientInfo {
  id: string;
  name: string;
  description: string;
}

// Fixed test client - no switching
const TEST_CLIENT: ClientInfo = {
  id: '0oa82h6j45rN8G1he5d7',
  name: 'Test-Client',
  description: 'Fixed test client for all users'
};

interface ClientSelectionContextType {
  selectedClientId: string;
  selectedClient: ClientInfo;
  setSelectedClientId: (clientId: string) => void;
  availableClients: ClientInfo[];
  isUserSwitching: boolean;
}

const ClientSelectionContext = createContext<ClientSelectionContextType | undefined>(undefined);

export function ClientSelectionProvider({ children }: { children: React.ReactNode }) {
  // Always use the fixed test client
  const contextValue: ClientSelectionContextType = {
    selectedClientId: TEST_CLIENT.id,
    selectedClient: TEST_CLIENT,
    setSelectedClientId: () => {}, // No-op since we don't allow switching
    availableClients: [TEST_CLIENT],
    isUserSwitching: false
  };

  return (
    <ClientSelectionContext.Provider value={contextValue}>
      {children}
    </ClientSelectionContext.Provider>
  );
}

export function useClientSelection() {
  const context = useContext(ClientSelectionContext);
  if (context === undefined) {
    throw new Error('useClientSelection must be used within a ClientSelectionProvider');
  }
  return context;
}
