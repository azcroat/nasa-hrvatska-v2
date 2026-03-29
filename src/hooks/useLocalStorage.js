import { useState, useCallback } from 'react'

/**
 * Hook for safe localStorage access with quota error handling.
 * @param {string} key - StorageKeys constant
 * @param {*} defaultValue - value if key absent or parse fails
 */
export function useLocalStorage(key, defaultValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item !== null ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const setValue = useCallback((value) => {
    try {
      const toStore = typeof value === 'function' ? value(storedValue) : value
      setStoredValue(toStore)
      if (toStore === null || toStore === undefined) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, JSON.stringify(toStore))
      }
    } catch (e) {
      if (e?.name === 'QuotaExceededError') {
        console.warn('[Storage] Quota exceeded for key:', key)
      } else {
        console.error('[Storage] Write error for key:', key, e?.message)
      }
    }
  }, [key, storedValue])

  return [storedValue, setValue]
}

/**
 * Simple safe read — no React state, just a guarded localStorage.getItem.
 */
export function safeGetItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key)
    if (item === null) return defaultValue
    return JSON.parse(item)
  } catch {
    return defaultValue
  }
}

/**
 * Simple safe write — no React state.
 */
export function safeSetItem(key, value) {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, JSON.stringify(value))
    }
    return true
  } catch (e) {
    if (e?.name === 'QuotaExceededError') {
      console.warn('[Storage] Quota exceeded for key:', key)
    }
    return false
  }
}
