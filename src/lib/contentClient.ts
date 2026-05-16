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
} from '../types/content';

const ANON_NS = 'anon';

async function namespaceUid(): Promise<string> {
  return (await getCurrentUid()) || ANON_NS;
}

async function fetchAuthed(path: string, etag?: string): Promise<Response> {
  const bearer = await getFirebaseBearer();
  const headers: Record<string, string> = {};
  if (bearer) headers.Authorization = 'Bearer ' + bearer;
  if (etag) headers['If-None-Match'] = `"${etag}"`;
  return fetch(path, { method: 'GET', headers });
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
