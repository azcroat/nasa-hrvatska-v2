// take-tablet-screenshots.mjs
// Captures Play Store tablet screenshots from live nasahrvatska.com.
//
// 7-inch tablet:  600×960 CSS px × dpr 2  = 1200×1920 physical px
// 10-inch tablet: 800×1280 CSS px × dpr 2 = 1600×2560 physical px
//
// Run: node scripts/take-tablet-screenshots.mjs
// Output: public/screenshots/play-store/tablet-7in-*.png
//         public/screenshots/play-store/tablet-10in-*.png

import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, unlinkSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT  = resolve(ROOT, 'public', 'screenshots', 'play-store');
mkdirSync(OUT, { recursive: true });

const BASE_URL = 'https://nasahrvatska.com';
const TODAY     = new Date().toISOString().slice(0, 10);
const YESTERDAY = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

function weekKey() {
  const d = new Date();
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yr = d.getFullYear();
  const wn = Math.ceil(((d - new Date(yr, 0, 1)) / 86400000 + 1) / 7);
  return `${yr}-W${String(wn).padStart(2, '0')}`;
}

const demoStorage = {
  onboarded:         'true',
  placement_done:    'true',
  nh_placement_done: 'true',
  uStreak:           JSON.stringify({ count: 21, last: YESTERDAY }),
  nh_level:          'A2',
  nh_pwa_install_dismissed: '1',
  nh_croatia_last_visit: YESTERDAY,
  progress_history: JSON.stringify([
    { date: new Date(Date.now()-6*86400000).toISOString().slice(0,10), xp:85,  lc:3,  gc:1 },
    { date: new Date(Date.now()-5*86400000).toISOString().slice(0,10), xp:165, lc:6,  gc:2 },
    { date: new Date(Date.now()-4*86400000).toISOString().slice(0,10), xp:290, lc:11, gc:4 },
    { date: new Date(Date.now()-3*86400000).toISOString().slice(0,10), xp:420, lc:16, gc:6 },
    { date: new Date(Date.now()-2*86400000).toISOString().slice(0,10), xp:570, lc:22, gc:9 },
    { date: YESTERDAY, xp:740, lc:28, gc:12 },
    { date: TODAY,     xp:920, lc:35, gc:15 },
  ]),
  [`nh_week_xp_${weekKey()}`]: '180',
};

async function buildContext(browser, W, H, DPR) {
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: DPR,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel Tablet) AppleWebKit/537.36 ' +
               '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9,hr;q=0.8' },
  });
  await context.addInitScript((storage) => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'plugins',   { get: () => [1, 2, 3] });
    window.chrome = { runtime: {} };
    for (const [k, v] of Object.entries(storage)) {
      try { localStorage.setItem(k, v); } catch (_) {}
    }
  }, demoStorage);
  return context;
}

async function enterGuestMode(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#root', { timeout: 20000 });
  await page.waitForTimeout(2000);
  const guestBtn = page.locator('button:has-text("Continue as Guest")');
  await guestBtn.waitFor({ state: 'visible', timeout: 12000 });
  await guestBtn.click();
  await page.waitForTimeout(3500);
  // Dismiss cookie consent
  try {
    const cookieDialog = page.locator('[role="dialog"][aria-label="Cookie consent"]');
    await cookieDialog.waitFor({ state: 'visible', timeout: 4000 });
    await page.locator('button:has-text("Essential only")').click();
    await page.waitForTimeout(800);
  } catch (_) {}
  // Dismiss any other modals
  for (const sel of ['button:has-text("I understand")', 'button[aria-label="Dismiss"]']) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 1200 })) { await btn.click(); await page.waitForTimeout(400); }
    } catch (_) {}
  }
  await page.waitForTimeout(800);
}

async function clickTab(page, label) {
  await page.locator(`button[aria-label="${label}"]`).click();
  await page.waitForTimeout(1000);
}

async function capture(page, name, targetW, targetH) {
  await page.waitForTimeout(800);
  const rawPath   = resolve(OUT, `${name}_raw.png`);
  const finalPath = resolve(OUT, `${name}.png`);
  await page.screenshot({ path: rawPath, fullPage: false });
  await sharp(rawPath)
    .resize(targetW, targetH, { fit: 'contain', position: 'top', background: { r: 244, g: 246, b: 249, alpha: 1 } })
    .png({ compressionLevel: 8 })
    .toFile(finalPath);
  unlinkSync(rawPath);
  console.log(`  ✓ ${name}.png  (${targetW}×${targetH})`);
}

// ─────────────────────────────────────────────────────────────────────────────

console.log('Launching Chromium…');
const browser = await chromium.launch({
  headless: true,
  args: [
    '--disable-blink-features=AutomationControlled',
    '--enable-features=CSSBackdropFilter',
  ],
});

try {
  // ── 7-INCH TABLET (600×960 CSS × dpr2 = 1200×1920) ───────────────────────
  console.log('\n── 7-inch tablet (1200×1920) ──');
  const ctx7 = await buildContext(browser, 600, 960, 2);
  const page7 = await ctx7.newPage();
  page7.on('console', () => {}); page7.on('pageerror', () => {});
  await enterGuestMode(page7);

  await clickTab(page7, 'Learn');
  await capture(page7, 'tablet-7in-01-learn', 1200, 1920);

  await clickTab(page7, 'Practice');
  await capture(page7, 'tablet-7in-02-practice', 1200, 1920);

  await clickTab(page7, 'Culture');
  await capture(page7, 'tablet-7in-03-culture', 1200, 1920);

  await ctx7.close();

  // ── 10-INCH TABLET — upscale the 7-inch shots (same 5:8 ratio, clean 4/3×) ─
  // 1200×1920 × 4/3 = 1600×2560 exactly. No extra browser session needed.
  console.log('\n── 10-inch tablet (1600×2560, upscaled from 7-inch) ──');
  for (const [src, dst] of [
    ['tablet-7in-01-learn',    'tablet-10in-01-learn'],
    ['tablet-7in-02-practice', 'tablet-10in-02-practice'],
    ['tablet-7in-03-culture',  'tablet-10in-03-culture'],
  ]) {
    await sharp(resolve(OUT, `${src}.png`))
      .resize(1600, 2560, { fit: 'fill' })
      .png({ compressionLevel: 8 })
      .toFile(resolve(OUT, `${dst}.png`));
    console.log(`  ✓ ${dst}.png  (1600×2560)`);
  }

} finally {
  await browser.close();
}

console.log(`\nAll tablet screenshots saved to:\n  ${OUT}`);
console.log('\nUpload to Play Console → Store listing → Tablet screenshots');
