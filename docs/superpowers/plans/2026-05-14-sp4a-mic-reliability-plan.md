# SP4a — Microphone Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task in this session (user has explicitly disallowed fire-and-forget subagents on 2026-05-14). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the 11 fragmented mic-recording call sites into one tested `useRecorder` hook plus a per-OS permission-denied explainer, migrate 9 consumers + the Whisper layer to it, and verify with cross-browser Playwright.

**Architecture:** Build the hook bottom-up via TDD — one state transition per task. After the hook ships at ≥ 90% branch coverage, migrations happen consumer-by-consumer behind passing tests. Each migration adds a consumer integration test before swapping in the new hook.

**Tech Stack:** React 18 + TypeScript strict, Vitest + jsdom (unit), `@testing-library/react` (component), Playwright (cross-browser e2e), Capacitor 8 platform helpers (`src/lib/platform.ts`).

**Spec:** `docs/superpowers/specs/2026-05-14-sp4a-mic-reliability-design.md`

---

## File Structure

**Created:**
- `src/hooks/useRecorder.ts` — shared mic-recording hook (target ~250 LOC)
- `src/components/shared/MicPermissionDeniedExplainer.tsx` — per-OS re-grant UI
- `src/tests/useRecorder.test.ts` — 20+ unit cases
- `src/tests/MicPermissionDeniedExplainer.test.tsx` — component tests
- `e2e/mic-recording.spec.js` — cross-browser end-to-end

**Modified:**
- `src/lib/platform.ts` — add `getMicPermissionPlatform()`
- `src/components/practice/ShadowingScreen.tsx` — delete local `useRecorder()`, import shared
- `src/components/practice/SpeakingSprintScreen.tsx` — consume shared hook
- `src/components/practice/SpeakingScreen.tsx` — consume shared hook
- `src/components/practice/SpeakingPracticePanel.tsx` — consume shared hook
- `src/components/shared/PronunciationScorer.tsx` — consume shared hook
- `src/components/learn/GradedInputScreen.tsx` — consume shared hook
- `src/components/croatia/AIConversation.tsx` — consume shared hook + preserve Whisper
- `src/components/croatia/LiveTutorScreen.tsx` — consume shared hook + preserve Whisper
- `src/components/croatia/MajaScreen.tsx` — consume shared hook + preserve Whisper
- `src/hooks/useWhisperSTT.js` — layer Whisper on top of shared hook

---

## Test fixtures (reused across tasks)

These mock factories appear inline in every test file that needs them. Each task's tests reference them by name; the engineer copies them into the test file once per file (top of the file).

```ts
// MockMediaRecorder factory — used in useRecorder.test.ts
class MockMediaRecorder {
  state = 'inactive';
  mimeType: string;
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  constructor(_stream: MediaStream, opts?: { mimeType?: string }) {
    this.mimeType = opts?.mimeType ?? '';
  }
  start() { this.state = 'recording'; }
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['fake'], { type: this.mimeType || 'audio/webm' }) });
    this.onstop?.();
  }
}
(MockMediaRecorder as unknown as { isTypeSupported: (m: string) => boolean }).isTypeSupported =
  (m: string) => m.startsWith('audio/webm');

// Wire it up in beforeEach:
beforeEach(() => {
  vi.useFakeTimers();
  (globalThis as unknown as { MediaRecorder: unknown }).MediaRecorder = MockMediaRecorder;
});
```

```ts
// MockFileReader — used in tests that drive recordings to 'done'
class MockFileReader {
  result: string | null = null;
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;
  onerror: (() => void) | null = null;
  readAsDataURL(_blob: Blob) {
    this.result = 'data:audio/webm;base64,ZmFrZQ==';
    queueMicrotask(() => this.onload?.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>));
  }
}
(globalThis as unknown as { FileReader: unknown }).FileReader = MockFileReader;
```

```ts
// stubMediaDevices — helper used in many tests
function stubMediaDevices(getUserMediaImpl: () => Promise<MediaStream>) {
  const fakeStream = {
    getTracks: () => [{ stop: vi.fn() }],
  } as unknown as MediaStream;
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: getUserMediaImpl },
  });
  return fakeStream;
}
```

---

## Tasks

### Task 1: useRecorder skeleton + initial state

**Files:**
- Create: `src/hooks/useRecorder.ts`
- Create: `src/tests/useRecorder.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/tests/useRecorder.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRecorder } from '../hooks/useRecorder';

describe('useRecorder', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it('returns idle state on mount', () => {
    const { result } = renderHook(() => useRecorder());
    expect(result.current.state).toBe('idle');
    expect(result.current.audioBlob).toBeNull();
    expect(result.current.audioUrl).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.micAvailable).toBeNull();
    expect(typeof result.current.startRecording).toBe('function');
    expect(typeof result.current.stopRecording).toBe('function');
    expect(typeof result.current.playback).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `npx vitest run src/tests/useRecorder.test.ts`
Expected: Cannot find module `../hooks/useRecorder`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/hooks/useRecorder.ts
import { useState, useCallback } from 'react';

export type RecorderState =
  | 'idle' | 'requesting' | 'countdown' | 'recording'
  | 'done'  | 'denied'    | 'unsupported' | 'error';

export interface RecorderError { code: string; message: string; }
export interface StartRecordingOpts { countdown?: number; maxDurationMs?: number; }

export interface UseRecorderResult {
  state: RecorderState;
  micAvailable: boolean | null;
  audioBlob: Blob | null;
  audioUrl: string | null;
  countdown: number;
  error: RecorderError | null;
  startRecording: (opts?: StartRecordingOpts) => void;
  stopRecording: () => void;
  playback: () => Promise<void>;
  reset: () => void;
}

export function useRecorder(): UseRecorderResult {
  const [state] = useState<RecorderState>('idle');
  const [micAvailable] = useState<boolean | null>(null);
  const [audioBlob] = useState<Blob | null>(null);
  const [audioUrl] = useState<string | null>(null);
  const [countdown] = useState(0);
  const [error] = useState<RecorderError | null>(null);

  const startRecording = useCallback((_opts?: StartRecordingOpts) => {}, []);
  const stopRecording = useCallback(() => {}, []);
  const playback = useCallback(async () => {}, []);
  const reset = useCallback(() => {}, []);

  return { state, micAvailable, audioBlob, audioUrl, countdown, error, startRecording, stopRecording, playback, reset };
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `npx vitest run src/tests/useRecorder.test.ts`
Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useRecorder.ts src/tests/useRecorder.test.ts
git commit -m "feat(mic): useRecorder hook skeleton + initial state test"
```

---

### Task 2: Mime-type negotiation helper

**Files:**
- Modify: `src/hooks/useRecorder.ts` (add internal `negotiateMimeType` helper)
- Modify: `src/tests/useRecorder.test.ts` (export helper for unit testing)

The mime-type negotiation is a pure function that's easier to test in isolation than as part of `startRecording`. Extract it first.

- [ ] **Step 1: Write failing tests**

```ts
// src/tests/useRecorder.test.ts — add at top, before main describe
import { negotiateMimeType } from '../hooks/useRecorder';

describe('negotiateMimeType', () => {
  it('returns audio/webm;codecs=opus when supported', () => {
    const isTypeSupported = (m: string) => m === 'audio/webm;codecs=opus';
    expect(negotiateMimeType(isTypeSupported)).toBe('audio/webm;codecs=opus');
  });

  it('falls back to audio/webm', () => {
    const isTypeSupported = (m: string) => m === 'audio/webm';
    expect(negotiateMimeType(isTypeSupported)).toBe('audio/webm');
  });

  it('falls back to audio/mp4 on Safari', () => {
    const isTypeSupported = (m: string) => m === 'audio/mp4';
    expect(negotiateMimeType(isTypeSupported)).toBe('audio/mp4');
  });

  it('returns null when nothing is supported', () => {
    expect(negotiateMimeType(() => false)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests, verify they fail**

Expected: Cannot find export `negotiateMimeType`.

- [ ] **Step 3: Add the helper**

```ts
// src/hooks/useRecorder.ts — add above useRecorder
const MIME_PRIORITY = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'] as const;

export function negotiateMimeType(isTypeSupported: (m: string) => boolean): string | null {
  for (const m of MIME_PRIORITY) if (isTypeSupported(m)) return m;
  return null;
}
```

- [ ] **Step 4: Run the tests, verify they pass**

Expected: 5 passed (1 from Task 1 + 4 mime-type cases).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useRecorder.ts src/tests/useRecorder.test.ts
git commit -m "feat(mic): negotiateMimeType helper + 4 unit tests"
```

---

### Task 3: startRecording → requesting → countdown happy path

**Files:**
- Modify: `src/hooks/useRecorder.ts`
- Modify: `src/tests/useRecorder.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/tests/useRecorder.test.ts — inside main describe
import { act } from '@testing-library/react';

it('transitions idle → requesting → countdown on startRecording', async () => {
  let resolveGUM: (s: MediaStream) => void = () => {};
  const fakeStream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: () => new Promise<MediaStream>((resolve) => { resolveGUM = resolve; }) },
  });

  const { result } = renderHook(() => useRecorder());
  act(() => { result.current.startRecording(); });
  expect(result.current.state).toBe('requesting');

  await act(async () => { resolveGUM(fakeStream); });
  expect(result.current.state).toBe('countdown');
  expect(result.current.countdown).toBe(3);
});
```

- [ ] **Step 2: Run + see fail**

Expected: state remains `'idle'`.

- [ ] **Step 3: Implement**

Replace the empty `startRecording` body and add a `streamRef` and `countdownTimerRef`:

```ts
import { useState, useCallback, useRef, useEffect } from 'react';
// ... existing imports ...

export function useRecorder(): UseRecorderResult {
  const [state, setState] = useState<RecorderState>('idle');
  const [micAvailable, setMicAvailable] = useState<boolean | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<RecorderError | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const startRecording = useCallback((_opts?: StartRecordingOpts) => {
    if (state !== 'idle' && state !== 'denied' && state !== 'unsupported' && state !== 'error' && state !== 'done') return;
    setState('requesting');
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unsupported');
      setMicAvailable(false);
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        if (!mountedRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        setMicAvailable(true);
        setCountdown(3);
        setState('countdown');
      })
      .catch(() => { /* handled in later task */ });
  }, [state]);

  // ... rest unchanged for now ...
}
```

- [ ] **Step 4: Run + see pass**

Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useRecorder.ts src/tests/useRecorder.test.ts
git commit -m "feat(mic): startRecording transitions idle -> requesting -> countdown"
```

---

### Task 4: countdown → recording (MediaRecorder lifecycle)

**Files:**
- Modify: `src/hooks/useRecorder.ts`
- Modify: `src/tests/useRecorder.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// inside main describe — add MockMediaRecorder via beforeEach extension
// (move MockMediaRecorder class definition into the test file outer scope)

beforeEach(() => {
  vi.useFakeTimers();
  (globalThis as unknown as { MediaRecorder: unknown }).MediaRecorder = MockMediaRecorder;
});

it('transitions countdown → recording after 3 seconds', async () => {
  const fakeStream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: () => Promise.resolve(fakeStream) },
  });

  const { result } = renderHook(() => useRecorder());
  await act(async () => { result.current.startRecording(); });
  expect(result.current.state).toBe('countdown');

  await act(async () => { vi.advanceTimersByTime(3000); });
  expect(result.current.state).toBe('recording');
});
```

- [ ] **Step 2: Run + see fail**

Expected: state remains `'countdown'` after timer.

- [ ] **Step 3: Implement**

Extend the `.then` to start a 1-second countdown interval that, on hitting 0, constructs MediaRecorder and transitions to `'recording'`:

```ts
const recorderRef = useRef<MediaRecorder | null>(null);

// inside .then((stream) => { ... }), after setState('countdown'):
let secs = 3;
countdownTimerRef.current = setInterval(() => {
  secs -= 1;
  if (!mountedRef.current) return;
  if (secs > 0) { setCountdown(secs); return; }
  if (countdownTimerRef.current) { clearInterval(countdownTimerRef.current); countdownTimerRef.current = null; }
  const mime = negotiateMimeType(MediaRecorder.isTypeSupported.bind(MediaRecorder));
  if (mime === null) { setState('unsupported'); return; }
  const rec = new MediaRecorder(stream, { mimeType: mime });
  recorderRef.current = rec;
  rec.start();
  setState('recording');
}, 1000);
```

- [ ] **Step 4: Run + see pass**

Expected: 7 passed.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useRecorder.ts src/tests/useRecorder.test.ts
git commit -m "feat(mic): countdown -> recording transition after 3s"
```

---

### Task 5: stopRecording → done state with audioUrl

**Files:**
- Modify: `src/hooks/useRecorder.ts`
- Modify: `src/tests/useRecorder.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// inside main describe — add MockFileReader globally
beforeEach(() => {
  // ... existing
  (globalThis as unknown as { FileReader: unknown }).FileReader = MockFileReader;
});

it('stopRecording moves recording → done with audioUrl set', async () => {
  const fakeStream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: () => Promise.resolve(fakeStream) },
  });

  const { result } = renderHook(() => useRecorder());
  await act(async () => { result.current.startRecording(); });
  await act(async () => { vi.advanceTimersByTime(3000); });
  expect(result.current.state).toBe('recording');

  await act(async () => {
    result.current.stopRecording();
    await Promise.resolve();
    await Promise.resolve();
  });
  expect(result.current.state).toBe('done');
  expect(result.current.audioUrl).toMatch(/^data:audio\//);
  expect(result.current.audioBlob).toBeInstanceOf(Blob);
});
```

- [ ] **Step 2: Run + see fail**

Expected: state stays `'recording'`.

- [ ] **Step 3: Implement**

```ts
// inside the MediaRecorder construction block in Task 4, before rec.start():
rec.ondataavailable = (e) => {
  if (e.data && e.data.size > 0) (rec as unknown as { _chunks?: Blob[] })._chunks =
    [...((rec as unknown as { _chunks?: Blob[] })._chunks ?? []), e.data];
};
rec.onstop = () => {
  stream.getTracks().forEach((t) => t.stop());
  streamRef.current = null;
  const chunks = (rec as unknown as { _chunks?: Blob[] })._chunks ?? [];
  const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
  if (!mountedRef.current) return;
  setAudioBlob(blob);
  const reader = new FileReader();
  reader.onload = () => {
    if (!mountedRef.current) return;
    setAudioUrl(reader.result as string);
    setState('done');
  };
  reader.onerror = () => {
    if (!mountedRef.current) return;
    setError({ code: 'FileReaderError', message: "Couldn't save your recording." });
    setState('error');
  };
  reader.readAsDataURL(blob);
};

// replace empty stopRecording:
const stopRecording = useCallback(() => {
  const rec = recorderRef.current;
  if (rec && rec.state === 'recording') rec.stop();
}, []);
```

- [ ] **Step 4: Run + see pass**

Expected: 8 passed.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useRecorder.ts src/tests/useRecorder.test.ts
git commit -m "feat(mic): stopRecording -> done with FileReader audioUrl"
```

---

### Task 6: Permission denied state

**Files:**
- Modify: `src/hooks/useRecorder.ts`
- Modify: `src/tests/useRecorder.test.ts`

- [ ] **Step 1: Write failing test**

```ts
it('sets state=denied when getUserMedia rejects with NotAllowedError', async () => {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: () => Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' })),
    },
  });
  const { result } = renderHook(() => useRecorder());
  await act(async () => { result.current.startRecording(); await Promise.resolve(); });
  expect(result.current.state).toBe('denied');
  expect(result.current.micAvailable).toBe(false);
  expect(result.current.error?.code).toBe('NotAllowedError');
});
```

- [ ] **Step 2: Run + see fail**

Expected: state lands in `'requesting'` (no .catch wired).

- [ ] **Step 3: Implement**

Replace the empty `.catch(() => {})` with:

```ts
.catch((err: Error & { name?: string }) => {
  if (!mountedRef.current) return;
  const code = err.name ?? 'UnknownError';
  setMicAvailable(false);
  setError({ code, message: err.message });
  if (code === 'NotAllowedError' || code === 'PermissionDeniedError') {
    setState('denied');
  } else if (code === 'NotFoundError' || code === 'DevicesNotFoundError' || code === 'OverconstrainedError' || code === 'NotSupportedError') {
    setState('unsupported');
  } else {
    setState('error');
  }
});
```

- [ ] **Step 4: Run + see pass**

Expected: 9 passed.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useRecorder.ts src/tests/useRecorder.test.ts
git commit -m "feat(mic): permission denied -> state=denied with error code"
```

---

### Task 7: Unsupported — NotFoundError and missing API

**Files:**
- Modify: `src/tests/useRecorder.test.ts` (impl already covers these from Task 6)

- [ ] **Step 1: Write three failing tests**

```ts
it('sets state=unsupported when no mediaDevices on navigator', () => {
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: undefined });
  const { result } = renderHook(() => useRecorder());
  act(() => { result.current.startRecording(); });
  expect(result.current.state).toBe('unsupported');
  expect(result.current.micAvailable).toBe(false);
});

it('sets state=unsupported on NotFoundError', async () => {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: () => Promise.reject(Object.assign(new Error('no mic'), { name: 'NotFoundError' })) },
  });
  const { result } = renderHook(() => useRecorder());
  await act(async () => { result.current.startRecording(); await Promise.resolve(); });
  expect(result.current.state).toBe('unsupported');
});

it('sets state=unsupported when negotiateMimeType returns null', async () => {
  (MockMediaRecorder as unknown as { isTypeSupported: (m: string) => boolean }).isTypeSupported = () => false;
  const fakeStream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true, value: { getUserMedia: () => Promise.resolve(fakeStream) },
  });
  const { result } = renderHook(() => useRecorder());
  await act(async () => { result.current.startRecording(); });
  await act(async () => { vi.advanceTimersByTime(3000); });
  expect(result.current.state).toBe('unsupported');
  // restore for following tests
  (MockMediaRecorder as unknown as { isTypeSupported: (m: string) => boolean }).isTypeSupported =
    (m: string) => m.startsWith('audio/webm');
});
```

- [ ] **Step 2: Run + see pass**

Expected: 12 passed. Tasks 3 and 4 already handle these paths; the tests just lock them in.

- [ ] **Step 3: Commit**

```bash
git add src/tests/useRecorder.test.ts
git commit -m "test(mic): lock in unsupported paths (no API, no mic, no mime)"
```

---

### Task 8: Generic error path

**Files:**
- Modify: `src/tests/useRecorder.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('sets state=error on generic DOMException', async () => {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: () => Promise.reject(Object.assign(new Error('huh'), { name: 'NotReadableError' })) },
  });
  const { result } = renderHook(() => useRecorder());
  await act(async () => { result.current.startRecording(); await Promise.resolve(); });
  expect(result.current.state).toBe('error');
  expect(result.current.error?.code).toBe('NotReadableError');
  expect(result.current.error?.message).toBe('huh');
});
```

- [ ] **Step 2: Run + see pass**

Expected: 13 passed. (Task 6 implementation already covers the generic else branch.)

- [ ] **Step 3: Commit**

```bash
git add src/tests/useRecorder.test.ts
git commit -m "test(mic): generic error path covers non-denied, non-unsupported"
```

---

### Task 9: reset() function

**Files:**
- Modify: `src/hooks/useRecorder.ts`
- Modify: `src/tests/useRecorder.test.ts`

- [ ] **Step 1: Write failing test**

```ts
it('reset() returns hook to idle and stops in-flight resources', async () => {
  const trackStop = vi.fn();
  const fakeStream = { getTracks: () => [{ stop: trackStop }] } as unknown as MediaStream;
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true, value: { getUserMedia: () => Promise.resolve(fakeStream) },
  });
  const { result } = renderHook(() => useRecorder());
  await act(async () => { result.current.startRecording(); });
  await act(async () => { vi.advanceTimersByTime(3000); });
  expect(result.current.state).toBe('recording');

  act(() => { result.current.reset(); });
  expect(result.current.state).toBe('idle');
  expect(result.current.audioBlob).toBeNull();
  expect(result.current.audioUrl).toBeNull();
  expect(result.current.error).toBeNull();
  expect(trackStop).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run + see fail**

Expected: state stays `'recording'`.

- [ ] **Step 3: Implement**

Replace the empty `reset` callback:

```ts
const reset = useCallback(() => {
  if (countdownTimerRef.current) { clearInterval(countdownTimerRef.current); countdownTimerRef.current = null; }
  if (recorderRef.current && recorderRef.current.state !== 'inactive') {
    try { recorderRef.current.stop(); } catch (_) { /* ignore */ }
  }
  recorderRef.current = null;
  if (streamRef.current) {
    streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }
  if (audioUrl && audioUrl.startsWith('blob:')) {
    URL.revokeObjectURL(audioUrl);
  }
  setAudioBlob(null);
  setAudioUrl(null);
  setError(null);
  setCountdown(0);
  setState('idle');
  setMicAvailable(null);
}, [audioUrl]);
```

- [ ] **Step 4: Run + see pass**

Expected: 14 passed.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useRecorder.ts src/tests/useRecorder.test.ts
git commit -m "feat(mic): reset() returns hook to idle and stops resources"
```

---

### Task 10: playback() function

**Files:**
- Modify: `src/hooks/useRecorder.ts`
- Modify: `src/tests/useRecorder.test.ts`

- [ ] **Step 1: Write failing test**

```ts
it('playback() constructs Audio with audioUrl and calls unlockAudio', async () => {
  const trackStop = vi.fn();
  const fakeStream = { getTracks: () => [{ stop: trackStop }] } as unknown as MediaStream;
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true, value: { getUserMedia: () => Promise.resolve(fakeStream) },
  });

  const playSpy = vi.fn(() => Promise.resolve());
  const AudioCtor = vi.fn(function (this: { volume: number; play: () => Promise<void> }, _url: string) {
    this.volume = 0;
    this.play = playSpy;
  });
  (globalThis as unknown as { Audio: unknown }).Audio = AudioCtor;

  // import is local because the mock must be installed first; in real impl unlockAudio comes from '../lib/audio'
  vi.mock('../lib/audio.js', () => ({ unlockAudio: vi.fn() }));

  const { result } = renderHook(() => useRecorder());
  await act(async () => { result.current.startRecording(); });
  await act(async () => { vi.advanceTimersByTime(3000); });
  await act(async () => {
    result.current.stopRecording();
    await Promise.resolve(); await Promise.resolve();
  });
  expect(result.current.state).toBe('done');

  await act(async () => { await result.current.playback(); });
  expect(AudioCtor).toHaveBeenCalledWith(expect.stringMatching(/^data:audio\//));
  expect(playSpy).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run + see fail**

Expected: AudioCtor not called.

- [ ] **Step 3: Implement**

```ts
// at top of file:
import { unlockAudio } from '../lib/audio.js';

// replace empty playback:
const playback = useCallback(async () => {
  unlockAudio(); // synchronous — iOS audio session
  if (!audioUrl) return;
  const audio = new Audio(audioUrl);
  audio.volume = 1.0;
  try { await audio.play(); } catch (_) { /* logged via dbgWarn in consumer if needed */ }
}, [audioUrl]);
```

- [ ] **Step 4: Run + see pass**

Expected: 15 passed.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useRecorder.ts src/tests/useRecorder.test.ts
git commit -m "feat(mic): playback() uses unlockAudio + new Audio with volume=1"
```

---

### Task 11: Unmount cleanup + mountedRef pattern

**Files:**
- Modify: `src/tests/useRecorder.test.ts` (impl already in place from Task 3–5)

- [ ] **Step 1: Write failing tests**

```ts
it('does not setState after unmount during async getUserMedia resolve', async () => {
  let resolveGUM: (s: MediaStream) => void = () => {};
  const fakeStream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: () => new Promise<MediaStream>((r) => { resolveGUM = r; }) },
  });

  const { result, unmount } = renderHook(() => useRecorder());
  act(() => { result.current.startRecording(); });
  expect(result.current.state).toBe('requesting');

  unmount();
  // Now resolve getUserMedia — should not throw, should not setState
  await act(async () => { resolveGUM(fakeStream); await Promise.resolve(); });
  // No assertion needed — test passes if no React "can't setState on unmounted" warning fires.
});

it('cleanup on unmount stops stream tracks and clears timers', async () => {
  const trackStop = vi.fn();
  const fakeStream = { getTracks: () => [{ stop: trackStop }] } as unknown as MediaStream;
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true, value: { getUserMedia: () => Promise.resolve(fakeStream) },
  });
  const { result, unmount } = renderHook(() => useRecorder());
  await act(async () => { result.current.startRecording(); });
  // Now mid-countdown
  unmount();
  expect(trackStop).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run + see fail**

Expected: track.stop not called on unmount (cleanup effect not implemented yet).

- [ ] **Step 3: Implement cleanup useEffect**

Replace the existing `useEffect(() => () => { mountedRef.current = false; }, [])` with:

```ts
useEffect(() => {
  return () => {
    mountedRef.current = false;
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try { recorderRef.current.stop(); } catch (_) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioUrl && audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

- [ ] **Step 4: Run + see pass**

Expected: 17 passed.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useRecorder.ts src/tests/useRecorder.test.ts
git commit -m "feat(mic): unmount cleanup stops tracks, timers, and reader writes"
```

---

### Task 12: Re-entrancy guard

**Files:**
- Modify: `src/tests/useRecorder.test.ts`

- [ ] **Step 1: Write failing test**

```ts
it('double-tap startRecording is a no-op for the second call', async () => {
  let calls = 0;
  const fakeStream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: () => { calls += 1; return Promise.resolve(fakeStream); } },
  });

  const { result } = renderHook(() => useRecorder());
  await act(async () => {
    result.current.startRecording();
    result.current.startRecording();
  });
  expect(calls).toBe(1);
});
```

- [ ] **Step 2: Run + see pass**

Expected: 18 passed. (Task 3 implementation already guards against state !== 'idle'.)

- [ ] **Step 3: Commit**

```bash
git add src/tests/useRecorder.test.ts
git commit -m "test(mic): re-entrancy guard prevents double getUserMedia calls"
```

---

### Task 13: Coverage gate — confirm useRecorder.ts ≥ 90% branches

**Files:** none modified — verification only.

- [ ] **Step 1: Run coverage on the hook**

Run:
```bash
npx vitest run src/tests/useRecorder.test.ts --coverage
```

- [ ] **Step 2: Inspect useRecorder.ts coverage row**

Expected: `useRecorder.ts` row shows ≥ 90% on Branches column. If below, add tests for the uncovered branches — these are most likely error paths inside `onstop` or the FileReader `onerror` callback. Do NOT lower the threshold.

- [ ] **Step 3: If gap exists, add the missing test(s) then re-run.**

Example test for FileReader.onerror branch:

```ts
it('sets state=error when FileReader fails to encode blob', async () => {
  class BrokenFileReader {
    result: string | null = null;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    readAsDataURL() { queueMicrotask(() => this.onerror?.()); }
  }
  (globalThis as unknown as { FileReader: unknown }).FileReader = BrokenFileReader;
  // ... drive recorder to done as in Task 5 ...
  expect(result.current.state).toBe('error');
  expect(result.current.error?.code).toBe('FileReaderError');
});
```

- [ ] **Step 4: Commit (if anything changed)**

```bash
git add src/tests/useRecorder.test.ts
git commit -m "test(mic): coverage gate — useRecorder.ts >= 90% branches"
```

---

### Task 14: Platform helper extension

**Files:**
- Modify: `src/lib/platform.ts`
- Create: `src/tests/platform.test.ts` (or extend an existing one if present — check first)

- [ ] **Step 1: Inspect existing file**

Run: `grep -n "export function\|isNative\|isIOS\|isAndroid" src/lib/platform.ts`

Note which helpers already exist; reuse them.

- [ ] **Step 2: Write failing tests**

```ts
// src/tests/platform.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { getMicPermissionPlatform } from '../lib/platform';

describe('getMicPermissionPlatform', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  function setUA(ua: string) {
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: ua });
  }

  it('returns ios-safari on iOS Safari UA', () => {
    setUA('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1');
    expect(getMicPermissionPlatform()).toBe('ios-safari');
  });

  it('returns android-browser on Android Chrome UA', () => {
    setUA('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36');
    expect(getMicPermissionPlatform()).toBe('android-browser');
  });

  it('returns desktop on Mac Chrome UA', () => {
    setUA('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36');
    expect(getMicPermissionPlatform()).toBe('desktop');
  });
});
```

(The ios-app and android-app cases require mocking the Capacitor isNative helper. Use vi.mock on the import.)

- [ ] **Step 3: Run + see fail**

Expected: Cannot find export `getMicPermissionPlatform`.

- [ ] **Step 4: Implement**

```ts
// src/lib/platform.ts — append
import { isNative } from './platform'; // reuse existing helper if present

export type MicPermissionPlatform =
  | 'ios-safari' | 'ios-app'
  | 'android-browser' | 'android-app'
  | 'desktop';

export function getMicPermissionPlatform(): MicPermissionPlatform {
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const native = typeof isNative === 'function' ? isNative() : false;
  if (isIOS) return native ? 'ios-app' : 'ios-safari';
  if (isAndroid) return native ? 'android-app' : 'android-browser';
  return 'desktop';
}
```

(If `isNative` is not imported in this file already, import it from wherever the existing detection lives — check the file first.)

- [ ] **Step 5: Run + see pass**

Expected: 3 passed.

- [ ] **Step 6: Commit**

```bash
git add src/lib/platform.ts src/tests/platform.test.ts
git commit -m "feat(platform): add getMicPermissionPlatform() for mic explainer routing"
```

---

### Task 15: MicPermissionDeniedExplainer component

**Files:**
- Create: `src/components/shared/MicPermissionDeniedExplainer.tsx`
- Create: `src/tests/MicPermissionDeniedExplainer.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// src/tests/MicPermissionDeniedExplainer.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MicPermissionDeniedExplainer from '../components/shared/MicPermissionDeniedExplainer';

const platformMock = vi.fn();
vi.mock('../lib/platform', () => ({
  getMicPermissionPlatform: () => platformMock(),
}));

describe('MicPermissionDeniedExplainer', () => {
  beforeEach(() => platformMock.mockReset());

  it('renders iOS Safari instructions when platform is ios-safari', () => {
    platformMock.mockReturnValue('ios-safari');
    render(<MicPermissionDeniedExplainer onRetry={() => {}} />);
    expect(screen.getByText(/Settings.*Safari.*Microphone/)).toBeInTheDocument();
  });

  it('renders iOS app instructions when platform is ios-app', () => {
    platformMock.mockReturnValue('ios-app');
    render(<MicPermissionDeniedExplainer onRetry={() => {}} />);
    expect(screen.getByText(/Settings.*Na.a Hrvatska.*Microphone/)).toBeInTheDocument();
  });

  it('renders Android Chrome instructions when platform is android-browser', () => {
    platformMock.mockReturnValue('android-browser');
    render(<MicPermissionDeniedExplainer onRetry={() => {}} />);
    expect(screen.getByText(/lock icon.*Permissions.*Microphone/)).toBeInTheDocument();
  });

  it('Try Again button calls onRetry', () => {
    platformMock.mockReturnValue('desktop');
    const onRetry = vi.fn();
    render(<MicPermissionDeniedExplainer onRetry={onRetry} />);
    fireEvent.click(screen.getByText(/Try Again/));
    expect(onRetry).toHaveBeenCalled();
  });

  it('Use writing instead is hidden when onUseWriting prop is undefined', () => {
    platformMock.mockReturnValue('desktop');
    render(<MicPermissionDeniedExplainer onRetry={() => {}} />);
    expect(screen.queryByText(/Use writing instead/)).toBeNull();
  });

  it('Use writing instead calls onUseWriting prop', () => {
    platformMock.mockReturnValue('desktop');
    const onUseWriting = vi.fn();
    render(<MicPermissionDeniedExplainer onRetry={() => {}} onUseWriting={onUseWriting} />);
    fireEvent.click(screen.getByText(/Use writing instead/));
    expect(onUseWriting).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run + see fail**

Expected: Cannot find module `MicPermissionDeniedExplainer`.

- [ ] **Step 3: Implement**

```tsx
// src/components/shared/MicPermissionDeniedExplainer.tsx
import React from 'react';
import { getMicPermissionPlatform } from '../../lib/platform';

const INSTRUCTIONS: Record<string, string> = {
  'ios-safari': 'Open Settings → Safari → Microphone → enable for nasahrvatska.com',
  'ios-app': 'Open Settings → Naša Hrvatska → Microphone → enable',
  'android-browser': 'Tap the lock icon in the URL bar → Permissions → Microphone → Allow',
  'android-app': 'Open Settings → Apps → Naša Hrvatska → Permissions → Microphone → Allow',
  'desktop': 'Click the lock or permission icon next to the URL and re-enable Microphone.',
};

interface Props {
  onRetry: () => void;
  onUseWriting?: () => void;
}

export default function MicPermissionDeniedExplainer({ onRetry, onUseWriting }: Props) {
  const platform = getMicPermissionPlatform();
  const text = INSTRUCTIONS[platform] ?? INSTRUCTIONS['desktop'];
  return (
    <div role="alert" style={{ padding: 16, border: '1px solid #f59e0b', borderRadius: 12, background: '#fffbeb', marginTop: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#92400e', marginBottom: 8 }}>
        🎤 Microphone access is blocked
      </div>
      <div style={{ fontSize: 14, color: '#78350f', marginBottom: 12 }}>{text}</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={onRetry} style={{ padding: '8px 14px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
          Try Again
        </button>
        {onUseWriting && (
          <button onClick={onUseWriting} style={{ padding: '8px 14px', background: 'transparent', color: '#92400e', border: '1px solid #f59e0b', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
            Use writing instead
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run + see pass**

Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/shared/MicPermissionDeniedExplainer.tsx src/tests/MicPermissionDeniedExplainer.test.tsx
git commit -m "feat(mic): MicPermissionDeniedExplainer with per-OS instructions"
```

---

### Tasks 16–24: Consumer migrations

Each of the 9 consumer migrations follows the SAME 5-step pattern. The pattern is documented once below; the per-file details follow.

**Pattern for each consumer:**

- [ ] **Step 1: Write the failing integration test**

```tsx
// src/tests/<consumer>-mic.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import <Consumer> from '../components/<path>/<Consumer>';

const recorderMock = vi.fn();
vi.mock('../hooks/useRecorder', () => ({ useRecorder: () => recorderMock() }));

function recorderState(overrides = {}) {
  return {
    state: 'idle', micAvailable: null, audioBlob: null, audioUrl: null,
    countdown: 0, error: null,
    startRecording: vi.fn(), stopRecording: vi.fn(),
    playback: vi.fn(), reset: vi.fn(),
    ...overrides,
  };
}

describe('<Consumer> mic states', () => {
  it.each([
    ['idle', /record|start/i],
    ['countdown', /\d/],
    ['recording', /stop/i],
    ['done', /playback|listen|next/i],
    ['denied', /Microphone access is blocked/],
    ['unsupported', /writing instead|no microphone/i],
    ['error', /Try Again|Couldn't/i],
  ] as const)('shows correct UI for state=%s', (state, expectedText) => {
    recorderMock.mockReturnValue(recorderState({ state }));
    render(<<Consumer> /* required props */ />);
    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run + see fail**

Expected: states don't render the right UI (since the consumer still uses its own local mic logic).

- [ ] **Step 3: Migrate the consumer**

Replace the consumer's local mic code with `const recorder = useRecorder();` and render branches keyed off `recorder.state`. The `denied` branch renders `<MicPermissionDeniedExplainer onRetry={recorder.reset} onUseWriting={...}/>`. The `unsupported` and `error` branches render fallback text + Try Again. Old MediaRecorder/getUserMedia code is deleted.

- [ ] **Step 4: Run + see pass**

Expected: 7 passed (one per state).

- [ ] **Step 5: Commit**

```bash
git add src/components/<path>/<Consumer>.tsx src/tests/<consumer>-mic.test.tsx
git commit -m "refactor(mic): <Consumer> uses shared useRecorder hook"
```

---

### Task 16: Migrate ShadowingScreen

Follow the pattern above. Specifics:

**File:** `src/components/practice/ShadowingScreen.tsx`
**Existing local hook:** lines 71–198 (local `useRecorder()` function — DELETE entirely; replace with `import { useRecorder } from '../../hooks/useRecorder'`).
**Test file:** `src/tests/shadowingMic.test.tsx`
**Writing fallback:** existing `handleNailedIt()` (the "🎤 I Said It!" button) — preserve as the explainer's `onUseWriting` callback.

Commit message: `refactor(mic): ShadowingScreen uses shared useRecorder hook`

---

### Task 17: Migrate SpeakingSprintScreen

**File:** `src/components/practice/SpeakingSprintScreen.tsx`
**Existing mic state:** `const [micDenied, setMicDenied] = useState(false)` (line 231) plus the mic flow that sets it.
**Test file:** `src/tests/speakingSprintMic.test.tsx`
**Writing fallback:** not applicable for a sprint — explainer renders without the writing button (`onUseWriting` omitted).

Commit: `refactor(mic): SpeakingSprintScreen uses shared useRecorder hook`

---

### Task 18: Migrate SpeakingScreen

**File:** `src/components/practice/SpeakingScreen.tsx`
**Test file:** `src/tests/speakingScreenMic.test.tsx`
**Writing fallback:** route to existing `WritingScreen` via `setScr('writing')` if available; else omit.

Commit: `refactor(mic): SpeakingScreen uses shared useRecorder hook`

---

### Task 19: Migrate SpeakingPracticePanel

**File:** `src/components/practice/SpeakingPracticePanel.tsx`
**Test file:** `src/tests/speakingPracticePanelMic.test.tsx`

Commit: `refactor(mic): SpeakingPracticePanel uses shared useRecorder hook`

---

### Task 20: Migrate PronunciationScorer

**File:** `src/components/shared/PronunciationScorer.tsx`
**Note:** this component is consumed by ShadowingScreen and others. The mic flow drives a scoring algorithm — the audioBlob from `useRecorder` is passed into the existing scoring fn. Tests should verify that on `state === 'done'`, the scoring function is called with the recorded blob.
**Test file:** `src/tests/pronunciationScorerMic.test.tsx`

Commit: `refactor(mic): PronunciationScorer uses shared useRecorder hook`

---

### Task 21: Migrate GradedInputScreen

**File:** `src/components/learn/GradedInputScreen.tsx`
**Existing recorder:** `mediaRecorderRef = useRef<MediaRecorder | null>(null)` (line 284) plus full local MediaRecorder flow.
**Test file:** `src/tests/gradedInputMic.test.tsx`

Commit: `refactor(mic): GradedInputScreen uses shared useRecorder hook`

---

### Task 22: useWhisperSTT layers on useRecorder

**Files:**
- Modify: `src/hooks/useWhisperSTT.js`
- Create: `src/tests/useWhisperSTT.test.ts`

This is a small, focused refactor — strip the local mic logic from `useWhisperSTT` and replace it with `useRecorder()`. Whisper-specific behavior (POST to `/api/whisper`, transcript handling) is layered on top of `useRecorder.state === 'done'`.

- [ ] **Step 1: Write failing test**

```ts
// src/tests/useWhisperSTT.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useWhisperSTT from '../hooks/useWhisperSTT';

const recorderMock = vi.fn();
vi.mock('../hooks/useRecorder', () => ({ useRecorder: () => recorderMock() }));

describe('useWhisperSTT', () => {
  beforeEach(() => { recorderMock.mockReset(); });

  it('POSTs audioBlob to /api/whisper when recorder state goes to done', async () => {
    const fetchSpy = vi.fn(async () => ({ ok: true, json: async () => ({ text: 'bok' }) }));
    (globalThis as unknown as { fetch: unknown }).fetch = fetchSpy;
    const fakeBlob = new Blob(['fake'], { type: 'audio/webm' });
    recorderMock.mockReturnValue({
      state: 'done', audioBlob: fakeBlob, audioUrl: 'data:audio/webm;base64,X',
      startRecording: vi.fn(), stopRecording: vi.fn(), playback: vi.fn(), reset: vi.fn(),
      error: null, micAvailable: true, countdown: 0,
    });
    const { result } = renderHook(() => useWhisperSTT());
    await act(async () => { await Promise.resolve(); });
    expect(fetchSpy).toHaveBeenCalledWith('/api/whisper', expect.objectContaining({ method: 'POST' }));
    expect(result.current.transcript).toBe('bok');
  });

  it('preserves recording when transcription fails', async () => {
    const fetchSpy = vi.fn(async () => ({ ok: false, json: async () => ({}) }));
    (globalThis as unknown as { fetch: unknown }).fetch = fetchSpy;
    const fakeBlob = new Blob(['fake'], { type: 'audio/webm' });
    recorderMock.mockReturnValue({
      state: 'done', audioBlob: fakeBlob, audioUrl: 'data:audio/webm;base64,X',
      startRecording: vi.fn(), stopRecording: vi.fn(), playback: vi.fn(), reset: vi.fn(),
      error: null, micAvailable: true, countdown: 0,
    });
    const { result } = renderHook(() => useWhisperSTT());
    await act(async () => { await Promise.resolve(); });
    expect(result.current.transcript).toBeNull();
    expect(result.current.audioBlob).toBe(fakeBlob); // recording preserved
  });
});
```

- [ ] **Step 2: Run + see fail**

Expected: useWhisperSTT still uses its own mic logic, not useRecorder.

- [ ] **Step 3: Rewrite useWhisperSTT**

```js
// src/hooks/useWhisperSTT.js
import { useState, useEffect } from 'react';
import { useRecorder } from './useRecorder';

export default function useWhisperSTT() {
  const recorder = useRecorder();
  const [transcript, setTranscript] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  useEffect(() => {
    if (recorder.state !== 'done' || !recorder.audioBlob) return;
    let cancelled = false;
    setIsTranscribing(true);
    const fd = new FormData();
    fd.append('audio', recorder.audioBlob);
    fetch('/api/whisper', { method: 'POST', body: fd })
      .then(async (r) => {
        if (!r.ok) throw new Error('whisper failed');
        const data = await r.json();
        if (!cancelled) setTranscript(data.text || null);
      })
      .catch(() => { if (!cancelled) setTranscript(null); })
      .finally(() => { if (!cancelled) setIsTranscribing(false); });
    return () => { cancelled = true; };
  }, [recorder.state, recorder.audioBlob]);

  return { ...recorder, transcript, isTranscribing };
}
```

- [ ] **Step 4: Run + see pass**

Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useWhisperSTT.js src/tests/useWhisperSTT.test.ts
git commit -m "refactor(mic): useWhisperSTT layers on useRecorder, drops local MediaRecorder"
```

---

### Task 23: Migrate AIConversation

**File:** `src/components/croatia/AIConversation.tsx`
**Test file:** `src/tests/aiConversationMic.test.tsx`
**Note:** This consumer uses `useWhisperSTT` (already refactored in Task 22). Verify the screen renders correct UI per state and that the transcript flows through to the AI message-send path.

Commit: `refactor(mic): AIConversation consumes useWhisperSTT layered on useRecorder`

---

### Task 24: Migrate LiveTutorScreen

**File:** `src/components/croatia/LiveTutorScreen.tsx`
**Test file:** `src/tests/liveTutorMic.test.tsx`

Commit: `refactor(mic): LiveTutorScreen consumes useWhisperSTT layered on useRecorder`

---

### Task 25: Migrate MajaScreen

**File:** `src/components/croatia/MajaScreen.tsx`
**Test file:** `src/tests/majaMic.test.tsx`

Commit: `refactor(mic): MajaScreen consumes useWhisperSTT layered on useRecorder`

---

### Task 26: Playwright e2e — mic recording cross-browser

**File:** Create `e2e/mic-recording.spec.js`

- [ ] **Step 1: Write the spec**

```js
// e2e/mic-recording.spec.js
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS } from './fixtures/seed-auth.js';

test.describe('SP4a — mic recording cross-browser', () => {
  test.beforeEach(async ({ page, context }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await context.grantPermissions(['microphone']);
    await page.goto('/practice');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 15_000 });
  });

  test('granted mic: Shadowing record → playback flow renders without error', async ({ page }) => {
    // Navigate to ShadowingScreen via Practice tab → Shadowing card
    const card = page.getByText(/Shadowing/i).first();
    await card.waitFor({ state: 'visible', timeout: 8_000 });
    await card.click();
    // Expect the record button to be visible (idle state)
    await expect(page.getByText(/Listen|Record|Practice/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('denied mic: explainer appears on Shadowing when permission denied', async ({ page, context }) => {
    await context.clearPermissions();
    const card = page.getByText(/Shadowing/i).first();
    await card.waitFor({ state: 'visible', timeout: 8_000 });
    await card.click();
    // Click Record — should trigger explainer
    const recordBtn = page.getByText(/Record|Start/i).first();
    if (await recordBtn.isVisible()) await recordBtn.click();
    await expect(page.getByText(/Microphone access is blocked/i)).toBeVisible({ timeout: 8_000 });
  });
});
```

- [ ] **Step 2: Run the e2e spec on Desktop Chrome**

Run:
```bash
npx playwright test mic-recording.spec.js --project="Desktop Chrome"
```

Expected: 2 passed.

- [ ] **Step 3: Run on all 5 projects (CI parity)**

Run:
```bash
npx playwright test mic-recording.spec.js
```

Expected: 10 passed (2 tests × 5 projects). Investigate any failures per project (mobile WebKit may need extra wait time).

- [ ] **Step 4: Commit**

```bash
git add e2e/mic-recording.spec.js
git commit -m "test(e2e): SP4a mic recording cross-browser spec"
```

---

### Task 27: Acceptance gate verification

**Files:** none modified — verification only.

- [ ] **Step 1: Grep for orphan getUserMedia calls**

Run:
```bash
grep -rn "getUserMedia\|new MediaRecorder" src/ | grep -v "src/hooks/useRecorder.ts" | grep -v "src/tests/"
```

Expected: empty output (zero matches). If any match exists, that file was missed in migration — return to the appropriate task.

- [ ] **Step 2: Run full unit test suite**

Run: `npx vitest run`
Expected: all green, no skipped contract tests added by this work.

- [ ] **Step 3: Run full suite with coverage**

Run: `npx vitest run --coverage`
Expected:
- `useRecorder.ts` branches ≥ 90%
- Global branches ≥ 80% (the threshold the SP4a spec refused to lower)
- All threshold rows pass

- [ ] **Step 4: Run e2e mic spec across all 5 projects**

Run: `npx playwright test mic-recording.spec.js`
Expected: 10 passed.

- [ ] **Step 5: Add follow-up section to the spec**

Append to `docs/superpowers/specs/2026-05-14-sp4a-mic-reliability-design.md`:

```markdown
## Follow-up — verification record

| Platform | Automated | Manual verified |
|---|---|---|
| Desktop Chrome | ✅ Playwright | n/a |
| Desktop Firefox | ✅ Playwright | n/a |
| Desktop Safari (WebKit) | ✅ Playwright | n/a |
| Android Chrome (Pixel 5 emulation) | ✅ Playwright | n/a |
| iPad Safari (iPad Pro emulation) | ✅ Playwright | n/a |
| iOS Safari (real device) | ❌ not in CI | TBD by jschr |
| iOS Capacitor app (real iPhone) | ❌ not in CI | TBD by jschr |
| Android Capacitor app (real Pixel) | ❌ not in CI | TBD by jschr |

Real-device verification (last 3 rows) is documented but not automated. After SP4a ships, jschr verifies on at least one real iOS device and one real Android device before SP4b begins.
```

- [ ] **Step 6: Commit and push**

```bash
git add docs/superpowers/specs/2026-05-14-sp4a-mic-reliability-design.md
git commit -m "docs(sp4a): acceptance-gate verification record"
git push origin master
```

---

## Self-Review checklist (executor runs before declaring SP4a complete)

- [ ] All 27 tasks committed with their TDD steps in order
- [ ] Coverage gate passes: `useRecorder.ts` branches ≥ 90%, global branches ≥ 80%
- [ ] `grep -rn "getUserMedia" src/` shows only the hook file (no orphans)
- [ ] Playwright `mic-recording.spec.js` passes on all 5 projects
- [ ] Spec follow-up section filled in with real verification matrix
- [ ] No lint errors, no `@ts-nocheck`, no `any` (SP3 invariants preserved)
- [ ] No coverage threshold drops in `vitest.config.js`
- [ ] No skipped tests added by this work without explicit justification
