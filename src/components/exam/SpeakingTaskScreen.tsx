// src/components/exam/SpeakingTaskScreen.tsx
import { useState } from 'react';
import type { CefrLevel } from '../../lib/cefr.js';
import type { SpeakingScorer } from '../../lib/speaking/SpeakingScorer.js';
import type { SpeakingTask } from '../../data/speakingTasks.js';

type Phase = 'idle' | 'recording' | 'assessing' | 'retry';

export interface SpeakingTaskScreenProps {
  task: SpeakingTask;
  level: CefrLevel;
  scorer: SpeakingScorer;
  /** Called with the overall speaking score (0..1) once assessed. */
  onScore: (overall: number) => void;
  /** Capture audio for the task. Default uses MediaRecorder; tests inject a stub. */
  captureAudio?: (seconds: number) => Promise<Blob>;
}

/** Default mic capture via MediaRecorder; resolves a Blob after `seconds`. */
async function defaultCapture(seconds: number): Promise<Blob> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => chunks.push(e.data);
  return new Promise<Blob>((resolve) => {
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      resolve(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }));
    };
    rec.start();
    setTimeout(() => rec.stop(), seconds * 1000);
  });
}

export default function SpeakingTaskScreen({
  task,
  level,
  scorer,
  onScore,
  captureAudio = defaultCapture,
}: SpeakingTaskScreenProps) {
  const [phase, setPhase] = useState<Phase>('idle');

  async function run() {
    setPhase('recording');
    let blob: Blob;
    try {
      blob = await captureAudio(task.seconds);
    } catch {
      setPhase('retry'); // mic denied → retry, never a fail
      return;
    }
    setPhase('assessing');
    const result = await scorer.assess(blob, { level, prompt: task.prompt });
    if (result === null) {
      setPhase('retry');
      return;
    }
    onScore(result.overall);
  }

  return (
    <div className="speaking-task" data-testid="speaking-task">
      <span className="pill pill-violet">Speaking</span>
      <p className="task-hr" lang="hr">
        {task.prompt}
      </p>
      <p className="task-en">{task.promptEn}</p>
      {phase === 'idle' && (
        <button className="btn btn-primary" data-testid="speak-record" onClick={run}>
          &#127897;&#65039; Tap to record
        </button>
      )}
      {phase === 'recording' && (
        <p data-testid="speak-recording">&#9679; Recording&hellip; (~{task.seconds}s)</p>
      )}
      {phase === 'assessing' && (
        <p data-testid="speak-assessing">Assessing your Croatian&hellip;</p>
      )}
      {phase === 'retry' && (
        <div>
          <p data-testid="speak-retry">
            We couldn&apos;t score that clearly. Let&apos;s try once more.
          </p>
          <button className="btn btn-primary" onClick={run}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
