// src/components/practice/correctionDiff.utils.ts
// SP6: pure projection from (originalText, changes[]) to an ordered array of
// React nodes (strings and <DiffSpan> elements). Uses the AI's `changes` array
// as the diff source — no external diff library.

import React from 'react';
import { DiffSpan } from './DiffSpan';

// SP6b: classification of the underlying grammar mistake. Drives the
// colored dot + popover header tag in DiffSpan. Optional — when the AI
// correction doesn't provide one, the span falls back to a neutral gray.
export type ErrorType =
  | 'case'
  | 'aspect'
  | 'agreement'
  | 'tense'
  | 'word_order'
  | 'vocab'
  | 'spelling'
  | 'other';

export interface CorrectionChange {
  original: string;
  corrected: string;
  note?: string;
  errorType?: ErrorType;
}

interface Marker {
  start: number;
  end: number;
  changeIndex: number;
  original: string;
  corrected: string;
  note?: string;
  errorType?: ErrorType;
}

export function projectChangesToNodes(
  originalText: string,
  changes: CorrectionChange[],
): React.ReactNode[] {
  if (!originalText || !changes || changes.length === 0) return [originalText];

  const markers: Marker[] = [];
  const consumed: Array<[number, number]> = [];

  function regionFree(start: number, end: number): boolean {
    for (const [s, e] of consumed) {
      if (start < e && end > s) return false;
    }
    return true;
  }

  function findFreeOccurrence(needle: string, from: number): number {
    let idx = originalText.indexOf(needle, from);
    while (idx !== -1) {
      if (regionFree(idx, idx + needle.length)) return idx;
      idx = originalText.indexOf(needle, idx + 1);
    }
    return -1;
  }

  changes.forEach((c, changeIndex) => {
    if (!c || typeof c.original !== 'string' || c.original.length === 0) return;
    const at = findFreeOccurrence(c.original, 0);
    if (at === -1) {
      if (import.meta.env.DEV) {
        console.warn('[CorrectionDiff] dropped change — original not found:', c.original);
      }
      return;
    }
    const end = at + c.original.length;
    markers.push({
      start: at,
      end,
      changeIndex,
      original: c.original,
      corrected: typeof c.corrected === 'string' ? c.corrected : '',
      note: c.note,
      errorType: c.errorType,
    });
    consumed.push([at, end]);
  });

  markers.sort((a, b) => a.start - b.start);

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  markers.forEach((m, i) => {
    if (m.start > cursor) {
      nodes.push(originalText.slice(cursor, m.start));
    }
    nodes.push(
      React.createElement(DiffSpan, {
        key: `diff-${m.changeIndex}-${i}`,
        original: m.original,
        corrected: m.corrected,
        note: m.note,
        errorType: m.errorType,
        index: m.changeIndex,
      }),
    );
    cursor = m.end;
  });
  if (cursor < originalText.length) {
    nodes.push(originalText.slice(cursor));
  }

  return nodes;
}
