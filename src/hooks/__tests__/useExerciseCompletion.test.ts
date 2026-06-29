import { describe, it, expect, vi, beforeEach } from 'vitest';
import { completeExercise } from '../useExerciseCompletion';

vi.mock('../../lib/quests', () => ({ markQuest: vi.fn() }));
import { markQuest } from '../../lib/quests';

type S = { vs?: string[]; lc?: number; gc?: number; sp?: number; rc?: number };
function harness(initial: S) {
  let saved: S = initial;
  const setStats = (fn: (p: S) => S) => {
    saved = fn(saved);
  };
  const deltas: Record<string, unknown>[] = [];
  const writeDelta = (d: Record<string, unknown>) => deltas.push(d);
  const awards: Array<[number, boolean | undefined, string | undefined]> = [];
  const award = (xp: number, c?: boolean, a?: string) => awards.push([xp, c, a]);
  return { get: () => saved, setStats, writeDelta, award, deltas, awards };
}

beforeEach(() => vi.clearAllMocks());

describe('completeExercise', () => {
  it('gated: does NOT credit below 75%, returns passed=false', () => {
    const h = harness({ vs: [], gc: 0 });
    const r = completeExercise({
      key: 'genitive',
      score: 7,
      total: 10,
      xp: 35,
      stats: h.get(),
      setStats: h.setStats,
      writeDelta: h.writeDelta,
      award: h.award,
    });
    expect(r.passed).toBe(false);
    expect(h.get().vs).not.toContain('genitive');
    expect(h.get().gc).toBe(0);
    expect(h.awards).toHaveLength(0);
  });

  it('gated: credits vs + counter + xp + quest at >=75%', () => {
    const h = harness({ vs: [], gc: 0 });
    const r = completeExercise({
      key: 'genitive',
      score: 8,
      total: 10,
      xp: 40,
      stats: h.get(),
      setStats: h.setStats,
      writeDelta: h.writeDelta,
      award: h.award,
    });
    expect(r.passed).toBe(true);
    expect(h.get().vs).toContain('genitive');
    expect(h.get().gc).toBe(1);
    expect(h.awards[0]).toEqual([40, false, 'grammar']);
    expect(markQuest).toHaveBeenCalledWith('grammar');
    expect(h.deltas[0]).toEqual({ gc: 1, vs: ['genitive'] });
  });

  it('effort: credits regardless of score (no total)', () => {
    const h = harness({ vs: [], sp: 0 });
    const r = completeExercise({
      key: 'speaking',
      xp: 20,
      stats: h.get(),
      setStats: h.setStats,
      writeDelta: h.writeDelta,
      award: h.award,
    });
    expect(r.passed).toBe(true);
    expect(h.get().vs).toContain('speaking');
    expect(h.get().sp).toBe(1);
    expect(h.awards[0]).toEqual([20, false, 'speaking']);
  });

  it('passive: credits on call', () => {
    const h = harness({ vs: [], lc: 0 });
    const r = completeExercise({
      key: 'alphabet',
      xp: 10,
      stats: h.get(),
      setStats: h.setStats,
      writeDelta: h.writeDelta,
      award: h.award,
    });
    expect(r.passed).toBe(true);
    expect(h.get().vs).toContain('alphabet');
    expect(h.get().lc).toBe(1);
  });

  it('idempotent: second call does not double-credit', () => {
    const h = harness({ vs: ['genitive'], gc: 1 });
    completeExercise({
      key: 'genitive',
      score: 10,
      total: 10,
      xp: 50,
      stats: h.get(),
      setStats: h.setStats,
      writeDelta: h.writeDelta,
      award: h.award,
    });
    expect(h.get().gc).toBe(1);
    expect(h.deltas).toHaveLength(0);
    expect(h.awards).toHaveLength(0);
  });

  // ── Today's Session must advance on FINISH, not only on a pass ──────────────
  // Regression: a learner who finished a gated drill (e.g. genitive) below 75%
  // got no award() — so the session-completion signal never fired and the daily
  // session stranded on that activity ("genitive continues to gate progress").
  describe("Today's Session advance signal", () => {
    beforeEach(() => sessionStorage.clear());

    it('writes nh_session_completed when a gated drill is FAILED but a session is active', () => {
      sessionStorage.setItem('nh_session_started', 'genitivedrill');
      const h = harness({ vs: [], gc: 0 });
      const r = completeExercise({
        key: 'genitive',
        score: 4,
        total: 10, // < 75% → not credited
        xp: 20,
        stats: h.get(),
        setStats: h.setStats,
        writeDelta: h.writeDelta,
        award: h.award,
      });
      // Credit is still gated (no pass) ...
      expect(r.passed).toBe(false);
      expect(h.get().gc).toBe(0);
      expect(h.awards).toHaveLength(0);
      // ... but the session advances: the active activity is marked finished.
      expect(sessionStorage.getItem('nh_session_completed')).toBe('genitivedrill');
    });

    it('also advances the session when the drill is passed', () => {
      sessionStorage.setItem('nh_session_started', 'genitivedrill');
      const h = harness({ vs: [], gc: 0 });
      completeExercise({
        key: 'genitive',
        score: 9,
        total: 10,
        xp: 45,
        stats: h.get(),
        setStats: h.setStats,
        writeDelta: h.writeDelta,
        award: h.award,
      });
      expect(sessionStorage.getItem('nh_session_completed')).toBe('genitivedrill');
    });

    it('is a no-op outside the daily session (no nh_session_started)', () => {
      const h = harness({ vs: [], gc: 0 });
      completeExercise({
        key: 'genitive',
        score: 4,
        total: 10,
        xp: 20,
        stats: h.get(),
        setStats: h.setStats,
        writeDelta: h.writeDelta,
        award: h.award,
      });
      expect(sessionStorage.getItem('nh_session_completed')).toBeNull();
    });
  });

  it('unknown key defaults to gated (safe default)', () => {
    const h = harness({ vs: [], gc: 0 });
    const r = completeExercise({
      key: 'totally-new-screen',
      score: 1,
      total: 10,
      xp: 5,
      stats: h.get(),
      setStats: h.setStats,
      writeDelta: h.writeDelta,
      award: h.award,
    });
    expect(r.passed).toBe(false);
    expect(h.get().vs ?? []).not.toContain('totally-new-screen');
  });
});
