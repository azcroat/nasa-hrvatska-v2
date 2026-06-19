import { describe, it, expect } from 'vitest';
import { buildExercises } from '../practice/exerciseCatalog';
import { PLACES, GRAD_EXTRAS, PLACE_ASSIGNMENTS } from './places';

const noop = () => {};
const goNoop = () => () => {};
// Stub deps so buildExercises runs without app context.
const exercises = buildExercises({
  go: goNoop,
  setScr: noop,
  sCurEx: noop,
  startPitchAccent: noop,
  startShadowing: noop,
  startReview: noop,
  startAspectDrill: noop,
});
const catalogIds = exercises.map((e) => e.id);
const PLACE_IDS = PLACES.map((p) => p.id);
const BUCKETS = [...PLACE_IDS, 'today'];

describe('Grad place registry', () => {
  it('has six places, each with a valid host or null', () => {
    expect(PLACES).toHaveLength(6);
    const valid = ['baka', 'ana', 'kovac', 'ivo', 'marko', null];
    for (const p of PLACES) expect(valid).toContain(p.host);
  });

  it('every catalog exercise is assigned to exactly one bucket', () => {
    const missing = catalogIds.filter((id) => !PLACE_ASSIGNMENTS[id]);
    expect(missing).toEqual([]); // no orphans
  });

  it('has no stale assignment keys (every key is a real catalog id)', () => {
    const stale = Object.keys(PLACE_ASSIGNMENTS).filter((id) => !catalogIds.includes(id));
    expect(stale).toEqual([]);
  });

  it('assigns every exercise to a known bucket and valid subgroup', () => {
    for (const [, a] of Object.entries(PLACE_ASSIGNMENTS)) {
      expect(BUCKETS).toContain(a.place);
      const place = PLACES.find((p) => p.id === a.place);
      if (a.subgroup) {
        expect(place?.subgroups?.map((s) => s.key)).toContain(a.subgroup);
      }
    }
  });

  it('extras are non-catalog ids assigned to real places', () => {
    for (const x of GRAD_EXTRAS) {
      expect(catalogIds).not.toContain(x.id);
      expect(PLACE_IDS).toContain(x.place);
    }
  });

  it('coverage parity: assignments + extras cover the full known surface', () => {
    const covered = new Set([...Object.keys(PLACE_ASSIGNMENTS), ...GRAD_EXTRAS.map((x) => x.id)]);
    for (const id of catalogIds) expect(covered.has(id)).toBe(true);
  });
});

import { itemsForPlace, placeStats, recommendedVisit } from './gradModel';

function ctx(overrides = {}) {
  return {
    exercises,
    extras: {
      quiz: noop,
      flash: noop,
      match: noop,
      listen: noop,
      speaking: noop,
      scr: () => noop,
    },
    userCefr: 'B2',
    recs: { dueReviews: 0, weakCount: 0, isNewUser: false, userGoal: null },
    queue: [],
    ...overrides,
  };
}

describe('gradModel', () => {
  it("itemsForPlace returns only that place's items (catalog + extras)", () => {
    const kavana = itemsForPlace('kavana', ctx());
    const ids = kavana.map((i) => i.id);
    expect(ids).toContain('restaurant'); // catalog
    expect(ids).toContain('speaking'); // extra
    expect(ids).not.toContain('grammarmap'); // belongs to soba
  });

  it('marks CEFR-locked items locked but still includes them', () => {
    const soba = itemsForPlace('soba', ctx({ userCefr: 'A1' }));
    // 'future' has a standard CEFR (B1) so it locks at A1. (Non-standard tags
    // like 'B1+' fail-open in isUnlocked, so they would not be a valid probe.)
    const future = soba.find((i) => i.id === 'future');
    expect(future).toBeDefined();
    expect(future?.locked).toBe(true);
  });

  it('placeStats counts totals and locked', () => {
    const s = placeStats('kuhinja', ctx({ userCefr: 'A1' }));
    expect(s.total).toBeGreaterThan(0);
    expect(s.lockedCount).toBeGreaterThanOrEqual(0);
  });

  it('recommendedVisit prefers SRS-due, else falls back to a free-day visit', () => {
    const due = recommendedVisit(
      ctx({ recs: { dueReviews: 6, weakCount: 0, isNewUser: false, userGoal: null } }),
    );
    expect(due.exerciseId).toBe('srsreview');
    const free = recommendedVisit(ctx()); // nothing due
    expect(free.exerciseId).toBeTruthy();
    expect(typeof free.launch).toBe('function');
  });
});
