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

describe('expectedForms — imperative of -uj / -aj stems', () => {
  // a-em verbs whose present stem ends in vowel+j form the imperative without -i.
  const sudjelovati: ConjVerb = {
    ...base,
    inf: 'sudjelovati',
    klass: 'a-em',
    presentStem: 'sudjeluj',
  };
  const priznavati: ConjVerb = {
    ...base,
    inf: 'priznavati',
    klass: 'a-em',
    presentStem: 'priznaj',
  };
  // consonant-final stem still takes -i.
  const predlagati: ConjVerb = {
    ...base,
    inf: 'predlagati',
    klass: 'a-em',
    presentStem: 'predlaž',
  };

  it('vowel+j stem: no -i', () => {
    expect(expectedForms(sudjelovati, 'imperative')).toEqual([
      'sudjeluj',
      'sudjelujmo',
      'sudjelujte',
    ]);
    expect(expectedForms(priznavati, 'imperative')).toEqual(['priznaj', 'priznajmo', 'priznajte']);
  });
  it('consonant stem: keeps -i', () => {
    expect(expectedForms(predlagati, 'imperative')).toEqual([
      'predlaži',
      'predlažimo',
      'predlažite',
    ]);
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

// -jeti verbs have an irregular l-participle: voljeti → volio/voljela/voljelo (not voljeo).
const voljeti: ConjVerb = { ...base, inf: 'voljeti', klass: 'i-im' };

describe('expectedForms — -jeti participles', () => {
  it('present is regular i-im', () => {
    expect(expectedForms(voljeti, 'present')).toEqual([
      'volim',
      'voliš',
      'voli',
      'volimo',
      'volite',
      'vole',
    ]);
  });
  it('past uses -io / -jela / -jelo', () => {
    expect(expectedForms(voljeti, 'past')).toEqual({
      m: ['volio sam', 'volio si', 'volio je', 'voljeli smo', 'voljeli ste', 'voljeli su'],
      f: ['voljela sam', 'voljela si', 'voljela je', 'voljele smo', 'voljele ste', 'voljele su'],
      n: ['voljelo sam', 'voljelo si', 'voljelo je', 'voljela smo', 'voljela ste', 'voljela su'],
    });
  });
  it('conditional uses the -jeti participle', () => {
    expect(expectedForms(voljeti, 'conditional')).toEqual([
      'volio bih',
      'volio bi',
      'volio bi',
      'voljeli bismo',
      'voljeli biste',
      'voljeli bi',
    ]);
  });
  it('future elides -i', () => {
    expect((expectedForms(voljeti, 'future1') as string[])[0]).toBe('voljet ću');
  });
});
