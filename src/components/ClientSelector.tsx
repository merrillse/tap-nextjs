'use client';

import { useState } from 'react';
import { useClientSelection } from '@/contexts/ClientSelectionContext';

export default function ClientSelector() {
  const { selectedClient, availableClients, setSelectedClientId } = useClientSelection();
  const [isOpen, setIsOpen] = useState(false);

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="hidden sm:inline">{selectedClient.name}</span>
          <span className="sm:hidden">{selectedClient.name.split(' ')[0]}</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-20">
            <div className="py-1">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                Select Client Identity
              </div>
              
              {availableClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleClientSelect(client.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    selectedClient.id === client.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      selectedClient.id === client.id ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{client.description}</div>
                      <div className="text-xs text-gray-400 mt-1 font-mono">{client.id}</div>
                    </div>
                    {selectedClient.id === client.id && (
                      <div className="text-blue-500">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100 bg-gray-50">
              💡 Client identity affects authentication to MGQL and MOGS services
            </div>
          </div>
        </>
      )}
    </div>
  );
}
