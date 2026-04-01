/**
 * Production smoke tests — runs against https://nasahrvatska.com
 * Checks: site is up, no JS crashes, PWA assets load, security headers present.
 * Runs every 6 hours via GitHub Actions + on every push.
 */
import { test, expect } from '@playwright/test';

test.describe('Production smoke — site availability', () => {
  test('homepage returns HTTP 200', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('page title contains Naša Hrvatska', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Naša Hrvatska/i, { timeout: 30_000 });
  });

  test('app root renders — not a blank white screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 20_000 });
  });

  test('app displays content within 25 seconds', async ({ page }) => {
    await page.goto('/');
    // Wait for React to render something — login screen OR main app
    await page.waitForFunction(
      () => {
        const root = document.getElementById('root');
        return root && root.innerText && root.innerText.trim().length > 5;
      },
      { timeout: 25_000 }
    );
  });

  test('no unexpected JavaScript crashes on load', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    // Give Firebase and React time to initialise
    await page.waitForTimeout(5_000);
    const fatal = errors.filter(e =>
      !e.includes('firebase') &&
      !e.includes('firestore') &&
      !e.includes('Failed to fetch') &&
      !e.includes('NetworkError') &&
      !e.includes('net::ERR') &&
      !e.includes('AbortError')
    );
    expect(fatal, `Unexpected JS errors on load: ${fatal.join(' | ')}`).toHaveLength(0);
  });
});

test.describe('Production smoke — PWA assets', () => {
  test('service worker is registered after page load', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    // SW registers asynchronously after React boots — poll up to 15s
    const registered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      for (let i = 0; i < 30; i++) {
        const regs = await navigator.serviceWorker.getRegistrations();
        if (regs.length > 0) return true;
        await new Promise(r => setTimeout(r, 500));
      }
      return false;
    });
    expect(registered, 'Service worker must be registered').toBe(true);
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

  test('assetlinks.json is served (Android TWA domain verification)', async ({ page }) => {
    const resp = await page.request.get('/.well-known/assetlinks.json');
    expect(resp.status()).toBe(200);
  });

  test('web app manifest link tag is present in HTML head', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const manifestHref = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link?.href ?? null;
    });
    expect(manifestHref, 'manifest <link rel="manifest"> must exist in <head>').toBeTruthy();
    // Lighthouse validates the manifest content — smoke test only checks presence
  });
});

test.describe('Production smoke — security headers', () => {
  test('HTTPS is enforced (final URL is https://)', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.url()).toMatch(/^https:/);
  });

  test('X-Frame-Options or frame-ancestors CSP is set', async ({ page }) => {
    const response = await page.goto('/');
    const h = response?.headers() ?? {};
    const ok = 'x-frame-options' in h ||
      (h['content-security-policy'] ?? '').includes('frame-ancestors');
    expect(ok, 'Must have X-Frame-Options or CSP frame-ancestors').toBe(true);
  });

  test('Content-Security-Policy header is present', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.headers()?.['content-security-policy']).toBeTruthy();
  });
});
