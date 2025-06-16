/**
 * Global Token Cache Manager
 * 
 * Provides intelligent token caching and sharing across pages and environments.
 * Tokens are cached in memory and localStorage with automatic expiration handling.
 */

import { AuthToken } from './api-client';
import { EnvironmentConfig } from './environments';

// Token cache entry with metadata
interface CachedToken {
  token: AuthToken;
  environmentKey: string;
  clientConfig: {
    client_id: string;
    access_token_url: string;
    scope: string;
  };
  cachedAt: number;
}

// Global token cache - in memory for this session
const tokenCache = new Map<string, CachedToken>();

// Buffer time before expiration (2 minutes)
const EXPIRATION_BUFFER_MS = 2 * 60 * 1000;

// Cache key prefix for localStorage
const CACHE_KEY_PREFIX = 'tap_token_cache_';

/**
 * Generate a unique cache key for an environment + client configuration
 */
function generateCacheKey(config: EnvironmentConfig, environmentKey: string): string {
  // Create a hash-like key based on environment and client config
  const keyData = `${environmentKey}:${config.client_id}:${config.access_token_url}:${config.scope}`;
  return btoa(keyData).replace(/[/+=]/g, '_'); // Base64 encode and make filesystem-safe
}

/**
 * Check if a token is still valid (not expired, with buffer)
 */
function isTokenValid(token: AuthToken): boolean {
  const now = Date.now();
  const expiresWithBuffer = token.expires_at - EXPIRATION_BUFFER_MS;
  return now < expiresWithBuffer;
}

/**
 * Load cached token from localStorage
 */
function loadTokenFromStorage(cacheKey: string): CachedToken | null {
  try {
    const stored = localStorage.getItem(CACHE_KEY_PREFIX + cacheKey);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored) as CachedToken;
    
    // Validate the stored token
    if (parsed.token && isTokenValid(parsed.token)) {
      return parsed;
    } else {
      // Token expired, remove from storage
      localStorage.removeItem(CACHE_KEY_PREFIX + cacheKey);
      return null;
    }
  } catch (error) {
    console.warn('Failed to load token from storage:', error);
    return null;
  }
}

/**
 * Save token to localStorage
 */
function saveTokenToStorage(cacheKey: string, cachedToken: CachedToken): void {
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + cacheKey, JSON.stringify(cachedToken));
  } catch (error) {
    console.warn('Failed to save token to storage:', error);
    // Continue without localStorage if it fails
  }
}

/**
 * Get cached token for an environment/config combination
 */
export function getCachedToken(config: EnvironmentConfig, environmentKey: string): AuthToken | null {
  const cacheKey = generateCacheKey(config, environmentKey);
  
  // First check in-memory cache
  let cached = tokenCache.get(cacheKey);
  
  // If not in memory, try localStorage
  if (!cached) {
    const storedToken = loadTokenFromStorage(cacheKey);
    if (storedToken) {
      cached = storedToken;
      // Restore to memory cache
      tokenCache.set(cacheKey, cached);
    }
  }
  
  // Validate token is still good
  if (cached && isTokenValid(cached.token)) {
    console.log(`✅ Using cached token for ${environmentKey} (expires in ${Math.round((cached.token.expires_at - Date.now()) / 1000 / 60)} minutes)`);
    return cached.token;
  }
  
  // Token expired or doesn't exist, cleanup
  if (cached) {
    tokenCache.delete(cacheKey);
    localStorage.removeItem(CACHE_KEY_PREFIX + cacheKey);
  }
  
  return null;
}

/**
 * Cache a new token for an environment/config combination
 */
export function setCachedToken(
  config: EnvironmentConfig, 
  environmentKey: string, 
  token: AuthToken
): void {
  const cacheKey = generateCacheKey(config, environmentKey);
  
  const cachedToken: CachedToken = {
    token,
    environmentKey,
    clientConfig: {
      client_id: config.client_id,
      access_token_url: config.access_token_url,
      scope: config.scope
    },
    cachedAt: Date.now()
  };
  
  // Store in memory
  tokenCache.set(cacheKey, cachedToken);
  
  // Store in localStorage for persistence
  saveTokenToStorage(cacheKey, cachedToken);
  
  console.log(`💾 Cached token for ${environmentKey} (expires in ${Math.round((token.expires_at - Date.now()) / 1000 / 60)} minutes)`);
}

/**
 * Remove cached token for an environment/config (e.g., on logout or error)
 */
export function removeCachedToken(config: EnvironmentConfig, environmentKey: string): void {
  const cacheKey = generateCacheKey(config, environmentKey);
  
  tokenCache.delete(cacheKey);
  localStorage.removeItem(CACHE_KEY_PREFIX + cacheKey);
  
  console.log(`🗑️ Removed cached token for ${environmentKey}`);
}

/**
 * Clear all cached tokens (e.g., on logout)
 */
export function clearAllCachedTokens(): void {
  // Clear memory cache
  tokenCache.clear();
  
  // Clear localStorage
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear tokens from storage:', error);
  }
  
  console.log('🧹 Cleared all cached tokens');
}

/**
 * Get cache statistics for debugging
 */
export function getTokenCacheStats(): {
  memoryCount: number;
  validTokens: number;
  expiredTokens: number;
  environments: string[];
} {
  const stats = {
    memoryCount: tokenCache.size,
    validTokens: 0,
    expiredTokens: 0,
    environments: [] as string[]
  };
  
  tokenCache.forEach((cached, key) => {
    stats.environments.push(cached.environmentKey);
    if (isTokenValid(cached.token)) {
      stats.validTokens++;
    } else {
      stats.expiredTokens++;
    }
  });
  
  return stats;
}

/**
 * Clean up expired tokens from cache (can be called periodically)
 */
export function cleanupExpiredTokens(): void {
  let cleanedCount = 0;
  
  // Clean memory cache
  tokenCache.forEach((cached, key) => {
    if (!isTokenValid(cached.token)) {
      tokenCache.delete(key);
      cleanedCount++;
    }
  });
  
  // Clean localStorage
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        try {
          const stored = JSON.parse(localStorage.getItem(key) || '{}');
          if (stored.token && !isTokenValid(stored.token)) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        } catch {
          // Invalid stored data, remove it
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    });
  } catch (error) {
    console.warn('Failed to cleanup tokens from storage:', error);
  }
  
  if (cleanedCount > 0) {
    console.log(`🧽 Cleaned up ${cleanedCount} expired tokens`);
  }
}
