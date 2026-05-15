// src/tests/useDailySession.production.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { readMicState } from '../hooks/useDailySession';

describe('readMicState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns "unknown" when nh_mic_state is unset', () => {
    expect(readMicState()).toBe('unknown');
  });

  it('returns "available" when nh_mic_state is "available"', () => {
    localStorage.setItem('nh_mic_state', 'available');
    expect(readMicState()).toBe('available');
  });

  it('returns "denied" when nh_mic_state is "denied"', () => {
    localStorage.setItem('nh_mic_state', 'denied');
    expect(readMicState()).toBe('denied');
  });

  it('returns "unsupported" when nh_mic_state is "unsupported"', () => {
    localStorage.setItem('nh_mic_state', 'unsupported');
    expect(readMicState()).toBe('unsupported');
  });

  it('returns "unknown" for any unknown value (corruption / tampering)', () => {
    localStorage.setItem('nh_mic_state', 'pwned');
    expect(readMicState()).toBe('unknown');
  });
});
