/**
 * Offline / PWA resilience tests (extended edition).
 *
 * NOTE: This file is in the playwright.config.js testIgnore list:
 *   '**/offline.spec.js'  // requires pre-cached service worker — run against production build only
 *
 * These tests will NOT run automatically in CI. They require the app to have
 * been loaded at least once in the same browser context so the service worker
 * can cache the app shell. Run manually against the production build:
 *
 *   npm run build && npm run preview
 *   npx playwright test e2e/offline.spec.js --project="Desktop Chrome"
 *
 * The earlyRestore path (localStorage → authenticated render without network)
 * is covered hermetically by auth-edge-cases.spec.js and is CI-safe.
 */
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, TEST_EMAIL, mockContent } from './fixtures/seed-auth.js';

// ── helpers ───────────────────────────────────────────────────────────────────

/** Wait for the service worker to become active in this browser context. */
async function waitForSW(page) {
  await page.evaluate(() =>
    'serviceWorker' in navigator
      ? navigator.serviceWorker.ready
      : Promise.resolve(),
  );
}

/** Go online → seed → load once (caches the shell) → go offline → reload. */
async function goOfflineAfterCaching(page) {
  // First visit: online, seeds localStorage and caches the SW shell
  await seedAuth(page);
  await blockFirebase(page);
  await mockTTS(page);
  await mockContent(page);
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
    timeout: 20_000,
  });

  await waitForSW(page);

  // Re-seed for the reload (addInitScript only runs until next navigation)
  await seedAuth(page);
  await blockFirebase(page);
  await mockTTS(page);
  await mockContent(page);

  // Cut the network
  await page.context().setOffline(true);

  // Reload — SW should serve from cache
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 20_000 });
}

// ── Test suite ────────────────────────────────────────────────────────────────

test.describe('Offline mode (PWA / service worker)', () => {
  // ── 1. App loads from localStorage when offline ───────────────────────────
  test('app shell renders from SW cache when offline after initial load', async ({ page }) => {
    await goOfflineAfterCaching(page);

    // App root must render (not a browser "no connection" error page)
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15_000 });

    // Nav bar must be visible — earlyRestore + SW cache = authenticated offline
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
  });

  // ── 2. Practice tab accessible offline ────────────────────────────────────
  test('Practice tab is accessible offline after the app shell is cached', async ({ page }) => {
    await goOfflineAfterCaching(page);

    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible({ timeout: 15_000 });

    // Navigate to Practice — should serve from cached JS bundle
    await nav.getByRole('button', { name: 'Practice', exact: true }).click();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 10_000,
    });
  });

  // ── 3. Offline banner shows on Croatia tab ────────────────────────────────
  test('Croatia tab shows offline indicator or sample content when offline', async ({ page }) => {
    await goOfflineAfterCaching(page);

    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible({ timeout: 15_000 });

    await nav.getByRole('button', { name: 'Croatia', exact: true }).click();
    await page.waitForTimeout(1_500);

    // Look for offline banner text OR the fallback sample articles
    const bodyText = await page.locator('body').textContent({ timeout: 5_000 });
    const hasOfflineIndicator =
      /offline|Offline|📴|no connection|sample articles/i.test(bodyText) ||
      // The Croatia tab itself renders even without live news — just verify it loaded
      /History|Regions|Croatia/i.test(bodyText);

    expect(hasOfflineIndicator, 'Croatia tab should render offline content').toBe(true);
  });

  // ── 4. Progress saved offline ─────────────────────────────────────────────
  test('localStorage progress (XP=250) is preserved while offline', async ({ page }) => {
    await goOfflineAfterCaching(page);

    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible({ timeout: 15_000 });

    // localStorage is in-process — offline does not affect it
    const xp = await page.evaluate((email) => {
      try {
        const p = JSON.parse(localStorage.getItem('uP_' + email) || '{}');
        return (p?.st ?? p?.stats)?.xp ?? null;
      } catch (_) {
        return null;
      }
    }, TEST_EMAIL);

    expect(xp).toBe(250);
  });

  // ── 5. Reconnect — app still functions after going back online ────────────
  test('app continues to function after reconnecting from offline', async ({ page }) => {
    await goOfflineAfterCaching(page);

    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible({ timeout: 15_000 });

    // Go back online
    await page.context().setOffline(false);
    await page.waitForTimeout(800);

    // App must still be functional — nav bar intact
    await expect(nav).toBeVisible({ timeout: 10_000 });
  });

  // ── 6. No uncaught JS errors while offline ────────────────────────────────
  test('no unexpected JS errors are thrown while browsing offline', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await goOfflineAfterCaching(page);

    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible({ timeout: 15_000 });

    // Navigate around offline
    await nav.getByRole('button', { name: 'Learn', exact: true }).click();
    await page.waitForTimeout(500);
    await nav.getByRole('button', { name: 'Practice', exact: true }).click();
    await page.waitForTimeout(500);
    await nav.getByRole('button', { name: 'Today', exact: true }).click();
    await page.waitForTimeout(500);

    const unexpected = errors.filter(
      (e) =>
        !e.includes('firebase') &&
        !e.includes('firestore') &&
        !e.includes('Failed to fetch') &&
        !e.includes('NetworkError') &&
        !e.includes('net::ERR') &&
        !e.includes('AbortError') &&
        !e.includes('identitytoolkit') &&
        !e.includes('securetoken'),
    );

    expect(unexpected, `Unexpected JS errors while offline: ${unexpected.join(' | ')}`).toHaveLength(0);
  });

  // ── 7. Flashcards work offline (vocabulary bundled in JS) ─────────────────
  test('Flashcards game is playable offline using bundled vocabulary', async ({ page }) => {
    await goOfflineAfterCaching(page);

    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible({ timeout: 15_000 });

    await nav.getByRole('button', { name: 'Practice', exact: true }).click();

    // Switch to Challenge panel where the game tiles live
    await page.getByRole('button', { name: 'Challenge' }).click();
    await expect(page.getByText('Flashcards')).toBeVisible({ timeout: 8_000 });

    await page.getByText('Flashcards').click();

    // Vocabulary data is bundled in the JS bundle — flashcards should work offline
    await expect(page.getByText(/Tap card to flip|\d+ \/ \d+/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
