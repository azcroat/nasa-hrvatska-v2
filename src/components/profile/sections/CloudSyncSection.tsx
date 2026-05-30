import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';

/**
 * Cloud Sync status section — extracted from SettingsTab as part of the 1a
 * decomposition. Owns the sync feedback state machine (syncing/done/err), the
 * debounced "done" timer, the last-saved lookup, and the manual sync handler.
 * `au` comes from useApp() directly; `syncReady` + `onSyncNow` flow in as props
 * (lifted in SettingsTab, which receives them from the sync manager).
 * Behavior-identical to the prior inline block.
 */
export default function CloudSyncSection({
  syncReady,
  onSyncNow,
}: {
  syncReady: boolean;
  onSyncNow?: () => void | Promise<boolean | void>;
}) {
  const { au } = useApp();
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [syncErr, setSyncErr] = useState(false);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Clear doneTimerRef on unmount to avoid setState-after-unmount when user syncs
  // then navigates away within the 4-second feedback window.
  useEffect(
    () => () => {
      if (doneTimerRef.current !== null) clearTimeout(doneTimerRef.current);
    },
    [],
  );

  const lastSaved = useMemo(() => {
    if (!au || !au.u) return null;
    try {
      const p = JSON.parse(localStorage.getItem('uP_' + au.u) || 'null');
      return p && p.savedAt ? new Date(p.savedAt) : null;
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [au, syncDone]);

  async function handleSyncNow() {
    if (syncing) return;
    if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    setSyncing(true);
    setSyncDone(false);
    setSyncErr(false);
    try {
      const ok = onSyncNow ? await onSyncNow() : true;
      setSyncDone(ok !== false);
      setSyncErr(ok === false);
    } catch {
      setSyncDone(false);
      setSyncErr(true);
    }
    setSyncing(false);
    doneTimerRef.current = setTimeout(() => {
      setSyncDone(false);
      setSyncErr(false);
    }, 4000);
  }

  return (
    <React.Fragment>
      {/* ── CLOUD SYNC STATUS ── */}
      <div className="section-hdr" style={{ marginTop: 24 }}>
        <div className="section-hdr-icon" style={{ background: 'rgba(22,163,74,.12)' }}>
          ☁️
        </div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Cloud Sync</div>
          <div className="section-hdr-sub">Your progress backed up automatically</div>
        </div>
      </div>
      <div
        style={{
          background: syncErr
            ? 'linear-gradient(135deg,var(--error-bg),rgba(220,38,38,.15))'
            : syncReady
              ? 'linear-gradient(135deg,var(--success-bg),rgba(22,163,74,.15))'
              : 'linear-gradient(135deg,var(--bar-bg),var(--bar-bg))',
          border: `1.5px solid ${syncErr ? 'var(--error-b)' : syncReady ? 'var(--success-b)' : 'var(--card-b)'}`,
          borderRadius: 16,
          padding: '14px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          transition: 'all .3s ease',
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            flexShrink: 0,
            background: syncErr
              ? 'linear-gradient(135deg,var(--error),#b91c1c)'
              : syncReady
                ? 'linear-gradient(135deg,var(--success),#15803d)'
                : 'linear-gradient(135deg,var(--subtext),var(--subtext))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}
        >
          {syncing ? '⏳' : syncErr ? '⚠️' : syncDone ? '✅' : syncReady ? '☁️' : '📵'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 800,
              color: syncErr ? 'var(--error)' : syncReady ? 'var(--success)' : 'var(--subtext)',
            }}
          >
            {syncing
              ? 'Saving to cloud…'
              : syncErr
                ? 'Sync failed — check connection'
                : syncDone
                  ? 'Saved to cloud!'
                  : syncReady
                    ? 'Cloud backup active'
                    : 'Connecting…'}
          </div>
          <div
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--subtext)',
              marginTop: 2,
              fontWeight: 500,
            }}
          >
            {lastSaved ? `Last saved: ${lastSaved.toLocaleString()}` : 'No local save found'}
          </div>
        </div>
        {syncReady && (
          <button
            onClick={handleSyncNow}
            disabled={syncing}
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              border: 'none',
              cursor: syncing ? 'default' : 'pointer',
              background: syncing
                ? 'var(--bar-bg)'
                : syncErr
                  ? 'linear-gradient(135deg,var(--error),#b91c1c)'
                  : 'linear-gradient(135deg,var(--success),#15803d)',
              color: syncing ? 'var(--subtext)' : 'var(--card)',
              fontSize: 'var(--text-sm)',
              fontWeight: 800,
              fontFamily: "'Outfit',sans-serif",
              flexShrink: 0,
              minHeight: 44,
            }}
          >
            {syncing ? '…' : 'Sync Now'}
          </button>
        )}
      </div>
    </React.Fragment>
  );
}
