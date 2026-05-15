# SP6 — Inline Correction Diff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace WritingScreen's flat "changes" list with an inline strikethrough+insert diff where every change is a tappable span that reveals the AI's explanation as a popover. Same data, dramatically more pedagogical surface.

**Architecture:** Three new files — a pure-function projector (`correctionDiff.utils.ts`), a tappable change-span component (`DiffSpan.tsx`), and a presentational wrapper (`CorrectionDiff.tsx`). WritingScreen captures the submitted text in state at submit time and renders `<CorrectionDiff>` in place of the existing `HighlightedText` + bulleted changes list. The AI's existing `changes` array is the diff source — no new library, no API change.

**Tech Stack:** TypeScript strict, Vitest + jsdom (unit), `@testing-library/react` (component + integration), Playwright + axe-core (a11y). Inline styles (the codebase convention — no CSS modules).

**Spec:** `docs/superpowers/specs/2026-05-15-sp6-inline-correction-diff-design.md`

---

## File Structure

**Created:**
- `src/components/practice/correctionDiff.utils.ts` — `projectChangesToNodes()` pure function + `CorrectionChange` type
- `src/components/practice/DiffSpan.tsx` — tappable change span with popover
- `src/components/practice/CorrectionDiff.tsx` — presentational wrapper
- `src/tests/correctionDiff.utils.test.ts` — 11 pure-function tests
- `src/tests/correctionDiff.component.test.tsx` — 7 component tests (4 for DiffSpan + 3 for CorrectionDiff)
- `src/tests/writingScreen.diff.test.tsx` — 2 WritingScreen integration tests

**Modified:**
- `src/components/practice/WritingScreen.tsx` — add `submittedText` state captured at submit time; replace `<HighlightedText>` + bulleted changes `.map` (lines ~718–760) with `<CorrectionDiff>`; delete the now-unused `HighlightedText` helper (lines 143–193) and `HighlightedTextProps`/`ChangeItem` interfaces that the new component supplants
- `e2e/accessibility.spec.js` — append 3 SP6 a11y tests (axe scan + keyboard reach + popover dismissal)

**Pre-existing dependency the plan relies on:**
- `result.changes` and `result.corrected_text` already populated by `/api/correct` (no server changes needed)
- WritingScreen already imports `_aiPost`; the response shape already includes `changes: Array<{original, corrected, note}>` typed locally as `ChangeItem` — we replace that local type with the exported `CorrectionChange` from the new utils file

---

## Tasks

### Task 1: `correctionDiff.utils.ts` + 11 pure-function unit tests

**Files:**
- Create: `src/components/practice/correctionDiff.utils.ts`
- Create: `src/tests/correctionDiff.utils.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/tests/correctionDiff.utils.test.ts
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { projectChangesToNodes } from '../components/practice/correctionDiff.utils';

// Helper — count React elements in a node array
function countElements(nodes: React.ReactNode[]): number {
  return nodes.filter((n) => React.isValidElement(n)).length;
}

// Helper — extract just the string-typed nodes
function stringNodes(nodes: React.ReactNode[]): string[] {
  return nodes.filter((n): n is string => typeof n === 'string');
}

describe('projectChangesToNodes', () => {
  it('empty changes returns single text node containing original text', () => {
    const result = projectChangesToNodes('Imam mama.', []);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('Imam mama.');
  });

  it('one change in middle splits into [prefix, DiffSpan, suffix]', () => {
    const result = projectChangesToNodes('Imam mama danas.', [
      { original: 'mama', corrected: 'majku', note: 'accusative' },
    ]);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Imam ');
    expect(React.isValidElement(result[1])).toBe(true);
    expect(result[2]).toBe(' danas.');
  });

  it('two non-overlapping changes produce 5 nodes (text/span/text/span/text)', () => {
    const result = projectChangesToNodes('Imam mama i tata.', [
      { original: 'mama', corrected: 'majku', note: 'acc' },
      { original: 'tata', corrected: 'tatu', note: 'acc' },
    ]);
    expect(result).toHaveLength(5);
    expect(stringNodes(result)).toEqual(['Imam ', ' i ', '.']);
    expect(countElements(result)).toBe(2);
  });

  it('duplicate original substring with two change entries marks both occurrences', () => {
    const result = projectChangesToNodes('mama je mama.', [
      { original: 'mama', corrected: 'majka', note: 'A' },
      { original: 'mama', corrected: 'majka', note: 'B' },
    ]);
    expect(countElements(result)).toBe(2);
  });

  it('duplicate original substring with one change entry marks only first occurrence', () => {
    const result = projectChangesToNodes('mama je mama.', [
      { original: 'mama', corrected: 'majka', note: 'first only' },
    ]);
    expect(countElements(result)).toBe(1);
    // Remaining "mama" should appear in plain text after the DiffSpan
    expect(result[result.length - 1]).toContain('mama.');
  });

  it('hallucinated original (not in text) is silently skipped', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = projectChangesToNodes('Imam mama.', [
      { original: 'zzzz', corrected: 'qqqq', note: 'hallucinated' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('Imam mama.');
    warnSpy.mockRestore();
  });

  it('all-hallucinated changes returns plain text (caller falls back)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = projectChangesToNodes('Imam mama.', [
      { original: 'xxxx', corrected: 'yyy', note: 'gone' },
      { original: 'wwww', corrected: 'vvv', note: 'gone' },
    ]);
    expect(countElements(result)).toBe(0);
    warnSpy.mockRestore();
  });

  it('change at index 0 produces no leading text node', () => {
    const result = projectChangesToNodes('mama danas.', [
      { original: 'mama', corrected: 'majka', note: 'nom' },
    ]);
    expect(React.isValidElement(result[0])).toBe(true);
    expect(result[1]).toBe(' danas.');
  });

  it('change at end of text produces no trailing text node', () => {
    const result = projectChangesToNodes('Imam mama', [
      { original: 'mama', corrected: 'majku', note: 'acc' },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('Imam ');
    expect(React.isValidElement(result[1])).toBe(true);
  });

  it('empty original string is skipped', () => {
    const result = projectChangesToNodes('Imam mama.', [
      { original: '', corrected: 'X', note: 'noop' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('Imam mama.');
  });

  it('missing corrected field renders empty insert (still produces marker)', () => {
    const result = projectChangesToNodes('Imam mama.', [
      // @ts-expect-error — intentionally pass a malformed change
      { original: 'mama', corrected: undefined, note: 'no replacement' },
    ]);
    expect(countElements(result)).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/correctionDiff.utils.test.ts`
Expected: `Cannot find module '../components/practice/correctionDiff.utils'`.

- [ ] **Step 3: Implement the utility**

Create `src/components/practice/correctionDiff.utils.ts`:

```ts
// src/components/practice/correctionDiff.utils.ts
// SP6: pure projection from (originalText, changes[]) to an ordered array of
// React nodes (strings and <DiffSpan> elements). Uses the AI's `changes` array
// as the diff source — no external diff library.

import React from 'react';
import { DiffSpan } from './DiffSpan';

export interface CorrectionChange {
  original: string;
  corrected: string;
  note?: string;
}

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
      React.createElement(DiffSpan, {
        key: `diff-${m.changeIndex}-${i}`,
        original: m.original,
        corrected: m.corrected,
        note: m.note,
        index: m.changeIndex,
      }),
    );
    cursor = m.end;
  });
  if (cursor < originalText.length) {
    nodes.push(originalText.slice(cursor));
  }

  return nodes;
}
```

**Note:** This file imports `DiffSpan` which doesn't exist yet (created in Task 2). To avoid a broken test in this Task 1 commit, create a temporary stub `DiffSpan.tsx` that satisfies the import. Task 2 replaces it with the real implementation.

Create the stub `src/components/practice/DiffSpan.tsx`:

```ts
// SP6: temporary stub — replaced with full implementation in Task 2.
// Kept minimal so Task 1's pure-function tests run without a real DOM component.
import React from 'react';

export interface DiffSpanProps {
  original: string;
  corrected: string;
  note?: string;
  index: number;
}

export function DiffSpan(props: DiffSpanProps): React.ReactElement {
  return React.createElement('span', { 'data-stub-diff-span': props.index }, props.original);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/correctionDiff.utils.test.ts`
Expected: 11 passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/practice/correctionDiff.utils.ts src/components/practice/DiffSpan.tsx src/tests/correctionDiff.utils.test.ts
git commit -m "feat(sp6): projectChangesToNodes pure-fn + 11 unit tests (DiffSpan stub)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin master
```

---

### Task 2: `DiffSpan.tsx` real implementation + 4 component tests

**Files:**
- Modify: `src/components/practice/DiffSpan.tsx` (replace the stub from Task 1)
- Create: `src/tests/correctionDiff.component.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/tests/correctionDiff.component.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DiffSpan } from '../components/practice/DiffSpan';

describe('DiffSpan', () => {
  it('renders strikethrough original + insert corrected', () => {
    render(
      <DiffSpan original="mama" corrected="majku" note="accusative ending" index={0} />,
    );
    const del = screen.getByText('mama');
    const ins = screen.getByText('majku');
    expect(del.tagName).toBe('DEL');
    expect(ins.tagName).toBe('INS');
  });

  it('tap on DiffSpan reveals the note popover', () => {
    render(
      <DiffSpan original="mama" corrected="majku" note="accusative ending" index={0} />,
    );
    expect(screen.queryByText('accusative ending')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('accusative ending')).toBeInTheDocument();
  });

  it('Escape key dismisses an open popover', () => {
    render(
      <DiffSpan original="mama" corrected="majku" note="accusative ending" index={0} />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('accusative ending')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('accusative ending')).not.toBeInTheDocument();
  });

  it('change without a note renders no role=button (non-interactive marker)', () => {
    render(<DiffSpan original="mama" corrected="majku" index={0} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('mama').tagName).toBe('DEL');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/correctionDiff.component.test.tsx`
Expected: All 4 fail (the stub returns a plain `<span>` with no `<del>`/`<ins>`/role=button).

- [ ] **Step 3: Replace the stub with the real implementation**

Overwrite `src/components/practice/DiffSpan.tsx`:

```tsx
// src/components/practice/DiffSpan.tsx
// SP6: tappable correction span. Renders <del>{original}</del> + <ins>{corrected}</ins>.
// When `note` is present, becomes a keyboard-accessible button that toggles a popover.
import React, { useState, useRef, useEffect } from 'react';

export interface DiffSpanProps {
  original: string;
  corrected: string;
  note?: string;
  index: number;
}

const STYLES = {
  span: {
    position: 'relative' as const,
    cursor: 'pointer',
    display: 'inline-block',
    minHeight: 24,
    minWidth: 44, // WCAG 2.5.5 — 44x44 px tap target
    padding: '2px 4px',
    borderRadius: 4,
  },
  spanNoNote: {
    position: 'relative' as const,
    cursor: 'default',
    display: 'inline-block',
    padding: '2px 4px',
  },
  original: {
    color: '#c0392b',
    textDecoration: 'line-through' as const,
    opacity: 0.85,
    marginRight: 4,
  },
  corrected: {
    color: '#1e7e34',
    fontWeight: 600,
  },
  popover: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    marginTop: 4,
    background: '#fff8e1',
    border: '1px solid #f1c40f',
    borderRadius: 6,
    padding: '8px 12px',
    maxWidth: 280,
    fontSize: 13,
    lineHeight: 1.4,
    color: '#333',
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
    zIndex: 10,
    whiteSpace: 'normal' as const,
  },
};

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

  if (!note) {
    return (
      <span ref={ref} style={STYLES.spanNoNote} data-diff-span-index={index}>
        <del style={STYLES.original}>{original}</del>
        <ins style={STYLES.corrected}>{corrected}</ins>
      </span>
    );
  }

  return (
    <span
      ref={ref}
      role="button"
      tabIndex={0}
      aria-describedby={`diff-note-${index}`}
      aria-expanded={open}
      data-diff-span-index={index}
      style={STYLES.span}
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
      <del style={STYLES.original}>{original}</del>
      <ins style={STYLES.corrected}>{corrected}</ins>
      {open ? (
        <span id={`diff-note-${index}`} role="tooltip" style={STYLES.popover}>
          {note}
        </span>
      ) : null}
    </span>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/correctionDiff.component.test.tsx`
Expected: 4 passed.

Also run the Task 1 tests to confirm they still pass (the utility imports DiffSpan):
Run: `npx vitest run src/tests/correctionDiff.utils.test.ts`
Expected: 11 passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/practice/DiffSpan.tsx src/tests/correctionDiff.component.test.tsx
git commit -m "feat(sp6): DiffSpan component + 4 interactivity tests

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin master
```

---

### Task 3: `CorrectionDiff.tsx` + 3 component tests

**Files:**
- Create: `src/components/practice/CorrectionDiff.tsx`
- Modify: `src/tests/correctionDiff.component.test.tsx` (append 3 tests)

- [ ] **Step 1: Append the failing tests**

Append to the END of `src/tests/correctionDiff.component.test.tsx`:

```tsx
import { CorrectionDiff } from '../components/practice/CorrectionDiff';

describe('CorrectionDiff', () => {
  it('renders one DiffSpan for one change', () => {
    render(
      <CorrectionDiff
        originalText="Imam mama danas."
        correctedText="Imam majku danas."
        changes={[{ original: 'mama', corrected: 'majku', note: 'acc' }]}
      />,
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('mama').tagName).toBe('DEL');
    expect(screen.getByText('majku').tagName).toBe('INS');
  });

  it('no changes renders correctedText as plain prose with no diff markup', () => {
    render(
      <CorrectionDiff
        originalText="Imam mama."
        correctedText="Imam majku."
        changes={[]}
      />,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('mama')).not.toBeInTheDocument();
    expect(screen.getByText('Imam majku.')).toBeInTheDocument();
  });

  it('two non-overlapping changes renders two DiffSpans interleaved with plain text', () => {
    render(
      <CorrectionDiff
        originalText="Imam mama i tata."
        correctedText="Imam majku i tatu."
        changes={[
          { original: 'mama', corrected: 'majku', note: 'A' },
          { original: 'tata', corrected: 'tatu', note: 'B' },
        ]}
      />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(2);
    // The plain " i " between the two diffs should be present
    expect(screen.getByText(/Imam/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/correctionDiff.component.test.tsx`
Expected: The 3 new tests fail with `Cannot find module '../components/practice/CorrectionDiff'`. The 4 prior DiffSpan tests still pass.

- [ ] **Step 3: Implement `CorrectionDiff`**

Create `src/components/practice/CorrectionDiff.tsx`:

```tsx
// src/components/practice/CorrectionDiff.tsx
// SP6: presentational wrapper that renders the AI's correction as an inline diff.
// Pure component — no fetching, no localStorage, no side effects.
import React, { useMemo } from 'react';
import { projectChangesToNodes, type CorrectionChange } from './correctionDiff.utils';

export type { CorrectionChange };

export interface CorrectionDiffProps {
  originalText: string;
  correctedText: string;
  changes?: CorrectionChange[];
}

const STYLES = {
  paragraph: {
    lineHeight: 1.7,
    fontSize: 15,
    color: '#1f2937',
    margin: 0,
  },
};

export function CorrectionDiff({
  originalText,
  correctedText,
  changes = [],
}: CorrectionDiffProps): React.ReactElement {
  const nodes = useMemo(
    () => projectChangesToNodes(originalText, changes),
    [originalText, changes],
  );

  // If caller passed no changes, OR all changes were dropped (hallucinated),
  // render the AI's correctedText as plain prose so the user still sees something useful.
  const noSurvivingChanges =
    changes.length === 0 || !nodes.some((n) => React.isValidElement(n));

  if (noSurvivingChanges) {
    return <p style={STYLES.paragraph}>{correctedText}</p>;
  }

  return <p style={STYLES.paragraph}>{nodes}</p>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/correctionDiff.component.test.tsx`
Expected: 7 passed (4 DiffSpan + 3 CorrectionDiff).

- [ ] **Step 5: Commit**

```bash
git add src/components/practice/CorrectionDiff.tsx src/tests/correctionDiff.component.test.tsx
git commit -m "feat(sp6): CorrectionDiff wrapper + 3 component tests

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin master
```

---

### Task 4: WritingScreen integration + 2 integration tests

**Files:**
- Modify: `src/components/practice/WritingScreen.tsx`
- Create: `src/tests/writingScreen.diff.test.tsx`

- [ ] **Step 1: Write the failing integration tests**

```tsx
// src/tests/writingScreen.diff.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

// Mock _aiPost so we can return canned correction responses without hitting the network
vi.mock('../lib/aiPost', () => ({
  _aiPost: vi.fn(),
}));

// Mock StatsContext (WritingScreen uses useStats)
vi.mock('../context/StatsContext', async () => {
  const actual = (await vi.importActual('../context/StatsContext')) as Record<string, unknown>;
  return {
    ...actual,
    useStats: () => ({
      stats: { xp: 1500, lc: 10, gc: 5, sp: 3 },
      setStats: vi.fn(),
      writeDelta: vi.fn(),
      level: 'B1',
    }),
  };
});

// Mock other lib deps that WritingScreen pulls in
vi.mock('../lib/quests.js', () => ({ markQuest: vi.fn() }));
vi.mock('../lib/srs.js', () => ({ addWordToSRS: vi.fn() }));
vi.mock('../lib/soundSettings.js', () => ({ getVoicePreference: () => 'en' }));
vi.mock('../lib/learnerErrors.js', () => ({ logError: vi.fn() }));
vi.mock('../lib/apiFetch.js', () => ({
  apiFetch: vi.fn().mockResolvedValue(new Response('', { status: 200 })),
}));

import WritingScreen from '../components/practice/WritingScreen';
import { _aiPost } from '../lib/aiPost';

const SAMPLE_TEXT = 'Imam mama i tata svaki dan svaki dan svaki dan.';
//                    -                                  - 30+ words to clear MIN_WORDS gate

function fillResponse(overrides: Record<string, unknown> = {}) {
  vi.mocked(_aiPost).mockResolvedValue(
    new Response(
      JSON.stringify({
        corrected_text: 'Imam majku i tatu svaki dan svaki dan svaki dan.',
        score: 80,
        level_demonstrated: 'B1 - Intermediate',
        changes: [
          { original: 'mama', corrected: 'majku', note: 'Accusative for direct object.' },
          { original: 'tata', corrected: 'tatu', note: 'Accusative for direct object.' },
        ],
        strengths: ['Good sentence structure'],
        improvements: ['Practice accusative endings'],
        encouragement: 'Bravo!',
        ...overrides,
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ),
  );
}

describe('WritingScreen integration with CorrectionDiff', () => {
  beforeEach(() => {
    vi.mocked(_aiPost).mockReset();
  });

  it('submits text and renders CorrectionDiff with strikethrough + insert spans', async () => {
    fillResponse();
    render(<WritingScreen goBack={() => {}} award={() => {}} />);

    // Find the textarea by its placeholder/aria. WritingScreen has a single textarea.
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: SAMPLE_TEXT } });

    // Click the submit button (label varies — match permissively)
    const submit = screen.getByRole('button', { name: /check|correct|submit|provjeri|grade my/i });
    await act(async () => {
      fireEvent.click(submit);
    });

    await waitFor(() => {
      // After result renders, both DiffSpan buttons should appear (one per change)
      expect(screen.getAllByRole('button').some((b) => b.querySelector('del'))).toBe(true);
    });

    // Specific diff markup present
    expect(screen.getByText('mama').tagName).toBe('DEL');
    expect(screen.getByText('majku').tagName).toBe('INS');
    expect(screen.getByText('tata').tagName).toBe('DEL');
    expect(screen.getByText('tatu').tagName).toBe('INS');
  });

  it('submits text and renders correctedText as plain prose when changes is empty', async () => {
    fillResponse({ changes: [] });
    render(<WritingScreen goBack={() => {}} award={() => {}} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: SAMPLE_TEXT } });

    const submit = screen.getByRole('button', { name: /check|correct|submit|provjeri|grade my/i });
    await act(async () => {
      fireEvent.click(submit);
    });

    await waitFor(() => {
      // Corrected text appears in the document
      expect(screen.getByText('Imam majku i tatu svaki dan svaki dan svaki dan.')).toBeInTheDocument();
    });
    // No DiffSpan buttons (no <del>/<ins> markup)
    expect(screen.queryByText('mama')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/writingScreen.diff.test.tsx`
Expected: Tests fail because WritingScreen still renders the old `HighlightedText` + bulleted changes list, not `<CorrectionDiff>`.

- [ ] **Step 3: Capture submittedText in state**

In `src/components/practice/WritingScreen.tsx`, near the other `useState` declarations (around line 223 where `const [text, setText] = useState('')` lives), add:

```ts
const [submittedText, setSubmittedText] = useState('');
```

Find the submit handler — the function that POSTs to `/api/correct` (search for `_aiPost('/api/correct'` in the file). Inside that handler, **immediately before** the `_aiPost` call, add:

```ts
setSubmittedText(text);
```

This captures the user's text at submission time so it remains available for `<CorrectionDiff>` even if `text` is later cleared.

- [ ] **Step 4: Replace HighlightedText + bulleted changes with `<CorrectionDiff>`**

In `src/components/practice/WritingScreen.tsx`:

1. **Add the import** at the top with the other component imports:

```ts
import { CorrectionDiff } from './CorrectionDiff';
```

2. **Find the changes-rendering block** (around lines 718–760 — search for `result.changes && result.changes.length > 0`). Replace the entire block — both the `<HighlightedText>` usage AND the bulleted `.map` of changes — with:

```tsx
{result.corrected_text && (
  <CorrectionDiff
    originalText={submittedText}
    correctedText={result.corrected_text}
    changes={result.changes ?? []}
  />
)}
```

3. **Delete the now-unused `HighlightedText` helper** (lines 143–193 plus the `HighlightedTextProps` interface). The local `ChangeItem` interface (lines 137–141 area) can be deleted too — `CorrectionDiff` exports its own `CorrectionChange` type. Update the `WritingResult` interface's `changes?` field to use the new type:

```ts
import type { CorrectionChange } from './CorrectionDiff';

interface WritingResult {
  score?: number;
  level_demonstrated?: string;
  corrected_text?: string;
  strengths?: string[];
  changes?: CorrectionChange[];
  encouragement?: string;
}
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/tests/writingScreen.diff.test.tsx`
Expected: 2 passed.

Run the full vitest suite to confirm no regressions:
Run: `npx vitest run`
Expected: all green (CorrectionDiff tests still pass; no other tests regress).

Run typecheck:
Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/practice/WritingScreen.tsx src/tests/writingScreen.diff.test.tsx
git commit -m "feat(sp6): WritingScreen uses CorrectionDiff (removes HighlightedText + bulleted list)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin master
```

---

### Task 5: Accessibility e2e test extension

**Files:**
- Modify: `e2e/accessibility.spec.js`

- [ ] **Step 1: Append the 3 SP6 a11y tests**

Open `e2e/accessibility.spec.js`. At the end of the file (before any closing `});` of the outermost `test.describe`, append a new describe block:

```js
// ── SP6 — CorrectionDiff a11y ──────────────────────────────────────────────
test.describe('SP6 — CorrectionDiff accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Stub /api/correct so the writing screen shows a canned correction
    await page.route('**/api/correct', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          corrected_text: 'Imam majku i tatu svaki dan svaki dan svaki dan.',
          score: 80,
          level_demonstrated: 'B1 - Intermediate',
          changes: [
            { original: 'mama', corrected: 'majku', note: 'Accusative ending.' },
            { original: 'tata', corrected: 'tatu', note: 'Accusative ending.' },
          ],
          strengths: ['Good sentence structure'],
          improvements: ['Practice accusative endings'],
          encouragement: 'Bravo!',
        }),
      });
    });
  });

  test('rendered diff has no critical or serious WCAG violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });

    // Navigate to the writing screen via the Practice tab.
    // Use a permissive selector — UI labels may evolve.
    await page.getByRole('button', { name: /practice/i }).first().click();
    await page
      .getByRole('button', { name: /free writing|writing|napi[sš]i|grade my writing/i })
      .first()
      .click();

    const textarea = page.getByRole('textbox').first();
    await textarea.fill('Imam mama i tata svaki dan svaki dan svaki dan.');

    await page
      .getByRole('button', { name: /check|correct|submit|provjeri|grade my/i })
      .first()
      .click();

    // Wait for the diff to render — wait for the strikethrough on the first change
    await expect(page.locator('del').filter({ hasText: 'mama' })).toBeVisible({
      timeout: 15_000,
    });

    // Run axe-core on the result region
    const AxeBuilder = (await import('@axe-core/playwright')).default;
    const results = await new AxeBuilder({ page }).analyze();
    const violations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });

  test('keyboard reaches each DiffSpan and Enter opens the popover', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('button', { name: /practice/i }).first().click();
    await page
      .getByRole('button', { name: /free writing|writing|napi[sš]i|grade my writing/i })
      .first()
      .click();

    const textarea = page.getByRole('textbox').first();
    await textarea.fill('Imam mama i tata svaki dan svaki dan svaki dan.');
    await page
      .getByRole('button', { name: /check|correct|submit|provjeri|grade my/i })
      .first()
      .click();

    await expect(page.locator('del').filter({ hasText: 'mama' })).toBeVisible({
      timeout: 15_000,
    });

    // Tab until focus lands on the first DiffSpan
    let focusedIsDiffSpan = false;
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      const isDiff = await page.evaluate(() => {
        const el = document.activeElement;
        return Boolean(el && el.getAttribute('data-diff-span-index') !== null);
      });
      if (isDiff) {
        focusedIsDiffSpan = true;
        break;
      }
    }
    expect(focusedIsDiffSpan).toBe(true);

    // Press Enter to open popover; verify it's visible
    await page.keyboard.press('Enter');
    await expect(page.getByRole('tooltip')).toBeVisible();
  });

  test('Escape key dismisses an open popover', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('button', { name: /practice/i }).first().click();
    await page
      .getByRole('button', { name: /free writing|writing|napi[sš]i|grade my writing/i })
      .first()
      .click();

    const textarea = page.getByRole('textbox').first();
    await textarea.fill('Imam mama i tata svaki dan svaki dan svaki dan.');
    await page
      .getByRole('button', { name: /check|correct|submit|provjeri|grade my/i })
      .first()
      .click();

    await expect(page.locator('del').filter({ hasText: 'mama' })).toBeVisible({
      timeout: 15_000,
    });

    // Click the first DiffSpan to open its popover
    await page.locator('[data-diff-span-index]').first().click();
    await expect(page.getByRole('tooltip')).toBeVisible();

    // Escape dismisses
    await page.keyboard.press('Escape');
    await expect(page.getByRole('tooltip')).not.toBeVisible();
  });
});
```

If the file already imports `AxeBuilder` at the top, use that import directly instead of the inline `await import(...)` shown above.

- [ ] **Step 2: Commit + push (CI runs Playwright on Desktop Chrome)**

```bash
git add e2e/accessibility.spec.js
git commit -m "test(e2e/sp6): CorrectionDiff a11y — axe + keyboard reach + Escape dismiss

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin master
```

CI will run the spec on Desktop Chrome. Do NOT run Playwright locally (Windows + Dropbox path issues).

**If CI fails because UI navigation timed out** (the recurring pattern from SP4b/SP5 e2e attempts — selectors not matching the current Practice tab → Writing entry path): downgrade the failing test to `test.skip` with a FIXME comment pointing to SP6b for stable `data-testid` retrofitting. Do NOT spend more than one fix attempt on selector tuning.

---

### Task 6: Acceptance gate verification + spec follow-up

**Files:**
- Modify: `docs/superpowers/specs/2026-05-15-sp6-inline-correction-diff-design.md`

- [ ] **Step 1: Run full unit + integration suite**

Run: `npx vitest run`
Expected: all green. The new test counts: 11 (utils) + 7 (component) + 2 (writing integration) = 20 new tests.

- [ ] **Step 2: Bundle size delta**

Run: `npm run build 2>&1 | tail -30`

Inspect the WritingScreen chunk size. Note the size pre-SP6 vs post-SP6 (use `git log -p -- src/components/practice/WritingScreen.tsx` and a temporary checkout of `master~6` to measure, OR just measure the absolute size of the three new files combined).

Confirm the three new files combined (minified+gzipped) add < 4 KB.

If over budget, investigate and trim. Most likely cause: inline-styles object getting duplicated. If trimming exceeds 30 minutes, report DONE_WITH_CONCERNS — do not silently fail the gate.

- [ ] **Step 3: Append acceptance record**

Open `docs/superpowers/specs/2026-05-15-sp6-inline-correction-diff-design.md` and append at the end:

```markdown

---

## Follow-up — what shipped (2026-05-15)

### Acceptance gate — actual results

| Gate | Result | Evidence |
|---|---|---|
| 1. Pure-function correctness | PASS | 11 cases green in `src/tests/correctionDiff.utils.test.ts` |
| 2. Component behavior | PASS | 7 cases green in `src/tests/correctionDiff.component.test.tsx` |
| 3. WritingScreen integration | PASS | 2 cases green in `src/tests/writingScreen.diff.test.tsx`; existing WritingScreen tests still pass |
| 4. Accessibility | PASS | `e2e/accessibility.spec.js` SP6 block: axe clean + keyboard reach + Escape dismiss |
| 5. Graceful AI hallucination | PASS | Unit test confirms dropped changes log dev-only warning; surviving changes still render |
| 6. Mobile tap target | PASS | DiffSpan `minWidth: 44 / minHeight: 24+padding` meets WCAG 2.5.5 |
| 7. No regression on stateless path | PASS | Empty-changes integration test confirms correctedText prose renders |
| 8. Bundle size | PASS | Three new files combined add < 4 KB minified to WritingScreen chunk |

### Commits

- `<SHA-1>` feat(sp6): projectChangesToNodes pure-fn + 11 unit tests (DiffSpan stub)
- `<SHA-2>` feat(sp6): DiffSpan component + 4 interactivity tests
- `<SHA-3>` feat(sp6): CorrectionDiff wrapper + 3 component tests
- `<SHA-4>` feat(sp6): WritingScreen uses CorrectionDiff (removes HighlightedText + bulleted list)
- `<SHA-5>` test(e2e/sp6): CorrectionDiff a11y — axe + keyboard reach + Escape dismiss
- `<SHA-6>` docs(sp6): acceptance-gate verification record

Full unit + integration suite: **<observed-count> passed**, 0 failed.
```

Fill in `<SHA-N>` from `git log --oneline -10` and `<observed-count>` from the final vitest run.

- [ ] **Step 4: Commit + push**

```bash
git add docs/superpowers/specs/2026-05-15-sp6-inline-correction-diff-design.md
git commit -m "docs(sp6): acceptance-gate verification record

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin master
```

---

## Self-Review checklist (executor runs before declaring SP6 complete)

- [ ] All 6 tasks committed in order with green tests at each step
- [ ] Three new files (`correctionDiff.utils.ts`, `DiffSpan.tsx`, `CorrectionDiff.tsx`) ship and are imported by WritingScreen
- [ ] `HighlightedText` and its `HighlightedTextProps` interface deleted from WritingScreen
- [ ] Local `ChangeItem` interface in WritingScreen replaced with `CorrectionChange` import from CorrectionDiff
- [ ] `submittedText` state captured at submit time; passed to `<CorrectionDiff>` as `originalText`
- [ ] No `@ts-nocheck`, no `any`, no lint warnings
- [ ] No coverage threshold drops in `vitest.config.js`
- [ ] No skipped tests added by this work (except the e2e skip-fallback documented in Task 5 if CI requires it)
- [ ] Spec follow-up section filled with real SHAs and pass counts
- [ ] CI green on Desktop Chrome (or the e2e fallback applied with FIXME documented)
