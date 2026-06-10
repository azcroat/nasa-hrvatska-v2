// src/components/practice/ConjugationLab.tsx
import React, { useState } from 'react';
import { H } from '../../data';
import { useGrammar } from '../../hooks/useGrammar';
import { getSR } from '../../lib/srs';
import ConjugationDrillEngine from './ConjugationDrillEngine';
import { UNITS } from '../../lib/conjugation/curriculum';
import { cellsForUnit, dueConjKeys } from '../../lib/conjugation/cells';
import { selectDailySet } from '../../lib/conjugation/dailySet';
import { cellMastery, type MasteryLevel } from '../../lib/conjugation/mastery';
import { CONJ_LAB_ENABLED, DAILY_CONJ_SET_SIZE } from '../../lib/conjugation/conjugationConfig';
import type { ConjVerb, ConjCell } from '../../lib/conjugation/types';

interface Props {
  goBack: () => void;
  award: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

const RING: Record<MasteryLevel, string> = { new: '○', learning: '◐', mastered: '●' };

function daySeedNow(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

// Derive a single mastery level for a whole unit from its cells' SR state.
function unitMastery(cells: ConjCell[], sr: Record<string, { s?: number }>): MasteryLevel {
  if (cells.length === 0) return 'new';
  const levels = cells.map((c) =>
    cellMastery(sr[`conj|${c.inf}|${c.formType}|${c.personIdx}${c.gender ? '|' + c.gender : ''}`]),
  );
  if (levels.every((l) => l === 'mastered')) return 'mastered';
  if (levels.some((l) => l !== 'new')) return 'learning';
  return 'new';
}

export default function ConjugationLab({ goBack, award }: Props) {
  const { grammar, loading, error } = useGrammar();
  const [activeCells, setActiveCells] = useState<ConjCell[] | null>(null);

  if (!CONJ_LAB_ENABLED) {
    return <div className="scr-wrap">{H('🔄 Conjugation Lab', 'Coming soon', goBack)}</div>;
  }
  if (error) {
    return (
      <div className="scr-wrap">
        {H('🔄 Conjugation Lab', '', goBack)}
        <div className="c">Couldn’t load — please retry.</div>
      </div>
    );
  }
  if (loading || !grammar) {
    return (
      <div className="scr-wrap">
        {H('🔄 Conjugation Lab', '', goBack)}
        <div className="c">Loading…</div>
      </div>
    );
  }

  const verbs = (grammar.VERBS as unknown as ConjVerb[]) || [];

  if (activeCells) {
    return (
      <ConjugationDrillEngine
        verbs={verbs}
        cells={activeCells}
        award={award}
        goBack={() => setActiveCells(null)}
        onComplete={() => {
          /* mastery recomputes from SR on return to the hub */
        }}
      />
    );
  }

  const sr = getSR() as Record<string, { s?: number; nextDue?: number }>;

  return (
    <div className="scr-wrap">
      {H('🔄 Conjugation Lab', 'Master Croatian verbs A1–B2', goBack)}

      <button
        className="b bp"
        data-testid="conj-daily-start"
        style={{ width: '100%', marginTop: 8 }}
        onClick={() => {
          const all = UNITS.flatMap((u) => cellsForUnit(u, verbs));
          const due = dueConjKeys(sr, Date.now());
          const set = selectDailySet({
            candidates: all,
            dueKeys: due,
            size: DAILY_CONJ_SET_SIZE,
            daySeed: daySeedNow(),
          });
          if (set.length) setActiveCells(set);
        }}
      >
        🔥 Daily Conjugation Set ({DAILY_CONJ_SET_SIZE})
      </button>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {UNITS.map((u) => {
          const cells = cellsForUnit(u, verbs);
          const m = unitMastery(cells, sr);
          return (
            <button
              key={u.id}
              className="tc"
              data-testid="conj-unit"
              disabled={cells.length === 0}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                cursor: cells.length ? 'pointer' : 'default',
                opacity: cells.length ? 1 : 0.5,
              }}
              onClick={() => {
                if (cells.length) setActiveCells(cells);
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0e7490' }}>
                  {u.cefr} · {u.title}
                </div>
                <div style={{ fontSize: 12, color: '#78716c' }}>{u.blurb}</div>
              </div>
              <div style={{ fontSize: 20 }}>{RING[m]}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
