/**
 * Browsers known to crash Sentry Replay's DOM snapshotter via content-blocker
 * shims that return non-Element nodes from DOM queries. When this returns
 * false, callers must omit Sentry.replayIntegration() from the integrations
 * array. Tracing and the error SDK still run — only Replay is affected.
 *
 * Keep the message-match defenses in src/main.tsx ignoreErrors and
 * functions/api/report-error.js IGNORED_SENTRY_PATTERNS as belt-and-suspenders
 * for shim browsers we haven't UA-detected yet.
 */
export function shouldEnableSentryReplay(userAgent?: string): boolean {
  const ua = userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  // DuckDuckGo Mobile (iOS WebKit) — confirmed to break Replay on 2026-05-28.
  // Also matches DDG Desktop, but its user share is small and disabling Replay
  // there is a cheap trade-off vs. UA-detect complexity.
  if (/DuckDuckGo/.test(ua)) return false;
  return true;
}

/**
 * Detects the browser-engine IndexedDB *internal-server* error:
 *   "An internal error was encountered in the Indexed Database server"
 *   (Chromium throws this as an UnknownError DOMException).
 *
 * This is an environmental failure on the user's device — flaky/corrupted disk
 * storage, eviction under pressure, private-mode restrictions, or a WebView IDB
 * bug. It surfaces ASYNCHRONOUSLY from Firebase's persistence layer (Firestore
 * persistentLocalCache / Auth indexedDBLocalPersistence), so the init-time
 * try/catch cascades in firebase.ts cannot catch it, and it bubbles up as an
 * unhandled rejection. Firebase degrades gracefully (Firestore → network, Auth →
 * localStorage), and src/lib/contentCache.ts swallows its own IDB failures, so
 * this is non-fatal and NOT actionable in our code.
 *
 * We therefore treat it specially in src/main.tsx: DOWNGRADE it in Sentry
 * `beforeSend` (retain at low severity so a frequency spike from a real
 * regression still surfaces) and SUPPRESS the duplicate homegrown report in the
 * window error handlers. Match is deliberately narrow — the word "server" only
 * appears in this internal-error message, so actionable IDB errors
 * (QuotaExceeded, Version, Constraint) keep reporting at full priority.
 *
 * Contract mirrors isChunkLoadError: callers pass an already-lowercased msg.
 * KEEP IN SYNC with functions/api/report-error.js IGNORED_SENTRY_PATTERNS.
 */
export function isEnvironmentalIdbError(msg: string): boolean {
  return msg.includes('indexed database server');
}
