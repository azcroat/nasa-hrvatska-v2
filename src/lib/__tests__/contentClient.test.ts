import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import {
  ContentAuthError,
  ContentNotFoundError,
  ContentRateLimitError,
  ContentOfflineError,
  ContentFetchError,
  type Grammar,
  type Lesson,
  type Content,
} from '../../types/content';

vi.mock('../audio', () => ({
  getFirebaseBearer: vi.fn(async () => 'fake-bearer'),
}));

vi.mock('../firebaseUid', () => ({
  getCurrentUid: vi.fn(async () => 'uid_test'),
}));

import * as cache from '../contentCache';
import {
  getStory,
  getStoryCatalog,
  getGrammarUnit,
  getGrammar,
  getLessons,
  getContent,
} from '../contentClient';

const STORY_BODY = { id: 'gs_a1_1', title: 'Test', paragraphs: ['a', 'b'] };

function mockFetch(impls: Array<() => Promise<Response>>) {
  let i = 0;
  globalThis.fetch = vi.fn(async () => {
    const fn = impls[i++] ?? impls[impls.length - 1];
    return fn!();
  }) as unknown as typeof fetch;
}

// Clear the cache object store by opening the DB and emptying it.
// indexedDB.deleteDatabase() is async + races with the module-level
// dbPromise cached in contentCache.ts, so clearing the store directly
// is more reliable.
async function clearCache(): Promise<void> {
  const db = await openDB('nh-content-cache', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('resources')) {
        db.createObjectStore('resources');
      }
    },
  });
  await db.clear('resources');
  db.close();
}

beforeEach(async () => {
  await clearCache();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

// Helper: seed the cache with an entry whose lastValidatedAt is older than
// STALE_AFTER_MS, forcing the stale-cache code path in contentClient.
// Direct IDB write bypasses both fake-timer + module-binding issues with
// vi.spyOn(cache, 'isStale').
async function seedStaleCache(): Promise<void> {
  const db = await openDB('nh-content-cache', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('resources')) {
        db.createObjectStore('resources');
      }
    },
  });
  const staleTs = Date.now() - cache.STALE_AFTER_MS - 60_000;
  await db.put(
    'resources',
    {
      etag: 'e1',
      body: STORY_BODY,
      fetchedAt: staleTs,
      lastValidatedAt: staleTs,
    },
    'uid_uid_test:story:gs_a1_1',
  );
  db.close();
}

async function seedStaleCacheForGrammar(body: Grammar): Promise<void> {
  const db = await openDB('nh-content-cache', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('resources')) {
        db.createObjectStore('resources');
      }
    },
  });
  const staleTs = Date.now() - cache.STALE_AFTER_MS - 60_000;
  await db.put(
    'resources',
    {
      etag: 'g1',
      body,
      fetchedAt: staleTs,
      lastValidatedAt: staleTs,
    },
    'uid_uid_test:grammar:all',
  );
  db.close();
}

async function seedStaleCacheForLessons(body: Lesson[]) {
  const idb = await import('idb');
  const db = await idb.openDB('nh-content-cache', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('resources')) db.createObjectStore('resources');
    },
  });
  await db.put(
    'resources',
    {
      etag: 'l1',
      body,
      fetchedAt: Date.now() - cache.STALE_AFTER_MS - 60_000,
      lastValidatedAt: Date.now() - cache.STALE_AFTER_MS - 60_000,
    },
    'uid_uid_test:lessons:all',
  );
}

async function seedStaleCacheForContent(body: Content) {
  const idb = await import('idb');
  const db = await idb.openDB('nh-content-cache', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('resources')) db.createObjectStore('resources');
    },
  });
  await db.put(
    'resources',
    {
      etag: 'c1',
      body,
      fetchedAt: Date.now() - cache.STALE_AFTER_MS - 60_000,
      lastValidatedAt: Date.now() - cache.STALE_AFTER_MS - 60_000,
    },
    'uid_uid_test:core:all',
  );
}

describe('contentClient.getStory', () => {
  it('200 path writes cache and returns body', async () => {
    mockFetch([
      async () =>
        new Response(JSON.stringify({ data: STORY_BODY, etag: 'e1' }), {
          status: 200,
          headers: { ETag: '"e1"' },
        }),
    ]);
    const story = await getStory('gs_a1_1');
    expect(story).toEqual(STORY_BODY);
    const cached = await cache.readCached('uid_test', 'story:gs_a1_1');
    expect(cached?.etag).toBe('e1');
  });

  it('304 path returns cached body', async () => {
    await seedStaleCache();
    mockFetch([async () => new Response(null, { status: 304 })]);
    const story = await getStory('gs_a1_1');
    expect(story).toEqual(STORY_BODY);
  });

  it('fresh cache short-circuits without fetch', async () => {
    await cache.writeCached('uid_test', 'story:gs_a1_1', { etag: 'e1', body: STORY_BODY });
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    const story = await getStory('gs_a1_1');
    expect(story).toEqual(STORY_BODY);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('401 throws ContentAuthError', async () => {
    mockFetch([
      async () => new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 }),
    ]);
    await expect(getStory('gs_a1_1')).rejects.toBeInstanceOf(ContentAuthError);
  });

  it('404 throws ContentNotFoundError', async () => {
    mockFetch([async () => new Response(JSON.stringify({ error: 'not_found' }), { status: 404 })]);
    await expect(getStory('does-not-exist')).rejects.toBeInstanceOf(ContentNotFoundError);
  });

  it('429 with cached body returns stale cache', async () => {
    await seedStaleCache();
    mockFetch([
      async () =>
        new Response(
          JSON.stringify({ error: 'rate_limited', retryAt: '2026-05-16T00:00:00.000Z' }),
          { status: 429 },
        ),
    ]);
    const story = await getStory('gs_a1_1');
    expect(story).toEqual(STORY_BODY);
  });

  it('429 with no cache throws ContentRateLimitError', async () => {
    mockFetch([
      async () =>
        new Response(
          JSON.stringify({ error: 'rate_limited', retryAt: '2026-05-16T00:00:00.000Z' }),
          { status: 429 },
        ),
    ]);
    await expect(getStory('gs_a1_1')).rejects.toBeInstanceOf(ContentRateLimitError);
  });

  it('5xx with cached body returns stale cache', async () => {
    await seedStaleCache();
    mockFetch([async () => new Response('', { status: 500 })]);
    const story = await getStory('gs_a1_1');
    expect(story).toEqual(STORY_BODY);
  });

  it('5xx with no cache throws ContentFetchError', async () => {
    mockFetch([async () => new Response('', { status: 500 })]);
    await expect(getStory('gs_a1_1')).rejects.toBeInstanceOf(ContentFetchError);
  });

  it('offline (fetch rejects) with cache returns cached', async () => {
    await seedStaleCache();
    globalThis.fetch = vi.fn(async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;
    const story = await getStory('gs_a1_1');
    expect(story).toEqual(STORY_BODY);
  });

  it('offline (fetch rejects) with no cache throws ContentOfflineError', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;
    await expect(getStory('gs_a1_1')).rejects.toBeInstanceOf(ContentOfflineError);
  });
});

describe('contentClient.getStoryCatalog + getGrammarUnit', () => {
  it('getStoryCatalog returns array', async () => {
    mockFetch([
      async () =>
        new Response(
          JSON.stringify({
            data: {
              stories: [{ id: 'gs_a1_1', level: 'A1', title: 'T', etag: 'e1' }],
              grammarUnits: [],
            },
            etag: 'cat1',
          }),
          { status: 200, headers: { ETag: '"cat1"' } },
        ),
    ]);
    const cat = await getStoryCatalog();
    expect(Array.isArray(cat)).toBe(true);
    expect(cat[0]?.id).toBe('gs_a1_1');
  });

  it('getGrammarUnit fetches from /api/content/grammar-units/{id}', async () => {
    let capturedUrl = '';
    globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
      capturedUrl = typeof url === 'string' ? url : (url as URL).toString();
      return new Response(JSON.stringify({ data: { id: 'futur_ii', forms: [] }, etag: 'g1' }), {
        status: 200,
        headers: { ETag: '"g1"' },
      });
    }) as unknown as typeof fetch;
    const u = await getGrammarUnit('futur_ii');
    expect(u.id).toBe('futur_ii');
    expect(capturedUrl).toContain('/api/content/grammar-units/futur_ii');
  });
});

describe('contentClient.getGrammar', () => {
  it('200 path writes cache and returns grammar', async () => {
    const BODY: Grammar = {
      PADEZI: { nom: 'ja' },
      GRAM: {},
      CONJ: {},
      MODAL: {},
      TENSES: {},
      ASPECT: {},
      ASPECT_PAIRS: [],
      CONDITIONAL: {},
      FORMAL_REGISTER: {},
      IMPERSONAL: {},
      PHONOLOGY: {},
      PITCH_ACCENT: [],
      PADEZI_FULL: {},
    };
    mockFetch([
      async () =>
        new Response(JSON.stringify({ data: BODY, etag: 'g1' }), {
          status: 200,
          headers: { ETag: '"g1"' },
        }),
    ]);
    const g = await getGrammar();
    expect(g).toEqual(BODY);
    const cached = await cache.readCached('uid_test', 'grammar:all');
    expect(cached?.etag).toBe('g1');
  });

  it('304 path returns cached grammar', async () => {
    const BODY: Grammar = {
      PADEZI: { nom: 'ja' },
      GRAM: {},
      CONJ: {},
      MODAL: {},
      TENSES: {},
      ASPECT: {},
      ASPECT_PAIRS: [],
      CONDITIONAL: {},
      FORMAL_REGISTER: {},
      IMPERSONAL: {},
      PHONOLOGY: {},
      PITCH_ACCENT: [],
      PADEZI_FULL: {},
    };
    await seedStaleCacheForGrammar(BODY);
    mockFetch([async () => new Response(null, { status: 304 })]);
    const g = await getGrammar();
    expect(g).toEqual(BODY);
  });
});

describe('contentClient.getLessons', () => {
  it('200 path writes cache and returns lessons array', async () => {
    const BODY: Lesson[] = [
      {
        id: 'alphabet',
        title: 'Alphabet',
        icon: 'A',
        level: 'A1',
        slides: [{ type: 'intro', body: 'test' }],
      },
    ];
    mockFetch([
      async () =>
        new Response(JSON.stringify({ data: BODY, etag: 'l1' }), {
          status: 200,
          headers: { ETag: '"l1"' },
        }),
    ]);
    const lessons = await getLessons();
    expect(lessons).toEqual(BODY);
    const cached = await cache.readCached('uid_test', 'lessons:all');
    expect(cached?.etag).toBe('l1');
  });

  it('304 path returns cached lessons', async () => {
    const BODY: Lesson[] = [
      {
        id: 'alphabet',
        title: 'Alphabet',
        icon: 'A',
        level: 'A1',
        slides: [{ type: 'intro', body: 'test' }],
      },
    ];
    await seedStaleCacheForLessons(BODY);
    mockFetch([async () => new Response(null, { status: 304 })]);
    const lessons = await getLessons();
    expect(lessons).toEqual(BODY);
  });
});

describe('contentClient.getContent', () => {
  const FIXTURE: Content = {
    V: {},
    COUNTRIES: [],
    PROFESSIONS: [],
    WEATHER: {},
    CLOTHES: {},
    BODYDESC: [],
    TECH_VOC: {},
    BUREAUCRATIC: {},
    PROVERBS: [{ hr: 'Tko rano rani, dvije sreće grabi.', en: 'test' }],
    IDIOMS: [],
    BRZALICE: [],
    HISTORY: {},
    EVENTS: [],
    KINGS: {},
    REGIONS: {},
    DIALECTS: {},
    CROATIAN_CITIES: [],
    FOODORDER: {},
    TRANSPORT: [],
    GROCERY: {},
    RECIPES: [],
    PRACTICAL: {},
    SCENES: [],
    LEVEL_NARRATIVE: { heritage: ['First Words'] },
    SHADOWING: [],
  };

  it('200 path writes cache and returns content', async () => {
    mockFetch([
      async () =>
        new Response(JSON.stringify({ data: FIXTURE, etag: 'c1' }), {
          status: 200,
          headers: { ETag: '"c1"' },
        }),
    ]);
    const content = await getContent();
    expect(content).toEqual(FIXTURE);
    const cached = await cache.readCached('uid_test', 'core:all');
    expect(cached?.etag).toBe('c1');
  });

  it('304 path returns cached content', async () => {
    await seedStaleCacheForContent(FIXTURE);
    mockFetch([async () => new Response(null, { status: 304 })]);
    const content = await getContent();
    expect(content).toEqual(FIXTURE);
  });
});
