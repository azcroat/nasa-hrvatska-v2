import { describe, it, expect } from 'vitest';
import { expectedForms } from '../morphology';
import type { ConjVerb } from '../types';

const base = { en: '', aspect: 'impf' as const, pair: null, cefr: 'A1' as const, irregular: false };

const citati: ConjVerb = { ...base, inf: 'čitati', klass: 'a-am' };
const govoriti: ConjVerb = { ...base, inf: 'govoriti', klass: 'i-im' };
const pisati: ConjVerb = { ...base, inf: 'pisati', klass: 'a-em', presentStem: 'piš' };
const biti: ConjVerb = { ...base, inf: 'biti', klass: 'irr', irregular: true };

describe('expectedForms — present', () => {
  it('a-am', () => {
    expect(expectedForms(citati, 'present')).toEqual([
      'čitam',
      'čitaš',
      'čita',
      'čitamo',
      'čitate',
      'čitaju',
    ]);
  });
  it('i-im', () => {
    expect(expectedForms(govoriti, 'present')).toEqual([
      'govorim',
      'govoriš',
      'govori',
      'govorimo',
      'govorite',
      'govore',
    ]);
  });
  it('a-em uses presentStem', () => {
    expect(expectedForms(pisati, 'present')).toEqual([
      'pišem',
      'pišeš',
      'piše',
      'pišemo',
      'pišete',
      'pišu',
    ]);
  });
  it('a-em without presentStem → null', () => {
    expect(expectedForms({ ...pisati, presentStem: undefined }, 'present')).toBeNull();
  });
  it('irr → null', () => {
    expect(expectedForms(biti, 'present')).toBeNull();
  });
});

describe('expectedForms — future1', () => {
  it('-ti elision', () => {
    expect(expectedForms(citati, 'future1')).toEqual([
      'čitat ću',
      'čitat ćeš',
      'čitat će',
      'čitat ćemo',
      'čitat ćete',
      'čitat će',
    ]);
  });
});

describe('expectedForms — past (gendered)', () => {
  it('regular -ati participle', () => {
    expect(expectedForms(citati, 'past')).toEqual({
      m: ['čitao sam', 'čitao si', 'čitao je', 'čitali smo', 'čitali ste', 'čitali su'],
      f: ['čitala sam', 'čitala si', 'čitala je', 'čitale smo', 'čitale ste', 'čitale su'],
      n: ['čitalo sam', 'čitalo si', 'čitalo je', 'čitala smo', 'čitala ste', 'čitala su'],
    });
  });
  it('regular -iti participle', () => {
    expect((expectedForms(govoriti, 'past') as { m: string[] }).m[0]).toBe('govorio sam');
  });
});

describe('expectedForms — imperative', () => {
  it('a-am', () => {
    expect(expectedForms(citati, 'imperative')).toEqual(['čitaj', 'čitajmo', 'čitajte']);
  });
  it('i-im', () => {
    expect(expectedForms(govoriti, 'imperative')).toEqual(['govori', 'govorimo', 'govorite']);
  });
  it('a-em', () => {
    expect(expectedForms(pisati, 'imperative')).toEqual(['piši', 'pišimo', 'pišite']);
  });
});

describe('expectedForms — conditional', () => {
  it('participle + bih', () => {
    expect(expectedForms(citati, 'conditional')).toEqual([
      'čitao bih',
      'čitao bi',
      'čitao bi',
      'čitali bismo',
      'čitali biste',
      'čitali bi',
    ]);
  });
});
