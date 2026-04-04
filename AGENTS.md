# AGENTS.md — Naša Hrvatska

Behavioral specification for AI agents (Claude Code and any future agents) working on this codebase. Complements CLAUDE.md (project context) — this file covers *how* to operate, not *what* the project is.

---

## Authorization Matrix

### Act autonomously (no confirmation needed)
- Read any file in the repo
- Edit source files (`src/`, `functions/`, `public/`, `scripts/`)
- Run `npm test`, `npm run lint`, `npm run build`, `npm run typecheck`
- Run `git add`, `git commit`, `git push origin master`
- Run `npx wrangler` commands from the project directory
- Run `curl` against Cloudflare API with the wrangler OAuth token
- Create new files when genuinely required by the task

### Confirm with user before acting
- Deleting any file (`rm`, `git rm`)
- Modifying Firestore security rules (`firestore.rules`)
- Changing Firebase project configuration (`FIREBASE_CONFIG` in firebase.js)
- Rotating or exposing any secret/API key
- Force-pushing or resetting git history
- Changing the Cloudflare Pages production environment variables
- Any action that could affect user data in Firestore

### Never do (hard stops)
See the **NEVER DO** section in CLAUDE.md — these apply to all agents equally.

---

## Task Approach Rules

### Before starting any task
1. Read the relevant files — never edit code you haven't read
2. Check CLAUDE.md for architecture invariants that apply to the change
3. For sync-related changes: verify both `progressSnapshot.ts` AND `applyRemoteProgress` (useSyncManager.js) stay in sync
4. For LEARN_PATH changes: verify both `content.jsx` (ck function) AND `useScreenLauncher.js` (BLACK_HOLE_SCREENS) are updated together

### Making changes
- Smallest diff that solves the problem — no scope creep
- One logical concern per commit
- Always run `npm run build` before committing to catch bundle errors
- Run `npm test` before committing when touching lib/, hooks/, or data files

### After committing
- Always `git push origin master` immediately — Cloudflare deploys on push, not on commit
- Confirm the push succeeded before reporting done

---

## Firebase / Sync Change Protocol

Changes to the sync pipeline are the highest-risk category. Follow this order:

1. **progressSnapshot.ts** — add the new field to `buildProgressSnapshot()`
2. **useSyncManager.js** — add the corresponding restore in `applyRemoteProgress()`
3. **Firestore security rules** — if the field needs read/write access, update rules
4. Run `npm run verify:firestore` to confirm rules pass
5. Test the round-trip: save → read back → confirm field survives

Never add a field to one without the other. Missing from `progressSnapshot` = never saved. Missing from `applyRemoteProgress` = saved but never restored.

---

## Stats / XP Change Protocol

All XP and stat mutations must go through the reducer:
- `dispatch({ type: 'AWARD_XP', payload: { amount, reason } })`
- `dispatch({ type: 'COMPLETE_LESSON' })`
- `dispatch({ type: 'COMPLETE_GRAMMAR' })`
- `dispatch({ type: 'VISIT_SCREEN', payload: { key } })`

Never write to `stats` directly. Never call `fbSaveProgress` from a component.

---

## LEARN_PATH Change Protocol

When adding or modifying a lesson:
1. **content.jsx**: write `ck` using `vs.includes('screenKey')` as primary check
2. **useScreenLauncher.js**: add `screenKey: 'lc'` or `screenKey: 'gc'` to `BLACK_HOLE_SCREENS` if the screen has no built-in quiz
3. Verify the screenKey string is identical in both files (typos cause silent failures)

---

## Cloudflare Functions Change Protocol

When modifying `functions/api/*.js`:
- Check whether the function needs KV, D1, or environment variables
- KV bindings must exist in BOTH `wrangler.toml` (for the scheduled worker) AND Cloudflare Pages dashboard (for Pages Functions) — they are separate
- Test locally with `npx wrangler pages dev dist` if the change is non-trivial

---

## Error Handling Approach

- Use `src/lib/errorReporter.ts` for non-fatal errors that should appear in Sentry
- Wrap third-party calls (Firebase, Cloudflare, Azure TTS) in try/catch with graceful degradation
- Never let a Firestore cache failure block auth initialization (see three-tier fallback in firebase.js)
- Prefer fail-open over fail-closed for optional features (analytics, push notifications, ambient audio)

---

## Commit Message Format

```
<verb> <what changed> — <why / impact>

- bullet detail if needed
- another detail

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Verbs: `Fix`, `Add`, `Remove`, `Refactor`, `Update`, `Improve`

Examples:
- `Fix Firebase not configured — three-tier Firestore cache fallback`
- `Add weekXP to fbJoinFamily — family leaderboard shows correct XP on join`
- `Remove apology modal — no longer shown to any user`

---

## What Requires a Sentry Check

Before pushing a fix for a production error, search Sentry for the exact error message to understand scope (how many users, which browsers, how long it's been happening). The Sentry project is `javascript-react`, environment `production`.

---

## Agent Coordination (Future)

If multiple agents are ever used concurrently on this repo:
- Only one agent should touch `firebase.js` at a time (auth + sync core)
- Only one agent should touch `content.jsx` at a time (LEARN_PATH is large and conflict-prone)
- Stats-related files (`statsReducer.ts`, `progressSnapshot.ts`, `mergeStatsFromRemote.ts`, `sanitizeStats.ts`) must be treated as a single unit — changes to one may require changes to others
