/**
 * Progress integrity tests.
 * Verifies that user progress data (XP=250, lc=10, streak=5 from seedAuth) is
 * correctly read from localStorage, displayed in the UI, and not corrupted by
 * exercises. Also tests that dual storage-key formats don't break the app.
 */
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, TEST_EMAIL } from './fixtures/seed-auth.js';

const INITIAL_XP = 250;
const INITIAL_LC = 10;
const INITIAL_STREAK = 5;

test.describe('Progress integrity', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
  });

  // ── 1. Streak displayed correctly on home tab ─────────────────────────────
  test('streak badge on home tab shows the seeded streak count (5)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });

    // The hero section shows "X day streak" — the number 5 must appear in body text
    const bodyText = await page.locator('body').textContent({ timeout: 5_000 });
    expect(bodyText).toMatch(/(?<!\d)5(?!\d)/);

    // Look for streak-related label text as a sanity check
    await expect(page.getByText(/day streak/i).first()).toBeVisible({ timeout: 5_000 });
  });

  // ── 2. XP shown on profile ────────────────────────────────────────────────
  test('profile tab displays the seeded XP value of 250', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });

    // StatsTab renders the XP card value "250" (possibly formatted as "250")
    const bodyText = await page.locator('body').textContent({ timeout: 5_000 });
    expect(bodyText).toContain('250');
  });

  // ── 3. Lesson count reads from storage ───────────────────────────────────
  test('localStorage lesson count (lc) matches the seeded value of 10', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });

    // Absorb any post-auth load event before evaluating
    await page.waitForEvent('load', { timeout: 6_000 }).catch(() => {});

    const lc = await page.evaluate((email) => {
      try {
        const p = JSON.parse(localStorage.getItem('uP_' + email) || '{}');
        return (p?.st ?? p?.stats)?.lc ?? null;
      } catch (_) {
        return null;
      }
    }, TEST_EMAIL);

    expect(lc).toBe(INITIAL_LC);
  });

  // ── 4. Both key formats handled (`st` and `stats`) ───────────────────────
  test('app remains stable when both st and stats key formats coexist in localStorage', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });

    // Absorb the post-auth load event before calling evaluate
    await page.waitForEvent('load', { timeout: 6_000 }).catch(() => {});

    // Write a duplicate stats-format key alongside the existing st-format key
    await page.evaluate((email) => {
      const data = JSON.parse(localStorage.getItem('uP_' + email) || '{}');
      data.stats = data.st;
      localStorage.setItem('uP_' + email, JSON.stringify(data));
    }, TEST_EMAIL);

    // Re-apply init scripts before reload
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15_000 });

    // App must still be authenticated and render the nav bar
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
  });

  // ── 5. XP not double-awarded after rapid quiz completion ─────────────────
  test('XP in localStorage does not exceed INITIAL_XP + 100 after rapid quiz', async ({ page }) => {
    test.slow(); // quiz loop can take up to 45s — triple timeout
    await page.goto('/learn');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText('🗺️ My Path')).toBeVisible({ timeout: 25_000 });

    // Open the first vocab category
    await page.locator('button.vocab-pill').first().click();
    await expect(page.getByText('Quiz Me! →')).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: /Quiz Me/i }).click();
    await expect(page.getByText(/Question \d+ of \d+/i)).toBeVisible({ timeout: 5_000 });

    // Answer all questions
    for (let i = 0; i < 30; i++) {
      const resultBtn = page.locator('button').filter({ hasText: /See Results|Results/i });
      if (await resultBtn.isVisible()) {
        // Rapid double-click — must only award XP once
        await resultBtn.click();
        await resultBtn.click({ timeout: 500 }).catch(() => {});
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

    await page.waitForTimeout(500);

    const xp = await page.evaluate((email) => {
      try {
        const p = JSON.parse(localStorage.getItem('uP_' + email) || '{}');
        return (p?.st ?? p?.stats)?.xp ?? 0;
      } catch (_) {
        return 0;
      }
    }, TEST_EMAIL);

    // XP must not have been multiply-counted — 100 XP is the max per session
    expect(xp).toBeLessThanOrEqual(INITIAL_XP + 100);
  });

  // ── 6. Progress survives reload ───────────────────────────────────────────
  test('nav bar remains visible and streak still shows after a page reload', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible({ timeout: 15_000 });

    // Re-apply init scripts before reload
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15_000 });

    await expect(nav).toBeVisible({ timeout: 15_000 });

    // Streak text must still be present after reload
    const bodyText = await page.locator('body').textContent({ timeout: 5_000 });
    expect(bodyText).toMatch(/(?<!\d)5(?!\d)/);
  });

  // ── 7. XP in localStorage is a non-negative integer ──────────────────────
  test('XP value read from localStorage is a valid non-negative integer', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForEvent('load', { timeout: 6_000 }).catch(() => {});

    const xp = await page.evaluate((email) => {
      try {
        const p = JSON.parse(localStorage.getItem('uP_' + email) || '{}');
        return (p?.st ?? p?.stats)?.xp;
      } catch (_) {
        return undefined;
      }
    }, TEST_EMAIL);

    expect(typeof xp).toBe('number');
    expect(xp).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(xp)).toBe(true);
    expect(xp).toBe(INITIAL_XP);
  });

  // ── 8. Streak object has count and last fields ────────────────────────────
  test('streak object in localStorage has count=5 and a valid last date', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForEvent('load', { timeout: 6_000 }).catch(() => {});

    const streak = await page.evaluate((email) => {
      try {
        const p = JSON.parse(localStorage.getItem('uP_' + email) || '{}');
        return p?.streak ?? null;
      } catch (_) {
        return null;
      }
    }, TEST_EMAIL);

    expect(streak).not.toBeNull();
    expect(streak.count).toBe(INITIAL_STREAK);
    // last must be a valid ISO date string (YYYY-MM-DD)
    expect(streak.last).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
