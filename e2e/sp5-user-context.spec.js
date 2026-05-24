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

  test('writing submit POST to /api/correct includes a v1 userContext payload', async ({
    page,
  }) => {
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
          changes: [{ original: 'mama', corrected: 'majku', note: 'Accusative ending.' }],
          strengths: ['Good sentence structure'],
          improvements: ['Practice accusative endings'],
          encouragement: 'Bravo!',
        }),
      });
    });

    // AI Writing Feedback now lives exclusively on the AI Tutor tab, so this
    // test navigates there directly instead of going through Practice →
    // Drill → Advanced (the writing card was removed from PracticeTab).
    await page.goto('/ai');
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 20_000,
    });
    const writingCard = page.locator('button').filter({ hasText: 'AI Writing Feedback' }).first();
    await expect(writingCard).toBeVisible({ timeout: 20_000 });
    await writingCard.click();
    // Confirm WritingScreen mounted and textarea is interactable before fill —
    // card click triggers a lazy chunk; without this wait the fill can race
    // the React mount and the controlled-input state never registers the
    // value, leaving checkWithAI() to bail at its `text.trim().length < 10`
    // guard and never firing the POST that the test waits for.
    await expect(page.getByTestId(TID.WRITING_INPUT)).toBeVisible({ timeout: 15_000 });
    const writingText = 'Imam mama svaki dan svaki dan svaki dan svaki dan.';
    await page.getByTestId(TID.WRITING_INPUT).fill(writingText);
    await expect(page.getByTestId(TID.WRITING_INPUT)).toHaveValue(writingText);
    // Re-seed nh_recent_errors right before submit. WritingScreen.checkWithAI
    // logs corrections to nh_learner_errors (different key) but App startup +
    // various screen lifecycles can mutate nh_recent_errors via
    // appendRecentError. Ensure the assertion at line 97 sees exactly the
    // 'accusative' entry we seeded in beforeEach, not whatever else may have
    // accumulated during navigation.
    await page.evaluate(() => {
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
      // Also re-stamp profile.st.xp=2000 (B1). App.tsx's auto-save effect can
      // clobber forceCefr's addInitScript value with DS={xp:0} during the
      // brief mount window, and buildUserContext.readLevel() reads
      // localStorage directly. This guarantees cefr resolves to B1 at the
      // exact moment of submit.
      const uS = JSON.parse(localStorage.getItem('uS') || '{}');
      const email = uS.u;
      if (email) {
        const profileKey = 'uP_' + email;
        const profile = JSON.parse(localStorage.getItem(profileKey) || '{}');
        profile.st = { ...(profile.st || {}), xp: 2000, lc: 0, gc: 0 };
        localStorage.setItem(profileKey, JSON.stringify(profile));
      }
    });
    // Set up waitForRequest BEFORE the click so an in-flight POST cannot slip past.
    const correctRequest = page.waitForRequest('**/api/correct', { timeout: 15_000 });
    // KnightCompanion's `kn-breathe`/`kn-aura-pulse` infinite CSS animations
    // false-positive Playwright's bbox-stability gate on writing-submit
    // (see f7eb120 / accessibility.spec.js navigateAndSubmit for full diagnosis).
    // Dispatch via DOM to bypass the stability check; React onClick still fires.
    await page.getByTestId(TID.WRITING_SUBMIT).evaluate((el) => el.click());
    await correctRequest;
    // waitForRequest resolves when the request is initiated, which can be BEFORE
    // the route handler's bodies.push() runs. Poll the bodies array so we don't
    // assert on an empty array just because the route handler hasn't fired yet.
    await expect
      .poll(() => bodies.length, { timeout: 5_000, message: 'route handler captured POST body' })
      .toBeGreaterThan(0);

    expect(bodies.length, 'expected at least one /api/correct POST body captured').toBeGreaterThan(
      0,
    );
    const body = bodies[bodies.length - 1];
    expect(body.userContext, 'expected userContext field on body').toBeDefined();
    expect(body.userContext.version).toBe(1);
    expect(body.userContext.level.cefr).toBe('B1');
    expect(body.userContext.recentErrors.length).toBeGreaterThan(0);
    expect(body.userContext.recentErrors[0].topic).toBe('accusative');
  });
});
