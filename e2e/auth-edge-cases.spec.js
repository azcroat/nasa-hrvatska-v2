/**
 * Auth edge-case tests.
 * Validates session resilience: earlyRestore from localStorage keeps the app
 * authenticated even when Firebase network calls are blocked or when navigating
 * directly to a protected route.
 */
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, TEST_EMAIL } from './fixtures/seed-auth.js';

// ── helpers ───────────────────────────────────────────────────────────────────

/** Collect page-level JS errors, filtering out expected Firebase network noise. */
function trackErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err));
  return errors;
}

function assertNoUnexpectedErrors(errors) {
  const unexpected = errors.filter(
    (e) =>
      !e.message.includes('firebase') &&
      !e.message.includes('firestore') &&
      !e.message.includes('Failed to fetch') &&
      !e.message.includes('NetworkError') &&
      !e.message.includes('net::ERR') &&
      !e.message.includes('AbortError') &&
      !e.message.includes('identitytoolkit') &&
      !e.message.includes('securetoken'),
  );
  expect(
    unexpected.map((e) => e.message),
    'Unexpected JS errors',
  ).toHaveLength(0);
}

// ── Test suite ────────────────────────────────────────────────────────────────

test.describe('Auth edge cases', () => {
  // ── 1. Guest mode — no seedAuth ─────────────────────────────────────────────
  test('guest mode — app loads and renders content without a session', async ({ page }) => {
    const errors = trackErrors(page);

    // No seedAuth — simulate a brand-new visitor with no localStorage
    await blockFirebase(page);
    await page.goto('/');

    // App must render something — login screen or any content; no blank/crash
    await page.waitForFunction(
      () => {
        const root = document.getElementById('root');
        return root && root.innerText && root.innerText.trim().length > 5;
      },
      { timeout: 20_000 },
    );

    assertNoUnexpectedErrors(errors);
  });

  // ── 2. Firebase blocked + earlyRestore keeps session ───────────────────────
  test('earlyRestore keeps session authenticated when Firebase is blocked', async ({ page }) => {
    const errors = trackErrors(page);

    // seedAuth writes localStorage keys BEFORE the page loads via addInitScript
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/');

    // earlyRestore reads localStorage synchronously — nav bar must appear
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible({ timeout: 15_000 });

    assertNoUnexpectedErrors(errors);
  });

  // ── 3. Session persists after reload ───────────────────────────────────────
  test('session survives a hard page reload when Firebase is blocked', async ({ page }) => {
    const errors = trackErrors(page);

    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/');

    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible({ timeout: 15_000 });

    // Re-apply init scripts before reload (they only apply until next navigation)
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);

    // The SW may intercept the reload and cause a frame-detach error; catch and
    // let the subsequent nav assertion confirm the page is back in a good state.
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15_000 }).catch(() => {});

    await expect(nav).toBeVisible({ timeout: 15_000 });

    assertNoUnexpectedErrors(errors);
  });

  // ── 4. Session visible on direct route ─────────────────────────────────────
  test('navigating directly to /practice shows nav bar when session is seeded', async ({ page }) => {
    const errors = trackErrors(page);

    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/practice');

    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible({ timeout: 15_000 });

    assertNoUnexpectedErrors(errors);
  });

  // ── 5. Unauthenticated direct route — no crash ─────────────────────────────
  test('unauthenticated direct route to /practice loads without a JS crash', async ({ page }) => {
    const errors = trackErrors(page);

    // No seedAuth — unauthenticated visitor trying a deep link
    await blockFirebase(page);
    await page.goto('/practice');

    // App must render something (login redirect or login screen) without a crash
    await page.waitForFunction(
      () => {
        const root = document.getElementById('root');
        return root && root.innerText && root.innerText.trim().length > 5;
      },
      { timeout: 20_000 },
    );

    assertNoUnexpectedErrors(errors);
  });

  // ── 6. localStorage keys are correct after seedAuth ────────────────────────
  test('seedAuth writes the expected localStorage keys', async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await page.goto('/');

    // Wait for page to initialise before reading localStorage
    await page.waitForFunction(() => document.getElementById('root')?.innerText?.trim()?.length > 5, {
      timeout: 15_000,
    });

    const keys = await page.evaluate((email) => {
      return {
        uS: !!localStorage.getItem('uS'),
        uA: !!localStorage.getItem('uA'),
        uP: !!localStorage.getItem('uP_' + email),
        uStreak: !!localStorage.getItem('uStreak'),
        consent: localStorage.getItem('cookie_consent_v1'),
        goal: localStorage.getItem('nh_goal_set'),
      };
    }, TEST_EMAIL);

    expect(keys.uS, 'uS session key').toBe(true);
    expect(keys.uA, 'uA account key').toBe(true);
    expect(keys.uP, 'uP_email profile key').toBe(true);
    expect(keys.uStreak, 'uStreak key').toBe(true);
    expect(keys.consent).toBe('accepted');
    expect(keys.goal).toBe('1');
  });

  // ── 7. All 5 routes load without crash when authenticated ──────────────────
  test('all 5 routes render without JS errors when session is seeded', async ({ page }) => {
    const errors = trackErrors(page);

    for (const route of ['/', '/learn', '/practice', '/croatia', '/profile']) {
      // Re-apply init scripts before each navigation
      await seedAuth(page);
      await blockFirebase(page);
      await mockTTS(page);
      await page.goto(route);

      await page.waitForFunction(
        () => {
          const root = document.getElementById('root');
          return root && root.innerText && root.innerText.trim().length > 5;
        },
        { timeout: 15_000 },
      );
    }

    assertNoUnexpectedErrors(errors);
  });
});
