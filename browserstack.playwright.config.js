import { defineConfig } from '@playwright/test';

/**
 * BrowserStack Playwright config — runs E2E suite against production URL.
 * Used by: npx browserstack-node-sdk npx playwright test
 * Excludes tests that require local server state or production auth tokens.
 */
export default defineConfig({
  testDir: './e2e',
  testIgnore: [
    '**/smoke.spec.js',              // duplicate — smoke is a subset of what we run here
    '**/*-audit.spec.js',            // long-form audit specs, not for CI
    '**/heavy-user-*.spec.js',       // 20+ min, separate run
    '**/live-login.spec.js',         // requires interactive auth
    '**/cross-device-sync.spec.js',  // requires two authenticated sessions
    '**/sync-live*.spec.js',
    '**/daily-challenge-sync.spec.js',
    '**/screenshots.spec.js',        // local screenshot reference
  ],

  fullyParallel: false,   // BrowserStack parallelism is per-platform, not per-test
  retries: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'browserstack-report' }],
  ],

  use: {
    // Point at production — BrowserStack real devices can't reach localhost
    baseURL: 'https://nasahrvatska.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
  },
});
