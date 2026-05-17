// e2e/sp4b-production-slot.spec.js
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, mockContent } from './fixtures/seed-auth.js';
import { TID } from './fixtures/testids.js';
import { forceCefr } from './fixtures/forceCefr.js';
import { mockRnd } from './fixtures/mockRnd.js';

test.describe('SP4b — production slot in daily session', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    await forceCefr(page, 'B1');     // deterministic CEFR
    await mockRnd(page, 0);          // deterministic selectProductionExercise pick
  });

  test('daily session contains the expected production exercise (mic available)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('nh_mic_state', 'available');
    });
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
    // With rnd=0 + mic-available + B1, selectProductionExercise picks the first
    // PRODUCTION_POOL member that's CEFR-unlocked. PRODUCTION_POOL begins with
    // `speaking_sprint` (label "Speaking Sprint") so that chip must be visible.
    await expect(page.getByText('Speaking Sprint')).toBeVisible({ timeout: 15_000 });
  });

  test('mic-denied user sees keyboard-only production label', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('nh_mic_state', 'denied');
    });
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
    // With mic-denied + B1, selectProductionExercise filters to writing+dictation.
    // With rnd=0, the first eligible wins — 'writing' (label "Free Writing").
    await expect(page.getByText('Free Writing')).toBeVisible({ timeout: 15_000 });
  });
});
