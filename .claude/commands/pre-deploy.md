# Pre-Deploy Verification

Run all quality checks before pushing to production.

## Steps

1. **Typecheck**: run `npm run typecheck` — fix any TypeScript errors before continuing.

2. **Lint**: run `npm run lint` — fix any ESLint errors. Warnings are acceptable, errors are not.

3. **Tests**: run `npm test` — all tests must pass. If any fail, investigate and fix before continuing.

4. **Build**: run `npm run build` — the build must complete with `✓ built in` in the output. Any error stops the deploy.

5. **Bundle size check** (optional): run `npm run size` to verify no chunk has grown unexpectedly large. The vendor-firebase bundle (~720KB) is expected. Flag anything new over 200KB.

6. Report results:
   - ✅ All checks passed — safe to deploy
   - ❌ Blocked on: [list what failed]

7. If all pass, confirm: "All checks passed. Run `git push origin master` to deploy."
   Do NOT push automatically — let the user confirm the deploy.
