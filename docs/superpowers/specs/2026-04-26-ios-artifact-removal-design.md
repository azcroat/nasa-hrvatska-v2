# iOS Build Artifact Removal — Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the stale `ios/` Capacitor build directory from version control so it no longer pollutes the repo with outdated compiled assets and unfixable CodeQL alerts.

**Architecture:** The `ios/` directory is Capacitor build output, not source code. It is fully reproducible from the current web source with two commands. Keeping it in git serves no purpose while iOS is on the backburner and actively causes harm (stale vendor files, 5 dismissed CodeQL alerts, ~20MB of compiled artifacts in git history on every rebuild).

**Tech Stack:** git, `.gitignore`, Capacitor CLI (for future regeneration)

---

## Context

- iOS App Store release is on hold pending significant user engagement on Android + PWA
- `ios/App/App/public/` contains web assets compiled from an old build — the source `sw.js` has since been patched for security but the iOS compiled copy has not
- 5 CodeQL alerts on `ios/App/App/public/assets/vendor-firebase-*.js` and `ios/App/App/public/sw.js` were dismissed as "vendor/build artifact" because they cannot be edited — removing them from the repo eliminates the issue at the root
- Regeneration when iOS resumes: `npm run build && npx cap add ios && npx cap sync` (≈ 2 minutes)

## What Changes

### `.gitignore`
Add `ios/` exclusion with explanatory comment:
```
# Capacitor iOS build output — not source, fully regenerable.
# When resuming iOS development: npm run build && npx cap add ios && npx cap sync
ios/
```

### Git Index
Strip `ios/` from git tracking without deleting local files:
```bash
git rm -r --cached ios/
```

### Commit & Push
Single commit removes all `ios/` content from the repository. Cloudflare Pages build is unaffected (it only uses `src/`, `functions/`, `public/`).

## What Does NOT Change
- Local `ios/` directory is untouched (only removed from git tracking)
- Android build process is unaffected
- Cloudflare Pages deployment is unaffected
- No source files are modified

## Success Criteria
- `git ls-files ios/` returns empty
- `.gitignore` contains `ios/` with comment
- CodeQL alerts #31, #32, #34, #35, #36 auto-close on next scan (paths no longer in repo)
- A future developer can regenerate the iOS project with the documented 2-command sequence

## Future iOS Resumption
When iOS development resumes:
1. `npm run build` — build current web source
2. `npx cap add ios` — scaffold fresh iOS Capacitor project
3. `npx cap sync` — sync web assets into iOS project
4. Remove `ios/` from `.gitignore`
5. Commit the regenerated iOS project
