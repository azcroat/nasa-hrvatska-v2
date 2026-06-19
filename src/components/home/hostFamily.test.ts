import { describe, it, expect } from 'vitest';
import { hostOfDay, HOST_WELCOME, HOST_NAME } from './hostFamily';
import { ALL_CHARACTERS } from '../family/portraits';

describe('hostFamily', () => {
  it('rotates through all five cast members and wraps (incl. negatives)', () => {
    const five = [0, 1, 2, 3, 4].map(hostOfDay);
    expect(new Set(five).size).toBe(5);
    expect(hostOfDay(5)).toBe(hostOfDay(0));
    expect(hostOfDay(-1)).toBe(hostOfDay(4));
  });

  it('has a complete welcome (hr/en/.webp scene) + display name for every character', () => {
    for (const c of ALL_CHARACTERS) {
      expect(HOST_WELCOME[c].hr.length).toBeGreaterThan(0);
      expect(HOST_WELCOME[c].en.length).toBeGreaterThan(0);
      expect(HOST_WELCOME[c].scene).toMatch(/\.webp$/);
      expect(HOST_NAME[c].length).toBeGreaterThan(0);
    }
  });
});
