import React, { useState } from 'react';
import { H, V, GRAM, LEARN_PATH } from '../../data.jsx';
import CroatianKnight from '../shared/CroatianKnight';
import { useApp } from '../../context/AppContext.jsx';

function LevelBadge({ label, color, bg }) {
  return (
    <span style={{ fontSize:'var(--text-xs)',fontWeight:800,color,background:bg,borderRadius:6,padding:"2px 7px",
      letterSpacing:".05em",textTransform:"uppercase",flexShrink:0 }}>
      {label}
    </span>
  );
}

function Section({ title, icon, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const sectionId = `section-content-${title.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={sectionId}
        style={{
          display:'flex', alignItems:'center', gap:10, width:'100%',
          padding:'13px 16px', borderRadius:14,
          background:'var(--card)', border:'1px solid var(--card-b)',
          cursor:'pointer', fontFamily:"'Outfit',sans-serif",
          boxShadow:'0 1px 3px rgba(0,0,0,.06)',
          marginBottom: open ? 10 : 0,
        }}
      >
        <span style={{ fontSize:'var(--text-xl)' }}>{icon}</span>
        <span style={{ flex:1, fontSize:'var(--text-base)', fontWeight:800, color:'var(--heading)', textAlign:'left' }}>{title}</span>
        {count != null && (
          <span style={{ fontSize:'var(--text-sm)', color:'var(--subtext)', fontWeight:600, background:'var(--bar-bg)', borderRadius:8, padding:'2px 8px' }}>
            {count}
          </span>
        )}
        <span style={{ fontSize:'var(--text-sm)', color:'var(--subtext)', opacity:.5, marginLeft:4 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div id={sectionId} style={{ marginBottom:16 }}>{children}</div>}
    </div>
  );
}

const LESSON_TIPS = {
  'greetings': { title: 'Greetings in Croatian', tip: 'Croatian has formal (Vi) and informal (ti) forms. Use "Vi" with strangers and elders, "ti" with friends and children.' },
  'numbers': { title: 'Croatian Numbers', tip: 'Numbers 1-4 require noun case agreement. 1 uses nominative, 2-4 use genitive singular, 5+ use genitive plural.' },
  'nouns': { title: 'Croatian Noun Gender', tip: 'Croatian nouns have 3 genders: masculine, feminine, neuter. Masculine usually ends in consonant, feminine in -a, neuter in -o/-e.' },
  'verbs': { title: 'Croatian Verb Conjugation', tip: 'Croatian verbs conjugate for person (1st/2nd/3rd) and number (singular/plural). Infinitives end in -ti or -ći.' },
  'adjectives': { title: 'Croatian Adjectives', tip: 'Adjectives agree with nouns in gender, number, and case. They usually come before the noun they modify.' },
  'cases': { title: 'Croatian Cases', tip: 'Croatian has 7 grammatical cases. The nominative is for subjects, accusative for direct objects, dative for indirect objects.' },
  'family': { title: 'Family Vocabulary', tip: 'Croatian family terms often differ by gender. Otac (father), majka (mother), brat (brother), sestra (sister).' },
  'food': { title: 'Food & Dining', tip: 'The word "hvala" (thank you) is essential at mealtimes. "Dobar tek!" means "Enjoy your meal!" (similar to "Bon appétit").' },
  'travel': { title: 'Travel Phrases', tip: 'Directions in Croatian use the locative case after "u" (in) and "na" (on/at). "Gdje je...?" means "Where is...?"' },
};

const STAGE_COLORS = [
  { bg:'linear-gradient(135deg,#0e7490,#164e63)', light:'#f0f9ff', border:'#bae6fd' },
  { bg:'linear-gradient(135deg,#059669,#065f46)', light:'#f0fdf4', border:'#bbf7d0' },
  { bg:'linear-gradient(135deg,#d97706,#b45309)', light:'#fffbeb', border:'#fde68a' },
  { bg:'linear-gradient(135deg,#7c3aed,#6d28d9)', light:'#f5f3ff', border:'#ddd6fe' },
  { bg:'linear-gradient(135deg,#dc2626,#b91c1c)', light:'#fff1f2', border:'#fecaca' },
];

// Q-4: Removed dead state setters — target screens manage their own init state.
export default function LearnTab({
  allCats, icons, sCurEx,
  sh, sLt, sLi, sLx, sLs, sLp, sLa, sLsl,
  sGl, sGp, sGx, sGs, sGa, sGsl,
  launchPathItem, launchAnimLesson,
}) {
  const { setScr, st, setTab } = useApp();
  const [showBrowse, setShowBrowse] = useState(false);
  const [pendingLesson, setPendingLesson] = useState(null);

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

  function handleLaunchPathItem(lesson) {
    const tipKey = Object.keys(LESSON_TIPS).find(k =>
      (lesson.name || lesson.title || lesson.cat || '').toLowerCase().includes(k)
    );
    if (tipKey && LESSON_TIPS[tipKey]) {
      setPendingLesson({ lesson, tip: LESSON_TIPS[tipKey] });
    } else {
      launchPathItem(lesson);
    }
  }

  return (
    <React.Fragment>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: 'var(--heading)' }}>🗺️ My Path</div>
        <button
          onClick={() => setScr('grammar-ref')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '12px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,var(--info),var(--heading))',
            color: 'var(--card)', fontSize: 'var(--text-sm)', fontWeight: 700,
            fontFamily: "'Outfit',sans-serif", minHeight: 44,
          }}
        >
          📖 Grammar
        </button>
      </div>

      {/* ── AI MICRO-LESSON CARD ──────────────────────────────────────── */}
      <button
        onClick={() => setScr('micro_lesson')}
        style={{
          display:'flex', alignItems:'center', gap:14, width:'100%', marginBottom:20,
          padding:'14px 16px', borderRadius:16, border:'1.5px solid #bae6fd',
          background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)',
          cursor:'pointer', textAlign:'left', fontFamily:"'Outfit',sans-serif",
        }}
      >
        <div style={{
          width:44, height:44, borderRadius:12, flexShrink:0,
          background:'linear-gradient(135deg,#0e7490,#0369a1)',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:22,
        }}>🎯</div>
        <div style={{flex:1}}>
          <div style={{fontSize:14, fontWeight:800, color:'#0c4a6e'}}>AI Micro-Lesson</div>
          <div style={{fontSize:12, color:'#0369a1', marginTop:2}}>Personalized 5-min lesson from your weak words</div>
        </div>
        <div style={{fontSize:18, color:'#0369a1'}}>→</div>
      </button>

      {/* ── PATH WIDGET ─────────────────────────────────────────────────── */}
      <div style={{
        borderRadius:20, overflow:'hidden', marginBottom:24,
        boxShadow:'0 4px 20px rgba(0,0,0,.10)', border:'1px solid var(--card-b)',
      }}>
        {/* Stage header */}
        <div style={{ background: sc.bg, padding:'18px 20px', color:'var(--card)' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', opacity:.75 }}>
                Stage {currentStage?.level}
              </div>
              <div style={{ fontSize:18, fontWeight:800, marginTop:3, color:'var(--card)' }}>{currentStage?.title}</div>
              <div style={{ fontSize:13, fontWeight:400, marginTop:3, lineHeight:1.5, opacity:.85 }}>{currentStage?.desc}</div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontSize:'var(--text-2xl)', fontWeight:900, lineHeight:1 }}>{overallPct}%</div>
              <div style={{ fontSize:'var(--text-xs)', opacity:.7, marginTop:2 }}>overall</div>
            </div>
          </div>
          <div style={{ background:'rgba(255,255,255,.25)', borderRadius:6, height:6, overflow:'hidden' }}>
            <div style={{ height:'100%', width:stagePct+'%', background:'var(--card)', borderRadius:6, transition:'width .5s ease' }} />
          </div>
          <div style={{ fontSize:'var(--text-xs)', opacity:.7, marginTop:5 }}>
            {currentStageDone} / {currentStage?.items.length} lessons this stage
          </div>
        </div>

        {/* Next Up */}
        <div style={{ background:'var(--card)', padding:'16px 20px' }}>
          {nextItem ? (
            <div style={{ display:'flex', alignItems:'center', gap:14, position:'relative' }}>
              <div style={{
                width:44, height:44, borderRadius:13, flexShrink:0,
                background:'var(--info-bg)', border:'1px solid var(--info-b)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:'var(--text-2xl)',
              }}>🎯</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <CroatianKnight size={36} mood="ready" style={{ flexShrink: 0 }} />
                  <div style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--subtext)' }}>
                    Next Up
                  </div>
                </div>
                <div style={{ fontSize:'var(--text-base)', fontWeight:800, color:'var(--heading)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {nextItem.name}
                </div>
                {/* Difficulty + duration row — Next Up (featured) */}
                <div style={{display:'flex',alignItems:'center',gap:10,marginTop:5}}>
                  <span style={{fontSize:12,letterSpacing:1}} title={`Difficulty: ${nextItem.diff||1}/3`}>
                    {'⭐'.repeat(nextItem.diff||1)}{'☆'.repeat(3-(nextItem.diff||1))}
                  </span>
                  {nextItem.dur && (
                    <span style={{fontSize:'var(--text-sm)',color:'var(--subtext)',fontWeight:700}}>
                      {nextItem.dur}
                    </span>
                  )}
                </div>
                <div style={{fontSize:12, color:'var(--subtext)', marginTop:4, marginBottom:12, lineHeight:1.5}}>
                  {(/** @type {any} */ (nextItem)).description || `Learn essential ${(/** @type {any} */ (nextItem)).label || 'vocabulary'} · includes audio`}
                </div>
              </div>
              {(!st || st.lc === 0) && (
                <>
                  <CroatianKnight
                    size={70}
                    mood="happy"
                    style={{ margin: '0 auto 8px', display: 'block' }}
                  />
                  <div style={{
                    position:'absolute', top:-8, right:60,
                    background:'var(--error)', color:'var(--card)',
                    fontSize:'var(--text-xs)', fontWeight:900, padding:'3px 8px',
                    borderRadius:10, letterSpacing:'.05em',
                    animation:'pulse 2s infinite',
                  }}>
                    START HERE
                  </div>
                </>
              )}
              <button
                onClick={() => handleLaunchPathItem(nextItem)}
                style={{
                  padding:'13px 18px', borderRadius:12, border:'none', flexShrink:0,
                  background:sc.bg, color:'var(--card)', fontSize:'var(--text-base)', fontWeight:800,
                  cursor:'pointer', fontFamily:"'Outfit',sans-serif",
                  boxShadow:'0 3px 10px rgba(0,0,0,.15)',
                }}
              >Start →</button>
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'8px 0' }}>
              <CroatianKnight
                size={80}
                mood="victory"
                style={{ margin: '0 auto 8px', display: 'block' }}
              />
              <div style={{ fontSize:'var(--text-4xl)', marginBottom:6 }}>🏆</div>
              <div style={{ fontSize:'var(--text-md)', fontWeight:900, color:'var(--heading)' }}>Path Complete!</div>
              <div style={{ fontSize:'var(--text-sm)', color:'var(--subtext)', marginTop:2 }}>Ti si pravi Hrvat! Bravo!</div>
            </div>
          )}
          <button
            onClick={() => setScr("learnpath")}
            style={{
              width:'100%', marginTop:12, padding:'13px', borderRadius:10,
              border:'1.5px solid var(--inp-b)', background:'none', cursor:'pointer',
              fontSize:'var(--text-sm)', fontWeight:700, color:'var(--subtext)', fontFamily:"'Outfit',sans-serif",
            }}
          >
            View full path — {totalDone}/{totalItems} lessons
          </button>
          {st && st.lc > 0 && (
            <div
              onClick={() => { if (setTab) setTab('practice'); }}
              style={{
                display:'flex', alignItems:'center', gap:10, padding:'12px 14px',
                background:'var(--card)', border:'1px solid var(--card-b)',
                borderRadius:12, cursor:'pointer', marginTop:12,
              }}
            >
              <span style={{fontSize:'var(--text-xl)'}}>🎯</span>
              <div style={{flex:1}}>
                <div style={{fontSize:'var(--text-sm)', fontWeight:700, color:'var(--heading)'}}>Now practice what you learned</div>
                <div style={{fontSize:'var(--text-sm)', color:'var(--subtext)'}}>Flashcards → drill new vocabulary</div>
              </div>
              <span style={{color:'var(--subtext)', fontSize:'var(--text-base)'}}>→</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Jump — horizontal scroll category shortcuts */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', padding: '0 0 8px',
        scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
        marginBottom: 8,
      }}>
        {[
          { icon: '📚', label: 'Vocabulary', color: '#0e7490' },
          { icon: '⚙️', label: 'Grammar',   color: '#7c3aed' },
          { icon: '📖', label: 'Reading',    color: '#059669' },
          { icon: '🎬', label: 'Videos',     color: '#dc2626' },
          { icon: '🎮', label: 'Interactive',color: '#d97706' },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => {
              if (!showBrowse) setShowBrowse(true);
              setTimeout(() => {
                const el = document.getElementById('learn-section-' + item.label.toLowerCase());
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 50);
            }}
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 20,
              background: 'var(--card)', border: '1px solid var(--card-b)',
              cursor: 'pointer', minHeight: 44,
            }}
          >
            <span style={{fontSize: 16}}>{item.icon}</span>
            <span style={{fontSize: 12, fontWeight: 700, color: item.color, whiteSpace: 'nowrap'}}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* ── GOAL-BASED STAGE 1 FOCUS ────────────────────────────────── */}
      {(() => {
        const goal = localStorage.getItem('nh_goal');
        if (!goal || (currentStage && currentStage.level > 2)) return null;
        const GOAL_STAGE1 = {
          heritage: {
            label: 'Heritage & Roots Path',
            icon: '🇭🇷',
            color: 'var(--warning)',
            bg: 'var(--warning-bg)',
            border: 'var(--warning-b)',
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
            color: 'var(--info)',
            bg: 'var(--info-bg)',
            border: 'var(--info-b)',
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
            color: 'var(--success)',
            bg: 'var(--success-bg)',
            border: 'var(--success-b)',
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
            color: 'var(--lavender)',
            bg: 'var(--info-bg)',
            border: 'var(--card-b)',
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
            color: 'var(--info)',
            bg: 'var(--info-bg)',
            border: 'var(--info-b)',
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
              <span style={{ fontSize:'var(--text-xl)' }}>{gf.icon}</span>
              <div>
                <div style={{ fontSize:'var(--text-base)', fontWeight:900, color: gf.color }}>{gf.label}</div>
                <div style={{ fontSize:'var(--text-sm)', color:'var(--subtext)', marginTop:1, fontWeight:500 }}>Personalized for your goal</div>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {gf.tips.map((tip, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                  <span style={{ fontSize:'var(--text-base)', fontWeight:900, color: gf.color, flexShrink:0, marginTop:1 }}>{i+1}.</span>
                  <span style={{ fontSize:'var(--text-sm)', color:'var(--body)', fontWeight:500, lineHeight:1.5 }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── 5-STAGE JOURNEY STRIP ───────────────────────────────────────── */}
      {(() => {
        const stageCEFR = { 0:'A1', 1:'A2', 2:'B1', 3:'B1+', 4:'B2+' };
        const stageDescriptions = {
          0: '50+ core words your family uses every day',
          1: 'Greetings, family, numbers, days of week',
          2: 'Travel, food, work, expressing opinions',
          3: 'Fluent conversation, idioms, cultural references',
          4: 'Native-level expression and cultural mastery',
        };
        return (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:'var(--text-xs)', fontWeight:800, color:'var(--subtext)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>
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
                        fontSize:'var(--text-base)', color: isComplete || isCurrent ? 'var(--card)' : 'var(--subtext)',
                        fontWeight:900, boxShadow: isCurrent ? '0 0 0 3px rgba(14,116,144,.2)' : 'none',
                        transition:'all .3s',
                      }}>
                        {isComplete ? '✓' : lv.level}
                      </div>
                      <div style={{ fontSize:'var(--text-xs)', fontWeight:800, color: isCurrent ? 'var(--heading)' : isComplete ? 'var(--success)' : 'var(--subtext)', letterSpacing:'.03em', lineHeight:1.2 }}>
                        {lv.title}
                      </div>
                      <span style={{
                        fontSize:'var(--text-xs)', fontWeight:800, background:'var(--info-bg)',
                        color:'var(--info)', borderRadius:4, padding:'1px 4px', marginTop:2,
                        display:'inline-block',
                      }}>
                        {stageCEFR[i]}
                      </span>
                      <div style={{fontSize:10, color:'var(--subtext)', marginTop:2, maxWidth:100, textAlign:'center', lineHeight:1.3}}>
                        {stageDescriptions[i] || ''}
                      </div>
                    </div>
                    {i < LEARN_PATH.length - 1 && (
                      <div style={{
                        width:18, height:2, flexShrink:0, marginBottom:16,
                        background: lvDone === lv.items.length ? 'var(--success)' : 'var(--card-b)',
                        borderRadius:2,
                      }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── CEFR FLUENCY TRACK ──────────────────────────────────────────── */}
      <div style={{
        background:'var(--card)', border:'1px solid var(--card-b)',
        borderRadius:14, padding:'14px 16px', marginBottom:20,
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'var(--heading)' }}>🎓 CEFR Level</span>
            <span
              title="A1=Beginner, A2=Elementary, B1=Intermediate, B2=Upper-Intermediate, C1=Advanced, C2=Mastery"
              style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', cursor:'help', lineHeight:1, userSelect:'none' }}
            >ℹ</span>
          </div>
          <span style={{
            fontSize:'var(--text-sm)', fontWeight:900, color:'var(--card)',
            background: cefrLevel === 'B2' ? 'var(--success)' : cefrLevel === 'B1' ? 'var(--info)' : cefrLevel === 'A2' ? 'var(--warning)' : 'var(--subtext)',
            borderRadius:8, padding:'2px 9px',
          }}>{cefrLevel}</span>
        </div>
        <div style={{ position:'relative', height:8, background:'var(--bar-bg)', borderRadius:6, overflow:'visible', marginBottom:6 }}>
          <div style={{
            height:'100%', borderRadius:6,
            width: cefrPct + '%',
            background: 'linear-gradient(90deg,var(--subtext),var(--info),var(--success))',
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
            <div key={l} style={{ fontSize:'var(--text-xs)', fontWeight:700, color: cefrLevel === l ? 'var(--heading)' : 'var(--subtext)', opacity: cefrLevel === l ? 1 : 0.5 }}>{l}</div>
          ))}
        </div>
      </div>

      {/* ── BROWSE ALL CONTENT BUTTON ────────────────────────────────────── */}
      <button onClick={() => setShowBrowse(true)} style={{
        width:'100%', padding:'14px', borderRadius:14,
        border:'2px solid var(--accent)', background:'transparent',
        color:'var(--subtext)', fontWeight:700, fontSize:14, cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        fontFamily:"'Outfit',sans-serif",
      }}>
        📚 Browse all content →
      </button>

      {/* ── BROWSE ALL CONTENT MODAL ─────────────────────────────────────── */}
      {showBrowse && (
        <div style={{
          position:'fixed', inset:0, zIndex:1000,
          background:'var(--app-bg)', overflowY:'auto',
          display:'flex', flexDirection:'column',
        }}>
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'16px', borderBottom:'1px solid var(--bar-bg)',
            position:'sticky', top:0, background:'var(--app-bg)', zIndex:1,
          }}>
            <h2 style={{ margin:0, fontSize:18, fontFamily:"'Playfair Display',serif" }}>📚 Browse All Content</h2>
            <button onClick={() => setShowBrowse(false)} style={{
              background:'none', border:'none', fontSize:24, cursor:'pointer', color:'var(--subtext)',
            }}>✕</button>
          </div>
          <div style={{ padding:'0 16px 40px' }}>

            {/* Vocabulary */}
            <div id="learn-section-vocabulary" style={{ marginTop:16 }}>
              <Section title="Vocabulary" icon="📚" count={`${allCats.length + 6} topics`} defaultOpen={true}>
                <p style={{ fontSize:'var(--text-sm)', color:"var(--subtext)", marginBottom:10, fontWeight:500 }}>
                  {allCats.length} core categories · tap any to start
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
                  {allCats.map(t => {
                    const isCompleted = st && Array.isArray(st.ct) && st.ct.includes(t);
                    return (
                    <button key={t} className="tc" style={{ textAlign:"center", padding:"14px 8px" }} onClick={() => { setShowBrowse(false); launchVocab(t); }}>
                      <div style={{ fontSize:'var(--text-2xl)' }}>{icons[t] || "📚"}</div>
                      <div style={{ fontSize:'var(--text-sm)', fontWeight:700, marginTop:4, textTransform:"capitalize" }}>
                        {t}
                        {isCompleted && (
                          <span style={{ color: 'var(--success)', fontWeight: 800, marginLeft: 6 }}>✓</span>
                        )}
                      </div>
                      <div style={{ fontSize:'var(--text-xs)', color:"var(--subtext)", marginTop:2 }}>{V[t].length} words</div>
                      <div style={{ fontSize:'var(--text-xs)', color:"var(--subtext)", marginTop:3, opacity:.7, lineHeight:1.3 }}>
                        {(V[t]||[]).slice(0,2).map(w=>w[0]).join(' · ')}
                      </div>
                      {(() => {
                        const count = V[t].length;
                        const [badge, color, bg] = count < 15 ? ['Essential','var(--success)','var(--success-bg)'] : count < 25 ? ['Core','var(--info)','var(--info-bg)'] : ['Extended','var(--lavender)','var(--bar-bg)'];
                        return <span style={{fontSize:'var(--text-xs)',fontWeight:800,color,background:bg,borderRadius:6,padding:'2px 5px',marginTop:3,letterSpacing:'.04em'}}>{badge}</span>;
                      })()}
                    </button>
                    );
                  })}
                </div>
                <div style={{ fontSize:'var(--text-sm)', fontWeight:700, color:'var(--subtext)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Themes</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                  {[
                    ["🌍","Countries","countries"],["💼","Professions","professions"],
                    ["🌤️","Weather","weather"],["👗","Clothing","clothes"],
                    ["👤","Appearance","bodydesc"],["🔤","Pronunciation","phonology"],
                  ].map(([icon,label,screen]) => (
                    <button key={screen} className="tc" style={{ textAlign:"center", padding:"14px 8px" }} onClick={() => { setShowBrowse(false); setScr(screen); }}>
                      <div style={{ fontSize:'var(--text-2xl)' }}>{icon}</div>
                      <div style={{ fontSize:'var(--text-sm)', fontWeight:700, marginTop:4 }}>{label}</div>
                    </button>
                  ))}
                </div>
              </Section>
            </div>

            {/* Grammar */}
            <div id="learn-section-grammar">
            <Section title="Grammar" icon="📝" count="14 lessons" defaultOpen={true}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <LevelBadge label="Foundation" color="var(--success)" bg="var(--success-bg)" />
                <div style={{ flex:1, height:1, background:"var(--card-b)" }} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                {[
                  ["📜","Grammar Intro","a1",() => { sGl(GRAM.beginner[0]); sGp("learn"); sGx(0); sGs(0); sGa(false); sGsl(-1); setScr("grammar"); sCurEx("grammar"); }],
                  ["🔄","Tenses & Gender","a1",() => { setScr("tenses"); sCurEx("tenses"); }],
                  ["📝","Cases Intro","a2",() => { setScr("padezi"); sCurEx("padezi"); }],
                  ["🎨","Colors & Gender","a2",() => { setScr("boje"); sCurEx("boje"); }],
                ].map((/** @type {any} */ [icon,label,cefr,fn]) => (
                  <button key={label} className="tc" style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 14px", textAlign:"left" }} onClick={() => { setShowBrowse(false); fn(); }}>
                    <div style={{ fontSize:'var(--text-xl)', flexShrink:0 }}>{icon}</div>
                    <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:"var(--heading)", flex:1 }}>{label}</div>
                    <span className={`cefr cefr-${cefr}`}>{cefr.toUpperCase()}</span>
                  </button>
                ))}
              </div>

              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <LevelBadge label="Intermediate" color="var(--warning)" bg="var(--warning-bg)" />
                <div style={{ flex:1, height:1, background:"var(--card-b)" }} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                {[
                  ["📚","Padeži Master","b1",() => { setScr("padezifull"); sCurEx("padezifull"); }],
                  ["↔️","Verb Aspect","b1",() => { setScr("aspect"); }],
                  ["🔀","Conjugation","b1",() => { setScr("conjdrill"); sCurEx("conjdrill"); }],
                ].map((/** @type {any} */ [icon,label,cefr,fn]) => (
                  <button key={label} className="tc" style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 14px", textAlign:"left" }} onClick={() => { setShowBrowse(false); fn(); }}>
                    <div style={{ fontSize:'var(--text-xl)', flexShrink:0 }}>{icon}</div>
                    <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:"var(--heading)", flex:1 }}>{label}</div>
                    <span className={`cefr cefr-${cefr}`}>{cefr.toUpperCase()}</span>
                  </button>
                ))}
              </div>

              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <LevelBadge label="Advanced" color="var(--lavender)" bg="var(--bar-bg)" />
                <div style={{ flex:1, height:1, background:"var(--card-b)" }} />
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
                  <button key={label} className="tc" style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 14px", textAlign:"left" }} onClick={() => { setShowBrowse(false); fn(); }}>
                    <div style={{ fontSize:'var(--text-xl)', flexShrink:0 }}>{icon}</div>
                    <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:"var(--heading)", flex:1 }}>{label}</div>
                    <span className={`cefr cefr-${cefr}`}>{cefr.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </Section>
            </div>

            {/* Reading */}
            <div id="learn-section-reading">
            <Section title="Reading" icon="📖" count="100+ passages" defaultOpen={true}>
              <button className="tc" style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"16px" }} onClick={() => { setShowBrowse(false); setScr("readlist"); }}>
                <div style={{ width:44, height:44, borderRadius:13, background:'var(--success-bg)', border:'1px solid var(--success-b)',
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:'var(--text-2xl)', flexShrink:0 }}>📖</div>
                <div style={{ flex:1, textAlign:"left" }}>
                  <div style={{ fontSize:'var(--text-base)', fontWeight:800, color:"var(--heading)" }}>Reading Passages</div>
                  <div style={{ fontSize:'var(--text-sm)', color:"var(--subtext)", marginTop:1 }}>100+ stories · A1 to B2</div>
                </div>
                <div style={{ fontSize:'var(--text-xl)', color:"var(--subtext)", opacity:.35 }}>›</div>
              </button>
            </Section>
            </div>

            {/* Grammar Videos */}
            <div id="learn-section-videos">
            <Section title="Grammar Videos & AI Lessons" icon="🎥" count="18 videos + AI" defaultOpen={true}>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <button className="tc" style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"16px" }}
                  onClick={() => { setShowBrowse(false); setScr("grammarvideos"); }}>
                  <span style={{ fontSize:28 }}>🎬</span>
                  <div style={{ textAlign:"left" }}>
                    <div style={{ fontSize:15, fontWeight:700 }}>Watch Grammar Lessons</div>
                    <div style={{ fontSize:12, color:"var(--subtext)" }}>18 video lessons from beginner to advanced</div>
                  </div>
                </button>
                <button className="tc" style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"16px" }}
                  onClick={() => { setShowBrowse(false); setScr("grammarexplainer"); }}>
                  <span style={{ fontSize:28 }}>🤖</span>
                  <div style={{ textAlign:"left" }}>
                    <div style={{ fontSize:15, fontWeight:700 }}>AI Grammar Explainer</div>
                    <div style={{ fontSize:12, color:"var(--subtext)" }}>Instant AI lessons on any topic + quiz</div>
                  </div>
                </button>
              </div>
            </Section>
            </div>

            {/* Interactive Media */}
            <div id="learn-section-interactive">
            <Section title="Interactive Media" icon="✨" count="4 tools" defaultOpen={true}>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  ["🎬","Animated Lessons","Slide-by-slide grammar lessons with audio","animlesson_alphabet",() => { setShowBrowse(false); launchAnimLesson && launchAnimLesson("alphabet"); }],
                  ["🔀","Case Transformer","Declension explorer — tap any noun across all 7 cases","casetransformer",() => { setShowBrowse(false); setScr("casetransformer"); }],
                  ["🗺️","Vocabulary Scenes","Tap objects in real-life scenes to learn words","vocabscenes",() => { setShowBrowse(false); setScr("vocabscenes"); }],
                  ["🔍","Grammar X-Ray","Tap any word in a text to see full grammatical analysis","grammarreader",() => { setShowBrowse(false); setScr("grammarreader"); }],
                ].map((/** @type {any[]} */ [icon,label,sub,key,fn]) => (
                  <button key={key} className="tc" style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"14px 16px", textAlign:"left" }} onClick={fn}>
                    <span style={{ fontSize:28, flexShrink:0 }}>{icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"var(--text-sm)", fontWeight:800, color:"var(--heading)" }}>{label}</div>
                      <div style={{ fontSize:"var(--text-xs)", color:"var(--subtext)", marginTop:2 }}>{sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </Section>
            </div>

            {/* Reference */}
            <Section title="Quick Reference" icon="📌" count="13 guides" defaultOpen={false}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                {[
                  ["🔤","Alphabet","alphabet"],["🧩","Word Patterns","wordform"],["🐣","Diminutives","diminutives"],
                  ["🗺️","Dialects","dialects"],["⚠️","False Friends","falsefr"],["🎨","Color Quirks","colorquirk"],
                  ["🪞","Svoj vs Moj","svojmoj"],["🔀","Conditional","conditional"],["🤝","Vi ili ti?","formalregister"],
                  ["🔁","Impersonal","impersonal"],["💻","Tech & Digital","techvoc"],["🏛️","Admin Life","bureaucratic"],
                  ["🎭","Ti vs Vi","tivicompare"],
                ].map(([icon,label,screen]) => (
                  <button key={screen} className="tc" style={{ textAlign:"center", padding:"12px 8px" }} onClick={() => { setShowBrowse(false); setScr(screen); }}>
                    <div style={{ fontSize:'var(--text-2xl)' }}>{icon}</div>
                    <div style={{ fontSize:'var(--text-sm)', fontWeight:700, marginTop:4 }}>{label}</div>
                  </button>
                ))}
              </div>
            </Section>

          </div>
        </div>
      )}

      {pendingLesson && (
        <div style={{
          position:'fixed', inset:0, zIndex:1000,
          background:'rgba(0,0,0,0.5)',
          display:'flex', alignItems:'center', justifyContent:'center',
          padding:20,
        }}
          role="dialog" aria-modal="true" aria-label="Grammar tip"
          onClick={(e) => { if (e.target === e.currentTarget) setPendingLesson(null); }}
        >
          <div style={{
            background:'var(--card)', borderRadius:20,
            padding:24, maxWidth:360, width:'100%',
            boxShadow:'0 20px 60px rgba(0,0,0,.3)',
          }}>
            <div style={{fontSize:28, textAlign:'center', marginBottom:8}}>📖</div>
            <h3 style={{
              fontFamily:"'Playfair Display',serif",
              fontSize:'var(--text-lg)',
              color:'var(--heading)', textAlign:'center', marginBottom:12,
            }}>{pendingLesson.tip.title}</h3>
            <p style={{
              color:'var(--subtext)', fontSize:'var(--text-sm)',
              lineHeight:1.6, textAlign:'center', marginBottom:20,
            }}>{pendingLesson.tip.tip}</p>
            <button
              className="b bp"
              style={{width:'100%'}}
              onClick={() => { launchPathItem(pendingLesson.lesson); setPendingLesson(null); }}
            >
              Got it — Start Lesson →
            </button>
            <button
              className="b"
              style={{width:'100%', marginTop:8}}
              onClick={() => setPendingLesson(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}
