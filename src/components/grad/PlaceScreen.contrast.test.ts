import { describe, it, expect } from 'vitest';
import { LOCK_PILL_FG, LOCK_PILL_BG } from './PlaceScreen';

// WCAG 2.1 relative-luminance + contrast-ratio (https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio)
function srgbToLinear(channel: number): number {
  const s = channel / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

describe('PlaceScreen CEFR lock pill — WCAG contrast', () => {
  it('lock-pill text meets AA 4.5:1 on its background (10px bold = normal text)', () => {
    const ratio = contrastRatio(LOCK_PILL_FG, LOCK_PILL_BG);
    // Guard against regressing to the old #8a7f68 (3.09:1) or any future drop.
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('sanity-checks the helper against the known-bad previous colour', () => {
    // The old foreground failed AA — proves the test would have caught it.
    expect(contrastRatio('#8a7f68', LOCK_PILL_BG)).toBeLessThan(4.5);
  });
});
