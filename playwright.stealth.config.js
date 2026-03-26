import { defineConfig, devices } from '@playwright/test';

// Live-site config with bot-detection bypass for nasahrvatska.com
// (React SPA on Cloudflare Pages — requires real browser fingerprint)
// Usage: npm run test:live
export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/live-login.spec.js', '**/screenshots.spec.js'],
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [['html', { outputFolder: 'playwright-report-live' }], ['line']],
  use: {
    baseURL: 'https://nasahrvatska.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    launchOptions: {
      args: ['--disable-blink-features=AutomationControlled'],
    },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chrome-stealth',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
