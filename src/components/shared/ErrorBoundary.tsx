// @ts-nocheck
/**
 * ErrorBoundary — root-level React error boundary.
 *
 * Catches any unhandled render/lifecycle error in the tree below it and shows
 * a recovery UI instead of a white screen of death. Logs to console in dev
 * and to window.onerror (Sentry, etc.) in production.
 */
import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    // Forward to any global error handler (Sentry, Datadog, etc.)
    try {
      window.__nhReportError?.(error, info);
    } catch (_) {}
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: "'Outfit', sans-serif",
          background: 'linear-gradient(160deg,#030c1a 0%,#071830 50%,#0a2848 100%)',
          color: '#fff',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 380 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🇭🇷</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: '#f8fafc' }}>
            Nešto je pošlo po krivu
          </h2>
          <p
            style={{
              fontSize: 14,
              color: 'rgba(255,255,255,.6)',
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            Something went wrong. Your progress is safe — it's saved to the cloud.
          </p>
          <button
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
            style={{
              background: '#0e7490',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '14px 32px',
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
}

export default ErrorBoundary;
