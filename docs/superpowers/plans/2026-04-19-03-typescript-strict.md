# Sub-project 3: TypeScript Strict Mode — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all 211 `@ts-nocheck` pragmas from the codebase, enable `strict: true` and `noUncheckedIndexedAccess: true` in tsconfig.json, eliminate all `as any` casts, and lock enforcement with ESLint bans — all verified with green CI.

**Architecture:** Four-phase execution in strict sequence. Phase 1 (Tasks 1–2) extends canonical types and fixes existing `as any` usages without touching tsconfig. Phase 2 (Task 3) enables `strict: true` in tsconfig — safe because all 211 files still carry `@ts-nocheck` so only the already-clean `src/lib/` and `src/hooks/` layers are checked strictly. Phase 3 (Tasks 4–14) removes `@ts-nocheck` from files in 11 directory batches, fixing strict-mode errors per batch before committing. Phase 4 (Task 15) enables ESLint bans as the final locking step.

**Context:** Sub-project 2 (SP2) is fully complete. `src/lib/` and `src/hooks/` have zero `@ts-nocheck` pragmas and already compile cleanly. All 211 remaining `@ts-nocheck` instances are in `src/components/` (208 files), `src/data/content.tsx` (1), `src/main.tsx` (1), and `src/App.tsx` (1). The `src/types/index.ts` file already exports: `Stats`, `StatsAction`, `AuthUser`, `StatsDelta`, `StatsContextValue`.

**Tech Stack:** TypeScript 5.x, tsconfig strict flags, ESLint 9 flat config, Vitest, Playwright E2E, GitHub Actions

---

## Common TypeScript Strict Error Patterns (Reference for Tasks 4–14)

When `@ts-nocheck` is removed from a file, `strict: true` and `noUncheckedIndexedAccess: true` will surface errors. The table below covers every pattern that appears in this codebase. Read this section before executing any batch task.

| Error message | Root cause | Fix |
|---|---|---|
| `Parameter 'x' implicitly has an 'any' type` | Function param lacks annotation | Add `: Type` annotation. Use `unknown` if the type is truly dynamic, then narrow. |
| `Binding element 'x' implicitly has an 'any' type` | Destructured prop without an interface | Add a `Props` interface above the component: `interface Props { x: string; }` and annotate: `function Foo({ x }: Props)` |
| `Object is possibly 'undefined'` (from noUncheckedIndexedAccess) | Array index or record access: `arr[0]` | Use `arr[0]!` when non-emptiness is guaranteed; `arr[0] ?? fallback` when a default is appropriate; `arr.at(0)` when undefined handling is needed |
| `Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '...'` | Dynamic key access on typed object | Cast key: `obj[key as keyof typeof obj]` or widen the object type |
| `Property 'x' does not exist on type 'Y'` | Accessing undeclared property | Add the property to the interface, or use `'x' in obj ? obj.x : undefined` narrowing |
| `Type 'string \| null' is not assignable to type 'string'` | `localStorage.getItem()` returns `string \| null` | Use `?? ''` or `?? defaultValue` after `getItem()` |
| `Type 'unknown' is not assignable to type 'X'` | `JSON.parse()` returns `unknown` | Add `as X` with a named interface, or `as unknown as X` with a comment explaining the assertion |
| `Argument of type 'string \| undefined' is not assignable to parameter of type 'string'` | Optional prop passed to required param | Guard: `if (x !== undefined)` or use `x ?? ''` |
| `Property 'x' has no initializer and is not definitely assigned` | Class field strictPropertyInitialization | Add `!` suffix: `x!: string` or initialize in constructor |
| `Cannot find name 'x'` | Import missing after nocheck removal | Add the missing import at the top of the file |
| `'x' is possibly 'null'` | Ref or nullable value used without guard | Add `if (!x)` guard or use optional chaining `x?.method()` |

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `src/types/index.ts` | Modify | Add `CEFRLevel`, `SRSCard`, `LearnPathItem` canonical types |
| `src/lib/audio.ts` | Modify | Replace `as any` Capacitor import cast with typed alternative |
| `src/components/shared/CroatianKnight.tsx` | Modify | Replace `as any` cfg cast with proper property declaration |
| `tsconfig.json` | Modify | Enable `strict: true`, `noUncheckedIndexedAccess: true`; remove `noImplicitAny: false` |
| `src/App.tsx`, `src/main.tsx`, `src/data/content.tsx` + 3 more | Modify | Remove `@ts-nocheck`, fix strict-mode errors |
| `src/components/shared/**` (28 files) | Modify | Remove `@ts-nocheck`, fix strict-mode errors |
| `src/components/home/**` (19 files) | Modify | Remove `@ts-nocheck`, fix strict-mode errors |
| `src/components/learn/**` Part 1 (21 files) | Modify | Remove `@ts-nocheck`, fix strict-mode errors |
| `src/components/learn/**` Part 2 (21 files) | Modify | Remove `@ts-nocheck`, fix strict-mode errors |
| `src/components/practice/**` Part 1 (22 files) | Modify | Remove `@ts-nocheck`, fix strict-mode errors |
| `src/components/practice/**` Part 2 (21 files) | Modify | Remove `@ts-nocheck`, fix strict-mode errors |
| `src/components/practice/exercises/**` (15 files) | Modify | Remove `@ts-nocheck`, fix strict-mode errors |
| `src/components/profile/**` (17 files) | Modify | Remove `@ts-nocheck`, fix strict-mode errors |
| `src/components/croatia/**` Part 1 (21 files) | Modify | Remove `@ts-nocheck`, fix strict-mode errors |
| `src/components/croatia/**` Part 2 (20 files) | Modify | Remove `@ts-nocheck`, fix strict-mode errors |
| `eslint.config.js` | Modify | Enable `@typescript-eslint/ban-ts-comment: error` and `no-explicit-any: error` |

---

## Task 1: Extend src/types/index.ts with Remaining Canonical Types

**Files:**
- Modify: `src/types/index.ts`

**Context:** `src/types/index.ts` already exports `Stats`, `StatsAction`, `AuthUser`, `StatsDelta`, `StatsContextValue`. Three more canonical types are needed by component files: `CEFRLevel` (a literal union used widely as a string), `SRSCard` (the FSRS card state from `src/lib/srs.ts`), and `LearnPathItem` (the learn path item shape from `src/hooks/useScreenLauncher.ts`). Adding them here prevents duplicate local declarations in component files after `@ts-nocheck` is removed.

- [ ] **Step 1: Append the three new types to `src/types/index.ts`**

Open `src/types/index.ts` and append these three declarations after the existing `StatsContextValue` interface:

```typescript
/** CEFR proficiency level — the six standard levels used throughout the app. */
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

/**
 * FSRS spaced-repetition card state.
 * Canonical type for the `nh_sr` localStorage map and Firestore `sr` field.
 * Mirrors `SRCard` in `src/lib/srs.ts` — keep in sync if srs.ts fields change.
 */
export interface SRSCard {
  s: number;       // stability (days before forgetting)
  d: number;       // difficulty (0–10)
  r: number;       // repetitions count
  w: number;       // wrong-answer count
  l: number;       // last review timestamp (ms since epoch)
  b: number;       // last rating given (0–4)
  due: number;     // timestamp when card became due (ms)
  nextDue: number; // timestamp of next scheduled review (ms)
  // Legacy SM-2 fields — present on cards created before FSRS migration
  ease?: number;
  interval?: number;
  ef?: number;
  iv?: number;
  rep?: number;
  reps?: number;
  t?: number;
}

/**
 * A single item in the sequential A1→C1 learn path.
 * Passed to `launchPathItem()` in `src/hooks/useScreenLauncher.ts`.
 */
export interface LearnPathItem {
  id?: string;
  go?: string;
  topic?: string;
  filter?: unknown;
  lessonId?: string;
}
```

- [ ] **Step 2: Run TypeScript to verify no errors introduced**

```bash
npx tsc --noEmit
```

Expected: exits 0. The new type declarations are additive — no existing code is affected.

- [ ] **Step 3: Run tests to confirm nothing broken**

```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(sp3): add CEFRLevel, SRSCard, LearnPathItem canonical types to src/types/index.ts"
```

---

## Task 2: Eliminate Remaining `as any` Usages

**Files:**
- Modify: `src/lib/audio.ts` (line 51)
- Modify: `src/components/shared/CroatianKnight.tsx` (line 651)

**Context:** There are exactly 2 `as any` casts in the TypeScript codebase (confirmed by `grep -r "as any" src/ --include="*.ts" --include="*.tsx"`). Both must be replaced before Task 15 enables `@typescript-eslint/no-explicit-any: error`. The `src/lib/audio.ts` cast is a dynamic Capacitor import; the `CroatianKnight.tsx` cast accesses an undeclared property on the cfg object.

- [ ] **Step 1: Fix `src/lib/audio.ts` — replace Capacitor `as any` with typed cast**

Find this block in `src/lib/audio.ts` (around line 50–52):

```typescript
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const capacitorModule = (await import('@capacitor/core')) as any;
      capHttp = (capacitorModule.CapacitorHttp as _CapHttp) ?? null;
```

Replace with:

```typescript
      const capacitorModule = (await import('@capacitor/core')) as unknown as {
        CapacitorHttp?: _CapHttp;
      };
      capHttp = capacitorModule.CapacitorHttp ?? null;
```

Also remove the `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comment — it is no longer needed.

- [ ] **Step 2: Fix `src/components/shared/CroatianKnight.tsx` — add `winkR` to cfg type**

Find the line in `CroatianKnight.tsx` (around line 651):

```typescript
  const isWinkR = cfg.wink || (cfg as any).winkR || blink;
```

Find the interface or type definition for `cfg` in the same file (look for `interface` or `type` near the top of the file or the component's props). Add `winkR?: boolean` to that interface/type. Then change the line to:

```typescript
  const isWinkR = cfg.wink || cfg.winkR || blink;
```

- [ ] **Step 3: Run TypeScript to verify no errors**

```bash
npx tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 4: Run lint to verify no-explicit-any warning count did not increase**

```bash
npm run lint 2>&1 | grep "no-explicit-any" | wc -l
```

Expected: same or lower count than before this task.

- [ ] **Step 5: Commit**

```bash
git add src/lib/audio.ts src/components/shared/CroatianKnight.tsx
git commit -m "fix(sp3): replace as-any casts with typed alternatives in audio.ts and CroatianKnight.tsx"
```

---

## Task 3: Enable strict:true and noUncheckedIndexedAccess in tsconfig.json

**Files:**
- Modify: `tsconfig.json`

**Context:** Enabling `strict: true` subsumes `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, and `noImplicitThis`. All 211 `@ts-nocheck` files will be completely unaffected — `@ts-nocheck` suppresses all TypeScript diagnostics for the file regardless of tsconfig settings. Only `src/lib/` and `src/hooks/` (which have zero `@ts-nocheck` and are already clean) will be checked strictly. CI must still pass after this commit.

`noUncheckedIndexedAccess: true` means `arr[i]` and `record[key]` return `T | undefined` instead of `T`. This only affects files without `@ts-nocheck`, so it does not break existing code immediately — errors surface as `@ts-nocheck` is removed per batch in Tasks 4–14.

- [ ] **Step 1: Edit `tsconfig.json`**

Open `tsconfig.json`. Make these exact changes:

**Remove** the line:
```json
    "noImplicitAny": false,
```

**Change** (in the `// Strict mode` comment block):
```json
    "strict": false,
```
**To:**
```json
    "strict": true,
    "noUncheckedIndexedAccess": true,
```

The complete updated strict-mode block should look like this:
```json
    // Strict mode: enabled for all TypeScript files.
    // Files with @ts-nocheck are unaffected — errors surface as @ts-nocheck is removed per batch.
    "strict": true,
    "noUncheckedIndexedAccess": true,
```

Keep all other `compilerOptions` unchanged (`noImplicitReturns`, `noFallthroughCasesInSwitch`, etc.).

- [ ] **Step 2: Run TypeScript to verify CI-level baseline**

```bash
npx tsc --noEmit
```

Expected: **exits 0**. The `@ts-nocheck` files are still suppressed. Only `src/lib/` and `src/hooks/` are checked at `strict: true` — they are already clean from SP2's Pass 1 and Pass 2.

If TypeScript reports errors: they are in files WITHOUT `@ts-nocheck`. Fix each error before proceeding. Use the patterns table at the top of this plan.

- [ ] **Step 3: Run the full test suite**

```bash
npm run test
```

Expected: All tests pass (tsconfig changes do not affect Vitest test execution).

- [ ] **Step 4: Commit**

```bash
git add tsconfig.json
git commit -m "feat(sp3): enable strict:true and noUncheckedIndexedAccess:true in tsconfig.json"
```

---

## Task 4: Remove @ts-nocheck — Root-Level and Utility Files (6 files)

**Files to process:**
- `src/App.tsx`
- `src/main.tsx`
- `src/data/content.tsx`
- `src/components/AppRouter.tsx`
- `src/components/admin/AdminDashboard.tsx`
- `src/components/auth/PlacementTest.tsx`

**Note on `src/data/content.tsx`:** This is the 700 KB curated vocabulary data file (excluded from Prettier). It may have implicit `any` types on its data constants. If removing `@ts-nocheck` produces more than 20 errors from this file, the pragmatic fix is to add an explicit `// eslint-disable-next-line @typescript-eslint/ban-ts-comment` and restore `// @ts-nocheck` with a doc comment explaining it as a content-only file with no logic — then record this exception in the commit message for the spec reviewer to accept. Do not spend time typing 700 KB of data literals.

- [ ] **Step 1: Remove `@ts-nocheck` from all 6 files**

```bash
node -e "
const fs = require('fs');
const files = [
  'src/App.tsx',
  'src/main.tsx',
  'src/data/content.tsx',
  'src/components/AppRouter.tsx',
  'src/components/admin/AdminDashboard.tsx',
  'src/components/auth/PlacementTest.tsx',
];
files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  fs.writeFileSync(f, c.replace(/^\/\/ @ts-nocheck\n/, ''));
});
console.log('Done');
"
```

- [ ] **Step 2: Capture TypeScript errors from these files only**

```bash
npx tsc --noEmit 2>&1 | grep -E "^src/(App|main|data/content|components/AppRouter|components/admin|components/auth)" | head -60
```

- [ ] **Step 3: Fix each error using the patterns table**

Apply fixes from the **Common TypeScript Strict Error Patterns** table at the top of this plan. Key patterns to expect in these files:

- `App.tsx` — large orchestrator; expect implicit `any` on event handlers and callback params. Add `React.ChangeEvent<HTMLInputElement>` etc.
- `main.tsx` — small bootstrap file; expect few or no errors after SP2 cleanup.
- `AppRouter.tsx` — routing layer; expect route param types.
- `AdminDashboard.tsx`, `PlacementTest.tsx` (auth) — expect implicit `any` on form/API callback params.
- `content.tsx` — see note above; if >20 errors, document and skip with eslint-disable comment.

- [ ] **Step 4: Verify zero tsc errors from these files**

```bash
npx tsc --noEmit 2>&1 | grep -E "^src/(App|main|data/content|components/AppRouter|components/admin|components/auth)"
```

Expected: no output (zero errors).

- [ ] **Step 5: Run full lint**

```bash
npm run lint
```

Expected: exits 0.

- [ ] **Step 6: Run tests**

```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/main.tsx src/data/content.tsx src/components/AppRouter.tsx src/components/admin/AdminDashboard.tsx src/components/auth/PlacementTest.tsx
git commit -m "fix(sp3): remove @ts-nocheck from root-level and utility files, fix strict-mode errors"
```

---

## Task 5: Remove @ts-nocheck — src/components/shared/ (28 files)

**Files to process:**
```
src/components/shared/AmbientPlayer.tsx
src/components/shared/AppModals.tsx
src/components/shared/AzureResultPanel.tsx
src/components/shared/CelebrationModal.tsx
src/components/shared/CeremonyModal.tsx
src/components/shared/CroatianKnight.tsx
src/components/shared/DesktopPanel.tsx
src/components/shared/EmptyState.tsx
src/components/shared/ErrorBoundary.tsx
src/components/shared/GoalSetterModal.tsx
src/components/shared/GrammarReference.tsx
src/components/shared/KnightCompanion.tsx
src/components/shared/KnightSpeech.tsx
src/components/shared/KnightToast.tsx
src/components/shared/LeaderboardScreen.tsx
src/components/shared/LevelUpModal.tsx
src/components/shared/OnboardingTour.tsx
src/components/shared/PaywallScreen.tsx
src/components/shared/PhotoVocabScanner.tsx
src/components/shared/PronunciationScorer.tsx
src/components/shared/ScreenErrorBoundary.tsx
src/components/shared/SearchModal.tsx
src/components/shared/Sidebar.tsx
src/components/shared/StreakMilestoneModal.tsx
src/components/shared/StreakMilestoneToast.tsx
src/components/shared/TabBar.tsx
src/components/shared/WaveformVisualizer.tsx
src/components/shared/XPPopup.tsx
```

- [ ] **Step 1: Remove `@ts-nocheck` from all 28 files**

```bash
node -e "
const fs = require('fs');
const files = [
  'src/components/shared/AmbientPlayer.tsx',
  'src/components/shared/AppModals.tsx',
  'src/components/shared/AzureResultPanel.tsx',
  'src/components/shared/CelebrationModal.tsx',
  'src/components/shared/CeremonyModal.tsx',
  'src/components/shared/CroatianKnight.tsx',
  'src/components/shared/DesktopPanel.tsx',
  'src/components/shared/EmptyState.tsx',
  'src/components/shared/ErrorBoundary.tsx',
  'src/components/shared/GoalSetterModal.tsx',
  'src/components/shared/GrammarReference.tsx',
  'src/components/shared/KnightCompanion.tsx',
  'src/components/shared/KnightSpeech.tsx',
  'src/components/shared/KnightToast.tsx',
  'src/components/shared/LeaderboardScreen.tsx',
  'src/components/shared/LevelUpModal.tsx',
  'src/components/shared/OnboardingTour.tsx',
  'src/components/shared/PaywallScreen.tsx',
  'src/components/shared/PhotoVocabScanner.tsx',
  'src/components/shared/PronunciationScorer.tsx',
  'src/components/shared/ScreenErrorBoundary.tsx',
  'src/components/shared/SearchModal.tsx',
  'src/components/shared/Sidebar.tsx',
  'src/components/shared/StreakMilestoneModal.tsx',
  'src/components/shared/StreakMilestoneToast.tsx',
  'src/components/shared/TabBar.tsx',
  'src/components/shared/WaveformVisualizer.tsx',
  'src/components/shared/XPPopup.tsx',
];
files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  fs.writeFileSync(f, c.replace(/^\/\/ @ts-nocheck\n/, ''));
});
console.log('Done');
"
```

- [ ] **Step 2: Capture TypeScript errors from this batch only**

```bash
npx tsc --noEmit 2>&1 | grep "src/components/shared/" | head -60
```

- [ ] **Step 3: Fix each error using the patterns table at the top of this plan**

Common patterns for shared components:
- `CroatianKnight.tsx`: The `as any` cast was already fixed in Task 2.
- `ErrorBoundary.tsx` / `ScreenErrorBoundary.tsx`: Error boundary class components — expect `componentDidCatch(error: unknown, info: React.ErrorInfo)` parameter types.
- `AmbientPlayer.tsx`, `WaveformVisualizer.tsx`: Audio/Web Audio API types — `AudioContext`, `AnalyserNode` etc. are in `lib.dom.d.ts` and do not need imports.
- `PaywallScreen.tsx`, `OnboardingTour.tsx`: Modal/overlay components — expect implicit `any` on callback props. Add `() => void` or specific callback signatures.

- [ ] **Step 4: Verify zero errors from this batch**

```bash
npx tsc --noEmit 2>&1 | grep "src/components/shared/"
```

Expected: no output.

- [ ] **Step 5: Run full lint**

```bash
npm run lint
```

Expected: exits 0.

- [ ] **Step 6: Run tests**

```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/shared/
git commit -m "fix(sp3): remove @ts-nocheck from src/components/shared/ (28 files), fix strict-mode errors"
```

---

## Task 6: Remove @ts-nocheck — src/components/home/ (19 files)

**Files to process:**
```
src/components/home/AITutorCard.tsx
src/components/home/CampaignBanner.tsx
src/components/home/ClanCard.tsx
src/components/home/CroatiaPostcard.tsx
src/components/home/DailyCroatianSection.tsx
src/components/home/DailyListeningCard.tsx
src/components/home/DailyPlanCard.tsx
src/components/home/GrammarDiagnosisScreen.tsx
src/components/home/HeroSection.tsx
src/components/home/HomeTab.tsx
src/components/home/PathProgressCard.tsx
src/components/home/PlacementTest.tsx
src/components/home/ProgressTabContent.tsx
src/components/home/QuestTracker.tsx
src/components/home/ReviewTabContent.tsx
src/components/home/SpeedChallenge.tsx
src/components/home/StatsWidget.tsx
src/components/home/WelcomeBackBanners.tsx
src/components/home/WelcomeScreen.tsx
```

- [ ] **Step 1: Remove `@ts-nocheck` from all 19 files**

```bash
node -e "
const fs = require('fs');
const files = [
  'src/components/home/AITutorCard.tsx',
  'src/components/home/CampaignBanner.tsx',
  'src/components/home/ClanCard.tsx',
  'src/components/home/CroatiaPostcard.tsx',
  'src/components/home/DailyCroatianSection.tsx',
  'src/components/home/DailyListeningCard.tsx',
  'src/components/home/DailyPlanCard.tsx',
  'src/components/home/GrammarDiagnosisScreen.tsx',
  'src/components/home/HeroSection.tsx',
  'src/components/home/HomeTab.tsx',
  'src/components/home/PathProgressCard.tsx',
  'src/components/home/PlacementTest.tsx',
  'src/components/home/ProgressTabContent.tsx',
  'src/components/home/QuestTracker.tsx',
  'src/components/home/ReviewTabContent.tsx',
  'src/components/home/SpeedChallenge.tsx',
  'src/components/home/StatsWidget.tsx',
  'src/components/home/WelcomeBackBanners.tsx',
  'src/components/home/WelcomeScreen.tsx',
];
files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  fs.writeFileSync(f, c.replace(/^\/\/ @ts-nocheck\n/, ''));
});
console.log('Done');
"
```

- [ ] **Step 2: Capture TypeScript errors from this batch only**

```bash
npx tsc --noEmit 2>&1 | grep "src/components/home/" | head -60
```

- [ ] **Step 3: Fix each error using the patterns table at the top of this plan**

Common patterns for home components:
- `HeroSection.tsx` (957 lines): Large orchestrator — expect implicit `any` on callbacks passed down to child components. Import `Stats` from `../../types` for props.
- `HomeTab.tsx`: Main tab shell — expect implicit `any` on `setScr`, `navigate` prop params. Add `(screen: string) => void` signature.
- `QuestTracker.tsx`: Quest state — localStorage reads return `string | null`; use `?? ''` or `?? 0`.
- `StatsWidget.tsx`: Accesses `stats[key]` dynamically — use `stats[key as keyof Stats]` pattern.
- `SpeedChallenge.tsx`: Game state with arrays — `arr[0]` returns `T | undefined` under `noUncheckedIndexedAccess`. Use `arr[0]!` when pre-validated non-empty.

- [ ] **Step 4: Verify zero errors from this batch**

```bash
npx tsc --noEmit 2>&1 | grep "src/components/home/"
```

Expected: no output.

- [ ] **Step 5: Run full lint**

```bash
npm run lint
```

Expected: exits 0.

- [ ] **Step 6: Run tests**

```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/home/
git commit -m "fix(sp3): remove @ts-nocheck from src/components/home/ (19 files), fix strict-mode errors"
```

---

## Task 7: Remove @ts-nocheck — src/components/learn/ Part 1 (21 files)

**Files to process:**
```
src/components/learn/AdvancedVocabScreen.tsx
src/components/learn/BrowseContentModal.tsx
src/components/learn/BrzaliceScreen.tsx
src/components/learn/BureaucraticScreen.tsx
src/components/learn/CaseTransformer.tsx
src/components/learn/ConditionalScreen.tsx
src/components/learn/DeclensionScreen.tsx
src/components/learn/FormalRegisterScreen.tsx
src/components/learn/FrequencyTrackScreen.tsx
src/components/learn/FutureTenseLessonScreen.tsx
src/components/learn/GradedInputScreen.tsx
src/components/learn/GrammarExplainer.tsx
src/components/learn/GrammarReader.tsx
src/components/learn/GrammarRef.tsx
src/components/learn/GrammarScreen.tsx
src/components/learn/GrammarTrackScreen.tsx
src/components/learn/HeritageModeScreen.tsx
src/components/learn/ImpersonalScreen.tsx
src/components/learn/LearnPathWidget.tsx
src/components/learn/LearnTab.tsx
src/components/learn/LessonScreen.tsx
```

- [ ] **Step 1: Remove `@ts-nocheck` from all 21 files**

```bash
node -e "
const fs = require('fs');
const files = [
  'src/components/learn/AdvancedVocabScreen.tsx',
  'src/components/learn/BrowseContentModal.tsx',
  'src/components/learn/BrzaliceScreen.tsx',
  'src/components/learn/BureaucraticScreen.tsx',
  'src/components/learn/CaseTransformer.tsx',
  'src/components/learn/ConditionalScreen.tsx',
  'src/components/learn/DeclensionScreen.tsx',
  'src/components/learn/FormalRegisterScreen.tsx',
  'src/components/learn/FrequencyTrackScreen.tsx',
  'src/components/learn/FutureTenseLessonScreen.tsx',
  'src/components/learn/GradedInputScreen.tsx',
  'src/components/learn/GrammarExplainer.tsx',
  'src/components/learn/GrammarReader.tsx',
  'src/components/learn/GrammarRef.tsx',
  'src/components/learn/GrammarScreen.tsx',
  'src/components/learn/GrammarTrackScreen.tsx',
  'src/components/learn/HeritageModeScreen.tsx',
  'src/components/learn/ImpersonalScreen.tsx',
  'src/components/learn/LearnPathWidget.tsx',
  'src/components/learn/LearnTab.tsx',
  'src/components/learn/LessonScreen.tsx',
];
files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  fs.writeFileSync(f, c.replace(/^\/\/ @ts-nocheck\n/, ''));
});
console.log('Done');
"
```

- [ ] **Step 2: Capture TypeScript errors from this batch only**

```bash
npx tsc --noEmit 2>&1 | grep "src/components/learn/" | head -60
```

- [ ] **Step 3: Fix each error using the patterns table at the top of this plan**

Common patterns for learn components:
- Vocabulary/grammar screens receive word data from `src/data/` — these are large objects with implicit shapes. Import `LearnPathItem` from `../../types` where applicable; use `Record<string, unknown>` for untyped data payloads.
- `LessonScreen.tsx`, `LessonSlides.tsx`: Slide data likely has implicit shape — define a local `interface Slide { ... }` from the data structure.
- `LearnTab.tsx`: Tab orchestrator — props for `setScr`, `navigate` etc. need `(screen: string) => void` types.
- Grammar drill screens (DeclensionScreen, PadeziScreen etc.): Exercise arrays — `exercises[i]` returns `T | undefined` under `noUncheckedIndexedAccess`. Use `exercises[i]!` when index is validated or use `for...of` loop instead.

- [ ] **Step 4: Verify zero errors from this batch**

```bash
npx tsc --noEmit 2>&1 | grep "src/components/learn/"
```

Expected: no output.

- [ ] **Step 5: Run full lint**

```bash
npm run lint
```

Expected: exits 0.

- [ ] **Step 6: Run tests**

```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/learn/AdvancedVocabScreen.tsx src/components/learn/BrowseContentModal.tsx src/components/learn/BrzaliceScreen.tsx src/components/learn/BureaucraticScreen.tsx src/components/learn/CaseTransformer.tsx src/components/learn/ConditionalScreen.tsx src/components/learn/DeclensionScreen.tsx src/components/learn/FormalRegisterScreen.tsx src/components/learn/FrequencyTrackScreen.tsx src/components/learn/FutureTenseLessonScreen.tsx src/components/learn/GradedInputScreen.tsx src/components/learn/GrammarExplainer.tsx src/components/learn/GrammarReader.tsx src/components/learn/GrammarRef.tsx src/components/learn/GrammarScreen.tsx src/components/learn/GrammarTrackScreen.tsx src/components/learn/HeritageModeScreen.tsx src/components/learn/ImpersonalScreen.tsx src/components/learn/LearnPathWidget.tsx src/components/learn/LearnTab.tsx src/components/learn/LessonScreen.tsx
git commit -m "fix(sp3): remove @ts-nocheck from src/components/learn/ Part 1 (21 files), fix strict-mode errors"
```

---

## Task 8: Remove @ts-nocheck — src/components/learn/ Part 2 (21 files)

**Files to process:**
```
src/components/learn/LessonSlides.tsx
src/components/learn/MicroLessonScreen.tsx
src/components/learn/ModalScreen.tsx
src/components/learn/NewLessons.tsx
src/components/learn/PadeziScreen.tsx
src/components/learn/PadezifullScreen.tsx
src/components/learn/PastTenseLessonScreen.tsx
src/components/learn/PhonemePracticeScreen.tsx
src/components/learn/PhonologyScreen.tsx
src/components/learn/PitchAccentMastery.tsx
src/components/learn/PracticalCroatianScreen.tsx
src/components/learn/PronunciationCourse.tsx
src/components/learn/ReadingList.tsx
src/components/learn/ReadingScreen.tsx
src/components/learn/SceneExplorer.tsx
src/components/learn/TechVocScreen.tsx
src/components/learn/TensesScreen.tsx
src/components/learn/TiViScreen.tsx
src/components/learn/VocabSceneComponents.tsx
src/components/learn/VocabScenes.tsx
src/components/learn/VocabScreens.tsx
```

- [ ] **Step 1: Remove `@ts-nocheck` from all 21 files**

```bash
node -e "
const fs = require('fs');
const files = [
  'src/components/learn/LessonSlides.tsx',
  'src/components/learn/MicroLessonScreen.tsx',
  'src/components/learn/ModalScreen.tsx',
  'src/components/learn/NewLessons.tsx',
  'src/components/learn/PadeziScreen.tsx',
  'src/components/learn/PadezifullScreen.tsx',
  'src/components/learn/PastTenseLessonScreen.tsx',
  'src/components/learn/PhonemePracticeScreen.tsx',
  'src/components/learn/PhonologyScreen.tsx',
  'src/components/learn/PitchAccentMastery.tsx',
  'src/components/learn/PracticalCroatianScreen.tsx',
  'src/components/learn/PronunciationCourse.tsx',
  'src/components/learn/ReadingList.tsx',
  'src/components/learn/ReadingScreen.tsx',
  'src/components/learn/SceneExplorer.tsx',
  'src/components/learn/TechVocScreen.tsx',
  'src/components/learn/TensesScreen.tsx',
  'src/components/learn/TiViScreen.tsx',
  'src/components/learn/VocabSceneComponents.tsx',
  'src/components/learn/VocabScenes.tsx',
  'src/components/learn/VocabScreens.tsx',
];
files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  fs.writeFileSync(f, c.replace(/^\/\/ @ts-nocheck\n/, ''));
});
console.log('Done');
"
```

- [ ] **Step 2: Capture TypeScript errors from this batch only**

```bash
npx tsc --noEmit 2>&1 | grep "src/components/learn/" | head -60
```

- [ ] **Step 3: Fix each error using the patterns table at the top of this plan**

Common patterns for this batch:
- `VocabScenes.tsx`, `VocabSceneComponents.tsx`, `VocabScreens.tsx`: Vocabulary data objects have dynamic keys. Use `Record<string, unknown>` for data payloads imported from `src/data/`.
- `SceneExplorer.tsx`: Likely processes arrays of scene data — `arr[i]` needs `!` or `?` under `noUncheckedIndexedAccess`.
- `LessonSlides.tsx`: Slide arrays — `slides[currentIndex]` returns `Slide | undefined`. Guard with: `const slide = slides[currentIndex]; if (!slide) return null;`
- `PronunciationCourse.tsx`, `PhonemePracticeScreen.tsx`: Audio-related state; `MediaRecorder`, `AudioContext` types come from `lib.dom.d.ts`.

- [ ] **Step 4: Verify zero errors from this batch**

```bash
npx tsc --noEmit 2>&1 | grep "src/components/learn/"
```

Expected: no output.

- [ ] **Step 5: Run full lint**

```bash
npm run lint
```

Expected: exits 0.

- [ ] **Step 6: Run tests**

```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/learn/LessonSlides.tsx src/components/learn/MicroLessonScreen.tsx src/components/learn/ModalScreen.tsx src/components/learn/NewLessons.tsx src/components/learn/PadeziScreen.tsx src/components/learn/PadezifullScreen.tsx src/components/learn/PastTenseLessonScreen.tsx src/components/learn/PhonemePracticeScreen.tsx src/components/learn/PhonologyScreen.tsx src/components/learn/PitchAccentMastery.tsx src/components/learn/PracticalCroatianScreen.tsx src/components/learn/PronunciationCourse.tsx src/components/learn/ReadingList.tsx src/components/learn/ReadingScreen.tsx src/components/learn/SceneExplorer.tsx src/components/learn/TechVocScreen.tsx src/components/learn/TensesScreen.tsx src/components/learn/TiViScreen.tsx src/components/learn/VocabSceneComponents.tsx src/components/learn/VocabScenes.tsx src/components/learn/VocabScreens.tsx
git commit -m "fix(sp3): remove @ts-nocheck from src/components/learn/ Part 2 (21 files), fix strict-mode errors"
```

---

## Task 9: Remove @ts-nocheck — src/components/practice/ Part 1 (22 files)

**Files to process:**
```
src/components/practice/AIListeningScreen.tsx
src/components/practice/AIStoryScreen.tsx
src/components/practice/AdaptiveReviewScreen.tsx
src/components/practice/AspectDrillScreen.tsx
src/components/practice/BojeGame.tsx
src/components/practice/CefrTest.tsx
src/components/practice/ClozeEngine.tsx
src/components/practice/ConjugationDrill.tsx
src/components/practice/DialogueResultsScreen.tsx
src/components/practice/DialogueScenarioMenu.tsx
src/components/practice/DialogueSim.tsx
src/components/practice/DictationScreen.tsx
src/components/practice/FlashcardCardBack.tsx
src/components/practice/FlashcardEmptyState.tsx
src/components/practice/FlashcardResultScreen.tsx
src/components/practice/Flashcards.tsx
src/components/practice/ListeningComprehensionScreen.tsx
src/components/practice/MatchGame.tsx
src/components/practice/McGame.tsx
src/components/practice/McResult.tsx
src/components/practice/MistakesScreen.tsx
src/components/practice/MyWordsScreen.tsx
```

- [ ] **Step 1: Remove `@ts-nocheck` from all 22 files**

```bash
node -e "
const fs = require('fs');
const files = [
  'src/components/practice/AIListeningScreen.tsx',
  'src/components/practice/AIStoryScreen.tsx',
  'src/components/practice/AdaptiveReviewScreen.tsx',
  'src/components/practice/AspectDrillScreen.tsx',
  'src/components/practice/BojeGame.tsx',
  'src/components/practice/CefrTest.tsx',
  'src/components/practice/ClozeEngine.tsx',
  'src/components/practice/ConjugationDrill.tsx',
  'src/components/practice/DialogueResultsScreen.tsx',
  'src/components/practice/DialogueScenarioMenu.tsx',
  'src/components/practice/DialogueSim.tsx',
  'src/components/practice/DictationScreen.tsx',
  'src/components/practice/FlashcardCardBack.tsx',
  'src/components/practice/FlashcardEmptyState.tsx',
  'src/components/practice/FlashcardResultScreen.tsx',
  'src/components/practice/Flashcards.tsx',
  'src/components/practice/ListeningComprehensionScreen.tsx',
  'src/components/practice/MatchGame.tsx',
  'src/components/practice/McGame.tsx',
  'src/components/practice/McResult.tsx',
  'src/components/practice/MistakesScreen.tsx',
  'src/components/practice/MyWordsScreen.tsx',
];
files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  fs.writeFileSync(f, c.replace(/^\/\/ @ts-nocheck\n/, ''));
});
console.log('Done');
"
```

- [ ] **Step 2: Capture TypeScript errors from this batch only**

```bash
npx tsc --noEmit 2>&1 | grep "src/components/practice/" | grep -v "exercises/" | head -60
```

- [ ] **Step 3: Fix each error using the patterns table at the top of this plan**

Common patterns for practice components:
- `Flashcards.tsx`, `FlashcardCardBack.tsx`: Card state — `SRSCard` is now in `src/types/index.ts`; import it: `import type { SRSCard } from '../../types';`
- `McGame.tsx`: Uses `McQuestion` from `src/hooks/useMcGameReducer.ts` — import it: `import type { McQuestion } from '../../hooks/useMcGameReducer';`
- `ListeningComprehensionScreen.tsx` (1122 lines): Large component — expect many implicit `any` on callback and state params. Break down error output carefully.
- `MatchGame.tsx`, `BojeGame.tsx`: Game loops — array index access under `noUncheckedIndexedAccess`; use `arr[i]!` in validated loops.
- `ClozeEngine.tsx`: String/regex operations — `match()` returns `RegExpMatchArray | null`; guard with `if (!match) return`.
- `DictationScreen.tsx`, `AIListeningScreen.tsx`: `MediaRecorder` types from `lib.dom.d.ts`.

- [ ] **Step 4: Verify zero errors from this batch**

```bash
npx tsc --noEmit 2>&1 | grep "src/components/practice/" | grep -v "exercises/"
```

Expected: no output.

- [ ] **Step 5: Run full lint**

```bash
npm run lint
```

Expected: exits 0.

- [ ] **Step 6: Run tests**

```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/practice/AIListeningScreen.tsx src/components/practice/AIStoryScreen.tsx src/components/practice/AdaptiveReviewScreen.tsx src/components/practice/AspectDrillScreen.tsx src/components/practice/BojeGame.tsx src/components/practice/CefrTest.tsx src/components/practice/ClozeEngine.tsx src/components/practice/ConjugationDrill.tsx src/components/practice/DialogueResultsScreen.tsx src/components/practice/DialogueScenarioMenu.tsx src/components/practice/DialogueSim.tsx src/components/practice/DictationScreen.tsx src/components/practice/FlashcardCardBack.tsx src/components/practice/FlashcardEmptyState.tsx src/components/practice/FlashcardResultScreen.tsx src/components/practice/Flashcards.tsx src/components/practice/ListeningComprehensionScreen.tsx src/components/practice/MatchGame.tsx src/components/practice/McGame.tsx src/components/practice/McResult.tsx src/components/practice/MistakesScreen.tsx src/components/practice/MyWordsScreen.tsx
git commit -m "fix(sp3): remove @ts-nocheck from src/components/practice/ Part 1 (22 files), fix strict-mode errors"
```

---

## Task 10: Remove @ts-nocheck — src/components/practice/ Part 2 (21 files)

**Files to process:**
```
src/components/practice/PitchAccentScreen.tsx
src/components/practice/PracticeTab.tsx
src/components/practice/ProductionDrillScreen.tsx
src/components/practice/PronunciationAssessScreen.tsx
src/components/practice/PronunciationContrast.tsx
src/components/practice/ReviewScreen.tsx
src/components/practice/SentenceTileScreen.tsx
src/components/practice/ShadowingScreen.tsx
src/components/practice/SlangScreen.tsx
src/components/practice/SpeakingScreen.tsx
src/components/practice/SpeakingSprintScreen.tsx
src/components/practice/SpeakingSummaryScreen.tsx
src/components/practice/SprintCountdownScreen.tsx
src/components/practice/SprintSetupScreen.tsx
src/components/practice/StoryScreens.tsx
src/components/practice/TypingScreen.tsx
src/components/practice/VideoLessonScreen.tsx
src/components/practice/VocativeScreen.tsx
src/components/practice/WordSprint.tsx
src/components/practice/WritingScreen.tsx
src/components/practice/ZnamGame.tsx
```

- [ ] **Step 1: Remove `@ts-nocheck` from all 21 files**

```bash
node -e "
const fs = require('fs');
const files = [
  'src/components/practice/PitchAccentScreen.tsx',
  'src/components/practice/PracticeTab.tsx',
  'src/components/practice/ProductionDrillScreen.tsx',
  'src/components/practice/PronunciationAssessScreen.tsx',
  'src/components/practice/PronunciationContrast.tsx',
  'src/components/practice/ReviewScreen.tsx',
  'src/components/practice/SentenceTileScreen.tsx',
  'src/components/practice/ShadowingScreen.tsx',
  'src/components/practice/SlangScreen.tsx',
  'src/components/practice/SpeakingScreen.tsx',
  'src/components/practice/SpeakingSprintScreen.tsx',
  'src/components/practice/SpeakingSummaryScreen.tsx',
  'src/components/practice/SprintCountdownScreen.tsx',
  'src/components/practice/SprintSetupScreen.tsx',
  'src/components/practice/StoryScreens.tsx',
  'src/components/practice/TypingScreen.tsx',
  'src/components/practice/VideoLessonScreen.tsx',
  'src/components/practice/VocativeScreen.tsx',
  'src/components/practice/WordSprint.tsx',
  'src/components/practice/WritingScreen.tsx',
  'src/components/practice/ZnamGame.tsx',
];
files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  fs.writeFileSync(f, c.replace(/^\/\/ @ts-nocheck\n/, ''));
});
console.log('Done');
"
```

- [ ] **Step 2: Capture TypeScript errors from this batch only**

```bash
npx tsc --noEmit 2>&1 | grep "src/components/practice/" | grep -v "exercises/" | head -60
```

- [ ] **Step 3: Fix each error using the patterns table at the top of this plan**

Common patterns for this batch:
- `TypingScreen.tsx`: Levenshtein distance result — `string | undefined` from array access; add null guard.
- `ReviewScreen.tsx`: Uses SRS card data — import `SRSCard` from `../../types` if accessing card fields.
- `SpeakingScreen.tsx`, `SpeakingSprintScreen.tsx`: `SpeechRecognition` API — defined in `lib.dom.d.ts` as `webkitSpeechRecognition`. May need type cast: `const SR = (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;`
- `TypingScreen.tsx`, `WritingScreen.tsx`: User input handlers — `e: React.ChangeEvent<HTMLInputElement>` for `onChange`.
- `ZnamGame.tsx`, `WordSprint.tsx`: Game timer / score arrays — `arr[i]!` for validated non-empty access.

- [ ] **Step 4: Verify zero errors from this batch**

```bash
npx tsc --noEmit 2>&1 | grep "src/components/practice/" | grep -v "exercises/"
```

Expected: no output.

- [ ] **Step 5: Run full lint**

```bash
npm run lint
```

Expected: exits 0.

- [ ] **Step 6: Run tests**

```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/practice/PitchAccentScreen.tsx src/components/practice/PracticeTab.tsx src/components/practice/ProductionDrillScreen.tsx src/components/practice/PronunciationAssessScreen.tsx src/components/practice/PronunciationContrast.tsx src/components/practice/ReviewScreen.tsx src/components/practice/SentenceTileScreen.tsx src/components/practice/ShadowingScreen.tsx src/components/practice/SlangScreen.tsx src/components/practice/SpeakingScreen.tsx src/components/practice/SpeakingSprintScreen.tsx src/components/practice/SpeakingSummaryScreen.tsx src/components/practice/SprintCountdownScreen.tsx src/components/practice/SprintSetupScreen.tsx src/components/practice/StoryScreens.tsx src/components/practice/TypingScreen.tsx src/components/practice/VideoLessonScreen.tsx src/components/practice/VocativeScreen.tsx src/components/practice/WordSprint.tsx src/components/practice/WritingScreen.tsx src/components/practice/ZnamGame.tsx
git commit -m "fix(sp3): remove @ts-nocheck from src/components/practice/ Part 2 (21 files), fix strict-mode errors"
```

---

## Task 11: Remove @ts-nocheck — src/components/practice/exercises/ (15 files)

**Files to process:**
```
src/components/practice/exercises/AccusativeDrillScreen.tsx
src/components/practice/exercises/ColorAgreementScreen.tsx
src/components/practice/exercises/ComparativesScreen.tsx
src/components/practice/exercises/FutureTenseScreen.tsx
src/components/practice/exercises/GenderDrillScreen.tsx
src/components/practice/exercises/LogicQuizScreen.tsx
src/components/practice/exercises/NegationScreen.tsx
src/components/practice/exercises/OppositesScreen.tsx
src/components/practice/exercises/OrdinalsScreen.tsx
src/components/practice/exercises/ProfessionGenderScreen.tsx
src/components/practice/exercises/QuestionWordsScreen.tsx
src/components/practice/exercises/RelativePronounsScreen.tsx
src/components/practice/exercises/SibilarizationScreen.tsx
src/components/practice/exercises/TenseFlipScreen.tsx
src/components/practice/exercises/VerbDrillScreen.tsx
```

- [ ] **Step 1: Remove `@ts-nocheck` from all 15 files**

```bash
node -e "
const fs = require('fs');
const files = [
  'src/components/practice/exercises/AccusativeDrillScreen.tsx',
  'src/components/practice/exercises/ColorAgreementScreen.tsx',
  'src/components/practice/exercises/ComparativesScreen.tsx',
  'src/components/practice/exercises/FutureTenseScreen.tsx',
  'src/components/practice/exercises/GenderDrillScreen.tsx',
  'src/components/practice/exercises/LogicQuizScreen.tsx',
  'src/components/practice/exercises/NegationScreen.tsx',
  'src/components/practice/exercises/OppositesScreen.tsx',
  'src/components/practice/exercises/OrdinalsScreen.tsx',
  'src/components/practice/exercises/ProfessionGenderScreen.tsx',
  'src/components/practice/exercises/QuestionWordsScreen.tsx',
  'src/components/practice/exercises/RelativePronounsScreen.tsx',
  'src/components/practice/exercises/SibilarizationScreen.tsx',
  'src/components/practice/exercises/TenseFlipScreen.tsx',
  'src/components/practice/exercises/VerbDrillScreen.tsx',
];
files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  fs.writeFileSync(f, c.replace(/^\/\/ @ts-nocheck\n/, ''));
});
console.log('Done');
"
```

- [ ] **Step 2: Capture TypeScript errors from this batch only**

```bash
npx tsc --noEmit 2>&1 | grep "src/components/practice/exercises/" | head -60
```

- [ ] **Step 3: Fix each error using the patterns table at the top of this plan**

These are focused exercise screens — small, similar structure. Common patterns:
- Each screen takes a vocabulary set and presents exercises from an array. `exercises[currentIndex]` returns `Exercise | undefined` under `noUncheckedIndexedAccess`. Guard: `const ex = exercises[currentIndex]; if (!ex) return null;`
- Callback props like `onComplete: (score: number) => void` — add the type signature to the Props interface.
- `shuffle(arr)` result — typed as `T[]`; first element access still returns `T | undefined`.

- [ ] **Step 4: Verify zero errors from this batch**

```bash
npx tsc --noEmit 2>&1 | grep "src/components/practice/exercises/"
```

Expected: no output.

- [ ] **Step 5: Run full lint**

```bash
npm run lint
```

Expected: exits 0.

- [ ] **Step 6: Run tests**

```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/practice/exercises/
git commit -m "fix(sp3): remove @ts-nocheck from src/components/practice/exercises/ (15 files), fix strict-mode errors"
```

---

## Task 12: Remove @ts-nocheck — src/components/profile/ (17 files)

**Files to process:**
```
src/components/profile/AdaptiveInsightsCard.tsx
src/components/profile/CertificateScreen.tsx
src/components/profile/ContactScreen.tsx
src/components/profile/CroatianErrorInsights.tsx
src/components/profile/FriendsScreen.tsx
src/components/profile/InsightsTab.tsx
src/components/profile/Leaderboard.tsx
src/components/profile/LearnPath.tsx
src/components/profile/LearningInsights.tsx
src/components/profile/ProfileHeader.tsx
src/components/profile/ProfileTab.tsx
src/components/profile/ProgressCharts.tsx
src/components/profile/SettingsTab.tsx
src/components/profile/StatsTab.tsx
src/components/profile/VocabJournal.tsx
src/components/profile/WeeklyLeague.tsx
src/components/profile/XPActivityCalendar.tsx
```

- [ ] **Step 1: Remove `@ts-nocheck` from all 17 files**

```bash
node -e "
const fs = require('fs');
const files = [
  'src/components/profile/AdaptiveInsightsCard.tsx',
  'src/components/profile/CertificateScreen.tsx',
  'src/components/profile/ContactScreen.tsx',
  'src/components/profile/CroatianErrorInsights.tsx',
  'src/components/profile/FriendsScreen.tsx',
  'src/components/profile/InsightsTab.tsx',
  'src/components/profile/Leaderboard.tsx',
  'src/components/profile/LearnPath.tsx',
  'src/components/profile/LearningInsights.tsx',
  'src/components/profile/ProfileHeader.tsx',
  'src/components/profile/ProfileTab.tsx',
  'src/components/profile/ProgressCharts.tsx',
  'src/components/profile/SettingsTab.tsx',
  'src/components/profile/StatsTab.tsx',
  'src/components/profile/VocabJournal.tsx',
  'src/components/profile/WeeklyLeague.tsx',
  'src/components/profile/XPActivityCalendar.tsx',
];
files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  fs.writeFileSync(f, c.replace(/^\/\/ @ts-nocheck\n/, ''));
});
console.log('Done');
"
```

- [ ] **Step 2: Capture TypeScript errors from this batch only**

```bash
npx tsc --noEmit 2>&1 | grep "src/components/profile/" | head -60
```

- [ ] **Step 3: Fix each error using the patterns table at the top of this plan**

Common patterns for profile components:
- `SettingsTab.tsx` (938 lines): Settings toggles — localStorage reads return `string | null`; use `?? defaultValue`. 
- `LearnPath.tsx`: Accesses `LearnPathItem` array elements — import `LearnPathItem` from `../../types`.
- `ProgressCharts.tsx`, `XPActivityCalendar.tsx`: Chart data arrays — `data[i]` returns `DataPoint | undefined`; guard before using.
- `StatsTab.tsx`, `InsightsTab.tsx`: Accesses `stats` fields dynamically — use `stats[key as keyof Stats]` for computed access.
- `VocabJournal.tsx`: Journal entry objects from localStorage — use typed interface for the parsed JSON.
- `Leaderboard.tsx`, `WeeklyLeague.tsx`: Firebase query results — `docs[0]` returns `QueryDocumentSnapshot | undefined`.

- [ ] **Step 4: Verify zero errors from this batch**

```bash
npx tsc --noEmit 2>&1 | grep "src/components/profile/"
```

Expected: no output.

- [ ] **Step 5: Run full lint**

```bash
npm run lint
```

Expected: exits 0.

- [ ] **Step 6: Run tests**

```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/profile/
git commit -m "fix(sp3): remove @ts-nocheck from src/components/profile/ (17 files), fix strict-mode errors"
```

---

## Task 13: Remove @ts-nocheck — src/components/croatia/ Part 1 (21 files)

**Files to process:**
```
src/components/croatia/AIConversation.tsx
src/components/croatia/AIConversationConvoSetup.tsx
src/components/croatia/AIConversationHeader.tsx
src/components/croatia/CityOfDayScreen.tsx
src/components/croatia/CivicScreen.tsx
src/components/croatia/ConversationBubble.tsx
src/components/croatia/CrMap.tsx
src/components/croatia/CroatiaAthletes.tsx
src/components/croatia/CroatiaCulture.tsx
src/components/croatia/CroatiaHistoryScreen.tsx
src/components/croatia/CroatiaTab.tsx
src/components/croatia/CroatianNewsScreen.tsx
src/components/croatia/CultureTab.tsx
src/components/croatia/DialectAwarenessScreen.tsx
src/components/croatia/DiasporaNote.tsx
src/components/croatia/DiscoverTab.tsx
src/components/croatia/EasterScreen.tsx
src/components/croatia/EventsCalendar.tsx
src/components/croatia/EventsTop100.tsx
src/components/croatia/HeritagePathScreen.tsx
src/components/croatia/HeritageStoryScreen.tsx
```

- [ ] **Step 1: Remove `@ts-nocheck` from all 21 files**

```bash
node -e "
const fs = require('fs');
const files = [
  'src/components/croatia/AIConversation.tsx',
  'src/components/croatia/AIConversationConvoSetup.tsx',
  'src/components/croatia/AIConversationHeader.tsx',
  'src/components/croatia/CityOfDayScreen.tsx',
  'src/components/croatia/CivicScreen.tsx',
  'src/components/croatia/ConversationBubble.tsx',
  'src/components/croatia/CrMap.tsx',
  'src/components/croatia/CroatiaAthletes.tsx',
  'src/components/croatia/CroatiaCulture.tsx',
  'src/components/croatia/CroatiaHistoryScreen.tsx',
  'src/components/croatia/CroatiaTab.tsx',
  'src/components/croatia/CroatianNewsScreen.tsx',
  'src/components/croatia/CultureTab.tsx',
  'src/components/croatia/DialectAwarenessScreen.tsx',
  'src/components/croatia/DiasporaNote.tsx',
  'src/components/croatia/DiscoverTab.tsx',
  'src/components/croatia/EasterScreen.tsx',
  'src/components/croatia/EventsCalendar.tsx',
  'src/components/croatia/EventsTop100.tsx',
  'src/components/croatia/HeritagePathScreen.tsx',
  'src/components/croatia/HeritageStoryScreen.tsx',
];
files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  fs.writeFileSync(f, c.replace(/^\/\/ @ts-nocheck\n/, ''));
});
console.log('Done');
"
```

- [ ] **Step 2: Capture TypeScript errors from this batch only**

```bash
npx tsc --noEmit 2>&1 | grep "src/components/croatia/" | head -60
```

- [ ] **Step 3: Fix each error using the patterns table at the top of this plan**

Common patterns for Croatia components:
- `AIConversation.tsx` (885 lines): Conversation message objects — define `interface Message { role: 'user' | 'assistant'; content: string }` and use it for the message array.
- `AIConversationConvoSetup.tsx`, `AIConversationHeader.tsx`: Persona and topic objects — use `Record<string, string>` or specific interface.
- `CrMap.tsx`: Map interaction events — `React.MouseEvent<SVGElement>` for SVG click handlers.
- `EventsCalendar.tsx`: Date objects — `Date | null` initialization; guard before calling `.toISOString()` etc.
- `DialectAwarenessScreen.tsx` (1117 lines): Large component — process error output carefully; may have many implicit `any` on example data arrays.
- `HeritagePathScreen.tsx`, `HeritageStoryScreen.tsx`: Story data objects from `src/data/` — use `unknown` or typed interface.

- [ ] **Step 4: Verify zero errors from this batch**

```bash
npx tsc --noEmit 2>&1 | grep "src/components/croatia/"
```

Expected: no output.

- [ ] **Step 5: Run full lint**

```bash
npm run lint
```

Expected: exits 0.

- [ ] **Step 6: Run tests**

```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/croatia/AIConversation.tsx src/components/croatia/AIConversationConvoSetup.tsx src/components/croatia/AIConversationHeader.tsx src/components/croatia/CityOfDayScreen.tsx src/components/croatia/CivicScreen.tsx src/components/croatia/ConversationBubble.tsx src/components/croatia/CrMap.tsx src/components/croatia/CroatiaAthletes.tsx src/components/croatia/CroatiaCulture.tsx src/components/croatia/CroatiaHistoryScreen.tsx src/components/croatia/CroatiaTab.tsx src/components/croatia/CroatianNewsScreen.tsx src/components/croatia/CultureTab.tsx src/components/croatia/DialectAwarenessScreen.tsx src/components/croatia/DiasporaNote.tsx src/components/croatia/DiscoverTab.tsx src/components/croatia/EasterScreen.tsx src/components/croatia/EventsCalendar.tsx src/components/croatia/EventsTop100.tsx src/components/croatia/HeritagePathScreen.tsx src/components/croatia/HeritageStoryScreen.tsx
git commit -m "fix(sp3): remove @ts-nocheck from src/components/croatia/ Part 1 (21 files), fix strict-mode errors"
```

---

## Task 14: Remove @ts-nocheck — src/components/croatia/ Part 2 (20 files)

**Files to process:**
```
src/components/croatia/LifeEventsScreen.tsx
src/components/croatia/LiveTutorScreen.tsx
src/components/croatia/MajaIdleCard.tsx
src/components/croatia/MajaOrb.tsx
src/components/croatia/MajaScreen.tsx
src/components/croatia/MediaPlayerUtils.tsx
src/components/croatia/MediaTab.tsx
src/components/croatia/PersonaScreen.tsx
src/components/croatia/PhraseOfDayScreen.tsx
src/components/croatia/PostcardScreen.tsx
src/components/croatia/RadioPlayer.tsx
src/components/croatia/RecipesScreen.tsx
src/components/croatia/RegionScreens.tsx
src/components/croatia/SpeakingAvatar.tsx
src/components/croatia/StoriesTab.tsx
src/components/croatia/StoryModeScreen.tsx
src/components/croatia/StorySetupPanel.tsx
src/components/croatia/StoryViewPanel.tsx
src/components/croatia/SurvivalDinner.tsx
src/components/croatia/Top100Screen.tsx
```

- [ ] **Step 1: Remove `@ts-nocheck` from all 20 files**

```bash
node -e "
const fs = require('fs');
const files = [
  'src/components/croatia/LifeEventsScreen.tsx',
  'src/components/croatia/LiveTutorScreen.tsx',
  'src/components/croatia/MajaIdleCard.tsx',
  'src/components/croatia/MajaOrb.tsx',
  'src/components/croatia/MajaScreen.tsx',
  'src/components/croatia/MediaPlayerUtils.tsx',
  'src/components/croatia/MediaTab.tsx',
  'src/components/croatia/PersonaScreen.tsx',
  'src/components/croatia/PhraseOfDayScreen.tsx',
  'src/components/croatia/PostcardScreen.tsx',
  'src/components/croatia/RadioPlayer.tsx',
  'src/components/croatia/RecipesScreen.tsx',
  'src/components/croatia/RegionScreens.tsx',
  'src/components/croatia/SpeakingAvatar.tsx',
  'src/components/croatia/StoriesTab.tsx',
  'src/components/croatia/StoryModeScreen.tsx',
  'src/components/croatia/StorySetupPanel.tsx',
  'src/components/croatia/StoryViewPanel.tsx',
  'src/components/croatia/SurvivalDinner.tsx',
  'src/components/croatia/Top100Screen.tsx',
];
files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  fs.writeFileSync(f, c.replace(/^\/\/ @ts-nocheck\n/, ''));
});
console.log('Done');
"
```

- [ ] **Step 2: Capture TypeScript errors from this batch only**

```bash
npx tsc --noEmit 2>&1 | grep "src/components/croatia/" | head -60
```

- [ ] **Step 3: Fix each error using the patterns table at the top of this plan**

Common patterns for this Croatia batch:
- `LiveTutorScreen.tsx` (923 lines): AI conversation interface — message type `interface TutorMessage { role: 'user' | 'assistant'; content: string; timestamp?: number }`.
- `RadioPlayer.tsx`, `MediaPlayerUtils.tsx`: HTMLAudioElement — typed by `lib.dom.d.ts`. `audioRef.current?.play()` for optional chaining.
- `SpeakingAvatar.tsx`: Animation state — typed interface for animation config object.
- `PostcardScreen.tsx`: The eslint-disable comment placed in SP2 remains — verify it is still correctly positioned after the @ts-nocheck removal.
- `StoryModeScreen.tsx`, `StorySetupPanel.tsx`, `StoryViewPanel.tsx`: Story data — define `interface Story { id: string; title: string; content: string; ... }` locally.

- [ ] **Step 4: Verify zero errors from this batch**

```bash
npx tsc --noEmit 2>&1 | grep "src/components/croatia/"
```

Expected: no output.

- [ ] **Step 5: Verify zero @ts-nocheck pragmas remain in the entire codebase**

```bash
grep -rl "@ts-nocheck" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null
```

Expected: **no output** (zero files). If any files are listed, they were missed in a previous batch — fix them now before proceeding.

- [ ] **Step 6: Run full lint**

```bash
npm run lint
```

Expected: exits 0.

- [ ] **Step 7: Run tests**

```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/components/croatia/LifeEventsScreen.tsx src/components/croatia/LiveTutorScreen.tsx src/components/croatia/MajaIdleCard.tsx src/components/croatia/MajaOrb.tsx src/components/croatia/MajaScreen.tsx src/components/croatia/MediaPlayerUtils.tsx src/components/croatia/MediaTab.tsx src/components/croatia/PersonaScreen.tsx src/components/croatia/PhraseOfDayScreen.tsx src/components/croatia/PostcardScreen.tsx src/components/croatia/RadioPlayer.tsx src/components/croatia/RecipesScreen.tsx src/components/croatia/RegionScreens.tsx src/components/croatia/SpeakingAvatar.tsx src/components/croatia/StoriesTab.tsx src/components/croatia/StoryModeScreen.tsx src/components/croatia/StorySetupPanel.tsx src/components/croatia/StoryViewPanel.tsx src/components/croatia/SurvivalDinner.tsx src/components/croatia/Top100Screen.tsx
git commit -m "fix(sp3): remove @ts-nocheck from src/components/croatia/ Part 2 (20 files), fix strict-mode errors"
```

---

## Task 15: Enable ESLint Bans and Final Verification

**Files:**
- Modify: `eslint.config.js`

**Context:** This is the final locking step. All `@ts-nocheck` pragmas have been removed (verified at the end of Task 14). All `as any` casts have been removed (Task 2). Now enable the two ESLint rules that ban their future introduction. The spec requires `@typescript-eslint/ban-ts-comment: ['error', { minimumDescriptionLength: 10 }]` and `@typescript-eslint/no-explicit-any: 'error'`. These were intentionally deferred from SP2 (211 `@ts-nocheck` instances and `as any` usages existed).

- [ ] **Step 1: Verify zero @ts-nocheck and zero as-any remain**

```bash
grep -rl "@ts-nocheck" src/ --include="*.ts" --include="*.tsx" 2>/dev/null
grep -r "as any" src/ --include="*.ts" --include="*.tsx" 2>/dev/null
```

Expected: **both commands produce no output**. If either command shows files, fix them before proceeding.

- [ ] **Step 2: Locate the current ban-ts-comment and no-explicit-any settings in eslint.config.js**

```bash
grep -n "ban-ts-comment\|no-explicit-any" eslint.config.js
```

Note the line numbers. There will be two settings — both currently set to `'off'` and `'warn'` respectively.

- [ ] **Step 3: Update eslint.config.js — enable ban-ts-comment**

Find the line in `eslint.config.js`:
```js
      '@typescript-eslint/ban-ts-comment': 'off',
```

Change it to:
```js
      '@typescript-eslint/ban-ts-comment': ['error', { minimumDescriptionLength: 10 }],
```

- [ ] **Step 4: Update eslint.config.js — escalate no-explicit-any to error**

Find the line:
```js
      '@typescript-eslint/no-explicit-any': 'warn',
```

Change it to:
```js
      '@typescript-eslint/no-explicit-any': 'error',
```

- [ ] **Step 5: Run ESLint to verify it exits 0**

```bash
npm run lint
```

Expected: **exits 0**. If any `no-explicit-any` errors appear, there is an `as any` cast that was missed — find and fix it using the `grep` from Step 1. If any `ban-ts-comment` errors appear, there is a `@ts-nocheck` pragma that was missed — find and remove it.

- [ ] **Step 6: Run TypeScript to verify final state**

```bash
npx tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 7: Run full test suite**

```bash
npm run test:coverage
```

Expected: All tests pass, all four coverage metrics ≥80%.

- [ ] **Step 8: Run circular dependency check**

```bash
npm run check:circular
```

Expected: `No circular dependency found!`

- [ ] **Step 9: Commit**

```bash
git add eslint.config.js
git commit -m "feat(sp3): enable @typescript-eslint/ban-ts-comment:error and no-explicit-any:error — SP3 complete"
```

- [ ] **Step 10: Push to master**

```bash
git push origin master
```

Expected: CI run triggered. All jobs must pass:
- `quality`: ESLint ✅, TypeScript ✅, Prettier ✅, circular deps ✅
- `test`: Coverage ≥80% all metrics ✅
- `build-deploy`: Build ✅

---

## SP3 Exit Criteria Checklist

- [ ] `strict: true` and `noUncheckedIndexedAccess: true` in `tsconfig.json`
- [ ] Zero `@ts-nocheck` pragmas anywhere in `src/`
- [ ] Zero `as any` casts in `src/`
- [ ] `@typescript-eslint/ban-ts-comment: ['error', { minimumDescriptionLength: 10 }]` in `eslint.config.js`
- [ ] `@typescript-eslint/no-explicit-any: 'error'` in `eslint.config.js`
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run test:coverage` passes with ≥80% all metrics
- [ ] CI green on all required jobs

## Deferred to Sub-project 4 (Do Not Do Now)

- Component file splits (files >400 lines) — SP4 scope
- `max-lines` ESLint rule — SP4 final step
- ErrorBoundary consolidation — SP4 scope
- `noImplicitReturns: true` enforcement for new code — already in tsconfig, not a blocker
- `src/types/` directory additions: `ProgressSnapshot`, `FirestoreUserDoc` — add only if needed to resolve batch errors; otherwise defer to SP5 documentation phase
