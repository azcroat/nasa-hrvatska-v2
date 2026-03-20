/**
 * UX audit config — runs the user-experience audit against the live production site.
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/user-experience-audit.spec.js',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['html', { open: 'never', outputFolder: 'playwright-ux-report' }], ['list']],
  use: {
    baseURL: 'https://nasahrvatska.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 20_000,
    navigationTimeout: 40_000,
  },
  projects: [
    { name: 'Chrome', use: { ...devices['Desktop Chrome'] } },
  ],
});
