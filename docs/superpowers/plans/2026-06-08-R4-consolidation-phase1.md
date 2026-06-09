# R4 Consolidation — Phase 1: Transport Unification, Correctness Fixes & Leaf Dedup

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the highest-value, lowest-risk duplication and correctness debt from the 2026-06-08 speaking+AI audit — finish the R3-deferred `_ttsPost`→`_nativePost` delegation, fix a real Capacitor-native TTS breakage, and clear five discrete correctness/integrity defects — without touching the risky conversation-engine rewrite.

**Architecture:** Single transport core (`_nativePost`) gains binary-response support so the duplicated `_ttsPost` native logic collapses into a delegate; component TTS callsites that bypass the native-safe path (and silently break on device) are routed through one helper. Independent leaf fixes (offline guard, double-logging, XP cap, persona label, scorer field rename, similarity util) are each self-contained and shippable alone.

**Tech Stack:** TypeScript + React (Vite), Vitest unit tests, Playwright E2E, Cloudflare Pages Functions backend, Capacitor (Android/iOS native shell). All commands run from repo root `nasa-hrvatska-v2/`.

---

## Scope reconciliation (READ FIRST — the audit was partly stale)

This plan was written against **live source at `master @ d1fbbef2`**, not the audit memo. Source verification corrected three audit claims — do **not** chase these:

1. **`functions/api/pronunciation-coach.js` has NO dead Deepgram scaffolding.** It is an active local phoneme rule-engine + Claude, and its Levenshtein input is already explicitly labelled *"not a phonetic score."* **Nothing to do.**
2. **`functions/api/assess-speaking.js` already pins `language:'hr'` and already returns `transcriptSufficiency`** (R3 shipped this). Only the **frontend** `SpeakingAssessment.confidence` type field still lags — see Task 5.
3. **The "3 STT backends" are intentionally distinct** (Azure = phoneme scoring; Deepgram/Whisper = transcription; Workers-AI = in-function rubric). A merge would be an architectural regression. **Explicitly out of scope** — the only shareable surface is a base64-decode helper, deferred to Phase 3 as optional and low-value.

### R4 decomposition (this plan = Phase 1 only)

R4 is **not one plan** — it spans independent subsystems at very different risk levels. Per writing-plans discipline, it is split into shippable phases:

| Phase | Scope | Risk | Status |
|-------|-------|------|--------|
| **Phase 1 (THIS PLAN)** | Transport delegation + TTS-callsite native fix; offline-guard, double-logging, XP cap, persona-label, scorer-field rename, similarity util | Low–Med | **Detailed below, ready to execute** |
| **Phase 2** | Migrate feasible mic-capture impls (LiveTutorScreen, PronunciationScorer Azure path) onto `useRecorder`; collapse `apiFetch`-based `/api/stt` + `/api/pronunciation-assess` onto `_nativePost` | Med | **Deferred — needs own plan** (see end) |
| **Phase 3** | Extract a shared conversation engine across AIConversation/LiveTutorScreen/MajaScreen; migrate Maja memory localStorage→Firestore; optional STT decode-helper | High | **Deferred — needs brainstorming/spec** (see end) |

`useWhisperSTT`'s VAD loop is **not** a migration target in any phase — it is tightly coupled to a Web Audio `AnalyserNode` polling loop that `useRecorder` does not model. Leave it.

---

## File Structure (Phase 1)

**Created:**
- `src/lib/text/similarity.ts` — single shared diacritic-normalized Levenshtein + similarity (Task 6)
- `src/tests/transport-blob.test.ts` — `_nativePost` blob-response unit tests (Task 7)
- `src/tests/similarity.test.ts` — shared similarity util tests (Task 6)

**Modified (each change self-contained):**
- `src/components/croatia/LiveTutorScreen.tsx` — offline guard destructure (T1) + XP cap (T4)
- `src/components/croatia/AIConversation.tsx` — remove duplicate `logError` (T2)
- `src/components/ai/AITab.tsx` — persona label (T3)
- `src/lib/speaking/SpeakingScorer.ts` + `src/lib/speaking/whisperClaudeScorer.ts` — field rename (T5)
- `src/components/shared/PronunciationScorer.tsx`, `src/components/practice/TypingScreen.tsx`, `src/components/practice/SpeakingScreen.tsx` — use shared similarity (T6)
- `src/lib/nativePost.ts` — `responseType: 'blob'` support (T7)
- `src/lib/audio.ts` — `_ttsPost` delegates to `_nativePost`; export `ttsFetch` (T8)
- ~12 component files POSTing `/api/tts` via `apiFetch` (T9)
- Test files: `src/tests/SpeakingTaskScreen.test.tsx`, plus new/updated tests per task

---

## Task 0: Branch setup

- [ ] **Step 1: Create the feature branch** (matches R1–R3 CI-gated-PR workflow)

```bash
cd "nasa-hrvatska-v2"
git checkout master && git pull
git checkout -b fix/r4-phase1-transport-correctness
```

- [ ] **Step 2: Confirm baseline is green**

Run: `npm run typecheck && npm test`
Expected: tsc clean; full Vitest suite passes (baseline ~3386 tests). If anything fails on a clean checkout, STOP — that is a pre-existing break to triage first, not caused by this work.

---

## Task 1: Fix dead offline guard in LiveTutorScreen

**Why:** `useOnlineStatus()` returns an object `{ isOnline, backOnline }`. LiveTutorScreen assigns the whole object to `isOnline`, so `!isOnline` is always `false` and the offline banner never renders. Every other screen destructures correctly.

**Files:**
- Modify: `src/components/croatia/LiveTutorScreen.tsx` (line ~101; usages ~737, ~968)
- Test: `src/tests/live-tutor-screen.test.tsx` (existing — follow its `vi.mock('../hooks/useOnlineStatus')` pattern)

- [ ] **Step 1: Write the failing test**

Add to `src/tests/live-tutor-screen.test.tsx` (mock `useOnlineStatus` to report offline, assert the offline UI appears). Use the existing mock style already in that file:

```tsx
it('shows the offline notice when the network is down', async () => {
  // useOnlineStatus is mocked at top of file; override to offline for this test
  mockUseOnlineStatus.mockReturnValue({ isOnline: false, backOnline: false });
  render(<LiveTutorScreen {...baseProps} />);
  expect(await screen.findByText(/offline/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/tests/live-tutor-screen.test.tsx -t "offline notice"`
Expected: FAIL — offline text not found (guard is dead, banner never renders).

- [ ] **Step 3: Fix the destructure**

In `src/components/croatia/LiveTutorScreen.tsx`, change line ~101 from:

```tsx
const isOnline = useOnlineStatus();
```

to:

```tsx
const { isOnline } = useOnlineStatus();
```

Leave the two `{!isOnline && (...)}` usages (~737, ~968) as-is — they become correct once `isOnline` is a boolean.

- [ ] **Step 4: Run the test — confirm pass**

Run: `npx vitest run src/tests/live-tutor-screen.test.tsx -t "offline notice"`
Expected: PASS.

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add src/components/croatia/LiveTutorScreen.tsx src/tests/live-tutor-screen.test.tsx
git commit -m "fix(live-tutor): destructure useOnlineStatus so offline guard fires

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Remove duplicate error-logging in AIConversation

**Why:** The same mistake is logged to weak-areas twice per session — once as corrections stream in (~line 734) and again at end-of-session evaluation (~line 932). This inflates weak-area frequency and skews the learner's review queue. Keep the **evaluation-phase** log (authoritative, deduped, structured `ev.mistakes`); drop the per-turn streaming log.

**Files:**
- Modify: `src/components/croatia/AIConversation.tsx` (remove block at ~734)
- Test: `src/tests/ai-conversation.test.tsx` (existing)

- [ ] **Step 1: Write the failing test**

Add a test asserting that a single corrected mistake produces exactly **one** `logError` call across a full session (stream → evaluation). Spy on `logError` from `src/lib/learnerErrors.js`:

```tsx
it('logs each mistake to weak-areas only once per session', async () => {
  const logErrorSpy = vi.spyOn(learnerErrors, 'logError');
  // drive one turn with a correction, then trigger session-end evaluation
  await playSessionWithOneCorrection(); // helper: mirror existing test drivers in this file
  const grammarLogs = logErrorSpy.mock.calls.filter(
    (c) => c[2]?.source === 'conversation',
  );
  expect(grammarLogs).toHaveLength(1);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/tests/ai-conversation.test.tsx -t "only once per session"`
Expected: FAIL — receives 2 calls (streaming + evaluation).

- [ ] **Step 3: Delete the per-turn streaming log**

In `src/components/croatia/AIConversation.tsx`, remove the streaming-phase `logError` (~line 734). The block to delete:

```tsx
if (result.correction.corrected !== userText) {
  logError(result.errorPatterns?.[0] || 'conversation_grammar', 'grammar', {
    wrong: userText,
    correct: result.correction.corrected,
    source: 'conversation',
  });
}
```

Keep the surrounding `setCorrections(...)` (the UI inline-correction display must stay). Keep the evaluation-phase loop (~line 932) untouched — it is the single source of truth.

- [ ] **Step 4: Run the test — confirm pass**

Run: `npx vitest run src/tests/ai-conversation.test.tsx -t "only once per session"`
Expected: PASS (exactly 1 call).

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add src/components/croatia/AIConversation.tsx src/tests/ai-conversation.test.tsx
git commit -m "fix(ai-conversation): log each mistake once (drop duplicate streaming logError)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Fix AITab persona label mismatch

**Why:** The "Live AI Tutor" card says *"Hrvoje explains, drills, and corrects"* but the screen's actual persona is **Marija from Split** (`LiveTutorScreen.tsx` line ~49: `TUTOR_PERSONA = { name: 'Marija', city: 'Split' }`). Hrvoje is the knight mascot, not the tutor. This is a user-facing factual error.

**Files:**
- Modify: `src/components/ai/AITab.tsx` (card `id: 'live_tutor'`, ~line 48)

- [ ] **Step 1: Correct the description string**

In `src/components/ai/AITab.tsx`, in the `live_tutor` card object, change:

```tsx
description: '1:1 personalized AI tutoring session — Hrvoje explains, drills, and corrects.',
```

to:

```tsx
description: '1:1 personalized AI tutoring session — Marija explains, drills, and corrects.',
```

(Verify the live persona name in `LiveTutorScreen.tsx` `TUTOR_PERSONA` at edit time; use whatever name is actually rendered. If the product intent is that the tutor SHOULD be named Hrvoje, that is a content decision for the user — flag it rather than guessing. Default: make the label match the code.)

- [ ] **Step 2: Typecheck + lint (catches Croatian-text issues) + commit**

```bash
npm run typecheck && npm run lint
git add src/components/ai/AITab.tsx
git commit -m "fix(ai-tab): correct Live AI Tutor persona label to match rendered tutor (Marija)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Cap farmable per-turn XP in LiveTutor

**Why:** LiveTutor awards 5 XP **every turn with no ceiling** (~lines 334–344), plus a one-time 20 XP milestone at turn 10. Unbounded per-turn XP is trivially farmable (keep typing turns forever). Cap per-turn XP to the first 10 turns so a session yields at most 50 (turns) + 20 (milestone) = **70 XP** — preserving the intended reward while removing the infinite-farm vector. (Whole-session replay farming is a separate concern governed by daily quotas — out of scope here; note it, don't solve it.)

**Files:**
- Modify: `src/components/croatia/LiveTutorScreen.tsx` (~lines 334–344)
- Test: `src/tests/live-tutor-screen.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('stops awarding per-turn XP after turn 10 (anti-farm cap)', async () => {
  const awardSpy = vi.fn();
  render(<LiveTutorScreen {...baseProps} award={awardSpy} />);
  await runTutorTurns(15); // helper: drive 15 user turns (mirror existing turn drivers)
  const perTurnXp = awardSpy.mock.calls.filter((c) => c[0] === 5).length;
  expect(perTurnXp).toBe(10); // not 15
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/tests/live-tutor-screen.test.tsx -t "anti-farm cap"`
Expected: FAIL — 15 per-turn awards (no cap).

- [ ] **Step 3: Add the cap**

In `src/components/croatia/LiveTutorScreen.tsx`, change the award block from:

```tsx
const newTurn = turnCount + 1;
setTurnCount(newTurn);
if (typeof award === 'function') {
  award(5, false, 'speaking');
  if (newTurn === 10 && !milestone10Fired.current) {
    milestone10Fired.current = true;
    award(20, false, 'speaking');
    markQuest('speak');
  }
}
```

to:

```tsx
const newTurn = turnCount + 1;
setTurnCount(newTurn);
if (typeof award === 'function') {
  // Per-turn XP is capped at the first 10 turns to prevent endless-turn farming.
  if (newTurn <= 10) award(5, false, 'speaking');
  if (newTurn === 10 && !milestone10Fired.current) {
    milestone10Fired.current = true;
    award(20, false, 'speaking');
    markQuest('speak');
  }
}
```

- [ ] **Step 4: Run the test — confirm pass**

Run: `npx vitest run src/tests/live-tutor-screen.test.tsx -t "anti-farm cap"`
Expected: PASS (10 per-turn awards).

- [ ] **Step 5: Commit**

```bash
npm run typecheck
git add src/components/croatia/LiveTutorScreen.tsx src/tests/live-tutor-screen.test.tsx
git commit -m "fix(live-tutor): cap per-turn XP at 10 turns to remove farm vector

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Rename misleading `SpeakingAssessment.confidence` → `transcriptSufficiency`

**Why:** The field is documented as "STT confidence" but is populated from a **word-count heuristic** (the backend already exposes it honestly as `transcriptSufficiency`). The frontend type lies about what the number is. Rename to match the backend and the honest-signal standard ([[feedback_verify_signal_is_real]]). Verified consumers: the type def, the scorer, and two test files — nothing reads it for display.

**Files:**
- Modify: `src/lib/speaking/SpeakingScorer.ts` (interface, ~lines 13–20)
- Modify: `src/lib/speaking/whisperClaudeScorer.ts` (~line 67)
- Modify: `src/tests/SpeakingTaskScreen.test.tsx` (~lines 56, 147)
- Leave alone: `src/tests/assess-speaking.integration.test.js` (~line 95 asserts the **backend** response has no `confidence` — still true)

- [ ] **Step 1: Enumerate every consumer (guard against a missed reference)**

Run: `grep -rn "\.confidence\|confidence:" src/ | grep -i speak`
Expected: confirms only the 4 sites above. If grep surfaces a NEW consumer, add it to this task before editing.

- [ ] **Step 2: Rename in the interface**

In `src/lib/speaking/SpeakingScorer.ts`, change:

```ts
  /** STT confidence → intelligibility proxy (0..1). */
  confidence: number;
```

to:

```ts
  /** Transcript sufficiency heuristic (0..1) from word count — NOT acoustic STT confidence. */
  transcriptSufficiency: number;
```

- [ ] **Step 3: Rename in the scorer**

In `src/lib/speaking/whisperClaudeScorer.ts` (~line 67), change `confidence: transcriptSufficiency,` to:

```ts
      transcriptSufficiency,
```

(The right-hand value `transcriptSufficiency` already exists from the response; this becomes an object shorthand.)

- [ ] **Step 4: Update the test mocks**

In `src/tests/SpeakingTaskScreen.test.tsx`, change both `confidence: 0.9` (~lines 56, 147) to `transcriptSufficiency: 0.9`.

- [ ] **Step 5: Typecheck (the real guard for a rename) + run affected tests**

Run: `npm run typecheck && npx vitest run src/tests/SpeakingTaskScreen.test.tsx`
Expected: tsc clean (no lingering `.confidence` references), tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/speaking/SpeakingScorer.ts src/lib/speaking/whisperClaudeScorer.ts src/tests/SpeakingTaskScreen.test.tsx
git commit -m "refactor(speaking): rename SpeakingAssessment.confidence -> transcriptSufficiency (honest name)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Extract one shared similarity util

**Why:** There are 3+ copies of string-similarity logic: a real Levenshtein in `PronunciationScorer.tsx` (~65–97) and `TypingScreen.tsx` (~24–46), plus two character-overlap functions in `SpeakingScreen.tsx` (`textSimilarity` ~147, misleadingly-named `levenshteinClose` ~546). Consolidate to one DRY, diacritic-normalized module. Preserve each callsite's existing semantics exactly — this is a dedup, not a behavior change.

**Files:**
- Create: `src/lib/text/similarity.ts`
- Create: `src/tests/similarity.test.ts`
- Modify: `PronunciationScorer.tsx`, `TypingScreen.tsx`, `SpeakingScreen.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/tests/similarity.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { levenshtein, similarityPct, normalizeCroatian } from '../lib/text/similarity';

describe('similarity util', () => {
  it('computes edit distance', () => {
    expect(levenshtein('kuca', 'kuća')).toBe(1);
  });
  it('normalizes Croatian diacritics', () => {
    expect(normalizeCroatian('ČĆŠŽĐ')).toBe('ccszd');
  });
  it('returns 100 for diacritic-only differences after normalization', () => {
    expect(similarityPct('kuca', 'kuća')).toBe(100);
  });
  it('returns 0 for empty input', () => {
    expect(similarityPct('', 'abc')).toBe(0);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/tests/similarity.test.ts`
Expected: FAIL — module `../lib/text/similarity` does not exist.

- [ ] **Step 3: Create the module**

Create `src/lib/text/similarity.ts`:

```ts
// Shared string-similarity utilities for Croatian learning comparisons.
// Consolidates previously-duplicated copies in PronunciationScorer, TypingScreen,
// and SpeakingScreen. Diacritic normalization is intentional: learners are not
// penalized for missing diacritics in loose-match contexts.

/** Lowercase, strip Croatian diacritics and punctuation, trim. */
export function normalizeCroatian(s: string): string {
  return s
    .toLowerCase()
    .replace(/[čć]/g, 'c')
    .replace(/š/g, 's')
    .replace(/ž/g, 'z')
    .replace(/đ/g, 'd')
    .replace(/[.,!?;:'"]/g, '')
    .trim();
}

/** Classic dynamic-programming Levenshtein edit distance (raw, no normalization). */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_unused, i) =>
    Array.from({ length: n + 1 }, (_2, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1]![j - 1]!
          : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
    }
  }
  return dp[m]![n]!;
}

/** Diacritic-normalized similarity in 0..100 (100 = identical after normalization). */
export function similarityPct(a: string, b: string): number {
  const na = normalizeCroatian(a);
  const nb = normalizeCroatian(b);
  if (!na || !nb) return na === nb ? 100 : 0;
  if (na === nb) return 100;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 100;
  return Math.round((1 - levenshtein(na, nb) / maxLen) * 100);
}
```

- [ ] **Step 4: Run the test — confirm pass**

Run: `npx vitest run src/tests/similarity.test.ts`
Expected: PASS.

- [ ] **Step 5: Migrate `PronunciationScorer.tsx`**

Delete the local `levenshtein` (~65–78) and `similarity` (~80–97). Add `import { similarityPct } from '../../lib/text/similarity';` and replace `similarity(a, b)` callsites with `similarityPct(a, b)`. Run `npx vitest run` against any existing PronunciationScorer test to confirm behavior preserved.

- [ ] **Step 6: Migrate `TypingScreen.tsx`**

Delete the local `levenshtein` (~24–46). Add `import { levenshtein } from '../../lib/text/similarity';`. The existing `const dist = levenshtein(normInp, normTgt);` (~line 59) call is unchanged. Confirm TypingScreen tests pass.

- [ ] **Step 7: Migrate `SpeakingScreen.tsx`**

`textSimilarity` (~147) and `levenshteinClose` (~546) are **character-overlap**, NOT Levenshtein — their semantics differ from `similarityPct`. To preserve behavior exactly, do NOT silently swap them for `similarityPct`. Instead, move them verbatim into `similarity.ts` as a clearly-named `charOverlapPct(a,b)` + `charOverlapAtLeast(a,b,threshold)`, add tests pinning their current outputs, then import them. This keeps the dedup honest (no behavior drift in the speaking matcher).

```ts
// add to src/lib/text/similarity.ts
/** Character-overlap ratio in 0..100 (shared chars / longer length). Looser than edit distance. */
export function charOverlapPct(a: string, b: string): number {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (!na || !nb) return 0;
  if (na === nb) return 100;
  const longer = na.length >= nb.length ? na : nb;
  const shorter = na.length >= nb.length ? nb : na;
  if (longer.length === 0) return 100;
  const shared = shorter.split('').filter((c) => longer.includes(c)).length;
  return Math.round((shared / longer.length) * 100);
}
```

Add a test pinning `charOverlapPct` to the values SpeakingScreen relied on, then replace the two local functions with imports.

- [ ] **Step 8: Full typecheck + targeted tests + commit**

```bash
npm run typecheck && npx vitest run src/tests/similarity.test.ts
git add src/lib/text/similarity.ts src/tests/similarity.test.ts src/components/shared/PronunciationScorer.tsx src/components/practice/TypingScreen.tsx src/components/practice/SpeakingScreen.tsx
git commit -m "refactor(text): extract shared similarity util; dedupe 3 copies, preserve semantics

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Add binary (`responseType: 'blob'`) support to `_nativePost`

**Why:** `_nativePost` was extracted from `_ttsPost` but only handles JSON responses (`_capDataToResponse` always wraps as `application/json`). To let `_ttsPost` delegate (Task 8), `_nativePost` must optionally return the audio blob and pass through the `X-TTS-Backends` header. This is the R3-deferred work.

**Files:**
- Modify: `src/lib/nativePost.ts`
- Test: `src/tests/transport-blob.test.ts` (new)

- [ ] **Step 1: Write the failing test**

Create `src/tests/transport-blob.test.ts`. Mock `audio.js` exports (`isNative` → false to exercise the web `fetch` path) and a global `fetch` returning an `audio/mpeg` Response; assert `_nativePost` with `{ responseType: 'blob' }` returns a Response whose blob and content-type survive:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/audio.js', () => ({
  isNative: () => false,
  getFirebaseBearer: async () => 'tok',
}));

import { _nativePost } from '../lib/nativePost';

describe('_nativePost blob responseType', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async () =>
      new Response(new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/mpeg' }), {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg', 'X-TTS-Backends': 'azure' },
      }),
    ) as unknown as typeof fetch;
  });

  it('returns the raw Response (blob preserved) when responseType is blob', async () => {
    const res = await _nativePost('/api/tts', { text: 'bok' }, { responseType: 'blob' });
    expect(res).not.toBeNull();
    expect(res!.headers.get('Content-Type')).toBe('audio/mpeg');
    const buf = await res!.arrayBuffer();
    expect(buf.byteLength).toBe(3);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/tests/transport-blob.test.ts`
Expected: FAIL — `NativePostOpts` has no `responseType` (tsc error) or the blob path is not handled.

- [ ] **Step 3: Extend the options type**

In `src/lib/nativePost.ts`, change:

```ts
export interface NativePostOpts {
  signal?: AbortSignal;
}
```

to:

```ts
export interface NativePostOpts {
  signal?: AbortSignal;
  /** 'json' (default) returns a JSON-wrapped Response; 'blob' preserves binary
   *  bodies (e.g. audio/mpeg from /api/tts) and passes through response headers. */
  responseType?: 'json' | 'blob';
  /** Response header names to preserve on the blob path (e.g. ['X-TTS-Backends']). */
  passthroughHeaders?: string[];
}
```

- [ ] **Step 4: Handle blob on the native (CapacitorHttp) path**

In `_nativePost`, when `opts?.responseType === 'blob'` and running native, request `responseType: 'blob'` from CapacitorHttp and convert its base64/Blob `data` to an `audio/*` Response (mirror the proven logic from `_ttsPost` lines ~159–181, including the `_dataUrlToArrayBuffer` base64 decode and `passthroughHeaders`). Import `_dataUrlToArrayBuffer` from `audio.js` (export it if not already exported — it is currently module-private; add `export` to its declaration in `audio.ts`).

Add to the CapacitorHttp `capHttp.post({ url, headers, data: body })` call: `...(opts?.responseType === 'blob' ? { responseType: 'blob' } : {})`. On 2xx with blob mode, build the Response from the binary instead of calling `_capDataToResponse`.

- [ ] **Step 5: Web fetch path needs no change**

On the web `fetch` path, the raw `Response` is already returned as-is when `r.ok` — a blob body survives untouched. No code change needed there; the test in Step 1 exercises exactly this path.

- [ ] **Step 6: Run the test — confirm pass**

Run: `npx vitest run src/tests/transport-blob.test.ts`
Expected: PASS.

- [ ] **Step 7: Typecheck + commit**

```bash
npm run typecheck
git add src/lib/nativePost.ts src/lib/audio.ts src/tests/transport-blob.test.ts
git commit -m "feat(transport): add responseType:'blob' + header passthrough to _nativePost

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Delegate `_ttsPost` to `_nativePost` (kill the duplicated native logic)

**Why:** `_ttsPost` (audio.ts ~114–228) is ~90 lines of native-endpoint/bearer/CapacitorHttp logic that duplicates `_nativePost` almost verbatim — the only differences are the hardcoded `/api/tts` path and blob handling, both now supported by Task 7. Collapse `_ttsPost` to a thin delegate. **Risk:** `nativePost.ts` imports from `audio.ts`, so `audio.ts` importing `_nativePost` creates an import cycle — must verify with `madge`.

**Files:**
- Modify: `src/lib/audio.ts`
- Verify: `npm run check:circular`

- [ ] **Step 1: Confirm the existing TTS behavior is covered before refactor**

Run: `grep -rln "speakAzure\|speakProsody\|preloadAudio\|_ttsPost" src/tests/`
Read the covering test(s). If `_ttsPost`'s web path is not exercised by any test, ADD a small test first (Response with `audio/mpeg` → played) so the delegation is covered. Do not refactor blind.

- [ ] **Step 2: Replace the `_ttsPost` body with a delegate**

In `src/lib/audio.ts`, replace the entire `_ttsPost` function body (lines ~114–228) with:

```ts
async function _ttsPost(
  body: Record<string, unknown>,
  signal: AbortSignal,
): Promise<Response | null> {
  const { _nativePost } = await import('./nativePost');
  return _nativePost('/api/tts', body, {
    signal,
    responseType: 'blob',
    passthroughHeaders: ['X-TTS-Backends'],
  });
}
```

The dynamic `import('./nativePost')` is deliberate — it defers resolution to call time, sidestepping the static import cycle (`nativePost.ts` → `audio.ts`). Keep `_NATIVE_ENDPOINTS` / `_dataUrlToArrayBuffer` in `audio.ts` (now used by `nativePost.ts`).

- [ ] **Step 3: Verify no circular-import break**

Run: `npm run check:circular`
Expected: no NEW circular dependency reported involving `audio.ts` ↔ `nativePost.ts`. (Dynamic import keeps it acyclic at module-eval time. If madge still flags it, the dynamic import in Step 2 is what prevents a runtime failure — confirm the app boots in Step 5.)

- [ ] **Step 4: Run the TTS tests**

Run: `npx vitest run src/tests/ -t "tts"` and the test identified in Step 1.
Expected: PASS — speakAzure/speakProsody/preloadAudio behavior unchanged.

- [ ] **Step 5: Smoke-build (catches eval-time cycle failures a unit test can miss)**

Run: `npm run build`
Expected: clean Vite build. Then `npm run preview` and confirm TTS plays on one screen (e.g., Phrase of the Day) in the browser.

- [ ] **Step 6: Commit**

```bash
git add src/lib/audio.ts
git commit -m "refactor(transport): _ttsPost delegates to _nativePost (remove ~90 dup lines)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Route component `/api/tts` callsites through the native-safe helper

**Why (real device bug, not just dedup):** ~12 components POST `/api/tts` via `apiFetch`, which uses the **relative URL** as-is. On Capacitor native, relative URLs resolve to the bundled WebView origin (`https://localhost`) — so **TTS silently fails on the Android/iOS app** for every one of these screens. `_ttsPost`/`_nativePost` exist precisely to resolve absolute native endpoints. Route them through one exported helper.

**Files:**
- Modify: `src/lib/audio.ts` (export a `ttsFetch` wrapper)
- Modify (verify each individually): `CroatianNewsScreen.tsx:263`, `HeritageStoryScreen.tsx:107`, `LiveTutorScreen.tsx:427,526`, `MajaScreen.tsx:227`, `PhraseOfDayScreen.tsx:412`, `StoryModeScreen.tsx:50`, `GradedInputScreen.tsx:111`, `AIListeningScreen.tsx:130`, `SpeakingSprintScreen.tsx:376`, `WritingScreen.tsx:267`

- [ ] **Step 1: Enumerate the exact live callsites (don't trust this list blindly)**

Run: `grep -rn "apiFetch('/api/tts'\|apiFetch(\"/api/tts\"\|apiFetch(\`/api/tts" src/`
Use the grep output as the authoritative target list. (Line numbers above are from the audit snapshot and may drift.)

- [ ] **Step 2: Add the exported helper**

In `src/lib/audio.ts`, add (near `_ttsPost`):

```ts
/**
 * Native-safe POST to /api/tts. Use this from components instead of
 * apiFetch('/api/tts', ...) — apiFetch sends a relative URL that resolves to
 * https://localhost on Capacitor native and silently fails. Returns the audio
 * Response, or null on total transport failure (caller should fall through).
 */
export async function ttsFetch(
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<Response | null> {
  return _ttsPost(body, signal ?? new AbortController().signal);
}
```

- [ ] **Step 3: Migrate one callsite as the worked reference — `CroatianNewsScreen.tsx`**

The current code (~258–289) is:

```tsx
const res = await apiFetch('/api/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: article.simplified_text,
    slow: false,
    voice: getVoicePreference(),
  }),
});
if (!res.ok) throw new Error('TTS failed');
const blob = await res.blob();
```

Replace with (import `ttsFetch` from `../../lib/audio`; the `unlockAudio()` call above stays):

```tsx
const res = await ttsFetch({
  text: article.simplified_text,
  slow: false,
  voice: getVoicePreference(),
});
if (!res || !res.ok) throw new Error('TTS failed');
const blob = await res.blob();
```

Note the `!res ||` guard — `ttsFetch` can return `null`. Everything after `res.blob()` (FileReader → data URL → `new Audio`) is unchanged. Remove the now-unused `apiFetch` import **only if** no other `apiFetch` call remains in the file.

- [ ] **Step 4: Apply the same transform to each remaining callsite**

For every file from Step 1: read the callsite, replace `apiFetch('/api/tts', { method:'POST', headers, body: JSON.stringify(PAYLOAD) })` with `ttsFetch(PAYLOAD, signal?)` — passing the caller's existing `AbortSignal` if it had one — and add the `!res ||` null guard. Preserve all response handling (`.blob()`, object-URL/data-URL playback) verbatim. Do each file as its own read→edit→verify; they are structurally identical but confirm each (some pass a `signal`, some don't).

- [ ] **Step 5: Typecheck + full suite**

Run: `npm run typecheck && npm test`
Expected: tsc clean; full Vitest suite passes.

- [ ] **Step 6: Guard against regressions creeping back**

Run: `grep -rn "apiFetch('/api/tts'\|apiFetch(\"/api/tts" src/`
Expected: **no matches** (all migrated). Consider a tiny grep-guard test if the project has a `src/tests/grep-guards*` pattern (it enforced R2 cleanups) — add a guard asserting zero `apiFetch('/api/tts'` occurrences.

- [ ] **Step 7: Commit**

```bash
git add src/lib/audio.ts src/components
git commit -m "fix(tts): route all /api/tts callsites through native-safe ttsFetch (Capacitor fix)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Full verification gate + PR

- [ ] **Step 1: Run the complete local gate** (matches CI; [[feedback_ci_rapid_push_cancellation]] — run the FULL gate before pushing, don't churn)

Run: `npm run typecheck && npm run lint && npm test && npm run check:circular`
Expected: all green.

- [ ] **Step 2: Run E2E** (the real-signal path — caught 2 real R3 bugs that tsc+unit missed)

Run: `npm run test:e2e`
Expected: pass. Known pre-existing flakes (daily-challenge-sync, pronunciation nav smoke) per [[project_nasa_hrvatska_session_2026_06_08]] — if only those fail, re-run the E2E job rather than editing code.

- [ ] **Step 3: Push and open the PR**

```bash
git push -u origin fix/r4-phase1-transport-correctness
gh pr create --title "R4 Phase 1: transport unification + correctness fixes" \
  --body "$(cat <<'EOF'
## R4 Consolidation — Phase 1

Finishes the R3-deferred `_ttsPost`→`_nativePost` delegation and clears the highest-value audit debt.

**Transport (real device fix):**
- `_nativePost` gains `responseType:'blob'` + header passthrough
- `_ttsPost` collapses to a thin delegate (~90 dup lines removed)
- All ~12 component `/api/tts` callsites routed through native-safe `ttsFetch` — **fixes silent TTS failure on Capacitor native**

**Correctness / integrity:**
- LiveTutor offline guard now fires (was dead — object truthiness bug)
- AIConversation logs each mistake once (was double-counting weak-areas)
- LiveTutor per-turn XP capped at 10 turns (removes farm vector)
- AITab "Live AI Tutor" label matches the rendered persona
- `SpeakingAssessment.confidence` → `transcriptSufficiency` (honest name)
- Single shared similarity util (deduped 3 copies, semantics preserved)

Audit items intentionally NOT addressed (false/out-of-scope — see plan): pronunciation-coach "dead Deepgram" (none exists), assess-speaking language pin (already done in R3), STT-backend merge (intentionally distinct).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Confirm CI green, then hand back to user for merge decision.** Do not auto-merge — [[feedback_no_recommendations_until_qualified]] / user-gated.

---

## Self-Review (run against the audit backlog)

**Spec coverage** — Phase 1 maps to audit items: offline guard (HIGH) ✓ T1; double-error-logging (MED) ✓ T2; persona-label (HIGH) ✓ T3; double-XP (MED) ✓ T4; confidence-field (R3 deferred) ✓ T5; 3 similarity scorers (HIGH) ✓ T6; `_ttsPost`→`_nativePost` (R3 deferred) ✓ T7–T8; mic/STT/conversation duplication (HIGH) → **deferred to Phase 2/3 with reasoning** (intentional, documented). False items (coach Deepgram, assess-speaking hr-pin) explicitly dropped with proof.

**Placeholder scan** — no "TBD"/"add error handling"/"similar to Task N". T9 Step 4 repeats the full transform rather than referencing T3, and instructs per-file read/verify (the files are individually unread, so the plan mandates reading each — not assuming).

**Type consistency** — `transcriptSufficiency` used identically in T5 type + scorer + tests; `ttsFetch(body, signal?)` signature consistent across T8/T9; `NativePostOpts.responseType` defined in T7 and consumed in T8.

---

## Deferred — Phase 2 (needs its own plan)

**Mic-capture consolidation onto `useRecorder` + STT transport unification.** Migrate `LiveTutorScreen` (raw MediaRecorder ~585–638) and `PronunciationScorer` Azure recording (~229–309) onto the shared `useRecorder` hook; route `/api/stt` (useWhisperSTT, LiveTutorScreen) and `/api/pronunciation-assess` (PronunciationScorer, GradedInputScreen) through `_nativePost` (they currently use `apiFetch` → same native-URL risk as TTS). **Exclude** `useWhisperSTT`'s VAD loop (AnalyserNode-coupled). Medium risk — touches live recording paths that mock-tests hide; needs real-device verification. Estimated own plan, ~6–8 tasks.

## Deferred — Phase 3 (needs brainstorming/spec first)

**Shared conversation engine + Maja persistence.** The three engines (AIConversation/LiveTutorScreen/MajaScreen) diverge on STT (Whisper-VAD vs MediaRecorder vs Web Speech), memory (Firestore vs none vs localStorage), persona, endpoint, and XP model. A shared engine is feasible but is an architectural change with real product decisions (does LiveTutor gain cross-session memory? does Maja move to Firestore — `majaMemory` localStorage → `useConversationMemory` Firestore?). **Start with `superpowers:brainstorming`, not a plan.** The Maja localStorage→Firestore migration (cross-device memory loss) folds in here. Optional tiny STT base64-decode helper can ride along — low value, do only if cheap.
