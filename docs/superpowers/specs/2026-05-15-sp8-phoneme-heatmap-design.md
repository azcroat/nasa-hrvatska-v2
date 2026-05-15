# SP8 — Phoneme Heat Map (Design Spec)

**Date:** 2026-05-15
**Status:** Approved (4/4 sections approved by jschr in chat)
**Predecessor:** SP7 (Adaptive Reading Recommendations, complete)
**Successor:** SP9 (Curriculum Polish)
**Sibling slices for later:** SP8b (Practice-this-sound CTA), SP8c (Pronunciation error tracking + SP5 user-context integration), SP8d (Pronunciation history dashboard), SP8e (Variable-speed audio), SP8f (Minimal-pair drill generator)

## Why this exists

The app's pronunciation pipeline (`useRecorder` → `/api/pronunciation-assess`) already produces per-phoneme accuracy scores from Azure. But that rich data is hidden: `AzureResultPanel` renders an overall score + word chips, and per-phoneme detail is buried in a `PhonemeBreakdown` component that's collapsed-by-default behind a toggle and styled minimally (10px font, small chips). Learners can't see at a glance which sounds they're missing.

SP8 closes that gap with the smallest viable surface: a **prominent phoneme heat map** that becomes the primary teaching artifact in `AzureResultPanel`. Each spoken word becomes a card; each phoneme inside the word becomes a tappable cell color-coded by accuracy. Tapping a cell reveals a popover with the existing `PHONEME_HINTS` text + `PhonemeGuideCard` content (mouth shape, common mistakes, sample-word audio).

User's stated SP8 goal (chat 2026-05-15):
> "Pronunciation Granularity — deepen pronunciation feedback."

User-approved scope decisions during this brainstorm:
- Phoneme-level heat map UI (not error tracking, not practice-this-sound CTA, not variable-speed audio)
- Layout: per-word card stack with phoneme cells inside
- Tap action: reveal a popover with hint + mouth-shape diagram + sample audio
- Implementation: new `PhonemeHeatMap` component, delete old `PhonemeBreakdown`

## Decisions locked in brainstorming

| Decision | Choice | Reasoning |
|---|---|---|
| Slice | Phoneme-level heat map UI | Highest leverage — Azure already returns the data; we just surface it visually |
| Layout | Per-word card stack with phoneme cells inside | Most scannable on mobile + desktop; mirrors Azure's response structure |
| Tap action | Reveal popover (hint + PhonemeGuideCard) | Re-uses existing PHONEME_HINTS + PhonemeGuideCard; smaller surface than a routing-to-practice action |
| Strategy | New `PhonemeHeatMap` component; delete `PhonemeBreakdown` | Cleanest model — the old toggle-collapsed component was a half-built version of the same thing |
| Visibility | Prominent by default (no toggle) | Whole point of SP8 — make granular data primary |

## Architecture

A new `PhonemeHeatMap` component renders the Azure pronunciation result as a stack of per-word cards. Each card shows the word + its word-level score header, with a row of large color-coded phoneme cells beneath. Tapping any cell reveals a popover with mouth-shape diagram, common-mistake tip, and sample-word audio — pulled from the existing `PHONEME_GUIDES` / `PHONEME_HINTS` datasets that already power `PhonemeGuideCard`. The old `PhonemeBreakdown.tsx` (currently a collapsed toggle inside `AzureResultPanel`) is deleted and replaced by `PhonemeHeatMap` rendered prominently.

```
[Azure /api/pronunciation-assess response]
  { overall, word_scores: [{ word, score, phonemes: [{ phoneme, score }] }] }
                                │
                                ▼
[AzureResultPanel]
  Header row: overall score + emoji + label
  Sub-scores: accuracy / fluency / completeness / prosody
                                │
                                ▼
  <PhonemeHeatMap wordScores={azureResult.word_scores} />   ← new
                                │
                                └── for each word:
                                      <WordHeatCard>
                                        word + word-score header
                                        ──────────────────────
                                        [phoneme cell] [cell] [cell] ...
                                      </WordHeatCard>
                                          │
                                          └── on tap:
                                              <PhonemePopover>
                                                hint text
                                                mouth-shape diagram (if available)
                                                sample-word audio button
                                              </PhonemePopover>
```

### Key invariants

- `PhonemeHeatMap` is **pure presentational** — no fetching, no localStorage writes, no Azure calls. Takes `wordScores` as a prop.
- Renders **always-visible** by default (no toggle).
- Reuses existing `scoreColor()` from `pronunciationUtils.js` for tri-level coloring (red/yellow/green by score).
- Reuses existing `PHONEME_HINTS` and `PHONEME_GUIDES` constants — no new data authoring needed.
- The popover follows the SP6 `DiffSpan` pattern: outside-click and Escape dismiss; keyboard-accessible (`role="button"`, `tabIndex={0}`, Enter/Space activate).
- `PhonemeBreakdown.tsx` is deleted in the same PR sequence that adds `PhonemeHeatMap` — no two-component overlap.

### Why per-word card stack works on both mobile and desktop

- Each card is a fixed-width block on mobile (full-width) and naturally wraps in a horizontal flex container on desktop.
- Phoneme cells inside a card flex-wrap so long words don't overflow horizontally.
- Hit targets stay ≥ 44×44 px per WCAG 2.5.5.

## Component shape

Three new components in one folder (`src/components/shared/`). Inline styles (codebase convention).

### `PhonemeHeatMap.tsx`

```tsx
import React from 'react';
import { WordHeatCard, type WordScore } from './WordHeatCard';

export interface PhonemeHeatMapProps {
  wordScores: WordScore[];
}

const STYLES = {
  wrapper: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: 10,
    marginTop: 12,
  },
};

export default function PhonemeHeatMap({ wordScores }: PhonemeHeatMapProps): React.ReactElement | null {
  if (!wordScores || wordScores.length === 0) return null;
  return (
    <div data-testid="phoneme-heat-map" style={STYLES.wrapper}>
      {wordScores.map((w, i) => (
        <WordHeatCard key={`${w.word ?? 'word'}-${i}`} wordScore={w} />
      ))}
    </div>
  );
}
```

### `WordHeatCard.tsx`

```tsx
import React from 'react';
import { scoreColor } from './pronunciationUtils.js';
import { PhonemeCell } from './PhonemeCell';

export interface PhonemePoint {
  phoneme: string;
  score: number;
}

export interface WordScore {
  word?: string;
  score: number;
  phonemes?: PhonemePoint[];
}

export interface WordHeatCardProps {
  wordScore: WordScore;
}

// STYLES: card with header (word title + word-score badge), phoneme cell row beneath.
// Falls back to "No phoneme data" text when phonemes is empty.
export function WordHeatCard({ wordScore }: WordHeatCardProps): React.ReactElement;
```

Header has word title (left, bold) + score badge (right, color-coded by `scoreColor()`). Below header, a flex-wrap row of `PhonemeCell` elements. If no phonemes available, an italic "No phoneme data for this word." note replaces the row.

### `PhonemeCell.tsx`

The interactive cell — tappable, reveals popover. Mirrors SP6's `DiffSpan` interaction pattern.

```tsx
export interface PhonemeCellProps {
  phoneme: string;
  score: number;
}

export function PhonemeCell({ phoneme, score }: PhonemeCellProps): React.ReactElement;
```

Cell renders:
- Phoneme symbol (top, bold, 13px)
- Score percentage (bottom, 10px, 85% opacity)
- Background `${scoreColor(score)}1f` + border `1.5px solid ${scoreColor(score)}66`
- `role="button"`, `tabIndex={0}`, `aria-label` describing phoneme + score
- Minimum 44×44 px hit target
- `data-testid="phoneme-cell"` and `data-phoneme` for test selection

On tap (or Enter/Space when focused): toggles a popover anchored below the cell, containing:
- The `PHONEME_HINTS[phoneme]` text (if available)
- The existing `<PhonemeGuideCard phoneme={phoneme}/>` (mouth shape + sample audio if available for this phoneme)

Popover dismisses on outside-click and Escape, mirroring SP6's pattern.

When a phoneme has neither hint nor guide, popover renders an effectively empty body — graceful degradation; the visual score is still informative.

## AzureResultPanel integration

`AzureResultPanel` today renders (top-to-bottom): header (overall score), word chips with inline collapsed `PhonemeBreakdown` toggles, worst-phoneme tip, retry button.

SP8 changes:
- Add `import PhonemeHeatMap from './PhonemeHeatMap';` at the top
- Remove the existing `import PhonemeBreakdown from './PhonemeBreakdown';`
- Delete every inline `<PhonemeBreakdown phonemes={...} />` usage (currently nested inside word-chip expand views)
- The word chips at #2 stay as the at-a-glance summary, but their expand-on-tap state and JSX for the inline breakdown is removed; the chips become read-only score indicators
- The worst-phoneme tip at #3 stays — it complements the heat map (points the learner at the priority sound; the heat map shows the full picture)
- Mount `<PhonemeHeatMap wordScores={azureResult.word_scores} />` immediately after the worst-phoneme tip, before the retry button:

```tsx
{azureResult.word_scores && azureResult.word_scores.length > 0 && (
  <PhonemeHeatMap wordScores={azureResult.word_scores} />
)}
```

### PhonemeBreakdown removal

- Delete `src/components/shared/PhonemeBreakdown.tsx`
- `grep -rn "PhonemeBreakdown" src/` must return zero matches after the migration
- Any test file targeting `PhonemeBreakdown` is deleted; the heat-map tests cover the same behavior

### PronunciationScorer is untouched

`PronunciationScorer` (the parent that calls Azure and renders `AzureResultPanel`) already passes `azureResult` to `AzureResultPanel`. The new heat map reads `azureResult.word_scores` from that same object. Zero changes to `PronunciationScorer`.

### Backward-compatibility

If an Azure response arrives without `word_scores`, or with entries missing the `phonemes` array (degraded response, or Web Speech result piped through by mistake), `PhonemeHeatMap` returns `null` and `WordHeatCard` shows the fallback text. No crash, no empty container, no error UI.

## File summary

**Created:**
- `src/components/shared/PhonemeHeatMap.tsx` — wrapper, renders one WordHeatCard per wordScore
- `src/components/shared/WordHeatCard.tsx` — per-word card with score header + phoneme cell row
- `src/components/shared/PhonemeCell.tsx` — tappable cell with popover state
- `src/tests/phonemeCell.test.tsx` — 5 component tests
- `src/tests/wordHeatCard.test.tsx` — 4 component tests
- `src/tests/phonemeHeatMap.test.tsx` — 4 component tests
- `src/tests/azureResultPanel.heatmap.test.tsx` — 3 integration tests
- `e2e/sp8-phoneme-heatmap.spec.js` — 1 Playwright e2e

**Modified:**
- `src/components/shared/AzureResultPanel.tsx` — swap PhonemeBreakdown imports + usages for PhonemeHeatMap

**Deleted:**
- `src/components/shared/PhonemeBreakdown.tsx` — superseded by PhonemeHeatMap
- Any test file specifically targeting PhonemeBreakdown (if it exists)

## Testing strategy

### Layer 1 — `PhonemeCell` component tests (5 tests)

`src/tests/phonemeCell.test.tsx`:
- Renders phoneme symbol + score% with `role="button"` and `tabIndex=0`
- Tap on cell opens the popover; second tap closes it
- Escape key dismisses an open popover
- Outside-click dismisses an open popover
- Cell with no `PHONEME_HINTS` entry still renders (graceful degradation)

### Layer 2 — `WordHeatCard` component tests (4 tests)

`src/tests/wordHeatCard.test.tsx`:
- Renders the word title + word-score badge + a `PhonemeCell` per phoneme
- Falls back to "No phoneme data" text when `phonemes` is empty/missing
- Word-score badge uses `scoreColor()` coloring (red/yellow/green by tier)
- `data-word` attribute is set to the spoken word for test selection

### Layer 3 — `PhonemeHeatMap` component tests (4 tests)

`src/tests/phonemeHeatMap.test.tsx`:
- Renders one `WordHeatCard` per entry in `wordScores`
- Renders null when `wordScores` is empty or undefined
- Renders the root with `data-testid="phoneme-heat-map"`
- Each `WordHeatCard` receives the corresponding `wordScore` object

### Layer 4 — `AzureResultPanel` integration test (3 tests)

`src/tests/azureResultPanel.heatmap.test.tsx`:
- When `azureResult.word_scores` has entries, renders `<PhonemeHeatMap>`
- When `word_scores` is empty/missing, no heat map renders (no crash)
- Existing header/score sections still render alongside the heat map (no regression)

### Layer 5 — Cross-browser e2e (Playwright)

`e2e/sp8-phoneme-heatmap.spec.js` — 1 happy-path test:
- After a scored pronunciation, the heat map renders with phoneme cells; tapping a cell shows the popover

Uses stable testids (`phoneme-heat-map`, `phoneme-cell`, `word-heat-card`) — no role+regex matching.

## Acceptance gates

| Gate | Pass condition | Evidence |
|---|---|---|
| 1. PhonemeCell behavior | All 5 cell tests green | `phonemeCell.test.tsx` |
| 2. WordHeatCard behavior | All 4 word-card tests green | `wordHeatCard.test.tsx` |
| 3. PhonemeHeatMap behavior | All 4 heat map tests green | `phonemeHeatMap.test.tsx` |
| 4. AzureResultPanel integration | All 3 integration tests green; existing AzureResultPanel tests pass unchanged | `azureResultPanel.heatmap.test.tsx` |
| 5. PhonemeBreakdown removed | `grep -rn "PhonemeBreakdown" src/` returns zero matches | static grep after deletion |
| 6. Accessibility | Each cell has `role="button"`, `tabIndex={0}`, an `aria-label` describing phoneme + score; popover dismissible by Escape and outside-click | unit + e2e tests |
| 7. Mobile tap target | Each PhonemeCell has hit area ≥ 44×44 px (WCAG 2.5.5) — `minWidth: 44, minHeight: 44` on the cell style | CSS check |
| 8. Cross-browser e2e | Playwright spec passes on Desktop Chrome (stable testid selectors) | CI |
| 9. No regression | Existing `PronunciationScorer` + `AzureResultPanel` tests pass unchanged | full vitest suite |
| 10. Bundle size | Three new files (PhonemeHeatMap + WordHeatCard + PhonemeCell) add < 4 KB minified | `npm run build` size diff |

## Out of scope for SP8

- Practice-this-sound CTA inside the popover. SP8b.
- Pronunciation error tracking → SP5 user-context integration. SP8c.
- Pronunciation history dashboard. SP8d.
- Variable-speed native audio playback. SP8e.
- Minimal-pair drill generator. SP8f.
- Refactoring `PronunciationScorer` itself (dual-mode plumbing is fine).
- Touching `WebSpeechResultPanel` — Web Speech doesn't return per-phoneme data, so it has no heat map to render.

## Follow-up slices to track

- **SP8b:** add a "Practice this sound →" button inside the cell popover that launches `PhonemePracticeScreen` pre-filtered to the tapped phoneme
- **SP8c:** new `nh_pronunciation_errors` localStorage layer (mirror of SP5's `nh_recent_errors`), with extension to the SP5 user-context schema and renderer prose
- **SP8d:** Pronunciation history dashboard showing weakness trends per phoneme
- **SP8e:** Variable-speed native audio (0.5x / 0.75x / 1x / 1.25x toggle on TTS playback)
- **SP8f:** Auto-generated minimal-pair drills for confusable Croatian sounds (ć vs č, đ vs dž, e vs i)
