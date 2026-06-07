// src/components/exam/CheckpointInviteModal.tsx
import type { CefrLevel } from '../../lib/cefr.js';

export interface CheckpointInviteModalProps {
  level: CefrLevel;
  onStart: () => void;
  onSnooze: () => void;
}

/** The 5-active-day check-in invite (approved mockup screen 1). */
export default function CheckpointInviteModal({
  level,
  onStart,
  onSnooze,
}: CheckpointInviteModalProps) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" data-testid="checkpoint-invite">
      <div className="modal-card checkpoint-invite">
        <div className="knight" aria-hidden>
          🛡️
        </div>
        <h2 lang="hr">Spreman za provjeru?</h2>
        <p className="subtitle">Ready for a quick check?</p>
        <p>
          You've been learning at <b>{level}</b>. Let's make sure it's truly yours — a few questions
          plus a short speaking task, about 3 minutes.
        </p>
        <ul className="checkpoint-bullets">
          <li>Covers reading, grammar &amp; vocab</li>
          <li>Plus speaking and 2 retention items from earlier levels</li>
          <li>Pass 80%+ to keep your {level} badge</li>
        </ul>
        <button className="btn btn-primary" data-testid="checkpoint-start" onClick={onStart}>
          Start the check →
        </button>
        <button className="btn btn-ghost" data-testid="checkpoint-snooze" onClick={onSnooze}>
          Remind me tonight
        </button>
      </div>
    </div>
  );
}
