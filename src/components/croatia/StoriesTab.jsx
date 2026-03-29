import React, { useState } from 'react';
import { incrementCulture } from '../../data.jsx';
import { useApp } from '../../context/AppContext.jsx';
import CroatianKnight from '../shared/CroatianKnight';

const BAKA_LETTERS = [
  {
    id: 'letter1',
    from: 'Baka Marija',
    date: 'Nedjelja, 14. travnja',
    subject: 'Drago moje unuče...',
    preview: 'Kako si ti? Ovdje je lijepo proljetno vrijeme...',
    full: `Drago moje unuče,

Kako si ti? Ovdje je lijepo proljetno vrijeme. Cvjetovi su procvjetali u vrtu i miris jorgovana dolazi kroz prozor.

Jučer sam napravila sarmu — baš onako kako si ti volio kad si bio mali. Stavila sam puno riže i malo više paprike, jer znam da ti se sviđa ljuto.

Djed i ja često pričamo o tebi. Nedostaje nam tvoj smijeh. Jesi li naučio još koji novi glagol? Pišemo ti svaki tjedan, ali odgovori nam kad možeš.

Puno ljubavi i zagrljaj,
Tvoja Baka 💙`,
    words: [
      { hr: 'proljetno', en: 'spring (adj.)' },
      { hr: 'cvjetovi', en: 'flowers' },
      { hr: 'miris', en: 'scent/fragrance' },
      { hr: 'sarma', en: 'stuffed cabbage (traditional dish)' },
      { hr: 'nedostaje nam', en: 'we miss (you)' },
      { hr: 'zagrljaj', en: 'hug/embrace' },
    ],
  },
  {
    id: 'letter2',
    from: 'Baka Marija',
    date: 'Ponedjeljak, 22. travnja',
    subject: 'Vijesti iz sela...',
    preview: 'Jučer je bila svadba kod susjeda Ivića...',
    full: `Drago unuče,

Jučer je bila svadba kod susjeda Ivića. Cijelo selo je plesalo kolo do ponoći! Glazba je bila tako lijepa — tamburice i harmonika.

Tvoja teta Ana je donijela fritule — onaj recept koji smo ti uvijek davali za Božić. Svi su pitali za tebe. Rekla sam im da učiš hrvatski i da ćeš doći ljeti. Je li to istina?

Djed je nešto bolje. Hoda po vrtu svako jutro i kopa. Kaže da se bez rada ne može živjeti.

Čekamo te s nestrpljenjem.
Tvoja Baka 💙`,
    words: [
      { hr: 'svadba', en: 'wedding' },
      { hr: 'kolo', en: 'traditional circle dance' },
      { hr: 'tamburice', en: 'traditional string instruments' },
      { hr: 'fritule', en: 'Croatian doughnuts (holiday treat)' },
      { hr: 'nestrpljenje', en: 'impatience / anticipation' },
      { hr: 'kopati', en: 'to dig / to garden' },
    ],
  },
];

export default function StoriesTab() {
  const { award } = useApp();
  const [openLetter, setOpenLetter] = useState(null);
  const [expandedCtx, setExpandedCtx] = useState({});
  const toggleCtx = (key) => setExpandedCtx(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <React.Fragment>
      {/* ── LETTERS FROM BAKA ── */}
      <div className="section-block">
        <div className="section-hdr">
          <div className="section-hdr-icon" style={{background:'rgba(200,152,10,.14)'}}>💌</div>
          <div className="section-hdr-text">
            <div className="section-hdr-title">Letters from Baka</div>
            <div className="section-hdr-sub">Read Croatian the way family really writes it</div>
          </div>
          <CroatianKnight size={40} mood="thinking" style={{ flexShrink: 0 }} />
        </div>
        <div style={{fontSize:12, color:'var(--subtext)', marginBottom:12, lineHeight:1.5}}>
          Personal letters written in authentic Croatian — perfect for understanding how family members actually speak, including regional expressions and emotional vocabulary.
        </div>
        <div
          onClick={() => { if (!expandedCtx['baka']) incrementCulture('regionCnt'); toggleCtx('baka'); }}
          style={{
            fontSize:12, color:'var(--info)', cursor:'pointer',
            marginBottom: expandedCtx['baka'] ? 0 : 12,
            display:'flex', alignItems:'center', gap:4, fontWeight:600
          }}
        >
          {expandedCtx['baka'] ? '▲' : '▼'} Why this matters for your Croatian
        </div>
        {expandedCtx['baka'] && (
          <div style={{
            fontSize:12, color:'var(--subtext)', lineHeight:1.6,
            padding:'10px 14px', background:'var(--info-bg)',
            borderRadius:10, marginBottom:12, border:'1px solid var(--info-b)'
          }}>
            💌 <strong>Baka's letters</strong> capture authentic Croatian as it's actually written between family members — warm, informal, full of dialect and emotion. This is the Croatian you won't find in textbooks, but will hear and read with your family.
          </div>
        )}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {BAKA_LETTERS.map(letter => (
            <div key={letter.id} style={{ background:'var(--card)', border:'1.5px solid var(--card-b)', borderRadius:14, overflow:'hidden' }}>
              <button
                onClick={() => { const opening = openLetter !== letter.id; setOpenLetter(opening ? letter.id : null); if (opening) { incrementCulture('bakaCnt'); if (award) award(5); } }}
                style={{ width:'100%', padding:'14px 16px', background:'none', border:'none', cursor:'pointer', textAlign:'left', fontFamily:"'Outfit',sans-serif" }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#fef3c7,#fde68a)', border:'1px solid #fde68a',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>💌</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'var(--heading)' }}>{letter.from}</div>
                    <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', marginTop:1 }}>{letter.subject} · {letter.date}</div>
                  </div>
                  <span style={{ fontSize:'var(--text-base)', color:'var(--subtext)', opacity:.5 }}>{openLetter === letter.id ? '▲' : '▼'}</span>
                </div>
              </button>
              {openLetter === letter.id && (
                <div style={{ borderTop:'1px solid var(--card-b)', padding:'16px' }}>
                  <div style={{
                    background:'#fffbeb', border:'1px solid #fde68a',
                    borderRadius:10, padding:'14px 16px', marginBottom:14,
                    fontFamily:"Georgia, serif", fontSize:'var(--text-sm)', lineHeight:1.8, color:'#451a03',
                    whiteSpace:'pre-line',
                  }}>
                    {letter.full}
                  </div>
                  <div style={{ fontSize:'var(--text-xs)', fontWeight:800, color:'var(--subtext)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>
                    📚 Words from this letter
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {letter.words.map(w => (
                      <div key={w.hr} style={{ background:'var(--bar-bg)', borderRadius:8, padding:'8px 10px' }}>
                        <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'#0e7490' }}>{w.hr}</div>
                        <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', marginTop:2 }}>{w.en}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </React.Fragment>
  );
}
