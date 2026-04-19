# Enterprise Quality Remediation — Design Spec

**Date:** 2026-04-19  
**Status:** Approved  
**Approach:** Safety-Net First (Approach C)

---

## Goal

Bring the Naša Hrvatska codebase to enterprise-grade quality across five dimensions: test coverage, code quality tooling, TypeScript strictness, component architecture, and documentation. Each sub-project is sequenced so that later, more invasive changes are protected by earlier safety nets.

## Architecture

Five independent sub-projects executed in strict sequence. Each completes its own spec → plan → subagent-driven implementation → two-stage review → CI green cycle before the next begins. No sub-project starts until the previous one has a green CI build on master.

## Sequencing Rationale

```
1. Tests        → safety net for all subsequent refactoring
2. Tooling      → enforcement infrastructure locks in standards
3. TypeScript   → invasive (211 files) but now safe with test coverage + tooling
4. Architecture → component splits are safe with tests + types as safety net
5. Docs         → document the final clean state, not the interim mess
```

---

## Sub-project 1: Test Coverage

### Goal
Raise all four Vitest coverage metrics from ~50% to ≥80%, enforced as hard CI thresholds.

### Entry State
- Statements: ~47.4% (threshold 46%)
- Branches: ~46.83% (threshold 45%)
- Functions: ~57.08% (threshold 56%)
- Lines: ~50.74% (threshold 49%)
- 57 test files in `src/tests/`

### Exit Criteria
- Statements ≥ 80%
- Branches ≥ 80%
- Functions ≥ 80%
- Lines ≥ 80%
- All four thresholds enforced as hard CI failures in `vitest.config.js`
- Zero new `@ts-ignore` or `// eslint-disable` suppressions in test files

### What Gets Tested

**Tier 1 — Pure lib/ utilities (unit tests, no mocking)**
All functions in `src/lib/` that do not touch Firebase or browser APIs:
- `statsReducer.ts` — state machine for all stats mutations; test every action type
- `mergeStatsFromRemote.ts` — additive merge logic; test conflict resolution, null safety, all stat fields
- `progressSnapshot.ts` — snapshot serialisation/deserialisation; test round-trip fidelity
- `srs.ts` — FSRS algorithm; test interval calculation, stability decay, retrievability, boundary conditions
- `adaptive.ts` — difficulty adjustment; test all CEFR level transitions
- All remaining `src/lib/*.ts` pure utility functions

**Tier 2 — Custom hooks (mocked dependencies)**
`renderHook` tests via React Testing Library; `vi.mock()` for Firebase, localStorage, browser APIs:
- `useAward.ts` — XP grant, badge unlock, prestige boundary conditions
- `useSyncManager.js` — sync trigger logic, debounce, conflict detection
- `useScreenLauncher.js` — dwell timer, BLACK_HOLE_SCREENS XP award
- `useDaily.js` — daily streak logic, reset boundary at midnight UTC
- All remaining hooks with testable logic

**Tier 3 — Component interaction tests**
State machines and user interactions, not visual snapshots:
- `FlashcardScreen` — answer reveal, correct/wrong scoring, deck exhaustion
- `McGameScreen` — option selection, hearts system, combo tracking
- `TypingScreen` — Levenshtein tolerance, SRS feedback, diacritic normalisation
- `QuestTracker` — quest completion, daily reset, progress persistence

**Tier 4 — Error paths in existing tests**
Additions to existing test files:
- Empty state handling (empty localStorage, null user)
- API error responses (network failure, 429, 502)
- Malformed localStorage data (corrupted JSON, missing fields)
- FSRS boundary conditions (new card, mature card, relearn)

### What Stays Excluded (documented in vitest.config.js)
- Firebase Firestore/Auth (requires emulator — separate project)
- Browser-native APIs: AudioContext, Notification, haptics, camera, crypto
- React context wrappers (AppContext, StatsContext providers)
- Analytics integrations (PostHog, Sentry)
- `src/data/` content files (not logic)

### File Structure
New tests added to `src/tests/` following existing pattern. One test file per source module. No co-located `.test.ts` files. Test files named `<module>.test.ts`.

### CI Change
`vitest.config.js` thresholds raised to:
```js
coverage: {
  thresholds: {
    statements: 80,
    branches: 80,
    functions: 80,
    lines: 80,
  }
}
```
These thresholds only move up — never down.

---

## Sub-project 2: Code Quality Tooling

### Goal
Install and enforce Prettier, harden ESLint to ban `@ts-nocheck` and `any`, add circular dependency detection — all enforced in CI and pre-commit hooks.

### Entry State
- No Prettier configured
- `@typescript-eslint/ban-ts-comment`: OFF
- `@typescript-eslint/no-explicit-any`: WARN
- `react-hooks/exhaustive-deps`: OFF
- No circular dependency detection

### Exit Criteria
- Prettier formatting enforced in lint-staged pre-commit hook and CI
- `@typescript-eslint/ban-ts-comment` set to `error` (bare `@ts-nocheck` banned)
- `@typescript-eslint/no-explicit-any` set to `error`
- `react-hooks/exhaustive-deps` restored to `warn`
- `npm run check:circular` passes in CI (zero circular imports)
- All existing source files reformatted by Prettier in one bulk commit

### Prettier Configuration (`.prettierrc`)
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

### ESLint Changes (`eslint.config.js`)
```js
// Restore from OFF to WARN (safe — adds warnings, does not fail build on existing code)
'react-hooks/exhaustive-deps': 'warn',
```

**Note:** `@typescript-eslint/ban-ts-comment` and `@typescript-eslint/no-explicit-any: error` are intentionally deferred to Sub-project 3. Enabling them here would immediately break CI because 211 `@ts-nocheck` instances and existing `any` types still exist. Sub-project 3 removes all instances first, then enables the bans as the final locking step — in that order.

### Circular Dependency Detection
- Install: `madge` as devDependency
- Script: `"check:circular": "madge --circular --extensions ts,tsx,js,jsx src/"`
- CI job added to `ci.yml` as required check
- Fails build on any circular import graph

### lint-staged Addition (`.lintstagedrc` or `package.json`)
```json
{
  "src/**/*.{ts,tsx,js,jsx}": ["prettier --write", "eslint --max-warnings=0"],
  "functions/**/*.js": ["prettier --write", "eslint --max-warnings=0"]
}
```

### CI Addition
New `format` job in `ci.yml`:
```yaml
- run: npx prettier --check "src/**/*.{ts,tsx,js,jsx}" "functions/**/*.js"
```
This job is **required** (not `continue-on-error`).

---

## Sub-project 3: TypeScript Strict Mode

### Goal
Zero `@ts-nocheck` pragmas anywhere in the codebase. `strict: true` enabled in `tsconfig.json`. All type errors resolved properly — no `as any` escape hatches.

### Entry State
- `strict: false` in tsconfig.json
- 211 `@ts-nocheck` pragmas across `src/`
- `@ts-nocheck` now banned by ESLint (from Sub-project 2)

### Exit Criteria
- `strict: true` in `tsconfig.json`
- `noUncheckedIndexedAccess: true` in `tsconfig.json`
- Zero `@ts-nocheck` anywhere (ESLint enforces this)
- Zero `as any` casts (ESLint `@typescript-eslint/no-explicit-any: error` enforces this)
- `tsc --noEmit` passes with zero errors in CI
- New `src/types/` directory with canonical domain interfaces

### tsconfig.json Changes
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": false
  }
}
```
`exactOptionalPropertyTypes` left off — it causes excessive friction with Firebase optional fields and React props.

### New `src/types/` Directory
Canonical shared interfaces extracted from existing code:
- `UserStats` — the full stats object shape (currently implicit)
- `ProgressSnapshot` — sync payload shape
- `SRSCard` — FSRS card state
- `Quest` — daily quest shape
- `LearnPathItem` — learning path entry
- `FirestoreUserDoc` — Firestore document shape
- `CEFRLevel` — `'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'` literal union

### Removal Strategy (three passes, three commits)
1. **Pass 1 — `src/lib/`**: Remove `@ts-nocheck`, fix all type errors. These are pure functions; errors surface immediately and are fixed with proper types. Commit.
2. **Pass 2 — `src/hooks/`**: Remove `@ts-nocheck`, fix all type errors. Firebase types use the new `src/types/` interfaces. Commit.
3. **Pass 3 — `src/components/`**: Remove `@ts-nocheck`, fix all type errors. React prop types added where missing. Commit.

Each pass must have a green CI build before the next begins.

### ESLint Bans Enabled (final step of Sub-project 3, after all instances removed)
```js
// Enabled AFTER all @ts-nocheck instances are removed
'@typescript-eslint/ban-ts-comment': ['error', { minimumDescriptionLength: 10 }],

// Enabled AFTER all explicit `any` types are replaced
'@typescript-eslint/no-explicit-any': 'error',
```

### No `as any` Policy
Where a type genuinely cannot be inferred (e.g. dynamic Firebase snapshot), a typed interface is introduced. `as unknown as T` is allowed only as a last resort with an explanatory comment. `as any` is banned by ESLint after all existing instances are removed.

---

## Sub-project 4: Component Architecture

### Goal
No component file exceeds 400 lines. Single ErrorBoundary. No business logic in render functions.

### Entry State
- 7 components >900 lines
- Duplicate ErrorBoundary in `main.tsx` (lines 168–201) and `src/components/shared/ErrorBoundary.tsx`
- Some components contain inline business logic that belongs in hooks or lib

### Exit Criteria
- Zero component files >400 lines (enforced by `max-lines` ESLint rule)
- Single ErrorBoundary: `src/components/shared/ErrorBoundary.tsx` only
- All extracted child components have their own unit/interaction tests
- No business logic in render functions. Definition: render may contain conditional rendering, prop passing, and event handler wiring. It must not contain: data transformation (mapping/filtering arrays), algorithmic computation, direct API calls, or derived state calculations — those belong in hooks or `src/lib/`.
- No regression in E2E suite

### ESLint Rule Addition
```js
// src/components/**/*.tsx only
'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
```

### Component Splits

**`ListeningComprehensionScreen.tsx` (1122 lines)**
→ `ListeningComprehensionScreen.tsx` (orchestrator, <100 lines)
→ `ListeningPlayer.tsx` (audio playback controls)
→ `TranscriptDisplay.tsx` (scrolling transcript with word highlighting)
→ `ComprehensionQuiz.tsx` (multiple-choice questions + scoring)

**`DialectAwarenessScreen.tsx` (1117 lines)**
→ `DialectAwarenessScreen.tsx` (orchestrator)
→ `DialectComparison.tsx` (side-by-side dialect card)
→ `DialectExercise.tsx` (interactive drill)

**`HeroSection.tsx` (957 lines)**
→ `HeroSection.tsx` (orchestrator)
→ `DailyStreakCard.tsx` (streak display + flame animation)
→ `LevelBadge.tsx` (CEFR level + XP progress ring)
→ `QuickActions.tsx` (shortcut buttons grid)

**`SettingsTab.tsx` (938 lines)**
→ `SettingsTab.tsx` (orchestrator + tab nav)
→ `AppearanceSettings.tsx` (font size, dark mode, reduce motion)
→ `NotificationSettings.tsx` (push permission, schedule)
→ `AccountSettings.tsx` (sync, logout, data export)

**`LiveTutorScreen.tsx` (923 lines)**
→ `LiveTutorScreen.tsx` (orchestrator)
→ `TutorChat.tsx` (conversation history + message rendering)
→ `TutorVoiceControl.tsx` (mic button, recording state, playback)

**`AIConversation.tsx` (885 lines)**
→ `AIConversation.tsx` (orchestrator)
→ `ConversationHistory.tsx` (message list with role styling)
→ `ConversationInput.tsx` (text input + send + voice toggle)

**`firebase.ts` (875 lines)**
→ Not split. This is a library file, not a component. Its size is acceptable. Excluded from the `max-lines` rule (which applies to `src/components/**` only).

### ErrorBoundary Consolidation
`main.tsx` lines 168–201 (inline ErrorBoundary class) are deleted. `main.tsx` imports `ErrorBoundary` from `src/components/shared/ErrorBoundary.tsx`. The shared `ErrorBoundary` is upgraded to accept a `fallback` prop for custom recovery UI.

---

## Sub-project 5: Documentation

### Goal
100% JSDoc coverage on all public exports in `src/lib/` and `src/hooks/`. Accurate, complete README.

### Entry State
- <2% JSDoc coverage on lib/ and hooks/
- README references outdated tech (Netlify, Azure TTS notes are stale)
- No architecture diagram
- No local development guide

### Exit Criteria
- Every exported function and type in `src/lib/` has a JSDoc block with `@param`, `@returns`, and a one-sentence description
- Every exported hook in `src/hooks/` has a JSDoc block describing purpose, parameters, and return value
- `eslint-plugin-jsdoc` enforces coverage on `src/lib/**` and `src/hooks/**` in CI
- README is accurate and complete (see structure below)

### JSDoc Standard
```ts
/**
 * Merges remote Firestore stats into local stats using additive merge rules.
 * Remote values only win if they are strictly greater than local values.
 *
 * @param local - The current local stats object
 * @param remote - The Firestore snapshot to merge from
 * @returns Merged stats object (never reduces any local value)
 */
export function mergeStatsFromRemote(local: UserStats, remote: Partial<UserStats>): UserStats {
```

### ESLint Addition (`eslint-plugin-jsdoc`)
```js
// Applied only to src/lib/** and src/hooks/**
'jsdoc/require-jsdoc': ['error', {
  require: { FunctionDeclaration: true, ArrowFunctionExpression: true },
  checkConstructors: false,
}],
'jsdoc/require-param': 'error',
'jsdoc/require-returns': 'error',
'jsdoc/require-description': 'error',
```

### README Structure
```markdown
# Naša Hrvatska

Croatian language learning PWA — web, iOS (PWA), Android (Capacitor).

## Tech Stack
## Architecture Overview
## Data Flow Diagram (ASCII)
## Local Development
## Environment Variables
## Running Tests
## Deployment
## Key Design Decisions
```

---

## Out of Scope

- Root data file (`src/data.jsx`, ~700 KB) — requires full data-layer redesign
- Firebase SDK bundling — intentionally one chunk (circular dep crashes)
- Firebase integration test coverage — requires emulator setup (separate project)
- Any new features or content
- SonarCloud or Lighthouse score targets

---

## Definition of Done

All five sub-projects merged to master. CI green on all required jobs:
- `tsc --noEmit` zero errors
- Vitest ≥80% all metrics
- ESLint zero warnings
- Prettier check passes
- `check:circular` passes
- Playwright E2E passes (Chrome full, Firefox/WebKit smoke)
- Zero `@ts-nocheck` in codebase
- Zero component files >400 lines
- 100% JSDoc on `src/lib/` and `src/hooks/` public exports
