import React from 'react';

// On Android, scroll the focused input into view when the soft keyboard opens.
// adjustResize resizes the viewport but WebView doesn't always reposition the
// focused element — calling scrollIntoView on focus ensures the input is visible.
function scrollIntoViewOnFocus(e) {
  const el = e.target;
  setTimeout(() => {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 300); // 300ms — keyboard animation completes before we scroll
}

function pwStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}
const PW_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const PW_COLORS = ['', 'var(--error)', 'var(--warning)', 'var(--warning)', 'var(--success)'];

export default function LoginScreen({
  authScreen,
  authError,
  authLoading,
  authEmail,
  pw,
  pc,
  displayName,
  sp,
  setAuthScreen,
  setAuthError,
  setAuthEmail,
  setPw,
  setPc,
  setDisplayName,
  setSp2,
  setRpEm,
  doLog,
  doReg,
  doGoogleLogin,
  doGuest,
}) {
  const isR = authScreen === 'register';
  const strength = isR ? pwStrength(pw) : 0;
  // Padding-based layout (NOT flex centering). Flex align-items:center with min-height:100vh
  // breaks on Android WebView: adjustResize shrinks the viewport but the flex container
  // doesn't reflow, hiding inputs behind the keyboard. Padding + overflow-y:auto fixes this.
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--app-bg)',
        color: 'var(--heading)',
        fontFamily: "'Outfit',sans-serif",
        position: 'relative',
        overflowX: 'hidden',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingTop: 'max(48px, env(safe-area-inset-top, 24px))',
        paddingLeft: 24,
        paddingRight: 24,
        paddingBottom: 'max(80px, env(safe-area-inset-bottom, 48px))',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          margin: '0 auto',
          animation: 'rise .5s',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Hero — sits above the login card */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 28,
            animation: 'fade-up .6s ease',
          }}
        >
          {/* Adriatic gradient backdrop visual — a simple elegant SVG wave */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              margin: '0 auto 16px',
              background: 'linear-gradient(135deg,#D40030,#8B0000)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(212,0,48,.3)',
              fontSize: 40,
            }}
          >
            🇭🇷
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 28,
              fontWeight: 900,
              color: 'var(--heading)',
              lineHeight: 1.15,
              marginBottom: 10,
            }}
          >
            Naša Hrvatska
          </h1>
          <p
            style={{
              fontSize: 15,
              color: 'var(--subtext)',
              fontWeight: 500,
              lineHeight: 1.6,
              maxWidth: 300,
              margin: '0 auto 18px',
            }}
          >
            Learn Croatian. Connect to your roots.
            <br />
            Speak the language of your heritage.
          </p>
          {/* 3 feature pills */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['🔥 Daily Streaks', '🤖 AI Conversation', '🇭🇷 Real Croatian Culture'].map((f) => (
              <span
                key={f}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--info)',
                  background: 'var(--info-bg)',
                  borderRadius: 20,
                  padding: '4px 10px',
                  border: '1px solid var(--info-b)',
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
        <form
          className="c"
          style={{ padding: 28, position: 'relative', overflow: 'hidden' }}
          onSubmit={(e) => {
            e.preventDefault();
            isR ? doReg() : doLog();
          }}
          noValidate
        >
          {/* Croatian flag gradient top bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: 'linear-gradient(90deg, #D40030, #C8980A, #003087)',
              borderRadius: '12px 12px 0 0',
            }}
          />
          {authError && (
            <div
              role="alert"
              aria-live="assertive"
              style={{
                background: authError.startsWith('✅') ? 'var(--success-bg)' : 'var(--error-bg)',
                border: authError.startsWith('✅')
                  ? '1px solid var(--success-b)'
                  : '1px solid var(--error-b)',
                borderRadius: 10,
                padding: '12px 16px',
                color: authError.startsWith('✅') ? 'var(--success)' : 'var(--error)',
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              {authError}
            </div>
          )}
          {/* Google Sign-In — shown on both login and register screens */}
          <button
            onClick={doGoogleLogin}
            disabled={authLoading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '13px 20px',
              marginBottom: 16,
              borderRadius: 12,
              border: '1.5px solid var(--card-b)',
              background: 'var(--card)',
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
              fontSize: 'var(--text-md)',
              fontWeight: 600,
              color: 'var(--heading)',
              boxShadow: '0 1px 3px rgba(0,0,0,.08)',
              transition: 'box-shadow .15s',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {authLoading ? 'Loading…' : isR ? 'Sign up with Google' : 'Sign in with Google'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--card-b)' }} />
            <span
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: 'var(--subtext)',
                whiteSpace: 'nowrap',
              }}
            >
              or continue with email
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--card-b)' }} />
          </div>
          {isR && (
            <React.Fragment>
              <label
                htmlFor="auth-name"
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  color: 'var(--subtext)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                DISPLAY NAME
              </label>
              <input
                id="auth-name"
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setAuthError('');
                }}
                style={{ marginBottom: 14 }}
              />
            </React.Fragment>
          )}
          <label
            htmlFor="auth-email"
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              color: 'var(--subtext)',
              display: 'block',
              marginBottom: 6,
            }}
          >
            EMAIL ADDRESS
          </label>
          <input
            id="auth-email"
            type="email"
            placeholder={isR ? 'Enter your email address' : 'Email address'}
            value={authEmail}
            onChange={(e) => {
              setAuthEmail(e.target.value);
              setAuthError('');
            }}
            onFocus={scrollIntoViewOnFocus}
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            style={{ marginBottom: 14 }}
          />
          <label
            htmlFor="auth-password"
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              color: 'var(--subtext)',
              display: 'block',
              marginBottom: 6,
            }}
          >
            PASSWORD
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="auth-password"
              type={sp ? 'text' : 'password'}
              placeholder={isR ? 'Create password (6+ characters)' : 'Enter your password'}
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setAuthError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isR) doLog();
              }}
              onFocus={scrollIntoViewOnFocus}
              autoComplete={isR ? 'new-password' : 'current-password'}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              style={{ marginBottom: 0, paddingRight: 44, width: '100%', boxSizing: 'border-box' }}
            />
            <button
              type="button"
              aria-label={sp ? 'Hide password' : 'Show password'}
              onClick={() => setSp2(!sp)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                color: 'var(--subtext)',
                lineHeight: 1,
              }}
            >
              {sp ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          <div style={{ marginBottom: 8 }} />
          {isR && pw && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 4,
                      background: i <= strength ? PW_COLORS[strength] : 'var(--card-b)',
                      transition: 'background .2s',
                    }}
                  />
                ))}
              </div>
              <div
                style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: PW_COLORS[strength] }}
              >
                {PW_LABELS[strength]}
              </div>
            </div>
          )}
          {isR && !pw && <div style={{ marginBottom: 14 }} />}
          {isR && (
            <React.Fragment>
              <label
                htmlFor="auth-confirm"
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  color: 'var(--subtext)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                CONFIRM PASSWORD
              </label>
              <input
                id="auth-confirm"
                type="password"
                placeholder="Confirm your password"
                value={pc}
                onChange={(e) => {
                  setPc(e.target.value);
                  setAuthError('');
                }}
                onFocus={scrollIntoViewOnFocus}
                autoComplete="new-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') doReg();
                }}
                style={{ marginBottom: 16 }}
              />
            </React.Fragment>
          )}
          {!isR && (
            <div style={{ textAlign: 'right', marginBottom: 12 }}>
              <button
                type="button"
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--info)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontFamily: 'inherit',
                }}
                onClick={() => {
                  setAuthScreen('reset');
                  setAuthError('');
                  setRpEm(authEmail || '');
                }}
              >
                Forgot password?
              </button>
            </div>
          )}
          <button
            type="submit"
            className="b bp"
            style={{
              width: '100%',
              fontSize: 'var(--text-lg)',
              padding: '14px 24px',
              marginTop: 4,
            }}
            disabled={authLoading}
          >
            {authLoading ? 'Loading...' : isR ? 'Create Account' : 'Sign In'}
          </button>
          <p
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--subtext)',
              textAlign: 'center',
              marginTop: 12,
            }}
          >
            By continuing you agree to our{' '}
            <button
              onClick={() =>
                window.open(
                  'https://nasa-hrvatska.pages.dev/privacy.html#terms',
                  '_blank',
                  'noopener,noreferrer',
                )
              }
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--info)',
                cursor: 'pointer',
                fontSize: 'var(--text-xs)',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              Terms of Service
            </button>{' '}
            and{' '}
            <button
              onClick={() =>
                window.open(
                  'https://nasa-hrvatska.pages.dev/privacy.html',
                  '_blank',
                  'noopener,noreferrer',
                )
              }
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--info)',
                cursor: 'pointer',
                fontSize: 'var(--text-xs)',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              Privacy Policy
            </button>
          </p>
          <div
            style={{
              textAlign: 'center',
              marginTop: 12,
              fontSize: 'var(--text-base)',
              color: 'var(--subtext)',
            }}
          >
            {isR ? 'Have an account? ' : 'No account? '}
            <button
              type="button"
              style={{
                color: 'var(--info)',
                cursor: 'pointer',
                fontWeight: 700,
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: 'inherit',
                fontFamily: 'inherit',
              }}
              onClick={() => {
                setAuthScreen(isR ? 'login' : 'register');
                setAuthError('');
                setAuthEmail('');
                setPw('');
                setPc('');
                setDisplayName('');
              }}
            >
              {isR ? 'Sign in' : 'Create one'}
            </button>
          </div>
        </form>
        {doGuest && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              type="button"
              onClick={doGuest}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                color: '#4b5563',
                fontWeight: 600,
                fontFamily: "'Outfit',sans-serif",
                padding: '8px 16px',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              Continue as Guest — progress saved on this device only
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
