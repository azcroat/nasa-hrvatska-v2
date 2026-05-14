# Sentry Fix, CEFR Badges & Architecture Anchors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the "Failed to fetch dynamically imported module: vendor-sentry" Sentry noise, fix a Framer Motion opacity:0 violation in KnightCompanion, and surface the existing `cefr` fields in GrammarScreen and PitchAccentMastery UIs.

**Architecture:** Three independent, surgically small changes. Task 1 (Sentry) is production-urgent — a raw `import('@sentry/react')` in main.tsx has no `.catch()`, so every post-deploy cache miss generates Sentry noise instead of silently self-healing. Tasks 2–4 are data-already-present display fixes.

**Tech Stack:** React 18, Vite 6, TypeScript strict, Vitest, Playwright, Cloudflare Pages.

---

## File Map

| Task | File | Change |
|------|------|--------|
| 1 | `src/main.tsx` | Hoist helper fns before Sentry init; add `_isChunkLoadError`; add `.catch()` to Sentry import; update `onunhandledrejection` |
| 2 | `src/components/shared/KnightCompanion.tsx` | Guard `opacity:0` in `initial` prop with `_isNative` |
| 3 | `src/components/learn/GrammarScreen.tsx` | Add `cefr?:string` to `GrammarLesson`; display CEFR badge in learn-phase header |
| 4 | `src/components/learn/PitchAccentMastery.tsx` | Display CEFR badge per accent type from `LESSON_BY_ACCENT[id]?.cefr` |
| Tests | `src/tests/main-error-handlers.test.ts` (new) | Unit-test the chunk-error detection and reload guard logic |

---

## Task 1 — Fix Sentry chunk-load unhandled rejection (main.tsx)

**Root cause:** `import('@sentry/react')` at line ~92 of `src/main.tsx` is a raw dynamic import with no `.catch()`. Vite splits `@sentry/react` into `vendor-sentry-<hash>.js`. After a new deploy, old HTML references the old hash → 404 → unhandled promise rejection. `window.onunhandledrejection` (line ~293) only checks for the `"Importing binding name"` (WebKit stale binding) pattern and falls through to `reportError()` → Sentry captures it as a real error. The recovery via `lazyWithReload()` in AppRouter fires separately for React components but does NOT cover this eager Sentry import.

**Fix:** Hoist the error-handling helpers before the Sentry init block (they're currently defined ~170 lines later). Add a chunk-error pattern check. Add `.catch()` to the Sentry import. Extend `onunhandledrejection` to suppress + reload on chunk errors.

**Files:**
- Modify: `src/main.tsx` (multiple locations)
- Create: `src/tests/main-error-handlers.test.ts`

- [ ] **Step 1: Read lines 85–145 and 255–305 of src/main.tsx**

Confirm exact current line numbers for:
- Sentry `import('@sentry/react')` call
- `_isStaleBindingError` function definition
- `_reloadWithCachePurge` function definition
- `window.onunhandledrejection` handler

- [ ] **Step 2: Hoist helpers and add `_isChunkLoadError` — replace the block at lines ~258–300**

Remove the existing helper function definitions from their current location (~line 258) and insert this block **immediately before the Sentry init comment** (`// ─── Sentry error telemetry ───`):

```typescript
// ─── Error-handler helpers (defined early — used by Sentry init .catch below) ─
function _isStaleBindingError(msg: unknown) {
  return typeof msg === 'string' && msg.includes('Importing binding name');
}
function _isChunkLoadError(msg: string) {
  // Same patterns as lazyWithReload in AppRouter — covers all browser variants.
  return (
    msg.includes('failed to fetch') ||
    msg.includes('importing a module script failed') ||
    msg.includes('dynamically imported module') ||
    msg.includes('expected a javascript module script') ||
    msg.includes('mime type') ||
    msg.includes('loading chunk') ||
    msg.includes('importing binding name')
  );
}
function _reloadWithCachePurge(storageKey: string) {
  try {
    const n = parseInt(sessionStorage.getItem(storageKey) || '0', 10);
    if (n >= 2) return false; // cap at 2 — never loop forever
    sessionStorage.setItem(storageKey, String(n + 1));
    if ('caches' in globalThis) {
      caches
        .keys()
        .then((names) =>
          names.forEach((name) => {
            if (name.includes('nasa-hrvatska') && name.includes('-js')) caches.delete(name);
          }),
        )
        .catch(() => {})
        .finally(() => globalThis.location.reload());
    } else {
      globalThis.location.reload();
    }
    return true;
  } catch (_) {
    return false;
  }
}
```

- [ ] **Step 3: Add `.catch()` to the Sentry dynamic import**

Locate the `import('@sentry/react').then((Sentry) => {` line and append a `.catch()`:

```typescript
// BEFORE:
  import('@sentry/react').then((Sentry) => {
    _sentry = Sentry;
    Sentry.init({ ... });
  });

// AFTER:
  import('@sentry/react')
    .then((Sentry) => {
      _sentry = Sentry;
      Sentry.init({ ... });
    })
    .catch((e: unknown) => {
      // Sentry vendor chunk failed to load — stale deploy. Trigger cache purge + reload.
      // If not a chunk error (some other Sentry init failure), swallow silently —
      // Sentry isn't running yet so there is nowhere to report it.
      const msg = (((e as { message?: string })?.message ?? '') + (((e as { name?: string })?.name) ?? '')).toLowerCase();
      if (_isChunkLoadError(msg)) {
        _reloadWithCachePurge('nh_reload_attempt');
      }
    });
```

- [ ] **Step 4: Update `window.onunhandledrejection` to suppress chunk-error noise**

Locate the `window.onunhandledrejection` handler and replace it:

```typescript
// BEFORE:
window.onunhandledrejection = function (event) {
  const reason = event.reason;
  const msg = (reason?.message || '') + (reason?.name || '');
  if (_isStaleBindingError(msg)) {
    if (_reloadWithCachePurge('nh_binding_reload')) return;
  }
  reportError(reason ?? new Error('Unhandled rejection'), 'unhandledrejection');
};

// AFTER:
window.onunhandledrejection = function (event) {
  const reason = event.reason;
  const msg = ((reason?.message ?? '') + (reason?.name ?? '')).toLowerCase();
  // Stale binding (WebKit): suppress + reload with separate attempt counter
  if (_isStaleBindingError(msg)) {
    if (_reloadWithCachePurge('nh_binding_reload')) return;
  }
  // Stale chunk (all browsers): suppress + reload. The lazyWithReload() wrapper in
  // AppRouter also catches these for React.lazy components, but vendor chunks that
  // are dependencies of lazy components can fire an unhandledrejection independently
  // before the parent import() rejects. Intercepting here prevents Sentry noise.
  if (_isChunkLoadError(msg)) {
    if (_reloadWithCachePurge('nh_reload_attempt')) return;
  }
  reportError(reason ?? new Error('Unhandled rejection'), 'unhandledrejection');
};
```

- [ ] **Step 5: Write unit tests for the helper functions**

Create `src/tests/main-error-handlers.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ── Inline the helpers under test (avoids importing main.tsx which has side effects) ──
function _isChunkLoadError(msg: string) {
  return (
    msg.includes('failed to fetch') ||
    msg.includes('importing a module script failed') ||
    msg.includes('dynamically imported module') ||
    msg.includes('expected a javascript module script') ||
    msg.includes('mime type') ||
    msg.includes('loading chunk') ||
    msg.includes('importing binding name')
  );
}
function _isStaleBindingError(msg: unknown) {
  return typeof msg === 'string' && msg.includes('Importing binding name');
}
function _reloadWithCachePurge(storageKey: string, storage: Record<string, string>) {
  const n = parseInt(storage[storageKey] ?? '0', 10);
  if (n >= 2) return false;
  storage[storageKey] = String(n + 1);
  return true;
}

describe('_isChunkLoadError', () => {
  it('detects Chrome failed to fetch pattern', () => {
    expect(_isChunkLoadError('failed to fetch dynamically imported module')).toBe(true);
  });
  it('detects Safari pattern', () => {
    expect(_isChunkLoadError('importing a module script failed')).toBe(true);
  });
  it('detects Firefox pattern', () => {
    expect(_isChunkLoadError('error loading dynamically imported module')).toBe(true);
  });
  it('detects MIME type pattern', () => {
    expect(_isChunkLoadError('expected a javascript module script but server responded with mime type text/html')).toBe(true);
  });
  it('detects loading chunk pattern', () => {
    expect(_isChunkLoadError('loading chunk 42 failed')).toBe(true);
  });
  it('does NOT match unrelated errors', () => {
    expect(_isChunkLoadError('cannot read properties of undefined')).toBe(false);
    expect(_isChunkLoadError('network error')).toBe(false);
    expect(_isChunkLoadError('')).toBe(false);
  });
});

describe('_isStaleBindingError', () => {
  it('detects WebKit stale binding', () => {
    expect(_isStaleBindingError("Importing binding name 'g' is not found")).toBe(true);
  });
  it('ignores non-string input', () => {
    expect(_isStaleBindingError(null)).toBe(false);
    expect(_isStaleBindingError(42)).toBe(false);
  });
});

describe('_reloadWithCachePurge', () => {
  it('increments counter on first call and returns true', () => {
    const store: Record<string, string> = {};
    expect(_reloadWithCachePurge('key', store)).toBe(true);
    expect(store['key']).toBe('1');
  });
  it('returns true on second call', () => {
    const store: Record<string, string> = { key: '1' };
    expect(_reloadWithCachePurge('key', store)).toBe(true);
    expect(store['key']).toBe('2');
  });
  it('returns false on third call (guard)', () => {
    const store: Record<string, string> = { key: '2' };
    expect(_reloadWithCachePurge('key', store)).toBe(false);
    expect(store['key']).toBe('2'); // unchanged
  });
  it('separate keys are independent', () => {
    const store: Record<string, string> = { nh_binding_reload: '2' };
    expect(_reloadWithCachePurge('nh_reload_attempt', store)).toBe(true);
  });
});
```

- [ ] **Step 6: Run unit tests**

```bash
cd "C:/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2"
npm run test -- --reporter=verbose src/tests/main-error-handlers.test.ts
```

Expected: all tests PASS

- [ ] **Step 7: Type-check and lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: 0 errors, 0 warnings

- [ ] **Step 8: Commit**

```bash
git add src/main.tsx src/tests/main-error-handlers.test.ts
git commit -m "fix(errors): suppress and self-heal Sentry vendor chunk-load errors after deploy"
```

---

## Task 2 — Fix KnightCompanion opacity:0 on native (architecture anchor)

**Root cause:** `src/components/shared/KnightCompanion.tsx` line ~484 uses `opacity: 0` in Framer Motion `initial` prop without the `_isNative` guard. On Android WebView, Framer Motion animations can stall, leaving the knight permanently invisible at `opacity: 0`. The `_isNative` constant IS already defined in that same file (lines 17–20) — it's just not applied to this specific `motion.button`.

**Files:**
- Modify: `src/components/shared/KnightCompanion.tsx` (one line)

- [ ] **Step 9: Read lines 478–498 of KnightCompanion.tsx to confirm exact current code**

Verify the `motion.button` at line ~484 has:
```tsx
initial={introPlayed ? { scale: 0.6, opacity: 0 } : { x: -80, opacity: 0, scale: 0.8 }}
```

- [ ] **Step 10: Apply the native guard**

Replace only the `initial` prop (exact line ~484):

```tsx
// BEFORE:
initial={introPlayed ? { scale: 0.6, opacity: 0 } : { x: -80, opacity: 0, scale: 0.8 }}

// AFTER:
initial={_isNative ? false : introPlayed ? { scale: 0.6, opacity: 0 } : { x: -80, opacity: 0, scale: 0.8 }}
```

`initial={false}` tells Framer Motion to skip the entry animation entirely on native — the element renders at its final `animate` target (`{ x: 0, scale: 1, opacity: 1 }`) immediately, so the knight is always visible on Android.

- [ ] **Step 11: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 12: Commit**

```bash
git add src/components/shared/KnightCompanion.tsx
git commit -m "fix(android): guard KnightCompanion initial opacity:0 with _isNative per architecture anchor"
```

---

## Task 3 — Surface CEFR badge in GrammarScreen

**Context:** `src/data/grammar.js` already has `cefr` on every lesson object inside `GRAM.beginner`, `GRAM.intermediate`, and `GRAM.advanced`. The `GrammarLesson` TypeScript interface in `GrammarScreen.tsx` does not include `cefr`, so the field is dropped. `GrammarScreen` renders the lesson title in the learn phase with no level indicator. The CEFR badge CSS class `cefr cefr-{level}` already exists in `src/index.css` (used in `BrowseContentModal.tsx`).

**Files:**
- Modify: `src/components/learn/GrammarScreen.tsx` (interface + JSX)

- [ ] **Step 13: Read lines 9–20 of GrammarScreen.tsx to confirm interface shape**

Confirm `GrammarLesson` interface (lines ~14–19):
```typescript
interface GrammarLesson {
  title: string;
  desc: string;
  exs: string[][];
  qs: GrammarQuestion[];
}
```

- [ ] **Step 14: Add `cefr` to `GrammarLesson` interface**

```typescript
// BEFORE:
interface GrammarLesson {
  title: string;
  desc: string;
  exs: string[][];
  qs: GrammarQuestion[];
}

// AFTER:
interface GrammarLesson {
  title: string;
  cefr?: string;
  desc: string;
  exs: string[][];
  qs: GrammarQuestion[];
}
```

- [ ] **Step 15: Add CEFR badge to the learn-phase header**

Locate the learn-phase render block (around line ~137). Find:
```tsx
{gp === 'learn' && (
  <React.Fragment>
    {H('📐 ' + gl.title, '', goBack)}
    <div className="c" style={{ marginBottom: 16 }}>
```

Replace with (add the badge row between header and description card):
```tsx
{gp === 'learn' && (
  <React.Fragment>
    {H('📐 ' + gl.title, '', goBack)}
    {gl.cefr && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingLeft: 4 }}>
        <span className={`cefr cefr-${gl.cefr.toLowerCase()}`}>{gl.cefr}</span>
      </div>
    )}
    <div className="c" style={{ marginBottom: 16 }}>
```

- [ ] **Step 16: Type-check and lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: 0 errors

- [ ] **Step 17: Commit**

```bash
git add src/components/learn/GrammarScreen.tsx
git commit -m "feat(grammar): display CEFR level badge on grammar lesson learn screen"
```

---

## Task 4 — Surface CEFR badge in PitchAccentMastery

**Context:** `src/data/pitchAccentContent.js` has `cefr` on every lesson entry (all are `'B1'`). `PitchAccentMastery.tsx` imports from `pitchAccentContent.js` via `LESSON_BY_ACCENT` (keyed by accent id). The screen renders individual accent cards with no CEFR indicator. The pattern: read `LESSON_BY_ACCENT[accent.id]?.cefr ?? 'B1'` to get the level for each card.

**Files:**
- Modify: `src/components/learn/PitchAccentMastery.tsx`

- [ ] **Step 18: Read the accent card render section of PitchAccentMastery.tsx**

Search for where each `ACCENTS` entry is rendered — look for the JSX that renders `accent.name`, `accent.nameEn`, and `accent.rule`. This is where the CEFR badge goes.

Run:
```bash
grep -n "accent.name\|nameEn\|accent.rule\|accent.id" "src/components/learn/PitchAccentMastery.tsx" | head -20
```

Note the line numbers for the accent card header.

- [ ] **Step 19: Add CEFR badge to each accent card header**

In the section that renders the accent card title, add the badge below or adjacent to the accent name. Pattern (adapt exact JSX to match what you found in Step 18):

```tsx
{/* After accent name/nameEn */}
<span className={`cefr cefr-${(LESSON_BY_ACCENT[accent.id as keyof typeof LESSON_BY_ACCENT]?.cefr ?? 'B1').toLowerCase()}`}>
  {LESSON_BY_ACCENT[accent.id as keyof typeof LESSON_BY_ACCENT]?.cefr ?? 'B1'}
</span>
```

If the cefr is always 'B1' for all 4 accent types (verify from data), you may simplify to:
```tsx
<span className="cefr cefr-b1">B1</span>
```

- [ ] **Step 20: Type-check and lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: 0 errors

- [ ] **Step 21: Commit**

```bash
git add src/components/learn/PitchAccentMastery.tsx
git commit -m "feat(pitch-accent): display CEFR badge on pitch accent lesson cards"
```

---

## Task 5 — Full verification pass

- [ ] **Step 22: Run full test suite**

```bash
npm run test
```

Expected: all existing tests pass + the new `main-error-handlers` tests pass

- [ ] **Step 23: Run type-check and lint across entire codebase**

```bash
npx tsc --noEmit && npm run lint
```

Expected: 0 errors, 0 warnings

- [ ] **Step 24: Git push to trigger Cloudflare deploy**

```bash
git push origin master
```

Expected: Cloudflare Pages build completes. After deploy, Sentry should receive 0 "Failed to fetch dynamically imported module: vendor-sentry" events on next cache-miss window.

---

## Architecture Anchor Status After This Plan

| Anchor | Status | Evidence |
|--------|--------|---------|
| Sync: CEFR field `int` in Firestore rules | ✅ Correct — rules accept both `int` (1–6) and CEFR string for legacy | `firestore.rules` lines 102–116 |
| Audio: `isNative()` uses `hostname==='localhost' && !port` | ✅ Correct — verified in `AppRouter.tsx` lines 7–10 and `KnightCompanion.tsx` lines 17–20 | Current code |
| Framer Motion: no `opacity:0` in `initial` on native | ⚠️ Violation at `KnightCompanion.tsx:484` | Fixed in Task 2 |
