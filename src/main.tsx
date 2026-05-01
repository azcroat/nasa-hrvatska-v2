import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Polyfill Array.prototype.at() for Android WebView < Chrome 92
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (!(Array.prototype as any).at) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Array.prototype as any).at = function (index: number) {
    const i = index < 0 ? this.length + index : index;
    return this[i];
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (!(String.prototype as any).at) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (String.prototype as any).at = function (index: number) {
    const i = index < 0 ? this.length + index : index;
    return this[i];
  };
}
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import './index.css';
import App from './App';
import { reportError } from './lib/errorReporter.js';
import { isNative, isAndroid } from './lib/platform.js';
import { initPostHog } from './lib/analytics';
import { registerSW } from 'virtual:pwa-register';

// ─── Capacitor native: mark <html> for CSS animation overrides ────────────
// Many CSS entrance animations start at opacity:0 with fill-mode:both.
// On Android WebView, if the animation engine fails to start, fill-mode:backwards
// freezes elements at opacity:0 — invisible and unclickable — with no JS error.
// Adding .native-android to <html> lets a single CSS rule override all animation
// durations to near-zero so every element immediately jumps to its visible end state.
// Must run synchronously before React renders.
if (isNative()) {
  document.documentElement.classList.add('native-android');
}

// ─── Capacitor native plugin initialisation ────────────────────────────────
// Runs only inside the Android / iOS shell; is a no-op in the browser.
// StatusBar: transparent overlay so our gradient header fills edge-to-edge.
// SplashScreen: hidden after React has painted, preventing a white flash.
// Keyboard: resize only the webview body — avoids layout shifts on iOS.
if (isNative()) {
  (async () => {
    try {
      const [{ StatusBar, Style }, { SplashScreen }, { Keyboard }] = await Promise.all([
        import('@capacitor/status-bar'),
        import('@capacitor/splash-screen'),
        import('@capacitor/keyboard'),
      ]);

      // Transparent status bar — our CSS gradient extends beneath it
      await StatusBar.setOverlaysWebView({ overlay: true });
      await StatusBar.setStyle({ style: Style.Dark });

      // Android: set status-bar background to match our dark teal
      if (isAndroid()) {
        await StatusBar.setBackgroundColor({ color: '#0e7490' });
      }

      // Hide the native splash after first paint
      await SplashScreen.hide({ fadeOutDuration: 300 });

      // Keyboard resizes only the body — prevents the entire app shifting up on iOS
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await Keyboard.setResizeMode({ mode: 'body' as any });
    } catch (_) {
      // Plugin bootstrap errors must never crash the app
    }
  })();
}

// ─── Production console suppression ───────────────────────────────────────
// Silence log/debug/info/warn in production — reduces noise in App Store review
// sessions and prevents accidental PII leakage via console. Errors are kept
// so Sentry / onerror handlers still receive them.
if (import.meta.env.PROD) {
  const noop = () => {};
  console.warn = noop;
}

// ─── Error-handler helpers ────────────────────────────────────────────────
// Defined here (before Sentry init) so they are available to the Sentry
// dynamic import's .catch() handler as well as window.onerror /
// window.onunhandledrejection which are registered later.
//
// Detects WebKit's "Importing binding name 'X' is not found" SyntaxError
// which fires when a stale SW-cached chunk tries to resolve a named import
// that no longer exists in the freshly-deployed chunk (minifier renamed it).
function _isStaleBindingError(msg: unknown) {
  return typeof msg === 'string' && msg.includes('Importing binding name');
}
// Detects chunk-load / dynamic-import failures across Chrome, Safari, Firefox,
// and Webpack/Vite "loading chunk N failed" messages. These occur after a
// deploy when old HTML references a vendor chunk whose hash has changed.
function _isChunkLoadError(msg: string) {
  return (
    msg.includes('failed to fetch') ||
    msg.includes('importing a module script failed') ||
    msg.includes('dynamically imported module') ||
    msg.includes('expected a javascript module script') ||
    msg.includes('mime type') ||
    msg.includes('loading chunk') ||
    msg.includes('importing binding name')
  );
}
// Purges JS caches and reloads, but only up to 2 times to prevent infinite
// reload loops. Uses sessionStorage so the counter resets on each fresh visit.
function _reloadWithCachePurge(storageKey: string) {
  try {
    const n = parseInt(sessionStorage.getItem(storageKey) || '0', 10);
    if (n >= 2) return false; // stop after 2 attempts — don't loop forever
    sessionStorage.setItem(storageKey, String(n + 1));
    if ('caches' in globalThis) {
      caches
        .keys()
        .then((names) =>
          names.forEach((name) => {
            if (name.includes('nasa-hrvatska') && name.includes('-js')) caches.delete(name);
          }),
        )
        .catch(() => {})
        .finally(() => globalThis.location.reload());
    } else {
      globalThis.location.reload();
    }
    return true;
  } catch (_) {
    return false;
  }
}

// ─── Sentry error telemetry ────────────────────────────────────────────────
// Set VITE_SENTRY_DSN in Cloudflare Pages environment variables.
// The app works fully without it — telemetry is opt-in via env var.
// Dynamically imported so the ~40KB Sentry bundle is never parsed when DSN is absent.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _sentry: any = null;
if (import.meta.env.VITE_SENTRY_DSN) {
  import('@sentry/react')
    .then((Sentry) => {
      _sentry = Sentry;
      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        /* eslint-disable @typescript-eslint/no-explicit-any */
        release:
          typeof (globalThis as any).__BUILD_ID__ !== 'undefined'
            ? (globalThis as any).__BUILD_ID__
            : import.meta.env.VITE_APP_VERSION,
        /* eslint-enable @typescript-eslint/no-explicit-any */
        // Only send errors in production; silence in dev
        enabled: import.meta.env.PROD,
        tracesSampleRate: 0.1,
        replaysOnErrorSampleRate: 0.1, // capture replay for 10% of error sessions to aid sync debugging
        integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
        // Scrub PII from error reports
        beforeSend(event) {
          if (event.request?.url) {
            event.request.url = event.request.url.replace(/[?#].*/, '');
          }
          // Remove extra/contexts that may contain user data from error boundary
          delete event.extra;
          if (event.contexts) {
            event.contexts = event.contexts.trace ? { trace: event.contexts.trace } : {};
          }
          if (Array.isArray(event.breadcrumbs?.values)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const bc = event.breadcrumbs as any;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            bc.values = (bc.values as any[])
              .filter(
                (b: { category?: string }) =>
                  b.category === 'web-vitals' || b.category === 'navigation',
              )
              .map(
                ({
                  category,
                  level,
                  timestamp,
                }: {
                  category?: string;
                  level?: string;
                  timestamp?: number;
                }) => ({ category, level, timestamp }),
              );
          }
          return event;
        },
      });
    })
    .catch((e: unknown) => {
      const msg = (
        ((e as { message?: string })?.message ?? '') +
        ((e as { name?: string })?.name ?? '')
      ).toLowerCase();
      if (_isChunkLoadError(msg)) {
        _reloadWithCachePurge('nh_reload_attempt');
      }
      // If not a chunk error, swallow silently — Sentry is not running so
      // there is nowhere to report it.
    });
}

// Only initialize PostHog if the user has already accepted analytics cookies
// (i.e. they accepted on a previous visit). On first visit this is skipped and
// CookieConsent will call initPostHog() when the user clicks "Accept all".
if (localStorage.getItem('cookie_consent_v1') === 'accepted') {
  initPostHog();
}

// ─── Web Vitals → Sentry ───────────────────────────────────────────────────
// Reports Core Web Vitals as Sentry performance measurements.
// Fires once per page load; no PII is collected.
function reportWebVitals(metric: Metric) {
  if (!_sentry) return;
  _sentry.addBreadcrumb({
    category: 'web-vitals',
    message: metric.name,
    data: {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      rating: metric.rating,
    },
    level: metric.rating === 'poor' ? 'warning' : 'info',
  });
}
onCLS(reportWebVitals);
onFCP(reportWebVitals);
onINP(reportWebVitals);
onLCP(reportWebVitals);
onTTFB(reportWebVitals);

// ─── Error Boundary ────────────────────────────────────────────────────────
interface EBState {
  hasError: boolean;
  errorMsg: string;
}
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, EBState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error: unknown): EBState {
    const msg = error && (error as Error).message ? (error as Error).message : String(error);
    return { hasError: true, errorMsg: msg };
  }
  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('App crash:', error, info);
    if (_sentry) {
      _sentry.captureException(error, { extra: info });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg,#fef3c7,#fff7ed)',
            padding: 24,
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 400, width: '100%' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }} aria-hidden="true">
              ⚠️
            </div>
            <h2
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 24,
                color: '#164e63',
                marginBottom: 8,
              }}
            >
              Something went wrong
            </h2>
            <p style={{ color: '#78716c', marginBottom: 12, fontSize: 14 }}>
              The app hit an unexpected error. Your progress is saved.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 32px',
                background: 'linear-gradient(135deg,#0e7490,#164e63)',
                color: 'white',
                border: 'none',
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Global error capture ──────────────────────────────────────────────────
// Catches errors that escape React's error boundaries (e.g. async callbacks,
// errors in event handlers, errors in non-React code). Complements Sentry
// when VITE_SENTRY_DSN is not set, and provides a lightweight fallback.
//
// Helper functions (_isStaleBindingError, _isChunkLoadError, _reloadWithCachePurge)
// are defined above the Sentry init block so they are available there too.

window.onerror = function (message, _source, _lineno, _colno, error) {
  const msg = (error?.message || '') + String(message || '');
  if (_isStaleBindingError(msg)) {
    if (_reloadWithCachePurge('nh_binding_reload')) return true; // suppress Sentry noise
  }
  reportError(error ?? new Error(String(message)), 'window.onerror');
  return false;
};
window.onunhandledrejection = function (event) {
  const reason = event.reason;
  const msg = ((reason?.message ?? '') + (reason?.name ?? '')).toLowerCase();
  if (_isStaleBindingError(msg)) {
    if (_reloadWithCachePurge('nh_binding_reload')) return;
  }
  if (_isChunkLoadError(msg)) {
    if (_reloadWithCachePurge('nh_reload_attempt')) return;
  }
  reportError(reason ?? new Error('Unhandled rejection'), 'unhandledrejection');
};

// ─── App version check — independent of SW ────────────────────────────────
// Fetches /version.json from the network (no-store) on every page load.
// If the deployed version differs from what this session loaded, reload once.
// This guarantees all users see new deploys even when SW cache is stuck.
// Check /version.json (always from network) and reload if deployed version changed.
// Runs on load AND every 5 minutes so open tabs stay current without any user action.
const _VER_KEY = 'nh_app_ver';
function _checkVersion(isPolling: boolean) {
  try {
    fetch('/version.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.v) return;
        const next = String(data.v);
        const stored = sessionStorage.getItem(_VER_KEY);
        if (stored && stored !== next) {
          sessionStorage.setItem(_VER_KEY, next);
          window.location.reload();
        } else if (!isPolling) {
          sessionStorage.setItem(_VER_KEY, next);
        }
      })
      .catch(() => {});
  } catch (_) {}
}
_checkVersion(false);
setInterval(() => _checkVersion(true), 5 * 60 * 1000);

// ─── Service Worker registration ──────────────────────────────────────────
// Skip entirely inside Capacitor Android/iOS — WebView does not support SW
// registration from https://localhost/ and the attempt throws an unhandled
// rejection that pollutes Sentry. Web browsers get the full PWA experience.
if (!isNative() && 'serviceWorker' in navigator) {
  // Remove legacy sessionStorage keys that previously blocked SW updates after 3 reloads.
  try {
    sessionStorage.removeItem('sw-reloaded-at');
    sessionStorage.removeItem('sw-reload-count');
  } catch (_) {}

  registerSW({ immediate: true });

  // Single reload guard — resets to false on every fresh page load.
  let refreshing = false;
  const doReload = () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  };

  // Path 1 — SW sends SW_UPDATED after activate+claim (handles updates that happen
  // while the tab is open OR while it was backgrounded).
  // Only reload if this page had a controller when it loaded — that means a new SW
  // took over an existing session (genuine update). First installs have no prior
  // controller and need no reload.
  const hadControllerAtLoad = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SW_UPDATED' && hadControllerAtLoad) doReload();
  });

  // Path 2 — controllerchange (backup path; fires when a new SW activates via
  // skipWaiting while this tab is open and the listener was already registered).
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (navigator.serviceWorker.controller?.scriptURL?.includes('firebase-messaging-sw')) return;
    doReload();
  });

  // Path 3 — on every page load, proactively fetch and activate any new SW.
  // Handles the case where a new SW was waiting before this page loaded:
  // reg.waiting exists → send SKIP_WAITING → controllerchange fires → reload.
  navigator.serviceWorker.ready.then((reg) => {
    reg.update().catch(() => {});
    if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener('statechange', () => {
        if (sw.state === 'installed') reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
      });
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
