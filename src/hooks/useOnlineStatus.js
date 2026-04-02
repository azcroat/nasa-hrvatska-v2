import { useState, useEffect, useRef } from 'react';

/**
 * useOnlineStatus — tracks navigator.onLine with online/offline events.
 * Returns { isOnline, backOnline } where backOnline is true for 3s after
 * reconnection (so UI can show a "back online" confirmation before clearing).
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [backOnline, setBackOnline] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      setBackOnline(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setBackOnline(false), 3000);
    }
    function handleOffline() {
      setIsOnline(false);
      setBackOnline(false);
      clearTimeout(timerRef.current);
    }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timerRef.current);
    };
  }, []);

  return { isOnline, backOnline };
}
