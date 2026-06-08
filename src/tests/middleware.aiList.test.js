import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

it('middleware does not maintain a stale partial AI-endpoint list (drift hazard)', () => {
  const src = readFileSync('functions/_middleware.js', 'utf8');
  // After remediation, the per-endpoint rate-limit is owned by requireAuthedAI, not a
  // hardcoded middleware list. Assert the stale 3-item AI_ENDPOINTS array is gone.
  const m = src.match(/AI_ENDPOINTS\s*=\s*\[([^\]]*)\]/);
  if (m) {
    const items = m[1].split(',').filter((s) => s.trim());
    expect(items.length).toBe(0); // either removed or empty; no stale partial list
  } else {
    expect(true).toBe(true); // removed entirely — fine
  }
});
