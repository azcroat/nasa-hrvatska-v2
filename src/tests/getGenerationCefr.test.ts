// src/tests/getGenerationCefr.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { getGenerationCefr } from '../lib/cefrCertification';

// getUserCefr: total = xp + lc*15 + gc*25 → A1<300, A2<1200, B1<3500, B2<8000,
// C1<18000, C2 otherwise. With clean storage (no migration flag) the content-
// unlock level is the generous eligible level, so earned == getUserCefr(stats).

describe('getGenerationCefr', () => {
  beforeEach(() => localStorage.clear());

  it('returns the earned level when no placement is stored', () => {
    expect(getGenerationCefr({ xp: 0, lc: 0, gc: 0 })).toBe('A1');
    expect(getGenerationCefr({ xp: 10000, lc: 0, gc: 0 })).toBe('C1');
    expect(getGenerationCefr({ xp: 20000, lc: 0, gc: 0 })).toBe('C2');
  });

  it('floors at the stored placement level (never below what the user placed at)', () => {
    localStorage.setItem('nh_level', 'C1');
    expect(getGenerationCefr({ xp: 0, lc: 0, gc: 0 })).toBe('C1');
  });

  it('raises above a low placement when the learner has earned a higher level', () => {
    localStorage.setItem('nh_level', 'B1');
    // xp 10000 → C1 earned, above the B1 placement
    expect(getGenerationCefr({ xp: 10000, lc: 0, gc: 0 })).toBe('C1');
  });

  it('takes the higher of placement and earned in both directions', () => {
    localStorage.setItem('nh_level', 'C2');
    // placement C2 beats an earned C1
    expect(getGenerationCefr({ xp: 10000, lc: 0, gc: 0 })).toBe('C2');
    localStorage.setItem('nh_level', 'A2');
    // earned C2 beats an A2 placement
    expect(getGenerationCefr({ xp: 20000, lc: 0, gc: 0 })).toBe('C2');
  });

  it('ignores an invalid placement value and falls back to earned', () => {
    localStorage.setItem('nh_level', 'not-a-level');
    expect(getGenerationCefr({ xp: 20000, lc: 0, gc: 0 })).toBe('C2');
  });

  it('is case-insensitive about the stored placement', () => {
    localStorage.setItem('nh_level', 'c1');
    expect(getGenerationCefr({ xp: 0, lc: 0, gc: 0 })).toBe('C1');
  });

  it('tolerates missing/partial stats', () => {
    expect(getGenerationCefr(undefined)).toBe('A1');
    expect(getGenerationCefr({})).toBe('A1');
  });
});
