# Audit Learn Path Integrity

Verify every LEARN_PATH entry in `src/data/content.jsx` can be completed and awards XP correctly.

## Steps

1. Read `src/data/content.jsx` and extract every LEARN_PATH entry — its key, `ck` function body, and the screen name it maps to.

2. Read `src/hooks/useScreenLauncher.js` and extract the full `BLACK_HOLE_SCREENS` object.

3. For each LEARN_PATH entry, check:
   - **Has a ck function**: every entry must have a `ck` property
   - **Uses vs.includes()**: if the screen is in BLACK_HOLE_SCREENS, `ck` must check `s.vs && s.vs.includes('screenKey')` as the primary condition
   - **Screen key matches**: the screenKey in `ck` matches the key in BLACK_HOLE_SCREENS exactly (case-sensitive)
   - **No orphaned screens**: every screen in BLACK_HOLE_SCREENS must have at least one matching LEARN_PATH entry
   - **No orphaned LEARN_PATH entries**: every LEARN_PATH entry that references a screenKey must have that key in BLACK_HOLE_SCREENS (unless the screen has a built-in quiz that sets lc/gc directly)

4. Report:
   - ✅ PASS: entries that are correct
   - ❌ FAIL: entries missing vs.includes(), missing from BLACK_HOLE_SCREENS, or with mismatched keys
   - ⚠️ WARN: entries using only lc/gc thresholds without vs check (may be intentional for quiz screens)

5. Fix any FAILs found. Do not fix WARNs unless clearly unintentional.

6. Commit fixes with message: `Fix LEARN_PATH audit — <summary of what was fixed>`
