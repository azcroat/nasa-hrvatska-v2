# Sentry Setup

Sentry is already integrated in `src/main.jsx`. To activate it:

## Steps

1. Go to https://sentry.io → Create Account (if needed)
2. New Project → JavaScript → React
3. Copy the DSN (looks like `https://abc123@o123.ingest.sentry.io/456`)
4. In **Cloudflare Pages** → Your Project → Settings → Environment Variables:
   - Add `VITE_SENTRY_DSN` = your DSN value
   - Set environment: **Production**
5. Trigger a new deploy (push to master)

## What's already done

- ✅ `@sentry/react` installed in package.json
- ✅ Dynamic import with PII scrubbing in src/main.jsx
- ✅ `browserTracingIntegration` for performance monitoring
- ✅ `sourcemap: 'hidden'` in vite.config.js
- ✅ `vendor-sentry` chunk isolated in bundle
- ✅ Only activates in production (`enabled: import.meta.env.PROD`)

## Optional: VITE_APP_VERSION

Also add `VITE_APP_VERSION=2.0.0` in Cloudflare env vars for release tracking in Sentry.
