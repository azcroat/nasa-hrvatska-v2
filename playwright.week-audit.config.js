import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/week-audit.spec.js',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 120_000,
  reporter: [['html', { open: 'never', outputFolder: 'playwright-week-audit-report' }], ['list']],
  use: {
    baseURL: 'https://nasahrvatska.com',
    trace: 'retain-on-failure',
    screenshot: 'on',
    actionTimeout: 25_000,
    navigationTimeout: 45_000,
  },
  projects: [
    { name: 'Chrome', use: { ...devices['Desktop Chrome'] } },
  ],
});
