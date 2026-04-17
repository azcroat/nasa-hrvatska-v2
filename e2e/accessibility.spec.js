/**
 * Accessibility tests — @axe-core/playwright (WCAG 2.1 AA).
 *
 * These replace the previous accessibility.spec.js which used /progress (a
 * route that no longer exists). Updated to cover all 5 live routes:
 *   /  /learn  /practice  /croatia  /profile
 *
 * Strategy:
 *   - Each test runs axe against WCAG 2.1 AA tags.
 *   - Only critical and serious violations fail the build.
 *   - Violation details are printed to the console on failure so developers
 *     can act immediately without re-running with verbose flags.
 *   - test.slow() triples the timeout — axe adds ~2-3 s per run.
 *   - We wait for the SW-triggered reload (if any) before running axe to avoid
 *     "execution context destroyed" errors during SW activation.
 *
 * Run: npx playwright test e2e/accessibility.spec.js
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { seedAuth, blockFirebase, mockTTS } from './fixtures/seed-auth.js';

// ── helpers ───────────────────────────────────────────────────────────────────

/**
 * Run axe against the current page, filtered to WCAG 2.1 AA.
 * Returns only critical/serious violations (minor/moderate are not blocking).
 * Attaches a human-readable report to the test on failure.
 */
async function runAxe(page, label) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    // Skip YouTube iframes we don't control
    .exclude('iframe[src*="youtube"]')
    .analyze();

  const critical = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );

  if (critical.length > 0) {
    const report = critical
      .map(
        (v) =>
          `[${v.impact.toUpperCase()}] ${v.id}: ${v.description}\n` +
          v.nodes
            .slice(0, 3)
            .map((n) => `  → ${n.html}`)
            .join('\n'),
      )
      .join('\n\n');

    console.error(`\nAccessibility violations on "${label}":\n\n${report}\n`);
  }

  return critical;
}

/**
 * Wait for the page to fully settle:
 *  1. Absorb any SW-triggered reload (which destroys axe's execution context).
 *  2. Wait 500 ms for React to finish painting.
 */
async function waitForSettle(page) {
  await page.waitForEvent('load', { timeout: 6_000 }).catch(() => {});
  await page.waitForTimeout(500);
}

// ── Setup ─────────────────────────────────────────────────────────────────────

test.describe('Accessibility — WCAG 2.1 AA (authenticated routes)', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
  });

  // ── 1. Home / Today tab ───────────────────────────────────────────────────
  test('Home tab (/) has no critical or serious WCAG 2.1 AA violations', async ({ page }) => {
    test.slow();

    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
    await waitForSettle(page);

    const violations = await runAxe(page, 'Home /');

    expect(
      violations,
      violations.map((v) => `${v.id}: ${v.description}`).join('\n'),
    ).toHaveLength(0);
  });

  // ── 2. Learn tab ──────────────────────────────────────────────────────────
  test('Learn tab (/learn) has no critical or serious WCAG 2.1 AA violations', async ({ page }) => {
    test.slow();

    await page.goto('/learn');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
    // Wait for lazy-loaded content (learning path) before axe scan
    await page.waitForFunction(
      () => document.body.textContent?.includes('My Path'),
      { timeout: 20_000 },
    ).catch(() => {});
    await waitForSettle(page);

    const violations = await runAxe(page, 'Learn /learn');

    expect(
      violations,
      violations.map((v) => `${v.id}: ${v.description}`).join('\n'),
    ).toHaveLength(0);
  });

  // ── 3. Practice tab ───────────────────────────────────────────────────────
  test('Practice tab (/practice) has no critical or serious WCAG 2.1 AA violations', async ({ page }) => {
    test.slow();

    await page.goto('/practice');
    // PracticeTab is lazy-loaded. The SW may trigger a reload during which the
    // React app re-initialises and must re-fetch the PracticeTab chunk. Wait
    // for the page to fully settle after any SW-triggered reload before asserting
    // navigation visibility — this absorbs up to an additional 15 s of load time.
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 30_000,
    });
    // Wait for quest cards to finish rendering (they animate in with CSS transitions).
    // Without this, axe may scan the QuestTracker "Start →" button while a CSS
    // variable is not yet resolved, producing a spurious contrast false-positive.
    await page.waitForFunction(
      () => document.body.textContent?.includes('Daily Quests'),
      { timeout: 10_000 },
    ).catch(() => {});
    // Let CSS animations (anim-children-fade) fully complete before axe scans.
    await page.waitForFunction(
      () => document.getAnimations().every(a => a.playState !== 'running'),
      { timeout: 5_000 },
    ).catch(() => {});
    await waitForSettle(page);

    const violations = await runAxe(page, 'Practice /practice');

    expect(
      violations,
      violations.map((v) => `${v.id}: ${v.description}`).join('\n'),
    ).toHaveLength(0);
  });

  // ── 4. Croatia tab ────────────────────────────────────────────────────────
  test('Croatia tab (/croatia) has no critical or serious WCAG 2.1 AA violations', async ({ page }) => {
    test.slow();

    await page.goto('/croatia');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
    // Wait for the Croatia tab heading to confirm content has loaded
    await page.getByRole('heading', { name: /History.*Regions/i }).waitFor({ timeout: 10_000 }).catch(() => {});
    await waitForSettle(page);

    const violations = await runAxe(page, 'Croatia /croatia');

    expect(
      violations,
      violations.map((v) => `${v.id}: ${v.description}`).join('\n'),
    ).toHaveLength(0);
  });

  // ── 5. Profile / Me tab ───────────────────────────────────────────────────
  test('Profile tab (/profile) has no critical or serious WCAG 2.1 AA violations', async ({ page }) => {
    test.slow();

    await page.goto('/profile');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
    await waitForSettle(page);

    const violations = await runAxe(page, 'Profile /profile');

    expect(
      violations,
      violations.map((v) => `${v.id}: ${v.description}`).join('\n'),
    ).toHaveLength(0);
  });
});

// ── Login screen (unauthenticated) ────────────────────────────────────────────
test.describe('Accessibility — login screen (unauthenticated)', () => {
  test('login screen has no critical or serious WCAG 2.1 AA violations', async ({ page }) => {
    test.slow();

    // No seedAuth — renders the login form
    await blockFirebase(page);
    await page.goto('/');
    await page.waitForFunction(
      () => document.getElementById('root')?.innerText?.trim()?.length > 5,
      { timeout: 20_000 },
    );
    await waitForSettle(page);

    const violations = await runAxe(page, 'Login screen /');

    expect(
      violations,
      violations.map((v) => `${v.id}: ${v.description}`).join('\n'),
    ).toHaveLength(0);
  });
});

// ── Focus management ──────────────────────────────────────────────────────────
test.describe('Accessibility — keyboard navigation', () => {
  test('Tab key reaches interactive elements (button or a) within 20 presses on home screen', async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
    await waitForSettle(page);

    const focusedTags = new Set();
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const tag = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase());
      if (tag) focusedTags.add(tag);
    }

    expect(
      focusedTags.has('button') || focusedTags.has('a') || focusedTags.has('input'),
      'Tab key must reach at least one interactive element',
    ).toBe(true);
  });

  test('Profile tab seg-bar pills are keyboard reachable', async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/profile');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });

    // Focus the seg-bar area and verify the pills are tab-stops
    const firstPill = page.locator('.seg-bar .seg-pill').first();
    await firstPill.focus();
    const tagName = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase());
    expect(tagName).toBe('button');
  });
});
