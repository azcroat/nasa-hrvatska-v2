# R1 — AI Backend Auth/Cost Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every paid AI endpoint enforce auth + quota *consistently and fail-closed*, closing the anonymous rotating-IP cost-drain and the "missing-env-var silently disables auth" vector — **without charging anyone or blocking any signed-in user** (you're not charging for AI; all current users are signed in).

**Architecture:** Extract one shared gate `requireAuthedAI(context, {cost, rateLimit})` into `functions/api/_requireAuth.js` that does: origin allow-list → rate-limit → **fail-closed config check (500 if FIREBASE_PROJECT_ID missing)** → **unconditional 401 if no Firebase uid** → daily quota. Replace the ~21 hand-rolled, divergent auth preambles with it. A matrix regression test then asserts *every* paid endpoint rejects anonymous + missing-config, so the table-driven refactor can't silently miss one.

**Tech Stack:** Cloudflare Pages Functions (plain JS), Vitest, existing `_verifyToken`/`_aiQuota`/`_rateLimit`/`_helpers`.

**Audit source:** `project_nasa_hrvatska_speaking_ai_audit_2026_06_08` (memory) — slice E findings C1, C2, H1, H2, H3, M1, M3, L3.

---

## Decisions baked in (confirmed with product owner)
- **Not charging for AI.** Auth is required (every real user is already signed in), but the per-user daily quota is a *generous abuse ceiling*, not a paywall: raise it to **300/day** (was 100). No premium gating, no "free AI used up" wall for real usage.
- **No anonymous AI lane.** Verified: AI features live behind the authed app shell (`authScreen==='app'`); no signed-out flow calls a paid AI endpoint. So unconditional 401 blocks zero real users. (Task 7's matrix test + a pre-flight grep re-verify this.)

## File structure

| File | Responsibility |
|---|---|
| `functions/api/_requireAuth.js` (create) | The single gate: origin → ratelimit → fail-closed config → 401 → quota. Returns `{ok:true,uid,origin}` or `{ok:false,response}`. |
| `functions/api/_aiQuota.js` (modify) | Raise authed daily limit 100→300 (`limitForUid`). |
| ~21 `functions/api/*.js` (modify) | Replace bespoke auth preamble with `requireAuthedAI`. |
| `functions/_middleware.js` (modify) | Sync/retire the stale duplicate AI-endpoint rate-limit list. |
| `src/tests/aiEndpoints.auth-matrix.test.js` (create) | Regression: every paid endpoint → 401 anon, 500 missing-config, 429 over-quota. |

---

## Task 1: Raise the authed daily quota to a generous abuse ceiling

**Files:**
- Modify: `functions/api/_aiQuota.js` (the `FREE_ANNUAL_TURNS_PER_DAY` constant + `limitForUid`)
- Test: `src/tests/aiQuota.limit.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/tests/aiQuota.limit.test.js
import { describe, it, expect } from 'vitest';
import { getQuotaStatus } from '../../functions/api/_aiQuota.js';

describe('authed daily AI quota is a generous abuse ceiling (not a paywall)', () => {
  it('limit for a signed-in user is 300/day', async () => {
    // No D1/KV bound in test env → getQuotaStatus returns the limit for the uid path.
    const status = await getQuotaStatus({}, 'uid-123');
    expect(status.limit).toBe(300);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/aiQuota.limit.test.js`
Expected: FAIL — limit is 100.

- [ ] **Step 3: Implement**

In `functions/api/_aiQuota.js`, change the constant (keep the comment honest):

```js
// Generous per-user daily ceiling — an ABUSE cap, not a paywall. AI is free for
// all signed-in users; this only stops a runaway/compromised account. Raise freely.
const FREE_ANNUAL_TURNS_PER_DAY = 300;
```

(`limitForUid()` already returns this constant — no other change.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/aiQuota.limit.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add functions/api/_aiQuota.js src/tests/aiQuota.limit.test.js
git commit -m "fix(ai): raise authed daily quota to 300 (generous abuse ceiling, AI stays free)"
```

---

## Task 2: The shared `requireAuthedAI` gate

**Files:**
- Create: `functions/api/_requireAuth.js`
- Test: `src/tests/requireAuth.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/tests/requireAuth.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../functions/api/_verifyToken.js', () => ({
  getFirebaseUid: vi.fn(async (req) =>
    req.headers.get('authorization') === 'Bearer good' ? 'uid-1' : null,
  ),
}));
vi.mock('../../functions/api/_rateLimit.js', () => ({ checkRateLimit: vi.fn(async () => true) }));
vi.mock('../../functions/api/_aiQuota.js', () => ({
  checkAIQuota: vi.fn(async () => ({ allowed: true, remaining: 299, resetAt: 'x' })),
}));
import { requireAuthedAI } from '../../functions/api/_requireAuth.js';
import { checkAIQuota } from '../../functions/api/_aiQuota.js';

function ctx(auth, env = { FIREBASE_PROJECT_ID: 'proj', ENVIRONMENT: 'production' }) {
  const headers = { 'content-type': 'application/json', origin: 'https://nasahrvatska.com' };
  if (auth) headers.authorization = auth;
  return { request: new Request('https://nasahrvatska.com/api/x', { method: 'POST', headers }), env };
}

describe('requireAuthedAI', () => {
  beforeEach(() => vi.clearAllMocks());

  it('500 fail-closed when FIREBASE_PROJECT_ID is missing (never silently open)', async () => {
    const g = await requireAuthedAI(ctx('Bearer good', { ENVIRONMENT: 'production' }), { cost: 1, rateLimit: 20 });
    expect(g.ok).toBe(false);
    expect(g.response.status).toBe(500);
  });

  it('401 when unauthenticated (no anonymous lane)', async () => {
    const g = await requireAuthedAI(ctx(null), { cost: 1, rateLimit: 20 });
    expect(g.ok).toBe(false);
    expect(g.response.status).toBe(401);
  });

  it('passes for a signed-in user and charges quota with the given cost', async () => {
    const g = await requireAuthedAI(ctx('Bearer good'), { cost: 2, rateLimit: 20 });
    expect(g.ok).toBe(true);
    expect(g.uid).toBe('uid-1');
    expect(checkAIQuota).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'uid-1', 2);
  });

  it('429 when over quota', async () => {
    checkAIQuota.mockResolvedValueOnce({ allowed: false, remaining: 0, resetAt: 'x' });
    const g = await requireAuthedAI(ctx('Bearer good'), { cost: 1, rateLimit: 20 });
    expect(g.ok).toBe(false);
    expect(g.response.status).toBe(429);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/requireAuth.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the gate**

```js
// functions/api/_requireAuth.js
import { getFirebaseUid } from './_verifyToken.js';
import { checkRateLimit } from './_rateLimit.js';
import { checkAIQuota } from './_aiQuota.js';
import { isAllowedOrigin, corsHeaders } from './_helpers.js';

/**
 * Single auth+cost gate for ALL paid AI endpoints. Order matters (cheap rejects
 * first, money last):
 *   1. origin allow-list           → 403
 *   2. rate limit                  → 429
 *   3. FAIL-CLOSED config check    → 500  (missing FIREBASE_PROJECT_ID must NOT disable auth)
 *   4. unconditional auth          → 401  (no anonymous lane; every real user is signed in)
 *   5. daily quota                 → 429
 *
 * Returns { ok:true, uid, origin, isDev } on success, or { ok:false, response }.
 * AI is FREE for all signed-in users — the quota is a generous abuse ceiling, not a paywall.
 */
export async function requireAuthedAI(context, { cost = 1, rateLimit = 20 } = {}) {
  const { request, env } = context;
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  const isDev = env.ENVIRONMENT === 'development';
  const headers = corsHeaders(origin);
  const fail = (status, error, extra) =>
    ({ ok: false, response: new Response(JSON.stringify({ error, ...extra }), { status, headers }) });

  if (!isAllowedOrigin(origin, isDev)) return fail(403, 'forbidden');

  const underLimit = await checkRateLimit(request, rateLimit, env);
  if (!underLimit) return fail(429, 'rate_limited');

  const projectId = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
  if (!projectId) return fail(500, 'server_misconfigured'); // fail-closed: never silently open

  const uid = await getFirebaseUid(request, projectId);
  if (!uid) return fail(401, 'unauthenticated');

  const quota = await checkAIQuota(request, env, uid, cost);
  if (!quota.allowed) {
    return fail(429, 'daily_quota_exceeded', {
      message: 'Daily AI limit reached. Resets at midnight UTC.',
      resetAt: quota.resetAt,
    });
  }

  return { ok: true, uid, origin, isDev };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/requireAuth.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add functions/api/_requireAuth.js src/tests/requireAuth.test.js
git commit -m "feat(ai): shared requireAuthedAI gate (fail-closed config, unconditional 401, quota)"
```

---

## Task 3: Apply the gate to every paid AI endpoint

**Files (modify each):** the endpoints in the table below.
**Test:** covered by Task 7's matrix test (write the impl here; the regression guard lands in Task 7).

**The canonical transform** — replace each endpoint's bespoke preamble (origin check + `checkRateLimit` + the `FIREBASE_PROJECT_ID ? getFirebaseUid : null` soft-auth + any existing `checkAIQuota`) with the gate. Using `correct.js` as the worked example, delete lines ~52–84 (the local `isAllowedOrigin`/ratelimit/soft-auth/quota block) and the local `CORS()` definition, then:

```js
// at top, replace the individual imports of getFirebaseUid/checkRateLimit/checkAIQuota with:
import { requireAuthedAI } from './_requireAuth.js';
import { corsHeaders } from './_helpers.js';

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request.headers.get('origin') || '') });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const gate = await requireAuthedAI(context, { cost: 1, rateLimit: 20 });
  if (!gate.ok) return gate.response;
  const { uid, origin } = gate;
  const headers = corsHeaders(origin);
  // ... rest of the handler unchanged, but use `headers` (corsHeaders) for every Response,
  //     and `uid` where the old code used its own uid. Keep the ANTHROPIC_KEY-missing 503 check.
}
```

Rules when applying:
- **Use `corsHeaders(origin)` from `_helpers` for ALL responses** (it includes `Authorization` — fixes the CORS header omission, finding M3). Delete any local `CORS()`/`corsHeaders()` definitions in the endpoint.
- **Keep each endpoint's own input parsing, sanitization (`sanitizeParam`), and Anthropic/upstream call unchanged** — only the preamble changes.
- Preserve each endpoint's existing `cost` and `rateLimit` values (table below).

- [ ] **Step 1: Apply to the soft-auth Anthropic endpoints (these gain unconditional 401 — fixes C2)**

| Endpoint | cost | rateLimit |
|---|---|---|
| `correct.js` | 1 | 20 |
| `conversational-tutor.js` | 2 | 30 |
| `dialogue.js` | 1 | 40 |
| `explain-error.js` | 1 | 20 |
| `micro-lesson.js` | 1 | 20 |
| `listening.js` | 1 | 20 |
| `vocab-expand.js` | 1 | 30 |
| `flash-context.js` | 1 | 20 |

- [ ] **Step 2: Apply to the conditionally-authed Anthropic endpoints (these become fail-closed + unconditional — fixes C1)**

| Endpoint | cost | rateLimit |
|---|---|---|
| `ai-chat.js` | 1 | 40 |
| `conversation.js` | 2 | 4 |
| `maja.js` | 2 | 40 |
| `maja-debrief.js` | 2 | 20 |
| `grammar-diagnosis.js` | 1 | 20 |
| `daily-plan.js` | 2 | 20 |
| `live-tutor-summary.js` | 1 | 20 |
| `adaptive-insights.js` | 1 | 20 |
| `photo-vocab.js` | 2 | 10 |

> `conversation.js` and `maja.js` stream via `TransformStream`/SSE — apply the gate at the top exactly the same; only the *post*-gate streaming body is untouched.

- [ ] **Step 3: Apply to the no-quota voice/translate endpoints (these GAIN quota — fixes H1/H2)**

| Endpoint | cost | rateLimit | notes |
|---|---|---|---|
| `stt.js` | 1 | 30 | already 401-unconditional; gate ADDS quota |
| `pronunciation-assess.js` | 1 | 10 | already 401-unconditional; gate ADDS quota |
| `translate.js` | 1 | 30 | soft-auth today; gate adds 401 + quota |
| `tts.js` | 1 | 60 | soft-auth today; gate makes 401 unconditional (keeps quota) |

- [ ] **Step 4: Apply to `news.js`** (GET handler; cost 4, rateLimit 10). Replace its soft-auth + RSS-before-quota ordering so the gate runs first; keep the curated-fallback-on-quota-exceeded behavior by checking the gate and serving fallback on 429 rather than erroring. Concretely, in `onRequestGet`: call `requireAuthedAI(context,{cost:4, rateLimit:10})`; if `!gate.ok` and the failure is the quota 429, return the existing curated fallback payload; otherwise return `gate.response`.

- [ ] **Step 5: Typecheck + lint the functions**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean. (Functions are `.js`, not type-checked by tsc, but the test files are; lint covers the JS.)

- [ ] **Step 6: Commit**

```bash
git add functions/api/*.js
git commit -m "fix(ai): route all paid AI endpoints through requireAuthedAI (401+quota+CORS, fail-closed)"
```

---

## Task 4: Fix dev-error leakage (standardize `isDev`)

**Files:** modify the endpoints that gate error-message leakage on `env.ENVIRONMENT !== 'production'` (default-open).
**Test:** `src/tests/aiEndpoints.devleak.test.js`

- [ ] **Step 1: Write the failing test** (representative: `ai-chat.js`)

```js
// src/tests/aiEndpoints.devleak.test.js
import { describe, it, expect, vi } from 'vitest';
vi.mock('../../functions/api/_requireAuth.js', () => ({
  requireAuthedAI: vi.fn(async () => ({ ok: true, uid: 'u', origin: '', isDev: false })),
}));
import { onRequestPost } from '../../functions/api/ai-chat.js';

it('does not leak upstream error text when ENVIRONMENT is unset (treated as prod)', async () => {
  // Force the Anthropic call to fail; assert the response body has no internal detail.
  vi.stubGlobal('fetch', vi.fn(async () => new Response('Anthropic internal boom', { status: 500 })));
  const req = new Request('https://x/api/ai-chat', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer good' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
  });
  const res = await onRequestPost({ request: req, env: { ANTHROPIC_API_KEY: 'k' /* ENVIRONMENT unset */ } });
  const text = await res.text();
  expect(text).not.toContain('boom');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/aiEndpoints.devleak.test.js`
Expected: FAIL — `boom` leaks because `isDev = ENVIRONMENT !== 'production'` is true when unset.

- [ ] **Step 3: Implement**

In every endpoint that computes `const isDev = env.ENVIRONMENT !== 'production'` for the purpose of conditionally returning upstream error detail, change it to:

```js
const isDev = env.ENVIRONMENT === 'development'; // default-closed: unset/prod never leaks internals
```

(Endpoints already using the gate get `gate.isDev` which is already `=== 'development'`.) Grep to find them: `grep -rn "ENVIRONMENT !== 'production'" functions/api/`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/aiEndpoints.devleak.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add functions/api/*.js src/tests/aiEndpoints.devleak.test.js
git commit -m "fix(ai): default-closed dev-error leakage (ENVIRONMENT==='development' only)"
```

---

## Task 5: Retire the stale duplicate rate-limit list in `_middleware.js`

**Files:** modify `functions/_middleware.js`
**Test:** `src/tests/middleware.aiList.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/tests/middleware.aiList.test.js
import { describe, it, expect } from 'vitest';
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/middleware.aiList.test.js`
Expected: FAIL — the array has 3 stale entries (`ai-chat`, `news`, `correct`).

- [ ] **Step 3: Implement**

In `functions/_middleware.js`, remove the duplicate Cache-API rate-limiter for AI endpoints (the `AI_ENDPOINTS` list and its limiter branch). Per-endpoint rate limiting is now owned by `requireAuthedAI` (D1-backed, globally consistent). Keep any non-AI middleware behavior intact. If the middleware does other useful work (security headers, etc.), leave that; only excise the stale AI rate-limit list.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/middleware.aiList.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add functions/_middleware.js src/tests/middleware.aiList.test.js
git commit -m "fix(ai): retire stale middleware AI rate-limit list (gate owns rate limiting)"
```

---

## Task 6: Pre-flight — verify no signed-out flow calls a paid AI endpoint

**Files:** none (verification only — protects the "401 blocks no real user" assumption)

- [ ] **Step 1: Grep the client for AI calls and confirm they're behind auth**

Run: `grep -rn "aiPost\|/api/\(ai-chat\|correct\|conversation\|conversational-tutor\|dialogue\|explain-error\|grammar-diagnosis\|listening\|micro-lesson\|vocab-expand\|flash-context\|maja\|daily-plan\|adaptive-insights\|photo-vocab\|live-tutor-summary\|news\|translate\|tts\|stt\|pronunciation-assess\|assess-speaking\)" src/ | grep -v "\.test\."`

Expected: every call site is within a component reachable only when `authScreen==='app'` (i.e., after sign-in). If ANY call originates from the welcome/auth/placement pre-login flow, STOP and report it — that flow would need a tightened anonymous lane instead of a hard 401.

- [ ] **Step 2: Record the result** in the PR description (which call sites were checked, confirmation none are pre-login).

---

## Task 7: Auth/cost matrix regression test + full gate

**Files:**
- Create: `src/tests/aiEndpoints.auth-matrix.test.js`

- [ ] **Step 1: Write the matrix test** (the enterprise guard — proves every paid endpoint gates, forever)

```js
// src/tests/aiEndpoints.auth-matrix.test.js
import { describe, it, expect } from 'vitest';

// Every paid AI endpoint must (a) 401 when unauthenticated and (b) 500 when
// FIREBASE_PROJECT_ID is unset. We import each module's POST/GET and call it with
// no Authorization header + a configured env (→401), and with auth + no project id (→500).
const POST_ENDPOINTS = [
  'correct','conversational-tutor','dialogue','explain-error','micro-lesson','listening',
  'vocab-expand','flash-context','ai-chat','conversation','maja','maja-debrief',
  'grammar-diagnosis','daily-plan','live-tutor-summary','adaptive-insights','photo-vocab',
  'stt','pronunciation-assess','translate','tts','assess-speaking',
];

function req(method, auth) {
  const headers = { 'content-type': 'application/json', origin: 'https://nasahrvatska.com' };
  if (auth) headers.authorization = auth;
  return new Request('https://nasahrvatska.com/api/x', { method, headers, body: method === 'POST' ? '{}' : undefined });
}

describe('AI endpoint auth matrix', () => {
  for (const name of POST_ENDPOINTS) {
    it(`${name}: 401 when unauthenticated`, async () => {
      const mod = await import(`../../functions/api/${name}.js`);
      const handler = mod.onRequestPost || mod.onRequestGet;
      const res = await handler({ request: req(mod.onRequestPost ? 'POST' : 'GET', null), env: { FIREBASE_PROJECT_ID: 'proj', ENVIRONMENT: 'production' } });
      expect(res.status, `${name} must reject anonymous`).toBe(401);
    });

    it(`${name}: 500 (fail-closed) when FIREBASE_PROJECT_ID missing`, async () => {
      const mod = await import(`../../functions/api/${name}.js`);
      const handler = mod.onRequestPost || mod.onRequestGet;
      const res = await handler({ request: req(mod.onRequestPost ? 'POST' : 'GET', 'Bearer anything'), env: { ENVIRONMENT: 'production' } });
      expect(res.status, `${name} must fail closed on missing config`).toBe(500);
    });
  }
});
```

> Note: `news.js` is GET and returns curated fallback on quota-429, but on *no-auth* it must still 401 (auth precedes quota in the gate). If a couple of endpoints legitimately differ (e.g. a GET that 401s differently), adjust that endpoint's expectation explicitly with a comment — do NOT loosen the loop to `toBeGreaterThanOrEqual(400)`; each must be a specific asserted status.

- [ ] **Step 2: Run the matrix test**

Run: `npx vitest run src/tests/aiEndpoints.auth-matrix.test.js`
Expected: PASS — every endpoint 401s anon + 500s on missing config. **If any FAILS, that endpoint wasn't correctly routed through the gate in Task 3 — fix it.** (This is the safety net that makes the table-driven refactor trustworthy.)

- [ ] **Step 3: Full gate**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all green (3285+ tests + the new auth tests, 0 failures).

- [ ] **Step 4: Commit**

```bash
git add src/tests/aiEndpoints.auth-matrix.test.js
git commit -m "test(ai): auth/cost matrix — every paid endpoint 401s anon + fails closed on missing config"
```

---

## Self-review (done)
- **Coverage vs audit slice E:** C1 fail-open → Task 2 (500 on missing config) + Task 7 matrix. C2 anonymous paid → Task 2/3 (unconditional 401) + Task 7. H1 stt/pronunciation no quota → Task 3 Step 3. H2 translate no quota → Task 3 Step 3. H3 middleware drift → Task 5. M3 CORS Authorization omitted → Task 3 (corsHeaders everywhere). L3/dev-leak → Task 4. ✓ all mapped.
- **No charging / no user blocked:** Task 1 (300/day generous), Task 6 (verify no pre-login AI). ✓
- **Type/name consistency:** `requireAuthedAI(context,{cost,rateLimit}) → {ok,uid,origin,isDev}|{ok,response}` used identically in Tasks 2/3/4/7. ✓
- **No placeholders:** canonical transform shown in full; per-endpoint variance is only the (cost, rateLimit) table; matrix test guarantees application. ✓

## Done criteria
`npm test` + `tsc` + `lint` green; the auth-matrix test proves all 22 endpoints 401-anon + 500-missing-config; AI remains free for signed-in users (300/day ceiling); deployed via PR with CI green.
