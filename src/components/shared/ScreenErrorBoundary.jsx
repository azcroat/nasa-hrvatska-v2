import React from 'react';
import CroatianKnight from './CroatianKnight.jsx';
import { reportError } from '../../lib/errorReporter.js';

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
    const screenName = String(this.props.name || 'Screen');
    console.error('[' + screenName + '] crashed:', error, info);
    reportError(error, screenName);
  }

  render() {
    if (this.state.hasError) {
      const { goBack } = this.props;
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
          <CroatianKnight size={64} mood="droop" style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--heading, #0f172a)' }}>
            Something went wrong with this screen.
          </p>
          <p style={{ fontSize: 13, color: 'var(--subtext, #64748b)' }}>
            Your progress is saved. Tap Try Again to recover, or go back.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              className="b bp"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try Again
            </button>
            {goBack && (
              <button
                className="b bg"
                onClick={goBack}
              >
                Go Back
              </button>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
