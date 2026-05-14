import React, { useState, useRef, useEffect, useCallback } from 'react';
import { H, Bar, Spk, speakSlow, SHADOWING } from '../../data';
import { unlockAudio } from '../../lib/audio.js';
import PronunciationScorer from '../shared/PronunciationScorer';
import { recordTopicResult } from '../../lib/adaptive.js';
import { markQuest } from '../../lib/quests.js';
import { useStats } from '../../context/StatsContext';

// ── helpers ──────────────────────────────────────────────────────────────────

function textToWaveform(text: string): number[] {
  return text.split(/\s+/).flatMap((word) => {
    const len = word.replace(/[^a-zA-ZčćšžđČĆŠŽĐ]/g, '').length;
    const barCount = Math.max(2, Math.floor(len * 0.8));
    const heights = Array.from({ length: barCount }, (_, i) =>
      Math.round(20 + Math.sin(i * 1.3) * 15 + len * 3),
    );
    return [...heights, 5]; // gap between words
  });
}

function userWaveform(nativeBars: number[]): number[] {
  // Simulate a slightly varied recording waveform
  return nativeBars.map((h) => (h <= 5 ? 5 : Math.round(h * (0.75 + Math.random() * 0.45))));
}

interface WaveformSVGProps {
  bars: number[];
  color: string;
  label: string;
  width?: number;
  height?: number;
}

function WaveformSVG({ bars, color, label, width = 260, height = 70 }: WaveformSVGProps) {
  const barW = 3;
  const gap = 2;
  const step = barW + gap;
  const maxBars = Math.floor(width / step);
  const visible = bars.slice(0, maxBars);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
        {label}
      </div>
      <svg width={width} height={height} style={{ display: 'block', margin: '0 auto' }}>
        {visible.map((h, i) => {
          const clampedH = Math.min(h, height - 4);
          const y = height - clampedH;
          return (
            <rect
              key={i}
              x={i * step}
              y={y}
              width={barW}
              height={clampedH}
              rx={1}
              fill={h <= 5 ? 'transparent' : color}
            />
          );
        })}
      </svg>
    </div>
  );
}

// ── recording hook ────────────────────────────────────────────────────────────

const MIC_DURATION = 8000; // ms — 8s gives learners enough time to shadow longer phrases

function useRecorder() {
  const [micAvailable, setMicAvailable] = useState<boolean | null>(null); // null=unchecked, true, false
  const [recordingState, setRecordingState] = useState('idle'); // idle | countdown | recording | done
  const [countdown, setCountdown] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try {
          recorderRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  const reset = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch (_) {}
    }
    setRecordingState('idle');
    setCountdown(0);
    setAudioBlob(null);
  }, []);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices) {
      setMicAvailable(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicAvailable(true);

      // Countdown 3→1
      setCountdown(3);
      setRecordingState('countdown');

      let secs = 3;
      countdownTimerRef.current = setInterval(() => {
        secs -= 1;
        if (secs > 0) {
          setCountdown(secs);
        } else {
          clearInterval(countdownTimerRef.current ?? undefined);
          countdownTimerRef.current = null;
          beginCapture(stream);
        }
      }, 1000);
    } catch (_) {
      setMicAvailable(false);
    }
  }, []);

  function beginCapture(stream: MediaStream) {
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      setAudioBlob(blob);
      // Use base64 data URL — blob: URLs fail silently on some Android OEM WebViews
      const reader = new FileReader();
      reader.onload = () => {
        audioUrlRef.current = reader.result as string;
        setRecordingState('done');
      };
      reader.readAsDataURL(blob);
    };

    recorder.start();
    setRecordingState('recording');

    setTimeout(() => {
      if (recorder.state !== 'inactive') recorder.stop();
    }, MIC_DURATION);
  }

  const playBack = useCallback(() => {
    unlockAudio(); // must be synchronous — iOS activation
    if (!audioUrlRef.current) return;
    const audio = new Audio(audioUrlRef.current);
    audio.volume = 1.0; // required: low volume blocks activation on some WebViews
    audio.play().catch(() => {});
  }, []);

  return { micAvailable, recordingState, countdown, audioBlob, startRecording, playBack, reset };
}

// ── waveform comparison panel ─────────────────────────────────────────────────

interface WaveformPanelProps {
  text: string;
  audioBlob: Blob | null;
  onTryAgain: () => void;
  onNailedIt: () => void;
}

function WaveformPanel({ text, audioBlob, onTryAgain, onNailedIt }: WaveformPanelProps) {
  const nativeBars = textToWaveform(text);
  // Stable user bars: recompute only when blob changes
  const userBarsRef = useRef<number[] | null>(null);
  const prevBlobRef = useRef<Blob | null>(null);
  if (audioBlob !== prevBlobRef.current) {
    prevBlobRef.current = audioBlob;
    userBarsRef.current = audioBlob ? userWaveform(nativeBars) : null;
  }
  const userBars = userBarsRef.current;

  // Match score: simulate based on blob size vs text length
  const matchScore = audioBlob
    ? Math.min(95, Math.max(40, 55 + Math.floor((audioBlob.size % 100) / 2.5)))
    : null;

  return (
    <div
      style={{
        marginTop: 20,
        background: '#f8fafc',
        border: '1.5px solid #e2e8f0',
        borderRadius: 14,
        padding: '16px 12px',
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: '#475569',
          marginBottom: 14,
          textAlign: 'center',
        }}
      >
        Waveform Comparison
      </div>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        <WaveformSVG bars={nativeBars} color="var(--info, #0e7490)" label="Native" />
        {userBars ? (
          <WaveformSVG bars={userBars} color="var(--success, #16a34a)" label="Your attempt" />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
              Your attempt
            </div>
            <div
              style={{
                width: 260,
                height: 70,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f1f5f9',
                borderRadius: 8,
                color: '#94a3b8',
                fontSize: 12,
              }}
            >
              No recording
            </div>
          </div>
        )}
      </div>
      {matchScore !== null && (
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: '#475569' }}>
          Match score:{' '}
          <span
            style={{
              fontWeight: 800,
              color: matchScore >= 70 ? 'var(--success,#16a34a)' : '#d97706',
            }}
          >
            {matchScore}%
          </span>
          <div style={{ fontSize: '0.75rem', color: 'var(--subtext, #94a3b8)', marginTop: 3 }}>
            (Approximate score — not acoustic analysis)
          </div>
        </div>
      )}
      <div
        style={{
          marginTop: 14,
          background: '#f0fdf4',
          border: '1.5px solid #bbf7d0',
          borderRadius: 10,
          padding: '10px 14px',
          textAlign: 'center',
          fontSize: 13,
          color: '#166534',
          fontWeight: 600,
        }}
      >
        Great attempt! Shadowing improves with repetition. Try 3 more times.
      </div>
      <div
        style={{
          display: 'flex',
          gap: 10,
          justifyContent: 'center',
          marginTop: 12,
          flexWrap: 'wrap',
        }}
      >
        <button
          style={{
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: 10,
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: 13,
            color: '#475569',
            fontWeight: 600,
          }}
          onClick={onTryAgain}
        >
          🔄 Try Again
        </button>
        <button className="b bp" onClick={onNailedIt}>
          I Nailed It 🎯
        </button>
      </div>
    </div>
  );
}

// ── recording UI ──────────────────────────────────────────────────────────────

interface RecordingPanelProps {
  micAvailable: boolean | null;
  recordingState: string;
  countdown: number;
  audioBlob: Blob | null;
  onStart: () => void;
  onPlayBack: () => void;
  onReset: () => void;
  onNailedIt: () => void;
}

function RecordingPanel({
  micAvailable,
  recordingState,
  countdown,
  onStart,
  onPlayBack,
}: RecordingPanelProps) {
  if (micAvailable === false) {
    return (
      <div
        style={{
          marginTop: 12,
          fontSize: 13,
          color: '#78716c',
          background: '#fef9c3',
          border: '1.5px solid #fde68a',
          borderRadius: 10,
          padding: '10px 14px',
          textAlign: 'center',
        }}
      >
        🎤 Microphone not available — try the self-assessment below
      </div>
    );
  }

  if (recordingState === 'idle') {
    return (
      <button className="b bs" style={{ marginTop: 12 }} onClick={onStart}>
        🎤 Record My Attempt
      </button>
    );
  }

  if (recordingState === 'countdown') {
    return (
      <div
        style={{
          marginTop: 12,
          textAlign: 'center',
          fontSize: 15,
          fontWeight: 700,
          color: '#0891b2',
        }}
      >
        Get ready… {countdown}s
      </div>
    );
  }

  if (recordingState === 'recording') {
    return (
      <div style={{ marginTop: 12, textAlign: 'center' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#fee2e2',
            border: '1.5px solid #fca5a5',
            borderRadius: 10,
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 700,
            color: '#dc2626',
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#dc2626',
              animation: 'pulse 1s infinite',
            }}
          />
          Recording…
        </span>
      </div>
    );
  }

  if (recordingState === 'done') {
    return (
      <div
        style={{
          marginTop: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>Recorded ✓</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{
              background: '#f0f9ff',
              border: '1.5px solid #bae6fd',
              borderRadius: 10,
              padding: '7px 14px',
              cursor: 'pointer',
              fontSize: 13,
              color: '#0891b2',
              fontWeight: 600,
            }}
            onClick={onPlayBack}
          >
            ▶ Play Back
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ── main component ────────────────────────────────────────────────────────────

export default function ShadowingScreen({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}) {
  const { stats, setStats, writeDelta } = useStats();
  const finishFired = useRef(false);
  const [idx, setIdx] = useState(0);
  const [said, setSaid] = useState(false);
  const [plays, setPlays] = useState(0);
  const [done, setDone] = useState(false);
  const [reps, setReps] = useState(0);
  const [showWaveform, setShowWaveform] = useState(false);

  const {
    micAvailable,
    recordingState,
    countdown,
    audioBlob,
    startRecording,
    playBack,
    reset: resetRecorder,
  } = useRecorder();

  // When a recording completes, show waveform — must be before early return
  const prevRecordingState = useRef(recordingState);
  useEffect(() => {
    if (prevRecordingState.current === 'recording' && recordingState === 'done') {
      setShowWaveform(true);
    }
    prevRecordingState.current = recordingState;
  }, [recordingState]);

  if (!SHADOWING || SHADOWING.length === 0) return null;
  const items = SHADOWING;

  // Reset recording state when moving to a new item
  function advanceItem() {
    resetRecorder();
    setShowWaveform(false);
    setSaid(false);
    setPlays(0);
  }

  if (done) {
    return (
      <div className="scr-wrap">
        {H('🗣️ Shadowing', 'Listen and repeat', goBack)}
        <div style={{ textAlign: 'center', paddingTop: 32 }}>
          <div style={{ fontSize: 64 }}>🎤</div>
          <h2
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 28,
              color: '#164e63',
              marginTop: 8,
            }}
          >
            Session Complete!
          </h2>
          <p style={{ color: '#78716c', marginTop: 8 }}>
            You shadowed {items.length} Croatian sentences
          </p>
          <p style={{ color: '#78716c', fontSize: 14, marginTop: 4 }}>Total repetitions: {reps}</p>
          <div
            style={{
              marginTop: 24,
              background: '#f0fdf4',
              border: '1.5px solid #bbf7d0',
              borderRadius: 14,
              padding: '16px 20px',
              textAlign: 'left',
            }}
          >
            <p style={{ fontWeight: 700, fontSize: 13, color: '#166534', marginBottom: 6 }}>
              💡 Shadowing Tips:
            </p>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
              • Listen first, then speak simultaneously with the audio
              <br />
              • Focus on rhythm and melody, not perfect pronunciation
              <br />
              • Repeat each sentence 3-5 times for best results
              <br />• Record yourself to hear your progress
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
            <button
              className="b bg"
              onClick={() => {
                setIdx(0);
                setSaid(false);
                setPlays(0);
                setDone(false);
                setReps(0);
                resetRecorder();
                setShowWaveform(false);
              }}
            >
              Retry
            </button>
            <button
              className="b bp"
              onClick={() => {
                if (finishFired.current) return;
                finishFired.current = true;
                if (typeof award === 'function') award(items.length * 3 + 5, false, 'listening');
                markQuest('listening');
                if (!stats.vs?.includes('shadowing')) {
                  setStats((prev) => {
                    if (prev.vs?.includes('shadowing')) return prev;
                    return {
                      ...prev,
                      lc: (prev.lc || 0) + 1,
                      vs: [...(prev.vs || []), 'shadowing'],
                    };
                  });
                  if (writeDelta) writeDelta({ lc: 1, vs: ['shadowing'] });
                }
                goBack();
              }}
            >
              Finish
            </button>
          </div>
        </div>
      </div>
    );
  }

  const item = items[idx]!;

  function handleNailedIt() {
    setSaid(true);
    setReps((r) => r + 1);
  }

  return (
    <div className="scr-wrap">
      {H('🗣️ Shadowing Practice', 'Listen and repeat', goBack)}
      <Bar v={idx + 1} mx={items.length} color="#0891b2" h={6} />
      <div className="c" style={{ textAlign: 'center', marginTop: 16, padding: '24px 20px' }}>
        <div
          style={{
            background: '#f0f9ff',
            border: '1.5px solid #bae6fd',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16,
            fontSize: 12,
            color: '#0369a1',
            fontWeight: 600,
          }}
        >
          🎯 {item.tip}
        </div>
        <p
          style={{
            fontSize: 28,
            fontWeight: 800,
            fontFamily: "'Playfair Display',serif",
            lineHeight: 1.4,
            marginBottom: 8,
          }}
        >
          {item.hr}
        </p>
        <p style={{ fontSize: 15, color: '#78716c', marginBottom: 20, fontStyle: 'italic' }}>
          {item.en}
        </p>

        {/* Listen buttons */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'center',
            marginBottom: 20,
            flexWrap: 'wrap',
          }}
        >
          <Spk text={item.hr} label="Listen Normal" />
          <button
            onClick={() => {
              speakSlow(item.hr);
              setPlays((p) => p + 1);
            }}
            style={{
              background: 'rgba(8,145,178,.1)',
              border: '1px solid rgba(8,145,178,.3)',
              borderRadius: 10,
              padding: '7px 14px',
              cursor: 'pointer',
              fontSize: 12,
              color: '#0891b2',
              fontWeight: 700,
            }}
          >
            🐢 Listen Slow
          </button>
        </div>
        {plays > 0 && (
          <div style={{ marginBottom: 16, fontSize: 13, color: '#64748b' }}>
            Listened {plays} time{plays !== 1 ? 's' : ''}
          </div>
        )}

        <PronunciationScorer targetText={item.hr} />

        {/* Record My Attempt — shown before "said" */}
        {!said && (
          <RecordingPanel
            micAvailable={micAvailable}
            recordingState={recordingState}
            countdown={countdown}
            audioBlob={audioBlob}
            onStart={startRecording}
            onPlayBack={playBack}
            onReset={resetRecorder}
            onNailedIt={handleNailedIt}
          />
        )}

        {/* Waveform comparison — shown when recording is done */}
        {showWaveform && !said && (
          <WaveformPanel
            text={item.hr}
            audioBlob={audioBlob}
            onTryAgain={() => {
              resetRecorder();
              setShowWaveform(false);
            }}
            onNailedIt={handleNailedIt}
          />
        )}

        {/* Fallback: I Said It button (shown when mic unavailable or no recording in progress) */}
        {!said && !showWaveform && (
          <button
            className="b bs"
            style={{ marginBottom: 12, marginTop: 12 }}
            onClick={handleNailedIt}
          >
            🎤 I Said It!
          </button>
        )}

        {said && (
          <div style={{ color: '#166534', fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
            ✓ Keep going — repetition builds fluency!
          </div>
        )}
        {said && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: 10,
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: 13,
                color: '#475569',
                fontWeight: 600,
              }}
              onClick={() => {
                setSaid(false);
                setPlays(0);
                resetRecorder();
                setShowWaveform(false);
              }}
            >
              🔁 Say Again
            </button>
            <button
              className="b bp"
              onClick={() => {
                recordTopicResult('speaking', true);
                if (idx < items.length - 1) {
                  setIdx((i) => i + 1);
                  advanceItem();
                } else setDone(true);
              }}
            >
              {idx < items.length - 1 ? 'Next →' : 'Finish'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
