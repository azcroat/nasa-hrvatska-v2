# SP3a — max-lines ESLint Rule (Design)

**Date:** 2026-05-16
**Status:** Approved — ready for plan
**Origin:** Deferred from SP3 (`docs/superpowers/plans/2026-04-19-03-typescript-strict.md`) as "SP4 final step", never executed.

## Goal

Stop future-bloat in client source files by adding `max-lines` to the ESLint config, with per-file overrides for the handful of existing large files that won't be split tonight.

The rule is preventive, not corrective: it draws a line in the sand so the next contributor doesn't add another 600-line component. Existing offenders are grandfathered.

## Why now

After SP11e/f, content.tsx dropped from 3438 → 2162 lines. That's still the largest source file and one of 5 files over 2000 lines. Without a `max-lines` rule, the next big feature could land another 1500-line file silently. With the rule, every new bloat triggers a CI failure.

## Current state — files >800 lines (audit 2026-05-16)

```
2960  src/components/practice/PracticeTab.tsx
2607  src/components/practice/ListeningComprehensionScreen.tsx
2153  src/data/content.tsx
2124  src/components/AppRouter.tsx
2060  src/App.tsx
2009  src/components/home/HeroSection.tsx
1980  src/components/profile/SettingsTab.tsx
1618  src/components/learn/LearnTab.tsx
1493  src/components/croatia/CroatiaCulture.tsx
1493  src/components/croatia/AIConversation.tsx
1474  src/components/practice/ProductionDrillScreen.tsx
1430  src/components/learn/GrammarExplainer.tsx
1411  src/components/learn/LessonScreen.tsx
1383  src/components/learn/PitchAccentMastery.tsx
1372  src/lib/firebase.ts
1364  src/components/croatia/HeritagePathScreen.tsx
1313  src/components/croatia/LiveTutorScreen.tsx
1309  src/components/shared/CroatianKnight.tsx
1279  src/components/learn/VocabScreens.tsx
1207  src/components/practice/SpeakingScreen.tsx
1188  src/components/practice/FlashcardCardFront.tsx
1142  src/components/croatia/CroatiaHistoryScreen.tsx
1056  src/components/profile/LearnPath.tsx
1000  src/components/profile/PrivacyScreen.tsx
```

~24 files over 800 lines. ~10 over 1500.

## Decisions

### Threshold: **800 lines** (excluding blank + comment lines)

Rationale:
- Strict enough to surface real bloat (a single screen >800 lines is almost always doing too much)
- Loose enough that 90% of the codebase passes without modification
- ESLint's `max-lines` rule supports `skipBlankLines: true` and `skipComments: true` — use both, so the threshold reflects logical code only

Files over the threshold get per-file overrides. New files must respect the rule.

### Per-file overrides — eslint config `overrides` block

```js
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
  rules: {
    'max-lines': 'off', // grandfathered — see SP3a design
  },
},
```

Tests and config files exempted globally (Vitest tests can legitimately exceed 800 lines for parametrized describes; config rarely matters):

```js
{
  files: ['src/**/__tests__/**', 'src/**/*.test.{ts,tsx,js}', 'src/tests/**'],
  rules: { 'max-lines': 'off' },
},
{
  files: ['*.config.{js,mjs,ts}', 'vite.config.*', 'playwright.*.config.*'],
  rules: { 'max-lines': 'off' },
},
```

### Function-level max-lines? — NOT in scope

The plan considered `max-lines-per-function` as a stretch goal. Skipping for SP3a because the function-level rule fires constantly on React component render functions, which legitimately can be 300+ lines and don't benefit from extraction.

### What about new files added between now and split?

They start clean — the rule applies. Anyone adding a new file over 800 lines gets a CI failure with a clear message. The escape hatch is adding their file to the override list with a justification — that's a friction point, not a hard block.

## Non-goals

- Splitting any of the 24 grandfathered files. That's a separate sprint per file (or a wholesale refactor sprint).
- `max-lines-per-function`.
- Stylistic line-length rules (those are `max-len`, different).
- Migrating away from `eslint.config.js` flat config.

## Acceptance criteria

- [ ] `eslint.config.js` adds the `max-lines` rule (800, skipBlankLines, skipComments) at the global level
- [ ] Per-file overrides land for all 24 grandfathered files
- [ ] Test + config file exemptions land
- [ ] `npm run lint` passes against current codebase (zero new warnings)
- [ ] Creating a new test file `src/test-canary-800-lines.tsx` with exactly 801 lines triggers a `max-lines` ESLint error (positive validation)
- [ ] Removing the test canary file restores green lint
- [ ] Commit + push

## Rollback

If the rule causes unexpected CI breakage on a future commit, the rule can be disabled with a one-line `'max-lines': 'off'` in the global rules block. Per-file overrides stay regardless.

## Open questions

None at design time.
