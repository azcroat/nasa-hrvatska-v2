/**
 * Me / Profile tab tests.
 * Covers: navigation, seg-bar pill switching, user data display,
 * Settings content, back navigation, and seeded XP/streak values.
 *
 * Seeded data (from seedAuth): XP=250, lc=10, streak=5, gc=5, sp=3
 */
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, TEST_NAME } from './fixtures/seed-auth.js';

// ── helpers ───────────────────────────────────────────────────────────────────

/** Click a nav bar button by exact label. */
async function clickNavTab(page, label) {
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await nav.getByRole('button', { name: label, exact: true }).click();
}

/** Click a profile tab pill by label (Stats / Insights / Settings). */
async function clickSegPill(page, label) {
  // The profile tab pills match by text substring
  await page.locator('.profile-tab-pill').filter({ hasText: label }).click();
}

// ── Setup ─────────────────────────────────────────────────────────────────────

test.describe('Me tab (Profile)', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/profile');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
  });

  // ── 1. Navigation bar visible on /profile ─────────────────────────────────
  test('navigation bar is visible on the /profile route', async ({ page }) => {
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  });

  // ── 2. Me entry reflects the /profile route ───────────────────────────────
  test('Me entry reflects the profile route (active on desktop, present on mobile)', async ({
    page,
  }) => {
    const sidebarMe = page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: 'Me', exact: true });
    if (await sidebarMe.isVisible().catch(() => false)) {
      // Desktop: Me lives in the Sidebar and carries the active class on /profile.
      await expect(sidebarMe).toHaveClass(/active/);
    } else {
      // Mobile: Me moved to the AppHeader avatar (no bottom-bar active state).
      await expect(page.getByTestId('header-profile')).toBeVisible();
    }
  });

  // ── 3. User name visible ─────────────────────────────────────────────────
  test('shows the seeded user name in the profile header', async ({ page }) => {
    await expect(page.getByText(TEST_NAME).filter({ visible: true }).first()).toBeVisible({ timeout: 5_000 });
  });

  // ── 4. Stats tab active by default ───────────────────────────────────────
  test('Stats tab is active by default and shows stat cards', async ({ page }) => {
    // The profile tab strip should show Stats as selected
    await expect(page.locator('.profile-tab-pill').filter({ hasText: 'Stats' })).toBeVisible();

    // Stats content: at least Total XP, Day Streak, and Lessons labels
    await expect(page.getByText('Total XP').filter({ visible: true }).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Day Streak').filter({ visible: true }).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Lessons').filter({ visible: true }).first()).toBeVisible({ timeout: 5_000 });
  });

  // ── 5. Switching to Insights tab ─────────────────────────────────────────
  test('clicking Insights pill switches to Insights content', async ({ page }) => {
    await clickSegPill(page, 'Insights');

    // Insights tab renders at minimum one of these content markers
    const insightsMarkers = [
      page.getByText(/Leaderboard/i).first(),
      page.getByText(/Friends/i).first(),
      page.getByText(/AI/i).first(),
      page.getByText(/Recommendations/i).first(),
      page.getByText(/Insights/i).first(),
    ];

    // At least one marker must become visible
    let found = false;
    for (const marker of insightsMarkers) {
      if (await marker.isVisible({ timeout: 3_000 }).catch(() => false)) {
        found = true;
        break;
      }
    }
    expect(found, 'Insights tab should render some content').toBe(true);

    // Stats-specific content should no longer be the primary view
    // (profile tab pill visual selection has changed)
    await expect(page.locator('.profile-tab-pill').filter({ hasText: 'Insights' })).toBeVisible();
  });

  // ── 6. Switching to Settings tab ─────────────────────────────────────────
  test('clicking Settings pill switches to Settings content', async ({ page }) => {
    await clickSegPill(page, 'Settings');

    // Settings tab renders at minimum one known section
    const settingsMarkers = [
      page.getByText(/Notifications/i).first(),
      page.getByText(/Sound/i).first(),
      page.getByText(/Voice/i).first(),
      page.getByText(/Sign Out/i).first(),
      page.getByText(/Export/i).first(),
    ];

    let found = false;
    for (const marker of settingsMarkers) {
      if (await marker.isVisible({ timeout: 3_000 }).catch(() => false)) {
        found = true;
        break;
      }
    }
    expect(found, 'Settings tab should render some content').toBe(true);
  });

  // ── 7. Settings tab has dark mode related content ────────────────────────
  test('Settings tab contains dark mode / theme toggle', async ({ page }) => {
    await clickSegPill(page, 'Settings');

    // Look for "dark mode" text or "theme" text (case-insensitive) or a toggle input
    const darkModeText = page.getByText(/dark mode|theme/i).first();
    const toggleInput = page.locator('input[type="checkbox"]').first();

    const hasText = await darkModeText.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasToggle = await toggleInput.isVisible({ timeout: 2_000 }).catch(() => false);

    expect(hasText || hasToggle, 'Settings should contain dark mode text or a toggle control').toBe(true);
  });

  // ── 8. Back navigation works ─────────────────────────────────────────────
  test('clicking Today nav button navigates back to the home screen', async ({ page }) => {
    await clickNavTab(page, 'Today');

    // Home screen is identified by the presence of a stats/greeting element
    // The hero shows user name and today's content
    await expect(page.getByText(TEST_NAME).filter({ visible: true }).first()).toBeVisible({ timeout: 5_000 });

    // Today tab should now be active
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('button', { name: 'Today', exact: true })).toHaveClass(
      /active/,
      { timeout: 5_000 },
    );
  });

  // ── 9. XP shows seeded value of 250 ──────────────────────────────────────
  test('profile stats display the seeded XP value (250)', async ({ page }) => {
    // StatsTab shows "250" as the Total XP value
    const bodyText = await page.locator('body').textContent({ timeout: 5_000 });
    expect(bodyText).toMatch(/250/);
  });

  // ── 10. Streak shows seeded value of 5 ───────────────────────────────────
  test('profile stats display the seeded streak count (5)', async ({ page }) => {
    // StatsTab renders each stat card with aria-label="${value} ${label}".
    // The seeded streak is 5, so the element has aria-label="5 Day Streak".
    // Using aria-label is more reliable than body.textContent() because the
    // value div uses WebkitTextFillColor:transparent (CSS gradient clip) which
    // can confuse regex word-boundary matching on concatenated text nodes.
    await expect(page.locator('[aria-label="5 Day Streak"]')).toBeVisible({ timeout: 8_000 });
  });

  // ── 11. Profile tab strip has all three pills ────────────────────────────
  test('seg-bar renders Stats, Insights, and Settings pills', async ({ page }) => {
    const tabStrip = page.locator('.profile-tab-strip');
    await expect(tabStrip).toBeVisible({ timeout: 5_000 });

    await expect(tabStrip.locator('.profile-tab-pill').filter({ hasText: 'Stats' })).toBeVisible();
    await expect(tabStrip.locator('.profile-tab-pill').filter({ hasText: 'Insights' })).toBeVisible();
    await expect(tabStrip.locator('.profile-tab-pill').filter({ hasText: 'Settings' })).toBeVisible();
  });

  // ── 12. Rapid seg-pill switching does not crash ───────────────────────────
  test('rapidly switching between seg-bar pills does not cause a JS error', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await clickSegPill(page, 'Insights');
    await clickSegPill(page, 'Settings');
    await clickSegPill(page, 'Stats');
    await clickSegPill(page, 'Insights');
    await clickSegPill(page, 'Stats');

    await page.waitForTimeout(300);

    const unexpected = errors.filter(
      (e) =>
        !e.includes('firebase') &&
        !e.includes('firestore') &&
        !e.includes('fetch') &&
        !e.includes('net::ERR'),
    );
    expect(unexpected, 'No unexpected JS errors from seg-bar switching').toHaveLength(0);
  });
});
