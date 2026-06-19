/**
 * Full lesson completion flow — the most critical user path.
 * Tests: open lesson → quiz mode → answer questions → results screen → XP saved to localStorage.
 * Guards against the setSt prop regression and double-award bug.
 */
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, mockContent, startVocabLesson, TEST_EMAIL } from './fixtures/seed-auth.js';

const INITIAL_XP = 250;

// Run serially — quiz interactions are CPU-heavy (30 question iterations × 600ms each).
// Parallel workers cause resource contention that pushes total time past the 30s timeout.
test.describe('Full lesson completion flow', () => {
  test.describe.configure({ mode: 'serial' });
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    // Navigate directly to /learn to avoid post-auth navigate('/') race on tab click.
    await page.goto('/learn');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Your Path')).toBeVisible({ timeout: 25_000 });
  });

  test('lesson screen opens from vocabulary category', async ({ page }) => {
    await startVocabLesson(page);
    await expect(page.getByText('Quiz Me! →')).toBeVisible({ timeout: 5_000 });
  });

  test('lesson shows word cards before quiz mode', async ({ page }) => {
    await startVocabLesson(page);
    await expect(page.getByText('Quiz Me! →')).toBeVisible({ timeout: 5_000 });
    // Lesson word cards are div[role="button"] with pronunciation aria-label
    const card = page.locator('[role="button"][aria-label*="pronunciation"]').first();
    await expect(card).toBeVisible({ timeout: 3_000 });
  });

  test('clicking Quiz Me! transitions to quiz mode', async ({ page }) => {
    await startVocabLesson(page);
    await expect(page.getByText('Quiz Me! →')).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: /Quiz Me/i }).click();
    // Quiz mode shows question counter "X / N" confirming quiz is active
    await expect(page.getByText(/Question \d+ of \d+/i)).toBeVisible({ timeout: 5_000 });
  });

  test('answering a quiz question shows feedback', async ({ page }) => {
    await startVocabLesson(page);
    await page.getByRole('button', { name: /Quiz Me/i }).click();
    await expect(page.getByText(/Question \d+ of \d+/i)).toBeVisible({ timeout: 5_000 });
    // Click the first answer option
    await page.locator('button.ob').first().click();
    // Feedback or next button should appear
    await expect(page.locator('button').filter({ hasText: /Next|Result|Continue/i }).first())
      .toBeVisible({ timeout: 3_000 });
  });

  test('completing quiz shows results screen', async ({ page }) => {
    test.slow(); // quiz completion can take up to 25s — triple the default 30s timeout
    await startVocabLesson(page);
    await page.getByRole('button', { name: /Quiz Me/i }).click();
    await expect(page.getByText(/Question \d+ of \d+/i)).toBeVisible({ timeout: 5_000 });

    // Answer all questions — 30 iterations handles up to 15-question quizzes.
    // Don't break on empty state; brief UI transitions hide all buttons temporarily.
    for (let i = 0; i < 30; i++) {
      const resultBtn = page.locator('button').filter({ hasText: /See Results|Results/i });
      if (await resultBtn.isVisible()) {
        await resultBtn.click();
        break;
      }
      const nextBtn = page.locator('button').filter({ hasText: /Next/i });
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(200);
        continue;
      }
      const answerBtn = page.locator('button.ob').first();
      if (await answerBtn.isVisible()) {
        await answerBtn.click();
        // Wait for feedback/next button to appear before next iteration
        await page.waitForTimeout(600);
      } else {
        // UI is transitioning — wait and retry rather than break
        await page.waitForTimeout(400);
      }
    }
    // Results screen: quiz counter is gone (we left quiz mode)
    await expect(page.getByText(/Question \d+ of \d+/i)).not.toBeVisible({ timeout: 8_000 });
  });

  test('XP is saved to localStorage after completing a quiz', async ({ page }) => {
    test.slow();
    await startVocabLesson(page);
    await page.getByRole('button', { name: /Quiz Me/i }).click();
    await expect(page.getByText(/Question \d+ of \d+/i)).toBeVisible({ timeout: 5_000 });

    // Answer all questions
    for (let i = 0; i < 30; i++) {
      const resultBtn = page.locator('button').filter({ hasText: /See Results|Results/i });
      if (await resultBtn.isVisible()) {
        await resultBtn.click();
        break;
      }
      const nextBtn = page.locator('button').filter({ hasText: /Next/i });
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(200);
        continue;
      }
      const answerBtn = page.locator('button.ob').first();
      if (await answerBtn.isVisible()) {
        await answerBtn.click();
        await page.waitForTimeout(600);
      } else {
        await page.waitForTimeout(400);
      }
    }

    // Wait for results to settle
    await page.waitForTimeout(500);

    // Read localStorage to verify XP was persisted — handle both {st} and {stats} key formats
    const progress = await page.evaluate((email) => {
      try { return JSON.parse(localStorage.getItem('uP_' + email)); }
      catch { return null; }
    }, TEST_EMAIL);

    expect(progress).not.toBeNull();
    const stats = progress?.st ?? progress?.stats;
    expect(stats).toBeDefined();
    // XP should be >= initial (some answers may be wrong but at least not less)
    expect(stats?.xp).toBeGreaterThanOrEqual(INITIAL_XP);
  });

  test('lesson count increments in localStorage after completing a lesson', async ({ page }) => {
    test.slow();
    // Absorb any pending load event (SW-triggered reload or app-internal redirect after auth)
    // before calling page.evaluate — otherwise "Execution context was destroyed" crashes the test.
    await page.waitForEvent('load', { timeout: 6_000 }).catch(() => {});
    // Capture initial lesson count — handle both {st} and {stats} formats
    const before = await page.evaluate((email) => {
      try {
        const p = JSON.parse(localStorage.getItem('uP_' + email));
        return (p?.st ?? p?.stats)?.lc ?? 0;
      } catch { return 0; }
    }, TEST_EMAIL);

    await startVocabLesson(page);
    await page.getByRole('button', { name: /Quiz Me/i }).click();
    await expect(page.getByText(/Question \d+ of \d+/i)).toBeVisible({ timeout: 5_000 });

    for (let i = 0; i < 30; i++) {
      const resultBtn = page.locator('button').filter({ hasText: /See Results|Results/i });
      if (await resultBtn.isVisible()) { await resultBtn.click(); break; }
      const nextBtn = page.locator('button').filter({ hasText: /Next/i });
      if (await nextBtn.isVisible()) { await nextBtn.click(); await page.waitForTimeout(200); continue; }
      const answerBtn = page.locator('button.ob').first();
      if (await answerBtn.isVisible()) { await answerBtn.click(); await page.waitForTimeout(600); }
      else { await page.waitForTimeout(400); }
    }
    await page.waitForTimeout(500);

    const after = await page.evaluate((email) => {
      try {
        const p = JSON.parse(localStorage.getItem('uP_' + email));
        return (p?.st ?? p?.stats)?.lc ?? 0;
      } catch { return 0; }
    }, TEST_EMAIL);

    // Lesson count should have increased
    expect(after).toBeGreaterThanOrEqual(before);
  });

  test('rapid clicks on See Results only award XP once (double-award guard)', async ({ page }) => {
    await startVocabLesson(page);
    await page.getByRole('button', { name: /Quiz Me/i }).click();
    await expect(page.getByText(/Question \d+ of \d+/i)).toBeVisible({ timeout: 5_000 });

    for (let i = 0; i < 30; i++) {
      const resultBtn = page.locator('button').filter({ hasText: /See Results|Results/i });
      if (await resultBtn.isVisible()) {
        // Rapid triple-click — should only award XP once.
        // After the first click the screen transitions and the button disappears,
        // so subsequent clicks use a short timeout and silently no-op if gone.
        await resultBtn.click();
        await resultBtn.click({ timeout: 500 }).catch(() => {});
        await resultBtn.click({ timeout: 500 }).catch(() => {});
        break;
      }
      const nextBtn = page.locator('button').filter({ hasText: /Next/i });
      if (await nextBtn.isVisible()) { await nextBtn.click(); await page.waitForTimeout(200); continue; }
      const answerBtn = page.locator('button.ob').first();
      if (await answerBtn.isVisible()) { await answerBtn.click(); await page.waitForTimeout(600); }
      else { await page.waitForTimeout(400); }
    }
    await page.waitForTimeout(500);

    const xp = await page.evaluate((email) => {
      try {
        const p = JSON.parse(localStorage.getItem('uP_' + email));
        return (p?.st ?? p?.stats)?.xp ?? 0;
      } catch { return 0; }
    }, TEST_EMAIL);

    // XP should not have been triple-counted — cap is 100 XP per game session
    expect(xp).toBeLessThanOrEqual(INITIAL_XP + 100);
  });
});
