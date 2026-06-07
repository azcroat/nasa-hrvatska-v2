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
}

type Acc = Partial<Record<SkillKey, { total: number; correct: number }>>;

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

export default function ExamRunner({ questions, speaking, onComplete }: ExamRunnerProps) {
  const total = questions.length + (speaking?.tasks.length ?? 0);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [acc, setAcc] = useState<Acc>({});
  const [speakIdx, setSpeakIdx] = useState(0);
  const speakScores = useRef<number[]>([]); // accumulated across speaking tasks

  const inMcq = idx < questions.length;
  const q = inMcq ? questions[idx]! : null;

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
    <div className="exam-runner" data-testid="exam-runner">
      <div className="q-top">
        <span className="q-num" data-testid="exam-progress">
          {Math.min(idx + 1, total)} / {total}
        </span>
      </div>

      {inMcq && q && (
        <div>
          <span className="pill pill-blue">{q.skill}</span>
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
              className={`ans${selected === i ? ' sel' : ''}`}
              onClick={() => setSelected(i)}
            >
              <span className="k">{String.fromCharCode(65 + i)}</span> {opt}
            </button>
          ))}
          <button
            className="btn btn-primary"
            data-testid="exam-next"
            disabled={selected === null}
            onClick={next}
          >
            Continue
          </button>
        </div>
      )}

      {!inMcq && speaking && (
        <SpeakingTaskScreen
          key={speakIdx}
          task={speaking.tasks[speakIdx]!}
          level={speaking.level}
          scorer={speaking.scorer}
          onScore={onSpeakingScore}
        />
      )}
    </div>
  );
}
