// src/tests/testidsRegistry.test.js
import { describe, it, expect } from 'vitest';
import { TID } from '../../e2e/fixtures/testids.js';

// eslint-disable-next-line security/detect-unsafe-regex -- finite kebab-case ids, no ReDoS risk
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe('TID registry', () => {
  it('every entry is a non-empty kebab-case string or a function returning one', () => {
    for (const [key, value] of Object.entries(TID)) {
      if (typeof value === 'function') {
        const result = value('test');
        expect(typeof result).toBe('string');
        expect(KEBAB.test(result), `${key}('test') => "${result}" not kebab-case`).toBe(true);
      } else {
        expect(typeof value).toBe('string');
        expect(value.length, `${key} is empty`).toBeGreaterThan(0);
        expect(KEBAB.test(value), `${key}="${value}" not kebab-case`).toBe(true);
      }
    }
  });

  it('no duplicate static-string values across the registry', () => {
    const seen = new Map();
    for (const [key, value] of Object.entries(TID)) {
      if (typeof value === 'string') {
        if (seen.has(value)) {
          throw new Error(
            `Duplicate testid "${value}" — used by both ${seen.get(value)} and ${key}`,
          );
        }
        seen.set(value, key);
      }
    }
  });

  it('every id-fragment function returns a kebab-case string for several sample inputs', () => {
    const samples = [
      'writing',
      'speaking_sprint',
      'gs_a1_1',
      'B1',
      'B2',
      'C1',
      'good',
      'again',
      0,
      1,
      5,
    ];
    for (const [key, value] of Object.entries(TID)) {
      if (typeof value !== 'function') continue;
      for (const s of samples) {
        const out = value(s);
        expect(typeof out, `${key}(${s}) returned non-string`).toBe('string');
        expect(KEBAB.test(out), `${key}(${s}) => "${out}" not kebab-case`).toBe(true);
      }
    }
  });
});
