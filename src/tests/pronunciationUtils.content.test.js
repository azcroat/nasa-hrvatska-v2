// Content-correctness test for PHONEME_GUIDES in pronunciationUtils.js.
// Guards against diacritic typos in the canonical phoneme guide data.

import { describe, it, expect } from 'vitest';
import { PHONEME_GUIDES } from '../components/shared/pronunciationUtils.js';

describe('PHONEME_GUIDES content correctness', () => {
  it('č example contains noć (not the typo noč)', () => {
    const cEntry = PHONEME_GUIDES['č'];
    expect(cEntry).toBeDefined();
    // The correct word is "noć" (with ć — soft palatal affricate).
    // "noč" with č is a misspelling and must NOT appear in the canonical guide.
    expect(cEntry.example).not.toContain('noč');
    expect(cEntry.example).toContain('noć');
  });

  it('every PHONEME_GUIDES entry has the required fields', () => {
    for (const [phoneme, guide] of Object.entries(PHONEME_GUIDES)) {
      expect(typeof guide.ipa, `${phoneme}.ipa`).toBe('string');
      expect(guide.ipa.length, `${phoneme}.ipa non-empty`).toBeGreaterThan(0);
      expect(typeof guide.example, `${phoneme}.example`).toBe('string');
      expect(guide.example.length, `${phoneme}.example non-empty`).toBeGreaterThan(0);
    }
  });

  it('ć example contains noć (canonical ć word)', () => {
    const cacEntry = PHONEME_GUIDES['ć'];
    expect(cacEntry).toBeDefined();
    expect(cacEntry.example).toContain('noć');
  });
});
