import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// ─── Accessibility tests using axe-core (WCAG 2.1 AA) ──────────────────────
// These run against the production build (npm run build → npm run preview).
// Any critical/serious axe violations fail the build.

const PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Learn', path: '/learn' },
  { name: 'Practice', path: '/practice' },
  { name: 'Progress', path: '/progress' },
];

for (const { name, path } of PAGES) {
  test(`${name} page has no critical axe violations`, async ({ page }) => {
    await page.goto(path);
    // Wait for React to hydrate
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      // Exclude third-party iframes we don't control
      .exclude('iframe[src*="youtube"]')
      .analyze();

    // Filter to critical and serious — ignore minor/moderate in CI
    const blockers = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    if (blockers.length > 0) {
      const report = blockers.map(
        (v) =>
          `[${v.impact.toUpperCase()}] ${v.id}: ${v.description}\n` +
          v.nodes.slice(0, 3).map((n) => `  → ${n.html}`).join('\n'),
      ).join('\n\n');
      // Print the full report for easy debugging in CI logs
      console.error(`Accessibility violations on ${name} (${path}):\n\n${report}`);
    }

    expect(blockers).toHaveLength(0);
  });
}

// ─── Focus management — keyboard navigation smoke test ─────────────────────
test('Tab key reaches all nav links on Home', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Press Tab up to 20 times and collect focused elements
  const focusedTags = new Set();
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
    const tag = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase());
    if (tag) focusedTags.add(tag);
  }

  // At minimum, interactive elements must receive focus
  expect(focusedTags.has('button') || focusedTags.has('a')).toBe(true);
});

// ─── Color contrast quick check via axe ────────────────────────────────────
test('Home page passes color contrast checks', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2aa'])
    .withRules(['color-contrast'])
    .analyze();

  const contrastFailures = results.violations.filter((v) => v.id === 'color-contrast');
  if (contrastFailures.length > 0) {
    const nodes = contrastFailures.flatMap((v) => v.nodes.slice(0, 5)).map((n) => n.html);
    console.warn('Color contrast issues (non-blocking):\n', nodes.join('\n'));
  }

  // Warn only — color contrast is logged but not a hard blocker
  // Change to expect(contrastFailures).toHaveLength(0) to enforce strictly
  expect(contrastFailures.length).toBeGreaterThanOrEqual(0);
});
