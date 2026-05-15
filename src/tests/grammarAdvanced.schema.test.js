// src/tests/grammarAdvanced.schema.test.js
import { describe, it, expect } from 'vitest';
import { ADVANCED_UNITS } from '../data/grammar-advanced.js';

describe('grammar-advanced.js schema', () => {
  it('all units have required top-level fields', () => {
    for (const u of ADVANCED_UNITS) {
      expect(u.id, `unit missing id`).toBeTruthy();
      expect(u.cefr, `${u.id} missing cefr`).toMatch(/^(B2|C1)$/);
      expect(u.title, `${u.id} missing title`).toBeTruthy();
      expect(u.subtitle, `${u.id} missing subtitle`).toBeTruthy();
      expect(u.focus, `${u.id} missing focus`).toBeTruthy();
      expect(u.intro, `${u.id} missing intro`).toBeTruthy();
      expect(Array.isArray(u.forms), `${u.id} forms not array`).toBe(true);
      expect(Array.isArray(u.examples), `${u.id} examples not array`).toBe(true);
      expect(Array.isArray(u.tips), `${u.id} tips not array`).toBe(true);
      expect(Array.isArray(u.drills), `${u.id} drills not array`).toBe(true);
    }
  });

  it('each id is a kebab-case slug, unique across the set', () => {
    const ids = new Set();
    // eslint-disable-next-line security/detect-unsafe-regex -- anchored kebab-case slug with disjoint separator; bounded input
    const slugRe = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    for (const u of ADVANCED_UNITS) {
      expect(slugRe.test(u.id), `${u.id} not kebab-case`).toBe(true);
      expect(ids.has(u.id), `duplicate id ${u.id}`).toBe(false);
      ids.add(u.id);
    }
  });

  it('every cefr value is exactly B2 or C1', () => {
    for (const u of ADVANCED_UNITS) {
      expect(['B2', 'C1']).toContain(u.cefr);
    }
  });

  it('each unit meets quality floor: 6+ forms, 5+ examples, 3+ tips, 5+ drills', () => {
    for (const u of ADVANCED_UNITS) {
      expect(u.forms.length, `${u.id} <6 forms`).toBeGreaterThanOrEqual(6);
      expect(u.examples.length, `${u.id} <5 examples`).toBeGreaterThanOrEqual(5);
      expect(u.tips.length, `${u.id} <3 tips`).toBeGreaterThanOrEqual(3);
      expect(u.drills.length, `${u.id} <5 drills`).toBeGreaterThanOrEqual(5);
    }
  });

  it('every form has label + hr (en optional)', () => {
    for (const u of ADVANCED_UNITS) {
      for (const f of u.forms) {
        expect(f.label, `${u.id} form missing label`).toBeTruthy();
        expect(f.hr, `${u.id} form missing hr`).toBeTruthy();
      }
    }
  });

  it('every example has hr + en', () => {
    for (const u of ADVANCED_UNITS) {
      for (const e of u.examples) {
        expect(e.hr, `${u.id} example missing hr`).toBeTruthy();
        expect(e.en, `${u.id} example missing en`).toBeTruthy();
      }
    }
  });

  it('every tip is a non-empty string', () => {
    for (const u of ADVANCED_UNITS) {
      for (const t of u.tips) {
        expect(typeof t).toBe('string');
        expect(t.length).toBeGreaterThan(0);
      }
    }
  });

  it('every drill has q, opts (length 4), correct', () => {
    for (const u of ADVANCED_UNITS) {
      for (const d of u.drills) {
        expect(d.q, `${u.id} drill missing q`).toBeTruthy();
        expect(Array.isArray(d.opts), `${u.id} drill opts not array`).toBe(true);
        expect(d.opts.length, `${u.id} drill opts !=4`).toBe(4);
        expect(d.correct !== undefined, `${u.id} drill missing correct`).toBe(true);
      }
    }
  });

  it('when correct is a number, it points to a valid index in opts', () => {
    for (const u of ADVANCED_UNITS) {
      for (const d of u.drills) {
        if (typeof d.correct === 'number') {
          expect(d.correct).toBeGreaterThanOrEqual(0);
          expect(d.correct).toBeLessThan(d.opts.length);
        }
      }
    }
  });

  it('ADVANCED_UNITS has exactly 10 entries', () => {
    expect(ADVANCED_UNITS).toHaveLength(10);
  });

  it('exactly 5 B2 + 5 C1', () => {
    const b2 = ADVANCED_UNITS.filter((u) => u.cefr === 'B2');
    const c1 = ADVANCED_UNITS.filter((u) => u.cefr === 'C1');
    expect(b2).toHaveLength(5);
    expect(c1).toHaveLength(5);
  });

  it('no drill option string is empty', () => {
    for (const u of ADVANCED_UNITS) {
      for (const d of u.drills) {
        for (const o of d.opts) {
          expect(typeof o).toBe('string');
          expect(o.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
