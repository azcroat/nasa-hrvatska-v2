import React, { useState, useMemo, useRef } from 'react';
import { H, Bar, Spk, sh } from '../../data.jsx';
import { rnd } from '../../lib/random.js';

const ASPECT_KEYFRAMES = `
@keyframes pulseBar {
  0%   { width: 0; opacity: 0.4; }
  60%  { opacity: 1; }
  100% { width: 100%; opacity: 1; }
}
@keyframes pulseDot {
  0%   { opacity: 0.3; }
  50%  { opacity: 1; }
  100% { opacity: 0.3; }
}
@keyframes dotAppear {
  0%   { opacity: 0; transform: scale(0); }
  70%  { transform: scale(1.3); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes barFill {
  0%   { width: 0; }
  100% { width: calc(100% - 18px); }
}
`;

function AspectTimeline({ aspect, dimmed }) {
  const isPf = aspect === 'pf';
  const color = dimmed ? 'var(--subtext, #94a3b8)' : (isPf ? 'var(--success, #16a34a)' : 'var(--info, #0284c7)');
  const bgColor = dimmed ? '#f1f5f9' : (isPf ? '#f0fdf4' : '#f0f9ff');
  const borderColor = dimmed ? '#e2e8f0' : (isPf ? '#bbf7d0' : '#bae6fd');

  return (
    <div style={{
      background: bgColor,
      border: `1.5px solid ${borderColor}`,
      borderRadius: 10,
      padding: '10px 14px',
      opacity: dimmed ? 0.55 : 1,
      transition: 'opacity 0.3s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{isPf ? '✓' : '🔄'}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {isPf ? 'Perfective — completed action' : 'Imperfective — ongoing / habitual action'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 24 }}>
        {isPf ? (
          /* Perfective: line + dot that appears */
          <>
            <div style={{
              flex: 1,
              height: 3,
              background: dimmed ? '#cbd5e1' : 'var(--success, #16a34a)',
              borderRadius: 2,
              position: 'relative',
              overflow: 'visible',
            }}>
              {!dimmed && (
                <div style={{
                  position: 'absolute',
                  right: -6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: 'var(--success, #16a34a)',
                  animation: 'dotAppear 0.5s ease forwards',
                  boxShadow: '0 0 0 3px #bbf7d0',
                }} />
              )}
              {dimmed && (
                <div style={{
                  position: 'absolute',
                  right: -6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#cbd5e1',
                }} />
              )}
            </div>
          </>
        ) : (
          /* Imperfective: animated pulse bar */
          <div style={{
            flex: 1,
            height: 10,
            background: '#e0f2fe',
            borderRadius: 6,
            overflow: 'hidden',
            position: 'relative',
          }}>
            {!dimmed ? (
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, var(--info, #0284c7) 0%, #7dd3fc 60%, var(--info, #0284c7) 100%)',
                backgroundSize: '200% 100%',
                borderRadius: 6,
                animation: 'pulseBar 1.2s ease forwards',
                width: 0,
              }} />
            ) : (
              <div style={{
                height: '100%',
                width: '100%',
                background: '#cbd5e1',
                borderRadius: 6,
              }} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ContextAnnotation({ item, questionAspect }) {
  // ctx format: "Impf sentence. / Pf sentence."
  const parts = item.ctx.split('/').map(s => s.trim());
  const impfSentence = parts[0] || '';
  const pfSentence = parts[1] || '';

  return (
    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {impfSentence && (
        <div style={{ fontSize: 12, color: '#475569', fontStyle: 'italic' }}>
          <span style={{ color: 'var(--info, #0284c7)', marginRight: 4 }}>🔄</span>
          {impfSentence}
          <span style={{ color: 'var(--info, #0284c7)', fontStyle: 'normal', fontWeight: 600, marginLeft: 4 }}>
            — imperfective (habit/ongoing)
          </span>
        </div>
      )}
      {pfSentence && (
        <div style={{ fontSize: 12, color: '#475569', fontStyle: 'italic' }}>
          <span style={{ color: 'var(--success, #16a34a)', marginRight: 4 }}>✓</span>
          {pfSentence}
          <span style={{ color: 'var(--success, #16a34a)', fontStyle: 'normal', fontWeight: 600, marginLeft: 4 }}>
            — perfective (done)
          </span>
        </div>
      )}
    </div>
  );
}

export default function AspectDrillScreen({ goBack, award, ASPECT_PAIRS }) {
  const finishFired = useRef(false);

  // ── Mistake tracking ──────────────────────────────────────────────────────
  const [mistakesOnly, setMistakesOnly] = useState(false);
  const [mistakeIds, setMistakeIds] = useState(new Set());

  // ── Mode ─────────────────────────────────────────────────────────────────
  // "identify" — given an English verb, pick the correct Croatian aspect form
  // "choose"   — given a context sentence, pick the correct aspect pair
  const [mode, setMode] = useState("identify");

  const allItems = useMemo(() => {
    if (!ASPECT_PAIRS) return [];
    return sh(ASPECT_PAIRS).slice(0, 15);
  }, [ASPECT_PAIRS]);

  // When "Drill mistakes only" is active, filter to only previously wrong items
  const items = useMemo(() => {
    if (mistakesOnly && mistakeIds.size > 0) {
      return allItems.filter(item => mistakeIds.has(item.en));
    }
    return allItems;
  }, [allItems, mistakesOnly, mistakeIds]);

  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (!allItems.length) return null;

  // If "Drill mistakes only" is on but no mistakes yet, show a notice
  if (mistakesOnly && mistakeIds.size === 0) {
    return (
      <div className="scr-wrap">
        <style>{ASPECT_KEYFRAMES}</style>
        {H("🔄 Verb Aspect Drill")}
        {renderModeBar()}
        <div className="c" style={{ padding: '20px', marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <p style={{ color: '#475569', fontSize: 14 }}>No mistakes recorded yet. Complete some questions first, then enable this filter to drill only what you got wrong.</p>
          <button className="b bg" style={{ marginTop: 16 }} onClick={() => setMistakesOnly(false)}>Back to all questions</button>
        </div>
      </div>
    );
  }

  if (done) {
    const total = items.length;
    const pct = Math.round((score / total) * 100);
    return (
      <div className="scr-wrap">
        {H("🔄 Verb Aspects")}
        <div style={{textAlign:"center",paddingTop:32}}>
          <div style={{fontSize:64}}>{pct>=80?"🌟":"🎉"}</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:"#164e63",marginTop:8}}>
            {pct>=80?"Excellent!":"Good Work!"}
          </h2>
          <p style={{color:"#78716c",marginTop:8}}>{score}/{total} correct</p>
          <div style={{background:"#fffbeb",border:"1.5px solid #fde68a",borderRadius:14,padding:"16px 20px",textAlign:"left",marginTop:24}}>
            <p style={{fontWeight:700,fontSize:13,color:"#92400e",marginBottom:8}}>🔑 Key Rule:</p>
            <p style={{fontSize:13,color:"#78350f",lineHeight:1.6}}>
              <strong>Imperfective</strong> = ongoing, repeated, or habitual actions<br/>
              <strong>Perfective</strong> = completed, one-time, or result-focused actions<br/>
              After <em>početi, završiti, nastaviti</em> → always imperfective<br/>
              With <em>odmah, jednom</em> → usually perfective
            </p>
          </div>
          <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:24}}>
            <button className="b bg" onClick={()=>{setIdx(0);setAnswered(false);setSelected(null);setScore(0);setDone(false);}}>Retry</button>
            <button className="b bp" onClick={()=>{if(finishFired.current)return;finishFired.current=true;award(score*5+5);goBack();}}>Finish</button>
          </div>
        </div>
      </div>
    );
  }

  const item = items[idx];

  // ── Build question based on mode ─────────────────────────────────────────

  let q;

  if (mode === "identify") {
    // User sees English verb, picks the correct Croatian form (impf or pf)
    const askImpf = rnd() > 0.5 || idx === 0;
    q = askImpf
      ? {
          question: `Which is the IMPERFECTIVE (ongoing/repeated) form of "${item.en}"?`,
          correct: item.impf,
          wrong: item.pf,
          opts: sh([item.impf, item.pf]),
          explain: `${item.impf} = ongoing/habitual. ${item.rule}.`,
          correctAspect: 'impf',
          chooseMode: false,
        }
      : {
          question: `Which is the PERFECTIVE (completed/one-time) form of "${item.en}"?`,
          correct: item.pf,
          wrong: item.impf,
          opts: sh([item.pf, item.impf]),
          explain: `${item.pf} = completed. ${item.rule}.`,
          correctAspect: 'pf',
          chooseMode: false,
        };
  } else {
    // "choose" mode — given context sentence, pick the right aspect pair
    // Build 2 distractors: current item's pair vs. another item's pair (swapped or from pool)
    const correctPair = `${item.impf} / ${item.pf}`;
    // Pick a distractor from another item in the pool
    const othersPool = allItems.filter(it => it.en !== item.en);
    const distractor = othersPool.length > 0
      ? `${othersPool[idx % othersPool.length].impf} / ${othersPool[idx % othersPool.length].pf}`
      : `${item.pf} / ${item.impf}`; // fallback: swap current pair

    q = {
      question: `Which aspect pair belongs to the verb meaning "${item.en}"?`,
      subtext: `Context: ${item.ctx}`,
      correct: correctPair,
      wrong: distractor,
      opts: sh([correctPair, distractor]),
      explain: `${item.impf} (imperfective) / ${item.pf} (perfective). ${item.rule}.`,
      correctAspect: 'impf', // used only for the timeline visualisation
      chooseMode: true,
    };
  }

  function handleAnswer(opt) {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
    if (opt === q.correct) {
      setScore(s => s + 1);
    } else {
      // Track this item as a mistake
      setMistakeIds(prev => {
        const next = new Set(prev);
        next.add(item.en);
        return next;
      });
    }
  }

  function handleNext() {
    if (idx < items.length - 1) {
      setIdx(i => i + 1);
      setAnswered(false);
      setSelected(null);
    } else {
      setDone(true);
    }
  }

  const isCorrect = answered && selected === q.correct;

  function renderModeBar() {
    return (
      <div style={{ display: 'flex', gap: 8, margin: '12px 0 0', padding: '0 4px' }}>
        <button
          onClick={() => { setMode('identify'); setIdx(0); setAnswered(false); setSelected(null); setScore(0); setDone(false); }}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 8,
            border: mode === 'identify' ? '2px solid #d97706' : '2px solid #e2e8f0',
            background: mode === 'identify' ? '#fffbeb' : '#f8fafc',
            color: mode === 'identify' ? '#92400e' : '#64748b',
            fontWeight: mode === 'identify' ? 700 : 500,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Identify
        </button>
        <button
          onClick={() => { setMode('choose'); setIdx(0); setAnswered(false); setSelected(null); setScore(0); setDone(false); }}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 8,
            border: mode === 'choose' ? '2px solid #7c3aed' : '2px solid #e2e8f0',
            background: mode === 'choose' ? '#f5f3ff' : '#f8fafc',
            color: mode === 'choose' ? '#4c1d95' : '#64748b',
            fontWeight: mode === 'choose' ? 700 : 500,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Choose
        </button>
        <button
          onClick={() => setMistakesOnly(m => !m)}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 8,
            border: mistakesOnly ? '2px solid #dc2626' : '2px solid #e2e8f0',
            background: mistakesOnly ? '#fef2f2' : '#f8fafc',
            color: mistakesOnly ? '#991b1b' : '#64748b',
            fontWeight: mistakesOnly ? 700 : 500,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Mistakes only
        </button>
      </div>
    );
  }

  return (
    <div className="scr-wrap">
      <style>{ASPECT_KEYFRAMES}</style>
      {H("🔄 Verb Aspect Drill")}
      {renderModeBar()}
      <Bar v={idx+1} mx={items.length} color="#d97706" h={6} />
      <div className="c" style={{padding:"20px",marginTop:16}}>
        <p style={{fontSize:14,color:"#92400e",fontWeight:700,background:"#fffbeb",borderRadius:8,padding:"8px 12px",marginBottom:16}}>
          {q.question}
        </p>
        <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"12px 14px",marginBottom:20,fontSize:13,color:"#475569"}}>
          <strong>Context:</strong> <em>{item.ctx}</em>
        </div>
        {q.opts.map((opt, i) => {
          let cls = "ob";
          if (answered) {
            if (opt === q.correct) cls += " ok";
            else if (opt === selected) cls += " no";
          }
          return (
            <button key={i} className={cls} style={{fontSize:18,fontWeight:800}}
              onClick={() => handleAnswer(opt)}>
              {opt}
            </button>
          );
        })}
        {answered && (
          <div style={{marginTop:12,background: isCorrect ? "#f0f9ff" : "#fff1f2",border:`1.5px solid ${isCorrect ? "#bae6fd" : "#fecdd3"}`,borderRadius:10,padding:"12px 14px"}}>
            <p style={{fontWeight:700,fontSize:13,color:isCorrect?"#166534":"#dc2626",margin:"0 0 6px"}}>
              {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
            </p>
            <p style={{fontSize:13,color:"#475569",margin:0}}>{q.explain}</p>
          </div>
        )}
        {answered && (
          <div style={{marginTop:14}}>
            <div style={{fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>
              Aspect Visualized
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <AspectTimeline aspect={q.correctAspect} dimmed={false} />
              <AspectTimeline aspect={q.correctAspect === 'pf' ? 'impf' : 'pf'} dimmed={true} />
            </div>
            <ContextAnnotation item={item} questionAspect={q.correctAspect} />
          </div>
        )}
        {answered && (
          <button className="b bp" style={{width:"100%",marginTop:16}} onClick={handleNext}>
            {isCorrect
              ? (idx < items.length - 1 ? "Next →" : "Results")
              : (idx < items.length - 1 ? "Keep going →" : "Results")}
          </button>
        )}
      </div>
    </div>
  );
}
