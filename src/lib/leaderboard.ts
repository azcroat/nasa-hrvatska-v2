// leaderboard.ts — Weekly XP leaderboard with 5 league tiers
import { doc, setDoc, getDocs, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getDb } from './firebase';
import { weekKey as _weekKey } from './dateUtils';

export interface League {
  id: string;
  name: string;
  icon: string;
  color: string;
  minRank: number;
}

export const LEAGUES: League[] = [
  { id: 'bronze',   name: 'Bronze',   icon: '🥉', color: '#cd7f32', minRank: 41 },
  { id: 'silver',   name: 'Silver',   icon: '🥈', color: '#94a3b8', minRank: 21 },
  { id: 'gold',     name: 'Gold',     icon: '🥇', color: '#f59e0b', minRank: 11 },
  { id: 'platinum', name: 'Platinum', icon: '💎', color: '#38bdf8', minRank: 4  },
  { id: 'diamond',  name: 'Diamond',  icon: '👑', color: '#a78bfa', minRank: 1  },
];

export function getLeagueForRank(rank: number): League {
  for (const l of LEAGUES) {
    if (rank >= l.minRank) return l;
  }
  return LEAGUES[0];
}

export function getWeekKey(): string {
  return _weekKey();
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  xp: number;
  updatedAt: number;
  rank?: number;
}

export async function submitWeeklyXP(db: Firestore | null, uid: string, displayName: string, xp: number): Promise<void> {
  const _db = db || getDb();
  if (!uid || !_db) return;
  const weekKey = getWeekKey();
  const ref = doc(_db, 'leaderboard', weekKey, 'entries', uid);
  await setDoc(ref, { uid, displayName: displayName || 'Learner', xp, updatedAt: Date.now() }, { merge: true });
}

export async function getLeaderboard(db: Firestore | null, limitCount = 50): Promise<LeaderboardEntry[]> {
  const _db = db || getDb();
  if (!_db) return [];
  try {
    const weekKey = getWeekKey();
    const q = query(collection(_db, 'leaderboard', weekKey, 'entries'), orderBy('xp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d, i) => ({ rank: i + 1, ...d.data() } as LeaderboardEntry));
  } catch (err) {
    console.error('[leaderboard] getLeaderboard failed:', err);
    return [];
  }
}

export async function getMyRank(db: Firestore | null, uid: string): Promise<number | null> {
  if (!uid) return null;
  const entries = await getLeaderboard(db, 200);
  const idx = entries.findIndex(e => e.uid === uid);
  return idx >= 0 ? idx + 1 : null;
}

/**
 * Subscribe to real-time leaderboard updates via Firestore onSnapshot.
 * onError is called when the subscription fails (permission denied, network, etc.).
 * onUpdate([]) is still called so callers can clear loading state.
 */
export function subscribeToLeaderboard(
  db: Firestore | null,
  limitCount = 50,
  onUpdate: (entries: LeaderboardEntry[]) => void,
  onError?: (err: Error) => void
): () => void {
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
        const entries = snap.docs.map((d, i) => ({ rank: i + 1, ...d.data() } as LeaderboardEntry));
        onUpdate(entries);
      },
      (err) => {
        console.error('[leaderboard] subscribeToLeaderboard error:', err);
        onError?.(err);
        onUpdate([]);
      }
    );
  } catch (err) {
    console.error('[leaderboard] subscribeToLeaderboard setup failed:', err);
    onError?.(err instanceof Error ? err : new Error(String(err)));
    onUpdate([]);
    return () => {};
  }
}
