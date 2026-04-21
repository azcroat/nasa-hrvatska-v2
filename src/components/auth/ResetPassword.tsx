import React from 'react';
import { BG_LIGHT } from '../../lib/appUtils.js';

const BG = BG_LIGHT;

interface ResetPasswordProps {
  authError: string;
  authLoading: boolean;
  rpEm: string;
  setAuthScreen: (screen: string) => void;
  setAuthError: (err: string) => void;
  setRpEm: (em: string) => void;
  doReset: () => void;
}

export default function ResetPassword({
  authError,
  authLoading,
  rpEm,
  setAuthScreen,
  setAuthError,
  setRpEm,
  doReset,
}: ResetPasswordProps) {
  return (
    <div
      style={{
        ...BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          animation: 'rise .5s',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🔐</div>
          <h1
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 28,
              color: 'var(--heading)',
              fontWeight: 800,
            }}
          >
            Reset Password
          </h1>
          <p style={{ color: 'var(--subtext)', fontSize: 'var(--text-sm)' }}>
            Enter your email and we'll send you a reset link
          </p>
        </div>
        <div className="c" style={{ padding: 28 }}>
          {authError && (
            <div
              style={{
                background: authError.startsWith('✅') ? 'var(--success-bg)' : 'var(--error-bg)',
                border: authError.startsWith('✅')
                  ? '1px solid var(--success-b)'
                  : '1px solid var(--error-b)',
                borderRadius: 10,
                padding: '12px 16px',
                color: authError.startsWith('✅') ? 'var(--success)' : 'var(--error)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              {authError}
            </div>
          )}
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--body)', marginBottom: 16 }}>
            Enter the email address you used to create your account.
          </div>
          <label
            htmlFor="reset-email"
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              color: 'var(--subtext)',
              display: 'block',
              marginBottom: 6,
            }}
          >
            EMAIL ADDRESS
          </label>
          <input
            id="reset-email"
            type="email"
            placeholder="Enter your email"
            value={rpEm}
            onChange={(e) => {
              setRpEm(e.target.value);
              setAuthError('');
            }}
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            onKeyDown={(e) => {
              if (e.key === 'Enter') doReset();
            }}
            style={{ marginBottom: 16 }}
          />
          <button
            className="b bp"
            style={{ width: '100%', padding: '14px 24px' }}
            onClick={doReset}
            disabled={authLoading}
          >
            {authLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
          <div
            style={{
              textAlign: 'center',
              marginTop: 20,
              fontSize: 'var(--text-sm)',
              color: 'var(--subtext)',
            }}
          >
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
                setAuthScreen('login');
                setAuthError('');
                setRpEm('');
              }}
            >
              ← Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
