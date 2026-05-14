import React, { useState, useEffect } from 'react';
import { rnd } from '../../lib/random.js';

interface VocabItem {
  hr: string;
  en: string;
}

interface Props {
  items: VocabItem[]; // items shown so far in the lesson; quiz samples 2 from here
  distractors: VocabItem[]; // pool to draw distractors from
  onComplete: () => void; // returns to lesson flow
  award: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

function shLocal<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [b[i], b[j]] = [b[j]!, b[i]!];
  }
  return b;
}

function buildQuestions(items: VocabItem[], distractors: VocabItem[]) {
  if (!Array.isArray(items) || !Array.isArray(distractors)) return [];
  const sampled = shLocal(items).slice(0, 2);
  return sampled.map((item) => {
    const wrongOpts = shLocal(distractors.filter((d) => d.en !== item.en))
      .slice(0, 3)
      .map((d) => d.en);
    return {
      q: item.hr,
      answer: item.en,
      opts: shLocal([item.en, ...wrongOpts]),
    };
  });
}

export default function MicroQuiz({ items, distractors, onComplete, award }: Props) {
  const [questions] = useState(() => buildQuestions(items, distractors));
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);

  // If not enough items, skip the micro-quiz entirely
  useEffect(() => {
    if (questions.length === 0) {
      onComplete();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (questions.length === 0) {
    return null;
  }

  const cur = questions[idx]!;
  const answered = chosen !== null;
  const correct = chosen === cur.answer;

  function pick(opt: string) {
    if (answered) return;
    setChosen(opt);
    if (opt === cur.answer) award(2, false, 'lesson');
  }

  function next() {
    if (idx + 1 >= questions.length) {
      onComplete();
    } else {
      setIdx((i) => i + 1);
      setChosen(null);
    }
  }

  return (
    <div className="scr-wrap" style={{ maxWidth: 500, margin: '0 auto' }}>
      <div className="c" style={{ padding: '20px 16px' }}>
        <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 4 }}>
          Quick check {idx + 1} / {questions.length}
        </div>
        <div style={{ fontSize: 14, color: '#475569', textAlign: 'center', marginBottom: 16 }}>
          What does this mean?
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#0e7490',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          {cur.q}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {cur.opts.map((opt) => {
            let bg = 'white';
            let bc = 'rgba(14,116,144,.12)';
            if (answered) {
              if (opt === cur.answer) {
                bg = '#dcfce7';
                bc = '#16a34a';
              } else if (opt === chosen) {
                bg = '#fee2e2';
                bc = '#dc2626';
              }
            }
            return (
              <button
                key={opt}
                className="ob"
                style={{ background: bg, borderColor: bc }}
                onClick={() => pick(opt)}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {answered && (
          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: correct ? '#16a34a' : '#64748b' }}>
              {correct ? '✓ Good!' : `Correct answer: ${cur.answer}`}
            </div>
            <button className="b bp" style={{ width: '100%', marginTop: 12 }} onClick={next}>
              {idx + 1 >= questions.length ? 'Continue lesson →' : 'Next →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
