import React, { useState, useEffect } from 'react';

interface OfflineIndicatorProps {
  className?: string;
  showWhenOnline?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  showWhenOnline = false,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (showWhenOnline) {
        setShowOnlineMessage(true);
        // Hide the online message after 3 seconds
        setTimeout(() => setShowOnlineMessage(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineMessage(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showWhenOnline]);

  // Don't show anything if online and not showing online message
  if (isOnline && !showOnlineMessage) {
    return null;
  }

  const isOffline = !isOnline;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isOffline || showOnlineMessage ? 'translate-y-0' : '-translate-y-full'
      } ${className}`}
    >
      <div
        className={`${
          isOffline
            ? 'bg-red-600 text-white'
            : 'bg-green-600 text-white'
        } px-4 py-2 text-center text-sm font-medium shadow-lg`}
      >
        <div className="flex items-center justify-center gap-2">
          {isOffline ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728M12 2.252A9.75 9.75 0 002.252 12 9.75 9.75 0 0012 21.748 9.75 9.75 0 0021.748 12 9.75 9.75 0 0012 2.252z"
                />
              </svg>
              <span>You're offline. Some features may not work.</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>You're back online!</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;