// src/components/exam/ExamRunner.tsx
import { useRef, useState } from 'react';
import type { CefrLevel } from '../../lib/cefr.js';
import type { SkillScores, SkillKey } from '../../lib/cefrCertification.js';
import type { SpeakingScorer } from '../../lib/speaking/SpeakingScorer.js';
import type { SpeakingTask } from '../../data/speakingTasks.js';
import type { RunnerQuestion } from '../../lib/checkpointExam.js';
import SpeakingTaskScreen from './SpeakingTaskScreen.js';

export interface ExamRunnerProps {
  questions: RunnerQuestion[];
  speaking?: { level: CefrLevel; tasks: SpeakingTask[]; scorer: SpeakingScorer };
  onComplete: (scores: SkillScores) => void;
  /** Eyebrow label shown above the progress count. */
  title?: string;
  /** When provided, renders a close (✕) button in the top bar. */
  onExit?: () => void;
}

type Acc = Partial<Record<SkillKey, { total: number; correct: number }>>;

// Human label + emoji per skill, for the skill pill.
const SKILL_META: Record<string, { label: string; icon: string }> = {
  reading: { label: 'Reading', icon: '📖' },
  grammar: { label: 'Grammar', icon: '🔤' },
  vocab: { label: 'Vocabulary', icon: '💬' },
  vocabulary: { label: 'Vocabulary', icon: '💬' },
  listening: { label: 'Listening', icon: '🎧' },
  speaking: { label: 'Speaking', icon: '🎙️' },
};

function finalize(acc: Acc, speakingScores: number[]): SkillScores {
  const out: Record<string, number> = {};
  for (const k of Object.keys(acc) as SkillKey[]) {
    const a = acc[k]!;
    if (a.total > 0) out[k] = a.correct / a.total;
  }
  if (speakingScores.length > 0) {
    out.speaking = speakingScores.reduce((s, n) => s + n, 0) / speakingScores.length;
  }
  return out as unknown as SkillScores;
}

export default function ExamRunner({
  questions,
  speaking,
  onComplete,
  title = 'Comprehension Check',
  onExit,
}: ExamRunnerProps) {
  const total = questions.length + (speaking?.tasks.length ?? 0);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [acc, setAcc] = useState<Acc>({});
  const [speakIdx, setSpeakIdx] = useState(0);
  const speakScores = useRef<number[]>([]); // accumulated across speaking tasks

  const inMcq = idx < questions.length;
  const q = inMcq ? questions[idx]! : null;
  const step = Math.min(idx + 1, total);
  const pct = total > 0 ? Math.round((step / total) * 100) : 0;
  const meta = q ? (SKILL_META[q.skill] ?? { label: q.skill, icon: '' }) : null;

  function next() {
    if (selected === null || !q) return;
    const correct = selected === q.correctIndex ? 1 : 0;
    const prev = acc[q.skill] ?? { total: 0, correct: 0 };
    const nextAcc: Acc = {
      ...acc,
      [q.skill]: { total: prev.total + 1, correct: prev.correct + correct },
    };
    setAcc(nextAcc);
    setSelected(null);
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
    } else if (speaking && speaking.tasks.length > 0) {
      setIdx(questions.length); // enter speaking phase
    } else {
      onComplete(finalize(nextAcc, speakScores.current));
    }
  }

  function onSpeakingScore(score: number) {
    speakScores.current.push(score);
    if (speakIdx + 1 < (speaking?.tasks.length ?? 0)) {
      setSpeakIdx(speakIdx + 1);
      setIdx(idx + 1);
    } else {
      onComplete(finalize(acc, speakScores.current));
    }
  }

  return (
    <>
      <div className="exam-top">
        {onExit && (
          <button
            className="exam-close"
            data-testid="exam-exit"
            aria-label="Close"
            onClick={onExit}
          >
            ✕
          </button>
        )}
        <div className="exam-progress-wrap">
          <div className="exam-progress-meta">
            <span className="eyebrow">{title}</span>
            <span className="count" data-testid="exam-progress">
              {step} / {total}
            </span>
          </div>
          <div className="exam-bar">
            <i style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="exam-body" data-testid="exam-runner">
        {inMcq && q && (
          <div className="exam-col">
            <span className="q-skill">
              {meta?.icon} {meta?.label}
            </span>
            {q.passage && (
              <div className="q-passage" lang="hr">
                {q.passage}
              </div>
            )}
            <div className="q-stem" lang="hr">
              {q.prompt}
            </div>
            {q.options.map((opt, i) => (
              <button
                key={i}
                data-testid={`answer-${i}`}
                className={`ob ob-exam${selected === i ? ' sel' : ''}`}
                onClick={() => setSelected(i)}
              >
                <span className="k">{String.fromCharCode(65 + i)}</span> {opt}
              </button>
            ))}
          </div>
        )}

        {!inMcq && speaking && (
          <div className="exam-col">
            <SpeakingTaskScreen
              key={speakIdx}
              task={speaking.tasks[speakIdx]!}
              level={speaking.level}
              scorer={speaking.scorer}
              onScore={onSpeakingScore}
            />
          </div>
        )}
      </div>

      {inMcq && q && (
        <div className="exam-cta">
          <div className="exam-col">
            <button
              className="b bp"
              data-testid="exam-next"
              disabled={selected === null}
              onClick={next}
            >
              Continue →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
