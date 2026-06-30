// src/tests/conversationLevel.test.ts
import { describe, it, expect } from 'vitest';
import {
  scenarioFitsLevel,
  sortScenariosByLevel,
  shouldShowAdvancedBridge,
} from '../lib/conversationLevel';

describe('scenarioFitsLevel', () => {
  it('is true when the scenario difficulty is at or below the learner level', () => {
    expect(scenarioFitsLevel('A1', 'B1')).toBe(true);
    expect(scenarioFitsLevel('B1', 'B1')).toBe(true);
  });
  it('is false when the scenario is above the learner level (a stretch)', () => {
    expect(scenarioFitsLevel('B2', 'B1')).toBe(false);
  });
  it('treats an untagged scenario as always available', () => {
    expect(scenarioFitsLevel(undefined, 'A1')).toBe(true);
  });
});

describe('sortScenariosByLevel', () => {
  const scenarios = [
    { id: 'a', difficulty: 'A1' },
    { id: 'b', difficulty: 'B2' }, // stretch for a B1 learner
    { id: 'c', difficulty: 'B1' },
    { id: 'd', difficulty: 'A2' },
  ];

  it('puts at/below-level scenarios before stretch scenarios', () => {
    const out = sortScenariosByLevel(scenarios, 'B1').map((s) => s.id);
    // B2 (stretch) must come last; the other three are at/below B1.
    expect(out[out.length - 1]).toBe('b');
  });

  it('orders at-level scenarios closest-to-level first', () => {
    const out = sortScenariosByLevel(scenarios, 'B1').map((s) => s.id);
    // closest to B1: c (B1) → d (A2) → a (A1) → then stretch b (B2)
    expect(out).toEqual(['c', 'd', 'a', 'b']);
  });

  it('does not mutate the input array', () => {
    const input = [...scenarios];
    sortScenariosByLevel(input, 'A2');
    expect(input.map((s) => s.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('is stable within a group (equal-distance ties keep original order)', () => {
    const eq = [
      { id: 'x', difficulty: 'B1' },
      { id: 'y', difficulty: 'B1' },
    ];
    expect(sortScenariosByLevel(eq, 'B1').map((s) => s.id)).toEqual(['x', 'y']);
  });
});

describe('shouldShowAdvancedBridge', () => {
  it('is hidden below B1', () => {
    expect(shouldShowAdvancedBridge('A1')).toBe(false);
    expect(shouldShowAdvancedBridge('A2')).toBe(false);
  });
  it('is shown from B1 upward', () => {
    for (const lv of ['B1', 'B2', 'C1', 'C2']) {
      expect(shouldShowAdvancedBridge(lv), lv).toBe(true);
    }
  });
});
