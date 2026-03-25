/**
 * SM-2 Spaced Repetition Algorithm
 * quality: 0=complete blackout, 1=wrong but remembered, 2=wrong easy recall,
 *          3=correct with difficulty, 4=correct after hesitation, 5=perfect
 */
export function sm2(card, quality) {
  let { ease = 2.5, interval = 1, reps = 0 } = card || {};
  if (quality >= 3) {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ease);
    reps++;
  } else {
    reps = 0;
    interval = 1;
  }
  ease = Math.max(1.3, ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  return { ease, interval, reps, nextReview: Date.now() + interval * 86400000, lastQuality: quality };
}

export function getDueCards(srMap, allCards, maxNew = 10, maxReview = 20) {
  const now = Date.now();
  const due = [], fresh = [];
  for (const c of allCards) {
    const card = srMap[c.id];
    if (!card) fresh.push(c);
    else if (card.nextReview <= now) due.push({ ...c, _card: card });
  }
  // Sort due by most overdue first
  due.sort((a, b) => (a._card.nextReview - b._card.nextReview));
  return [...due.slice(0, maxReview), ...fresh.slice(0, maxNew)];
}

export function getSRStats(srMap) {
  const now = Date.now();
  let due = 0, learning = 0, mastered = 0;
  for (const id in srMap) {
    const c = srMap[id];
    if (c.nextReview <= now) due++;
    else if (c.reps < 3) learning++;
    else if (c.interval >= 21) mastered++;
    else learning++;
  }
  return { due, learning, mastered };
}

export function srQualityFromResult(correct, timeMs) {
  if (!correct) return timeMs < 5000 ? 1 : 0;
  if (timeMs < 2000) return 5;
  if (timeMs < 4000) return 4;
  return 3;
}
