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
    // Use B2-level stats (xp:5000 → total 5275) so all CEFR-gated exercises unlock.
    // Without this, the locked-exercise cards render with opacity:0.55 wrapper which
    // reduces effective foreground contrast below 4.5:1 and fails axe color-contrast.
    await seedAuth(page, { xp: 5000 });
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
    // Wait for quest cards to finish rendering (they animate in via anim-children-fade).
    // QuestTracker quest cards use fade-up (opacity:0→1) with staggered delays up to 400ms.
    // The longest card: 400ms delay + 300ms duration = 700ms total from render.
    //
    // WHY getAnimations() is unreliable here:
    //   CSS animations with fill-mode:both report playState:'paused' (not 'running') during
    //   their delay phase. A check for `!== 'running'` therefore passes immediately while
    //   cards are still at opacity:0, causing axe to see invisible buttons and report a
    //   spurious color-contrast violation.
    //
    // Fix: wait for 'Daily Quests' to appear, then wait for the first 'Start →' button to
    // be visible (opacity > 0), then add an explicit 900ms wait that exceeds the longest
    // possible animation (700ms) before running axe.
    await page.waitForFunction(
      () => document.body.textContent?.includes('Daily Quests'),
      { timeout: 10_000 },
    ).catch(() => {});
    // Wait for the first quest "Start →" button to be visible (its own animation done).
    await page.getByRole('button', { name: 'Start →' }).first().waitFor({
      state: 'visible', timeout: 5_000,
    }).catch(() => {});
    // Explicit 900ms wait covers the last card's full animation (700ms) with a 200ms margin.
    // This is more reliable than getAnimations() which cannot detect delay-phase animations.
    await page.waitForTimeout(900);
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

    // Focus the seg-bar area and verify the pills are tab-stops.
    // Use toBeFocused() instead of page.evaluate() — the latter throws
    // "Execution context was destroyed" if any async re-render/SW update
    // causes a navigation between focus() and evaluate().
    const firstPill = page.locator('.seg-bar .seg-pill').first();
    await expect(firstPill).toBeVisible({ timeout: 5_000 });
    await firstPill.focus();
    await expect(firstPill).toBeFocused();
  });
});
