# AI Layer Bug Fix & P0/P1 Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two reported user-facing bugs (server_misconfigured in AI conversation, "Translation unavailable" in Domačica Mara word tap), then remediate all P0/P1 issues found in a deep audit of the entire AI function layer.

**Architecture:** The Croatian learning app has a React frontend (`src/`) calling ~50 Cloudflare Pages Functions (`functions/api/`). The two reported bugs trace to a single root cause: `ai-chat.js` hard-fails with `server_misconfigured` when `FIREBASE_PROJECT_ID` env var is missing, blocking all `callAI()` calls on the frontend. The translation fallback then errors rather than falling through to the unauthenticated `/api/translate.js` (MyMemory) endpoint. Additional P1 issues were found in `conversation.js` (C1/C2 silently downgraded, plain-text 401) and `maja.js` (wrong error code for missing API key).

**Tech Stack:** TypeScript/React (frontend), Cloudflare Pages Functions (backend JS), Firebase Auth (JWT verification), Anthropic Claude API, MyMemory translation proxy.

---

## File Map

- Modify: `functions/api/ai-chat.js:534-547` — remove hard FIREBASE_PROJECT_ID guard, degrade gracefully
- Modify: `src/components/croatia/AIConversation.tsx:576-596` — add `server_misconfigured` error mapping in `callAI()`
- Modify: `src/components/croatia/AIConversation.tsx:761-776` — add `/api/translate.js` fallback in `translateWord()`
- Modify: `functions/api/conversation.js:79` — add C1/C2 to VALID_LEVELS
- Modify: `functions/api/conversation.js:191-222` — add C1/C2 language rules to `buildConversationSystemPrompt`
- Modify: `functions/api/conversation.js:425` — fix plain-text `'Unauthorized'` to JSON response with Content-Type
- Modify: `functions/api/maja.js:696` — fix wrong error code to `AI_KEY_MISSING` at status 503

---

### Task 1: Fix ai-chat.js — Remove hard FIREBASE_PROJECT_ID guard

**Files:**
- Modify: `functions/api/ai-chat.js:534-547`

**Context:** `ai-chat.js` currently hard-returns `server_misconfigured` (HTTP 500) when `FIREBASE_PROJECT_ID` env var is absent. `conversation.js` (the SSE endpoint) already handles this gracefully — if no `FIREBASE_PROJECT_ID`, it skips auth and falls back to IP-based quota. `ai-chat.js` must follow the same pattern, since it handles hints, translation, evaluation, and writing eval — all of which should degrade gracefully rather than completely block.

- [ ] **Step 1: Read current auth block**

Read `functions/api/ai-chat.js` lines 533–561 to confirm exact current code before editing.

- [ ] **Step 2: Replace hard guard with graceful degradation**

In `functions/api/ai-chat.js`, replace lines 534–560 (the FIREBASE_PROJECT_ID hard-fail block and uid check) with:

```javascript
  // Require valid Firebase auth token for AI endpoints
  const FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '';
  const uid = FIREBASE_PROJECT_ID ? await getFirebaseUid(request, FIREBASE_PROJECT_ID) : null;
  if (FIREBASE_PROJECT_ID && !uid) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: corsHeaders(origin),
    });
  }

  // Daily AI quota check (cost 1)
  const quota = await checkAIQuota(request, env, uid, 1);
  if (!quota.allowed) {
    return new Response(
      JSON.stringify({
        error: 'daily_quota_exceeded',
        message: 'Daily AI limit reached. Resets at midnight UTC.',
        resetAt: quota.resetAt,
      }),
      { status: 429, headers: corsHeaders(origin) },
    );
  }
```

This exactly matches the pattern already in `conversation.js` lines 422–439.

- [ ] **Step 3: Verify no remaining hard guard**

Run:
```
grep -n "server_misconfigured" functions/api/ai-chat.js
```
Expected output: no matches (the line is gone).

- [ ] **Step 4: Verify TypeScript compiles cleanly**

Run:
```
npm run typecheck 2>&1 | head -20
```
Expected: `0 errors`

- [ ] **Step 5: Commit**

```bash
git add functions/api/ai-chat.js
git commit -m "fix(ai-chat): degrade gracefully when FIREBASE_PROJECT_ID absent

Removes hard server_misconfigured fail that blocked all callAI() calls
(hints, translation, eval, writeeval) when FIREBASE env var is not set.
Now follows conversation.js pattern: skip auth check and use IP-based
quota when FIREBASE_PROJECT_ID is empty.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Fix callAI() — Add server_misconfigured error mapping

**Files:**
- Modify: `src/components/croatia/AIConversation.tsx:576-596`

**Context:** `callAI()` in `AIConversation.tsx` already has special-case handling for `AI_KEY_MISSING` and `daily_quota_exceeded` errors, but has no case for `server_misconfigured`. When this error occurs (before Task 1 fix deploys, or in edge cases), the raw string `server_misconfigured` is thrown to the UI, which shows users a cryptic error. Need to add a user-friendly mapping.

- [ ] **Step 1: Read current callAI error block**

Read `src/components/croatia/AIConversation.tsx` lines 576–595 to confirm exact current code.

- [ ] **Step 2: Add server_misconfigured case**

In `src/components/croatia/AIConversation.tsx`, replace lines 576–592 (the `if (!res.ok || data.error)` block) with:

```typescript
    if (!res.ok || data.error) {
      const msg = data.error || 'Server error ' + res.status;
      if (msg.includes('AI_KEY_MISSING') || msg.includes('ANTHROPIC_API_KEY')) {
        throw new Error(
          'setup_error:The AI service is not yet configured. The ANTHROPIC_API_KEY needs to be set in Cloudflare Pages → Settings → Environment Variables.',
        );
      }
      if (msg === 'server_misconfigured') {
        throw new Error(
          'setup_error:The server is missing required configuration. Please contact support.',
        );
      }
      if (msg === 'daily_quota_exceeded' || res.status === 429) {
        const resetTime = data.resetAt
          ? new Date(data.resetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'midnight UTC';
        throw new Error(
          `You've reached today's AI conversation limit. Your quota resets at ${resetTime}. Come back tomorrow to continue practising!`,
        );
      }
      throw new Error(msg);
    }
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

Run:
```
npm run typecheck 2>&1 | head -20
```
Expected: `0 errors`

- [ ] **Step 4: Commit**

```bash
git add src/components/croatia/AIConversation.tsx
git commit -m "fix(AIConversation): map server_misconfigured to user-friendly error

Adds explicit error case in callAI() so the server_misconfigured code
surfaces a clear setup_error: message rather than the raw error string.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Fix translateWord() — Add /api/translate fallback

**Files:**
- Modify: `src/components/croatia/AIConversation.tsx:761-776`

**Context:** `translateWord()` calls `callAI()` with `mode='translate'` to get a grammar-annotated translation via Claude. If `callAI()` fails for any reason (misconfigured Firebase, quota, network error), it falls through to the catch block and sets `translation: 'Translation unavailable'`. The app already has a `/api/translate.js` endpoint backed by MyMemory (no auth, no key, 30 req/min) that can provide a plain translation without the grammar note. This should be used as a fallback so word-tap translation works even without Firebase auth.

- [ ] **Step 1: Read current translateWord catch block**

Read `src/components/croatia/AIConversation.tsx` lines 761–776 to confirm exact current catch block.

- [ ] **Step 2: Replace catch block with fallback chain**

In `src/components/croatia/AIConversation.tsx`, replace lines 770–776 (the entire `catch` block of `translateWord`) with:

```typescript
    } catch {
      // callAI failed (auth, quota, or network) — fall back to unauthenticated MyMemory proxy
      try {
        const fbRes = await apiFetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: clean, from: 'hr', to: 'en' }),
        });
        const fbData = fbRes.ok ? await fbRes.json() : null;
        const translation = (fbData?.translation as string | undefined) || null;
        if (translation) {
          translationCacheRef.current[clean.toLowerCase()] = { translation, note: null };
          setTooltip((prev) =>
            prev?.word === clean ? { ...prev, loading: false, translation, note: null } : prev,
          );
        } else {
          setTooltip((prev) =>
            prev?.word === clean
              ? { ...prev, loading: false, translation: 'Translation unavailable' }
              : prev,
          );
        }
      } catch {
        setTooltip((prev) =>
          prev?.word === clean
            ? { ...prev, loading: false, translation: 'Translation unavailable' }
            : prev,
        );
      }
    }
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

Run:
```
npm run typecheck 2>&1 | head -20
```
Expected: `0 errors`

- [ ] **Step 4: Run lint**

Run:
```
npm run lint 2>&1 | head -20
```
Expected: `0 errors`

- [ ] **Step 5: Commit**

```bash
git add src/components/croatia/AIConversation.tsx
git commit -m "fix(translateWord): add /api/translate fallback when callAI fails

When callAI() fails (auth error, quota exceeded, network issue), fall
through to the unauthenticated MyMemory proxy (/api/translate) before
showing 'Translation unavailable'. Fixes word-tap translation in
Domacica Mara when Firebase auth is not configured.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Fix conversation.js — Add C1/C2 level support

**Files:**
- Modify: `functions/api/conversation.js:79`
- Modify: `functions/api/conversation.js:191-222`

**Context:** `VALID_LEVELS` only lists `['A1', 'A2', 'B1', 'B2']`. The `sanitizeLevel()` function silently defaults any unknown level (including `C1` and `C2`) to `'A2'`. Users who have advanced to C1/C2 in the app get beginner-level conversations without any indication this is happening. The `languageRules` object inside `buildConversationSystemPrompt` also has no C1/C2 entries, so even if they were added to `VALID_LEVELS`, the conversation would get no language rules. Both must be fixed together.

- [ ] **Step 1: Read current VALID_LEVELS and languageRules**

Read `functions/api/conversation.js` lines 79–98 and lines 191–223 to confirm exact current code.

- [ ] **Step 2: Add C1/C2 to VALID_LEVELS**

In `functions/api/conversation.js`, replace line 79:

```javascript
const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2'];
```

With:

```javascript
const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
```

- [ ] **Step 3: Add C1/C2 language rules to languageRules object**

In `functions/api/conversation.js`, replace lines 218–222 (the closing of the `languageRules` object after the B2 entry) with:

```javascript
    B2: `B2 RULES:
- 4–5 sentences of natural Croatian. All tenses freely.
- Idioms, cultural references, mild humor all welcome.
- Treat the learner as a near-peer who can handle nuance.
- Never use English in the croatian field — full immersion.
- Gentle recast is fine; explicit corrections are rare and only for repeated systematic errors.`,

    C1: `C1 RULES:
- 4–6 sentences of sophisticated Croatian. All tenses, all aspects, complex subordinate clauses.
- Idioms, proverbs, cultural and literary references freely.
- Treat the learner as fully fluent — discuss abstract topics, nuanced opinions, professional subjects.
- Never use English. Never simplify. Full immersion always.
- Offer corrections only for register errors (e.g., too informal for context) or subtle usage mistakes — not grammar basics.
- Introduce regional expressions and stylistic variation naturally.`,

    C2: `C2 RULES:
- Write as you would to an educated native Croatian speaker.
- Complex sentences, rich vocabulary, idiomatic speech, regional color, literary devices all welcome.
- No scaffolding, no glosses, no simplification.
- Correct only for pragmatic failures (wrong register, cultural misstep) — not grammar.
- Discuss literature, history, politics, philosophy, humor in fully natural Croatian.`,
  };
```

- [ ] **Step 4: Also add C1/C2 to MAX_TURNS_BY_LEVEL if it exists**

Read `functions/api/conversation.js` around line 50 to check if `MAX_TURNS_BY_LEVEL` exists and needs C1/C2 entries:

```
grep -n "MAX_TURNS_BY_LEVEL\|MAX_TURNS" functions/api/conversation.js | head -10
```

If `MAX_TURNS_BY_LEVEL` is a map, add entries matching or extending B2. If it's a flat constant, no change needed.

- [ ] **Step 5: Verify TypeScript/lint**

Run:
```
npm run lint 2>&1 | head -20
```
Expected: `0 errors`

- [ ] **Step 6: Commit**

```bash
git add functions/api/conversation.js
git commit -m "fix(conversation): add C1/C2 level support

Adds C1 and C2 to VALID_LEVELS so C1/C2 learners are no longer silently
downgraded to A2. Adds C1/C2 language rules to buildConversationSystemPrompt
so Maja receives appropriate instructions for advanced conversations.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Fix conversation.js — Fix plain-text 401 response

**Files:**
- Modify: `functions/api/conversation.js:425`

**Context:** When Firebase auth verification fails, `conversation.js` returns `new Response('Unauthorized', { status: 401, headers: corsHeaders(origin) })`. This returns a plain text body with no `Content-Type` header. Any frontend code that calls `res.json()` on this 401 response will throw a JSON parse error, compounding the auth failure into a confusing crash. All other error responses in this file use structured JSON. This must be consistent.

- [ ] **Step 1: Read current 401 response**

Read `functions/api/conversation.js` lines 424–426 to confirm exact current code.

- [ ] **Step 2: Replace plain-text 401 with JSON response**

In `functions/api/conversation.js`, replace line 425:

```javascript
    return new Response('Unauthorized', { status: 401, headers: corsHeaders(origin) });
```

With:

```javascript
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
```

- [ ] **Step 3: Verify grep shows no remaining plain-text responses in this file**

Run:
```
grep -n "new Response('[^{]" functions/api/conversation.js
```
Expected: no matches (all `new Response(` calls now use `JSON.stringify`).

- [ ] **Step 4: Commit**

```bash
git add functions/api/conversation.js
git commit -m "fix(conversation): return JSON for 401 Unauthorized response

Plain-text 401 response would cause JSON parse errors on the frontend.
Changed to structured JSON with Content-Type header for consistency
with all other error responses in this endpoint.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Fix maja.js — Wrong error code for missing ANTHROPIC_KEY

**Files:**
- Modify: `functions/api/maja.js:696`

**Context:** When `ANTHROPIC_API_KEY` is missing, `maja.js` returns `err(500, 'Service not configured', origin)`. The frontend checks for `AI_KEY_MISSING` (or `ANTHROPIC_API_KEY` substring) to surface an actionable setup message. With the current code, the frontend receives `Service not configured` and falls through to a generic unhandled error. Additionally, a missing API key is a service-unavailable condition (HTTP 503), not an internal server error (HTTP 500). The fix must match `conversation.js`'s pattern which uses `err(503, 'AI_KEY_MISSING', origin)`.

- [ ] **Step 1: Read current maja.js API key check**

Read `functions/api/maja.js` lines 694–698 to confirm exact current code.

- [ ] **Step 2: Replace error code**

In `functions/api/maja.js`, replace line 696:

```javascript
  if (!ANTHROPIC_KEY) return err(500, 'Service not configured', origin);
```

With:

```javascript
  if (!ANTHROPIC_KEY) return err(503, 'AI_KEY_MISSING', origin);
```

- [ ] **Step 3: Verify**

Run:
```
grep -n "Service not configured" functions/api/maja.js
```
Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add functions/api/maja.js
git commit -m "fix(maja): return AI_KEY_MISSING at 503 when ANTHROPIC_KEY absent

Frontend callMaja() checks for 'AI_KEY_MISSING' to surface an actionable
setup message. 'Service not configured' at 500 bypassed this check and
showed a generic error. Aligns with conversation.js pattern.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Deep audit — Fix remaining P1 'Service not configured' error codes

**Files:**
- Modify: `functions/api/adaptive-insights.js:163`
- Modify: `functions/api/correct.js:86`
- Modify: `functions/api/daily-plan.js:137`
- Modify: `functions/api/dialogue.js:147`
- Modify: `functions/api/explain-error.js:94`
- Modify: `functions/api/flash-context.js:116`
- Modify: `functions/api/grammar-diagnosis.js:178`
- Modify: `functions/api/listening.js:157`
- Modify: `functions/api/live-tutor-summary.js:125`
- Modify: `functions/api/maja-debrief.js:246`
- Modify: `functions/api/micro-lesson.js:121`
- Modify: `functions/api/photo-vocab.js:117`
- Modify: `functions/api/pronunciation-coach.js:237`
- Modify: `functions/api/srs-sync.js:137`
- Modify: `functions/api/vocab-expand.js:107`

**Context:** The deep audit found 15 AI endpoint files that return `err(500, 'Service not configured')` when `ANTHROPIC_KEY` is missing. These should consistently return `err(503, 'AI_KEY_MISSING')` to match the pattern already established in `conversation.js`. HTTP 503 is semantically correct (service unavailable, not an internal error), and the `AI_KEY_MISSING` code allows any frontend caller to surface an actionable message. Note: `award.js`, `push-subscribe.js`, `srs-sync.js`, and `save-progress.js` use `server_misconfigured` for missing `FIREBASE_PROJECT_ID` — these are correct and must NOT be changed (those endpoints require auth to write user data to Firestore).

- [ ] **Step 1: Verify each file's exact error line before editing**

For each file listed above, confirm the line number and exact text matches before editing. Run:
```
grep -n "Service not configured" functions/api/adaptive-insights.js functions/api/correct.js functions/api/daily-plan.js functions/api/dialogue.js functions/api/explain-error.js functions/api/flash-context.js functions/api/grammar-diagnosis.js functions/api/listening.js functions/api/live-tutor-summary.js functions/api/maja-debrief.js functions/api/micro-lesson.js functions/api/photo-vocab.js functions/api/pronunciation-coach.js functions/api/srs-sync.js functions/api/vocab-expand.js
```

- [ ] **Step 2: Edit adaptive-insights.js**

Replace line 163 in `functions/api/adaptive-insights.js`:
```javascript
  if (!ANTHROPIC_KEY) return err(500, 'Service not configured', origin);
```
With:
```javascript
  if (!ANTHROPIC_KEY) return err(503, 'AI_KEY_MISSING', origin);
```

- [ ] **Step 3: Edit correct.js**

In `functions/api/correct.js`, replace lines 85–88 (the ANTHROPIC_KEY check that uses `new Response` directly):
```javascript
  if (!ANTHROPIC_KEY) {
    return new Response(JSON.stringify({ error: 'Service not configured' }), {
      status: 503,
      headers: CORS(origin),
    });
```
With:
```javascript
  if (!ANTHROPIC_KEY) {
    return new Response(JSON.stringify({ error: 'AI_KEY_MISSING' }), {
      status: 503,
      headers: CORS(origin),
    });
```

- [ ] **Step 4: Edit daily-plan.js**

Replace line 137 in `functions/api/daily-plan.js`:
```javascript
  if (!ANTHROPIC_KEY) return err(500, 'Service not configured', origin);
```
With:
```javascript
  if (!ANTHROPIC_KEY) return err(503, 'AI_KEY_MISSING', origin);
```

- [ ] **Step 5: Edit dialogue.js**

Replace line 147 in `functions/api/dialogue.js`:
```javascript
  if (!ANTHROPIC_KEY) return err(500, 'Service not configured', origin);
```
With:
```javascript
  if (!ANTHROPIC_KEY) return err(503, 'AI_KEY_MISSING', origin);
```

- [ ] **Step 6: Edit explain-error.js**

Replace line 94 in `functions/api/explain-error.js`:
```javascript
  if (!ANTHROPIC_KEY) return err(500, 'Service not configured', origin);
```
With:
```javascript
  if (!ANTHROPIC_KEY) return err(503, 'AI_KEY_MISSING', origin);
```

- [ ] **Step 7: Edit flash-context.js**

Replace line 116 in `functions/api/flash-context.js`:
```javascript
  if (!ANTHROPIC_KEY) return err(500, 'Service not configured', origin);
```
With:
```javascript
  if (!ANTHROPIC_KEY) return err(503, 'AI_KEY_MISSING', origin);
```

- [ ] **Step 8: Edit grammar-diagnosis.js**

Replace line 178 in `functions/api/grammar-diagnosis.js`:
```javascript
  if (!ANTHROPIC_KEY) return err(500, 'Service not configured', origin);
```
With:
```javascript
  if (!ANTHROPIC_KEY) return err(503, 'AI_KEY_MISSING', origin);
```

- [ ] **Step 9: Edit listening.js**

Replace line 157 in `functions/api/listening.js`:
```javascript
  if (!ANTHROPIC_KEY) return err(500, 'Service not configured', origin);
```
With:
```javascript
  if (!ANTHROPIC_KEY) return err(503, 'AI_KEY_MISSING', origin);
```

- [ ] **Step 10: Edit live-tutor-summary.js**

Replace line 125 in `functions/api/live-tutor-summary.js`:
```javascript
  if (!ANTHROPIC_KEY) return err(500, 'Service not configured', origin);
```
With:
```javascript
  if (!ANTHROPIC_KEY) return err(503, 'AI_KEY_MISSING', origin);
```

- [ ] **Step 11: Edit maja-debrief.js**

Replace line 246 in `functions/api/maja-debrief.js`:
```javascript
  if (!ANTHROPIC_KEY) return err(500, 'Service not configured', origin);
```
With:
```javascript
  if (!ANTHROPIC_KEY) return err(503, 'AI_KEY_MISSING', origin);
```

- [ ] **Step 12: Edit micro-lesson.js**

Replace line 121 in `functions/api/micro-lesson.js`:
```javascript
  if (!ANTHROPIC_KEY) return err(500, 'Service not configured', origin);
```
With:
```javascript
  if (!ANTHROPIC_KEY) return err(503, 'AI_KEY_MISSING', origin);
```

- [ ] **Step 13: Edit photo-vocab.js**

Replace line 117 in `functions/api/photo-vocab.js`:
```javascript
  if (!ANTHROPIC_KEY) return err(500, 'Service not configured', origin);
```
With:
```javascript
  if (!ANTHROPIC_KEY) return err(503, 'AI_KEY_MISSING', origin);
```

- [ ] **Step 14: Edit pronunciation-coach.js**

Replace line 237 in `functions/api/pronunciation-coach.js`:
```javascript
  if (!ANTHROPIC_KEY) return err(500, 'Service not configured', origin);
```
With:
```javascript
  if (!ANTHROPIC_KEY) return err(503, 'AI_KEY_MISSING', origin);
```

- [ ] **Step 15: Edit srs-sync.js (ANTHROPIC_KEY check only — NOT the FIREBASE check)**

Replace line 137 in `functions/api/srs-sync.js`:
```javascript
  if (!ANTHROPIC_KEY) return err(500, 'Service not configured', origin);
```
With:
```javascript
  if (!ANTHROPIC_KEY) return err(503, 'AI_KEY_MISSING', origin);
```

**Important:** Do NOT modify `srs-sync.js` lines 108–112 — that `server_misconfigured` block is for missing `FIREBASE_PROJECT_ID` and is correct behavior for an auth-required endpoint.

- [ ] **Step 16: Edit vocab-expand.js**

Replace line 107 in `functions/api/vocab-expand.js`:
```javascript
  if (!ANTHROPIC_KEY) return err(500, 'Service not configured', origin);
```
With:
```javascript
  if (!ANTHROPIC_KEY) return err(503, 'AI_KEY_MISSING', origin);
```

- [ ] **Step 17: Verify no 'Service not configured' remains in AI endpoints**

Run:
```
grep -rn "Service not configured" functions/api/
```
Expected: Only `digest.js` (which uses `RESEND_KEY`, not `ANTHROPIC_KEY` — different service, acceptable to leave).

- [ ] **Step 18: Run typecheck and lint**

Run:
```
npm run typecheck 2>&1 | head -20 && npm run lint 2>&1 | head -20
```
Expected: `0 errors` for both.

- [ ] **Step 19: Commit**

```bash
git add functions/api/adaptive-insights.js functions/api/correct.js functions/api/daily-plan.js functions/api/dialogue.js functions/api/explain-error.js functions/api/flash-context.js functions/api/grammar-diagnosis.js functions/api/listening.js functions/api/live-tutor-summary.js functions/api/maja-debrief.js functions/api/micro-lesson.js functions/api/photo-vocab.js functions/api/pronunciation-coach.js functions/api/srs-sync.js functions/api/vocab-expand.js
git commit -m "fix(api): standardize AI_KEY_MISSING error code across all AI endpoints

15 endpoints returned 'Service not configured' (status 500) when
ANTHROPIC_KEY was missing. Changed to 'AI_KEY_MISSING' (status 503)
to match conversation.js and allow frontends to surface actionable
setup messages. HTTP 503 is semantically correct: service unavailable.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 8: Push and verify

**Files:** None (git / deployment)

- [ ] **Step 1: Push to master to trigger Cloudflare deploy**

Run:
```
git push origin master
```
Expected: `master -> master` success output.

- [ ] **Step 2: Confirm full test suite passes**

Run:
```
npm test 2>&1 | tail -10
```
Expected: All tests pass (2234/2234 or current count with `0 failed`).

- [ ] **Step 3: Verify no remaining P0/P1 patterns**

Run the following audit checks:
```
echo "=== server_misconfigured in AI endpoints ===" && grep -rn "server_misconfigured" functions/api/ai-chat.js

echo "=== Service not configured (should only be digest.js) ===" && grep -rn "Service not configured" functions/api/

echo "=== Plain-text Unauthorized ===" && grep -rn "new Response('Unauthorized'" functions/api/

echo "=== conversation.js VALID_LEVELS ===" && grep -n "VALID_LEVELS" functions/api/conversation.js
```

Expected:
- `ai-chat.js`: no matches
- `Service not configured`: only `digest.js` (Resend key — not an AI endpoint)
- `'Unauthorized'`: no matches  
- `VALID_LEVELS`: `['A1', 'A2', 'B1', 'B2', 'C1', 'C2']`

---

## Deep Audit Findings Summary

The following P0/P1 issues were identified in the audit and are addressed by tasks 1–7 above:

| Severity | File | Issue | Task |
|---|---|---|---|
| P0 | `functions/api/ai-chat.js:535-540` | Hard fail blocks ALL callAI() calls when FIREBASE_PROJECT_ID missing | 1 |
| P0 | `src/components/croatia/AIConversation.tsx:770-776` | No translate fallback; any callAI failure → "Translation unavailable" | 3 |
| P1 | `src/components/croatia/AIConversation.tsx:576-591` | Missing server_misconfigured error mapping in callAI() | 2 |
| P1 | `functions/api/conversation.js:79` | C1/C2 silently downgraded to A2 | 4 |
| P1 | `functions/api/conversation.js:191-222` | No C1/C2 language rules in buildConversationSystemPrompt | 4 |
| P1 | `functions/api/conversation.js:425` | Plain-text 401 response; no Content-Type header | 5 |
| P1 | `functions/api/maja.js:696` | Wrong error code (500 'Service not configured' vs 503 'AI_KEY_MISSING') | 6 |
| P1 | 15 AI endpoint files | Wrong error code for missing ANTHROPIC_KEY | 7 |

**Not P0/P1 (correct behavior):**
- `award.js`, `push-subscribe.js`, `srs-sync.js`, `save-progress.js`: `server_misconfigured` when FIREBASE_PROJECT_ID missing — correct, these require auth to write user data
- `digest.js`: `'Service not configured'` when RESEND_KEY missing — correct, different service
- `ai-quota-status.js` line 54: `{ error: 'Unauthorized' }` as JSON — correct, already returns JSON
