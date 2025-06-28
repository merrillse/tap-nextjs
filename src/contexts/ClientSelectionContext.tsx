'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ClientInfo {
  id: string;
  name: string;
  clientId: string;
  description?: string;
  environment?: 'prod' | 'non-prod' | 'both' | 'unknown';
  tenant?: 'production' | 'development';
}

// Default test client - fallback when no client is selected
const DEFAULT_CLIENT: ClientInfo = {
  id: '52',
  name: 'Automated Testing',
  clientId: '0oa82h6j45rN8G1he5d7',
  description: 'Default test client',
  environment: 'unknown',
  tenant: 'development'
};

interface ClientSelectionContextType {
  selectedClientId: string;
  selectedClient: ClientInfo;
  setSelectedClientId: (clientId: string) => void;
  setSelectedClient: (client: ClientInfo) => void;
  availableClients: ClientInfo[];
  isUserSwitching: boolean;
}

const ClientSelectionContext = createContext<ClientSelectionContextType | undefined>(undefined);

export function ClientSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedClient, setSelectedClientState] = useState<ClientInfo>(DEFAULT_CLIENT);
  const [availableClients, setAvailableClients] = useState<ClientInfo[]>([]);

  // Load the current client from localStorage on mount
  useEffect(() => {
    const savedCurrentClient = localStorage.getItem('currentSelectedClient');
    if (savedCurrentClient) {
      try {
        const parsed = JSON.parse(savedCurrentClient);
        setSelectedClientState(parsed);
      } catch (e) {
        console.error('Error parsing current client:', e);
      }
    }

    // Load available clients from client management
    const savedClients = localStorage.getItem('clientManagement');
    if (savedClients) {
      try {
        const parsed = JSON.parse(savedClients);
        setAvailableClients(parsed);
      } catch (e) {
        console.error('Error parsing available clients:', e);
      }
    }
  }, []);

  const setSelectedClient = (client: ClientInfo) => {
    setSelectedClientState(client);
    localStorage.setItem('currentSelectedClient', JSON.stringify(client));
  };

  const setSelectedClientId = (clientId: string) => {
    const client = availableClients.find(c => c.clientId === clientId);
    if (client) {
      setSelectedClient(client);
    }
  };

  const contextValue: ClientSelectionContextType = {
    selectedClientId: selectedClient.clientId,
    selectedClient,
    setSelectedClientId,
    setSelectedClient,
    availableClients,
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
