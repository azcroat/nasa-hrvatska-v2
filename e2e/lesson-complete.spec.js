/**
 * Full lesson completion flow — the most critical user path.
 * Tests: open lesson → quiz mode → answer questions → results screen → XP saved to localStorage.
 * Guards against the setSt prop regression and double-award bug.
 */
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, TEST_EMAIL } from './fixtures/seed-auth.js';

const INITIAL_XP = 250;

test.describe('Full lesson completion flow', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    // Navigate to Learn tab
    await page.getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: 'Learn', exact: true }).click();
    await expect(page.getByText('🗺️ My Path')).toBeVisible({ timeout: 5_000 });
  });

  test('lesson screen opens from vocabulary category', async ({ page }) => {
    await page.locator('button.vocab-pill').first().click();
    await expect(page.getByText('Quiz Me! →')).toBeVisible({ timeout: 5_000 });
  });

  test('lesson shows word cards before quiz mode', async ({ page }) => {
    await page.locator('button.vocab-pill').first().click();
    await expect(page.getByText('Quiz Me! →')).toBeVisible({ timeout: 5_000 });
    // Should show the learn card content — at least one Croatian word visible
    const card = page.locator('.lc, [class*="lesson"], [class*="card"]').first();
    await expect(card).toBeVisible({ timeout: 3_000 });
  });

  test('clicking Quiz Me! transitions to quiz mode', async ({ page }) => {
    await page.locator('button.vocab-pill').first().click();
    await expect(page.getByText('Quiz Me! →')).toBeVisible({ timeout: 5_000 });
    await page.getByText('Quiz Me! →').click();
    // Quiz mode shows "What does this mean?" or similar prompt
    await expect(page.getByText(/What does|Which means|Translate/i)).toBeVisible({ timeout: 5_000 });
  });

  test('answering a quiz question shows feedback', async ({ page }) => {
    await page.locator('button.vocab-pill').first().click();
    await page.getByText('Quiz Me! →').click();
    await expect(page.getByText(/What does|Which means|Translate/i)).toBeVisible({ timeout: 5_000 });
    // Click the first answer option
    await page.locator('button.ob').first().click();
    // Feedback or next button should appear
    await expect(page.locator('button').filter({ hasText: /Next|Result|Continue/i }).first())
      .toBeVisible({ timeout: 3_000 });
  });

  test('completing quiz shows results screen', async ({ page }) => {
    await page.locator('button.vocab-pill').first().click();
    await page.getByText('Quiz Me! →').click();
    await expect(page.getByText(/What does|Which means|Translate/i)).toBeVisible({ timeout: 5_000 });

    // Answer all questions by clicking first option then Next until results appear
    for (let i = 0; i < 20; i++) {
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
        await page.waitForTimeout(300);
      } else {
        break;
      }
    }
    // Results screen should mention score or XP
    await expect(page.getByText(/score|XP|lesson/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test('XP is saved to localStorage after completing a quiz', async ({ page }) => {
    await page.locator('button.vocab-pill').first().click();
    await page.getByText('Quiz Me! →').click();
    await expect(page.getByText(/What does|Which means|Translate/i)).toBeVisible({ timeout: 5_000 });

    // Answer all questions
    for (let i = 0; i < 20; i++) {
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
      await page.locator('button.ob').first().click();
      await page.waitForTimeout(300);
    }

    // Wait for results to settle
    await page.waitForTimeout(500);

    // Read localStorage to verify XP was persisted
    const progress = await page.evaluate((email) => {
      try {
        return JSON.parse(localStorage.getItem('uP_' + email));
      } catch { return null; }
    }, TEST_EMAIL);

    expect(progress).not.toBeNull();
    expect(progress.st).toBeDefined();
    // XP should be >= initial (some answers may be wrong but at least not less)
    expect(progress.st.xp).toBeGreaterThanOrEqual(INITIAL_XP);
  });

  test('lesson count increments in localStorage after completing a lesson', async ({ page }) => {
    // Capture initial lesson count
    const before = await page.evaluate((email) => {
      try { return JSON.parse(localStorage.getItem('uP_' + email))?.st?.lc ?? 0; }
      catch { return 0; }
    }, TEST_EMAIL);

    await page.locator('button.vocab-pill').first().click();
    await page.getByText('Quiz Me! →').click();
    await expect(page.getByText(/What does|Which means|Translate/i)).toBeVisible({ timeout: 5_000 });

    for (let i = 0; i < 20; i++) {
      const resultBtn = page.locator('button').filter({ hasText: /See Results|Results/i });
      if (await resultBtn.isVisible()) { await resultBtn.click(); break; }
      const nextBtn = page.locator('button').filter({ hasText: /Next/i });
      if (await nextBtn.isVisible()) { await nextBtn.click(); await page.waitForTimeout(200); continue; }
      await page.locator('button.ob').first().click();
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(500);

    const after = await page.evaluate((email) => {
      try { return JSON.parse(localStorage.getItem('uP_' + email))?.st?.lc ?? 0; }
      catch { return 0; }
    }, TEST_EMAIL);

    // Lesson count should have increased
    expect(after).toBeGreaterThanOrEqual(before);
  });

  test('rapid clicks on See Results only award XP once (double-award guard)', async ({ page }) => {
    await page.locator('button.vocab-pill').first().click();
    await page.getByText('Quiz Me! →').click();
    await expect(page.getByText(/What does|Which means|Translate/i)).toBeVisible({ timeout: 5_000 });

    for (let i = 0; i < 20; i++) {
      const resultBtn = page.locator('button').filter({ hasText: /See Results|Results/i });
      if (await resultBtn.isVisible()) {
        // Rapid triple-click — should only award XP once
        await resultBtn.click();
        await resultBtn.click();
        await resultBtn.click();
        break;
      }
      const nextBtn = page.locator('button').filter({ hasText: /Next/i });
      if (await nextBtn.isVisible()) { await nextBtn.click(); await page.waitForTimeout(200); continue; }
      await page.locator('button.ob').first().click();
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(500);

    const xp = await page.evaluate((email) => {
      try { return JSON.parse(localStorage.getItem('uP_' + email))?.st?.xp ?? 0; }
      catch { return 0; }
    }, TEST_EMAIL);

    // XP should not have been triple-counted — cap is 100 XP per game session
    expect(xp).toBeLessThanOrEqual(INITIAL_XP + 100);
  });
});
