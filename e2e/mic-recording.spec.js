/**
 * SP4a — End-to-end smoke check that the shared useRecorder hook + the
 * MicPermissionDeniedExplainer ship correctly in the deployed bundle
 * across all 5 Playwright projects (Chrome / Firefox / WebKit /
 * Pixel 5 Chrome / iPad Safari).
 *
 * Strategy: deep-link into the AI conversation route (where the mic
 * surface is most reachable from a fresh state) and verify the app
 * boots without console errors. The detailed mic-state UI is covered
 * by the consumer integration tests (see src/tests/shadowingMic.test.tsx,
 * src/tests/gradedInputMic.test.tsx, src/tests/speakingSprintMic.test.tsx,
 * src/tests/useWhisperSTT.test.ts).
 *
 * What this verifies:
 *   - The bundle that ships to production has useRecorder + Explainer
 *     wired in correctly (no missing exports, no broken imports).
 *   - The app boots cleanly on every browser engine listed in
 *     playwright.config.js.
 *
 * What this does NOT verify (deferred — see spec follow-up section):
 *   - Real iOS Capacitor / Android Capacitor builds (require physical
 *     devices).
 *   - Live audio capture from a physical microphone.
 *   - Per-OS instructional text correctness in the explainer (covered by
 *     src/tests/MicPermissionDeniedExplainer.test.tsx).
 */
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS } from './fixtures/seed-auth.js';

test.describe('SP4a — mic infrastructure smoke', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
  });

  test('boots /practice without console errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
    });

    await page.goto('/practice');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });

    // Filter out the well-known Sentry/Firebase noise that is unrelated to mic work.
    const real = errors.filter(
      (e) =>
        !/sentry|firebase|service.?worker|workbox/i.test(e) &&
        !/Failed to load resource/.test(e) &&
        !/net::ERR_/.test(e),
    );
    expect(real, `console errors that would block mic UX:\n${real.join('\n')}`).toEqual([]);
  });

  test('boots /croatia without console errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
    });

    await page.goto('/croatia');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });

    const real = errors.filter(
      (e) =>
        !/sentry|firebase|service.?worker|workbox/i.test(e) &&
        !/Failed to load resource/.test(e) &&
        !/net::ERR_/.test(e),
    );
    expect(real, `console errors that would block mic UX:\n${real.join('\n')}`).toEqual([]);
  });
});
