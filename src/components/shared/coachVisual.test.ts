import { describe, it, expect } from 'vitest';
import { coachVisual } from './coachVisual';

const POSITIVE = ['encouraged', 'proud', 'happy', 'winking'];
const GOLD = ['celebrating', 'victory', 'levelup', 'onfire', 'tearsofjoy'];
const NEGATIVE = ['oops', 'sad', 'struggling', 'worried', 'droop'];

describe('coachVisual', () => {
  it('maps positive moods to a green ring + check glyph', () => {
    for (const m of POSITIVE) {
      const v = coachVisual(m);
      expect(v.klass).toBe('positive');
      expect(v.glyph).toBe('✓');
      expect(v.ring).toContain('linear-gradient');
    }
  });

  it('maps celebratory moods to a gold ring + star glyph', () => {
    for (const m of GOLD) {
      const v = coachVisual(m);
      expect(v.klass).toBe('positive');
      expect(v.glyph).toBe('★');
      expect(v.ring).toContain('#C8980A');
    }
  });

  it('maps negative moods to a red ring + cross glyph', () => {
    for (const m of NEGATIVE) {
      const v = coachVisual(m);
      expect(v.klass).toBe('negative');
      expect(v.glyph).toBe('✗');
    }
  });

  it('maps thinking to a purple ring + thought glyph', () => {
    const v = coachVisual('thinking');
    expect(v.klass).toBe('thinking');
    expect(v.glyph).toBe('💭');
  });

  it('maps idle/neutral and unknown moods to a teal ring + no glyph', () => {
    for (const m of ['ready', 'neutral', 'marching', 'glancing', 'totally-unknown', '']) {
      const v = coachVisual(m);
      expect(v.klass).toBe('idle');
      expect(v.glyph).toBeNull();
      expect(v.ring).toContain('#0e7490');
    }
  });
});
