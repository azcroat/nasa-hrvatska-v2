// Shared string-similarity utilities for Croatian learning comparisons.
// Consolidates previously-duplicated copies in PronunciationScorer, TypingScreen,
// and SpeakingScreen. Diacritic normalization is intentional: learners are not
// penalized for missing diacritics in loose-match contexts.
//
// NOTE on TypingScreen: its local `normalize()` is intentionally NOT replaced by
// normalizeCroatian() here because it carries two extra character mappings (š/ś and ž/ź)
// that are not present in PronunciationScorer's normalization. Only the raw `levenshtein`
// function is shared with TypingScreen; the local normalize() stays local there.

/** Lowercase, strip Croatian diacritics and punctuation, trim. */
export function normalizeCroatian(s: string): string {
  return s
    .toLowerCase()
    .replace(/[čć]/g, 'c')
    .replace(/š/g, 's')
    .replace(/ž/g, 'z')
    .replace(/đ/g, 'd')
    .replace(/[.,!?;:'"]/g, '')
    .trim();
}

/** Classic dynamic-programming Levenshtein edit distance (raw, no normalization). */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_unused, i) =>
    Array.from({ length: n + 1 }, (_2, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1]![j - 1]!
          : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
    }
  }
  return dp[m]![n]!;
}

/** Diacritic-normalized similarity in 0..100 (100 = identical after normalization).
 *
 * Semantics match PronunciationScorer's old `similarity()` exactly:
 *  - normalize both strings via normalizeCroatian()
 *  - if equal after normalization → 100
 *  - otherwise Math.round((1 - levenshtein(na,nb) / maxLen) * 100)
 *  - guard: if either side normalizes to empty → 0 (unless both empty → 100)
 */
export function similarityPct(a: string, b: string): number {
  const na = normalizeCroatian(a);
  const nb = normalizeCroatian(b);
  if (!na || !nb) return na === nb ? 100 : 0;
  if (na === nb) return 100;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 100;
  return Math.round((1 - levenshtein(na, nb) / maxLen) * 100);
}

/** Character-overlap ratio in 0..100 (shared chars / longer length). Looser than edit distance.
 *
 * Semantics match BOTH SpeakingScreen functions exactly:
 *  - textSimilarity(a,b): this function returns that same 0..100 value
 *  - levenshteinClose(a,b): that was charOverlapPct(a,b) >= 60 (despite the misleading name,
 *    it was NOT edit distance — it was identical char-overlap logic)
 *
 * No diacritic normalization: only lowercase + trim (matches original textSimilarity).
 */
export function charOverlapPct(a: string, b: string): number {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (!na || !nb) return 0;
  if (na === nb) return 100;
  const longer = na.length >= nb.length ? na : nb;
  const shorter = na.length >= nb.length ? nb : na;
  if (longer.length === 0) return 100;
  const shared = shorter.split('').filter((c) => longer.includes(c)).length;
  return Math.round((shared / longer.length) * 100);
}
