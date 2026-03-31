import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/heavy-user-360day.spec.js',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 480_000,
  reporter: [['html', { open: 'never', outputFolder: 'playwright-360day-audit-report' }], ['list']],
  use: {
    baseURL: 'https://nasahrvatska.com',
    trace: 'retain-on-failure',
    screenshot: 'on',
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
  },
  projects: [
    { name: 'Chrome', use: { ...devices['Desktop Chrome'] } },
  ],
});
