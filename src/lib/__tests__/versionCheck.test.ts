import { describe, it, expect } from 'vitest';
import { isStaleBuild } from '../versionCheck';

describe('isStaleBuild — seamless auto-update staleness check', () => {
  it('is STALE when the deployed build differs from the running build', () => {
    // The bug: a returning user boots an old cached bundle (running=old) while the
    // server has a new build (deployed=new). This MUST be detected as stale.
    expect(isStaleBuild('1780787589895', '1780784998512')).toBe(true);
  });

  it('is NOT stale when running build matches the deployed build', () => {
    expect(isStaleBuild('1780787589895', '1780787589895')).toBe(false);
  });

  it('compares as strings (number vs string ids are equal by value)', () => {
    expect(isStaleBuild(1780787589895, '1780787589895')).toBe(false);
    expect(isStaleBuild(1780787589895, '1780784998512')).toBe(true);
  });

  it('never reports stale when the deployed version is unknown (no false reload)', () => {
    expect(isStaleBuild(null, '1780787589895')).toBe(false);
    expect(isStaleBuild(undefined, '1780787589895')).toBe(false);
    expect(isStaleBuild('', '1780787589895')).toBe(false);
  });

  it('never reports stale when the running build is unknown', () => {
    expect(isStaleBuild('1780787589895', null)).toBe(false);
    expect(isStaleBuild('1780787589895', undefined)).toBe(false);
    expect(isStaleBuild('1780787589895', '')).toBe(false);
  });
});
