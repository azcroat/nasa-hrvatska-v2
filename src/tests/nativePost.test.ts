// src/tests/nativePost.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the transport primitives the helper uses. After the audio↔nativePost
// cycle was broken, nativePost imports getFirebaseBearer/isNative from
// ./nativeTransport (not ./audio), so the mock targets that module.
vi.mock('../lib/nativeTransport', () => ({
  getFirebaseBearer: vi.fn(async () => 'tok123'),
  isNative: vi.fn(() => false),
}));

import { _nativePost } from '../lib/nativePost';

describe('_nativePost', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('web path: posts to the RELATIVE path with bearer + json headers', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const r = await _nativePost('/api/assess-speaking', { a: 1 });
    expect(r!.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/assess-speaking');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok123');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ a: 1 });
  });

  it('omits Authorization when no bearer is available', async () => {
    const transport = await import('../lib/nativeTransport');
    (transport.getFirebaseBearer as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await _nativePost('/api/assess-speaking', {});
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });
});
