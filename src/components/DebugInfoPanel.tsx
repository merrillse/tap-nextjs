'use client';

import { useState, useEffect } from 'react';
import { useClientSelection } from '@/contexts/ClientSelectionContext';
import { getCurrentSession } from '@/lib/user-session';
import { getTokenCacheStats } from '@/lib/token-cache';

interface DebugInfo {
  selectedClientId: string;
  selectedClientName: string;
  currentSession: any;
  tokenCacheStats: any;
  environmentConfig: any;
}

export default function DebugInfoPanel() {
  const { selectedClient, selectedClientId } = useClientSelection();
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  // Toggle debug panel with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl+Shift+D or Cmd+Shift+D to toggle debug panel
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Update debug info when panel is visible
  useEffect(() => {
    if (isVisible) {
      const updateDebugInfo = () => {
        const session = getCurrentSession();
        const tokenStats = getTokenCacheStats();
        
        setDebugInfo({
          selectedClientId,
          selectedClientName: selectedClient.name,
          currentSession: session,
          tokenCacheStats: tokenStats,
          environmentConfig: {
            NODE_ENV: process.env.NODE_ENV,
            timestamp: new Date().toISOString()
          }
        });
      };

      updateDebugInfo();
      const interval = setInterval(updateDebugInfo, 2000); // Update every 2 seconds

      return () => clearInterval(interval);
    }
  }, [isVisible, selectedClientId, selectedClient]);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-50 hover:opacity-100 transition-opacity"
          title="Press Ctrl+Shift+D to toggle debug panel"
        >
          🐛 Debug
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-gray-900 text-green-400 p-4 rounded-lg shadow-lg max-w-md max-h-96 overflow-y-auto font-mono text-xs border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-green-300 font-bold">🐛 Debug Info</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white transition-colors"
          title="Close debug panel (Ctrl+Shift+D)"
        >
          ✕
        </button>
      </div>

      {debugInfo && (
        <div className="space-y-3">
          {/* Client Information */}
          <div className="border-b border-gray-700 pb-2">
            <div className="text-green-300 font-semibold mb-1">🔐 Current Client</div>
            <div>ID: <span className="text-yellow-400">{debugInfo.selectedClientId}</span></div>
            <div>Name: <span className="text-yellow-400">{debugInfo.selectedClientName}</span></div>
          </div>

          {/* Session Information */}
          <div className="border-b border-gray-700 pb-2">
            <div className="text-green-300 font-semibold mb-1">📊 Session</div>
            {debugInfo.currentSession ? (
              <>
                <div>Session ID: <span className="text-yellow-400">{debugInfo.currentSession.sessionId}</span></div>
                <div>Started: <span className="text-yellow-400">{new Date(debugInfo.currentSession.startTime).toLocaleTimeString()}</span></div>
                <div>Last Active: <span className="text-yellow-400">{new Date(debugInfo.currentSession.lastActivity).toLocaleTimeString()}</span></div>
              </>
            ) : (
              <div className="text-red-400">No active session</div>
            )}
          </div>

          {/* Token Cache Stats */}
          <div className="border-b border-gray-700 pb-2">
            <div className="text-green-300 font-semibold mb-1">🎫 Token Cache</div>
            <div>Memory Count: <span className="text-yellow-400">{debugInfo.tokenCacheStats.memoryCount}</span></div>
            <div>Valid Tokens: <span className="text-green-400">{debugInfo.tokenCacheStats.validTokens}</span></div>
            <div>Expired Tokens: <span className="text-red-400">{debugInfo.tokenCacheStats.expiredTokens}</span></div>
            <div>Environments: <span className="text-yellow-400">{debugInfo.tokenCacheStats.environments.join(', ') || 'None'}</span></div>
          </div>

          {/* Current URL and Environment */}
          <div className="border-b border-gray-700 pb-2">
            <div className="text-green-300 font-semibold mb-1">🌐 Current Context</div>
            <div>URL: <span className="text-yellow-400 break-all">{typeof window !== 'undefined' ? window.location.pathname : 'N/A'}</span></div>
            <div>Environment: <span className="text-yellow-400">{localStorage.getItem('selectedEnvironment') || 'None'}</span></div>
            <div>Proxy Client: <span className="text-yellow-400">{localStorage.getItem('selectedProxyClient') || 'None'}</span></div>
          </div>

          {/* GraphQL Request Debug Info */}
          <div className="border-b border-gray-700 pb-2">
            <div className="text-green-300 font-semibold mb-1">🚀 GraphQL Debug</div>
            <div className="text-gray-300 text-xs mb-1">Console Logging Active:</div>
            <div>• Client ID: <span className="text-green-400">✓ Logged</span></div>
            <div>• Target URL: <span className="text-green-400">✓ Logged</span></div>
            <div>• Environment: <span className="text-green-400">✓ Logged</span></div>
            <div>• Request/Response: <span className="text-green-400">✓ Logged</span></div>
            <div className="text-xs text-gray-400 mt-1">
              Open browser DevTools Console to see detailed request debugging info when making GraphQL requests.
            </div>
          </div>

          {/* Local Storage Stats */}
          <div className="border-b border-gray-700 pb-2">
            <div className="text-green-300 font-semibold mb-1">💾 Local Storage</div>
            <div>Total Keys: <span className="text-yellow-400">{typeof window !== 'undefined' ? Object.keys(localStorage).length : 0}</span></div>
            <div>Search Histories: <span className="text-yellow-400">
              {typeof window !== 'undefined' 
                ? Object.keys(localStorage).filter(key => key.includes('search-history')).length 
                : 0}
            </span></div>
          </div>

          {/* Network Debug URLs */}
          <div>
            <div className="text-green-300 font-semibold mb-1">🔗 Debug Actions</div>
            <div className="space-y-1">
              <button
                onClick={() => console.log('Current localStorage:', localStorage)}
                className="text-blue-400 hover:text-blue-300 underline block"
              >
                Log localStorage
              </button>
              <button
                onClick={() => console.log('Debug Info:', debugInfo)}
                className="text-blue-400 hover:text-blue-300 underline block"
              >
                Log Debug Info
              </button>
              <button
                onClick={() => {
                  const stats = getTokenCacheStats();
                  console.log('Token Cache Stats:', stats);
                }}
                className="text-blue-400 hover:text-blue-300 underline block"
              >
                Log Token Cache
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 pt-2 border-t border-gray-700 text-gray-500 text-center">
        Press <kbd className="bg-gray-700 px-1 rounded">Ctrl+Shift+D</kbd> to toggle
      </div>
    </div>
  );
}
