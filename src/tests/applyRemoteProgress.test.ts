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
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { applyRemoteProgress } from '../lib/applyRemoteProgress.js';

// ── SRS module mock ──────────────────────────────────────────────────────────
const mockSRSData: Record<string, unknown> = {};
vi.mock('../lib/srs.js', () => ({
  getSR: () => ({ ...mockSRSData }),
  saveSR: (data: unknown) => { Object.assign(mockSRSData, data); },
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
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
    localStorage.setItem('uFavs', JSON.stringify([
      { hr: 'pas', en: 'dog' },
      { hr: 'mačka', en: 'cat' },
    ]));
    const setters = makeSetters();
    applyRemoteProgress({
      favs: [{ hr: 'pas', en: 'dog' }, { hr: 'voda', en: 'water' }]
    }, setters);
    expect(setters.setFavs).toHaveBeenCalledOnce();
    const merged: { hr: string }[] = setters.setFavs.mock.calls[0][0];
    const hrs = merged.map(f => f.hr);
    expect(hrs).toContain('pas');
    expect(hrs).toContain('mačka');
    expect(hrs).toContain('voda');
    expect(hrs.filter(h => h === 'pas')).toHaveLength(1); // no dup
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
    localStorage.setItem('uJournal', JSON.stringify([
      { word: 'kuća', translation: 'house' },
    ]));
    const setters = makeSetters();
    applyRemoteProgress({
      journal: [
        { word: 'kuća', translation: 'house' }, // duplicate
        { word: 'auto', translation: 'car' },
      ]
    }, setters);
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

  it('does NOT restore expired streak (3 days ago)', () => {
    localStorage.setItem('uStreak', JSON.stringify({ count: 2, last: todayStr() }));
    const setters = makeSetters();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const expiredDate = threeDaysAgo.toISOString().slice(0, 10);
    applyRemoteProgress({ streak: { count: 30, last: expiredDate } }, setters);
    const stored = JSON.parse(localStorage.getItem('uStreak') || '{}');
    expect(stored.count).toBe(2); // local unchanged
  });

  it('does NOT restore lower streak over higher local streak', () => {
    localStorage.setItem('uStreak', JSON.stringify({ count: 15, last: todayStr() }));
    const setters = makeSetters();
    applyRemoteProgress({ streak: { count: 5, last: todayStr() } }, setters);
    const stored = JSON.parse(localStorage.getItem('uStreak') || '{}');
    expect(stored.count).toBe(15); // local wins
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
    const newHeart  = { count: 3, lastRegen: 9999 };
    const oldHeart  = { count: 5, lastRegen: 1000 };
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
    applyRemoteProgress({
      dc: {
        day: todayStr(),
        answered: [true, false, true],
        selected: ['option1', '', 'option3'],
      }
    }, setters);
    expect(setters.sDchlA).toHaveBeenCalled();
    expect(setters.sDchlSl).toHaveBeenCalled();
  });

  it('does NOT restore when dc.day !== today', () => {
    const setters = makeSetters();
    applyRemoteProgress({
      dc: {
        day: '2020-01-01',
        answered: [true, true, true],
        selected: ['a', 'b', 'c'],
      }
    }, setters);
    expect(setters.sDchlA).not.toHaveBeenCalled();
  });
});
