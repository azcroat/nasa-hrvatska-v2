import { useState, useCallback } from 'react';

/**
 * Hook for safe localStorage access with quota error handling.
 * @param key - StorageKeys constant
 * @param defaultValue - value if key absent or parse fails
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)): void => {
      // Use the setState updater form so we read the CURRENT state value, not a
      // stale closure capture. Previously `storedValue` was in the dep array, causing
      // (a) the callback to be recreated on every state change, and
      // (b) the function-form callers to receive a stale prev value.
      setStoredValue((prev) => {
        try {
          const toStore = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
          if (toStore === null || toStore === undefined) {
            localStorage.removeItem(key);
          } else {
            localStorage.setItem(key, JSON.stringify(toStore));
          }
          return toStore;
        } catch (e) {
          const err = e as Error & { name?: string };
          if (err?.name === 'QuotaExceededError') {
            console.warn('[Storage] Quota exceeded for key:', key);
          } else {
            console.error('[Storage] Write error for key:', key, err?.message);
          }
          return prev; // keep unchanged on error
        }
      });
    },
    [key],
  );

  return [storedValue, setValue];
}

/**
 * Simple safe read — no React state, just a guarded localStorage.getItem.
 */
export function safeGetItem<T = unknown>(key: string, defaultValue: T | null = null): T | null {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Simple safe write — no React state.
 */
export function safeSetItem(key: string, value: unknown): boolean {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
    return true;
  } catch (e) {
    const err = e as Error & { name?: string };
    if (err?.name === 'QuotaExceededError') {
      console.warn('[Storage] Quota exceeded for key:', key);
    }
    return false;
  }
}
