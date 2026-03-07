import React, { useState } from 'react';
import { H, Bar, Spk, speak, sh, MODAL } from '../../data.jsx';

export default function ModalScreen({ goBack, award, setSt }) {
  const [m7, sM7] = useState("menu");
  const [m7v, sM7v] = useState(0);
  const [m7q, sM7q] = useState([]);
  const [m7i, sM7i] = useState(0);
  const [m7s, sM7s] = useState(0);
  const [m7a, sM7a] = useState(false);
  const [m7sl, sM7sl] = useState(-1);
  const [m7o, sM7o] = useState([]);

  function resetMode(mode) {
    sM7(mode); sM7i(0); sM7s(0); sM7a(false); sM7sl(-1); sM7o([]); sM7q([]); sM7v(0);
  }

  return (
    <div style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      
      {H("🔮 Modalni Glagoli","Modal Verbs — željeti · htjeti · morati · trebati · moći · smjeti")}
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:20}}>
        {["menu","learn","fill","quiz"].map(m => (
          <button
            key={m}
            className={"b " + (m7 === m ? "bv" : "bg")}
            style={{fontSize:12,padding:"6px 12px"}}
            onClick={() => resetMode(m)}>
            {m === "menu" ? "📋 Menu" : m === "learn" ? "📖 Learn" : m === "fill" ? "✏️ Fill Blanks" : "🏆 Quiz"}
          </button>
        ))}
      </div>

      {m7 === "menu" && (
        <React.Fragment>
          <div className="c" style={{marginBottom:20,borderLeft:"4px solid #7c3aed",background:"linear-gradient(135deg,#f5f3ff,#ede9fe)"}}>
            <div style={{fontSize:16,fontWeight:800,color:"#5b21b6",marginBottom:8}}>🔮 What are Modal Verbs?</div>
            <div style={{fontSize:14,lineHeight:1.7}}>
              Modal verbs express ability, obligation, permission, need, and desire. They combine with infinitives:{" "}
              <b style={{color:"#7c3aed"}}>Mogu čitati</b> (I can read),{" "}
              <b style={{color:"#7c3aed"}}>Moram ići</b> (I must go).
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            {MODAL.verbs.map((v, i) => (
              <div
                key={i}
                className="tc"
                style={{textAlign:"center",padding:"14px 8px"}}
                onClick={() => { sM7v(i); sM7("learn"); }}>
                <div style={{fontSize:28}}>{v.icon}</div>
                <div style={{fontSize:14,fontWeight:800,color:"#5b21b6"}}>{v.inf}</div>
                <div style={{fontSize:11,color:"#78716c"}}>{v.en}</div>
              </div>
            ))}
          </div>
        </React.Fragment>
      )}

      {m7 === "learn" && (() => {
        const v = MODAL.verbs[m7v];
        return (
          <React.Fragment>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
              {MODAL.verbs.map((mv, mi) => (
                <button
                  key={mi}
                  className={"b " + (m7v === mi ? "bv" : "bg")}
                  style={{fontSize:11,padding:"8px 14px"}}
                  onClick={() => sM7v(mi)}>
                  {mv.icon} {mv.inf}
                </button>
              ))}
            </div>
            <div className="c" style={{marginBottom:16,borderLeft:"4px solid #7c3aed"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                <div style={{fontSize:40}}>{v.icon}</div>
                <div>
                  <div style={{fontSize:24,fontWeight:800,color:"#5b21b6",fontFamily:"'Playfair Display',serif"}}>{v.inf}</div>
                  <div style={{fontSize:15,color:"#78716c"}}>{v.en}</div>
                </div>
                <Spk text={v.inf} />
              </div>
            </div>
            <div className="c" style={{marginBottom:16,padding:0,overflow:"hidden"}}>
              <div style={{padding:"12px 16px",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",fontWeight:700,fontSize:14}}>Conjugation</div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
                <tbody>
                  {MODAL.persons.map((p, pi) => (
                    <tr key={pi} style={{borderBottom:"1px solid #f3f4f6",cursor:"pointer"}} onClick={() => speak(v.forms[pi])}>
                      <td style={{padding:"10px 12px",fontWeight:600,color:"#78716c",width:"30%"}}>{p}</td>
                      <td style={{padding:"10px 12px",fontWeight:700,color:"#16a34a"}}>✅ {v.forms[pi]}</td>
                      <td style={{padding:"10px 12px",fontWeight:700,color:"#dc2626"}}>❌ {v.neg[pi]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="c" style={{marginBottom:16,borderLeft:"4px solid #f59e0b",background:"#fffbeb"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#b45309",marginBottom:4}}>💡 TIP</div>
              <div style={{fontSize:13,color:"#92400e"}}>{v.tip}</div>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              {m7v > 0 && <button className="b bg" onClick={() => sM7v(i => i - 1)}>← Prev</button>}
              {m7v < 5 && <button className="b bv" onClick={() => sM7v(i => i + 1)}>Next →</button>}
              {m7v === 5 && (
                <button
                  className="b bv"
                  onClick={() => { sM7("fill"); sM7i(0); sM7s(0); sM7a(false); sM7sl(-1); sM7q([]); sM7o([]); }}>
                  Practice Fill Blanks →
                </button>
              )}
            </div>
          </React.Fragment>
        );
      })()}

      {m7 === "fill" && (() => {
        if (m7q.length === 0) {
          const q = sh(MODAL.fillBlanks).slice(0, 10);
          setTimeout(() => { sM7q(q); sM7o(sh([q[0].a, ...q[0].al])); }, 0);
          return <div style={{textAlign:"center",padding:40}}>Loading...</div>;
        }
        const total = m7q.length;
        if (m7i >= total) {
          const pct = Math.round((m7s / total) * 100);
          return (
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:64}}>{pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "📚"}</div>
              <h2 style={{fontFamily:"'Playfair Display',serif",color:"#164e63"}}>Fill Blanks Complete!</h2>
              <div style={{fontSize:32,fontWeight:800,color:"#7c3aed"}}>{m7s} / {total}</div>
              <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:16}}>
                <button className="b bg" onClick={() => { sM7q([]); sM7i(0); sM7s(0); sM7a(false); sM7sl(-1); }}>🔄 Retry</button>
                <button className="b bv" onClick={() => { sM7("quiz"); sM7q([]); sM7i(0); sM7s(0); sM7a(false); sM7sl(-1); sM7o([]); }}>Master Quiz →</button>
              </div>
            </div>
          );
        }
        const q = m7q[m7i];
        const ci = m7o.indexOf(q.a);
        const pts = q.q.split("_____");
        return (
          <React.Fragment>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:700}}>{m7i + 1} / {total}</div>
              <div style={{fontSize:14,fontWeight:700,color:"#7c3aed"}}>Score: {m7s}</div>
            </div>
            <Bar v={m7i + 1} mx={total} color="#7c3aed" h={6} />
            <div className="c" style={{marginTop:16}}>
              <div style={{fontSize:11,color:"#7c3aed",fontWeight:700,marginBottom:6}}>Verb: {q.v}</div>
              <div style={{fontSize:17,lineHeight:1.8}}>
                {pts[0]}
                <span style={{borderBottom:"3px solid #7c3aed",fontWeight:800,color:"#7c3aed",padding:"0 4px"}}>{m7a ? q.a : "___"}</span>
                {pts[1] || ""}
              </div>
              <div style={{fontSize:13,color:"#78716c",fontStyle:"italic",marginTop:8}}>{q.en}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:16}}>
              {m7o.map((o, oi) => (
                <button
                  key={oi}
                  className={"ob " + (m7a ? (oi === ci ? "ok" : m7sl === oi ? "no" : "") : "")}
                  onClick={() => { if (!m7a) { sM7sl(oi); sM7a(true); if (oi === ci) { sM7s(s => s + 1); award(5); } } }}>
                  {o}
                </button>
              ))}
            </div>
            {m7a && (
              <button
                className="b bv"
                style={{width:"100%",marginTop:16}}
                onClick={() => {
                  if (m7i < total - 1) { const n = m7q[m7i + 1]; sM7o(sh([n.a, ...n.al])); sM7i(i => i + 1); sM7a(false); sM7sl(-1); }
                  else { award(m7s * 3); sM7i(total); }
                }}>
                {m7i < total - 1 ? "Next →" : "See Results"}
              </button>
            )}
          </React.Fragment>
        );
      })()}

      {m7 === "quiz" && (() => {
        if (m7q.length === 0) {
          const q = sh(MODAL.masterQuiz).slice(0, 10);
          setTimeout(() => { sM7q(q); sM7o(sh([q[0].a, ...q[0].al])); }, 0);
          return <div style={{textAlign:"center",padding:40}}>Loading...</div>;
        }
        const total = m7q.length;
        if (m7i >= total) {
          const pct = Math.round((m7s / total) * 100);
          return (
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:64}}>{pct >= 80 ? "🌟" : "👍"}</div>
              <h2 style={{fontFamily:"'Playfair Display',serif",color:"#164e63"}}>{pct >= 80 ? "Modal Master!" : "Keep Practicing!"}</h2>
              <div style={{fontSize:32,fontWeight:800,color:"#7c3aed"}}>{m7s} / {total}</div>
              {pct >= 70 && <div style={{padding:12,background:"#dcfce7",borderRadius:12,marginTop:12,fontSize:14,color:"#16a34a",fontWeight:700}}>🏅 Modal Verbs Badge Earned!</div>}
              <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:16}}>
                <button className="b bg" onClick={() => { sM7q([]); sM7i(0); sM7s(0); sM7a(false); sM7sl(-1); }}>🔄 Retry</button>
                <button className="b bv" onClick={() => { setSt(s => ({...s, mv: s.mv + 1, gc: s.gc + 1})); award(m7s * 3 + 20); goBack(); }}>🏠 Finish!</button>
              </div>
            </div>
          );
        }
        const q = m7q[m7i];
        const ci = m7o.indexOf(q.a);
        return (
          <React.Fragment>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:700}}>🏆 {m7i + 1}/{total}</div>
              <div style={{fontSize:14,fontWeight:700,color:"#7c3aed"}}>Score: {m7s}</div>
            </div>
            <Bar v={m7i + 1} mx={total} color="#7c3aed" h={6} />
            <div className="c" style={{marginTop:16}}>
              <p style={{fontSize:18,fontWeight:700,marginBottom:20}}>{q.q}</p>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:12}}>
              {m7o.map((o, oi) => (
                <button
                  key={oi}
                  className={"ob " + (m7a ? (oi === ci ? "ok" : m7sl === oi ? "no" : "") : "")}
                  onClick={() => { if (!m7a) { sM7sl(oi); sM7a(true); if (oi === ci) { sM7s(s => s + 1); award(5); } } }}>
                  {o}
                </button>
              ))}
            </div>
            {m7a && (
              <button
                className="b bv"
                style={{width:"100%",marginTop:16}}
                onClick={() => {
                  if (m7i < total - 1) { const n = m7q[m7i + 1]; sM7o(sh([n.a, ...n.al])); sM7i(i => i + 1); sM7a(false); sM7sl(-1); }
                  else sM7i(total);
                }}>
                {m7i < total - 1 ? "Next →" : "Results"}
              </button>
            )}
          </React.Fragment>
        );
      })()}
    </div>
  );
}
