# SP3b — ErrorBoundary Shared Reporting (Design)

**Date:** 2026-05-16
**Status:** Approved — ready for plan
**Origin:** Deferred from SP3 (`docs/superpowers/plans/2026-04-19-03-typescript-strict.md`) as "ErrorBoundary consolidation".

## Goal

Reduce duplication between `src/components/shared/ErrorBoundary.tsx` and `src/components/shared/ScreenErrorBoundary.tsx` by extracting shared error-reporting logic into a single helper, WITHOUT merging the two components themselves.

Both components stay. They have legitimate separate responsibilities. The win is removing parallel logging code paths and standardizing what gets reported.

## Why this is NOT a merge

Audit of both components shows they serve different roles:

| | `ErrorBoundary.tsx` | `ScreenErrorBoundary.tsx` |
|---|---|---|
| Scope | Root of app (wraps everything) | Per-screen (one per tab/route) |
| State | `{ error: Error \| null }` | `{ hasError, error, retries }` |
| Recovery | "Reload App" (force window.location.reload) | "Try Again" once, then reload; optional "Go Back" |
| UI | Full-screen Croatian-flag-gradient takeover | Card-sized inline alert with CroatianKnight droop |
| Logging | `window.__nhReportError?.(error, info)` | `reportError(error, screenName)` from `lib/errorReporter.js` |
| Used by | `main.tsx` (singleton) | `AppRouter.tsx` (one per screen) |
| Lines | 91 | 145 |

Merging them would either:
- Lose the per-screen retry/goBack UX (regression)
- Make root-level boundary heavier than it needs to be (slower failure recovery)
- Force a one-component-with-modes shape (more conditional logic, harder to reason about)

The actual duplication is in the **error-reporting** path: both call out to different "send this error somewhere" mechanisms. That's where SP3b focuses.

## The duplication to fix

`ErrorBoundary.tsx:31-33`:
```ts
try {
  window.__nhReportError?.(error, info);
} catch (_) {}
```

`ScreenErrorBoundary.tsx:36-40`:
```ts
const screenName = String(this.props.name || 'Screen');
console.error('Screen crashed:', screenName, error, info);
reportError(error, screenName);
```

Two different paths to error logging:
1. Root boundary expects a global `window.__nhReportError` callback
2. Screen boundary uses `lib/errorReporter.js`

Inconsistent: a real Sentry/Datadog integration has to be wired in two places.

## Decisions

### Extract `reportBoundaryError(error, info, scope)` into `src/lib/errorReporter.ts`

Single function that both boundaries call:

```ts
// src/lib/errorReporter.ts (extended — replaces the existing JS file)

import type { ErrorInfo } from 'react';

export interface BoundaryReport {
  scope: 'root' | string; // 'root' for app-level, screen-name string for per-screen
  message: string;
  stack?: string;
  componentStack?: string;
  retries?: number;
  timestamp: number;
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
  const report: BoundaryReport = {
    scope,
    message: error.message,
    stack: error.stack,
    componentStack: info.componentStack ?? undefined,
    retries,
    timestamp: Date.now(),
  };

  // Always log to console for dev debugging
  console.error('[boundary]', scope, error, info.componentStack);

  // Forward to any global error reporter
  try {
    if (typeof window !== 'undefined' && window.__nhReportError) {
      window.__nhReportError(error, info, scope);
    }
  } catch {
    /* never let the reporter crash the boundary */
  }

  // Preserve the existing reportError() entrypoint for backward compat
  // (callers outside the boundaries still use the old signature)
  try {
    // Defer import to avoid circular deps if errorReporter.ts imports anything
    // from the React tree.
  } catch {
    /* no-op */
  }
}

// Retained for backward compat — existing callers in errorReporter.js use this.
// Forwards to reportBoundaryError with synthetic ErrorInfo.
export function reportError(error: Error, screenName?: string): void {
  reportBoundaryError(error, { componentStack: null } as ErrorInfo, screenName ?? 'unknown');
}
```

### Update both boundaries to call the new entrypoint

`ErrorBoundary.tsx` becomes:
```ts
componentDidCatch(error: Error, info: React.ErrorInfo) {
  reportBoundaryError(error, info, 'root');
}
```

`ScreenErrorBoundary.tsx` becomes:
```ts
componentDidCatch(error: Error, info: React.ErrorInfo) {
  const screenName = String(this.props.name || 'Screen');
  reportBoundaryError(error, info, screenName, this.state.retries);
}
```

### Why a `.ts` rewrite of `errorReporter.js`?

The existing `lib/errorReporter.js` (we don't have visibility into its current shape from this design phase — implementer will read it first) is JS. Promoting it to TypeScript with explicit `BoundaryReport` typing is the right move. Plan Task 1 reads the file before deciding whether to do an in-place edit or a `.js → .ts` migration.

### What stays out of SP3b

- **Sentry wiring** — that's SP10b. SP3b adds a single entrypoint that SP10b will plug into.
- **window.__nhReportError migration** — if this is set anywhere in production HTML, leave it untouched.
- **Boundary UI changes** — both UIs stay byte-identical.
- **Adding new boundary types** — current 2 are sufficient.

## Acceptance criteria

- [ ] `src/lib/errorReporter.ts` (or `.js` if implementer chooses) exports `reportBoundaryError(error, info, scope, retries?)` with the signature above
- [ ] Backward-compat shim `reportError(error, screenName?)` preserved for existing callers
- [ ] `ErrorBoundary.tsx` `componentDidCatch` is a single call to `reportBoundaryError`
- [ ] `ScreenErrorBoundary.tsx` `componentDidCatch` is a single call to `reportBoundaryError`
- [ ] Existing `reportError(...)` call sites elsewhere in `src/` still compile + pass tests (backward-compat verified)
- [ ] No UI changes to either boundary (visual byte-identical)
- [ ] `tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] Existing test for `errorReporter` (if any) passes; new tests cover the new entrypoint with synthetic Error + ErrorInfo
- [ ] Commit + push

## Non-goals

- Merging the two boundary components into one
- Changing recovery UX (retry counts, button labels, layouts)
- Adding Sentry integration
- Refactoring `window.__nhReportError`
- Moving file from `.js` to `.ts` is optional, not required

## Rollback

Revert the SP3b commit. Boundaries return to parallel logging paths. Nothing user-facing changes.

## Open questions

None at design time. The implementer should read `src/lib/errorReporter.js` as Task 1 to understand existing callers before changing the function signature — if `reportError` is called with positional args we don't expect, the backward-compat shim needs adjustment.
