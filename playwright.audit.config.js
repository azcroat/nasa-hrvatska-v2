import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/full-user-audit.spec.js',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'https://nasahrvatska.com',
    trace: 'off',
    screenshot: 'on',
    actionTimeout: 25_000,
    navigationTimeout: 45_000,
  },
  projects: [
    { name: 'Chrome', use: { ...devices['Desktop Chrome'] } },
  ],
});
