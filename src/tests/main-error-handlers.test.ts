import { describe, it, expect } from 'vitest';
import { isChunkLoadError } from '../lib/chunkErrors';

// _isStaleBindingError and _reloadWithCachePurge remain inlined —
// they are private to main.tsx and _reloadWithCachePurge uses an
// injected storage map for testability.
function _isStaleBindingError(msg: unknown) {
  return typeof msg === 'string' && msg.includes('Importing binding name');
}
function _reloadWithCachePurge(storageKey: string, storage: Record<string, string>): boolean {
  const n = parseInt(storage[storageKey] ?? '0', 10);
  if (n >= 2) return false;
  storage[storageKey] = String(n + 1);
  return true;
}

describe('isChunkLoadError', () => {
  it('detects Chrome "failed to fetch" pattern', () => {
    expect(isChunkLoadError('failed to fetch dynamically imported module')).toBe(true);
  });
  it('detects Safari "importing a module script failed" pattern', () => {
    expect(isChunkLoadError('importing a module script failed')).toBe(true);
  });
  it('detects Firefox "dynamically imported module" pattern', () => {
    expect(isChunkLoadError('error loading dynamically imported module')).toBe(true);
  });
  it('detects MIME type mismatch pattern', () => {
    expect(
      isChunkLoadError(
        'expected a javascript module script but server responded with mime type text/html',
      ),
    ).toBe(true);
  });
  it('detects Webpack/Vite "loading chunk" pattern', () => {
    expect(isChunkLoadError('loading chunk 42 failed')).toBe(true);
  });
  it('detects WebKit stale binding in lowercase msg', () => {
    expect(isChunkLoadError("importing binding name 'g' is not found")).toBe(true);
  });
  it('does not match unrelated runtime errors', () => {
    expect(isChunkLoadError('cannot read properties of undefined')).toBe(false);
    expect(isChunkLoadError('network error')).toBe(false);
    expect(isChunkLoadError('')).toBe(false);
    expect(isChunkLoadError('TypeError: null is not an object')).toBe(false);
  });
});

describe('_isStaleBindingError', () => {
  it('detects WebKit stale binding error (case-sensitive original string)', () => {
    expect(_isStaleBindingError("Importing binding name 'g' is not found")).toBe(true);
  });
  it('returns false for non-string input', () => {
    expect(_isStaleBindingError(null)).toBe(false);
    expect(_isStaleBindingError(42)).toBe(false);
    expect(_isStaleBindingError(undefined)).toBe(false);
  });
  it('returns false for unrelated strings', () => {
    expect(_isStaleBindingError('Failed to fetch')).toBe(false);
  });
});

describe('_reloadWithCachePurge', () => {
  it('increments counter and returns true on first call', () => {
    const store: Record<string, string> = {};
    expect(_reloadWithCachePurge('nh_key', store)).toBe(true);
    expect(store['nh_key']).toBe('1');
  });
  it('increments counter and returns true on second call', () => {
    const store: Record<string, string> = { nh_key: '1' };
    expect(_reloadWithCachePurge('nh_key', store)).toBe(true);
    expect(store['nh_key']).toBe('2');
  });
  it('returns false on third call without modifying counter (loop guard)', () => {
    const store: Record<string, string> = { nh_key: '2' };
    expect(_reloadWithCachePurge('nh_key', store)).toBe(false);
    expect(store['nh_key']).toBe('2');
  });
  it('treats separate keys independently', () => {
    const store: Record<string, string> = { nh_binding_reload: '2' };
    expect(_reloadWithCachePurge('nh_reload_attempt', store)).toBe(true);
    expect(store['nh_reload_attempt']).toBe('1');
  });
  it('handles missing key (defaults to 0)', () => {
    const store: Record<string, string> = {};
    _reloadWithCachePurge('fresh_key', store);
    expect(store['fresh_key']).toBe('1');
  });
});
