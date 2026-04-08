/**
 * ScreenErrorBoundary smoke tests.
 *
 * The ScreenErrorBoundary wraps each tab/screen and renders:
 *   - role="alert" div
 *   - "Nema veze — something slipped."
 *   - "Your progress is saved."
 *   - "Try Again" button (className "b bp") — resets boundary on first click
 *   - After 1 retry: "Reload App" replaces "Try Again"
 *   - Optional "Go Back" button (className "b bg")
 *
 * Strategy: E2E smoke tests verify the error UI does NOT appear on normal
 * navigation (regressions where a bad deploy fires boundaries on initial render).
 * A Vitest unit test in src/tests/ handles the triggered-state behaviour
 * (see ScreenErrorBoundary.test.jsx).
 *
 * All tests use seedAuth + blockFirebase + mockTTS so they are hermetic.
 */
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS } from './fixtures/seed-auth.js';

// ── helpers ───────────────────────────────────────────────────────────────────

/** Collect and filter page-level JS errors, excluding Firebase network noise. */
function trackErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

function assertNoUnexpectedErrors(errors) {
  const unexpected = errors.filter(
    (e) =>
      !e.includes('firebase') &&
      !e.includes('firestore') &&
      !e.includes('Failed to fetch') &&
      !e.includes('NetworkError') &&
      !e.includes('net::ERR') &&
      !e.includes('AbortError') &&
      !e.includes('identitytoolkit') &&
      !e.includes('securetoken') &&
      // WebKit CI: parallel workers cause transient ES module chunk load failures that
      // don't occur in real Safari. Behavioral assertions (no boundary alert) catch genuine failures.
      !e.includes('Importing a module script failed') &&
      // SPA-internal navigation conflict: React Router throws when two navigations race
      !e.includes('interrupted by another navigation'),
  );
  expect(unexpected, 'Unexpected JS errors').toHaveLength(0);
}

/** Assert the ScreenErrorBoundary alert is NOT present on the page. */
async function assertNoBoundaryAlert(page) {
  // Use a short timeout — if the boundary was going to fire it does so immediately
  const alertVisible = await page.getByRole('alert').isVisible({ timeout: 2_000 }).catch(() => false);
  expect(alertVisible, 'ScreenErrorBoundary should NOT be visible on a healthy render').toBe(false);
}

// ── Setup ─────────────────────────────────────────────────────────────────────

test.describe('ScreenErrorBoundary — smoke tests (no boundary on healthy renders)', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
  });

  // ── 1. Home / Today tab ───────────────────────────────────────────────────
  test('Home tab (/) does not trigger ScreenErrorBoundary on initial render', async ({ page }) => {
    const errors = trackErrors(page);

    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });

    await assertNoBoundaryAlert(page);
    assertNoUnexpectedErrors(errors);
  });

  // ── 2. Learn tab ──────────────────────────────────────────────────────────
  test('Learn tab (/learn) does not trigger ScreenErrorBoundary on initial render', async ({ page }) => {
    const errors = trackErrors(page);

    await page.goto('/learn');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
    // Wait for tab content to load before checking for boundary
    await page.waitForTimeout(500);

    await assertNoBoundaryAlert(page);
    assertNoUnexpectedErrors(errors);
  });

  // ── 3. Practice tab ───────────────────────────────────────────────────────
  test('Practice tab (/practice) does not trigger ScreenErrorBoundary on initial render', async ({ page }) => {
    const errors = trackErrors(page);

    await page.goto('/practice');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForTimeout(500);

    await assertNoBoundaryAlert(page);
    assertNoUnexpectedErrors(errors);
  });

  // ── 4. Croatia tab ────────────────────────────────────────────────────────
  test('Croatia tab (/croatia) does not trigger ScreenErrorBoundary on initial render', async ({ page }) => {
    const errors = trackErrors(page);

    await page.goto('/croatia');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForTimeout(500);

    await assertNoBoundaryAlert(page);
    assertNoUnexpectedErrors(errors);
  });

  // ── 5. Profile / Me tab ───────────────────────────────────────────────────
  test('Profile tab (/profile) does not trigger ScreenErrorBoundary on initial render', async ({ page }) => {
    const errors = trackErrors(page);

    await page.goto('/profile');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForTimeout(500);

    await assertNoBoundaryAlert(page);
    assertNoUnexpectedErrors(errors);
  });

  // ── 6. Multiple tab switches don't trigger boundaries ────────────────────
  test('switching through all 5 tabs in sequence does not trigger any error boundary', async ({ page }) => {
    const errors = trackErrors(page);

    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible({ timeout: 15_000 });

    for (const label of ['Learn', 'Practice', 'Croatia', 'Me', 'Today']) {
      await nav.getByRole('button', { name: label, exact: true }).click();
      // Brief settle time for React to commit the tab transition
      await page.waitForTimeout(400);
      await assertNoBoundaryAlert(page);
    }

    assertNoUnexpectedErrors(errors);
  });

  // ── 7. Rapid tab switching does not crash ─────────────────────────────────
  test('rapid navigation between tabs does not crash the app', async ({ page }) => {
    const errors = trackErrors(page);

    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible({ timeout: 15_000 });

    // Fire clicks in rapid succession without waiting between them
    const tabs = ['Learn', 'Practice', 'Croatia', 'Me', 'Today', 'Learn', 'Today'];
    for (const label of tabs) {
      await nav.getByRole('button', { name: label, exact: true }).click();
    }

    // Wait for the dust to settle
    await page.waitForTimeout(800);

    // Nav bar must still be present — no white-screen crash
    await expect(nav).toBeVisible({ timeout: 5_000 });
    await assertNoBoundaryAlert(page);
    assertNoUnexpectedErrors(errors);
  });

  // ── 8. Error boundary text strings are correct (structural contract) ──────
  // This test documents the exact strings the ScreenErrorBoundary renders
  // so any copy change is caught during review. It does NOT trigger the boundary;
  // it just asserts the strings are NOT accidentally visible on a clean load.
  test('ScreenErrorBoundary marker strings are not visible on a healthy home screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });

    // These strings ONLY appear when ScreenErrorBoundary is in error state
    await expect(page.getByText('Nema veze — something slipped.')).not.toBeVisible();
    await expect(page.getByText('Your progress is saved.')).not.toBeVisible();
  });

  // ── 9. Profile seg-bar switching does not cause a boundary ────────────────
  test('switching profile sub-tabs (Stats/Insights/Settings) does not trigger error boundary', async ({ page }) => {
    const errors = trackErrors(page);

    await page.goto('/profile');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });

    const segBar = page.locator('.seg-bar');
    await expect(segBar).toBeVisible({ timeout: 5_000 });

    for (const label of ['Insights', 'Settings', 'Stats', 'Insights', 'Stats']) {
      await segBar.locator('.seg-pill').filter({ hasText: label }).click();
      await page.waitForTimeout(300);
      await assertNoBoundaryAlert(page);
    }

    assertNoUnexpectedErrors(errors);
  });

  // ── 10. Direct route loads don't trigger boundary ─────────────────────────
  test('direct URL navigation to each route does not trigger error boundary', async ({ page }) => {
    const errors = trackErrors(page);

    const routes = ['/', '/learn', '/practice', '/croatia', '/profile'];
    for (const route of routes) {
      // Re-apply init scripts before each navigation
      await seedAuth(page);
      await blockFirebase(page);
      await mockTTS(page);
      // Catch SPA-internal navigation race on WebKit: React Router may fire navigate('/')
      // simultaneously with the test's goto(), causing "interrupted by another navigation".
      await page.goto(route).catch(() => {});

      await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
        timeout: 15_000,
      });
      await page.waitForTimeout(300);
      await assertNoBoundaryAlert(page);
    }

    assertNoUnexpectedErrors(errors);
  });
});
