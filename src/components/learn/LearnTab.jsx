import React, { useState } from 'react';
import { H, V, GRAM, LEARN_PATH } from '../../data.jsx';

function LevelBadge({ label, color, bg }) {
  return (
    <span style={{ fontSize:9,fontWeight:800,color,background:bg,borderRadius:6,padding:"2px 7px",
      letterSpacing:".05em",textTransform:"uppercase",flexShrink:0 }}>
      {label}
    </span>
  );
}

function Section({ title, icon, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display:'flex', alignItems:'center', gap:10, width:'100%',
          padding:'13px 16px', borderRadius:14,
          background:'var(--card)', border:'1px solid var(--card-b)',
          cursor:'pointer', fontFamily:"'Outfit',sans-serif",
          boxShadow:'0 1px 3px rgba(0,0,0,.06)',
          marginBottom: open ? 10 : 0,
        }}
      >
        <span style={{ fontSize:18 }}>{icon}</span>
        <span style={{ flex:1, fontSize:14, fontWeight:800, color:'var(--heading)', textAlign:'left' }}>{title}</span>
        {count != null && (
          <span style={{ fontSize:11, color:'var(--subtext)', fontWeight:600, background:'var(--bar-bg)', borderRadius:8, padding:'2px 8px' }}>
            {count}
          </span>
        )}
        <span style={{ fontSize:11, color:'var(--subtext)', opacity:.5, marginLeft:4 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div style={{ marginBottom:16 }}>{children}</div>}
    </div>
  );
}

const STAGE_COLORS = [
  { bg:'linear-gradient(135deg,#0e7490,#164e63)', light:'#f0f9ff', border:'#bae6fd' },
  { bg:'linear-gradient(135deg,#059669,#065f46)', light:'#f0fdf4', border:'#bbf7d0' },
  { bg:'linear-gradient(135deg,#d97706,#b45309)', light:'#fffbeb', border:'#fde68a' },
  { bg:'linear-gradient(135deg,#7c3aed,#6d28d9)', light:'#f5f3ff', border:'#ddd6fe' },
  { bg:'linear-gradient(135deg,#dc2626,#b91c1c)', light:'#fff1f2', border:'#fecaca' },
];

// Q-4: Removed dead state setters — target screens manage their own init state.
export default function LearnTab({
  allCats, icons, setScr, sCurEx, st,
  sh, sLt, sLi, sLx, sLs, sLp, sLa, sLsl,
  sGl, sGp, sGx, sGs, sGa, sGsl,
  launchPathItem,
}) {
  // ── PATH PROGRESS ──────────────────────────────────────────────────────
  let totalDone = 0, totalItems = 0;
  let nextItem = null, currentStage = null, currentStageDone = 0;
  for (const lv of LEARN_PATH) {
    let lvd = 0;
    for (const it of lv.items) {
      totalItems++;
      if (st && it.ck(st)) { totalDone++; lvd++; }
      else if (!nextItem) nextItem = { ...it, stageTitle: lv.title };
    }
    if (!currentStage && lvd < lv.items.length) { currentStage = lv; currentStageDone = lvd; }
  }
  if (!currentStage) currentStage = LEARN_PATH[LEARN_PATH.length - 1];
  const overallPct = totalItems > 0 ? Math.round(totalDone / totalItems * 100) : 0;
  const stagePct = currentStage ? Math.round(currentStageDone / currentStage.items.length * 100) : 100;
  const sc = STAGE_COLORS[((currentStage?.level || 1) - 1) % STAGE_COLORS.length];

  function launchVocab(t) {
    const items = sh(V[t] || []);
    if (!items.length) return;
    sLt(t); sLi(items); sLx(0); sLs(0); sLp("learn"); sLa(false); sLsl(-1);
    setScr("lesson"); sCurEx("vocab_" + t);
  }

  return (
    <React.Fragment>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--heading)' }}>🗺️ My Path</div>
        <button
          onClick={() => setScr('grammar-ref')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#0e7490,#164e63)',
            color: '#fff', fontSize: 12, fontWeight: 700,
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          📖 Grammar
        </button>
      </div>

      {/* ── PATH WIDGET ─────────────────────────────────────────────────── */}
      <div style={{
        borderRadius:20, overflow:'hidden', marginBottom:24,
        boxShadow:'0 4px 20px rgba(0,0,0,.10)', border:'1px solid var(--card-b)',
      }}>
        {/* Stage header */}
        <div style={{ background: sc.bg, padding:'18px 20px', color:'#fff' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
            <div>
              <div style={{ fontSize:10, opacity:.75, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em' }}>
                Stage {currentStage?.level} · {currentStage?.title}
              </div>
              <div style={{ fontSize:17, fontWeight:900, marginTop:3 }}>{currentStage?.desc}</div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontSize:24, fontWeight:900, lineHeight:1 }}>{overallPct}%</div>
              <div style={{ fontSize:10, opacity:.7, marginTop:2 }}>overall</div>
            </div>
          </div>
          <div style={{ background:'rgba(255,255,255,.25)', borderRadius:6, height:6, overflow:'hidden' }}>
            <div style={{ height:'100%', width:stagePct+'%', background:'#fff', borderRadius:6, transition:'width .5s ease' }} />
          </div>
          <div style={{ fontSize:10, opacity:.7, marginTop:5 }}>
            {currentStageDone} / {currentStage?.items.length} milestones this stage
          </div>
        </div>

        {/* Next Up */}
        <div style={{ background:'var(--card)', padding:'16px 20px' }}>
          {nextItem ? (
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{
                width:44, height:44, borderRadius:13, flexShrink:0,
                background:sc.light, border:`1px solid ${sc.border}`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:22,
              }}>🎯</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:10, color:'var(--subtext)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em' }}>Next Up</div>
                <div style={{ fontSize:14, fontWeight:800, color:'var(--heading)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {nextItem.name}
                </div>
              </div>
              <button
                onClick={() => launchPathItem(nextItem)}
                style={{
                  padding:'13px 18px', borderRadius:12, border:'none', flexShrink:0,
                  background:sc.bg, color:'#fff', fontSize:13, fontWeight:800,
                  cursor:'pointer', fontFamily:"'Outfit',sans-serif",
                  boxShadow:'0 3px 10px rgba(0,0,0,.15)',
                }}
              >Start →</button>
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'8px 0' }}>
              <div style={{ fontSize:32, marginBottom:6 }}>🏆</div>
              <div style={{ fontSize:15, fontWeight:900, color:'var(--heading)' }}>Path Complete!</div>
              <div style={{ fontSize:12, color:'var(--subtext)', marginTop:2 }}>Ste postali pravi Hrvat!</div>
            </div>
          )}
          <button
            onClick={() => setScr("learnpath")}
            style={{
              width:'100%', marginTop:12, padding:'13px', borderRadius:10,
              border:'1.5px solid var(--inp-b)', background:'none', cursor:'pointer',
              fontSize:12, fontWeight:700, color:'var(--subtext)', fontFamily:"'Outfit',sans-serif",
            }}
          >
            View full path — {totalDone}/{totalItems} milestones
          </button>
        </div>
      </div>

      {/* ── COLLAPSIBLE CATALOG ─────────────────────────────────────────── */}
      <div style={{ fontSize:11, fontWeight:800, color:'var(--subtext)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>
        Browse All Content
      </div>

      {/* Vocabulary */}
      <Section title="Vocabulary" icon="📚" count={`${allCats.length + 6} topics`} defaultOpen={false}>
        <p style={{ fontSize:12, color:"var(--subtext)", marginBottom:10, fontWeight:500 }}>
          {allCats.length} core categories · tap any to start
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
          {allCats.map(t => (
            <button key={t} className="tc" style={{ textAlign:"center", padding:"14px 8px" }} onClick={() => launchVocab(t)}>
              <div style={{ fontSize:24 }}>{icons[t] || "📚"}</div>
              <div style={{ fontSize:12, fontWeight:700, marginTop:4, textTransform:"capitalize" }}>{t}</div>
              <div style={{ fontSize:10, color:"var(--subtext)" }}>{V[t].length} words</div>
            </button>
          ))}
        </div>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--subtext)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Themes</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          {[
            ["🌍","Countries","countries"],["💼","Professions","professions"],
            ["🌤️","Weather","weather"],["👗","Clothing","clothes"],
            ["👤","Appearance","bodydesc"],["🔤","Pronunciation","phonology"],
          ].map(([icon,label,screen]) => (
            <button key={screen} className="tc" style={{ textAlign:"center", padding:"14px 8px" }} onClick={() => setScr(screen)}>
              <div style={{ fontSize:24 }}>{icon}</div>
              <div style={{ fontSize:11, fontWeight:700, marginTop:4 }}>{label}</div>
            </button>
          ))}
        </div>
      </Section>

      {/* Grammar */}
      <Section title="Grammar" icon="📝" count="14 lessons" defaultOpen={false}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <LevelBadge label="Foundation" color="#16a34a" bg="#f0fdf4" />
          <div style={{ flex:1, height:1, background:"#e2e8f0" }} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
          {[
            ["📜","Grammar Intro","a1",() => { sGl(GRAM.beginner[0]); sGp("learn"); sGx(0); sGs(0); sGa(false); sGsl(-1); setScr("grammar"); sCurEx("grammar"); }],
            ["🔄","Tenses & Gender","a1",() => { setScr("tenses"); sCurEx("tenses"); }],
            ["📝","Cases Intro","a2",() => { setScr("padezi"); sCurEx("padezi"); }],
            ["🎨","Colors & Gender","a2",() => { setScr("boje"); sCurEx("boje"); }],
          ].map((/** @type {any} */ [icon,label,cefr,fn]) => (
            <button key={label} className="tc" style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 14px", textAlign:"left" }} onClick={fn}>
              <div style={{ fontSize:22, flexShrink:0 }}>{icon}</div>
              <div style={{ fontSize:12, fontWeight:800, color:"var(--heading)", flex:1 }}>{label}</div>
              <span className={`cefr cefr-${cefr}`}>{cefr.toUpperCase()}</span>
            </button>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <LevelBadge label="Intermediate" color="#d97706" bg="#fffbeb" />
          <div style={{ flex:1, height:1, background:"#e2e8f0" }} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
          {[
            ["📚","Padeži Master","b1",() => { setScr("padezifull"); sCurEx("padezifull"); }],
            ["↔️","Verb Aspect","b1",() => { setScr("aspect"); }],
            ["🔀","Conjugation","b1",() => { setScr("conjdrill"); sCurEx("conjdrill"); }],
          ].map((/** @type {any} */ [icon,label,cefr,fn]) => (
            <button key={label} className="tc" style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 14px", textAlign:"left" }} onClick={fn}>
              <div style={{ fontSize:22, flexShrink:0 }}>{icon}</div>
              <div style={{ fontSize:12, fontWeight:800, color:"var(--heading)", flex:1 }}>{label}</div>
              <span className={`cefr cefr-${cefr}`}>{cefr.toUpperCase()}</span>
            </button>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <LevelBadge label="Advanced" color="#7c3aed" bg="#f5f3ff" />
          <div style={{ flex:1, height:1, background:"#e2e8f0" }} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[
            ["🔮","Modal Verbs","b1",() => { setScr("modal"); }],
            ["📝","Declension","b2",() => { setScr("declension"); }],
            ["🔀","Conditional","b1",() => setScr("conditional")],
            ["🤝","Vi ili ti?","b1",() => setScr("formalregister")],
            ["🔁","Impersonal","b2",() => setScr("impersonal")],
            ["💻","Tech & Digital","b2",() => setScr("techvoc")],
            ["🏛️","Admin Life","b2",() => setScr("bureaucratic")],
          ].map((/** @type {any} */ [icon,label,cefr,fn]) => (
            <button key={label} className="tc" style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 14px", textAlign:"left" }} onClick={fn}>
              <div style={{ fontSize:22, flexShrink:0 }}>{icon}</div>
              <div style={{ fontSize:12, fontWeight:800, color:"var(--heading)", flex:1 }}>{label}</div>
              <span className={`cefr cefr-${cefr}`}>{cefr.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Reading */}
      <Section title="Reading" icon="📖" count="11 passages" defaultOpen={false}>
        <button className="tc" style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"16px" }} onClick={() => setScr("readlist")}>
          <div style={{ width:44, height:44, borderRadius:13, background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", border:"1px solid #bbf7d0",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>📖</div>
          <div style={{ flex:1, textAlign:"left" }}>
            <div style={{ fontSize:14, fontWeight:800, color:"var(--heading)" }}>Reading Passages</div>
            <div style={{ fontSize:11, color:"var(--subtext)", marginTop:1 }}>11 stories · A1 to B2</div>
          </div>
          <div style={{ fontSize:20, color:"var(--subtext)", opacity:.35 }}>›</div>
        </button>
      </Section>

      {/* Reference */}
      <Section title="Quick Reference" icon="📌" count="12 guides" defaultOpen={false}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          {[
            ["🔤","Alphabet","alphabet"],["🧩","Word Patterns","wordform"],["🐣","Diminutives","diminutives"],
            ["🗺️","Dialects","dialects"],["⚠️","False Friends","falsefr"],["🎨","Color Quirks","colorquirk"],
            ["🪞","Svoj vs Moj","svojmoj"],["🔀","Conditional","conditional"],["🤝","Vi ili ti?","formalregister"],
            ["🔁","Impersonal","impersonal"],["💻","Tech & Digital","techvoc"],["🏛️","Admin Life","bureaucratic"],
          ].map(([icon,label,screen]) => (
            <button key={screen} className="tc" style={{ textAlign:"center", padding:"12px 8px" }} onClick={() => setScr(screen)}>
              <div style={{ fontSize:24 }}>{icon}</div>
              <div style={{ fontSize:11, fontWeight:700, marginTop:4 }}>{label}</div>
            </button>
          ))}
        </div>
      </Section>

    </React.Fragment>
  );
}
