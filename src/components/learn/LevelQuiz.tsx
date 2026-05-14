import React, { useState, useRef } from 'react';
import { H, Bar } from '../../data';
import { markQuest } from '../../lib/quests.js';
import { useStats } from '../../context/StatsContext';
import { rnd } from '../../lib/random.js';
import type { StatsDelta } from '../../types/index.js';

export interface LevelQuizQuestion {
  q: string;
  opts: string[];
  answer: string;
  en?: string;
  tip?: string;
}

interface Props {
  levelNumber: number;
  questions: LevelQuizQuestion[];
  goBack: () => void;
  award: (xp: number, celebrate?: boolean, activityType?: string) => void;
  onPass?: () => void;
}

function shLocal<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [b[i], b[j]] = [b[j]!, b[i]!];
  }
  return b;
}

export default function LevelQuiz({ levelNumber, questions, goBack, award, onPass }: Props) {
  const { setStats, writeDelta } = useStats();
  const finishFired = useRef(false);
  const [q] = useState(() =>
    shLocal((Array.isArray(questions) ? questions : []).slice(0, 10)).map((item) => ({
      ...item,
      opts: shLocal([...(Array.isArray(item.opts) ? item.opts : [])]),
    })),
  );
  const total = q.length;
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (total === 0) {
    return (
      <div className="scr-wrap">
        {H(`Level ${levelNumber} Quiz`, 'Not enough items to build a quiz', goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
          <p>This level needs more items to generate a quiz. Continue practising.</p>
          <button className="b bp" style={{ marginTop: 12 }} onClick={goBack}>
            Back
          </button>
        </div>
      </div>
    );
  }

  const cur = q[idx]!;
  const answered = chosen !== null;
  const passed = score >= Math.ceil(total * 0.7);

  function pick(opt: string) {
    if (answered) return;
    setChosen(opt);
    if (opt === cur.answer) setScore((s) => s + 1);
  }

  function next() {
    if (idx + 1 >= total) {
      if (!finishFired.current) {
        finishFired.current = true;
        const xpAward = score * 5;
        award(xpAward, false, 'grammar');
        markQuest('grammar');
        const now = Date.now();
        setStats((prev) => {
          const prevPasses = prev.levelQuizPasses ?? {};
          const existing = prevPasses[levelNumber];
          // Only overwrite if better OR no existing entry
          if (existing && existing.score >= score) {
            return prev;
          }
          return {
            ...prev,
            levelQuizPasses: { ...prevPasses, [levelNumber]: { score, passedAt: now } },
          };
        });
        if (writeDelta) {
          writeDelta({
            levelQuizPasses: { [levelNumber]: { score, passedAt: now } },
          } as unknown as StatsDelta);
        }
        if (passed && onPass) onPass();
      }
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      setChosen(null);
    }
  }

  if (done) {
    return (
      <div className="scr-wrap">
        {H(`Level ${levelNumber} Quiz`, '', goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{passed ? 'Pass' : 'Review'}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {score} / {total}
          </div>
          <div style={{ fontSize: 15, color: '#64748b', marginBottom: 16 }}>
            {passed
              ? `Level ${levelNumber + 1} unlocked!`
              : `Need 70% to pass. Review weak items and try again.`}
          </div>
          <button className="b bp" style={{ width: '100%' }} onClick={goBack}>
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="scr-wrap">
      {H(`Level ${levelNumber} Quiz`, `Show what you've learned`, goBack)}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
        <span style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>
          {idx + 1} / {total}
        </span>
        <Bar v={idx + 1} mx={total} />
      </div>
      <div className="c" style={{ marginTop: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#0e7490', lineHeight: 1.4 }}>
          {cur.q}
        </div>
        {cur.en && <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{cur.en}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
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
        {answered && cur.tip && (
          <div
            style={{
              marginTop: 14,
              padding: '10px 14px',
              background: '#f0f9ff',
              borderRadius: 10,
              border: '1px solid #bae6fd',
              fontSize: 14,
              color: '#0369a1',
            }}
          >
            <strong>{chosen === cur.answer ? 'Correct!' : 'Incorrect.'}</strong> {cur.tip}
          </div>
        )}
        {answered && (
          <button className="b bp" style={{ width: '100%', marginTop: 16 }} onClick={next}>
            {idx + 1 >= total ? 'See results' : 'Next'}
          </button>
        )}
      </div>
    </div>
  );
}
