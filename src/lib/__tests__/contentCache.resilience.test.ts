import { describe, it, expect, vi } from 'vitest';

// Mock idb's openDB so we can force a transient open failure and prove the cache
// does NOT cache the rejected promise forever (the getDb resilience fix). Kept in
// a separate file from contentCache.test.ts, which uses real fake-indexeddb.
const { openDB } = vi.hoisted(() => ({ openDB: vi.fn() }));
vi.mock('idb', () => ({ openDB }));

// Static import is safe: openDB is only invoked lazily on the first getDb() call,
// which happens inside the test after the mock is configured.
import { readCached } from '../contentCache';

describe('contentCache getDb resilience', () => {
  it('retries after a transient openDB failure instead of caching the rejection', async () => {
    const fakeDb = { get: vi.fn().mockResolvedValue(undefined) };
    openDB
      .mockRejectedValueOnce(
        new Error('An internal error was encountered in the Indexed Database server'),
      )
      .mockResolvedValue(fakeDb);

    // 1st call: open rejects → readCached swallows it as a cache miss (null) and
    // the rejected dbPromise is cleared.
    await expect(readCached('uidA', 'res1')).resolves.toBeNull();

    // 2nd call: open succeeds now → cache is usable again. Had the rejected
    // promise been cached, openDB would not be called a second time.
    await expect(readCached('uidA', 'res1')).resolves.toBeNull();

    expect(openDB).toHaveBeenCalledTimes(2); // proves the retry (no cached rejection)
    expect(fakeDb.get).toHaveBeenCalledTimes(1);
  });
});
