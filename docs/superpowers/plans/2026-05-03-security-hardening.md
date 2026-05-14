# Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 8 security vulnerabilities in `functions/api/`: add Firebase auth to 3 paid API endpoints (Replicate/Deepgram/Azure billing exposure), fix 2 error-leakage issues, add origin check to translate.js, add activityType allowlist to award.js, and migrate rate limiting from per-PoP Cache API to globally-consistent D1 atomic SQL.

**Architecture:** All changes are in `functions/api/`. Firebase auth uses the existing `getFirebaseUid` pattern from `_verifyToken.js` (already used in award.js, push-subscribe.js, etc.). Rate limit migration reuses the existing `env.AI_QUOTA_DB` D1 binding (same database as `_aiQuota.js`) — no new Cloudflare bindings required. CSP and security headers are already comprehensive in `public/_headers` and do NOT need changes.

**Tech Stack:** Cloudflare Pages Functions (edge JS, Workers runtime), D1 (SQLite-compatible), Cloudflare KV, Firebase ID token RS256 verification

---

## File Map

- Modify: `functions/api/translate.js` — add `isAllowedOrigin` guard (lines 21-31)
- Modify: `functions/api/contact.js` — sanitize catch error message (line 298)
- Modify: `functions/api/digest.js` — sanitize Resend error message leak (line 158)
- Modify: `functions/api/flux-generate.js` — add Firebase auth block (after line 39)
- Modify: `functions/api/stt.js` — add Firebase auth block (after line 148)
- Modify: `functions/api/pronunciation-assess.js` — add Firebase auth block (after line 112)
- Modify: `functions/api/award.js` — add activityType allowlist (after line 22)
- Modify: `functions/api/_rateLimit.js` — add D1 atomic SQL tier; update signature to accept `env`
- Bulk modify: 38 call sites across 36 files — pass `env` as third arg to `checkRateLimit`

---

### Task 1: Fix translate.js — add origin check

**Files:**
- Modify: `functions/api/translate.js`

**Context:** `translate.js` proxies requests to the MyMemory free translation API. It has CORS headers and rate limiting but NO `isAllowedOrigin` check — any origin can call the endpoint. This makes it an open proxy. The fix: add a local `isAllowedOrigin` function (same pattern as all other files) and reject non-allowed origins with 403.

- [ ] **Step 1: Read the current file header and handler opening**

Read `functions/api/translate.js` lines 1–35 to confirm exact current imports and handler opening.

- [ ] **Step 2: Add `isAllowedOrigin` function after `corsHeaders`**

At line 14, find:
```javascript
function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || 'https://nasahrvatska.com',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}
```

Replace with:
```javascript
function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || 'https://nasahrvatska.com',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function isAllowedOrigin(origin, isDev) {
  if (!origin) return true; // PWA standalone / Capacitor
  try {
    const hostname = new URL(origin).hostname;
    if (isDev && hostname === 'localhost') return true;
    return (
      hostname === 'nasahrvatska.com' ||
      hostname.endsWith('.nasahrvatska.com') ||
      hostname === 'nasa-hrvatska-v2.pages.dev' ||
      hostname.endsWith('.nasa-hrvatska-v2.pages.dev')
    );
  } catch {
    return false;
  }
}
```

- [ ] **Step 3: Add origin check and `isDev` in `onRequestPost`**

At line 21, find:
```javascript
export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';

  const allowed = await checkRateLimit(request, 30);
```

Replace with:
```javascript
export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  const isDev = env.ENVIRONMENT !== 'production';

  if (!isAllowedOrigin(origin, isDev)) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  const allowed = await checkRateLimit(request, 30);
```

- [ ] **Step 4: Verify**

```
grep -n "isAllowedOrigin\|isDev\|forbidden" functions/api/translate.js
```

Expected: 3 matches — definition, `isDev` assignment, and the 403 guard.

- [ ] **Step 5: Typecheck**

```
npm run typecheck 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add functions/api/translate.js
git commit -m "fix(translate): add isAllowedOrigin guard to close open-proxy pattern

Any origin could call /api/translate; a bad actor could use it as a free
translation proxy burning our MyMemory daily quota. isAllowedOrigin now
rejects non-app origins with 403 before the rate-limit check.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Fix contact.js — sanitize catch error message

**Files:**
- Modify: `functions/api/contact.js`

**Context:** `contact.js` line 298 returns `e.message` directly to the client in a `catch` block. This exposes raw network error strings like "Failed to fetch" or "ECONNREFUSED 35.173.x.x" — information that helps attackers map internal infrastructure. The Resend call at lines 270–281 already consumes the response body safely (`await res.json().catch(() => ({}))`). The only remaining exposure is the outer `catch (e)` at line 297 where network-level exceptions are thrown before any response is read.

- [ ] **Step 1: Read the affected lines**

Read `functions/api/contact.js` lines 294–303 to confirm current code.

Expected:
```javascript
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 502,
      headers: { ...CORS(origin), 'Content-Type': 'application/json' },
    });
  }
```

- [ ] **Step 2: Replace `e.message` with generic string**

Find:
```javascript
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 502,
      headers: { ...CORS(origin), 'Content-Type': 'application/json' },
    });
  }
```

Replace with:
```javascript
  } catch (e) {
    console.error('[contact] Resend network error:', e.message);
    return new Response(JSON.stringify({ ok: false, error: 'Service temporarily unavailable.' }), {
      status: 502,
      headers: { ...CORS(origin), 'Content-Type': 'application/json' },
    });
  }
```

- [ ] **Step 3: Verify**

```
grep -n "e\.message\|e\.stack\|e\.name" functions/api/contact.js
```

Expected: 0 matches that return to client; the only remaining `e.message` is inside a `console.error` call.

- [ ] **Step 4: Commit**

```bash
git add functions/api/contact.js
git commit -m "fix(contact): replace raw e.message with generic 502 string

The outer catch at line 297 returned e.message (e.g. 'ECONNREFUSED
35.173.x.x') to the client, exposing internal network error details.
Now logs the real error server-side and returns a generic string.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Fix digest.js — sanitize Resend error leakage

**Files:**
- Modify: `functions/api/digest.js`

**Context:** `digest.js` line 158 forwards Resend's `message` field from the error response body to the client: `return errJson(errMsg || 'Email service error', 502, hdrs)`. Resend returns messages like `"Invalid API key"`, `"Domain not verified"`, or `"Daily sending quota exceeded"` — these reveal internal configuration state. The `errMsg` value comes from `JSON.parse(rawBody)?.message` at line 153. The fix: discard `errMsg` entirely and always return a static generic string.

- [ ] **Step 1: Read the affected lines**

Read `functions/api/digest.js` lines 149–160 to confirm current code.

Expected:
```javascript
  if (!res.ok) {
    let errMsg;
    try {
      errMsg = JSON.parse(rawBody)?.message;
    } catch {
      /* not JSON */
    }
    console.error('digest.js: Resend error', res.status, errMsg);
    return errJson(errMsg || 'Email service error', 502, hdrs);
  }
```

- [ ] **Step 2: Remove errMsg variable; replace with static string**

Find:
```javascript
  if (!res.ok) {
    let errMsg;
    try {
      errMsg = JSON.parse(rawBody)?.message;
    } catch {
      /* not JSON */
    }
    console.error('digest.js: Resend error', res.status, errMsg);
    return errJson(errMsg || 'Email service error', 502, hdrs);
  }
```

Replace with:
```javascript
  if (!res.ok) {
    let errMsg;
    try {
      errMsg = JSON.parse(rawBody)?.message;
    } catch {
      /* not JSON */
    }
    console.error('digest.js: Resend error', res.status, errMsg);
    return errJson('Email service temporarily unavailable', 502, hdrs);
  }
```

- [ ] **Step 3: Verify**

```
grep -n "errMsg" functions/api/digest.js
```

Expected: `errMsg` appears in `let errMsg`, the `try` block assignment, and the `console.error` — but NOT in any `errJson(` call.

- [ ] **Step 4: Commit**

```bash
git add functions/api/digest.js
git commit -m "fix(digest): stop forwarding Resend error message to client

Resend error .message includes config state ('Invalid API key',
'Domain not verified') — a security information leak. errMsg is
now logged server-side only; client always receives a generic string.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Add Firebase auth to flux-generate.js

**Files:**
- Modify: `functions/api/flux-generate.js`

**Context:** `flux-generate.js` calls the Replicate API to generate images (billed per prediction, ~$0.003 each). Currently only CORS and a 4 req/min rate limit protect it — no authentication. An attacker who discovers the endpoint can drain the Replicate API budget. Fix: add `getFirebaseUid` auth check (same pattern as award.js) between the rate limit check and the Replicate API key check. Unauthenticated requests get 401. The `FIREBASE_PROJECT_ID` check guards against misconfiguration.

- [ ] **Step 1: Add `getFirebaseUid` import**

At line 8, find:
```javascript
import { checkRateLimit } from './_rateLimit.js';
import { corsHeaders, isAllowedOrigin, sanitizeParam, ok, err } from './_helpers.js';
```

Replace with:
```javascript
import { checkRateLimit } from './_rateLimit.js';
import { getFirebaseUid } from './_verifyToken.js';
import { corsHeaders, isAllowedOrigin, sanitizeParam, ok, err } from './_helpers.js';
```

- [ ] **Step 2: Add Firebase auth block after rate limit check**

Find:
```javascript
  const allowed = await checkRateLimit(request, 4);
  if (!allowed) return err(429, 'Rate limited', origin);

  const REPLICATE_API_KEY = env.REPLICATE_API_KEY;
```

Replace with:
```javascript
  const allowed = await checkRateLimit(request, 4);
  if (!allowed) return err(429, 'Rate limited', origin);

  const FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
  if (!FIREBASE_PROJECT_ID) return err(500, 'server_misconfigured', origin);
  const uid = await getFirebaseUid(request, FIREBASE_PROJECT_ID);
  if (!uid) return err(401, 'unauthorized', origin);

  const REPLICATE_API_KEY = env.REPLICATE_API_KEY;
```

- [ ] **Step 3: Verify**

```
grep -n "getFirebaseUid\|FIREBASE_PROJECT_ID\|unauthorized" functions/api/flux-generate.js
```

Expected: 3 matches — the import, the FIREBASE_PROJECT_ID check, and the `!uid` guard.

- [ ] **Step 4: Typecheck**

```
npm run typecheck 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add functions/api/flux-generate.js
git commit -m "fix(flux-generate): require Firebase auth to protect Replicate API costs

Unauthenticated requests could drain Replicate API credits (~$0.003/image).
getFirebaseUid now gates entry; 401 returned for anonymous callers.
FIREBASE_PROJECT_ID check guards against server misconfiguration.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Add Firebase auth to stt.js

**Files:**
- Modify: `functions/api/stt.js`

**Context:** `stt.js` proxies audio to Deepgram ($0.0043/min) and OpenAI Whisper ($0.006/min). Currently only CORS and a 30 req/min rate limit protect it. Fix: add Firebase auth between the rate limit check (line 148) and audio validation (line 151). Also update the module-level comment at line 4 to remove the incorrect "No Firebase auth required" statement.

- [ ] **Step 1: Add `getFirebaseUid` import**

At line 13, find:
```javascript
import { checkRateLimit } from './_rateLimit.js';
```

Replace with:
```javascript
import { checkRateLimit } from './_rateLimit.js';
import { getFirebaseUid } from './_verifyToken.js';
```

- [ ] **Step 2: Add Firebase auth block after rate limit check**

Find:
```javascript
  // Rate limit: 30 requests/minute (each VAD clip is ~2–5 s of audio)
  const allowed = await checkRateLimit(request, 30);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'rate_limit_exceeded' }), {
      status: 429,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }

  // Validate audio Content-Type
  const ct = request.headers.get('content-type') || 'audio/webm';
```

Replace with:
```javascript
  // Rate limit: 30 requests/minute (each VAD clip is ~2–5 s of audio)
  const allowed = await checkRateLimit(request, 30);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'rate_limit_exceeded' }), {
      status: 429,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }

  // Require Firebase auth — protects Deepgram/OpenAI billing
  const FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
  if (!FIREBASE_PROJECT_ID) {
    return new Response(JSON.stringify({ error: 'server_misconfigured' }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
  const uid = await getFirebaseUid(request, FIREBASE_PROJECT_ID);
  if (!uid) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }

  // Validate audio Content-Type
  const ct = request.headers.get('content-type') || 'audio/webm';
```

- [ ] **Step 3: Update the module-level comment that incorrectly says no auth required**

Note: `stt.js` does NOT have a "No Firebase auth required" comment (that was `pronunciation-assess.js`). Skip this step for stt.js.

- [ ] **Step 4: Verify**

```
grep -n "getFirebaseUid\|FIREBASE_PROJECT_ID\|unauthorized" functions/api/stt.js
```

Expected: 3 matches — the import, the `FIREBASE_PROJECT_ID` check, and the `!uid` guard.

- [ ] **Step 5: Typecheck**

```
npm run typecheck 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add functions/api/stt.js
git commit -m "fix(stt): require Firebase auth to protect Deepgram/OpenAI STT billing

Deepgram charges $0.0043/min; Whisper charges $0.006/min. Unauthenticated
callers could invoke the endpoint at 30 req/min. Firebase auth now gates
entry after rate limiting; 401 returned for anonymous callers.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Add Firebase auth to pronunciation-assess.js

**Files:**
- Modify: `functions/api/pronunciation-assess.js`

**Context:** `pronunciation-assess.js` calls Azure Cognitive Services Pronunciation Assessment, which bills at ~$1/hour of audio. Currently only CORS and a 10 req/min rate limit protect it. The file comment at line 4 explicitly says "No Firebase auth required" — this is incorrect. Fix: add Firebase auth after the rate limit check (line 112), and update the incorrect comment.

- [ ] **Step 1: Add `getFirebaseUid` import**

At line 6, find:
```javascript
import { checkRateLimit } from './_rateLimit.js';
```

Replace with:
```javascript
import { checkRateLimit } from './_rateLimit.js';
import { getFirebaseUid } from './_verifyToken.js';
```

- [ ] **Step 2: Update the incorrect "No Firebase auth required" comment**

At line 1, find:
```javascript
// Cloudflare Pages Function — Azure Pronunciation Assessment
// Accepts a base64-encoded WAV recording + reference text, submits to Azure
// Cognitive Services Pronunciation Assessment REST API, and returns phoneme-level
// scores. No Firebase auth required; protected by IP-based rate limiting only.
```

Replace with:
```javascript
// Cloudflare Pages Function — Azure Pronunciation Assessment
// Accepts a base64-encoded WAV recording + reference text, submits to Azure
// Cognitive Services Pronunciation Assessment REST API, and returns phoneme-level
// scores. Requires Firebase auth to protect Azure Speech billing.
```

- [ ] **Step 3: Add Firebase auth block after rate limit check**

Find:
```javascript
  // Rate limit: 10 requests per minute per IP
  const allowed = await checkRateLimit(request, 10);
  if (!allowed) {
    return new Response(JSON.stringify({ ok: false, error: 'rate_limit' }), {
      status: 429,
      headers: corsHeaders(origin),
    });
  }

  // Check env vars early — return a clear signal so the client can fall back.
  const AZURE_KEY = env.AZURE_SPEECH_KEY;
```

Replace with:
```javascript
  // Rate limit: 10 requests per minute per IP
  const allowed = await checkRateLimit(request, 10);
  if (!allowed) {
    return new Response(JSON.stringify({ ok: false, error: 'rate_limit' }), {
      status: 429,
      headers: corsHeaders(origin),
    });
  }

  // Require Firebase auth — protects Azure Speech billing (~$1/hour of audio)
  const FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
  if (!FIREBASE_PROJECT_ID) return err(500, 'server_misconfigured', origin);
  const uid = await getFirebaseUid(request, FIREBASE_PROJECT_ID);
  if (!uid) return err(401, 'unauthorized', origin);

  // Check env vars early — return a clear signal so the client can fall back.
  const AZURE_KEY = env.AZURE_SPEECH_KEY;
```

- [ ] **Step 4: Verify**

```
grep -n "getFirebaseUid\|FIREBASE_PROJECT_ID\|unauthorized\|No Firebase" functions/api/pronunciation-assess.js
```

Expected: 3 matches for auth code; 0 matches for "No Firebase".

- [ ] **Step 5: Typecheck**

```
npm run typecheck 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add functions/api/pronunciation-assess.js
git commit -m "fix(pronunciation-assess): require Firebase auth to protect Azure Speech billing

Azure Speech bills ~\$1/hour of audio. Endpoint had no auth — only a
10 req/min rate limit per IP. Firebase auth now gates entry; 401 for
anonymous callers. Also corrects the module comment that said auth was
not required.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Add activityType allowlist to award.js

**Files:**
- Modify: `functions/api/award.js`

**Context:** `award.js` already imports `ACTIVITY_XP_MAP` from `_activityXp.js` and enforces per-activity XP caps. However, unknown `activityType` strings fall through to `ACTIVITY_XP_MAP.default = 210` on line 93 rather than being rejected. An attacker could send arbitrary `activityType` strings (e.g., `activityType: 'foo'`) and the server would award up to 210 XP silently. Fix: define `VALID_ACTIVITY_TYPES` (a Set of all ACTIVITY_XP_MAP keys except 'default') at module level, then check it before the velocity logic. This makes `default` unreachable in production while keeping it as a developer safety net.

- [ ] **Step 1: Add `VALID_ACTIVITY_TYPES` constant after imports**

At line 22, find:
```javascript
const VELOCITY_BUDGET = 600; // XP per window
```

Replace with:
```javascript
const VALID_ACTIVITY_TYPES = new Set(
  Object.keys(ACTIVITY_XP_MAP).filter((k) => k !== 'default'),
);

const VELOCITY_BUDGET = 600; // XP per window
```

- [ ] **Step 2: Add allowlist check in the handler**

Find:
```javascript
  if (typeof activityType !== 'string' || !activityType.trim()) {
    return new Response(JSON.stringify({ error: 'invalid_activity_type' }), {
      status: 400,
      headers: corsHeaders(origin),
    });
  }
  if (!Number.isInteger(claimedXp) || claimedXp <= 0 || claimedXp > 10000) {
```

Replace with:
```javascript
  if (typeof activityType !== 'string' || !activityType.trim()) {
    return new Response(JSON.stringify({ error: 'invalid_activity_type' }), {
      status: 400,
      headers: corsHeaders(origin),
    });
  }
  if (!VALID_ACTIVITY_TYPES.has(activityType)) {
    return new Response(JSON.stringify({ error: 'invalid_activity_type' }), {
      status: 400,
      headers: corsHeaders(origin),
    });
  }
  if (!Number.isInteger(claimedXp) || claimedXp <= 0 || claimedXp > 10000) {
```

- [ ] **Step 3: Verify**

```
grep -n "VALID_ACTIVITY_TYPES\|invalid_activity_type" functions/api/award.js
```

Expected:
- `VALID_ACTIVITY_TYPES`: 2 matches (declaration, guard check)
- `invalid_activity_type`: 2 matches (old string check, new allowlist check)

- [ ] **Step 4: Typecheck**

```
npm run typecheck 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add functions/api/award.js
git commit -m "fix(award): add activityType allowlist to reject unknown activity strings

Unknown activityTypes were silently capped at ACTIVITY_XP_MAP.default (210).
VALID_ACTIVITY_TYPES set now rejects any string not in _activityXp.js at
module init time, making the 'default' fallback unreachable in production.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 8: Migrate _rateLimit.js to D1 + update all 38 call sites

**Files:**
- Modify: `functions/api/_rateLimit.js`
- Bulk modify: all 36 API files that call `checkRateLimit`

**Context:** `_rateLimit.js` currently uses `caches.default` (Cloudflare Cache API). Cache API is per-PoP — Cloudflare has 300+ global PoPs and each maintains its own isolated counter. Two concurrent requests routed to different PoPs each see count=0 and both proceed, effectively bypassing the limit. The fix: add D1 as Tier 1 with `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` (atomic, globally consistent). D1 reuses the existing `env.AI_QUOTA_DB` binding — no new Cloudflare bindings needed. Cache API becomes Tier 2 fallback. In-memory stays Tier 3.

The function signature changes from `checkRateLimit(request, limit)` to `checkRateLimit(request, limit, env = null)` — fully backward compatible. All 38 existing call sites are updated to pass `env`.

**Sub-step A: Update `_rateLimit.js`**

- [ ] **Step 1: Rewrite `_rateLimit.js` with D1 tier**

Replace the entire contents of `functions/api/_rateLimit.js` with:

```javascript
/**
 * Rate limiting — three-tier hierarchy:
 *   Tier 1: D1 atomic SQL (env.AI_QUOTA_DB) — globally consistent, no TOCTOU
 *   Tier 2: Cache API (caches.default) — per Cloudflare PoP, not globally consistent
 *   Tier 3: In-memory Map — per-isolate only, applies 50% of limit
 *
 * Pass env as the third argument to enable Tier 1. Omitting env falls
 * back to Cache API (same behaviour as the original implementation).
 */

// ── Tier 3: In-memory fallback ────────────────────────────────────────────────
const _fallbackCounters = new Map();

function _cleanFallback() {
  const cutoff = Date.now() - 120000; // 2 minutes
  for (const [key, val] of _fallbackCounters) {
    if (val.windowStart < cutoff) _fallbackCounters.delete(key);
  }
  if (_fallbackCounters.size > 500) {
    const oldest = [..._fallbackCounters.entries()].sort(
      (a, b) => a[1].windowStart - b[1].windowStart,
    );
    oldest.slice(0, 100).forEach(([k]) => _fallbackCounters.delete(k));
  }
}

function _fallbackCheck(key, limit) {
  _cleanFallback();
  const fallbackLimit = Math.max(1, Math.floor(limit * 0.5));
  const window = Math.floor(Date.now() / 60000);
  const existing = _fallbackCounters.get(key);
  if (!existing || existing.windowStart !== window) {
    _fallbackCounters.set(key, { count: 1, windowStart: window });
    return true;
  }
  if (existing.count >= fallbackLimit) return false;
  existing.count++;
  return true;
}

// ── Tier 1: D1 atomic SQL ─────────────────────────────────────────────────────
async function _d1Check(db, key, limit) {
  const minute = Math.floor(Date.now() / 60000);
  const now = Date.now();
  try {
    const row = await db
      .prepare(
        `INSERT INTO rate_limits(key, count, window_minute, updated_at)
         VALUES(?1, 1, ?2, ?3)
         ON CONFLICT(key) DO UPDATE
         SET count = CASE WHEN window_minute = ?2 THEN count + 1 ELSE 1 END,
             window_minute = ?2,
             updated_at = ?3
         RETURNING count`,
      )
      .bind(key, minute, now)
      .first();
    if (!row) return null; // table may not exist yet; fall through to Cache API
    return row.count <= limit;
  } catch (e) {
    console.warn('[RateLimit] D1 unavailable:', e.message);
    return null; // signal: use next tier
  }
}

/**
 * Check rate limit for the request.
 * @param {Request} request
 * @param {number} limitPerMinute - max requests per IP per minute
 * @param {object|null} env - Cloudflare env object; supply to enable D1 Tier 1
 * @returns {Promise<boolean>} true = allowed, false = rate limited
 */
export async function checkRateLimit(request, limitPerMinute = 20, env = null) {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const path = new URL(request.url).pathname;
  const minute = Math.floor(Date.now() / 60000);
  const key = `${path}/${encodeURIComponent(ip)}/${minute}`;
  const fallbackKey = `${path}/${ip}/${minute}`;

  // ── Tier 1: D1 atomic SQL (globally consistent) ────────────────────────────
  const db = env?.AI_QUOTA_DB;
  if (db) {
    const result = await _d1Check(db, key, limitPerMinute);
    if (result !== null) return result;
    // D1 failed — fall through to Cache API
  }

  // ── Tier 2: Cache API (per-PoP, not globally consistent) ──────────────────
  let cache;
  try {
    cache = caches.default;
  } catch {
    console.warn('[RateLimit] Cache API unavailable — using in-memory fallback');
    return _fallbackCheck(fallbackKey, limitPerMinute);
  }

  try {
    const cacheKey = new Request(`https://rl.internal/v1${key}`, { method: 'GET' });
    const stored = await cache.match(cacheKey);
    const count = stored ? parseInt(await stored.text(), 10) || 0 : 0;

    if (count >= limitPerMinute) return false;

    await cache.put(
      cacheKey,
      new Response(String(count + 1), {
        headers: { 'Cache-Control': 'max-age=61' },
      }),
    );
    return true;
  } catch (e) {
    console.warn('[RateLimit] Cache operation failed — using in-memory fallback:', e?.message);
    return _fallbackCheck(fallbackKey, limitPerMinute);
  }
}
```

- [ ] **Step 2: Verify the new `_rateLimit.js`**

```
grep -n "export async function checkRateLimit\|_d1Check\|AI_QUOTA_DB\|env = null" functions/api/_rateLimit.js
```

Expected: 4 matches — `_d1Check` definition, `checkRateLimit` export with `env = null` param, `AI_QUOTA_DB` usage inside `_d1Check`.

**Sub-step B: Create D1 `rate_limits` table**

- [ ] **Step 3: Run D1 migration to create `rate_limits` table**

```
npx wrangler d1 execute AI_QUOTA_DB --remote --command "CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0, window_minute INTEGER NOT NULL, updated_at INTEGER NOT NULL)"
```

Expected output: `✅ Successfully executed SQL` (or similar success message). If you see `database not found`, check Cloudflare dashboard for the exact D1 binding name.

**Sub-step C: Update all 38 call sites to pass `env`**

- [ ] **Step 4: Handle `digest.js` — uses `ctx.env` (special case)**

```
grep -n "checkRateLimit" functions/api/digest.js
```

Expected: `const allowed = await checkRateLimit(ctx.request, 5);` at line 49.

Find:
```javascript
  const allowed = await checkRateLimit(ctx.request, 5); // 5 per minute max
```

Replace with:
```javascript
  const allowed = await checkRateLimit(ctx.request, 5, ctx.env); // 5 per minute max
```

- [ ] **Step 5: Run PowerShell bulk-replace for all other files**

The following PowerShell script updates all remaining files. It handles three patterns:
1. `checkRateLimit(request, <number>)` → adds `, env`
2. `checkRateLimit(request, <variable>)` → adds `, env`
3. Leaves already-updated calls (3 args) untouched

```powershell
$apiDir = "C:\Users\jschr\Dropbox\Croatian Learning Application\Source Code\nasa-hrvatska-v2\functions\api"

$files = Get-ChildItem (Join-Path $apiDir "*.js") | Where-Object {
  $_.Name -ne "_rateLimit.js" -and $_.Name -ne "digest.js"
}

foreach ($file in $files) {
  $content = Get-Content $file.FullName -Raw -Encoding UTF8
  # Pattern 1: numeric second arg — e.g. checkRateLimit(request, 20)
  $new = $content -replace 'checkRateLimit\(request,\s*(\d+)\)', 'checkRateLimit(request, $1, env)'
  # Pattern 2: variable second arg — e.g. checkRateLimit(request, limit) or checkRateLimit(request, SESSION_RATE_LIMIT_PER_MINUTE)
  $new = $new -replace 'checkRateLimit\(request,\s*([A-Za-z_][A-Za-z0-9_]*)\)', 'checkRateLimit(request, $1, env)'
  if ($content -ne $new) {
    Set-Content $file.FullName $new -Encoding UTF8 -NoNewline
    Write-Host "Updated: $($file.Name)"
  }
}
```

Expected output: A list of filenames — should include adaptive-insights.js, ai-chat.js, award.js, clan.js, contact.js, conversation.js, conversational-tutor.js, correct.js, daily-culture.js, daily-plan.js, dialogue.js, did-stream.js, explain-error.js, flash-context.js, flux-generate.js, grammar-diagnosis.js, league.js, listening.js, live-tutor-summary.js, maja.js, maja-debrief.js, micro-lesson.js, news.js, npc-video.js, photo-vocab.js, pronunciation-assess.js, pronunciation-coach.js, push-send.js, push-subscribe.js, report-error.js, save-progress.js, scene-video.js, srs-sync.js, stt.js, translate.js, tts.js, vocab-expand.js.

- [ ] **Step 6: Verify no call sites were missed**

```
grep -rn "checkRateLimit(request," functions/api/ | grep -v "_rateLimit.js"
```

Expected: All matches end in `, env)` — no two-argument calls remaining (except `digest.js` which uses `ctx.request`).

```
grep -n "checkRateLimit" functions/api/digest.js
```

Expected: `checkRateLimit(ctx.request, 5, ctx.env)` — correctly uses `ctx.env`.

- [ ] **Step 7: Typecheck**

```
npm run typecheck 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add functions/api/_rateLimit.js functions/api/*.js
git commit -m "fix(rateLimit): migrate to D1 atomic SQL for globally consistent limits

Cache API is per Cloudflare PoP (300+ global). Two requests hitting
different PoPs each saw count=0, doubling or more the effective limit.
D1 ON CONFLICT DO UPDATE RETURNING gives a single atomic counter across
all PoPs. AI_QUOTA_DB reused — no new Cloudflare binding required.
Cache API/in-memory remain as fallbacks. All 38 call sites now pass env.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 9: Push and verify all fixes

**Files:** None (git / deployment / audit)

- [ ] **Step 1: Full typecheck**

```
npm run typecheck 2>&1 | head -30
```

Expected: 0 errors.

- [ ] **Step 2: Push to master**

```
git push origin master
```

Expected: success. Cloudflare Pages deploys on push.

- [ ] **Step 3: Audit all 8 fixes**

```
echo "=== translate.js: isAllowedOrigin guard ===" && grep -n "isAllowedOrigin\|forbidden" functions/api/translate.js

echo "=== contact.js: no e.message in response ===" && grep -n "e\.message" functions/api/contact.js

echo "=== digest.js: no errMsg in errJson ===" && grep -n "errMsg\|errJson" functions/api/digest.js

echo "=== flux-generate.js: Firebase auth present ===" && grep -n "getFirebaseUid\|unauthorized" functions/api/flux-generate.js

echo "=== stt.js: Firebase auth present ===" && grep -n "getFirebaseUid\|unauthorized" functions/api/stt.js

echo "=== pronunciation-assess.js: Firebase auth present ===" && grep -n "getFirebaseUid\|unauthorized" functions/api/pronunciation-assess.js

echo "=== award.js: activityType allowlist present ===" && grep -n "VALID_ACTIVITY_TYPES" functions/api/award.js

echo "=== _rateLimit.js: D1 tier present ===" && grep -n "_d1Check\|AI_QUOTA_DB\|env = null" functions/api/_rateLimit.js

echo "=== No 2-arg checkRateLimit calls remain ===" && grep -rn "checkRateLimit(request," functions/api/ | grep -v "_rateLimit.js" | grep -v ", env)"
```

Expected for the last audit command: **0 matches** (no 2-argument calls remaining).

- [ ] **Step 4: Verify D1 table exists**

```
npx wrangler d1 execute AI_QUOTA_DB --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name='rate_limits'"
```

Expected: `[{ name: 'rate_limits' }]`

---

## Self-Review

**Spec coverage:** ✅ All 8 vulnerabilities addressed:
1. translate.js open proxy → Task 1 ✓
2. contact.js error leak → Task 2 ✓
3. digest.js Resend leak → Task 3 ✓
4. flux-generate.js unauthed → Task 4 ✓
5. stt.js unauthed → Task 5 ✓
6. pronunciation-assess.js unauthed → Task 6 ✓
7. award.js unknown activityType → Task 7 ✓
8. _rateLimit.js per-PoP isolation → Task 8 ✓

**CSP/security headers:** Already present and comprehensive in `public/_headers` — no changes needed.

**Leaderboard:** Already removed. No leaderboard-related code is touched by this plan.

**Placeholder scan:** No TBDs, no "similar to Task N" shortcuts. All code blocks are complete.

**Type consistency:** `checkRateLimit(request, limit, env)` used consistently across all 38 call sites in Task 8. `getFirebaseUid(request, FIREBASE_PROJECT_ID)` pattern matches existing usage in `award.js` (lines 60-66).
