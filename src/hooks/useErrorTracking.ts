/**
 * useErrorTracking — Persistent grammar/lesson error tracking
 *
 * Stores a rolling log of errors in localStorage keyed by uid.
 * Shape: [{ type, context, ts }] — capped at MAX_ENTRIES (200).
 *
 * Error types:
 *   'case_error'     — Wrong grammatical case used
 *   'aspect_error'   — Wrong verb aspect (perfective vs imperfective)
 *   'vocab_miss'     — Vocabulary item answered incorrectly
 *   'gender_error'   — Wrong noun gender
 *   'pronunciation'  — Low pronunciation score recorded
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

export type ErrorType =
  | 'case_error'
  | 'aspect_error'
  | 'vocab_miss'
  | 'gender_error'
  | 'pronunciation';

export interface ErrorEntry {
  type: string;
  context: string;
  ts: string;
}

export interface WeakArea {
  type: string;
  count: number;
  lastSeen: string;
}

// ── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = (uid: string): string => `nh_errors_${uid}`;
const MAX_ENTRIES = 200;
const RECENT_LIMIT = 50;

// ── Internal helpers ─────────────────────────────────────────────────────────
function _load(uid: string): ErrorEntry[] {
  try {
    return (JSON.parse(localStorage.getItem(STORAGE_KEY(uid)) || '[]') as ErrorEntry[]) || [];
  } catch {
    return [];
  }
}

function _save(uid: string, entries: ErrorEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY(uid), JSON.stringify(entries));
  } catch {}
}

// ── Public utilities ─────────────────────────────────────────────────────────

/**
 * Record a new error entry for a user.
 */
export function recordError(uid: string, type: string, context: string = ''): void {
  if (!uid || !type) return;
  try {
    const entries = _load(uid);
    const entry: ErrorEntry = { type, context, ts: new Date().toISOString() };
    const updated = [entry, ...entries].slice(0, MAX_ENTRIES);
    _save(uid, updated);
    // Notify any active hooks
    window.dispatchEvent(new CustomEvent('nh:error-recorded', { detail: { uid } }));
  } catch {}
}

/**
 * Returns the last RECENT_LIMIT (50) error entries, newest first.
 */
export function getErrorLog(uid: string): ErrorEntry[] {
  if (!uid) return [];
  try {
    return _load(uid).slice(0, RECENT_LIMIT);
  } catch {
    return [];
  }
}

/**
 * Aggregate errors by type and return sorted by count descending.
 */
export function getWeakAreas(uid: string): WeakArea[] {
  if (!uid) return [];
  try {
    const entries = _load(uid);
    if (entries.length === 0) return [];

    const map: Record<string, WeakArea> = {};
    for (const entry of entries) {
      if (!map[entry.type]) {
        map[entry.type] = { type: entry.type, count: 0, lastSeen: entry.ts };
      }
      map[entry.type]!.count += 1;
      // entries are newest-first, so first occurrence of this type is most recent
      map[entry.type]!.lastSeen = entry.ts;
    }

    return Object.values(map).sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
}

/**
 * Wipe all error data for a user.
 */
export function clearErrorLog(uid: string): void {
  if (!uid) return;
  try {
    localStorage.removeItem(STORAGE_KEY(uid));
    window.dispatchEvent(new CustomEvent('nh:error-recorded', { detail: { uid } }));
  } catch {}
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * React hook that subscribes to error log changes for a given uid.
 * Returns live errorCount, memoized weakAreas, and a bound recordError helper.
 */
export function useErrorTracking(uid: string): {
  errorCount: number;
  weakAreas: WeakArea[];
  recordError: (type: string, context?: string) => void;
} {
  const [tick, setTick] = useState(0);

  // Re-render when an error is recorded
  const handleErrorRecorded = useCallback(
    (e: Event): void => {
      const ce = e as CustomEvent<{ uid?: string }>;
      if (!ce.detail || ce.detail.uid === uid) {
        setTick((t) => t + 1);
      }
    },
    [uid],
  );

  useEffect(() => {
    window.addEventListener('nh:error-recorded', handleErrorRecorded);
    return () => {
      window.removeEventListener('nh:error-recorded', handleErrorRecorded);
    };
  }, [handleErrorRecorded]);

  const errorCount = useMemo(() => {
    if (!uid) return 0;
    try {
      return _load(uid).length;
    } catch {
      return 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, tick]);

  const weakAreas = useMemo(() => {
    return getWeakAreas(uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, tick]);

  const boundRecordError = useCallback(
    (type: string, context: string = ''): void => {
      recordError(uid, type, context);
    },
    [uid],
  );

  return { errorCount, weakAreas, recordError: boundRecordError };
}
