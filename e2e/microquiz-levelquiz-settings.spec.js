/**
 * FIX-16: Playwright verification of MicroQuiz/LevelQuiz/Settings flows.
 *
 * Three integration concerns covered here that the unit tests cannot:
 *
 *   1. Settings → "Quick checks during lessons" toggle persists to
 *      localStorage as 'nh_microquiz_enabled' and survives a full reload.
 *   2. LearnPath surfaces the "Take Level Quiz →" CTA when a level is
 *      ≥80% complete and its quiz has not yet been passed.
 *   3. Clicking that CTA mounts the LevelQuiz screen with 10 questions.
 */
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, mockContent } from './fixtures/seed-auth.js';

// ──────────────────────────────────────────────────────────────────────────────
// Settings toggle persistence
// ──────────────────────────────────────────────────────────────────────────────

test.describe('FIX-16 — Settings: MicroQuiz toggle persistence', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    await page.goto('/profile');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
    await page.locator('.profile-tab-pill').filter({ hasText: 'Settings' }).click();
    // Wait for Settings content to render
    await expect(page.getByText('🧠 Quick checks during lessons')).toBeVisible({ timeout: 5_000 });
  });

  test('toggle has aria-checked=true by default (opt-out semantics)', async ({ page }) => {
    const toggle = page
      .getByText('🧠 Quick checks during lessons')
      .locator('..')
      .locator('..')
      .getByRole('switch');
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  test('clicking the toggle flips aria-checked and writes localStorage', async ({ page }) => {
    const toggle = page
      .getByText('🧠 Quick checks during lessons')
      .locator('..')
      .locator('..')
      .getByRole('switch');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');

    const stored = await page.evaluate(() => localStorage.getItem('nh_microquiz_enabled'));
    expect(stored).toBe('false');
  });

  test('toggle state survives a full page reload', async ({ page }) => {
    const toggle = page
      .getByText('🧠 Quick checks during lessons')
      .locator('..')
      .locator('..')
      .getByRole('switch');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');

    await page.reload();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
    await page.locator('.profile-tab-pill').filter({ hasText: 'Settings' }).click();
    const toggleAfter = page
      .getByText('🧠 Quick checks during lessons')
      .locator('..')
      .locator('..')
      .getByRole('switch');
    await expect(toggleAfter).toHaveAttribute('aria-checked', 'false', { timeout: 5_000 });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// LevelQuiz CTA visibility + screen mount
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Seed a user whose `vs[]` covers every learn-path item in level 1.
 * The CTA shows when levelDone >= ceil(level.items.length * 0.8) and the
 * quiz has not yet been passed. Including every lp1_*, lp2_*, lp3_*, ...
 * tag is a safe superset — surplus tags don't trigger the CTA elsewhere.
 */
function seedFullLevel1Progress(page) {
  // 30 distinct LEARN_PATH tags spanning the first three levels — enough to
  // cross the 80% threshold on Level 1 regardless of curriculum tweaks.
  const learnPathTags = Array.from({ length: 30 }, (_, i) => `lp${i + 1}`);
  return seedAuth(page, {
    vs: [
      ...learnPathTags,
      // Common content-track tags also marked done so ck() helpers that look
      // up these strings pass for items not keyed strictly by lpN.
      'greetings', 'numbers', 'family', 'food', 'transport',
      'alphabet', 'pronunciation', 'present-tense', 'past-tense',
      'nominative', 'accusative', 'dative', 'locative', 'genitive',
    ],
    ct: ['greetings', 'numbers', 'family', 'food', 'transport', 'restaurant'],
  });
}

test.describe('FIX-16 — LearnPath: Level Quiz CTA', () => {
  /** Navigate from /learn through "View full path" into the LearnPath screen. */
  async function openLearnPath(page) {
    await page.goto('/learn');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
    // LearnPathWidget renders "View full path — N/M lessons" inside LearnTab.
    const openPath = page.getByText(/view full path/i).first();
    await openPath.waitFor({ state: 'visible', timeout: 10_000 });
    await openPath.click();
  }

  test.beforeEach(async ({ page }) => {
    await seedFullLevel1Progress(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
  });

  test('LearnPath screen mounts after clicking "View full path"', async ({ page }) => {
    await openLearnPath(page);
    // LearnPath renders the LEARN_PATH constants — at least one Level header shows.
    await expect(page.getByText(/level\s+1/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('"Take Level Quiz" CTA appears for a user at ≥80% level completion', async ({ page }) => {
    await openLearnPath(page);
    // CTA sits inside the level card body — may require a small scroll.
    await page.evaluate(() => window.scrollBy(0, 400));
    const cta = page.getByText(/take level quiz/i).first();
    await expect(cta).toBeVisible({ timeout: 10_000 });
  });

  test('clicking "Take Level Quiz" mounts the LevelQuiz screen', async ({ page }) => {
    await openLearnPath(page);
    await page.evaluate(() => window.scrollBy(0, 400));
    const cta = page.getByText(/take level quiz/i).first();
    await cta.waitFor({ state: 'visible', timeout: 10_000 });
    await cta.click();
    // LevelQuiz renders "Level N Quiz" via H() plus a "{idx+1} / 10" counter.
    await expect(page.getByText(/level\s+\d+\s+quiz/i).first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/^\s*1\s*\/\s*10\s*$/).first()).toBeVisible({ timeout: 5_000 });
  });
});
