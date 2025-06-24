/**
 * Utility functions for generating unique identifiers
 * This prevents React key duplication issues
 */

let idCounter = 0;

/**
 * Generate a unique ID using timestamp, random string, and counter
 * This ensures uniqueness even if multiple IDs are generated simultaneously
 */
export function generateUniqueId(prefix: string = 'id'): string {
  idCounter = (idCounter + 1) % 10000; // Reset counter to prevent indefinite growth
  return `${prefix}-${Date.now()}-${idCounter}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique ID for React component keys
 * Specifically designed to prevent duplicate key warnings
 */
export function generateReactKey(prefix: string = 'key'): string {
  return generateUniqueId(prefix);
}

/**
 * Generate a unique ID for search history entries
 */
export function generateSearchHistoryId(): string {
  return generateUniqueId('search');
}

/**
 * Generate a unique ID for notification components
 */
export function generateNotificationId(): string {
  return generateUniqueId('notification');
}

/**
 * Generate a unique ID for user sessions
 */
export function generateSessionId(): string {
  return generateUniqueId('session');
}

/**
 * Generate a unique ID for query library entries
 */
export function generateQueryId(): string {
  return generateUniqueId('query');
}
