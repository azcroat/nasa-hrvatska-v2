import { describe, it, expect } from 'vitest';
import { EXERCISE_COMPLETION } from '../exerciseRegistry';

describe('EXERCISE_COMPLETION', () => {
  it('every entry has a non-empty vsKey and valid policy', () => {
    for (const [key, e] of Object.entries(EXERCISE_COMPLETION)) {
      expect(e.vsKey, key).toBeTruthy();
      expect(['gated', 'effort', 'passive'], key).toContain(e.policy.kind);
      expect(['lc', 'gc', 'sp', 'rc'], key).toContain(e.policy.statKind);
    }
  });

  it('vsKey defaults to the map key (no renames — preserves existing progress)', () => {
    for (const [key, e] of Object.entries(EXERCISE_COMPLETION)) {
      expect(e.vsKey, key).toBe(key);
    }
  });

  it('no two keys map to the same vsKey with conflicting policy kinds', () => {
    const byVs = new Map<string, Set<string>>();
    for (const e of Object.values(EXERCISE_COMPLETION)) {
      const s = byVs.get(e.vsKey) ?? new Set<string>();
      s.add(e.policy.kind);
      byVs.set(e.vsKey, s);
    }
    for (const [vs, kinds] of byVs) {
      expect(kinds.size, `${vs} has conflicting policies: ${[...kinds].join(',')}`).toBe(1);
    }
  });

  it('covers the lesson keys gated by PRs #36–#38', () => {
    for (const k of [
      'declension',
      'tenses',
      'conditional',
      'impersonal',
      'formalregister',
      'future_tense_lesson',
      'aspect',
      'wordform',
      'diminutives',
      'phonology',
    ]) {
      expect(EXERCISE_COMPLETION[k]?.policy.kind, k).toBe('gated');
    }
  });
});
