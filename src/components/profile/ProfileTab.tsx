import React, { useState } from 'react';
import ProfileHeader from './ProfileHeader';
import StatsTab from './StatsTab';
import InsightsTab from './InsightsTab';
import SettingsTab from './SettingsTab';
import PrestigeModal from './PrestigeModal';
import ClanCard from '../home/ClanCard';
import { useApp } from '../../context/AppContext';

export default function ProfileTab({
  syncReady,
  onSyncNow,
  onOpenFriends,
  lastSyncedAt = 0,
}: {
  syncReady: boolean;
  onSyncNow?: () => void;
  onOpenFriends?: () => void;
  lastSyncedAt?: number;
}) {
  const { au: authUser } = useApp();
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

      {/* ── SYNC STATUS INDICATOR — only shown after first successful sync ── */}
      {authUser && lastSyncedAt > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: 'var(--success, #16a34a)',
            fontWeight: 600,
            marginBottom: 12,
            paddingLeft: 2,
          }}
        >
          <span style={{ fontSize: 13 }}>☁️</span>
          <span>
            {(() => {
              const diff = Math.round((Date.now() - lastSyncedAt) / 60000);
              if (diff < 1) return 'Synced just now';
              if (diff === 1) return 'Synced 1 min ago';
              return `Synced ${diff} min ago`;
            })()}
          </span>
        </div>
      )}

      {/* ── SUB-TAB PILL SELECTOR ── */}
      <div className="seg-bar">
        {[
          { id: 'stats', label: '📊 Stats' },
          { id: 'insights', label: '💡 Insights' },
          { id: 'settings', label: '⚙️ Settings' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setPTab(t.id)}
            className="seg-pill"
            style={{
              background: ptab === t.id ? 'var(--card)' : 'transparent',
              color: ptab === t.id ? 'var(--info)' : 'var(--subtext)',
              fontWeight: ptab === t.id ? 800 : 600,
              boxShadow: ptab === t.id ? '0 2px 8px rgba(0,0,0,.1)' : 'none',
              letterSpacing: ptab === t.id ? '.01em' : 0,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── STATS TAB ── */}
      {ptab === 'stats' && (
        <>
          <StatsTab onShowPrestigeModal={() => setShowPrestigeModal(true)} onSyncNow={onSyncNow} />
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
      {ptab === 'insights' && <InsightsTab onOpenFriends={onOpenFriends} />}

      {/* ── SETTINGS TAB ── */}
      {ptab === 'settings' && <SettingsTab syncReady={syncReady} onSyncNow={onSyncNow} />}

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
