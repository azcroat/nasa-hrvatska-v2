import { openDB, type IDBPDatabase } from 'idb';

export interface CacheEntry {
  etag: string;
  body: unknown;
  fetchedAt: number;
  lastValidatedAt: number;
}

export const STALE_AFTER_MS = 24 * 60 * 60 * 1000; // 24h
export const SERVE_STALE_BEFORE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const DB_NAME = 'nh-content-cache';
const STORE = 'resources';

let dbPromise: Promise<IDBPDatabase> | null = null;

async function openContentDb(): Promise<IDBPDatabase> {
  try {
    return await openDB(DB_NAME, 1, {
      // Version 1 + single store: upgrade runs only on first creation, so the
      // store cannot already exist — create it unconditionally (the previous
      // `if (!contains)` guard's else-branch was unreachable dead code).
      upgrade(db) {
        db.createObjectStore(STORE);
      },
    });
  } catch (err) {
    // A transient IndexedDB open failure (e.g. the browser's "internal error in
    // the Indexed Database server", or storage eviction) must not cache a
    // rejected promise forever — that would permanently disable the content
    // cache for the whole session. Clear the handle so the next call retries;
    // the caller's own try/catch treats this rejection as a cache miss.
    dbPromise = null;
    throw err;
  }
}

function getDb(): Promise<IDBPDatabase> {
  dbPromise ??= openContentDb();
  return dbPromise;
}

function makeKey(uid: string, resourceKey: string): string {
  return `uid_${uid}:${resourceKey}`;
}

export async function readCached(uid: string, resourceKey: string): Promise<CacheEntry | null> {
  try {
    const db = await getDb();
    const result = await db.get(STORE, makeKey(uid, resourceKey));
    return (result as CacheEntry) ?? null;
  } catch {
    return null;
  }
}

export async function writeCached(
  uid: string,
  resourceKey: string,
  partial: { etag: string; body: unknown },
): Promise<void> {
  try {
    const db = await getDb();
    const now = Date.now();
    const entry: CacheEntry = {
      etag: partial.etag,
      body: partial.body,
      fetchedAt: now,
      lastValidatedAt: now,
    };
    await db.put(STORE, entry, makeKey(uid, resourceKey));
  } catch {
    /* cache write is best-effort */
  }
}

export async function bumpValidated(uid: string, resourceKey: string): Promise<void> {
  try {
    const db = await getDb();
    const existing = (await db.get(STORE, makeKey(uid, resourceKey))) as CacheEntry | undefined;
    if (!existing) return;
    await db.put(STORE, { ...existing, lastValidatedAt: Date.now() }, makeKey(uid, resourceKey));
  } catch {
    /* best-effort */
  }
}

export function isStale(entry: CacheEntry, now = Date.now()): boolean {
  return now - entry.lastValidatedAt > STALE_AFTER_MS;
}

export function isTooOldToServe(entry: CacheEntry, now = Date.now()): boolean {
  return now - entry.fetchedAt > SERVE_STALE_BEFORE_MS;
}
