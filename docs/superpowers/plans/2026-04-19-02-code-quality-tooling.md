# Sub-project 2: Code Quality Tooling — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install Prettier and madge, restore `react-hooks/exhaustive-deps` to `warn`, bulk-format the entire codebase, and enforce all three in pre-commit hooks and CI.

**Architecture:** Six targeted changes in strict sequence. Prettier and madge are installed first (Tasks 1–3). The bulk format commit happens in Task 4 — BEFORE lint-staged is tightened (Task 5) — so the format commit is not blocked by the new pre-commit rules. CI enforcement is added last (Task 6) so every prior commit is already compliant when CI sees them. Two ESLint rules (`@typescript-eslint/ban-ts-comment` and `no-explicit-any: error`) are intentionally deferred to Sub-project 3; enabling them now would immediately break CI due to 211 `@ts-nocheck` instances still in the codebase.

**Tech Stack:** Prettier 3.x, madge 6.x, ESLint 9 flat config (`eslint.config.js`), Husky v9 + lint-staged v16, GitHub Actions

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `package.json` | Modify | Add `prettier` + `madge` to devDependencies; add `check:circular` script; replace `lint-staged` config |
| `.prettierrc` | Create | Prettier configuration (semi, singleQuote, trailingComma: all, printWidth: 100) |
| `.prettierignore` | Create | Exclude dist, node_modules, android, public, src/data.jsx |
| `eslint.config.js` | Modify | Remove `exhaustive-deps: 'off'` override in JS/JSX block (line ~90); change `exhaustive-deps: 'off'` to `'warn'` in TS/TSX hooks block (line ~151) |
| `src/**/*.{ts,tsx,js,jsx}` | Modify | Prettier reformatting — no logic changes |
| `functions/**/*.js` | Modify | Prettier reformatting — no logic changes |
| `.github/workflows/ci.yml` | Modify | Add `Prettier format check` and `Circular dependency check` steps to `quality` job |

---

## Task 1: Install Prettier and Create Configuration Files

**Files:**
- Create: `.prettierrc`
- Create: `.prettierignore`
- Modify: `package.json` (devDependencies)

- [ ] **Step 1: Install Prettier as a devDependency**

```bash
npm install --save-dev prettier
```

Expected: `package.json` devDependencies now contains `"prettier": "^3.x.x"` and `package-lock.json` is updated.

- [ ] **Step 2: Create `.prettierrc`**

Create `C:\Users\jschr\Dropbox\Croatian Learning Application\Source Code\nasa-hrvatska-v2\.prettierrc` with exactly this content:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

- [ ] **Step 3: Create `.prettierignore`**

Create `C:\Users\jschr\Dropbox\Croatian Learning Application\Source Code\nasa-hrvatska-v2\.prettierignore` with exactly this content:

```
dist/
node_modules/
public/
android/
ios/
coverage/
src/data.jsx
*.min.js
```

`src/data.jsx` is excluded because it is a 700 KB data file with no logic — reformatting it produces a massive diff with zero benefit and is explicitly out of scope for this project.

- [ ] **Step 4: Verify Prettier is installed and config is valid**

```bash
npx prettier --version
npx prettier --check .prettierrc
```

Expected: First command prints a version number (e.g., `3.5.x`). Second command exits 0 (the config file itself is valid JSON already formatted).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .prettierrc .prettierignore
git commit -m "chore(sp2): install prettier, add .prettierrc and .prettierignore"
```

---

## Task 2: Restore react-hooks/exhaustive-deps to 'warn' in eslint.config.js

**Files:**
- Modify: `eslint.config.js`

**Context:** There are three occurrences of `react-hooks/exhaustive-deps` in `eslint.config.js`:

1. **Line 69** (JS/JSX block, first setting): `'react-hooks/exhaustive-deps': 'warn'` — CORRECT, leave it.
2. **Line 90** (JS/JSX block, override): `'react-hooks/exhaustive-deps': 'off'` — this overrides line 69 and must be removed along with its comment on line 89.
3. **Line 151** (TS/TSX hooks block): `'react-hooks/exhaustive-deps': 'off'` — must change to `'warn'`.
4. **Line 174** (test files block): `'react-hooks/exhaustive-deps': 'off'` — leave as `'off'`. Tests don't declare hooks that need dependency tracking.

The spec note: "Restore from OFF to WARN (safe — adds warnings, does not fail build on existing code)". The CI `quality` job runs `npm run lint` without `--max-warnings=0`, so warnings do not fail CI.

- [ ] **Step 1: Verify current state — exhaustive-deps produces no warnings**

```bash
npm run lint 2>&1 | grep "exhaustive-deps" | wc -l
```

Expected: `0` — no exhaustive-deps warnings currently (rule is 'off').

- [ ] **Step 2: Edit eslint.config.js — remove the JS/JSX override**

In the JS/JSX block (the block with `files: ['src/**/*.{js,jsx}']`), find and remove these two lines (they appear near the bottom of the `rules` object, just before the closing `}`):

**Remove these lines:**
```js
      // exhaustive-deps: ref pattern is used intentionally throughout (useCallback + ref)
      'react-hooks/exhaustive-deps': 'off',
```

After removal, the last few lines of the JS/JSX rules block look like:

```js
      'prefer-const': 'off',        // Style preference — deferred
      'no-empty': 'off',            // Intentional empty catch blocks exist throughout
      'no-useless-escape': 'off',   // Escaped characters in Croatian data strings — harmless
    },
  },
```

- [ ] **Step 3: Edit eslint.config.js — update TS/TSX hooks block**

Find the TS/TSX hooks block:

```js
  // React hooks plugin for TypeScript files (mirrors .js/.jsx block above)
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/exhaustive-deps': 'off',
      'no-empty': 'off',
    },
  },
```

Change `'react-hooks/exhaustive-deps': 'off'` to `'react-hooks/exhaustive-deps': 'warn'`:

```js
  // React hooks plugin for TypeScript files (mirrors .js/.jsx block above)
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
      'no-empty': 'off',
    },
  },
```

- [ ] **Step 4: Run ESLint to verify it passes**

```bash
npm run lint
```

Expected: ESLint exits 0. Warnings for exhaustive-deps may now appear in the output — this is correct behavior. The command must NOT exit with code 1 or 2.

- [ ] **Step 5: Verify exhaustive-deps warnings are now active**

```bash
npm run lint 2>&1 | grep "exhaustive-deps" | head -5
```

Expected: One or more lines appear containing `exhaustive-deps`. If zero lines, the rule change did not take effect — re-check Steps 2 and 3.

- [ ] **Step 6: Commit**

```bash
git add eslint.config.js
git commit -m "fix(sp2): restore react-hooks/exhaustive-deps to warn in JS and TS eslint blocks"
```

---

## Task 3: Install madge and Add check:circular Script

**Files:**
- Modify: `package.json` (devDependencies, scripts)

- [ ] **Step 1: Install madge as a devDependency**

```bash
npm install --save-dev madge
```

Expected: `package.json` devDependencies now contains `"madge": "^6.x.x"`.

- [ ] **Step 2: Add check:circular script to package.json**

In `package.json`, in the `scripts` section, add this entry after `"typecheck": "tsc --noEmit"`:

```json
"check:circular": "madge --circular --extensions ts,tsx,js,jsx src/",
```

- [ ] **Step 3: Run check:circular to verify zero circular imports**

```bash
npm run check:circular
```

Expected: Command exits 0 with output:
```
No circular dependency found!
```

If circular dependencies are found, they will be listed as import chains. Record each one, fix the circular import by restructuring the import (e.g., moving shared logic to a third file), then re-run until zero circular deps remain before proceeding.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(sp2): install madge, add check:circular script"
```

---

## Task 4: Bulk-Format All Source Files with Prettier

**Files:**
- Modify: `src/**/*.{ts,tsx,js,jsx}` (formatting only — zero logic changes)
- Modify: `functions/**/*.js` (formatting only — zero logic changes)

**Critical sequencing note:** This task runs BEFORE Task 5 (lint-staged update). The current pre-commit hook only checks `no-debugger` and `rules-of-hooks` on JS/JSX — it will not block the bulk format commit. After Task 5, lint-staged will enforce `--max-warnings=0` on all staged files; if Task 4 ran after Task 5, the bulk format commit would be blocked by exhaustive-deps warnings in many files.

- [ ] **Step 1: Verify Prettier would make changes (dry-run)**

```bash
npx prettier --check "src/**/*.{ts,tsx,js,jsx}" "functions/**/*.js"
```

Expected: FAIL — Prettier reports many files need reformatting. This confirms the bulk format is needed and the config is working correctly.

- [ ] **Step 2: Format all source files**

```bash
npx prettier --write "src/**/*.{ts,tsx,js,jsx}" "functions/**/*.js"
```

Expected: Prettier rewrites all matching files. `src/data.jsx` is automatically skipped (listed in `.prettierignore`). Output shows a list of files that were changed.

- [ ] **Step 3: Run ESLint to verify no logic was broken by reformatting**

```bash
npm run lint
```

Expected: ESLint exits 0. Same warnings as before the format, no new errors.

- [ ] **Step 4: Run unit tests to verify no test assertions were broken**

```bash
npm run test:coverage
```

Expected: All tests pass, coverage ≥80% on all four metrics (statements, branches, functions, lines). Prettier only changes whitespace/quotes/semicolons — test logic is unaffected.

- [ ] **Step 5: Verify Prettier check now passes**

```bash
npx prettier --check "src/**/*.{ts,tsx,js,jsx}" "functions/**/*.js"
```

Expected: SUCCESS — "All matched files use Prettier code style!" (or similar). If any files are still reported, run `npx prettier --write` on them specifically and re-check.

- [ ] **Step 6: Commit all formatted files**

```bash
git add src/ functions/
git commit -m "style(sp2): bulk-format all source files with Prettier (no logic changes)"
```

---

## Task 5: Update lint-staged Configuration

**Files:**
- Modify: `package.json` (lint-staged section)

The current lint-staged config is minimal — it only checks two specific ESLint rules on JS/JSX files and ignores TS/TSX files entirely. The new config runs Prettier then full ESLint on all source file types.

**Effect after this task:** Any developer committing a file with ESLint warnings (including `exhaustive-deps` violations) will be blocked at the pre-commit stage. This is the intended behavior — it forces incremental warning cleanup as files are touched.

- [ ] **Step 1: Update the lint-staged section in package.json**

Find the `lint-staged` section in `package.json`:

**Before:**
```json
"lint-staged": {
  "src/**/*.{js,jsx}": "eslint --rule '{\"no-debugger\":\"error\",\"react-hooks/rules-of-hooks\":\"error\"}'",
  "functions/**/*.js": "eslint --max-warnings=0"
}
```

**After:**
```json
"lint-staged": {
  "src/**/*.{ts,tsx,js,jsx}": ["prettier --write", "eslint --max-warnings=0"],
  "functions/**/*.js": ["prettier --write", "eslint --max-warnings=0"]
}
```

- [ ] **Step 2: Stage a file and run lint-staged manually to verify it works**

```bash
git add src/tests/statsReducer.test.ts
npx lint-staged --verbose
git restore --staged src/tests/statsReducer.test.ts
```

Expected: lint-staged runs `prettier --write` (no change needed — file already formatted in Task 4) then `eslint --max-warnings=0` (exits 0 — this test file has no hook warnings). The `git restore` unstages the file so it's not accidentally included in the commit.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore(sp2): update lint-staged to run prettier + full eslint on all source types"
```

---

## Task 6: Add Prettier Check and Circular Dependency Check to CI

**Files:**
- Modify: `.github/workflows/ci.yml`

Two new steps are added to the `quality` job. Both are required (not `continue-on-error`). They run after the existing TypeScript check step.

- [ ] **Step 1: Add two steps to the quality job in ci.yml**

In `.github/workflows/ci.yml`, find the `quality` job. After the `TypeScript check` step:

```yaml
      - name: TypeScript check
        run: npm run typecheck
```

Add these two steps immediately after:

```yaml
      - name: Prettier format check
        run: npx prettier --check "src/**/*.{ts,tsx,js,jsx}" "functions/**/*.js"

      - name: Circular dependency check
        run: npm run check:circular
```

The complete `quality` job after the change:

```yaml
  quality:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: ESLint
        run: npm run lint

      - name: Dependency security audit
        run: npm audit --audit-level=high --omit=dev

      - name: TypeScript check
        run: npm run typecheck

      - name: Prettier format check
        run: npx prettier --check "src/**/*.{ts,tsx,js,jsx}" "functions/**/*.js"

      - name: Circular dependency check
        run: npm run check:circular
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci(sp2): add prettier format check and circular dependency check to quality job"
```

---

## Task 7: Push and Verify All CI Jobs Pass

**Files:** None (push + verification only)

- [ ] **Step 1: Push all commits to master**

```bash
git push origin master
```

Expected: All 6 commits from Tasks 1–6 push successfully.

- [ ] **Step 2: Monitor the CI run**

Open the GitHub Actions tab for the `nasa-hrvatska-v2` repository. Watch the run triggered by the master push. All jobs must pass:

| Job | Required steps |
|-----|---------------|
| `quality` | ESLint ✅, Security audit ✅, TypeScript ✅, **Prettier check ✅**, **check:circular ✅** |
| `test` | Coverage ≥80% on all 4 metrics ✅ |
| `ci` | TypeScript + unit tests ✅ |
| `e2e` | Chrome full suite ✅, Firefox/WebKit smoke ✅ |
| `build-deploy` | Build ✅, Bundle size ✅ |

- [ ] **Step 3: Confirm all Sub-project 2 exit criteria are met**

- [ ] Prettier formatting enforced in lint-staged pre-commit hook
- [ ] Prettier formatting enforced in CI `quality` job (required — not continue-on-error)
- [ ] `react-hooks/exhaustive-deps` set to `warn` in JS/JSX block (override removed)
- [ ] `react-hooks/exhaustive-deps` set to `warn` in TS/TSX hooks block
- [ ] `npm run check:circular` passes (zero circular imports) in CI
- [ ] All existing source files reformatted by Prettier in one bulk commit
- [ ] `@typescript-eslint/ban-ts-comment` remains `'off'` — correctly deferred to SP3
- [ ] `@typescript-eslint/no-explicit-any` remains `'warn'` — correctly deferred to SP3
- [ ] Zero new `@ts-ignore` or `// eslint-disable` suppressions introduced

---

## Deferred to Sub-project 3 (Do Not Enable Now)

These two ESLint rules appear in the spec but must NOT be enabled in SP2. Enabling them now would immediately break CI because 211 `@ts-nocheck` instances and hundreds of `any` types still exist in the codebase. SP3 removes all instances first, then enables the bans as the final locking step.

```js
// DEFERRED — enable ONLY after SP3 removes all @ts-nocheck and any types
'@typescript-eslint/ban-ts-comment': ['error', { minimumDescriptionLength: 10 }],
'@typescript-eslint/no-explicit-any': 'error',
```
