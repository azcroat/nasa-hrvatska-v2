import React from 'react';
import TipContent from './DialogueTipContent';
import DialogueAvatar from './DialogueAvatar';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface GuidedProps {
  scenario: any;
  turnIdx: number;
  totalTurns: number;
  turn: any;
  shuffled: any;
  answered: boolean;
  selected: number;
  isCorrect: boolean;
  freeMode: boolean;
  freeInput: string;
  freeResult: any;
  onSelect: (i: number) => void;
  onFreeInput: (v: string) => void;
  onFreeSubmit: () => void;
  onContinue: () => void;
  onBack: () => void;
  onToggleFreeMode: () => void;
  onSwitchToAi: () => void;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
export default function DialogueGuidedMode({
  scenario,
  turnIdx,
  totalTurns,
  turn,
  shuffled,
  answered,
  selected,
  isCorrect,
  freeMode,
  freeInput,
  freeResult,
  onSelect,
  onFreeInput,
  onFreeSubmit,
  onContinue,
  onBack,
  onToggleFreeMode,
  onSwitchToAi,
}: GuidedProps) {
  return (
    <div>
      {/* Speaker bubble */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
        <DialogueAvatar scenarioId={scenario.id} />
        <div
          aria-live="polite"
          aria-atomic="true"
          style={{
            background: 'var(--card)',
            borderRadius: '16px 16px 16px 4px',
            padding: '14px 16px',
            border: '1.5px solid var(--card-b)',
            flex: 1,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: '#0e7490', marginBottom: 4 }}>
            {turn.speaker}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--heading)', lineHeight: 1.5 }}>
            {turn.line}
          </div>
          <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 6, fontStyle: 'italic' }}>
            {turn.en}
          </div>
        </div>
      </div>

      {/* Your turn label + free mode toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--subtext)' }}>Your response:</div>
        <button
          onClick={() => {
            if (!answered) onToggleFreeMode();
          }}
          style={{
            background: freeMode ? '#7c3aed' : 'var(--bar-bg)',
            border: 'none',
            borderRadius: 20,
            padding: '4px 10px',
            fontSize: 11,
            fontWeight: 700,
            color: freeMode ? '#fff' : 'var(--subtext)',
            cursor: answered ? 'default' : 'pointer',
            fontFamily: "'Outfit',sans-serif",
            transition: 'all 0.15s ease',
          }}
        >
          💬 Slobodan odgovor
        </button>
      </div>

      {freeMode ? (
        /* Free response input */
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={freeInput}
              onChange={(e) => onFreeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onFreeSubmit();
              }}
              disabled={answered}
              placeholder="Upiši svoj odgovor..."
              style={{
                flex: 1,
                padding: '11px 14px',
                borderRadius: 12,
                border: '1.5px solid var(--card-b)',
                background: 'var(--card)',
                color: 'var(--heading)',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "'Outfit',sans-serif",
                outline: 'none',
              }}
            />
            <button
              onClick={onFreeSubmit}
              disabled={answered || !freeInput.trim()}
              style={{
                background: '#0e7490',
                border: 'none',
                borderRadius: 12,
                padding: '11px 16px',
                color: '#fff',
                fontSize: 13,
                fontWeight: 800,
                cursor: answered || !freeInput.trim() ? 'default' : 'pointer',
                fontFamily: "'Outfit',sans-serif",
                opacity: answered || !freeInput.trim() ? 0.5 : 1,
                transition: 'opacity 0.15s ease',
              }}
            >
              Provjeri
            </button>
          </div>

          {/* Free mode feedback */}
          {answered && freeResult && (
            <div
              role="alert"
              aria-live="assertive"
              style={{
                background: freeResult.matched ? '#dcfce7' : '#fef3c7',
                border: `1.5px solid ${freeResult.matched ? '#86efac' : '#fcd34d'}`,
                borderRadius: 12,
                padding: '12px 14px',
                marginTop: 12,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: freeResult.matched ? '#166534' : '#92400e',
                  marginBottom: 6,
                }}
              >
                {freeResult.matched ? '✅ Točno!' : '💡 Tvoj odgovor vs naš prijedlog:'}
              </div>
              {!freeResult.matched && (
                <div
                  style={{
                    fontSize: 13,
                    color: '#78350f',
                    marginBottom: 6,
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>Tvoj:</span> {freeResult.input}
                  <br />
                  <span style={{ fontWeight: 700 }}>Prijedlog:</span> {freeResult.correct}
                </div>
              )}
              <div
                style={{
                  fontSize: 13,
                  color: freeResult.matched ? '#15803d' : '#78350f',
                  lineHeight: 1.5,
                }}
              >
                <TipContent tip={turn.tip} />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Multiple choice options */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {shuffled.opts.map((opt: any, i: number) => {
            let bg = 'var(--card)';
            let border = '1.5px solid var(--card-b)';
            let color = 'var(--heading)';

            if (answered) {
              if (i === shuffled.correctIdx) {
                bg = '#dcfce7';
                border = '1.5px solid #86efac';
                color = '#166534';
              } else if (i === selected && i !== shuffled.correctIdx) {
                bg = '#fee2e2';
                border = '1.5px solid #fca5a5';
                color = '#991b1b';
              } else {
                bg = 'var(--card)';
                color = 'var(--subtext)';
              }
            }

            return (
              <button
                key={opt}
                onClick={() => onSelect(i)}
                disabled={answered}
                style={{
                  background: bg,
                  border,
                  borderRadius: 12,
                  padding: '12px 14px',
                  textAlign: 'left',
                  fontSize: 14,
                  fontWeight: 600,
                  color,
                  cursor: answered ? 'default' : 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: "'Outfit',sans-serif",
                  lineHeight: 1.4,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background:
                      answered && i === shuffled.correctIdx
                        ? '#86efac'
                        : answered && i === selected && i !== shuffled.correctIdx
                          ? '#fca5a5'
                          : 'var(--bar-bg)',
                    color:
                      answered &&
                      (i === shuffled.correctIdx || (i === selected && i !== shuffled.correctIdx))
                        ? '#fff'
                        : 'var(--subtext)',
                    fontSize: 11,
                    fontWeight: 800,
                    textAlign: 'center',
                    lineHeight: '22px',
                    marginRight: 10,
                    flexShrink: 0,
                    verticalAlign: 'middle',
                  }}
                >
                  {answered && i === shuffled.correctIdx
                    ? '✓'
                    : answered && i === selected && i !== shuffled.correctIdx
                      ? '✗'
                      : String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {/* Feedback tip (multiple choice mode only) */}
      {answered && !freeMode && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            background: isCorrect ? '#dcfce7' : '#fef3c7',
            border: `1.5px solid ${isCorrect ? '#86efac' : '#fcd34d'}`,
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: isCorrect ? '#166534' : '#92400e',
              marginBottom: 4,
            }}
          >
            {isCorrect ? '✅ Correct!' : '💡 Better choice:'}
          </div>
          <div style={{ fontSize: 13, color: isCorrect ? '#15803d' : '#78350f', lineHeight: 1.5 }}>
            <TipContent tip={turn.tip} />
          </div>
        </div>
      )}

      {/* Continue button */}
      {answered && (
        <button
          className="tc"
          onClick={onContinue}
          style={{
            width: '100%',
            padding: '14px',
            fontWeight: 800,
            fontSize: 15,
            color: 'var(--heading)',
          }}
        >
          {turnIdx + 1 >= totalTurns ? 'See Results →' : 'Next Turn →'}
        </button>
      )}

      {/* Back link */}
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--subtext)',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          padding: '8px 0',
          marginTop: 4,
          fontFamily: "'Outfit',sans-serif",
        }}
      >
        ← Back to scenarios
      </button>
    </div>
  );
}
