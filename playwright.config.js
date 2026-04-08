import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testIgnore: [
    '**/smoke.spec.js',              // uses playwright.smoke.config.js (production URL)
    '**/*-audit.spec.js',            // audit specs run manually against production (not in CI)
    '**/heavy-user-*.spec.js',       // 60-day heavy user spec — 20+ min, production only
    '**/live-login.spec.js',         // requires production credentials
    '**/sync-live-proof.spec.js',    // hits nasahrvatska.com directly — 20+ min, production only
    '**/production-auth-flow.spec.js', // production URL test — run manually only
    '**/offline.spec.js',              // requires pre-cached service worker — run against production build only
    '**/cross-device-sync.spec.js',   // uses live Firebase credentials — run manually against production only
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : undefined,
  timeout: 60_000,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    // ── Desktop browsers ────────────────────────────────────────────────────
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Desktop Safari (WebKit)',
      use: { ...devices['Desktop Safari'] },
    },
    // ── Mobile browsers ─────────────────────────────────────────────────────
    {
      name: 'Mobile Chrome (Pixel 5)',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari (iPhone 14)',
      use: { ...devices['iPhone 14'] },
    },
    // ── Tablet ───────────────────────────────────────────────────────────────
    {
      name: 'Tablet Safari (iPad Pro)',
      use: { ...devices['iPad Pro 11'] },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
