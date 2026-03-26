import { test, expect } from './fixtures/stealth-page.js';
import path from 'path';
import fs from 'fs';

const OUT = path.join(process.cwd(), 'screenshots');

test.describe.configure({ mode: 'serial' });

test.describe('Visual sign-off screenshots', () => {
  test.beforeAll(() => {
    if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  });

  test('01 — login screen (desktop)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('#root', { timeout: 15000 });
    await page.screenshot({ path: path.join(OUT, '01-login-desktop.png'), fullPage: false });
  });

  test('02 — login screen (mobile)', async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    const page = await ctx.newPage();
    await page.goto('https://nasahrvatska.com', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('#root', { timeout: 15000 });
    await page.screenshot({ path: path.join(OUT, '02-login-mobile.png'), fullPage: false });
    await ctx.close();
  });

  test('03 — register tab', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('#root', { timeout: 15000 });
    // Switch to register view
    const createBtn = page.getByText('Create one');
    if (await createBtn.isVisible()) await createBtn.click();
    await page.screenshot({ path: path.join(OUT, '03-register.png'), fullPage: false });
  });

  test('04 — full login page (scrolled)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('#root', { timeout: 15000 });
    await page.screenshot({ path: path.join(OUT, '04-login-full.png'), fullPage: true });
  });
});
