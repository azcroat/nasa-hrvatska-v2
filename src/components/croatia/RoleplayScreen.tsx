import React, { useState } from 'react';
import { H, speak } from '../../data';
import { ROLEPLAY } from '../../data';
import { CefrSoftHint } from '../shared/CefrSoftHint';
import { useRecorder } from '../../hooks/useRecorder';

interface RpLine {
  speaker: string;
  text: string;
  en: string;
  you?: boolean;
}
interface RpScenario {
  title: string;
  en: string;
  lines: RpLine[];
}

// Interactive role-play. The scripted scenarios stay (School, Doctor, Market…),
// but the learner now PLAYS their role instead of just reading it: on the
// partner's line you read/hear it; on YOUR line you get only the English cue,
// you say it yourself (mic) and/or reveal + hear the model answer, then advance.
// Previously every line — including your own — was pre-printed and merely
// displayed, so the screen "did nothing but vocabulary."
function RoleplayScreen({ goBack }: { goBack: () => void }) {
  const scenarios = ROLEPLAY as RpScenario[];
  const [rpIdx, setRpIdx] = useState(0);
  const [step, setStep] = useState(0); // index of the line currently in play
  const [revealed, setRevealed] = useState(false); // your-line model answer shown
  const [showEn, setShowEn] = useState(false); // English on partner lines
  const rec = useRecorder();

  const r = scenarios[rpIdx]!;
  const lines = r.lines;
  const current = lines[step]!;
  const isYour = !!current.you;
  const atEnd = step >= lines.length - 1;
  const micBlocked = rec.state === 'denied' || rec.state === 'unsupported';
  // The recorder is mid-acquisition/active. Used to guard the Speak control so a
  // rapid double-tap (or a tap while getUserMedia is still resolving in
  // 'requesting'/'countdown') can't call reset()+startRecording() again and open
  // a second mic stream — reset() flips the recorder's busyRef off, defeating its
  // own re-entrancy guard.
  const recBusy =
    rec.state === 'requesting' || rec.state === 'countdown' || rec.state === 'recording';

  function startSpeak() {
    if (recBusy) return; // re-entrancy guard — ignore taps while acquiring/recording
    rec.reset();
    rec.startRecording({ countdown: 0, maxDurationMs: 15_000 });
  }

  function selectScenario(i: number) {
    setRpIdx(i);
    setStep(0);
    setRevealed(false);
    setShowEn(false);
    rec.reset();
  }
  function advance() {
    rec.reset();
    setRevealed(false);
    if (!atEnd) setStep(step + 1);
  }
  function nextScenario() {
    rec.reset();
    setRevealed(false);
    setShowEn(false);
    setStep(0);
    setRpIdx(rpIdx < scenarios.length - 1 ? rpIdx + 1 : 0);
  }

  const bubble = (l: RpLine, body: React.ReactNode, key: React.Key) => (
    <div
      key={key}
      style={{
        display: 'flex',
        justifyContent: l.you ? 'flex-end' : 'flex-start',
        marginBottom: 8,
      }}
    >
      <div
        style={{
          maxWidth: '82%',
          padding: '12px 16px',
          borderRadius: l.you ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: l.you ? 'linear-gradient(135deg,#0e7490,#164e63)' : 'rgba(255,255,255,.85)',
          color: l.you ? 'white' : '#1c1917',
          border: l.you ? 'none' : '1px solid #e7e5e4',
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, opacity: 0.7 }}>
          {l.speaker}
        </div>
        {body}
      </div>
    </div>
  );

  // A line the learner has already worked through — show it in full.
  const completedBody = (l: RpLine) => (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label={`Play audio for ${l.text}`}
        style={{ fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
        onClick={() => speak(l.text)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            speak(l.text);
          }
        }}
      >
        {l.text} <span aria-hidden="true">🔊</span>
      </div>
      {(showEn || l.you) && (
        <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7, fontStyle: 'italic' }}>{l.en}</div>
      )}
    </>
  );

  return (
    <div className="scr-wrap">
      {H('🎭 Conversation Role-Play', 'Play your part in real-life scenes', goBack)}
      <CefrSoftHint level="B1+" />

      {/* Scenario picker */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {scenarios.map((rp, i) => (
          <button
            key={i}
            className={'b ' + (rpIdx === i ? 'bp' : 'bg')}
            style={{ fontSize: 12 }}
            onClick={() => selectScenario(i)}
          >
            {rp.title}
          </button>
        ))}
      </div>

      {/* Scene header */}
      <div
        className="c"
        style={{
          marginBottom: 16,
          borderLeft: '4px solid #7c3aed',
          background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, color: '#7c3aed' }}>{r.title}</div>
        <div style={{ fontSize: 13, color: 'var(--subtext)' }}>{r.en}</div>
      </div>

      {/* Lines already played */}
      {lines.slice(0, step).map((l, i) => bubble(l, completedBody(l), i))}

      {/* Current line */}
      {isYour ? (
        <div
          data-testid="roleplay-your-turn"
          style={{
            border: '2px dashed #0e7490',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 12,
            background: 'rgba(14,116,144,.06)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, color: '#0e7490', marginBottom: 6 }}>
            🎤 Your turn ({current.speaker}) — say it in Croatian:
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>“{current.en}”</div>

          {revealed && (
            <div
              role="button"
              tabIndex={0}
              aria-label={`Play audio for ${current.text}`}
              data-testid="roleplay-answer"
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#0e7490',
                cursor: 'pointer',
                marginBottom: 10,
              }}
              onClick={() => speak(current.text)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  speak(current.text);
                }
              }}
            >
              {current.text} <span aria-hidden="true">🔊</span>
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {!micBlocked &&
              (rec.state === 'recording' ? (
                <button
                  className="b bp"
                  data-testid="roleplay-stop"
                  onClick={() => rec.stopRecording()}
                >
                  ● Stop
                </button>
              ) : (
                <button
                  className="b bg"
                  data-testid="roleplay-speak"
                  onClick={startSpeak}
                  disabled={recBusy}
                >
                  {recBusy ? '🎙️ Starting…' : '🎙️ Speak'}
                </button>
              ))}
            {rec.state === 'done' && rec.audioUrl && (
              <button className="b bg" onClick={() => void rec.playback()}>
                ▶ Play yours
              </button>
            )}
            {!revealed && (
              <button
                className="b bg"
                data-testid="roleplay-reveal"
                onClick={() => setRevealed(true)}
              >
                👁️ Show answer
              </button>
            )}
            <button className="b bp" style={{ flex: 1 }} onClick={advance} disabled={atEnd}>
              {atEnd ? 'Scene complete' : 'Next Line →'}
            </button>
          </div>
          {micBlocked && (
            <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 8 }}>
              Mic unavailable — reveal the line and say it aloud, then continue.
            </div>
          )}
        </div>
      ) : (
        <>
          {bubble(current, completedBody(current), 'current')}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button className="b bp" style={{ flex: 1 }} onClick={advance} disabled={atEnd}>
              {atEnd ? 'Scene complete' : 'Next Line →'}
            </button>
          </div>
        </>
      )}

      {/* Footer controls */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button className="b bg" onClick={() => setShowEn(!showEn)}>
          {showEn ? 'Hide English' : 'Show English'}
        </button>
        {atEnd && (
          <button
            className="b bp"
            data-testid="roleplay-next-scenario"
            style={{ flex: 1 }}
            onClick={nextScenario}
          >
            ↻ Next Scenario
          </button>
        )}
      </div>
    </div>
  );
}

export default RoleplayScreen;
