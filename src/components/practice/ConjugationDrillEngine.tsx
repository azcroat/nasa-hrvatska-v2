// src/components/practice/ConjugationDrillEngine.tsx
import React, { useMemo, useState, useRef } from 'react';
import { H, Bar, speak, sh } from '../../data';
import { markQuest } from '../../lib/quests';
import { recordTopicResult } from '../../lib/adaptive';
import { getSRScore } from '../../lib/srs';
import { buildCardKey } from '../../lib/conjugation/cardKey';
import { buildDistractors } from '../../lib/conjugation/distractors';
import { formFor } from '../../lib/conjugation/forms';
import { PERSONS_6, PERSONS_IMP } from '../../lib/conjugation/types';
import type { ConjVerb, ConjCell } from '../../lib/conjugation/types';

interface Props {
  verbs: ConjVerb[];
  cells: ConjCell[]; // ordered queue of cells to drill
  onComplete: (score: number, total: number) => void;
  award: (xp: number, celebrate?: boolean, activityType?: string) => void;
  goBack: () => void;
}

const TENSE_LABEL: Record<string, string> = {
  present: 'PRESENT',
  past: 'PAST',
  future1: 'FUTURE',
  imperative: 'IMPERATIVE',
  conditional: 'CONDITIONAL',
};

function personLabel(cell: ConjCell): string {
  const arr = cell.formType === 'imperative' ? PERSONS_IMP : PERSONS_6;
  return arr[cell.personIdx] ?? '';
}

export default function ConjugationDrillEngine({ verbs, cells, onComplete, award, goBack }: Props) {
  const byInf = useMemo(() => new Map(verbs.map((v) => [v.inf, v])), [verbs]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const startRef = useRef<number>(0);
  const finished = useRef(false);

  const cell = cells[i];
  const verb = cell ? byInf.get(cell.inf) : undefined;
  const correct = verb && cell ? formFor(verb, cell) : null;

  // Build options once per question (re-derived when the cell changes).
  const options = useMemo(() => {
    if (!verb || !cell || !correct) return [];
    const distractors = buildDistractors({ verb, cell, correct, allVerbs: verbs });
    return sh([correct, ...distractors]);
  }, [verb, cell, correct, verbs]);

  // start timer per question
  if (startRef.current === 0) startRef.current = Date.now();

  if (!cell || !verb || !correct) {
    // finished or malformed cell → results
    const total = cells.length;
    if (!finished.current) {
      finished.current = true;
      if (typeof award === 'function') award(score * 2 + 10, false, 'grammar');
      markQuest('grammar');
      onComplete(score, total);
    }
    const pct = total ? Math.round((score / total) * 100) : 0;
    return (
      <div className="scr-wrap">
        {H('🔄 Conjugation', 'Drill complete', goBack)}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <div style={{ fontSize: 64 }}>{pct >= 80 ? '🏆' : '👍'}</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>
            {score} / {total}
          </div>
          <button className="b bp" style={{ marginTop: 16 }} onClick={goBack}>
            Done
          </button>
        </div>
      </div>
    );
  }

  const total = cells.length;
  function choose(opt: string) {
    if (answered || !cell) return;
    const isCorrect = opt === correct;
    setSelected(opt);
    setAnswered(true);
    if (isCorrect) setScore((s) => s + 1);
    const elapsed = Date.now() - startRef.current;
    getSRScore(buildCardKey(cell), isCorrect, elapsed); // feed FSRS
    recordTopicResult('grammar', isCorrect);
  }
  function next() {
    setAnswered(false);
    setSelected(null);
    startRef.current = 0;
    setI((n) => n + 1);
  }

  return (
    <div className="scr-wrap">
      {H('🔄 Conjugation', `${i + 1} / ${total}`, goBack)}
      <Bar v={i + 1} mx={total} h={6} />
      <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-block',
            padding: '3px 12px',
            borderRadius: 14,
            fontSize: 11,
            fontWeight: 800,
            color: '#fff',
            background: '#0e7490',
          }}
        >
          {TENSE_LABEL[cell.formType]}
          {cell.gender ? ` (${cell.gender})` : ''}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>
          {verb.inf} ({verb.en})
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0e7490', marginTop: 8 }}>
          {personLabel(cell)} ___?
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        {options.map((o, oi) => (
          <button
            key={oi}
            data-testid="conj-option"
            className={
              'ob ' + (answered ? (o === correct ? 'ok' : selected === o ? 'no' : '') : '')
            }
            onClick={() => {
              choose(o);
              if (o === correct) speak(o);
            }}
          >
            {o}
          </button>
        ))}
      </div>
      {answered && (
        <div data-testid="conj-feedback" className="c" style={{ marginTop: 12, fontSize: 14 }}>
          {selected === correct ? '✓ Točno!' : `✗ ${selected} — ${personLabel(cell)} → ${correct}`}
        </div>
      )}
      {answered && (
        <button className="b bp" style={{ width: '100%', marginTop: 16 }} onClick={next}>
          {i < total - 1 ? 'Next →' : 'See Results'}
        </button>
      )}
    </div>
  );
}
