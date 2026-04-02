// leaderboard.js — Weekly XP leaderboard with 5 league tiers
import { doc, setDoc, getDocs, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { getDb } from './firebase.js';
import { weekKey as _weekKey } from './dateUtils.js';

export const LEAGUES = [
  { id: 'bronze',   name: 'Bronze',   icon: '🥉', color: '#cd7f32', minRank: 41 },
  { id: 'silver',   name: 'Silver',   icon: '🥈', color: '#94a3b8', minRank: 21 },
  { id: 'gold',     name: 'Gold',     icon: '🥇', color: '#f59e0b', minRank: 11 },
  { id: 'platinum', name: 'Platinum', icon: '💎', color: '#38bdf8', minRank: 4  },
  { id: 'diamond',  name: 'Diamond',  icon: '👑', color: '#a78bfa', minRank: 1  },
];

export function getLeagueForRank(rank) {
  for (const l of LEAGUES) {
    if (rank >= l.minRank) return l;
  }
  return LEAGUES[0];
}

export function getWeekKey() {
  return _weekKey();
}

export async function submitWeeklyXP(db, uid, displayName, xp) {
  const _db = db || getDb();
  if (!uid || !_db) return;
  const weekKey = getWeekKey();
  const ref = doc(_db, 'leaderboard', weekKey, 'entries', uid);
  await setDoc(ref, { uid, displayName: displayName || 'Learner', xp, updatedAt: Date.now() }, { merge: true });
}

export async function getLeaderboard(db, limitCount = 50) {
  const _db = db || getDb();
  if (!_db) return [];
  try {
    const weekKey = getWeekKey();
    const q = query(collection(_db, 'leaderboard', weekKey, 'entries'), orderBy('xp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
     
    return snap.docs.map((d, i) => /** @type {any} */ ({ rank: i + 1, ...d.data() }));
  } catch { return []; }
}

export async function getMyRank(db, uid) {
  if (!uid) return null;
  const entries = await getLeaderboard(db, 200);
  const idx = entries.findIndex(e => e.uid === uid);
  return idx >= 0 ? idx + 1 : null;
}

/**
 * Subscribe to real-time leaderboard updates via Firestore onSnapshot.
 * Replaces the one-shot getDocs call with a live listener — updates arrive
 * automatically when any user earns XP, typically within 1–2 seconds.
 *
 * @param {import('firebase/firestore').Firestore | null} db
 * @param {number} limitCount
 * @param {(entries: object[]) => void} onUpdate  — called with ranked entries on every change
 * @returns {() => void}  — unsubscribe function; call on component unmount
 */
export function subscribeToLeaderboard(db, limitCount = 50, onUpdate) {
  const _db = db || getDb();
  if (!_db) { onUpdate([]); return () => {}; }
  try {
    const weekKey = getWeekKey();
    const q = query(
      collection(_db, 'leaderboard', weekKey, 'entries'),
      orderBy('xp', 'desc'),
      limit(limitCount)
    );
    return onSnapshot(
      q,
      (snap) => {
        const entries = snap.docs.map((d, i) => ({ rank: i + 1, ...d.data() }));
        onUpdate(entries);
      },
      (_err) => {
        // On permission error or offline: fall back gracefully with empty list
        onUpdate([]);
      }
    );
  } catch {
    onUpdate([]);
    return () => {};
  }
}
