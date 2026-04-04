import React, { useState, useRef } from 'react';
import { H, Bar, speak, sh, TENSES } from '../../data.jsx';
import { rnd } from '../../lib/random.js';
import { markQuest } from '../../lib/quests.js';
import { useStats } from '../../context/StatsContext.tsx';

export default function TensesScreen({ goBack, award }) {
  const { stats, setStats, writeDelta } = useStats();
  const finishFired = useRef(false);
  const [tnMode, setTnMode] = useState("learn");
  const [tnGender, setTnGender] = useState("m");
  const [tnTense, setTnTense] = useState("present");
  const [tnVerb, setTnVerb] = useState(0);
  const [tnQ, setTnQ] = useState([]);
  const [tnI, setTnI] = useState(0);
  const [tnS, setTnS] = useState(0);
  const [tnA, setTnA] = useState(false);
  const [tnSl, setTnSl] = useState(-1);
  const [tnO, setTnO] = useState([]);

  function buildQuiz() {
    const qs = [];
    TENSES.verbs.forEach((v, vi) => {
      ["present","past","future"].forEach(t => {
        const pidx = Math.floor(rnd() * 6);
        const gnd = rnd() > 0.5 ? "m" : "f";
        const forms = t === "present" ? v.present : t === "past" ? (gnd === "m" ? v.pastM : v.pastF) : (gnd === "m" ? v.futureM : v.futureF);
        const correct = forms[pidx];
        const person = TENSES.persons[pidx];
        const wrongForms = TENSES.verbs.filter((_, i) => i !== vi).map(wv => {
          const wf = t === "present" ? wv.present : t === "past" ? (gnd === "m" ? wv.pastM : wv.pastF) : (gnd === "m" ? wv.futureM : wv.futureF);
          return wf[pidx];
        });
        const wrongs = sh(wrongForms).slice(0, 3);
        qs.push({ verb: v.inf, en: v.en, tense: t, person, personEn: TENSES.personsEn[pidx], gender: gnd, answer: correct, opts: sh([correct].concat(wrongs)) });
      });
    });
    const picked = sh(qs).slice(0, 15);
    setTnQ(picked); setTnI(0); setTnS(0); setTnA(false); setTnSl(-1); setTnO(picked[0].opts);
  }

  return (
    <div className="scr-wrap">
      
      {H("🔄 Tenses & Gender","Past / Present / Future — How men & women speak differently", goBack)}
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {["learn","rules","quiz"].map(m => (
          <button
            key={m}
            className={"b " + (tnMode === m ? "bp" : "bg")}
            style={{fontSize:13,padding:"8px 16px"}}
            onClick={() => { setTnMode(m); if (m === "quiz") buildQuiz(); }}>
            {m === "learn" ? "📖 Learn" : m === "rules" ? "📌 Rules" : "🏆 Quiz"}
          </button>
        ))}
      </div>

      {tnMode === "learn" && (
        <React.Fragment>
          <div style={{display:"flex",gap:8,marginBottom:12,justifyContent:"center"}}>
            <button
              style={{padding:"8px 20px",borderRadius:12,border:"2px solid " + (tnGender === "m" ? "#0e7490" : "#e7e5e4"),background:tnGender === "m" ? "rgba(14,116,144,.08)" : "white",fontWeight:700,fontSize:14,cursor:"pointer",color:tnGender === "m" ? "#0e7490" : "#78716c"}}
              onClick={() => setTnGender("m")}>
              👨 Muško (Male)
            </button>
            <button
              style={{padding:"8px 20px",borderRadius:12,border:"2px solid " + (tnGender === "f" ? "#dc2626" : "#e7e5e4"),background:tnGender === "f" ? "rgba(220,38,38,.06)" : "white",fontWeight:700,fontSize:14,cursor:"pointer",color:tnGender === "f" ? "#dc2626" : "#78716c"}}
              onClick={() => setTnGender("f")}>
              👩 Žensko (Female)
            </button>
          </div>
          <div style={{display:"flex",gap:6,marginBottom:16,justifyContent:"center"}}>
            {["present","past","future"].map(t => (
              <button key={t} className={"b " + (tnTense === t ? "bw" : "bg")} style={{fontSize:13,padding:"6px 16px"}} onClick={() => setTnTense(t)}>
                {t === "present" ? "Sadašnjost" : t === "past" ? "Prošlost" : "Budućnost"}
              </button>
            ))}
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16,justifyContent:"center"}}>
            {TENSES.verbs.map((v, i) => (
              <button
                key={i}
                style={{padding:"6px 12px",borderRadius:10,border:"2px solid " + (tnVerb === i ? "#164e63" : "#e7e5e4"),background:tnVerb === i ? "#164e63" : "white",color:tnVerb === i ? "white" : "#44403c",fontWeight:600,fontSize:12,cursor:"pointer"}}
                onClick={() => setTnVerb(i)}>
                {v.inf}
              </button>
            ))}
          </div>
          {(() => {
            const v = TENSES.verbs[tnVerb];
            const forms = tnTense === "present" ? v.present : tnTense === "past" ? (tnGender === "m" ? v.pastM : v.pastF) : (tnGender === "m" ? v.futureM : v.futureF);
            const tenseLabel = tnTense === "present" ? "Sadašnjost (Present)" : tnTense === "past" ? "Prošlost (Past)" : "Budućnost (Future)";
            return (
              <React.Fragment>
                <div className="c" style={{marginBottom:12,borderLeft:"4px solid " + (tnGender === "m" ? "#0e7490" : "#dc2626"),padding:0,overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",background:tnGender === "m" ? "linear-gradient(135deg,#0e7490,#164e63)" : "linear-gradient(135deg,#dc2626,#9f1239)",color:"#fff"}}>
                    <div style={{fontSize:18,fontWeight:800}}>{v.inf} — {v.en}</div>
                    <div style={{fontSize:13,opacity:.85,marginTop:2}}>{tenseLabel} • {tnGender === "m" ? "Speaking as male" : "Speaking as female"}</div>
                  </div>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <tbody>
                      {forms.map((f, fi) => {
                        const isSpeaker = fi === 0 || fi === 1 || fi === 4 || fi === 5;
                        return (
                          <tr key={fi} role="button" tabIndex={0} aria-label={`Play audio for ${TENSES.persons[fi]} ${f}`} style={{borderBottom:"1px solid #f3f4f6",cursor:"pointer",background:isSpeaker ? "rgba(14,116,144,.03)" : "white"}} onClick={() => speak(TENSES.persons[fi] + " " + f)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();speak(TENSES.persons[fi]+" "+f);}}}>
                            <td style={{padding:"10px 14px",fontWeight:700,color:"#7c3aed",width:"20%",fontSize:14}}>{TENSES.persons[fi]}</td>
                            <td style={{padding:"10px 14px",fontWeight:700,fontSize:15,color:fi <= 1 || fi === 4 || fi === 5 ? (tnGender === "m" ? "#0e7490" : "#dc2626") : "#44403c"}}>
                              {f} <span aria-hidden="true">🔊</span>
                            </td>
                            <td style={{padding:"10px 14px",fontSize:11,color:"#a8a29e"}}>{TENSES.personsEn[fi]}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {v.note && <div className="c" style={{borderLeft:"4px solid #f59e0b",background:"#fffbeb",marginTop:8}}><div style={{fontSize:13,color:"#92400e"}}>💡 {v.note}</div></div>}
                {tnTense === "past" && (
                  <div className="c" style={{marginTop:12,background:"linear-gradient(135deg,#f5f3ff,#ede9fe)",borderLeft:"4px solid #7c3aed"}}>
                    <div style={{fontSize:13,fontWeight:800,color:"#7c3aed",marginBottom:8}}>♂️ vs ♀️ Gender Comparison (ja + {v.inf})</div>
                    <div style={{display:"flex",gap:16}}>
                      <div role="button" tabIndex={0} aria-label={`Play audio for Ja ${v.pastM[0]}`} style={{flex:1,cursor:"pointer"}} onClick={() => speak("ja " + v.pastM[0])} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();speak("ja "+v.pastM[0]);}}}>
                        <div style={{fontSize:12,fontWeight:700,color:"#0e7490"}}>👨 Male:</div>
                        <div style={{fontSize:16,fontWeight:800}}>Ja {v.pastM[0]} <span aria-hidden="true">🔊</span></div>
                      </div>
                      <div role="button" tabIndex={0} aria-label={`Play audio for Ja ${v.pastF[0]}`} style={{flex:1,cursor:"pointer"}} onClick={() => speak("ja " + v.pastF[0])} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();speak("ja "+v.pastF[0]);}}}>
                        <div style={{fontSize:12,fontWeight:700,color:"#dc2626"}}>👩 Female:</div>
                        <div style={{fontSize:16,fontWeight:800}}>Ja {v.pastF[0]} <span aria-hidden="true">🔊</span></div>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })()}
        </React.Fragment>
      )}

      {tnMode === "rules" && (
        <React.Fragment>
          <div className="c" style={{marginBottom:16,borderLeft:"4px solid #dc2626",background:"#fef2f2"}}>
            <div style={{fontSize:15,fontWeight:800,color:"#dc2626"}}>Why Gender Matters</div>
            <div style={{fontSize:14,marginTop:6,lineHeight:1.7}}>
              In Croatian, the PAST TENSE changes based on the speaker's gender. If you are a man, you say 'Išao sam' (I went). If you are a woman, you say 'Išla sam.' This is one of the FIRST things Croatians notice about your Croatian. Getting it right marks you as a serious learner.
            </div>
          </div>
          {TENSES.genderRules.map((r, i) => (
            <div key={i} className="c" style={{marginBottom:10}}>
              <div style={{fontSize:14,fontWeight:800,color:"#164e63"}}>{r.rule}</div>
              <div style={{fontSize:13,color:"#44403c",marginTop:4,lineHeight:1.6}}>{r.desc}</div>
            </div>
          ))}
        </React.Fragment>
      )}

      {tnMode === "quiz" && (() => {
        if (!tnQ.length) return null;
        const total = tnQ.length;
        if (tnI >= total) {
          const pct = Math.round((tnS / total) * 100);
          return (
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:64}}>{pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "📚"}</div>
              <h2 style={{fontFamily:"'Playfair Display',serif",color:"#164e63"}}>Tense Quiz Complete!</h2>
              <div style={{fontSize:32,fontWeight:800,color:"#0e7490"}}>{tnS} / {total}</div>
              <button className="b bp" style={{marginTop:16}} onClick={() => { if(finishFired.current)return; finishFired.current=true; markQuest('grammar'); if (typeof award === 'function') award(tnS * 5); if (!stats.vs?.includes('tenses')) { setStats(prev => { if (prev.vs?.includes('tenses')) return prev; return { ...prev, gc: (prev.gc || 0) + 1, vs: [...(prev.vs || []), 'tenses'] }; }); if (writeDelta) writeDelta({ gc: 1, vs: ['tenses'] }); } goBack(); }}>🏠 Finish</button>
            </div>
          );
        }
        const q = tnQ[tnI];
        return (
          <React.Fragment>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:14,fontWeight:700}}>{tnI + 1} / {total}</span>
              <span style={{fontSize:14,fontWeight:700,color:"#0e7490"}}>Score: {tnS}</span>
            </div>
            <Bar v={tnI + 1} mx={total} />
            <div className="c" style={{marginTop:16}}>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <span style={{padding:"3px 10px",background:q.tense === "present" ? "#dbeafe" : q.tense === "past" ? "#fef3c7" : "#dcfce7",borderRadius:10,fontSize:12,fontWeight:700}}>{q.tense}</span>
                <span style={{padding:"3px 10px",background:q.gender === "m" ? "rgba(14,116,144,.1)" : "rgba(220,38,38,.08)",borderRadius:10,fontSize:12,fontWeight:700,color:q.gender === "m" ? "#0e7490" : "#dc2626"}}>
                  {q.gender === "m" ? "👨 Male" : "👩 Female"}
                </span>
              </div>
              <div style={{fontSize:13,color:"#78716c"}}>Conjugate: <b>{q.verb}</b> ({q.en})</div>
              <div style={{fontSize:20,fontWeight:800,color:"#164e63",marginTop:8}}>{q.person} + {q.verb} = ?</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:16}}>
              {tnO.map((o, oi) => (
                <button
                  key={oi}
                  className="ob"
                  style={{background:tnA ? (o === q.answer ? "#dcfce7" : tnSl === oi ? "#fee2e2" : "white") : "white",borderColor:tnA ? (o === q.answer ? "#16a34a" : tnSl === oi ? "#dc2626" : "rgba(14,116,144,.12)") : "rgba(14,116,144,.12)"}}
                  onClick={() => { if (!tnA) { setTnSl(oi); setTnA(true); if (o === q.answer) setTnS(tnS + 1); } }}>
                  {o}
                </button>
              ))}
            </div>
            {tnA && (
              <button
                className="b bp"
                style={{width:"100%",marginTop:16}}
                onClick={() => {
                  if (tnI < total - 1) { const n = tnQ[tnI + 1]; setTnO(n.opts); setTnI(tnI + 1); setTnA(false); setTnSl(-1); }
                  else setTnI(total);
                }}>
                {tnI < total - 1 ? "Next →" : "See Results"}
              </button>
            )}
          </React.Fragment>
        );
      })()}
    </div>
  );
}
