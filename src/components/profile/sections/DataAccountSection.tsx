import React, { useState } from 'react';
import { fbDeleteAccount } from '../../../data';
import { fbExportUserData } from '../../../lib/firebase.js';
import { isNative } from '../../../lib/platform.ts';
import { useApp } from '../../../context/AppContext';
import { useStats } from '../../../context/StatsContext.tsx';

/**
 * Data & Account + Danger Zone — help/privacy/admin links, GDPR export, sign
 * out, and account deletion. Extracted from SettingsTab as part of the 1a
 * decomposition. Owns the confirm/export/delete UI state + handlers; everything
 * else (au, name, favs, jWords, setScr, doOut, stats) comes from useApp()/
 * useStats() context. Props-less. Behavior-identical to the prior inline block.
 */
export default function DataAccountSection() {
  const { au, setScr, doOut, name, favs, jWords } = useApp();
  const { stats: statsCtx } = useStats();
  const [confirmOut, setConfirmOut] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [exporting, setExporting] = useState(false);

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
