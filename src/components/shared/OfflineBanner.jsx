import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="offline-banner"
    >
      📵 Nema interneta — Offline
    </div>
  );
}
