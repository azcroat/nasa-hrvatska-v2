// src/components/exam/CheckpointInviteModal.tsx
import type { CefrLevel } from '../../lib/cefr.js';

export interface CheckpointInviteModalProps {
  level: CefrLevel;
  onStart: () => void;
  onSnooze: () => void;
}

// Šahovnica mini-crest — WHITE always top-left; (row+col)%2===0 → white else red.
const CREST_CELLS = Array.from({ length: 25 }, (_, i) => {
  const row = Math.floor(i / 5);
  const col = i % 5;
  return (row + col) % 2 === 0 ? '#f8f8f8' : '#CC0000';
});

/**
 * The 5-active-day check-in invite — a calm, centered popup that uses the app's
 * own design tokens so it reads as part of the product, not a bolt-on.
 */
export default function CheckpointInviteModal({
  level,
  onStart,
  onSnooze,
}: CheckpointInviteModalProps) {
  return (
    <div className="cp-backdrop" role="dialog" aria-modal="true" data-testid="checkpoint-invite">
      <div className="cp-invite-card">
        <div className="cp-crest" aria-hidden>
          {CREST_CELLS.map((bg, i) => (
            <i key={i} style={{ background: bg }} />
          ))}
        </div>
        <div className="cp-eyebrow">PROVJERA ZNANJA · {level}</div>
        <h2 className="cp-title" lang="hr">
          Spreman za provjeru?
        </h2>
        <p className="cp-subtitle">Ready for a quick check?</p>
        <p className="cp-lede">
          You&apos;ve been learning at <b>{level}</b>. Let&apos;s make sure it&apos;s truly yours —
          a few questions plus a short speaking task, about 3 minutes.
        </p>
        <ul className="cp-bullets">
          <li>Covers reading, grammar &amp; vocabulary</li>
          <li>Plus speaking and 2 retention items from earlier levels</li>
          <li>
            Pass 80%+ to keep your <b>{level}</b> badge
          </li>
        </ul>
        <button className="b bp cp-cta" data-testid="checkpoint-start" onClick={onStart}>
          Start the check →
        </button>
        <button className="cp-ghost" data-testid="checkpoint-snooze" onClick={onSnooze}>
          Remind me tonight
        </button>
      </div>
    </div>
  );
}
