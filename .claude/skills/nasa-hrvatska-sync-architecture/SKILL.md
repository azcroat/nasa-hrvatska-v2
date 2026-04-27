---
name: nasa-hrvatska-sync-architecture
description: Sync layer rules for the NASA Hrvatska app's Firestore persistence. Use this skill whenever you touch anything that gets persisted to Firestore — including fields in buildProgressSnapshot, calls to doSyncNow, the _syncReady gate, the SR (spaced repetition) save path, anything in useSyncManager, the 5-second dedup guard, or anything that affects the users/{uid}/progress/{key} document shape. Also use it when changing the CEFR field, since the int-not-string rule is enforced by Firestore security rules and a violation rejects the entire write. Most sync bugs come from violating one of the merge rules or forgetting to call doSyncNow after a state change. Trigger this even if the change looks like a UI tweak — if state ends up in Firestore, this skill applies. Companion to nasa-hrvatska-architecture.
---

# NASA Hrvatska — Sync Architecture

The sync layer is the most bug-prone part of this codebase. Three sync bugs were introduced in a single recent session, and each one was a violation of a rule documented below. Read this before touching anything that persists.

## Mental model

```
React state changes (via awardXP, screen exit, SR update, etc.)
          ↓
caller invokes doSyncNow()    ← REQUIRED, not automatic
          ↓
5-second dedup guard          ← debounces rapid calls
          ↓
_syncReady gate               ← blocks until uid + initial read are both ready
          ↓
buildProgressSnapshot()       ← assembles the document from current state
          ↓
merge against remote          ← per-field merge strategy, see below
          ↓
Firestore write at users/{uid}/progress/{key}
```

Every step has a rule. Skipping or breaking one of them produces silent data loss, write storms, infinite loops, or `permission-denied` errors that look like network problems.

## `buildProgressSnapshot()` — the contract

This function is the single source of truth for what gets written to `users/{uid}/progress/{key}`. The fields it assembles are exactly the fields persisted; nothing more, nothing less.

**Adding a field requires four coordinated changes:**
1. Add the field to `buildProgressSnapshot()`.
2. Add a row to the merge rules table (next section). Decide deliberately which strategy applies.
3. Update the Firestore security rules to allow the field and validate its type.
4. Update any TypeScript types that mirror the snapshot shape.

If you skip step 3, every write fails with `permission-denied` and the user just sees a stuck loading state. If you skip step 4, TypeScript stops protecting you and a typo in the field name silently writes to the wrong key.

**Removing a field requires extra care.** Existing user documents already have the field. Don't strip it from `buildProgressSnapshot()` and call it done — write a migration or accept that old data stays in the document. Firestore's `set` with merge does not delete fields; you have to use `FieldValue.delete()` deliberately.

## Merge rules — picking the right strategy

When a sync runs, the local snapshot is merged against whatever's already at `users/{uid}/progress/{key}`. Choosing the wrong merge strategy is the most common sync bug in this codebase. The categories:

| Field type | Strategy | Reasoning |
|---|---|---|
| Numeric progress that only ever increases (XP, streak, level, CEFR int) | `Math.max(local, remote)` | If remote is higher, the user earned it on another device. Latest-wins would lose those gains. |
| Sets that grow (cards seen, lessons completed, achievements) | Union by id | Items added on either device must survive. Latest-wins on a set throws away the smaller side. |
| Per-item records inside a collection (each SR card's schedule) | Union of ids, latest-wins per item | The set of cards is a union; each card's individual state uses the most recent update. |
| UI hints that are fine to lose (lastSeenDeck, lastTab) | Latest-wins by timestamp | These aren't progress; whichever device most recently touched it is fine. |
| Settings and preferences | Latest-wins | User intent is "the last thing I picked." |

**The default mistake.** Reaching for "latest-wins" because it feels simpler. For progress data, latest-wins is almost always wrong. If the local device has been offline for an hour while another device earned XP, latest-wins overwrites those gains the moment local comes back online. `Math.max` for numbers and union-merge for sets is the safe default for anything that represents progress.

**Computed fields are not merged.** `level` is computed from `xp_total`. Don't merge `level` directly; merge `xp_total` and recompute `level` from the result. Otherwise you can produce a state where `level` and `xp_total` disagree, which the UI then displays inconsistently.

## The `_syncReady` gate

`_syncReady` is a boolean owned by `useSyncManager`. It guards every Firestore write that goes through this layer.

**It opens when all of these are true:**
- `useAuth` reports `ready === true` and a uid exists.
- The initial Firestore read has completed and merged into local state.
- The local state machine is in a "writeable" position (not mid-sign-out, not in an error state).

**It closes when:**
- The user signs out.
- Auth becomes invalid.
- An unrecoverable sync error occurs (network errors don't close it; auth and rules errors do).

**Why it exists.** Without the gate, this race is possible: app starts → local state has defaults (XP = 0) → a `doSyncNow()` fires before the initial Firestore read completes → local defaults overwrite remote progress. The gate makes that race impossible by holding all writes until the read finishes.

**Never bypass the gate.** If you find yourself wanting to write `if (true)` instead of checking `_syncReady`, or reaching directly into `useAuth` to grab the uid and skip past `useSyncManager`, the right answer is almost always to await the gate properly. The gate is the safety mechanism; bypassing it is how you produce the worst class of bug — the one that wipes user progress.

## When `doSyncNow()` MUST be called

After ANY state change that affects a Firestore-persisted field. This is bug-class #1: making a state change and forgetting the sync call.

Every one of these requires a `doSyncNow()` in the same code path:
- After `awardXP()` resolves (XP, streak, and level all change).
- After CEFR level changes.
- After an SR card is added, scheduled, or retired (note: SR has its own save path via `fbSaveSRS`, but the surrounding metadata still goes through the main snapshot).
- After `lastSeenDeck` or any other persisted "last X" pointer updates.
- After settings/preferences that are persisted (not local-only) change.
- Before sign-out — flush any pending changes before the chain closes.

**The pattern:**

```ts
// good — explicit, deterministic
await awardXP(10, { source: 'flash' });
doSyncNow();

// bad — relies on a useEffect that may run after the user has navigated away
useEffect(() => {
  if (xp !== prevXp) doSyncNow();
}, [xp]);
```

The effect-based pattern looks cleaner but interacts badly with the dedup guard and React 18's strict mode (which runs effects twice in development, masking ordering bugs). Call `doSyncNow()` from the same code path that did the mutation. It's verbose but correct.

## The 5-second dedup guard

`useSyncManager` debounces writes: if `doSyncNow()` is called within 5 seconds of a previous successful sync, the second call is dropped. This prevents write storms during rapid XP awards (a flash session that awards XP per card would otherwise hammer Firestore).

**What bypasses the guard:**
- An explicit force flag on `doSyncNow()` for cases where you must write immediately (sign-out, beforeunload).
- Any code path that calls the underlying write helper directly — but that path should not exist in normal feature code; the guard is there for a reason.

**What does NOT bypass the guard:**
- Rapid XP awards in the same window. They coalesce into a single sync that captures the final state. This is intentional and correct.
- Multiple component re-renders that each try to sync. The guard absorbs them.

**The subtle failure mode.** The guard means "this state will be included in the next allowed sync," not "this sync is dropped forever." But if the user navigates away or the page unloads in the 5-second window, the pending sync is gone. The unload handler should force-flush; verify this is wired before adding new persisted fields.

## `getSR()` and `fbSaveSRS` — the SR contract

Spaced repetition cards are the largest piece of user state. They live at a separate Firestore path from the main progress doc because their size would push the main doc past Firestore's 1 MB limit.

**`getSR()`** returns the local SR state — the cards array plus deck metadata. It reads from local React state, not Firestore directly; the local state is hydrated from Firestore on initial load through the same `_syncReady` flow as everything else.

**`fbSaveSRS(cards)`** writes the cards collection to Firestore using `set` with merge. It applies the per-card merge strategy: union by card id, latest-wins per individual card.

**Critical constraint.** SR cards are NOT part of `buildProgressSnapshot()`. They are persisted on a separate path with their own save function. Don't try to "simplify" by folding them into the main progress doc — Firestore will reject the document once the user accumulates enough cards. Conversely, don't add new high-volume collections to the main snapshot for the same reason; create a parallel save path.

**When to call `fbSaveSRS`.** After any change to the cards array — scheduling a card, retiring a card, adding a new card. The dedup guard doesn't cover this path; SR has its own debouncing internal to `fbSaveSRS`.

## Firestore path structure

```
users/{uid}/progress/{key}        ← buildProgressSnapshot() writes here
users/{uid}/sr/{deckId}           ← fbSaveSRS() writes here, one doc per deck
```

The `{key}` namespace under `progress/` separates different kinds of progress data into separate documents. Adding a new key means adding a new document in the user's subtree, which means: new security rules for that path, new initial-read code in `useSyncManager`, and new merge logic if the document overlaps with existing fields.

## The CEFR int-not-string rule

The CEFR level (A1, A2, B1, B2, C1, C2) is stored in Firestore as an **integer**, never as a string. Firestore security rules enforce this with a `request.resource.data.cefr is int` clause. Writing a string makes the entire document write fail with `permission-denied`, and the user sees a sync failure that looks like a network problem.

**The mapping:**

| CEFR display | Firestore int |
|---|---|
| A1 | 1 |
| A2 | 2 |
| B1 | 3 |
| B2 | 4 |
| C1 | 5 |
| C2 | 6 |

Convert at the boundary. Do the int-to-string conversion in `buildProgressSnapshot()` (or whatever produces the document), and use the string form freely in UI code. The string form is more readable and catches typos at compile time when used as a TypeScript literal type. Just never let a string cross the network into Firestore.

**Why this rule exists.** A previous version stored CEFR as strings, which made range queries ("show me users at B1 or above") require client-side parsing. Switching to int allows direct numeric comparison in security rules and queries. The rule is enforced at the Firestore level so client-side bugs can't silently regress the schema.

## Pre-flight checklist before merging a sync-touching change

Walk this list before opening a PR that changes anything in this skill's scope:

1. Did you add or remove a field in the snapshot? Then `buildProgressSnapshot()`, the merge rules table, the Firestore security rules, and the TypeScript types are all updated.
2. Did you add a state change that affects persisted data? Then `doSyncNow()` is called from the same code path that did the mutation, not via a `useEffect`.
3. Did you change a merge strategy? Then there's a test (or at least a manual verification note) for both "local higher" and "remote higher" and "both have edits."
4. Did you touch `_syncReady`? Then verify the read-before-write ordering still holds across sign-in and sign-out.
5. Did you touch CEFR anywhere? Then the value crossing the network is an int.
6. Did you add a high-volume collection? Then it's persisted on a separate Firestore path, not folded into the main snapshot.
7. Did you add a new doc key under `users/{uid}/progress/`? Then security rules cover it and the initial-read code knows about it.

## Keeping this skill current

If you discover a sync rule the codebase actually follows that isn't documented here, add it. If you change a rule, update this skill in the same PR. The cost of a stale sync skill is much higher than the cost of a stale architecture skill — sync bugs corrupt user data.
