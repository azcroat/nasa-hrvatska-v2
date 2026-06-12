/**
 * applyRemoteProgress.test.ts
 *
 * Integration tests for the Firebase-to-localStorage progress merge function.
 * Previously inline in App.jsx (85 lines); now an extractable, testable lib.
 *
 * Key merge contracts tested:
 *   - SRS: keep card with more repetitions / successes
 *   - Streak: only restore when Firebase streak is still active (today or yesterday)
 *   - Favs: dedup union keyed on hr
 *   - Journal: dedup union keyed on word
 *   - Daily challenge: today-only restore
 *   - Prestige: Math.max
 *   - Hearts: remote wins only when lastRegen is newer
 *   - Checkpoints: union (local wins on conflict)
 *   - Quest flags: additive (once true, always true)
 *   - Settings: only written when non-null/undefined
 *   - weekXP: Math.max per-week guard; cross-week stale snapshots rejected
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { applyRemoteProgress } from '../lib/applyRemoteProgress.js';

// ── SRS module mock ──────────────────────────────────────────────────────────
const mockSRSData: Record<string, unknown> = {};
vi.mock('../lib/srs.js', () => ({
  getSR: () => ({ ...mockSRSData }),
  saveSR: (data: unknown) => {
    Object.assign(mockSRSData, data);
  },
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

function makeSetters() {
  return {
    setFavs: vi.fn(),
    setJWords: vi.fn(),
    sDchlA: vi.fn(),
    sDchlSl: vi.fn(),
    setOnboarded: vi.fn(),
    setName: vi.fn(),
  };
}

function clearLS() {
  localStorage.clear();
  for (const k in mockSRSData) delete mockSRSData[k];
}

// ── Test suites ───────────────────────────────────────────────────────────────

describe('applyRemoteProgress — null/undefined guard', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('does nothing when fp is null', () => {
    const setters = makeSetters();
    applyRemoteProgress(null, setters);
    expect(setters.setName).not.toHaveBeenCalled();
    expect(setters.setFavs).not.toHaveBeenCalled();
  });

  it('does nothing when fp is undefined', () => {
    const setters = makeSetters();
    applyRemoteProgress(undefined, setters);
    expect(setters.setName).not.toHaveBeenCalled();
  });
});

describe('applyRemoteProgress — name + onboarding', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('calls setName when fp.name present', () => {
    const setters = makeSetters();
    applyRemoteProgress({ name: 'Ana' }, setters);
    expect(setters.setName).toHaveBeenCalledWith('Ana');
  });

  it('calls setOnboarded(true) when fp.onboarded is true', () => {
    const setters = makeSetters();
    applyRemoteProgress({ onboarded: true }, setters);
    expect(setters.setOnboarded).toHaveBeenCalledWith(true);
    expect(localStorage.getItem('onboarded')).toBe('true');
  });

  it('calls setOnboarded(true) when stats.xp > 0', () => {
    const setters = makeSetters();
    applyRemoteProgress({ stats: { xp: 100 } }, setters);
    expect(setters.setOnboarded).toHaveBeenCalledWith(true);
  });

  it('does NOT call setOnboarded when user has no activity', () => {
    const setters = makeSetters();
    applyRemoteProgress({ name: 'Guest', stats: { xp: 0 } }, setters);
    expect(setters.setOnboarded).not.toHaveBeenCalled();
  });
});

describe('applyRemoteProgress — favourites merge', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('merges remote favs with local favs (dedup on hr)', () => {
    localStorage.setItem(
      'uFavs',
      JSON.stringify([
        { hr: 'pas', en: 'dog' },
        { hr: 'mačka', en: 'cat' },
      ]),
    );
    const setters = makeSetters();
    applyRemoteProgress(
      {
        favs: [
          { hr: 'pas', en: 'dog' },
          { hr: 'voda', en: 'water' },
        ],
      },
      setters,
    );
    expect(setters.setFavs).toHaveBeenCalledOnce();
    const merged: { hr: string }[] = setters.setFavs.mock.calls[0][0];
    const hrs = merged.map((f) => f.hr);
    expect(hrs).toContain('pas');
    expect(hrs).toContain('mačka');
    expect(hrs).toContain('voda');
    expect(hrs.filter((h) => h === 'pas')).toHaveLength(1); // no dup
  });

  it('writes merged favs to localStorage', () => {
    const setters = makeSetters();
    applyRemoteProgress({ favs: [{ hr: 'kuća', en: 'house' }] }, setters);
    const stored = JSON.parse(localStorage.getItem('uFavs') || '[]');
    expect(stored.some((f: { hr: string }) => f.hr === 'kuća')).toBe(true);
  });
});

describe('applyRemoteProgress — journal merge', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('merges journal entries dedup on word', () => {
    localStorage.setItem('uJournal', JSON.stringify([{ word: 'kuća', translation: 'house' }]));
    const setters = makeSetters();
    applyRemoteProgress(
      {
        journal: [
          { word: 'kuća', translation: 'house' }, // duplicate
          { word: 'auto', translation: 'car' },
        ],
      },
      setters,
    );
    const merged: unknown[] = setters.setJWords.mock.calls[0][0];
    expect(merged).toHaveLength(2);
  });
});

describe('applyRemoteProgress — streak restore', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('restores streak when Firebase streak is active today', () => {
    localStorage.setItem('uStreak', JSON.stringify({ count: 3, last: 'yesterday' }));
    const setters = makeSetters();
    const streak = { count: 7, last: todayStr() };
    applyRemoteProgress({ streak }, setters);
    const stored = JSON.parse(localStorage.getItem('uStreak') || '{}');
    expect(stored.count).toBe(7);
  });

  it('restores streak when Firebase streak was active yesterday', () => {
    localStorage.setItem('uStreak', JSON.stringify({ count: 2, last: '' }));
    const setters = makeSetters();
    const streak = { count: 10, last: yesterdayStr() };
    applyRemoteProgress({ streak }, setters);
    const stored = JSON.parse(localStorage.getItem('uStreak') || '{}');
    expect(stored.count).toBe(10);
  });

  it('adopts a genuinely longer remote streak that is still alive (active-day union)', () => {
    // The legit cross-device case the old Math.max policy meant to protect: another
    // device built a real 10-day run ending today; this device only knows today.
    // Union of active days → the real 10-day streak is preserved (no data loss).
    localStorage.setItem('uStreak', JSON.stringify({ count: 1, last: todayStr() }));
    const setters = makeSetters();
    applyRemoteProgress({ streak: { count: 10, last: todayStr() } }, setters);
    const stored = JSON.parse(localStorage.getItem('uStreak') || '{}');
    expect(stored.count).toBe(10); // alive higher streak adopted
    expect(stored.last).toBe(todayStr());
  });

  it('does NOT restore lower streak over higher local streak', () => {
    localStorage.setItem('uStreak', JSON.stringify({ count: 15, last: todayStr() }));
    const setters = makeSetters();
    applyRemoteProgress({ streak: { count: 5, last: todayStr() } }, setters);
    const stored = JSON.parse(localStorage.getItem('uStreak') || '{}');
    expect(stored.count).toBe(15); // local wins
  });

  // ── REPRODUCTION: cross-device inflation bug ──────────────────────────────
  // A dead remote streak (last advanced 3 days ago → gap > 1 = broken) must NOT
  // resurrect its count onto the locally-active streak. Independent Math.max of
  // (count) and most-recent (last) fabricates {30, today}, which never existed.
  // Correct: the device active most recently owns the current streak as a UNIT.
  it('does NOT resurrect a dead remote streak onto an active local one', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const expired =
      threeDaysAgo.getFullYear() +
      '-' +
      String(threeDaysAgo.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(threeDaysAgo.getDate()).padStart(2, '0');
    // This device practiced TODAY; real current streak = 2.
    localStorage.setItem('uStreak', JSON.stringify({ count: 2, last: todayStr() }));
    const setters = makeSetters();
    // Other device had a 30-streak that DIED 3 days ago.
    applyRemoteProgress({ streak: { count: 30, last: expired } }, setters);
    const stored = JSON.parse(localStorage.getItem('uStreak') || '{}');
    // The current streak is 2 (active today). 30 is a dead historical streak.
    expect(stored.last).toBe(todayStr());
    expect(stored.count).toBe(2); // ← currently FAILS: code yields 30 (inflation bug)
  });
});

describe('applyRemoteProgress — prestige (Math.max)', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('takes remote prestige when higher', () => {
    localStorage.setItem('nh_prestige', '2');
    const setters = makeSetters();
    applyRemoteProgress({ nh_prestige: 5 }, setters);
    expect(localStorage.getItem('nh_prestige')).toBe('5');
  });

  it('keeps local prestige when higher', () => {
    localStorage.setItem('nh_prestige', '8');
    const setters = makeSetters();
    applyRemoteProgress({ nh_prestige: 3 }, setters);
    expect(localStorage.getItem('nh_prestige')).toBe('8');
  });
});

describe('applyRemoteProgress — hearts (remote wins when newer)', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('restores remote hearts when they are newer', () => {
    const oldHeart = { count: 3, lastRegen: 1000 };
    const newHeart = { count: 5, lastRegen: 9999 };
    localStorage.setItem('nh_hearts', JSON.stringify(oldHeart));
    const setters = makeSetters();
    applyRemoteProgress({ nh_hearts: newHeart }, setters);
    const stored = JSON.parse(localStorage.getItem('nh_hearts') || '{}');
    expect(stored.count).toBe(5);
  });

  it('keeps local hearts when they are newer', () => {
    const newHeart = { count: 3, lastRegen: 9999 };
    const oldHeart = { count: 5, lastRegen: 1000 };
    localStorage.setItem('nh_hearts', JSON.stringify(newHeart));
    const setters = makeSetters();
    applyRemoteProgress({ nh_hearts: oldHeart }, setters);
    const stored = JSON.parse(localStorage.getItem('nh_hearts') || '{}');
    expect(stored.count).toBe(3);
  });
});

describe('applyRemoteProgress — quest flags (additive)', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('sets quest flag when remote is true', () => {
    const setters = makeSetters();
    applyRemoteProgress({ nh_cq_easter_uskrs_q1: true }, setters);
    expect(localStorage.getItem('nh_cq_easter_uskrs_q1')).toBe('1');
  });

  it('does not write quest flag when remote is false', () => {
    const setters = makeSetters();
    applyRemoteProgress({ nh_cq_easter_uskrs_q1: false }, setters);
    expect(localStorage.getItem('nh_cq_easter_uskrs_q1')).toBeNull();
  });

  it('dispatches nh-campaign-quest-done when any easter quest completed', () => {
    const events: Event[] = [];
    const listener = (e: Event) => events.push(e);
    window.addEventListener('nh-campaign-quest-done', listener);
    const setters = makeSetters();
    applyRemoteProgress({ nh_cq_easter_uskrs_q2: true }, setters);
    window.removeEventListener('nh-campaign-quest-done', listener);
    expect(events).toHaveLength(1);
  });
});

describe('applyRemoteProgress — user settings', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('restores nh_level from remote', () => {
    const setters = makeSetters();
    applyRemoteProgress({ nh_level: 'B1' }, setters);
    expect(localStorage.getItem('nh_level')).toBe('B1');
  });

  it('restores nh_voice_pref from remote', () => {
    const setters = makeSetters();
    applyRemoteProgress({ nh_voice_pref: 'gabrijela' }, setters);
    expect(localStorage.getItem('nh_voice_pref')).toBe('gabrijela');
  });

  it('restores goal + goal_set together', () => {
    const setters = makeSetters();
    applyRemoteProgress({ nh_goal: 'travel' }, setters);
    expect(localStorage.getItem('nh_goal')).toBe('travel');
    expect(localStorage.getItem('nh_goal_set')).toBe('1');
  });

  it('does not write darkMode when null', () => {
    localStorage.setItem('darkMode', 'true');
    const setters = makeSetters();
    applyRemoteProgress({ darkMode: null }, setters);
    expect(localStorage.getItem('darkMode')).toBe('true'); // unchanged
  });

  it('writes darkMode when non-null', () => {
    const setters = makeSetters();
    applyRemoteProgress({ darkMode: 'false' }, setters);
    expect(localStorage.getItem('darkMode')).toBe('false');
  });

  it('nh_reduce_motion is written only when true', () => {
    const setters = makeSetters();
    applyRemoteProgress({ nh_reduce_motion: false }, setters);
    expect(localStorage.getItem('nh_reduce_motion')).toBeNull();
    applyRemoteProgress({ nh_reduce_motion: true }, setters);
    expect(localStorage.getItem('nh_reduce_motion')).toBe('true');
  });
});

describe('applyRemoteProgress — freeze tokens', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('takes Math.max of local and remote freeze count', () => {
    localStorage.setItem('uFreeze', '2');
    const setters = makeSetters();
    applyRemoteProgress({ freezes: 5 }, setters);
    expect(localStorage.getItem('uFreeze')).toBe('5');
  });

  it('keeps local when local > remote', () => {
    localStorage.setItem('uFreeze', '7');
    const setters = makeSetters();
    applyRemoteProgress({ freezes: 3 }, setters);
    expect(localStorage.getItem('uFreeze')).toBe('7');
  });
});

describe('applyRemoteProgress — daily challenge', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('calls sDchlA and sDchlSl when dc.day === today', () => {
    const setters = makeSetters();
    applyRemoteProgress(
      {
        dc: {
          day: todayStr(),
          answered: [true, false, true],
          selected: ['option1', '', 'option3'],
        },
      },
      setters,
    );
    expect(setters.sDchlA).toHaveBeenCalled();
    expect(setters.sDchlSl).toHaveBeenCalled();
  });

  it('does NOT restore when dc.day !== today', () => {
    const setters = makeSetters();
    applyRemoteProgress(
      {
        dc: {
          day: '2020-01-01',
          answered: [true, true, true],
          selected: ['a', 'b', 'c'],
        },
      },
      setters,
    );
    expect(setters.sDchlA).not.toHaveBeenCalled();
  });
});

// ── weekXP — critical sync invariant ─────────────────────────────────────────
// applyRemoteProgress must use weekKey() from dateUtils (UTC-based), not a
// local-time isoWeekKey(). This ensures it writes to the same localStorage key
// as useAward.ts and progressSnapshot.ts, both of which use weekKey().

describe('applyRemoteProgress — weekXP merge', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  /** Returns the UTC-based week key that useAward and progressSnapshot use. */
  function currentWeekKey(): string {
    const d = new Date(
      Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }

  it('writes weekXP to the UTC-based week key', () => {
    const wk = currentWeekKey();
    const setters = makeSetters();
    applyRemoteProgress({ weekXP: 250, weekXPKey: wk }, setters);
    const stored = parseInt(localStorage.getItem('nh_week_xp_' + wk) || '0', 10);
    expect(stored).toBe(250);
  });

  it('takes Math.max when remote weekXP > local', () => {
    const wk = currentWeekKey();
    localStorage.setItem('nh_week_xp_' + wk, '100');
    const setters = makeSetters();
    applyRemoteProgress({ weekXP: 400, weekXPKey: wk }, setters);
    expect(localStorage.getItem('nh_week_xp_' + wk)).toBe('400');
  });

  it('keeps local weekXP when local > remote', () => {
    const wk = currentWeekKey();
    localStorage.setItem('nh_week_xp_' + wk, '500');
    const setters = makeSetters();
    applyRemoteProgress({ weekXP: 200, weekXPKey: wk }, setters);
    expect(localStorage.getItem('nh_week_xp_' + wk)).toBe('500');
  });

  it('cross-week guard: rejects weekXP when weekXPKey is from a different week', () => {
    const wk = currentWeekKey();
    const setters = makeSetters();
    // Snapshot is from last week — must not contaminate current week counter
    applyRemoteProgress({ weekXP: 999, weekXPKey: '2020-W01' }, setters);
    const stored = localStorage.getItem('nh_week_xp_' + wk);
    // Either null (never written) or '0' — never 999
    expect(parseInt(stored || '0', 10)).not.toBe(999);
  });

  it('missing weekXPKey (legacy snapshot) applies unconditionally', () => {
    const wk = currentWeekKey();
    localStorage.setItem('nh_week_xp_' + wk, '50');
    const setters = makeSetters();
    // Legacy snapshot has no weekXPKey field
    applyRemoteProgress({ weekXP: 300 }, setters);
    // Math.max(50, 300) = 300 applied
    expect(localStorage.getItem('nh_week_xp_' + wk)).toBe('300');
  });

  it('does not crash when weekXP is 0', () => {
    const wk = currentWeekKey();
    const setters = makeSetters();
    applyRemoteProgress({ weekXP: 0, weekXPKey: wk }, setters);
    // 0 applied — localStorage should have '0'
    expect(localStorage.getItem('nh_week_xp_' + wk)).toBe('0');
  });
});

// ── Additional user settings coverage ────────────────────────────────────────

describe('applyRemoteProgress — additional user settings', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('CEFR level max: remote B1 wins over local A1', () => {
    localStorage.setItem('nh_level', 'A1');
    const setters = makeSetters();
    applyRemoteProgress({ nh_level: 'B1' }, setters);
    expect(localStorage.getItem('nh_level')).toBe('B1');
  });

  it('CEFR level max: local C1 wins over remote A2', () => {
    localStorage.setItem('nh_level', 'C1');
    const setters = makeSetters();
    applyRemoteProgress({ nh_level: 'A2' }, setters);
    expect(localStorage.getItem('nh_level')).toBe('C1');
  });

  it('restores nh_culture from remote', () => {
    const setters = makeSetters();
    applyRemoteProgress({ nh_culture: '{"bakaCnt":3}' }, setters);
    expect(localStorage.getItem('nh_culture')).toBe('{"bakaCnt":3}');
  });

  it('restores nh_placement_done from remote', () => {
    const setters = makeSetters();
    applyRemoteProgress({ nh_placement_done: true }, setters);
    expect(localStorage.getItem('nh_placement_done')).toBe('true');
    expect(localStorage.getItem('placement_done')).toBe('true');
  });

  it('restores nh_grammar_track_done from remote', () => {
    const setters = makeSetters();
    applyRemoteProgress({ nh_grammar_track_done: true }, setters);
    expect(localStorage.getItem('nh_grammar_track_done')).toBe('true');
  });

  it('restores nh_dm_explicit from remote', () => {
    const setters = makeSetters();
    applyRemoteProgress({ nh_dm_explicit: true }, setters);
    expect(localStorage.getItem('nh_dm_explicit')).toBe('1');
  });

  it('restores nh_sound_enabled from remote', () => {
    const setters = makeSetters();
    applyRemoteProgress({ nh_sound_enabled: 'false' }, setters);
    expect(localStorage.getItem('nh_sound_enabled')).toBe('false');
  });

  it('skips nh_sound_enabled when null', () => {
    localStorage.setItem('nh_sound_enabled', 'true');
    const setters = makeSetters();
    applyRemoteProgress({ nh_sound_enabled: null }, setters);
    expect(localStorage.getItem('nh_sound_enabled')).toBe('true');
  });

  it('restores nh_haptic_enabled from remote', () => {
    const setters = makeSetters();
    applyRemoteProgress({ nh_haptic_enabled: 'false' }, setters);
    expect(localStorage.getItem('nh_haptic_enabled')).toBe('false');
  });

  it('restores nh_font_size from remote', () => {
    const setters = makeSetters();
    applyRemoteProgress({ nh_font_size: 'large' }, setters);
    expect(localStorage.getItem('nh_font_size')).toBe('large');
  });

  it('does not write nh_font_size when null', () => {
    const setters = makeSetters();
    applyRemoteProgress({ nh_font_size: null }, setters);
    expect(localStorage.getItem('nh_font_size')).toBeNull();
  });

  it('restores nh_autotts when true', () => {
    const setters = makeSetters();
    applyRemoteProgress({ nh_autotts: true }, setters);
    expect(localStorage.getItem('nh_autotts')).toBe('true');
  });

  it('nh_autotts not written when false', () => {
    const setters = makeSetters();
    applyRemoteProgress({ nh_autotts: false }, setters);
    expect(localStorage.getItem('nh_autotts')).toBeNull();
  });

  it('restores nh_daily_goal_xp when local is 0', () => {
    const setters = makeSetters();
    applyRemoteProgress({ nh_daily_goal_xp: 100 }, setters);
    expect(localStorage.getItem('nh_daily_goal_xp')).toBe('100');
  });

  it('takes the higher of local and remote nh_daily_goal_xp (Math.max)', () => {
    // remote > local → remote wins
    localStorage.setItem('nh_daily_goal_xp', '50');
    const setters = makeSetters();
    applyRemoteProgress({ nh_daily_goal_xp: 100 }, setters);
    expect(localStorage.getItem('nh_daily_goal_xp')).toBe('100');
  });

  it('does not overwrite local nh_daily_goal_xp when local is higher', () => {
    // local > remote → local wins
    localStorage.setItem('nh_daily_goal_xp', '150');
    const setters = makeSetters();
    applyRemoteProgress({ nh_daily_goal_xp: 100 }, setters);
    expect(localStorage.getItem('nh_daily_goal_xp')).toBe('150');
  });
});

// ── Journey milestones merge ──────────────────────────────────────────────────

describe('applyRemoteProgress — journey milestones merge', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('adds remote milestones that are not in local', () => {
    localStorage.setItem(
      'nh_journey',
      JSON.stringify([{ type: 'first_lesson', date: '2026-01-01T00:00:00.000Z' }]),
    );
    const setters = makeSetters();
    applyRemoteProgress(
      {
        nh_journey: [
          { type: 'first_lesson', date: '2026-01-01T00:00:00.000Z' }, // duplicate
          { type: 'level_up', date: '2026-01-15T00:00:00.000Z' }, // new
        ],
      },
      setters,
    );
    const stored = JSON.parse(localStorage.getItem('nh_journey') || '[]');
    expect(stored).toHaveLength(2);
    expect(stored.some((m: { type: string }) => m.type === 'level_up')).toBe(true);
  });

  it('skips empty nh_journey array', () => {
    localStorage.setItem(
      'nh_journey',
      JSON.stringify([{ type: 'existing', date: '2026-01-01T00:00:00.000Z' }]),
    );
    const setters = makeSetters();
    applyRemoteProgress({ nh_journey: [] }, setters);
    const stored = JSON.parse(localStorage.getItem('nh_journey') || '[]');
    expect(stored).toHaveLength(1); // unchanged
  });
});

// ── Checkpoints, custom words, saved phrases, media_done ─────────────────────

describe('applyRemoteProgress — checkpoints and custom words', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('merges remote checkpoints with local (local wins on conflict)', () => {
    localStorage.setItem('nh_checkpoints', JSON.stringify({ stage1: true }));
    const setters = makeSetters();
    applyRemoteProgress({ nh_checkpoints: { stage1: false, stage2: true } }, setters);
    const stored = JSON.parse(localStorage.getItem('nh_checkpoints') || '{}');
    expect(stored.stage1).toBe(true); // local wins
    expect(stored.stage2).toBe(true); // remote adds new
  });

  it('merges remote custom words with local', () => {
    const setters = makeSetters();
    applyRemoteProgress(
      {
        nh_custom_words: [{ word: 'kuća', meaning: 'house' }],
      },
      setters,
    );
    const stored = JSON.parse(localStorage.getItem('nh_custom_words') || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].word).toBe('kuća');
  });

  it('merges nh_saved_phrases deduplicating', () => {
    localStorage.setItem('nh_saved_phrases', JSON.stringify(['Dobar dan!']));
    const setters = makeSetters();
    applyRemoteProgress({ nh_saved_phrases: ['Dobar dan!', 'Hvala!'] }, setters);
    const stored = JSON.parse(localStorage.getItem('nh_saved_phrases') || '[]');
    expect(stored).toHaveLength(2);
    expect(stored).toContain('Hvala!');
    expect(stored.filter((s: string) => s === 'Dobar dan!')).toHaveLength(1);
  });

  it('merges nh_media_done (local wins on conflict)', () => {
    localStorage.setItem('nh_media_done', JSON.stringify({ video1: true }));
    const setters = makeSetters();
    applyRemoteProgress({ nh_media_done: { video1: false, video2: true } }, setters);
    const stored = JSON.parse(localStorage.getItem('nh_media_done') || '{}');
    expect(stored.video1).toBe(true); // local wins
    expect(stored.video2).toBe(true); // remote adds
  });

  it('sets nh_hearts_always_on when true', () => {
    const setters = makeSetters();
    applyRemoteProgress({ nh_hearts_always_on: true }, setters);
    expect(localStorage.getItem('nh_hearts_always_on')).toBe('true');
  });

  it('sets nh_used_free_repair when true', () => {
    const setters = makeSetters();
    applyRemoteProgress({ nh_used_free_repair: true }, setters);
    expect(localStorage.getItem('nh_used_free_repair')).toBe('1');
  });

  it('nh_uskrs_kviz_done is written when true', () => {
    const setters = makeSetters();
    applyRemoteProgress({ nh_uskrs_kviz_done: true }, setters);
    expect(localStorage.getItem('nh_uskrs_kviz_done')).toBe('1');
  });
});

describe('nh_session_history', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('merges remote session history additively into localStorage', () => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    localStorage.setItem('nh_session_history', JSON.stringify({ [yesterday]: true }));
    applyRemoteProgress({ nh_session_history: { [today]: true } }, makeSetters());
    const stored = JSON.parse(localStorage.getItem('nh_session_history') || '{}');
    expect(stored[today]).toBe(true);
    expect(stored[yesterday]).toBe(true);
  });

  it('does not remove local entries absent from remote', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    localStorage.setItem('nh_session_history', JSON.stringify({ [yesterday]: true }));
    applyRemoteProgress({}, makeSetters());
    const stored = JSON.parse(localStorage.getItem('nh_session_history') || '{}');
    expect(stored[yesterday]).toBe(true);
  });
});

// ── XP cooldown merge ─────────────────────────────────────────────────────────

// ── levelQuizPasses localStorage mirror — SP1 addition ───────────────────────

describe('applyRemoteProgress — levelQuizPasses localStorage mirror', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('writes levelQuizPasses to nh_level_quiz_passes when not in local storage', () => {
    const setters = makeSetters();
    applyRemoteProgress(
      { stats: { levelQuizPasses: { 1: { score: 85, passedAt: 2000 } } } },
      setters,
    );
    const stored = JSON.parse(localStorage.getItem('nh_level_quiz_passes') || '{}');
    expect(stored[1]).toEqual({ score: 85, passedAt: 2000 });
  });

  it('remote key wins when remote passedAt > local passedAt', () => {
    localStorage.setItem(
      'nh_level_quiz_passes',
      JSON.stringify({ 1: { score: 60, passedAt: 1000 } }),
    );
    const setters = makeSetters();
    applyRemoteProgress(
      { stats: { levelQuizPasses: { 1: { score: 90, passedAt: 5000 } } } },
      setters,
    );
    const stored = JSON.parse(localStorage.getItem('nh_level_quiz_passes') || '{}');
    expect(stored[1].score).toBe(90);
    expect(stored[1].passedAt).toBe(5000);
  });

  it('local key wins when local passedAt >= remote passedAt', () => {
    localStorage.setItem(
      'nh_level_quiz_passes',
      JSON.stringify({ 1: { score: 95, passedAt: 9999 } }),
    );
    const setters = makeSetters();
    applyRemoteProgress(
      { stats: { levelQuizPasses: { 1: { score: 50, passedAt: 1000 } } } },
      setters,
    );
    const stored = JSON.parse(localStorage.getItem('nh_level_quiz_passes') || '{}');
    expect(stored[1].score).toBe(95);
    expect(stored[1].passedAt).toBe(9999);
  });

  it('remote-only key is added alongside existing local key', () => {
    localStorage.setItem(
      'nh_level_quiz_passes',
      JSON.stringify({ 1: { score: 80, passedAt: 1000 } }),
    );
    const setters = makeSetters();
    applyRemoteProgress(
      { stats: { levelQuizPasses: { 2: { score: 75, passedAt: 2000 } } } },
      setters,
    );
    const stored = JSON.parse(localStorage.getItem('nh_level_quiz_passes') || '{}');
    expect(stored[1]).toEqual({ score: 80, passedAt: 1000 });
    expect(stored[2]).toEqual({ score: 75, passedAt: 2000 });
  });

  it('skips entries with NaN key (non-numeric string)', () => {
    const setters = makeSetters();
    applyRemoteProgress(
      {
        stats: {
          levelQuizPasses: {
            notANumber: { score: 90, passedAt: 1000 },
            1: { score: 80, passedAt: 2000 },
          },
        },
      },
      setters,
    );
    const stored = JSON.parse(localStorage.getItem('nh_level_quiz_passes') || '{}');
    // numeric key persisted
    expect(stored[1]).toEqual({ score: 80, passedAt: 2000 });
    // non-numeric key discarded
    expect(stored['notANumber']).toBeUndefined();
  });

  it('skips entries where score or passedAt is not a number', () => {
    const setters = makeSetters();
    applyRemoteProgress(
      {
        stats: {
          levelQuizPasses: {
            1: { score: 'A+', passedAt: 1000 },
            2: { score: 80, passedAt: 'now' },
          },
        },
      },
      setters,
    );
    const stored = JSON.parse(localStorage.getItem('nh_level_quiz_passes') || '{}');
    expect(stored[1]).toBeUndefined();
    expect(stored[2]).toBeUndefined();
  });

  it('does nothing when fp.stats.levelQuizPasses is missing', () => {
    const setters = makeSetters();
    applyRemoteProgress({ stats: { xp: 100 } }, setters);
    expect(localStorage.getItem('nh_level_quiz_passes')).toBeNull();
  });

  it('does nothing when fp.stats is missing entirely', () => {
    const setters = makeSetters();
    applyRemoteProgress({ name: 'Ana' }, setters);
    expect(localStorage.getItem('nh_level_quiz_passes')).toBeNull();
  });
});

describe('applyRemoteProgress — XP cooldown merge', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('merges cooldown entries that match today', () => {
    const today = todayStr();
    const setters = makeSetters();
    applyRemoteProgress({ cooldown: { vocab_100: today, grammar_50: '2020-01-01' } }, setters);
    const stored = JSON.parse(localStorage.getItem('xpCooldown') || '{}');
    expect(stored['vocab_100']).toBe(today); // today → included
    expect(stored['grammar_50']).toBeUndefined(); // old date → excluded
  });
});
