# R4 Phase 2: Mic-Capture Consolidation + STT/Assess Transport Native-Safety

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/api/stt` and `/api/pronunciation-assess` native-safe (they break on Capacitor today, like `/api/tts` did before Phase 1), and consolidate two raw-MediaRecorder mic implementations onto the shared `useRecorder` hook — without changing scoring behavior.

**Architecture:** Two independently-shippable workstreams. **2A (transport):** unify `/api/stt` on a base64-JSON body so it rides the existing native-safe `_nativePost` (consistent with tts/pronunciation-assess); migrate all 4 STT/assess callsites; fix a pre-existing `GradedInputScreen` wrong-keys bug. **2B (capture):** expose `mimeType` (+ optional MIME priority) on `useRecorder`, then migrate `LiveTutorScreen` and `PronunciationScorer`'s recorders onto it. `useWhisperSTT`'s VAD/AnalyserNode loop is **excluded** (genuinely incompatible with the start-then-capture model).

**Tech Stack:** TypeScript + React (Vite), Vitest, Playwright E2E, Cloudflare Pages Functions, Capacitor. All commands run from repo root `nasa-hrvatska-v2/`.

---

## Decisions locked (from planning)
- **D1 — `/api/stt` transport = base64-JSON unification** (user-approved). The two `/api/stt` callsites send raw binary blobs today (`body: blob`); `_nativePost` JSON-stringifies, so it can't carry binary. Change the callsites to send `{ audioBase64, mimeType }` JSON and teach `stt.js` to accept JSON (decode → bytes → existing Deepgram/Whisper). Keep the raw `audio/*` path for backward-compat during rollout. base64-audio-in-JSON is already proven by `/api/pronunciation-assess`; STT utterances are short, so payload size is fine.
- **Exclude `useWhisperSTT`** from the recorder migration (VAD loop spins up MediaRecorder mid-stream off an AnalyserNode RMS poll — not expressible via `useRecorder`). Its `/api/stt` *transport* is still migrated to base64-JSON (Task 2).

## Pre-existing bugs found during mapping (fixed here, not new scope)
- **`GradedInputScreen.assessPronunciation`** sends `{ audio, text, locale }` but the backend expects `{ audioBase64, referenceText, locale, audioMimeType }` → backend 400s; pronunciation assessment silently never works. Fixed in Task 4. (Mirrors the `/api/tts` GradedInput bug fixed in Phase 1.)

## Risk callout — PronunciationScorer capture format (Task 7)
`PronunciationScorer` negotiates MIME in an **Azure-preferred order** (`audio/ogg;codecs=opus`, `audio/wav`, then webm) because Azure pronunciation assessment is format-sensitive. `useRecorder`'s generic order is webm-first. To migrate without changing the assessed format, Task 5 makes `useRecorder`'s MIME priority configurable and Task 7 passes the Azure order. Task 7 requires **real-device + real-Azure verification** before it's considered done (mock tests can't prove Azure still scores the format).

---

## File Structure
**Modify:**
- `functions/api/stt.js` — accept `application/json` `{audioBase64, mimeType}` (Task 1)
- `src/hooks/useRecorder.ts` — expose `mimeType`; optional `mimePriority` (Task 5)
- `src/components/croatia/LiveTutorScreen.tsx` — STT transport (Task 2) + recorder→useRecorder (Task 6)
- `src/hooks/useWhisperSTT.js` — STT transport only (Task 2)
- `src/components/shared/PronunciationScorer.tsx` — assess transport (Task 3) + recorder→useRecorder (Task 7)
- `src/components/learn/GradedInputScreen.tsx` — assess transport + key-fix (Task 4)
- Test files per task (Vitest)

---

## Task 0: Branch + baseline
- [ ] **Step 1:** `git checkout master && git pull && git checkout -b fix/r4-phase2-capture-stt-transport`
- [ ] **Step 2:** Baseline green: `npm run typecheck && npm test`. If anything fails on clean checkout, STOP and triage — not caused by this work.

---

# Workstream 2A — Transport native-safety

## Task 1: `stt.js` accepts base64-JSON (keep raw fallback)

**Files:** Modify `functions/api/stt.js`; Test `src/tests/stt-json-body.test.js` (new, or co-locate with existing stt tests if present — `grep -rl "api/stt\|stt.js" src/tests functions`).

- [ ] **Step 1: Write the failing test** — assert that a JSON body `{audioBase64, mimeType}` is accepted: decoded to bytes and passed to the transcription path. Mock the Deepgram/Whisper fetch (or the transcribe helpers) and assert the decoded byte length + that `mimeType` is used as the content type. Follow the existing stt test harness if one exists.

```js
// shape (adapt to existing harness): POST JSON → 200 { text }
const body = JSON.stringify({ audioBase64: btoa('AAAA'), mimeType: 'audio/webm' });
const res = await onRequestPost(ctxWithJson(body)); // ctx mocks env keys + request.json()
expect(res.status).toBe(200);
```

- [ ] **Step 2: Run → FAIL** (`onRequestPost` currently only reads `request.arrayBuffer()` and rejects non-`audio/*` Content-Type).

- [ ] **Step 3: Implement Content-Type branch.** In `functions/api/stt.js` `onRequestPost`, replace the Content-Type validation + body read (current lines ~115–131) with:

```js
  // Accept either base64-JSON (native-safe, sent via _nativePost) or a raw audio/* body.
  const ct = request.headers.get('content-type') || 'audio/webm';
  let audioBuffer;
  let audioCt;
  if (ct.includes('application/json')) {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }
    const { audioBase64, mimeType } = body || {};
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing audioBase64' }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }
    const bin = atob(audioBase64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    audioBuffer = bytes.buffer;
    audioCt = typeof mimeType === 'string' && mimeType.startsWith('audio/') ? mimeType : 'audio/webm';
  } else if (ct.startsWith('audio/')) {
    audioBuffer = await request.arrayBuffer();
    audioCt = ct;
  } else {
    return new Response(JSON.stringify({ error: 'Expected audio/* or application/json' }), {
      status: 400,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
```

Then replace the two `transcribe*(audioBuffer, ct, KEY)` calls (current lines ~146, ~156) to pass `audioCt` instead of `ct`. The empty/size guards (current ~126–138) stay, operating on `audioBuffer`. Nothing else changes — Deepgram/Whisper still receive raw bytes + a content type.

- [ ] **Step 4: Run → PASS.** Also confirm a raw `audio/webm` body still works (add/keep a raw-path test).

- [ ] **Step 5: Lint + commit:**
```bash
npm run lint && npm run typecheck
git add functions/api/stt.js src/tests/stt-json-body.test.js
git commit -m "feat(stt): accept base64-JSON body (native-safe) alongside raw audio/*

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

## Task 2: Migrate `/api/stt` callsites → `_nativePost` base64-JSON

**Why:** `LiveTutorScreen.transcribeAudio` and `useWhisperSTT.sendToWhisper` POST a raw blob via `apiFetch` (relative URL) → broken on Capacitor native. Send base64-JSON via `_nativePost` (returns JSON `{text}`).

**Files:** `src/components/croatia/LiveTutorScreen.tsx`, `src/hooks/useWhisperSTT.js`; tests that mock `apiFetch` for `/api/stt` (`grep -rn "api/stt" src/tests`).

- [ ] **Step 1: Add a base64 helper** if one isn't already shared. Check `grep -rn "function.*[bB]ase64\|btoa" src/lib`. If `whisperClaudeScorer.ts` or similar has a blob→base64 chunked encoder, reuse/extract it to `src/lib/audio.ts` or `src/lib/text/`… (a small `blobToBase64(blob): Promise<string>`). Otherwise add this to `src/lib/audio.ts` and export it:
```ts
/** Encode a Blob's bytes as base64 (chunked to avoid call-stack limits on large inputs). */
export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  const CHUNK = 8192;
  let binary = '';
  for (let i = 0; i < buf.length; i += CHUNK) {
    binary += String.fromCharCode(...buf.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}
```

- [ ] **Step 2: Write failing tests** — for each callsite, mock `_nativePost` (from `../../lib/nativePost` / `../lib/nativePost`) to return `{ ok: true, json: async () => ({ text: 'bok' }) }` and assert the transcription result flows through; mock it returning `null` and assert the existing fallback (Web Speech / silent) still fires. Update any test that asserted on `apiFetch('/api/stt', { body: blob })` to expect `_nativePost('/api/stt', { audioBase64, mimeType })`.

- [ ] **Step 3: Migrate `LiveTutorScreen.transcribeAudio`** (current ~567–600). Replace:
```tsx
      const res = await apiFetch('/api/stt', {
        method: 'POST',
        headers: { 'Content-Type': mimeType },
        body: blob,
        signal: controller.signal,
      });
```
with:
```tsx
      const audioBase64 = await blobToBase64(blob);
      const res = await _nativePost('/api/stt', { audioBase64, mimeType }, { signal: controller.signal });
      if (!res) throw new Error('stt_transport_failed');
```
Import `_nativePost` from `../../lib/nativePost` and `blobToBase64` from `../../lib/audio`. Everything after (response `.json()` → `{text}`, the 15s abort controller, error handling) stays. Keep the `if (!res.ok)` check (now guarded by the `!res` throw above).

- [ ] **Step 4: Migrate `useWhisperSTT.sendToWhisper`** (current ~187–228). Replace the `apiFetch('/api/stt', { headers:{'Content-Type': blob.type...}, body: blob })` with the same base64-JSON `_nativePost('/api/stt', { audioBase64, mimeType: blob.type || 'audio/webm' })` pattern, preserving the 503→Web-Speech fallback (a 503 Response still returns `res.ok === false`; `null` from `_nativePost` should follow the same fallback path as a transport failure). Read the surrounding fallback logic and wire `null`/`!res.ok`/503 to the existing Web-Speech fallback exactly as before.

- [ ] **Step 5:** `npm run typecheck`, run the touched tests, then **grep-guard:** `grep -rn "apiFetch('/api/stt'" src/` → expect none.

- [ ] **Step 6: Commit:**
```bash
git add src/components/croatia/LiveTutorScreen.tsx src/hooks/useWhisperSTT.js src/lib/audio.ts src/tests
git commit -m "fix(stt): route /api/stt callsites through native-safe _nativePost (base64-JSON)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

## Task 3: Migrate `PronunciationScorer` `/api/pronunciation-assess` → `_nativePost`

**Why:** Already sends correct JSON `{audioBase64, referenceText, locale, audioMimeType}` via `apiFetch` (relative URL) → broken on native. Swap transport only.

**Files:** `src/components/shared/PronunciationScorer.tsx`; its tests.

- [ ] **Step 1: Failing test** — mock `_nativePost` to return the assessment JSON; assert the scorer renders the result. Update any `apiFetch('/api/pronunciation-assess')` mock to `_nativePost`.
- [ ] **Step 2: Migrate `submitToAzure`** (current ~305–315). Replace:
```tsx
      const res = await apiFetch('/api/pronunciation-assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64, referenceText: targetText, locale: 'hr-HR', audioMimeType: mimeType }),
        signal: controller.signal,
      });
```
with:
```tsx
      const res = await _nativePost(
        '/api/pronunciation-assess',
        { audioBase64, referenceText: targetText, locale: 'hr-HR', audioMimeType: mimeType },
        { signal: controller.signal },
      );
      if (!res) throw new Error('assess_transport_failed');
```
Import `_nativePost`. Remove the now-unused `apiFetch` import only if no other `apiFetch` call remains in the file. Response handling (`.json()` → scores) unchanged; keep `!res.ok` handling.
- [ ] **Step 3:** typecheck + tests + commit (`fix(pron): route /api/pronunciation-assess through _nativePost (PronunciationScorer)`).

## Task 4: Fix + migrate `GradedInputScreen.assessPronunciation` (pre-existing bug)

**Why:** Sends `{ audio, text, locale }` — backend expects `{ audioBase64, referenceText, audioMimeType }` → 400. Fix keys AND route via `_nativePost`. (It already records via `useRecorder`, so `recorder.audioBlob`'s type gives `audioMimeType` once Task 5 exposes it — until then derive from `blob.type`.)

**Files:** `src/components/learn/GradedInputScreen.tsx`; its tests.

- [ ] **Step 1: Failing test** — assert `assessPronunciation` posts `{ audioBase64, referenceText, locale, audioMimeType }` (correct keys) via `_nativePost`, and returns the parsed scores; assert null transport → throws/handled as today.
- [ ] **Step 2: Rewrite `assessPronunciation`** (current ~295–309):
```tsx
async function assessPronunciation(audioBlob: Blob, referenceText: string) {
  const audioBase64 = await blobToBase64(audioBlob);
  const res = await _nativePost('/api/pronunciation-assess', {
    audioBase64,
    referenceText,
    locale: 'hr-HR',
    audioMimeType: audioBlob.type || 'audio/webm',
  });
  if (!res || !res.ok) throw new Error('Assessment failed');
  return res.json();
}
```
Import `_nativePost` from `../../lib/nativePost` and `blobToBase64` from `../../lib/audio`. Remove unused `apiFetch` import only if nothing else in the file uses it.
- [ ] **Step 3:** typecheck + tests + grep-guard `grep -rn "apiFetch('/api/pronunciation-assess'" src/` → none. Commit (`fix(pron): GradedInput correct keys + native-safe transport (pre-existing 400 bug)`).

---

# Workstream 2B — Mic capture → `useRecorder`

## Task 5: Expose `mimeType` (+ optional MIME priority) on `useRecorder`

**Why:** Migrating consumers need the recorded blob's MIME for the `mimeType`/`audioMimeType` fields; `PronunciationScorer` needs an Azure-preferred negotiation order to avoid changing the assessed format.

**Files:** `src/hooks/useRecorder.ts`; `src/tests/use-recorder*.test.*` (find/extend; `grep -rl "useRecorder" src/tests`).

- [ ] **Step 1: Failing test** — assert `useRecorder()` returns `mimeType: null` before recording and the negotiated type after a recording completes (drive via the hook's test harness / a MediaRecorder mock). Also assert a custom `mimePriority` is honored.
- [ ] **Step 2: Implement.** In `src/hooks/useRecorder.ts`:
  - Add state: `const [mimeType, setMimeType] = useState<string | null>(null);`
  - In `rec.onstop` (current ~150–153), capture it with the blob:
    ```ts
          const type = rec.mimeType || 'audio/webm';
          const blob = new Blob(chunks, { type });
          if (!mountedRef.current) return;
          setMimeType(type);
          setAudioBlob(blob);
    ```
  - Make negotiation order overridable. Extend `StartRecordingOpts`:
    ```ts
    export interface StartRecordingOpts {
      countdown?: number;
      maxDurationMs?: number;
      /** Override MIME negotiation order (e.g. Azure-preferred). Defaults to MIME_PRIORITY. */
      mimePriority?: readonly string[];
    }
    ```
    and in `beginRecording`, negotiate using `opts?.mimePriority ?? MIME_PRIORITY`:
    ```ts
          const order = opts?.mimePriority ?? MIME_PRIORITY;
          const mime = order.find((m) => MediaRecorder.isTypeSupported(m)) ?? null;
    ```
  - Add `mimeType` to `UseRecorderResult` and the `return {…}`. Reset it in `reset()` (`setMimeType(null);`).
- [ ] **Step 3:** typecheck + run useRecorder tests (and full suite touching recorder consumers) → pass. Commit (`feat(useRecorder): expose mimeType + optional mimePriority`).

## Task 6: Migrate `LiveTutorScreen` recorder → `useRecorder`

**Why:** Replace raw `getUserMedia`/`MediaRecorder` (current ~602–650) with the shared hook (gets mimeType negotiation, unlock, cleanup for free). Feeds the already-migrated `transcribeAudio` (Task 2).

**Files:** `src/components/croatia/LiveTutorScreen.tsx`; `src/tests/live-tutor-screen.test.tsx`.

- [ ] **Step 1: Failing test** — assert that completing a recording (drive the `useRecorder` mock to `state:'done'` with an `audioBlob`+`mimeType`) calls `transcribeAudio(blob, mimeType)` exactly once and starts/stops via the hook. Reuse the file's existing harness/mocks (it already mocks audio + apiFetch; add a `useRecorder` mock).
- [ ] **Step 2: Implement.** Replace the component's `startRecording`/`stopRecording`/`recorder.onstop` machinery and the `mediaRecorderRef`/`audioChunksRef`/`recordingStreamRef` refs with `const rec = useRecorder();`. Wire:
  - record button → `rec.startRecording({ countdown: 0 })` / `rec.stopRecording()`; `isRecording` ← `rec.state === 'recording'`.
  - a `useEffect` on `[rec.state, rec.audioBlob]`: when `rec.state === 'done' && rec.audioBlob`, call `transcribeAudio(rec.audioBlob, rec.mimeType ?? 'audio/webm')` then `rec.reset()`. Guard against double-fire (mirror the Phase-1 R3 checkpoint pattern: effect deps = only `[rec.state, rec.audioBlob]`, read callbacks via refs). Keep the `blob.size < 1000` "too short" guard.
- [ ] **Step 3:** typecheck + run `live-tutor-screen.test.tsx` (all pass, incl. Phase-1 tests). Commit (`refactor(live-tutor): migrate mic capture to useRecorder`).

## Task 7: Migrate `PronunciationScorer` Azure recorder → `useRecorder` (format-preserving)

**Why:** Replace its raw MediaRecorder (current ~196–275) with `useRecorder`, preserving the Azure-preferred MIME order via Task 5's `mimePriority`. **Highest-risk task — requires real-device + real-Azure verification.**

**Files:** `src/components/shared/PronunciationScorer.tsx`; its tests.

- [ ] **Step 1: Failing test** — drive a `useRecorder` mock to `done` with a blob+mimeType; assert `submitToAzure(blob, mimeType)` is called with the right MIME and that `startRecording` was called with the Azure `mimePriority`.
- [ ] **Step 2: Implement.** Replace `startAzureRecording`'s `getUserMedia`/`MediaRecorder`/`onstop` with `useRecorder`. Pass the Azure order:
```ts
const AZURE_MIME_PRIORITY = ['audio/ogg;codecs=opus', 'audio/wav', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'] as const;
// start: rec.startRecording({ countdown: 0, mimePriority: AZURE_MIME_PRIORITY });
```
On `rec.state === 'done'` (effect, deps `[rec.state, rec.audioBlob]`), call `submitToAzure(rec.audioBlob, rec.mimeType ?? 'audio/webm')` then `rec.reset()`. Preserve the existing `state` machine values the component exposes (`'recording'`/`'processing'`) by deriving from `rec.state`.
- [ ] **Step 3:** typecheck + tests pass.
- [ ] **Step 4 — MANDATORY manual verification (do not mark done on green tests alone):** Build and exercise PronunciationScorer against the REAL `/api/pronunciation-assess` (Azure) on (a) desktop Chrome and (b) a real iPad or Android Capacitor build. Confirm Azure returns non-degenerate scores with the `useRecorder`-produced format. If Azure scoring regresses vs the old ogg/wav capture, STOP and report — the `mimePriority` may need adjusting or the migration deferred. Record the verification result in the PR.
- [ ] **Step 5: Commit** (`refactor(pron): migrate Azure recorder to useRecorder (Azure MIME priority preserved)`).

---

## Task 8: Full gate + PR
- [ ] **Step 1:** `npm run typecheck && npm run lint && npm test && npm run check:circular` → all green.
- [ ] **Step 2:** `npm run test:e2e` locally OR rely on CI E2E (per Phase-1 practice). Known pre-existing flakes: re-run rather than churn.
- [ ] **Step 3: Push + PR** (`gh pr create`), body summarizing 2A (transport native-safety + STT base64-JSON + GradedInput key-fix) and 2B (useRecorder consolidation), and **explicitly noting the Task-7 device/Azure verification result**. Backend `stt.js` change is backward-compatible (raw `audio/*` still accepted), so callsite/​backend deploy ordering is safe.
- [ ] **Step 4:** Confirm CI green; hand to user for merge (do not auto-merge).

---

## Self-Review (against the deferred-Phase-2 scope)
- **Coverage:** mic→useRecorder (LiveTutor T6, PronunciationScorer T7; GradedInput already on useRecorder; useWhisperSTT excluded w/ reason) ✓; `/api/stt` native-safe (T1 backend + T2 callsites) ✓; `/api/pronunciation-assess` native-safe (T3 PronunciationScorer + T4 GradedInput) ✓.
- **Placeholders:** none — each task has exact before/after code or a concrete shape + the file to read.
- **Type consistency:** `blobToBase64`, `_nativePost(path, body, {signal})`, and `useRecorder().mimeType` / `StartRecordingOpts.mimePriority` are used consistently across tasks.
- **Risk:** T7 (Azure format) is the one behavior-sensitive change and carries a mandatory manual-verification gate. T1 keeps a backward-compat raw path so the backend/callsite rollout is safe.

## Notes / not in scope
- `useWhisperSTT` VAD recorder stays as-is (only its STT transport migrates).
- Phase 3 (shared conversation engine across AIConversation/LiveTutorScreen/MajaScreen; Maja localStorage→Firestore) remains separate and needs brainstorming first.
