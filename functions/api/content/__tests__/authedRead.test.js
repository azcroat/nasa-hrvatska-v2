import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../_verifyToken.js', () => ({
  getFirebaseUid: vi.fn(),
}));

import { authedRead } from '../_authedRead.js';
import { getFirebaseUid } from '../../_verifyToken.js';

function makeRequest({
  auth = null,
  ifNoneMatch = null,
  origin = 'https://nasahrvatska.com',
} = {}) {
  const headers = new Headers();
  if (auth) headers.set('authorization', auth);
  if (ifNoneMatch) headers.set('if-none-match', ifNoneMatch);
  if (origin) headers.set('origin', origin);
  return new Request('https://nasahrvatska.com/api/content/x', { headers });
}

function makeEnv({ count = 0 } = {}) {
  const store = new Map();
  store.set('initial-count', count);
  return {
    FIREBASE_PROJECT_ID: 'nh-test',
    CONTENT_DAILY_CAP: '500',
    AI_QUOTA_DB: {
      get: vi.fn(async (key) => {
        const v = store.get(key);
        return v == null ? null : JSON.stringify({ count: v });
      }),
      put: vi.fn(async (key, value) => {
        const parsed = JSON.parse(value);
        store.set(key, parsed.count);
      }),
    },
    _store: store,
  };
}

describe('authedRead', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when no Bearer token', async () => {
    getFirebaseUid.mockResolvedValueOnce(null);
    const res = await authedRead({
      request: makeRequest(),
      env: makeEnv(),
      etag: 'abc',
      buildBody: () => ({ data: { hello: 'world' } }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 200 with body + ETag header when authed and no If-None-Match', async () => {
    getFirebaseUid.mockResolvedValueOnce('uid_test');
    const res = await authedRead({
      request: makeRequest({ auth: 'Bearer fake' }),
      env: makeEnv(),
      etag: 'abc',
      buildBody: () => ({ data: { hello: 'world' } }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('etag')).toBe('"abc"');
    const json = await res.json();
    expect(json.etag).toBe('abc');
    expect(json.data).toEqual({ hello: 'world' });
  });

  it('returns 304 when If-None-Match matches etag', async () => {
    getFirebaseUid.mockResolvedValueOnce('uid_test');
    const res = await authedRead({
      request: makeRequest({ auth: 'Bearer fake', ifNoneMatch: '"abc"' }),
      env: makeEnv(),
      etag: 'abc',
      buildBody: () => ({ data: { hello: 'world' } }),
    });
    expect(res.status).toBe(304);
    expect(res.headers.get('etag')).toBe('"abc"');
  });

  it('returns 429 when daily cap reached', async () => {
    getFirebaseUid.mockResolvedValueOnce('uid_test');
    const env = makeEnv({ count: 500 });
    const today = new Date().toISOString().slice(0, 10);
    env._store.set(`content:uid_test:${today}`, 500);
    const res = await authedRead({
      request: makeRequest({ auth: 'Bearer fake' }),
      env,
      etag: 'abc',
      buildBody: () => ({ data: { hello: 'world' } }),
    });
    expect(res.status).toBe(429);
  });

  it('increments KV counter on 200 only (not on 304 or 401)', async () => {
    const env = makeEnv();
    const today = new Date().toISOString().slice(0, 10);

    // 401 - no increment
    getFirebaseUid.mockResolvedValueOnce(null);
    await authedRead({ request: makeRequest(), env, etag: 'abc', buildBody: () => ({}) });
    expect(env._store.get(`content:any:${today}`)).toBeUndefined();

    // 304 - no increment
    getFirebaseUid.mockResolvedValueOnce('uid_test');
    await authedRead({
      request: makeRequest({ auth: 'Bearer fake', ifNoneMatch: '"abc"' }),
      env,
      etag: 'abc',
      buildBody: () => ({}),
    });
    expect(env._store.get(`content:uid_test:${today}`)).toBeUndefined();

    // 200 - increment to 1
    getFirebaseUid.mockResolvedValueOnce('uid_test');
    await authedRead({
      request: makeRequest({ auth: 'Bearer fake' }),
      env,
      etag: 'abc',
      buildBody: () => ({ data: 'ok' }),
    });
    expect(env._store.get(`content:uid_test:${today}`)).toBe(1);
  });
});
