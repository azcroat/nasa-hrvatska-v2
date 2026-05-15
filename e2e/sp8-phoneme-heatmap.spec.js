// e2e/sp8-phoneme-heatmap.spec.js
//
// SP8 — phoneme heat map e2e scaffold. The unit + integration tests (16 tests)
// are the load-bearing coverage for SP8. This e2e is a minimal smoke that
// confirms the app boots; the full UI-flow assertion requires stable testids
// on the pronunciation submit path (SP8b cleanup).
//
// Uses stable testids `phoneme-heat-map`, `phoneme-cell`, `word-heat-card`
// so when the SP8b stable testids land, this spec can be expanded without
// breaking changes to selectors.
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS } from './fixtures/seed-auth.js';

test.describe('SP8 — Phoneme Heat Map', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page, { xp: 3000 });
    await blockFirebase(page);
    await mockTTS(page);
    // Stub the Azure assessment endpoint with a canned response so that any
    // future expansion of this test can trigger a heat-map render without
    // needing real audio capture.
    await page.route('**/api/pronunciation-assess', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          overall: 82,
          accuracy: 85,
          fluency: 80,
          completeness: 90,
          prosody: 75,
          word_scores: [
            {
              word: 'pas',
              score: 88,
              phonemes: [
                { phoneme: 'p', score: 95 },
                { phoneme: 'a', score: 90 },
                { phoneme: 's', score: 80 },
              ],
            },
          ],
        }),
      });
    });
  });

  test('app boots and home navigation renders (SP8 heat map e2e scaffold)', async ({ page }) => {
    // FIXME (SP8b): expand this test once stable testids land on the
    // pronunciation submit path. Then the assertion chain becomes:
    //
    //   navigate to SpeakingPracticePanel or similar
    //   click record / submit
    //   await expect(page.getByTestId('phoneme-heat-map')).toBeVisible();
    //   await page.getByTestId('phoneme-cell').first().click();
    //   await expect(page.getByRole('tooltip')).toBeVisible();
    //
    // For now: smoke that the app boots without breaking. The unit + integration
    // tests (16 tests) carry the SP8 acceptance load.
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
  });
});
