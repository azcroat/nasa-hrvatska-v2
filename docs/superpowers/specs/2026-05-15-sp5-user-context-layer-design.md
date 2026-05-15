# SP5 — User-Context Layer (Design Spec)

**Date:** 2026-05-15
**Status:** Approved (6/6 sections approved by jschr in chat)
**Predecessor:** SP4b (Speaking & Production Daily Inclusion, complete)
**Successor:** SP6 (Error Correction & Diagnostic UI)
**Sibling slices for later:** SP5b (remaining 7 AI endpoints), SP5c (server-side weekly summary), SP5d (A/B framework)

## Why this exists

After SP1–SP4b shipped, Naša Hrvatska tracks rich per-user state (CEFR, XP, streak, per-topic accuracy from `adaptive.ts`, FSRS vocabulary, recent production, mic state, conversation memory). But only **two** AI features actually consume that state: Maja (via `useConversationMemory` + Firestore) and the `adaptive-insights` analysis endpoint. The other ~10 AI endpoints — error correction, grammar diagnosis, hints, story generation, explain-error — are stateless. They receive a CEFR level and a topic and nothing else. That's the gap SP5 closes.

Gold-standard learning apps (Duolingo, Babbel, ELSA) inject per-user state into every AI feedback path so the feedback references the learner's actual pattern. We don't yet. The user's directive (2026-05-14) covers SP5–SP10 as "months of pedagogy/AI work." SP5 is the foundational slice: build the shared layer that subsequent AI personalization features (SP5b, SP6, SP7, SP9) will all use.

## Decisions locked in brainstorming

| Decision | Choice | Reasoning |
|---|---|---|
| Scope | Shared user-context layer (vs. per-endpoint personalization) | Highest leverage — unblocks all other AI personalization workstreams |
| Context source | Client sends in request body | Data lives client-side already (`topic_accuracy` etc. are localStorage-only); zero Firestore migration prerequisite; tampering only hurts the tamperer |
| Payload shape | Structured facts JSON; server renders prose | Versionable, testable, per-endpoint framing control, prompt-injection-safe |
| Endpoint coverage in v1 | 5 endpoints: correct, explain-error, grammar-diagnosis, ai-chat (hint/explain/story), conversation (Maja) | Highest-leverage user-facing AI features; remaining 7 endpoints become SP5b |
| Signal set in v1 | CEFR + top-3 weak topics + last-5 wrong answers + FSRS vocab stats | The four signals with the clearest pedagogical use; production/goals/time deferred |
| Rollout strategy | Foundation-first, endpoint-by-endpoint | Smallest risk per PR, easy rollback, value at endpoint #1 |

## Architecture

A single client-side helper aggregates per-user state into a typed `UserContext` JSON. A shared client wrapper attaches that object to the body of every in-scope AI POST. On the server, a shared parser validates the schema and a per-endpoint renderer turns the validated facts into prose. The prose is appended to each endpoint's existing system-prompt builder before the call to Claude.

```
[Client]
  graded exercise ──wrong answer──> recordTopicResult(topic, false)
                                          │
                                          └─> appendRecentError() ──> localStorage(nh_recent_errors)

  AI feature ──> _aiPost(url, body) ──> buildUserContext() ──> { ...body, userContext: {...} }
                                              │
                                              ├── localStorage: topic_accuracy, nh_recent_errors,
                                              │                 uP_<email>, FSRS state
                                              └── (CEFR derived from xp+lc+gc per existing formula)

[Server] (Cloudflare Pages Functions)
  /api/correct (and 4 others)
    ──> parseUserContext(body.userContext) ──> validated ctx (or null)
    ──> renderContextPrompt(ctx, kind) ──> rendered prose (or '')
    ──> existing buildSystemPrompt() splices prose into system message
    ──> Claude call
```

### Key invariants

- `userContext` is **optional** on every endpoint. Missing or invalid → fallback to current stateless behavior. **No endpoint regresses.**
- Schema is versioned (`{ version: 1, ... }`). Server validates `version`; unknown versions = ignore context, log warning. Forward-compatible.
- Server-rendered prose is the **only** way context reaches the LLM prompt. Client never sends raw prose. (Prevents asymmetric prompt-injection — what arrives at the LLM is fully controlled server-side.)
- Layer is per-request — no server-side caching, no Firestore reads on the AI hot path.

## Schema

The `userContext` payload, exact shape:

```ts
interface UserContext {
  version: 1;                       // schema version, server validates
  generatedAt: number;              // unix ms when client built this — server uses for staleness logs

  // Signal 1 — Level + engagement
  level: {
    cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
    xp: number;                     // total XP, integer >= 0
    streak: number;                 // consecutive-day streak, integer >= 0
  };

  // Signal 2 — Top 3 weak topics
  // Sourced from adaptive.ts topic_accuracy. Only topics with attempts >= 3 included.
  // Sorted lowest-accuracy first. Empty array allowed (new user).
  weakTopics: Array<{
    topic: string;                  // canonical topic ID, e.g. "accusative", "aspect-imperfective"
    accuracy: number;               // 0.0–1.0, rounded to 2 decimals
    attempts: number;               // total attempts, integer >= 3
  }>;                               // max length 3

  // Signal 3 — Last 5 wrong answers (newest first)
  // Sourced from new localStorage key `nh_recent_errors`.
  // Entries pruned when older than 24 hours.
  recentErrors: Array<{
    topic: string;                  // canonical topic ID, same allowlist as weakTopics
    prompt: string;                 // exercise prompt, max 80 chars (truncated)
    userAnswer: string;             // what the user said/typed, max 60 chars
    correctAnswer: string;          // the expected answer, max 60 chars
    minutesAgo: number;             // integer, 0–1440 (24h cap)
  }>;                               // max length 5

  // Signal 4 — Vocabulary breadth
  // Sourced from SRS state.
  vocab: {
    learned: number;                // total cards in mature/young state, integer >= 0
    dueToday: number;               // cards due in next 24h, integer >= 0
    hardest: string[];              // 5 Croatian words by highest lapse count, may be empty
  };
}
```

**Token budget:** ~250–400 prompt tokens once the server renders this into prose. Soft ceiling for system-prompt addition is 800 tokens; well under.

**Worst-case payload size:** ~900 bytes uncompressed JSON. Negligible request overhead.

**Deliberately NOT in v1:**
- No email, name, friend list, family code, location — these are PII drift toward the LLM, not pedagogy signals.
- No raw FSRS deck data — too large. The `hardest` summary is the useful slice.
- No production state, mic state, learning goals, time signals — out per scope answer.

## Client-side components

### 1. `src/lib/userContext.ts` — context builder

A pure, synchronous function that pulls from existing sources.

```ts
export function buildUserContext(): UserContext {
  return {
    version: 1,
    generatedAt: Date.now(),
    level: readLevel(),                  // uses getCefrLevel(), uP_<email>.st.xp, uStreak
    weakTopics: getWeakTopics(0.85, 3),  // existing adaptive.ts; just pass threshold + cap
    recentErrors: getRecentErrors(),     // new — reads nh_recent_errors via recentErrors.ts
    vocab: getVocabStats(),              // new thin wrapper around existing srs.ts internals
  };
}
```

Pure-ish (reads localStorage), no async, no network. Easy to unit-test by seeding localStorage and asserting the output.

### 2. `src/lib/recentErrors.ts` — new localStorage layer

Mirrors `nh_recent_production` from SP4b (same pattern).

```ts
const RECENT_ERRORS_KEY = 'nh_recent_errors';
const RECENT_ERRORS_MAX = 5;
const RECENT_ERRORS_TTL_MS = 24 * 60 * 60 * 1000;  // 24h

export function appendRecentError(entry: {
  topic: string;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
}): void {
  // 1. Read existing array, prune entries older than 24h
  // 2. Prepend new entry with at: Date.now()
  // 3. Truncate prompt/userAnswer/correctAnswer to field caps (80/60/60)
  // 4. Cap length at 5 (drop tail)
  // 5. Write back. QuotaExceededError → silent no-op.
}

export function getRecentErrors(): UserContext['recentErrors'] {
  // Read, prune by TTL, project to schema shape with minutesAgo computed.
}
```

**Single chokepoint for write-side instrumentation:** `src/lib/adaptive.ts` `recordTopicResult(topic, false)` is the existing function every wrong-answer site already calls. Instrumenting that one function to also push to `nh_recent_errors` lights up the error log across the entire app without touching individual exercise screens.

### 3. `src/lib/aiPost.ts` — shared AI request wrapper

A thin wrapper that the 5 in-scope endpoints use instead of raw `fetch`.

```ts
export async function _aiPost(
  path: string,                // e.g. '/api/correct'
  body: Record<string, unknown>,
  opts?: { skipUserContext?: boolean },
): Promise<Response> {
  const bearer = await _getFirebaseBearer();  // existing helper from audio.ts
  const enrichedBody = opts?.skipUserContext
    ? body
    : { ...body, userContext: buildUserContext() };
  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bearer}` },
    body: JSON.stringify(enrichedBody),
  });
}
```

`skipUserContext: true` is the escape hatch for cases where the AI call isn't tied to a learning session (e.g. translating a friend's message).

**Migration:** in SP5, only the 5 in-scope endpoint call sites migrate to `_aiPost`. Other AI call sites keep using raw fetch with auth (no behavior change). Migration of remaining call sites is SP5b.

## Server-side components

### 1. `functions/api/_userContext.js` — shared parser + renderer

One file, two exports.

```js
// Returns a validated, sanitized UserContext or null if invalid/missing.
// Never returns unsanitized client strings — every string passes through sanitizeParam().
export function parseUserContext(body) {
  if (!body || !body.userContext) return null;
  const ctx = body.userContext;
  if (ctx.version !== 1) return null;          // unknown schema = ignore (forward-compat)

  // 1. Validate envelope: cefr in allowlist, xp/streak finite >= 0
  // 2. Validate weakTopics: each topic in TOPIC_ALLOWLIST, accuracy 0–1, attempts >= 3, len <= 3
  // 3. Validate recentErrors: each topic in allowlist, sanitizeParam() on prompt/answer/correct,
  //    minutesAgo 0–1440 clamp, len <= 5
  // 4. Validate vocab: learned/dueToday finite >= 0, hardest array of sanitized strings len <= 5

  return validatedCtx;
}

// Renders validated context into prose, tuned for the endpoint kind.
export function renderContextPrompt(ctx, kind) {
  if (!ctx) return '';                          // no context = empty addition to system prompt
  switch (kind) {
    case 'correct':           return renderDiagnostic(ctx);
    case 'explain-error':     return renderDiagnostic(ctx);
    case 'grammar-diagnosis': return renderDiagnostic(ctx);
    case 'maja':              return renderMaja(ctx);
    case 'ai-chat-hint':      return renderHint(ctx);
    case 'ai-chat-explain':   return renderTutor(ctx);
    case 'ai-chat-story':     return renderStoryContext(ctx);
    default:                  return '';
  }
}
```

### 2. Per-kind prose framings

**`renderDiagnostic(ctx)`** — used by correct, explain-error, grammar-diagnosis:

```
USER ERROR CONTEXT:
- B1 learner (XP 1840, 6-day streak)
- Persistent weakness: accusative (42% over 19 attempts), aspect (51%, 12 attempts)
- Recent mistakes:
  · 5m ago: "vidim ____ knjigu" → user said "knjigu" (correct: "knjigu") — topic: accusative
  · 12m ago: ...
- Known vocab: 540 words; struggles with: studeni, čekati, brijač
Use this to ground your correction in the learner's actual pattern.
```

**`renderMaja(ctx)`** — complements existing `conversationMemory`:

```
LEARNER NOTES (in addition to conversation memory):
This learner is B1, currently weak on accusative endings. Recent struggles include "studeni"
and "čekati". When you can naturally weave these into the scenario, do so — but don't
over-correct mid-conversation.
```

**`renderStoryContext(ctx)`** — emphasizes known vocab, avoids weak topics in first paragraph.

**`renderHint(ctx)`** — brief facts ("Learner is B1, weak in accusative; keep hint at that level").

**`renderTutor(ctx)`** — diagnostic + pedagogical framing ("When explaining to this learner, anchor on what they already know: vocab breadth ~540 words").

### 3. Endpoint integration pattern

Existing endpoint structure:
```js
const systemPrompt = buildCorrectPrompt(params);
// → call Claude with system: systemPrompt
```

New pattern:
```js
import { parseUserContext, renderContextPrompt } from './_userContext.js';

const userCtx = parseUserContext(body);
const contextProse = renderContextPrompt(userCtx, 'correct');
const systemPrompt = `${buildCorrectPrompt(params)}\n\n${contextProse}`.trim();
// → call Claude with system: systemPrompt
```

When `userCtx === null`, `contextProse === ''` and the system prompt is byte-identical to today's stateless prompt.

### 4. Security model

- All client-supplied strings (topic names, prompts, user answers, vocab words) pass through `sanitizeParam()` — the existing helper used by every endpoint today. No new attack surface.
- Topic names must match `TOPIC_ALLOWLIST` (the canonical set from `adaptive.ts`). Unknown topics → drop that entry only (other entries kept).
- CEFR string must match the 6-element enum. Anything else → null context (forward-compat for new tiers).
- No DB writes, no Firestore reads, no third-party calls. Pure transform.

### 5. Telemetry (lightweight, server-only)

Cloudflare console logs only — no dashboard, no client-visible metric:
- `userContext.invalid` — `parseUserContext` rejected a body
- `userContext.empty` — validated ctx has no weak topics + no errors + zero vocab (new user)
- `userContext.stale` — `generatedAt` is > 10 minutes old (likely client bug)

## Rollout plan

Foundation-first, six phases, one PR per phase.

### Phase 0 — Foundation (no endpoints touched)

**Files added:**
- `src/lib/userContext.ts`
- `src/lib/recentErrors.ts`
- `src/lib/aiPost.ts`
- `functions/api/_userContext.js`
- `src/tests/userContext.test.ts` (~15 unit tests)
- `src/tests/recentErrors.test.ts` (~6 unit tests)
- `src/tests/_userContext.parser.test.js` (~12 server-parser tests)

**Modified:**
- `src/lib/adaptive.ts` — `recordTopicResult(topic, false)` calls `appendRecentError()` on incorrect

**Result:** all infrastructure shipped, zero endpoints changed, zero user-visible behavior change. The error log starts accumulating in localStorage on next deploy.

### Phase 1 — `correct.js`

Modify `functions/api/correct.js` to parse + render context, splice into system prompt. Migrate client call sites that POST to `/api/correct` to use `_aiPost`. Two new integration tests (personalized path, fallback path). Existing correct.js tests must still pass.

### Phase 2 — `explain-error.js`

Same pattern. Uses `'explain-error'` kind.

### Phase 3 — `grammar-diagnosis.js`

Same pattern. Uses `'grammar-diagnosis'` kind.

### Phase 4 — `ai-chat.js` (hint / explain / story modes)

Touch 3 of ~12 modes inside the multi-mode endpoint. Test matrix includes "untouched modes still produce byte-identical prompts."

### Phase 5 — `conversation.js` (Maja)

Deepest integration. `renderMaja(ctx)` is appended **in addition to** the existing `conversationMemory` block, not replacing it. Existing `ai-conversation.test.tsx` must pass unchanged.

### Rollout cadence

| Phase | Time | Deploy gate |
|---|---|---|
| Phase 0 | 3–4 days | All unit tests green; localStorage error log accumulating in prod silently for 24h before Phase 1 |
| Phase 1 | 1 day | Manual smoke test: open exercise, get one wrong, check correction prose contains the pattern |
| Phase 2 | 1 day | Same smoke pattern on explain-error |
| Phase 3 | 1 day | Same on grammar-diagnosis |
| Phase 4 | 2 days | Test all 3 ai-chat modes + verify untouched modes unchanged |
| Phase 5 | 1–2 days | Maja conversation test in 3 scenarios + manual review of generated context paragraph |

**Total: ~9–11 days of focused work.** Each phase can be paused/rolled back independently.

### Rollback story

Per-phase rollback is reverting one PR. Server starts ignoring `userContext` (already optional), client keeps sending it (harmless). No data migration required to undo any phase.

## Testing strategy

**Layer 1 — Client unit tests (Vitest + jsdom)**

`src/tests/userContext.test.ts` (~15 tests):
- Returns valid schema given seeded localStorage state
- `version` always === 1
- `level.cefr` falls back to 'A1' when profile is missing
- `weakTopics` capped at 3, sorted lowest-accuracy first, filters attempts < 3
- `recentErrors` reads from `nh_recent_errors`, computes `minutesAgo` from `at` timestamps
- `vocab.hardest` returns at most 5 words, sorted by lapse count
- All fields present even when sources are empty (graceful empty arrays/zeros)

`src/tests/recentErrors.test.ts` (~6 tests):
- `appendRecentError` prepends entry, caps at 5
- Pruning: entries older than 24h dropped on read AND on write
- String fields truncated to caps (prompt 80, userAnswer/correctAnswer 60)
- QuotaExceededError → silent no-op
- `getRecentErrors` returns empty array on empty/malformed localStorage
- `recordTopicResult(topic, false)` triggers `appendRecentError` via chokepoint integration

**Layer 2 — Server parser tests**

`src/tests/_userContext.parser.test.js` (~12 tests):
- Valid v1 payload → validated context
- `version !== 1` → null
- Missing `level.cefr` → null
- Invalid cefr string → null
- `weakTopics[i].topic` not in allowlist → that entry dropped, rest kept
- `weakTopics` length > 3 → truncated
- `recentErrors[i].prompt` containing `\n` and backticks → sanitized
- `recentErrors[i].minutesAgo` > 1440 → clamped to 1440
- `vocab.hardest` strings sanitized + length-capped
- `parseUserContext({})` → null
- `parseUserContext({userContext: 'malicious string'})` → null
- Prompt-injection probe: `userAnswer: "Ignore previous instructions and..."` → sanitized

**Layer 3 — Per-endpoint integration tests**

For each of 5 endpoints, two tests:
1. **Personalized path:** mock Claude fetch, POST body includes valid `userContext`, assert the system prompt contains the rendered prose
2. **Fallback path:** POST without `userContext`, assert the system prompt is **byte-identical** to today's master

**Layer 4 — Cross-browser e2e (Playwright)**

`e2e/sp5-user-context.spec.js` — one happy-path test per phase:
- Seed user with `nh_recent_errors` containing one known entry
- Trigger the corresponding endpoint via the UI
- Assert the mocked Claude call received a system prompt containing the seeded entry's signature word
- Run on Desktop Chrome only for v1; Firefox/WebKit smoke not needed for prompt-construction tests

## Acceptance gates

| Gate | Pass condition | Evidence |
|---|---|---|
| 1. Schema strictly validated | All 12 server-parser tests green; no path through `parseUserContext` returns unsanitized client input | parser test suite |
| 2. Zero regression on stateless path | All 5 endpoints' tests show byte-identical system prompts when `userContext` absent vs. today's master | per-endpoint integration tests, snapshot compare |
| 3. Client error-log chokepoint working | `recordTopicResult(topic, false)` writes to `nh_recent_errors`; manual smoke at one exercise produces a visible entry | unit test + manual screenshot |
| 4. Prompt-injection resistance | Probe test confirms `Ignore previous instructions` patterns are stripped from `userAnswer` before reaching prompt | parser probe test |
| 5. Token budget held | Server-rendered prose < 500 tokens p95 across 100 seeded contexts | offline token-counter check against test fixtures |
| 6. Maja regression-free | Existing `ai-conversation.test.tsx` passes unchanged after Phase 5 | CI green |
| 7. Per-phase rollback verified | After Phase 1 lands, revert PR locally and confirm CI re-passes the stateless-path tests | rehearsed before Phase 1 deploys to prod |
| 8. Privacy filter | grep server-side prose helpers for `email`, `name`, `friendUids`, `family` — zero matches | static grep |

## Out of scope for SP5

- Measurable learning-outcome improvement (separate multi-week A/B workstream)
- Server-side analytics on context payloads (no dashboards in v1)
- Cross-device sync of `nh_recent_errors` (device-local by design — same as SP4b)
- Removing the `conversationMemory` Firestore collection (Maja keeps both signals in v1)
- Migrating the other 7 AI endpoints (deferred to SP5b)

## Follow-up slices to track

- **SP5b:** extend the layer to the remaining 7 AI endpoints
- **SP5c:** server-side weekly summary that reads aggregated `userContext` snapshots
- **SP5d:** optional A/B framework to measure correction-quality lift
