import React, { useState } from 'react';
import ProfileHeader from './ProfileHeader.jsx';
import StatsTab from './StatsTab.jsx';
import InsightsTab from './InsightsTab.jsx';
import SettingsTab from './SettingsTab.jsx';
import PrestigeModal from './PrestigeModal.jsx';

export default function ProfileTab({ syncReady, onSyncNow, onOpenLeaderboard, onOpenFriends }) {
  const [ptab, setPTab] = useState('stats');
  const [showPrestigeModal, setShowPrestigeModal] = useState(false);
  const prestigeLevel = parseInt(localStorage.getItem('nh_prestige') || '0', 10);

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
      <ProfileHeader />

      {/* ── SUB-TAB PILL SELECTOR ── */}
      <div style={{ display:'flex', gap:8, padding:'4px 0 16px' }}>
        {[
          { id:'stats',    label:'📊 Stats' },
          { id:'insights', label:'💡 Insights' },
          { id:'settings', label:'⚙️ Settings' },
        ].map(t => (
          <button key={t.id} onClick={() => setPTab(t.id)} style={{
            flex:1, padding:'8px 4px', borderRadius:20, border:'none',
            background: ptab === t.id ? 'var(--info)' : 'var(--bar-bg)',
            color: ptab === t.id ? '#fff' : 'var(--subtext)',
            fontWeight:700, fontSize:13, cursor:'pointer',
            transition:'background 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── STATS TAB ── */}
      {ptab === 'stats' && (
        <StatsTab
          onShowPrestigeModal={() => setShowPrestigeModal(true)}
          onSyncNow={onSyncNow}
        />
      )}

      {/* ── INSIGHTS TAB ── */}
      {ptab === 'insights' && (
        <InsightsTab
          onOpenLeaderboard={onOpenLeaderboard}
          onOpenFriends={onOpenFriends}
        />
      )}

      {/* ── SETTINGS TAB ── */}
      {ptab === 'settings' && (
        <SettingsTab
          syncReady={syncReady}
          onSyncNow={onSyncNow}
        />
      )}

      {/* ── PRESTIGE MODAL ── */}
      {showPrestigeModal && (
        <PrestigeModal
          onClose={() => setShowPrestigeModal(false)}
          onConfirm={() => {
            const newPrestige = prestigeLevel + 1;
            localStorage.setItem('nh_prestige', String(newPrestige));
            localStorage.setItem('nh_xp', '0');
            setShowPrestigeModal(false);
            if (onSyncNow) onSyncNow();
          }}
        />
      )}

    </React.Fragment>
  );
}
