/**
 * offlineAwardQueue — manages XP awards made while the user is offline.
 *
 * Online path: awards are validated by /api/award before Firestore write.
 * Offline path: awards go directly to Firestore (existing fbApplyDelta).
 *   Each offline award is also queued here for a post-reconnect audit.
 *
 * On reconnect, flush() compares each queued claimedXp against the
 * ACTIVITY_XP_MAP cap. Suspicious entries (>10% over cap) are written
 * to Firestore /users/{uid}/xpAudit/{timestamp} for admin review.
 */

import { ACTIVITY_XP_MAP } from './activityXp.js';
import { getDb } from './firebase.js';
import { toDocId } from './userKey.js';
import { doc, setDoc } from 'firebase/firestore';

export interface OfflineAwardEntry {
  activityType: string;
  claimedXp: number;
  timestamp: number;
}

const QUEUE_KEY = 'nh_offline_award_queue';
const TOLERANCE = 1.1; // entries > cap × 1.10 are flagged as suspicious

export function enqueue(entry: OfflineAwardEntry): void {
  try {
    const queue: OfflineAwardEntry[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    queue.push(entry);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // localStorage unavailable (e.g. private browsing) — silently skip
  }
}

export function clearQueue(): void {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch {
    // ignore
  }
}

export async function flush(uid: string): Promise<void> {
  let queue: OfflineAwardEntry[];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return;
    queue = JSON.parse(raw);
  } catch {
    return;
  }
  if (queue.length === 0) return;

  // Clear the queue immediately after reading it into memory — this always happens
  // regardless of whether suspicious entries are found or whether the Firestore write
  // succeeds. The audit write below is best-effort; we do not block queue clearance on it.
  clearQueue();

  const suspicious = queue.filter((entry) => {
    const cap =
      (ACTIVITY_XP_MAP as Record<string, number>)[entry.activityType] ?? ACTIVITY_XP_MAP.default;
    return entry.claimedXp > cap * TOLERANCE;
  });

  if (suspicious.length === 0) return;

  const db = getDb();
  if (!db) return;

  try {
    const docId = toDocId(uid);
    const auditRef = doc(db, 'users', docId, 'xpAudit', String(Date.now()));
    await setDoc(auditRef, {
      uid,
      suspicious,
      totalSuspiciousXp: suspicious.reduce((sum, e) => sum + e.claimedXp, 0),
      flaggedAt: Date.now(),
    });
  } catch (e) {
    // Audit write failed — log but don't crash. Queue was already cleared;
    // suspicious entries are lost for this flush cycle (audit is best-effort).
    console.warn('[offlineAwardQueue] Firestore audit write failed:', (e as Error)?.message);
  }
}
