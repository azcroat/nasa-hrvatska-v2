import { readCached, writeCached, bumpValidated, isStale, isTooOldToServe } from './contentCache';
import { getFirebaseBearer } from './audio';
import { getCurrentUid } from './firebaseUid';
import {
  ContentAuthError,
  ContentNotFoundError,
  ContentRateLimitError,
  ContentOfflineError,
  ContentFetchError,
  type ContentCatalog,
  type StoryCatalogEntry,
  type GrammarCatalogEntry,
  type Story,
  type GrammarUnit,
  type Grammar,
  type Lesson,
  type Content,
} from '../types/content';

const ANON_NS = 'anon';

async function namespaceUid(): Promise<string> {
  return (await getCurrentUid()) || ANON_NS;
}

async function fetchAuthed(path: string, etag?: string): Promise<Response> {
  // First attempt — cached bearer (matches apiFetch.ts hot path).
  const bearer = await getFirebaseBearer();
  const headers: Record<string, string> = {};
  if (bearer) headers.Authorization = 'Bearer ' + bearer;
  if (etag) headers['If-None-Match'] = `"${etag}"`;
  // We intentionally fire the fetch even when there's no bearer. A previous
  // attempt to short-circuit with a synthetic 401 broke every e2e test that
  // mocks /api/content/* via page.route, because the mock route never sees
  // a request that's intercepted before fetch() runs. Letting the request
  // through preserves test contract; the bearer-race in audio.ts is fixed
  // separately so authenticated users no longer see cold-load 401s.
  let res = await fetch(path, { method: 'GET', headers });

  // 2026-05-21 BUG FIX: long-running tabs sit on a 1-hour Firebase ID token;
  // when it expires, /api/content/* returns 401 even though the user is
  // authenticated. apiFetch.ts already does this 401→force-refresh→retry
  // dance; content fetches need the same. One retry only — if the refresh
  // still produces a 401, the user is genuinely unauthenticated and we let
  // ContentAuthError propagate as before.
  if (res.status === 401 && bearer) {
    const fresh = await getFirebaseBearer(true);
    if (fresh && fresh !== bearer) {
      const retryHeaders: Record<string, string> = { Authorization: 'Bearer ' + fresh };
      if (etag) retryHeaders['If-None-Match'] = `"${etag}"`;
      res = await fetch(path, { method: 'GET', headers: retryHeaders });
    }
  }
  return res;
}

async function fetchAndCache<T>(uid: string, resourceKey: string, path: string): Promise<T> {
  const cached = await readCached(uid, resourceKey);

  // Fresh cache: short-circuit, no network
  if (cached && !isStale(cached)) {
    return cached.body as T;
  }

  let res: Response;
  try {
    res = await fetchAuthed(path, cached?.etag);
  } catch {
    if (cached && !isTooOldToServe(cached)) return cached.body as T;
    throw new ContentOfflineError();
  }

  if (res.status === 304 && cached) {
    await bumpValidated(uid, resourceKey);
    return cached.body as T;
  }

  if (res.status === 401) throw new ContentAuthError();

  if (res.status === 404) {
    throw new ContentNotFoundError(resourceKey);
  }

  if (res.status === 429) {
    if (cached && !isTooOldToServe(cached)) return cached.body as T;
    let retryAt = '';
    try {
      const json = (await res.json()) as { retryAt?: string };
      retryAt = json?.retryAt ?? '';
    } catch {
      /* ignore */
    }
    throw new ContentRateLimitError(retryAt);
  }

  if (!res.ok) {
    if (cached && !isTooOldToServe(cached)) return cached.body as T;
    throw new ContentFetchError(res.status);
  }

  // Server returns { data, etag }
  const json = (await res.json()) as { data: T; etag: string };
  await writeCached(uid, resourceKey, { etag: json.etag, body: json.data });
  return json.data;
}

export async function getStoryCatalog(): Promise<StoryCatalogEntry[]> {
  const uid = await namespaceUid();
  const cat = await fetchAndCache<ContentCatalog>(uid, 'catalog:all', '/api/content/catalog');
  return cat.stories;
}

export async function getGrammarUnitCatalog(): Promise<GrammarCatalogEntry[]> {
  const uid = await namespaceUid();
  const cat = await fetchAndCache<ContentCatalog>(uid, 'catalog:all', '/api/content/catalog');
  return cat.grammarUnits;
}

export async function getStory(id: string): Promise<Story> {
  const uid = await namespaceUid();
  return fetchAndCache<Story>(uid, `story:${id}`, `/api/content/stories/${encodeURIComponent(id)}`);
}

export async function getGrammarUnit(id: string): Promise<GrammarUnit> {
  const uid = await namespaceUid();
  return fetchAndCache<GrammarUnit>(
    uid,
    `grammar:${id}`,
    `/api/content/grammar-units/${encodeURIComponent(id)}`,
  );
}

export async function getGrammar(): Promise<Grammar> {
  const uid = await namespaceUid();
  return fetchAndCache<Grammar>(uid, 'grammar:all', '/api/content/grammar');
}

export async function getLessons(): Promise<Lesson[]> {
  const uid = await namespaceUid();
  return fetchAndCache<Lesson[]>(uid, 'lessons:all', '/api/content/lessons');
}

export async function getContent(): Promise<Content> {
  const uid = await namespaceUid();
  return fetchAndCache<Content>(uid, 'core:all', '/api/content/core');
}
