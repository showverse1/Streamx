import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    let reconnectedTimer: number | null = null;

    const handleOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      if (reconnectedTimer) window.clearTimeout(reconnectedTimer);
      reconnectedTimer = window.setTimeout(() => {
        setJustReconnected(false);
      }, 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectedTimer) window.clearTimeout(reconnectedTimer);
    };
  }, []);

  return { isOnline, justReconnected };
}
