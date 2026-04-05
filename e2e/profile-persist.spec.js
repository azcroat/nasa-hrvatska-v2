/**
 * Progress & profile persistence tests.
 * Verifies that XP, lesson counts, streaks, and stats survive page reloads,
 * tab switches, and simulated multi-session usage. This is the category of
 * bugs that caused the most user pain ("my progress disappeared").
 */
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, TEST_EMAIL } from './fixtures/seed-auth.js';

test.describe('Progress persistence across sessions', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
  });

  test('XP value persists across page reload', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    // Verify initial XP of 250 is in localStorage (displayed in multiple places)
    const xpBefore = await page.evaluate((email) => {
      try { return JSON.parse(localStorage.getItem('uP_' + email))?.st?.xp ?? null; }
      catch { return null; }
    }, TEST_EMAIL);
    expect(xpBefore).toBe(250);

    // Reload the page (simulates closing and reopening)
    await seedAuth(page);
    await blockFirebase(page);
    await page.reload();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    // XP should still be 250 — not reset to 0
    const xpAfter = await page.evaluate((email) => {
      try { return JSON.parse(localStorage.getItem('uP_' + email))?.st?.xp ?? null; }
      catch { return null; }
    }, TEST_EMAIL);
    expect(xpAfter).toBe(250);
  });

  test('streak count persists across page reload', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    // Verify streak via localStorage (displayed alongside many other numbers on screen)
    const streakBefore = await page.evaluate((email) => {
      try { return JSON.parse(localStorage.getItem('uP_' + email))?.st?.sp ?? null; }
      catch { return null; }
    }, TEST_EMAIL);
    expect(streakBefore).toBeGreaterThanOrEqual(0);

    await seedAuth(page);
    await blockFirebase(page);
    await page.reload();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    const streakAfter = await page.evaluate((email) => {
      try { return JSON.parse(localStorage.getItem('uP_' + email))?.st?.sp ?? null; }
      catch { return null; }
    }, TEST_EMAIL);
    expect(streakAfter).toBe(streakBefore);
  });

  test('seeded stats are not reset to zero on app load', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });

    const stats = await page.evaluate((email) => {
      try { return JSON.parse(localStorage.getItem('uP_' + email))?.st ?? null; }
      catch { return null; }
    }, TEST_EMAIL);

    expect(stats).not.toBeNull();
    if (!stats) return;
    expect(stats.xp).toBe(250);
    expect(stats.lc).toBe(10);
    expect(stats.gc).toBe(5);
  });

  test('all required stats fields exist — no undefined (legacy merge guard)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });

    const stats = await page.evaluate((email) => {
      try { return JSON.parse(localStorage.getItem('uP_' + email))?.st ?? null; }
      catch { return null; }
    }, TEST_EMAIL);

    expect(stats).not.toBeNull();
    if (!stats) return;
    const required = ['xp', 'lc', 'gc', 'sp', 'de', 'rc', 'al', 'mv', 'hi', 'rs', 'ct', 'badges'];
    for (const field of required) {
      expect(stats[field], `stats.${field} must not be undefined`).not.toBeUndefined();
    }
  });

  test('progress survives tab-switching (no state teardown)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });

    const nav = page.getByRole('navigation', { name: 'Main navigation' });

    // Switch through all tabs and back
    await nav.getByRole('button', { name: 'Learn', exact: true }).click();
    await page.waitForTimeout(300);
    await nav.getByRole('button', { name: 'Practice', exact: true }).click();
    await page.waitForTimeout(300);
    await nav.getByRole('button', { name: 'Culture', exact: true }).click();
    await page.waitForTimeout(300);
    await nav.getByRole('button', { name: 'Me', exact: true }).click();
    await page.waitForTimeout(300);
    await nav.getByRole('button', { name: 'Today', exact: true }).click();
    await page.waitForTimeout(300);

    // XP should still be correct after all tab switches
    await expect(page.getByText('250')).toBeVisible({ timeout: 5_000 });
  });

  test('simulated XP gain persists after reload', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });

    // Simulate gaining 50 XP directly in localStorage (as the app does)
    await page.evaluate((email) => {
      try {
        const key = 'uP_' + email;
        const p = JSON.parse(localStorage.getItem(key));
        p.st.xp = 300;
        p.st.lc = 11;
        localStorage.setItem(key, JSON.stringify(p));
      } catch {}
    }, TEST_EMAIL);

    await seedAuth(page); // Re-seed session (keep login valid)
    await blockFirebase(page);

    await page.evaluate(() => { /* Force a reload via navigation */ });
    await page.reload();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });

    const stats = await page.evaluate((email) => {
      try { return JSON.parse(localStorage.getItem('uP_' + email))?.st; }
      catch { return null; }
    }, TEST_EMAIL);

    // Should be 300 (our written value), NOT 250 (the seed value)
    expect(stats.xp).toBe(300);
    expect(stats.lc).toBe(11);
  });
});

test.describe('Profile screen', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: 'Me', exact: true }).click();
    await expect(page.getByText(/Profile|Account/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test('profile tab loads without crashing', async ({ page }) => {
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  test('shows user name in profile', async ({ page }) => {
    await expect(page.getByText(/Test Učenik/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test('shows XP total in profile stats', async ({ page }) => {
    await expect(page.getByText('250').first()).toBeVisible({ timeout: 5_000 });
  });

  test('Badges section is accessible', async ({ page }) => {
    const badgesBtn = page.getByText(/Badges/i).first();
    if (await badgesBtn.isVisible()) {
      await badgesBtn.click();
      await expect(page.getByText(/Badge|Achievement/i).first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('Favorites section is accessible', async ({ page }) => {
    const favsBtn = page.getByText(/Favorites|Favourites|Saved/i).first();
    if (await favsBtn.isVisible()) {
      await favsBtn.click();
      await expect(page.locator('#root')).not.toBeEmpty({ timeout: 3_000 });
    }
  });
});
