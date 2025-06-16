'use client';

import { useEffect } from 'react';
import { cleanupExpiredTokens } from '@/lib/token-cache';

/**
 * Token Cache Manager Component
 * 
 * Handles periodic cleanup of expired tokens across the application.
 * Should be included once in the app layout or root component.
 */
export function TokenCacheManager() {
  useEffect(() => {
    // Initial cleanup on app start
    cleanupExpiredTokens();

    // Set up periodic cleanup every 5 minutes
    const cleanupInterval = setInterval(() => {
      cleanupExpiredTokens();
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup on visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        cleanupExpiredTokens();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      clearInterval(cleanupInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // This component doesn't render anything
  return null;
}

export default TokenCacheManager;
