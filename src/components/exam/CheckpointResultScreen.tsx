// src/components/exam/CheckpointResultScreen.tsx
import type { CefrLevel } from '../../lib/cefr.js';
import type { CheckpointOutcome } from '../../lib/checkpointPolicy.js';

export interface CheckpointResultScreenProps {
  level: CefrLevel;
  outcome: CheckpointOutcome;
  onContinue: () => void;
  /** Required for the grace variant (immediate targeted retry). */
  onRetry?: () => void;
}

const skillLabel: Record<string, string> = {
  vocab: 'Vocabulary',
  grammar: 'Grammar',
  reading: 'Reading',
  listening: 'Listening',
  speaking: 'Speaking',
};

export default function CheckpointResultScreen({
  level,
  outcome,
  onContinue,
  onRetry,
}: CheckpointResultScreenProps) {
  if (outcome.kind === 'pass' || outcome.kind === 'pass_focus') {
    return (
      <div className="checkpoint-result center-col" data-testid="result-pass">
        <div className="badge-ring">
          <div className="core">✓</div>
        </div>
        <h2>{level} confirmed! 🎉</h2>
        <p className="subtitle">Your {level} is the real deal. Badge kept, streak intact.</p>
        {outcome.kind === 'pass_focus' && outcome.focusSkills.length > 0 && (
          <p className="focus-note" data-testid="result-focus">
            Strong overall — we'll weave extra{' '}
            {outcome.focusSkills.map((s) => skillLabel[s] ?? s).join(', ')} practice into your{' '}
            {level} lessons.
          </p>
        )}
        <button className="btn btn-primary" onClick={onContinue}>
          Keep going →
        </button>
      </div>
    );
  }

  if (outcome.kind === 'grace') {
    return (
      <div className="checkpoint-result center-col" data-testid="result-grace">
        <div className="badge-ring warn">
          <div className="core">↻</div>
        </div>
        <h2>Almost — let's shore this up</h2>
        <p className="subtitle">
          A couple of {outcome.failedSkills.map((s) => skillLabel[s] ?? s).join(', ')} answers
          slipped. Try a quick focused round now — your {level} stays put.
        </p>
        <button className="btn btn-primary" data-testid="result-retry" onClick={onRetry}>
          Focused retry →
        </button>
        <button className="btn btn-ghost" onClick={onContinue}>
          Later
        </button>
      </div>
    );
  }

  // demote
  const to = outcome.demotion?.to ?? level;
  return (
    <div className="checkpoint-result center-col" data-testid="result-demote">
      <div className="badge-ring warn">
        <div className="core">↻</div>
      </div>
      <h2>Let's lock in {level}</h2>
      <div className="lvl-move">
        <span className="lvl-chip from">{level}</span> → <span className="lvl-chip to">{to}</span>
      </div>
      <p className="reassure">
        A few {level} ideas aren't solid yet — totally normal. We'll strengthen them, then you
        re-earn {level}.<b> Your XP &amp; streak stay untouched.</b>
      </p>
      <div className="focus-lab">Your focus</div>
      <ul>
        {outcome.failedSkills.map((s) => (
          <li key={s}>{skillLabel[s] ?? s}</li>
        ))}
      </ul>
      <button className="btn btn-primary" onClick={onContinue}>
        Start focused practice →
      </button>
    </div>
  );
}
