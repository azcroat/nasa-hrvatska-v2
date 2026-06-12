import { describe, it, expect, vi } from 'vitest';
import { completeLesson } from '../hooks/useLessonCompletion';

function harness(initialVs: string[] = []) {
  let stats = { vs: [...initialVs], lc: 0, gc: 0 };
  return {
    get stats() {
      return stats;
    },
    setStats: (fn: (p: typeof stats) => typeof stats) => {
      stats = fn(stats);
    },
    writeDelta: vi.fn(),
    award: vi.fn(),
  };
}

describe('completeLesson', () => {
  it('writes completion + awards only when passed (>=75%)', () => {
    const h = harness();
    const res = completeLesson({
      screenId: 'declension',
      statKind: 'gc',
      score: 8,
      total: 8,
      xp: 30,
      questKind: 'grammar',
      stats: h.stats,
      setStats: h.setStats,
      writeDelta: h.writeDelta,
      award: h.award,
    });
    expect(res.passed).toBe(true);
    expect(h.stats.vs).toContain('declension');
    expect(h.stats.gc).toBe(1);
    expect(h.writeDelta).toHaveBeenCalledWith({ gc: 1, vs: ['declension'] });
    expect(h.award).toHaveBeenCalledWith(30, false, 'lesson');
  });

  it('writes nothing when failed (<75%)', () => {
    const h = harness();
    const res = completeLesson({
      screenId: 'declension',
      statKind: 'gc',
      score: 4,
      total: 8,
      xp: 30,
      questKind: 'grammar',
      stats: h.stats,
      setStats: h.setStats,
      writeDelta: h.writeDelta,
      award: h.award,
    });
    expect(res.passed).toBe(false);
    expect(h.stats.vs).not.toContain('declension');
    expect(h.stats.gc).toBe(0);
    expect(h.writeDelta).not.toHaveBeenCalled();
    expect(h.award).not.toHaveBeenCalled();
  });

  it('is idempotent — no double credit if already completed', () => {
    const h = harness(['declension']);
    completeLesson({
      screenId: 'declension',
      statKind: 'gc',
      score: 8,
      total: 8,
      xp: 30,
      questKind: 'grammar',
      stats: h.stats,
      setStats: h.setStats,
      writeDelta: h.writeDelta,
      award: h.award,
    });
    expect(h.stats.gc).toBe(0); // already in vs → no increment
    expect(h.writeDelta).not.toHaveBeenCalled();
  });
});
