import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { knightFlash } from '../lib/knightSpeak';

describe('knightFlash', () => {
  let events: CustomEvent[] = [];
  let handler: (e: Event) => void;

  beforeEach(() => {
    events = [];
    handler = (e: Event) => events.push(e as CustomEvent);
    window.addEventListener('knight:flash', handler);
  });

  afterEach(() => {
    window.removeEventListener('knight:flash', handler);
  });

  it('dispatches knight:flash with correct mood and default duration', () => {
    knightFlash('oops');
    expect(events).toHaveLength(1);
    expect(events[0].detail.mood).toBe('oops');
    expect(events[0].detail.durationMs).toBe(1800);
  });

  it('dispatches knight:flash with custom duration', () => {
    knightFlash('onfire', 2000);
    expect(events).toHaveLength(1);
    expect(events[0].detail.durationMs).toBe(2000);
  });
});
