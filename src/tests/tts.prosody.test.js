// src/tests/tts.prosody.test.js
import { describe, it, expect, vi } from 'vitest';
vi.mock('../../functions/api/_requireAuth.js', () => ({
  requireAuthedAI: vi.fn(async () => ({
    ok: true,
    uid: 'u',
    origin: 'https://nasahrvatska.com',
    isDev: false,
  })),
}));
import { buildAzureSsml } from '../../functions/api/tts.js';

describe('buildAzureSsml prosody', () => {
  it('default: rate -8%, no pitch/contour', () => {
    const s = buildAzureSsml('grad', { slow: false });
    expect(s).toContain('rate="-8%"');
    expect(s).not.toContain('pitch=');
  });
  it('applies pitch + contour + rate when prosody given', () => {
    const s = buildAzureSsml('grad', {
      prosody: { pitch: '+15%', contour: '(0%,+20%) (100%,-10%)', rate: '-20%' },
    });
    expect(s).toContain('pitch="+15%"');
    expect(s).toContain('contour="(0%,+20%) (100%,-10%)"');
    expect(s).toContain('rate="-20%"');
  });
  it('escapes text and ignores non-whitelisted prosody values', () => {
    const s = buildAzureSsml('a<b', { prosody: { pitch: 'javascript:evil', rate: 'DROP TABLE' } });
    expect(s).toContain('a&lt;b');
    expect(s).not.toContain('evil');
    expect(s).not.toContain('DROP');
  });
});
