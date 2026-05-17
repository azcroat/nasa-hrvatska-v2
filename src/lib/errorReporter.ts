/**
 * errorReporter — fire-and-forget client error reporting.
 *
 * In development: logs to console only.
 * In production: sends via sendBeacon (non-blocking, survives page unload)
 * to the /api/report-error Cloudflare Worker which logs to the dashboard.
 */

// Evaluated at call time — Capacitor bridge is async-injected; module-load evaluation
// always returns '' on Android because the bridge isn't ready yet.
function _getNativeApiBase(): string {
  if (typeof window === 'undefined') return '';
  // Capacitor Android serves from https://localhost with no port
  if (window.location.hostname === 'localhost' && !window.location.port)
    return 'https://nasahrvatska.com';
  return '';
}

export function reportError(error: unknown, context?: string): void {
  if (import.meta.env.DEV) {
    console.error('[reportError]', context, error);
    return;
  }
  try {
    if (typeof window === 'undefined') return; // SSR safety
    const err = error instanceof Error ? error : new Error(String(error));
    const payload = {
      message: err.message ?? String(error),
      stack: err.stack?.slice(0, 1500) ?? '',
      context: context ?? '',
      url: window.location.href,
      ts: Date.now(),
    };
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        `${_getNativeApiBase()}/api/report-error`,
        new Blob([JSON.stringify(payload)], { type: 'application/json' }),
      );
    } else {
      fetch(`${_getNativeApiBase()}/api/report-error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch (_) {
    // Never let reporting itself crash the app
  }
}

/**
 * SP3b: Shared error-reporting entrypoint for ErrorBoundary (scope='root')
 * and ScreenErrorBoundary (scope=screenName). Logs to console in dev, sends
 * to /api/report-error via sendBeacon in prod through the same pipeline as
 * reportError(). Boundary-specific context (componentStack, retries) is
 * composed into the `context` string so the existing server-side log
 * consumer doesn't need to change.
 */
export function reportBoundaryError(
  error: Error,
  info: { componentStack?: string | null },
  scope: 'root' | string,
  retries = 0,
): void {
  console.error('[boundary]', scope, error, info.componentStack);

  // Compose a richer context string. The /api/report-error endpoint just
  // logs `context` verbatim, so a structured prefix is the simplest way to
  // distinguish boundary reports from window.onerror / unhandledrejection.
  const stackTail = (info.componentStack ?? '').slice(0, 500).replace(/\n/g, ' ');
  const context = `boundary:${scope} retries=${retries} componentStack=${stackTail}`;
  reportError(error, context);
}
