/**
 * Live user-experience audit — nasahrvatska.com
 * Logs in as the Claude test account and walks through the app like a real user.
 * Captures screenshots at every step, logs all JS errors, and documents
 * every friction point encountered.
 *
 * Run: npx playwright test --config playwright.ux.config.js --project Chrome
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const EMAIL = 'claude.test.nasahrvatska@gmail.com';
const PASSWORD = '***REMOVED***';
const REPORT_PATH = 'ux-audit-report.json';

const issues = [];
const timings = {};
const jsErrors = [];

function logIssue(severity, area, description, detail = '') {
  const entry = { severity, area, description, detail, ts: new Date().toISOString() };
  issues.push(entry);
  console.log(`[${severity}] ${area}: ${description}${detail ? ' — ' + detail : ''}`);
}

async function screenshot(page, name) {
  const path = `ux-audit-${name.replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '')}.png`;
  await page.screenshot({ path, fullPage: false }).catch(() => {});
  console.log(`  📸 ${path}`);
  return path;
}

async function loginAndWait(page, waitForFirebase = true) {
  await page.goto('/');
  // Wait for login form or app
  await page.waitForFunction(
    () => {
      const t = document.getElementById('root')?.innerText || '';
      return t.length > 5;
    },
    { timeout: 20000 }
  ).catch(() => {});

  const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
  if (!await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) return; // already logged in

  await emailInput.fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.locator('input[type="password"]').first().press('Enter');

  // Wait for sidebar nav to appear (confirms app is fully loaded)
  await page.waitForFunction(
    () => {
      const t = document.getElementById('root')?.innerText || '';
      return t.includes('Home') && (t.includes('Path') || t.includes('Practice'));
    },
    { timeout: 20000 }
  ).catch(() => {});

  if (waitForFirebase) {
    // Wait for Firebase to hydrate — XP should update from 0
    await page.waitForTimeout(4000);
  }
}

async function dismissModals(page) {
  // Dismiss onboarding tour if present
  const skipIntro = page.locator('button').filter({ hasText: /skip intro/i }).first();
  if (await skipIntro.isVisible({ timeout: 1000 }).catch(() => false)) {
    await skipIntro.click();
    await page.waitForTimeout(300);
  }
  // Dismiss backup banner
  const closeX = page.locator('button').filter({ hasText: '×' }).or(page.locator('[aria-label*="close" i]')).first();
  if (await closeX.isVisible({ timeout: 500 }).catch(() => false)) {
    await closeX.click();
    await page.waitForTimeout(200);
  }
}

test.describe('UX Audit — Full user journey on nasahrvatska.com', () => {
  test.skip(!!process.env.CI, 'Requires real Firebase credentials — run locally only');

  test.beforeAll(() => {
    if (fs.existsSync(REPORT_PATH)) fs.unlinkSync(REPORT_PATH);
  });

  test('1. Page load performance', async ({ page }) => {
    page.on('pageerror', err => {
      if (!err.message.includes('firebase') && !err.message.includes('firestore')) {
        jsErrors.push({ msg: err.message });
        logIssue('BUG', 'JS Error', err.message.slice(0, 120));
      }
    });
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const t = msg.text();
        if (!t.includes('firebase') && !t.includes('ERR_') && !t.includes('net::') && !t.includes('CSP') && !t.includes('Content Security')) {
          logIssue('WARN', 'Console Error', t.slice(0, 120));
        }
      }
    });

    const t0 = Date.now();
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    timings.domContentLoaded = Date.now() - t0;

    if (response?.status() !== 200) logIssue('CRITICAL', 'Load', `HTTP ${response?.status()}`);

    // Wait for Croatian grb + loading text OR login form
    await page.waitForFunction(() => {
      const t = document.getElementById('root')?.innerText || '';
      return t.length > 5;
    }, { timeout: 15000 }).catch(() => logIssue('CRITICAL', 'Load', 'Nothing rendered within 15s'));

    timings.firstContentful = Date.now() - t0;
    await screenshot(page, '01-page-load');

    if (timings.firstContentful > 5000)
      logIssue('PERF', 'Load Time', `${timings.firstContentful}ms to first content (>5s is very slow)`);
    else if (timings.firstContentful > 3000)
      logIssue('PERF', 'Load Time', `${timings.firstContentful}ms to first content (3-5s is slow)`);
    else
      console.log(`  ✅ First content: ${timings.firstContentful}ms`);
  });

  test('2. Login — timing & first screen', async ({ page }) => {
    page.on('pageerror', err => jsErrors.push({ msg: err.message }));

    const t0 = Date.now();
    await loginAndWait(page, false);
    timings.loginToApp = Date.now() - t0;

    await screenshot(page, '02-just-logged-in');

    if (timings.loginToApp > 10000) logIssue('PERF', 'Login', `Login took ${timings.loginToApp}ms (>10s)`);
    else if (timings.loginToApp > 6000) logIssue('PERF', 'Login', `Login took ${timings.loginToApp}ms (6-10s is slow)`);
    else console.log(`  ✅ Login to app: ${timings.loginToApp}ms`);

    // Check if welcome modal is showing (BUG: should not for returning user)
    const welcomeModal = page.locator('text=Dobrodošli').or(page.locator('text=Welcome!')).first();
    if (await welcomeModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      logIssue('BUG', 'Welcome Modal', 'Onboarding intro modal shown for returning user on login');
      await screenshot(page, '02-welcome-modal-visible');
    } else {
      console.log('  ✅ No onboarding modal on login (returning user)');
    }

    // Check if backup banner is showing (annoyance for returning users)
    const backupBanner = page.locator('text=progress is now protected').or(page.locator('text=backed up to the cloud')).first();
    if (await backupBanner.isVisible({ timeout: 2000 }).catch(() => false)) {
      logIssue('UX', 'Backup Banner', '"Your progress is now protected" shown — OK for new users, annoying for returning');
      await screenshot(page, '02-backup-banner');
    }
  });

  test('3. Home screen — nav, XP, streak, hero lesson', async ({ page }) => {
    page.on('pageerror', err => jsErrors.push({ msg: err.message }));

    await loginAndWait(page, true);
    await dismissModals(page);
    await screenshot(page, '03-home-screen');

    const txt = await page.locator('#root').innerText().catch(() => '');

    // Check sidebar nav items
    const navItems = ['Home', 'Path', 'Practice', 'Life in Croatia', 'Profile'];
    for (const item of navItems) {
      const el = page.locator('text=' + item).first();
      if (!await el.isVisible({ timeout: 500 }).catch(() => false)) {
        logIssue('BUG', 'Navigation', `"${item}" nav item not visible`);
      }
    }

    // Check XP display
    const xpMatch = txt.match(/(\d+)\s*XP/);
    if (xpMatch) {
      const xp = parseInt(xpMatch[1]);
      console.log(`  📊 XP shown: ${xp}`);
      if (xp === 0) logIssue('BUG', 'XP Display', 'XP shows 0 after Firebase hydration — progress not restored');
      else console.log(`  ✅ XP correctly shown: ${xp}`);
    } else {
      logIssue('WARN', 'XP Display', 'Cannot find XP value in sidebar');
    }

    // Check streak
    if (txt.match(/streak/i)) {
      const streakMatch = txt.match(/(\d+)\s*streak/i);
      console.log(`  📊 ${streakMatch?.[0] || 'streak shown'}`);
    }

    // Check hero/next lesson section
    if (txt.match(/next lesson|Start Now|continue|Basic Greet/i)) {
      console.log('  ✅ Hero lesson visible on home screen');
    } else {
      logIssue('UX', 'Hero Lesson', 'No "next lesson" or "Start Now" visible on home screen');
    }

    // Check weekly goal
    if (txt.match(/weekly goal/i)) {
      if (txt.match(/tap set|choose.*target/i)) {
        logIssue('UX', 'Weekly Goal', 'Weekly goal not set — "Tap Set to choose a weekly target" shown, could confuse new users');
      } else {
        console.log('  ✅ Weekly goal configured');
      }
    }
  });

  test('4. XP after Firebase hydration — core fix verification', async ({ page }) => {
    page.on('pageerror', err => jsErrors.push({ msg: err.message }));

    // Use fresh context to simulate a device that has no localStorage
    const ctx = await page.context().browser().newContext();
    const freshPage = await ctx.newPage();
    freshPage.on('pageerror', err => jsErrors.push({ msg: err.message }));
    // Capture ALL console output from this fresh page to diagnose Firebase issues
    const freshLogs = [];
    freshPage.on('console', msg => {
      const text = msg.text();
      freshLogs.push(`[${msg.type()}] ${text}`);
      if (text.includes('fbLoad') || text.includes('firebase') || text.includes('Firebase') ||
          text.includes('XP') || text.includes('xp') || text.includes('progress') ||
          text.includes('hydrat') || text.includes('syncReady') || text.includes('attempt')) {
        console.log(`  [FRESH PAGE] ${text.slice(0, 200)}`);
      }
    });

    await freshPage.goto('/');
    await freshPage.waitForFunction(() => (document.getElementById('root')?.innerText || '').length > 5, { timeout: 15000 }).catch(() => {});

    const t0 = Date.now();
    const emailInput = freshPage.locator('input[type="email"], input[placeholder*="email" i]').first();
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailInput.fill(EMAIL);
      await freshPage.locator('input[type="password"]').first().fill(PASSWORD);
      await freshPage.locator('input[type="password"]').first().press('Enter');
    }

    await freshPage.waitForFunction(
      () => {
        const t = document.getElementById('root')?.innerText || '';
        return t.includes('Home') && t.includes('Path');
      },
      { timeout: 20000 }
    ).catch(() => {});

    // WAIT for Firebase to hydrate (this is the critical test of our race condition fix)
    await freshPage.waitForTimeout(8000);
    await screenshot(freshPage, '04-fresh-device-after-firebase-hydration');

    const txt = await freshPage.locator('#root').innerText().catch(() => '');
    const xpMatch = txt.match(/(\d+)\s*XP/);
    const xp = xpMatch ? parseInt(xpMatch[1]) : 0;

    console.log(`  XP on fresh device after 8s: ${xp}`);
    console.log(`  Login time: ${Date.now() - t0}ms`);
    // Show all fresh page logs for debugging
    if (xp === 0) {
      console.log('  === FRESH PAGE CONSOLE LOGS ===');
      freshLogs.forEach(l => console.log('  ' + l.slice(0, 250)));
    }

    if (xp === 0) {
      logIssue('CRITICAL', 'Fresh Device XP', `XP still 0 after 8s on fresh device — race condition fix not working`);
    } else if (xp >= 85) {
      console.log(`  ✅ RACE CONDITION FIX WORKING: Firebase XP (${xp}) correctly applied on fresh device`);
    } else {
      logIssue('WARN', 'Fresh Device XP', `XP is ${xp}, expected ≥85 — partial restore?`);
    }

    // Check for welcome modal on fresh device (should NOT show for returning user)
    const welcomeModal = freshPage.locator('text=Dobrodošli').first();
    if (await welcomeModal.isVisible({ timeout: 1000 }).catch(() => false)) {
      logIssue('BUG', 'Welcome Modal Fresh Device', 'Onboarding intro still shows on fresh device for returning user');
    } else {
      console.log('  ✅ No onboarding modal on fresh device');
    }

    await ctx.close();
  });

  test('5. Path/Learn tab — lesson start flow', async ({ page }) => {
    page.on('pageerror', err => jsErrors.push({ msg: err.message }));

    await loginAndWait(page, true);
    await dismissModals(page);

    // Click Path in sidebar
    const pathNav = page.locator('text=Path').first();
    if (!await pathNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      logIssue('BUG', 'Path Tab', 'Path nav item not clickable');
      return;
    }
    await pathNav.click();
    await page.waitForTimeout(1500);
    await screenshot(page, '05-path-screen');

    const pathText = await page.locator('#root').innerText().catch(() => '');

    // Check for lesson cards
    if (pathText.match(/lesson|greet|hello|basic|beginner|level/i)) {
      console.log('  ✅ Lessons visible on Path screen');
    } else {
      logIssue('UX', 'Path Content', 'No lesson content visible on Path screen');
    }

    // Try to start a lesson
    const startBtns = [
      page.locator('button').filter({ hasText: /start|begin|play|continue/i }).first(),
      page.locator('button').filter({ hasText: /Basic Greet/i }).first(),
    ];

    let lessonStarted = false;
    for (const btn of startBtns) {
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(1500);
        const after = await page.locator('#root').innerText().catch(() => '');
        if (after.match(/choose|select|translate|answer|true|false/i)) {
          lessonStarted = true;
          console.log('  ✅ Lesson started');
          await screenshot(page, '05-lesson-question');
          break;
        }
      }
    }

    if (!lessonStarted) {
      // Try clicking "Start Now" button visible on home hero
      await page.goto('/');
      await page.waitForTimeout(3000);
      await dismissModals(page);
      const startNow = page.locator('button').filter({ hasText: /Start Now/i }).first();
      if (await startNow.isVisible({ timeout: 2000 }).catch(() => false)) {
        await startNow.click();
        await page.waitForTimeout(2000);
        const after2 = await page.locator('#root').innerText().catch(() => '');
        lessonStarted = after2.match(/choose|select|translate|answer|true|false|word/i) !== null;
        if (lessonStarted) {
          console.log('  ✅ Lesson started via "Start Now"');
          await screenshot(page, '05-lesson-start-now');
        }
      }
    }

    if (!lessonStarted) {
      logIssue('UX', 'Lesson Start', 'Could not find a way to start a lesson (tried Path + Start Now buttons)');
      await screenshot(page, '05-lesson-not-started');
    }
  });

  test('6. Practice tab — modes & flashcards', async ({ page }) => {
    page.on('pageerror', err => jsErrors.push({ msg: err.message }));

    await loginAndWait(page, true);
    await dismissModals(page);

    const practiceNav = page.locator('text=Practice').first();
    if (!await practiceNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      logIssue('BUG', 'Practice Nav', 'Practice nav item not found');
      return;
    }
    await practiceNav.click();
    await page.waitForTimeout(1500);
    await screenshot(page, '06-practice-screen');

    const txt = await page.locator('#root').innerText().catch(() => '');

    // Check practice modes
    const modes = [];
    for (const m of ['Flashcards', 'Quiz', 'Listening', 'Grammar', 'Spelling', 'Speaking', 'Review']) {
      if (txt.match(new RegExp(m, 'i'))) modes.push(m);
    }
    if (modes.length === 0) {
      logIssue('UX', 'Practice Modes', 'No practice mode labels visible');
    } else {
      console.log(`  ✅ Practice modes: ${modes.join(', ')}`);
    }

    // Try flashcards
    const fcBtn = page.locator('button, div').filter({ hasText: /flashcard/i }).first();
    if (await fcBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await fcBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, '06-flashcards');

      // Check for due reviews count
      const fcText = await page.locator('#root').innerText().catch(() => '');
      const dueMatch = fcText.match(/(\d+)\s*(due|to review|cards)/i);
      if (dueMatch) console.log(`  📊 ${dueMatch[0]}`);

      // Check empty state
      if (fcText.match(/no.*due|nothing.*review|all.*done|come back/i)) {
        logIssue('UX', 'Flashcards Empty', 'Flashcard queue empty for new session — expected, but verify');
      }
    } else {
      logIssue('UX', 'Flashcards', 'Flashcards button not visible in Practice screen');
    }
  });

  test('7. Profile — stats accuracy & logout', async ({ page }) => {
    page.on('pageerror', err => jsErrors.push({ msg: err.message }));

    await loginAndWait(page, true);
    await dismissModals(page);

    const profileNav = page.locator('text=Profile').first();
    if (!await profileNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      logIssue('BUG', 'Profile Nav', 'Profile nav item not found');
      return;
    }
    await profileNav.click();
    await page.waitForTimeout(1500);
    await screenshot(page, '07-profile');

    const txt = await page.locator('#root').innerText().catch(() => '');

    // XP on profile
    const xpMatch = txt.match(/(\d+)\s*XP/);
    if (!xpMatch) logIssue('BUG', 'Profile XP', 'XP not visible on profile screen');
    else console.log(`  📊 Profile XP: ${xpMatch[0]}`);

    // Name shown
    if (txt.includes('Claude Tester') || txt.includes('claude')) {
      console.log('  ✅ Username shown on profile');
    } else {
      logIssue('WARN', 'Profile Name', 'Username not visible on profile');
    }

    // Check for logout button
    const logoutBtn = page.locator('button').filter({ hasText: /log.?out|sign.?out/i }).first();
    const logoutVisible = await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (!logoutVisible) {
      // Try scrolling
      await page.evaluate(() => window.scrollTo(0, 9999));
      await page.waitForTimeout(300);
    }
    if (!await logoutBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      logIssue('UX', 'Logout Button', 'Logout button not easily visible on Profile screen');
      await screenshot(page, '07-logout-not-visible');
    } else {
      console.log('  ✅ Logout button visible');
    }

    // Settings / editing name
    const editBtn = page.locator('button').filter({ hasText: /edit|change name|settings/i }).first();
    if (!await editBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      logIssue('UX', 'Profile Edit', 'No visible way to edit name or settings from profile');
    }
  });

  test('8. Family leaderboard — join EPLJRC family', async ({ page }) => {
    page.on('pageerror', err => jsErrors.push({ msg: err.message }));

    await loginAndWait(page, true);
    await dismissModals(page);

    // Click FAMILY button at bottom of sidebar
    const familyBtn = page.locator('text=FAMILY').or(page.locator('button').filter({ hasText: /family/i })).first();
    if (!await familyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Try via profile
      const profileNav = page.locator('text=Profile').first();
      if (await profileNav.isVisible().catch(() => false)) {
        await profileNav.click();
        await page.waitForTimeout(500);
      }
      const lbBtn = page.locator('button').filter({ hasText: /leaderboard|family/i }).first();
      if (!await lbBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        logIssue('UX', 'Family Leaderboard', 'Cannot find family/leaderboard button');
        return;
      }
      await lbBtn.click();
    } else {
      await familyBtn.click();
    }

    await page.waitForTimeout(1500);
    await screenshot(page, '08-family-screen');

    const txt = await page.locator('#root').innerText().catch(() => '');

    if (txt.match(/create.*family|join.*family|no family/i)) {
      // Try joining EPLJRC
      const joinTab = page.locator('button').filter({ hasText: /join family/i }).first();
      if (await joinTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await joinTab.click();
        await page.waitForTimeout(500);
        const codeInput = page.locator('input[maxlength="6"]').or(page.locator('input[placeholder*="code" i]')).first();
        if (await codeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await codeInput.fill('EPLJRC');
          const joinBtn = page.locator('button').filter({ hasText: /join family/i }).last();
          await joinBtn.click();
          await page.waitForTimeout(3000);
          await screenshot(page, '08-after-join');
          const after = await page.locator('#root').innerText().catch(() => '');
          if (after.match(/Jeff|Klara|Tomislav|Nadalina/)) {
            console.log('  ✅ Joined family — members visible');
            const xpVals = [...after.matchAll(/(\d+)\s*XP/g)].map(m => parseInt(m[1]));
            console.log(`  📊 Family XP values: ${xpVals.join(', ')}`);
            if (xpVals.every(v => v === 0)) logIssue('BUG', 'Family XP', 'All family members showing 0 XP');
          } else if (after.match(/error|failed|invalid|not found/i)) {
            logIssue('BUG', 'Join Family', 'Error returned when joining family code EPLJRC');
          }
        }
      }
    } else if (txt.match(/Jeff|Klara|Tomislav/)) {
      console.log('  ✅ Already in family — members visible');
      const xpVals = [...txt.matchAll(/(\d+)\s*XP/g)].map(m => parseInt(m[1]));
      console.log(`  📊 Family XP: ${xpVals.join(', ')}`);
    }
  });

  test('9. Logout → re-login — progress retained', async ({ page }) => {
    page.on('pageerror', err => jsErrors.push({ msg: err.message }));

    await loginAndWait(page, true);
    await dismissModals(page);

    const txt = await page.locator('#root').innerText().catch(() => '');
    const xpBefore = parseInt((txt.match(/(\d+)\s*XP/) || [])[1] || '0');
    console.log(`  XP before logout: ${xpBefore}`);

    // Navigate to profile to find logout
    const profileNav = page.locator('text=Profile').first();
    if (await profileNav.isVisible().catch(() => false)) {
      await profileNav.click();
      await page.waitForTimeout(500);
    }
    await page.evaluate(() => window.scrollTo(0, 9999));
    await page.waitForTimeout(300);

    const logoutBtn = page.locator('button').filter({ hasText: /sign.?out|log.?out/i }).first();
    if (!await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      logIssue('UX', 'Logout', 'Cannot find Sign Out button on Profile tab');
      return;
    }

    // Step 1: click the initial Sign Out button (shows confirmation dialog)
    await logoutBtn.click();
    await page.waitForTimeout(500);
    // Step 2: click the confirmation Sign Out button if confirmation dialog appeared
    const confirmBtn = page.locator('button').filter({ hasText: /^sign.?out$/i }).last();
    if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmBtn.click();
    }
    await page.waitForTimeout(2000);
    await screenshot(page, '09-after-logout');

    // Re-login
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
    if (!await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      logIssue('BUG', 'Logout', 'Not on login screen after logout');
      return;
    }
    await emailInput.fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('input[type="password"]').first().press('Enter');

    await page.waitForFunction(
      () => { const t = document.getElementById('root')?.innerText || ''; return t.includes('Home') && t.includes('Path'); },
      { timeout: 20000 }
    ).catch(() => {});
    await page.waitForTimeout(5000); // Firebase hydration
    await dismissModals(page);
    await screenshot(page, '09-after-relogin');

    const after = await page.locator('#root').innerText().catch(() => '');
    const xpAfter = parseInt((after.match(/(\d+)\s*XP/) || [])[1] || '0');
    console.log(`  XP after re-login: ${xpAfter}`);

    if (xpBefore > 0 && xpAfter < xpBefore) {
      logIssue('CRITICAL', 'Data Persistence', `XP DROPPED: ${xpBefore} → ${xpAfter} after logout+login`);
    } else if (xpAfter >= xpBefore && xpBefore > 0) {
      console.log(`  ✅ Progress retained after logout+login (${xpAfter} XP)`);
    } else if (xpBefore === 0 && xpAfter === 0) {
      logIssue('WARN', 'Data Persistence', 'XP is 0 both before and after — cannot verify persistence');
    }
  });

  test('10. Mobile viewport — layout & usability', async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    });
    const page = await ctx.newPage();

    const t0 = Date.now();
    await page.goto('/');
    await page.waitForFunction(() => (document.getElementById('root')?.innerText || '').length > 5, { timeout: 20000 }).catch(() => {});
    timings.mobileFCP = Date.now() - t0;

    await screenshot(page, '10-mobile-login');

    if (timings.mobileFCP > 6000) logIssue('PERF', 'Mobile FCP', `${timings.mobileFCP}ms to first content on mobile`);
    else console.log(`  ✅ Mobile first content: ${timings.mobileFCP}ms`);

    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailInput.fill(EMAIL);
      await page.locator('input[type="password"]').first().fill(PASSWORD);
      await page.locator('input[type="password"]').first().press('Enter');
      await page.waitForFunction(
        () => { const t = document.getElementById('root')?.innerText || ''; return t.includes('Home') || t.includes('streak') || t.length > 100; },
        { timeout: 20000 }
      ).catch(() => {});
    }

    await page.waitForTimeout(3000);
    await screenshot(page, '10-mobile-home');

    // Check for horizontal overflow
    const overflow = await page.evaluate(() => document.body.scrollWidth > document.body.clientWidth + 5);
    if (overflow) logIssue('UX', 'Mobile Overflow', 'Horizontal scroll on iPhone 14 — content wider than screen');

    // Check if app shows anything useful
    const mobileText = await page.locator('#root').innerText().catch(() => '');
    if (mobileText.includes('Loading')) {
      logIssue('PERF', 'Mobile Loading', 'App still showing "Loading..." spinner after 3s on mobile');
    } else if (mobileText.length < 50) {
      logIssue('UX', 'Mobile Content', 'Very little content visible on mobile after login');
    } else {
      console.log('  ✅ Mobile app rendered with content');
    }

    // Check tap targets (44px minimum for accessibility)
    const smallBtns = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      const small = [];
      for (const b of btns) {
        const r = b.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && (r.width < 36 || r.height < 36)) {
          small.push(b.textContent?.trim().slice(0, 20) || '[icon]');
        }
      }
      return small.slice(0, 5);
    });
    if (smallBtns.length > 0) {
      logIssue('UX', 'Mobile Touch Targets', `${smallBtns.length} buttons < 36px: "${smallBtns.join('", "')}"`);
    }

    await screenshot(page, '10-mobile-final');
    await ctx.close();
  });

  test.afterAll(async () => {
    const report = {
      timestamp: new Date().toISOString(),
      url: 'https://nasahrvatska.com',
      timings,
      totalIssues: issues.length,
      issuesBySeverity: {
        CRITICAL: issues.filter(i => i.severity === 'CRITICAL').length,
        BUG: issues.filter(i => i.severity === 'BUG').length,
        WARN: issues.filter(i => i.severity === 'WARN').length,
        UX: issues.filter(i => i.severity === 'UX').length,
        PERF: issues.filter(i => i.severity === 'PERF').length,
      },
      issues,
      jsErrors: jsErrors.slice(0, 10),
    };

    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

    console.log('\n' + '═'.repeat(60));
    console.log('UX AUDIT REPORT — nasahrvatska.com');
    console.log('═'.repeat(60));
    console.log(`Total issues found: ${issues.length}`);
    console.log(`  CRITICAL: ${report.issuesBySeverity.CRITICAL}`);
    console.log(`  BUG:      ${report.issuesBySeverity.BUG}`);
    console.log(`  WARN:     ${report.issuesBySeverity.WARN}`);
    console.log(`  UX:       ${report.issuesBySeverity.UX}`);
    console.log(`  PERF:     ${report.issuesBySeverity.PERF}`);
    console.log('\nTimings:');
    Object.entries(timings).forEach(([k, v]) => console.log(`  ${k}: ${v}ms`));
    console.log('\nAll issues:');
    issues.forEach(i => console.log(`  [${i.severity}] ${i.area}: ${i.description}`));
    console.log(`\nFull report: ${REPORT_PATH}`);
    console.log(`Screenshots: ux-audit-*.png`);
    console.log('═'.repeat(60));
  });
});
