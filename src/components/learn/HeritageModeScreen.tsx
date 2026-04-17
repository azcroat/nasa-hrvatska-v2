// @ts-nocheck
/**
 * HeritageModeScreen — Heritage Learner Mode for the Croatian diaspora.
 *
 * Targets the 2.5M diaspora (US, Germany, Australia, Canada, NZ, Argentina)
 * who grew up hearing Croatian at home but never formally studied it.
 * Four sections: comprehension check, dialect connection, gap analysis,
 * and "Talking to Your Baka" phrase toolkit.
 */
import React, { useState, useEffect, useRef } from 'react';
import { speak } from '../../data';
import { markQuest } from '../../lib/quests.js';
import { knightSpeak } from '../../lib/knightSpeak.js';
import { useApp } from '../../context/AppContext';

// ── Data ──────────────────────────────────────────────────────────────────────

const HERITAGE_WORDS = [
  { hr: 'hvala', en: 'thank you', context: 'Your grandparents said this constantly' },
  { hr: 'molim', en: "please / you're welcome", context: 'Used for both please and you\'re welcome' },
  { hr: 'dobar dan', en: 'good day', context: 'The standard daytime greeting' },
  { hr: 'kako si?', en: 'how are you?', context: 'Informal — to family and friends' },
  { hr: 'dobro', en: 'good / well', context: 'The most common answer to kako si?' },
  { hr: 'što', en: 'what', context: 'Note: Dalmatian speakers say "šta" or "ča"' },
  { hr: 'jako', en: 'very', context: 'Your grandma said "jako lijepo" — very beautiful' },
  { hr: 'lijepo', en: 'beautiful / nice', context: 'Extremely common in Croatian speech' },
  { hr: 'da', en: 'yes', context: 'Simple — and you know this one' },
  { hr: 'ne', en: 'no', context: 'You definitely know this one' },
  { hr: 'moja / moj', en: 'my (feminine/masculine)', context: '"Moja kuća" — my house' },
  { hr: 'naša / naš', en: 'our (fem/masc)', context: '"Naša Hrvatska" — Our Croatia' },
  { hr: 'mama', en: 'mum', context: 'Same as in English — universally understood' },
  { hr: 'tata', en: 'dad', context: 'Also baka (grandma) and djed (grandpa)' },
  { hr: 'baka', en: 'grandma', context: 'The person you heard Croatian from most' },
  { hr: 'djed', en: 'grandpa', context: 'From stari djed (old grandfather)' },
];

const DIALECTS = [
  {
    id: 'stokavian',
    name: 'Štokavian (Standard)',
    regions: 'Zagreb, Slavonia, most of Bosnia',
    marker: 'što',
    example: 'Što radiš? (What are you doing?)',
    note: "The basis of standard Croatian — what you'll learn in textbooks",
    icon: '🏙️',
    comparisons: [
      { label: 'What?', standard: 'Što?', dialect: 'Što?' },
      { label: 'I am.', standard: 'Ja sam.', dialect: 'Ja sam.' },
      { label: 'house', standard: 'kuća', dialect: 'kuća' },
      { label: 'what are you doing?', standard: 'Što radiš?', dialect: 'Što radiš?' },
      { label: 'beautiful', standard: 'lijepo', dialect: 'lijepo' },
    ],
  },
  {
    id: 'cakavian',
    name: 'Čakavian (Coastal)',
    regions: 'Dalmatia, Split, Dubrovnik coast, islands',
    marker: 'ča',
    example: 'Ča radiš? (What are you doing?)',
    note: 'If your family is from the coast or islands, they speak this. Very musical.',
    icon: '🌊',
    comparisons: [
      { label: 'What?', standard: 'Što?', dialect: 'Ča?' },
      { label: 'I am.', standard: 'Ja sam.', dialect: 'Ja san.' },
      { label: 'house', standard: 'kuća', dialect: 'hiža / kuća' },
      { label: 'what are you doing?', standard: 'Što radiš?', dialect: 'Ča delaš?' },
      { label: 'beautiful', standard: 'lijepo', dialect: 'lipo' },
    ],
  },
  {
    id: 'kajkavian',
    name: 'Kajkavian (Zagreb area)',
    regions: 'Zagreb, Zagorje, Međimurje',
    marker: 'kaj',
    example: 'Kaj delaš? (What are you doing?)',
    note: 'Spoken in and around Zagreb. Sounds almost like Slovenian to outsiders.',
    icon: '🏔️',
    comparisons: [
      { label: 'What?', standard: 'Što?', dialect: 'Kaj?' },
      { label: 'I am.', standard: 'Ja sam.', dialect: 'Ja sem.' },
      { label: 'house', standard: 'kuća', dialect: 'hiža' },
      { label: 'what are you doing?', standard: 'Što radiš?', dialect: 'Kaj delaš?' },
      { label: 'beautiful', standard: 'lijepo', dialect: 'lepo' },
    ],
  },
];

const GAP_AREAS = [
  {
    id: 'spelling',
    icon: '✍️',
    label: 'Spelling diacritics',
    desc: 'Writing Č/Ć, Š, Ž, DŽ/Đ correctly',
    weakness: 'Heritage speakers hear the sounds but mix up the written forms',
    modules: [{ label: 'Alphabet & Pronunciation', scr: 'alphabet' }, { label: 'Pronunciation Course', scr: 'pronunciation_course' }],
  },
  {
    id: 'cases',
    icon: '📐',
    label: 'Case endings',
    desc: 'Declining nouns and adjectives (7 cases)',
    weakness: 'Heritage speakers use nominative for everything — "Vidim mama" instead of "Vidim mamu"',
    modules: [{ label: 'Case System', scr: 'padezi' }, { label: 'Case Transformer', scr: 'casetransformer' }],
  },
  {
    id: 'verbs',
    icon: '⚙️',
    label: 'Verb conjugation',
    desc: 'Conjugating verbs in all tenses',
    weakness: 'Heritage speakers often use infinitive forms — "Ja ići" instead of "Ja idem"',
    modules: [{ label: 'Verb Drill', scr: 'verbdrill' }, { label: 'Tenses', scr: 'tenses' }],
  },
  {
    id: 'aspect',
    icon: '🔄',
    label: 'Verbal aspect',
    desc: 'Perfective vs. imperfective verbs',
    weakness: 'The hardest part of Croatian — even advanced learners struggle',
    modules: [{ label: 'Aspect Pairs', scr: 'aspect' }, { label: 'Aspect Drill', scr: 'aspect_drill' }],
  },
  {
    id: 'formal',
    icon: '🎩',
    label: 'Formal register (Vi)',
    desc: 'Using Vi (formal you) with elders and strangers',
    weakness: 'Your grandparents may have used ti with you — Vi sounds strange but is important',
    modules: [{ label: 'Ti vs Vi', scr: 'tivi' }, { label: 'Formal Register', scr: 'formal_register' }],
  },
  {
    id: 'writing',
    icon: '📝',
    label: 'Written Croatian',
    desc: 'Composing grammatically correct text',
    weakness: 'Heritage speakers can speak but feel lost when writing formally',
    modules: [{ label: 'Writing Practice', scr: 'writing' }, { label: 'Grammar Reference', scr: 'grammar-ref' }],
  },
];

const BAKA_PHRASES = [
  { hr: 'Nedostajete mi.', en: 'I miss you (formal, to older relatives).', audio: 'Nedostajete mi.' },
  { hr: 'Jako sam sretan što sam ovdje.', en: 'I am so happy to be here. (masculine)', audio: 'Jako sam sretan što sam ovdje.' },
  { hr: 'Jako sam sretna što sam ovdje.', en: 'I am so happy to be here. (feminine)', audio: 'Jako sam sretna što sam ovdje.' },
  { hr: 'Pričajte mi o staroj domovini.', en: 'Tell me about the old homeland.', audio: 'Pričajte mi o staroj domovini.' },
  { hr: 'Naučio sam malo hrvatskog.', en: 'I learned a bit of Croatian. (masculine)', audio: 'Naučio sam malo hrvatskog.' },
  { hr: 'Naučila sam malo hrvatskog.', en: 'I learned a bit of Croatian. (feminine)', audio: 'Naučila sam malo hrvatskog.' },
  { hr: 'Još uvijek učim.', en: "I'm still learning.", audio: 'Još uvijek učim.' },
  { hr: 'Možete li ponoviti, molim?', en: 'Could you repeat that, please?', audio: 'Možete li ponoviti, molim?' },
  { hr: 'Sporije, molim.', en: 'Slower, please.', audio: 'Sporije, molim.' },
  { hr: 'Kako se to kaže na hrvatskom?', en: 'How do you say that in Croatian?', audio: 'Kako se to kaže na hrvatskom?' },
  { hr: 'Hrana je bila izvrsna.', en: 'The food was excellent.', audio: 'Hrana je bila izvrsna.' },
  { hr: 'Ponosim se svojim korijenima.', en: 'I am proud of my roots.', audio: 'Ponosim se svojim korijenima.' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function HeritageModeScreen({ goBack, award }) {
  const { setScr } = useApp();

  // Active section: 'check' | 'dialect' | 'gaps' | 'baka' | 'done'
  const [section, setSection] = useState('check');
  const [sectionsVisited, setSectionsVisited] = useState(new Set(['check']));

  // Section 1 state
  const [wordKnown, setWordKnown] = useState({});
  const [checkDone, setCheckDone] = useState(false);

  // Section 2 state
  const [selectedDialect, setSelectedDialect] = useState(
    () => localStorage.getItem('nh_dialect') || ''
  );

  // Section 3 state
  const [gapRatings, setGapRatings] = useState({});

  // Section 4 state
  const [savedPhrases, setSavedPhrases] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('nh_saved_phrases') || '[]')); }
    catch { return new Set(); }
  });
  const [copyMsg, setCopyMsg] = useState('');

  // Completion guard
  const awardFired = useRef(false);

  useEffect(() => {
    knightSpeak(
      'happy',
      '"Jezik je duša naroda." Croatian lives in you already — this mode helps you unlock it. 🇭🇷',
      600
    );
    // Activate heritage mode
    try { localStorage.setItem('nh_heritage_mode', 'true'); } catch {}
  }, []);  

  function visitSection(id) {
    setSection(id);
    setSectionsVisited(prev => new Set([...prev, id]));
  }

  // Count known words
  const knownCount = Object.values(wordKnown).filter(v => v === 'know').length;
  const allChecked = Object.keys(wordKnown).length === HERITAGE_WORDS.length;

  // Check if all 4 core sections have been visited
  const allSectionsVisited =
    sectionsVisited.has('check') &&
    sectionsVisited.has('dialect') &&
    sectionsVisited.has('gaps') &&
    sectionsVisited.has('baka');

  function handleComplete() {
    if (!awardFired.current) {
      awardFired.current = true;
      if (typeof award === 'function') award(75);
      markQuest('reading');
    }
    setSection('done');
  }

  // ── NAVIGATION TABS ────────────────────────────────────────────────────────
  function NavTabs() {
    const tabs = [
      { id: 'check', label: '📋 Words', short: '1' },
      { id: 'dialect', label: '🗺️ Dialect', short: '2' },
      { id: 'gaps', label: '📊 Gaps', short: '3' },
      { id: 'baka', label: '👵 Baka', short: '4' },
    ];
    return (
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {tabs.map(t => {
          const visited = sectionsVisited.has(t.id);
          const active = section === t.id;
          return (
            <button
              key={t.id}
              onClick={() => visitSection(t.id)}
              style={{
                flex: 1, padding: '8px 4px', borderRadius: 10, border: 'none',
                cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
                fontWeight: 700, fontSize: 11, lineHeight: 1.3,
                background: active ? 'var(--info)' : visited ? 'var(--info-bg)' : 'var(--bar-bg)',
                color: active ? '#fff' : visited ? 'var(--info)' : 'var(--subtext)',
                outline: active ? 'none' : visited ? '1.5px solid var(--info-b)' : 'none',
                transition: 'all .15s',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    );
  }

  // ── SECTION 1: COMPREHENSION CHECK ────────────────────────────────────────
  function renderCheck() {
    return (
      <div>
        <div style={{ background: 'linear-gradient(135deg,#7c2d12,#c2410c)', borderRadius: 16, padding: '18px 16px', marginBottom: 20, color: '#fff' }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.7)', marginBottom: 4 }}>Section 1 of 4</div>
          <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6, lineHeight: 1.2 }}>Do You Recognise These?</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.85)', lineHeight: 1.5 }}>
            Tap "I know this" for words you've heard before — even if you can't spell them.
          </div>
        </div>

        {HERITAGE_WORDS.map((w, i) => {
          const status = wordKnown[i];
          return (
            <div key={i} style={{
              background: status === 'know' ? 'var(--success-bg)' : status === 'new' ? 'var(--bar-bg)' : 'var(--card)',
              border: `1.5px solid ${status === 'know' ? 'var(--success-b)' : status === 'new' ? 'var(--card-b)' : 'var(--card-b)'}`,
              borderRadius: 12, padding: '14px 14px', marginBottom: 8,
              transition: 'all .15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--heading)' }}>{w.hr}</div>
                  <div style={{ fontSize: 13, color: 'var(--subtext)', marginTop: 2 }}>{w.en}</div>
                  <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 3, fontStyle: 'italic' }}>{w.context}</div>
                </div>
                {!status && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => setWordKnown(prev => ({ ...prev, [i]: 'know' }))}
                      style={{ padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'var(--success)', color: '#fff', fontWeight: 700, fontSize: 11, fontFamily: "'Outfit',sans-serif" }}
                    >I know this</button>
                    <button
                      onClick={() => setWordKnown(prev => ({ ...prev, [i]: 'new' }))}
                      style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid var(--card-b)', cursor: 'pointer', background: 'var(--card)', color: 'var(--subtext)', fontWeight: 700, fontSize: 11, fontFamily: "'Outfit',sans-serif" }}
                    >New to me</button>
                  </div>
                )}
                {status === 'know' && <span style={{ fontSize: 20, flexShrink: 0 }}>✅</span>}
                {status === 'new' && <span style={{ fontSize: 20, flexShrink: 0 }}>📖</span>}
              </div>
            </div>
          );
        })}

        {allChecked && !checkDone && (
          <div style={{ background: 'linear-gradient(135deg,rgba(22,163,74,.1),rgba(21,128,61,.08))', border: '1.5px solid var(--success-b)', borderRadius: 16, padding: '18px 16px', marginTop: 8, marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--success)', marginBottom: 6 }}>
              You recognised {knownCount} / {HERITAGE_WORDS.length} words
            </div>
            <div style={{ fontSize: 13, color: 'var(--subtext)', lineHeight: 1.6, marginBottom: 14 }}>
              {knownCount >= 12
                ? "You're already speaking Croatian — you just need to formalise it. Your passive knowledge is your superpower."
                : knownCount >= 6
                ? "You have a solid foundation from growing up with the language. Let's build on what you know."
                : "Every word you recognise is a head start. You've absorbed more than you think — even from just a few family visits."}
            </div>
            <button
              onClick={() => { setCheckDone(true); visitSection('dialect'); }}
              style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'var(--success)', color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: "'Outfit',sans-serif" }}
            >
              Next: Your Dialect Connection →
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── SECTION 2: DIALECT CONNECTION ─────────────────────────────────────────
  function renderDialect() {
    const chosen = DIALECTS.find(d => d.id === selectedDialect);
    return (
      <div>
        <div style={{ background: 'linear-gradient(135deg,#1e40af,#1d4ed8)', borderRadius: 16, padding: '18px 16px', marginBottom: 20, color: '#fff' }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.7)', marginBottom: 4 }}>Section 2 of 4</div>
          <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Your Dialect Connection</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.85)', lineHeight: 1.5 }}>
            Croatian has 3 major dialects. Your family's region shapes the Croatian you grew up hearing.
          </div>
        </div>

        <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 12, lineHeight: 1.5 }}>
          Which region is your family from? Select the dialect you heard most:
        </div>

        {DIALECTS.map(d => {
          const active = selectedDialect === d.id;
          return (
            <button
              key={d.id}
              onClick={() => {
                setSelectedDialect(d.id);
                try { localStorage.setItem('nh_dialect', d.id); } catch {}
              }}
              style={{
                width: '100%', textAlign: 'left', padding: '14px 16px', borderRadius: 12,
                border: `2px solid ${active ? 'var(--info)' : 'var(--card-b)'}`,
                background: active ? 'var(--info-bg)' : 'var(--card)',
                cursor: 'pointer', marginBottom: 8, fontFamily: "'Outfit',sans-serif",
                transition: 'all .15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 22 }}>{d.icon}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: active ? 'var(--info)' : 'var(--heading)' }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--subtext)' }}>{d.regions}</div>
                </div>
                {active && <span style={{ marginLeft: 'auto', color: 'var(--info)', fontSize: 18, fontWeight: 900 }}>✓</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 4, fontStyle: 'italic' }}>
                Marker word: <strong>{d.marker}</strong> — e.g. "{d.example}"
              </div>
              <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 4, lineHeight: 1.4 }}>{d.note}</div>
            </button>
          );
        })}

        {chosen && (
          <div style={{ background: 'var(--info-bg)', border: '1.5px solid var(--info-b)', borderRadius: 14, padding: '16px', marginTop: 8, marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--info)', marginBottom: 10 }}>
              {chosen.icon} {chosen.name} — Standard Comparisons
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--subtext)', textTransform: 'uppercase' }}>Meaning</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--subtext)', textTransform: 'uppercase' }}>Standard</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--info)', textTransform: 'uppercase' }}>{chosen.name.split(' ')[0]}</div>
            </div>
            {chosen.comparisons.map((c, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, padding: '6px 0', borderTop: i === 0 ? 'none' : '1px solid var(--info-b)' }}>
                <div style={{ fontSize: 11, color: 'var(--subtext)' }}>{c.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--heading)' }}>{c.standard}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--info)' }}>{c.dialect}</div>
              </div>
            ))}
            <button
              onClick={() => visitSection('gaps')}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'var(--info)', color: '#fff', fontWeight: 800, fontSize: 13, fontFamily: "'Outfit',sans-serif", marginTop: 14 }}
            >
              Next: What Do Heritage Speakers Miss? →
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── SECTION 3: GAP ANALYSIS ───────────────────────────────────────────────
  function renderGaps() {
    const rated = Object.keys(gapRatings).length;
    const allRated = rated === GAP_AREAS.length;
    const weakAreas = GAP_AREAS.filter(g => (gapRatings[g.id] || 0) <= 1);

    return (
      <div>
        <div style={{ background: 'linear-gradient(135deg,#5b21b6,#7c3aed)', borderRadius: 16, padding: '18px 16px', marginBottom: 20, color: '#fff' }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.7)', marginBottom: 4 }}>Section 3 of 4</div>
          <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Gap Analysis</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.85)', lineHeight: 1.5 }}>
            Heritage learners have strong listening — but where do you want to improve? Rate your confidence in each area.
          </div>
        </div>

        {GAP_AREAS.map(g => {
          const rating = gapRatings[g.id] || 0;
          return (
            <div key={g.id} style={{ background: 'var(--card)', border: '1.5px solid var(--card-b)', borderRadius: 12, padding: '14px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{g.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--heading)' }}>{g.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 2 }}>{g.desc}</div>
                  <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 3, fontStyle: 'italic', lineHeight: 1.4 }}>{g.weakness}</div>
                </div>
              </div>
              {/* Star rating 1-3 */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--subtext)', fontWeight: 600, marginRight: 4 }}>My confidence:</span>
                {[1, 2, 3].map(v => (
                  <button
                    key={v}
                    onClick={() => setGapRatings(prev => ({ ...prev, [g.id]: v }))}
                    style={{
                      width: 36, height: 36, borderRadius: 8, border: `1.5px solid ${rating >= v ? 'var(--warning)' : 'var(--card-b)'}`,
                      background: rating >= v ? 'rgba(245,158,11,.12)' : 'var(--bar-bg)',
                      cursor: 'pointer', fontSize: 16, fontFamily: "'Outfit',sans-serif",
                      transition: 'all .1s',
                    }}
                  >{rating >= v ? '⭐' : '☆'}</button>
                ))}
                {rating > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--subtext)', marginLeft: 4 }}>
                    {rating === 1 ? 'Needs work' : rating === 2 ? 'Getting there' : 'Pretty good'}
                  </span>
                )}
              </div>
              {/* Recommended modules for weak areas */}
              {rating === 1 && (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {g.modules.map(m => (
                    <button
                      key={m.scr}
                      onClick={() => setScr(m.scr)}
                      style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid var(--info-b)', background: 'var(--info-bg)', color: 'var(--info)', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
                    >
                      {m.label} →
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {allRated && (
          <div style={{ background: 'linear-gradient(135deg,rgba(91,33,182,.08),rgba(124,58,237,.06))', border: '1.5px solid rgba(124,58,237,.25)', borderRadius: 14, padding: '16px', marginTop: 8, marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--heading)', marginBottom: 8 }}>
              {weakAreas.length > 0
                ? `Your priority areas: ${weakAreas.map(a => a.label).join(', ')}`
                : 'Strong foundation! Keep polishing.'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--subtext)', lineHeight: 1.5, marginBottom: 12 }}>
              {weakAreas.length > 0
                ? 'Tap any 1-star area above to go directly to the recommended exercises.'
                : 'You have solid confidence across all areas. Advanced exercises and aspect drills will take you further.'}
            </div>
            <button
              onClick={() => visitSection('baka')}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#5b21b6,#7c3aed)', color: '#fff', fontWeight: 800, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}
            >
              Next: Talking to Your Baka →
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── SECTION 4: BAKA PHRASES ───────────────────────────────────────────────
  function renderBaka() {
    return (
      <div>
        <div style={{ background: 'linear-gradient(135deg,#0f766e,#0d9488)', borderRadius: 16, padding: '18px 16px', marginBottom: 20, color: '#fff' }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.7)', marginBottom: 4 }}>Section 4 of 4</div>
          <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Talking to Your Baka</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.85)', lineHeight: 1.5 }}>
            The phrases diaspora people desperately want for family visits. Tap the speaker to hear pronunciation.
          </div>
        </div>

        {BAKA_PHRASES.map((p, i) => {
          const isSaved = savedPhrases.has(i);
          return (
            <div key={i} style={{ background: 'var(--card)', border: '1.5px solid var(--card-b)', borderRadius: 12, padding: '14px', marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--heading)', marginBottom: 4 }}>{p.hr}</div>
              <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 10 }}>{p.en}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {/* TTS button */}
                <button
                  onClick={() => speak(p.audio)}
                  aria-label={`Play audio: ${p.hr}`}
                  style={{ padding: '8px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', background: 'var(--info)', color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}
                >🔊 Hear it</button>

                {/* Copy button */}
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(p.hr).catch(() => {});
                    setCopyMsg(`Copied: ${p.hr}`);
                    setTimeout(() => setCopyMsg(''), 2500);
                  }}
                  style={{ padding: '8px 12px', borderRadius: 9, border: '1.5px solid var(--card-b)', cursor: 'pointer', background: 'var(--bar-bg)', color: 'var(--subtext)', fontWeight: 700, fontSize: 12, fontFamily: "'Outfit',sans-serif" }}
                >📋 Copy</button>

                {/* Save to my phrases */}
                <button
                  onClick={() => {
                    setSavedPhrases(prev => {
                      const next = new Set(prev);
                      isSaved ? next.delete(i) : next.add(i);
                      try { localStorage.setItem('nh_saved_phrases', JSON.stringify([...next])); } catch {}
                      return next;
                    });
                  }}
                  style={{
                    padding: '8px 12px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: "'Outfit',sans-serif",
                    border: `1.5px solid ${isSaved ? 'var(--success-b)' : 'var(--card-b)'}`,
                    background: isSaved ? 'var(--success-bg)' : 'var(--bar-bg)',
                    color: isSaved ? 'var(--success)' : 'var(--subtext)',
                  }}
                >{isSaved ? '✓ Saved' : '+ Save'}</button>
              </div>
            </div>
          );
        })}

        {copyMsg && (
          <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: 'var(--heading)', color: 'var(--bg)', padding: '10px 20px', borderRadius: 24, fontSize: 13, fontWeight: 700, zIndex: 9999, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
            {copyMsg}
          </div>
        )}

        <button
          onClick={handleComplete}
          style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#0f766e,#059669)', color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: "'Outfit',sans-serif", marginTop: 8, marginBottom: 16 }}
        >
          Complete Heritage Mode Setup ✓
        </button>
      </div>
    );
  }

  // ── DONE STATE ─────────────────────────────────────────────────────────────
  if (section === 'done') {
    return (
      <div className="scr-wrap">
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🇭🇷</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--heading)', marginBottom: 8, fontFamily: "'Playfair Display',serif" }}>
            Heritage Learner
          </div>
          <div style={{ fontSize: 16, color: 'var(--subtext)', marginBottom: 20, lineHeight: 1.6 }}>
            Your Croatian journey continues.
          </div>
          <div style={{
            background: 'linear-gradient(135deg,rgba(7,89,133,.1),rgba(14,116,144,.08))',
            border: '2px solid var(--info-b)', borderRadius: 20, padding: '20px 18px', marginBottom: 24,
          }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--info)', marginBottom: 6 }}>
              🏅 Heritage Learner — Your Croatian journey continues.
            </div>
            <div style={{ fontSize: 13, color: 'var(--subtext)', lineHeight: 1.6 }}>
              You've set up Heritage Mode, assessed your dialect background, identified your learning gaps,
              and saved key phrases for your next family visit. +75 XP earned.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => setScr('learnpath')}
              style={{ padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'var(--info)', color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: "'Outfit',sans-serif" }}
            >
              Start Lessons →
            </button>
            <button
              onClick={goBack}
              style={{ padding: '12px', borderRadius: 12, border: '1.5px solid var(--card-b)', cursor: 'pointer', background: 'var(--card)', color: 'var(--subtext)', fontWeight: 700, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}
            >
              ← Back to Learn
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN LAYOUT ────────────────────────────────────────────────────────────
  return (
    <div className="scr-wrap">
      <button
        className="b bg"
        style={{ marginBottom: 16, fontSize: 13 }}
        onClick={goBack}
      >← Back</button>

      {/* Hero banner */}
      <div style={{ background: 'linear-gradient(135deg,#7c2d12,#9a3412,#c2410c)', borderRadius: 20, padding: '20px 18px', marginBottom: 20, color: '#fff' }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.7)', marginBottom: 4 }}>Heritage Learner Mode</div>
        <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "'Playfair Display',serif", marginBottom: 6, lineHeight: 1.2 }}>
          The Croatian you already know
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.85)', lineHeight: 1.6 }}>
          You grew up with Croatian voices, food, and family. This mode activates what's already there.
        </div>
      </div>

      {/* Progress indicator */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {['check', 'dialect', 'gaps', 'baka'].map(id => (
          <div key={id} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: sectionsVisited.has(id) ? 'var(--info)' : 'var(--bar-bg)',
            transition: 'background .3s',
          }} />
        ))}
      </div>

      <NavTabs />

      {section === 'check' && renderCheck()}
      {section === 'dialect' && renderDialect()}
      {section === 'gaps' && renderGaps()}
      {section === 'baka' && renderBaka()}

      {/* Complete button when all sections visited */}
      {allSectionsVisited && section !== 'done' && (
        <div style={{ marginTop: 8, marginBottom: 24 }}>
          <button
            onClick={handleComplete}
            style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#7c2d12,#c2410c)', color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: "'Outfit',sans-serif" }}
          >
            Complete Setup — Claim 75 XP 🇭🇷
          </button>
        </div>
      )}
    </div>
  );
}
