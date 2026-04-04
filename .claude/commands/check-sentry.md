# Check & Triage Sentry Errors

Review recent production errors from Sentry and determine which need fixing.

## Steps

1. Ask the user to paste any recent Sentry error notifications, or describe the error they're seeing. (Claude Code cannot access Sentry directly without credentials.)

2. For each error provided:
   - Identify the **file and line number** from the stack trace
   - Determine the **root cause** (null dereference, missing guard, API failure, browser compatibility, etc.)
   - Assess **blast radius**: how many users affected, which browsers/devices, how long it's been occurring
   - Classify severity: P0 (sign-in/data loss broken), P1 (feature broken for many), P2 (feature broken for some), P3 (cosmetic/edge case)

3. For P0 and P1 errors: fix immediately, test, commit, push.

4. For P2 and P3: describe the fix needed and ask whether to proceed now or queue for later.

5. After fixing, update CLAUDE.md "NEVER DO" section if the error reveals a new class of mistake to avoid.
