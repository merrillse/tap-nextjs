/**
 * User Session Management
 * 
 * Handles user switching, session isolation, and cache clearing
 * to prevent data leakage between different users/clients.
 */

import { clearAllCachedTokens, cleanupExpiredTokens } from './token-cache';
import { setSelectedProxyClient } from './proxy-client';

export interface UserSession {
  userId: string;
  clientId: string;
  clientName: string;
  sessionId: string;
  startTime: number;
  lastActivity: number;
}

const CURRENT_SESSION_KEY = 'tap_current_session';
const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours

/**
 * Get the current user session
 */
export function getCurrentSession(): UserSession | null {
  try {
    const stored = localStorage.getItem(CURRENT_SESSION_KEY);
    if (!stored) return null;
    
    const session = JSON.parse(stored) as UserSession;
    
    // Check if session is expired
    if (Date.now() - session.lastActivity > SESSION_TIMEOUT_MS) {
      clearCurrentSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.warn('Failed to get current session:', error);
    return null;
  }
}

/**
 * Start a new user session
 */
export function startUserSession(clientId: string, clientName: string): UserSession {
  const session: UserSession = {
    userId: clientId, // Use clientId as userId for OAuth-based auth
    clientId,
    clientName,
    sessionId: generateSessionId(),
    startTime: Date.now(),
    lastActivity: Date.now()
  };
  
  try {
    localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.warn('Failed to save session:', error);
  }
  
  console.log(`🔐 Started new session for ${clientName} (${clientId})`);
  return session;
}

/**
 * Update session activity timestamp
 */
export function updateSessionActivity(): void {
  const session = getCurrentSession();
  if (session) {
    session.lastActivity = Date.now();
    try {
      localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.warn('Failed to update session activity:', error);
    }
  }
}

/**
 * Clear the current session
 */
export function clearCurrentSession(): void {
  try {
    localStorage.removeItem(CURRENT_SESSION_KEY);
    console.log('🧹 Cleared current session');
  } catch (error) {
    console.warn('Failed to clear session:', error);
  }
}

/**
 * Switch to a different user/client
 * This clears all cached data to prevent data leakage
 */
export function switchUser(newClientId: string, newClientName: string): void {
  const currentSession = getCurrentSession();
  
  // If switching to the same user, just update activity
  if (currentSession && currentSession.clientId === newClientId) {
    updateSessionActivity();
    return;
  }
  
  console.log(`🔄 Switching user from ${currentSession ? currentSession.clientName : 'none'} to ${newClientName}`);
  
  // Clear all cached data
  clearUserData();
  
  // Start new session
  startUserSession(newClientId, newClientName);
  
  // Set the new proxy client
  setSelectedProxyClient(newClientId);
  
  // Dispatch event for components to react to user switch
  dispatchUserSwitchEvent(newClientId, newClientName);
}

/**
 * Clear all user-specific data and caches
 */
export function clearUserData(): void {
  console.log('🧹 Clearing all user data and caches...');
  
  // 1. Clear OAuth token caches
  clearAllCachedTokens();
  
  // 2. Clear search histories
  clearSearchHistories();
  
  // 3. Clear query library and saved queries
  clearQueryData();
  
  // 4. Clear environment-specific cached data
  clearEnvironmentData();
  
  // 5. Clear any temporary UI state
  clearTemporaryState();
  
  // 6. Force cleanup of expired tokens
  cleanupExpiredTokens();
  
  console.log('✅ User data cleared successfully');
}

/**
 * Clear all search histories from localStorage
 */
function clearSearchHistories(): void {
  const searchHistoryKeys = [
    'activeAssignmentSearchHistory',
    'assignment-location-search-history',
    'mission-search-history',
    'missionaryTestDataSearchHistory',
    'mogs-assignment-search-history',
    'mogs-assignment-location-search-history',
    'mogs-ws-mission-search-history',
    'mogs-ws-missionary-search-history'
  ];
  
  let clearedCount = 0;
  searchHistoryKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      clearedCount++;
    }
  });
  
  // Also clear any keys that contain 'search-history'
  Object.keys(localStorage).forEach(key => {
    if (key.includes('search-history') && !searchHistoryKeys.includes(key)) {
      localStorage.removeItem(key);
      clearedCount++;
    }
  });
  
  if (clearedCount > 0) {
    console.log(`🧹 Cleared ${clearedCount} search history items`);
  }
}

/**
 * Clear query library and saved GraphQL queries
 */
function clearQueryData(): void {
  const queryKeys = [
    'queryInput',
    'graphqlVariables',
    'httpHeaders',
    'tap_query_library', // Query library storage key
    'savedQueries' // Legacy key
  ];
  
  let clearedCount = 0;
  queryKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      clearedCount++;
    }
  });
  
  if (clearedCount > 0) {
    console.log(`🧹 Cleared ${clearedCount} query data items`);
  }
}

/**
 * Clear environment-specific cached data
 */
function clearEnvironmentData(): void {
  const envKeys = [
    'selectedEnvironment',
    'selectedProxyClient',
    'tap-settings'
  ];
  
  let clearedCount = 0;
  envKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      clearedCount++;
    }
  });
  
  if (clearedCount > 0) {
    console.log(`🧹 Cleared ${clearedCount} environment data items`);
  }
}

/**
 * Clear temporary UI state that shouldn't persist across users
 */
function clearTemporaryState(): void {
  // Clear any temporary state keys
  const tempKeys = Object.keys(localStorage).filter(key => 
    key.startsWith('temp_') || 
    key.startsWith('cache_') ||
    key.includes('_temp')
  );
  
  let clearedCount = 0;
  tempKeys.forEach(key => {
    localStorage.removeItem(key);
    clearedCount++;
  });
  
  if (clearedCount > 0) {
    console.log(`🧹 Cleared ${clearedCount} temporary state items`);
  }
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Dispatch a custom event for user switching
 */
function dispatchUserSwitchEvent(clientId: string, clientName: string): void {
  const event = new CustomEvent('userSwitch', {
    detail: { clientId, clientName }
  });
  window.dispatchEvent(event);
}

/**
 * Check if user switching is needed based on current client selection
 */
export function checkUserSwitch(currentClientId: string, currentClientName: string): boolean {
  const session = getCurrentSession();
  
  if (!session) {
    // No session exists, start one
    startUserSession(currentClientId, currentClientName);
    return true;
  }
  
  if (session.clientId !== currentClientId) {
    // User has switched, clear data and start new session
    switchUser(currentClientId, currentClientName);
    return true;
  }
  
  // Same user, just update activity
  updateSessionActivity();
  return false;
}

/**
 * Initialize session management
 * Should be called once during app startup
 */
export function initializeSessionManagement(): void {
  // Clean up expired session on startup
  const session = getCurrentSession();
  if (!session) {
    console.log('🔄 No valid session found, will create one when user is selected');
  } else {
    console.log(`🔐 Restored session for ${session.clientName} (${session.clientId})`);
    updateSessionActivity();
  }
  
  // Set up periodic session activity tracking
  let activityTimer: NodeJS.Timeout;
  
  const trackActivity = () => {
    updateSessionActivity();
  };
  
  // Track user activity
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  events.forEach(event => {
    document.addEventListener(event, () => {
      clearTimeout(activityTimer);
      activityTimer = setTimeout(trackActivity, 1000); // Debounce activity tracking
    }, { passive: true });
  });
  
  // Cleanup expired tokens periodically
  setInterval(() => {
    cleanupExpiredTokens();
  }, 5 * 60 * 1000); // Every 5 minutes
  
  console.log('🔐 Session management initialized');
}
