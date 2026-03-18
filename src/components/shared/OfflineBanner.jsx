import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 64,   // sits just above the tab bar
        left: 0,
        right: 0,
        zIndex: 9300,
        background: 'linear-gradient(135deg,#92400e,#78350f)',
        color: '#fff',
        padding: '9px 20px',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '.01em',
        boxShadow: '0 -2px 12px rgba(0,0,0,.18)',
        fontFamily: "'Outfit',sans-serif",
      }}
    >
      📶 You're offline — vocabulary &amp; practice still work!
    </div>
  );
}
