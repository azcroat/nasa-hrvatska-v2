import React from 'react';

/**
 * Challenge intent panel — the "Quick Games" grid (Quiz / Flashcards / Match /
 * Typing / Listening / Speaking / Word Sprint). Extracted from PracticeTab as
 * part of the 1d decomposition. Pure presentational: the launch handlers come
 * in as props. Behavior-identical to the prior inline block.
 */
export default function ChallengePanel({
  startQuiz,
  startFlashcards,
  startMatch,
  startTyping,
  startListening,
  startSpeaking,
  setScr,
  sCurEx,
}: {
  startQuiz: () => void;
  startFlashcards: () => void;
  startMatch: () => void;
  startTyping: () => void;
  startListening: () => void;
  startSpeaking: () => void;
  setScr: (id: string) => void;
  sCurEx: (id: string) => void;
}) {
  return (
    <div>
      <div className="section-hdr">
        <div className="section-hdr-icon" style={{ background: 'rgba(245,158,11,.12)' }}>
          ⚡
        </div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Quick Games</div>
          <div className="section-hdr-sub">Tap any to start instantly</div>
        </div>
      </div>
      <div
        className="anim-stagger-sm"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}
      >
        {[
          [
            startQuiz,
            '🎯',
            'Quiz',
            'Vocabulary',
            'linear-gradient(155deg,#071828 0%,#0a3d52 60%,#0e7490 100%)',
          ],
          [
            startFlashcards,
            '🃏',
            'Flashcards',
            'Spaced rep',
            'linear-gradient(155deg,#120830 0%,#2d1260 60%,#7c3aed 100%)',
          ],
          [
            startMatch,
            '🔗',
            'Match Pairs',
            'Memory',
            'linear-gradient(155deg,#041410 0%,#0d3820 60%,#16a34a 100%)',
          ],
          [
            startTyping,
            '⌨️',
            'Typing',
            'Accuracy',
            'linear-gradient(155deg,#1a0c00 0%,#3d1e00 60%,#d97706 100%)',
          ],
          [
            startListening,
            '🎧',
            'Listening',
            'Train ear',
            'linear-gradient(155deg,#1a0008 0%,#4a0015 60%,#D40030 100%)',
          ],
          [
            startSpeaking,
            '🎤',
            'Speaking',
            'Pronunc.',
            'linear-gradient(155deg,#031020 0%,#083050 60%,#0284c7 100%)',
          ],
          [
            () => {
              setScr('wordsprint');
              sCurEx('wordsprint');
            },
            '⚡',
            'Word Sprint',
            'Speed',
            'linear-gradient(155deg,#1a0e00 0%,#3d2200 60%,#f59e0b 100%)',
          ],
        ].map((entry, i) => {
          const [fn, icon, label, sub, bg] = entry as [() => void, string, string, string, string];
          return (
            <button
              key={i}
              className="practice-card-dark"
              style={{ textAlign: 'center', padding: '16px 10px', background: bg }}
              onClick={fn}
            >
              <div className="pc-icon">{icon}</div>
              <div className="pc-label">{label}</div>
              <div className="pc-desc">{sub}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
