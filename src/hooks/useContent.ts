// SP11d: useContent React hook with module-level dedupe.
// Mirrors useGrammar (SP11b) pattern verbatim: useSyncExternalStore + shared
// _inflight promise + memoized snapshot (required so React doesn't throw on
// fresh object references from getSnapshot).
import { useEffect, useSyncExternalStore } from 'react';
import { getContent } from '../lib/contentClient';
import type { Content } from '../types/content';

interface Snapshot {
  content: Content | null;
  loading: boolean;
  error: Error | null;
}

let _content: Content | null = null;
let _loading = false;
let _error: Error | null = null;
let _inflight: Promise<Content> | null = null;
const _listeners = new Set<() => void>();

let _cachedSnapshot: Snapshot = { content: _content, loading: _loading, error: _error };

function refreshSnapshot(): void {
  if (
    _cachedSnapshot.content !== _content ||
    _cachedSnapshot.loading !== _loading ||
    _cachedSnapshot.error !== _error
  ) {
    _cachedSnapshot = { content: _content, loading: _loading, error: _error };
  }
}

function notify(): void {
  refreshSnapshot();
  _listeners.forEach((fn) => fn());
}

function subscribe(cb: () => void): () => void {
  _listeners.add(cb);
  return () => {
    _listeners.delete(cb);
  };
}

function getSnapshot(): Snapshot {
  return _cachedSnapshot;
}

function startFetch(): Promise<Content> {
  if (_inflight) return _inflight;
  _loading = true;
  _error = null;
  notify();
  _inflight = getContent()
    .then((c) => {
      _content = c;
      _loading = false;
      _inflight = null;
      notify();
      return c;
    })
    .catch((e: unknown) => {
      _error = e instanceof Error ? e : new Error(String(e));
      _loading = false;
      _inflight = null;
      notify();
      throw e;
    });
  return _inflight;
}

export interface UseContentResult {
  content: Content | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

export function useContent(): UseContentResult {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (state.content || _inflight) return;
    void startFetch().catch(() => {
      /* state already updated via notify in startFetch */
    });
  }, [state.content]);

  return {
    content: state.content,
    loading: state.loading,
    error: state.error,
    reload: (): void => {
      _content = null;
      _error = null;
      void startFetch().catch(() => {
        /* state already updated via notify in startFetch */
      });
    },
  };
}

export function _resetContentHookForTests(): void {
  _content = null;
  _loading = false;
  _error = null;
  _inflight = null;
  _listeners.clear();
  _cachedSnapshot = { content: null, loading: false, error: null };
}
