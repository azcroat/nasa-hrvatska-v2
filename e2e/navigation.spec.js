import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS } from './fixtures/seed-auth.js';

// Helper: always click tabs via the nav bar to avoid ambiguous matches with Jump In buttons
async function clickTab(page, label) {
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await nav.getByRole('button', { name: label, exact: true }).click();
}

test.describe('Tab navigation', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
  });

  test('renders all 5 navigation tabs', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    for (const label of ['Today', 'Learn', 'Practice', 'Croatia', 'Me']) {
      await expect(nav.getByRole('button', { name: label, exact: true })).toBeVisible();
    }
  });

  test('Home tab is active by default', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('button', { name: 'Today', exact: true })).toHaveClass(/active/);
  });

  test('navigates to Learn tab and shows vocabulary section', async ({ page }) => {
    await clickTab(page, 'Learn');
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('button', { name: 'Learn', exact: true })).toHaveClass(/active/);
    await expect(page.getByText('🗺️ My Path')).toBeVisible({ timeout: 5_000 });
  });

  test('navigates to Practice tab and shows practice options', async ({ page }) => {
    await clickTab(page, 'Practice');
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('button', { name: 'Practice', exact: true })).toHaveClass(/active/);
    await expect(page.getByRole('heading', { name: /Practice/i })).toBeVisible({ timeout: 5_000 });
  });

  test('navigates to Culture tab and shows History & Regions heading', async ({ page }) => {
    await clickTab(page, 'Croatia');
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('button', { name: 'Croatia', exact: true })).toHaveClass(/active/);
    await expect(page.getByRole('heading', { name: /History.*Regions/i })).toBeVisible({ timeout: 5_000 });
  });

  test('navigates to Me tab and shows user name', async ({ page }) => {
    await clickTab(page, 'Me');
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('button', { name: 'Me', exact: true })).toHaveClass(/active/);
    await expect(page.getByText('Test Učenik').first()).toBeVisible({ timeout: 5_000 });
  });

  test('tab switches correctly update active state', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Main navigation' });

    await clickTab(page, 'Learn');
    // Use 10s timeout — CI can be slow to update React state after a tab click
    // when the page is still settling post-auth. This test passed on every retry,
    // confirming it's a timing flake rather than a logic bug.
    await expect(nav.getByRole('button', { name: 'Learn', exact: true })).toHaveClass(/active/, { timeout: 10_000 });
    await expect(nav.getByRole('button', { name: 'Today', exact: true })).not.toHaveClass(/active/, { timeout: 10_000 });

    await clickTab(page, 'Today');
    await expect(nav.getByRole('button', { name: 'Today', exact: true })).toHaveClass(/active/, { timeout: 10_000 });
    await expect(nav.getByRole('button', { name: 'Learn', exact: true })).not.toHaveClass(/active/, { timeout: 10_000 });
  });

  test('search bar is visible on the dashboard', async ({ page }) => {
    // The app has multiple searchboxes (main search + learn tab search); target the main one
    await expect(page.getByRole('searchbox', { name: /Search vocabulary/i })).toBeVisible();
  });

  test('search returns results for a known Croatian word', async ({ page }) => {
    // Wait for the app's post-auth navigate('/') call (from _goPostAuth/setScr('dashboard'))
    // to complete before interacting. This prevents "execution context destroyed" when
    // Playwright detects React Router's history.pushState during evaluate/locator checks.
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
    await page.getByRole('searchbox', { name: /Search vocabulary/i }).fill('kuća');
    // doSearch debounces 200ms then lazily imports the search index chunk.
    // Give both enough time before expecting the results listbox.
    await page.waitForTimeout(600);
    await expect(page.getByRole('listbox', { name: 'Search results' })).toBeVisible({ timeout: 5_000 });
  });
});
