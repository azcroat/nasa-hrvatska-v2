import { describe, it, expect, beforeEach } from 'vitest';
import { signalSessionCompleteIfActive } from '../lib/sessionSignal';

beforeEach(() => sessionStorage.clear());

describe('signalSessionCompleteIfActive — screen-accurate form', () => {
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

  it('advances a conjugation activity by passing its own screen id', () => {
    // The conjugation drill knows its screen is 'conjpractice' even though its
    // curEx is decorated 'conjpractice:<cat>'.
    sessionStorage.setItem('nh_session_started', 'conjpractice');
    signalSessionCompleteIfActive('conjpractice');
    expect(sessionStorage.getItem('nh_session_completed')).toBe('conjpractice');
  });
});

describe('signalSessionCompleteIfActive — no-arg form (completeExercise)', () => {
  it('completes whatever activity is launched (key may differ from screen)', () => {
    // completeExercise knows key 'genitive' but the launched screen is
    // 'genitivedrill'; the no-arg form advances by the launched screen itself.
    sessionStorage.setItem('nh_session_started', 'genitivedrill');
    signalSessionCompleteIfActive();
    expect(sessionStorage.getItem('nh_session_completed')).toBe('genitivedrill');
  });

  it('is a no-op outside the daily session (no launched activity)', () => {
    signalSessionCompleteIfActive();
    expect(sessionStorage.getItem('nh_session_completed')).toBeNull();
  });

  it('REGRESSION: cannot complete an activity abandoned via tab-away (started cleared)', () => {
    // App.tsx setTab clears nh_session_started when the user leaves the Today
    // tab, so a later unrelated Practice drill finishing must NOT falsely
    // complete the abandoned session activity.
    sessionStorage.setItem('nh_session_started', 'genitivedrill'); // launched
    sessionStorage.removeItem('nh_session_started'); // tab-away cleared it
    signalSessionCompleteIfActive(); // unrelated drill finishes
    expect(sessionStorage.getItem('nh_session_completed')).toBeNull();
  });
});
