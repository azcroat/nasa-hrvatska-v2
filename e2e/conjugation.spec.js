/**
 * Conjugation in Today's Session — E2E navigation smoke.
 *
 * Conjugation surfaces as an adaptive grammar topic. We seed the present-tense
 * category as overdue so it becomes the session's first (Priority-2) activity,
 * then Begin Session launches the conjugation drill directly.
 *
 * Locators verified against source (2026-06-10):
 *   - SessionCard "Begin Session" CTA
 *   - ConjugationDrillEngine → data-testid="conj-option" / "conj-feedback"
 *
 * The drill render+scoring is also covered headlessly by
 * src/tests/conjugation-session-drill.test.tsx + conjugation-engine.test.tsx.
 */
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, mockContent } from './fixtures/seed-auth.js';

test.describe('Conjugation in Today\'s Session', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page); // A2 user, sr:{} → no due word reviews → adaptive grammar is first
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page); // serve /api/content/grammar (incl. VERBS) so the drill hydrates
    // Make present-tense the adaptive pick. getDueCategoryQueue treats any category
    // with no stored card as due (due ?? 0 <= now) and orders the "due" bucket by
    // ALL_CATEGORIES order — where the noun-case categories precede present-tense.
    // So push those cases to a future due date; present-tense (due in the past) then
    // becomes the first eligible adaptive topic.
    await page.addInitScript(() => {
      const future = Date.now() + 7 * 86400000;
      const seen = (due) => ({ stability: 5, recentAccuracy: 0.9, due, lastSeen: 1 });
      localStorage.setItem(
        'nh_cat_sr',
        JSON.stringify({
          genitive: seen(future),
          accusative: seen(future),
          'dative-locative': seen(future),
          instrumental: seen(future),
          vocative: seen(future),
          'present-tense': { stability: 1, recentAccuracy: 0.2, due: 1, lastSeen: 1 },
        }),
      );
    });
  });

  test('Home no longer shows the standalone conjugation card', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-daily-conjugation')).toHaveCount(0);
  });

  test('Begin Session reaches the conjugation drill', async ({ page }) => {
    await page.goto('/');
    // The session CTA reads "Begin Session" or, once an activity is done, "Continue Session".
    // The next activity (▶) is the present-tense conjugation drill (seeded as due above).
    const begin = page.getByRole('button', { name: /Begin Session|Continue Session/ });
    await expect(begin).toBeVisible({ timeout: 15_000 });
    await begin.click();

    const options = page.getByTestId('conj-option');
    await expect(options).toHaveCount(4, { timeout: 15_000 });
    await options.first().click();
    await expect(page.getByTestId('conj-feedback')).toBeVisible({ timeout: 5_000 });
  });
});
