/**
 * Telemetry helpers for the environmental IndexedDB "internal-server" error.
 * Kept in their own module (rather than sentryHelpers.ts) so the unit-tested
 * logic lives in a file with no unrelated history.
 */

/**
 * Detects the browser-engine IndexedDB *internal-server* error:
 *   "An internal error was encountered in the Indexed Database server"
 *   (Chromium throws this as an UnknownError DOMException).
 *
 * Environmental failure on the user's device — flaky/corrupted disk storage,
 * eviction under pressure, private-mode restrictions, or a WebView IDB bug. It
 * surfaces ASYNCHRONOUSLY from Firebase's persistence layer (Firestore
 * persistentLocalCache / Auth indexedDBLocalPersistence), so the init-time
 * try/catch cascades in firebase.ts cannot catch it, and it bubbles up as an
 * unhandled rejection. Firebase degrades gracefully (Firestore → network, Auth →
 * localStorage), and contentCache.ts swallows its own IDB failures, so this is
 * non-fatal and NOT actionable in our code.
 *
 * Match is deliberately narrow — the word "server" only appears in this
 * internal-error message, so actionable IDB errors (QuotaExceeded, Version,
 * Constraint) keep reporting at full priority. Callers pass an already-lowercased
 * msg. KEEP IN SYNC with functions/api/report-error.js IGNORED_SENTRY_PATTERNS.
 */
export function isEnvironmentalIdbError(msg: string): boolean {
  return msg.includes('indexed database server');
}

/**
 * Minimal structural view of the Sentry event fields we inspect. Declared
 * locally so this helper and its tests don't need the Sentry SDK types — the
 * real `Event` is structurally assignable to it.
 */
export interface MinimalSentryEvent {
  exception?: { values?: Array<{ value?: string }> };
  message?: unknown;
  level?: string;
  fingerprint?: string[];
}

/**
 * Primary error text of a Sentry event, lowercased for matching: the first
 * exception's `value`, else a string `message`, else ''.
 */
export function sentryEventMessage(event: MinimalSentryEvent): string {
  const exceptionValue = event.exception?.values?.[0]?.value;
  if (typeof exceptionValue === 'string') return exceptionValue.toLowerCase();
  if (typeof event.message === 'string') return event.message.toLowerCase();
  return '';
}

/**
 * If `event` is an environmental IndexedDB internal-server error, downgrade it
 * to 'info' with a stable fingerprint — it stops paging as a high-priority
 * issue but is retained so a frequency spike from a real regression still
 * surfaces. Mutates and returns the event. See isEnvironmentalIdbError().
 */
export function downgradeEnvironmentalIdbEvent<T extends MinimalSentryEvent>(event: T): T {
  if (isEnvironmentalIdbError(sentryEventMessage(event))) {
    event.level = 'info';
    event.fingerprint = ['environmental-indexeddb-server-error'];
  }
  return event;
}
