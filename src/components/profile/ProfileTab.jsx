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
      <div style={{
        display:'flex', gap:4,
        background:'var(--bar-bg)', borderRadius:16, padding:'4px',
        marginBottom:16,
      }}>
        {[
          { id:'stats',    label:'📊 Stats' },
          { id:'insights', label:'💡 Insights' },
          { id:'settings', label:'⚙️ Settings' },
        ].map(t => (
          <button key={t.id} onClick={() => setPTab(t.id)} style={{
            flex:1, padding:'10px 8px', borderRadius:12, border:'none',
            background: ptab === t.id ? 'var(--card)' : 'transparent',
            color: ptab === t.id ? 'var(--info)' : 'var(--subtext)',
            fontWeight: ptab === t.id ? 800 : 600,
            fontSize:13, cursor:'pointer',
            transition:'all .2s cubic-bezier(.34,1.56,.64,1)',
            boxShadow: ptab === t.id ? '0 2px 8px rgba(0,0,0,.1)' : 'none',
            fontFamily:"'Outfit',sans-serif",
            letterSpacing: ptab === t.id ? '.01em' : 0,
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
