import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock firebase/auth before importing apiFetch
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
}));

import { apiFetch } from '../lib/apiFetch.js';
import { getAuth } from 'firebase/auth';

describe('apiFetch — authenticated fetch wrapper', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    );
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // ── unauthenticated requests ──────────────────────────────────────────────

  it('calls fetch with the provided URL', async () => {
    getAuth.mockReturnValue({ currentUser: null });
    await apiFetch('/api/test');
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/test', expect.any(Object));
  });

  it('sends request without Authorization header when no user', async () => {
    getAuth.mockReturnValue({ currentUser: null });
    await apiFetch('/api/test');
    const [, options] = globalThis.fetch.mock.calls[0];
    expect(options.headers?.Authorization).toBeUndefined();
  });

  it('returns the fetch response', async () => {
    getAuth.mockReturnValue({ currentUser: null });
    const response = await apiFetch('/api/test');
    expect(response.status).toBe(200);
  });

  it('passes through caller options (method, body)', async () => {
    getAuth.mockReturnValue({ currentUser: null });
    await apiFetch('/api/test', { method: 'POST', body: '{}' });
    const [, options] = globalThis.fetch.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(options.body).toBe('{}');
  });

  // ── authenticated requests ────────────────────────────────────────────────

  it('adds Authorization Bearer header when user is signed in', async () => {
    getAuth.mockReturnValue({
      currentUser: { getIdToken: vi.fn().mockResolvedValue('test-token-abc') },
    });
    await apiFetch('/api/secure');
    const [, options] = globalThis.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer test-token-abc');
  });

  it('preserves existing caller headers alongside Authorization', async () => {
    getAuth.mockReturnValue({
      currentUser: { getIdToken: vi.fn().mockResolvedValue('tok') },
    });
    await apiFetch('/api/secure', { headers: { 'Content-Type': 'application/json' } });
    const [, options] = globalThis.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer tok');
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  it('calls getIdToken() on the current user', async () => {
    const getIdToken = vi.fn().mockResolvedValue('token123');
    getAuth.mockReturnValue({ currentUser: { getIdToken } });
    await apiFetch('/api/secure');
    expect(getIdToken).toHaveBeenCalledOnce();
  });

  // ── token fetch failure fallback ──────────────────────────────────────────

  it('still calls fetch when getIdToken throws', async () => {
    getAuth.mockReturnValue({
      currentUser: { getIdToken: vi.fn().mockRejectedValue(new Error('network')) },
    });
    await apiFetch('/api/fallback');
    expect(globalThis.fetch).toHaveBeenCalledOnce();
  });

  it('sends no Authorization header when getIdToken throws', async () => {
    getAuth.mockReturnValue({
      currentUser: { getIdToken: vi.fn().mockRejectedValue(new Error('network')) },
    });
    await apiFetch('/api/fallback');
    const [, options] = globalThis.fetch.mock.calls[0];
    expect(options.headers?.Authorization).toBeUndefined();
  });

  it('still returns fetch response when getIdToken throws', async () => {
    getAuth.mockReturnValue({
      currentUser: { getIdToken: vi.fn().mockRejectedValue(new Error('network')) },
    });
    const response = await apiFetch('/api/fallback');
    expect(response.status).toBe(200);
  });

  // ── getAuth failure ───────────────────────────────────────────────────────

  it('still calls fetch when getAuth itself throws', async () => {
    getAuth.mockImplementation(() => { throw new Error('firebase not init'); });
    await apiFetch('/api/test');
    expect(globalThis.fetch).toHaveBeenCalledOnce();
  });
});
