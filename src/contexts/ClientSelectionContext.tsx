'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  checkUserSwitch, 
  initializeSessionManagement, 
  getCurrentSession,
  switchUser
} from '@/lib/user-session';

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
  isUserSwitching: boolean;
}

const ClientSelectionContext = createContext<ClientSelectionContextType | undefined>(undefined);

const CLIENT_STORAGE_KEY = 'tap-selected-client-id';
const DEFAULT_CLIENT_ID = '0oak0jqakvevwjWrp357'; // Default to MGS Team

export function ClientSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedClientId, setSelectedClientIdState] = useState<string>(DEFAULT_CLIENT_ID);
  const [isUserSwitching, setIsUserSwitching] = useState<boolean>(false);

  // Initialize session management on mount
  useEffect(() => {
    initializeSessionManagement();
    
    // Try to restore from existing session first
    const currentSession = getCurrentSession();
    if (currentSession) {
      setSelectedClientIdState(currentSession.clientId);
    } else {
      // Fall back to localStorage
      try {
        const saved = localStorage.getItem(CLIENT_STORAGE_KEY);
        if (saved && AVAILABLE_CLIENTS.find(client => client.id === saved)) {
          setSelectedClientIdState(saved);
        }
      } catch (error) {
        console.warn('Error loading saved client selection:', error);
      }
    }
  }, []);

  // Save client selection when it changes and handle user switching
  const setSelectedClientId = (clientId: string) => {
    const currentClient = AVAILABLE_CLIENTS.find(client => client.id === clientId);
    if (!currentClient) {
      console.warn('Invalid client ID:', clientId);
      return;
    }

    setIsUserSwitching(true);
    
    try {
      // Check if this is a user switch (which will clear caches if needed)
      const switched = checkUserSwitch(clientId, currentClient.name);
      
      // Update the local state
      setSelectedClientIdState(clientId);
      
      // Update localStorage (this might be cleared and reset by user switching)
      localStorage.setItem(CLIENT_STORAGE_KEY, clientId);
      
      if (switched) {
        console.log(`🔄 User switched to ${currentClient.name}`);
        
        // Dispatch a more specific event for components that need to react
        window.dispatchEvent(new CustomEvent('clientSwitch', {
          detail: { 
            clientId, 
            clientName: currentClient.name,
            switched: true
          }
        }));
      }
    } catch (error) {
      console.warn('Error during client selection:', error);
      setSelectedClientIdState(clientId);
    } finally {
      // Add a small delay to show switching state, then reset
      setTimeout(() => {
        setIsUserSwitching(false);
      }, 500);
    }
  };

  const selectedClient = AVAILABLE_CLIENTS.find(client => client.id === selectedClientId) || AVAILABLE_CLIENTS[0];

  return (
    <ClientSelectionContext.Provider value={{
      selectedClientId,
      selectedClient,
      setSelectedClientId,
      availableClients: AVAILABLE_CLIENTS,
      isUserSwitching
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
