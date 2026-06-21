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

function story(
  opts: Partial<TestStory> & { id: string; level: string; focus: string; title: string },
): TestStory {
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
    const result = recommendStory(ctx({ level: { cefr: 'B1', xp: 1500, streak: 0 } }), CATALOG, []);
    expect(result).not.toBeNull();
    expect(['A1', 'A2', 'B1']).toContain(result!.story.level);
    expect(result!.story.level).toBe('B1');
  });
});

describe('recommendStory — recency', () => {
  it('stories in recentReads are dropped from the pool', () => {
    const result = recommendStory(ctx({ level: { cefr: 'B1', xp: 1500, streak: 0 } }), CATALOG, [
      'b1_a',
    ]);
    expect(result!.story.id).not.toBe('b1_a');
    expect(result!.story.id).toBe('b1_b');
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
    expect(result!.score).toBe(70);
  });

  it('tiebreak: stories with equal scores ranked alphabetically by title', () => {
    const result = recommendStory(ctx({ level: { cefr: 'B1', xp: 1500, streak: 0 } }), CATALOG, []);
    expect(result!.story.title).toBe('A Three');
  });
});

describe('recommendStory — daily rotation (Story of the Day must change each day)', () => {
  const b1 = ctx({ level: { cefr: 'B1', xp: 1500, streak: 0 } });
  // Relevance-ranked B1 pool order: [b1_a, b1_b, a2_a, a1_a, a1_b] (5 stories)

  it('default dayIndex (0) returns the top-ranked story', () => {
    expect(recommendStory(b1, CATALOG, []).story.id).toBe('b1_a');
  });

  it('advancing the day advances the story', () => {
    expect(recommendStory(b1, CATALOG, [], 0).story.id).toBe('b1_a');
    expect(recommendStory(b1, CATALOG, [], 1).story.id).toBe('b1_b');
    expect(recommendStory(b1, CATALOG, [], 2).story.id).toBe('a2_a');
  });

  it('two consecutive days never return the same story (the original bug)', () => {
    const today = recommendStory(b1, CATALOG, [], 20000)!.story.id;
    const tomorrow = recommendStory(b1, CATALOG, [], 20001)!.story.id;
    expect(today).not.toBe(tomorrow);
  });

  it('rotation cycles through the whole unlocked pool over consecutive days', () => {
    const ids = new Set<string>();
    for (let d = 0; d < 5; d++) ids.add(recommendStory(b1, CATALOG, [], d)!.story.id);
    expect(ids.size).toBe(5); // all 5 unlocked B1 stories surface across 5 days
  });

  it('wraps around (dayIndex === poolLength behaves like day 0)', () => {
    expect(recommendStory(b1, CATALOG, [], 5).story.id).toBe(
      recommendStory(b1, CATALOG, [], 0).story.id,
    );
  });

  it('large real-world day index (Date.now()/86400000) stays in range', () => {
    const big = Math.floor(1_750_000_000_000 / 86400000); // ~20254
    const r = recommendStory(b1, CATALOG, [], big);
    expect(r).not.toBeNull();
    expect(CATALOG.map((s) => s.id)).toContain(r!.story.id);
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
    const result = recommendStory(ctx({ level: { cefr: 'A1', xp: 0, streak: 0 } }), CATALOG, []);
    expect(result!.story.id).toBe('a1_a');
  });

  it('empty catalog returns null', () => {
    const result = recommendStory(ctx(), [], []);
    expect(result).toBeNull();
  });
});
