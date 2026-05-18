// e2e/sp5-user-context.spec.js
//
// SP5 — verifies the user-context payload is attached to a real /api/correct
// POST. Drives the actual Writing screen UI via SP6/SP10 testids.
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, mockContent } from './fixtures/seed-auth.js';
import { TID } from './fixtures/testids.js';
import { forceCefr } from './fixtures/forceCefr.js';

test.describe('SP5 — user-context payload at /api/correct', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    await forceCefr(page, 'B1');
    await page.addInitScript(() => {
      const fiveMinAgo = Date.now() - 5 * 60 * 1000;
      localStorage.setItem(
        'nh_recent_errors',
        JSON.stringify([
          {
            topic: 'accusative',
            prompt: 'Vidim ____ knjigu',
            userAnswer: 'knjiga',
            correctAnswer: 'knjigu',
            at: fiveMinAgo,
          },
        ]),
      );
      localStorage.setItem(
        'topic_accuracy',
        JSON.stringify({
          accusative: { attempts: 19, correct: 8, lastAttempt: Date.now() },
        }),
      );
    });
  });

  test('writing submit POST to /api/correct includes a v1 userContext payload', async ({ page }) => {
    const bodies = [];
    await page.route('**/api/correct', async (route) => {
      try {
        bodies.push(JSON.parse(route.request().postData() ?? '{}'));
      } catch {
        bodies.push({ _parseError: true });
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          corrected_text: 'Imam majku i tatu svaki dan svaki dan svaki dan.',
          score: 80,
          level_demonstrated: 'B1 - Intermediate',
          changes: [
            { original: 'mama', corrected: 'majku', note: 'Accusative ending.' },
          ],
          strengths: ['Good sentence structure'],
          improvements: ['Practice accusative endings'],
          encouragement: 'Bravo!',
        }),
      });
    });

    await page.goto('/');
    await expect(page.getByTestId(TID.NAV_PRACTICE)).toBeVisible({ timeout: 15_000 });
    await page.getByTestId(TID.NAV_PRACTICE).click();
    // Use Drill → Advanced tile to reach the writing card (proven path in
    // practice.spec.js:125). Wait for the tile to actually expand before
    // looking for the specific card.
    await page.locator('button').filter({ hasText: /^Drill$/ }).click();
    const advTile = page.locator('button.cat-tile').filter({ hasText: 'Advanced' });
    await advTile.scrollIntoViewIfNeeded();
    await advTile.click();
    await expect(advTile).toHaveAttribute('aria-expanded', 'true', { timeout: 5_000 });
    // 20s timeout: covers the React MERGE_REMOTE hydration window where stats
    // transition from DS=A1 to the forceCefr-seeded B1, which is when the
    // writing card (cefr 'B1') joins availableExercises and appears in DOM.
    const writingCard = page.getByTestId(TID.EXERCISE_CARD('writing'));
    await expect(writingCard).toBeVisible({ timeout: 20_000 });
    await writingCard.scrollIntoViewIfNeeded();
    await writingCard.click();
    // Confirm WritingScreen mounted and textarea is interactable before fill —
    // exercise-card click triggers a lazy chunk; without this wait the fill can
    // race the React mount and the controlled-input state never registers the
    // value, leaving checkWithAI() to bail at its `text.trim().length < 10`
    // guard and never firing the POST that the test waits for.
    await expect(page.getByTestId(TID.WRITING_INPUT)).toBeVisible({ timeout: 10_000 });
    const writingText = 'Imam mama svaki dan svaki dan svaki dan svaki dan.';
    await page.getByTestId(TID.WRITING_INPUT).fill(writingText);
    await expect(page.getByTestId(TID.WRITING_INPUT)).toHaveValue(writingText);
    // Set up waitForRequest BEFORE the click so an in-flight POST cannot slip past.
    const correctRequest = page.waitForRequest('**/api/correct', { timeout: 15_000 });
    await page.getByTestId(TID.WRITING_SUBMIT).click();
    await correctRequest;

    expect(bodies.length, 'expected at least one /api/correct POST body captured').toBeGreaterThan(0);
    const body = bodies[bodies.length - 1];
    expect(body.userContext, 'expected userContext field on body').toBeDefined();
    expect(body.userContext.version).toBe(1);
    expect(body.userContext.level.cefr).toBe('B1');
    expect(body.userContext.recentErrors.length).toBeGreaterThan(0);
    expect(body.userContext.recentErrors[0].topic).toBe('accusative');
  });
});
