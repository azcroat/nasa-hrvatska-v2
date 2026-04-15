import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS } from './fixtures/seed-auth.js';

// Helper: always click tabs via the nav bar to avoid ambiguous matches with Jump In buttons.
// Waits for the button to be visible before clicking so Firefox/WebKit don't miss a racing
// element that isn't yet stable in the accessibility tree.
async function clickTab(page, label) {
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  const btn = nav.getByRole('button', { name: label, exact: true });
  await btn.waitFor({ state: 'visible', timeout: 10_000 });
  await btn.click();
}

test.describe('Tab navigation', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    // Wait for the app's post-auth internal navigate() calls to fully settle before each test.
    // On Firefox/WebKit these deferred effects take longer; clicking a tab before they complete
    // can result in the router overriding the tab click and resetting to Today.
    await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
    await page.waitForTimeout(300);
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
    // Confirm URL changed — proves click registered before checking active class.
    // 20s allows for lazy-chunk load on Firefox/WebKit in parallel CI.
    await page.waitForURL('/learn', { timeout: 20_000 });
    // Tab content visible confirms React rendered the tab
    await expect(page.getByText('🗺️ My Path')).toBeVisible({ timeout: 10_000 });
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('button', { name: 'Learn', exact: true })).toHaveClass(/active/, { timeout: 10_000 });
  });

  test('navigates to Practice tab and shows practice options', async ({ page }) => {
    await clickTab(page, 'Practice');
    // Confirm URL changed before checking content/active class
    await page.waitForURL('/practice', { timeout: 20_000 });
    // Wait for the heading — confirms the tab content has rendered before checking nav state.
    // 20s for lazy-chunk load on Firefox/WebKit in parallel CI.
    await expect(page.getByRole('heading', { name: /Practice/i })).toBeVisible({ timeout: 20_000 });
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('button', { name: 'Practice', exact: true })).toHaveClass(/active/, { timeout: 10_000 });
  });

  test('navigates to Culture tab and shows History & Regions heading', async ({ page }) => {
    await clickTab(page, 'Croatia');
    // Confirm URL changed then check content first, active class last
    await page.waitForURL('/croatia', { timeout: 20_000 });
    // Heading check with generous timeout for lazy-chunk load on Firefox/WebKit
    await expect(page.getByRole('heading', { name: /History.*Regions/i })).toBeVisible({ timeout: 20_000 });
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('button', { name: 'Croatia', exact: true })).toHaveClass(/active/, { timeout: 10_000 });
  });

  test('navigates to Me tab and shows user name', async ({ page }) => {
    await clickTab(page, 'Me');
    await page.waitForURL('/profile', { timeout: 20_000 });
    // 20s covers Mobile Chrome (Pixel 5) where name state resolves slowly after auth.
    await expect(page.getByText('Test Učenik').first()).toBeVisible({ timeout: 20_000 });
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('button', { name: 'Me', exact: true })).toHaveClass(/active/, { timeout: 10_000 });
  });

  test('tab switches correctly update active state', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Main navigation' });

    await clickTab(page, 'Learn');
    // Wait for URL to confirm click registered, then check active class.
    // Firefox/WebKit need up to 20s for URL + React re-render in parallel CI.
    await page.waitForURL('/learn', { timeout: 20_000 });
    await expect(nav.getByRole('button', { name: 'Learn', exact: true })).toHaveClass(/active/, { timeout: 10_000 });
    await expect(nav.getByRole('button', { name: 'Today', exact: true })).not.toHaveClass(/active/, { timeout: 10_000 });

    await clickTab(page, 'Today');
    await page.waitForURL('/', { timeout: 20_000 });
    await expect(nav.getByRole('button', { name: 'Today', exact: true })).toHaveClass(/active/, { timeout: 10_000 });
    await expect(nav.getByRole('button', { name: 'Learn', exact: true })).not.toHaveClass(/active/, { timeout: 10_000 });
  });

  test('search bar is visible on the dashboard', async ({ page }) => {
    // The app search input uses role="combobox" (supports aria-expanded/aria-controls/aria-autocomplete)
    // 10s timeout allows for slower render on Firefox/WebKit under parallel load.
    await expect(page.getByRole('combobox', { name: /Search vocabulary/i })).toBeVisible({ timeout: 10_000 });
  });

  test('search returns results for a known Croatian word', async ({ page }) => {
    // Wait for the app's post-auth navigate('/') call (from _goPostAuth/setScr('dashboard'))
    // to complete before interacting. This prevents "execution context destroyed" when
    // Playwright detects React Router's history.pushState during evaluate/locator checks.
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
    await page.getByRole('combobox', { name: /Search vocabulary/i }).fill('kuća');
    // doSearch debounces 200ms then lazily imports the search index chunk.
    // Give both enough time before expecting the results listbox.
    await page.waitForTimeout(600);
    await expect(page.getByRole('listbox', { name: 'Search results' })).toBeVisible({ timeout: 5_000 });
  });
});
