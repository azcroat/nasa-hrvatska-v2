import { useEffect } from 'react';
import { initPostHog } from '../../lib/analytics';

const COOKIE_KEY = 'cookie_consent_v1';

// Auto-accepts essential cookies silently on first load.
// No banner, no user action required.
// Analytics (PostHog) stays off by default — user can enable in Settings.
export default function CookieConsent() {
  useEffect(() => {
    if (!localStorage.getItem(COOKIE_KEY)) {
      localStorage.setItem(COOKIE_KEY, 'essential');
      localStorage.setItem('cookieConsent', 'essential');
    }
  }, []);

  return null;
}

// Keep acceptAll exported so Settings can call it if user opts into analytics
export function acceptAllCookies() {
  localStorage.setItem(COOKIE_KEY, 'accepted');
  localStorage.setItem('cookieConsent', 'accepted');
  initPostHog();
}
