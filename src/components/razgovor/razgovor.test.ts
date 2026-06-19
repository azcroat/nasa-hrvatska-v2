import { describe, it, expect } from 'vitest';
import { PARTNERS, ALATI, MUST_NOT_ORPHAN, recommendedChat } from './partners';

const VALID_HOSTS = ['baka', 'ana', 'kovac', 'ivo', 'marko'];

function launchTargets() {
  const t = new Set<string>();
  for (const p of PARTNERS)
    for (const m of p.modes) t.add(m.launch === 'persona' ? 'maja' : m.scr!);
  for (const a of ALATI) t.add(a.scr);
  return t;
}

describe('Razgovor partners registry', () => {
  it('has five partners with valid hosts and >=1 mode', () => {
    expect(PARTNERS).toHaveLength(5);
    for (const p of PARTNERS) {
      expect(VALID_HOSTS).toContain(p.host);
      expect(p.modes.length).toBeGreaterThan(0);
    }
  });

  it('every persona mode names a persona key', () => {
    for (const p of PARTNERS)
      for (const m of p.modes) if (m.launch === 'persona') expect(typeof m.persona).toBe('string');
  });

  it('covers every must-not-orphan entry point', () => {
    const t = launchTargets();
    const missing = MUST_NOT_ORPHAN.filter((id) => !t.has(id));
    expect(missing).toEqual([]);
  });

  it('recommendedChat wraps and returns a launchable mode', () => {
    const r0 = recommendedChat(0);
    expect(r0.partner).toBeTruthy();
    expect(r0.mode).toBeTruthy();
    expect(recommendedChat(5).partner.id).toBe(recommendedChat(0).partner.id);
  });
});
