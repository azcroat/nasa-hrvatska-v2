import React, { useState } from 'react';
import ProfileHeader from './ProfileHeader';
import StatsTab from './StatsTab';
import InsightsTab from './InsightsTab';
import SettingsTab from './SettingsTab';
import ClanCard from '../home/ClanCard';
import EquivalencyTestCard from './EquivalencyTestCard';
import { useApp } from '../../context/AppContext';
import type { CefrLevel } from '../../lib/cefr';

export default function ProfileTab({
  syncReady,
  onSyncNow,
  lastSyncedAt = 0,
  onTakeEquivalencyTest,
  userEligible,
}: {
  syncReady: boolean;
  onSyncNow?: () => void;
  lastSyncedAt?: number;
  /** Wired by AppRouter; navigates to the equivalency test screen. */
  onTakeEquivalencyTest?: () => void;
  /** Activity-derived CEFR level used to compare against certified. */
  userEligible?: CefrLevel;
}) {
  const { au: authUser } = useApp();
  const [ptab, setPTab] = useState('stats');

  React.useEffect(() => {
    // Apply font size on mount
    const fs = localStorage.getItem('nh_font_size') || 'medium';
    if (fs === 'medium') {
      document.documentElement.removeAttribute('data-font');
    } else {
      document.documentElement.setAttribute('data-font', fs);
    }
    // Apply reduce motion on mount
    const rm = localStorage.getItem('nh_reduce_motion') === 'true';
    document.documentElement.classList.toggle('reduce-motion', rm);
  }, []);

  return (
    <React.Fragment>
      {/* ── PROFILE HEADER ── */}
      <ProfileHeader syncTime={authUser && lastSyncedAt > 0 ? lastSyncedAt : 0} />

      {/* ── SUB-TAB STRIP ── */}
      <div
        className="profile-tab-strip"
        style={{
          display: 'flex',
          borderBottom: '1.5px solid var(--card-b)',
          marginBottom: 16,
          background: 'var(--card)',
          borderRadius: '12px 12px 0 0',
          overflow: 'hidden',
        }}
      >
        {[
          { id: 'stats', icon: '📊', label: 'Stats' },
          { id: 'insights', icon: '💡', label: 'Insights' },
          { id: 'settings', icon: '⚙️', label: 'Settings' },
        ].map((t) => (
          <button
            key={t.id}
            className="profile-tab-pill"
            onClick={() => setPTab(t.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '11px 4px 9px',
              fontSize: 10,
              fontWeight: ptab === t.id ? 800 : 600,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: ptab === t.id ? '#047857' : 'var(--subtext)',
              borderBottom: ptab === t.id ? '3px solid #047857' : '3px solid transparent',
              transition: 'color .15s, border-color .15s',
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── STATS TAB ── */}
      {ptab === 'stats' && (
        <>
          <StatsTab onSyncNow={onSyncNow} />
          {onTakeEquivalencyTest && userEligible && (
            <EquivalencyTestCard userEligible={userEligible} onTakeTest={onTakeEquivalencyTest} />
          )}
          {/* ── STUDY CLAN — moved from Today tab ── */}
          {authUser && (
            <ClanCard
              uid={authUser.uid}
              displayName={authUser.displayName || authUser.email?.split('@')[0] || 'Učenik'}
            />
          )}
        </>
      )}

      {/* ── INSIGHTS TAB ── */}
      {ptab === 'insights' && <InsightsTab />}

      {/* ── SETTINGS TAB ── */}
      {ptab === 'settings' && <SettingsTab syncReady={syncReady} onSyncNow={onSyncNow} />}
    </React.Fragment>
  );
}
