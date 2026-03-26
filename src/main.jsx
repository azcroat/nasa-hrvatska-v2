import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import posthog from 'posthog-js';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import './index.css';
import App from './App.jsx';

// ─── Sentry error telemetry ────────────────────────────────────────────────
// Set VITE_SENTRY_DSN in Cloudflare Pages environment variables.
// The app works fully without it — telemetry is opt-in via env var.
if (import.meta.env.VITE_SENTRY_DSN) {
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
      return event;
    },
  });
}

// ─── PostHog product analytics ─────────────────────────────────────────────
// Set VITE_POSTHOG_KEY in Cloudflare Pages env vars. Free up to 1M events/mo.
// Opt-in via env var — app works fully without it.
if (import.meta.env.VITE_POSTHOG_KEY && import.meta.env.PROD) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,       // manual events only — no accidental PII
    disable_session_recording: true,
    persistence: 'localStorage+cookie',
  });
}

// ─── Web Vitals → Sentry ───────────────────────────────────────────────────
// Reports Core Web Vitals as Sentry performance measurements.
// Fires once per page load; no PII is collected.
function reportWebVitals(metric) {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  Sentry.addBreadcrumb({
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
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.captureException(error, { extra: info });
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

// ─── Service Worker auto-reload ────────────────────────────────────────────
// When a new SW takes over (after deploy), reload immediately so users
// always see the latest version without any manual steps.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
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
