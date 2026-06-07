# Comprehension Checkpoints — Plan 2: Speaking subsystem

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Score a learner's *productive* spoken Croatian — record → transcribe → rubric-grade — behind a swappable `SpeakingScorer` interface, so Plan 3's exam runner can fold a `speaking` score (0..1) into `SkillScores`.

**Architecture:** A new auth-gated Cloudflare Pages Function `functions/api/assess-speaking.js` receives base64 audio, transcribes it with **Cloudflare Workers AI Whisper** (`@cf/openai/whisper`, added as the `AI` binding — CF-native, no new vendor), then scores a CEFR speaking rubric with the **Anthropic API** the app already uses (`env.ANTHROPIC_API_KEY`, `claude-sonnet-4-6`). The browser talks to it through `whisperClaudeScorer.ts`, which implements the `SpeakingScorer` interface and reuses the existing `getFirebaseBearer()` auth pattern. A technical failure returns `null` and is **never** scored as a fail (fairness invariant).

**Tech Stack:** TypeScript (client) + JavaScript (CF Pages Functions, matching the existing `functions/api/*.js`), Vitest, Cloudflare Workers AI, Anthropic Messages API.

**Spec:** `docs/superpowers/specs/2026-06-07-comprehension-checkpoints-design.md` §5.7, §6. **Depends on:** Plan 1 (the `speaking` skill in `SkillScores`).

---

## File structure (this plan)

| File | Responsibility |
|---|---|
| `wrangler.toml` (modify) | Add the `[ai]` Workers AI binding (`binding = "AI"`) + document the existing `ANTHROPIC_API_KEY`/`FIREBASE_PROJECT_ID` env vars used here. |
| `src/lib/speaking/SpeakingScorer.ts` (create) | Interface + `SpeakingAssessment` type + pure `computeSpeakingOverall` weighting. |
| `src/lib/speaking/whisperClaudeScorer.ts` (create) | Client impl: blob → base64 → POST `/api/assess-speaking` (Firebase Bearer) → `SpeakingAssessment | null`. |
| `functions/api/assess-speaking.js` (create) | Auth-gated endpoint: Whisper STT → Claude rubric → scores. Clip-capped + quota-checked. |
| Tests | `src/lib/speaking/__tests__/*.test.ts`, `src/tests/assess-speaking.integration.test.js`. |

**Contract (locked, used across tasks):**
- Request `POST /api/assess-speaking`, header `Authorization: Bearer <firebase>`, JSON body `{ level: CefrLevel, prompt: string, audioBase64: string, mime: string }`.
- Response 200 JSON `{ transcript: string, scores: { range: number; accuracy: number; fluency: number; task: number }, confidence: number }` — each score `0..1`.
- Errors: `401` (no/invalid token), `413` (clip too large), `429` (quota), `502` (upstream), `400` (bad body).
- Max audio: `MAX_AUDIO_B64 = 2_000_000` chars (~90s compressed).

---

## Task 1: Add the Workers AI binding

**Files:**
- Modify: `wrangler.toml`

- [ ] **Step 1: Add the binding**

Append to `wrangler.toml` (top-level, not inside an env block):

```toml
# Cloudflare Workers AI — used by functions/api/assess-speaking.js for Whisper
# speech-to-text. Enable Workers AI for the Pages project in the dashboard
# (Workers & Pages → the project → Settings → Functions → AI bindings) with
# the SAME binding name "AI".
[ai]
binding = "AI"
```

Also extend the env-var doc comment block to record the speaking endpoint's needs:

```toml
#   ANTHROPIC_API_KEY     — Claude API (AI features + speaking rubric scoring)
#   (Workers AI binding "AI" — Whisper STT for /api/assess-speaking)
```

- [ ] **Step 2: Verify the file parses**

Run: `npx wrangler pages functions build --outdir /tmp/wrangler-check 2>&1 | tail -5` (or, if that is unavailable in CI, `node -e "require('fs').readFileSync('wrangler.toml','utf8')"` to confirm it reads).
Expected: no TOML parse error.

- [ ] **Step 3: Commit**

```bash
git add wrangler.toml
git commit -m "chore(checkpoints): add Workers AI (Whisper) binding for speaking assessment"
```

---

## Task 2: `SpeakingScorer` interface + `computeSpeakingOverall`

**Files:**
- Create: `src/lib/speaking/SpeakingScorer.ts`
- Test: `src/lib/speaking/__tests__/SpeakingScorer.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/speaking/__tests__/SpeakingScorer.test.ts
import { describe, it, expect } from 'vitest';
import { computeSpeakingOverall } from '../SpeakingScorer.js';

describe('computeSpeakingOverall', () => {
  it('averages the four productive criteria (pronunciation excluded in v1)', () => {
    const o = computeSpeakingOverall({ range: 0.8, accuracy: 0.6, fluency: 1.0, task: 0.8 });
    expect(o).toBeCloseTo(0.8, 5);
  });

  it('clamps to [0,1]', () => {
    expect(computeSpeakingOverall({ range: 2, accuracy: 2, fluency: 2, task: 2 })).toBe(1);
    expect(computeSpeakingOverall({ range: -1, accuracy: -1, fluency: -1, task: -1 })).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/speaking/__tests__/SpeakingScorer.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the module**

```ts
// src/lib/speaking/SpeakingScorer.ts
import type { CefrLevel } from '../cefr.js';

export interface SpeakingRubricScores {
  range: number;     // vocabulary/structures available (0..1)
  accuracy: number;  // grammatical control while speaking (0..1)
  fluency: number;   // keeps going without breakdown (0..1)
  task: number;      // task achievement / relevance (0..1)
  /** v2 (Azure) — phoneme-level pronunciation. Absent in v1. */
  pronunciation?: number;
}

export interface SpeakingAssessment {
  transcript: string;
  scores: SpeakingRubricScores;
  /** Weighted overall (0..1). */
  overall: number;
  /** STT confidence → intelligibility proxy (0..1). */
  confidence: number;
}

export interface SpeakingContext {
  level: CefrLevel;
  prompt: string;
}

/**
 * The swappable boundary. v1 = Whisper(STT) → Claude(rubric). v2 may swap in
 * Azure Pronunciation Assessment without any change to callers.
 *
 * Returns `null` on technical failure (mic denied, STT/rubric error, or
 * unusably low confidence). Callers MUST treat `null` as "not scored — retry",
 * never as a failing score (fairness invariant).
 */
export interface SpeakingScorer {
  assess(audio: Blob, ctx: SpeakingContext): Promise<SpeakingAssessment | null>;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** v1 overall: equal-weight mean of the four productive criteria. */
export function computeSpeakingOverall(s: SpeakingRubricScores): number {
  const mean = (s.range + s.accuracy + s.fluency + s.task) / 4;
  return clamp01(mean);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/speaking/__tests__/SpeakingScorer.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/speaking/SpeakingScorer.ts src/lib/speaking/__tests__/SpeakingScorer.test.ts
git commit -m "feat(speaking): SpeakingScorer interface + overall weighting"
```

---

## Task 3: `whisperClaudeScorer` client implementation

**Files:**
- Create: `src/lib/speaking/whisperClaudeScorer.ts`
- Test: `src/lib/speaking/__tests__/whisperClaudeScorer.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/speaking/__tests__/whisperClaudeScorer.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the bearer source so no Firebase is needed.
vi.mock('../../audio.js', () => ({ getFirebaseBearer: vi.fn(async () => 'tok123') }));

import { whisperClaudeScorer } from '../whisperClaudeScorer.js';

function blob() {
  return new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'audio/webm' });
}

describe('whisperClaudeScorer', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('posts audio with a Bearer token and maps a 200 response to an assessment', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({ transcript: 'Bok', scores: { range: 0.8, accuracy: 0.8, fluency: 0.8, task: 0.8 }, confidence: 0.9 }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await whisperClaudeScorer.assess(blob(), { level: 'B1', prompt: 'Opišite putovanje.' });
    expect(res).not.toBeNull();
    expect(res!.transcript).toBe('Bok');
    expect(res!.overall).toBeCloseTo(0.8, 5);
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init as RequestInit).headers).toMatchObject({ Authorization: 'Bearer tok123' });
  });

  it('returns null on a non-200 response (fairness: never a failing score)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 502 })));
    const res = await whisperClaudeScorer.assess(blob(), { level: 'B1', prompt: 'x' });
    expect(res).toBeNull();
  });

  it('returns null on a network throw', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    const res = await whisperClaudeScorer.assess(blob(), { level: 'B1', prompt: 'x' });
    expect(res).toBeNull();
  });

  it('returns null when confidence is below the usable floor', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ transcript: '', scores: { range: 0.9, accuracy: 0.9, fluency: 0.9, task: 0.9 }, confidence: 0.1 }), { status: 200 }),
    ));
    const res = await whisperClaudeScorer.assess(blob(), { level: 'B1', prompt: 'x' });
    expect(res).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/speaking/__tests__/whisperClaudeScorer.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the module**

```ts
// src/lib/speaking/whisperClaudeScorer.ts
import { getFirebaseBearer } from '../audio.js';
import { computeSpeakingOverall, type SpeakingScorer, type SpeakingAssessment } from './SpeakingScorer.js';

/** Below this STT confidence we cannot fairly score; treat as "retry". */
const MIN_CONFIDENCE = 0.4;

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]!);
  return btoa(binary);
}

export const whisperClaudeScorer: SpeakingScorer = {
  async assess(audio, ctx): Promise<SpeakingAssessment | null> {
    try {
      const audioBase64 = await blobToBase64(audio);
      const bearer = await getFirebaseBearer();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (bearer) headers.Authorization = `Bearer ${bearer}`;

      const r = await fetch('/api/assess-speaking', {
        method: 'POST',
        headers,
        body: JSON.stringify({ level: ctx.level, prompt: ctx.prompt, audioBase64, mime: audio.type || 'audio/webm' }),
      });
      if (!r.ok) return null; // any error → not scored (caller retries)

      const data = (await r.json()) as { transcript?: string; scores?: Record<string, number>; confidence?: number };
      const s = data.scores;
      if (!s || typeof s.range !== 'number') return null;
      const confidence = typeof data.confidence === 'number' ? data.confidence : 0;
      if (confidence < MIN_CONFIDENCE) return null;

      const scores = { range: s.range, accuracy: s.accuracy, fluency: s.fluency, task: s.task };
      return {
        transcript: data.transcript ?? '',
        scores,
        overall: computeSpeakingOverall(scores),
        confidence,
      };
    } catch {
      return null; // network/parse failure → not scored
    }
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/speaking/__tests__/whisperClaudeScorer.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/speaking/whisperClaudeScorer.ts src/lib/speaking/__tests__/whisperClaudeScorer.test.ts
git commit -m "feat(speaking): whisperClaudeScorer client (Bearer post, null-on-failure)"
```

---

## Task 4: `assess-speaking` backend function

**Files:**
- Create: `functions/api/assess-speaking.js`
- Test: `src/tests/assess-speaking.integration.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/tests/assess-speaking.integration.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub the Firebase token verifier so we control auth in tests.
vi.mock('../../functions/api/_verifyToken.js', () => ({
  getFirebaseUid: vi.fn(async (request) =>
    request.headers.get('authorization') === 'Bearer good' ? 'uid-1' : null,
  ),
}));

import { onRequestPost } from '../../functions/api/assess-speaking.js';

function req(body, auth) {
  return new Request('https://nasahrvatska.com/api/assess-speaking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(auth ? { authorization: auth } : {}) },
    body: JSON.stringify(body),
  });
}

const env = () => ({
  FIREBASE_PROJECT_ID: 'proj',
  ANTHROPIC_API_KEY: 'k',
  AI: { run: vi.fn(async () => ({ text: 'Putovao sam u Zagreb prošli tjedan.' })) },
});

describe('POST /api/assess-speaking', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('401 when unauthenticated', async () => {
    const res = await onRequestPost({ request: req({ level: 'B1', prompt: 'x', audioBase64: 'AAAA', mime: 'audio/webm' }), env: env() });
    expect(res.status).toBe(401);
  });

  it('413 when the clip is too large', async () => {
    const big = 'A'.repeat(2_000_001);
    const res = await onRequestPost({ request: req({ level: 'B1', prompt: 'x', audioBase64: big, mime: 'audio/webm' }, 'Bearer good'), env: env() });
    expect(res.status).toBe(413);
  });

  it('200 with rubric scores on the happy path', async () => {
    const e = env();
    // Stub the Anthropic rubric call.
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ content: [{ type: 'text', text: '{"range":0.8,"accuracy":0.7,"fluency":0.9,"task":0.85}' }] }), { status: 200 }),
    ));
    const res = await onRequestPost({ request: req({ level: 'B1', prompt: 'Opišite putovanje.', audioBase64: 'AAAA', mime: 'audio/webm' }, 'Bearer good'), env: e });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.transcript).toContain('Zagreb');
    expect(json.scores.fluency).toBe(0.9);
    expect(json.confidence).toBeGreaterThan(0);
    expect(e.AI.run).toHaveBeenCalledWith('@cf/openai/whisper', expect.objectContaining({ audio: expect.any(Array) }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/assess-speaking.integration.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the function**

```js
// functions/api/assess-speaking.js
import { getFirebaseUid } from './_verifyToken.js';

const MAX_AUDIO_B64 = 2_000_000; // ~90s compressed
const MIN_WORDS_FOR_CONFIDENCE = 3;
const CLAUDE_MODEL = 'claude-sonnet-4-6';

function CORS(origin) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin || 'https://nasahrvatska.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store',
  };
}
function err(status, error, origin) {
  return new Response(JSON.stringify({ error }), { status, headers: CORS(origin) });
}

/** Decode base64 → array of byte values (the shape Workers AI Whisper expects). */
function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const RUBRIC = (level, prompt, transcript) =>
  `You are a strict CEFR Croatian speaking examiner. The candidate was asked (level ${level}): "${prompt}".\n` +
  `Their spoken answer, transcribed, was: "${transcript}".\n` +
  `Score PRODUCTIVE speaking on four criteria, each 0.0–1.0, where ${level} competence ≈ 0.8:\n` +
  `- range: vocabulary/structures used\n- accuracy: grammatical control (cases, aspect, agreement)\n` +
  `- fluency: flow without breakdown\n- task: relevance and completeness vs the prompt.\n` +
  `Be rigorous: a sparse or off-topic answer scores low even if grammatical.\n` +
  `Respond with ONLY minified JSON: {"range":0.0,"accuracy":0.0,"fluency":0.0,"task":0.0}`;

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get('origin') || '';

  // 1. Auth — hard reject anonymous (closes the anon-AI-cost vector).
  const uid = env.FIREBASE_PROJECT_ID ? await getFirebaseUid(request, env.FIREBASE_PROJECT_ID) : null;
  if (!uid) return err(401, 'unauthenticated', origin);

  // 2. Body + clip cap.
  let body;
  try {
    body = await request.json();
  } catch {
    return err(400, 'bad_json', origin);
  }
  const { level, prompt, audioBase64 } = body || {};
  if (!level || !prompt || typeof audioBase64 !== 'string') return err(400, 'missing_fields', origin);
  if (audioBase64.length > MAX_AUDIO_B64) return err(413, 'audio_too_large', origin);

  // 3. Transcribe with Workers AI Whisper.
  let transcript = '';
  try {
    const stt = await env.AI.run('@cf/openai/whisper', { audio: b64ToBytes(audioBase64) });
    transcript = (stt && stt.text ? String(stt.text) : '').trim();
  } catch (e) {
    console.error('[assess-speaking] STT failed:', e && e.message);
    return err(502, 'stt_failed', origin);
  }
  const wordCount = transcript ? transcript.split(/\s+/).length : 0;
  const confidence = wordCount >= MIN_WORDS_FOR_CONFIDENCE ? 0.9 : wordCount > 0 ? 0.3 : 0;

  // 4. Rubric-score with Claude.
  let scores;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      signal: AbortSignal.timeout(28000),
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 100,
        messages: [{ role: 'user', content: RUBRIC(level, prompt, transcript || '(no speech detected)') }],
      }),
    });
    if (!r.ok) return err(502, 'rubric_failed', origin);
    const data = await r.json();
    const text = data && data.content && data.content[0] && data.content[0].text ? data.content[0].text : '';
    const parsed = JSON.parse(text);
    const clamp = (n) => Math.max(0, Math.min(1, Number(n) || 0));
    scores = { range: clamp(parsed.range), accuracy: clamp(parsed.accuracy), fluency: clamp(parsed.fluency), task: clamp(parsed.task) };
  } catch (e) {
    console.error('[assess-speaking] rubric failed:', e && e.message);
    return err(502, 'rubric_failed', origin);
  }

  return new Response(JSON.stringify({ transcript, scores, confidence }), { status: 200, headers: CORS(origin) });
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('origin') || '';
  return new Response(null, { status: 204, headers: CORS(origin) });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/assess-speaking.integration.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add functions/api/assess-speaking.js src/tests/assess-speaking.integration.test.js
git commit -m "feat(speaking): assess-speaking endpoint (auth, Whisper STT, Claude rubric)"
```

---

## Task 5: Full-suite green + typecheck

**Files:** none (verification)

- [ ] **Step 1: Run the unit suite**

Run: `npm test`
Expected: PASS — all tests incl. the new speaking suites.

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "chore(speaking): plan 2 green — unit suite + typecheck pass"
```

---

## Done criteria for Plan 2

- `npm test` green; `tsc --noEmit` + lint clean.
- `/api/assess-speaking` rejects anonymous (401), caps clip size (413), and returns rubric scores on the happy path (unit-tested with mocked `env.AI` + Anthropic fetch).
- `whisperClaudeScorer` returns `null` (never a failing score) on any error or low confidence — the fairness invariant Plan 3 relies on.
- Workers AI `AI` binding declared in `wrangler.toml` (and must be enabled in the Pages dashboard before the endpoint works in prod — noted in the rollout step of Plan 3).

## Hand-off to Plan 3

`whisperClaudeScorer` is the default `SpeakingScorer` injected into `SpeakingTaskScreen`. Tests inject a fake scorer. The `null`-on-failure contract drives the retry-not-fail UX.
