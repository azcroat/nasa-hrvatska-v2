import { describe, it, expect } from 'vitest';
import {
  DOORS,
  DOOR_ITEMS,
  MUST_NOT_ORPHAN,
  itemsForDoor,
  recommendedDaily,
  launchDoorItem,
} from './doors';

const VALID_HOSTS = ['baka', 'ana', 'kovac', 'ivo', 'marko'];
const DOOR_IDS = DOORS.map((d) => d.id);

describe('Hrvatska doors registry', () => {
  it('has five doors with valid hosts and a voice line', () => {
    expect(DOORS).toHaveLength(5);
    for (const d of DOORS) {
      expect(VALID_HOSTS).toContain(d.host);
      expect(d.voiceLine.hr.length).toBeGreaterThan(0);
      expect(d.voiceLine.en.length).toBeGreaterThan(0);
    }
  });

  it('every item belongs to a real door', () => {
    for (const it of DOOR_ITEMS) expect(DOOR_IDS).toContain(it.doorId);
  });

  it('covers every must-not-orphan entry point', () => {
    const ids = new Set(DOOR_ITEMS.map((i) => i.id));
    const missing = MUST_NOT_ORPHAN.filter((id) => !ids.has(id));
    expect(missing).toEqual([]);
  });

  it('has no stale items (every item id is a must-not-orphan id)', () => {
    const required = new Set(MUST_NOT_ORPHAN);
    const stale = DOOR_ITEMS.filter((i) => !required.has(i.id)).map((i) => i.id);
    expect(stale).toEqual([]);
  });

  it('has no duplicate item ids', () => {
    const ids = DOOR_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('itemsForDoor returns only that door’s items', () => {
    const krajevi = itemsForDoor('krajevi');
    expect(krajevi.length).toBeGreaterThan(0);
    expect(krajevi.every((i) => i.doorId === 'krajevi')).toBe(true);
    expect(krajevi.map((i) => i.id)).toContain('crmap');
  });

  it('recommendedDaily wraps and never returns a seasonal item', () => {
    for (let d = 0; d < 12; d++) {
      const item = recommendedDaily(d);
      expect(item).toBeTruthy();
      expect(item.seasonal).toBeUndefined();
      expect(DOOR_ITEMS.find((i) => i.id === item.id)).toBeTruthy();
    }
    expect(recommendedDaily(0).id).toBe(recommendedDaily(4).id); // pool of 4 wraps
    expect(recommendedDaily(-1).id).toBe(recommendedDaily(3).id); // negative-safe
  });

  it('launchDoorItem sets curEx then navigates to the screen id', () => {
    const calls: string[] = [];
    launchDoorItem(
      { id: 'crmap' },
      { setScr: (s) => calls.push('scr:' + s), sCurEx: (e) => calls.push('ex:' + e) },
    );
    expect(calls).toEqual(['ex:crmap', 'scr:crmap']);
  });

  it('the two embed doors are declared', () => {
    expect(DOORS.find((d) => d.id === 'price')?.embeds).toBe('stories');
    expect(DOORS.find((d) => d.id === 'mediji')?.embeds).toBe('media');
  });
});
