import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { markQuest } from '../lib/quests.js';
import { localDateStr } from '../lib/dateUtils.js';

function clearLS() { localStorage.clear(); }

function todayKey() {
  return localDateStr();
}

describe('quests — daily quest tracking', () => {
  beforeEach(clearLS);
  afterEach(() => { clearLS(); vi.useRealTimers(); });

  // ── markQuest basics ──────────────────────────────────────────────────────

  it('writes quest completion key with correct format', () => {
    const d = todayKey();
    markQuest('speak');
    expect(localStorage.getItem('nh_quest_speak_' + d)).toBe('1');
  });

  it('writes count key on first call', () => {
    const d = todayKey();
    markQuest('speak');
    expect(localStorage.getItem('nh_quest_speak_count_' + d)).toBe('1');
  });

  it('increments count on second call', () => {
    const d = todayKey();
    markQuest('speak');
    markQuest('speak');
    expect(localStorage.getItem('nh_quest_speak_count_' + d)).toBe('2');
  });

  it('does NOT auto-promote tier-2 on first call (count=0 before call)', () => {
    const d = todayKey();
    markQuest('speak');
    // tier2 should NOT be set — count was 0 before the call
    expect(localStorage.getItem('nh_quest_speak2_' + d)).toBeNull();
  });

  it('auto-promotes tier-2 on second call (count=1 before call)', () => {
    const d = todayKey();
    markQuest('speak'); // count goes 0→1
    markQuest('speak'); // count is 1 before this call → auto-promote
    expect(localStorage.getItem('nh_quest_speak2_' + d)).toBe('1');
  });

  it('auto-promotes grammar tier-2 on second call', () => {
    const d = todayKey();
    markQuest('grammar');
    markQuest('grammar');
    expect(localStorage.getItem('nh_quest_grammar2_' + d)).toBe('1');
  });

  it('auto-promotes master tier-2 on second call', () => {
    const d = todayKey();
    markQuest('master');
    markQuest('master');
    expect(localStorage.getItem('nh_quest_master2_' + d)).toBe('1');
  });

  it('auto-promotes reading tier-2 on second call', () => {
    const d = todayKey();
    markQuest('reading');
    markQuest('reading');
    expect(localStorage.getItem('nh_quest_reading2_' + d)).toBe('1');
  });

  it('culture tier-2 promotion after second completion', () => {
    const d = todayKey();
    markQuest('culture');
    markQuest('culture');
    // 'culture' IS in TIER2_MAP → culture2 promoted on second completion
    expect(localStorage.getItem('nh_quest_culture2_' + d)).toBe('1');
  });

  it('stores date key in YYYY-MM-DD format', () => {
    markQuest('speak');
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i));
    }
    const questKeys = keys.filter(k => k && k.startsWith('nh_quest_speak_') && !k.includes('count'));
    expect(questKeys).toHaveLength(1);
    expect(questKeys[0]).toMatch(/nh_quest_speak_\d{4}-\d{2}-\d{2}$/);
  });

  it('tier-2 also has correct date suffix', () => {
    const d = todayKey();
    markQuest('speak');
    markQuest('speak');
    const tier2Key = 'nh_quest_speak2_' + d;
    expect(localStorage.getItem(tier2Key)).toBe('1');
  });

  it('multiple different quest types work independently', () => {
    const d = todayKey();
    markQuest('speak');
    markQuest('grammar');
    expect(localStorage.getItem('nh_quest_speak_' + d)).toBe('1');
    expect(localStorage.getItem('nh_quest_grammar_' + d)).toBe('1');
    // Neither should trigger tier-2 (only called once each)
    expect(localStorage.getItem('nh_quest_speak2_' + d)).toBeNull();
    expect(localStorage.getItem('nh_quest_grammar2_' + d)).toBeNull();
  });

  it('does not throw with undefined id (edge case)', () => {
    expect(() => markQuest(undefined)).not.toThrow();
  });

  it('third call does not re-set tier-2 (already set, no error)', () => {
    const d = todayKey();
    markQuest('speak');
    markQuest('speak');
    markQuest('speak');
    // tier-2 is still '1' (idempotent set)
    expect(localStorage.getItem('nh_quest_speak2_' + d)).toBe('1');
    expect(localStorage.getItem('nh_quest_speak_count_' + d)).toBe('3');
  });

  // ── knight:quest-done event ───────────────────────────────────────────────

  it('dispatches knight:quest-done CustomEvent on every markQuest call', () => {
    const fired = [];
    const handler = (e) => fired.push(e.type);
    window.addEventListener('knight:quest-done', handler);
    markQuest('speak');
    markQuest('grammar');
    window.removeEventListener('knight:quest-done', handler);
    expect(fired).toHaveLength(2);
    expect(fired[0]).toBe('knight:quest-done');
  });

  it('knight:quest-done fires on second call (tier-2 promotion) too', () => {
    let count = 0;
    const handler = () => count++;
    window.addEventListener('knight:quest-done', handler);
    markQuest('speak'); // first call
    markQuest('speak'); // second call (also promotes tier-2)
    window.removeEventListener('knight:quest-done', handler);
    expect(count).toBe(2);
  });
});
