'use client';

import { useEffect, useState } from 'react';
import { generateNotificationId } from '@/lib/unique-id';

interface UserSwitchNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: number;
}

export default function UserSwitchNotifications() {
  const [notifications, setNotifications] = useState<UserSwitchNotification[]>([]);

  useEffect(() => {
    const handleUserSwitch = (event: CustomEvent) => {
      const { clientName } = event.detail;
      
      const notification: UserSwitchNotification = {
        id: generateNotificationId(),
        message: `Switched to ${clientName}. All cached data has been cleared for security.`,
        type: 'success',
        timestamp: Date.now()
      };

      setNotifications(prev => [notification, ...prev].slice(0, 3)); // Keep only last 3

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    };

    const handleClientSwitch = (event: CustomEvent) => {
      if (event.detail.switched) {
        handleUserSwitch(event);
      }
    };

    window.addEventListener('userSwitch', handleUserSwitch as EventListener);
    window.addEventListener('clientSwitch', handleClientSwitch as EventListener);

    return () => {
      window.removeEventListener('userSwitch', handleUserSwitch as EventListener);
      window.removeEventListener('clientSwitch', handleClientSwitch as EventListener);
    };
  }, []);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`max-w-sm px-4 py-3 rounded-lg shadow-lg border transform transition-all duration-300 ease-in-out ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : notification.type === 'warning'
              ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          } animate-slide-in-right`}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {notification.type === 'success' && (
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {notification.type === 'warning' && (
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {notification.type === 'info' && (
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
