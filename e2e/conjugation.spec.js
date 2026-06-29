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
    // Make present-tense the adaptive pick. getDueCategoryQueue uses a coverage
    // floor: a category not practised within ~14 days (or never seen) is "starved"
    // and promoted to the front, most-neglected first. So seed EVERY category as
    // recently practised and not due, and leave only present-tense starved (last
    // seen 30 days ago) — it becomes the sole front-of-queue adaptive topic and
    // routes to conjpractice.
    await page.addInitScript(() => {
      const now = Date.now();
      const recent = { stability: 5, recentAccuracy: 0.9, due: now + 7 * 86400000, lastSeen: now };
      localStorage.setItem(
        'nh_cat_sr',
        JSON.stringify({
          genitive: recent,
          accusative: recent,
          'dative-locative': recent,
          instrumental: recent,
          vocative: recent,
          'past-tense': recent,
          'future-tense': recent,
          'aspect-imperfective': recent,
          'aspect-perfective': recent,
          'aspect-negation': recent,
          conditional: recent,
          clitics: recent,
          'vocab-a2': recent,
          'vocab-b1': recent,
          'vocab-b2': recent,
          speaking: recent,
          'present-tense': { stability: 1, recentAccuracy: 0.2, due: 1, lastSeen: now - 30 * 86400000 },
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
