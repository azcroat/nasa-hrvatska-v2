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
