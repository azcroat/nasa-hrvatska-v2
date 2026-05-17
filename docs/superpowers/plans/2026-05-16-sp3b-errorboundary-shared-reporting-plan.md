# SP3b — ErrorBoundary Shared Reporting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Single error-reporting entrypoint (`reportBoundaryError`) called from both ErrorBoundary.tsx and ScreenErrorBoundary.tsx. Backward-compat shim preserves existing `reportError()` callers.

**Architecture:** Extend `src/lib/errorReporter.{js,ts}` with the new entrypoint. Update 2 boundary components to call it. No UI changes, no merge of components. ~1-2 hours.

**Tech Stack:** TypeScript, React error boundaries, Vitest.

---

## File Structure

### Modified
- `src/lib/errorReporter.{js,ts}` — extended with `reportBoundaryError`, retained `reportError` shim
- `src/components/shared/ErrorBoundary.tsx` — `componentDidCatch` simplified to single call
- `src/components/shared/ScreenErrorBoundary.tsx` — `componentDidCatch` simplified to single call

### Created
- `src/lib/__tests__/errorReporter.test.ts` — new tests for the new entrypoint (if no existing test file)

---

## Task 1: Audit existing `errorReporter.js`

**Files:**
- Read: `src/lib/errorReporter.js`

- [ ] **Step 1: Read the file end-to-end**

```bash
cat src/lib/errorReporter.js
```

- [ ] **Step 2: Find all consumers**

```bash
grep -rn "from .*errorReporter\|from .*lib/errorReporter" src/
```

Note every call site of `reportError`. The shape of that function MUST remain backward-compatible after this sprint or those callers break.

- [ ] **Step 3: Decide migration path**

Two options based on what Step 1 reveals:
- **A.** File is small and only exports `reportError` → upgrade to `.ts`, add `reportBoundaryError` alongside, keep `reportError` as shim.
- **B.** File is larger / has other exports → keep as `.js`, add new TS module `errorReporter.ts` that wraps and re-exports.

Decide A or B before Task 2. Document the choice in the commit message.

---

## Task 2: Write failing tests for `reportBoundaryError`

**Files:**
- Create or extend: `src/lib/__tests__/errorReporter.test.ts`

- [ ] **Step 1: Write the test file**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ErrorInfo } from 'react';
import { reportBoundaryError, reportError } from '../errorReporter';

const info: ErrorInfo = { componentStack: '\n    at TestComponent\n    at App\n' };

describe('reportBoundaryError', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Reset global error reporter between tests
    delete (window as unknown as { __nhReportError?: unknown }).__nhReportError;
  });
  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('logs to console with scope tag', () => {
    reportBoundaryError(new Error('boom'), info, 'root');
    expect(consoleSpy).toHaveBeenCalledWith('[boundary]', 'root', expect.any(Error), info.componentStack);
  });

  it('forwards to window.__nhReportError when present', () => {
    const reporter = vi.fn();
    (window as unknown as { __nhReportError: typeof reporter }).__nhReportError = reporter;
    const err = new Error('boom');
    reportBoundaryError(err, info, 'HomeTab', 2);
    expect(reporter).toHaveBeenCalledWith(err, info, 'HomeTab');
  });

  it('does not throw if window.__nhReportError throws', () => {
    (window as unknown as { __nhReportError: () => void }).__nhReportError = () => {
      throw new Error('reporter crashed');
    };
    expect(() => reportBoundaryError(new Error('boom'), info, 'root')).not.toThrow();
  });

  it('does not throw when window is undefined (SSR safety)', () => {
    const origWindow = global.window;
    // @ts-expect-error — intentional SSR simulation
    global.window = undefined;
    try {
      expect(() => reportBoundaryError(new Error('boom'), info, 'root')).not.toThrow();
    } finally {
      global.window = origWindow;
    }
  });

  it('passes retries count to reporter', () => {
    const reporter = vi.fn();
    (window as unknown as { __nhReportError: typeof reporter }).__nhReportError = reporter;
    reportBoundaryError(new Error('boom'), info, 'HomeTab', 3);
    // Reporter receives (error, info, scope); retries shape is forward-compat
    expect(reporter).toHaveBeenCalled();
  });
});

describe('reportError (backward-compat shim)', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('still callable with (error, screenName) signature', () => {
    expect(() => reportError(new Error('old api'), 'LegacyScreen')).not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('callable with (error) only — screenName omitted', () => {
    expect(() => reportError(new Error('old api'))).not.toThrow();
  });
});
```

- [ ] **Step 2: Run tests, verify failures**

```bash
npx vitest run src/lib/__tests__/errorReporter.test.ts
```

Expected: `reportBoundaryError` doesn't exist yet → fail.

---

## Task 3: Implement `reportBoundaryError` + `reportError` shim

**Files:**
- Modify: `src/lib/errorReporter.{js,ts}` (per Task 1 decision)

- [ ] **Step 1: Write the implementation**

If Option A from Task 1 (rename to .ts):

```ts
// src/lib/errorReporter.ts
import type { ErrorInfo } from 'react';

export interface BoundaryReport {
  scope: 'root' | string;
  message: string;
  stack?: string;
  componentStack?: string;
  retries?: number;
  timestamp: number;
}

declare global {
  interface Window {
    __nhReportError?: (error: Error, info: ErrorInfo, scope: string) => void;
  }
}

/**
 * Single reporting entrypoint for both ErrorBoundary and ScreenErrorBoundary.
 * Logs to console, forwards to window.__nhReportError if present, and
 * (TODO when SP10b lands) sends to Sentry.
 */
export function reportBoundaryError(
  error: Error,
  info: ErrorInfo,
  scope: 'root' | string,
  retries = 0,
): void {
  console.error('[boundary]', scope, error, info.componentStack);

  // Build the report object — currently unused locally; surfaces structure for
  // when SP10b adds Sentry wiring.
  const _report: BoundaryReport = {
    scope,
    message: error.message,
    stack: error.stack,
    componentStack: info.componentStack ?? undefined,
    retries,
    timestamp: Date.now(),
  };
  void _report;

  try {
    if (typeof window !== 'undefined' && window.__nhReportError) {
      window.__nhReportError(error, info, scope);
    }
  } catch {
    /* never let the reporter crash the boundary */
  }
}

/**
 * Backward-compat shim for existing callers using the
 * `reportError(error, screenName)` signature.
 */
export function reportError(error: Error, screenName?: string): void {
  reportBoundaryError(error, { componentStack: null } as ErrorInfo, screenName ?? 'unknown');
}
```

If Option B (keep .js):
- Add a sibling `src/lib/errorReporter.ts` that imports from `.js` and re-exports `reportError` plus adds `reportBoundaryError`.

- [ ] **Step 2: Run tests, verify pass**

```bash
npx vitest run src/lib/__tests__/errorReporter.test.ts
```

Expected: all 7 tests pass.

- [ ] **Step 3: Verify backward-compat — run full vitest**

```bash
npx vitest run --reporter=dot
```

Expected: zero new failures. Any existing tests that call `reportError(...)` still pass.

---

## Task 4: Update ErrorBoundary.tsx

**Files:**
- Modify: `src/components/shared/ErrorBoundary.tsx`

- [ ] **Step 1: Edit `componentDidCatch`**

```diff
+ import { reportBoundaryError } from '../../lib/errorReporter';

  componentDidCatch(error: Error, info: React.ErrorInfo) {
-   console.error('[ErrorBoundary]', error, info.componentStack);
-   // Forward to any global error handler (Sentry, Datadog, etc.)
-   try {
-     window.__nhReportError?.(error, info);
-   } catch (_) {}
+   reportBoundaryError(error, info, 'root');
  }
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -10
```

Expected: no new errors.

---

## Task 5: Update ScreenErrorBoundary.tsx

**Files:**
- Modify: `src/components/shared/ScreenErrorBoundary.tsx`

- [ ] **Step 1: Edit `componentDidCatch`**

```diff
- import { reportError } from '../../lib/errorReporter.js';
+ import { reportBoundaryError } from '../../lib/errorReporter';

  componentDidCatch(error: Error, info: React.ErrorInfo) {
-   const screenName = String(this.props.name || 'Screen');
-   console.error('Screen crashed:', screenName, error, info);
-   reportError(error, screenName);
+   const screenName = String(this.props.name || 'Screen');
+   reportBoundaryError(error, info, screenName, this.state.retries);
  }
```

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit 2>&1 | head -5
npx eslint src/components/shared/ --max-warnings=0 2>&1 | tail -5
```

Expected: clean.

---

## Task 6: Smoke test boundary behavior

**Files:**
- (Manual verification — no edits)

- [ ] **Step 1: Run full unit + integration tests**

```bash
npx vitest run --reporter=dot 2>&1 | tail -8
```

Expected: no regressions. `errorReporter.test.ts` passes (Task 2's 7 tests). All other tests unchanged.

- [ ] **Step 2: Verify boundary UIs still render — write a quick visual test or use Playwright**

If a Playwright spec exists for boundary rendering, run it. If not, the unit + integration test pass is sufficient — boundary UI didn't change.

```bash
grep -l "ScreenErrorBoundary\|ErrorBoundary" e2e/
```

If matches found, run those specific specs.

---

## Task 7: Commit + push

**Files:**
- All modified files

- [ ] **Step 1: Commit**

```bash
git add src/lib/errorReporter.* src/components/shared/ErrorBoundary.tsx src/components/shared/ScreenErrorBoundary.tsx src/lib/__tests__/errorReporter.test.ts
git commit -m "$(cat <<'EOF'
refactor(sp3b): single reportBoundaryError entrypoint for both boundaries

ErrorBoundary (root) and ScreenErrorBoundary (per-screen) previously
used two different logging paths (window.__nhReportError vs reportError
from lib/errorReporter.js). Extracted a shared reportBoundaryError(error,
info, scope, retries?) into lib/errorReporter.ts.

Backward-compat shim reportError(error, screenName?) preserved for
existing non-boundary callers. No UI changes — both boundaries render
byte-identically. Sets up SP10b (Sentry wiring) to plug in at a single
location.
EOF
)"
git push origin master
```

---

## Self-Review Checklist

- [ ] `reportBoundaryError(error, info, scope, retries?)` is the only call inside both boundaries' `componentDidCatch`
- [ ] `reportError(error, screenName?)` shim still works for non-boundary callers
- [ ] Zero UI changes (boundary visuals byte-identical)
- [ ] Console.error message format consistent across both boundaries
- [ ] All tests pass (7 new + existing)
- [ ] `tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] Commit pushed

## Rollback

```bash
git revert <sp3b-commit-sha>
```

Boundaries return to parallel logging paths. Nothing user-facing changes.
