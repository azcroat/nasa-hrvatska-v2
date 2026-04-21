/**
 * AppToasts — all transient toast / banner overlays.
 *
 * Extracted from App.jsx to keep the main render tree readable.
 * Each toast is conditionally rendered; none affect layout (all fixed-position).
 */
import React from 'react';
import KnightToast from './KnightToast';

interface DeferredInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

interface AppToastsProps {
  // Gamification toasts
  comebackBonus: boolean;
  freezeUsedToast: boolean;
  earnBackPrompt: { prev: number } | null;
  streakRestoredCount: number;
  ttsFailedToast: boolean;
  // Streak repair
  streakRepairAvailable: boolean;
  onRepairStreak: ((action: string) => void) | null;
  // PWA install banners
  showAndroidInstall: boolean;
  setShowAndroidInstall: (v: boolean) => void;
  deferredInstallPrompt: DeferredInstallPrompt | null;
  showPwaInstall: boolean;
  setShowPwaInstall: (v: boolean) => void;
  showBackupBanner: boolean;
  setShowBackupBanner: (v: boolean) => void;
  syncError: boolean;
  setSyncError: (v: boolean) => void;
  syncErrorCode: string | null;
  // Subscription
  isFreeAnnual: boolean;
  daysLeft: number | null;
  setShowPaywall: (v: boolean) => void;
  // Email verification
  emailUnverified: boolean;
  setEmailUnverified: (v: boolean) => void;
  resendVerification: () => void;
}

export function AppToasts({
  // Gamification toasts
  comebackBonus,
  freezeUsedToast,
  earnBackPrompt,
  streakRestoredCount,
  ttsFailedToast,
  // Streak repair
  streakRepairAvailable,
  onRepairStreak,
  // PWA install banners
  showAndroidInstall,
  setShowAndroidInstall,
  deferredInstallPrompt,
  showPwaInstall,
  setShowPwaInstall,
  showBackupBanner,
  setShowBackupBanner,
  syncError,
  setSyncError,
  syncErrorCode,
  // Subscription
  isFreeAnnual,
  daysLeft,
  setShowPaywall,
  // Email verification
  emailUnverified,
  setEmailUnverified,
  resendVerification,
}: AppToastsProps) {
  return (
    <>
      {/* Knight celebration overlay — listens to knight:celebrate event from useAward */}
      <KnightToast />

      {comebackBonus && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'fixed',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9500,
            background: 'linear-gradient(135deg,#f59e0b,#d97706)',
            color: '#fff',
            borderRadius: 16,
            padding: '14px 24px',
            boxShadow: '0 8px 32px rgba(0,0,0,.2)',
            fontSize: 14,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'slideUp .4s ease',
          }}
        >
          🔥 Welcome back! Keep your streak alive!
        </div>
      )}
      {freezeUsedToast && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'fixed',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9500,
            background: 'linear-gradient(135deg,#1e40af,#3b82f6)',
            color: '#fff',
            borderRadius: 16,
            padding: '14px 24px',
            boxShadow: '0 8px 32px rgba(0,0,0,.25)',
            fontSize: 14,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'slideUp .4s ease',
            whiteSpace: 'nowrap',
          }}
        >
          🛡️ Zaštita niza aktivirana! Tvoj niz je sačuvan.
        </div>
      )}
      {earnBackPrompt && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'fixed',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9500,
            background: 'linear-gradient(135deg,#d97706,#b45309)',
            color: '#fff',
            borderRadius: 16,
            padding: '14px 24px',
            boxShadow: '0 8px 32px rgba(0,0,0,.25)',
            fontSize: 14,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'slideUp .4s ease',
            maxWidth: 320,
            textAlign: 'center',
          }}
        >
          🔥 Complete 1 more lesson today to restore your {earnBackPrompt.prev}-day streak!
        </div>
      )}
      {streakRestoredCount > 0 && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'fixed',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9500,
            background: 'linear-gradient(135deg,#b61800,#dc2626)',
            color: '#fff',
            borderRadius: 16,
            padding: '14px 24px',
            boxShadow: '0 8px 32px rgba(182,24,0,.4)',
            fontSize: 14,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'slideUp .4s ease',
            whiteSpace: 'nowrap',
          }}
        >
          🇭🇷 Streak restored! {streakRestoredCount}-day streak back!
        </div>
      )}
      {ttsFailedToast && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9500,
            background: 'rgba(30,30,30,.92)',
            color: '#fff',
            borderRadius: 20,
            padding: '9px 20px',
            fontSize: 13,
            fontWeight: 600,
            pointerEvents: 'none',
            animation: 'slideUp .3s ease',
            whiteSpace: 'nowrap',
          }}
        >
          🔇 Audio unavailable
        </div>
      )}

      {/* Streak repair prompt */}
      {streakRepairAvailable && onRepairStreak && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: 90,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 890,
            background: 'var(--card)',
            border: '1.5px solid rgba(245,158,11,0.4)',
            borderRadius: 16,
            padding: '14px 20px',
            maxWidth: 340,
            width: 'calc(100% - 40px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            animation: 'slideUp .35s ease',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)' }}>
            🔥 Repair your streak for 100 XP?
          </div>
          <div style={{ fontSize: 12, color: 'var(--subtext)', lineHeight: 1.5 }}>
            Your streak broke yesterday. Spend 100 XP to restore it and keep your progress alive.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => onRepairStreak('dismiss')}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 10,
                border: '1.5px solid var(--card-b)',
                background: 'none',
                color: 'var(--subtext)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              Not now
            </button>
            <button
              onClick={() => onRepairStreak('repair')}
              style={{
                flex: 2,
                padding: '8px 10px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              Repair Streak 🔥
            </button>
          </div>
        </div>
      )}

      {/* Subscription renewal reminder — dismissible with 24 h snooze */}
      {!isFreeAnnual &&
        daysLeft != null &&
        daysLeft <= 3 &&
        (() => {
          const snoozeKey = 'nh_renewal_snoozed';
          const snoozedUntil = parseInt(localStorage.getItem(snoozeKey) || '0', 10);
          if (Date.now() < snoozedUntil) return null;
          return (
            <div
              style={{
                position: 'fixed',
                top: 60,
                left: 0,
                right: 0,
                zIndex: 890,
                background: 'linear-gradient(135deg,#164e63,#0e7490)',
                color: '#fff',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <span>Premium: {daysLeft}d left</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => setShowPaywall(true)}
                  style={{
                    background: '#fff',
                    color: '#0e7490',
                    border: 'none',
                    borderRadius: 20,
                    padding: '4px 12px',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Renew
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem(snoozeKey, String(Date.now() + 86400000));
                  }}
                  aria-label="Dismiss for 24 hours"
                  style={{
                    background: 'rgba(255,255,255,.2)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })()}

      {/* Email verification banner */}
      {emailUnverified && (
        <div
          style={{
            background: 'var(--warning-bg,#fef3c7)',
            borderBottom: '2px solid var(--warning,#f59e0b)',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontFamily: "'Outfit',sans-serif",
            fontSize: 13,
            fontWeight: 600,
            position: 'relative',
            zIndex: 900,
          }}
        >
          <span style={{ color: 'var(--warning-text,#92400e)' }}>
            ⚠️ Please verify your email to secure your account.
          </span>
          <button
            onClick={resendVerification}
            style={{
              background: 'var(--warning,#f59e0b)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "'Outfit',sans-serif",
              minHeight: 44,
            }}
          >
            Resend Email
          </button>
          <button
            onClick={() => setEmailUnverified(false)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 20,
              color: 'var(--warning-text,#92400e)',
              minWidth: 44,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Android / Chrome install banner */}
      {showAndroidInstall && !localStorage.getItem('nh_pwa_install_dismissed') && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: 90,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9602,
            width: 'calc(100% - 32px)',
            maxWidth: 420,
            background: 'linear-gradient(135deg,#164e63,#0e7490)',
            color: '#fff',
            borderRadius: 20,
            padding: '18px 20px',
            boxShadow: '0 8px 40px rgba(14,116,144,.5)',
            animation: 'slideUp .4s cubic-bezier(.34,1.56,.64,1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ fontSize: 36, flexShrink: 0, lineHeight: 1 }}>📲</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 4, lineHeight: 1.2 }}>
                Install Naša Hrvatska
              </div>
              <div style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.5, fontWeight: 500 }}>
                Add to your home screen for instant access and offline lessons.
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.setItem('nh_pwa_install_dismissed', 'true');
                setShowAndroidInstall(false);
              }}
              aria-label="Dismiss"
              style={{
                background: 'rgba(255,255,255,.2)',
                border: 'none',
                color: '#fff',
                borderRadius: 10,
                width: 44,
                height: 44,
                fontSize: 18,
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={async () => {
                if (deferredInstallPrompt) {
                  await deferredInstallPrompt.prompt();
                  deferredInstallPrompt.userChoice.then(() => {
                    setShowAndroidInstall(false);
                    localStorage.setItem('nh_pwa_install_dismissed', 'true');
                  });
                }
              }}
              style={{
                flex: 1,
                background: '#fff',
                color: '#0e7490',
                border: 'none',
                borderRadius: 10,
                padding: '10px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Install Now
            </button>
            <button
              onClick={() => {
                localStorage.setItem('nh_pwa_install_dismissed', 'true');
                setShowAndroidInstall(false);
              }}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,.15)',
                color: '#fff',
                border: '1.5px solid rgba(255,255,255,.3)',
                borderRadius: 10,
                padding: '10px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Not Now
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari install banner */}
      {showPwaInstall && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: 90,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9601,
            width: 'calc(100% - 32px)',
            maxWidth: 420,
            background: 'linear-gradient(135deg,#b45309,#78350f)',
            color: '#fff',
            borderRadius: 20,
            padding: '18px 20px',
            boxShadow: '0 8px 40px rgba(180,83,9,.5)',
            animation: 'slideUp .4s cubic-bezier(.34,1.56,.64,1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ fontSize: 36, flexShrink: 0, lineHeight: 1 }}>📱</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 4, lineHeight: 1.2 }}>
                Add to Home Screen to save progress
              </div>
              <div style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.5, fontWeight: 500 }}>
                Safari erases all data after 7 days without it. Tap <strong>Share ↑</strong> then{' '}
                <strong>"Add to Home Screen"</strong>.
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.setItem('nh_pwa_install_dismissed', 'true');
                setShowPwaInstall(false);
              }}
              aria-label="Dismiss"
              style={{
                background: 'rgba(255,255,255,.2)',
                border: 'none',
                color: '#fff',
                borderRadius: 10,
                width: 44,
                height: 44,
                fontSize: 18,
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Sync error warning — shown when Firestore saves fail 2+ consecutive times */}
      {syncError && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9700,
            width: 'calc(100% - 32px)',
            maxWidth: 420,
            background: 'linear-gradient(135deg,#dc2626,#991b1b)',
            color: '#fff',
            borderRadius: 20,
            padding: '16px 20px',
            boxShadow: '0 8px 40px rgba(220,38,38,.5)',
            animation: 'slideUp .4s cubic-bezier(.34,1.56,.64,1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ fontSize: 30, flexShrink: 0, lineHeight: 1 }}>⚠️</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 4, lineHeight: 1.2 }}>
                Progress not saving to cloud
              </div>
              <div style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.5, fontWeight: 500 }}>
                Your progress is saved on this device. Check your connection — cloud sync will
                resume automatically when you&apos;re back online.
              </div>
            </div>
            <button
              onClick={() => setSyncError(false)}
              aria-label="Dismiss"
              style={{
                background: 'rgba(255,255,255,.2)',
                border: 'none',
                color: '#fff',
                borderRadius: 10,
                width: 44,
                height: 44,
                fontSize: 18,
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Cloud backup banner removed — sync is expected behavior, not a celebration */}
    </>
  );
}

export default AppToasts;
