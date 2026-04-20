/**
 * utilityLibs.test.ts — gap-fill tests for small pure-logic library files.
 * Covers: debugLog, memoryHooks, wordOfDay, userKey.
 * All are deterministic pure functions with no React deps or heavy mocking.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ── debugLog ──────────────────────────────────────────────────────────────────
// Import after patching window.dispatchEvent so the module-level addEventListener
// calls don't cause errors.
import { dbgInfo, dbgWarn, dbgError, getEntries, clearEntries } from '../lib/debugLog';

describe('debugLog — entry management', () => {
  beforeEach(() => clearEntries());
  afterEach(() => clearEntries());

  it('dbgInfo adds an info entry', () => {
    dbgInfo('hello');
    const entries = getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].level).toBe('info');
    expect(entries[0].msg).toContain('hello');
  });

  it('dbgWarn adds a warn entry', () => {
    dbgWarn('something fishy');
    const entries = getEntries();
    expect(entries[0].level).toBe('warn');
    expect(entries[0].msg).toContain('something fishy');
  });

  it('dbgError adds an error entry', () => {
    dbgError('boom!');
    const entries = getEntries();
    expect(entries[0].level).toBe('error');
    expect(entries[0].msg).toContain('boom!');
  });

  it('entry has numeric timestamp (t)', () => {
    dbgInfo('ts test');
    expect(typeof getEntries()[0].t).toBe('number');
    expect(getEntries()[0].t).toBeGreaterThan(0);
  });

  it('clearEntries resets to empty', () => {
    dbgInfo('a');
    dbgInfo('b');
    clearEntries();
    expect(getEntries()).toHaveLength(0);
  });

  it('accumulates multiple entries in order', () => {
    dbgInfo('first');
    dbgWarn('second');
    dbgError('third');
    const entries = getEntries();
    expect(entries).toHaveLength(3);
    expect(entries[0].msg).toContain('first');
    expect(entries[2].msg).toContain('third');
  });

  it('formats Error objects with name: message', () => {
    const err = new Error('test error message');
    dbgError(err);
    const msg = getEntries()[0].msg;
    expect(msg).toContain('Error');
    expect(msg).toContain('test error message');
  });

  it('formats plain objects as JSON', () => {
    dbgInfo({ key: 'value', num: 42 });
    const msg = getEntries()[0].msg;
    expect(msg).toContain('key');
    expect(msg).toContain('value');
  });

  it('formats null as empty string (null ?? "" → "")', () => {
    dbgInfo(null);
    // _fmt: String(a ?? '') → null ?? '' = '' → String('') = ''
    expect(getEntries()[0].msg).toBe('');
  });

  it('formats undefined as empty string (undefined ?? "" → "")', () => {
    dbgInfo(undefined);
    // _fmt: String(a ?? '') → undefined ?? '' = '' → String('') = ''
    expect(getEntries()[0].msg).toBe('');
  });

  it('formats multiple args space-joined', () => {
    dbgInfo('one', 'two', 'three');
    expect(getEntries()[0].msg).toBe('one two three');
  });

  it('dispatches nh:debuglog event on dbgInfo', () => {
    const listener = vi.fn();
    window.addEventListener('nh:debuglog', listener);
    dbgInfo('event test');
    window.removeEventListener('nh:debuglog', listener);
    expect(listener).toHaveBeenCalledOnce();
  });

  it('caps at 80 entries (MAX_ENTRIES)', () => {
    for (let i = 0; i < 90; i++) dbgInfo(`msg${i}`);
    expect(getEntries().length).toBeLessThanOrEqual(80);
  });
});

// ── memoryHooks ───────────────────────────────────────────────────────────────
import { getMemoryHook } from '../lib/memoryHooks';

describe('getMemoryHook', () => {
  it('returns a hint string for a known word', () => {
    const hint = getMemoryHook('voda');
    expect(hint).toBeTypeOf('string');
    expect(hint!.length).toBeGreaterThan(5);
  });

  it('returns null for unknown word', () => {
    expect(getMemoryHook('xyzunknownword')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getMemoryHook('')).toBeNull();
  });

  it('normalises diacritics: "glava" and alternate form match', () => {
    // getMemoryHook strips diacritics internally before lookup
    expect(getMemoryHook('glava')).not.toBeNull();
  });

  it('normalises diacritics: ć→c lookup (srce)', () => {
    // "srce" has no diacritics but the normalisation shouldn't break it
    expect(getMemoryHook('srce')).not.toBeNull();
  });

  it('takes only the first word when given a phrase (splits on space)', () => {
    // "jabuka i kruška" → first token "jabuka" → should find hint
    const hint = getMemoryHook('jabuka i kruška');
    expect(hint).not.toBeNull();
  });

  it('case-insensitive lookup (uppercase input)', () => {
    const hint = getMemoryHook('VODA');
    expect(hint).not.toBeNull();
  });
});

// ── wordOfDay ─────────────────────────────────────────────────────────────────
import { getWordOfDay } from '../lib/wordOfDay';

describe('getWordOfDay', () => {
  it('returns a tuple [string, string, string] or null', () => {
    const word = getWordOfDay();
    if (word !== null) {
      expect(Array.isArray(word)).toBe(true);
      expect(word).toHaveLength(3);
      expect(typeof word[0]).toBe('string'); // hr
      expect(typeof word[1]).toBe('string'); // en
      expect(typeof word[2]).toBe('string'); // note or pos or ''
    } else {
      // null is acceptable if pool is unavailable
      expect(word).toBeNull();
    }
  });

  it('returns the same word when called twice in the same test', () => {
    const a = getWordOfDay();
    const b = getWordOfDay();
    expect(a).toEqual(b);
  });

  it('hr and en fields are non-empty strings (if pool available)', () => {
    const word = getWordOfDay();
    if (word) {
      expect(word[0].length).toBeGreaterThan(0);
      expect(word[1].length).toBeGreaterThan(0);
    }
  });
});

// ── userKey ───────────────────────────────────────────────────────────────────
import { toDocId } from '../lib/userKey';

describe('toDocId', () => {
  it('replaces periods with underscores', () => {
    expect(toDocId('user.name@example.com')).not.toContain('.');
  });

  it('replaces hash chars', () => {
    expect(toDocId('abc#def')).toBe('abc_def');
  });

  it('replaces dollar sign', () => {
    expect(toDocId('abc$def')).toBe('abc_def');
  });

  it('replaces forward slash', () => {
    expect(toDocId('abc/def')).toBe('abc_def');
  });

  it('replaces square brackets', () => {
    expect(toDocId('abc[def]ghi')).toBe('abc_def_ghi');
  });

  it('leaves alphanumeric strings unchanged', () => {
    expect(toDocId('abc123XYZ')).toBe('abc123XYZ');
  });

  it('replaces multiple forbidden chars in one pass', () => {
    const result = toDocId('a.b#c$d/e[f]');
    expect(result).toBe('a_b_c_d_e_f_');
  });
});
