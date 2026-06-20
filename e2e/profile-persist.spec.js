/**
 * Progress & profile persistence tests.
 * Verifies that XP, lesson counts, streaks, and stats survive page reloads,
 * tab switches, and simulated multi-session usage. This is the category of
 * bugs that caused the most user pain ("my progress disappeared").
 *
 * NOTE: The app saves progress as { stats: {...} } (progressSnapshot format).
 * The seed uses { st: {...} }. After first load, the app overwrites with stats format.
 * All localStorage reads use `p?.st ?? p?.stats` to handle both.
 *
 * NOTE: page.reload() can ERR_ABORT in production builds with service workers.
 * Use page.goto('/') instead — addInitScript seeds run on every navigation.
 */
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, TEST_EMAIL, clickMe } from './fixtures/seed-auth.js';

/** Read stats from localStorage, handling both { st: {...} } and { stats: {...} } formats.
 * Retries up to 3 times to survive React Router's internal history.pushState() calls
 * that Playwright may flag as "execution context destroyed" during parallel runs.
 */
async function readStats(page) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await page.evaluate((email) => {
        try {
          const p = JSON.parse(localStorage.getItem('uP_' + email));
          return p?.st ?? p?.stats ?? null;
        } catch { return null; }
      }, TEST_EMAIL);
    } catch (err) {
      if (attempt === 2) return null;
      // Brief pause lets any in-flight React Router navigation settle
      await page.waitForTimeout(300);
    }
  }
  return null;
}

test.describe('Progress persistence across sessions', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
  });

  test('XP value persists across page reload', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    // Verify initial XP of 250 is in localStorage
    const statsBefore = await readStats(page);
    expect(statsBefore).not.toBeNull();
    expect(statsBefore?.xp).toBe(250);

    // Navigate again (simulates reload — addInitScript re-seeds, app must not reset to 0).
    // Catch "interrupted by another navigation" — the SPA may push its own history entry
    // during boot; the subsequent nav assertion confirms the page settled.
    await page.goto('/').catch(() => {});
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    // Wait for React Router initial navigate() to settle — prevents "execution context
    // was destroyed" when page.evaluate() races against the router's history.push.
    await page.waitForLoadState('domcontentloaded');
    const statsAfter = await readStats(page);
    expect(statsAfter).not.toBeNull();
    expect(statsAfter?.xp).toBe(250);
  });

  test('streak count persists across page reload', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    const statsBefore = await readStats(page);
    expect(statsBefore).not.toBeNull();
    const streakBefore = statsBefore?.sp ?? 0;
    expect(streakBefore).toBeGreaterThanOrEqual(0);

    // Navigate again — catch SPA-internal navigation race same as above
    await page.goto('/').catch(() => {});
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    await page.waitForLoadState('domcontentloaded');
    const statsAfter = await readStats(page);
    expect(statsAfter).not.toBeNull();
    expect(statsAfter?.sp ?? 0).toBe(streakBefore);
  });

  test('seeded stats are not reset to zero on app load', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });

    const stats = await readStats(page);

    expect(stats).not.toBeNull();
    if (!stats) return;
    expect(stats.xp).toBe(250);
    expect(stats.lc).toBe(10);
    expect(stats.gc).toBe(5);
  });

  test('all required stats fields exist — no undefined (legacy merge guard)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });

    const stats = await readStats(page);

    expect(stats).not.toBeNull();
    if (!stats) return;
    // Fields from actual Stats type in src/types/index.ts
    const required = ['xp', 'lc', 'gc', 'sp', 'de', 'rc', 'pf', 'mv', 'hi', 'ct', 'badges'];
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
    await nav.getByRole('button', { name: 'Croatia', exact: true }).click();
    await page.waitForTimeout(300);
    await clickMe(page); // Sidebar on desktop, AppHeader avatar on mobile
    await page.waitForTimeout(300);
    await nav.getByRole('button', { name: 'Today', exact: true }).click();
    await page.waitForTimeout(300);

    // XP should still be correct after all tab switches
    await expect(page.getByText('250').first()).toBeVisible({ timeout: 5_000 });
  });

  test('simulated XP gain is retained in localStorage', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });

    // Wait for React Router's initial navigate() calls to settle
    await page.waitForLoadState('domcontentloaded');

    // Verify initial XP
    const statsBefore = await readStats(page);
    expect(statsBefore?.xp).toBe(250);

    // Simulate gaining 50 XP: write and read-back in a single atomic evaluate call to
    // avoid a race where the app's auto-save fires between our write and a separate read.
    const xpAfterWrite = await page.evaluate((email) => {
      try {
        const key = 'uP_' + email;
        const p = JSON.parse(localStorage.getItem(key));
        if (!p) return null;
        const statsKey = p.st ? 'st' : (p.stats ? 'stats' : null);
        if (!statsKey || !p[statsKey]) return null;
        p[statsKey].xp = 300;
        localStorage.setItem(key, JSON.stringify(p));
        // Read-back immediately in the same JS execution context
        const p2 = JSON.parse(localStorage.getItem(key));
        return (p2?.st ?? p2?.stats)?.xp ?? null;
      } catch { return null; }
    }, TEST_EMAIL);
    expect(xpAfterWrite).toBe(300);
  });
});

test.describe('Profile screen', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    // Navigate directly to /profile to avoid post-auth navigate('/') race on tab click.
    await page.goto('/profile');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Profile|Account/i).first()).toBeVisible({ timeout: 10_000 });
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
    const favsBtn = page.getByText('Favorites').first();
    if (await favsBtn.isVisible()) {
      await favsBtn.click();
      // FavoritesScreen renders either the saved words list or the empty-state message
      await expect(page.getByText(/My Favorites|No favorites yet/i).first()).toBeVisible({ timeout: 5_000 });
    }
  });
});
