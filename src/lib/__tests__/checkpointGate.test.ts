// src/lib/__tests__/checkpointGate.test.ts
import { describe, it, expect } from 'vitest';
import { shouldShowCheckpoint } from '../checkpointSchedule.js';

const base = { syncReady: true, authScreen: 'app', currentScreen: 'dashboard', due: true };

describe('shouldShowCheckpoint', () => {
  it('shows when synced, in-app, on a safe screen, and due', () => {
    expect(shouldShowCheckpoint(base)).toBe(true);
  });
  it('never shows before syncReady (cross-device safety)', () => {
    expect(shouldShowCheckpoint({ ...base, syncReady: false })).toBe(false);
  });
  it('never shows mid-exercise (only safe screens)', () => {
    expect(shouldShowCheckpoint({ ...base, currentScreen: 'lesson' })).toBe(false);
  });
  it('never shows outside the app shell', () => {
    expect(shouldShowCheckpoint({ ...base, authScreen: 'welcome' })).toBe(false);
  });
  it('does not show when not due', () => {
    expect(shouldShowCheckpoint({ ...base, due: false })).toBe(false);
  });
});
