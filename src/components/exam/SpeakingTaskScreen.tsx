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

  // Latest props held in refs so the assessment effect can depend ONLY on the
  // recorder's [state, audioBlob]. If we listed `scorer`/`onScore`/`task` in the
  // dep array, a parent re-render that changes any of those identities (ExamRunner
  // passes an inline `onScore`) would tear down and re-run the effect MID-ASSESSMENT —
  // the cleanup would set cancelled=true, the re-run would early-return on the
  // assessedBlobRef guard, and `onScore` would never fire → the screen hangs forever
  // on "Assessing…". Reading these via refs keeps the in-flight assessment alive.
  const scorerRef = useRef(scorer);
  const onScoreRef = useRef(onScore);
  const levelRef = useRef(level);
  const promptRef = useRef(task.prompt);
  scorerRef.current = scorer;
  onScoreRef.current = onScore;
  levelRef.current = level;
  promptRef.current = task.prompt;

  function startRecording() {
    setPhase('idle');
    assessedBlobRef.current = null;
    // No prep countdown for this screen (preserves the prior tap-to-record-now
    // behavior); cap recording at the task's allotted seconds.
    rec.startRecording({ countdown: 0, maxDurationMs: task.seconds * 1000 });
  }

  // Assess exactly once when the recorder produces a finished blob. Depends only on
  // the recorder outputs (which change once per recording) — never on parent-supplied
  // callbacks — so a re-render can't cancel an in-flight assessment. The `cancelled`
  // flag now guards solely against genuine unmount.
  useEffect(() => {
    if (rec.state !== 'done' || !rec.audioBlob) return;
    if (assessedBlobRef.current === rec.audioBlob) return;
    const blob = rec.audioBlob;
    assessedBlobRef.current = blob;
    let cancelled = false;
    setPhase('assessing');
    void (async () => {
      const result = await scorerRef.current.assess(blob, {
        level: levelRef.current,
        prompt: promptRef.current,
      });
      if (cancelled) return;
      if (result === null) {
        setPhase('retry'); // not scored → retry, never a failing score
        return;
      }
      onScoreRef.current(result.overall);
    })();
    return () => {
      cancelled = true;
    };
    // NOTE: deps are intentionally ONLY [state, audioBlob]; scorer/onScore/level/prompt
    // are read via refs so a parent re-render can't cancel an in-flight assessment.
  }, [rec.state, rec.audioBlob]);

  const denied = rec.state === 'denied' || rec.state === 'unsupported';
  const recording = rec.state === 'recording' || rec.state === 'countdown';
  const showRecordButton = !denied && !recording && phase === 'idle' && rec.state !== 'requesting';

  return (
    <div className="speaking-task" data-testid="speaking-task">
      <span className="q-skill violet">🎙️ Speaking</span>
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
        <button className="b bp" data-testid="speak-record" onClick={startRecording}>
          &#127897;&#65039; Tap to record
        </button>
      )}

      {!denied && rec.state === 'countdown' && (
        <p className="speak-status" data-testid="speak-countdown">
          Get ready&hellip; {rec.countdown}
        </p>
      )}

      {!denied && rec.state === 'recording' && (
        <p className="speak-status" data-testid="speak-recording">
          &#9679; Recording&hellip; (~{task.seconds}s)
        </p>
      )}

      {!denied && phase === 'assessing' && (
        <p className="speak-status" data-testid="speak-assessing">
          Assessing your Croatian&hellip;
        </p>
      )}

      {!denied && phase === 'retry' && (
        <>
          <p className="speak-status" data-testid="speak-retry">
            We couldn&apos;t score that clearly. Let&apos;s try once more.
          </p>
          <button
            className="b bp"
            onClick={() => {
              rec.reset();
              startRecording();
            }}
          >
            Try again
          </button>
        </>
      )}
    </div>
  );
}
