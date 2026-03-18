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
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 20_000 });
  });

  test('login form or app content is visible (app shell loaded)', async ({ page }) => {
    await page.goto('/');
    // Wait for Firebase auth to initialise — give it up to 25s
    // Could be login form (unauthenticated) or the main app (if session cookie present)
    await expect(
      page.getByPlaceholder(/email/i)
        .or(page.getByText(/Naša Hrvatska/i).first())
        .or(page.getByRole('navigation'))
        .or(page.getByRole('button'))
    ).toBeVisible({ timeout: 25_000 });
  });

  test('no JavaScript crashes on initial load', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 25_000 }).catch(() => {});
    const fatal = errors.filter(e =>
      !e.includes('firebase') &&
      !e.includes('firestore') &&
      !e.includes('Failed to fetch') &&
      !e.includes('NetworkError') &&
      !e.includes('net::ERR')
    );
    expect(fatal, `Unexpected JS errors: ${fatal.join(', ')}`).toHaveLength(0);
  });
});

test.describe('Production smoke — PWA assets', () => {
  test('web app manifest loads (finds URL from HTML link tag)', async ({ page }) => {
    await page.goto('/');
    // Find the manifest URL from the HTML rather than assuming a fixed filename
    const manifestUrl = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link ? link.href : null;
    });
    // Fall back to well-known path if page hasn't loaded yet
    const url = manifestUrl || '/manifest.webmanifest';
    const resp = await page.request.get(url);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.name).toContain('Naša Hrvatska');
    expect(body.icons?.length).toBeGreaterThan(0);
  });

  test('service worker is registered', async ({ page }) => {
    await page.goto('/');
    // Give SW time to register
    await page.waitForTimeout(3_000);
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
  test('HTTPS is enforced', async ({ page }) => {
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
  test('branding or UI is visible on load', async ({ page }) => {
    await page.goto('/');
    // Wait for the React app to boot and render something meaningful
    await page.waitForFunction(
      () => {
        const root = document.getElementById('root');
        return root && root.innerText.trim().length > 10;
      },
      { timeout: 25_000 }
    );
    // Any visible text in the app counts — login screen OR main app
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  test('privacy policy is accessible via in-app route', async ({ page }) => {
    // Navigate to root first so the SPA boots, then go to /privacy
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2_000); // let React render
    await page.goto('/privacy');
    // Allow extra time for the SPA to render the privacy route
    await expect(
      page.getByText(/Privacy|GDPR|data collection/i).first()
    ).toBeVisible({ timeout: 20_000 });
  });
});
