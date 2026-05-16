import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { readCached, writeCached, bumpValidated, isStale, STALE_AFTER_MS } from '../contentCache';

describe('contentCache', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase('nh-content-cache');
  });

  it('writeCached + readCached round-trips body and etag', async () => {
    await writeCached('uid1', 'story:abc', { etag: 'e1', body: { hello: 'world' } });
    const got = await readCached('uid1', 'story:abc');
    expect(got?.etag).toBe('e1');
    expect(got?.body).toEqual({ hello: 'world' });
    expect(got?.fetchedAt).toBeTypeOf('number');
    expect(got?.lastValidatedAt).toBeTypeOf('number');
  });

  it('readCached returns null for missing key', async () => {
    const got = await readCached('uid1', 'story:none');
    expect(got).toBeNull();
  });

  it('uid namespacing isolates accounts', async () => {
    await writeCached('uid1', 'story:abc', { etag: 'e1', body: { a: 1 } });
    await writeCached('uid2', 'story:abc', { etag: 'e2', body: { a: 2 } });
    const a = await readCached('uid1', 'story:abc');
    const b = await readCached('uid2', 'story:abc');
    expect(a?.body).toEqual({ a: 1 });
    expect(b?.body).toEqual({ a: 2 });
  });

  it('bumpValidated updates lastValidatedAt without touching body or etag', async () => {
    await writeCached('uid1', 'story:abc', { etag: 'e1', body: { x: 1 } });
    const before = await readCached('uid1', 'story:abc');
    await new Promise((r) => setTimeout(r, 5));
    await bumpValidated('uid1', 'story:abc');
    const after = await readCached('uid1', 'story:abc');
    expect(after?.etag).toBe('e1');
    expect(after?.body).toEqual({ x: 1 });
    expect(after!.lastValidatedAt).toBeGreaterThan(before!.lastValidatedAt);
  });

  it('isStale returns true when entry older than STALE_AFTER_MS', () => {
    const oldEntry = {
      etag: 'e',
      body: {},
      fetchedAt: Date.now() - STALE_AFTER_MS - 1000,
      lastValidatedAt: Date.now() - STALE_AFTER_MS - 1000,
    };
    expect(isStale(oldEntry)).toBe(true);
  });

  it('isStale returns false when entry fresh', () => {
    const fresh = {
      etag: 'e',
      body: {},
      fetchedAt: Date.now(),
      lastValidatedAt: Date.now(),
    };
    expect(isStale(fresh)).toBe(false);
  });
});
