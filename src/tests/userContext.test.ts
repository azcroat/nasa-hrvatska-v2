// src/tests/userContext.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { buildUserContext } from '../lib/userContext';

const TEST_EMAIL = 'test@nasahrvatska.com';

function seedProfile(opts: { xp?: number; lc?: number; gc?: number; streak?: number } = {}) {
  const st = { xp: 250, lc: 10, gc: 5, sp: 3, de: 2, rc: 1, pf: 2, al: 1, mv: 0, hi: 0, ...opts };
  localStorage.setItem('uS', JSON.stringify({ u: TEST_EMAIL, lastActive: Date.now() }));
  localStorage.setItem(
    'uP_' + TEST_EMAIL,
    JSON.stringify({
      name: 'Test',
      cp: true,
      st,
      sr: {},
      streak: { count: opts.streak ?? 0, last: '' },
    }),
  );
  localStorage.setItem('uStreak', JSON.stringify({ count: opts.streak ?? 0, last: '' }));
}

function seedTopicAccuracy(rows: Array<{ topic: string; attempts: number; correct: number }>) {
  const data: Record<string, { attempts: number; correct: number; lastAttempt: number }> = {};
  for (const r of rows) {
    data[r.topic] = { attempts: r.attempts, correct: r.correct, lastAttempt: Date.now() };
  }
  localStorage.setItem('topic_accuracy', JSON.stringify(data));
}

describe('buildUserContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns a v1 schema-shaped object', () => {
    const ctx = buildUserContext();
    expect(ctx.version).toBe(1);
    expect(typeof ctx.generatedAt).toBe('number');
    expect(ctx.level).toBeDefined();
    expect(Array.isArray(ctx.weakTopics)).toBe(true);
    expect(Array.isArray(ctx.recentErrors)).toBe(true);
    expect(ctx.vocab).toBeDefined();
  });

  it('falls back to A1 + zero XP when profile is missing', () => {
    const ctx = buildUserContext();
    expect(ctx.level.cefr).toBe('A1');
    expect(ctx.level.xp).toBe(0);
    expect(ctx.level.streak).toBe(0);
  });

  it('reads xp and streak from uP_<email> profile', () => {
    seedProfile({ xp: 1500, streak: 6 });
    const ctx = buildUserContext();
    expect(ctx.level.xp).toBe(1500);
    expect(ctx.level.streak).toBe(6);
  });

  it('computes cefr from xp+lc+gc per existing getUserCefr formula', () => {
    seedProfile({ xp: 1500, lc: 10, gc: 5 });
    const ctx = buildUserContext();
    // 1500 + 10*15 + 5*25 = 1775 → B1 per cefr.ts
    expect(ctx.level.cefr).toBe('B1');
  });

  it('weakTopics is empty when no accuracy data exists', () => {
    seedProfile();
    const ctx = buildUserContext();
    expect(ctx.weakTopics).toEqual([]);
  });

  it('weakTopics filters out topics with attempts < 3', () => {
    seedTopicAccuracy([
      { topic: 'accusative', attempts: 2, correct: 0 },
      { topic: 'aspect-imperfective', attempts: 10, correct: 4 },
    ]);
    const ctx = buildUserContext();
    expect(ctx.weakTopics.map((t) => t.topic)).toEqual(['aspect-imperfective']);
  });

  it('weakTopics sorted lowest accuracy first, capped at 3', () => {
    seedTopicAccuracy([
      { topic: 'accusative', attempts: 10, correct: 4 },
      { topic: 'aspect-imperfective', attempts: 10, correct: 7 },
      { topic: 'genitive', attempts: 10, correct: 2 },
      { topic: 'clitics', attempts: 10, correct: 5 },
      { topic: 'vocative', attempts: 10, correct: 8 },
    ]);
    const ctx = buildUserContext();
    expect(ctx.weakTopics.length).toBeLessThanOrEqual(3);
    const accs = ctx.weakTopics.map((t) => t.accuracy);
    for (let i = 1; i < accs.length; i++) {
      expect(accs[i]).toBeGreaterThanOrEqual(accs[i - 1] as number);
    }
    expect(ctx.weakTopics[0].topic).toBe('genitive');
  });

  it('weakTopics rounds accuracy to 2 decimals', () => {
    seedTopicAccuracy([{ topic: 'accusative', attempts: 7, correct: 2 }]);
    const ctx = buildUserContext();
    expect(ctx.weakTopics[0].accuracy).toBe(0.29);
  });

  it('recentErrors reads from nh_recent_errors', () => {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    localStorage.setItem(
      'nh_recent_errors',
      JSON.stringify([
        { topic: 'accusative', prompt: 'q', userAnswer: 'a', correctAnswer: 'c', at: fiveMinAgo },
      ]),
    );
    const ctx = buildUserContext();
    expect(ctx.recentErrors).toHaveLength(1);
    expect(ctx.recentErrors[0].topic).toBe('accusative');
    expect(ctx.recentErrors[0].minutesAgo).toBeGreaterThanOrEqual(4);
  });

  it('recentErrors returns empty array when no errors logged', () => {
    const ctx = buildUserContext();
    expect(ctx.recentErrors).toEqual([]);
  });

  it('vocab.learned + vocab.dueToday are integers >= 0 even with no SR data', () => {
    const ctx = buildUserContext();
    expect(ctx.vocab.learned).toBe(0);
    expect(ctx.vocab.dueToday).toBe(0);
    expect(ctx.vocab.hardest).toEqual([]);
  });

  it('vocab.hardest returns up to 5 words sorted by lapse count', () => {
    seedProfile();
    const profileKey = 'uP_' + TEST_EMAIL;
    const profile = JSON.parse(localStorage.getItem(profileKey)!);
    profile.sr = {
      knjiga: { i: 5, e: 2.5, n: 1, due: Date.now() + 86400000, q: 4, lapses: 1 },
      studeni: { i: 1, e: 1.5, n: 3, due: Date.now() + 86400000, q: 2, lapses: 6 },
      cekati: { i: 2, e: 1.8, n: 2, due: Date.now() + 86400000, q: 3, lapses: 4 },
    };
    localStorage.setItem(profileKey, JSON.stringify(profile));
    const ctx = buildUserContext();
    expect(ctx.vocab.hardest.length).toBeLessThanOrEqual(5);
    expect(ctx.vocab.hardest[0]).toBe('studeni');
  });

  it('vocab.dueToday counts cards due in next 24h', () => {
    seedProfile();
    const profileKey = 'uP_' + TEST_EMAIL;
    const profile = JSON.parse(localStorage.getItem(profileKey)!);
    profile.sr = {
      a: { i: 1, e: 2.5, n: 1, due: Date.now() + 1000, q: 4, lapses: 0 },
      b: { i: 1, e: 2.5, n: 1, due: Date.now() + 26 * 60 * 60 * 1000, q: 4, lapses: 0 },
    };
    localStorage.setItem(profileKey, JSON.stringify(profile));
    const ctx = buildUserContext();
    expect(ctx.vocab.dueToday).toBe(1);
  });

  it('vocab.learned counts mature/young cards (n >= 1)', () => {
    seedProfile();
    const profileKey = 'uP_' + TEST_EMAIL;
    const profile = JSON.parse(localStorage.getItem(profileKey)!);
    profile.sr = {
      a: { i: 1, e: 2.5, n: 0, due: 0, q: 0, lapses: 0 },
      b: { i: 1, e: 2.5, n: 2, due: 0, q: 4, lapses: 0 },
      c: { i: 1, e: 2.5, n: 1, due: 0, q: 4, lapses: 0 },
    };
    localStorage.setItem(profileKey, JSON.stringify(profile));
    const ctx = buildUserContext();
    expect(ctx.vocab.learned).toBe(2);
  });

  it('generatedAt is within 100ms of Date.now() at call time', () => {
    const before = Date.now();
    const ctx = buildUserContext();
    const after = Date.now();
    expect(ctx.generatedAt).toBeGreaterThanOrEqual(before);
    expect(ctx.generatedAt).toBeLessThanOrEqual(after);
  });
});
