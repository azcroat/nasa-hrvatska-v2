import { describe, it, expect } from 'vitest';
import { evalCk, type CkRule, type Stats } from '../learnPathRules';

const emptyStats: Stats = { ct: [], vs: [], lc: 0, gc: 0, xp: 0, sp: 0 };

describe('evalCk — leaf shapes', () => {
  it('ctIncludes — true when stats.ct has the topic', () => {
    const rule: CkRule = { anyOf: [{ ctIncludes: 'greetings' }] };
    expect(evalCk(rule, { ...emptyStats, ct: ['greetings'] })).toBe(true);
  });

  it('ctIncludes — false when missing', () => {
    const rule: CkRule = { anyOf: [{ ctIncludes: 'greetings' }] };
    expect(evalCk(rule, { ...emptyStats, ct: ['numbers'] })).toBe(false);
  });

  it('vsIncludes — true when stats.vs has the screen', () => {
    const rule: CkRule = { anyOf: [{ vsIncludes: 'listening' }] };
    expect(evalCk(rule, { ...emptyStats, vs: ['listening'] })).toBe(true);
  });

  it('lcAtLeast — meets and exceeds', () => {
    const rule: CkRule = { anyOf: [{ lcAtLeast: 5 }] };
    expect(evalCk(rule, { ...emptyStats, lc: 5 })).toBe(true);
    expect(evalCk(rule, { ...emptyStats, lc: 6 })).toBe(true);
    expect(evalCk(rule, { ...emptyStats, lc: 4 })).toBe(false);
  });

  it('gcAtLeast — meets and below', () => {
    const rule: CkRule = { anyOf: [{ gcAtLeast: 8 }] };
    expect(evalCk(rule, { ...emptyStats, gc: 8 })).toBe(true);
    expect(evalCk(rule, { ...emptyStats, gc: 7 })).toBe(false);
  });

  it('xpAtLeast — meets and below', () => {
    const rule: CkRule = { anyOf: [{ xpAtLeast: 2000 }] };
    expect(evalCk(rule, { ...emptyStats, xp: 2000 })).toBe(true);
    expect(evalCk(rule, { ...emptyStats, xp: 1999 })).toBe(false);
  });

  it('spAtLeast — meets and below', () => {
    const rule: CkRule = { anyOf: [{ spAtLeast: 10 }] };
    expect(evalCk(rule, { ...emptyStats, sp: 10 })).toBe(true);
    expect(evalCk(rule, { ...emptyStats, sp: 3 })).toBe(false);
  });
});

describe('evalCk — combinators', () => {
  it('anyOf — true if any leaf matches', () => {
    const rule: CkRule = { anyOf: [{ ctIncludes: 'greetings' }, { lcAtLeast: 5 }] };
    expect(evalCk(rule, { ...emptyStats, lc: 10 })).toBe(true);
    expect(evalCk(rule, { ...emptyStats, ct: ['greetings'] })).toBe(true);
  });

  it('anyOf — false if no leaf matches', () => {
    const rule: CkRule = { anyOf: [{ ctIncludes: 'greetings' }, { lcAtLeast: 5 }] };
    expect(evalCk(rule, emptyStats)).toBe(false);
  });

  it('allOf — true only when every leaf matches', () => {
    const rule: CkRule = { allOf: [{ lcAtLeast: 40 }, { gcAtLeast: 8 }] };
    expect(evalCk(rule, { ...emptyStats, lc: 40, gc: 8 })).toBe(true);
    expect(evalCk(rule, { ...emptyStats, lc: 40, gc: 7 })).toBe(false);
    expect(evalCk(rule, { ...emptyStats, lc: 39, gc: 8 })).toBe(false);
  });

  it('anyOf containing allOf — the lp66 shape', () => {
    // (s.vs.includes('lp66')) || s.xp >= 2000 || (s.lc >= 40 && s.gc >= 8)
    const rule: CkRule = {
      anyOf: [
        { vsIncludes: 'lp66' },
        { xpAtLeast: 2000 },
        { allOf: [{ lcAtLeast: 40 }, { gcAtLeast: 8 }] },
      ],
    };
    expect(evalCk(rule, { ...emptyStats, vs: ['lp66'] })).toBe(true);
    expect(evalCk(rule, { ...emptyStats, xp: 2500 })).toBe(true);
    expect(evalCk(rule, { ...emptyStats, lc: 40, gc: 8 })).toBe(true);
    expect(evalCk(rule, { ...emptyStats, lc: 40, gc: 7 })).toBe(false);
    expect(evalCk(rule, { ...emptyStats, lc: 39, gc: 9, xp: 100 })).toBe(false);
  });

  it('multi-vsIncludes anyOf — the lp70 shape', () => {
    // (s.vs.includes('lp70') || s.vs.includes('pitchaccent')) || s.xp >= 2500
    const rule: CkRule = {
      anyOf: [{ vsIncludes: 'lp70' }, { vsIncludes: 'pitchaccent' }, { xpAtLeast: 2500 }],
    };
    expect(evalCk(rule, { ...emptyStats, vs: ['pitchaccent'] })).toBe(true);
    expect(evalCk(rule, { ...emptyStats, vs: ['lp70'] })).toBe(true);
    expect(evalCk(rule, { ...emptyStats, xp: 2500 })).toBe(true);
    expect(evalCk(rule, emptyStats)).toBe(false);
  });
});

describe('evalCk — edge cases', () => {
  it('undefined rule → false', () => {
    expect(evalCk(undefined, emptyStats)).toBe(false);
  });

  it('null rule → false', () => {
    expect(evalCk(null as unknown as CkRule, emptyStats)).toBe(false);
  });

  it('unknown leaf kind → false (forward-compat)', () => {
    const rule = { anyOf: [{ unknownLeaf: 'x' }] } as unknown as CkRule;
    expect(evalCk(rule, emptyStats)).toBe(false);
  });

  it('missing stats arrays handled — undefined ct', () => {
    const rule: CkRule = { anyOf: [{ ctIncludes: 'greetings' }] };
    const stats = { lc: 0 } as unknown as Stats;
    expect(evalCk(rule, stats)).toBe(false);
  });

  it('missing stats number handled — undefined gc', () => {
    const rule: CkRule = { anyOf: [{ gcAtLeast: 5 }] };
    const stats = { lc: 0 } as unknown as Stats;
    expect(evalCk(rule, stats)).toBe(false);
  });
});
