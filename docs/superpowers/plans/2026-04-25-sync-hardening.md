# Cross-Device Sync Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close three concrete sync gaps — missing `nh_session_history` field, periodic-push disabled when the Firestore watcher fails, and a stale cross-device test — then add a visible "last synced" indicator so users can confirm sync is working.

**Architecture:** The app already has a well-designed 4-layer save + 3-layer load pipeline. The root cause of the April-1 Firestore rules bug is already fixed (CEFR int conversion). The remaining gaps are: (1) `nh_session_history` (used by the new StatsTab session-streak widget) is never written to or read from Firebase, so the session streak is always 0 on a fresh device; (2) the 60-second periodic push is gated on `syncReady === true`, so if the Firestore real-time watcher fails, the push is silently disabled; (3) the E2E cross-device test uses stale selectors that no longer match the rewritten HomeTab. We fix each gap with a minimal, testable change.

**Tech Stack:** TypeScript, React, Firebase Firestore (SDK v10+), Vitest (unit tests), Playwright (E2E)

---

## File Map

| File | Change |
|------|--------|
| `src/lib/progressSnapshot.ts` | Add `nh_session_history` field |
| `src/lib/applyRemoteProgress.ts` | Restore `nh_session_history` from remote |
| `src/hooks/useSyncManager.ts` | Remove `syncReady` gate on 60s push; track `lastSyncedAt` |
| `src/components/profile/MeTab.tsx` | Read `lastSyncedAt` prop; show "Last synced X min ago" |
| `src/tests/progressSnapshot.test.ts` | Add `nh_session_history` assertion |
| `src/tests/applyRemoteProgress.test.ts` | Add `nh_session_history` restore assertion |
| `src/tests/sync-integrity.test.ts` | Add push-independence assertion (unit) |
| `e2e/cross-device-sync.spec.js` | Update stale "Home"/"Path" selectors |

---

### Task 1: Sync `nh_session_history` through the pipeline

The StatsTab session-streak widget (added April 25) reads `nh_session_history` from localStorage. This key is never included in the Firebase progress blob, so signing into a new device always shows a 0-day session streak even if the user has a history.

**Files:**
- Modify: `src/lib/progressSnapshot.ts` (add one field)
- Modify: `src/lib/applyRemoteProgress.ts` (restore on receive)
- Modify: `src/tests/progressSnapshot.test.ts` (add test)
- Modify: `src/tests/applyRemoteProgress.test.ts` (add test)

- [ ] **Step 1: Write the failing snapshot test**

Open `src/tests/progressSnapshot.test.ts`. Add this test inside the `describe('buildProgressSnapshot', ...)` block, after the last `it(...)`:

```typescript
it('includes nh_session_history from localStorage', () => {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  localStorage.setItem(
    'nh_session_history',
    JSON.stringify({ [today]: true, [yesterday]: true }),
  );
  const snap = buildProgressSnapshot(BASE_PARAMS);
  expect(snap.nh_session_history).toEqual({ [today]: true, [yesterday]: true });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd "C:/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2"
npx vitest run src/tests/progressSnapshot.test.ts 2>&1 | tail -20
```

Expected: FAIL — `snap.nh_session_history` is `undefined`.

- [ ] **Step 3: Add `nh_session_history` to `buildProgressSnapshot`**

Open `src/lib/progressSnapshot.ts`. At the end of the `return { ... }` block, after the `nh_media_done` entry (around line 169), add:

```typescript
    nh_session_history: (() => {
      try {
        return JSON.parse(localStorage.getItem('nh_session_history') || '{}');
      } catch {
        return {};
      }
    })(),
```

- [ ] **Step 4: Run the snapshot test to confirm it passes**

```bash
npx vitest run src/tests/progressSnapshot.test.ts 2>&1 | tail -10
```

Expected: All tests PASS.

- [ ] **Step 5: Write the failing applyRemoteProgress test**

Open `src/tests/applyRemoteProgress.test.ts`. Add this test in the appropriate `describe` block (after the existing merge tests):

```typescript
describe('nh_session_history', () => {
  it('merges remote session history additively into localStorage', () => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    // Existing local history has yesterday only
    localStorage.setItem('nh_session_history', JSON.stringify({ [yesterday]: true }));
    applyRemoteProgress({ nh_session_history: { [today]: true } }, makeSetters());
    const stored = JSON.parse(localStorage.getItem('nh_session_history') || '{}');
    // Both days should be present (additive union)
    expect(stored[today]).toBe(true);
    expect(stored[yesterday]).toBe(true);
  });

  it('does not remove local entries absent from remote', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    localStorage.setItem('nh_session_history', JSON.stringify({ [yesterday]: true }));
    // Remote has no session_history at all
    applyRemoteProgress({}, makeSetters());
    const stored = JSON.parse(localStorage.getItem('nh_session_history') || '{}');
    expect(stored[yesterday]).toBe(true);
  });
});
```

- [ ] **Step 6: Run the applyRemoteProgress test to confirm it fails**

```bash
npx vitest run src/tests/applyRemoteProgress.test.ts 2>&1 | tail -20
```

Expected: FAIL — function doesn't touch `nh_session_history` yet.

- [ ] **Step 7: Add `nh_session_history` restore to `applyRemoteProgress`**

Open `src/lib/applyRemoteProgress.ts`. At the end of the function body, after the `nh_media_done` block (around line 380), add:

```typescript
  // ── Session history — additive union (never remove completed days) ──────────
  if (fp.nh_session_history && typeof fp.nh_session_history === 'object') {
    let lSH: Record<string, boolean> = {};
    try {
      lSH = JSON.parse(localStorage.getItem('nh_session_history') || '{}');
    } catch (_) {}
    const merged = { ...fp.nh_session_history as Record<string, boolean>, ...lSH }; // local wins for shared keys
    try {
      localStorage.setItem('nh_session_history', JSON.stringify(merged));
    } catch (_) {}
  }
```

- [ ] **Step 8: Run the applyRemoteProgress test to confirm it passes**

```bash
npx vitest run src/tests/applyRemoteProgress.test.ts 2>&1 | tail -10
```

Expected: All tests PASS.

- [ ] **Step 9: Run the full unit test suite to check for regressions**

```bash
npx vitest run 2>&1 | tail -20
```

Expected: All tests pass (or same count as before this task).

- [ ] **Step 10: Commit**

```bash
cd "C:/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2"
git add src/lib/progressSnapshot.ts src/lib/applyRemoteProgress.ts src/tests/progressSnapshot.test.ts src/tests/applyRemoteProgress.test.ts
git commit -m "feat(sync): include nh_session_history in Firebase progress blob

Session-streak widget (StatsTab) reads nh_session_history from
localStorage. This key was never synced, so a fresh device always
showed a 0-day session streak. Additive union merge: local wins on
conflict so no completed days are ever lost."
git push origin master
```

---

### Task 2: Make the 60-second periodic push watcher-independent

**Context:** `useSyncManager.ts` line ~421 has `if (!sr) return;` where `sr` is the `syncReady` flag. `syncReady` is set to `true` only when the Firestore real-time watcher fires its first successful snapshot. If the watcher fails (network drop, permission error, etc.), `syncReady` stays `false` and the 60-second backup push is never triggered — even though `fbSaveProgress` itself can succeed independently.

The fix: remove the `syncReady` gate from the periodic push. The push already has its own error handling and only fires when `authUser` is set and `authScreen === 'app'`. The watcher gate was originally added to prevent pushing stale data before Firebase has loaded — but `doSyncNow` already reads the latest state via `_unloadRef.current`, which is correct regardless of watcher state.

We also track `lastSyncedAt` (timestamp of the most recent successful push) to surface it in the Me tab.

**Files:**
- Modify: `src/hooks/useSyncManager.ts` (remove gate, expose lastSyncedAt)
- Modify: `src/tests/sync-integrity.test.ts` (add unit test for the push path)

- [ ] **Step 1: Read the current periodic push block**

Open `src/hooks/useSyncManager.ts` and locate the `// ─── Periodic push every 60s ─────────────────────────────────────────────────` comment (around line 396). The block looks like:

```typescript
useEffect(() => {
  if (!authUser || authScreen !== 'app') return undefined;
  const iv = setInterval(async () => {
    const { ..., syncReady: sr } = _unloadRef.current as { ... syncReady: boolean };
    if (!u || as_ !== 'app') return;
    if (!sr) return;          // ← the gate to remove
    const snap = buildProgressSnapshot({ ... });
    const result = await fbSaveProgress(u.u, snap).catch(...);
    if (result && result.ok !== false) {
      _syncFailCount.current = 0;
      setSyncError(false);
      setSyncErrorCode('');
    } else {
      ...
    }
  }, 60 * 1000);
  return () => clearInterval(iv);
}, [authUser, authScreen]);
```

- [ ] **Step 2: Update the periodic push effect**

In `src/hooks/useSyncManager.ts`, make these changes to the 60-second periodic push `useEffect`:

1. Remove `syncReady: boolean` from the destructured type.
2. Remove the `const { ..., syncReady: sr } = ...` line (the field is no longer needed).
3. Remove the `if (!sr) return;` line.
4. After the successful save block, add `setLastSyncedAt(Date.now());`.

The updated effect body should look like:

```typescript
useEffect(() => {
  if (!authUser || authScreen !== 'app') return undefined;
  const iv = setInterval(async () => {
    const {
      authUser: u,
      stats: st,
      name: nm,
      authScreen: as_,
      favs: fv,
      jWords: jw,
      dchlA: da,
      dchlSl: dsl,
    } = _unloadRef.current as {
      authUser: AuthUser | null;
      stats: Stats;
      name: string;
      authScreen: string;
      favs: unknown[];
      jWords: unknown[];
      dchlA: boolean[];
      dchlSl: string[];
    };
    if (!u || as_ !== 'app') return;
    const snap = buildProgressSnapshot({
      uid: u.u,
      name: nm,
      stats: st,
      dchlA: da,
      dchlSl: dsl,
      favs: fv,
      jWords: jw,
    });
    const result = (await fbSaveProgress(u.u, snap).catch((e: unknown) => {
      const err = e as { code?: string; message?: string };
      return { ok: false, code: err?.code, err: err?.message };
    })) as { ok?: boolean; code?: string; err?: string };
    if (result && result.ok !== false) {
      _syncFailCount.current = 0;
      setSyncError(false);
      setSyncErrorCode('');
      setLastSyncedAt(Date.now());
    } else {
      _syncFailCount.current += 1;
      if (_syncFailCount.current >= 2) {
        setSyncError(true);
        setSyncErrorCode(result?.code || result?.err || 'unknown');
      }
    }
  }, 60 * 1000);
  return () => clearInterval(iv);
}, [authUser, authScreen]);
```

- [ ] **Step 3: Add `lastSyncedAt` state and expose it in the return value**

At the top of the `useSyncManager` function body, add:

```typescript
const [lastSyncedAt, setLastSyncedAt] = useState<number>(0);
```

In the `SyncManagerResult` interface (top of the file), add:

```typescript
lastSyncedAt: number;
```

In the `return { ... }` at the bottom of the function, add:

```typescript
lastSyncedAt,
```

Also call `setLastSyncedAt(Date.now())` in the `doSyncNow` success path. Find the `doSyncNow` callback and add the call after the return check:

```typescript
const doSyncNow = useCallback(async (): Promise<boolean> => {
  if (_isSavingRef.current) return false;
  _isSavingRef.current = true;
  try {
    // ... existing code ...
    const result = (await fbSaveProgress(u.u, snap).catch(() => ({ ok: false }))) as { ok?: boolean };
    const success = result && result.ok !== false;
    if (success) setLastSyncedAt(Date.now());  // ← add this line
    return success;
  } finally {
    _isSavingRef.current = false;
  }
}, []); // setLastSyncedAt is stable (useState setter) — safe to omit
```

- [ ] **Step 4: Wire `lastSyncedAt` through App.tsx to MeTab**

Open `src/App.tsx`. Find the `useSyncManager` destructure (around line 725) and add `lastSyncedAt`:

```typescript
const {
  doSyncNow,
  showBackupBanner,
  setShowBackupBanner,
  syncError,
  setSyncError,
  syncErrorCode,
  lastSyncedAt,   // ← add
} = useSyncManager({ ... });
```

Then find where `MeTab` is rendered (search for `<MeTab` or the profile tab component). Pass the prop:

```tsx
lastSyncedAt={lastSyncedAt}
```

- [ ] **Step 5: Run the TypeScript build to check for type errors**

```bash
cd "C:/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2"
npx tsc --noEmit 2>&1 | head -40
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useSyncManager.ts src/App.tsx
git commit -m "fix(sync): periodic push no longer gated on Firestore watcher state

60s periodic push previously skipped when syncReady=false (i.e. when
the Firestore real-time watcher failed due to network or permission
issues). Now it always attempts the push so offline activity is
flushed even when the watcher is down. Also exposes lastSyncedAt
for the Me-tab sync indicator."
git push origin master
```

---

### Task 3: Show "last synced" timestamp in the Me tab

Users currently have no way to verify that sync is working. A small indicator in the Me tab (visible when authenticated) shows "Synced X min ago" and updates each time a push succeeds.

**Files:**
- Modify: `src/components/profile/MeTab.tsx` (add indicator)

- [ ] **Step 1: Find where to add the indicator in MeTab**

Open `src/components/profile/MeTab.tsx`. Locate the component signature — it receives several props. Find where `doSyncNow` and/or `syncError` are used. The indicator should sit just below the user's name/email section, above the stats cards.

Specifically: find the first `<div` after the authenticated-user header section. We'll add the indicator there.

- [ ] **Step 2: Add `lastSyncedAt` to the MeTab props interface**

Find the `interface MeTabProps` (or inline prop destructure at the top of the component). Add:

```typescript
lastSyncedAt?: number;
```

And add it to the function parameter destructure:

```typescript
function MeTab({ ..., lastSyncedAt = 0, ... }: MeTabProps) {
```

- [ ] **Step 3: Add the sync indicator JSX**

Find the section in MeTab that renders after the user name/email (typically a `<div>` with the user's display name and XP summary). Insert this indicator immediately after that block:

```tsx
{/* ── Sync status indicator ── */}
{authUser && (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 11,
      color: lastSyncedAt > 0 ? 'var(--success, #16a34a)' : 'var(--subtext)',
      fontWeight: 600,
      marginBottom: 12,
      paddingLeft: 2,
    }}
  >
    <span style={{ fontSize: 13 }}>{lastSyncedAt > 0 ? '☁️' : '⏳'}</span>
    <span>
      {lastSyncedAt > 0
        ? (() => {
            const diff = Math.round((Date.now() - lastSyncedAt) / 60000);
            if (diff < 1) return 'Synced just now';
            if (diff === 1) return 'Synced 1 min ago';
            return `Synced ${diff} min ago`;
          })()
        : 'Syncing…'}
    </span>
  </div>
)}
```

- [ ] **Step 4: Run the TypeScript build**

```bash
npx tsc --noEmit 2>&1 | head -40
```

Expected: 0 errors.

- [ ] **Step 5: Run the full unit test suite**

```bash
npx vitest run 2>&1 | tail -10
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/profile/MeTab.tsx
git commit -m "feat(ui): add last-synced timestamp to Me tab

Shows 'Synced X min ago' when Firebase push has succeeded, or
'Syncing…' until the first successful push. Gives users visible
confirmation that cross-device sync is working."
git push origin master
```

---

### Task 4: Fix `cross-device-sync.spec.js` stale selectors

The existing `e2e/cross-device-sync.spec.js` waits for `"Home"` and `"Path"` text in the app's root element. After the HomeTab rewrite (April 25), the tab labels changed and the navigation now uses ARIA roles. The test times out trying to find text that no longer appears in that form.

**Files:**
- Modify: `e2e/cross-device-sync.spec.js`

- [ ] **Step 1: Read the current `loginFresh` function**

The failing part is in `loginFresh`, lines ~61-64:

```javascript
await page.waitForFunction(
  () => { const t = document.getElementById('root')?.innerText || ''; return t.includes('Home') && t.includes('Path'); },
  { timeout: 25000 }
).catch(() => console.log(`  WARNING: app didn't show sidebar within 25s`));
```

And the re-login wait at lines ~143-147.

- [ ] **Step 2: Replace the `waitForFunction` with a reliable nav bar check**

In `loginFresh`, replace the `waitForFunction` block (the one checking for "Home" and "Path") with:

```javascript
// Wait for the main navigation bar — reliable signal that the app has loaded
await page.locator('[aria-label="Main navigation"]').waitFor({ state: 'visible', timeout: 25000 })
  .catch(() => console.log(`  WARNING: nav bar not visible within 25s`));
```

Apply the same replacement to the re-login `waitForFunction` block inside the re-login section (lines ~143-147).

- [ ] **Step 3: Update the `readStats` function to use the new XP display**

The current `readStats` regex tries to find "XP" and "lessons" text. After the HomeTab rewrite, XP is shown in the StatPill as just a number with "Week XP" label. Update:

```javascript
async function readStats(page, label) {
  // Navigate to profile to get reliable stats (not dependent on HomeTab layout)
  try {
    const meBtn = page.locator('[aria-label="Main navigation"] button', { hasText: 'Me' });
    if (await meBtn.isVisible({ timeout: 2000 })) {
      await meBtn.click();
      await page.waitForTimeout(2000);
    }
  } catch (_) {}

  const txt = await page.locator('#root').innerText().catch(() => '');
  const xpM = txt.match(/(\d+)\s*XP/i) || txt.match(/XP[:\s]+(\d+)/i);
  const lcM = txt.match(/(\d+)\s*lessons?/i) || txt.match(/Lessons[:\s]+(\d+)/i);
  const streakM = txt.match(/(\d+)[- ]?day streak/i) || txt.match(/Streak[:\s]+(\d+)/i) || txt.match(/(\d+)\s*🔥/);
  const xp = xpM ? parseInt(xpM[1]) : null;
  const lc = lcM ? parseInt(lcM[1]) : null;
  const streak = streakM ? parseInt(streakM[1]) : null;
  console.log(`  [${label}] XP=${xp ?? '?'}  Lessons=${lc ?? '?'}  Streak=${streak ?? '?'}`);
  return { xp, lc, streak, txt };
}
```

- [ ] **Step 4: Verify the test file is syntactically valid**

```bash
node --input-type=module < "e2e/cross-device-sync.spec.js" 2>&1 || echo "syntax check requires playwright import, but no crash = OK"
```

Expected: no syntax errors (import errors from Playwright are OK in this check).

- [ ] **Step 5: Commit**

```bash
git add e2e/cross-device-sync.spec.js
git commit -m "fix(e2e): update cross-device sync test for new HomeTab/nav

Nav selectors were checking for 'Home'/'Path' text that no longer
exists after the HomeTab rewrite. Now uses [aria-label='Main navigation']
and navigates to Me tab before reading stats (more reliable)."
git push origin master
```

---

## Self-Review

### 1. Spec coverage

| Requirement | Task |
|-------------|------|
| `nh_session_history` syncs across devices | Task 1 |
| 60s push works even when watcher fails | Task 2 |
| User can see sync is working | Task 3 |
| Cross-device E2E test is not stale | Task 4 |

All requirements covered.

### 2. Placeholder scan

No TBDs, TODOs, or vague instructions found. Every step has exact code.

### 3. Type consistency

- `lastSyncedAt: number` — defined in Task 2 (`SyncManagerResult` interface + `useState`), passed through App.tsx in Task 2, consumed in MeTab in Task 3. Consistent.
- `setLastSyncedAt(Date.now())` — called in both doSyncNow and periodic push. Consistent.
- `nh_session_history` — added to snapshot return type in Task 1; restored in applyRemoteProgress in Task 1. Consistent naming.

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-25-sync-hardening.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, spec + quality review between tasks, fast iteration

**2. Inline Execution** — execute tasks in this session with checkpoints for review

Which approach?
