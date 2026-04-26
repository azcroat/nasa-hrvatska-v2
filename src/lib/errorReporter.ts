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
