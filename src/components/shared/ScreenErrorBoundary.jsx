import React from 'react';

/**
 * Per-screen error boundary. Catches crashes in individual tabs/screens
 * so a single broken component doesn't destroy the entire session.
 * Usage: <ScreenErrorBoundary name="HomeTab"><HomeTab .../></ScreenErrorBoundary>
 */
export default class ScreenErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error(`[${this.props.name || 'Screen'}] crashed:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            padding: '40px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 48 }} aria-hidden="true">⚠️</div>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--heading, #0f172a)' }}>
            This section hit an error
          </p>
          <p style={{ fontSize: 13, color: 'var(--subtext, #64748b)' }}>
            Your progress is saved. Try going back or reloading.
          </p>
          <button
            className="b bp"
            style={{ marginTop: 8 }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
