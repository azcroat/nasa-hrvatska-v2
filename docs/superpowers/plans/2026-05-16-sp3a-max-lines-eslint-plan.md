# SP3a — max-lines ESLint Rule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an 800-line `max-lines` ESLint rule with per-file overrides for the 24 existing offenders, exemptions for tests and configs, and positive validation via a canary file.

**Architecture:** Pure config change in `eslint.config.js`. No source code changes. ~1-2 hours.

**Tech Stack:** ESLint flat config (`eslint.config.js`), `@typescript-eslint`, Vitest (canary verification), husky pre-commit hooks.

---

## File Structure

### Modified
- `eslint.config.js` — add `max-lines` global rule + 3 overrides blocks (grandfathered, tests, configs)

### Created (temporary, deleted in same sprint)
- `src/test-canary-801-lines.tsx` — positive-validation canary, deleted after Task 4

---

## Task 1: Audit current state + verify file list

**Files:**
- Inspect: `eslint.config.js`

- [ ] **Step 1: Read current ESLint config**

Run: `cat eslint.config.js` and confirm the file uses flat config (exports default array of objects).

- [ ] **Step 2: Re-run the line-count audit to confirm the override file list is still accurate**

```bash
find src -name '*.ts' -o -name '*.tsx' | xargs wc -l 2>/dev/null | awk '$1 > 800 && $2 !~ /total/' | sort -rn
```

Expected: ~24 files matching the spec. If new files have crossed 800 lines since 2026-05-16, add them to the override list before Task 2.

---

## Task 2: Add `max-lines` rule + overrides to eslint.config.js

**Files:**
- Modify: `eslint.config.js`

- [ ] **Step 1: Find the appropriate place to add the global rule**

```bash
grep -n "rules:" eslint.config.js
```

The first `rules:` block under the main ts/tsx files config is where `max-lines` goes.

- [ ] **Step 2: Add the global rule + 3 overrides**

Add to the main TypeScript files config's `rules:` block:

```js
'max-lines': ['warn', { max: 800, skipBlankLines: true, skipComments: true }],
```

(Use `'warn'` initially so existing offenders without overrides don't break CI before Task 3 lands. After Task 3 verifies overrides cover all current offenders, change `'warn'` → `'error'` in Task 5.)

Then append three new top-level config objects:

```js
// SP3a: grandfathered files over the 800-line threshold (audit 2026-05-16).
// New files added after this date must respect the rule. Each entry here
// represents a deliberate scope decision to NOT split this file in SP3a.
{
  files: [
    'src/components/practice/PracticeTab.tsx',
    'src/components/practice/ListeningComprehensionScreen.tsx',
    'src/data/content.tsx',
    'src/components/AppRouter.tsx',
    'src/App.tsx',
    'src/components/home/HeroSection.tsx',
    'src/components/profile/SettingsTab.tsx',
    'src/components/learn/LearnTab.tsx',
    'src/components/croatia/CroatiaCulture.tsx',
    'src/components/croatia/AIConversation.tsx',
    'src/components/practice/ProductionDrillScreen.tsx',
    'src/components/learn/GrammarExplainer.tsx',
    'src/components/learn/LessonScreen.tsx',
    'src/components/learn/PitchAccentMastery.tsx',
    'src/lib/firebase.ts',
    'src/components/croatia/HeritagePathScreen.tsx',
    'src/components/croatia/LiveTutorScreen.tsx',
    'src/components/shared/CroatianKnight.tsx',
    'src/components/learn/VocabScreens.tsx',
    'src/components/practice/SpeakingScreen.tsx',
    'src/components/practice/FlashcardCardFront.tsx',
    'src/components/croatia/CroatiaHistoryScreen.tsx',
    'src/components/profile/LearnPath.tsx',
    'src/components/profile/PrivacyScreen.tsx',
  ],
  rules: { 'max-lines': 'off' },
},
// SP3a: tests can legitimately exceed 800 lines (parametrized describes).
{
  files: ['src/**/__tests__/**', 'src/**/*.test.{ts,tsx,js,jsx}', 'src/tests/**'],
  rules: { 'max-lines': 'off' },
},
// SP3a: config files exempt.
{
  files: ['*.config.{js,mjs,ts}', 'vite.config.*', 'playwright.*.config.*'],
  rules: { 'max-lines': 'off' },
},
```

- [ ] **Step 3: Verify config is parseable**

```bash
npx eslint --print-config src/App.tsx > /dev/null && echo OK
```

Expected: prints `OK`. If parse fails, fix syntax before proceeding.

---

## Task 3: Run lint on current codebase, verify zero new errors

**Files:**
- (Read-only validation)

- [ ] **Step 1: Run lint on all source**

```bash
npm run lint 2>&1 | tail -30
```

Expected outcomes:
- **Zero** `max-lines` errors (overrides cover all current offenders)
- Pre-existing warnings unchanged

- [ ] **Step 2: If any `max-lines` warning fires, fix one of:**
  - Add the file to the grandfathered overrides list (preferred if file is real code)
  - Add the file to the tests exemption (if it's a `*.test.*`)
  - Add the file to the configs exemption (if it's a `*.config.*`)

Re-run lint after each fix.

---

## Task 4: Positive validation — canary file

**Files:**
- Create: `src/test-canary-801-lines.tsx`

- [ ] **Step 1: Create the canary**

```bash
python -c "
content = '// SP3a: 801-line canary — fires max-lines warning if rule is wired correctly.\n'
content += 'export const N = 0;\n' * 799
content += 'export const END = 1;\n'
with open('src/test-canary-801-lines.tsx', 'w') as f:
    f.write(content)
"
```

(That produces 1 comment + 799 `export const` + 1 final `export` = 801 non-blank non-comment lines.)

- [ ] **Step 2: Run lint specifically against the canary**

```bash
npx eslint src/test-canary-801-lines.tsx 2>&1 | grep max-lines
```

Expected: `max-lines` warning fires on this file.

- [ ] **Step 3: Delete the canary**

```bash
rm src/test-canary-801-lines.tsx
```

- [ ] **Step 4: Confirm lint clean again**

```bash
npm run lint 2>&1 | grep -E "(error|warning)" | head -5
```

Expected: zero `max-lines` warnings (canary removed).

---

## Task 5: Promote `warn` to `error`

**Files:**
- Modify: `eslint.config.js`

- [ ] **Step 1: Change severity**

In the global rule block:

```diff
- 'max-lines': ['warn', { max: 800, skipBlankLines: true, skipComments: true }],
+ 'max-lines': ['error', { max: 800, skipBlankLines: true, skipComments: true }],
```

- [ ] **Step 2: Re-run lint**

```bash
npm run lint 2>&1 | tail -5
```

Expected: lint passes with zero errors. (Overrides still cover all offenders.)

- [ ] **Step 3: Commit + push**

```bash
git add eslint.config.js
git commit -m "feat(sp3a): max-lines ESLint rule (800 line cap) with 24 grandfathered overrides"
git push origin master
```

---

## Self-Review Checklist

- [ ] `max-lines` rule is `error`, not `warn` (Task 5)
- [ ] All 24 known offenders are in the grandfathered overrides list
- [ ] Tests + configs are exempted
- [ ] Canary file is deleted (Task 4 step 3)
- [ ] `npm run lint` exits 0
- [ ] CI passes on the commit
- [ ] No source file changes (only `eslint.config.js`)

## Rollback

If the rule causes unexpected CI breakage:

```bash
# Disable globally — keep overrides for documentation value
git revert <sp3a-commit-sha>
# OR
sed -i "s/'max-lines': \['error'/'max-lines': \['off'/" eslint.config.js
```
