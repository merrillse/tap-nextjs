'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ClientInfo {
  id: string;
  name: string;
  description: string;
}

export const AVAILABLE_CLIENTS: ClientInfo[] = [
  {
    id: '0oak0jqakvevwjWrp357',
    name: 'Missionary Graph Service Team',
    description: 'Production client for Missionary Graph Service team'
  },
  {
    id: '0oa82h6j45rN8G1he5d7',
    name: 'Test Client',
    description: 'Test client for lab/workshop attendees'
  }
];

interface ClientSelectionContextType {
  selectedClientId: string;
  selectedClient: ClientInfo;
  setSelectedClientId: (clientId: string) => void;
  availableClients: ClientInfo[];
}

const ClientSelectionContext = createContext<ClientSelectionContextType | undefined>(undefined);

const CLIENT_STORAGE_KEY = 'tap-selected-client-id';
const DEFAULT_CLIENT_ID = '0oak0jqakvevwjWrp357'; // Default to MGS Team

export function ClientSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedClientId, setSelectedClientIdState] = useState<string>(DEFAULT_CLIENT_ID);

  // Load saved client selection on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CLIENT_STORAGE_KEY);
      if (saved && AVAILABLE_CLIENTS.find(client => client.id === saved)) {
        setSelectedClientIdState(saved);
      }
    } catch (error) {
      console.warn('Error loading saved client selection:', error);
    }
  }, []);

  // Save client selection when it changes
  const setSelectedClientId = (clientId: string) => {
    try {
      localStorage.setItem(CLIENT_STORAGE_KEY, clientId);
      setSelectedClientIdState(clientId);
    } catch (error) {
      console.warn('Error saving client selection:', error);
      setSelectedClientIdState(clientId);
    }
  };

  const selectedClient = AVAILABLE_CLIENTS.find(client => client.id === selectedClientId) || AVAILABLE_CLIENTS[0];

  return (
    <ClientSelectionContext.Provider value={{
      selectedClientId,
      selectedClient,
      setSelectedClientId,
      availableClients: AVAILABLE_CLIENTS
    }}>
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
