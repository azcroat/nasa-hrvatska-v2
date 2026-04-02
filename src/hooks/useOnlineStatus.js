import { useState, useEffect, useRef } from 'react';

/**
 * useOnlineStatus — tracks navigator.onLine with online/offline events.
 * Returns { isOnline, backOnline } where backOnline is true for 3s after
 * reconnection (so UI can show a "back online" confirmation before clearing).
 */
export function useOnlineStatus() {
  // Default to true — assume online until proven otherwise.
  // navigator.onLine can return false briefly during a service-worker-triggered
  // page reload (controllerchange → window.location.reload()) even when the
  // device is connected. Starting optimistically and correcting on first effect
  // prevents the offline banner from getting stuck visible on connected devices.
  const [isOnline, setIsOnline] = useState(true);
  const [backOnline, setBackOnline] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // Re-read the real value now that the page has fully loaded.
    // This corrects any false-negative from the SW reload cycle.
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

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
