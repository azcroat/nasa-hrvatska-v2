// src/components/practice/ConjugationSessionDrill.tsx
// Session-launched conjugation drill: turns a surfaced adaptive category into a
// level-gated, SR-prioritized drill and closes the adaptive loop on completion.
import React, { useMemo } from 'react';
import { H } from '../../data';
import { useGrammar } from '../../hooks/useGrammar';
import { getSR } from '../../lib/srs';
import { rateCategorySession } from '../../lib/adaptive';
import type { SkillCategory } from '../../lib/adaptive';
import { clearSessionCategory } from '../../lib/sessionCategory';
import { signalSessionCompleteIfActive } from '../../lib/sessionSignal';
import ConjugationDrillEngine from './ConjugationDrillEngine';
import { cellsForCategory, type Cefr } from '../../lib/conjugation/category';
import { dueConjKeys } from '../../lib/conjugation/cells';
import { DAILY_CONJ_SET_SIZE } from '../../lib/conjugation/conjugationConfig';
import type { ConjVerb } from '../../lib/conjugation/types';

interface Props {
  category: SkillCategory;
  cefr: Cefr;
  goBack: () => void;
  award: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

function daySeedNow(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

export default function ConjugationSessionDrill({ category, cefr, goBack, award }: Props) {
  const { grammar, loading, error } = useGrammar();

  const verbs = useMemo<ConjVerb[]>(
    () => (grammar?.VERBS as unknown as ConjVerb[]) || [],
    [grammar],
  );
  const cells = useMemo(() => {
    if (!verbs.length) return [];
    const dueKeys = dueConjKeys(getSR() as Record<string, { nextDue?: number }>, Date.now());
    return cellsForCategory(category, verbs, cefr, {
      size: DAILY_CONJ_SET_SIZE,
      daySeed: daySeedNow(),
      dueKeys,
    });
  }, [verbs, category, cefr]);

  if (error) {
    return (
      <div className="scr-wrap">
        {H('🔄 Conjugation', '', goBack)}
        <div className="c">Couldn’t load — retry.</div>
      </div>
    );
  }
  if (loading || !grammar) {
    return (
      <div className="scr-wrap">
        {H('🔄 Conjugation', '', goBack)}
        <div className="c">Loading…</div>
      </div>
    );
  }
  if (cells.length === 0) {
    return (
      <div className="scr-wrap">
        {H('🔄 Conjugation', '', goBack)}
        <div className="c" data-testid="conj-empty" style={{ textAlign: 'center', marginTop: 24 }}>
          Nothing to drill here yet.
          <button className="b bp" style={{ marginTop: 16 }} onClick={goBack}>
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <ConjugationDrillEngine
      verbs={verbs}
      cells={cells}
      award={award}
      goBack={goBack}
      onComplete={(score, total) => {
        // Rate the conjugation category with real accuracy, then clear the session
        // bridge so HomeTab's fallback consume can't double-rate it on return.
        rateCategorySession(category, total ? score / total : 0);
        clearSessionCategory();
        // Advance Today's Session. The conjugation drill runs under curEx
        // 'conjpractice:<category>', which never matched the launched screen
        // 'conjpractice' in the award handshake — so without this, conjugation
        // activities never completed and the session stuck here. We know our
        // screen id, so pass it for a screen-accurate signal.
        signalSessionCompleteIfActive('conjpractice');
        goBack();
      }}
    />
  );
}
