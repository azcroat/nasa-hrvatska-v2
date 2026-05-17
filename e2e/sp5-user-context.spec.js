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
    // Practice tab UX: exercise cards live inside collapsible category tiles
    // (see PracticeTab.tsx browse grid). Need to switch to the Drill panel
    // and expand the Advanced tile before the "writing" card is in the DOM.
    await page.locator('button').filter({ hasText: /^Drill$/ }).click();
    const advTile = page.locator('button.cat-tile').filter({ hasText: 'Advanced' });
    await advTile.scrollIntoViewIfNeeded();
    await advTile.click();
    await page.getByTestId(TID.EXERCISE_CARD('writing')).click();
    // Confirm WritingScreen mounted and textarea is interactable before fill —
    // exercise-card click triggers a lazy chunk; without this wait the fill can
    // race the React mount and the controlled-input state never registers the
    // value, leaving checkWithAI() to bail at its `text.trim().length < 10`
    // guard and never firing the POST that the test waits for.
    await expect(page.getByTestId(TID.WRITING_INPUT)).toBeVisible({ timeout: 10_000 });
    const writingText = 'Imam mama svaki dan svaki dan svaki dan svaki dan.';
    await page.getByTestId(TID.WRITING_INPUT).fill(writingText);
    await expect(page.getByTestId(TID.WRITING_INPUT)).toHaveValue(writingText);
    // Re-stamp profile.st and nh_recent_errors right before submit.
    //
    // Why: in test-only environments we seed an authenticated session via
    // localStorage (uS/uA/uP_) and forceCefr() patches profile.st via
    // addInitScript. App.tsx's auto-save useEffect (line 1159) writes
    // React state -> uP_<email> on every dependency change. During the
    // brief window between initial render (stats=DS={xp:0}) and useAuth's
    // MERGE_REMOTE dispatching from the seeded localStorage, the
    // useEffect can clobber forceCefr's values with the DS defaults.
    // readLevel() in src/lib/userContext.ts reads localStorage DIRECTLY,
    // so if buildUserContext() runs during that window the cefr falls
    // back to A1. In production this window doesn't exist: real Firebase
    // auth delivers a non-empty `progress` payload synchronously with
    // the auth state change. Re-stamping here guarantees the seeded
    // values are present at the exact moment readLevel() runs.
    await page.evaluate(() => {
      const uS = JSON.parse(localStorage.getItem('uS') || '{}');
      const email = uS.u;
      if (!email) return;
      const profileKey = 'uP_' + email;
      const profile = JSON.parse(localStorage.getItem(profileKey) || '{}');
      profile.st = { ...(profile.st || {}), xp: 2000, lc: 0, gc: 0 };
      localStorage.setItem(profileKey, JSON.stringify(profile));
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
    });
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
