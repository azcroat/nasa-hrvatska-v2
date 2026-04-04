# Audit Sync Field Coverage

Verify every persisted field is present in both `buildProgressSnapshot` and `applyRemoteProgress` — the two must stay in exact alignment.

## Steps

1. Read `src/lib/progressSnapshot.ts` and list every field returned by `buildProgressSnapshot()`.

2. Read `src/hooks/useSyncManager.js` and find the `applyRemoteProgress` function. List every field it reads from the remote snapshot and applies locally (localStorage sets, state dispatches, etc.).

3. Compare the two lists:
   - **Missing from applyRemoteProgress**: fields saved to Firebase but never restored on login from a new device — data is persisted but silently lost on restore
   - **Missing from progressSnapshot**: fields restored but never saved — will always revert to default after a sync
   - **Present in both**: ✅ correct

4. For each gap found, determine the correct fix:
   - Missing from `applyRemoteProgress`: add a restore line reading from `remote.<field>` and writing to localStorage or dispatching to stats
   - Missing from `progressSnapshot`: add the field to `buildProgressSnapshot()`

5. Apply all fixes, then run `npm test` to confirm nothing breaks.

6. Commit: `Fix sync field coverage — <list of fields added>`
