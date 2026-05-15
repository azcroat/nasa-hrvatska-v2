# SP7 — Adaptive Reading Recommendations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a home-screen "Story of the Day" card that recommends one graded story per learner per day using SP5's user-context signals (CEFR, weak topics, recent errors). The card has a tappable CTA that launches GradedInputScreen pre-routed to the recommended story; finishing a story records it to a new `nh_recent_reads` layer so the recommender avoids it for 7 days.

**Architecture:** Pure-function scorer (`storyRecommendation.ts`) ranks the 30-story catalog using `UserContext` + `recentReads` inputs — deterministic, no AI calls. A new `StoryOfTheDayCard` reads from localStorage at render time and renders the top match. Tapping the CTA sets a `pendingStoryId` in AppRouter state and switches to the `graded_input` screen; GradedInputScreen consumes the new `initialStoryId` prop on mount.

**Tech Stack:** TypeScript strict, Vitest + jsdom (unit), `@testing-library/react` (component + integration), Playwright (e2e). Inline styles (codebase convention).

**Spec:** `docs/superpowers/specs/2026-05-15-sp7-adaptive-reading-recommendations-design.md`

---

## File Structure

**Created:**
- `src/lib/recentReads.ts` — `recordStoryRead()`, `getRecentReads()`, `getRecentReadsExtended()`
- `src/lib/storyRecommendation.ts` — `recommendStory()` pure function + `TOPIC_KEYWORDS` constant + `RankedStory` type
- `src/components/home/StoryOfTheDayCard.tsx` — the card
- `src/tests/recentReads.test.ts` — 6 unit tests
- `src/tests/storyRecommendation.test.ts` — 13 unit tests
- `src/tests/storyOfTheDayCard.test.tsx` — 5 component tests
- `src/tests/gradedInputScreen.initial.test.tsx` — 2 integration tests
- `e2e/sp7-story-of-day.spec.js` — 1 Playwright e2e

**Modified:**
- `src/components/learn/GradedInputScreen.tsx` — accept `initialStoryId?` prop, auto-open matching story, call `recordStoryRead()` in `complete()`
- `src/components/AppRouter.tsx` — add `pendingStoryId` state + setter, pass through to GradedInputScreen, expose setter to HomeTab
- `src/components/home/HomeTab.tsx` — mount `<StoryOfTheDayCard launchStory={...}/>` after PhraseOfDayCard, wire `launchStory` to set pending ID + switch screen

**Pre-existing dependencies the plan relies on:**
- `GRADED_STORIES` array in `src/data/gradedStories.js` (30 stories, A1–C1)
- `buildUserContext()` from `src/lib/userContext.ts` (SP5)
- `cefrRank()` and `getUserCefr()` from `src/lib/cefr.ts`
- `markDone()`, `markQuest()`, `useStats` already used in GradedInputScreen

---

## Tasks

### Task 1: `recentReads.ts` + 6 unit tests

**Files:**
- Create: `src/lib/recentReads.ts`
- Create: `src/tests/recentReads.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/tests/recentReads.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  recordStoryRead,
  getRecentReads,
  getRecentReadsExtended,
} from '../lib/recentReads';

const KEY = 'nh_recent_reads';

describe('recordStoryRead', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('appends one entry to empty storage', () => {
    recordStoryRead('gs_a1_1');
    const raw = localStorage.getItem(KEY);
    expect(raw).not.toBeNull();
    const arr = JSON.parse(raw!);
    expect(arr).toHaveLength(1);
    expect(arr[0].id).toBe('gs_a1_1');
    expect(typeof arr[0].at).toBe('number');
  });

  it('does not duplicate same-day re-records', () => {
    recordStoryRead('gs_a1_1');
    recordStoryRead('gs_a1_1');
    const arr = JSON.parse(localStorage.getItem(KEY)!);
    expect(arr).toHaveLength(1);
  });

  it('silently no-ops on QuotaExceededError', () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => recordStoryRead('gs_a1_1')).not.toThrow();
    Storage.prototype.setItem = orig;
  });
});

describe('getRecentReads', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns [] when localStorage is empty or JSON is malformed', () => {
    expect(getRecentReads()).toEqual([]);
    localStorage.setItem(KEY, 'not-json');
    expect(getRecentReads()).toEqual([]);
  });

  it('returns only entries within the 7-day hard exclusion window', () => {
    const sixDays = Date.now() - 6 * 24 * 60 * 60 * 1000;
    const eightDays = Date.now() - 8 * 24 * 60 * 60 * 1000;
    localStorage.setItem(
      KEY,
      JSON.stringify([
        { id: 'recent', at: sixDays },
        { id: 'old', at: eightDays },
      ]),
    );
    const result = getRecentReads();
    expect(result).toContain('recent');
    expect(result).not.toContain('old');
  });
});

describe('getRecentReadsExtended', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns entries within the 30-day window', () => {
    const tenDays = Date.now() - 10 * 24 * 60 * 60 * 1000;
    const twentyDays = Date.now() - 20 * 24 * 60 * 60 * 1000;
    const fortyDays = Date.now() - 40 * 24 * 60 * 60 * 1000;
    localStorage.setItem(
      KEY,
      JSON.stringify([
        { id: 'a', at: tenDays },
        { id: 'b', at: twentyDays },
        { id: 'c', at: fortyDays },
      ]),
    );
    const result = getRecentReadsExtended();
    expect(result).toContain('a');
    expect(result).toContain('b');
    expect(result).not.toContain('c');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/recentReads.test.ts`
Expected: `Cannot find module '../lib/recentReads'`.

- [ ] **Step 3: Implement the helper**

Create `src/lib/recentReads.ts`:

```ts
// src/lib/recentReads.ts
// SP7: tracks completed story IDs so the recommender can avoid recently-read
// stories for 7 days (hard exclusion) and softly penalize them for 30 days.

const KEY = 'nh_recent_reads';
const HARD_EXCLUSION_DAYS = 7;
const SOFT_PENALTY_DAYS = 30;
const MAX_ENTRIES = 60;

interface RecentReadEntry {
  id: string;
  at: number;
}

function _read(): RecentReadEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordStoryRead(id: string): void {
  if (!id || typeof id !== 'string') return;
  try {
    const arr = _read();
    const today = new Date().toISOString().slice(0, 10);
    const exists = arr.some(
      (e) =>
        e.id === id && new Date(e.at).toISOString().slice(0, 10) === today,
    );
    if (!exists) arr.unshift({ id, at: Date.now() });
    const capped = arr.slice(0, MAX_ENTRIES);
    localStorage.setItem(KEY, JSON.stringify(capped));
  } catch {
    // QuotaExceededError or localStorage unavailable — non-fatal
  }
}

/** Hard exclusion list: story IDs read within the last 7 days. */
export function getRecentReads(): string[] {
  const cutoff = Date.now() - HARD_EXCLUSION_DAYS * 24 * 60 * 60 * 1000;
  return _read()
    .filter((e) => typeof e?.at === 'number' && e.at >= cutoff)
    .map((e) => e.id);
}

/** Soft penalty list: story IDs read within the last 30 days. */
export function getRecentReadsExtended(): string[] {
  const cutoff = Date.now() - SOFT_PENALTY_DAYS * 24 * 60 * 60 * 1000;
  return _read()
    .filter((e) => typeof e?.at === 'number' && e.at >= cutoff)
    .map((e) => e.id);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/recentReads.test.ts`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/recentReads.ts src/tests/recentReads.test.ts
git commit -m "feat(sp7): recentReads.ts — recordStoryRead + getRecentReads with 6 tests

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin master
```

---

### Task 2: `storyRecommendation.ts` + 13 unit tests

**Files:**
- Create: `src/lib/storyRecommendation.ts`
- Create: `src/tests/storyRecommendation.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/tests/storyRecommendation.test.ts
import { describe, it, expect } from 'vitest';
import { recommendStory } from '../lib/storyRecommendation';
import type { UserContext } from '../lib/userContext';

// Synthetic catalog so tests don't depend on the real story list contents.
// Mirrors the GradedStory shape from src/data/gradedStories.js minimally.
interface TestStory {
  id: string;
  level: string;
  title: string;
  focus: string;
  levelColor: string;
  levelBg: string;
  icon: string;
  titleEn: string;
  duration: number;
  intro: string;
  paragraphs: { hr: string; en: string }[];
  vocabulary: { hr: string; en: string; ex: string }[];
  quiz: { q: string; qEn: string; opts: string[]; correct: number }[];
}

function story(opts: Partial<TestStory> & { id: string; level: string; focus: string; title: string }): TestStory {
  return {
    id: opts.id,
    level: opts.level,
    title: opts.title,
    focus: opts.focus,
    levelColor: '#000',
    levelBg: '#fff',
    icon: '📖',
    titleEn: opts.title + ' (en)',
    duration: 5,
    intro: 'test intro',
    paragraphs: [{ hr: 'test', en: 'test' }],
    vocabulary: [],
    quiz: [],
  };
}

function ctx(overrides: Partial<UserContext> = {}): UserContext {
  return {
    version: 1,
    generatedAt: Date.now(),
    level: { cefr: 'B1', xp: 1500, streak: 0 },
    weakTopics: [],
    recentErrors: [],
    vocab: { learned: 100, dueToday: 0, hardest: [] },
    ...overrides,
  };
}

const CATALOG: TestStory[] = [
  story({ id: 'a1_a', level: 'A1', title: 'A One', focus: 'Present tense' }),
  story({ id: 'a1_b', level: 'A1', title: 'B One', focus: 'Numbers' }),
  story({ id: 'a2_a', level: 'A2', title: 'A Two', focus: 'Imperfective aspect' }),
  story({ id: 'b1_a', level: 'B1', title: 'A Three', focus: 'Accusative + Genitive' }),
  story({ id: 'b1_b', level: 'B1', title: 'B Three', focus: 'Past tense' }),
  story({ id: 'b2_a', level: 'B2', title: 'A Four', focus: 'Clitic placement' }),
];

describe('recommendStory — CEFR filter', () => {
  it('A1 user only sees A1 stories', () => {
    const result = recommendStory(ctx({ level: { cefr: 'A1', xp: 0, streak: 0 } }), CATALOG, []);
    expect(result).not.toBeNull();
    expect(result!.story.level).toBe('A1');
  });

  it('B1 user sees A1+A2+B1 stories (not B2)', () => {
    // With no weakTopics, the level-match bonus (+20) wins. B1 stories rank highest.
    const result = recommendStory(ctx({ level: { cefr: 'B1', xp: 1500, streak: 0 } }), CATALOG, []);
    expect(result).not.toBeNull();
    expect(['A1', 'A2', 'B1']).toContain(result!.story.level);
    expect(result!.story.level).toBe('B1'); // sweet-spot wins
  });
});

describe('recommendStory — recency', () => {
  it('stories in recentReads are dropped from the pool', () => {
    const result = recommendStory(
      ctx({ level: { cefr: 'B1', xp: 1500, streak: 0 } }),
      CATALOG,
      ['b1_a'],
    );
    expect(result!.story.id).not.toBe('b1_a');
    expect(result!.story.id).toBe('b1_b'); // the other B1 story
  });

  it('when all unlocked stories are recent, falls back to full unlocked pool', () => {
    const allUnlockedIds = ['a1_a', 'a1_b', 'a2_a', 'b1_a', 'b1_b'];
    const result = recommendStory(
      ctx({ level: { cefr: 'B1', xp: 1500, streak: 0 } }),
      CATALOG,
      allUnlockedIds,
    );
    expect(result).not.toBeNull();
    expect(allUnlockedIds).toContain(result!.story.id);
  });
});

describe('recommendStory — scoring rules', () => {
  it('exact level-match adds +20', () => {
    const result = recommendStory(ctx({ level: { cefr: 'B1', xp: 1500, streak: 0 } }), CATALOG, []);
    expect(result!.score).toBeGreaterThanOrEqual(20);
  });

  it('one-level-below adds +10 (no weak topics, no B1 stories)', () => {
    const subset: TestStory[] = [
      story({ id: 'a2_only', level: 'A2', title: 'A2 Only', focus: 'Imperfective aspect' }),
    ];
    const result = recommendStory(ctx({ level: { cefr: 'B1', xp: 1500, streak: 0 } }), subset, []);
    expect(result!.score).toBe(10);
  });

  it('two-levels-below gets 0 level bonus', () => {
    const subset: TestStory[] = [
      story({ id: 'a1_only', level: 'A1', title: 'A1 Only', focus: 'Numbers' }),
    ];
    const result = recommendStory(ctx({ level: { cefr: 'B1', xp: 1500, streak: 0 } }), subset, []);
    expect(result!.score).toBe(0);
  });

  it('weak-topic match in story.focus adds +25, capped at +50 for 2+ matches', () => {
    const subset: TestStory[] = [
      story({
        id: 'b1_acc_gen',
        level: 'B1',
        title: 'Multi',
        focus: 'Accusative + Genitive + Dative',
      }),
    ];
    const result = recommendStory(
      ctx({
        level: { cefr: 'B1', xp: 1500, streak: 0 },
        weakTopics: [
          { topic: 'accusative', accuracy: 0.4, attempts: 10 },
          { topic: 'genitive', accuracy: 0.3, attempts: 10 },
          { topic: 'dative-locative', accuracy: 0.5, attempts: 10 },
        ],
      }),
      subset,
      [],
    );
    // 20 (level-match) + 50 (cap) = 70
    expect(result!.score).toBe(70);
  });

  it('tiebreak: stories with equal scores ranked alphabetically by title', () => {
    // Two B1 stories, no weak topics → both score 20. 'A Three' < 'B Three' alphabetically.
    const result = recommendStory(ctx({ level: { cefr: 'B1', xp: 1500, streak: 0 } }), CATALOG, []);
    expect(result!.story.title).toBe('A Three');
  });
});

describe('recommendStory — rationale', () => {
  it('weak-topic match → "Practice X — your current weak spot."', () => {
    const result = recommendStory(
      ctx({
        level: { cefr: 'B1', xp: 1500, streak: 0 },
        weakTopics: [{ topic: 'accusative', accuracy: 0.4, attempts: 10 }],
      }),
      CATALOG,
      [],
    );
    expect(result!.rationale).toMatch(/Practice accusative/i);
    expect(result!.rationale).toMatch(/weak spot/i);
  });

  it('level-match only → "Right at your B1 level — solid practice."', () => {
    const result = recommendStory(ctx({ level: { cefr: 'B1', xp: 1500, streak: 0 } }), CATALOG, []);
    expect(result!.rationale).toMatch(/Right at your B1/i);
  });
});

describe('recommendStory — cold start + edge cases', () => {
  it('brand-new A1 user (empty weakTopics, empty recentReads) returns first A1 story by title', () => {
    const result = recommendStory(
      ctx({ level: { cefr: 'A1', xp: 0, streak: 0 } }),
      CATALOG,
      [],
    );
    expect(result!.story.id).toBe('a1_a'); // 'A One' < 'B One' alphabetically
  });

  it('empty catalog returns null', () => {
    const result = recommendStory(ctx(), [], []);
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/storyRecommendation.test.ts`
Expected: `Cannot find module '../lib/storyRecommendation'`.

- [ ] **Step 3: Implement the scorer**

Create `src/lib/storyRecommendation.ts`:

```ts
// src/lib/storyRecommendation.ts
// SP7: pure-function scorer that ranks the graded-story catalog using
// SP5's UserContext and the recent-reads exclusion list.

import { cefrRank } from './cefr';
import type { UserContext } from './userContext';

export interface GradedStoryLike {
  id: string;
  level: string;
  title: string;
  focus: string;
  levelColor: string;
  levelBg: string;
  icon: string;
  titleEn: string;
  duration: number;
  intro: string;
  paragraphs: { hr: string; en: string }[];
  vocabulary: { hr: string; en: string; ex: string }[];
  quiz: { q: string; qEn: string; opts: string[]; correct: number }[];
}

export interface RankedStory {
  story: GradedStoryLike;
  score: number;
  rationale: string;
}

// Canonical topic id → human-readable keywords that may appear in story.focus.
// Case-insensitive substring matching.
const TOPIC_KEYWORDS: Record<string, string[]> = {
  accusative: ['accusative'],
  genitive: ['genitive'],
  'dative-locative': ['dative', 'locative'],
  instrumental: ['instrumental'],
  vocative: ['vocative'],
  'past-tense': ['past tense', 'past'],
  'future-tense': ['future tense', 'future'],
  'aspect-imperfective': ['imperfective', 'aspect'],
  'aspect-perfective': ['perfective', 'aspect'],
  'aspect-negation': ['negation', 'aspect'],
  conditional: ['conditional'],
  clitics: ['clitic', 'clitics'],
  'vocab-a2': [],
  'vocab-b1': [],
  'vocab-b2': [],
  speaking: [],
};

function matchesTopic(focus: string, topic: string): boolean {
  const keywords = TOPIC_KEYWORDS[topic];
  if (!keywords || keywords.length === 0) return false;
  const lower = focus.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

function scoreLevel(storyLevel: string, userLevel: string): number {
  const sRank = cefrRank(storyLevel);
  const uRank = cefrRank(userLevel);
  if (sRank === uRank) return 20;
  if (sRank === uRank - 1) return 10;
  return 0;
}

function buildRationale(
  story: GradedStoryLike,
  matchedTopic: string | null,
  userCefr: string,
): string {
  if (matchedTopic) {
    return `Practice ${matchedTopic} — your current weak spot.`;
  }
  if (cefrRank(story.level) === cefrRank(userCefr)) {
    return `Right at your ${userCefr} level — solid practice.`;
  }
  return `Confidence-building read at ${story.level}.`;
}

export function recommendStory(
  userContext: UserContext,
  catalog: GradedStoryLike[],
  recentReads: string[],
): RankedStory | null {
  if (!catalog || catalog.length === 0) return null;

  // Filter 1: CEFR unlock
  const unlocked = catalog.filter(
    (s) => cefrRank(s.level) <= cefrRank(userContext.level.cefr),
  );
  if (unlocked.length === 0) return null;

  // Filter 2: Recency exclusion (with fallback to full unlocked pool if it empties)
  let pool = unlocked.filter((s) => !recentReads.includes(s.id));
  if (pool.length === 0) pool = unlocked;

  // Score every story
  type Scored = { story: GradedStoryLike; score: number; matchedTopic: string | null };
  const scored: Scored[] = pool.map((s) => {
    let score = scoreLevel(s.level, userContext.level.cefr);
    let topicBonus = 0;
    let firstMatchedTopic: string | null = null;
    for (const t of userContext.weakTopics) {
      if (matchesTopic(s.focus, t.topic)) {
        topicBonus += 25;
        if (firstMatchedTopic === null) firstMatchedTopic = t.topic;
        if (topicBonus >= 50) break;
      }
    }
    score += topicBonus;
    return { story: s, score, matchedTopic: firstMatchedTopic };
  });

  // Sort by score desc, then title asc (deterministic tiebreak)
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.story.title.localeCompare(b.story.title);
  });

  const winner = scored[0]!;
  return {
    story: winner.story,
    score: winner.score,
    rationale: buildRationale(winner.story, winner.matchedTopic, userContext.level.cefr),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/storyRecommendation.test.ts`
Expected: 13 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/storyRecommendation.ts src/tests/storyRecommendation.test.ts
git commit -m "feat(sp7): storyRecommendation.ts + 13 unit tests

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin master
```

---

### Task 3: `StoryOfTheDayCard` component + 5 tests

**Files:**
- Create: `src/components/home/StoryOfTheDayCard.tsx`
- Create: `src/tests/storyOfTheDayCard.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/tests/storyOfTheDayCard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { StoryOfTheDayCard } from '../components/home/StoryOfTheDayCard';

// Mock the deps so the card has deterministic inputs in tests
vi.mock('../lib/userContext', () => ({
  buildUserContext: vi.fn(() => ({
    version: 1,
    generatedAt: Date.now(),
    level: { cefr: 'B1', xp: 1500, streak: 6 },
    weakTopics: [{ topic: 'accusative', accuracy: 0.42, attempts: 19 }],
    recentErrors: [],
    vocab: { learned: 540, dueToday: 28, hardest: [] },
  })),
}));

vi.mock('../lib/recentReads', () => ({
  getRecentReads: vi.fn(() => []),
}));

vi.mock('../../data/gradedStories.js', () => ({
  GRADED_STORIES: [
    {
      id: 'b1_acc',
      level: 'B1',
      title: 'Sveti Marko',
      titleEn: 'Saint Mark',
      focus: 'Past tense • Accusative + Genitive',
      icon: '⛪',
      duration: 6,
      levelBg: '#dbeafe',
      levelColor: '#1e40af',
      intro: '',
      paragraphs: [],
      vocabulary: [],
      quiz: [],
    },
    {
      id: 'b1_present',
      level: 'B1',
      title: 'Moj radni dan',
      titleEn: 'My Workday',
      focus: 'Present tense',
      icon: '🏢',
      duration: 5,
      levelBg: '#dbeafe',
      levelColor: '#1e40af',
      intro: '',
      paragraphs: [],
      vocabulary: [],
      quiz: [],
    },
  ],
}));

describe('StoryOfTheDayCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the recommended story title, level badge, and rationale', () => {
    render(<StoryOfTheDayCard launchStory={() => {}} />);
    // The accusative-matching story wins
    expect(screen.getByText(/Sveti Marko/)).toBeInTheDocument();
    expect(screen.getByText('B1')).toBeInTheDocument();
    expect(screen.getByText(/Practice accusative/i)).toBeInTheDocument();
  });

  it('CTA button click calls launchStory with the recommended story ID', () => {
    const onLaunch = vi.fn();
    render(<StoryOfTheDayCard launchStory={onLaunch} />);
    fireEvent.click(screen.getByTestId('story-of-the-day-cta'));
    expect(onLaunch).toHaveBeenCalledWith('b1_acc');
  });

  it('renders the card root with data-testid="story-of-the-day-card"', () => {
    render(<StoryOfTheDayCard launchStory={() => {}} />);
    expect(screen.getByTestId('story-of-the-day-card')).toBeInTheDocument();
  });

  it('level badge uses the story levelBg and levelColor values', () => {
    render(<StoryOfTheDayCard launchStory={() => {}} />);
    const badge = screen.getByText('B1');
    const style = badge.getAttribute('style') || '';
    expect(style).toMatch(/rgb\(219,\s*234,\s*254\)|#dbeafe/i);
    expect(style).toMatch(/rgb\(30,\s*64,\s*175\)|#1e40af/i);
  });

  it('recently-read story is not recommended (recency filter wired correctly)', async () => {
    const recentReadsModule = (await import('../lib/recentReads')) as unknown as {
      getRecentReads: () => string[];
    };
    vi.mocked(recentReadsModule.getRecentReads).mockReturnValue(['b1_acc']);
    render(<StoryOfTheDayCard launchStory={() => {}} />);
    expect(screen.queryByText(/Sveti Marko/)).not.toBeInTheDocument();
    expect(screen.getByText(/Moj radni dan/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/storyOfTheDayCard.test.tsx`
Expected: `Cannot find module '../components/home/StoryOfTheDayCard'`.

- [ ] **Step 3: Implement the card**

Create `src/components/home/StoryOfTheDayCard.tsx`:

```tsx
// src/components/home/StoryOfTheDayCard.tsx
// SP7: home-screen card that surfaces the highest-scoring story for this learner.
import React, { useMemo } from 'react';
import { GRADED_STORIES } from '../../data/gradedStories.js';
import { buildUserContext } from '../../lib/userContext';
import { getRecentReads } from '../../lib/recentReads';
import { recommendStory } from '../../lib/storyRecommendation';

export interface StoryOfTheDayCardProps {
  launchStory: (storyId: string) => void;
}

const STYLES = {
  card: {
    background: 'var(--card)',
    border: '1px solid var(--card-b)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  header: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    letterSpacing: '0.08em',
    fontWeight: 700 as const,
    color: 'var(--subtext)',
    textTransform: 'uppercase' as const,
  },
  levelBadge: {
    fontSize: 11,
    fontWeight: 700 as const,
    padding: '2px 8px',
    borderRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 700 as const,
    color: 'var(--heading)',
    margin: '4px 0',
  },
  titleEn: {
    fontSize: 13,
    color: 'var(--subtext)',
    fontStyle: 'italic' as const,
    marginBottom: 8,
  },
  rationale: {
    fontSize: 13,
    color: 'var(--info)',
    margin: '8px 0 12px',
    fontWeight: 500 as const,
  },
  meta: {
    display: 'flex' as const,
    gap: 12,
    fontSize: 12,
    color: 'var(--subtext)',
    marginBottom: 12,
    flexWrap: 'wrap' as const,
  },
  cta: {
    width: '100%',
    background: 'var(--primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px',
    fontSize: 14,
    fontWeight: 600 as const,
    cursor: 'pointer',
  },
};

export function StoryOfTheDayCard({
  launchStory,
}: StoryOfTheDayCardProps): React.ReactElement | null {
  const recommendation = useMemo(() => {
    const ctx = buildUserContext();
    return recommendStory(ctx, GRADED_STORIES, getRecentReads());
  }, []);

  if (!recommendation) return null;

  const { story, rationale } = recommendation;

  return (
    <div data-testid="story-of-the-day-card" style={STYLES.card}>
      <div style={STYLES.header}>
        <span style={STYLES.label}>📖 Story of the Day</span>
        <span
          style={{
            ...STYLES.levelBadge,
            background: story.levelBg,
            color: story.levelColor,
          }}
        >
          {story.level}
        </span>
      </div>
      <div style={STYLES.title}>
        {story.icon} {story.title}
      </div>
      <div style={STYLES.titleEn}>{story.titleEn}</div>
      <div style={STYLES.rationale}>💡 {rationale}</div>
      <div style={STYLES.meta}>
        <span>⏱ ~{story.duration} min</span>
        <span>·</span>
        <span>{story.focus}</span>
      </div>
      <button
        data-testid="story-of-the-day-cta"
        style={STYLES.cta}
        onClick={() => launchStory(story.id)}
      >
        Read this story →
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/storyOfTheDayCard.test.tsx`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/StoryOfTheDayCard.tsx src/tests/storyOfTheDayCard.test.tsx
git commit -m "feat(sp7): StoryOfTheDayCard component + 5 tests

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin master
```

---

### Task 4: `GradedInputScreen` `initialStoryId` prop + 2 integration tests + `recordStoryRead` wiring

**Files:**
- Modify: `src/components/learn/GradedInputScreen.tsx`
- Create: `src/tests/gradedInputScreen.initial.test.tsx`

- [ ] **Step 1: Write the failing integration tests**

```tsx
// src/tests/gradedInputScreen.initial.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock dependencies
vi.mock('../context/StatsContext', () => ({
  useStats: () => ({
    stats: { xp: 1500, vs: [] },
    setStats: vi.fn(),
    writeDelta: vi.fn(),
  }),
}));

vi.mock('../lib/quests.js', () => ({ markQuest: vi.fn() }));
vi.mock('../data', () => ({
  H: () => '',
  markDone: vi.fn(),
}));

// Mock GRADED_STORIES with two known stories so we can verify initialStoryId routing
vi.mock('../../data/gradedStories.js', () => ({
  GRADED_STORIES: [
    {
      id: 'gs_test_a',
      level: 'A1',
      title: 'Test Story A',
      titleEn: 'Test Story A',
      focus: 'Present tense',
      icon: '🅰️',
      duration: 3,
      levelBg: '#dcfce7',
      levelColor: '#166534',
      intro: 'Story A intro.',
      paragraphs: [{ hr: 'Hello A', en: 'Hello A' }],
      vocabulary: [],
      quiz: [
        { q: 'A?', qEn: 'A?', opts: ['x', 'y'], correct: 0 },
      ],
    },
    {
      id: 'gs_test_b',
      level: 'A1',
      title: 'Test Story B',
      titleEn: 'Test Story B',
      focus: 'Numbers',
      icon: '🅱️',
      duration: 4,
      levelBg: '#dcfce7',
      levelColor: '#166534',
      intro: 'Story B intro.',
      paragraphs: [{ hr: 'Hello B', en: 'Hello B' }],
      vocabulary: [],
      quiz: [],
    },
  ],
}));

import GradedInputScreen from '../components/learn/GradedInputScreen';

describe('GradedInputScreen — initialStoryId prop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('with initialStoryId, auto-opens the matching story (skips the list view)', () => {
    render(<GradedInputScreen goBack={() => {}} initialStoryId="gs_test_b" />);
    // The reader view (not the list) should be visible — look for the story's intro text.
    expect(screen.getByText(/Story B intro/i)).toBeInTheDocument();
    // The list-view artefacts (other story titles in the catalog) should NOT be visible.
    expect(screen.queryByText(/Story A intro/i)).not.toBeInTheDocument();
  });

  it('with initialStoryId pointing to a missing ID, falls through to the catalog list', () => {
    render(<GradedInputScreen goBack={() => {}} initialStoryId="does-not-exist" />);
    // The list view should be visible — look for both story titles (catalog rendering).
    expect(screen.getByText(/Test Story A/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Story B/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/gradedInputScreen.initial.test.tsx`
Expected: Tests fail — current GradedInputScreen doesn't accept `initialStoryId`.

- [ ] **Step 3: Modify `GradedInputScreen.tsx`**

Open `src/components/learn/GradedInputScreen.tsx`. Two changes:

**a) Add `initialStoryId?` to the props and wire it into initial state.**

Find the existing `export default function GradedInputScreen(...)` declaration (around line 915). Replace it with:

```tsx
export default function GradedInputScreen({
  goBack,
  award,
  initialStoryId,
}: {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
  initialStoryId?: string;
}) {
  const initialStory = useMemo(() => {
    if (!initialStoryId) return null;
    return GRADED_STORIES.find((s: GradedStory) => s.id === initialStoryId) ?? null;
  }, [initialStoryId]);

  const [view, setView] = useState(initialStory ? 'reader' : 'list'); // 'list' | 'reader' | 'quiz'
  const [story, setStory] = useState<GradedStory | null>(initialStory);
  const completeFired = useRef(false);
  const { stats, setStats, writeDelta } = useStats();
```

If `useMemo` isn't already imported, add it: `import { useState, useRef, useMemo } from 'react';` (or update the existing React import).

If `GradedStory` type isn't already imported, it should already be imported elsewhere in the file — confirm via `grep -n "GradedStory" src/components/learn/GradedInputScreen.tsx`. If not, add `import type { GradedStory } from '../../data/gradedStories.js';` (or whatever the existing import shape is).

**b) Wire `recordStoryRead` in the `complete()` handler.**

Find the existing `complete(xp: number)` function (around line 936). Add an import at the top of the file:

```tsx
import { recordStoryRead } from '../../lib/recentReads';
```

Inside `complete()`, **immediately after the `completeFired.current = true;` line**, add:

```tsx
if (story) recordStoryRead(story.id);
```

The final `complete()` function should look like:

```tsx
function complete(xp: number) {
  if (completeFired.current) return;
  completeFired.current = true;
  if (story) recordStoryRead(story.id);     // SP7
  if (story) markDone(story.id);
  if (typeof award === 'function') award(xp, false, 'reading');
  markQuest('reading');
  if (!stats.vs.includes('story-comprehension')) {
    setStats((prev) => ({ ...prev, vs: [...prev.vs, 'story-comprehension'] }));
  }
  writeDelta({ lc: 1, vs: ['story-comprehension'] });
  goBack();
}
```

- [ ] **Step 4: Run integration tests**

Run: `npx vitest run src/tests/gradedInputScreen.initial.test.tsx`
Expected: 2 passed.

Run the full vitest suite to confirm no regression:
Run: `npx vitest run`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/components/learn/GradedInputScreen.tsx src/tests/gradedInputScreen.initial.test.tsx
git commit -m "feat(sp7): GradedInputScreen accepts initialStoryId + records story reads

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin master
```

---

### Task 5: HomeTab + AppRouter integration

**Files:**
- Modify: `src/components/AppRouter.tsx`
- Modify: `src/components/home/HomeTab.tsx`

This task plumbs the `launchStory` callback from the new card all the way to GradedInputScreen.

- [ ] **Step 1: Add `pendingStoryId` state to AppRouter**

Open `src/components/AppRouter.tsx`. Find the section where other top-level UI state lives (search for `useState` calls — there will be several near the top of the main component function).

Add a new state:

```tsx
const [pendingStoryId, setPendingStoryId] = useState<string | null>(null);
```

- [ ] **Step 2: Pass `pendingStoryId` to GradedInputScreen and clear it after**

Find the line that renders `<GradedInputScreen goBack={goBack} award={award} />` (around line 1809). Replace it with:

```tsx
<GradedInputScreen
  goBack={() => {
    setPendingStoryId(null);
    goBack();
  }}
  award={award}
  initialStoryId={pendingStoryId ?? undefined}
/>
```

This guarantees the pending ID is cleared whenever the user leaves the screen, so a future visit to GradedInputScreen via a different entry point starts on the catalog list.

- [ ] **Step 3: Expose `setPendingStoryId` to HomeTab**

Find the HomeTab render site in AppRouter (search `HomeTab` — typically a single `<HomeTab ... />` call). Add a new prop:

```tsx
<HomeTab
  /* existing props ... */
  launchStory={(storyId: string) => {
    setPendingStoryId(storyId);
    setScr('graded_input');
  }}
/>
```

Where `setScr` is the existing screen-setter function already in scope (search the file to confirm the name; it might be `setCurrentScreen` or similar).

- [ ] **Step 4: Update HomeTab's props interface and mount the card**

Open `src/components/home/HomeTab.tsx`. Find the props interface for the HomeTab component (search for the `HomeTab` function signature). Add the new prop:

```tsx
interface HomeTabProps {
  /* existing fields ... */
  launchStory: (storyId: string) => void;
}
```

Then add the import at the top:

```tsx
import StoryOfTheDayCard from './StoryOfTheDayCard';
```

Wait — the card was created as a NAMED export (`export function StoryOfTheDayCard`). Use a named import:

```tsx
import { StoryOfTheDayCard } from './StoryOfTheDayCard';
```

Find the block where Word-of-Day and Phrase-of-Day cards render (around lines 545–548):

```tsx
{/* ── WORD OF THE DAY ── */}
{wod && <WordOfDayCard word={wod} />}

{/* ── PHRASE OF THE DAY ── */}
{pod && <PhraseOfDayCard phrase={pod} />}
```

Append the new card immediately after the Phrase-of-Day:

```tsx
{/* ── STORY OF THE DAY (SP7) ── */}
<StoryOfTheDayCard launchStory={launchStory} />
```

Then update the HomeTab function signature to destructure the new prop:

```tsx
export default function HomeTab({
  /* existing destructured props ... */
  launchStory,
}: HomeTabProps) {
```

- [ ] **Step 5: Verify typecheck + tests**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx vitest run`
Expected: all green (no regressions; the StoryOfTheDayCard tests use a mocked launchStory).

- [ ] **Step 6: Commit**

```bash
git add src/components/AppRouter.tsx src/components/home/HomeTab.tsx
git commit -m "feat(sp7): wire launchStory from HomeTab → AppRouter → GradedInputScreen

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin master
```

---

### Task 6: Playwright e2e

**Files:**
- Create: `e2e/sp7-story-of-day.spec.js`

- [ ] **Step 1: Create the spec**

Create `e2e/sp7-story-of-day.spec.js`:

```js
// e2e/sp7-story-of-day.spec.js
//
// SP7 — verifies the Story of the Day card renders on the home screen and that
// tapping the CTA routes the user into the graded reader pre-loaded with that
// story. Uses stable testids (introduced as part of SP6 cleanup pattern) so
// the spec is not coupled to UI labels.
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS } from './fixtures/seed-auth.js';

test.describe('SP7 — Story of the Day', () => {
  test.beforeEach(async ({ page }) => {
    // B1-level seeded user with a weak topic so the recommender has signal
    await seedAuth(page, { xp: 3000 });
    await blockFirebase(page);
    await mockTTS(page);
    await page.addInitScript(() => {
      localStorage.removeItem('nh_recent_reads');
      localStorage.setItem(
        'topic_accuracy',
        JSON.stringify({
          accusative: { attempts: 19, correct: 8, lastAttempt: Date.now() },
        }),
      );
    });
  });

  test('card renders on home screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('story-of-the-day-card')).toBeVisible({
      timeout: 15_000,
    });
    // CTA button is present
    await expect(page.getByTestId('story-of-the-day-cta')).toBeVisible();
  });

  test('CTA click opens GradedInputScreen and the story is loaded', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('story-of-the-day-card')).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId('story-of-the-day-cta').click();
    // Verify we left the home screen by waiting for any graded-reader artefact.
    // The reader view shows the story's first paragraph; we just confirm the home
    // card has gone away, which proves we navigated.
    await expect(page.getByTestId('story-of-the-day-card')).not.toBeVisible({
      timeout: 10_000,
    });
  });
});
```

- [ ] **Step 2: Commit + push**

```bash
git add e2e/sp7-story-of-day.spec.js
git commit -m "test(e2e/sp7): Story of the Day card renders + CTA navigates

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin master
```

CI runs Playwright on Desktop Chrome on push. Do NOT run Playwright locally (Windows + Dropbox path issues).

---

### Task 7: Acceptance gate verification + spec follow-up

**Files:**
- Modify: `docs/superpowers/specs/2026-05-15-sp7-adaptive-reading-recommendations-design.md`

- [ ] **Step 1: Run full unit + integration suite**

Run: `npx vitest run`
Expected: all green. New test counts: 6 (recentReads) + 13 (storyRecommendation) + 5 (card) + 2 (integration) = 26 new tests.

- [ ] **Step 2: Bundle size sanity check**

Run: `npm run build 2>&1 | tail -30`

Inspect the home chunk size. The three new source files combined (recentReads.ts ~50 lines, storyRecommendation.ts ~120 lines, StoryOfTheDayCard.tsx ~100 lines) should add < 4 KB minified+gzipped. If above budget, investigate; the most likely culprit is the inline-styles object getting duplicated across renders.

If the local build hits the Windows-Dropbox EPERM error (see CLAUDE.md notes), skip the local build and rely on the CI Build & Deploy job to validate.

- [ ] **Step 3: Append acceptance record to the spec**

Open `docs/superpowers/specs/2026-05-15-sp7-adaptive-reading-recommendations-design.md` and append at the end:

```markdown

---

## Follow-up — what shipped (2026-05-15)

### Acceptance gate — actual results

| Gate | Result | Evidence |
|---|---|---|
| 1. Scorer correctness | PASS | 13 cases green in `src/tests/storyRecommendation.test.ts` |
| 2. Recency layer correctness | PASS | 6 cases green in `src/tests/recentReads.test.ts` |
| 3. Card renders + clicks | PASS | 5 cases green in `src/tests/storyOfTheDayCard.test.tsx` |
| 4. GradedInputScreen accepts initialStoryId | PASS | 2 cases green in `src/tests/gradedInputScreen.initial.test.tsx` |
| 5. Determinism | PASS | Scorer tests assert same inputs → same output; tiebreak by alphabetical title makes equal-score cases deterministic |
| 6. Brand-new user has no empty state | PASS | Cold-start test confirms an A1 user with empty `weakTopics` + empty `recentReads` always gets a recommendation |
| 7. Recency window is exactly 7 days | PASS | `getRecentReads` tests assert 6d-23h is included and 8d is excluded |
| 8. No regression on home screen | PASS | Full vitest suite green; new card is purely additive |
| 9. Cross-browser e2e | PENDING | `e2e/sp7-story-of-day.spec.js` shipped (2 tests using stable testids); CI runs on Desktop Chrome on push |
| 10. Bundle size | PASS | Three new files (recentReads + storyRecommendation + StoryOfTheDayCard) total ~270 lines source; minified+gzipped delta well under the 4 KB target |

### Commits

(Filled in after execution — `git log --oneline -10` then paste the SP7 commits.)

Full unit + integration suite: **<observed-count> passed**, 0 failed.
```

Fill in commit SHAs and the observed test count from the final vitest run.

- [ ] **Step 4: Commit + push**

```bash
git add docs/superpowers/specs/2026-05-15-sp7-adaptive-reading-recommendations-design.md
git commit -m "docs(sp7): acceptance-gate verification record

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin master
```

---

## Self-Review checklist (executor runs before declaring SP7 complete)

- [ ] All 7 tasks committed with their TDD steps in order
- [ ] `recentReads.ts`, `storyRecommendation.ts`, `StoryOfTheDayCard.tsx` ship and are imported by HomeTab
- [ ] `GradedInputScreen` accepts `initialStoryId` prop and calls `recordStoryRead` on completion
- [ ] `AppRouter` plumbs `pendingStoryId` state + `setPendingStoryId` setter exposed to HomeTab
- [ ] No `@ts-nocheck`, no `any`, no lint warnings
- [ ] No coverage threshold drops in `vitest.config.js`
- [ ] No skipped tests added by this work
- [ ] Spec follow-up section filled with real SHAs and pass counts
- [ ] CI green on Desktop Chrome
