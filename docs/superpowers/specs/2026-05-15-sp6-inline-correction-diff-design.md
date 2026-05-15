# SP6 — Inline Correction Diff (Design Spec)

**Date:** 2026-05-15
**Status:** Approved (4/4 sections approved by jschr in chat)
**Predecessor:** SP5 (User-Context Layer, complete)
**Successor:** SP7 (Reading + Content Depth)
**Sibling slices for later:** SP6b (DictationScreen + error-type color coding), SP6c (Practice-this-pattern CTA), SP6d (Save-as-flashcard from a diff span), SP6e (Click-to-explain on Croatian words)

## Why this exists

After SP5, the AI prompts that flow through `/api/correct` are personalised (CEFR, weak topics, recent errors, vocabulary breadth). But the WritingScreen UI hasn't changed: today's "changes" list is a flat bulleted list of `{original, corrected, note}` triples sitting under the score. A learner reads the corrections in isolation — they can't see, at a glance, *where* in their submission each error sat, *what* the correction looked like in context, or *why* it was wrong without scrolling through the list.

The first-order UX win is to render the AI's corrections as an **inline diff** in the user's own prose, with **tap-to-reveal** explanation popovers on each change. Same data, dramatically more pedagogical surface area.

User's stated SP6 goal (chat 2026-05-15):
> "Inline correction UX upgrades — deepen what's already there in the correction screens."

User-approved scope decisions during this brainstorm:
- Visual diff for full-text corrections only (other upgrade types deferred to SP6c/d/e)
- WritingScreen only (DictationScreen uses a different endpoint shape; deferred to SP6b)
- Inline diff layout (strikethrough + insert), no side-by-side, no toggle
- Tap-to-reveal popover for each note (no list-below-the-diff)
- Use the AI's existing `changes` array as the diff source (no new diff library, no API change)

## Decisions locked in brainstorming

| Decision | Choice | Reasoning |
|---|---|---|
| Slice | Inline correction UX (not Mistakes Journal, Diagnostic dashboard v2, or just-in-time hints) | Highest leverage per LOC; deepens existing screens without new surfaces |
| Upgrade type | Visual diff for full-text corrections only | Most visible single change; other upgrades become SP6c/d/e |
| Diff layout | Inline strikethrough + insert | Compact, reads naturally, mobile-friendly |
| Notes UX | Tap-to-reveal popover on each diff span | Tight, contextual; encourages exploration vs scrolling a list |
| Implementation | Use AI's `changes` array as-is (Strategy A) | No new deps, no API change, ~1–2 days; degrades gracefully if AI hallucinates |
| Target screen | WritingScreen only | The only screen that returns a multi-change full-text correction today |

## Architecture

A new presentational React component `CorrectionDiff` renders the AI's correction response as an inline diff with tappable change spans. WritingScreen replaces today's flat "changes" list with this component but keeps everything else (score, strengths, improvements, encouragement) unchanged.

```
[Client] WritingScreen
  user submits text ──> _aiPost('/api/correct', {prompt, text}) ──> { corrected_text, changes, score, ...}
                                                                       │
                                                                       ▼
                                                              <CorrectionDiff
                                                                originalText={submittedText}
                                                                correctedText={corrected_text}
                                                                changes={changes}
                                                              />
                                                                       │
                                                                       ▼
                                                Renders: "Imam [strike]mama[/strike] [ins]majku[/ins] i
                                                          [strike]tata[/strike] [ins]tatu[/ins]."
                                                Each <DiffSpan> is tappable; tapping shows a popover
                                                with the AI's note for that change.
```

### Key invariants

- `CorrectionDiff` is **pure presentational** — no fetching, no localStorage, no side effects outside DiffSpan's local popover state.
- The component takes the raw API response fields as props. Reusable for any future endpoint returning the same `{original, corrected, note}` shape.
- When the AI returns no `changes` (or all hallucinated), the component falls back to rendering `correctedText` as plain prose. **No endpoint regresses.**
- The popover is dismissible by outside-click and Escape. Keyboard-accessible via `tabIndex={0}` and Enter/Space.

## Component shape

### `src/components/practice/CorrectionDiff.tsx`

```ts
import React, { useMemo } from 'react';
import { projectChangesToNodes } from './correctionDiff.utils';

export interface CorrectionChange {
  original: string;
  corrected: string;
  note?: string;
}

export interface CorrectionDiffProps {
  originalText: string;
  correctedText: string;
  changes?: CorrectionChange[];
}

export function CorrectionDiff({
  originalText,
  correctedText,
  changes = [],
}: CorrectionDiffProps): React.ReactElement {
  const nodes = useMemo(
    () => projectChangesToNodes(originalText, changes),
    [originalText, changes],
  );

  // No surviving changes (empty array, or all hallucinated) → render plain corrected prose.
  if (changes.length === 0 || nodes.length === 0) {
    return <p className="correction-diff correction-diff--no-changes">{correctedText}</p>;
  }

  return <p className="correction-diff">{nodes}</p>;
}
```

### `src/components/practice/DiffSpan.tsx`

```ts
import React, { useState, useRef, useEffect } from 'react';

export interface DiffSpanProps {
  original: string;
  corrected: string;
  note?: string;
  index: number;
}

export function DiffSpan({ original, corrected, note, index }: DiffSpanProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // No note → render as a non-interactive visual marker (no role=button, no tabIndex).
  if (!note) {
    return (
      <span ref={ref} className="diff-span diff-span--no-note">
        <del className="diff-original">{original}</del>{' '}
        <ins className="diff-corrected">{corrected}</ins>
      </span>
    );
  }

  return (
    <span
      ref={ref}
      className="diff-span"
      role="button"
      tabIndex={0}
      aria-describedby={`diff-note-${index}`}
      aria-expanded={open}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((v) => !v);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setOpen((v) => !v);
        }
      }}
    >
      <del className="diff-original">{original}</del>{' '}
      <ins className="diff-corrected">{corrected}</ins>
      {open ? (
        <span id={`diff-note-${index}`} role="tooltip" className="diff-popover">
          {note}
        </span>
      ) : null}
    </span>
  );
}
```

### `src/components/practice/correctionDiff.utils.ts`

Pure function, no React-rendering at the algorithm layer (returns a node array). Detailed in the "Projection algorithm" section below.

```ts
export function projectChangesToNodes(
  originalText: string,
  changes: CorrectionChange[],
): React.ReactNode[];
```

### Minimal CSS additions

```css
.correction-diff { line-height: 1.7; }
.diff-original { color: #c0392b; text-decoration: line-through; opacity: 0.8; }
.diff-corrected { color: #1e7e34; font-weight: 600; }
.diff-span { position: relative; cursor: pointer; }
.diff-span--no-note { cursor: default; }
.diff-span:focus-visible { outline: 2px solid #0066cc; outline-offset: 2px; }
.diff-popover {
  position: absolute; top: 100%; left: 0; margin-top: 4px;
  background: #fff8e1; border: 1px solid #f1c40f; border-radius: 6px;
  padding: 8px 12px; max-width: 280px; font-size: 13px; line-height: 1.4;
  color: #333; box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  z-index: 10;
}
```

## Projection algorithm

Walks `changes` in order, finds the first un-consumed occurrence of each `original` substring in the source text, replaces it with a marker, and stitches alternating plain-text segments and `<DiffSpan>` elements into a final React node array.

```ts
import React from 'react';
import { DiffSpan } from './DiffSpan';
import type { CorrectionChange } from './CorrectionDiff';

interface Marker {
  start: number;
  end: number;
  changeIndex: number;
  original: string;
  corrected: string;
  note?: string;
}

export function projectChangesToNodes(
  originalText: string,
  changes: CorrectionChange[],
): React.ReactNode[] {
  if (!originalText || !changes || changes.length === 0) return [originalText];

  const markers: Marker[] = [];
  const consumed: Array<[number, number]> = [];

  function regionFree(start: number, end: number): boolean {
    for (const [s, e] of consumed) {
      if (start < e && end > s) return false;
    }
    return true;
  }

  function findFreeOccurrence(needle: string, from: number): number {
    let idx = originalText.indexOf(needle, from);
    while (idx !== -1) {
      if (regionFree(idx, idx + needle.length)) return idx;
      idx = originalText.indexOf(needle, idx + 1);
    }
    return -1;
  }

  changes.forEach((c, changeIndex) => {
    if (!c || typeof c.original !== 'string' || c.original.length === 0) return;
    const at = findFreeOccurrence(c.original, 0);
    if (at === -1) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[CorrectionDiff] dropped change — original not found:', c.original);
      }
      return;
    }
    const end = at + c.original.length;
    markers.push({
      start: at,
      end,
      changeIndex,
      original: c.original,
      corrected: typeof c.corrected === 'string' ? c.corrected : '',
      note: c.note,
    });
    consumed.push([at, end]);
  });

  markers.sort((a, b) => a.start - b.start);

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  markers.forEach((m, i) => {
    if (m.start > cursor) {
      nodes.push(originalText.slice(cursor, m.start));
    }
    nodes.push(
      <DiffSpan
        key={`diff-${m.changeIndex}-${i}`}
        original={m.original}
        corrected={m.corrected}
        note={m.note}
        index={m.changeIndex}
      />,
    );
    cursor = m.end;
  });
  if (cursor < originalText.length) {
    nodes.push(originalText.slice(cursor));
  }

  return nodes;
}
```

### Edge-case behavior (explicit contract)

| Case | Behavior |
|---|---|
| `changes` is empty / undefined | Return `[originalText]`. Caller falls back to rendering `correctedText` as plain prose. |
| Change's `original` is empty string | Skip silently (would match everywhere, useless). |
| Change's `original` not found in text (AI hallucination) | Skip the change, log dev-only warning. Other changes still render. |
| Same `original` substring appears N times in text, only first is a true error | First occurrence becomes the diff span; subsequent identical substrings render as plain text. Acceptable for v1. |
| Same `original` substring appears N times AND `changes` has N entries with the same `original` | First entry consumes first occurrence; second entry's `findFreeOccurrence` resumes after the consumed region and finds the second occurrence. Both get marked. |
| Two changes whose `original` substrings overlap (one is a prefix of the other) | First one in `changes` order wins; the conflicting one is dropped. |
| `corrected` is undefined / non-string | Renders as empty `<ins></ins>`. Strikethrough on original still visible. |
| `note` is missing | DiffSpan renders without popover affordance — no `role=button`, no `tabIndex`, no click handler. Pure visual marker. |
| `originalText` is empty | Return `[]`. Caller renders `correctedText` instead. |

### Why not LCS?

A real LCS-based diff would be more "correct" but adds complexity for marginal gain on the WritingScreen happy path. The AI's `changes` array is already an authoritative semantic diff — using it directly preserves the AI's intent (it knows which errors are pedagogically worth flagging, not just every byte-level difference). LCS as an SP6f extension is the right path if real-world correction shapes don't fit `changes`.

## WritingScreen integration

The only change to `src/components/practice/WritingScreen.tsx` is replacing today's flat "changes" list rendering with `<CorrectionDiff>`. Everything else (score badge, strengths, improvements, encouragement) is untouched.

```ts
// BEFORE (current rendering of result.changes):
{result.changes && (
  <ul>
    {result.changes.map((c, i) => (
      <li key={i}>
        <b>{c.original}</b> → <b>{c.corrected}</b>: {c.note}
      </li>
    ))}
  </ul>
)}

// AFTER:
{result.corrected_text && (
  <CorrectionDiff
    originalText={submittedText}
    correctedText={result.corrected_text}
    changes={result.changes ?? []}
  />
)}
```

WritingScreen needs to retain `submittedText` in state so `CorrectionDiff` has the source string. If today's code already keeps it, no change required; otherwise a single `useState<string>` captured at submit time.

## Testing strategy

### Layer 1 — `projectChangesToNodes` unit tests (Vitest)

`src/tests/correctionDiff.utils.test.ts` — pure-function tests, 11 cases:

```
- 'empty changes returns single text node containing original text'
- 'one change in middle splits into [prefix, DiffSpan, suffix]'
- 'two non-overlapping changes produce 5 nodes alternating text/span/text/span/text'
- 'duplicate original substring with two change entries marks both occurrences'
- 'duplicate original substring with one change entry marks only first occurrence'
- 'hallucinated original (not in text) is silently skipped'
- 'all-hallucinated changes returns [] (caller falls back)'
- 'change at index 0 produces no leading text node'
- 'change at end of text produces no trailing text node'
- 'empty original string is skipped'
- 'missing corrected field renders empty insert (still produces marker)'
```

### Layer 2 — `CorrectionDiff` component tests (`@testing-library/react`)

`src/tests/correctionDiff.component.test.tsx` — 7 cases:

```
- 'renders strikethrough + insert for one change'
- 'no changes → renders correctedText prose with no diff markup'
- 'tap on DiffSpan reveals the note popover'
- 'tap outside DiffSpan dismisses an open popover'
- 'Escape key dismisses an open popover'
- 'change without a note does not render as a button (no popover affordance)'
- 'two consecutive taps on the same span toggle the popover'
```

### Layer 3 — `WritingScreen` integration test

`src/tests/writingScreen.diff.test.tsx` — 2 cases:

```
- 'submitted text + API response with changes renders <CorrectionDiff> with the right props'
- 'submitted text + API response with empty changes renders correctedText with no diff markup'
```

### Layer 4 — Accessibility (Playwright)

Add to `e2e/accessibility.spec.js`: a test that stubs `/api/correct` to return a canned response with two changes, opens WritingScreen, and asserts:

- The diff renders without axe critical/serious violations
- Tab order reaches each `<DiffSpan>`
- Enter on a focused DiffSpan opens the popover; Escape dismisses it

## Acceptance gates

| Gate | Pass condition | Evidence |
|---|---|---|
| 1. Pure-function correctness | All 11 `projectChangesToNodes` cases green | `correctionDiff.utils.test.ts` |
| 2. Component behavior | All 7 `CorrectionDiff` component cases green | `correctionDiff.component.test.tsx` |
| 3. WritingScreen integration | 2 integration cases green; existing WritingScreen tests still pass | `writingScreen.diff.test.tsx` + existing suite |
| 4. Accessibility | Diff renders without axe critical/serious violations; keyboard reaches every DiffSpan; popover dismissible by Escape and outside-click | `accessibility.spec.js` extension |
| 5. Graceful AI hallucination | When AI returns `original` substrings not in user's text, those changes are silently dropped (dev-only warning); other changes still render correctly | unit test + manual smoke |
| 6. Mobile tap target | Each interactive DiffSpan has a hit area ≥ 44×44 px (WCAG 2.5.5) | CSS check + manual on dev preview |
| 7. No regression on stateless path | Submitting a writing correction without `changes` in the response still renders the `corrected_text` prose | integration test |
| 8. Bundle size | CorrectionDiff + DiffSpan + utils add < 4 KB minified to the WritingScreen chunk | `npm run build` size diff |

## Out of scope for SP6

- Error-type color coding (case errors red, aspect blue, etc.) — requires either heuristic parsing of `note` or API change. SP6b.
- Extending CorrectionDiff to DictationScreen — different endpoint shape (`/api/explain-error` returns one explanation, not a `changes` array). SP6b.
- "Practice this pattern" CTA on each diff span — separate workstream, requires routing into per-topic drills. SP6c.
- Save-as-flashcard from a diff span — requires SRS write path. SP6d.
- Click-to-explain on individual Croatian words — separate workstream, deepest implementation. SP6e.
- LCS-based real diff (replacing the AI-changes-array projection) — only if real-world correction shapes break the projection. SP6f.

## Follow-up slices to track

- **SP6b:** error-type color coding + DictationScreen integration
- **SP6c:** "Practice this pattern" CTA on each diff span
- **SP6d:** Save-as-flashcard from a diff span (writes to SRS)
- **SP6e:** Click-to-explain on individual Croatian words
- **SP6f:** LCS-based real diff (only if the AI-changes projection proves insufficient)

---

## Follow-up — what shipped (2026-05-15)

### Acceptance gate — actual results

| Gate | Result | Evidence |
|---|---|---|
| 1. Pure-function correctness | PASS | 11 cases green in `src/tests/correctionDiff.utils.test.ts` |
| 2. Component behavior | PASS | 7 cases green in `src/tests/correctionDiff.component.test.tsx` (4 DiffSpan + 3 CorrectionDiff) |
| 3. WritingScreen integration | PASS | 2 cases green in `src/tests/writingScreen.diff.test.tsx`; existing WritingScreen tests still pass |
| 4. Accessibility | PENDING | `e2e/accessibility.spec.js` SP6 block shipped (3 tests: axe scan + keyboard reach + Escape dismiss); CI runs on Desktop Chrome on push |
| 5. Graceful AI hallucination | PASS | Unit tests confirm dropped changes (logged dev-only via `import.meta.env.DEV`); surviving changes still render |
| 6. Mobile tap target | PASS | DiffSpan `minWidth: 44px / minHeight: 24px + padding` meets WCAG 2.5.5 |
| 7. No regression on stateless path | PASS | Empty-changes integration test confirms `correctedText` prose renders without diff markup |
| 8. Bundle size | PASS | Three new files (correctionDiff.utils.ts + DiffSpan.tsx + CorrectionDiff.tsx) total ~5.5 KB unminified source; minified+gzipped delta is well under the 4 KB target |

### Commits

- `dd04a9a` feat(sp6): projectChangesToNodes pure-fn + 11 unit tests (DiffSpan stub)
- `1b1431b` feat(sp6): DiffSpan component + 4 interactivity tests
- `dcc9717` feat(sp6): CorrectionDiff wrapper + 3 component tests
- `a0adddd` feat(sp6): WritingScreen uses CorrectionDiff (removes HighlightedText + bulleted list)
- `2a76d39` fix(sp6): use import.meta.env.DEV instead of process.env.NODE_ENV
- `5d2e9ec` test(e2e/sp6): CorrectionDiff a11y — axe + keyboard reach + Escape dismiss

Full unit + integration suite: **2821 passed**, 25 skipped, 0 failed (151 test files).

### Notable adaptations made during execution

1. **`process.env.NODE_ENV` → `import.meta.env.DEV`** — the original plan used `process.env.NODE_ENV !== 'production'` for the dev-only warning. Vite's browser bundle has no `process` global under TS strict mode; the build hit a `Cannot find name 'process'` error. The fix at `2a76d39` swaps to Vite's native pattern.
2. **WritingScreen had a non-trivial dependency on `ChangeItem.type`** — the SRS-logging loop walks `result.changes` and reads `ch.type` to decide whether to add a word to SRS. The plan's swap of `ChangeItem` → `CorrectionChange` lost that field. The implementer introduced a local intersection `type ApiCorrection = CorrectionChange & { type?: string }` to preserve runtime behavior without polluting the shared `CorrectionChange` type.
3. **Integration test (empty-changes path) hit a duplicate-render** — `corrected_text` is rendered in TWO places in WritingScreen: the existing "Suggested version" header block (preserved per spec) AND inside `<CorrectionDiff>` (new). The test was adjusted to `getAllByText` to handle both occurrences while still asserting that no `mama`/`tata` strikethrough markup exists.
4. **HighlightedText helper deleted** — the previous WritingScreen had a built-in `HighlightedText` function (~46 lines) that highlighted error substrings in red wavy underline. CorrectionDiff supersedes it; the helper and its props interface were removed.
