/**
 * Targeted mobile sign-out test + CSP audit
 * Reproduces the "can't sign out on mobile" bug
 */
import { test, expect } from '@playwright/test';

const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

async function login(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
  if (!await emailInput.isVisible({ timeout: 6000 }).catch(() => false)) {
    console.log('  Login form not visible — may already be logged in');
    return true;
  }
  await emailInput.fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  // Click button by text, not type=submit (some mobile browsers treat Enter differently)
  const signinBtn = page.locator('button').filter({ hasText: /sign in/i }).first();
  if (await signinBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await signinBtn.click();
  } else {
    await page.locator('input[type="password"]').first().press('Enter');
  }

  // Wait for app to load
  const loaded = await page.waitForFunction(
    () => document.getElementById('root')?.innerText?.includes('Home') ||
          document.getElementById('root')?.innerText?.includes('Path') ||
          document.getElementById('root')?.innerText?.includes('Me'),
    { timeout: 20000 }
  ).then(() => true).catch(() => false);

  if (!loaded) {
    console.log('  ⚠️  App did not load after login');
    const text = await page.locator('#root').innerText().catch(() => '');
    console.log('  Root text:', text.slice(0, 200));
  }
  await page.waitForTimeout(2000);
  return loaded;
}

test.describe('Mobile sign-out bug', () => {
  test.skip(!!process.env.CI, 'Requires real Firebase credentials — run locally only');

  test('01 - Mobile viewport: find and use sign out button', async ({ page }) => {
    // Set iPhone 14 Pro viewport
    await page.setViewportSize({ width: 390, height: 844 });

    const cspViolations = [];
    page.on('console', m => {
      if (m.text().includes('Content Security Policy') || m.text().includes('CSP')) {
        cspViolations.push(m.text().slice(0, 200));
      }
    });
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message.slice(0, 200)));

    const loggedIn = await login(page);
    await page.screenshot({ path: 'mobile-01-after-login.png' });

    const bodyText = await page.locator('#root').innerText().catch(() => '');
    console.log('\nApp state after login attempt:');
    console.log(bodyText.slice(0, 300));

    if (!loggedIn || bodyText.includes('Sign in')) {
      console.log('\n❌ LOGIN FAILED — cannot test sign-out');
      console.log('JS Errors:', jsErrors.slice(0, 3));
      return;
    }

    // Find the "Me" tab (Profile)
    console.log('\nLooking for Me / Profile tab...');
    const meTab = page.locator('button').filter({ hasText: /^Me$/ }).first();
    const meTabVisible = await meTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (!meTabVisible) {
      // Try Profile
      const profileTab = page.locator('button').filter({ hasText: /^Profile$|^Me$/ }).first();
      const profileVisible = await profileTab.isVisible({ timeout: 3000 }).catch(() => false);
      if (!profileVisible) {
        console.log('❌ BUG: "Me" / "Profile" tab not visible on mobile viewport!');
        await page.screenshot({ path: 'mobile-02-no-me-tab.png' });
        return;
      }
    }

    console.log('  ✓ "Me" tab found, clicking...');
    const tabBtn = meTabVisible ? meTab : page.locator('button').filter({ hasText: /^Me$|^Profile$/ }).first();
    await tabBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'mobile-02-profile-tab.png' });

    const profileText = await page.locator('#root').innerText().catch(() => '');
    console.log('\nProfile tab text (first 300):');
    console.log(profileText.slice(0, 300));

    // Now try to find Sign Out button
    console.log('\nLooking for Sign Out button...');
    const signOutBtn = page.locator('button').filter({ hasText: /Sign Out|Sign out|log out|Log out/i }).first();

    // Check if it's visible without scrolling
    const visibleWithoutScroll = await signOutBtn.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`  Sign Out visible without scrolling: ${visibleWithoutScroll}`);

    if (!visibleWithoutScroll) {
      console.log('  Scrolling to bottom of profile...');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'mobile-03-profile-scrolled.png' });
    }

    const signOutVisible = await signOutBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (!signOutVisible) {
      console.log('❌ BUG: Sign Out button not found/visible on mobile Profile tab even after scrolling');
      console.log('Profile content:', profileText.slice(0, 500));
      return;
    }

    // Get button position
    const box = await signOutBtn.boundingBox().catch(() => null);
    console.log(`  Sign Out button position: ${JSON.stringify(box)}`);
    if (box && box.height < 44) {
      console.log(`⚠️ Sign Out button height ${box.height}px — below 44px mobile touch target`);
    }

    console.log('  Clicking Sign Out...');
    await signOutBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'mobile-04-after-signout-click.png' });

    const afterFirstClick = await page.locator('#root').innerText().catch(() => '');
    console.log('\nAfter first Sign Out click:');
    console.log(afterFirstClick.slice(0, 200));

    // Should see confirmation dialog
    const cancelBtn = page.locator('button').filter({ hasText: /Cancel/i }).first();
    const confirmSignout = page.locator('button').filter({ hasText: /^Sign Out$|^Yes, sign out$/i }).first();

    const confirmVisible = await confirmSignout.isVisible({ timeout: 3000 }).catch(() => false);
    const cancelVisible = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (!confirmVisible) {
      console.log('❌ BUG: Sign Out confirmation dialog did not appear after clicking Sign Out button');
      return;
    }
    console.log('  ✓ Confirmation dialog appeared');

    // Click the confirm Sign Out button
    console.log('  Clicking confirmation Sign Out button...');
    await confirmSignout.click();

    // Wait up to 10 seconds for sign out to complete
    const signedOut = await page.waitForFunction(
      () => {
        const t = document.getElementById('root')?.innerText || '';
        return t.includes('Sign in') || t.includes('EMAIL ADDRESS') || t.includes('Log In');
      },
      { timeout: 10000 }
    ).then(() => true).catch(() => false);

    await page.screenshot({ path: 'mobile-05-after-signout.png' });

    if (signedOut) {
      console.log('  ✅ Sign out successful! User is on login screen');
    } else {
      const finalText = await page.locator('#root').innerText().catch(() => '');
      console.log('❌ BUG: Sign out failed! Still on app screen after 10s');
      console.log('Final screen text:', finalText.slice(0, 200));
    }

    if (jsErrors.length > 0) {
      console.log('\n⚠️ JS Errors during sign out flow:');
      jsErrors.forEach(e => console.log('  ', e));
    }
  });

  test('02 - CSP audit: check for blocked resources', async ({ page }) => {
    const violations = [];
    page.on('console', m => {
      const txt = m.text();
      if (txt.includes('Content-Security-Policy') || txt.includes('CSP') || txt.includes('violates')) {
        violations.push({ type: m.type(), text: txt.slice(0, 300) });
      }
    });
    page.on('response', resp => {
      if (resp.status() === 0 || resp.status() >= 400) {
        const url = resp.url();
        if (!url.includes('plausible') && !url.includes('favicon')) {
          console.log(`  Response ${resp.status()}: ${url.slice(0, 100)}`);
        }
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(3000);

    if (violations.length > 0) {
      console.log(`\n❌ ${violations.length} CSP violation(s) found:`);
      violations.forEach(v => console.log(`  [${v.type}] ${v.text}`));
    } else {
      console.log('\n✓ No CSP violations on initial page load');
    }

    // Check if Firebase connects properly
    const hasFirebaseError = await page.evaluate(() => {
      const t = document.getElementById('root')?.innerText || '';
      return t.includes('server error') || t.includes('Firebase') && t.includes('error');
    });
    if (hasFirebaseError) {
      console.log('❌ Firebase error on page load (CSP may be blocking Firebase scripts)');
    }
  });

  test('03 - Sign out button discoverability on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);

    // Navigate to profile
    const meTab = page.locator('button').filter({ hasText: /^Me$|^Profile$/ }).first();
    if (!await meTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('❌ Me/Profile tab not visible');
      return;
    }
    await meTab.click();
    await page.waitForTimeout(1500);

    // Measure scroll height to see how far down sign out is
    const metrics = await page.evaluate(() => {
      const signOutBtn = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent.trim().includes('Sign Out') || b.textContent.trim().includes('Sign out'));
      if (!signOutBtn) return { found: false };
      const rect = signOutBtn.getBoundingClientRect();
      return {
        found: true,
        topFromViewport: rect.top,
        bottomFromViewport: rect.bottom,
        viewportHeight: window.innerHeight,
        pageScrollHeight: document.body.scrollHeight,
        isInViewport: rect.top >= 0 && rect.bottom <= window.innerHeight,
        distanceToScroll: Math.max(0, rect.top - window.innerHeight + rect.height),
      };
    });

    console.log('\nSign Out button metrics:');
    console.log(JSON.stringify(metrics, null, 2));

    if (!metrics.found) {
      console.log('❌ Sign Out button not found in DOM at all');
    } else if (!metrics.isInViewport) {
      console.log(`⚠️ Sign Out button is NOT in viewport — user must scroll ${Math.round(metrics.distanceToScroll)}px to see it`);
      console.log('  This is a discoverability issue on mobile!');
    } else {
      console.log('✓ Sign Out button is visible in viewport');
    }
  });

});
