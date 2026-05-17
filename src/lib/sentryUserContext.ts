// SP10b sub-item: set/clear Sentry user context on Firebase auth state change.
//
// Sentry is dynamically imported in main.tsx (lazy because the 40KB bundle is
// gated on VITE_SENTRY_DSN env var). After init it self-registers as
// window.__nhSentry. Consumers — useAuth on sign-in/sign-out, etc. — call
// these helpers without needing to know whether Sentry actually loaded.
//
// Safe no-ops when Sentry isn't loaded (dev, missing env var, init failure).

interface SentryLike {
  setUser: (user: { id: string; email?: string } | null) => void;
}

declare global {
  interface Window {
    __nhSentry?: SentryLike;
  }
}

/**
 * Tag subsequent Sentry events with the given user. Pass null to clear (sign-out).
 *
 * Beware: `email` here is the Firebase user.email/uid composite (whichever
 * the app stores in AuthUser.u). Sentry's PII scrubbing in main.tsx's
 * beforeSend strips request URLs and other sources of PII but accepts
 * user identifiers — that's the whole point of setUser.
 */
export function setSentryUser(user: { id: string; email?: string } | null): void {
  if (typeof window === 'undefined') return;
  const sentry = window.__nhSentry;
  if (!sentry || typeof sentry.setUser !== 'function') return;
  try {
    if (user) {
      sentry.setUser({ id: user.id, email: user.email });
    } else {
      sentry.setUser(null);
    }
  } catch {
    // Sentry's setUser is best-effort — never let it crash callers.
  }
}
