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
      <div className="cp-result" data-testid="result-pass">
        <div className="cp-badge">
          <div className="core">✓</div>
        </div>
        <h2 className="cp-result-title">{level} confirmed! 🎉</h2>
        <p className="cp-result-sub">Your {level} is the real deal. Badge kept, streak intact.</p>
        {outcome.kind === 'pass_focus' && outcome.focusSkills.length > 0 && (
          <p className="cp-result-focus" data-testid="result-focus">
            Strong overall — we&apos;ll weave extra{' '}
            {outcome.focusSkills.map((s) => skillLabel[s] ?? s).join(', ')} practice into your{' '}
            {level} lessons.
          </p>
        )}
        <button className="b bp" onClick={onContinue}>
          Keep going →
        </button>
      </div>
    );
  }

  if (outcome.kind === 'grace') {
    return (
      <div className="cp-result" data-testid="result-grace">
        <div className="cp-badge warn">
          <div className="core">↻</div>
        </div>
        <h2 className="cp-result-title">Almost — let&apos;s shore this up</h2>
        <p className="cp-result-sub">
          A couple of {outcome.failedSkills.map((s) => skillLabel[s] ?? s).join(', ')} answers
          slipped. Try a quick focused round now — your {level} stays put.
        </p>
        <button className="b bp" data-testid="result-retry" onClick={onRetry}>
          Focused retry →
        </button>
        <button className="cp-result-ghost" onClick={onContinue}>
          Later
        </button>
      </div>
    );
  }

  // demote
  const to = outcome.demotion?.to ?? level;
  return (
    <div className="cp-result" data-testid="result-demote">
      <div className="cp-badge warn">
        <div className="core">↻</div>
      </div>
      <h2 className="cp-result-title">Let&apos;s lock in {level}</h2>
      <div className="cp-lvl-move">
        <span className="cp-lvl-chip from">{level}</span> →{' '}
        <span className="cp-lvl-chip to">{to}</span>
      </div>
      <p className="cp-result-sub">
        A few {level} ideas aren&apos;t solid yet — totally normal. We&apos;ll strengthen them, then
        you re-earn {level}. <b>Your XP &amp; streak stay untouched.</b>
      </p>
      <div className="cp-result-lab">Your focus</div>
      <ul className="cp-result-list">
        {outcome.failedSkills.map((s) => (
          <li key={s}>{skillLabel[s] ?? s}</li>
        ))}
      </ul>
      <button className="b bp" onClick={onContinue}>
        Start focused practice →
      </button>
    </div>
  );
}
