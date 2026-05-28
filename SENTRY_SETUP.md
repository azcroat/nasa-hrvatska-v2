# Sentry Setup

Sentry is integrated in `src/main.tsx` (dynamic import). DSN must be set
in CF Pages env to activate. Source-map upload requires three additional
env vars; without them, errors arrive minified and unreadable (see D4 in
the 2026-05-28 session log).

## Required CF Pages env vars

| Var | Purpose | Source |
|---|---|---|
| `VITE_SENTRY_DSN` | Public DSN — activates SDK in browser | sentry.io → Project → Settings → Client Keys (DSN) |
| `SENTRY_AUTH_TOKEN` | **Build-time only** — uploads source maps. Must NOT be VITE_-prefixed (don't expose to browser) | sentry.io → Settings → Account → API → Auth Tokens. Scopes: `project:releases`, `org:read` |
| `SENTRY_ORG` | Org slug (e.g. `nasa-hrvatska`) | URL bar on sentry.io — the slug after `https://sentry.io/organizations/` |
| `SENTRY_PROJECT` | Project slug (e.g. `javascript-react`) | Project settings page on sentry.io |

When all three of the last row are set, `vite.config.js` enables source-map
generation (`'hidden'`), and `@sentry/vite-plugin` uploads them and deletes
the local `.map` files before the dist is served. Browsers never see them.

Without `SENTRY_AUTH_TOKEN`, the build is a no-op for upload — the SDK still
runs, but errors will be minified (`E.foo`) in the Sentry UI.

## How to verify upload worked

1. Check the CF Pages build log for a `[sentry-vite-plugin]` upload section
2. On sentry.io → Releases, look for a release matching the build timestamp
3. New errors should symbolicate (e.g. `ReplayContainer.snapshotNode` instead of `E.getBoundingClientRect`)

## Background — already done

- ✅ `@sentry/react` installed in package.json
- ✅ Dynamic import with PII scrubbing in src/main.tsx
- ✅ `browserTracingIntegration` for performance monitoring
- ✅ `vendor-sentry` chunk isolated in bundle
- ✅ Only activates in production (`enabled: import.meta.env.PROD`)
- ✅ `@sentry/vite-plugin` installed and wired in vite.config.js (D4, 2026-05-28)
- ✅ Source map upload runs only when env vars present — local builds keep working

## Optional: VITE_APP_VERSION

Add `VITE_APP_VERSION=2.0.0` in CF Pages env for release tracking in Sentry
(used as a fallback when `__BUILD_ID__` isn't injected at build time).
