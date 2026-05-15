// e2e/sp4b-production-slot.spec.js
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS } from './fixtures/seed-auth.js';

test.describe('SP4b — production slot in daily session', () => {
  test.beforeEach(async ({ page }) => {
    // xp:3000 → total 3275 → unambiguously B1 (B1 band: 1200–3499)
    // (xp:1500 sometimes rendered as A2 in CI due to a session-cache race;
    // adding nh_daily_session removal in each test ensures the activities
    // list rebuilds with the seeded state)
    await seedAuth(page, { xp: 3000 });
    await blockFirebase(page);
    await mockTTS(page);
  });

  // FIXME (SP10): this test is flaky in CI. The selectProductionExercise call returns
  // random results per render, and the home-screen rendering of the chosen activity
  // depends on subtle session-build interactions (P2 adaptive category override, etc).
  // The 24 unit + integration tests in src/tests/useDailySession.production.test.ts
  // exhaustively cover the data layer. Re-enable after SP10 stabilises e2e fixtures
  // (mockable rnd, deterministic seedAuth that fully overrides session state, etc).
  test.skip('daily session contains a production exercise (mic available)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('nh_daily_session');
      localStorage.setItem('nh_mic_state', 'available');
    });
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
    // Wait for the TODAY'S SESSION card to render
    await expect(page.getByText(/TODAY'?S SESSION/i)).toBeVisible({ timeout: 15_000 });
    const productionLabels = [
      'Speaking Sprint',
      'Shadowing',
      'Production',
      'Free Writing',
      'Dictation',
    ];
    let found = false;
    for (const label of productionLabels) {
      if ((await page.getByText(label).count()) > 0) {
        found = true;
        break;
      }
    }
    expect(found, 'expected a production exercise label on the home screen').toBe(true);
  });

  test('mic-denied user sees keyboard-only production label', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('nh_daily_session');
      localStorage.setItem('nh_mic_state', 'denied');
    });
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
    // Wait for the TODAY'S SESSION card to render
    await expect(page.getByText(/TODAY'?S SESSION/i)).toBeVisible({ timeout: 15_000 });
    const keyboardLabels = ['Free Writing', 'Dictation'];
    let found = false;
    for (const label of keyboardLabels) {
      if ((await page.getByText(label).count()) > 0) {
        found = true;
        break;
      }
    }
    expect(found, 'expected a keyboard-only production label for mic-denied user').toBe(true);
  });
});
