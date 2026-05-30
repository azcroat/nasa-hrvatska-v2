/**
 * session-routes.test.ts — guards the "Today's Session" critical learning tool
 * against DEAD LESSONS: every screen id the daily session can surface (across
 * all CEFR levels and all priority slots) MUST resolve to a real route in
 * AppRouter, or it lands the user on an empty page.
 *
 * Motivated by a real bug (2026-05-30): the Production activity used screen
 * 'productiondrill' (no underscore) while AppRouter only routes
 * 'production_drill' — so B1+ users randomly got an empty page. The original
 * unit test had hard-coded the typo'd id, so it passed while the route was dead.
 * This test reads the ACTUAL AppRouter source, so it cannot be fooled that way.
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { SESSION_SCREEN_IDS } from '../hooks/useDailySession';

// Extract every screen id AppRouter actually handles (`currentScreen === 'x'`).
const routerSrc = readFileSync('src/components/AppRouter.tsx', 'utf8');
const ROUTED = new Set(
  [...routerSrc.matchAll(/currentScreen === '([^']+)'/g)].map((m) => m[1] as string),
);

describe("Today's Session — no dead lessons", () => {
  it('AppRouter route extraction found a plausible number of routes', () => {
    // Sanity: if this drops to ~0 the regex/source moved and the guard is moot.
    expect(ROUTED.size).toBeGreaterThan(50);
  });

  it('every daily-session screen id resolves to a real AppRouter route', () => {
    const dead = [...SESSION_SCREEN_IDS].filter((screen) => !ROUTED.has(screen));
    expect(dead, `dead session lesson(s) with no AppRouter route: ${dead.join(', ')}`).toEqual([]);
  });
});
