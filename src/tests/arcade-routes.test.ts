/**
 * Guards Arcade game modes against the dead-lesson class (see session-routes.test.ts):
 * every Arcade screen id that ArcadeHub can launch MUST resolve to a real
 * AppRouter route, or the player lands on an empty page.
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const routerSrc = readFileSync('src/components/AppRouter.tsx', 'utf8');
const ROUTED = new Set(
  [...routerSrc.matchAll(/currentScreen === '([^']+)'/g)].map((m) => m[1] as string),
);

// Every mode marked live:true in ArcadeHub must be routed.
const hubSrc = readFileSync('src/components/practice/ArcadeHub.tsx', 'utf8');
const LIVE_MODE_IDS = [...hubSrc.matchAll(/id:\s*'([^']+)'[^}]*live:\s*true/g)].map(
  (m) => m[1] as string,
);

describe('Arcade — no dead modes', () => {
  it('the Arcade hub itself is routed', () => {
    expect(ROUTED.has('arcade')).toBe(true);
  });

  it('found at least one live mode in the hub', () => {
    expect(LIVE_MODE_IDS.length).toBeGreaterThan(0);
    expect(LIVE_MODE_IDS).toContain('alka');
  });

  it('every live Arcade mode resolves to a real AppRouter route', () => {
    const dead = LIVE_MODE_IDS.filter((id) => !ROUTED.has(id));
    expect(dead, `dead Arcade mode(s) with no route: ${dead.join(', ')}`).toEqual([]);
  });
});
