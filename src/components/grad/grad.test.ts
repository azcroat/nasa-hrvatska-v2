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
