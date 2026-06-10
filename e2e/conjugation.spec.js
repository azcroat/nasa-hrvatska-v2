/**
 * Conjugation Lab E2E — Verb Conjugation Curriculum.
 *
 * SKIPPED until go-live. To enable:
 *   1. Set CONJ_LAB_ENABLED = true in src/lib/conjugation/conjugationConfig.ts
 *      (or add a runtime force hook like checkpoints' window.__NH_CHECKPOINTS_FORCE__
 *      and force it here via page.addInitScript).
 *   2. Change `test.describe.skip` → `test.describe`.
 *   3. VERIFY every locator below against the real rendered output first — a wrong
 *      locator turns a flake into a hard failure (see the PR #24 error-boundary lesson).
 *
 * The drill engine's render + scoring is already covered by the unit/component test
 * src/tests/conjugation-engine.test.tsx; this is an end-to-end navigation smoke.
 */
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS } from './fixtures/seed-auth.js';

test.describe.skip('Conjugation Lab', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
  });

  test('daily set: answer a question and see feedback', async ({ page }) => {
    await page.goto('/');
    // Navigate: Practice tab → Conjugation Lab catalog card → Daily Conjugation Set.
    // (Verify these locators against the running app before un-skipping.)
    await page.getByText('Conjugation Lab').first().click();
    await page.getByTestId('conj-daily-start').click();

    const options = page.getByTestId('conj-option');
    await expect(options).toHaveCount(4);
    await options.first().click();
    await expect(page.getByTestId('conj-feedback')).toBeVisible();
  });
});
