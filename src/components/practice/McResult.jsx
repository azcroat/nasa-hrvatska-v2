import React from 'react';
import { V, sh } from '../../data.jsx';
import CroatianKnight from '../shared/CroatianKnight';

export default function McResult({ questions, score, setScr, goBack, onNewGame }) {
  const total = questions.length;
  const allCats = Object.keys(V);

  function playAgain() {
    const pool = allCats.flatMap(c => V[c]);
    const items = sh(pool).slice(0, 15).map(w => {
      const wr = sh(pool.filter(p => p[1] !== w[1])).slice(0, 3).map(p => p[1]);
      return { hr: w[0], en: w[1], ph: w[2], opts: sh([w[1], ...wr]), correct: w[1] };
    });
    onNewGame(items);
  }

  return (
    <div className="scr-wrap">
      <CroatianKnight
        size={90}
        mood={
          score === total ? 'celebrating' :
          score / total >= 0.6 ? 'happy' :
          'encouraged'
        }
        style={{ margin: '0 auto 8px', display: 'block' }}
      />
      <div style={{fontSize:64}}>
        {score === total ? "🌟" : "🎉"}
      </div>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:'var(--heading)'}}>
        {score === total ? "Perfect!" : "Great Job!"}
      </h2>
      <p style={{color:"#78716c",marginTop:8,fontSize:20}}>
        {score}/{total}
      </p>
      <div style={{ fontSize: 13, color: 'var(--subtext)', marginTop: 4 }}>
        {score} correct · {total - score} missed
      </div>
      <div style={{
        marginTop:12, padding:'10px 14px',
        background:'var(--bar-bg)', borderRadius:10,
        fontSize:12, color:'var(--subtext)', textAlign:'center', fontWeight:600
      }}>
        📊 Session: {score || 0} correct · {(score || 0) * 3 + 5} XP earned
      </div>
      <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 3, textAlign: 'center' }}>
        {score} correct × 3 XP + 5 bonus = {score * 3 + 5} XP
      </div>

      {/* What to study next */}
      <div style={{
        background: 'var(--info-bg)',
        border: '1px solid var(--info-b, rgba(14,116,144,0.3))',
        borderRadius: 12,
        padding: '10px 14px',
        margin: '12px 0',
        fontSize: 13,
        color: 'var(--info)',
        fontWeight: 600,
        textAlign: 'center',
      }}>
        {score === total
          ? '🌟 Perfect! Try a harder difficulty next time.'
          : score / total >= 0.7
          ? '💪 Great work! Review missed words with Flashcards 🃏'
          : '📖 Practice these words with Flashcards before retrying 🃏'}
      </div>

      <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:24}}>
        <button className="b bg" onClick={playAgain}>
          Play Again
        </button>
        <button className="b bp" onClick={goBack}>
          Back to Practice
        </button>
      </div>
    </div>
  );
}
