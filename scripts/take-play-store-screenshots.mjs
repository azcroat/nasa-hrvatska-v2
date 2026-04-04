// take-play-store-screenshots.mjs
// Captures 8 Play Store phone screenshots from the live nasahrvatska.com site.
// Uses guest mode + localStorage injection to simulate an active learner.
//
// Viewport: 390×693 (9:16) → resized to 1080×1920 with Sharp.
//
// Run: node scripts/take-play-store-screenshots.mjs
// Output: public/screenshots/play-store/01-home.png … 08-dark.png

import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, unlinkSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT     = resolve(__dirname, '..');
const OUT      = resolve(ROOT, 'public', 'screenshots', 'play-store');
mkdirSync(OUT, { recursive: true });

const BASE_URL = 'https://nasahrvatska.com';
// 393×698 CSS px × dpr 2.75 = 1081×1920 physical px → trimmed to 1080×1920
const W = 393, H = 698, DPR = 2.75;
const TODAY     = new Date().toISOString().slice(0, 10);
const YESTERDAY = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

// Week key for leaderboard XP
function weekKey() {
  const d = new Date();
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yr = d.getFullYear();
  const wn = Math.ceil(((d - new Date(yr, 0, 1)) / 86400000 + 1) / 7);
  return `${yr}-W${String(wn).padStart(2, '0')}`;
}

// Inject realistic demo state into localStorage before React loads
const demoStorage = {
  onboarded:          'true',
  placement_done:     'true',
  nh_placement_done:  'true',
  // 21-day streak ending yesterday → doGuest() will bump to 22 for today
  uStreak:            JSON.stringify({ count: 21, last: YESTERDAY }),
  nh_level:           'A2',
  nh_pwa_install_dismissed: '1',
  // Croatia tab: visited yesterday → shows "new" badge
  nh_croatia_last_visit: YESTERDAY,
  // 7-day progress history for the profile chart
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

// Extra: dark mode version
const demoStorageDark = { ...demoStorage, darkMode: '1' };

async function buildContext(browser, extraStorage = {}) {
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: DPR,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 ' +
               '(KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9,hr;q=0.8' },
  });

  // Inject localStorage + bot-detection bypass before any JS runs
  await context.addInitScript((storage) => {
    // Bot fingerprint patches — same as stealth-page.js fixture
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'plugins',   { get: () => [1, 2, 3] });
    window.chrome = { runtime: {} };
    // Pre-populate localStorage
    for (const [k, v] of Object.entries(storage)) {
      try { localStorage.setItem(k, v); } catch (_) {}
    }
  }, { ...demoStorage, ...extraStorage });

  return context;
}

async function enterGuestMode(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#root', { timeout: 20000 });

  // Extra settle time for the SPA to hydrate
  await page.waitForTimeout(2000);

  // Look for the "Continue as Guest" button (partial text match)
  const guestBtn = page.locator('button:has-text("Continue as Guest")');
  await guestBtn.waitFor({ state: 'visible', timeout: 12000 });
  await guestBtn.click();

  // Give the app time to transition from login → dashboard
  await page.waitForTimeout(3500);

  // Confirm nav bar is present (non-strict: just check it's in DOM)
  try {
    await page.waitForSelector('nav[aria-label="Main navigation"]', {
      state: 'attached', timeout: 8000,
    });
  } catch (_) {
    // Likely on welcome/placement — try to dismiss
    const skipBtn = page.locator('button:has-text("Skip"), button:has-text("Continue"), button:has-text("Start")').first();
    try { await skipBtn.click(); await page.waitForTimeout(2000); } catch (__) {}
  }

  // Dismiss cookie consent dialog if present (blocks all subsequent clicks)
  try {
    const cookieDialog = page.locator('[role="dialog"][aria-label="Cookie consent"]');
    await cookieDialog.waitFor({ state: 'visible', timeout: 4000 });
    // Click "Essential only" to dismiss without accepting analytics
    await page.locator('button:has-text("Essential only")').click();
    await page.waitForTimeout(800);
  } catch (_) {
    // No dialog — already dismissed or not shown
  }

  await page.waitForTimeout(1000); // Final settle
}

async function clickTab(page, label) {
  await page.locator(`button[aria-label="${label}"]`).click();
  await page.waitForTimeout(1000);
}

async function capture(page, name, waitFor) {
  if (waitFor) {
    try { await page.waitForSelector(waitFor, { timeout: 6000 }); } catch (_) {}
  }
  await page.waitForTimeout(800);
  const rawPath  = resolve(OUT, `${name}_raw.png`);
  const finalPath = resolve(OUT, `${name}.png`);
  await page.screenshot({ path: rawPath, fullPage: false });
  // Crop/fit to exact 1080×1920 — dpr:2.75 already gives ~1081×1920 physical pixels
  await sharp(rawPath)
    .resize(1080, 1920, { fit: 'cover', position: 'top' })
    .png({ compressionLevel: 8 })
    .toFile(finalPath);
  unlinkSync(rawPath);
  console.log(`  ✓ ${name}.png`);
}

// ─────────────────────────────────────────────────────────────────────────────

console.log('Launching Chromium…');
const browser = await chromium.launch({
  headless: true,
  args: [
    '--disable-blink-features=AutomationControlled',
    '--enable-features=CSSBackdropFilter',
    '--enable-gpu-rasterization',
  ],
});

try {
  // ── LIGHT MODE CONTEXT ─────────────────────────────────────────────────────
  const ctx = await buildContext(browser);
  const page = await ctx.newPage();

  // Suppress console errors to keep output clean
  page.on('console', () => {});
  page.on('pageerror', () => {});

  console.log('\nEntering guest mode…');
  await enterGuestMode(page);

  // ── 01: HOME / DASHBOARD ──────────────────────────────────────────────────
  console.log('\nCapturing screenshots…');
  // Dismiss any modals that may appear (apology, guest banner, PWA prompt)
  for (const closeSelector of [
    'button:has-text("I understand")',
    'button:has-text("Continue learning")',
    'button[aria-label="Dismiss"]',
    'button:has-text("Got it")',
    'button:has-text("Close")',
  ]) {
    try {
      const btn = page.locator(closeSelector).first();
      if (await btn.isVisible({ timeout: 1500 })) { await btn.click(); await page.waitForTimeout(500); }
    } catch (_) {}
  }
  await page.waitForTimeout(800);
  await capture(page, '01-home');

  // ── 02: LEARN TAB ─────────────────────────────────────────────────────────
  await clickTab(page, 'Learn');
  await capture(page, '02-learn');

  // ── 03: PRACTICE TAB (exercise list) ──────────────────────────────────────
  await clickTab(page, 'Practice');
  await capture(page, '03-practice', '.section-hdr');

  // ── 04: FLASHCARDS GAME ───────────────────────────────────────────────────
  // Click the dark quick-game card (not the "START NOW" recommendation card)
  const flashcardsBtn = page.locator('button.tc.practice-card-dark').filter({ hasText: 'Flashcards' }).first();
  await flashcardsBtn.click();
  // Wait for a flashcard to appear (front face with Croatian word)
  await capture(page, '04-flashcards', '.flashcard, [class*="flashcard"], [class*="card-front"]');

  // Go back to Practice tab
  const backBtn = page.locator('button[aria-label="Go back"], button:has-text("←"), button:has-text("Back"), [aria-label="back"], .back-btn').first();
  try { await backBtn.click(); await page.waitForTimeout(600); } catch (_) {
    // If no back button, click Practice tab directly
    await clickTab(page, 'Practice');
  }
  await page.waitForTimeout(500);

  // ── 05: QUIZ / VOCAB GAME ─────────────────────────────────────────────────
  await clickTab(page, 'Practice');
  await page.waitForTimeout(600);
  const quizBtn = page.locator('button.tc.practice-card-dark').filter({ hasText: 'Quiz' }).first();
  try {
    await quizBtn.click();
    await capture(page, '05-quiz', '.option-btn, [class*="option"], [class*="choice"]');
  } catch (_) {
    // Fall back to Word Sprint if Quiz click fails
    await clickTab(page, 'Practice');
    const sprintBtn = page.locator('button', { hasText: 'Word Sprint' }).first();
    await sprintBtn.click();
    await capture(page, '05-quiz');
  }

  // ── 06: CULTURE TAB ───────────────────────────────────────────────────────
  await clickTab(page, 'Culture');
  await page.waitForTimeout(1000);
  // Try to navigate into Croatian History — always accessible, no premium gate
  try {
    const historyBtn = page.locator('button:has-text("History"), a:has-text("History"), [role="button"]:has-text("History")').first();
    if (await historyBtn.isVisible({ timeout: 3000 })) {
      await historyBtn.click();
      await page.waitForTimeout(1500);
    }
  } catch (_) {}
  await capture(page, '06-culture');

  // ── 07: PROFILE / ME TAB ──────────────────────────────────────────────────
  await clickTab(page, 'Me');
  await capture(page, '07-profile', '[class*="profile"], [class*="stats"]');

  await ctx.close();

  // ── DARK MODE CONTEXT ─────────────────────────────────────────────────────
  const darkCtx = await buildContext(browser, { darkMode: '1' });
  const darkPage = await darkCtx.newPage();
  darkPage.on('console', () => {});
  darkPage.on('pageerror', () => {});

  console.log('\nDark mode context…');
  await enterGuestMode(darkPage);
  // Use Practice tab in dark mode — cleaner than blurry home hero card
  await clickTab(darkPage, 'Practice');
  await capture(darkPage, '08-dark-practice');

  await darkCtx.close();

} finally {
  await browser.close();
}

console.log(`\nAll 8 screenshots saved to:\n  ${OUT}`);
console.log('\nUpload these to Play Console → Store listing → Phone screenshots');
