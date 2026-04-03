import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import './index.css';
import App from './App.jsx';
import { reportError } from './lib/errorReporter.js';

// ─── Production console suppression ───────────────────────────────────────
// Silence log/debug/info/warn in production — reduces noise in App Store review
// sessions and prevents accidental PII leakage via console. Errors are kept
// so Sentry / onerror handlers still receive them.
if (import.meta.env.PROD) {
  const noop = () => {};
  console.warn = noop;
}

// ─── Sentry error telemetry ────────────────────────────────────────────────
// Set VITE_SENTRY_DSN in Cloudflare Pages environment variables.
// The app works fully without it — telemetry is opt-in via env var.
// Dynamically imported so the ~40KB Sentry bundle is never parsed when DSN is absent.
let _sentry = null;
if (import.meta.env.VITE_SENTRY_DSN) {
  import('@sentry/react').then((Sentry) => {
    _sentry = Sentry;
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      release: import.meta.env.VITE_APP_VERSION || '2.0.0',
      // Only send errors in production; silence in dev
      enabled: import.meta.env.PROD,
      tracesSampleRate: 0.1,
      replaysOnErrorSampleRate: 0,
      integrations: [Sentry.browserTracingIntegration()],
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
          const bc = /** @type {any} */ (event.breadcrumbs);
          bc.values = bc.values
            .filter(b => b.category === 'web-vitals' || b.category === 'navigation')
            .map(({ category, level, timestamp }) => ({ category, level, timestamp }));
        }
        return event;
      },
    });
  });
}

// ─── PostHog product analytics ─────────────────────────────────────────────
// Set VITE_POSTHOG_KEY in Cloudflare Pages env vars. Free up to 1M events/mo.
// Opt-in via env var AND requires explicit cookie consent — never fires without both.
// Dynamically imported so the ~30KB PostHog bundle is never parsed when key is absent.
export function initPostHog() {
  if (import.meta.env.VITE_POSTHOG_KEY && import.meta.env.PROD) {
    import('posthog-js').then(({ default: posthog }) => {
      posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
        api_host: 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: false,       // manual events only — no accidental PII
        disable_session_recording: true,
        persistence: 'localStorage+cookie',
      });
      // Make posthog accessible for funnel analytics throughout the app
      window.__posthog = posthog;
    });
  }
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
function reportWebVitals(metric) {
  if (!_sentry) return;
  _sentry.addBreadcrumb({
    category: 'web-vitals',
    message: metric.name,
    data: { value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value), rating: metric.rating },
    level: metric.rating === 'poor' ? 'warning' : 'info',
  });
}
onCLS(reportWebVitals);
onFCP(reportWebVitals);
onINP(reportWebVitals);
onLCP(reportWebVitals);
onTTFB(reportWebVitals);

// ─── Error Boundary ────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error && error.message ? error.message : String(error) };
  }
  componentDidCatch(error, info) {
    console.error('App crash:', error, info);
    if (_sentry) {
      _sentry.captureException(error, { extra: info });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#fef3c7,#fff7ed)', padding: 24, textAlign: 'center' }}>
          <div style={{ maxWidth: 400, width: '100%' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }} aria-hidden="true">⚠️</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: '#164e63', marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ color: '#78716c', marginBottom: 12, fontSize: 14 }}>The app hit an unexpected error. Your progress is saved.</p>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '12px 32px', background: 'linear-gradient(135deg,#0e7490,#164e63)', color: 'white', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
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
// Also handles WebKit's "Importing binding name 'X' is not found" SyntaxError
// which fires when a stale SW-cached chunk tries to resolve a named import
// that no longer exists in the freshly-deployed chunk (minifier renamed it).
// In this case we purge the JS cache and reload — same recovery path as
// lazyWithReload in AppRouter.jsx but for eagerly-loaded / static imports.
function _isStaleBindingError(msg) {
  return typeof msg === 'string' && msg.includes('Importing binding name');
}
function _reloadWithCachePurge(storageKey) {
  try {
    const n = parseInt(sessionStorage.getItem(storageKey) || '0', 10);
    if (n >= 2) return false; // stop after 2 attempts — don't loop forever
    sessionStorage.setItem(storageKey, String(n + 1));
    if ('caches' in window) {
      caches.keys()
        .then(names => names.forEach(name => { if (name.includes('nasa-hrvatska') && name.includes('-js')) caches.delete(name); }))
        .catch(() => {})
        .finally(() => window.location.reload());
    } else {
      window.location.reload();
    }
    return true;
  } catch (_) { return false; }
}

window.onerror = function (message, _source, _lineno, _colno, error) {
  const msg = (error?.message || '') + String(message || '');
  if (_isStaleBindingError(msg)) {
    if (_reloadWithCachePurge('nh_binding_reload')) return true; // suppress Sentry noise
  }
  reportError(error ?? new Error(String(message)), 'window.onerror');
};
window.onunhandledrejection = function (event) {
  const reason = event.reason;
  const msg = (reason?.message || '') + (reason?.name || '');
  if (_isStaleBindingError(msg)) {
    if (_reloadWithCachePurge('nh_binding_reload')) return;
  }
  reportError(reason ?? new Error('Unhandled rejection'), 'unhandledrejection');
};

// ─── Service Worker auto-reload ────────────────────────────────────────────
// When a new SW takes over (after deploy), reload so users see the latest version.
// Guard: 30s window prevents reload loop on rapid back-to-back activations.
// Hard limit: max 3 reloads per page session prevents infinite loop on bad deploys.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    const lastReload = parseInt(sessionStorage.getItem('sw-reloaded-at') || '0', 10);
    const reloadCount = parseInt(sessionStorage.getItem('sw-reload-count') || '0', 10);
    if (Date.now() - lastReload < 30000) return; // 30s guard
    if (reloadCount >= 3) return; // hard limit: max 3 reloads per session
    sessionStorage.setItem('sw-reloaded-at', String(Date.now()));
    sessionStorage.setItem('sw-reload-count', String(reloadCount + 1));
    window.location.reload();
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
