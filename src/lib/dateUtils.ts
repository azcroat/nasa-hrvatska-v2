/** Returns local date as YYYY-MM-DD string (never UTC). */
export function localDateStr(d: Date = new Date()): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/**
 * Fetches the server's current date as YYYY-MM-DD.
 * Uses a 3-second timeout; falls back to local date on any error so offline
 * functionality is fully preserved.
 */
export async function getServerDateStr(): Promise<string> {
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch('/api/server-time', { signal: ctrl.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error('non-ok');
    const { ts } = await res.json() as { ts: number };
    return localDateStr(new Date(ts));
  } catch {
    return localDateStr(new Date());
  }
}

/** Returns ISO 8601 week key e.g. "2026-W13". DST-safe via UTC arithmetic. */
export function weekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
