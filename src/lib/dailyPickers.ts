// SP11e: parameter-passing daily pickers. Algorithms are identical to the
// closure-style helpers previously in src/data/content.tsx (getProverbOfDay,
// getCityOfDay, getHistFact) — the only change is data is now passed in by
// the caller (typically from useContent()) instead of closed over.
//
// All three pickers are deterministic per calendar day so the user sees a
// stable pick within any session and across reloads.

function todayDateKey(): string {
  const n = new Date();
  return (
    n.getFullYear() +
    '-' +
    String(n.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(n.getDate()).padStart(2, '0')
  );
}

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

export function getProverbOfDay<T>(proverbs: T[]): T | undefined {
  if (!Array.isArray(proverbs) || proverbs.length === 0) return undefined;
  return proverbs[djb2('prov:' + todayDateKey()) % proverbs.length];
}

export function getHistFact<T>(facts: T[]): T | undefined {
  if (!Array.isArray(facts) || facts.length === 0) return undefined;
  return facts[djb2('fact:' + todayDateKey()) % facts.length];
}

// City of day uses a year-seeded Fisher-Yates shuffle so every city appears
// once before any repeats. The slot for "today" is dayOfYear into the shuffle.
let _cotdCache: { key: string; city: unknown } = { key: '', city: undefined };

export function getCityOfDay<T>(cities: T[]): T | undefined {
  if (!Array.isArray(cities) || cities.length === 0) return undefined;
  const n = new Date();
  const dateKey = todayDateKey();
  if (_cotdCache.key === dateKey) return _cotdCache.city as T;

  const year = n.getFullYear();
  const dayOfYear = Math.floor((Number(n) - Number(new Date(year, 0, 1))) / 86_400_000);

  // Fisher-Yates shuffle seeded by year
  const idx: number[] = cities.map((_, i) => i);
  let seed = (year * 2654435761) >>> 0;
  for (let i = idx.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const j = seed % (i + 1);
    const a = idx[i] as number;
    const b = idx[j] as number;
    idx[i] = b;
    idx[j] = a;
  }
  const slot = idx[dayOfYear % cities.length] as number;
  const city = cities[slot] as T;
  _cotdCache = { key: dateKey, city };
  return city;
}
