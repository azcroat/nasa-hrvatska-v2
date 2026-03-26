import { test, expect } from './fixtures/stealth-page.js';

test.describe('Live site — load and navigation smoke tests', () => {
  test('site loads without JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('#root', { timeout: 15000 });
    // ResizeObserver errors are benign browser quirks — filter them out
    const fatal = errors.filter(e => !e.includes('ResizeObserver'));
    expect(fatal).toHaveLength(0);
  });

  test('login screen renders correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    await expect(page.getByText('Naša Hrvatska')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Sign in with Google')).toBeVisible({ timeout: 10000 });
  });

  test('login screen has email and password fields', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    await expect(page.locator('#auth-email')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#auth-password')).toBeVisible({ timeout: 10000 });
  });

  test('skip to main content link is present', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached({ timeout: 10000 });
  });
});
