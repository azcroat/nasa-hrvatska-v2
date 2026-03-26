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

  // CEFR level estimate from stats
  const cefrLevel = (() => {
    if (!st) return 'A1';
    const { xp = 0, lc = 0, gc = 0 } = st;
    if (xp >= 700 && lc >= 25 && gc >= 6) return 'B2';
    if (xp >= 300 && lc >= 15 && gc >= 4) return 'B1';
    if (xp >= 100 && lc >= 8 && gc >= 2) return 'A2';
    return 'A1';
  })();
  const cefrPct = { A1: 8, A2: 33, B1: 58, B2: 83 }[cefrLevel] || 8;

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
            {currentStageDone} / {currentStage?.items.length} lessons this stage
          </div>
        </div>

        {/* Next Up */}
        <div style={{ background:'var(--card)', padding:'16px 20px' }}>
          {nextItem ? (
            <div style={{ display:'flex', alignItems:'center', gap:14, position:'relative' }}>
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
              {(!st || st.lc === 0) && (
                <div style={{
                  position:'absolute', top:-8, right:60,
                  background:'#dc2626', color:'#fff',
                  fontSize:9, fontWeight:900, padding:'3px 8px',
                  borderRadius:10, letterSpacing:'.05em',
                  animation:'pulse 2s infinite',
                }}>
                  START HERE
                </div>
              )}
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
              <div style={{ fontSize:12, color:'var(--subtext)', marginTop:2 }}>Ti si pravi Hrvat! Bravo!</div>
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
            View full path — {totalDone}/{totalItems} lessons
          </button>
        </div>
      </div>

      {/* ── GOAL-BASED STAGE 1 FOCUS ────────────────────────────────── */}
      {(() => {
        const goal = localStorage.getItem('nh_goal');
        if (!goal || (currentStage && currentStage.level > 2)) return null;
        const GOAL_STAGE1 = {
          heritage: {
            label: 'Heritage & Roots Path',
            icon: '🇭🇷',
            color: '#92400e',
            bg: '#fffbeb',
            border: '#fde68a',
            tips: [
              'Start with Basic Greetings — the same words your grandparents use',
              'Then Family Words — mama, tata, baka, djed',
              'Then explore Croatian History in the Croatia tab',
            ],
            first: 'lp1',
          },
          family: {
            label: 'Speaking with Family Path',
            icon: '👨‍👩‍👧',
            color: '#0e7490',
            bg: '#f0f9ff',
            border: '#bae6fd',
            tips: [
              'Start with Basic Greetings — "Bog!", "Kako si?"',
              'Then Family Words — the vocabulary your family uses',
              'Then try Speaking practice to build confidence',
            ],
            first: 'lp1',
          },
          travel: {
            label: 'Travel to Croatia Path',
            icon: '✈️',
            color: '#16a34a',
            bg: '#f0fdf4',
            border: '#bbf7d0',
            tips: [
              'Start with Basic Greetings for daily interactions',
              'Then Get Around (Transport) — buses, taxis, directions',
              'Then Order Food — restaurants and cafés',
            ],
            first: 'lp5',
          },
          culture: {
            label: 'Croatian Culture Path',
            icon: '📖',
            color: '#7c3aed',
            bg: '#faf5ff',
            border: '#ddd6fe',
            tips: [
              'Start with Basic Greetings and Numbers',
              'Then explore the Croatia tab — music, history, cities',
              'Then Texting & Slang — how Croatians actually talk',
            ],
            first: 'lp1',
          },
          fluent: {
            label: 'Fluency Track',
            icon: '🗣️',
            color: '#0369a1',
            bg: '#f0f9ff',
            border: '#bae6fd',
            tips: [
              'Follow the full Learn Path in order — every stage matters',
              'Prioritize Grammar alongside vocabulary from day one',
              'Use Dialogue Sim and Speaking Practice every session',
            ],
            first: 'lp1',
          },
        };
        const gf = GOAL_STAGE1[goal];
        if (!gf) return null;
        return (
          <div style={{
            background: gf.bg,
            border: `1.5px solid ${gf.border}`,
            borderRadius: 16, padding: '16px 18px', marginBottom: 20,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <span style={{ fontSize:20 }}>{gf.icon}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:900, color: gf.color }}>{gf.label}</div>
                <div style={{ fontSize:11, color:'#94a3b8', marginTop:1, fontWeight:500 }}>Personalized for your goal</div>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {gf.tips.map((tip, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                  <span style={{ fontSize:13, fontWeight:900, color: gf.color, flexShrink:0, marginTop:1 }}>{i+1}.</span>
                  <span style={{ fontSize:12, color:'#374151', fontWeight:500, lineHeight:1.5 }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── 5-STAGE JOURNEY STRIP ───────────────────────────────────────── */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:10, fontWeight:800, color:'var(--subtext)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>
          Your Journey
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:0 }}>
          {LEARN_PATH.map((lv, i) => {
            const lvDone = lv.items.filter(it => st && it.ck(st)).length;
            const isComplete = lvDone === lv.items.length;
            const isCurrent = lv === currentStage;
            const color = STAGE_COLORS[i % STAGE_COLORS.length];
            return (
              <React.Fragment key={lv.level}>
                <div style={{ flex:1, textAlign:'center' }}>
                  <div style={{
                    width:32, height:32, borderRadius:'50%', margin:'0 auto 4px',
                    background: isComplete ? color.bg : isCurrent ? color.bg : 'var(--bar-bg)',
                    border: isCurrent ? '2.5px solid var(--heading)' : isComplete ? 'none' : '2px solid var(--card-b)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:13, color: isComplete || isCurrent ? '#fff' : 'var(--subtext)',
                    fontWeight:900, boxShadow: isCurrent ? '0 0 0 3px rgba(14,116,144,.2)' : 'none',
                    transition:'all .3s',
                  }}>
                    {isComplete ? '✓' : lv.level}
                  </div>
                  <div style={{ fontSize:9, fontWeight:800, color: isCurrent ? 'var(--heading)' : isComplete ? '#16a34a' : 'var(--subtext)', letterSpacing:'.03em', lineHeight:1.2 }}>
                    {lv.title}
                  </div>
                </div>
                {i < LEARN_PATH.length - 1 && (
                  <div style={{
                    width:18, height:2, flexShrink:0, marginBottom:16,
                    background: lvDone === lv.items.length ? '#16a34a' : 'var(--card-b)',
                    borderRadius:2,
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── CEFR FLUENCY TRACK ──────────────────────────────────────────── */}
      <div style={{
        background:'var(--card)', border:'1px solid var(--card-b)',
        borderRadius:14, padding:'14px 16px', marginBottom:20,
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontSize:12, fontWeight:800, color:'var(--heading)' }}>🎓 CEFR Level</div>
          <span style={{
            fontSize:11, fontWeight:900, color:'#fff',
            background: cefrLevel === 'B2' ? '#16a34a' : cefrLevel === 'B1' ? '#0e7490' : cefrLevel === 'A2' ? '#d97706' : '#94a3b8',
            borderRadius:8, padding:'2px 9px',
          }}>{cefrLevel}</span>
        </div>
        <div style={{ position:'relative', height:8, background:'var(--bar-bg)', borderRadius:6, overflow:'visible', marginBottom:6 }}>
          <div style={{
            height:'100%', borderRadius:6,
            width: cefrPct + '%',
            background: 'linear-gradient(90deg,#94a3b8,#0e7490,#059669)',
            transition:'width .8s ease',
          }} />
          {/* Level markers */}
          {[{ pct:25, label:'A2' },{ pct:50, label:'B1' },{ pct:75, label:'B2' }].map(m => (
            <div key={m.label} style={{
              position:'absolute', top:'50%', left:m.pct+'%', transform:'translate(-50%,-50%)',
              width:3, height:12, background:'var(--card)', borderRadius:2,
            }} />
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          {['A1','A2','B1','B2','C1'].map(l => (
            <div key={l} style={{ fontSize:9, fontWeight:700, color: cefrLevel === l ? 'var(--heading)' : 'var(--subtext)', opacity: cefrLevel === l ? 1 : 0.5 }}>{l}</div>
          ))}
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
              <div style={{ fontSize:10, color:"var(--subtext)", marginTop:2 }}>{V[t].length} words</div>
              <div style={{ fontSize:9, color:"var(--subtext)", marginTop:3, opacity:.7, lineHeight:1.3 }}>
                {(V[t]||[]).slice(0,2).map(w=>w[0]).join(' · ')}
              </div>
              {(() => {
                const count = V[t].length;
                const [badge, color, bg] = count < 15 ? ['Essential','#16a34a','#f0fdf4'] : count < 25 ? ['Core','#0e7490','#f0f9ff'] : ['Extended','#7c3aed','#faf5ff'];
                return <span style={{fontSize:8,fontWeight:800,color,background:bg,borderRadius:6,padding:'2px 5px',marginTop:3,letterSpacing:'.04em'}}>{badge}</span>;
              })()}
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
