import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { fbDeleteAccount } from '../../data';
import { useContent } from '../../hooks/useContent';
import { fbExportUserData } from '../../lib/firebase.js';
import { useApp } from '../../context/AppContext';
import { useStats } from '../../context/StatsContext.tsx';
import { getFreezesStored, purchaseFreeze, FREEZE_COST_XP } from '../../lib/streakFreeze.js';
import { isNative } from '../../lib/platform.ts';
import HeritageEntrySection from './sections/HeritageEntrySection';
import GoalFocusSection from './sections/GoalFocusSection';
import LearningPreferencesSection from './sections/LearningPreferencesSection';
import DifficultySection from './sections/DifficultySection';
import GoalSelectorSection from './sections/GoalSelectorSection';

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
  const { stats: statsCtx, setStats } = useStats();
  const { content } = useContent();
  const V = (content?.V ?? {}) as Record<string, any[]>;

  const [freezesStored, setFreezesStored] = useState(() => getFreezesStored());
  const [freezeMsg, setFreezeMsg] = useState('');
  function handleBuyFreeze() {
    const result = purchaseFreeze(statsCtx.xp || 0, setStats as any);
    if (result.ok) {
      setFreezesStored(result.stored ?? 0);
      setFreezeMsg(`❄️ Freeze purchased! ${result.stored ?? 0}/2 stored.`);
      setTimeout(() => setFreezeMsg(''), 3000);
      // Persist XP deduction to Firebase immediately — without this, the deduction
      // lives only in React state and localStorage. If the app closes before the next
      // periodic sync, the old (pre-purchase) XP is restored from Firestore on next open.
      if (onSyncNow)
        setTimeout(() => {
          onSyncNow?.();
        }, 300);
    } else {
      setFreezeMsg(result.reason ?? '');
      setTimeout(() => setFreezeMsg(''), 3000);
    }
  }

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

  // Push notification state
  const [notifPermission, setNotifPermission] = useState(() => {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
  });
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState('');
  const [reminderTime, setReminderTime] = useState(
    () => localStorage.getItem('nh_reminder_time') || '20:00',
  );

  const handleEnableNotifications = useCallback(async () => {
    if (notifLoading) return;
    setNotifLoading(true);
    setNotifError('');
    try {
      const { subscribeToPush } = await import('../../lib/pushNotifications.js');
      const result = await subscribeToPush(au?.u || '');
      setNotifPermission(
        typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
      );
      if (result.ok) {
        try {
          localStorage.setItem('nh_notifications_enabled', 'true');
        } catch {}
      } else {
        setNotifError('Could not enable notifications. Please check your browser settings.');
      }
    } catch (_err) {
      setNotifPermission(
        typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
      );
      setNotifError('Notifications unavailable. Please try again or check browser permissions.');
    } finally {
      setNotifLoading(false);
    }
  }, [notifLoading, au]);

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
      {/* ── STREAK PROTECTION ── */}
      <div className="section-hdr" style={{ marginTop: 24 }}>
        <div className="section-hdr-icon" style={{ background: 'rgba(56,189,248,.12)' }}>
          ❄️
        </div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Streak Protection</div>
          <div className="section-hdr-sub">Keep your streak safe on miss days</div>
        </div>
      </div>
      <div
        style={{
          background: 'linear-gradient(135deg,rgba(56,189,248,.06),rgba(14,116,144,.04))',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          border: '1.5px solid rgba(56,189,248,.2)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div style={{ fontSize: 12, color: 'var(--subtext)', marginBottom: 14, lineHeight: 1.5 }}>
          Freezes automatically protect your streak if you miss a day. Max 2 stored.
        </div>
        {/* Freeze slots */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
          {[0, 1].map((i) => (
            <div
              key={i}
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: i < freezesStored ? 'rgba(56,189,248,0.15)' : 'var(--bar-bg)',
                border: `2px solid ${i < freezesStored ? '#38bdf8' : 'var(--card-b)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: i < freezesStored ? 26 : 18,
                boxShadow: i < freezesStored ? '0 2px 8px rgba(56,189,248,.25)' : 'none',
                transition: 'all .2s',
              }}
            >
              {i < freezesStored ? '❄️' : '○'}
            </div>
          ))}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--heading)' }}>
              {freezesStored}/2 stored
            </div>
            <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 2 }}>
              {freezesStored === 2
                ? "Fully stocked — you're protected!"
                : `${2 - freezesStored} slot${2 - freezesStored > 1 ? 's' : ''} available`}
            </div>
          </div>
        </div>
        <button
          disabled={freezesStored >= 2 || (statsCtx?.xp || 0) < FREEZE_COST_XP}
          onClick={handleBuyFreeze}
          style={{
            width: '100%',
            padding: '11px',
            borderRadius: 12,
            background:
              freezesStored >= 2 || (statsCtx?.xp || 0) < FREEZE_COST_XP
                ? 'var(--bar-bg)'
                : 'linear-gradient(135deg,#38bdf8,#0e7490)',
            color:
              freezesStored >= 2 || (statsCtx?.xp || 0) < FREEZE_COST_XP
                ? 'var(--subtext)'
                : '#fff',
            border: 'none',
            fontWeight: 700,
            fontSize: 13,
            cursor:
              freezesStored >= 2 || (statsCtx?.xp || 0) < FREEZE_COST_XP
                ? 'not-allowed'
                : 'pointer',
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          {freezesStored >= 2
            ? '✓ Freeze slots full'
            : `Buy Freeze — 50 XP (you have ${statsCtx?.xp || 0})`}
        </button>
        {freezeMsg && (
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>
            {freezeMsg}
          </div>
        )}
      </div>

      {/* ── NOTIFICATIONS ── */}
      <div className="section-hdr" style={{ marginTop: 24 }}>
        <div className="section-hdr-icon" style={{ background: 'rgba(245,158,11,.12)' }}>
          🔔
        </div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Notifications</div>
          <div className="section-hdr-sub">Daily reminders & SRS alerts</div>
        </div>
      </div>
      <div
        style={{
          background:
            notifPermission === 'granted'
              ? 'linear-gradient(135deg,var(--success-bg),rgba(22,163,74,.15))'
              : 'var(--card)',
          border: `1.5px solid ${notifPermission === 'granted' ? 'var(--success-b)' : 'var(--card-b)'}`,
          borderRadius: 16,
          padding: '14px 16px',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              flexShrink: 0,
              background:
                notifPermission === 'granted'
                  ? 'linear-gradient(135deg,var(--success),#15803d)'
                  : notifPermission === 'denied'
                    ? 'linear-gradient(135deg,var(--error),#b91c1c)'
                    : 'linear-gradient(135deg,#f59e0b,#d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            {notifPermission === 'granted' ? '🔔' : notifPermission === 'denied' ? '🔕' : '🔔'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 800,
                color: notifPermission === 'granted' ? 'var(--success)' : 'var(--heading)',
              }}
            >
              {notifPermission === 'granted'
                ? 'Notifications enabled'
                : notifPermission === 'denied'
                  ? 'Notifications blocked'
                  : notifPermission === 'unsupported'
                    ? 'Not supported on this browser'
                    : 'Daily reminders off'}
            </div>
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--subtext)',
                marginTop: 2,
                lineHeight: 1.4,
              }}
            >
              {notifPermission === 'granted'
                ? 'Daily streak reminders + SRS review alerts'
                : notifPermission === 'denied'
                  ? 'Enable in browser Settings → Site permissions'
                  : notifPermission === 'unsupported'
                    ? 'Install as PWA for notification support'
                    : 'Enable for daily streak + SRS reminders'}
            </div>
          </div>
          {notifPermission === 'default' && (
            <button
              onClick={handleEnableNotifications}
              disabled={notifLoading}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                cursor: notifLoading ? 'default' : 'pointer',
                background: notifLoading
                  ? 'var(--bar-bg)'
                  : 'linear-gradient(135deg,#f59e0b,#d97706)',
                color: notifLoading ? 'var(--subtext)' : 'white',
                fontSize: 'var(--text-xs)',
                fontWeight: 800,
                fontFamily: "'Outfit',sans-serif",
                flexShrink: 0,
                minHeight: 40,
              }}
            >
              {notifLoading ? '…' : 'Enable'}
            </button>
          )}
        </div>
        {notifError && (
          <div
            style={{
              marginTop: 8,
              fontSize: 'var(--text-xs)',
              color: 'var(--error, #ef4444)',
              fontWeight: 600,
            }}
          >
            {notifError}
          </div>
        )}
        {notifPermission === 'granted' && (
          <>
            <div
              style={{
                marginTop: 10,
                fontSize: 'var(--text-xs)',
                color: 'var(--subtext)',
                lineHeight: 1.5,
              }}
            >
              ✓ Streak reminders · ✓ SRS review alerts · ✓ Daily motivation
            </div>
            {/* ── Reminder time picker — DuoLingo best practice ── */}
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>⏰</span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: 'var(--heading)',
                    marginBottom: 4,
                  }}
                >
                  Daily reminder time
                </div>
                <select
                  value={reminderTime}
                  onChange={(e) => {
                    const t = e.target.value;
                    setReminderTime(t);
                    try {
                      localStorage.setItem('nh_reminder_time', t);
                    } catch (_) {}
                  }}
                  style={{
                    background: 'var(--card)',
                    border: '1.5px solid var(--card-b)',
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--heading)',
                    cursor: 'pointer',
                    fontFamily: "'Outfit', sans-serif",
                    width: '100%',
                  }}
                  aria-label="Set daily reminder time"
                >
                  {[
                    '07:00',
                    '08:00',
                    '09:00',
                    '10:00',
                    '11:00',
                    '12:00',
                    '13:00',
                    '14:00',
                    '15:00',
                    '16:00',
                    '17:00',
                    '18:00',
                    '19:00',
                    '20:00',
                    '21:00',
                    '22:00',
                  ].map((t) => {
                    const [h = '0'] = t.split(':');
                    const hour = parseInt(h, 10);
                    const label =
                      hour === 0
                        ? '12:00 AM'
                        : hour < 12
                          ? `${hour}:00 AM`
                          : hour === 12
                            ? '12:00 PM'
                            : `${hour - 12}:00 PM`;
                    return (
                      <option key={t} value={t}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </>
        )}
      </div>

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
