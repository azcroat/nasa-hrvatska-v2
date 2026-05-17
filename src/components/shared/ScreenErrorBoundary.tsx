import React from 'react';
import CroatianKnight from './CroatianKnight';
import { reportBoundaryError } from '../../lib/errorReporter';

/** Props for ScreenErrorBoundary — exported so AppRouter.tsx can use typed JSX. */
export interface ScreenErrorBoundaryProps {
  children: React.ReactNode;
  name?: string;
  goBack?: () => void;
}

/**
 * Per-screen error boundary. Catches crashes in individual tabs/screens
 * so a single broken component doesn't destroy the entire session.
 * Usage: <ScreenErrorBoundary name="HomeTab"><HomeTab .../></ScreenErrorBoundary>
 */
interface ScreenErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retries: number;
}

export default class ScreenErrorBoundary extends React.Component<
  ScreenErrorBoundaryProps,
  ScreenErrorBoundaryState
> {
  constructor(props: ScreenErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, retries: 0 };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // SP3b: shared boundary reporting — emits [boundary] scope tag and
    // forwards to /api/report-error via the existing sendBeacon path.
    const screenName = String(this.props.name || 'Screen');
    reportBoundaryError(error, info, screenName, this.state.retries);
  }

  render() {
    if (this.state.hasError) {
      const { goBack } = this.props;
      return (
        <div
          role="alert"
          data-testid="screen-error-boundary"
          style={{
            padding: '40px 20px 48px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
            minHeight: 320,
            justifyContent: 'center',
          }}
        >
          {/* Croatian flag accent bar */}
          <div
            style={{
              display: 'flex',
              height: 4,
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              width: 48,
              marginBottom: 24,
              flexShrink: 0,
            }}
          >
            <div style={{ flex: 1, background: '#D40030' }} />
            <div style={{ flex: 1, background: '#fff', border: '0.5px solid rgba(0,0,0,.08)' }} />
            <div style={{ flex: 1, background: '#003DA5' }} />
          </div>

          <CroatianKnight size={72} mood="droop" style={{ margin: '0 auto', display: 'block' }} />

          <div
            style={{
              marginTop: 20,
              background: 'var(--card)',
              border: '1.5px solid var(--card-b)',
              borderRadius: 'var(--radius-xl)',
              padding: '20px 24px',
              boxShadow: 'var(--card-shadow)',
              maxWidth: 320,
              width: '100%',
            }}
          >
            <p
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--heading,#0f172a)',
                fontFamily: 'var(--font-sans)',
                marginBottom: 8,
                lineHeight: 1.3,
              }}
            >
              Nema veze — something slipped.
            </p>
            <p
              style={{
                fontSize: 13,
                color: 'var(--subtext,#64748b)',
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                lineHeight: 1.6,
                marginBottom: 20,
              }}
            >
              Your progress is saved. Tap <strong>Try Again</strong> and the knight will get you
              back on track.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                className="b bp"
                onClick={() => {
                  if (this.state.retries >= 1) {
                    window.location.reload();
                  } else {
                    this.setState({
                      hasError: false,
                      error: null,
                      retries: this.state.retries + 1,
                    });
                  }
                }}
              >
                {this.state.retries >= 1 ? 'Reload App' : 'Try Again'}
              </button>
              {goBack && (
                <button className="b bg" onClick={goBack}>
                  Go Back
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
