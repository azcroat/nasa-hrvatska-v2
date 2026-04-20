// @ts-nocheck
import React, { useRef, useState } from 'react';
import { H, sh } from '../../../data';
import { FILL_STORIES } from '../../../data';
import { markQuest } from '../../../lib/quests.js';

function FillStoryScreen({ goBack, award }) {
  const total = FILL_STORIES.reduce(function (sum, story) {
    return sum + story.story.length;
  }, 0);
  const answeredRef = useRef(0);
  const correctRef = useRef(0);
  const [done, setDone] = useState(false);

  function handleAnswer(e, isCorrect) {
    const btns = e.target.parentNode.children;
    for (let i = 0; i < btns.length; i++) {
      btns[i].style.background = 'white';
      btns[i].style.borderColor = '#d6d3d1';
    }
    e.target.style.background = isCorrect ? '#dcfce7' : '#fee2e2';
    e.target.style.borderColor = isCorrect ? '#16a34a' : '#dc2626';
    if (isCorrect) {
      if (typeof award === 'function') award(3);
    }
    if (e.target.closest && e.target.closest('div'))
      e.target.closest('div').style.pointerEvents = 'none';
    if (isCorrect) correctRef.current++;
    answeredRef.current++;
    if (answeredRef.current >= total && !done) {
      markQuest('grammar');
      setDone(true);
    }
  }

  return (
    <div className="scr-wrap">
      {H('📝 Story Builder', 'Read and fill the blanks', goBack)}
      {FILL_STORIES.map(function (story, si) {
        return (
          <div key={si} className="c" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#164e63', marginBottom: 10 }}>
              {'📖 '}
              {story.title}
            </div>
            {story.story.map(function (s, qi) {
              return (
                <div key={qi} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 13, color: '#44403c', marginBottom: 4 }}>
                    {s.text.replace('_____', '______')}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {sh(s.opts).map(function (o, oi) {
                      return (
                        <button
                          key={oi}
                          style={{
                            padding: '6px 12px',
                            border: '2px solid #d6d3d1',
                            borderRadius: 10,
                            background: 'white',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                          onClick={function (e) {
                            handleAnswer(e, o === s.blank);
                          }}
                        >
                          {o}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 11, color: '#a8a29e', marginTop: 2 }}>{s.en}</div>
                </div>
              );
            })}
          </div>
        );
      })}
      {done && (
        <div className="c" style={{ marginTop: 16, padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>
            {correctRef.current / total >= 0.8
              ? '🏆'
              : correctRef.current / total >= 0.6
                ? '⭐'
                : '💪'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#164e63', marginBottom: 4 }}>
            {correctRef.current}/{total} correct
          </div>
          <button className="b bp" style={{ marginTop: 12 }} onClick={goBack}>
            ✓ Done
          </button>
        </div>
      )}
    </div>
  );
}

export default FillStoryScreen;
