# soundSettings.ts Coverage Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise `src/lib/soundSettings.ts` branch coverage from 58% to ≥80% by adding targeted tests for the 11 untested catch-block branches.

**Architecture:** All new tests are appended to the existing `src/tests/soundSettings.test.js` file in three new `describe` blocks — one for localStorage error resilience, one for AudioContext error resilience, and one for haptic error resilience. No production code changes are needed; the catch blocks already exist and are correct. We are only adding test coverage for them.

**Tech Stack:** Vitest, `vi.spyOn(Storage.prototype, ...)`, `vi.fn().mockImplementation(...)`, jsdom `Object.defineProperty`

---

## Context for the implementer

### What soundSettings.ts contains (194 lines, `src/lib/soundSettings.ts`)

Three groups of functions:

**Preference functions** — read/write localStorage; each has a `try/catch` that swallows errors or returns a safe default:
- `getVoicePreference()` → catch returns `'gabrijela'` (line 15)
- `setVoicePreference()` → catch swallows (line 28)
- `isSoundEnabled()` → catch returns `true` (line 35)
- `setSoundEnabled()` → catch swallows (line 43)
- `isHapticEnabled()` → catch returns `true` (line 50)
- `setHapticEnabled()` → catch swallows (line 58)

**Audio functions** — create Web Audio API oscillators; each has a `try/catch` that swallows errors:
- `playTone()` → catch at line 105
- `playFanfare()` → catch at line 139
- `playLevelUp()` → catch at line 163
- `playStreak()` → catch at line 185

**Haptic function**:
- `haptic()` → catch at line 192 wraps `navigator.vibrate?.()`

### What the existing tests already cover

The existing test file (`src/tests/soundSettings.test.js`, 295 lines) has three `describe` blocks:
1. `soundSettings — preferences persistence` (27 tests) — covers normal get/set paths
2. `soundSettings — audio functions (smoke tests)` (10 tests) — covers enabled/disabled paths using a MockAudioContext
3. `soundSettings — haptic` (3 tests) — covers disabled/enabled/undefined-vibrate paths

The `setupAudioContextMock()` / `teardownAudioContextMock()` helpers are already defined at module scope. The `mockAudioCtxInstance` object is also at module scope. New tests in the AudioContext error block should **reuse these helpers** and also manipulate `mockAudioCtxInstance.createOscillator`.

### How to trigger localStorage errors in jsdom

```javascript
vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
  throw new Error('QuotaExceededError');
});
// After test:
vi.restoreAllMocks(); // restores the original getItem
```

`localStorage.clear()` (used in `clearLS()`) is on `Storage.prototype.clear` — it is NOT affected by mocking `getItem` or `setItem`, so the `clearLS()` afterEach still works.

### The module-level `_audioCtx` cache

`soundSettings.ts` caches the AudioContext instance in `let _audioCtx`. Tests reset this by setting `mockAudioCtxInstance.state = 'closed'` in `setupAudioContextMock()`, which forces `getAudioCtx()` to call `new AudioCtx()` again. Audio error tests must call `setupAudioContextMock()` before manipulating `mockAudioCtxInstance.createOscillator`.

---

## File Structure

**Modify only:**
- `src/tests/soundSettings.test.js` — append three new `describe` blocks after the existing `haptic` describe block

---

### Task 1: localStorage error resilience — preference getter catch blocks

These tests verify that when `localStorage.getItem` throws (e.g., in a private-browsing context with storage disabled), the preference getters return their safe defaults instead of crashing.

**Files:**
- Modify: `src/tests/soundSettings.test.js`

- [ ] **Step 1: Append the new describe block to the test file**

Open `src/tests/soundSettings.test.js`. After the closing `});` of the existing `soundSettings — haptic` describe block (line 294), append exactly:

```javascript
// ── localStorage error resilience (getter catch blocks) ──────────────────────

describe('soundSettings — localStorage error resilience (getters)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('getVoicePreference returns gabrijela when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(getVoicePreference()).toBe('gabrijela');
  });

  it('isSoundEnabled returns true when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(isSoundEnabled()).toBe(true);
  });

  it('isHapticEnabled returns true when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(isHapticEnabled()).toBe(true);
  });
});
```

- [ ] **Step 2: Run only the new describe block to verify these three tests pass**

```
npx vitest run src/tests/soundSettings.test.js --reporter=verbose
```

Expected: All tests in the file pass. The three new tests should show as green.

- [ ] **Step 3: Commit**

```bash
git -c core.tmpdir=/tmp add src/tests/soundSettings.test.js
git -c core.tmpdir=/tmp commit -m "test(coverage): localStorage getter catch blocks in soundSettings"
```

---

### Task 2: localStorage error resilience — setter catch blocks

These tests verify that when `localStorage.setItem` (or `removeItem`) throws, the setter functions swallow the error silently instead of propagating it.

**Files:**
- Modify: `src/tests/soundSettings.test.js`

- [ ] **Step 1: Append the setter catch block describe block**

After the closing `});` of the Task 1 describe block, append:

```javascript
// ── localStorage error resilience (setter catch blocks) ──────────────────────

describe('soundSettings — localStorage error resilience (setters)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('setVoicePreference does not throw when localStorage.setItem throws (charlotte path)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    // 'charlotte' path calls localStorage.setItem — must be swallowed
    expect(() => setVoicePreference('charlotte')).not.toThrow();
  });

  it('setVoicePreference does not throw when localStorage.removeItem throws (gabrijela path)', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    // non-charlotte path calls localStorage.removeItem — must be swallowed
    expect(() => setVoicePreference('gabrijela')).not.toThrow();
  });

  it('setSoundEnabled does not throw when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => setSoundEnabled(false)).not.toThrow();
  });

  it('setHapticEnabled does not throw when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => setHapticEnabled(false)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the test file to verify all tests pass**

```
npx vitest run src/tests/soundSettings.test.js --reporter=verbose
```

Expected: All tests pass, including the 4 new setter catch tests.

- [ ] **Step 3: Commit**

```bash
git -c core.tmpdir=/tmp add src/tests/soundSettings.test.js
git -c core.tmpdir=/tmp commit -m "test(coverage): localStorage setter catch blocks in soundSettings"
```

---

### Task 3: AudioContext error resilience — audio function catch blocks

These tests verify that when the Web Audio API throws (e.g., `createOscillator` fails because audio context is in a bad state), the audio functions catch the error silently instead of crashing.

**Key implementation detail:** The `mockAudioCtxInstance` object is shared across all audio tests. Mutating `createOscillator` in one test will affect subsequent tests if not restored. Always restore via `vi.restoreAllMocks()` or by resetting the mock implementation in `afterEach`.

**Files:**
- Modify: `src/tests/soundSettings.test.js`

- [ ] **Step 1: Append the AudioContext error describe block**

After the closing `});` of the Task 2 describe block, append:

```javascript
// ── AudioContext error resilience (audio function catch blocks) ───────────────

describe('soundSettings — AudioContext error resilience', () => {
  beforeEach(() => {
    localStorage.clear();
    setSoundEnabled(true); // ensure sound is on so the try block is entered
    setupAudioContextMock(); // stubs window.AudioContext + resets _audioCtx cache
  });
  afterEach(() => {
    localStorage.clear();
    teardownAudioContextMock(); // vi.unstubAllGlobals() + vi.clearAllMocks()
    // Reset createOscillator to original vi.fn() (clearAllMocks already does this)
    mockAudioCtxInstance.createOscillator.mockRestore?.();
  });

  it('playTone does not throw when AudioContext.createOscillator throws', () => {
    mockAudioCtxInstance.createOscillator.mockImplementation(() => {
      throw new Error('AudioContext: createOscillator failed');
    });
    expect(() => playTone({ freq: 440 })).not.toThrow();
  });

  it('playFanfare does not throw when AudioContext.createOscillator throws', () => {
    mockAudioCtxInstance.createOscillator.mockImplementation(() => {
      throw new Error('AudioContext: createOscillator failed');
    });
    expect(() => playFanfare()).not.toThrow();
  });

  it('playLevelUp does not throw when AudioContext.createOscillator throws', () => {
    mockAudioCtxInstance.createOscillator.mockImplementation(() => {
      throw new Error('AudioContext: createOscillator failed');
    });
    expect(() => playLevelUp()).not.toThrow();
  });

  it('playStreak does not throw when AudioContext.createOscillator throws', () => {
    mockAudioCtxInstance.createOscillator.mockImplementation(() => {
      throw new Error('AudioContext: createOscillator failed');
    });
    expect(() => playStreak()).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the test file to verify all tests pass**

```
npx vitest run src/tests/soundSettings.test.js --reporter=verbose
```

Expected: All tests pass. The 4 new AudioContext error tests should be green.

- [ ] **Step 3: Commit**

```bash
git -c core.tmpdir=/tmp add src/tests/soundSettings.test.js
git -c core.tmpdir=/tmp commit -m "test(coverage): AudioContext catch blocks in soundSettings audio functions"
```

---

### Task 4: Haptic error resilience + full coverage verification

This final task adds one test for the `haptic()` catch block, then runs the full coverage report to verify the 80% threshold is met across all metrics.

**Files:**
- Modify: `src/tests/soundSettings.test.js`

- [ ] **Step 1: Append the haptic error describe block**

After the closing `});` of the Task 3 describe block, append:

```javascript
// ── haptic error resilience ───────────────────────────────────────────────────

describe('soundSettings — haptic error resilience', () => {
  beforeEach(() => {
    localStorage.clear();
    setHapticEnabled(true); // ensure haptic is on so the try block is entered
  });
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    // Restore navigator.vibrate to undefined (jsdom default)
    Object.defineProperty(navigator, 'vibrate', {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  it('haptic does not throw when navigator.vibrate throws', () => {
    Object.defineProperty(navigator, 'vibrate', {
      value: () => { throw new Error('vibrate not permitted'); },
      configurable: true,
      writable: true,
    });
    expect(() => haptic(100)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the full test suite with coverage to verify thresholds are met**

```
npx vitest run --coverage --reporter=verbose 2>&1 | tail -60
```

Expected output (approximate): No `ERROR: Coverage for branches` line. The soundSettings.ts row should show branches ≥ 80%. Overall branch coverage ≥ 80%.

If coverage is still below 80% for soundSettings.ts specifically, run:

```
npx vitest run --coverage --reporter=verbose 2>&1 | grep soundSettings
```

And compare against the branch column.

- [ ] **Step 3: Commit**

```bash
git -c core.tmpdir=/tmp add src/tests/soundSettings.test.js
git -c core.tmpdir=/tmp commit -m "test(coverage): haptic catch block + all soundSettings branches ≥80%"
```

- [ ] **Step 4: Push to master**

```bash
git -c core.tmpdir=/tmp push origin master
```

Expected: Cloudflare Pages deploy triggered. CI "Unit Tests" job passes.

---

## Self-Review

### Spec coverage
- `getVoicePreference` catch → Task 1 ✓
- `isSoundEnabled` catch → Task 1 ✓
- `isHapticEnabled` catch → Task 1 ✓
- `setVoicePreference` catch (setItem + removeItem paths) → Task 2 ✓
- `setSoundEnabled` catch → Task 2 ✓
- `setHapticEnabled` catch → Task 2 ✓
- `playTone` catch → Task 3 ✓
- `playFanfare` catch → Task 3 ✓
- `playLevelUp` catch → Task 3 ✓
- `playStreak` catch → Task 3 ✓
- `haptic` catch → Task 4 ✓
- Coverage verification ≥ 80% → Task 4 ✓

### Placeholder scan
None found. Every test contains exact function calls, exact mock implementations, and exact expected values.

### Type consistency
No types involved — tests are `.js` (matching the existing file format).

### Risk notes
- `teardownAudioContextMock()` calls `vi.clearAllMocks()` which resets all mock call counts including `createOscillator`. The `mockImplementation` mutation set in each test is reset by `clearAllMocks()`. No cross-test contamination.
- `vi.spyOn(Storage.prototype, 'getItem')` is a spy wrapping the prototype — `vi.restoreAllMocks()` in afterEach fully restores it. The clearLS() call in afterEach uses `localStorage.clear()` (not `getItem` or `setItem`), so it is unaffected by these spies.
- The `setVoicePreference('gabrijela')` path calls `localStorage.removeItem(VOICE_KEY)`, not `setItem`. Task 2 correctly tests the `removeItem` path separately.
