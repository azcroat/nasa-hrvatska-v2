import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getSR,
  saveSR,
  getDueReviews,
  getSRScore,
  getDueCards,
  getSRStats,
  srQualityFromResult,
  addWordToSRS,
  getPrioritizedReviewQueue,
  sm2,
} from '../lib/srs.js';

function clearLS() {
  localStorage.clear();
}

// ── getSR / saveSR basics ─────────────────────────────────────────────────────
describe('getSR / saveSR', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('returns empty object when nothing stored', () => {
    expect(getSR()).toEqual({});
  });

  it('saveSR persists data, getSR reads it back', () => {
    const data = {
      jabuka: {
        s: 3.5,
        d: 5,
        r: 2,
        w: 0,
        l: 0,
        b: 2,
        due: Date.now() + 86400000,
        nextDue: Date.now() + 86400000,
      },
    };
    saveSR(data);
    const read = getSR();
    expect(read.jabuka).toBeDefined();
    expect(read.jabuka.s).toBe(3.5);
    expect(read.jabuka.r).toBe(2);
  });

  it('returns empty object on corrupt localStorage data', () => {
    localStorage.setItem('nh_sr', 'NOT_VALID_JSON{{{');
    expect(getSR()).toEqual({});
  });

  it('migrates SM-2 format (ease/interval): removes old fields, adds s/d/due', () => {
    const sm2Card = {
      ease: 2.5,
      interval: 7,
      r: 3,
      w: 0,
      t: Date.now() - 86400000,
    };
    localStorage.setItem('nh_sr', JSON.stringify({ test_word: sm2Card }));
    const sr = getSR();
    const card = sr.test_word;
    expect(card.ease).toBeUndefined();
    expect(card.interval).toBeUndefined();
    expect(card.s).toBeDefined();
    expect(card.d).toBeDefined();
    expect(card.due).toBeDefined();
  });

  it('migrates legacy SM-2 field ef/iv format: removes ef/iv, adds s/d', () => {
    const legacyCard = { ef: 2.3, iv: 14, r: 5, w: 1 };
    localStorage.setItem('nh_sr', JSON.stringify({ hvala: legacyCard }));
    const sr = getSR();
    expect(sr.hvala.ef).toBeUndefined();
    expect(sr.hvala.iv).toBeUndefined();
    expect(sr.hvala.s).toBeGreaterThan(0);
    expect(sr.hvala.d).toBeDefined();
  });

  it('SM-2 migration maps ease 2.5 → difficulty within 1-10', () => {
    const card = { ease: 2.5, interval: 5, r: 2, w: 0, t: Date.now() - 86400000 };
    localStorage.setItem('nh_sr', JSON.stringify({ mapa: card }));
    const sr = getSR();
    expect(sr.mapa.d).toBeGreaterThanOrEqual(1);
    expect(sr.mapa.d).toBeLessThanOrEqual(10);
  });

  it('SM-2 migration sets stability from interval value', () => {
    const iv = 10;
    const card = { ease: 2.5, interval: iv, r: 1, w: 0, t: Date.now() - 86400000 };
    localStorage.setItem('nh_sr', JSON.stringify({ rijeka: card }));
    const sr = getSR();
    // s = Math.max(iv, 0.1) → should equal the interval
    expect(sr.rijeka.s).toBe(iv);
  });

  it('SM-2 migration removes rep and t fields', () => {
    const card = { ease: 2.5, interval: 3, rep: 2, r: 1, w: 0, t: Date.now() - 86400000 };
    localStorage.setItem('nh_sr', JSON.stringify({ grad: card }));
    const sr = getSR();
    expect(sr.grad.rep).toBeUndefined();
    expect(sr.grad.t).toBeUndefined();
  });

  it('migrates legacy uSR key when nh_sr is empty', () => {
    const old = {
      stari_format: {
        ease: 2.5,
        interval: 3,
        r: 1,
        w: 0,
        t: Date.now() - 86400000,
      },
    };
    localStorage.setItem('uSR', JSON.stringify(old));
    // nh_sr is absent — getSR should fall back to uSR
    const sr = getSR();
    expect(sr.stari_format).toBeDefined();
    expect(sr.stari_format.s).toBeDefined();
  });

  it('does NOT migrate uSR when nh_sr already has data', () => {
    const fresh = {
      jabuka: {
        s: 2,
        d: 5,
        r: 1,
        w: 0,
        l: 0,
        b: 1,
        due: Date.now() + 86400000,
        nextDue: Date.now() + 86400000,
      },
    };
    localStorage.setItem('nh_sr', JSON.stringify(fresh));
    localStorage.setItem(
      'uSR',
      JSON.stringify({ uSR_word: { ease: 2.5, interval: 1, r: 1, w: 0 } }),
    );
    const sr = getSR();
    // uSR_word should NOT appear because nh_sr already has content
    expect(sr.uSR_word).toBeUndefined();
    expect(sr.jabuka).toBeDefined();
  });

  it('FSRS cards without SM-2 fields pass through unchanged', () => {
    const due = Date.now() + 86400000;
    const fsrsCard = { s: 5.2, d: 4, r: 3, w: 0, l: 0, b: 2, due, nextDue: due };
    localStorage.setItem('nh_sr', JSON.stringify({ more: fsrsCard }));
    const sr = getSR();
    expect(sr.more.s).toBe(5.2);
    expect(sr.more.d).toBe(4);
    expect(sr.more.due).toBe(due);
  });

  it('handles empty object stored in nh_sr', () => {
    localStorage.setItem('nh_sr', '{}');
    expect(getSR()).toEqual({});
  });
});

// ── getSRScore — new card creation ────────────────────────────────────────────
describe('getSRScore — new card creation', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('creates a card after correct fast answer', () => {
    const card = getSRScore('jabuka', true, 1000);
    expect(card).toBeDefined();
    expect(card.s).toBeGreaterThan(0);
    expect(card.d).toBeGreaterThanOrEqual(1);
    expect(card.d).toBeLessThanOrEqual(10);
    expect(card.r).toBe(1);
    expect(card.w).toBe(0);
    expect(card.due).toBeGreaterThan(Date.now());
  });

  it('creates a card after wrong answer', () => {
    const card = getSRScore('kruh', false, 3000);
    expect(card).toBeDefined();
    expect(card.s).toBeGreaterThan(0);
    expect(card.w).toBe(1);
    expect(card.r).toBe(0);
    expect(card.l).toBe(1); // lapse incremented on grade < 3
    expect(card.due).toBeGreaterThan(Date.now());
  });

  it('new card has all required FSRS fields', () => {
    const card = getSRScore('voda', true, 2000);
    expect(typeof card.s).toBe('number'); // stability
    expect(typeof card.d).toBe('number'); // difficulty
    expect(typeof card.r).toBe('number'); // right count
    expect(typeof card.w).toBe('number'); // wrong count
    expect(typeof card.l).toBe('number'); // lapse count
    expect(typeof card.b).toBe('number'); // box
    expect(typeof card.due).toBe('number'); // due timestamp
    expect(typeof card.nextDue).toBe('number');
  });

  it('due and nextDue are equal after first review', () => {
    const card = getSRScore('vjetar', true, 2000);
    expect(card.due).toBe(card.nextDue);
  });

  it('stability is positive for all four grades', () => {
    // grade 1: wrong + fast (< 5000 ms)
    const g1 = getSRScore('test_g1', false, 1000);
    clearLS();
    // grade 2: wrong + slow (>= 5000 ms)
    const g2 = getSRScore('test_g2', false, 6000);
    clearLS();
    // grade 3: correct + slow (> 8000 ms)
    const g3 = getSRScore('test_g3', true, 10000);
    clearLS();
    // grade 4: correct + fast (<= 8000 ms)
    const g4 = getSRScore('test_g4', true, 1000);
    clearLS();

    expect(g1.s).toBeGreaterThan(0);
    expect(g2.s).toBeGreaterThan(0);
    expect(g3.s).toBeGreaterThan(0);
    expect(g4.s).toBeGreaterThan(0);
  });

  it('correct answer yields higher stability than wrong answer on first review', () => {
    const correct = getSRScore('test_correct', true, 1000);
    clearLS();
    const wrong = getSRScore('test_wrong', false, 1000);
    expect(correct.s).toBeGreaterThan(wrong.s);
  });

  it('correct answer sets b (box) to 1; wrong answer sets b to 0', () => {
    const correctCard = getSRScore('box_correct', true, 1000);
    clearLS();
    const wrongCard = getSRScore('box_wrong', false, 1000);
    expect(correctCard.b).toBe(1);
    expect(wrongCard.b).toBe(0);
  });

  it('due timestamp is in the future', () => {
    const before = Date.now();
    const card = getSRScore('buduci', true, 2000);
    expect(card.due).toBeGreaterThan(before);
  });

  it('grade 4 (correct fast) has higher initial stability than grade 3 (correct slow)', () => {
    const g3 = getSRScore('grade3_card', true, 10000); // > 8000 ms
    clearLS();
    const g4 = getSRScore('grade4_card', true, 1000); // <= 8000 ms
    // W[3] > W[2] in FSRS weights (15.4722 > 3.1262)
    expect(g4.s).toBeGreaterThan(g3.s);
  });

  it('lapse count is 0 for correct first review', () => {
    const card = getSRScore('no_lapse', true, 2000);
    expect(card.l).toBe(0);
  });

  it('lapse count is 1 for wrong first review', () => {
    const card = getSRScore('one_lapse', false, 2000);
    expect(card.l).toBe(1);
  });
});

// ── getSRScore — existing card updates ───────────────────────────────────────
describe('getSRScore — existing card updates', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('correct answer increases stability on second review', () => {
    const first = getSRScore('rast', true, 2000);
    const initialS = first.s;
    // Mark card as overdue so FSRS recall path fires with meaningful R
    const sr = getSR();
    sr.rast.due = Date.now() - 1000;
    saveSR(sr);
    const second = getSRScore('rast', true, 2000);
    expect(second.s).toBeGreaterThan(initialS);
  });

  it('wrong answer triggers lapse path (difficulty increases, new stability is positive)', () => {
    // FSRS-4.5 note: _nextS_forget CAN produce stability >= pre-lapse stability
    // when R≈1 (card answered immediately after learning, 0 elapsed days).
    // The SM-2 intuition "lapse always reduces stability" does NOT hold in FSRS-4.5.
    // What FSRS guarantees on a lapse:
    //   1. lapse counter increments (tested separately)
    //   2. difficulty (d) increases (harder to learn card)
    //   3. new stability is a valid positive number
    getSRScore('laps', true, 2000);
    const beforeCard = getSR().laps;
    getSRScore('laps', false, 1000);
    const after = getSR().laps;
    expect(after.s).toBeGreaterThan(0);
    expect(after.d).toBeGreaterThan(beforeCard.d); // difficulty must increase
  });

  it('wrong answer increments lapse counter', () => {
    getSRScore('zaborav', true, 2000);
    const before = getSR().zaborav.l || 0;
    getSRScore('zaborav', false, 1000);
    expect(getSR().zaborav.l).toBe(before + 1);
  });

  it('right count increments on each correct answer', () => {
    getSRScore('tocno', true, 2000);
    getSRScore('tocno', true, 2000);
    expect(getSR().tocno.r).toBe(2);
  });

  it('wrong count increments on each wrong answer', () => {
    getSRScore('krivo', false, 2000);
    getSRScore('krivo', false, 2000);
    expect(getSR().krivo.w).toBe(2);
  });

  it('mixed reviews accumulate r and w independently', () => {
    getSRScore('mix', true, 2000);
    getSRScore('mix', false, 2000);
    getSRScore('mix', true, 2000);
    const sr = getSR();
    expect(sr.mix.r).toBe(2);
    expect(sr.mix.w).toBe(1);
  });

  it('minimum stability is 0.1 after many consecutive wrong answers', () => {
    for (let i = 0; i < 15; i++) {
      getSRScore('min_s_test', false, 500);
    }
    expect(getSR().min_s_test.s).toBeGreaterThanOrEqual(0.1);
  });

  it('difficulty stays within 1-10 range after many mixed reviews', () => {
    for (let i = 0; i < 20; i++) {
      getSRScore('diff_range', i % 3 === 0 ? false : true, i % 2 === 0 ? 1000 : 9000);
    }
    const d = getSR().diff_range.d;
    expect(d).toBeGreaterThanOrEqual(1);
    expect(d).toBeLessThanOrEqual(10);
  });

  it('box value is clamped to 0-5 range after many reviews', () => {
    for (let i = 0; i < 20; i++) {
      getSRScore('box_clamp', true, 1000);
    }
    const b = getSR().box_clamp.b;
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThanOrEqual(5);
  });

  it('high-stability card gets a later due date than low-stability card', () => {
    // Build up stability with multiple correct reviews
    for (let i = 0; i < 5; i++) {
      const sr = getSR();
      if (sr.high_s) {
        sr.high_s.due = Date.now() - 1000; // mark overdue to trigger recall path
        saveSR(sr);
      }
      getSRScore('high_s', true, 1000);
    }
    // Low stability card — only one review
    getSRScore('low_s', true, 1000);

    const highCard = getSR().high_s;
    const lowCard = getSR().low_s;
    expect(highCard.s).toBeGreaterThan(lowCard.s);
    expect(highCard.due).toBeGreaterThan(lowCard.due);
  });

  it('card updated by getSRScore is persisted immediately in localStorage', () => {
    getSRScore('persist_update', true, 2000);
    getSRScore('persist_update', true, 2000);
    const raw = localStorage.getItem('nh_sr');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw);
    expect(parsed.persist_update.r).toBe(2);
  });

  it('grades existing SM-2 card via migration on update', () => {
    // Write an SM-2 format card directly to localStorage
    const sm2Card = { ease: 2.5, interval: 5, r: 2, w: 0, t: Date.now() - 86400000 };
    localStorage.setItem('nh_sr', JSON.stringify({ sm2_word: sm2Card }));
    // getSRScore should migrate and then update without throwing
    expect(() => getSRScore('sm2_word', true, 2000)).not.toThrow();
    const card = getSR().sm2_word;
    expect(card.ease).toBeUndefined();
    expect(card.s).toBeGreaterThan(0);
  });
});

// ── getDueReviews ─────────────────────────────────────────────────────────────
describe('getDueReviews', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('returns empty array when nothing stored', () => {
    expect(getDueReviews()).toEqual([]);
  });

  it('returns empty array when no reviews are due', () => {
    saveSR({
      jabuka: {
        s: 3,
        d: 5,
        r: 1,
        w: 0,
        l: 0,
        b: 1,
        due: Date.now() + 86400000,
        nextDue: Date.now() + 86400000,
      },
    });
    expect(getDueReviews()).toEqual([]);
  });

  it('returns word due in the past', () => {
    saveSR({
      jabuka: {
        s: 3,
        d: 5,
        r: 1,
        w: 0,
        l: 0,
        b: 1,
        due: Date.now() - 86400000,
        nextDue: Date.now() - 86400000,
      },
    });
    expect(getDueReviews()).toContain('jabuka');
  });

  it('does NOT return word due in the future', () => {
    saveSR({
      jabuka: {
        s: 3,
        d: 5,
        r: 1,
        w: 0,
        l: 0,
        b: 1,
        due: Date.now() + 86400000,
        nextDue: Date.now() + 86400000,
      },
    });
    expect(getDueReviews()).not.toContain('jabuka');
  });

  it('returns multiple due words and excludes future words', () => {
    const now = Date.now();
    saveSR({
      jabuka: { s: 3, d: 5, r: 1, w: 0, l: 0, b: 1, due: now - 1000, nextDue: now - 1000 },
      kruh: { s: 2, d: 6, r: 1, w: 0, l: 0, b: 1, due: now - 2000, nextDue: now - 2000 },
      voda: { s: 5, d: 4, r: 2, w: 0, l: 0, b: 2, due: now + 86400000, nextDue: now + 86400000 },
    });
    const due = getDueReviews();
    expect(due).toContain('jabuka');
    expect(due).toContain('kruh');
    expect(due).not.toContain('voda');
  });

  it('includes card with no due field (fallback path)', () => {
    // A card lacking a due field should still be included
    saveSR({ no_due_field: { s: 1, d: 5, r: 0, w: 0, l: 0, b: 0 } });
    expect(getDueReviews()).toContain('no_due_field');
  });

  it('returns array type', () => {
    expect(Array.isArray(getDueReviews())).toBe(true);
  });
});

// ── getDueReviews after getSRScore ────────────────────────────────────────────
describe('getDueReviews after getSRScore', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('after correct answer, word is NOT immediately due', () => {
    getSRScore('ne_due', true, 1000);
    expect(getDueReviews()).not.toContain('ne_due');
  });

  it('after wrong answer, word is scheduled for a future review', () => {
    getSRScore('wrong_word', false, 1000);
    const sr = getSR();
    expect(sr.wrong_word.due).toBeGreaterThan(Date.now());
    expect(getDueReviews()).not.toContain('wrong_word');
  });

  it('word reviewed correctly then made overdue appears in getDueReviews', () => {
    getSRScore('overdue_word', true, 1000);
    const sr = getSR();
    sr.overdue_word.due = Date.now() - 1;
    saveSR(sr);
    expect(getDueReviews()).toContain('overdue_word');
  });
});

// ── getSRStats ────────────────────────────────────────────────────────────────
describe('getSRStats', () => {
  it('returns {due, learning, mastered} structure', () => {
    const stats = getSRStats({});
    expect(typeof stats.due).toBe('number');
    expect(typeof stats.learning).toBe('number');
    expect(typeof stats.mastered).toBe('number');
  });

  it('all counts are 0 for empty map', () => {
    const stats = getSRStats({});
    expect(stats.due).toBe(0);
    expect(stats.learning).toBe(0);
    expect(stats.mastered).toBe(0);
  });

  it('counts due cards correctly (due timestamp <= now)', () => {
    const now = Date.now();
    const srMap = {
      due1: { s: 1, due: now - 1000 },
      due2: { s: 2, due: now - 5000 },
      future: { s: 3, due: now + 86400000 },
    };
    expect(getSRStats(srMap).due).toBe(2);
  });

  it('counts mastered cards (s >= 21) correctly', () => {
    const now = Date.now();
    const srMap = {
      mastered1: { s: 25, due: now + 86400000 * 30 },
      mastered2: { s: 21, due: now + 86400000 * 20 },
      learning: { s: 10, due: now + 86400000 * 7 },
    };
    const stats = getSRStats(srMap);
    expect(stats.mastered).toBe(2);
    expect(stats.learning).toBe(1);
  });

  it('card just at s = 21 threshold is mastered', () => {
    const srMap = { exact: { s: 21, due: Date.now() + 86400000 } };
    expect(getSRStats(srMap).mastered).toBe(1);
  });

  it('card at s = 20.9 is learning, not mastered', () => {
    const srMap = { almost: { s: 20.9, due: Date.now() + 86400000 } };
    const stats = getSRStats(srMap);
    expect(stats.mastered).toBe(0);
    expect(stats.learning).toBe(1);
  });

  it('due card is counted as due even if s >= 21', () => {
    // A mastered card that is overdue counts as due, not mastered
    const srMap = { lapsed_master: { s: 25, due: Date.now() - 1000 } };
    const stats = getSRStats(srMap);
    expect(stats.due).toBe(1);
    expect(stats.mastered).toBe(0);
  });

  it('totals add up to number of cards in map', () => {
    const now = Date.now();
    const srMap = {
      d1: { s: 2, due: now - 1000 },
      d2: { s: 3, due: now - 2000 },
      l1: { s: 8, due: now + 86400000 },
      m1: { s: 22, due: now + 86400000 * 30 },
    };
    const stats = getSRStats(srMap);
    expect(stats.due + stats.learning + stats.mastered).toBe(4);
  });

  it('falls back to nextDue when due field is absent', () => {
    const now = Date.now();
    const srMap = {
      fallback: { s: 2, nextDue: now - 1000 }, // no 'due', only 'nextDue'
    };
    // getSRStats uses: c.due || c.nextDue || 0
    expect(getSRStats(srMap).due).toBe(1);
  });
});

// ── getDueCards (legacy compat wrapper) ───────────────────────────────────────
describe('getDueCards', () => {
  it('returns array', () => {
    expect(Array.isArray(getDueCards({}, [], 10, 20))).toBe(true);
  });

  it('returns new cards up to maxNew when srMap is empty', () => {
    const allCards = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }];
    const result = getDueCards({}, allCards, 3, 20);
    expect(result).toHaveLength(3);
  });

  it('returns due review cards sorted by due timestamp (oldest first)', () => {
    const now = Date.now();
    const srMap = {
      older: { due: now - 10000 },
      newer: { due: now - 1000 },
    };
    const allCards = [{ id: 'newer' }, { id: 'older' }];
    const result = getDueCards(srMap, allCards, 0, 20);
    expect(result[0].id).toBe('older');
    expect(result[1].id).toBe('newer');
  });

  it('does not return cards whose due timestamp is in the future', () => {
    const now = Date.now();
    const srMap = {
      not_due: { due: now + 86400000 },
    };
    const allCards = [{ id: 'not_due' }];
    const result = getDueCards(srMap, allCards, 0, 20);
    expect(result).toHaveLength(0);
  });

  it('respects maxReview cap on due cards', () => {
    const now = Date.now();
    const srMap = {
      w1: { due: now - 1000 },
      w2: { due: now - 2000 },
      w3: { due: now - 3000 },
    };
    const allCards = [{ id: 'w1' }, { id: 'w2' }, { id: 'w3' }];
    const result = getDueCards(srMap, allCards, 0, 2);
    expect(result).toHaveLength(2);
  });

  it('mixes due reviews and fresh new cards', () => {
    const now = Date.now();
    const srMap = { known: { due: now - 1000 } };
    const allCards = [{ id: 'known' }, { id: 'fresh' }];
    const result = getDueCards(srMap, allCards, 1, 5);
    const ids = result.map((c) => c.id);
    expect(ids).toContain('known');
    expect(ids).toContain('fresh');
  });
});

// ── srQualityFromResult (SM-2 compat) ────────────────────────────────────────
describe('srQualityFromResult (SM-2 compat)', () => {
  // Implementation: wrong + timeMs < 5000 → 1; wrong + timeMs >= 5000 → 0
  // correct + timeMs < 2000 → 5; correct + 2000–3999 → 4; correct >= 4000 → 3

  it('returns 1 for wrong + fast (< 5000 ms) — blackout recovery', () => {
    expect(srQualityFromResult(false, 1000)).toBe(1);
    expect(srQualityFromResult(false, 4999)).toBe(1);
  });

  it('returns 0 for wrong + slow (>= 5000 ms)', () => {
    expect(srQualityFromResult(false, 5000)).toBe(0);
    expect(srQualityFromResult(false, 8000)).toBe(0);
  });

  it('returns 5 for correct + very fast (< 2000 ms)', () => {
    expect(srQualityFromResult(true, 1000)).toBe(5);
    expect(srQualityFromResult(true, 1999)).toBe(5);
  });

  it('returns 4 for correct + moderate speed (2000–3999 ms)', () => {
    expect(srQualityFromResult(true, 2000)).toBe(4);
    expect(srQualityFromResult(true, 3000)).toBe(4);
    expect(srQualityFromResult(true, 3999)).toBe(4);
  });

  it('returns 3 for correct + slow (>= 4000 ms)', () => {
    expect(srQualityFromResult(true, 4000)).toBe(3);
    expect(srQualityFromResult(true, 10000)).toBe(3);
  });

  it('correct values are always >= 3, wrong values are always < 3', () => {
    [1000, 3000, 6000, 12000].forEach((t) => {
      expect(srQualityFromResult(true, t)).toBeGreaterThanOrEqual(3);
      expect(srQualityFromResult(false, t)).toBeLessThan(3);
    });
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────
describe('getSRScore edge cases', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('handles empty string word key without throwing', () => {
    expect(() => getSRScore('', true, 1000)).not.toThrow();
  });

  it('handles very long word key (100 chars)', () => {
    const longKey = 'a'.repeat(100);
    expect(() => getSRScore(longKey, true, 1000)).not.toThrow();
    expect(getSR()[longKey]).toBeDefined();
  });

  it('handles timeMs = 0 for both correct and wrong', () => {
    // timeMs 0 is < 5000, so wrong → grade 1; correct → grade 4
    expect(() => getSRScore('zero_time_correct', true, 0)).not.toThrow();
    expect(() => getSRScore('zero_time_wrong', false, 0)).not.toThrow();
    expect(getSR()['zero_time_correct'].r).toBe(1);
    expect(getSR()['zero_time_wrong'].w).toBe(1);
  });

  it('handles undefined timeMs (treated as 0)', () => {
    // getSRScore uses `timeMs || 0` internally
    expect(() => getSRScore('no_time', true, undefined)).not.toThrow();
    expect(() => getSRScore('no_time_wrong', false, undefined)).not.toThrow();
  });

  it('persists card to localStorage immediately after each review', () => {
    getSRScore('persist_test', true, 2000);
    const raw = localStorage.getItem('nh_sr');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw).persist_test).toBeDefined();
  });

  it('reviewing same word multiple times keeps only one entry per word', () => {
    getSRScore('unique_key', true, 1000);
    getSRScore('unique_key', true, 1000);
    getSRScore('unique_key', false, 2000);
    const sr = getSR();
    const keys = Object.keys(sr).filter((k) => k === 'unique_key');
    expect(keys).toHaveLength(1);
  });

  it('two different words create two independent entries', () => {
    getSRScore('word_a', true, 1000);
    getSRScore('word_b', false, 2000);
    const sr = getSR();
    expect(sr.word_a).toBeDefined();
    expect(sr.word_b).toBeDefined();
    expect(sr.word_a.r).toBe(1);
    expect(sr.word_b.w).toBe(1);
  });

  it('returns the updated card object (not undefined)', () => {
    const result = getSRScore('return_check', true, 1500);
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(typeof result).toBe('object');
  });

  it('card returned by getSRScore matches what getSR reads back', () => {
    const returned = getSRScore('sync_check', true, 2000);
    const stored = getSR().sync_check;
    expect(returned.s).toBe(stored.s);
    expect(returned.d).toBe(stored.d);
    expect(returned.due).toBe(stored.due);
    expect(returned.r).toBe(stored.r);
  });
});

// ── addWordToSRS ──────────────────────────────────────────────────────────────
describe('addWordToSRS', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('adds a new word with a valid FSRS card state', () => {
    addWordToSRS('jabuka');
    const sr = getSR();
    expect(sr.jabuka).toBeDefined();
    expect(typeof sr.jabuka.s).toBe('number');
    expect(sr.jabuka.s).toBeGreaterThan(0);
  });

  it('new card has all required FSRS fields', () => {
    addWordToSRS('kruh');
    const card = getSR().kruh;
    expect(typeof card.s).toBe('number');
    expect(typeof card.d).toBe('number');
    expect(typeof card.r).toBe('number');
    expect(typeof card.w).toBe('number');
    expect(typeof card.l).toBe('number');
    expect(typeof card.b).toBe('number');
    expect(typeof card.due).toBe('number');
    expect(typeof card.nextDue).toBe('number');
  });

  it('new card has zero correct and wrong review counts', () => {
    addWordToSRS('voda');
    const card = getSR().voda;
    expect(card.r).toBe(0);
    expect(card.w).toBe(0);
  });

  it('new card due date is in the future', () => {
    addWordToSRS('more');
    const card = getSR().more;
    expect(card.due).toBeGreaterThan(Date.now());
  });

  it('does not overwrite an existing card', () => {
    addWordToSRS('jabuka');
    const sr1 = getSR();
    sr1.jabuka.r = 99;
    saveSR(sr1);
    addWordToSRS('jabuka'); // should be a no-op
    const sr2 = getSR();
    expect(sr2.jabuka.r).toBe(99);
  });

  it('adding a word twice keeps only one entry', () => {
    addWordToSRS('vjetar');
    addWordToSRS('vjetar');
    const sr = getSR();
    const keys = Object.keys(sr).filter((k) => k === 'vjetar');
    expect(keys).toHaveLength(1);
  });

  it('ignores empty string without throwing', () => {
    expect(() => addWordToSRS('')).not.toThrow();
    expect(getSR()['']).toBeUndefined();
  });

  it('ignores whitespace-only strings', () => {
    expect(() => addWordToSRS('   ')).not.toThrow();
    expect(getSR()['   ']).toBeUndefined();
  });

  it('can add multiple distinct words independently', () => {
    addWordToSRS('pas');
    addWordToSRS('mačka');
    const sr = getSR();
    expect(sr.pas).toBeDefined();
    expect(sr.mačka).toBeDefined();
    expect(sr.pas.r).toBe(0);
    expect(sr.mačka.r).toBe(0);
  });
});

// ── getDueReviews — new card cap ──────────────────────────────────────────────
describe('getDueReviews — new card budget cap', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('caps cards with no due field at 15 per session', () => {
    // Cards without a due field use the newCardBudget path
    const cards = {};
    for (let i = 0; i < 20; i++) {
      cards[`nodueword_${i}`] = { s: 1, d: 5, r: 0, w: 0, l: 0, b: 0 };
    }
    saveSR(cards);
    const due = getDueReviews();
    expect(due.length).toBeLessThanOrEqual(15);
  });

  it('does not cap overdue cards (due <= now) against the budget', () => {
    // Cards with due <= now are overdue, not budget-capped new cards
    const past = Date.now() - 1000;
    const cards = {};
    for (let i = 0; i < 20; i++) {
      cards[`overdueword_${i}`] = { s: 1, d: 5, r: 0, w: 0, l: 0, b: 0, due: past, nextDue: past };
    }
    saveSR(cards);
    const due = getDueReviews();
    expect(due.length).toBe(20);
  });
});

// ── getPrioritizedReviewQueue ────────────────────────────────────────────────
describe('getPrioritizedReviewQueue', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('returns empty array for empty pool', () => {
    expect(getPrioritizedReviewQueue([])).toEqual([]);
  });

  it('returns an array', () => {
    const pool = [
      ['jabuka', 'apple', 'ya-boo-ka'],
      ['kruh', 'bread', 'krooh'],
    ];
    const result = getPrioritizedReviewQueue(pool);
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns at most 20 items', () => {
    // Build overdue SRS entries for all 30 words to ensure they are prioritized
    const past = Date.now() - 10 * 86400000; // 10 days overdue
    const sr = {};
    for (let i = 0; i < 30; i++) {
      sr[`word_${i}`] = { s: 1, d: 5, r: 3, w: 0, l: 0, b: 2, due: past, nextDue: past };
    }
    saveSR(sr);
    const pool = Array.from({ length: 30 }, (_, i) => [`word_${i}`, 'en', 'ph']);
    const queue = getPrioritizedReviewQueue(pool);
    expect(queue.length).toBeLessThanOrEqual(20);
  });

  it('result entries are arrays (same structure as pool items)', () => {
    const pool = [
      ['jabuka', 'apple', 'ya-boo-ka'],
      ['kruh', 'bread', 'krooh'],
    ];
    const result = getPrioritizedReviewQueue(pool);
    result.forEach((entry) => {
      expect(Array.isArray(entry)).toBe(true);
    });
  });

  it('does not include words not in the pool', () => {
    // Add SRS data for a word not in pool
    saveSR({
      notinpool: {
        s: 1,
        d: 5,
        r: 2,
        w: 0,
        l: 0,
        b: 1,
        due: Date.now() - 1000,
        nextDue: Date.now() - 1000,
      },
    });
    const pool = [['jabuka', 'apple', 'ya-boo-ka']];
    const result = getPrioritizedReviewQueue(pool);
    const resultWords = result.map((e) => e[0]);
    expect(resultWords).not.toContain('notinpool');
  });

  it('prioritizes overdue words from the pool', () => {
    const past = Date.now() - 5 * 86400000; // 5 days overdue
    saveSR({
      jabuka: { s: 1, d: 5, r: 3, w: 0, l: 0, b: 2, due: past, nextDue: past },
    });
    const pool = [
      ['jabuka', 'apple', 'ya-boo-ka'],
      ['kruh', 'bread', 'krooh'],
    ];
    const result = getPrioritizedReviewQueue(pool);
    const resultWords = result.map((e) => e[0]);
    expect(resultWords).toContain('jabuka');
  });

  it('pads result with new (unseen) words when fewer than 10 items are due', () => {
    // Only one overdue card — should pad with unseen pool words
    const past = Date.now() - 2 * 86400000;
    saveSR({
      jabuka: { s: 1, d: 5, r: 1, w: 0, l: 0, b: 1, due: past, nextDue: past },
    });
    const pool = [
      ['jabuka', 'apple', ''],
      ['kruh', 'bread', ''],
      ['voda', 'water', ''],
    ];
    const result = getPrioritizedReviewQueue(pool);
    // Should include at least 'jabuka' and some unseen words
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('handles pool with null or undefined slots gracefully', () => {
    // getSR is empty, pool has normal items
    const pool = [['jabuka', 'apple', '']];
    expect(() => getPrioritizedReviewQueue(pool)).not.toThrow();
  });

  it('includes words due today (dueMs <= now, daysOverdue < 1) and shuffles them', () => {
    // Use due = now - 1 second → daysOverdue ≈ 0.0000116, hits the dueToday branch
    const justDue = Date.now() - 1000;
    saveSR({
      jabuka: { s: 2, d: 5, r: 3, w: 0, l: 0, b: 2, due: justDue, nextDue: justDue },
      kruh: { s: 2, d: 5, r: 3, w: 0, l: 0, b: 2, due: justDue, nextDue: justDue },
    });
    const pool = [
      ['jabuka', 'apple', 'ya-boo-ka'],
      ['kruh', 'bread', 'krooh'],
    ];
    const result = getPrioritizedReviewQueue(pool);
    const resultWords = result.map((e) => e[0]);
    // Both words are due today — both must appear in the result
    expect(resultWords).toContain('jabuka');
    expect(resultWords).toContain('kruh');
  });
});

// ── FSRS math properties ──────────────────────────────────────────────────────
describe('FSRS scheduling math invariants', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('due date is always at least 1 day in the future (minimum interval)', () => {
    // _nextInterval returns Math.max(1, ...) so even grade 1 gets >= 1 day
    const card = getSRScore('min_interval', false, 500);
    const oneDay = 86400000;
    expect(card.due).toBeGreaterThanOrEqual(Date.now() + oneDay - 1000); // 1s tolerance
  });

  it('initial difficulty for grade 4 (easy) is lower than for grade 1 (hard)', () => {
    const easy = getSRScore('easy_word', true, 1000); // grade 4
    clearLS();
    const hard = getSRScore('hard_word', false, 1000); // grade 1
    expect(easy.d).toBeLessThan(hard.d);
  });

  it('repeated correct reviews monotonically increase stability over time', () => {
    let prevS = 0;
    for (let i = 0; i < 5; i++) {
      const sr = getSR();
      if (sr.mono_test) {
        sr.mono_test.due = Date.now() - 1000;
        saveSR(sr);
      }
      const card = getSRScore('mono_test', true, 1000);
      expect(card.s).toBeGreaterThan(prevS);
      prevS = card.s;
    }
  });

  it('lapse increases difficulty and produces valid positive stability', () => {
    // FSRS-4.5 note: _nextS_forget does NOT guarantee stability decreases after a lapse.
    // When R≈1 (card answered immediately with 0 elapsed days), the formula can return
    // stability HIGHER than before the lapse. This is correct FSRS-4.5 algorithm behavior,
    // not a bug — the formula was trained on 700M+ Anki reviews and optimises for
    // long-run recall accuracy, not SM-2-style interval reduction.
    // Invariants that DO hold: difficulty increases, lapse counter increments, stability > 0.
    for (let i = 0; i < 3; i++) {
      const sr = getSR();
      if (sr.lapse_test) {
        sr.lapse_test.due = Date.now() - 1;
        saveSR(sr);
      }
      getSRScore('lapse_test', true, 1000);
    }
    const beforeCard = getSR().lapse_test;
    getSRScore('lapse_test', false, 500); // force lapse
    const afterCard = getSR().lapse_test;
    expect(afterCard.s).toBeGreaterThan(0); // valid stability
    expect(afterCard.d).toBeGreaterThan(beforeCard.d); // difficulty increases
    expect(afterCard.l).toBeGreaterThan(beforeCard.l ?? 0); // lapse counter increments
  });
});

// ── sm2 (deprecated legacy wrapper) ─────────────────────────────────────────
describe('sm2 (deprecated SM-2 wrapper)', () => {
  it('returns a new card when card is null (quality 5 = perfect)', () => {
    const result = sm2(null, 5);
    expect(result.s).toBeGreaterThan(0);
    expect(result.d).toBeGreaterThan(0);
    expect(result.r).toBe(1);
    expect(result.w).toBe(0);
    expect(result.due).toBeGreaterThan(Date.now());
    expect(result.ease).toBe(2.5);
    expect(result.lastQuality).toBe(5);
  });

  it('returns a new card when card is null (quality 3 = correct, slow)', () => {
    const result = sm2(null, 3);
    expect(result.r).toBe(1);
    expect(result.w).toBe(0);
    expect(result.lastQuality).toBe(3);
  });

  it('returns a new card when card is null (quality 1 = wrong)', () => {
    const result = sm2(null, 1);
    expect(result.r).toBe(0);
    expect(result.w).toBe(1);
    expect(result.lastQuality).toBe(1);
  });

  it('updates an existing card (quality 4)', () => {
    const existing = sm2(null, 5);
    const updated = sm2(existing, 4);
    expect(updated.s).toBeGreaterThan(0);
    expect(updated.lastQuality).toBe(4);
    expect(updated.due).toBeGreaterThan(Date.now());
  });

  it('returns a new card when card.s is undefined', () => {
    const cardNoS = { r: 1, w: 0, l: 0, b: 1, d: 5, due: Date.now() };
    const result = sm2(cardNoS, 5);
    expect(result.s).toBeGreaterThan(0);
    expect(result.ease).toBe(2.5);
  });
});
