# R2 — Fabricated Scoring → Real (or Honest) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Eliminate every place the app shows *fabricated* feedback as if it were real scoring (a trust/integrity defect in a learning product), replacing each with either a real signal or an honest non-numeric treatment. Decision (confirmed): "invest in real replacements" using the **existing Azure/ElevenLabs TTS** (SSML prosody) — no native recordings.

**Architecture:** (1) Shadowing → drive its displayed score from the real Azure `PronunciationScorer` instead of `blob.size`/RNG. (2) Minimal-pair "hear the difference" → add an optional `prosody` (pitch-contour + rate) param to the existing Azure SSML TTS path so the two members render *acoustically distinct* (approximate pitch-accent, honestly labeled). (3) `PronunciationContrast` "frequency" bars → relabel qualitative, remove fake numbers, fix duplicate quiz options. (4) `PronunciationScorer` Web-Speech "82" → qualitative "recognized ✓ (accent not scored)", no fabricated number. (5) "Powered by Azure" claim → gated on the Azure path actually being used. (6) Content fixes (`noč`→`noć`, wrong `brȃt` example). (7) `pronunciation-coach` → stop feeding Claude a Levenshtein score labeled as acoustic.

**Tech Stack:** React/TS, Cloudflare Pages Functions (tts.js), Azure neural TTS SSML, Vitest.

**Audit ref:** speaking+AI audit 2026-06-08, slices B (C1/C2/C3, H1, H2, M1–M3) and C (C1, M1).

---

## File structure

| File | Change |
|---|---|
| `functions/api/tts.js` (modify) | Accept optional `prosody` (`{pitch?, contour?, rate?}`); build it into the `<prosody>` SSML. Sanitized/whitelisted. |
| `src/lib/audio.ts` (modify) | `speak()`/`speakAzure()` accept optional prosody opts → forwarded to `/api/tts`. New `speakProsody(text, prosody)` helper. |
| `src/components/learn/PitchAccentMastery.tsx` (modify) | Each minimal-pair member plays with its OWN prosody (rising/falling contour + long/short rate) so they differ. Honest label. Fix wrong `brȃt` example. |
| `src/components/learn/PhonemePracticeScreen.tsx` (modify) | Same: distinct prosody per pair member, or remove "hear the difference" where TTS can't contrast. |
| `src/components/practice/ShadowingScreen.tsx` (modify) | Replace `blob.size`/RNG score + fake waveform with the real `PronunciationScorer` result (or no score). |
| `src/components/practice/PronunciationContrast.tsx` (modify) | Relabel "Sound Comparison" bars qualitative (no %); de-duplicate quiz options. |
| `src/components/shared/PronunciationScorer.tsx` (modify) | Web-Speech translation branch → no fabricated 82; emit a qualitative "recognized" state. |
| `src/components/practice/PronunciationAssessScreen.tsx` (modify) | "Powered by Azure" only when Azure path used. |
| `src/data/pronunciationUtils.js` (modify) | `noč`→`noć`. |
| `functions/api/pronunciation-coach.js` (modify) | Remove dead Deepgram scaffolding; label the similarity signal honestly in the prompt. |
| Tests | per-task. |

---

## Task 1: Add `prosody` SSML support to the TTS endpoint

**Files:**
- Modify: `functions/api/tts.js` (the `tryAzure` SSML builder + body parsing)
- Test: `src/tests/tts.prosody.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/tests/tts.prosody.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../functions/api/_requireAuth.js', () => ({
  requireAuthedAI: vi.fn(async () => ({ ok: true, uid: 'u', origin: 'https://nasahrvatska.com', isDev: false })),
}));
import { buildAzureSsml } from '../../functions/api/tts.js';

describe('buildAzureSsml prosody', () => {
  it('default: rate -8%, no pitch/contour', () => {
    const s = buildAzureSsml('grad', { slow: false });
    expect(s).toContain('rate="-8%"');
    expect(s).not.toContain('pitch=');
  });
  it('applies pitch + contour + rate when prosody given', () => {
    const s = buildAzureSsml('grad', { prosody: { pitch: '+15%', contour: '(0%,+20%) (100%,-10%)', rate: '-20%' } });
    expect(s).toContain('pitch="+15%"');
    expect(s).toContain('contour="(0%,+20%) (100%,-10%)"');
    expect(s).toContain('rate="-20%"');
  });
  it('escapes text and ignores non-whitelisted prosody values', () => {
    const s = buildAzureSsml('a<b', { prosody: { pitch: 'javascript:evil', rate: 'DROP TABLE' } });
    expect(s).toContain('a&lt;b');
    expect(s).not.toContain('evil');
    expect(s).not.toContain('DROP');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/tts.prosody.test.js`
Expected: FAIL — `buildAzureSsml` not exported.

- [ ] **Step 3: Implement**

In `functions/api/tts.js`, extract the SSML construction into an exported, testable helper and accept optional prosody. Add near the top:

```js
// Whitelist prosody values to safe SSML tokens (prevents SSML injection via prosody attrs).
const SAFE_PCT = /^[+-]?\d{1,3}%$/;                       // e.g. -8%, +15%
const SAFE_CONTOUR = /^(\(\d{1,3}%,[+-]?\d{1,3}%\)\s*){1,6}$/; // e.g. "(0%,+20%) (100%,-10%)"
const SAFE_ST = /^[+-]?\d{1,2}(\.\d)?st$/;                // semitones, e.g. +2st

export function buildAzureSsml(text, { slow = false, prosody = null, voice = 'hr-HR-GabrijelaNeural' } = {}) {
  const safeText = String(text).replace(
    /[<>&"']/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c],
  );
  const attrs = [];
  if (prosody && typeof prosody === 'object') {
    if (typeof prosody.pitch === 'string' && (SAFE_PCT.test(prosody.pitch) || SAFE_ST.test(prosody.pitch))) attrs.push(`pitch="${prosody.pitch}"`);
    if (typeof prosody.contour === 'string' && SAFE_CONTOUR.test(prosody.contour)) attrs.push(`contour="${prosody.contour}"`);
    const r = typeof prosody.rate === 'string' && SAFE_PCT.test(prosody.rate) ? prosody.rate : (slow ? '-25%' : '-8%');
    attrs.push(`rate="${r}"`);
  } else {
    attrs.push(`rate="${slow ? '-25%' : '-8%'}"`);
  }
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="hr-HR"><voice name="${voice}"><prosody ${attrs.join(' ')}>${safeText}</prosody></voice></speak>`;
}
```

Then change `tryAzure(text, slow, ...)` to `tryAzure(text, { slow, prosody }, ...)` and use `buildAzureSsml(text, { slow, prosody })` instead of the inline ternary. In `onRequestPost`, parse `prosody` from the JSON body (after the gate) and thread it through to `tryAzure`. Cache key must include a prosody fingerprint (e.g. `JSON.stringify(prosody)`), so different contours don't collide in the edge cache.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/tts.prosody.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Run existing TTS tests for no regression**

Run: `npx vitest run src/tests/ -t tts` and `npx tsc --noEmit`
Expected: PASS + clean.

- [ ] **Step 6: Commit**

```bash
git add functions/api/tts.js src/tests/tts.prosody.test.js
git commit -m "feat(tts): optional prosody (pitch/contour/rate) SSML for minimal-pair contrasts"
```

---

## Task 2: Client `speakProsody` helper

**Files:**
- Modify: `src/lib/audio.ts`
- Test: `src/tests/audio.prosody.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/tests/audio.prosody.test.ts
import { describe, it, expect, vi } from 'vitest';
vi.mock('../lib/audio', async (orig) => orig());
import { speakProsody } from '../lib/audio';

it('speakProsody posts prosody to /api/tts', async () => {
  const fetchMock = vi.fn(async () => new Response(new Blob(['x']), { status: 200, headers: { 'content-type': 'audio/mpeg' } }));
  vi.stubGlobal('fetch', fetchMock);
  await speakProsody('grad', { contour: '(0%,+20%) (100%,-10%)', rate: '-20%' }).catch(() => {});
  const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit)?.body as string);
  expect(body.prosody).toEqual({ contour: '(0%,+20%) (100%,-10%)', rate: '-20%' });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/tests/audio.prosody.test.ts`
Expected: FAIL — `speakProsody` not exported.

- [ ] **Step 3: Implement**

In `src/lib/audio.ts`, add `speakProsody(text, prosody)` that POSTs to `/api/tts` with `{ text, prosody }` via the same `_ttsPost` path `speakAzure` uses (reuse `_ttsPost` — do NOT raw-fetch), and plays the returned audio through the existing audio element. Mirror `speakAzure`'s body construction; add `prosody` to the body and to the cache key.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/tests/audio.prosody.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/audio.ts src/tests/audio.prosody.test.ts
git commit -m "feat(audio): speakProsody client helper (reuses _ttsPost, native-safe)"
```

---

## Task 3: Minimal pairs play distinct audio (PitchAccentMastery + PhonemePractice)

**Files:**
- Modify: `src/components/learn/PitchAccentMastery.tsx`, `src/components/learn/PhonemePracticeScreen.tsx`
- Test: `src/tests/pitchAccentMastery.audio.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/tests/pitchAccentMastery.audio.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
const speakProsody = vi.fn(async () => '');
vi.mock('../lib/audio', () => ({ speak: vi.fn(async () => ''), speakProsody, speakSlow: vi.fn(async () => '') }));
import PitchAccentMastery from '../components/learn/PitchAccentMastery.js';

it('the two members of a minimal pair are spoken with DIFFERENT prosody', async () => {
  render(<PitchAccentMastery onBack={() => {}} award={() => {}} />);
  // navigate to a minimal-pair card and tap both members (adapt selectors to the component)
  // Assert speakProsody called twice with different `contour`/`rate`.
  // (Implementer: wire the test to the real testids; the KEY assertion:)
  const calls = speakProsody.mock.calls;
  // after tapping both members:
  if (calls.length >= 2) {
    expect(JSON.stringify(calls[0]![1])).not.toEqual(JSON.stringify(calls[1]![1]));
  }
});
```

- [ ] **Step 2–4:** Implement so each minimal-pair member carries a `prosody` descriptor reflecting its accent (short-falling: `rate:'-0%'`+falling `contour:'(0%,+10%) (100%,-25%)'`; long-rising: `rate:'-30%'`+rising `contour:'(0%,-15%) (100%,+20%)'`, etc. — choose per the 4 Croatian accents), and tapping a member calls `speakProsody(word, member.prosody)`. The two members of a pair MUST have different prosody descriptors. Keep the label honest (it's an approximate TTS contrast, not a native recording — e.g. "Approximate pitch contour"). Run the test → the "different prosody" assertion passes. Same treatment in `PhonemePracticeScreen` for its pairs (for consonant pairs like č/ć where prosody can't help, drop the "hear the difference" framing and present them as articulation guidance instead).

- [ ] **Step 5: Also fix the wrong `brȃt` example** in `PitchAccentMastery.tsx` (audit M3): the long-rising list contains `brȃt` flagged as "actually dugosilazni" — remove it from the long-rising examples (it's long-falling). 

- [ ] **Step 6:** `npx tsc --noEmit` clean; commit:

```bash
git add src/components/learn/PitchAccentMastery.tsx src/components/learn/PhonemePracticeScreen.tsx src/tests/pitchAccentMastery.audio.test.tsx
git commit -m "fix(pronunciation): minimal pairs play distinct prosody; remove wrong brat example"
```

---

## Task 4: Shadowing — real score, not fabricated

**Files:**
- Modify: `src/components/practice/ShadowingScreen.tsx`
- Test: `src/tests/shadowing.score.test.tsx`

- [ ] **Steps:** Write a failing test asserting the displayed score equals the `PronunciationScorer` result (not derived from `blob.size`), and that the user "waveform" is not random. Then: remove the `Math.min(95, ... blob.size % 100 ...)` score (line ~92) and the `Math.random()` `userWaveform` (lines ~24-27). Drive the displayed score from the real `PronunciationScorer` result the screen already renders (it imports it ~line 590); if a real score isn't available for a given utterance, show NO numeric score (a "recorded ✓ / compare to the model" state) rather than a fabricated one. Remove the misleading "Match score" number entirely from the fabricated path. `tsc` clean; commit `fix(shadowing): real Azure score or none — remove fabricated blob-size score + RNG waveform`.

---

## Task 5: PronunciationContrast — honest viz + fixed quiz data

**Files:**
- Modify: `src/components/practice/PronunciationContrast.tsx`
- Test: `src/tests/pronunciationContrast.data.test.tsx`

- [ ] **Steps:** (a) Write a test asserting every question's `options` array has no duplicate entries and contains the correct answer exactly once (fixes the `['čovjek','ćovjek','čovjek','đovjek']` / triple-`početi` bugs). Fix the data. (b) Replace the hardcoded `FrequencyViz` percentage bars (the `85%`/`45%`/`90%` "Sound Comparison") with a qualitative articulation label (no numbers presented as analysis), or remove the viz. `tsc` clean; commit `fix(pronunciation): de-dupe contrast quiz options; remove fake frequency bars`.

---

## Task 6: PronunciationScorer — no fabricated 82; honest Azure provenance

**Files:**
- Modify: `src/components/shared/PronunciationScorer.tsx`, `src/components/practice/PronunciationAssessScreen.tsx`
- Test: `src/tests/pronunciationScorer.honesty.test.tsx`

- [ ] **Steps:** (a) Test: when the Web-Speech path only recognizes via translation, the scorer does NOT emit a numeric `score` of 82 — it emits a qualitative `recognizedViaTranslation` result with no fabricated number. Fix `PronunciationScorer.tsx:161-176` to not invent 82; surface "Recognized ✓ (accent not scored)". (b) `PronunciationAssessScreen.tsx:296-298` "Powered by Azure" intro claim → only render when the Azure path is actually configured/used (gate on the scorer reporting the Azure path, not unconditionally). `tsc` clean; commit `fix(pronunciation): drop fabricated 82 fallback score; gate "Powered by Azure" on real Azure path`.

---

## Task 7: Content fix + pronunciation-coach honesty

**Files:**
- Modify: `src/data/pronunciationUtils.js` (`noč`→`noć`), `functions/api/pronunciation-coach.js`
- Test: extend an existing pronunciation data test or add `src/tests/pronunciationUtils.content.test.js`

- [ ] **Steps:** (a) `pronunciationUtils.js:18` — fix `noč` to `noć` (test asserts no `noč` in the phoneme guide). (b) `pronunciation-coach.js` — remove the dead Deepgram `wordData` scaffolding (never sent by any client) and stop labeling the Levenshtein text-similarity as a "pronunciation score" in the Claude prompt — call it "text-similarity (not acoustic)" so the coaching reasons honestly. `npm run lint` (lint:croatian) clean; `tsc` clean; commit `fix(pronunciation): noč→noć; pronunciation-coach drops dead Deepgram scaffolding + honest similarity label`.

---

## Task 8: Full gate + final review

- [ ] `npx tsc --noEmit && npm run lint && npm test` → all green.
- [ ] Grep guard: `grep -rn "blob.size % 100\|score: 82\|Math.random()" src/components/practice/ShadowingScreen.tsx src/components/shared/PronunciationScorer.tsx` → no fabricated-score patterns remain.
- [ ] Commit any fixes; this plan ships via its own PR.

## Self-review
- Slice B C1 (82) → Task 6. C2 (identical audio) → Tasks 1–3. C3 (fake bars) → Task 5. H1 (coach Deepgram) → Task 7. H2 (Azure provenance) → Task 6. M1 (noč) → Task 7. M2 (quiz dupes) → Task 5. M3 (brȃt) → Task 3. Slice C C1 (Shadowing) → Task 4. ✓
- Honest-by-design: where TTS genuinely can't contrast (consonant pairs), we drop the false "hear the difference" claim rather than fake it.

## Done criteria
No fabricated numeric scores or fake "analysis" anywhere; minimal pairs render acoustically-distinct (approximate, honestly labeled) audio; Shadowing shows a real Azure score or none; content errors fixed; full suite + tsc + lint green; shipped via PR.
