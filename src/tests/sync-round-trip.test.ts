/**
 * sync-round-trip.test.ts
 *
 * End-to-end verification of the cross-device sync contract:
 * seed localStorage on Device A → buildProgressSnapshot → wipe → apply that
 * snapshot via applyRemoteProgress on Device B → assert keys are restored.
 *
 * This complements `applyRemoteProgress.test.ts` (which exercises merge edge
 * cases). The unique value here is round-trip completeness — every sync key
 * the snapshot writes must be readable back after the merge. Specifically
 * the keys added in commit 8c0df4f (May 2026 17-key sync expansion) which
 * were trusted-not-verified at the time.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { applyRemoteProgress, type RemoteProgressSetters } from '../lib/applyRemoteProgress.js';
import { buildProgressSnapshot } from '../lib/progressSnapshot.js';

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('../lib/srs.js', () => ({
  getSR: () => ({}),
  saveSR: () => {},
}));

vi.mock('../lib/firebase.js', () => ({
  gP: () => null, // no prior cached profile during round-trip
}));

vi.mock('../lib/appUtils.js', () => ({
  getStreak: () => ({ count: 0, last: '' }),
  getStreakFreezes: () => 0,
}));

vi.mock('../lib/cefrCertification.js', () => ({
  snapshotCertifications: () => ({ certified: 'A1', migrationFlag: false }),
  mergeRemoteCertifications: () => {},
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function noopSetters(): RemoteProgressSetters {
  return {
    setFavs: () => {},
    setJWords: () => {},
    sDchlA: () => {},
    sDchlSl: () => {},
    setOnboarded: () => {},
    setName: () => {},
  };
}

function todayStr(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

const BASELINE_STATS = {
  xp: 1500,
  lc: 12,
  gc: 8,
  sp: 5,
  de: 3,
  rc: 4,
  pf: 6,
  al: 2,
  mv: 1,
  hi: 7,
  str: 11,
  rs: [],
  ct: ['greetings', 'numbers'],
  vs: ['listening', 'tenses'],
  badges: ['streak_7'],
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('sync round-trip — 17 keys added in 8c0df4f', () => {
  it('user settings (level/goal/culture/track/daily-goal) round-trip', () => {
    localStorage.setItem('nh_level', 'B1');
    localStorage.setItem('nh_goal', 'fluent');
    localStorage.setItem('nh_culture', 'heritage');
    localStorage.setItem('nh_placement_done', 'true');
    localStorage.setItem('nh_grammar_track_done', 'true');
    localStorage.setItem('nh_daily_goal_xp', '30');

    const snap = buildProgressSnapshot({
      uid: 'u1',
      name: 'Test',
      stats: BASELINE_STATS,
      dchlA: [],
      dchlSl: [],
      favs: [],
      jWords: [],
    });

    localStorage.clear();
    applyRemoteProgress(snap, noopSetters());

    expect(localStorage.getItem('nh_level')).toBe('B1');
    expect(localStorage.getItem('nh_goal')).toBe('fluent');
    expect(localStorage.getItem('nh_culture')).toBe('heritage');
    expect(localStorage.getItem('nh_placement_done')).toBe('true');
    expect(localStorage.getItem('nh_grammar_track_done')).toBe('true');
    expect(localStorage.getItem('nh_daily_goal_xp')).toBe('30');
  });

  it('accessibility / playback preferences (darkMode/sound/haptic/voice/rate/font/motion/autotts) round-trip', () => {
    localStorage.setItem('darkMode', 'true');
    localStorage.setItem('nh_dm_explicit', '1');
    localStorage.setItem('nh_sound_enabled', 'true');
    localStorage.setItem('nh_haptic_enabled', 'false');
    localStorage.setItem('nh_voice_pref', 'azure');
    localStorage.setItem('nh_speech_rate', '0.75');
    localStorage.setItem('nh_font_size', 'large');
    localStorage.setItem('nh_reduce_motion', 'true');
    localStorage.setItem('nh_autotts', 'true');

    const snap = buildProgressSnapshot({
      uid: 'u1',
      name: 'Test',
      stats: BASELINE_STATS,
      dchlA: [],
      dchlSl: [],
      favs: [],
      jWords: [],
    });

    localStorage.clear();
    applyRemoteProgress(snap, noopSetters());

    expect(localStorage.getItem('darkMode')).toBe('true');
    expect(localStorage.getItem('nh_dm_explicit')).toBe('1');
    expect(localStorage.getItem('nh_sound_enabled')).toBe('true');
    expect(localStorage.getItem('nh_haptic_enabled')).toBe('false');
    expect(localStorage.getItem('nh_voice_pref')).toBe('azure');
    expect(localStorage.getItem('nh_speech_rate')).toBe('0.75');
    expect(localStorage.getItem('nh_font_size')).toBe('large');
    expect(localStorage.getItem('nh_reduce_motion')).toBe('true');
    expect(localStorage.getItem('nh_autotts')).toBe('true');
  });

  it('nh_journey milestones round-trip with union semantics on collision', () => {
    const localMilestones = [
      { id: 'first_lesson', ts: 100 },
      { id: 'week_streak', ts: 200 },
    ];
    localStorage.setItem('nh_journey', JSON.stringify(localMilestones));

    const snap = buildProgressSnapshot({
      uid: 'u1',
      name: 'Test',
      stats: BASELINE_STATS,
      dchlA: [],
      dchlSl: [],
      favs: [],
      jWords: [],
    });

    // Device B has a different journey entry; the remote snapshot's journey
    // should additively union with Device B's.
    localStorage.clear();
    localStorage.setItem('nh_journey', JSON.stringify([{ id: 'first_speaking', ts: 150 }]));
    applyRemoteProgress(snap, noopSetters());

    const merged = JSON.parse(localStorage.getItem('nh_journey') || '[]') as Array<{
      id: string;
    }>;
    const ids = merged.map((m) => m.id).sort();
    expect(ids).toContain('first_lesson');
    expect(ids).toContain('week_streak');
    expect(ids).toContain('first_speaking');
  });

  it('nh_ceremonies stage flags are additive (true never regresses to false)', () => {
    localStorage.setItem('nh_stage1_ceremony', '1');
    localStorage.setItem('nh_stage2_ceremony', '1');
    localStorage.setItem('nh_ceremony_streak_30', '1');

    const snap = buildProgressSnapshot({
      uid: 'u1',
      name: 'Test',
      stats: BASELINE_STATS,
      dchlA: [],
      dchlSl: [],
      favs: [],
      jWords: [],
    });

    localStorage.clear();
    applyRemoteProgress(snap, noopSetters());

    expect(localStorage.getItem('nh_stage1_ceremony')).toBe('1');
    expect(localStorage.getItem('nh_stage2_ceremony')).toBe('1');
    expect(localStorage.getItem('nh_ceremony_streak_30')).toBe('1');
  });

  it('nh_checkpoints / nh_custom_words / nh_saved_phrases / nh_media_done / nh_session_history round-trip', () => {
    const checkpoints = { '1': { score: 80, ts: 100 } };
    const customWords = [{ hr: 'kruh', en: 'bread' }];
    const savedPhrases = [{ hr: 'dobar dan', en: 'good day' }];
    const mediaDone = { music_taras: true };
    const sessionHistory = { '2026-05-20': true, '2026-05-21': true };

    localStorage.setItem('nh_checkpoints', JSON.stringify(checkpoints));
    localStorage.setItem('nh_custom_words', JSON.stringify(customWords));
    localStorage.setItem('nh_saved_phrases', JSON.stringify(savedPhrases));
    localStorage.setItem('nh_media_done', JSON.stringify(mediaDone));
    localStorage.setItem('nh_session_history', JSON.stringify(sessionHistory));

    const snap = buildProgressSnapshot({
      uid: 'u1',
      name: 'Test',
      stats: BASELINE_STATS,
      dchlA: [],
      dchlSl: [],
      favs: [],
      jWords: [],
    });

    localStorage.clear();
    applyRemoteProgress(snap, noopSetters());

    expect(JSON.parse(localStorage.getItem('nh_checkpoints') || '{}')).toEqual(checkpoints);
    expect(JSON.parse(localStorage.getItem('nh_custom_words') || '[]')).toEqual(customWords);
    expect(JSON.parse(localStorage.getItem('nh_saved_phrases') || '[]')).toEqual(savedPhrases);
    expect(JSON.parse(localStorage.getItem('nh_media_done') || '{}')).toEqual(mediaDone);
    expect(JSON.parse(localStorage.getItem('nh_session_history') || '{}')).toEqual(sessionHistory);
  });

  it('nh_prestige numeric round-trip preserves value', () => {
    localStorage.setItem('nh_prestige', '3');

    const snap = buildProgressSnapshot({
      uid: 'u1',
      name: 'Test',
      stats: BASELINE_STATS,
      dchlA: [],
      dchlSl: [],
      favs: [],
      jWords: [],
    });

    localStorage.clear();
    applyRemoteProgress(snap, noopSetters());

    expect(localStorage.getItem('nh_prestige')).toBe('3');
  });

  it('nh_daily_xp_today restores when remote snapshot date matches today', () => {
    const today = todayStr();
    localStorage.setItem('nh_daily_xp_' + today, '125');

    const snap = buildProgressSnapshot({
      uid: 'u1',
      name: 'Test',
      stats: BASELINE_STATS,
      dchlA: [],
      dchlSl: [],
      favs: [],
      jWords: [],
    });

    localStorage.clear();
    applyRemoteProgress(snap, noopSetters());

    expect(localStorage.getItem('nh_daily_xp_' + today)).toBe('125');
  });
});
