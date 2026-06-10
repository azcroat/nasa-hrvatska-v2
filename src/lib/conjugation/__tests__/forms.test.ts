// src/lib/conjugation/__tests__/forms.test.ts
import { describe, it, expect } from 'vitest';
import { formFor } from '../forms';
import type { ConjVerb } from '../types';

const pisati: ConjVerb = {
  inf: 'pisati',
  en: 'to write',
  aspect: 'impf',
  pair: 'napisati',
  klass: 'a-em',
  cefr: 'A1',
  irregular: false,
  present: ['pišem', 'pišeš', 'piše', 'pišemo', 'pišete', 'pišu'],
  past: {
    m: ['pisao sam', 'pisao si', 'pisao je', 'pisali smo', 'pisali ste', 'pisali su'],
    f: ['pisala sam', 'pisala si', 'pisala je', 'pisale smo', 'pisale ste', 'pisale su'],
    n: ['pisalo sam', 'pisalo si', 'pisalo je', 'pisala smo', 'pisala ste', 'pisala su'],
  },
};

describe('formFor', () => {
  it('returns the present form by person', () => {
    expect(formFor(pisati, { inf: 'pisati', formType: 'present', personIdx: 0 })).toBe('pišem');
  });
  it('returns the gendered past form', () => {
    expect(formFor(pisati, { inf: 'pisati', formType: 'past', personIdx: 0, gender: 'f' })).toBe(
      'pisala sam',
    );
  });
  it('returns null when the form-type is not authored for the verb', () => {
    expect(formFor(pisati, { inf: 'pisati', formType: 'future1', personIdx: 0 })).toBeNull();
  });
});
