import { useEffect, useSyncExternalStore } from 'react';
import { getGrammar } from '../lib/contentClient';
import type { Grammar } from '../types/content';

interface Snapshot {
  grammar: Grammar | null;
  loading: boolean;
  error: Error | null;
}

let _grammar: Grammar | null = null;
let _loading = false;
let _error: Error | null = null;
let _inflight: Promise<Grammar> | null = null;
const _listeners = new Set<() => void>();

let _cachedSnapshot: Snapshot = { grammar: _grammar, loading: _loading, error: _error };

function refreshSnapshot(): void {
  if (
    _cachedSnapshot.grammar !== _grammar ||
    _cachedSnapshot.loading !== _loading ||
    _cachedSnapshot.error !== _error
  ) {
    _cachedSnapshot = { grammar: _grammar, loading: _loading, error: _error };
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

function startFetch(): Promise<Grammar> {
  if (_inflight) return _inflight;
  _loading = true;
  _error = null;
  notify();
  _inflight = getGrammar()
    .then((g) => {
      _grammar = g;
      _loading = false;
      _inflight = null;
      notify();
      return g;
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

export interface UseGrammarResult {
  grammar: Grammar | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

export function useGrammar(): UseGrammarResult {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (state.grammar || _inflight) return;
    void startFetch().catch(() => {
      /* state already updated via notify in startFetch */
    });
  }, [state.grammar]);

  return {
    grammar: state.grammar,
    loading: state.loading,
    error: state.error,
    reload: (): void => {
      _grammar = null;
      _error = null;
      void startFetch().catch(() => {
        /* state already updated via notify in startFetch */
      });
    },
  };
}

export function _resetGrammarHookForTests(): void {
  _grammar = null;
  _loading = false;
  _error = null;
  _inflight = null;
  _listeners.clear();
  _cachedSnapshot = { grammar: null, loading: false, error: null };
}
