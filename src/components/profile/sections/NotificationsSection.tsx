import React, { useState, useCallback } from 'react';
import { useApp } from '../../../context/AppContext';

/**
 * Notifications + daily-reminder-time section — extracted from SettingsTab as
 * part of the 1a decomposition. Owns all notification UI state + the enable
 * handler; pulls `au` from useApp() directly (context), so it takes no props.
 * Behavior-identical to the prior inline block.
 */
export default function NotificationsSection() {
  const { au } = useApp();
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
      const { subscribeToPush } = await import('../../../lib/pushNotifications.js');
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

  return (
    <React.Fragment>
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
    </React.Fragment>
  );
}
