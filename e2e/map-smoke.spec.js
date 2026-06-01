/**
 * map-smoke.spec.js — gamification G1b smoke test.
 *
 * Drives: Practice tab → Arcade card → "Your Croatia" card → Map screen,
 * asserting the region grid + progress render, and screenshots each state.
 * Seeded XP = 1500 (B1) → 4 regions restored (labin/split/zagreb/bibinje).
 *
 * Run: npx playwright test e2e/map-smoke.spec.js --project="Desktop Chrome"
 */
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, mockContent } from './fixtures/seed-auth.js';

test.describe('Map of Croatia — smoke', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page, { xp: 1500 });
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
  });

  test('reach the Map from the Arcade and see restored regions', async ({ page }) => {
    await page.goto('/practice');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 10_000,
    });

    // Practice → Arcade (top card)
    const arcadeCard = page.getByRole('button').filter({ hasText: 'Play Croatian as a game' });
    await expect(arcadeCard).toBeVisible({ timeout: 8_000 });
    await arcadeCard.click();

    // Arcade → Your Croatia card
    const yourCroatia = page.getByTestId('arcade-your-croatia');
    await expect(yourCroatia).toBeVisible({ timeout: 8_000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/map-1-arcade-entry.png' });
    await yourCroatia.click();

    // Map screen — 10 region tiles + progress
    await expect(page.getByText('Vaša Hrvatska')).toBeVisible({ timeout: 8_000 });
    const tiles = page.getByTestId(/^map-region-/);
    await expect(tiles).toHaveCount(10);
    // xp=1500 → labin/split/zagreb/bibinje? bibinje threshold 1800 > 1500 → 3 restored
    await expect(page.getByText('3 / 10')).toBeVisible();
    await expect(page.getByText(/Next:/)).toBeVisible();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'test-results/map-2-map-screen.png' });
  });
});
