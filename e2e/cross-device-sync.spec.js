/**
 * Cross-device sync verification — nasahrvatska.com
 *
 * Simulates the real user scenario:
 *   Device A (returning): logs in, reads current stats
 *   Device B (brand-new browser, zero localStorage): logs in, verifies stats match
 *   Device C (incognito Chrome): logs in, same check
 *   Re-login (same browser after logout): verifies data survives logout/login cycle
 *
 * This is the definitive test that sync works end-to-end.
 */
import { test, expect, chromium, firefox } from '@playwright/test';

const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

// ─── helpers ─────────────────────────────────────────────────────────────────

async function readStats(page, label) {
  // Navigate to profile tab for reliable stats (not dependent on HomeTab layout)
  try {
    const meBtn = page.locator('[aria-label="Main navigation"] button', { hasText: 'Me' });
    if (await meBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await meBtn.click();
      await page.waitForTimeout(2000);
    }
  } catch (_) {}

  const txt = await page.locator('#root').innerText().catch(() => '');
  const xpM = txt.match(/(\d+)\s*XP/i) || txt.match(/XP[:\s]+(\d+)/i);
  const lcM = txt.match(/(\d+)\s*lessons?/i) || txt.match(/Lessons[:\s]+(\d+)/i);
  const streakM = txt.match(/(\d+)[- ]?day streak/i) || txt.match(/Streak[:\s]+(\d+)/i) || txt.match(/(\d+)\s*🔥/);
  const xp = xpM ? parseInt(xpM[1]) : null;
  const lc = lcM ? parseInt(lcM[1]) : null;
  const streak = streakM ? parseInt(streakM[1]) : null;
  console.log(`  [${label}] XP=${xp ?? '?'}  Lessons=${lc ?? '?'}  Streak=${streak ?? '?'}`);
  return { xp, lc, streak, txt };
}

async function loginFresh(ctx, label) {
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', m => {
    const t = m.text();
    if (t.includes('fbLoad') || t.includes('permission') || t.includes('error') || t.includes('XP')) {
      logs.push(`[${m.type()}] ${t.slice(0, 200)}`);
    }
  });
  page.on('pageerror', e => logs.push(`[pageerror] ${e.message.slice(0, 200)}`));

  console.log(`\n  ── ${label} ──`);
  await page.goto('https://nasahrvatska.com/');
  await page.waitForFunction(
    () => (document.getElementById('root')?.innerText || '').length > 5,
    { timeout: 15000 }
  ).catch(() => {});

  const t0 = Date.now();
  const emailEl = page.locator('input[type="email"]').first();
  if (await emailEl.isVisible({ timeout: 5000 }).catch(() => false)) {
    await emailEl.fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('input[type="password"]').first().press('Enter');
    console.log(`  Credentials submitted`);
  } else {
    console.log(`  Already logged in (session persisted)`);
  }

  // Wait for the main navigation bar — reliable signal that the app has loaded
  await page.locator('[aria-label="Main navigation"]').waitFor({ state: 'visible', timeout: 25000 })
    .catch(() => console.log(`  WARNING: nav bar not visible within 25s`));

  const loginMs = Date.now() - t0;
  console.log(`  Login→app: ${loginMs}ms`);

  // Wait for Firebase to hydrate fully
  await page.waitForTimeout(6000);

  // Dismiss any modals
  const skipIntro = page.locator('button').filter({ hasText: /skip intro/i }).first();
  if (await skipIntro.isVisible({ timeout: 500 }).catch(() => false)) await skipIntro.click();
  const closeX = page.locator('button').filter({ hasText: '×' }).first();
  if (await closeX.isVisible({ timeout: 500 }).catch(() => false)) await closeX.click();

  const stats = await readStats(page, label);

  if (logs.some(l => l.includes('permission'))) {
    console.log(`  ⚠️  Firestore permission errors detected:`);
    logs.filter(l => l.includes('permission')).forEach(l => console.log('    ' + l));
  }

  return { page, stats, logs, loginMs };
}

// ─── tests ───────────────────────────────────────────────────────────────────

test.describe('Cross-device sync — nasahrvatska.com', () => {
  test.skip(!!process.env.CI, 'Requires real Firebase credentials — run locally only');

  test('Full cross-device sync: Device A → B → C → re-login', async ({ browser }) => {
    test.setTimeout(120_000);
    let deviceA_stats, deviceB_stats, deviceC_stats, relogin_stats;

    // ── Device A: returning browser (may have cached session/localStorage) ──
    const ctxA = await browser.newContext();
    const { page: pageA, stats: statsA, loginMs: msA } = await loginFresh(ctxA, 'Device A (returning browser)');
    deviceA_stats = statsA;

    expect(statsA.xp, 'Device A: XP should be > 0').toBeGreaterThan(0);
    console.log(`\n  ✅ Device A loaded: XP=${statsA.xp}`);
    await pageA.screenshot({ path: 'sync-01-device-A.png' });

    // ── Device B: completely fresh context (no cookies, no localStorage) ──
    const ctxB = await browser.newContext(); // new context = new incognito
    const { page: pageB, stats: statsB, loginMs: msB } = await loginFresh(ctxB, 'Device B (fresh browser — no localStorage)');
    deviceB_stats = statsB;

    await pageB.screenshot({ path: 'sync-02-device-B.png' });

    // ── Device C: another fresh context (simulate different machine/browser) ──
    const ctxC = await browser.newContext();
    const { page: pageC, stats: statsC, loginMs: msC } = await loginFresh(ctxC, 'Device C (second fresh browser)');
    deviceC_stats = statsC;

    await pageC.screenshot({ path: 'sync-03-device-C.png' });

    // ── Logout + re-login on Device B ──
    console.log(`\n  ── Re-login: sign out then back in on Device B ──`);
    const profileNav = pageB.locator('[aria-label="Main navigation"] button', { hasText: 'Me' });
    if (await profileNav.isVisible({ timeout: 2000 }).catch(() => false)) {
      await profileNav.click();
      await pageB.waitForTimeout(500);
    }
    await pageB.evaluate(() => window.scrollTo(0, 9999));
    const signOutBtn = pageB.locator('button').filter({ hasText: /🚪|sign.?out/i }).first();
    if (await signOutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await signOutBtn.click();
      await pageB.waitForTimeout(400);
      const confirmBtn = pageB.locator('button').filter({ hasText: /^sign.?out$/i }).last();
      if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) await confirmBtn.click();
      await pageB.waitForTimeout(2000);
    }

    // Re-login
    const emailEl2 = pageB.locator('input[type="email"]').first();
    if (await emailEl2.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailEl2.fill(EMAIL);
      await pageB.locator('input[type="password"]').first().fill(PASSWORD);
      await pageB.locator('input[type="password"]').first().press('Enter');
      await pageB.locator('[aria-label="Main navigation"]').waitFor({ state: 'visible', timeout: 25000 })
        .catch(() => {});
      await pageB.waitForTimeout(6000);
    }
    relogin_stats = await readStats(pageB, 'Device B after re-login');
    await pageB.screenshot({ path: 'sync-04-device-B-relogin.png' });

    // ── ASSERTIONS ──────────────────────────────────────────────────────────
    console.log('\n  ═══ SYNC RESULTS ═══');
    console.log(`  Device A (returning) : XP=${deviceA_stats.xp}`);
    console.log(`  Device B (fresh)     : XP=${deviceB_stats.xp}`);
    console.log(`  Device C (fresh)     : XP=${deviceC_stats.xp}`);
    console.log(`  Re-login on B        : XP=${relogin_stats.xp}`);

    const baseline = deviceA_stats.xp;

    // Core: fresh devices must get the same XP as the returning device
    if (deviceB_stats.xp === 0) {
      console.log('  ❌ SYNC FAIL: Device B (fresh) shows 0 XP — Firebase data not applied');
    } else if (deviceB_stats.xp === baseline) {
      console.log(`  ✅ Device B XP matches (${deviceB_stats.xp} = ${baseline})`);
    } else {
      console.log(`  ⚠️  Device B XP differs: B=${deviceB_stats.xp} vs A=${baseline}`);
    }

    if (deviceC_stats.xp === 0) {
      console.log('  ❌ SYNC FAIL: Device C (fresh) shows 0 XP — Firebase data not applied');
    } else if (deviceC_stats.xp === baseline) {
      console.log(`  ✅ Device C XP matches (${deviceC_stats.xp} = ${baseline})`);
    } else {
      console.log(`  ⚠️  Device C XP differs: C=${deviceC_stats.xp} vs A=${baseline}`);
    }

    if (relogin_stats.xp === 0) {
      console.log('  ❌ SYNC FAIL: Re-login shows 0 XP — progress lost after logout');
    } else if (relogin_stats.xp >= baseline) {
      console.log(`  ✅ Re-login XP retained (${relogin_stats.xp})`);
    } else {
      console.log(`  ⚠️  Re-login XP lower: relogin=${relogin_stats.xp} vs baseline=${baseline}`);
    }

    // Playwright assertions (will fail the test with a clear message)
    expect(deviceB_stats.xp, `Fresh device B must show same XP as device A (${baseline})`).toBe(baseline);
    expect(deviceC_stats.xp, `Fresh device C must show same XP as device A (${baseline})`).toBe(baseline);
    expect(relogin_stats.xp, 'Re-login must retain XP').toBeGreaterThanOrEqual(baseline);

    await ctxA.close();
    await ctxB.close();
    await ctxC.close();
  });

});
