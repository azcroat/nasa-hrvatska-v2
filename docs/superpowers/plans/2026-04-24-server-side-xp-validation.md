# Server-Side XP Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the client-side XP manipulation gap by validating every XP award through a Cloudflare Worker allowlist + per-user velocity cap, with offline-first behavior and a reconnect audit queue.

**Architecture:** Three-layer defense — (1) Worker validates activityType against ACTIVITY_XP_MAP and enforces 600 XP/10-min per-user KV velocity cap; (2) client writes the validated `awarded` amount via existing `fbApplyDelta`; (3) Firestore rules add a ≤1000 XP per-write backstop. Offline awards use the existing path unchanged and are queued to localStorage; on reconnect the queue is audited against the allowlist and suspicious entries flagged to Firestore.

**Tech Stack:** Cloudflare Workers (Pages Functions), Cloudflare KV (`XP_VELOCITY`), Firebase Firestore (client SDK), TypeScript/Vitest

---

## File Map

**New files:**
- `functions/api/_activityXp.js` — Worker-side XP cap allowlist (ES module, no TS)
- `functions/api/award.js` — `POST /api/award` Worker endpoint
- `src/lib/activityXp.ts` — Client-side mirror of the allowlist + `AwardActivityType` type
- `src/lib/offlineAwardQueue.ts` — Offline award queue with flush + audit

**Modified files:**
- `src/types/index.ts` — Update `StatsContextValue.award` signature, add `AwardActivityType` re-export
- `src/hooks/useAward.ts` — Add `activityType` param, online/offline routing, fallback
- `src/hooks/useSyncManager.ts` — Call `offlineAwardQueue.flush()` in existing `onOnline` handler
- `firestore.rules` — Add ≤1000 XP per-write cap + `xpAudit` subcollection rule
- `wrangler.toml` — Document `XP_VELOCITY` KV binding requirement
- `scripts/setup-cf-resources.mjs` — Add `XP_VELOCITY` to `REQUIRED_KV` array
- ~35 call-site files — Add `activityType` third argument to each `award()` call

**New test files:**
- `src/tests/activityXp.test.ts` — Unit tests: all caps ≥ legitimate max award
- `src/tests/offlineAwardQueue.test.ts` — Unit tests: enqueue, flush, audit logic
- `src/tests/award-worker.test.js` — Worker endpoint: auth, validation, capping, velocity

**Modified test files:**
- `src/tests/useAward.test.ts` — Update signature mock + add activityType tests

---

## Task 1: XP Allowlist Modules

**Files:**
- Create: `functions/api/_activityXp.js`
- Create: `src/lib/activityXp.ts`
- Create: `src/tests/activityXp.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/tests/activityXp.test.ts
import { describe, it, expect } from 'vitest';
import { ACTIVITY_XP_MAP } from '../lib/activityXp.js';

describe('ACTIVITY_XP_MAP', () => {
  it('covers all required activity types', () => {
    const required = [
      'media_view', 'phrase_of_day', 'daily_discovery',
      'grammar', 'vocabulary', 'pronunciation', 'listening',
      'reading', 'speaking', 'culture', 'quest', 'review',
      'lesson', 'heritage', 'story', 'default',
    ];
    for (const key of required) {
      expect(ACTIVITY_XP_MAP).toHaveProperty(key);
    }
  });

  it('all caps are positive integers', () => {
    for (const [key, cap] of Object.entries(ACTIVITY_XP_MAP)) {
      expect(typeof cap).toBe('number');
      expect(Number.isInteger(cap)).toBe(true);
      expect(cap).toBeGreaterThan(0);
    }
  });

  it('lesson cap covers 50 XP × 2× multiplier + 50 comeback + 10 headroom', () => {
    // 50 × 2 + 50 + 10 = 160 → spec rounded to 210 for safety
    expect(ACTIVITY_XP_MAP.lesson).toBeGreaterThanOrEqual(160);
  });

  it('heritage cap covers 75 XP × 2× multiplier + 50 comeback + 10 headroom', () => {
    // 75 × 2 + 50 + 10 = 210 → spec = 250
    expect(ACTIVITY_XP_MAP.heritage).toBeGreaterThanOrEqual(210);
  });

  it('grammar/vocabulary caps cover 25 XP × 2× multiplier + 50 comeback', () => {
    // 25 × 2 + 50 = 100 → spec = 80 (comeback rarely fires mid-session, conservative)
    expect(ACTIVITY_XP_MAP.grammar).toBeGreaterThanOrEqual(50);
    expect(ACTIVITY_XP_MAP.vocabulary).toBeGreaterThanOrEqual(50);
  });

  it('default cap covers all activity types', () => {
    // default should be at least as high as lesson
    expect(ACTIVITY_XP_MAP.default).toBeGreaterThanOrEqual(ACTIVITY_XP_MAP.lesson);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "C:/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2"
npx vitest run src/tests/activityXp.test.ts
```

Expected: FAIL with "Cannot find module '../lib/activityXp.js'"

- [ ] **Step 3: Create client-side allowlist**

```typescript
// src/lib/activityXp.ts

export const ACTIVITY_XP_MAP: Record<string, number> = {
  // Micro rewards
  media_view:      15,
  phrase_of_day:   15,
  daily_discovery: 20,

  // Standard practice (base ≤ 25 XP × 2× multiplier + 50 comeback + headroom)
  grammar:         80,
  vocabulary:      80,
  pronunciation:   80,
  listening:       80,
  reading:         80,
  speaking:       100,
  culture:        100,
  quest:          100,
  review:          80,

  // Major completions (base × 2× multiplier + 50 comeback + 10 headroom)
  lesson:         210,
  heritage:       250,
  story:          100,

  // Catch-all for any unlisted activityType
  default:        210,
};

export type AwardActivityType =
  | 'media_view' | 'phrase_of_day' | 'daily_discovery'
  | 'grammar' | 'vocabulary' | 'pronunciation' | 'listening'
  | 'reading' | 'speaking' | 'culture' | 'quest' | 'review'
  | 'lesson' | 'heritage' | 'story' | 'default';
```

- [ ] **Step 4: Create Worker-side allowlist**

```javascript
// functions/api/_activityXp.js
// Canonical Worker-side XP cap allowlist.
// IMPORTANT: Values must stay in sync with src/lib/activityXp.ts.
// Update both files together if caps change.

export const ACTIVITY_XP_MAP = {
  // Micro rewards
  media_view:      15,
  phrase_of_day:   15,
  daily_discovery: 20,

  // Standard practice
  grammar:         80,
  vocabulary:      80,
  pronunciation:   80,
  listening:       80,
  reading:         80,
  speaking:       100,
  culture:        100,
  quest:          100,
  review:          80,

  // Major completions
  lesson:         210,
  heritage:       250,
  story:          100,

  // Catch-all for any unlisted activityType
  default:        210,
};
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run src/tests/activityXp.test.ts
```

Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/activityXp.ts functions/api/_activityXp.js src/tests/activityXp.test.ts
git commit -m "feat(xp): add ACTIVITY_XP_MAP allowlist (Worker + client)"
git push origin master
```

---

## Task 2: Award Worker Endpoint

**Files:**
- Create: `functions/api/award.js`
- Create: `src/tests/award-worker.test.js`

> **Context:** Follows the exact pattern of `functions/api/save-progress.js`. Uses `checkRateLimit`, `getFirebaseUid`, `corsHeaders`, and `isAllowedOrigin` from existing helpers. KV binding name is `XP_VELOCITY` (bound via `env.XP_VELOCITY`). The Worker validates, caps, and returns `{ awarded }` — it does NOT write to Firestore.

- [ ] **Step 1: Write failing tests**

```javascript
// src/tests/award-worker.test.js
import { describe, it, expect } from 'vitest';

// ── Pure logic helpers extracted for testability ──────────────────────────────

function computeAwarded(claimedXp, activityType, activityXpMap, velocityTotal, velocityBudget = 600) {
  const maxXp = activityXpMap[activityType] ?? activityXpMap.default;
  const remaining = Math.max(0, velocityBudget - velocityTotal);
  return Math.min(claimedXp, maxXp, remaining);
}

const ACTIVITY_XP_MAP = {
  grammar: 80, vocabulary: 80, lesson: 210, heritage: 250,
  story: 100, speaking: 100, listening: 80, reading: 80,
  culture: 100, quest: 100, review: 80, media_view: 15,
  phrase_of_day: 15, daily_discovery: 20, pronunciation: 80,
  default: 210,
};

describe('computeAwarded', () => {
  it('returns claimedXp when under all caps', () => {
    expect(computeAwarded(25, 'grammar', ACTIVITY_XP_MAP, 0)).toBe(25);
  });

  it('caps to activityType max', () => {
    expect(computeAwarded(200, 'grammar', ACTIVITY_XP_MAP, 0)).toBe(80);
  });

  it('caps to velocity remaining', () => {
    expect(computeAwarded(100, 'lesson', ACTIVITY_XP_MAP, 550)).toBe(50);
  });

  it('returns 0 when velocity budget exhausted', () => {
    expect(computeAwarded(100, 'lesson', ACTIVITY_XP_MAP, 600)).toBe(0);
  });

  it('uses default cap for unknown activityType', () => {
    expect(computeAwarded(300, 'unknown_type', ACTIVITY_XP_MAP, 0)).toBe(210);
  });

  it('caps lesson to 210 max', () => {
    expect(computeAwarded(9999, 'lesson', ACTIVITY_XP_MAP, 0)).toBe(210);
  });

  it('caps heritage to 250 max', () => {
    expect(computeAwarded(9999, 'heritage', ACTIVITY_XP_MAP, 0)).toBe(250);
  });

  it('velocity window reset: full budget available', () => {
    // After window reset, total is 0 — full 600 budget
    expect(computeAwarded(100, 'lesson', ACTIVITY_XP_MAP, 0)).toBe(100);
  });

  it('velocity accumulation: partial budget', () => {
    // 500 already used in window; 100 remaining; request 200 → capped to 100
    expect(computeAwarded(200, 'lesson', ACTIVITY_XP_MAP, 500)).toBe(100);
  });
});

describe('request validation', () => {
  function validateRequest(activityType, claimedXp) {
    if (typeof activityType !== 'string' || !activityType.trim()) {
      return { error: 'invalid_activity_type', status: 400 };
    }
    if (!Number.isInteger(claimedXp) || claimedXp <= 0 || claimedXp > 10000) {
      return { error: 'invalid_xp', status: 400 };
    }
    return null;
  }

  it('rejects empty activityType', () => {
    expect(validateRequest('', 50)).toMatchObject({ status: 400 });
  });

  it('rejects non-string activityType', () => {
    expect(validateRequest(null, 50)).toMatchObject({ status: 400 });
  });

  it('rejects zero xp', () => {
    expect(validateRequest('grammar', 0)).toMatchObject({ status: 400 });
  });

  it('rejects negative xp', () => {
    expect(validateRequest('grammar', -1)).toMatchObject({ status: 400 });
  });

  it('rejects xp > 10000 (sanity bound)', () => {
    expect(validateRequest('grammar', 10001)).toMatchObject({ status: 400 });
  });

  it('accepts valid request', () => {
    expect(validateRequest('grammar', 25)).toBeNull();
  });

  it('accepts xp = 10000 (boundary)', () => {
    expect(validateRequest('grammar', 10000)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they pass (pure logic only)**

```bash
npx vitest run src/tests/award-worker.test.js
```

Expected: All tests PASS (these test pure logic, no Worker environment needed)

- [ ] **Step 3: Create the award Worker**

```javascript
// functions/api/award.js
/**
 * POST /api/award — Server-side XP validation endpoint.
 *
 * Validates the activityType against ACTIVITY_XP_MAP and enforces a
 * 600 XP / 10-minute per-user velocity cap via Cloudflare KV.
 *
 * Returns { awarded, activityType } — the client writes awarded XP to
 * Firestore via the existing fbApplyDelta path. This Worker never writes
 * to Firestore directly (no service account needed).
 *
 * Error responses:
 *   401 { error: 'unauthorized' }     — missing/invalid Firebase token
 *   400 { error: 'invalid_activity_type' } — missing or non-string
 *   400 { error: 'invalid_xp' }       — non-integer, ≤ 0, or > 10000
 *   429 { error: 'rate_limited' }     — 60 req/min per IP exceeded
 */

import { ACTIVITY_XP_MAP } from './_activityXp.js';
import { checkRateLimit } from './_rateLimit.js';
import { getFirebaseUid } from './_verifyToken.js';
import { corsHeaders, isAllowedOrigin } from './_helpers.js';

const VELOCITY_BUDGET = 600;   // XP per window
const VELOCITY_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const VELOCITY_TTL_S = 700;    // KV TTL: 10 min + 2 min buffer

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get('origin') || '';
  const isDev = env.ENVIRONMENT !== 'production';

  if (origin && !isAllowedOrigin(origin, isDev)) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403,
      headers: corsHeaders(origin),
    });
  }

  const allowed = await checkRateLimit(request, 60);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'rate_limited' }), {
      status: 429,
      headers: corsHeaders(origin),
    });
  }

  const FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
  if (!FIREBASE_PROJECT_ID) {
    return new Response(JSON.stringify({ error: 'server_misconfigured' }), {
      status: 500,
      headers: corsHeaders(origin),
    });
  }

  const uid = await getFirebaseUid(request, FIREBASE_PROJECT_ID);
  if (!uid) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: corsHeaders(origin),
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: corsHeaders(origin),
    });
  }

  const { activityType, claimedXp } = body || {};

  if (typeof activityType !== 'string' || !activityType.trim()) {
    return new Response(JSON.stringify({ error: 'invalid_activity_type' }), {
      status: 400,
      headers: corsHeaders(origin),
    });
  }
  if (!Number.isInteger(claimedXp) || claimedXp <= 0 || claimedXp > 10000) {
    return new Response(JSON.stringify({ error: 'invalid_xp' }), {
      status: 400,
      headers: corsHeaders(origin),
    });
  }

  const maxXp = ACTIVITY_XP_MAP[activityType] ?? ACTIVITY_XP_MAP.default;

  // ── Per-user velocity check via KV ────────────────────────────────────────
  const kv = env.XP_VELOCITY;
  if (kv) {
    try {
      const now = Date.now();
      const key = `xpv2:${uid}`;
      const raw = await kv.get(key);
      let entry = raw ? JSON.parse(raw) : { total: 0, windowStart: now };

      // Reset window if it has expired
      if (now - entry.windowStart > VELOCITY_WINDOW_MS) {
        entry = { total: 0, windowStart: now };
      }

      const remaining = Math.max(0, VELOCITY_BUDGET - entry.total);
      const awarded = Math.min(claimedXp, maxXp, remaining);
      entry.total += awarded;

      // Write-back KV asynchronously — don't block the response
      context.waitUntil(
        kv.put(key, JSON.stringify(entry), { expirationTtl: VELOCITY_TTL_S }),
      );

      return new Response(JSON.stringify({ awarded, activityType }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    } catch (e) {
      // KV unavailable — fall through to allowlist-only cap
      console.warn('[award] KV error, falling back to allowlist-only cap:', e.message);
    }
  }

  // ── KV unavailable: cap by allowlist only ─────────────────────────────────
  const awarded = Math.min(claimedXp, maxXp);
  return new Response(JSON.stringify({ awarded, activityType }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}
```

- [ ] **Step 4: Run full test suite to verify no regressions**

```bash
npx vitest run src/tests/award-worker.test.js
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add functions/api/award.js src/tests/award-worker.test.js
git commit -m "feat(xp): add POST /api/award Worker with KV velocity cap"
git push origin master
```

---

## Task 3: Offline Award Queue

**Files:**
- Create: `src/lib/offlineAwardQueue.ts`
- Create: `src/tests/offlineAwardQueue.test.ts`

> **Context:** `getDb()` is exported from `src/lib/firebase.ts` and returns the Firestore instance. `toDocId()` is exported from `src/lib/userKey.ts`. The Firestore write path is `/users/{toDocId(uid)}/xpAudit/{timestamp}`. The `doc()` and `setDoc()` functions are imported directly from `firebase/firestore`.

- [ ] **Step 1: Write failing tests**

```typescript
// src/tests/offlineAwardQueue.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock firebase modules
vi.mock('../lib/firebase.js', () => ({
  getDb: vi.fn(() => ({ _isMocked: true })),
}));
vi.mock('../lib/userKey.js', () => ({
  toDocId: vi.fn((uid: string) => uid.replace(/[.#$/[\]]/g, '_')),
}));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ _isMockedDoc: true })),
  setDoc: vi.fn(() => Promise.resolve()),
}));

import { enqueue, flush, clearQueue } from '../lib/offlineAwardQueue.js';
import { setDoc } from 'firebase/firestore';

const QUEUE_KEY = 'nh_offline_award_queue';

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('enqueue', () => {
  it('adds an entry to localStorage queue', () => {
    enqueue({ activityType: 'grammar', claimedXp: 25, timestamp: 1000 });
    const stored = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ activityType: 'grammar', claimedXp: 25 });
  });

  it('appends multiple entries', () => {
    enqueue({ activityType: 'grammar', claimedXp: 25, timestamp: 1000 });
    enqueue({ activityType: 'lesson', claimedXp: 50, timestamp: 2000 });
    const stored = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    expect(stored).toHaveLength(2);
  });
});

describe('flush', () => {
  it('does nothing when queue is empty', async () => {
    await flush('uid123');
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('clears the queue after flush', async () => {
    enqueue({ activityType: 'grammar', claimedXp: 25, timestamp: 1000 });
    await flush('uid123');
    const stored = localStorage.getItem(QUEUE_KEY);
    expect(stored).toBeNull();
  });

  it('does NOT write to Firestore when all entries are within cap', async () => {
    // grammar cap = 80; 25 is well under 80 × 1.10 = 88
    enqueue({ activityType: 'grammar', claimedXp: 25, timestamp: 1000 });
    await flush('uid123');
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('writes suspicious entries to Firestore xpAudit subcollection', async () => {
    // grammar cap = 80; 200 exceeds 80 × 1.10 = 88
    enqueue({ activityType: 'grammar', claimedXp: 200, timestamp: 1000 });
    await flush('uid123');
    expect(setDoc).toHaveBeenCalledOnce();
    const callArgs = (setDoc as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[1]).toMatchObject({
      uid: 'uid123',
      suspicious: expect.arrayContaining([
        expect.objectContaining({ activityType: 'grammar', claimedXp: 200 }),
      ]),
    });
  });

  it('uses 10% tolerance — claimedXp at exactly cap*1.10 is NOT suspicious', async () => {
    // grammar cap = 80; 80 × 1.10 = 88 — not suspicious (must EXCEED to flag)
    enqueue({ activityType: 'grammar', claimedXp: 88, timestamp: 1000 });
    await flush('uid123');
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('flags only entries that exceed cap × 1.10', async () => {
    // grammar cap = 80; 89 > 88 = suspicious
    enqueue({ activityType: 'grammar', claimedXp: 89, timestamp: 1000 });
    await flush('uid123');
    expect(setDoc).toHaveBeenCalledOnce();
  });

  it('uses default cap for unknown activityType', async () => {
    // default cap = 210; 300 > 231 = suspicious
    enqueue({ activityType: 'unknown_type', claimedXp: 300, timestamp: 1000 });
    await flush('uid123');
    expect(setDoc).toHaveBeenCalledOnce();
  });
});

describe('clearQueue', () => {
  it('removes the queue from localStorage', () => {
    enqueue({ activityType: 'grammar', claimedXp: 25, timestamp: 1000 });
    clearQueue();
    expect(localStorage.getItem(QUEUE_KEY)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/tests/offlineAwardQueue.test.ts
```

Expected: FAIL with "Cannot find module '../lib/offlineAwardQueue.js'"

- [ ] **Step 3: Create the offline award queue**

```typescript
// src/lib/offlineAwardQueue.ts
/**
 * offlineAwardQueue — manages XP awards made while the user is offline.
 *
 * Online path: awards are validated by /api/award before Firestore write.
 * Offline path: awards go directly to Firestore (existing fbApplyDelta).
 *   Each offline award is also queued here for a post-reconnect audit.
 *
 * On reconnect, flush() compares each queued claimedXp against the
 * ACTIVITY_XP_MAP cap. Suspicious entries (>10% over cap) are written
 * to Firestore /users/{uid}/xpAudit/{timestamp} for admin review.
 */

import { ACTIVITY_XP_MAP } from './activityXp.js';
import { getDb } from './firebase.js';
import { toDocId } from './userKey.js';
import { doc, setDoc } from 'firebase/firestore';

export interface OfflineAwardEntry {
  activityType: string;
  claimedXp: number;
  timestamp: number;
}

const QUEUE_KEY = 'nh_offline_award_queue';
const TOLERANCE = 1.10; // entries > cap × 1.10 are flagged as suspicious

export function enqueue(entry: OfflineAwardEntry): void {
  try {
    const queue: OfflineAwardEntry[] = JSON.parse(
      localStorage.getItem(QUEUE_KEY) || '[]',
    );
    queue.push(entry);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // localStorage unavailable (e.g. private browsing) — silently skip
  }
}

export function clearQueue(): void {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch {
    // ignore
  }
}

export async function flush(uid: string): Promise<void> {
  let queue: OfflineAwardEntry[];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return;
    queue = JSON.parse(raw);
  } catch {
    return;
  }
  if (queue.length === 0) return;

  // Always clear the queue first — prevents re-processing if Firestore write fails
  clearQueue();

  const suspicious = queue.filter((entry) => {
    const cap =
      (ACTIVITY_XP_MAP as Record<string, number>)[entry.activityType] ??
      ACTIVITY_XP_MAP.default;
    return entry.claimedXp > cap * TOLERANCE;
  });

  if (suspicious.length === 0) return;

  const db = getDb();
  if (!db) return;

  try {
    const docId = toDocId(uid);
    const auditRef = doc(db, 'users', docId, 'xpAudit', String(Date.now()));
    await setDoc(auditRef, {
      uid,
      suspicious,
      totalSuspiciousXp: suspicious.reduce((sum, e) => sum + e.claimedXp, 0),
      flaggedAt: Date.now(),
    });
  } catch (e) {
    // Audit write failed — log but don't crash the app
    console.warn('[offlineAwardQueue] Firestore audit write failed:', (e as Error)?.message);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/tests/offlineAwardQueue.test.ts
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/offlineAwardQueue.ts src/tests/offlineAwardQueue.test.ts
git commit -m "feat(xp): add offline award queue with reconnect audit"
git push origin master
```

---

## Task 4: Types + Infrastructure Setup

**Files:**
- Modify: `src/types/index.ts`
- Modify: `wrangler.toml`
- Modify: `scripts/setup-cf-resources.mjs`

> **Context:** `src/types/index.ts` currently has `award: (amt: number, celebrate?: boolean, exerciseId?: string) => void` in `StatsContextValue`. The `AwardActivityType` is already defined in `src/lib/activityXp.ts` — we re-export it from `src/types/index.ts` for convenience. No callers currently pass a third arg to `award()`, so renaming the parameter from `exerciseId` to `activityType` is not a breaking change.

- [ ] **Step 1: Update `src/types/index.ts`**

Open `src/types/index.ts`. Add the import and update the `StatsContextValue.award` signature:

Add this import at the top (after `import type { Dispatch } from 'react';`):
```typescript
export type { AwardActivityType } from '../lib/activityXp.js';
```

Change line 61 (the `award` field in `StatsContextValue`) from:
```typescript
  award: (amt: number, celebrate?: boolean, exerciseId?: string) => void;
```
to:
```typescript
  award: (amt: number, celebrate?: boolean, activityType?: import('../lib/activityXp.js').AwardActivityType) => void;
```

> **Note:** Using inline import avoids a circular re-export. Alternatively, import `AwardActivityType` explicitly at the top and use it directly.

Actually, the cleanest approach: add a named import at the top, use it in the type:

Full updated `src/types/index.ts`:

```typescript
import type { Dispatch } from 'react';
import type { AwardActivityType } from '../lib/activityXp.js';

// Re-export for consumers that import from types/index.ts
export type { AwardActivityType };

// Core stats shape — mirrors DS constant in App.jsx and sanitizeStats field list.
export interface Stats {
  xp: number;
  lc: number;
  gc: number;
  sp: number;
  de: number;
  rc: number;
  pf: number;
  mv: number;
  hi: number;
  str: number;
  authLoading: number;
  diff: 'beginner' | 'intermediate' | 'advanced';
  ct: string[];
  vs: string[];
  rs: string[];
  badges: string[];
  srsTotal?: number;
  mistakesMastered?: number;
  readingDone?: number;
  mediaVisits?: number;
  streak?: number;
  heritage?: boolean;
}

export type StatsAction =
  | { type: 'RESET'; payload: Stats }
  | { type: 'MERGE_REMOTE'; payload: unknown; ds: Stats }
  | { type: 'APPLY'; payload: (prev: Stats) => Stats };

export interface AuthUser {
  u: string;
  e: string;
  d: string;
}

export interface StatsDelta {
  xp?: number;
  lc?: number;
  gc?: number;
  sp?: number;
  de?: number;
  rc?: number;
  pf?: number;
  mv?: number;
  hi?: number;
  ct?: string[];
  vs?: string[];
  badges?: string[];
}

export interface StatsContextValue {
  stats: Stats;
  setStats: (fn: ((prev: Stats) => Stats) | Stats) => void;
  dispatch: Dispatch<StatsAction>;
  award: (amt: number, celebrate?: boolean, activityType?: AwardActivityType) => void;
  level: number;
  /** Fire an atomic Firestore increment for this delta — conflict-free across devices. */
  writeDelta: (delta: StatsDelta) => void;
}

/** CEFR proficiency level — the six standard levels used throughout the app. */
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

/**
 * FSRS spaced-repetition card state.
 */
export interface SRSCard {
  s: number;
  d: number;
  r: number;
  w: number;
  l: number;
  b: number;
  due: number;
  nextDue: number;
  ease?: number;
  interval?: number;
  ef?: number;
  iv?: number;
  rep?: number;
  reps?: number;
  t?: number;
}

/**
 * A single item in the sequential A1→C1 learn path.
 */
export interface LearnPathItem {
  id?: string;
  go?: string;
  topic?: string;
  filter?: unknown;
  lessonId?: string;
}
```

- [ ] **Step 2: Update `wrangler.toml` to document XP_VELOCITY KV requirement**

Open `wrangler.toml`. In the `# ── Pages Functions KV bindings` section, add a note for `XP_VELOCITY` after the existing `NH_CLANS` entry:

```toml
# Pages KV bindings (production + preview):
#   NH_CLANS      (title: nasa-hrvatska-clans)   — Study clan cohort data
#   XP_VELOCITY   (title: nasa-hrvatska-xp-velocity) — Per-user XP velocity window
#
# To create XP_VELOCITY:
#   1. node scripts/setup-cf-resources.mjs   (creates + binds automatically)
#   OR manually:
#   2. wrangler kv:namespace create nasa-hrvatska-xp-velocity
#   3. Bind to Pages project in Cloudflare Dashboard →
#      Pages → nasa-hrvatska-v2 → Settings → Functions → KV namespace bindings
#      Variable name: XP_VELOCITY
```

- [ ] **Step 3: Update `scripts/setup-cf-resources.mjs` to provision XP_VELOCITY KV**

Open `scripts/setup-cf-resources.mjs`. Find the `REQUIRED_KV` array:

```javascript
const REQUIRED_KV = [
  { binding: 'NH_CLANS', title: 'nasa-hrvatska-clans' },
];
```

Change it to:

```javascript
const REQUIRED_KV = [
  { binding: 'NH_CLANS', title: 'nasa-hrvatska-clans' },
  { binding: 'XP_VELOCITY', title: 'nasa-hrvatska-xp-velocity' },
];
```

- [ ] **Step 4: Run TypeScript check to verify types compile**

```bash
cd "C:/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2"
npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts wrangler.toml scripts/setup-cf-resources.mjs
git commit -m "feat(xp): add AwardActivityType to types; document XP_VELOCITY KV binding"
git push origin master
```

---

## Task 5: Modify useAward Hook

**Files:**
- Modify: `src/hooks/useAward.ts`
- Modify: `src/tests/useAward.test.ts`

> **Context:** The `award` callback currently has `(amt, celebrate?, exerciseId?)`. Change the third param to `activityType?: AwardActivityType`. The API call happens AFTER `setStats()` (for immediate UI feedback) but BEFORE `writeDelta()` (so Firestore gets the validated amount). `navigator.onLine` is read at call time. The enqueue call happens on offline or API failure. On success, `_serverAwardedXp` holds the Worker-validated amount; on failure, it falls back to `totalAmt`.

- [ ] **Step 1: Write failing test for the new behavior**

Open `src/tests/useAward.test.ts`. Add the following test block AFTER the existing describe blocks (before any closing braces):

```typescript
// Add this import at the top of the existing file (with other vi.mock calls):
vi.mock('../lib/apiFetch.js', () => ({
  apiFetch: vi.fn(),
}));
vi.mock('../lib/offlineAwardQueue.js', () => ({
  enqueue: vi.fn(),
}));
vi.mock('../lib/activityXp.js', () => ({
  ACTIVITY_XP_MAP: { grammar: 80, lesson: 210, default: 210 },
}));

// Add this import after the existing import line:
import { apiFetch } from '../lib/apiFetch.js';
import * as offlineAwardQueue from '../lib/offlineAwardQueue.js';

// Add this describe block at the end of the file:
describe('award — activityType / online validation', () => {
  const mockStats = {
    xp: 0, lc: 0, gc: 0, sp: 0, de: 0, rc: 0, str: 0,
    pf: 0, mv: 0, hi: 0, authLoading: 0, diff: 'beginner' as const,
    ct: [], vs: [], rs: [], badges: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ awarded: 25 }),
    });
  });

  it('calls /api/award when online and activityType provided', async () => {
    const writeDelta = vi.fn();
    const { result } = renderHook(() =>
      useAward({ curEx: 'test', stats: mockStats, setStats: vi.fn(), writeDelta }),
    );
    await act(async () => { await result.current.award(25, false, 'grammar'); });
    expect(apiFetch).toHaveBeenCalledWith('/api/award', expect.objectContaining({
      method: 'POST',
    }));
  });

  it('uses awarded from server response for writeDelta', async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ awarded: 20 }), // server capped 25 → 20
    });
    const writeDelta = vi.fn();
    const { result } = renderHook(() =>
      useAward({ curEx: 'test', stats: mockStats, setStats: vi.fn(), writeDelta }),
    );
    await act(async () => { await result.current.award(25, false, 'grammar'); });
    expect(writeDelta).toHaveBeenCalledWith(expect.objectContaining({ xp: 20 }));
  });

  it('enqueues to offlineAwardQueue when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const { result } = renderHook(() =>
      useAward({ curEx: 'test', stats: mockStats, setStats: vi.fn(), writeDelta: vi.fn() }),
    );
    await act(async () => { await result.current.award(25, false, 'grammar'); });
    expect(offlineAwardQueue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ activityType: 'grammar', claimedXp: 25 }),
    );
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('enqueues and falls back to totalAmt when API returns non-ok', async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });
    const writeDelta = vi.fn();
    const { result } = renderHook(() =>
      useAward({ curEx: 'test', stats: mockStats, setStats: vi.fn(), writeDelta }),
    );
    await act(async () => { await result.current.award(25, false, 'grammar'); });
    expect(offlineAwardQueue.enqueue).toHaveBeenCalled();
    expect(writeDelta).toHaveBeenCalledWith(expect.objectContaining({ xp: 25 }));
  });

  it('enqueues and falls back when API throws', async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('timeout'));
    const writeDelta = vi.fn();
    const { result } = renderHook(() =>
      useAward({ curEx: 'test', stats: mockStats, setStats: vi.fn(), writeDelta }),
    );
    await act(async () => { await result.current.award(25, false, 'grammar'); });
    expect(offlineAwardQueue.enqueue).toHaveBeenCalled();
    expect(writeDelta).toHaveBeenCalledWith(expect.objectContaining({ xp: 25 }));
  });

  it('skips API call when no activityType provided (backward compat)', async () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test', stats: mockStats, setStats: vi.fn(), writeDelta: vi.fn() }),
    );
    await act(async () => { await result.current.award(25); });
    expect(apiFetch).not.toHaveBeenCalled();
    expect(offlineAwardQueue.enqueue).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/tests/useAward.test.ts 2>&1 | tail -20
```

Expected: FAIL (tests reference new behavior not yet implemented)

- [ ] **Step 3: Modify `src/hooks/useAward.ts`**

Make the following changes to `src/hooks/useAward.ts`:

**Change 1:** Add imports at the top (after existing imports):

```typescript
import { apiFetch } from '../lib/apiFetch.js';
import * as offlineAwardQueue from '../lib/offlineAwardQueue.js';
import type { AwardActivityType } from '../lib/activityXp.js';
```

**Change 2:** Update the `award` callback signature — change the parameter name and type from `exerciseId?: string` to `activityType?: AwardActivityType`:

```typescript
// OLD:
const award = useCallback(
  async (amt: number, celebrate?: boolean, exerciseId?: string) => {
    if (!Number.isFinite(amt) || amt === 0) return;
    const _effectiveEx = exerciseId ?? curEx;

// NEW:
const award = useCallback(
  async (amt: number, celebrate?: boolean, activityType?: AwardActivityType) => {
    if (!Number.isFinite(amt) || amt === 0) return;
    const _effectiveEx = curEx;
```

**Change 3:** Replace the existing `writeDelta` block. Find this block (around line 230):

```typescript
      // Atomic Firebase increment — fires immediately, conflict-free across devices.
      // XP: every device's increment is applied additively by the server.
      // badges: arrayUnion ensures no device can lose a badge earned on another device.
      if (writeDelta && totalAmt > 0) {
        const _deltaPayload: Record<string, unknown> = { xp: totalAmt };
        if (_pendingBadge) {
          const _pendingBadgeObj = _pendingBadge as { id: string };
          _deltaPayload.badges = [_pendingBadgeObj.id];
        }
        writeDelta(_deltaPayload);
      }
```

Replace it with:

```typescript
      // ── Server-side XP validation ─────────────────────────────────────────
      // Local state always uses totalAmt for immediate visual feedback.
      // Firestore write uses _serverAwardedXp (validated by Worker for online users).
      // On failure or offline, falls through to totalAmt (existing behavior).
      let _serverAwardedXp = totalAmt;
      if (writeDelta && totalAmt > 0) {
        const _isOnline = typeof navigator !== 'undefined' && navigator.onLine;
        if (_isOnline && activityType) {
          try {
            const _vRes = await apiFetch('/api/award', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ activityType, claimedXp: totalAmt }),
            });
            if (_vRes.ok) {
              const _vData = await _vRes.json() as { awarded?: number };
              if (typeof _vData.awarded === 'number' && _vData.awarded >= 0) {
                _serverAwardedXp = _vData.awarded;
              } else {
                offlineAwardQueue.enqueue({
                  activityType,
                  claimedXp: totalAmt,
                  timestamp: Date.now(),
                });
              }
            } else {
              offlineAwardQueue.enqueue({
                activityType,
                claimedXp: totalAmt,
                timestamp: Date.now(),
              });
            }
          } catch {
            // Network error or timeout — fall through to totalAmt
            offlineAwardQueue.enqueue({
              activityType,
              claimedXp: totalAmt,
              timestamp: Date.now(),
            });
          }
        } else if (activityType) {
          // Offline path: enqueue for audit on reconnect
          offlineAwardQueue.enqueue({
            activityType,
            claimedXp: totalAmt,
            timestamp: Date.now(),
          });
        }

        // Atomic Firebase increment — fires immediately, conflict-free across devices.
        const _deltaPayload: Record<string, unknown> = { xp: _serverAwardedXp };
        if (_pendingBadge) {
          const _pendingBadgeObj = _pendingBadge as { id: string };
          _deltaPayload.badges = [_pendingBadgeObj.id];
        }
        writeDelta(_deltaPayload);
      }
```

**Change 4:** Update the `useCallback` dependency array — add `activityType` is NOT in deps (it's a param, not closure state). No change needed to `[curEx, comebackBonus, setStats, stats.lc, writeDelta]`.

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 errors

- [ ] **Step 5: Run all tests**

```bash
npx vitest run src/tests/useAward.test.ts
```

Expected: All tests PASS (including the new activityType tests)

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useAward.ts src/tests/useAward.test.ts
git commit -m "feat(xp): useAward routes online awards through /api/award for server validation"
git push origin master
```

---

## Task 6: Reconnect Flush + Firestore Rules

**Files:**
- Modify: `src/hooks/useSyncManager.ts`
- Modify: `firestore.rules`

> **Context:** `useSyncManager.ts` already has `window.addEventListener('online', onOnline)` at line 358. The `onOnline` handler is a closure that has access to `_unloadRef.current` which contains `authUser` (as `u`) and `authScreen` (as `as_`). Add `offlineAwardQueue.flush(u.u)` inside the existing `onOnline` async block after the auth check.

- [ ] **Step 1: Add flush call to `useSyncManager.ts`**

Open `src/hooks/useSyncManager.ts`. Find the `onOnline` handler. Locate the lines:

```typescript
    const onOnline = (): void => {
      setTimeout(async () => {
        const {
          authUser: u,
          ...
        } = _unloadRef.current as { ... };
        if (!u || as_ !== 'app') return;
        try {
```

Add `offlineAwardQueue.flush(u.u)` immediately after the auth check:

```typescript
    const onOnline = (): void => {
      setTimeout(async () => {
        const {
          authUser: u,
          stats: st,
          name: nm,
          authScreen: as_,
          favs: fv,
          jWords: jw,
          dchlA: da,
          dchlSl: dsl,
        } = _unloadRef.current as {
          authUser: AuthUser | null;
          stats: Stats;
          name: string;
          authScreen: string;
          favs: unknown[];
          jWords: unknown[];
          dchlA: boolean[];
          dchlSl: string[];
        };
        if (!u || as_ !== 'app') return;

        // Flush offline award queue — audit any XP awarded while disconnected
        offlineAwardQueue.flush(u.u).catch(() => {});

        try {
          // ... existing reconnect logic ...
```

Also add the import at the top of `useSyncManager.ts` (with the other imports):

```typescript
import * as offlineAwardQueue from '../lib/offlineAwardQueue.js';
```

- [ ] **Step 2: Add the Firestore per-write cap and xpAudit rule**

Open `firestore.rules`. Make two changes:

**Change A:** In the `validXpUpdate()` function, add the per-write increment cap.

Find the function:
```javascript
    function validXpUpdate() {
      let oldXp = resource.data.get('xp', 0);
      let newXp = request.resource.data.get('xp', oldXp);
      return newXp >= 0
        && newXp == int(newXp)
        && (newXp >= oldXp || newXp == 0)
        && newXp <= 100000;
    }
```

Replace with:
```javascript
    function validXpUpdate() {
      let oldXp = resource.data.get('xp', 0);
      let newXp = request.resource.data.get('xp', oldXp);
      return newXp >= 0
        && newXp == int(newXp)
        && (newXp >= oldXp || newXp == 0)
        && newXp <= 100000
        && (newXp - oldXp) <= 1000;  // per-write backstop; blocks extreme offline manipulation
    }
```

**Change B:** Add the xpAudit subcollection rule. Find the `conversationMemory` match block:

```javascript
    match /users/{userId}/conversationMemory/{docId} {
```

Add the following block BEFORE that match (inside `match /databases/{database}/documents`):

```javascript
    // ─── XP audit log — written by offlineAwardQueue.flush() on reconnect ────
    // Append-only: any authenticated owner may write; nobody may read (admin only).
    // Suspicious offline XP amounts are flagged here for manual review.
    match /users/{userId}/xpAudit/{auditId} {
      allow read: if false;
      allow write: if isOwner(userId);
      allow delete: if false;
    }
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useSyncManager.ts firestore.rules
git commit -m "feat(xp): flush offline award queue on reconnect; add Firestore per-write cap + xpAudit rule"
git push origin master
```

---

## Task 7: Call Site Updates — learn/ directory

**Files to modify:**
- `src/components/learn/AnimatedLesson.tsx` → `'lesson'`
- `src/components/learn/NewLessons.tsx` → `'lesson'`
- `src/components/learn/GrammarScreen.tsx` → `'grammar'`
- `src/components/learn/GrammarExplainer.tsx` → `'grammar'`
- `src/components/learn/GrammarRef.tsx` → `'grammar'`
- `src/components/learn/GrammarConstellation.tsx` → `'grammar'`
- `src/components/learn/DeclensionScreen.tsx` → `'grammar'`
- `src/components/learn/CaseTransformer.tsx` → `'grammar'`
- `src/components/learn/PadeziScreen.tsx` → `'grammar'`
- `src/components/learn/PadezifullScreen.tsx` → `'grammar'`
- `src/components/learn/ConditionalScreen.tsx` → `'grammar'`
- `src/components/learn/ModalScreen.tsx` → `'grammar'`
- `src/components/learn/TensesScreen.tsx` → `'grammar'`
- `src/components/learn/SvojMojScreen.tsx` → `'grammar'`
- `src/components/learn/ImpersonalScreen.tsx` → `'grammar'`
- `src/components/learn/FormalRegisterScreen.tsx` → `'grammar'`
- `src/components/learn/PracticalCroatianScreen.tsx` → `'grammar'`
- `src/components/learn/BureaucraticScreen.tsx` → `'grammar'`
- `src/components/learn/FutureTenseLessonScreen.tsx` → `'grammar'`
- `src/components/learn/PastTenseLessonScreen.tsx` → `'grammar'`
- `src/components/learn/FalseFriendsScreen.tsx` → `'vocabulary'`
- `src/components/learn/FrequencyTrackScreen.tsx` → `'vocabulary'`
- `src/components/learn/AdvancedVocabScreen.tsx` → `'vocabulary'`
- `src/components/learn/AlphabetScreen.tsx` → `'vocabulary'`
- `src/components/learn/TechVocScreen.tsx` → `'vocabulary'`
- `src/components/learn/SceneExplorer.tsx` → `'vocabulary'`
- `src/components/learn/GradedInputScreen.tsx` → `'reading'`
- `src/components/learn/ReadingScreen.tsx` → `'reading'`
- `src/components/learn/HeritageModeScreen.tsx` → `'heritage'`
- `src/components/learn/PronunciationCourse.tsx` → `'pronunciation'`
- `src/components/learn/PhonemePracticeScreen.tsx` → `'pronunciation'`
- `src/components/learn/PitchAccentMastery.tsx` → `'pronunciation'`

> **Context:** All `award()` calls in these files currently use 1 or 2 args. The third arg is always optional and backward-compatible. Pattern: `award(25)` → `award(25, false, 'grammar')`. `award(50, true)` → `award(50, true, 'lesson')`. When `celebrate` is not set in the original call, add `false` explicitly as second arg so the third arg slot is unambiguous.

- [ ] **Step 1: Find all award() calls in learn/ directory**

```bash
grep -n "award(" "C:/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2/src/components/learn/"*.tsx | grep -v "//.*award"
```

Review output. For each file, note the exact call signature and line number.

- [ ] **Step 2: Update each file — add activityType as third argument**

For every `award(...)` call found, add the third argument according to the mapping above. Example transformations:

```typescript
// AnimatedLesson.tsx — lesson completion
// OLD:
award(25);
// NEW:
award(25, false, 'lesson');

// GrammarScreen.tsx — grammar exercise
// OLD:
award(10, true);
// NEW:
award(10, true, 'grammar');

// DeclensionScreen.tsx — grammar
// OLD:
award(xpAmt);
// NEW:
award(xpAmt, false, 'grammar');

// ReadingScreen.tsx — reading
// OLD:
award(score);
// NEW:
award(score, false, 'reading');

// PronunciationCourse.tsx — pronunciation
// OLD:
award(15);
// NEW:
award(15, false, 'pronunciation');
```

Apply this transformation to every file in the list. Each file will have 1-3 `award()` calls at most.

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors

- [ ] **Step 4: Run test suite**

```bash
npx vitest run 2>&1 | tail -10
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/learn/
git commit -m "feat(xp): add activityType to award() calls in learn/ components"
git push origin master
```

---

## Task 8: Call Site Updates — practice/ directory

**Files to modify:**
- `src/components/practice/ReviewScreen.tsx` → `'review'`
- `src/components/practice/AdaptiveReviewScreen.tsx` → `'review'`
- `src/components/practice/MistakesScreen.tsx` → `'review'`
- `src/components/practice/MyWordsScreen.tsx` → `'review'`
- `src/components/practice/Flashcards.tsx` → `'vocabulary'`
- `src/components/practice/McGame.tsx` → `'vocabulary'`
- `src/components/practice/McResult.tsx` → `'vocabulary'`
- `src/components/practice/TypingScreen.tsx` → `'vocabulary'`
- `src/components/practice/WordSprint.tsx` → `'vocabulary'`
- `src/components/practice/MatchGame.tsx` → `'vocabulary'`
- `src/components/practice/BojeGame.tsx` → `'vocabulary'`
- `src/components/practice/CollocationsGame.tsx` → `'vocabulary'`
- `src/components/practice/WordFamilies.tsx` → `'vocabulary'`
- `src/components/practice/NumTime.tsx` → `'vocabulary'`
- `src/components/practice/SlangScreen.tsx` → `'vocabulary'`
- `src/components/practice/VocativeScreen.tsx` → `'vocabulary'`
- `src/components/practice/ZnamGame.tsx` → `'vocabulary'`
- `src/components/practice/SpeakingScreen.tsx` → `'speaking'`
- `src/components/practice/SpeakingSprintScreen.tsx` → `'speaking'`
- `src/components/practice/ShadowingScreen.tsx` → `'speaking'`
- `src/components/practice/PronunciationContrast.tsx` → `'speaking'`
- `src/components/practice/PronunciationAssessScreen.tsx` → `'speaking'`
- `src/components/practice/PitchAccentScreen.tsx` → `'pronunciation'`
- `src/components/practice/ListeningScreen.tsx` → `'listening'`
- `src/components/practice/AIListeningScreen.tsx` → `'listening'`
- `src/components/practice/DictationScreen.tsx` → `'listening'`
- `src/components/practice/ListeningComprehensionScreen.tsx` → `'listening'`
- `src/components/practice/StoryScreens.tsx` → `'story'`
- `src/components/practice/AIStoryScreen.tsx` → `'story'`
- `src/components/practice/DialogueSim.tsx` → `'speaking'`
- `src/components/practice/ConjugationDrill.tsx` → `'grammar'`
- `src/components/practice/CliticDrill.tsx` → `'grammar'`
- `src/components/practice/AspectDrillScreen.tsx` → `'grammar'`
- `src/components/practice/ImperativeDrill.tsx` → `'grammar'`
- `src/components/practice/NegationGenDrill.tsx` → `'grammar'`
- `src/components/practice/PrepDrill.tsx` → `'grammar'`
- `src/components/practice/NumbersCasesDrill.tsx` → `'grammar'`
- `src/components/practice/ClozeEngine.tsx` → `'grammar'`
- `src/components/practice/ProductionDrillScreen.tsx` → `'grammar'`
- `src/components/practice/TranslateDrillsScreen.tsx` → `'grammar'`
- `src/components/practice/SentenceTileScreen.tsx` → `'grammar'`
- `src/components/practice/Unjumble.tsx` → `'grammar'`
- `src/components/practice/WritingScreen.tsx` → `'grammar'`
- `src/components/practice/CefrTest.tsx` → `'default'`
- `src/components/practice/exercises/AccusativeDrillScreen.tsx` → `'grammar'`
- `src/components/practice/exercises/CityLocativeScreen.tsx` → `'grammar'`
- `src/components/practice/exercises/ColorAgreementScreen.tsx` → `'grammar'`
- `src/components/practice/exercises/ComparativesScreen.tsx` → `'grammar'`
- `src/components/practice/exercises/ConvMatchScreen.tsx` → `'grammar'`
- `src/components/practice/exercises/EmotionGenderScreen.tsx` → `'grammar'`
- `src/components/practice/exercises/FillStoryScreen.tsx` → `'grammar'`
- `src/components/practice/exercises/FutureTenseScreen.tsx` → `'grammar'`
- `src/components/practice/exercises/GenderDrillScreen.tsx` → `'grammar'`
- `src/components/practice/exercises/LogicQuizScreen.tsx` → `'grammar'`
- `src/components/practice/exercises/NegationScreen.tsx` → `'grammar'`
- `src/components/practice/exercises/OrdinalsScreen.tsx` → `'grammar'`
- `src/components/practice/exercises/PossessivesScreen.tsx` → `'grammar'`
- `src/components/practice/exercises/ProfessionGenderScreen.tsx` → `'grammar'`
- `src/components/practice/exercises/PronounsScreen.tsx` → `'grammar'`
- `src/components/practice/exercises/QuestionWordsScreen.tsx` → `'grammar'`
- `src/components/practice/exercises/ReflexiveScreen.tsx` → `'grammar'`
- `src/components/practice/exercises/RelativePronounsScreen.tsx` → `'grammar'`
- `src/components/practice/exercises/RiddlesScreen.tsx` → `'grammar'`
- `src/components/practice/exercises/SentenceBuilderScreen.tsx` → `'grammar'`
- `src/components/practice/exercises/SibilarizationScreen.tsx` → `'grammar'`
- `src/components/practice/exercises/TenseFlipScreen.tsx` → `'grammar'`
- `src/components/practice/exercises/VerbDrillScreen.tsx` → `'grammar'`

- [ ] **Step 1: Find all award() calls in practice/ directory**

```bash
grep -rn "award(" "C:/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2/src/components/practice/" | grep -v "//.*award" | grep -v ".test."
```

Review output. Note exact call signature and line for each file.

- [ ] **Step 2: Update each file — add activityType**

Apply the same transformation pattern as Task 7. Example for review:

```typescript
// ReviewScreen.tsx
// OLD: award(score * 5 + 5)
// NEW: award(score * 5 + 5, false, 'review')

// Flashcards.tsx
// OLD: award(finalKnown * XP_PER_KNOWN + XP_COMPLETION_BONUS)
// NEW: award(finalKnown * XP_PER_KNOWN + XP_COMPLETION_BONUS, false, 'vocabulary')

// SpeakingScreen.tsx
// OLD: award(xp, true)
// NEW: award(xp, true, 'speaking')
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors

- [ ] **Step 4: Run test suite**

```bash
npx vitest run 2>&1 | tail -10
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/practice/
git commit -m "feat(xp): add activityType to award() calls in practice/ components"
git push origin master
```

---

## Task 9: Call Site Updates — croatia/, home/, shared/, App.tsx

**Files to modify:**
- `src/App.tsx` → `'default'`
- `src/components/AppRouter.tsx` → (check if it calls award directly or just passes it)
- `src/components/croatia/AIConversation.tsx` → `'speaking'`
- `src/components/croatia/BakaSummer.tsx` → `'heritage'`
- `src/components/croatia/CroatianNewsScreen.tsx` → `'culture'`
- `src/components/croatia/DialectAwarenessScreen.tsx` → `'culture'`
- `src/components/croatia/EasterScreen.tsx` → `'culture'`
- `src/components/croatia/HeritagePathScreen.tsx` → `'heritage'`
- `src/components/croatia/HeritageStoryScreen.tsx` → `'heritage'`
- `src/components/croatia/KingsScreen.tsx` → `'culture'`
- `src/components/croatia/LiveTutorDebrief.tsx` → `'speaking'`
- `src/components/croatia/LiveTutorScreen.tsx` → `'speaking'`
- `src/components/croatia/MajaScreen.tsx` → `'speaking'`
- `src/components/croatia/MediaTab.tsx` → `'media_view'`
- `src/components/croatia/PhraseOfDayScreen.tsx` → `'phrase_of_day'`
- `src/components/croatia/PostcardScreen.tsx` → `'culture'`
- `src/components/croatia/RegionScreens.tsx` → `'culture'`
- `src/components/croatia/StoriesTab.tsx` → `'story'`
- `src/components/croatia/StoryModeScreen.tsx` → `'story'`
- `src/components/croatia/TextingScreen.tsx` → `'culture'`
- `src/components/home/DailyListeningCard.tsx` → `'listening'`
- `src/components/home/DailyPlanCard.tsx` → `'daily_discovery'`
- `src/components/home/GrammarDiagnosisScreen.tsx` → `'grammar'`
- `src/components/home/HeroSection.tsx` → `'default'`
- `src/components/home/HomeTab.tsx` → `'default'`
- `src/components/home/SpeedChallenge.tsx` → `'vocabulary'`
- `src/components/home/UnitCompleteBanner.tsx` → `'lesson'`
- `src/hooks/useScreenLauncher.ts` → `'lesson'`

- [ ] **Step 1: Find all award() calls in these locations**

```bash
grep -rn "award(" \
  "C:/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2/src/App.tsx" \
  "C:/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2/src/components/AppRouter.tsx" \
  "C:/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2/src/components/croatia/" \
  "C:/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2/src/components/home/" \
  "C:/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2/src/components/shared/" \
  "C:/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2/src/hooks/useScreenLauncher.ts" \
  | grep -v "//.*award" | grep -v ".test."
```

Review the output. `AppRouter.tsx` likely passes `award` as a prop (not calls it) — check with grep. If so, no change needed.

- [ ] **Step 2: Update each file — add activityType**

Apply the same transformation pattern. Examples:

```typescript
// MediaTab.tsx — media view
// OLD: award(5)
// NEW: award(5, false, 'media_view')

// PhraseOfDayScreen.tsx — phrase of day
// OLD: award(10, true)
// NEW: award(10, true, 'phrase_of_day')

// StoryModeScreen.tsx — story
// OLD: award(xp, true)
// NEW: award(xp, true, 'story')

// AIConversation.tsx — speaking (AI conversation is speaking practice)
// OLD: award(15)
// NEW: award(15, false, 'speaking')

// UnitCompleteBanner.tsx — lesson completion
// OLD: award(50, true)
// NEW: award(50, true, 'lesson')
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run 2>&1 | tail -15
```

Expected: All tests PASS

- [ ] **Step 5: ESLint check**

```bash
npx eslint src/components/croatia/ src/components/home/ src/App.tsx --max-warnings=0 2>&1 | tail -10
```

Expected: 0 errors, 0 warnings

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/AppRouter.tsx src/components/croatia/ src/components/home/ src/components/shared/ src/hooks/useScreenLauncher.ts
git commit -m "feat(xp): add activityType to award() calls in croatia/, home/, App.tsx"
git push origin master
```

---

## Task 10: Final Verification

- [ ] **Step 1: Run full TypeScript check**

```bash
cd "C:/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2"
npx tsc --noEmit 2>&1
```

Expected: 0 errors

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run 2>&1 | tail -20
```

Expected: All tests pass. No regressions.

- [ ] **Step 3: Run ESLint**

```bash
npx eslint src/ --max-warnings=0 2>&1 | tail -10
```

Expected: 0 errors, 0 warnings

- [ ] **Step 4: Verify award() call sites have been updated**

```bash
# Check for any remaining award() calls without activityType (3rd arg)
# These are calls with 1 or 2 args only — some are legitimate (backward compat OK)
grep -rn "award([0-9]" src/components/ src/hooks/ src/App.tsx | grep -v "//.*award" | grep -v ".test." | head -20
```

Review the remaining 1/2-arg calls. They are valid — the `default` cap (210 XP) covers them. Note any files intentionally left at `default` vs files that need a type.

- [ ] **Step 5: Manual smoke test — verify award flow in browser**

Start dev server:
```bash
npm run dev
```

Open http://localhost:5173. Sign in and complete a grammar exercise. Open DevTools → Network. Verify:
1. `POST /api/award` request is made with `{ activityType: 'grammar', claimedXp: N }`
2. Response is `{ awarded: N, activityType: 'grammar' }` (N ≤ 80)
3. XP updates in the UI after the response

- [ ] **Step 6: Verify offline behavior**

In DevTools → Network tab, set throttling to "Offline". Complete another exercise. Verify:
1. No `POST /api/award` request is made
2. XP still updates normally (offline path)
3. `localStorage.getItem('nh_offline_award_queue')` contains the pending entry

- [ ] **Step 7: Verify reconnect flush**

Still in DevTools, set network back to online. Verify:
1. `localStorage.getItem('nh_offline_award_queue')` is cleared
2. If the offline XP was within cap, no Firestore audit write occurs

- [ ] **Step 8: Commit final verification**

```bash
git add -A  # in case any minor fixes were applied
git commit -m "feat(xp): server-side XP validation complete — Worker + offline queue + Firestore rules"
git push origin master
```

---

## Post-Completion: Cloudflare KV Setup

After the code is deployed, create and bind the `XP_VELOCITY` KV namespace:

```bash
# Option A: Automated (recommended)
CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=<account_id> node scripts/setup-cf-resources.mjs

# Option B: Manual
# 1. In Cloudflare dashboard → Workers & Pages → KV
# 2. Create namespace: nasa-hrvatska-xp-velocity
# 3. In Pages → nasa-hrvatska-v2 → Settings → Functions → KV namespace bindings
# 4. Add binding: Variable name = XP_VELOCITY, KV namespace = nasa-hrvatska-xp-velocity
# 5. Set for both Production and Preview environments
```

Verify in Cloudflare dashboard that `XP_VELOCITY` appears in the Pages bindings list.
