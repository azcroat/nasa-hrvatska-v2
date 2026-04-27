---
name: nasa-hrvatska-architecture
description: Architecture orientation for the NASA Hrvatska Croatian language-learning app. Use this skill BEFORE modifying anything in src/lib/, src/hooks/, or src/components/, or before adding any feature that touches existing code. It documents the hook chain (App.tsx → useAward → useScreenLauncher → useSyncManager → useAuth), the curEx exercise ID system, where state lives (React vs localStorage vs Firestore vs sessionStorage), the nh_ naming convention, and the XP/streak/level pipeline. Trigger this even when changes look small — this codebase has subtle conventions where a one-line change in one place silently breaks something elsewhere. Memory files capture what was done; this skill captures what currently exists, which is different.
---

# NASA Hrvatska — Architecture Orientation

This is the document to read INSTEAD OF re-opening 8–10 source files at the start of every session. If you catch yourself opening `App.tsx` and `useSyncManager.ts` "just to remember how they fit together," stop — the answer is below.

## What this prevents

Re-orientation overhead. The codebase has conventions that aren't obvious from any single file: hooks must mount in a specific order, state has exactly one canonical home per piece of data, exercise IDs are flat strings (not enums) for a reason, and localStorage keys all share a prefix. Skipping orientation has produced bugs where a "simple" change broke sync, double-awarded XP, or silently lost user progress.

## The hook chain

State and side effects thread through this chain. Each hook depends on the previous one being mounted and ready:

```
App.tsx
  └─ useAward            ← XP / streak / level effects
       └─ useScreenLauncher   ← active exercise (curEx) and screen routing
            └─ useSyncManager     ← Firestore persistence, _syncReady gate
                 └─ useAuth          ← Firebase auth, uid, ready flag
```

**Why this order matters.** `useAward` produces XP changes that must be persisted; `useSyncManager` is the only thing allowed to write them; `useSyncManager` cannot run until `useAuth` resolves a uid. Hoisting any of these into a parent or reordering them breaks sync silently — usually showing up as "XP didn't save" reports days later.

**The contract per hook:**

- **useAuth** owns the uid and a `ready` boolean. Nothing should read `user.uid` without first checking `ready === true`. Sign-out closes the chain; nothing downstream should hold stale uid state across sign-out.
- **useSyncManager** owns the `_syncReady` gate and the `doSyncNow()` function. It is the only path to Firestore for progress data. If you find code calling `setDoc` directly from anywhere else, that is a bug. (See the companion skill `nasa-hrvatska-sync-architecture` for everything sync-related.)
- **useScreenLauncher** owns `curEx` (current exercise ID) and the screen launch/exit functions. `curEx` is set ONLY through its provided setter — never mutated directly, never written to localStorage from outside this hook.
- **useAward** owns the XP / streak / level pipeline. XP is awarded ONLY through `awardXP()`. Setting XP state directly bypasses streak tracking and creates the "XP went up but streak didn't" class of bug.

## The exercise ID system (`curEx`)

Every screen has a stable string identifier stored as `curEx`. Known values include `flash`, `mcgame`, `vocab_a1`, and others tied to specific lesson types and CEFR levels. The pattern: lowercase, optional `_<level>` suffix where the level is the CEFR string form (`a1`, `a2`, `b1`, etc.).

**Why a flat string instead of a TypeScript enum.** `curEx` values are persisted in localStorage and historically have been written into user records. A union type or enum that excluded an old value would orphan returning users. Flat strings are forgiving; treat unknown values as "show the home screen" rather than crashing.

**Adding a new exercise** requires three changes that must all happen together:
1. A new `curEx` value following the existing naming pattern.
2. Registration in `useScreenLauncher` so the app knows what to render for it.
3. Anywhere the codebase enumerates known exercises (search the repo for an existing value like `'flash'` to find these sites).

If any one of those is missed, the exercise either won't launch or will launch but won't persist as the "last seen" screen.

## Where does state live?

This is the single most common source of confusion in the codebase. Every piece of state has exactly one canonical home. The decision tree:

| Question | Answer | Goes in |
|---|---|---|
| Does it need to survive a device change? | Yes | **Firestore** (via `useSyncManager`) |
| Is it user progress (XP, streak, level, CEFR, SR cards)? | Yes | **Firestore**, no exceptions |
| Does it need to survive a page reload but is OK to lose on device change? | Yes | **localStorage** with `nh_` prefix |
| Is it pre-auth draft work that should migrate when the user signs in? | Yes | **localStorage** with `nh_` prefix, then merged on sign-in |
| Is it scoped to one tab and fine to lose on tab close? | Yes | **sessionStorage** |
| Is it UI-only and fine to reset on every reload? | Yes | **React state**, no persistence |

**Common mistake.** Writing user progress to localStorage "for speed" and intending to sync later. Don't. The sync layer exists; use it. If you're tempted to do this, the right answer is to make the sync write more efficient, not to bypass it.

**Common mistake.** Persisting UI state (a selected tab, a modal open/closed flag) to Firestore. Don't. That state belongs in React. Firestore writes cost money and time and trigger merge logic that doesn't apply to UI hints.

## Naming conventions

- **localStorage keys** — every key written by this app is prefixed `nh_`. If you see a localStorage call without that prefix, it's either third-party (Firebase SDK, etc.) or a bug. New keys must follow the prefix.
- **Firestore document keys** — user data lives at `users/{uid}/progress/{key}`. The `{key}` namespace is documented in the sync skill.
- **Component files** — PascalCase, one component per file, file name matches the default export.
- **Hook files** — camelCase, must start with `use`, one hook per file.
- **Library files in `src/lib/`** — lowercase, named by what they do (e.g. a function called `buildProgressSnapshot` lives in or near a file with a matching name).

## XP / streak / level pipeline

The flow, end to end:

```
1. User completes an exercise.
2. The exercise component calls awardXP(amount, { source: curEx }).
3. useAward updates xp_total, recomputes level from xp_total, and updates
   streak based on whether today is a new day vs the last award day.
4. React state changes.
5. doSyncNow() is called explicitly from the same code path.
6. useSyncManager runs through the _syncReady gate and the dedup guard.
7. buildProgressSnapshot() assembles the new state.
8. Firestore receives a write at users/{uid}/progress/{key}.
```

**Things that have broken this in the past:**
- Setting XP state directly instead of through `awardXP()` — bypasses streak logic. The streak doesn't advance and the user reports "I did my lesson but my streak reset."
- Calling `awardXP()` from inside a `useEffect` whose dependency includes XP — produces an infinite loop. If you need to award XP as a side effect, gate it on a different value (the exercise completion event, not the resulting XP).
- Computing `level` inline in a component for display — drifts from the canonical formula in `useAward`. Always read `level` from `useAward`'s return value.
- Awarding XP before `_syncReady` is open — the award succeeds in React but the sync that follows is dropped because the gate is closed. The next sync may or may not pick it up. Always wait for the chain to be ready before allowing exercise interactions.

## What's safe to add to vs. what requires full-context reading

The codebase has two tiers of code:

**Tier 1 — high context, read fully before touching.** These files coordinate multiple subsystems. A change in one of them can cascade. Treat any edit as requiring a full read of the file plus its callers:
- `src/App.tsx`
- Anything in `src/hooks/` — especially `useAuth`, `useSyncManager`, `useScreenLauncher`, `useAward`
- Anything in `src/lib/` related to sync, Firestore, auth, or persistence
- The Firestore security rules file
- The service worker

**Tier 2 — usually safe to add to.** These files are leaves of the dependency graph; adding new files alongside them is safer than editing existing ones:
- New components in `src/components/` (especially for new exercises) — prefer adding a new file over modifying a shared one
- New utility functions in `src/lib/` that don't touch sync or auth
- New routes under `functions/` (load `cloudflare-pages-functions` skill for the pattern)

**The rule.** When in doubt, add a new file rather than modify an existing one. The codebase has more places that imported a thing than you can find by grep alone — modifying a widely-used helper is high risk; adding a new helper next to it is low risk.

## When in doubt, also load these skills

- Touching XP, streak, level, CEFR, SR cards, or anything Firestore-persisted → also load `nasa-hrvatska-sync-architecture`.
- Adding or modifying a `functions/` endpoint → also load `cloudflare-pages-functions`.
- Touching the service worker, cache, manifest, or offline behavior → also load `pwa-service-worker-patterns`.
- Writing or fixing a Playwright test → also load `playwright-e2e-patterns`.

## Keeping this skill current

This document captures the architecture as understood today. When you discover that the codebase has diverged from what's written here — a new hook in the chain, a renamed file, a new state location, a new `curEx` value — update this skill in the same PR as the code change. A skill that's stale is worse than no skill, because it confidently misleads.

The maintenance rule: if you spent more than a minute orienting yourself on something that should have been here, add it.
