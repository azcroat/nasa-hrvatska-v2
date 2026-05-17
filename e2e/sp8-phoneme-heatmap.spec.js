// e2e/sp8-phoneme-heatmap.spec.js
//
// SP8 — phoneme heat map renders after a scored pronunciation; tapping a cell
// shows the popover. Uses mockMediaRecorder to advance the recorder state
// machine without real audio, mockAiPost for /api/pronunciation-assess, and
// TID constants for navigation.
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, mockContent } from './fixtures/seed-auth.js';
import { TID } from './fixtures/testids.js';
import { forceCefr } from './fixtures/forceCefr.js';
import { mockAiPost, CANNED } from './fixtures/mockAiPost.js';
import { mockMediaRecorder } from './fixtures/mockMediaRecorder.js';

test.describe('SP8 — Phoneme Heat Map', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    await forceCefr(page, 'B1');
    await mockMediaRecorder(page);
    await mockAiPost(page, {
      '/api/pronunciation-assess': CANNED.pronunciationAssess,
    });
  });

  test('heat map renders after scored pronunciation; cell click opens popover', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId(TID.NAV_PRACTICE)).toBeVisible({ timeout: 15_000 });
    await page.getByTestId(TID.NAV_PRACTICE).click();
    // Practice tab UX: exercise cards live inside collapsible category tiles
    // (see PracticeTab.tsx browse grid). Need to switch to the Drill panel
    // and expand the Advanced tile before the "speaking_sprint" card is in DOM.
    await page.locator('button').filter({ hasText: /^Drill$/ }).click();
    const advTile = page.locator('button.cat-tile').filter({ hasText: 'Advanced' });
    await advTile.scrollIntoViewIfNeeded();
    await advTile.click();
    // Launch SpeakingScreen via the practice card. The card id matches the
    // PRODUCTION_POOL entry id 'speaking_sprint'.
    await page.getByTestId(TID.EXERCISE_CARD('speaking_sprint')).click();
    // Click the record button. mockMediaRecorder accepts the start immediately;
    // the recorder state machine advances to 'recording' on next tick.
    await page.getByTestId(TID.SPEAKING_RECORD).click();
    // Brief settle so the state advances; mockMediaRecorder fires events
    // synchronously on stop(), so a short timeout is sufficient.
    await page.waitForTimeout(500);
    // Submit triggers the /api/pronunciation-assess POST (stubbed by mockAiPost);
    // the heat map renders from the canned response.
    await page.getByTestId(TID.SPEAKING_SUBMIT).click();
    await expect(page.getByTestId(TID.PHONEME_HEAT_MAP)).toBeVisible({ timeout: 15_000 });
    // Tap the first phoneme cell — the popover with hint should appear.
    await page.getByTestId(TID.PHONEME_CELL).first().click();
    await expect(page.getByRole('tooltip')).toBeVisible({ timeout: 5_000 });
  });
});
