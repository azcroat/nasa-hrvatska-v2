# R3: Checkpoint Speaking — iPad/Capacitor Remediation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Fix the real iPad-Safari / Capacitor-native defects in the checkpoint "Speaking Task" feature (currently behind `CHECKPOINTS_ENABLED=false`), so it can be safely re-enabled.

**Architecture:** Replace `SpeakingTaskScreen`'s bespoke `MediaRecorder` with the shared `useRecorder` hook (mimeType negotiation + unlock + unmount cleanup + denied-state). Extract the native transport from `_ttsPost` into a shared `_nativePost(path, …)` helper and route `whisperClaudeScorer` through it (fixes Capacitor relative-URL breakage). Pin Whisper to Croatian. Relabel the misnamed "confidence" heuristic honestly. Ship behind the flag; the prod re-enable is a separate gated decision.

**Tech Stack:** React/TS, Vite, Cloudflare Pages Functions (plain JS), Capacitor, Workers AI Whisper, vitest. tsconfig ES2020 (NO `Array.prototype.at()`).

---

## File Structure

- `src/lib/nativePost.ts` (new) — shared native-safe POST: native base-URL resolution + Firebase bearer + CapacitorHttp + endpoint failover, parameterized by path.
- `src/lib/audio.ts` (modify) — refactor private `_ttsPost` to delegate to `_nativePost('/api/tts', …)`; behavior preserved (guarded by existing TTS tests).
- `src/lib/speaking/whisperClaudeScorer.ts` (modify) — replace raw `fetch('/api/assess-speaking')` with `_nativePost`.
- `src/components/exam/SpeakingTaskScreen.tsx` (modify) — use `useRecorder`; remove `defaultCapture`; show a mic-denied explainer.
- `src/components/exam/MicPermissionDeniedExplainer.tsx` (new, only if no equivalent exists) — denied-state UI.
- `functions/api/assess-speaking.js` (modify) — pass `language:'hr'`; rename `confidence` → honest name.
- `src/lib/speaking/whisperClaudeScorer.ts` + types — update the field name consumed from the response.
- Tests: extend `whisperClaudeScorer.test.ts`, `SpeakingTaskScreen.test.tsx`, `assess-speaking.integration.test.js`; add `nativePost.test.ts`.

---

### Task 1: Extract shared `_nativePost` helper

**Files:**
- Create: `src/lib/nativePost.ts`
- Test: `src/tests/nativePost.test.ts`
- Reference (read, do NOT yet change): `src/lib/audio.ts` lines ~114-228 (`_ttsPost`), `src/lib/aiPost.ts`.

The current `_ttsPost` (private, in audio.ts) is the ONLY transport that correctly handles Capacitor native: it (a) resolves a native base URL from `_NATIVE_ENDPOINTS = ['https://nasahrvatska.com','https://nasa-hrvatska-v2.pages.dev']` when `isNative()`, web uses `''`; (b) injects `Authorization: Bearer <getFirebaseBearer()>`; (c) uses `CapacitorHttp.post()` (dynamic import of `@capacitor/core`) on native to bypass WebView restrictions; (d) fails over to the next endpoint on 5xx, returns immediately on 4xx. It is hardcoded to `/api/tts`.

- [ ] **Step 1: Write failing tests** for a new exported `_nativePost(path, body, opts?)`.

```ts
// src/tests/nativePost.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies the helper uses (mirror how whisperClaudeScorer.test.ts mocks audio).
vi.mock('../lib/audio', () => ({
  getFirebaseBearer: vi.fn(async () => 'tok123'),
  isNative: vi.fn(() => false),
}));

import { _nativePost } from '../lib/nativePost';

describe('_nativePost', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('web path: posts to the RELATIVE path with bearer + json headers', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const r = await _nativePost('/api/assess-speaking', { a: 1 });
    expect(r.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/assess-speaking');
    expect((init.headers as Record<string,string>).Authorization).toBe('Bearer tok123');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ a: 1 });
  });

  it('omits Authorization when no bearer is available', async () => {
    const audio = await import('../lib/audio');
    (audio.getFirebaseBearer as any).mockResolvedValueOnce(null);
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await _nativePost('/api/assess-speaking', {});
    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string,string>).Authorization).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run, verify it fails** — `npx vitest run src/tests/nativePost.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement `src/lib/nativePost.ts`.** Move the native transport logic out of `_ttsPost` into a path-parameterized exported function. Signature:

```ts
export interface NativePostOpts { signal?: AbortSignal }
export async function _nativePost(
  path: string,
  body: Record<string, unknown>,
  opts?: NativePostOpts,
): Promise<Response | null>
```

Requirements (match `_ttsPost`'s proven behavior, generalized over `path`):
- Import `getFirebaseBearer`, `isNative` from `./audio.js` (keep those exported from audio.ts; if `isNative` is currently private, export it).
- Web (`!isNative()`): `fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...bearer}, body: JSON.stringify(body), signal })`.
- Native: iterate `_NATIVE_ENDPOINTS`; build `${base}${path}`; use `CapacitorHttp.post` (dynamic `import('@capacitor/core')`) with the same headers/body; on 5xx try next endpoint, on 4xx return immediately, return the first ok/4xx Response. Define `_NATIVE_ENDPOINTS` here (or import from a shared const).
- Returns `null` only on total transport failure (matching `_ttsPost`'s null contract), so callers can fall through.

- [ ] **Step 4: Run tests** → PASS. `npx tsc --noEmit` clean.

- [ ] **Step 5: Commit** — `git add src/lib/nativePost.ts src/tests/nativePost.test.ts src/lib/audio.ts && git commit -m "feat(net): extract shared _nativePost (native base-URL + CapacitorHttp + bearer)"`

---

### Task 2: ~~Refactor `_ttsPost` to delegate to `_nativePost`~~ — SKIPPED (2026-06-08, by design)

**DECISION: deliberately NOT done.** R3.1 revealed `_ttsPost` uses `CapacitorHttp` `responseType:'blob'` for BINARY audio, whereas `_nativePost` JSON-maps responses. Refactoring `_ttsPost` to delegate would risk the critical, working, hard-won TTS-on-native path ([[knowledge_nh_tts_auth_requirement]]), and the TTS tests run in jsdom (`isNative()===false`) so they would NOT catch a broken native-blob delivery — exactly the "tests pass ≠ signal works" trap. R3's goal is fixing checkpoint speaking, not refactoring TTS transport. We accept minor transport duplication between `_ttsPost` (blob/native, working) and `_nativePost` (json/native, new); true unification (with a `responseType` option + native-path coverage) is deferred to R4 where it can be done with proper care. Original (not executed) steps preserved below for R4 reference.

<details><summary>Original Task 2 (deferred to R4)</summary>

#### Refactor `_ttsPost` to delegate to `_nativePost`

**Files:** Modify `src/lib/audio.ts` (`_ttsPost`). Test: existing `src/tests/` TTS/audio tests are the guard.

- [ ] **Step 1: Run the existing TTS/audio tests first** to capture green baseline: `npx vitest run src/lib/audio` (and any `tts`-named tests). Note which pass.
- [ ] **Step 2: Refactor** `_ttsPost(body, signal)` to `return _nativePost('/api/tts', body, { signal });` — preserving its exact external behavior (same return type `Response|null`, same callers in audio.ts). Remove the now-duplicated native transport code from audio.ts (the logic now lives in nativePost.ts). Keep `_NATIVE_ENDPOINTS`/`isNative`/`getFirebaseBearer` consistent (import from nativePost or keep audio as the source — avoid a circular import: nativePost imports from audio for `isNative`/`getFirebaseBearer`, so `_ttsPost` importing `_nativePost` from nativePost is fine, no cycle if those primitives stay in audio.ts).
- [ ] **Step 3: Run the TTS/audio tests again** → still PASS (behavior preserved). `npx tsc --noEmit` clean; `npx eslint src --max-warnings=0` clean.
- [ ] **Step 4: Commit** — `git add src/lib/audio.ts && git commit -m "refactor(audio): _ttsPost delegates to shared _nativePost (no behavior change)"`

</details>

---

### Task 3: Route `whisperClaudeScorer` through `_nativePost`

**Files:** Modify `src/lib/speaking/whisperClaudeScorer.ts`. Test: extend `src/lib/speaking/__tests__/whisperClaudeScorer.test.ts`.

- [ ] **Step 1: Add a failing test** asserting the scorer posts to `/api/assess-speaking` via `_nativePost` (mock `_nativePost`, assert it is called with path `/api/assess-speaking` and the body fields). Keep the existing 5 cases green (they mock global `fetch`; switch them to mock `_nativePost` returning the appropriate Response).
- [ ] **Step 2: Implement** — replace the raw `fetch('/api/assess-speaking', {...})` + manual bearer handling with `const r = await _nativePost('/api/assess-speaking', { level, prompt, audioBase64, mime }); if (!r) return null;`. Remove the now-redundant `getFirebaseBearer`/header code (the helper does it). Preserve the `MIN_CONFIDENCE` retry logic and null-on-failure contract.
- [ ] **Step 3: Run** `npx vitest run src/lib/speaking/__tests__/whisperClaudeScorer.test.ts` → PASS. tsc clean.
- [ ] **Step 4: Commit** — `git add src/lib/speaking/whisperClaudeScorer.ts src/lib/speaking/__tests__/whisperClaudeScorer.test.ts && git commit -m "fix(speaking): route checkpoint scorer through _nativePost (Capacitor-safe URL)"`

---

### Task 4: `SpeakingTaskScreen` uses `useRecorder` + mic-denied explainer

**Files:** Modify `src/components/exam/SpeakingTaskScreen.tsx`. Possibly create `src/components/exam/MicPermissionDeniedExplainer.tsx`. Test: extend `src/tests/SpeakingTaskScreen.test.tsx`.

First read `src/hooks/useRecorder.ts` (return shape: `state`, `audioBlob`, `startRecording({countdown,maxDurationMs})`, `stopRecording`, `reset`, `error`, states incl. `'denied'`/`'unsupported'`) and the current `SpeakingTaskScreen.tsx`. Check whether a mic-denied explainer component already exists anywhere (`grep -ri "MicPermission\|mic.*denied\|denied.*mic" src`) — REUSE if present; only create one if none exists.

- [ ] **Step 1: Write/adjust failing tests.** The current test injects a `captureAudio` stub; `useRecorder` changes the contract. New tests should: (a) drive recording via the `useRecorder` flow (mock `useRecorder` to return a controllable state/blob), assert that on a completed recording the screen calls the scorer and reports score via `onScore`; (b) when `useRecorder` reports `state==='denied'`, the screen renders the mic-denied explainer and does NOT call the scorer. Keep the existing happy-path + retry semantics.
- [ ] **Step 2: Implement.** Replace `defaultCapture` + the bespoke recording effect with `useRecorder()`. Wire its `audioBlob` (on `state==='done'`) into the existing assessment call (`whisperClaudeScorer.assess(blob, ctx)`). Map `state==='denied'`/`'unsupported'` to the explainer UI (a `Retry` button calling `reset()` + re-`startRecording`). Preserve `onScore`, retry-on-null, and all existing `data-testid`s. Keep `captureAudio` prop ONLY if still needed for tests; prefer mocking `useRecorder` instead and remove the prop if it becomes dead (don't leave dead code).
- [ ] **Step 3: Run** `npx vitest run src/tests/SpeakingTaskScreen.test.tsx` → PASS. tsc + eslint clean.
- [ ] **Step 4: Commit** — `git add -A src/components/exam/ src/tests/SpeakingTaskScreen.test.tsx && git commit -m "fix(checkpoint): SpeakingTaskScreen uses shared useRecorder + mic-denied explainer"`

---

### Task 5: Pin Whisper to Croatian + honest "confidence" relabel

**Files:** Modify `functions/api/assess-speaking.js`. Test: extend `src/tests/assess-speaking.integration.test.js`. Update consumer `src/lib/speaking/whisperClaudeScorer.ts` if the response field is renamed.

- [ ] **Step 1: Failing test** — assert `env.AI.run('@cf/openai/whisper', ...)` is called with `language: 'hr'`.
- [ ] **Step 2: Implement** — change line ~76 to `await env.AI.run('@cf/openai/whisper', { audio: b64ToBytes(audioBase64), language: 'hr' })`. (If the Workers AI Whisper binding rejects an unknown `language` param, fall back to leaving audio-only and add a code comment with the binding's accepted params — verify against current Workers AI Whisper schema via the build/test, do not guess silently.)
- [ ] **Step 3: Honest relabel** — the response field currently named `confidence` is a transcript-length heuristic (`wordCount>=3?0.9:wordCount>0?0.3:0`), NOT STT confidence. Rename it to `transcriptSufficiency` (or `lengthConfidence`) in BOTH the function response and `whisperClaudeScorer.ts` (which reads it against `MIN_CONFIDENCE`). Add a one-line comment stating it is a length heuristic, not an acoustic/STT confidence. Keep the threshold behavior identical. (This applies the signal-is-real standard: don't label a word-count bucket "confidence".)
- [ ] **Step 4: Run** `npx vitest run src/tests/assess-speaking.integration.test.js src/lib/speaking/__tests__/whisperClaudeScorer.test.ts` → PASS. tsc + eslint (`src functions`) clean.
- [ ] **Step 5: Commit** — `git add functions/api/assess-speaking.js src/lib/speaking/whisperClaudeScorer.ts src/tests/assess-speaking.integration.test.js && git commit -m "fix(assess-speaking): pin Whisper language hr; relabel word-count 'confidence' honestly"`

---

### Task 6: Full gate + ship behind flag (flag stays OFF)

**Files:** none (verification). `CHECKPOINTS_ENABLED` stays `false`.

- [ ] **Step 1:** `npx tsc --noEmit` clean.
- [ ] **Step 2:** `npx eslint src functions --max-warnings=0` clean; `npm run lint:croatian` clean.
- [ ] **Step 3:** `npx vitest run` — full suite green (≥ prior count + new tests).
- [ ] **Step 4:** Confirm `CHECKPOINTS_ENABLED === false` still (this PR ships the FIXES; re-enabling is a separate user-gated decision).
- [ ] **Step 5:** Final code-quality review (feature-dev:code-reviewer, opus) over the branch diff — focus: no circular import audio↔nativePost; TTS behavior truly unchanged; Capacitor URL resolution correct; useRecorder lifecycle wired without leaks; honest relabel complete on both ends.
- [ ] **Step 6:** PR → CI green → merge → verify deploy (version.json flip).

**After merge:** surface to the user that the checkpoint speaking fixes are deployed (still flagged OFF), and ask for the go-ahead to flip `CHECKPOINTS_ENABLED=true` (user previously gated this: "re-enable after fix").
