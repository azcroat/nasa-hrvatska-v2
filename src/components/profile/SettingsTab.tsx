import React, { useState } from 'react';
import { fbDeleteAccount } from '../../data';
import { useContent } from '../../hooks/useContent';
import { fbExportUserData } from '../../lib/firebase.js';
import { useApp } from '../../context/AppContext';
import { useStats } from '../../context/StatsContext.tsx';
import { isNative } from '../../lib/platform.ts';
import HeritageEntrySection from './sections/HeritageEntrySection';
import GoalFocusSection from './sections/GoalFocusSection';
import LearningPreferencesSection from './sections/LearningPreferencesSection';
import DifficultySection from './sections/DifficultySection';
import GoalSelectorSection from './sections/GoalSelectorSection';
import StreakProtectionSection from './sections/StreakProtectionSection';
import NotificationsSection from './sections/NotificationsSection';
import CloudSyncSection from './sections/CloudSyncSection';

export default function SettingsTab({
  syncReady,
  onSyncNow,
}: {
  syncReady: boolean;
  onSyncNow?: () => void | Promise<boolean | void>;
}) {
  const {
    au,
    darkMode,
    setDarkMode,
    setScr,
    doOut,
    name,
    favs,
    jWords,
    launchFlashcards,
    launchSpeaking,
  } = useApp();
  const { stats: statsCtx } = useStats();
  const { content } = useContent();
  const V = (content?.V ?? {}) as Record<string, any[]>;

  const [confirmOut, setConfirmOut] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [currentGoal, setCurrentGoal] = useState(() => localStorage.getItem('nh_goal') || '');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('nh_font_size') || 'medium');
  const [reduceMotion, setReduceMotion] = useState(
    () => localStorage.getItem('nh_reduce_motion') === 'true',
  );
  async function exportData() {
    if (isNative()) {
      alert(
        'Data export is not available on the mobile app. Please use the web version at nasahrvatska.com to download your data.',
      );
      return;
    }
    if (exporting) return;
    setExporting(true);
    try {
      let data;
      const uid = au?.u || '';
      if (uid) {
        data = await fbExportUserData(uid);
        data.inMemory = {
          profile: { name, email: au?.e },
          stats: statsCtx,
          favs,
          journal: jWords,
        };
      } else {
        data = {
          exportDate: new Date().toISOString(),
          note: 'Signed-out export — no Firestore data included.',
          inMemory: {
            profile: { name },
            stats: statsCtx,
            favs,
            journal: jWords,
          },
        };
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nasa-hrvatska-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 4000);
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (!au || !au.u) return;
    setDeleting(true);
    try {
      await fbDeleteAccount(au.u);
      doOut();
    } catch (e) {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <React.Fragment>
      {/* ── GOAL FOCUS + PARTNER ── */}
      <GoalFocusSection
        currentGoal={currentGoal}
        V={V}
        setScr={setScr}
        launchFlashcards={launchFlashcards}
        launchSpeaking={launchSpeaking}
      />

      <LearningPreferencesSection />

      <DifficultySection />

      <GoalSelectorSection currentGoal={currentGoal} setCurrentGoal={setCurrentGoal} />

      {/* ── HERITAGE MODE ENTRY POINT ── */}
      <HeritageEntrySection setScr={setScr} />
      <StreakProtectionSection onSyncNow={onSyncNow} />

      <NotificationsSection />

      <CloudSyncSection syncReady={syncReady} onSyncNow={onSyncNow} />

      {/* ── APPEARANCE ── */}
      <div className="section-hdr" style={{ marginTop: 24 }}>
        <div className="section-hdr-icon" style={{ background: 'rgba(124,58,237,.12)' }}>
          🎨
        </div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Appearance</div>
          <div className="section-hdr-sub">Theme, font size, and motion</div>
        </div>
      </div>

      <button
        className="tc"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '16px',
          marginBottom: 10,
        }}
        onClick={() => {
          const nv = !darkMode;
          setDarkMode(nv);
          localStorage.setItem('darkMode', nv.toString());
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            background: darkMode
              ? 'rgba(253,224,71,.2)'
              : 'linear-gradient(135deg,var(--heading),#334155)',
            border: darkMode ? '1px solid rgba(253,224,71,.5)' : '1px solid #475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--text-xl)',
            flexShrink: 0,
          }}
        >
          {darkMode ? '☀️' : '🌙'}
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--heading)' }}>
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 1 }}>
            Switch appearance
          </div>
        </div>
        <div style={{ fontSize: 'var(--text-xl)', color: 'var(--subtext)', opacity: 0.8 }}>›</div>
      </button>

      {/* Font size control */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 0',
          borderBottom: '1px solid var(--card-b)',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>🔠 Font Size</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 2 }}>
            Adjust text size across the app
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            borderRadius: 10,
            overflow: 'hidden',
            border: '1.5px solid var(--card-b)',
            flexShrink: 0,
          }}
        >
          {['small', 'medium', 'large'].map((size, i) => (
            <button
              key={size}
              onClick={() => {
                setFontSize(size);
                localStorage.setItem('nh_font_size', size);
                if (size === 'medium') {
                  document.documentElement.removeAttribute('data-font');
                } else {
                  document.documentElement.setAttribute('data-font', size);
                }
              }}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderLeft: i > 0 ? '1px solid var(--card-b)' : 'none',
                cursor: 'pointer',
                background: fontSize === size ? 'var(--info)' : 'var(--card)',
                color: fontSize === size ? '#fff' : 'var(--subtext)',
                fontWeight: 700,
                fontSize: size === 'small' ? 11 : size === 'large' ? 15 : 13,
                fontFamily: "'Outfit',sans-serif",
                transition: 'background .15s',
                minHeight: 36,
              }}
            >
              {size.charAt(0).toUpperCase() + size.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Reduce motion toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 0',
          borderBottom: '1px solid var(--card-b)',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>✋ Reduce Animations</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 2 }}>
            Minimize motion and transitions
          </div>
        </div>
        <button
          role="switch"
          aria-checked={reduceMotion ? 'true' : 'false'}
          onClick={() => {
            const v = !reduceMotion;
            setReduceMotion(v);
            localStorage.setItem('nh_reduce_motion', v.toString());
            document.documentElement.classList.toggle('reduce-motion', v);
          }}
          style={{
            width: 44,
            height: 26,
            borderRadius: 13,
            border: 'none',
            cursor: 'pointer',
            transition: 'background .2s',
            background: reduceMotion ? 'var(--success)' : 'var(--bar-bg)',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 3,
              left: reduceMotion ? 21 : 3,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'white',
              transition: 'left .2s',
              boxShadow: '0 1px 4px rgba(0,0,0,.2)',
            }}
          />
        </button>
      </div>

      {/* ── DATA & ACCOUNT ── */}
      <div className="section-hdr" style={{ marginTop: 24 }}>
        <div className="section-hdr-icon" style={{ background: 'rgba(14,116,144,.12)' }}>
          📊
        </div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Data &amp; Account</div>
          <div className="section-hdr-sub">Help, privacy and account actions</div>
        </div>
      </div>

      <button
        className="tc"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '16px',
          marginBottom: 10,
        }}
        onClick={() => setScr('contact')}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: 'linear-gradient(135deg,var(--info),#164e63)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--text-lg)',
            flexShrink: 0,
          }}
        >
          🛟
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--heading)' }}>
            Help & Feedback
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 1 }}>
            Report a bug or suggest a feature
          </div>
        </div>
        <div style={{ fontSize: 'var(--text-xl)', color: 'var(--subtext)', opacity: 0.8 }}>›</div>
      </button>
      <button
        className="tc"
        style={{ width: '100%', textAlign: 'center', padding: '14px', marginBottom: 10 }}
        onClick={() => setScr('privacy')}
      >
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--subtext)', fontWeight: 600 }}>
          Privacy Policy & Terms
        </div>
      </button>
      {au && au.u === (import.meta.env.VITE_ADMIN_EMAIL || '') && (
        <button
          className="tc"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '16px',
            marginBottom: 24,
          }}
          onClick={() => setScr('admin')}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg,var(--lavender),#4c1d95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--text-lg)',
              flexShrink: 0,
            }}
          >
            🛠️
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--heading)' }}>
              Admin Dashboard
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 1 }}>
              Platform overview & user stats
            </div>
          </div>
          <div style={{ fontSize: 'var(--text-xl)', color: 'var(--subtext)', opacity: 0.8 }}>›</div>
        </button>
      )}
      {!(au && au.u === (import.meta.env.VITE_ADMIN_EMAIL || '')) && (
        <div style={{ marginBottom: 24 }} />
      )}

      {/* ── GDPR DATA EXPORT ── */}
      <h3 className="sh">Your Data</h3>
      <button
        className="tc"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '16px',
          marginBottom: 10,
          opacity: exporting ? 0.6 : 1,
          cursor: exporting ? 'not-allowed' : 'pointer',
        }}
        onClick={exportData}
        disabled={exporting}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: 'linear-gradient(135deg,var(--info),#164e63)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--text-lg)',
            flexShrink: 0,
          }}
        >
          📥
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--heading)' }}>
            Export My Data (GDPR)
          </div>
          <div
            style={{
              fontSize: 'var(--text-xs)',
              color: exportDone ? 'var(--success)' : exporting ? 'var(--info)' : 'var(--subtext)',
              marginTop: 1,
              fontWeight: exportDone || exporting ? 700 : 500,
            }}
          >
            {exportDone
              ? '✓ Downloaded! Check your downloads folder.'
              : exporting
                ? 'Exporting…'
                : 'Download all your progress and Firestore data as JSON'}
          </div>
        </div>
        {!exporting && (
          <div style={{ fontSize: 'var(--text-xl)', color: 'var(--subtext)', opacity: 0.8 }}>›</div>
        )}
      </button>

      {/* ── SIGN OUT ── */}
      {confirmOut ? (
        <div
          style={{
            border: '2px solid rgba(194,65,12,.2)',
            borderRadius: 16,
            padding: '20px',
            background: 'rgba(194,65,12,.04)',
            marginBottom: 16,
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-md)',
              fontWeight: 700,
              color: 'var(--warning)',
              textAlign: 'center',
              marginBottom: 16,
            }}
          >
            Sign out of Naša Hrvatska?
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setConfirmOut(false)}
              style={{
                flex: 1,
                padding: '13px',
                border: '1.5px solid var(--card-b)',
                borderRadius: 12,
                background: 'var(--card)',
                color: 'var(--subtext)',
                fontSize: 'var(--text-base)',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              Cancel
            </button>
            <button
              onClick={doOut}
              style={{
                flex: 1,
                padding: '13px',
                border: 'none',
                borderRadius: 12,
                background: 'var(--warning)',
                color: 'var(--card)',
                fontSize: 'var(--text-base)',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirmOut(true)}
          style={{
            width: '100%',
            padding: '14px',
            border: '2px solid rgba(194,65,12,.15)',
            borderRadius: 14,
            background: 'rgba(194,65,12,.05)',
            color: 'var(--warning)',
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: 16,
            fontFamily: "'Outfit',sans-serif",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          🚪 Sign Out
        </button>
      )}

      {/* ── DANGER ZONE ── */}
      <h3 className="sh" style={{ color: 'var(--error)', marginTop: 8 }}>
        Danger Zone
      </h3>
      {confirmDelete ? (
        <div
          style={{
            border: '2px solid rgba(220,38,38,.2)',
            borderRadius: 16,
            padding: '20px',
            background: 'rgba(220,38,38,.04)',
            marginBottom: 16,
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-md)',
              fontWeight: 700,
              color: 'var(--error)',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Delete your account?
          </p>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--subtext)',
              textAlign: 'center',
              marginBottom: 16,
            }}
          >
            This permanently deletes all your progress and cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              style={{
                flex: 1,
                padding: '13px',
                border: '1.5px solid var(--card-b)',
                borderRadius: 12,
                background: 'var(--card)',
                color: 'var(--subtext)',
                fontSize: 'var(--text-base)',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              style={{
                flex: 1,
                padding: '13px',
                border: 'none',
                borderRadius: 12,
                background: 'var(--error)',
                color: 'var(--card)',
                fontSize: 'var(--text-base)',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          style={{
            width: '100%',
            padding: '14px',
            border: '2px solid rgba(220,38,38,.15)',
            borderRadius: 14,
            background: 'rgba(220,38,38,.05)',
            color: 'var(--error)',
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: 16,
            fontFamily: "'Outfit',sans-serif",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          🗑️ Delete Account
        </button>
      )}
    </React.Fragment>
  );
}
