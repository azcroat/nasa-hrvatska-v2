# SP7 — Adaptive Reading Recommendations (Design Spec)

**Date:** 2026-05-15
**Status:** Approved (5/5 sections approved by jschr in chat)
**Predecessor:** SP6 (Inline Correction Diff, complete)
**Successor:** SP8 (Pronunciation Granularity)
**Sibling slices for later:** SP7b (Claude-generated rationale), SP7c (Firestore sync of `nh_recent_reads`), SP7d (author C2 stories), SP7e (click-through analytics), SP7f (multi-story today's reading list)

## Why this exists

After SP5 (user-context layer) and SP6 (inline correction diff), the app knows what the learner is weak on and can render their corrections beautifully. But the **30-story graded reading catalog** (`src/data/gradedStories.js`) is presented as a flat list filtered by CEFR — every learner at level B1 sees the same 18 stories in the same order. There is no signal that says *"this story is right for you today"*. A learner who keeps missing accusative endings gets no nudge toward stories that practice accusative.

SP7 closes that gap with the smallest viable surface: a **Story of the Day** card on the home screen that recommends the highest-scoring story for the current learner, with a one-sentence rationale, and a CTA that opens the reader pre-routed to that story.

User's stated SP7 goal (chat 2026-05-15):
> "Reading + Content Depth — deepen the reading/comprehension content the app offers."

User-approved scope decisions during this brainstorm:
- Adaptive reading recommendations (not richer comprehension scaffolding, not audio narration, not authoring more stories)
- One surface: home-screen "Story of the Day" card
- Ranking principle: prefer stories that *exercise* the learner's weak topics (active remediation through reading)
- Algorithm: pure client-side scorer (no AI call on the recommendation hot path)

## Decisions locked in brainstorming

| Decision | Choice | Reasoning |
|---|---|---|
| Slice | Adaptive recommendations (not new content, not new comprehension UI) | Highest leverage on the SP4b–SP6 foundation; turns existing catalog into a personalized surface |
| Surface | Single home-screen card | Highest visibility, smallest UI surface, mirrors the Word-of-Day / Phrase-of-Day pattern |
| Ranking | Exercise weak topics (vs avoid them, stretch, or maximize new vocab) | Active remediation aligns with the pedagogy of SP5 (which already surfaces weak topics) |
| Algorithm | Pure client-side scorer | Deterministic, testable, no paid Claude call per home render, no Firestore read |

## Architecture

A pure-function scorer ranks the 30-story catalog using SP5's already-built `UserContext` plus a new `nh_recent_reads` localStorage layer. A new `StoryOfTheDayCard` renders the top match on the home screen. Tapping the card launches `GradedInputScreen` pre-routed to that story. Marking a story complete writes to `nh_recent_reads` so it falls out of recommendation for 7 days (hard exclusion) and gets a -15 score penalty for 30 days (soft penalty).

```
[Client]
  Home screen mount ──> <StoryOfTheDayCard launchStory={...} />
                              │
                              ├── buildUserContext()           (from SP5 — already shipped)
                              ├── getRecentReads()             (new — nh_recent_reads localStorage)
                              ├── GRADED_STORIES catalog       (already shipped)
                              │
                              └── recommendStory(ctx, catalog, recentReads)
                                      │
                                      ├── filter by CEFR unlock
                                      ├── exclude recent reads (7-day window)
                                      ├── score by weak-topic ∩ focus overlap + level match
                                      ├── tiebreak alphabetical by title
                                      │
                                      └── { story, score, rationale }

  User taps CTA  ──> launchStory(storyId) ──> GradedInputScreen with initialStoryId prop
  User finishes story ──> recordStoryRead(storyId) ──> nh_recent_reads
```

### Key invariants

- The scorer is **pure** — same inputs always produce the same output. Easy to unit-test.
- The card **always renders something** for any non-empty catalog — fallback paths cover brand-new users (empty weakTopics) and saturated users (all stories read).
- All state lives in localStorage. No Firestore writes on the recommendation hot path.
- Recency mirrors SP4b/SP5 patterns (`nh_recent_production`, `nh_recent_errors`) — JSON array of `{id, at}` entries, capped at 60, pruned by TTL.
- The card has zero side effects on render. The only writes happen on `recordStoryRead`, called when a story is completed.

## The scorer

Pure function in `src/lib/storyRecommendation.ts`. No React, no localStorage reads inside the function — all inputs passed in.

### Signature

```ts
export interface RankedStory {
  story: GradedStory;
  score: number;
  rationale: string;
}

export function recommendStory(
  userContext: UserContext,
  catalog: GradedStory[],
  recentReads: string[],
): RankedStory | null;
```

Returns `null` only if the catalog is empty after filtering (extremely unlikely — 30-story catalog spans A1–C1).

### Filter pipeline

Applied in order before scoring:

1. **CEFR unlock filter.** Keep stories where `cefrRank(story.level) <= cefrRank(user.cefr)`.
2. **Recency exclusion.** Drop stories whose `id` is in `recentReads`. If this empties the pool, fall back to the pre-exclusion pool (mirrors SP4b's `selectProductionExercise` fallback).

### Scoring rules

Each surviving story gets a numeric score. Higher = better recommendation.

| Signal | Points | Why |
|---|---|---|
| Story's CEFR matches user's exact level | +20 | Sweet-spot difficulty |
| Story's CEFR is one level below user's | +10 | Confidence reading |
| Story's CEFR is 2+ levels below user's | 0 | Too easy, no learning |
| Each weak topic that appears in `story.focus` (case-insensitive substring match) | +25 each, capped at +50 | Primary signal per spec |
| Story is in `recentReadsExtended` (within 30 days but not 7) | -15 | Soft penalty, distinct from hard 7-day exclusion |

**Tiebreak:** alphabetical by `title` (deterministic; stable across renders).

**Practical range:** 0–80.

### Topic-name normalization

User's `weakTopics[i].topic` field uses canonical IDs (`accusative`, `aspect-imperfective`). Story's `focus` field is human-prose (`"Past tense • Aspect • Accusative + Genitive"`). The matcher normalizes both sides:

```ts
const TOPIC_KEYWORDS: Record<string, string[]> = {
  'accusative': ['accusative'],
  'genitive': ['genitive'],
  'dative-locative': ['dative', 'locative'],
  'instrumental': ['instrumental'],
  'vocative': ['vocative'],
  'past-tense': ['past tense', 'past'],
  'future-tense': ['future tense', 'future'],
  'aspect-imperfective': ['imperfective', 'aspect'],
  'aspect-perfective': ['perfective', 'aspect'],
  'aspect-negation': ['negation', 'aspect'],
  'conditional': ['conditional'],
  'clitics': ['clitic', 'clitics'],
  'vocab-a2': [],
  'vocab-b1': [],
  'vocab-b2': [],
  'speaking': [],
};
```

A topic counts as a match if **any** of its keywords appears in `story.focus` (case-insensitive substring). The empty arrays for `vocab-*` and `speaking` mean those topics never trigger the +25 bonus — they're handled by the CEFR filter or aren't relevant signals for reading.

### Rationale string

Built from the highest-scoring signal. Single sentence; used verbatim as the card's secondary line.

- Weak-topic match: `"Practice ${matchedTopic} — your current weak spot."`
- Level-match only: `"Right at your ${cefr} level — solid practice."`
- Level-below fallback: `"Confidence-building read at ${storyLevel}."`
- Re-read (extended penalty window applied): `"Worth a re-read at your ${cefr} level."`

### Worked example

B1 user, weakTopics=['accusative', 'aspect-imperfective'], no recent reads:

| Story | CEFR | Focus | Score | Why |
|---|---|---|---|---|
| Na tržnici | A1 | "Present tense • Numbers • Accusative" | 0 + 25 = 25 | level-2-below + accusative match |
| Moj radni dan | B1 | "Past tense • Daily routines" | 20 + 0 = 20 | level-match only |
| Mama u kuhinji | A2 | "Present tense • Imperfective aspect • Cooking" | 10 + 25 = 35 | level-1-below + aspect-imperfective match |
| Sveti Marko | B1 | "Past tense (aspect) • Accusative + Genitive" | 20 + 50 = 70 | level-match + 2 weak topics (cap) |

Winner: **Sveti Marko** with score 70. Rationale: `"Practice accusative — your current weak spot."`

### Edge cases (explicit contract)

| Case | Behavior |
|---|---|
| `userContext.weakTopics` is empty | All stories score by CEFR-match only. Top result is at user's exact level, alphabetically first. |
| `recentReads` excludes all unlocked stories | Fall back to unfiltered pool. The -15 penalty still applies but doesn't exclude. |
| User is A1 (only A1 stories unlocked) | Returns highest-scoring A1 story. Tiebreak alphabetical. |
| Catalog is empty | Returns `null`. |
| Tied scores | Alphabetical by title. Deterministic. |
| `story.focus` missing | That story scores as if no weak-topic match. |

## Recency layer

New file `src/lib/recentReads.ts`. Mirrors `nh_recent_production` (SP4b) and `nh_recent_errors` (SP5).

```ts
const KEY = 'nh_recent_reads';
const HARD_EXCLUSION_DAYS = 7;
const SOFT_PENALTY_DAYS = 30;
const MAX_ENTRIES = 60;

interface RecentReadEntry {
  id: string;
  at: number;
}

export function recordStoryRead(id: string): void;
export function getRecentReads(): string[];        // 7-day hard exclusion
export function getRecentReadsExtended(): string[]; // 30-day soft penalty
```

Behavior:
- Same-day re-reads do not duplicate (idempotent)
- Capped at 60 entries (FIFO drop)
- QuotaExceededError / localStorage unavailable → silent no-op
- Malformed JSON → returns empty array

## Card component

New file `src/components/home/StoryOfTheDayCard.tsx`. Mirrors the visual pattern of existing Word-of-the-Day / Phrase-of-the-Day cards (inline styles).

```tsx
export interface StoryOfTheDayCardProps {
  launchStory: (storyId: string) => void;
}

export function StoryOfTheDayCard({ launchStory }: StoryOfTheDayCardProps): React.ReactElement | null {
  const recommendation = useMemo(() => {
    const ctx = buildUserContext();
    return recommendStory(ctx, GRADED_STORIES, getRecentReads());
  }, []);

  if (!recommendation) return null; // catalog empty — defensive

  const { story, rationale } = recommendation;
  // ... renders title, level badge, rationale, duration, focus, CTA button
}
```

**Layout (top-to-bottom):**
- Header row: "📖 STORY OF THE DAY" label + level badge (colored by `story.levelBg` / `story.levelColor`)
- Title (Croatian) — large
- Title (English) — small italic
- Rationale prose — colored info text
- Meta row: `⏱ ~${duration} min` · focus topics
- CTA button (full-width): `"Read this story →"` with `data-testid="story-of-the-day-cta"`

**Key implementation notes:**
- `useMemo` for the recommendation result — deterministic for a given localStorage snapshot; refreshes on remount
- Card root has `data-testid="story-of-the-day-card"` for e2e
- CTA button has `data-testid="story-of-the-day-cta"`
- No side effects on render

## Home-screen integration

The card mounts in `src/components/home/HomeTab.tsx` as a peer to Word-of-Day / Phrase-of-Day, **immediately after** Phrase-of-Day and before any progress sidebar.

```tsx
<WordOfDayCard ... />
<PhraseOfDayCard ... />
<StoryOfTheDayCard launchStory={launchStory} />  // SP7
<ProgressSidebar ... />
```

The `launchStory` callback is wired through the home tab → AppRouter → GradedInputScreen as a new `initialStoryId` prop.

### GradedInputScreen `initialStoryId` prop

```ts
interface GradedInputScreenProps {
  goBack: () => void;
  award: (n: number, ...) => void;
  initialStoryId?: string;   // SP7 — auto-open this story on mount
}
```

When `initialStoryId` is set, the component skips the catalog list and renders the story view directly. If the ID doesn't match any story (stale state, corrupted handoff), it falls through to the catalog list. The fallback is graceful — no error UI, just the normal catalog.

### Completion tracking

`GradedInputScreen` already has a quiz-completion path. Add a single import and one line in the completion handler:

```tsx
import { recordStoryRead } from '../../lib/recentReads';

// After existing XP/quest bookkeeping:
recordStoryRead(currentStory.id);
```

## File summary

**Created:**
- `src/lib/storyRecommendation.ts` — `recommendStory()` pure function + `TOPIC_KEYWORDS` constant + `RankedStory` type
- `src/lib/recentReads.ts` — `recordStoryRead()`, `getRecentReads()`, `getRecentReadsExtended()`
- `src/components/home/StoryOfTheDayCard.tsx` — the new card
- `src/tests/storyRecommendation.test.ts` — 13 scorer tests
- `src/tests/recentReads.test.ts` — 6 recency tests
- `src/tests/storyOfTheDayCard.test.tsx` — 5 component tests
- `src/tests/gradedInputScreen.initial.test.tsx` — 2 integration tests
- `e2e/sp7-story-of-day.spec.js` — 1 Playwright e2e

**Modified:**
- `src/components/home/HomeTab.tsx` — mount the card, expose `launchStory`
- `src/components/AppRouter.tsx` — pass pending story ID through to GradedInputScreen
- `src/components/learn/GradedInputScreen.tsx` — accept `initialStoryId?` prop; auto-open matching story; call `recordStoryRead()` on completion

## Testing strategy

### Layer 1 — `recentReads.ts` unit tests (Vitest)

`src/tests/recentReads.test.ts` — 6 tests:
- `recordStoryRead` appends one entry to empty storage
- `recordStoryRead` does not duplicate same-day re-records
- `getRecentReads` returns only entries within the 7-day hard exclusion window
- `getRecentReadsExtended` returns entries within the 30-day window
- `recordStoryRead` silently no-ops on QuotaExceededError
- `getRecentReads` returns `[]` when localStorage is empty or malformed JSON

### Layer 2 — `storyRecommendation.ts` pure-function tests (Vitest)

`src/tests/storyRecommendation.test.ts` — 13 tests:
- CEFR filter: A1 user only sees A1 stories
- CEFR filter: B1 user sees A1+A2+B1 stories
- Recency exclusion: stories in `recentReads` are dropped from pool
- Recency fallback: when all unlocked stories are recent, fall back to full unlocked pool
- Score: exact level-match gets +20
- Score: one-level-below gets +10
- Score: two-levels-below gets 0
- Score: each weak-topic keyword in `story.focus` adds +25, capped at +50
- Score: soft 30-day penalty subtracts 15
- Tiebreak: stories with equal scores ranked alphabetically by title
- Rationale: weak-topic match → "Practice X — your current weak spot"
- Rationale: level-match only → "Right at your B1 level — solid practice"
- Brand-new user (empty `weakTopics`, empty `recentReads`): returns first A1 story by title

### Layer 3 — `StoryOfTheDayCard` component tests (`@testing-library/react`)

`src/tests/storyOfTheDayCard.test.tsx` — 5 tests:
- Renders the recommended story title + level badge + rationale
- CTA button click calls `launchStory` with the recommended story ID
- Returns `null` when the catalog filter produces no recommendation (defensive)
- Level badge uses the story's `levelBg` / `levelColor` values
- Recently-read story is not recommended (recency filter wired correctly)

### Layer 4 — GradedInputScreen `initialStoryId` integration test

`src/tests/gradedInputScreen.initial.test.tsx` — 2 tests:
- With `initialStoryId` prop, auto-opens the matching story (skips the catalog list)
- With `initialStoryId` pointing to a missing ID, falls through to the catalog list

### Layer 5 — Cross-browser e2e (Playwright)

`e2e/sp7-story-of-day.spec.js` — 1 happy-path test:
- Seeded user sees a story-of-day card; click opens the reader pre-routed to that story.

Uses stable testids (`story-of-the-day-card`, `story-of-the-day-cta`) — no UI label regex.

## Acceptance gates

| Gate | Pass condition | Evidence |
|---|---|---|
| 1. Scorer correctness | All 13 scorer unit tests green | `storyRecommendation.test.ts` |
| 2. Recency layer correctness | All 6 `recentReads` tests green | `recentReads.test.ts` |
| 3. Card renders + clicks | All 5 component tests green | `storyOfTheDayCard.test.tsx` |
| 4. GradedInputScreen accepts `initialStoryId` | Both integration tests green | `gradedInputScreen.initial.test.tsx` |
| 5. Determinism | Same inputs always return same `RankedStory` (implicit via unit tests; explicit "deterministic across reruns" assertion in scorer test) | scorer test suite |
| 6. Brand-new user has no empty state | Cold-start test asserts a recommendation is always returned for A1 users with no data | scorer test #13 |
| 7. Recency window is exactly 7 days | Boundary tests for entries at 6d 23h (excluded), 7d 1h (allowed) | `recentReads` boundary tests |
| 8. No regression on home screen | Existing HomeTab tests pass unchanged; the new card is purely additive | full vitest suite |
| 9. Cross-browser e2e | Playwright spec passes on Desktop Chrome (stable testid selectors) | CI |
| 10. Bundle size | New code (3 source files + card) adds < 4 KB minified | `npm run build` size diff |

## Out of scope for SP7

- AI-generated rationale prose (current rationale is one heuristic sentence). SP7b.
- Cross-device sync of `nh_recent_reads` (device-local by design). SP7c.
- C2-tier stories (catalog gap; new authoring work). SP7d.
- Click-through analytics on recommendation acceptance / completion lift. SP7e.
- Multi-story "today's reading list" with re-ranking on completion. SP7f.
- Audio narration of stories (separate workstream).
- Pre-reading vocab preview / inline click-to-translate / post-reading short-answer eval (separate workstream — "richer comprehension scaffolding" was an SP7-alternative choice).

## Follow-up slices to track

- **SP7b:** swap the heuristic rationale for a Claude-generated 1-2 sentence personalized rationale (hybrid pattern — client picks the story, server expands the rationale on-demand)
- **SP7c:** sync `nh_recent_reads` to Firestore so cross-device users don't see the same story twice
- **SP7d:** author 6 C2-level stories so the highest band has reading content
- **SP7e:** instrument click-through and completion events to measure recommendation lift
- **SP7f:** evolve to a multi-story "today's reading list" with re-ranking after each completion
