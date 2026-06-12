import React, { useState } from 'react';
import { H, speak } from '../../data';
import { DIMWORDS } from '../../data';
import LessonQuiz from './LessonQuiz';
import { LESSON_QUIZ_BANKS } from '../../lib/lessonQuizBanks';

interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}
function DiminutivesScreen({ goBack, award }: Props) {
  const [quiz, setQuiz] = useState(false);
  if (quiz)
    return (
      <LessonQuiz
        screenId="diminutives"
        statKind="lc"
        questions={LESSON_QUIZ_BANKS['diminutives']!}
        xp={20}
        questKind="grammar"
        award={award ?? (() => {})}
        goBack={goBack}
        title="🐣 Umanjenice check"
      />
    );
  return (
    <div className="scr-wrap">
      {H('🐣 Umanjenice', 'Diminutives — making things small & cute', goBack)}
      {DIMWORDS.map(function (d, i) {
        return (
          <button
            key={i}
            aria-label={`Play audio for ${d.dim}`}
            className="c"
            style={{
              marginBottom: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            onClick={function () {
              speak(d.dim);
            }}
          >
            <div>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{d.base}</span>
              <span style={{ color: '#78716c' }}>{' → '}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#16a34a' }}>
                {d.dim} <span aria-hidden="true">🔊</span>
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--subtext)' }}>{d.rule}</div>
          </button>
        );
      })}
      <button
        className="b bp"
        style={{ width: '100%', marginTop: 16 }}
        onClick={() => setQuiz(true)}
      >
        📝 Take the comprehension check
      </button>
    </div>
  );
}

export default DiminutivesScreen;
