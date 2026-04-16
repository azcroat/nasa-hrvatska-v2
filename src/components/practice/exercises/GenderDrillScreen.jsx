import React, { useState, useRef } from 'react';
import { useStats } from '../../../context/StatsContext.tsx';
import { H, speak, sh } from '../../../data.jsx';
import { GENDERDRILL } from '../../../data.jsx';
import { markQuest } from '../../../lib/quests.js';
import { recordTopicResult } from '../../../lib/adaptive.js';

function GenderDrillScreen({ goBack, award, setSt }) {
  const { writeDelta } = useStats();
  // ─── Sort by Gender state ──────────────────────────────────────────────────
  // revealedGenders: { [i]: { guess: 'm'|'f'|'n', correct: bool } }
  const [revealedGenders, setRevealedGenders] = useState({});
  const [selectedGenderIdx, setSelectedGenderIdx] = useState(null);

  // ─── Make it Plural state (multiple choice) ────────────────────────────────
  // pluralAnswered: { [i]: { guess: string, correct: bool } }
  const [pluralAnswered, setPluralAnswered] = useState({});

  // ─── Adjective state ───────────────────────────────────────────────────────
  // adjAnswered: { [i]: { guess: string, correct: bool } }
  const [adjAnswered, setAdjAnswered] = useState({});

  const completionFired = useRef(false);

  // Stable shuffled data — computed once on mount
  const words = React.useMemo(() => sh(GENDERDRILL.sort).slice(0, 12), []);
  const plurals = React.useMemo(() => GENDERDRILL.plurals.slice(0, 10), []);

  // Generate 3-option MC for each plural: correct + 2 random distractors
  const pluralOpts = React.useMemo(() => {
    const allP = GENDERDRILL.plurals.map(p => p.p);
    return plurals.map(p => {
      const wrong = sh(allP.filter(x => x !== p.p)).slice(0, 2);
      return sh([p.p, ...wrong]);
    });
  }, [plurals]);

  // ─── Completion tracking ───────────────────────────────────────────────────
  const sortDone = Object.keys(revealedGenders).length === words.length;
  const pluralDone = Object.keys(pluralAnswered).length === plurals.length;
  const adjDone = Object.keys(adjAnswered).length === GENDERDRILL.adjectives.length;
  const allDone = sortDone && pluralDone && adjDone;

  function handleFinish() {
    if (completionFired.current) return;
    completionFired.current = true;
    if (typeof award === 'function') award(15);
    if (setSt) { setSt(s => ({...s, gc: s.gc + 1})); writeDelta({gc:1}); }
    markQuest('grammar');
    goBack();
  }

  // ─── Gender label helpers ──────────────────────────────────────────────────
  const gLabel = { m: "♂ M", f: "♀ F", n: "⚧ N" };
  const gColor = { m: { bg: "#dbeafe", bc: "#1e40af", tc: "#1e40af" }, f: { bg: "#fce7f3", bc: "#db2777", tc: "#db2777" }, n: { bg: "#dcfce7", bc: "#16a34a", tc: "#16a34a" } };

  // Progress summary
  const sortScore = Object.values(revealedGenders).filter(v => v.correct).length;
  const pluralScore = Object.values(pluralAnswered).filter(v => v.correct).length;
  const adjScore = Object.values(adjAnswered).filter(v => v.correct).length;

  return (
    <div className="scr-wrap">
      {H("♂️♀️ Gender, Plurals & Adjectives", "Master noun genders and endings", goBack)}

      {/* ─── Progress bar ─────────────────────────────────────────────────── */}
      <div style={{display:"flex",gap:8,marginBottom:20,fontSize:12,color:"#78716c"}}>
        <span style={{background:sortDone?"#dcfce7":"#f1f5f9",padding:"3px 10px",borderRadius:20,fontWeight:600}}>Sort {Object.keys(revealedGenders).length}/{words.length}</span>
        <span style={{background:pluralDone?"#dcfce7":"#f1f5f9",padding:"3px 10px",borderRadius:20,fontWeight:600}}>Plural {Object.keys(pluralAnswered).length}/{plurals.length}</span>
        <span style={{background:adjDone?"#dcfce7":"#f1f5f9",padding:"3px 10px",borderRadius:20,fontWeight:600}}>Adjective {Object.keys(adjAnswered).length}/{GENDERDRILL.adjectives.length}</span>
      </div>

      {/* ─── SECTION 1: Sort by Gender ──────────────────────────────────────── */}
      <h3 className="sh">📦 Sort by Gender — tap a word to guess M / F / N</h3>

      {/* Gender selector — appears when a word is selected and not yet revealed */}
      {selectedGenderIdx !== null && !revealedGenders[selectedGenderIdx] && (
        <div className="c" style={{marginBottom:12,padding:"14px 16px",background:"#f0f9ff",borderLeft:"3px solid #0e7490"}}>
          <p style={{fontSize:14,fontWeight:600,marginBottom:10,color:"#164e63"}}>
            What gender is <strong style={{fontSize:16}}>{words[selectedGenderIdx].word}</strong>?
          </p>
          <div style={{display:"flex",gap:8}}>
            {['m','f','n'].map(g => (
              <button key={g}
                style={{flex:1,padding:"10px 0",border:"2px solid "+gColor[g].bc,borderRadius:10,background:"white",fontSize:14,fontWeight:700,color:gColor[g].tc,cursor:"pointer"}}
                onClick={() => {
                  const correct = g === words[selectedGenderIdx].g;
                  recordTopicResult('grammar', correct);
                  setRevealedGenders(prev => ({...prev, [selectedGenderIdx]: {guess:g, correct}}));
                  setSelectedGenderIdx(null);
                  if (correct) { if (typeof award === 'function') award(3); }
                }}>
                {gLabel[g]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:20}}>
        {words.map((w, i) => {
          const revealed = revealedGenders[i];
          const isSelected = selectedGenderIdx === i;
          let bg = "white", bc = "#d6d3d1", label = w.word;
          if (revealed) {
            const c = gColor[w.g];
            bg = revealed.correct ? c.bg : "#fee2e2";
            bc = revealed.correct ? c.bc : "#dc2626";
            label = w.word + " ("+gLabel[w.g]+")";
          } else if (isSelected) {
            bg = "#f0f9ff"; bc = "#0e7490";
          }
          return (
            <button key={i}
              style={{padding:"8px 14px",border:"2px solid "+bc,borderRadius:10,background:bg,fontSize:13,fontWeight:600,cursor:revealed?"default":"pointer",transition:"all .15s"}}
              onClick={() => {
                if (revealed) return;
                setSelectedGenderIdx(i === selectedGenderIdx ? null : i);
              }}>
              {revealed && (revealed.correct ? "✓ " : "✗ ")}{label}
            </button>
          );
        })}
      </div>

      {sortDone && (
        <p style={{fontSize:13,color:"#16a34a",fontWeight:600,marginBottom:16,textAlign:"center"}}>
          ✓ Sort done — {sortScore}/{words.length} correct!
        </p>
      )}

      {/* ─── SECTION 2: Make it Plural ──────────────────────────────────────── */}
      <h3 className="sh">📐 Make it Plural — choose the correct plural form</h3>
      {plurals.map((p, i) => {
        const answered = pluralAnswered[i];
        return (
          <div key={i} className="c" style={{marginBottom:8,padding:"12px 14px"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#164e63",marginBottom:8}}>
              {p.s} → ?
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",pointerEvents:answered?"none":"auto"}}>
              {pluralOpts[i].map((opt, oi) => {
                let bg = "white", bc = "#d6d3d1", color = "#1c1917";
                if (answered) {
                  if (opt === p.p) { bg = "#dcfce7"; bc = "#16a34a"; }
                  else if (opt === answered.guess && !answered.correct) { bg = "#fee2e2"; bc = "#dc2626"; }
                }
                return (
                  <button key={oi}
                    style={{padding:"6px 14px",border:"2px solid "+bc,borderRadius:10,background:bg,fontSize:13,fontWeight:600,color,cursor:"pointer"}}
                    onClick={() => {
                      if (answered) return;
                      const correct = opt === p.p;
                      recordTopicResult('grammar', correct);
                      setPluralAnswered(prev => ({...prev, [i]: {guess:opt, correct}}));
                      if (correct) { if (typeof award === 'function') award(4); speak(p.p); }
                    }}>
                    {answered && opt === p.p ? "✓ " : answered && opt === answered.guess && !answered.correct ? "✗ " : ""}{opt}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {pluralDone && (
        <p style={{fontSize:13,color:"#16a34a",fontWeight:600,marginBottom:16,textAlign:"center"}}>
          ✓ Plurals done — {pluralScore}/{plurals.length} correct!
        </p>
      )}

      {/* ─── SECTION 3: Pick the Right Adjective ────────────────────────────── */}
      <h3 className="sh" style={{marginTop:16}}>🎨 Pick the Right Adjective</h3>
      {GENDERDRILL.adjectives.map((a, i) => {
        const answered = adjAnswered[i];
        return (
          <div key={i} className="c" style={{marginBottom:8,padding:"10px 14px"}}>
            <div style={{fontSize:13,marginBottom:8}}>
              <span style={{fontWeight:700,color:"#164e63"}}>{a.noun}</span>
              {" = "}{a.en}{" → _____ "}{a.noun}
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",pointerEvents:answered?"none":"auto"}}>
              {a.opts.map((o, oi) => {
                let bg = "white", bc = "#d6d3d1";
                if (answered) {
                  if (o === a.adj) { bg = "#dcfce7"; bc = "#16a34a"; }
                  else if (o === answered.guess && !answered.correct) { bg = "#fee2e2"; bc = "#dc2626"; }
                }
                return (
                  <button key={oi}
                    style={{padding:"6px 14px",border:"2px solid "+bc,borderRadius:10,background:bg,fontSize:13,fontWeight:600,cursor:"pointer"}}
                    onClick={() => {
                      if (answered) return;
                      const correct = o === a.adj;
                      recordTopicResult('grammar', correct);
                      setAdjAnswered(prev => ({...prev, [i]: {guess:o, correct}}));
                      if (correct) { if (typeof award === 'function') award(3); speak(a.adj+" "+a.noun); }
                    }}>
                    {answered && o === a.adj ? "✓ " : answered && o === answered.guess && !answered.correct ? "✗ " : ""}{o}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {adjDone && (
        <p style={{fontSize:13,color:"#16a34a",fontWeight:600,marginBottom:8,textAlign:"center"}}>
          ✓ Adjectives done — {adjScore}/{GENDERDRILL.adjectives.length} correct!
        </p>
      )}

      {/* ─── Completion ─────────────────────────────────────────────────────── */}
      {allDone ? (
        <div style={{textAlign:"center",padding:"24px 16px",background:"#f0fdf4",borderRadius:12,margin:"16px 0",border:"1px solid #bbf7d0"}}>
          <div style={{fontSize:48}}>🎉</div>
          <p style={{fontWeight:700,fontSize:18,marginTop:8}}>All sections complete!</p>
          <p style={{color:"#4b5563",fontSize:13,marginTop:4}}>
            Sort {sortScore}/{words.length} · Plural {pluralScore}/{plurals.length} · Adjective {adjScore}/{GENDERDRILL.adjectives.length}
          </p>
          <button className="b bp" style={{marginTop:16}} onClick={handleFinish}>
            Finish & Save Progress →
          </button>
        </div>
      ) : (
        <button className="b" style={{width:"100%",marginTop:16,marginBottom:8,background:"#f1f5f9",color:"#64748b",border:"1px solid #e2e8f0"}} onClick={goBack}>
          ‹ Exit (progress not saved)
        </button>
      )}
    </div>
  );
}

export default GenderDrillScreen;
