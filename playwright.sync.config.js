/**
 * Cross-device sync test config — runs against the live production site.
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/cross-device-sync.spec.js',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'https://nasahrvatska.com',
    actionTimeout: 25_000,
    navigationTimeout: 40_000,
  },
  projects: [
    { name: 'Chrome', use: { ...devices['Desktop Chrome'] } },
  ],
});
