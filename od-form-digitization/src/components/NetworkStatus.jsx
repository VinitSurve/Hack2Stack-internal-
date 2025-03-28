import { useState, useEffect } from 'react';
import Alert from './Alert';

function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // Event handlers for online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      // Hide the reconnected message after 5 seconds
      setTimeout(() => setShowReconnected(false), 5000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="network-status-container">
        <Alert
          message="You are currently offline. Some features may be unavailable."
          type="warning"
          duration={0}
        />
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="network-status-container">
        <Alert
          message="You are back online."
          type="success"
          duration={5000}
          onClose={() => setShowReconnected(false)}
        />
      </div>
    );
  }

  return null;
}

export default NetworkStatus;
