/**
 * Offline / PWA resilience tests.
 * Verifies the service worker caches the app shell so it loads without a network,
 * and that the app degrades gracefully on poor connectivity.
 */
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS } from './fixtures/seed-auth.js';

test.describe('Offline mode (PWA / service worker)', () => {
  test('app shell renders without any network (full offline)', async ({ page }) => {
    // Load once online so SW can cache the shell
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 15_000 });

    // Wait for service worker to become active
    await page.evaluate(() =>
      'serviceWorker' in navigator
        ? navigator.serviceWorker.ready
        : Promise.resolve()
    );

    // Re-seed for the reload (init scripts only apply until next navigation)
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);

    // Cut the network
    await page.context().setOffline(true);

    // Reload — should serve from SW cache
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15_000 });

    // App root must render (not a browser "no connection" error page)
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 10_000 });
  });

  test('core navigation tabs are still visible offline after caching', async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible({ timeout: 15_000 });

    await page.evaluate(() =>
      'serviceWorker' in navigator ? navigator.serviceWorker.ready : Promise.resolve()
    );

    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.context().setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15_000 });

    await expect(nav).toBeVisible({ timeout: 10_000 });
  });

  test('can switch between tabs while offline', async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 15_000 });

    await page.evaluate(() =>
      'serviceWorker' in navigator ? navigator.serviceWorker.ready : Promise.resolve()
    );

    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.context().setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15_000 });

    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible({ timeout: 10_000 });

    // Switch to Practice tab — should work offline
    await nav.getByRole('button', { name: 'Practice', exact: true }).click();
    await expect(page.getByText('AI Voice Conversation')).toBeVisible({ timeout: 5_000 });
  });

  test('practice games (Flashcards) work offline with cached vocabulary', async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 15_000 });

    await page.evaluate(() =>
      'serviceWorker' in navigator ? navigator.serviceWorker.ready : Promise.resolve()
    );

    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.context().setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15_000 });

    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await nav.getByRole('button', { name: 'Practice', exact: true }).click();
    // Switch to Challenge panel where game buttons are
    await page.getByRole('button', { name: 'Challenge' }).click();
    await page.getByText('Flashcards').click();
    // Vocabulary data is bundled in JS — flashcards should work offline
    await expect(page.getByText(/Tap card to flip/i)).toBeVisible({ timeout: 8_000 });
  });

  test('no uncaught JS errors are thrown while offline', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 15_000 });

    await page.evaluate(() =>
      'serviceWorker' in navigator ? navigator.serviceWorker.ready : Promise.resolve()
    );

    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.context().setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15_000 });

    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible({ timeout: 10_000 });

    // Navigate around — should produce no uncaught errors
    await nav.getByRole('button', { name: 'Learn', exact: true }).click();
    await page.waitForTimeout(500);
    await nav.getByRole('button', { name: 'Practice', exact: true }).click();
    await page.waitForTimeout(500);

    // Filter out expected Firebase network errors (those are handled, not uncaught)
    const unexpected = errors.filter(e =>
      !e.includes('firebase') &&
      !e.includes('firestore') &&
      !e.includes('Failed to fetch') &&
      !e.includes('NetworkError') &&
      !e.includes('net::ERR')
    );
    expect(unexpected).toHaveLength(0);
  });

  test('app recovers when connection is restored', async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 15_000 });

    // Go offline
    await page.context().setOffline(true);
    await page.waitForTimeout(500);

    // Go back online
    await page.context().setOffline(false);
    await page.waitForTimeout(500);

    // App should still be functional
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 5_000 });
  });
});
