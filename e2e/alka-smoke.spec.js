/**
 * alka-smoke.spec.js — gamification G1 smoke test.
 *
 * Drives a real browser through the full Alka flow:
 *   Practice tab → Arcade card (top) → Arcade hub → Alka → play a 9-question
 *   ride → result screen shows N/9.
 * Captures screenshots of each key state for visual sign-off.
 *
 * Not part of the always-on CI suite's assertions beyond the happy path; it is
 * the manual/visual smoke for the new feature. Run:
 *   npx playwright test e2e/alka-smoke.spec.js --project="Desktop Chrome"
 */
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, mockContent, openArcade } from './fixtures/seed-auth.js';
import { TID } from './fixtures/testids.js';

test.describe('Alka game — smoke', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
  });

  test('play a full Alka ride from the Grad Square', async ({ page }) => {
    // 1. Grad -> Trg (the games square) -> Arcade tile.
    await openArcade(page);
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/alka-1-practice-top.png', fullPage: false });

    // 2. Arcade hub — Alka tile is live.
    const alkaTile = page.getByRole('button').filter({ hasText: 'Lance & ring' });
    await expect(alkaTile).toBeVisible({ timeout: 8_000 });
    await page.screenshot({ path: 'test-results/alka-2-arcade-hub.png' });
    await alkaTile.click();

    // 3. Alka ride — the ring + first question render.
    await expect(page.getByText('Take aim', { exact: false })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByTestId(TID.ALKA_OPTION(0))).toBeVisible({ timeout: 8_000 });
    await page.screenshot({ path: 'test-results/alka-3-ride-q1.png' });

    // 4. Answer all 9 questions (3 runs × 3). Click the first option each time;
    //    a 400ms reveal animates before the ride advances, so wait between picks.
    for (let i = 0; i < 9; i++) {
      const opt = page.getByTestId(TID.ALKA_OPTION(0));
      await expect(opt).toBeEnabled({ timeout: 5_000 });
      await opt.click();
      await page.waitForTimeout(550);
    }

    // 5. Result screen shows a score out of 9 and the replay/exit actions.
    await expect(page.getByText('/ 9', { exact: false })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('button', { name: 'Ride again' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Done' })).toBeVisible();
    await page.screenshot({ path: 'test-results/alka-4-result.png' });
  });
});
