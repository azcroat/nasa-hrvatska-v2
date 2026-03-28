import React, { useState, useMemo, useEffect, useRef } from 'react';
import { H, Bar, Spk, srMark, getDueReviews, getSR, sh } from '../../data.jsx';
import { useHaptic } from '../../hooks/useHaptic.js';
import { markPracticed } from '../../hooks/useNotifications.js';
import { markQuest } from '../../lib/quests.js';

export default function ReviewScreen({ goBack, award, allCats, V }) {
  const haptic = useHaptic();
  const finishFired = useRef(false);
  const pool = useMemo(() => allCats.flatMap(t => V[t]), [allCats]); // eslint-disable-line react-hooks/exhaustive-deps

  const dueWords = useMemo(() => {
    const due = getDueReviews();
    return due.map(w => pool.find(x => x[0] === w)).filter(Boolean);
  }, [pool]);

  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(-1);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const questions = useMemo(() => {
    if (dueWords.length === 0) return [];
    return dueWords.slice(0, 20).map(w => {
      const wrong = pool.filter(x => x[1] !== w[1]);
      const distractors = sh(wrong).slice(0, 3).map(x => x[1]);
      const opts = sh([w[1], ...distractors]);
      return { word: w, opts, correct: w[1] };
    });
  }, [dueWords, pool]);

  // Use a ref to hold current values so the keyboard handler never goes stale
  const stateRef = useRef(/** @type {{answered: boolean, idx: number, questions: any[], score: number}} */ ({}));
  stateRef.current = { answered, idx, questions, score };

  // Keyboard shortcuts: 1-4 to pick answer, Space/Enter to advance
  // Hooks must be unconditional — placed before all early returns
  useEffect(() => {
    function handleKey(e) {
      const { answered: ans, idx: i, questions: qs } = stateRef.current;
      if (e.key === ' ' || e.key === 'Enter') {
        if (ans) {
          if (i < qs.length - 1) { setIdx(n => n + 1); setAnswered(false); setSelected(-1); }
          else setDone(true);
        }
      }
      if (['1','2','3','4'].includes(e.key)) {
        const qi = parseInt(e.key, 10) - 1;
        const q = qs[i];
        if (!ans && q && q.opts[qi] !== undefined) {
          setSelected(qi); setAnswered(true);
          const ok = q.opts[qi] === q.correct;
          if (ok) { setScore(s => s + 1); haptic.correct(); } else haptic.wrong();
          srMark(q.word[0], ok);
        }
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [haptic]); // haptic is stable; stateRef.current is read inside, no stale closure

  const nextReviewETA = useMemo(() => {
    const sr = getSR();
    const now = Date.now();
    let earliest = Infinity;
    for (const entry of Object.values(sr)) {
      if (entry.nextDue && entry.nextDue > now && entry.nextDue < earliest) {
        earliest = entry.nextDue;
      }
    }
    return earliest === Infinity ? null : new Date(earliest);
  }, []);

  if (dueWords.length === 0) {
    return (
      <div className="scr-wrap">
        {H("🔁 Review Due")}
        <div style={{textAlign:"center",paddingTop:40}}>
          <div style={{fontSize:64}}>✅</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:"#164e63",marginTop:12}}>All caught up!</h2>
          <p style={{color:"#78716c",marginTop:8,lineHeight:1.6}}>
            No reviews due right now.<br/>
            Words you&apos;ve practiced will appear here when it&apos;s time to review them.
          </p>
          {nextReviewETA && (
            <div style={{background:"#f0f9ff",border:"1.5px solid #bae6fd",borderRadius:12,padding:"12px 16px",marginTop:16,display:"inline-flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:18}}>⏰</span>
              <span style={{fontSize:13,fontWeight:700,color:"#0369a1"}}>
                Next review: {nextReviewETA.toLocaleDateString([], {weekday:'short',month:'short',day:'numeric'})} at {nextReviewETA.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
              </span>
            </div>
          )}
          <div style={{background:"#f0fdf4",border:"1.5px solid #bbf7d0",borderRadius:14,padding:"16px",marginTop:24,textAlign:"left"}}>
            <p style={{fontWeight:700,fontSize:13,color:"#166534",marginBottom:6}}>💡 How spaced repetition works:</p>
            <p style={{fontSize:13,color:"#374151",lineHeight:1.6}}>
              Words you practice are scheduled for review at increasing intervals: 1 day → 3 days → 7 days → 14 days → 30 days. Come back tomorrow to review today&apos;s words!
            </p>
          </div>
          <button className="b bp" style={{marginTop:24}} onClick={goBack}>Go Back</button>
        </div>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="scr-wrap">
        {H("🔁 Review Due")}
        <div style={{textAlign:"center",paddingTop:32}}>
          <div style={{fontSize:64}}>{pct>=80?"🌟":"🎉"}</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:"#164e63",marginTop:8}}>Review Complete!</h2>
          <p style={{color:"#78716c",marginTop:8}}>{score}/{questions.length} correct</p>
          <p style={{fontSize:13,color:"#64748b",marginTop:8}}>Your spaced repetition intervals have been updated</p>
          <button className="b bp" style={{marginTop:24}} onClick={()=>{if(finishFired.current)return;finishFired.current=true;markPracticed();haptic.award();award(score*5+5);markQuest('master');goBack();}}>Continue</button>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  if (!q) return null;

  return (
    <div className="scr-wrap">
      {H("🔁 Review Due")}
      <p style={{fontSize:12,color:"#78716c",marginBottom:8,fontWeight:500}}>{dueWords.length} words due · <span style={{opacity:.6}}>keys 1-4 to answer, Space to continue</span></p>
      <Bar v={idx+1} mx={questions.length} color="#7c3aed" h={6} />
      <div className="c" style={{marginTop:16,padding:"20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <Spk text={q.word[0]} label={q.word[0]} />
          <p style={{fontSize:28,fontWeight:800,fontFamily:"'Playfair Display',serif",margin:0}}>{q.word[0]}</p>
        </div>
        <p style={{fontSize:13,color:"#78716c",marginBottom:16}}>What does this mean?</p>
        {q.opts.map((opt, i) => {
          let cls = "ob";
          if (answered) {
            if (opt === q.correct) cls += " ok";
            else if (i === selected) cls += " no";
          }
          return (
            <button key={opt} className={cls} onClick={() => {
              if (answered) return;
              setSelected(i);
              setAnswered(true);
              const ok = opt === q.correct;
              if (ok) { setScore(s => s + 1); haptic.correct(); } else haptic.wrong();
              srMark(q.word[0], ok);
            }}>
              <span style={{opacity:.4,fontSize:11,marginRight:6}}>{i+1}</span>{opt}
            </button>
          );
        })}
        {answered && selected !== -1 && q.opts[selected] !== q.correct && (
          <div style={{
            background:'var(--info-bg)', border:'1.5px solid var(--info-b)',
            borderRadius:14, padding:'14px 16px', marginTop:14, marginBottom:4,
            animation:'spring-in .3s ease',
          }}>
            <div style={{fontSize:11, fontWeight:800, color:'var(--info)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8}}>
              ✓ The answer was
            </div>
            <div style={{fontSize:22, fontWeight:900, color:'var(--success)', fontFamily:"'Playfair Display',serif", marginBottom:6}}>
              {q.correct}
            </div>
            {q.word[2] && (
              <div style={{fontSize:12, color:'var(--subtext)', lineHeight:1.5, marginBottom:8}}>
                {q.word[2]}
              </div>
            )}
            <Spk text={q.word[0]} label="Tip: hear it again 🔊" />
          </div>
        )}
        {answered && selected !== -1 && q.opts[selected] === q.correct && (
          <div style={{background:'var(--success-bg)', border:'1.5px solid var(--success-b)', borderRadius:12, padding:'10px 14px', marginTop:12, display:'flex', alignItems:'center', gap:8, animation:'spring-in .3s ease'}}>
            <span style={{fontSize:18}}>✓</span>
            <span style={{fontSize:14, fontWeight:800, color:'var(--success)'}}>Točno! · Correct!</span>
          </div>
        )}
        {answered && (
          <button className="b bp" style={{width:"100%",marginTop:16}} onClick={() => {
            if (idx < questions.length - 1) { setIdx(i => i + 1); setAnswered(false); setSelected(-1); }
            else setDone(true);
          }}>
            {idx < questions.length - 1 ? "Next →" : "Results"}
          </button>
        )}
      </div>
    </div>
  );
}
