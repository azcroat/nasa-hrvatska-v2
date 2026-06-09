import { describe, it, expect } from 'vitest';
import {
  levenshtein,
  similarityPct,
  normalizeCroatian,
  charOverlapPct,
} from '../lib/text/similarity';

describe('similarity util', () => {
  it('computes edit distance', () => {
    expect(levenshtein('kuca', 'kuća')).toBe(1);
  });
  it('normalizes Croatian diacritics', () => {
    expect(normalizeCroatian('ČĆŠŽĐ')).toBe('ccszd');
  });
  it('returns 100 for diacritic-only differences after normalization', () => {
    expect(similarityPct('kuca', 'kuća')).toBe(100);
  });
  it('returns 0 for empty input', () => {
    expect(similarityPct('', 'abc')).toBe(0);
  });

  // ── Pinning tests: PronunciationScorer.similarity semantics ──────────────────
  // OLD similarity(a,b): norm both sides (č/ć→c, š→s, ž→z, đ→d, strip punct, trim),
  // if equal → 100, else Math.round((1 - levenshtein(na,nb)/maxLen) * 100)
  describe('similarityPct — pins PronunciationScorer old similarity()', () => {
    it('identical strings → 100', () => {
      expect(similarityPct('kuća', 'kuća')).toBe(100);
    });
    it('diacritic mismatch normalizes to identical → 100', () => {
      expect(similarityPct('kuca', 'kuća')).toBe(100);
      expect(similarityPct('ČĆŠŽĐ'.toLowerCase(), normalizeCroatian('ČĆŠŽĐ'))).toBe(100);
    });
    it('different words → low score', () => {
      // "pas" vs "mačka": norm "pas"(3) vs "macka"(5); levenshtein=4, max=5 → round((1-4/5)*100)=20
      expect(similarityPct('pas', 'mačka')).toBe(20);
      // A truly zero-overlap case: "abc" vs "xyz" → dist=3, max=3 → 0
      expect(similarityPct('abc', 'xyz')).toBe(0);
    });
    it('one char off → expected score', () => {
      // "kuca" vs "kuca" already same → 100
      // "kuca" vs "kucanje": norm dist levenshtein("kuca","kucanje")=3, max=7 → round((1-3/7)*100)=57
      expect(similarityPct('kuca', 'kucanje')).toBe(57);
    });
    it('strips punctuation', () => {
      // "Dobro, jutro!" vs "dobro jutro" → norm "dobro jutro" vs "dobro jutro" → 100
      expect(similarityPct('Dobro, jutro!', 'dobro jutro')).toBe(100);
    });
    it('empty vs empty → 100 (both normalize to empty)', () => {
      expect(similarityPct('', '')).toBe(100);
    });
  });

  // ── Pinning tests: SpeakingScreen.textSimilarity semantics ──────────────────
  // OLD textSimilarity(a,b): lowercased+trimmed only (no diacritic strip),
  // shared = shorter chars present in longer / longer.length → 0..100
  describe('charOverlapPct — pins SpeakingScreen old textSimilarity()', () => {
    it('identical → 100', () => {
      expect(charOverlapPct('kuća', 'kuća')).toBe(100);
    });
    it('empty input → 0', () => {
      expect(charOverlapPct('', 'abc')).toBe(0);
      expect(charOverlapPct('abc', '')).toBe(0);
    });
    it('reproduces old textSimilarity: "pas" in "pasje"', () => {
      // longer="pasje"(5), shorter="pas"(3); "p","a","s" all in "pasje" → shared=3
      // score = round(3/5*100) = 60
      expect(charOverlapPct('pas', 'pasje')).toBe(60);
    });
    it('reproduces old textSimilarity: "auto" vs "brod"', () => {
      // longer="brod"(4), shorter="auto"(4) same len → longer = first = "auto"
      // shared: 'b' in "auto"? no; 'r' in "auto"? no; 'o' in "auto"? yes; 'd' in "auto"? no → shared=1
      // score = round(1/4*100) = 25
      expect(charOverlapPct('auto', 'brod')).toBe(25);
    });
    it('case-insensitive comparison', () => {
      expect(charOverlapPct('KUĆA', 'kuća')).toBe(100);
    });
  });

  // ── Pinning tests: SpeakingScreen.levenshteinClose semantics ────────────────
  // OLD levenshteinClose(a,b): char-overlap >= 0.6 (NOT edit distance — misleading name)
  // Equivalent to: charOverlapPct(a,b) >= 60
  describe('charOverlapPct >= 60 — pins SpeakingScreen old levenshteinClose()', () => {
    it('"pas" vs "pasje" → 60% → true (boundary)', () => {
      expect(charOverlapPct('pas', 'pasje') >= 60).toBe(true);
    });
    it('"pas" vs "mačka" → low overlap → false', () => {
      // "mačka"(5) longer, shorter="pas"(3); 'p'→no, 'a'→yes, 's'→no → shared=1, 20% < 60
      expect(charOverlapPct('pas', 'mačka') >= 60).toBe(false);
    });
    it('empty string → false (charOverlapPct returns 0)', () => {
      expect(charOverlapPct('', 'abc') >= 60).toBe(false);
    });
    it('old function: both empty or one empty — charOverlapPct(empty,empty)=0, so >=60 false', () => {
      // OLD levenshteinClose: if (!a || !b) return false → charOverlapPct('','')=0 >= 60 = false ✓
      expect(charOverlapPct('', '') >= 60).toBe(false);
    });
    it('longer.length === 0 edge → old returns true; note: can only occur with both empty (caught above)', () => {
      // OLD: if longer.length === 0 return true — but this only happens when both are empty,
      // which is already caught by !a||!b → false. So this branch is unreachable in the old code.
      // charOverlapPct('','') = 0, >= 60 = false. No divergence in practice.
      expect(charOverlapPct('', '') >= 60).toBe(false);
    });
  });

  // ── Additional levenshtein correctness ──────────────────────────────────────
  describe('levenshtein raw', () => {
    it('empty strings → 0', () => {
      expect(levenshtein('', '')).toBe(0);
    });
    it('one empty → length of other', () => {
      expect(levenshtein('', 'abc')).toBe(3);
      expect(levenshtein('abc', '')).toBe(3);
    });
    it('identical → 0', () => {
      expect(levenshtein('kuća', 'kuća')).toBe(0);
    });
    it('one substitution', () => {
      expect(levenshtein('cat', 'bat')).toBe(1);
    });
  });
});
