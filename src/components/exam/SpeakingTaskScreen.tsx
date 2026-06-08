// src/components/exam/SpeakingTaskScreen.tsx
import { useEffect, useRef, useState } from 'react';
import type { CefrLevel } from '../../lib/cefr.js';
import type { SpeakingScorer } from '../../lib/speaking/SpeakingScorer.js';
import type { SpeakingTask } from '../../data/speakingTasks.js';
import { useRecorder } from '../../hooks/useRecorder.js';
import MicPermissionDeniedExplainer from '../shared/MicPermissionDeniedExplainer.js';

type Phase = 'idle' | 'assessing' | 'retry';

export interface SpeakingTaskScreenProps {
  task: SpeakingTask;
  level: CefrLevel;
  scorer: SpeakingScorer;
  /** Called with the overall speaking score (0..1) once assessed. */
  onScore: (overall: number) => void;
}

export default function SpeakingTaskScreen({
  task,
  level,
  scorer,
  onScore,
}: SpeakingTaskScreenProps) {
  const rec = useRecorder();
  const [phase, setPhase] = useState<Phase>('idle');
  // Single-assessment-per-recording guard: remember the exact Blob we already
  // scored. The recorder yields a fresh Blob per recording, so blob identity
  // is a reliable "have I handled this one yet?" key across re-renders.
  const assessedBlobRef = useRef<Blob | null>(null);

  function startRecording() {
    setPhase('idle');
    assessedBlobRef.current = null;
    // No prep countdown for this screen (preserves the prior tap-to-record-now
    // behavior); cap recording at the task's allotted seconds.
    rec.startRecording({ countdown: 0, maxDurationMs: task.seconds * 1000 });
  }

  // Assess exactly once when the recorder produces a finished blob.
  useEffect(() => {
    if (rec.state !== 'done' || !rec.audioBlob) return;
    if (assessedBlobRef.current === rec.audioBlob) return;
    const blob = rec.audioBlob;
    assessedBlobRef.current = blob;
    let cancelled = false;
    setPhase('assessing');
    void (async () => {
      const result = await scorer.assess(blob, { level, prompt: task.prompt });
      if (cancelled) return;
      if (result === null) {
        setPhase('retry'); // not scored → retry, never a failing score
        return;
      }
      onScore(result.overall);
    })();
    return () => {
      cancelled = true;
    };
  }, [rec.state, rec.audioBlob, scorer, level, task.prompt, onScore]);

  const denied = rec.state === 'denied' || rec.state === 'unsupported';
  const recording = rec.state === 'recording' || rec.state === 'countdown';
  const showRecordButton = !denied && !recording && phase === 'idle' && rec.state !== 'requesting';

  return (
    <div className="speaking-task" data-testid="speaking-task">
      <span className="pill pill-violet">Speaking</span>
      <p className="task-hr" lang="hr">
        {task.prompt}
      </p>
      <p className="task-en">{task.promptEn}</p>

      {denied && (
        <div data-testid="mic-denied">
          <MicPermissionDeniedExplainer
            onRetry={() => {
              rec.reset();
              startRecording();
            }}
          />
        </div>
      )}

      {!denied && showRecordButton && (
        <button className="btn btn-primary" data-testid="speak-record" onClick={startRecording}>
          &#127897;&#65039; Tap to record
        </button>
      )}

      {!denied && rec.state === 'countdown' && (
        <p data-testid="speak-countdown">Get ready&hellip; {rec.countdown}</p>
      )}

      {!denied && rec.state === 'recording' && (
        <p data-testid="speak-recording">&#9679; Recording&hellip; (~{task.seconds}s)</p>
      )}

      {!denied && phase === 'assessing' && (
        <p data-testid="speak-assessing">Assessing your Croatian&hellip;</p>
      )}

      {!denied && phase === 'retry' && (
        <div>
          <p data-testid="speak-retry">
            We couldn&apos;t score that clearly. Let&apos;s try once more.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              rec.reset();
              startRecording();
            }}
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
