import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export default function OfflineBanner() {
  const { isOnline, backOnline } = useOnlineStatus();

  if (isOnline && !backOnline) return null;

  const isBack = isOnline && backOnline;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingTop: 'max(10px, env(safe-area-inset-top, 10px))',
        paddingBottom: 10,
        paddingLeft: 16,
        paddingRight: 16,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 700,
        fontFamily: "'Outfit', sans-serif",
        background: isBack ? '#166534' : '#7f1d1d',
        color: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,.25)',
        transition: 'background .3s',
      }}
    >
      {isBack ? '✓ Back online' : '📵 Offline — progress saves locally and syncs when reconnected'}
    </div>
  );
}
