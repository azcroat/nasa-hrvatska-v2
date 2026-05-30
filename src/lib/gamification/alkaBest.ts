// Persistent best Alka score (0-9). Only ever increases (progress protection).
export const ALKA_BEST_KEY = 'nh_alka_best';

export function getAlkaBest(): number {
  try {
    const raw = localStorage.getItem(ALKA_BEST_KEY);
    const n = raw == null ? 0 : parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? Math.min(9, n) : 0;
  } catch {
    return 0;
  }
}

// Returns true if this score set a new best.
export function recordAlkaBest(score: number): boolean {
  const prev = getAlkaBest();
  if (score > prev) {
    try {
      localStorage.setItem(ALKA_BEST_KEY, String(Math.min(9, score)));
    } catch {
      /* storage unavailable — non-fatal */
    }
    return true;
  }
  return false;
}
