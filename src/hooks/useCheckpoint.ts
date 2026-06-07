// src/hooks/useCheckpoint.ts
import { useState, useCallback } from 'react';
import type { CefrLevel } from '../lib/cefr.js';
import type { SkillScores, SkillKey } from '../lib/cefrCertification.js';
import { getCertificationState, writeCertificationState } from '../lib/cefrCertification.js';
import { recordCheckpointResult } from '../lib/checkpointStore.js';
import { buildCheckpointExam, type CheckpointExam } from '../lib/checkpointExam.js';
import type { CheckpointOutcome } from '../lib/checkpointPolicy.js';
import { whisperClaudeScorer } from '../lib/speaking/whisperClaudeScorer.js';

type Phase = 'idle' | 'running' | 'result';

export interface UseCheckpointArgs {
  certifiedLevel: CefrLevel;
  weakSkills: SkillKey[];
  activeDayCount: number;
}

/** Seeded-free RNG is fine at runtime (determinism only matters in tests). */
function rng() {
  return Math.random();
}

export function useCheckpoint({ certifiedLevel, weakSkills, activeDayCount }: UseCheckpointArgs) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [exam, setExam] = useState<CheckpointExam | null>(null);
  const [outcome, setOutcome] = useState<CheckpointOutcome | null>(null);

  const start = useCallback(() => {
    const built = buildCheckpointExam(certifiedLevel, getCertificationState(), weakSkills, rng);
    setExam(built);
    setPhase('running');
  }, [certifiedLevel, weakSkills]);

  const complete = useCallback(
    (scores: SkillScores) => {
      const o = recordCheckpointResult({ level: certifiedLevel, scores, activeDayCount });
      setOutcome(o);
      setPhase('result');
    },
    [certifiedLevel, activeDayCount],
  );

  const snooze = useCallback((until: number) => {
    const s = getCertificationState();
    s.checkpoints.snoozedUntil = until;
    writeCertificationState(s);
    setPhase('idle');
  }, []);

  const reset = useCallback(() => {
    setPhase('idle');
    setExam(null);
    setOutcome(null);
  }, []);

  return { phase, exam, outcome, scorer: whisperClaudeScorer, start, complete, snooze, reset };
}
