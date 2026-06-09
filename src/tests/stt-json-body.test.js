// src/tests/stt-json-body.test.js
//
// TDD: Task 1 — stt.js dual-body acceptance
//   • JSON path  { audioBase64, mimeType }  →  decoded bytes reach transcription → 200
//   • Raw audio/* path (legacy)              →  still works → 200  (regression guard)
//   • JSON with missing audioBase64          →  400
//   • Invalid JSON body                      →  400
//   • Wrong Content-Type (text/plain)        →  400

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Auth mocks (must hoist before dynamic import) ──────────────────────────────
vi.mock('../../functions/api/_verifyToken.js', () => ({
  getFirebaseUid: vi.fn(async (request) =>
    request.headers.get('authorization') === 'Bearer good' ? 'uid-1' : null,
  ),
}));

vi.mock('../../functions/api/_rateLimit.js', () => ({
  checkRateLimit: vi.fn(async () => true),
}));

vi.mock('../../functions/api/_aiQuota.js', () => ({
  checkAIQuota: vi.fn(async () => ({
    allowed: true,
    remaining: 299,
    resetAt: '2099-01-01T00:00:00Z',
  })),
}));

import { onRequestPost } from '../../functions/api/stt.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Minimal KV stub that satisfies checkAIQuota's get/put interface. */
function makeKv() {
  const store = new Map();
  return {
    get: async (k) => store.get(k) ?? null,
    put: async (k, v) => store.set(k, v),
  };
}

const BASE_ENV = {
  FIREBASE_PROJECT_ID: 'proj',
  DEEPGRAM_API_KEY: 'dg-key',
  PUSH_SUBSCRIPTIONS: makeKv(),
};

const AUTH_HEADERS = { authorization: 'Bearer good' };

/**
 * Build a fake audio Uint8Array of `len` bytes (incremental pattern so byte
 * values are non-trivial and easy to verify).
 */
function fakeAudioBytes(len = 16) {
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) arr[i] = i % 256;
  return arr;
}

/** btoa for ArrayBuffer (same algorithm the stt.js handler reverses with atob). */
function toBase64(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/**
 * Build a mock `fetch` that simulates a successful Deepgram response carrying
 * a transcript. Also captures what body bytes + Content-Type were sent so tests
 * can assert the decoded payload was correct.
 */
function makeDeepgramMock(transcript = 'hvala') {
  const calls = [];
  const mockFetch = vi.fn(async (url, opts) => {
    calls.push({
      url: String(url),
      contentType: opts?.headers?.['Content-Type'],
      body: opts?.body,
    });
    return new Response(
      JSON.stringify({
        results: { channels: [{ alternatives: [{ transcript }] }] },
      }),
      { status: 200 },
    );
  });
  mockFetch.calls = calls;
  return mockFetch;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('POST /api/stt — dual-body acceptance', () => {
  beforeEach(() => vi.restoreAllMocks());

  // ── JSON path ──────────────────────────────────────────────────────────────

  it('200: JSON body { audioBase64, mimeType } is accepted and decoded correctly', async () => {
    const bytes = fakeAudioBytes(32);
    const audioBase64 = toBase64(bytes);
    const mockFetch = makeDeepgramMock('dobar dan');
    vi.stubGlobal('fetch', mockFetch);

    const request = new Request('https://nasahrvatska.com/api/stt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        origin: 'https://nasahrvatska.com',
        ...AUTH_HEADERS,
      },
      body: JSON.stringify({ audioBase64, mimeType: 'audio/webm' }),
    });

    const res = await onRequestPost({ request, env: { ...BASE_ENV } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.text).toBe('dobar dan');

    // Verify the correct mimeType was forwarded to Deepgram
    expect(mockFetch.calls[0].contentType).toBe('audio/webm');

    // Verify the decoded bytes match the originals (byte-for-byte)
    const sentBody = mockFetch.calls[0].body;
    const sentBytes =
      sentBody instanceof ArrayBuffer
        ? new Uint8Array(sentBody)
        : new Uint8Array(await new Response(sentBody).arrayBuffer());
    expect(sentBytes).toEqual(bytes);
  });

  it('200: JSON body without mimeType defaults to audio/webm', async () => {
    const bytes = fakeAudioBytes(8);
    const audioBase64 = toBase64(bytes);
    const mockFetch = makeDeepgramMock('molim');
    vi.stubGlobal('fetch', mockFetch);

    const request = new Request('https://nasahrvatska.com/api/stt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        origin: 'https://nasahrvatska.com',
        ...AUTH_HEADERS,
      },
      body: JSON.stringify({ audioBase64 }), // no mimeType
    });

    const res = await onRequestPost({ request, env: { ...BASE_ENV } });
    expect(res.status).toBe(200);
    expect(mockFetch.calls[0].contentType).toBe('audio/webm');
  });

  it('200: JSON body with non-audio mimeType falls back to audio/webm', async () => {
    const bytes = fakeAudioBytes(8);
    const audioBase64 = toBase64(bytes);
    const mockFetch = makeDeepgramMock('zdravo');
    vi.stubGlobal('fetch', mockFetch);

    const request = new Request('https://nasahrvatska.com/api/stt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        origin: 'https://nasahrvatska.com',
        ...AUTH_HEADERS,
      },
      body: JSON.stringify({ audioBase64, mimeType: 'video/mp4' }), // not audio/*
    });

    const res = await onRequestPost({ request, env: { ...BASE_ENV } });
    expect(res.status).toBe(200);
    expect(mockFetch.calls[0].contentType).toBe('audio/webm'); // sanitized
  });

  it('400: JSON body missing audioBase64 field', async () => {
    const request = new Request('https://nasahrvatska.com/api/stt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        origin: 'https://nasahrvatska.com',
        ...AUTH_HEADERS,
      },
      body: JSON.stringify({ mimeType: 'audio/webm' }), // missing audioBase64
    });

    const res = await onRequestPost({ request, env: { ...BASE_ENV } });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/audioBase64/i);
  });

  it('400: invalid JSON body', async () => {
    const request = new Request('https://nasahrvatska.com/api/stt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        origin: 'https://nasahrvatska.com',
        ...AUTH_HEADERS,
      },
      body: 'not-valid-json',
    });

    const res = await onRequestPost({ request, env: { ...BASE_ENV } });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/json/i);
  });

  // ── Raw audio/* path (regression) ─────────────────────────────────────────

  it('200: raw audio/webm body (legacy path) still works', async () => {
    const bytes = fakeAudioBytes(64);
    const mockFetch = makeDeepgramMock('hvala lijepa');
    vi.stubGlobal('fetch', mockFetch);

    const request = new Request('https://nasahrvatska.com/api/stt', {
      method: 'POST',
      headers: {
        'Content-Type': 'audio/webm',
        origin: 'https://nasahrvatska.com',
        ...AUTH_HEADERS,
      },
      body: bytes.buffer,
    });

    const res = await onRequestPost({ request, env: { ...BASE_ENV } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.text).toBe('hvala lijepa');
    expect(mockFetch.calls[0].contentType).toBe('audio/webm');
  });

  it('200: raw audio/ogg body (legacy path) preserves content-type', async () => {
    const bytes = fakeAudioBytes(32);
    const mockFetch = makeDeepgramMock('dobro jutro');
    vi.stubGlobal('fetch', mockFetch);

    const request = new Request('https://nasahrvatska.com/api/stt', {
      method: 'POST',
      headers: {
        'Content-Type': 'audio/ogg',
        origin: 'https://nasahrvatska.com',
        ...AUTH_HEADERS,
      },
      body: bytes.buffer,
    });

    const res = await onRequestPost({ request, env: { ...BASE_ENV } });
    expect(res.status).toBe(200);
    expect(mockFetch.calls[0].contentType).toBe('audio/ogg');
  });

  // ── Wrong Content-Type ─────────────────────────────────────────────────────

  it('400: text/plain Content-Type is rejected', async () => {
    const request = new Request('https://nasahrvatska.com/api/stt', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        origin: 'https://nasahrvatska.com',
        ...AUTH_HEADERS,
      },
      body: 'some text',
    });

    const res = await onRequestPost({ request, env: { ...BASE_ENV } });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Expected audio/i);
  });

  // ── Guards still apply to both paths ──────────────────────────────────────

  it('400: empty JSON audioBase64 string is rejected', async () => {
    const request = new Request('https://nasahrvatska.com/api/stt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        origin: 'https://nasahrvatska.com',
        ...AUTH_HEADERS,
      },
      body: JSON.stringify({ audioBase64: '', mimeType: 'audio/webm' }),
    });

    const res = await onRequestPost({ request, env: { ...BASE_ENV } });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/audioBase64/i);
  });

  it('400: empty raw audio body is rejected (guard intact)', async () => {
    const request = new Request('https://nasahrvatska.com/api/stt', {
      method: 'POST',
      headers: {
        'Content-Type': 'audio/webm',
        origin: 'https://nasahrvatska.com',
        ...AUTH_HEADERS,
      },
      body: new Uint8Array(0).buffer,
    });

    const res = await onRequestPost({ request, env: { ...BASE_ENV } });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/empty/i);
  });
});
