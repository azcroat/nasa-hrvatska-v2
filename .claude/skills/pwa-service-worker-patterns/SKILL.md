---
name: pwa-service-worker-patterns
description: Service worker and PWA caching rules for the NASA Hrvatska app. Use this skill when modifying the service worker, cache logic, the web manifest, anything related to offline behavior, the SW update flow, or any code path that calls skipWaiting / clients.claim / postMessage between SW and UI. Documents the cache-first vs network-first strategy split, the update handshake, what must NOT be cached (offline.html and similar), the MIME-type-must-be-application/javascript rule, the cache version bump pattern, and the user-progress protection rule that prevents a SW update from wiping local progress. The SW has caused two production incidents — one MIME crash and one cache nuke — so trigger this skill even for a one-line change to anything cache-related.
---

# PWA / Service Worker Patterns

The service worker has caused two production incidents. Both were avoidable with rules documented below. The cost of getting this wrong is high: a bad SW deployment can hard-brick the app on every existing user's device until they manually clear storage. Read before touching anything in the SW or its registration code.

## The two incidents this skill prevents

**Incident 1 — the MIME crash.** The service worker file was served with `Content-Type: text/html` instead of `application/javascript`. Browsers reject SW registration when the response isn't a JavaScript MIME type, with no useful error to the user. The app silently lost offline support and the update flow broke. Fix below.

**Incident 2 — the cache nuke.** A SW update bumped the cache version and the activate handler wiped all caches. That part was correct. The bug: it also cleared `localStorage` keys the new SW didn't recognize, including user progress for users who hadn't synced yet. Fix below.

Don't add a third incident.

## Cache strategy — what to cache how

Different request types need different strategies. Mixing them up produces either a stale app (bad cache strategy on JS) or a broken offline experience (bad strategy on assets).

| Request type | Strategy | Why |
|---|---|---|
| Versioned static assets (JS, CSS, fonts with content hashes in filenames) | **cache-first** | The hash in the filename means a new file = a new URL; the cache can never be stale. Fastest possible serve. |
| Unversioned static assets (`/index.html`, manifest, root favicon) | **network-first with cache fallback** | These URLs are stable but their contents change with deploys. Network-first ensures users get the latest entry point; cache fallback keeps the app loading offline. |
| API routes (`/api/*`) | **network-only**, never cache | Stale API data is worse than no data. Let the request fail and let the app handle offline state in the UI. |
| `/offline.html` and similar offline fallbacks | **cache-only**, pre-cached at install | These exist precisely to be served when the network is down; caching them at install guarantees they're available. They are NEVER fetched at runtime from the network through the SW. |
| User-uploaded media (audio for TTS, custom images) | **cache-first with network fallback** | Acts like static once fetched; allows offline replay. |

**The structure that works:**

```js
const CACHE_VERSION = 'v42';
const STATIC_CACHE = `nh-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `nh-runtime-${CACHE_VERSION}`;
const OFFLINE_CACHE = `nh-offline-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    // Pre-cache offline fallbacks. These must be available even if the
    // network is down later. Pre-caching is the only way to guarantee that.
    const offlineCache = await caches.open(OFFLINE_CACHE);
    await offlineCache.addAll(['/offline.html']);
    // Optionally pre-cache critical static assets as well.
    self.skipWaiting();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API routes: network-only. Don't cache.
  if (url.pathname.startsWith('/api/')) return; // let the browser handle it

  // Navigations: network-first with offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Versioned assets (have content hash in filename): cache-first.
  if (/\.[a-f0-9]{8,}\.(js|css|woff2|png|jpg|svg)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Everything else: network with cache fallback.
  event.respondWith(networkFirstWithCacheFallback(request, RUNTIME_CACHE));
});
```

Adjust filename patterns to match your bundler's output. Vite produces `index-<hash>.js`; the regex above works for that pattern.

## The update flow

When a new SW version is deployed, the handshake between SW and UI is:

```
1. New SW downloaded. Browser calls install handler. SW status: "installing".
2. SW calls self.skipWaiting() → status: "waiting" → immediately "activating".
3. Activate handler runs. This is where stale caches are cleared.
4. SW calls self.clients.claim() → existing tabs are now controlled by the new SW.
5. New SW sends a postMessage to all clients announcing the update.
6. The UI listener receives the message and surfaces an "App updated, reload?" prompt.
```

The full pattern:

```js
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const offlineCache = await caches.open(OFFLINE_CACHE);
    await offlineCache.addAll(['/offline.html']);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Clear caches whose names don't match the current version.
    // CRITICAL: only touch caches owned by this app. See "user progress protection" below.
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(k => k.startsWith('nh-') && !k.endsWith(CACHE_VERSION))
        .map(k => caches.delete(k))
    );
    await self.clients.claim();
    // Notify all open clients.
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    clients.forEach(c => c.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION }));
  })());
});
```

On the UI side, listen for the message and prompt the user:

```js
navigator.serviceWorker.addEventListener('message', (event) => {
  if (event.data?.type === 'SW_UPDATED') {
    // Show "App updated, reload to apply" UI. Don't auto-reload — the user may
    // be mid-exercise and a reload would interrupt them.
  }
});
```

**Don't auto-reload on update.** The user might be mid-exercise with unsaved XP. Surface a dismissible prompt and let them choose when to reload.

## What MUST NOT be cached at runtime

Some resources have to be available specifically when the network is down. Caching them at runtime via the regular fetch handler means: if the user's first encounter with the resource is offline, they get nothing.

**The rule:** offline fallbacks (`/offline.html`, an offline fallback image, etc.) are PRE-CACHED at install, in their own dedicated cache (`OFFLINE_CACHE` above), and served from cache only. They are never fetched through the runtime fetch handler — that handler can hit the network, and the network being down is exactly the case the fallback exists for.

Concretely:
- Pre-cache `/offline.html` in the install handler with `cache.addAll(['/offline.html'])`.
- In the navigation fetch handler, when network fetch fails, look up `/offline.html` from `OFFLINE_CACHE` and return it.
- Never let the runtime fetch logic decide whether to cache `/offline.html` — it will, sometimes, fail to.

## The MIME type rule

The service worker file MUST be served with `Content-Type: application/javascript` (or `text/javascript`). Browsers reject SW registration when the MIME type doesn't match, with a security error in the console and no useful UI feedback.

**This is a hosting concern, not a code concern.** The rule:
- The SW file (typically `/sw.js` or `/service-worker.js`) is served from the static asset directory, not from a function.
- If a server-side route (Pages Function, redirect rule) accidentally intercepts the SW URL, the response Content-Type will be wrong. Verify the SW URL is excluded from any catch-all routing.
- After every deploy, check the SW URL in browser devtools (Network tab) and confirm `Content-Type: application/javascript` on the response.

**Symptoms of this bug:** The app loads but offline mode doesn't work. The console shows `SecurityError: Failed to register a ServiceWorker: The script has an unsupported MIME type ('text/html')`. Users on the affected version don't auto-update because the new SW can't even register.

**Recovery:** Fix the MIME type, deploy, and bump the cache version on the next SW update so the activate handler clears the stuck old caches. Users get the fix on their next reload.

## Cache version bump — when and what it clears

The `CACHE_VERSION` constant at the top of the SW is the cache-busting mechanism. Bump it when:
- Any pre-cached resource changes (the offline fallback HTML, for instance).
- The cache key naming scheme changes (`nh-static` → `nh-static-v2`).
- A bug requires forcing all clients to re-fetch from network on next load.

What bumping the version does:
- New SW installs into a new set of caches (`nh-static-v43`, etc.).
- On activate, old caches whose names match the app's prefix (`nh-`) but aren't the current version are deleted.
- Clients on the next reload see the new version.

What bumping the version does NOT do (and must not do):
- Touch `localStorage` or `sessionStorage`. The activate handler operates on `caches.*` only.
- Touch IndexedDB. Same reason.
- Clear cookies or site data.

The activate handler's cache-clearing logic must be SCOPED — it deletes only caches that begin with the app's prefix. A naive `caches.keys()` followed by `Promise.all(keys.map(caches.delete))` will delete caches owned by other origins or other PWAs the user has installed. Always filter by prefix.

## The user progress protection rule

This is the rule the cache-nuke incident violated. State it explicitly:

**A service worker update must never destroy data that lives outside the SW's caches.** The SW owns its `caches.*` storage and nothing else. `localStorage` (including everything with the `nh_` prefix), `sessionStorage`, `IndexedDB`, and Firestore-mirrored state all belong to the application code, not the SW.

The activate handler scope is:

```js
// CORRECT
const keys = await caches.keys();
await Promise.all(
  keys
    .filter(k => k.startsWith('nh-') && !k.endsWith(CACHE_VERSION))
    .map(k => caches.delete(k))
);

// WRONG — touches anything outside caches
self.clients.matchAll().then(clients => {
  clients.forEach(c => c.postMessage({ type: 'CLEAR_LOCAL_STORAGE' }));
});

// WRONG — touches caches the SW doesn't own
const keys = await caches.keys();
await Promise.all(keys.map(k => caches.delete(k)));
```

If a feature genuinely requires clearing localStorage on update (e.g. a schema migration), do it in **application code** on first load after the update, with a guard that only runs the migration once per version, and ONLY for the specific keys that need migration. Never use the SW activate handler to reach into application-owned storage.

## Pre-flight checklist before merging an SW change

1. The cache version constant has been bumped.
2. Activate handler's cache deletion is scoped to the app's prefix.
3. No code in the SW touches `localStorage`, `sessionStorage`, `IndexedDB`, or sends client messages that ask the UI to clear those.
4. Pre-cached offline fallbacks are in their own dedicated cache and not subject to runtime cache strategy.
5. The SW file URL is NOT routed through any catch-all that could change its Content-Type.
6. The update flow surfaces a prompt; it does not auto-reload.
7. After deploy, the SW URL has been verified in browser devtools to return `Content-Type: application/javascript`.
8. The new version has been tested with an existing client (i.e. install the previous version, then deploy the new one and verify the update lands cleanly without losing user progress).

## Keeping this skill current

If the cache strategy changes, the update flow gains a new step, or a new class of resource needs explicit caching rules, document it here. Don't rely on memory between sessions for SW behavior — the SW is the part of the codebase most likely to silently break after a change that "looked fine."
