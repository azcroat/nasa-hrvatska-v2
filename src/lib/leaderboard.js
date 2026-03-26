// leaderboard.js — Weekly XP leaderboard with 5 league tiers
import { doc, setDoc, getDocs, collection, query, orderBy, limit } from 'firebase/firestore';
import { getDb } from './firebase.js';

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
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2,'0')}`;
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
    return snap.docs.map((d, i) => ({ rank: i + 1, ...d.data() }));
  } catch { return []; }
}

export async function getMyRank(db, uid) {
  if (!uid) return null;
  const entries = await getLeaderboard(db, 200);
  const idx = entries.findIndex(e => e.uid === uid);
  return idx >= 0 ? idx + 1 : null;
}
