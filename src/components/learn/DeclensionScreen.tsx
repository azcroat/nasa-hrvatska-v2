// @ts-nocheck
import React, { useState, useMemo, useRef } from 'react';
import { H, speak, sh } from '../../data';
import { DECL } from '../../data';
import { markQuest } from '../../lib/quests.js';
import { addWordToSRS } from '../../lib/srs.js';
import { useStats } from '../../context/StatsContext.tsx';

// Build 14 case quiz questions: show a sentence context, pick the correct case form
function buildDeclQuiz(nouns, caseNames) {
  const qs = [];
  // Mix questions: some ask for a specific case, some ask "which case is this form?"
  nouns.forEach(noun => {
    caseNames.forEach((caseName, ci) => {
      const correct = noun.cases[ci];
      // Distractors: other cases of same noun, or same case of other nouns
      const sameCaseOtherNouns = nouns.filter(n => n !== noun).map(n => n.cases[ci]).filter(f => f !== correct);
      const otherCasesThisNoun = noun.cases.filter((_, i) => i !== ci && noun.cases[i] !== correct);
      const allDistractors = sh([...sameCaseOtherNouns, ...otherCasesThisNoun]);
      const distractors = allDistractors.slice(0, 3);
      while (distractors.length < 3) distractors.push(noun.cases[(ci + 1) % caseNames.length]);
      qs.push({ noun: noun.nom, en: noun.en, caseName, caseNum: ci + 1, correct, opts: sh([correct, ...distractors]) });
    });
  });
  return sh(qs).slice(0, 14);
}

export default function DeclensionScreen({ goBack, award }) {
  const { stats, setStats, writeDelta } = useStats();
  const [mode, setMode] = useState('reference'); // 'reference' | 'quiz'
  const [dcNoun, sDcNoun] = useState(0);

  const questions = useMemo(() => buildDeclQuiz(DECL.nouns, DECL.caseNames), []);
  const [qi, setQi] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const awardFired = useRef(false);

  const n = DECL.nouns[dcNoun];

  function handleAnswer(opt) {
    if (answered) return;
    const q = questions[qi];
    setSelected(opt);
    setAnswered(true);
    if (opt === q.correct) { setScore(s => s + 1); speak(opt); addWordToSRS(q.noun); }
  }

  function next() {
    if (qi < questions.length - 1) {
      setQi(i => i + 1);
      setAnswered(false);
      setSelected(null);
    } else {
      if (!awardFired.current) {
        awardFired.current = true;
        markQuest('grammar');
        if (award) award(score * 4 + 10);
      }
      setQuizDone(true);
    }
  }

  // ── Reference mode ────────────────────────────────────────────────────────────
  if (mode === 'reference') {
    return (
      <div className="scr-wrap">
        {H("📝 Noun Declension Trainer","All 7 cases for key nouns",goBack)}

        <div className="c" style={{marginBottom:12,padding:"10px 14px",background:"rgba(14,116,144,.06)",fontSize:12}}>
          💡 Pick a noun below, then tap any case form to hear it spoken. When ready, test yourself!
        </div>

        {/* Noun selector */}
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
          {DECL.nouns.map(function(noun,i){return (
            <button key={i} className={"b "+(dcNoun===i?"bp":"bg")} style={{fontSize:13}} onClick={function(){sDcNoun(i)}}>
              {noun.nom} <span style={{fontSize:11,opacity:.7}}>({noun.en})</span>
            </button>
          );})}
        </div>

        {/* Case table */}
        <div className="c" style={{padding:0,overflow:"hidden",marginBottom:16}}>
          <div style={{padding:"10px 14px",background:"linear-gradient(135deg,#0e7490,#164e63)",color:"white"}}>
            <span style={{fontWeight:800,fontSize:16}}>{n.nom}</span>
            <span style={{fontSize:13,opacity:.8,marginLeft:8}}>({n.en}) · {n.gender}</span>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <tbody>
              {DECL.caseNames.map(function(cs,ci){return (
                <tr key={ci} style={{borderBottom:"1px solid #f3f4f6",background:ci%2?"#fafaf9":"white"}}
                  onClick={function(){speak(n.cases[ci])}} role="button" tabIndex={0}
                  aria-label={`Play ${cs}: ${n.cases[ci]}`}
                  onKeyDown={function(e){if(e.key==="Enter"||e.key===" ")speak(n.cases[ci])}}>
                  <td style={{padding:"10px 14px",fontWeight:700,color:"#0e7490",fontSize:13,width:"40%"}}>
                    <span style={{fontSize:11,color:"#b45309",display:"block"}}>{ci+1}.</span>
                    {cs}
                  </td>
                  <td style={{padding:"10px 14px",fontWeight:700,fontSize:17,color:"#164e63"}}>
                    {n.cases[ci]} <span style={{fontSize:14,opacity:.5}} aria-hidden="true">🔊</span>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>

        <button className="b bp" style={{width:"100%",fontSize:15,marginBottom:24}} onClick={()=>setMode('quiz')}>
          ✏️ Test the Cases →
        </button>
      </div>
    );
  }

  // ── Quiz done ─────────────────────────────────────────────────────────────────
  if (quizDone) {
    const pct = score / questions.length;
    return (
      <div className="scr-wrap">
        {H("📝 Cases Quiz","",goBack)}
        <div style={{textAlign:"center",padding:"32px 16px"}}>
          <div style={{fontSize:48,marginBottom:12}}>{pct>=0.8?"🏆":pct>=0.6?"⭐":"💪"}</div>
          <div style={{fontSize:22,fontWeight:800,color:"#164e63",marginBottom:4}}>{score}/{questions.length} correct</div>
          <div style={{fontSize:13,color:"#78716c",marginBottom:16}}>
            {pct>=0.8?"Case master! Your declension is solid.":pct>=0.6?"Good progress! Cases take time to internalize.":"Review the table and try again — the patterns will click."}
          </div>
          <div style={{fontSize:22,fontWeight:900,color:"#d97706",marginBottom:24}}>+{score*4+10} XP</div>
          <div style={{display:"flex",gap:10}}>
            <button className="b bg" style={{flex:1}} onClick={()=>{ setMode('reference'); }}>📖 Review</button>
            <button className="b bp" style={{flex:1}} onClick={() => {
              if (!stats.vs?.includes('declension')) {
                setStats(prev => {
                  if (prev.vs?.includes('declension')) return prev;
                  return { ...prev, gc: (prev.gc || 0) + 1, vs: [...(prev.vs || []), 'declension'] };
                });
                if (writeDelta) writeDelta({ gc: 1, vs: ['declension'] });
              }
              goBack();
            }}>✓ Done</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz mode ─────────────────────────────────────────────────────────────────
  const q = questions[qi];
  const pctBar = Math.round(((qi + (answered ? 1 : 0)) / questions.length) * 100);

  return (
    <div className="scr-wrap">
      {H("📝 Cases Quiz",`${qi+1} / ${questions.length}`,goBack)}

      <div style={{height:6,borderRadius:99,background:"rgba(14,116,144,.12)",marginBottom:20,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pctBar}%`,borderRadius:99,background:"linear-gradient(90deg,#0e7490,#06b6d4)",transition:"width .3s"}}/>
      </div>

      <div className="c" style={{marginBottom:16,padding:"18px 16px",textAlign:"center"}}>
        <div style={{fontSize:12,color:"#78716c",marginBottom:4,fontWeight:700,letterSpacing:".05em"}}>
          {q.caseNum}. {q.caseName.toUpperCase()} CASE
        </div>
        <div style={{fontSize:20,fontWeight:800,color:"#164e63",marginBottom:4}}>{q.noun}</div>
        <div style={{fontSize:13,color:"#78716c"}}>({q.en}) — pick the correct {q.caseName} form</div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {q.opts.map((o,oi) => {
          let bg = "white", bc = "#e7e5e4", col = "#1c1917";
          if (answered) {
            if (o === q.correct) { bg = "#dcfce7"; bc = "#16a34a"; col = "#14532d"; }
            else if (o === selected) { bg = "#fee2e2"; bc = "#dc2626"; col = "#7f1d1d"; }
          }
          return (
            <button key={oi} onClick={() => handleAnswer(o)}
              style={{padding:"14px 16px",border:`2px solid ${bc}`,borderRadius:12,background:bg,
                color:col,fontSize:17,fontWeight:700,cursor:answered?"default":"pointer",
                fontFamily:"'Outfit',sans-serif",transition:"all .15s",textAlign:"center"}}>
              {o}
              {answered && o === q.correct && <span style={{float:"right"}}>✓</span>}
            </button>
          );
        })}
      </div>

      {answered && (
        <div style={{marginTop:12,padding:"10px 14px",borderRadius:10,fontSize:12,
          background:selected===q.correct?"rgba(22,163,74,.07)":"rgba(220,38,38,.06)",
          border:`1px solid ${selected===q.correct?"rgba(22,163,74,.2)":"rgba(220,38,38,.15)"}`}}>
          {selected===q.correct
            ? `✓ "${q.correct}" is the ${q.caseName} of "${q.noun}"`
            : `✗ The ${q.caseName} of "${q.noun}" is "${q.correct}"`}
        </div>
      )}

      {answered && (
        <button className="b bp" style={{width:"100%",marginTop:12}} onClick={next}>
          {qi<questions.length-1?"Next →":"See Results"}
        </button>
      )}

      <button style={{display:"block",width:"100%",marginTop:10,padding:"8px",border:"none",background:"none",fontSize:12,color:"#78716c",cursor:"pointer",textDecoration:"underline"}} onClick={()=>setMode('reference')}>
        Back to reference
      </button>
    </div>
  );
}
