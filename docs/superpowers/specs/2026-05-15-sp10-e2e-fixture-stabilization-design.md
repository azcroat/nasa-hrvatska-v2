# SP10 — E2E Fixture Stabilization (Design Spec)

**Date:** 2026-05-15
**Status:** Approved (4/4 sections approved by jschr in chat)
**Predecessor:** SP9 (Advanced Grammar Units, complete)
**Successor:** SP11 (TBD — likely Sentry/observability per SP10b deferred items)
**Sibling slices for later:** SP10b (Sentry telemetry hardening), SP10c (performance monitoring), SP10d (CI velocity), SP10e (cross-browser e2e), SP10f (observability dashboard)

## Why this exists

Five e2e tests accumulated `.skip()` / `describe.skip()` / "PENDING" status across the SP4b → SP9 session:

| Skipped spec | Root cause |
|---|---|
| `sp4b-production-slot.spec.js` (mic-available) | Non-deterministic `selectProductionExercise` picks; CEFR race conditions |
| `sp5-user-context.spec.js` | First attempt drove UI navigation that timed out; second attempt tried `page.evaluate(import())` which fails in production bundles |
| `accessibility.spec.js` SP6 CorrectionDiff block (3 tests) | UI navigation chain timed out under CI environment timing despite SP6 cleanup testid retrofit |
| `sp8-phoneme-heatmap.spec.js` | Pronunciation submit path has zero testids + Azure assessment is real-audio dependent |

The common thread: **the practice screens lack stable testids**. The existing screens use role+regex selectors that drift or match wrong elements under CI timing. SP6 cleanup proved that data-testid retrofit fixes the pattern — but only for WritingScreen + ExerciseCard. SP10 closes the gap by retrofitting every practice/learn screen the skipped specs need.

SP10 also adds three deterministic e2e helpers (`forceCefr`, `mockRnd`, `mockAiPost`) that nullify non-determinism sources discovered during the SP4b–SP9 session.

User's stated SP10 goal (chat 2026-05-15):
> "Infrastructure Hardening + Observability — pay down accumulated e2e debt."

User-approved scope decisions during this brainstorm:
- E2E fixture stabilization (not Sentry hardening, performance monitoring, or CI velocity)
- Comprehensive testid retrofit across ~10 priority practice + learn screens
- Per-screen testid retrofit + shared constants registry (`e2e/fixtures/testids.js`)

## Decisions locked in brainstorming

| Decision | Choice | Reasoning |
|---|---|---|
| Slice | E2E fixture stabilization | Pays down accumulated SP4b–SP9 e2e debt; unblocks 5 skipped tests |
| Retrofit scope | Comprehensive — every practice screen + every primary CTA | Forward investment; prevents the flake pattern in future SPs |
| Strategy | Per-screen testid retrofit + shared `TID` constants registry | Typo-prevention; refactoring is a single-file change |
| Deterministic helpers | 3 new (`forceCefr`, `mockRnd`, `mockAiPost`) | Each one targets a specific non-determinism source discovered during SP4b–SP9 |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ COMPONENT SIDE — practice + learn screens                       │
│                                                                 │
│   <button data-testid="speaking-record" />                      │
│   <button data-testid="speaking-submit" />                      │
│   <textarea data-testid="writing-input" />  (already SP6)       │
│   <button data-testid="exercise-card-writing" />  (already SP6) │
│   ...                                                           │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ e2e/fixtures/testids.js   (canonical registry)                  │
│                                                                 │
│ export const TID = Object.freeze({                              │
│   SPEAKING_RECORD: 'speaking-record',                           │
│   SPEAKING_SUBMIT: 'speaking-submit',                           │
│   EXERCISE_CARD: (id) => `exercise-card-${id}`,                 │
│   ... (~50 entries)                                             │
│ });                                                             │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ e2e/*.spec.js — re-enabled specs use TID constants              │
│                                                                 │
│   import { TID } from './fixtures/testids.js';                  │
│   await page.getByTestId(TID.SPEAKING_RECORD).click();          │
└─────────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌─────────────────────────────────────────────────────────────────┐
│ e2e/fixtures/  — new deterministic helpers                      │
│                                                                 │
│   forceCefr(page, 'B1')      — bypass CEFR computation race     │
│   mockRnd(page, 0)           — deterministic random picks       │
│   mockAiPost(page, routes)   — canned AI responses              │
│   mockMediaRecorder(page)    — fake audio capture for SP8 e2e   │
└─────────────────────────────────────────────────────────────────┘
```

### Key invariants

- **Testids are an additive contract** — adding `data-testid` doesn't change rendered behavior, doesn't break consumers, doesn't shift layout.
- **`testids.js` is the source of truth** — every e2e spec imports from there. No spec hardcodes a testid string. Typos become impossible.
- **Skipped specs become real coverage** — at the end of SP10, the 5 currently-skipped/PENDING tests are running in CI on Desktop Chrome, asserting actual user flows.
- **Deterministic helpers compose with `seedAuth`** — existing `seedAuth(page, {xp:3000})` keeps working; new helpers stack onto it without conflict.
- **No production behavior change** — SP10 ships zero new features. Only annotations + tests.

## Naming convention

Every testid is **kebab-case**, **screen-scoped**, and **action-suffixed**:

```
{screen-or-feature}-{role-or-action}[-{id-fragment}]
```

Three rules:

1. **Containers vs items.** Singular for single elements (`speaking-submit`, `phoneme-heat-map`). `{name}-{id-fragment}` for list items (`exercise-card-writing`, `graded-story-card-gs_a1_1`).
2. **No verbs in container testids.** `speaking-result-panel`, not `speaking-show-result`.
3. **Prefix matches the screen file name.** Speaking* screens use `speaking-*`. Generic prefixes like `app-` or `main-` are forbidden — they collide.

## Testid registry — `e2e/fixtures/testids.js`

```js
// e2e/fixtures/testids.js
// SP10: canonical e2e testid registry. Every spec imports from here so
// typos become impossible and refactoring is a single-file change.

export const TID = Object.freeze({
  // ── Home tab ──────────────────────────────────────────────────────────
  STORY_OF_DAY_CARD: 'story-of-the-day-card',
  STORY_OF_DAY_CTA: 'story-of-the-day-cta',
  WORD_OF_DAY_CARD: 'word-of-day-card',
  PHRASE_OF_DAY_CARD: 'phrase-of-day-card',
  SESSION_CARD: 'session-card',
  SESSION_BEGIN_CTA: 'session-begin-cta',

  // ── Nav ───────────────────────────────────────────────────────────────
  NAV_TODAY: 'nav-today',
  NAV_LEARN: 'nav-learn',
  NAV_PRACTICE: 'nav-practice',
  NAV_CROATIA: 'nav-croatia',
  NAV_ME: 'nav-me',

  // ── Practice tab ──────────────────────────────────────────────────────
  EXERCISE_CARD: (id) => `exercise-card-${id}`,   // SP6 cleanup — already wired
  PRACTICE_QUEUE_TOP: 'practice-queue-top',

  // ── Writing screen (SP6) ──────────────────────────────────────────────
  WRITING_INPUT: 'writing-input',                  // SP6 cleanup — already wired
  WRITING_SUBMIT: 'writing-submit',                // SP6 cleanup — already wired
  WRITING_RESULT: 'writing-result',
  WRITING_RETRY: 'writing-retry',

  // ── Speaking / shadowing / production drill ───────────────────────────
  SPEAKING_RECORD: 'speaking-record',
  SPEAKING_SUBMIT: 'speaking-submit',
  SPEAKING_RESULT: 'speaking-result',
  SPEAKING_RETRY: 'speaking-retry',
  SHADOWING_RECORD: 'shadowing-record',
  SHADOWING_PLAY: 'shadowing-play',
  SHADOWING_RESULT: 'shadowing-result',
  PRODUCTION_DRILL_INPUT: 'production-drill-input',
  PRODUCTION_DRILL_SUBMIT: 'production-drill-submit',

  // ── Graded reading (SP7) ──────────────────────────────────────────────
  GRADED_STORY_CARD: (id) => `graded-story-card-${id}`,
  GRADED_STORY_START_QUIZ: 'graded-story-start-quiz',
  GRADED_STORY_QUIZ_OPTION: (i) => `graded-story-quiz-option-${i}`,

  // ── Cloze / MC / dictation / review ───────────────────────────────────
  CLOZE_INPUT: 'cloze-input',
  CLOZE_SUBMIT: 'cloze-submit',
  MC_OPTION: (i) => `mc-option-${i}`,
  DICTATION_INPUT: 'dictation-input',
  DICTATION_SUBMIT: 'dictation-submit',
  REVIEW_FLIP: 'review-flip',
  REVIEW_GRADE: (grade) => `review-grade-${grade}`,

  // ── Aspect drill / grammar drills ─────────────────────────────────────
  ASPECT_OPTION: (i) => `aspect-option-${i}`,
  CASE_DRILL_OPTION: (i) => `case-drill-option-${i}`,

  // ── Phoneme heat map (SP8) ────────────────────────────────────────────
  PHONEME_HEAT_MAP: 'phoneme-heat-map',             // SP8 — already wired
  PHONEME_CELL: 'phoneme-cell',                     // SP8 — already wired
  WORD_HEAT_CARD: 'word-heat-card',                 // SP8 — already wired

  // ── Correction diff (SP6) ─────────────────────────────────────────────
  CORRECTION_DIFF: 'correction-diff',

  // ── Grammar track (SP9) ───────────────────────────────────────────────
  GRAMMAR_LEVEL_TAB: (cefr) => `grammar-level-tab-${cefr.toLowerCase()}`,
  GRAMMAR_UNIT_DETAIL: 'grammar-unit-detail',       // SP9 — already wired
  GRAMMAR_UNIT_TITLE: 'unit-title',                 // SP9 — already wired
  GRAMMAR_DRILL_QUESTION: 'drill-question',         // SP9 — already wired
  GRAMMAR_DRILL_EXPLAIN: 'drill-explain',           // SP9 — already wired

  // ── Reader / story detail (SP7) ───────────────────────────────────────
  STORY_READER_PARAGRAPH: (i) => `story-paragraph-${i}`,
});
```

## Coverage by screen

| Priority | Screen | Current state | Add |
|---|---|---|---|
| 🔴 BLOCKER | `SpeakingScreen.tsx` | 0 testids | record, submit, result, retry |
| 🔴 BLOCKER | `ShadowingScreen.tsx` | 0 testids | record, play, result |
| 🔴 BLOCKER | `ProductionDrillScreen.tsx` | 0 testids | input, submit |
| 🔴 BLOCKER | `GradedInputScreen.tsx` | 0 testids | story-card-{id}, start-quiz, quiz-option-{i} |
| 🟡 PRIORITY | `ClozeEngine.tsx` | 0 testids | input, submit |
| 🟡 PRIORITY | `McGame.tsx` | 0 testids | option-{i} |
| 🟡 PRIORITY | `DictationScreen.tsx` | 0 testids | input, submit |
| 🟡 PRIORITY | `ReviewScreen.tsx` | 0 testids | flip, grade-{good/again/etc.} |
| 🟡 PRIORITY | `AspectDrillScreen.tsx` | 0 testids | option-{i} |
| 🟡 PRIORITY | Home / nav tabs | sparse | nav-{tab}, session-begin-cta |
| ✅ DONE | `WritingScreen.tsx` (SP6) | writing-input, writing-submit | (verify result + retry) |
| ✅ DONE | `PracticeTab.tsx` ExerciseCard (SP6) | exercise-card-{id} | — |
| ✅ DONE | `StoryOfTheDayCard.tsx` (SP7) | story-of-the-day-card, -cta | — |
| ✅ DONE | `PhonemeCell/Word/HeatMap.tsx` (SP8) | phoneme-cell, word-heat-card, phoneme-heat-map | — |
| ✅ DONE | `GrammarUnitDetail.tsx` (SP9) | unit-title, drill-question, etc. | — |

Total: ~30-40 new testid attributes across 10 screens.

## Deterministic helpers

### `forceCefr(page, cefr)` — `e2e/fixtures/forceCefr.js`

Stamps `uP_<email>.st` with values that produce the desired CEFR band, AND removes `nh_daily_session` so the session rebuilds with the forced state.

```js
export const CEFR_XP_TABLE = {
  A1: 0, A2: 500, B1: 2000, B2: 5000, C1: 12000, C2: 20000,
};

export async function forceCefr(page, cefr, opts = {}) {
  const xp = CEFR_XP_TABLE[cefr];
  if (xp === undefined) throw new Error(`forceCefr: unknown CEFR ${cefr}`);
  await page.addInitScript(({ xp, clearSession }) => {
    try {
      const uS = localStorage.getItem('uS');
      if (!uS) return;
      const { u: email } = JSON.parse(uS);
      const profileKey = 'uP_' + email;
      const raw = localStorage.getItem(profileKey);
      if (!raw) return;
      const profile = JSON.parse(raw);
      profile.st = { ...profile.st, xp, lc: 0, gc: 0 };
      localStorage.setItem(profileKey, JSON.stringify(profile));
      if (clearSession) localStorage.removeItem('nh_daily_session');
    } catch {
      // localStorage absent — silent no-op
    }
  }, { xp, clearSession: opts.clearSession !== false });
}
```

### `mockRnd(page, value)` — `e2e/fixtures/mockRnd.js`

Overrides `Math.random()` to return a fixed value:

```js
export async function mockRnd(page, value = 0) {
  if (value < 0 || value >= 1) {
    throw new Error('mockRnd value must be in [0, 1)');
  }
  await page.addInitScript((v) => {
    Math.random = () => v;
  }, value);
}
```

### `mockAiPost(page, routes)` — `e2e/fixtures/mockAiPost.js`

Registers canned responses for `/api/*` endpoints. Also exports `CANNED` with pre-built responses for `correct` and `pronunciationAssess`:

```js
export async function mockAiPost(page, routes) {
  for (const [path, body] of Object.entries(routes)) {
    await page.route(`**${path}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: typeof body === 'string' ? body : JSON.stringify(body),
      });
    });
  }
}

export const CANNED = {
  correct: { /* ...canonical /api/correct shape... */ },
  pronunciationAssess: { /* ...canonical /api/pronunciation-assess shape... */ },
};
```

### `mockMediaRecorder(page)` — `e2e/fixtures/mockMediaRecorder.js`

The SP8 phoneme heat map e2e needs to advance through the recording state machine without real audio. This helper swaps in a fake `MediaRecorder` that fires `dataavailable` + `stop` events synthetically when `.stop()` is called, and a fake `navigator.mediaDevices.getUserMedia` that resolves immediately with a stub stream. Implementation detailed in the plan.

## Re-enabling the 5 skipped specs

| Spec | Strategy |
|---|---|
| `sp4b-production-slot.spec.js` (mic-available) | `forceCefr('B1')` + `mockRnd(0)` → deterministic pick of `speaking_sprint` → assert "Speaking Sprint" label visible |
| `sp5-user-context.spec.js` | `TID.NAV_PRACTICE` + `TID.EXERCISE_CARD('writing')` + `TID.WRITING_INPUT/SUBMIT` → route+capture POST body → assert userContext.version === 1 |
| `accessibility.spec.js` SP6 block (3 tests) | Same nav chain via TID constants → axe scan + keyboard reach + Escape dismiss with stable selectors |
| `sp8-phoneme-heatmap.spec.js` | `mockMediaRecorder` + `mockAiPost({'/api/pronunciation-assess': CANNED.pronunciationAssess})` + TID-driven nav into Speaking → click record → click submit → assert `PHONEME_HEAT_MAP` visible + cell tap opens tooltip |

For each spec: `.skip()` / `describe.skip()` removed, FIXME comment removed, test runs in CI on Desktop Chrome.

## File summary

**Created:**
- `e2e/fixtures/testids.js` — canonical `TID` registry
- `e2e/fixtures/forceCefr.js` — deterministic CEFR helper
- `e2e/fixtures/mockRnd.js` — deterministic `Math.random()` helper
- `e2e/fixtures/mockAiPost.js` — `/api/*` route mocker + `CANNED` responses
- `e2e/fixtures/mockMediaRecorder.js` — fake `MediaRecorder` for SP8 e2e
- `src/tests/e2eFixtures.test.js` — 5 unit tests for the helpers' pure-input validation
- `src/tests/testids.smoke.test.tsx` — 10 smoke tests asserting each retrofitted screen renders its testids
- `src/tests/testidsRegistry.test.js` — 3 registry consistency tests

**Modified:**
- ~10 practice/learn component files — add `data-testid` attributes per the coverage table
- `e2e/sp4b-production-slot.spec.js` — re-enable mic-available test using new helpers + TID
- `e2e/sp5-user-context.spec.js` — replace skip + scaffold with real UI-driven test
- `e2e/accessibility.spec.js` — remove `describe.skip` on SP6 block; rewrite using TID + helpers
- `e2e/sp8-phoneme-heatmap.spec.js` — replace scaffold with real test using `mockMediaRecorder`

## Testing strategy

### Layer 1 — Helper unit tests (Vitest)

`src/tests/e2eFixtures.test.js` — 5 tests on pure-input validation + canned-response shapes:
- `CEFR_XP_TABLE` maps every band A1-C2 to a working xp value
- `forceCefr` throws on unknown CEFR
- `mockRnd` throws when value is out of [0, 1)
- `CANNED.correct` has the shape `/api/correct` returns
- `CANNED.pronunciationAssess` has the shape `/api/pronunciation-assess` returns

### Layer 2 — Testid smoke tests (Vitest + @testing-library/react)

`src/tests/testids.smoke.test.tsx` — one render per retrofitted screen, asserting each new testid is present:
- SpeakingScreen renders speaking-record + speaking-submit + speaking-result testids
- ShadowingScreen renders shadowing-record + shadowing-play + shadowing-result testids
- ProductionDrillScreen renders production-drill-input + production-drill-submit testids
- GradedInputScreen list view renders graded-story-card-{id} for first story
- ClozeEngine renders cloze-input + cloze-submit testids
- McGame renders mc-option-0 through mc-option-3 testids
- DictationScreen renders dictation-input + dictation-submit testids
- ReviewScreen renders review-flip + review-grade-{good} testids
- AspectDrillScreen renders aspect-option-0 testid
- HomeTab navigation renders nav-today / nav-learn / nav-practice / nav-croatia / nav-me testids

### Layer 3 — Registry consistency tests (Vitest)

`src/tests/testidsRegistry.test.js` — 3 tests guarding the `TID` registry:
- Every `TID` constant is a non-empty kebab-case string or a function returning one
- No duplicate `TID` values across the registry
- Every `TID` id-fragment function (e.g. `EXERCISE_CARD`) returns a kebab-case string

### Layer 4 — Re-enabled e2es (Playwright in CI)

The 5 re-enabled specs are themselves the acceptance criteria. CI must run them on Desktop Chrome and they must pass.

No new e2e specs added by SP10 — it's enabling the existing ones, not authoring more.

## Acceptance gates

| Gate | Pass condition | Evidence |
|---|---|---|
| 1. Helper unit tests | All 5 tests in `e2eFixtures.test.js` green | Vitest |
| 2. Testid smoke tests | All 10 smoke tests green | Vitest |
| 3. Registry consistency | All 3 registry tests green; zero duplicate testid values | Vitest |
| 4. SP4b mic-available re-enabled | Test passes in CI, no `.skip()` | CI E2E |
| 5. SP5 user-context payload re-enabled | Test passes in CI, no `.skip()` | CI E2E |
| 6. SP6 a11y block re-enabled | All 3 tests pass in CI, no `describe.skip()` | CI E2E |
| 7. SP8 phoneme heat map e2e | Test passes in CI (uses mocked MediaRecorder + Azure stub), no PENDING tag | CI E2E |
| 8. No production regression | Full vitest suite green; no existing test fails because a testid was added | full suite |
| 9. Zero new flaky tests | All re-enabled tests pass on 3 consecutive CI runs after merge | observed |
| 10. Registry import discipline | `grep -rn "data-testid" e2e/` shows zero hardcoded testid strings in spec files; every reference uses `TID.X` | static grep |

### Definition of "re-enabled"

A skipped test counts as re-enabled iff:
1. The `.skip()` / `describe.skip()` / "PENDING" comment is removed
2. The test runs in CI's "E2E Tests (Cross-Browser)" job on Desktop Chrome
3. The test passes (no FIXME deferral)
4. No selector relies on role+regex matching where a testid exists

If a test still flakes after the SP10 retrofit, that's a real product bug surfaced and fixed in SP10 — not a deferral to SP11.

## Out of scope for SP10

- Sentry telemetry hardening (SP10b)
- Performance monitoring / Core Web Vitals (SP10c)
- CI velocity optimization (SP10d)
- Cross-browser e2e expansion to Firefox + WebKit smoke (SP10e)
- Observability dashboard (SP10f)
- New product features (none — SP10 is pure infrastructure)
- Security audit (separate workflows already exist)

## Follow-up slices to track

- **SP10b:** Sentry telemetry hardening (per-screen ErrorBoundary, session replay on errors, sampled traces)
- **SP10c:** Performance monitoring (Core Web Vitals, Cloudflare Analytics, RUM)
- **SP10d:** CI velocity optimization (parallel jobs, smarter caching, fail-fast)
- **SP10e:** Cross-browser e2e expansion (re-enable on Firefox + WebKit smoke runs)
- **SP10f:** Observability dashboard (single grafana-style page showing app health)
