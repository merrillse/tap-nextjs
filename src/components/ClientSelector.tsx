'use client';

import { useClientSelection } from '@/contexts/ClientSelectionContext';

export default function ClientSelector() {
  const { selectedClient } = useClientSelection();

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-200">
        <span className="font-medium">{selectedClient.name}</span>
        <span className="text-xs ml-2 opacity-75">({selectedClient.clientId})</span>
      </div>
    </div>
  );
}
