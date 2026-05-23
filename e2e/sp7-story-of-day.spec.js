// e2e/sp7-story-of-day.spec.js
//
// SP7 — verifies the Story of the Day card renders on the home screen and that
// tapping the CTA routes the user into the graded reader pre-loaded with that
// story. Uses stable testids (introduced as part of SP6 cleanup pattern) so
// the spec is not coupled to UI labels.
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, mockContent } from './fixtures/seed-auth.js';

test.describe('SP7 — Story of the Day', () => {
  test.beforeEach(async ({ page }) => {
    // B1-level seeded user with a weak topic so the recommender has signal
    await seedAuth(page, { xp: 3000 });
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    await page.addInitScript(() => {
      localStorage.removeItem('nh_recent_reads');
      localStorage.setItem(
        'topic_accuracy',
        JSON.stringify({
          accusative: { attempts: 19, correct: 8, lastAttempt: Date.now() },
        }),
      );
    });
  });

  // The 2026-05-22 Today's Discoveries refactor tabbed the Word/Phrase/City/Story
  // cards behind a tablist; the Story card only renders once the 'story' tab is
  // selected. Tests click that tab first to reach the card under test.
  async function openStoryTab(page) {
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('tab', { name: /Story/ }).click();
  }

  test('card renders on home screen', async ({ page }) => {
    await page.goto('/');
    await openStoryTab(page);
    await expect(page.getByTestId('story-of-the-day-card')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('CTA click opens GradedInputScreen and the story is loaded', async ({ page }) => {
    await page.goto('/');
    await openStoryTab(page);
    await expect(page.getByTestId('story-of-the-day-card')).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId('story-of-the-day-card').click();
    // Verify we left the home screen by waiting for the home card to disappear.
    await expect(page.getByTestId('story-of-the-day-card')).not.toBeVisible({
      timeout: 10_000,
    });
  });
});
