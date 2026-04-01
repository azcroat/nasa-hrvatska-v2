import { defineConfig } from '@playwright/test';

// Standalone config for live sync proof — no webServer needed, hits production directly
export default defineConfig({
  testDir: '.',
  testMatch: ['**/sync-live-proof.spec.js'],
  fullyParallel: false, // sequential: Device A must write before Device B reads
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'sync-proof-report' }]],
  use: {
    baseURL: 'https://nasahrvatska.com',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  timeout: 180_000,
});
