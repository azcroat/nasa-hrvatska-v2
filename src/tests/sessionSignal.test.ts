import { describe, it, expect, beforeEach } from 'vitest';
import { signalSessionCompleteIfActive, markSessionActivityFinished } from '../lib/sessionSignal';

beforeEach(() => sessionStorage.clear());

describe('signalSessionCompleteIfActive', () => {
  it('writes completed only when the screen matches the launched activity', () => {
    sessionStorage.setItem('nh_session_started', 'review');
    signalSessionCompleteIfActive('review');
    expect(sessionStorage.getItem('nh_session_completed')).toBe('review');
  });

  it('is a no-op when the screen does not match', () => {
    sessionStorage.setItem('nh_session_started', 'review');
    signalSessionCompleteIfActive('cloze');
    expect(sessionStorage.getItem('nh_session_completed')).toBeNull();
  });
});

describe('markSessionActivityFinished', () => {
  it('marks the active launched activity finished regardless of which drill calls it', () => {
    // genitivedrill is launched; its completion authority uses key 'genitive'
    // (≠ screen), so a screen-name match would miss — this advances by the
    // launched screen itself.
    sessionStorage.setItem('nh_session_started', 'genitivedrill');
    markSessionActivityFinished();
    expect(sessionStorage.getItem('nh_session_completed')).toBe('genitivedrill');
  });

  it('advances a conjugation activity whose curEx is decorated (conjpractice:<cat>)', () => {
    sessionStorage.setItem('nh_session_started', 'conjpractice');
    markSessionActivityFinished();
    expect(sessionStorage.getItem('nh_session_completed')).toBe('conjpractice');
  });

  it('is a no-op outside the daily session', () => {
    markSessionActivityFinished();
    expect(sessionStorage.getItem('nh_session_completed')).toBeNull();
  });
});
