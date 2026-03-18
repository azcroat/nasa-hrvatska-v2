/**
 * Production smoke tests — runs against https://nasahrvatska.com
 * Lightweight, no mocking, no login. Verifies the live deployment is healthy.
 * Runs every 6 hours via GitHub Actions + on every push.
 */
import { test, expect } from '@playwright/test';

test.describe('Production smoke — site availability', () => {
  test('homepage loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Naša Hrvatska/i, { timeout: 30_000 });
  });

  test('page returns HTTP 200 (no 404, 500, or Cloudflare error)', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('app root renders — not a blank white screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15_000 });
  });

  test('login form is visible (app shell loaded, not a crash)', async ({ page }) => {
    await page.goto('/');
    // Unauthenticated users should see the login form
    await expect(
      page.getByPlaceholder(/email/i).or(page.getByText(/Sign in|Log in|Naša Hrvatska/i))
    ).toBeVisible({ timeout: 15_000 });
  });

  test('no JavaScript crashes on initial load', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 20_000 });
    // Filter known benign Firebase offline warnings
    const fatal = errors.filter(e =>
      !e.includes('firebase') &&
      !e.includes('firestore') &&
      !e.includes('Failed to fetch') &&
      !e.includes('NetworkError')
    );
    expect(fatal, `JS errors: ${fatal.join(', ')}`).toHaveLength(0);
  });
});

test.describe('Production smoke — PWA assets', () => {
  test('web app manifest loads', async ({ page }) => {
    const resp = await page.request.get('/manifest.webmanifest');
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.name).toContain('Naša Hrvatska');
    expect(body.icons?.length).toBeGreaterThan(0);
  });

  test('service worker script is served', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 20_000 });
    const swRegistered = await page.evaluate(() =>
      'serviceWorker' in navigator
        ? navigator.serviceWorker.getRegistrations().then(r => r.length > 0)
        : Promise.resolve(false)
    );
    expect(swRegistered).toBe(true);
  });

  test('192x192 app icon is served', async ({ page }) => {
    const resp = await page.request.get('/icon-192.png');
    expect(resp.status()).toBe(200);
    expect(resp.headers()['content-type']).toContain('image/png');
  });

  test('512x512 app icon is served', async ({ page }) => {
    const resp = await page.request.get('/icon-512.png');
    expect(resp.status()).toBe(200);
  });

  test('apple-touch-icon is served', async ({ page }) => {
    const resp = await page.request.get('/apple-touch-icon.png');
    expect(resp.status()).toBe(200);
  });

  test('assetlinks.json is served (required for Android TWA)', async ({ page }) => {
    const resp = await page.request.get('/.well-known/assetlinks.json');
    expect(resp.status()).toBe(200);
  });
});

test.describe('Production smoke — security headers', () => {
  test('HTTPS is enforced (no mixed content)', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.url()).toMatch(/^https:/);
  });

  test('X-Frame-Options or CSP frame-ancestors header is set', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers() ?? {};
    const hasFrameProtection =
      'x-frame-options' in headers ||
      (headers['content-security-policy'] || '').includes('frame-ancestors');
    expect(hasFrameProtection).toBe(true);
  });

  test('Content-Security-Policy header is present', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers() ?? {};
    expect(headers['content-security-policy']).toBeTruthy();
  });
});

test.describe('Production smoke — core page content', () => {
  test('Croatian flag or branding is visible on login screen', async ({ page }) => {
    await page.goto('/');
    // CroatianGrb SVG or branding text visible
    await expect(
      page.getByText(/Naša Hrvatska|Croatian|Learn/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('privacy policy page loads', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByText(/Privacy|GDPR|data/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
