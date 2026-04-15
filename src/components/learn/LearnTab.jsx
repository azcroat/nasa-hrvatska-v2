import React, { useState } from 'react';
import { V, LEARN_PATH } from '../../data.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useStats } from '../../context/StatsContext.jsx';
import LearnPathWidget from './LearnPathWidget.jsx';
import BrowseContentModal from './BrowseContentModal.jsx';

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
  const { setScr, setTab } = useApp();
  const { stats: st } = useStats();
  const [showBrowse, setShowBrowse] = useState(false);
  const [pendingLesson, setPendingLesson] = useState(null);
  const [showMoreContent, setShowMoreContent] = useState(false);

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

  // Progress toward next CEFR level — shown when ≥50% of the way there
  const cefrToNext = (() => {
    if (!st) return null;
    const { xp = 0, lc = 0, gc = 0 } = st;
    if (cefrLevel === 'A1') {
      const pct = Math.round(Math.min(((xp/100) + (lc/8) + (gc/2)) / 3 * 100, 99));
      if (pct < 50) return null;
      return { next: 'A2', pct, needs: [xp < 100 && `${100-xp} XP`, lc < 8 && `${8-lc} lessons`, gc < 2 && `${2-gc} grammar`].filter(Boolean) };
    }
    if (cefrLevel === 'A2') {
      const pct = Math.round(Math.min(((xp/300) + (lc/15) + (gc/4)) / 3 * 100, 99));
      if (pct < 50) return null;
      return { next: 'B1', pct, needs: [xp < 300 && `${300-xp} XP`, lc < 15 && `${15-lc} lessons`, gc < 4 && `${4-gc} grammar`].filter(Boolean) };
    }
    if (cefrLevel === 'B1') {
      const pct = Math.round(Math.min(((xp/700) + (lc/25) + (gc/6)) / 3 * 100, 99));
      if (pct < 50) return null;
      return { next: 'B2', pct, needs: [xp < 700 && `${700-xp} XP`, lc < 25 && `${25-lc} lessons`, gc < 6 && `${6-gc} grammar`].filter(Boolean) };
    }
    return null;
  })();

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
        {/* Grammar reference is a secondary action — text link keeps the primary CTA dominant */}
        <button
          onClick={() => setScr('grammar-ref')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--info)', fontSize: 'var(--text-sm)', fontWeight: 700,
            fontFamily: "'Outfit',sans-serif", padding: '8px 4px',
            textDecoration: 'underline', textUnderlineOffset: 3,
          }}
        >
          📖 Grammar reference
        </button>
      </div>

      {/* ── CONTINUE LEARNING — jump straight to next item ───────────── */}
      {/* Always the first interactive element so returning users tap once and go */}
      {nextItem && (
        <button
          onClick={() => handleLaunchPathItem(nextItem)}
          style={{
            width: '100%', border: 'none', cursor: 'pointer', padding: 0,
            borderRadius: 18, overflow: 'hidden', marginBottom: 16,
            background: sc.bg,
            boxShadow: '0 6px 24px rgba(0,0,0,.22)',
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 13, flexShrink: 0,
              background: 'rgba(255,255,255,.18)', border: '1.5px solid rgba(255,255,255,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
            }}>{nextItem.icon || '📘'}</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,.65)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 2 }}>
                CONTINUE · {nextItem.stageTitle}
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
                {nextItem.name || nextItem.title || 'Next Lesson'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.65)', marginTop: 2 }}>
                {overallPct}% complete overall · Stage {overallPct < 100 ? stagePct : 100}% done
              </div>
            </div>
            <div style={{
              flexShrink: 0, background: 'rgba(255,255,255,.22)',
              border: '1px solid rgba(255,255,255,.3)', borderRadius: 10,
              padding: '6px 12px', fontSize: 12, fontWeight: 800, color: '#fff',
            }}>Resume →</div>
          </div>
          {/* Progress bar */}
          <div style={{ height: 3, background: 'rgba(0,0,0,.2)' }}>
            <div style={{ height: '100%', background: 'rgba(255,255,255,.55)', width: `${stagePct}%`, transition: 'width .6s' }}/>
          </div>
        </button>
      )}

      {/* ── AI MICRO-LESSON CARD ──────────────────────────────────────── */}
      <button
        onClick={() => setScr('micro_lesson')}
        className="feature-card"
        style={{
          marginBottom: 20,
          border: '1.5px solid #bae6fd',
          background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)',
        }}
      >
        <div className="feature-card-icon" style={{ background: 'linear-gradient(135deg,#0e7490,#0369a1)' }}>🎯</div>
        <div style={{ flex: 1 }}>
          <div className="feature-card-title" style={{ color: '#0c4a6e' }}>AI Micro-Lesson</div>
          <div className="feature-card-desc" style={{ color: '#0369a1' }}>Personalized 5-min lesson from your weak words</div>
        </div>
        <div style={{ fontSize: 18, color: '#0369a1' }}>→</div>
      </button>

      {/* ── ANIMATED LESSONS: PAST + FUTURE TENSE ─────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <button
          onClick={() => setScr('past_tense_lesson')}
          className="feature-card feature-card--col"
          style={{ border: '1.5px solid #bae6fd', background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)' }}
        >
          <div className="feature-card-icon" style={{ background: 'linear-gradient(135deg,#0369a1,#0c4a6e)' }}>⏮️</div>
          <div>
            <div className="feature-card-title" style={{ color: '#0c4a6e' }}>Past Tense</div>
            <div className="feature-card-desc" style={{ color: '#0369a1' }}>L-participle · gender endings · A2</div>
          </div>
        </button>
        <button
          onClick={() => setScr('future_tense_lesson')}
          className="feature-card feature-card--col"
          style={{ border: '1.5px solid #ddd6fe', background: 'linear-gradient(135deg,#faf5ff,#ede9fe)' }}
        >
          <div className="feature-card-icon" style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}>🚀</div>
          <div>
            <div className="feature-card-title" style={{ color: '#4c1d95' }}>Future Tense</div>
            <div className="feature-card-desc" style={{ color: '#7c3aed' }}>ću/ćeš/će · aspect · B1</div>
          </div>
        </button>
      </div>

      {/* ── GRAMMAR TRACK ──────────────────────────────────────────── */}
      <button
        onClick={() => setScr('grammar_track')}
        className="feature-card"
        style={{
          marginBottom: 12,
          border: '1.5px solid #fde68a',
          background: 'linear-gradient(135deg,#fffbeb,#fef3c7)',
        }}
      >
        <div className="feature-card-icon" style={{ background: 'linear-gradient(135deg,#d97706,#92400e)' }}>⚙️</div>
        <div style={{ flex: 1 }}>
          <div className="feature-card-title" style={{ color: '#451a03' }}>Grammar Track A1→B2</div>
          <div className="feature-card-desc" style={{ color: '#92400e' }}>40 units · cases, tenses, aspect &amp; more · alternative to Learn Path</div>
        </div>
        <div style={{ fontSize: 18, color: '#d97706' }}>→</div>
      </button>

      {/* ── GRADED STORIES + PRONUNCIATION COURSE ───────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <button
          onClick={() => setScr('graded_input')}
          className="feature-card feature-card--col"
          style={{ border: '1.5px solid #bbf7d0', background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}
        >
          <div className="feature-card-icon" style={{ background: 'linear-gradient(135deg,#059669,#065f46)' }}>📖</div>
          <div>
            <div className="feature-card-title" style={{ color: '#065f46' }}>Graded Stories</div>
            <div className="feature-card-desc" style={{ color: '#059669' }}>A1–B2 Croatian texts with audio &amp; quiz</div>
          </div>
        </button>
        <button
          onClick={() => setScr('pronunciation_course')}
          className="feature-card feature-card--col"
          style={{ border: '1.5px solid #ddd6fe', background: 'linear-gradient(135deg,#faf5ff,#ede9fe)' }}
        >
          <div className="feature-card-icon" style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}>🗣️</div>
          <div>
            <div className="feature-card-title" style={{ color: '#4c1d95' }}>Pronunciation</div>
            <div className="feature-card-desc" style={{ color: '#7c3aed' }}>Master Č, Š, Ž, LJ, NJ &amp; more</div>
          </div>
        </button>
      </div>

      {/* ── BROWSE MORE — progressive disclosure ────────────────────── */}
      {!showMoreContent && (
        <button
          onClick={() => setShowMoreContent(true)}
          style={{
            width: '100%', border: '1.5px dashed var(--card-b)', background: 'var(--card)',
            borderRadius: 14, padding: '14px 20px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: 'var(--subtext)', fontSize: 'var(--text-sm)', fontWeight: 700,
            fontFamily: "'Outfit',sans-serif", marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 18 }}>✨</span>
          Browse more learning content
          <span style={{ fontSize: 12, color: 'var(--subtext)' }}>(7 more topics)</span>
          <span style={{ fontSize: 14 }}>›</span>
        </button>
      )}

      {/* ── PITCH ACCENT, HERITAGE, PHONEME, PRACTICAL, TOP500 ── hidden until "Browse More" ── */}
      {showMoreContent && (<>
      {/* ── PITCH ACCENT + HERITAGE PATH ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <button
          onClick={() => setScr('pitch_accent')}
          className="feature-card feature-card--col"
          style={{
            background: 'linear-gradient(135deg,#4c1d95,#7c3aed)',
            boxShadow: '0 4px 14px rgba(124,58,237,.3)',
          }}
        >
          <div style={{ fontSize: 28 }}>🎵</div>
          <div>
            <div className="feature-card-title" style={{ color: '#fff' }}>Pitch Accent</div>
            <div className="feature-card-desc" style={{ color: 'rgba(255,255,255,.8)' }}>4 accents · What no other app teaches</div>
          </div>
        </button>
        <button
          onClick={() => setScr('heritage_path')}
          className="feature-card feature-card--col"
          style={{
            background: 'linear-gradient(135deg,#7c2d12,#c2410c)',
            boxShadow: '0 4px 14px rgba(194,65,12,.3)',
          }}
        >
          <div style={{ fontSize: 28 }}>🧬</div>
          <div>
            <div className="feature-card-title" style={{ color: '#fff' }}>Heritage Path</div>
            <div className="feature-card-desc" style={{ color: 'rgba(255,255,255,.8)' }}>Grew up hearing Croatian? Start here.</div>
          </div>
        </button>
      </div>

      {/* ── PHONEME TRAINER + HERITAGE MODE ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => setScr('phoneme_practice')}
          className="feature-card feature-card--col"
          style={{
            background: 'linear-gradient(135deg,#0e7490,#0891b2)',
            boxShadow: '0 4px 14px rgba(14,116,144,.3)',
          }}
        >
          <div style={{ fontSize: 28 }}>🔤</div>
          <div>
            <div className="feature-card-title" style={{ color: '#fff' }}>Phoneme Trainer</div>
            <div className="feature-card-desc" style={{ color: 'rgba(255,255,255,.8)' }}>Č vs Ć · Š Ž LJ NJ · Sound right</div>
          </div>
        </button>
        <button
          onClick={() => setScr('heritage_mode')}
          className="feature-card feature-card--col"
          style={{
            background: 'linear-gradient(135deg,#1e3a5f,#2563eb)',
            boxShadow: '0 4px 14px rgba(37,99,235,.3)',
          }}
        >
          <div style={{ fontSize: 28 }}>🌍</div>
          <div>
            <div className="feature-card-title" style={{ color: '#fff' }}>Heritage Mode</div>
            <div className="feature-card-desc" style={{ color: 'rgba(255,255,255,.8)' }}>Diaspora learner? Identify your gaps</div>
          </div>
        </button>
      </div>

      {/* ── PRACTICAL CROATIAN ──────────────────────────────────────────── */}
      <button
        onClick={() => setScr('practical_croatian')}
        className="feature-card"
        style={{
          background: 'linear-gradient(135deg,#065f46,#059669)',
          boxShadow: '0 4px 14px rgba(5,150,105,.3)',
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 32, flexShrink: 0 }}>🗺️</div>
        <div style={{ flex: 1 }}>
          <div className="feature-card-title" style={{ color: '#fff' }}>Practical Croatian</div>
          <div className="feature-card-desc" style={{ color: 'rgba(255,255,255,.8)' }}>Shop · Doctor · Immigration office · Family visit — 4 real scenarios</div>
        </div>
        <div style={{ marginLeft: 'auto', color: 'rgba(255,255,255,.7)', fontSize: 18 }}>›</div>
      </button>

      {/* ── TOP 500 WORDS ───────────────────────────────────────────────── */}
      <button
        onClick={() => setScr('frequency_track')}
        className="feature-card"
        style={{
          background: 'linear-gradient(135deg,#1e3a5f,#0e7490)',
          boxShadow: '0 4px 14px rgba(14,116,144,.3)',
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 32, flexShrink: 0 }}>📊</div>
        <div style={{ flex: 1 }}>
          <div className="feature-card-title" style={{ color: '#fff' }}>Top 500 Croatian Words</div>
          <div className="feature-card-desc" style={{ color: 'rgba(255,255,255,.8)' }}>Master the words that make up 80% of everyday speech</div>
        </div>
        <div style={{ marginLeft: 'auto', color: 'rgba(255,255,255,.7)', fontSize: 18 }}>›</div>
      </button>

      {/* ── B2 UNLOCK BANNER — shown only when user reaches B2 ──────────── */}
      {cefrLevel === 'B2' && (
        <div style={{
          background: 'linear-gradient(135deg,rgba(124,58,237,.12),rgba(91,33,182,.08))',
          border: '1.5px solid rgba(124,58,237,.35)', borderRadius: 14,
          padding: '12px 16px', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 22 }}>🎓</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#5b21b6' }}>Advanced vocabulary unlocked!</div>
            <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 2 }}>You have reached B2 level. Explore 146 new words across politics, tech, environment &amp; idioms below.</div>
          </div>
        </div>
      )}

      {/* ── B2+ ADVANCED VOCABULARY ─────────────────────────────────────── */}
      <button
        onClick={() => setScr('advanced_vocab')}
        className="feature-card"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
          boxShadow: '0 4px 14px rgba(124,58,237,.35)',
          marginBottom: 20,
          color: 'white',
          border: 'none',
        }}
      >
        <div style={{ fontSize: 32, flexShrink: 0 }}>🎓</div>
        <div style={{ flex: 1 }}>
          <div className="feature-card-title" style={{ color: '#fff' }}>B2+ Vocabulary</div>
          <div className="feature-card-desc" style={{ color: 'rgba(255,255,255,.8)' }}>Advanced themes: politics, tech, environment, idioms</div>
        </div>
        <div style={{ marginLeft: 'auto', color: 'rgba(255,255,255,.7)', fontSize: 18 }}>›</div>
      </button>
      </>)}

      {/* ── PATH WIDGET ─────────────────────────────────────────────────── */}
      <LearnPathWidget
        sc={sc}
        currentStage={currentStage}
        currentStageDone={currentStageDone}
        overallPct={overallPct}
        stagePct={stagePct}
        totalDone={totalDone}
        totalItems={totalItems}
        nextItem={nextItem}
        cefrLevel={cefrLevel}
        cefrPct={cefrPct}
        setScr={setScr}
        setTab={setTab}
        st={st}
        handleLaunchPathItem={handleLaunchPathItem}
      />

      {/* ── VOCABULARY QUICK ACCESS ─────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
          Quick Vocab — Tap to start
        </div>
        <div className="scroll-fade-wrap">
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto', padding: '0 0 6px',
          scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
        }}>
          {[
            { cat: 'greetings', icon: '👋', label: 'Greetings',  color: '#0e7490', bg: 'rgba(14,116,144,.1)',  border: 'rgba(14,116,144,.3)'  },
            { cat: 'family',    icon: '👨‍👩‍👧', label: 'Family',     color: '#059669', bg: 'rgba(5,150,105,.1)',   border: 'rgba(5,150,105,.3)'   },
            { cat: 'food',      icon: '🍽️', label: 'Food',       color: '#d97706', bg: 'rgba(217,119,6,.1)',   border: 'rgba(217,119,6,.3)'   },
            { cat: 'travel',    icon: '✈️', label: 'Travel',     color: '#7c3aed', bg: 'rgba(124,58,237,.1)',  border: 'rgba(124,58,237,.3)'  },
            { cat: 'numbers',   icon: '🔢', label: 'Numbers',    color: '#dc2626', bg: 'rgba(220,38,38,.1)',   border: 'rgba(220,38,38,.3)'   },
            { cat: 'body',      icon: '🫀', label: 'Body',       color: '#0891b2', bg: 'rgba(8,145,178,.1)',   border: 'rgba(8,145,178,.3)'   },
            { cat: 'colors',    icon: '🎨', label: 'Colors',     color: '#7c3aed', bg: 'rgba(124,58,237,.1)',  border: 'rgba(124,58,237,.3)'  },
            { cat: 'nature',    icon: '🌿', label: 'Nature',     color: '#059669', bg: 'rgba(5,150,105,.1)',   border: 'rgba(5,150,105,.3)'   },
            { cat: 'verbs',     icon: '💪', label: 'Verbs',      color: '#d97706', bg: 'rgba(217,119,6,.1)',   border: 'rgba(217,119,6,.3)'   },
            { cat: 'emotions',  icon: '😊', label: 'Emotions',   color: '#dc2626', bg: 'rgba(220,38,38,.1)',   border: 'rgba(220,38,38,.3)'   },
          ].filter(item => (V[item.cat] || []).length > 0).map(item => (
            <button
              key={item.cat}
              onClick={() => launchVocab(item.cat)}
              className="vocab-pill"
              style={{ background: item.bg, border: `1.5px solid ${item.border}` }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <div className="vocab-pill-label" style={{ color: item.color }}>{item.label}</div>
                <div className="vocab-pill-count">{(V[item.cat] || []).length} words</div>
              </div>
            </button>
          ))}
        </div>
        </div>{/* end scroll-fade-wrap */}
      </div>

      {/* ── GOAL-BASED STAGE 1 FOCUS ────────────────────────────────── */}
      {(() => {
        const goal = localStorage.getItem('nh_goal');
        if (!goal || (currentStage && currentStage.level > 2)) return null;
        const GOAL_STAGE1 = {
          heritage: {
            label: 'Heritage & Roots Path', icon: '🇭🇷', color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'var(--warning-b)',
            tips: ['Start with Basic Greetings — the same words your grandparents use','Then Family Words — mama, tata, baka, djed','Then explore Croatian History in the Croatia tab'],
            first: 'lp1',
          },
          family: {
            label: 'Speaking with Family Path', icon: '👨‍👩‍👧', color: 'var(--info)', bg: 'var(--info-bg)', border: 'var(--info-b)',
            tips: ['Start with Basic Greetings — "Bog!", "Kako si?"','Then Family Words — the vocabulary your family uses','Then try Speaking practice to build confidence'],
            first: 'lp1',
          },
          travel: {
            label: 'Travel to Croatia Path', icon: '✈️', color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-b)',
            tips: ['Start with Basic Greetings for daily interactions','Then Get Around (Transport) — buses, taxis, directions','Then Order Food — restaurants and cafés'],
            first: 'lp5',
          },
          culture: {
            label: 'Croatian Culture Path', icon: '📖', color: 'var(--lavender)', bg: 'var(--info-bg)', border: 'var(--card-b)',
            tips: ['Start with Basic Greetings and Numbers','Then explore the Croatia tab — music, history, cities','Then Texting & Slang — how Croatians actually talk'],
            first: 'lp1',
          },
          fluent: {
            label: 'Fluency Track', icon: '🗣️', color: 'var(--info)', bg: 'var(--info-bg)', border: 'var(--info-b)',
            tips: ['Follow the full Learn Path in order — every stage matters','Prioritize Grammar alongside vocabulary from day one','Use Dialogue Sim and Speaking Practice every session'],
            first: 'lp1',
          },
        };
        const gf = GOAL_STAGE1[goal];
        if (!gf) return null;
        return (
          <div style={{ background: gf.bg, border: `1.5px solid ${gf.border}`, borderRadius: 16, padding: '16px 18px', marginBottom: 20 }}>
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

      {/* ── STAGE 4: B1+ EXPLORER PANEL — appears when user reaches Explorer stage ── */}
      {currentStage?.level === 4 && (
        <div style={{
          background: 'linear-gradient(135deg,#fffbeb,#fef3c7)',
          border: '1.5px solid #fde68a', borderRadius: 18,
          padding: '16px 18px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 26 }}>🗺️</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#78350f' }}>B1 Explorer — New content unlocked!</div>
              <div style={{ fontSize: 12, color: '#92400e', marginTop: 2 }}>You've reached the intermediate tier. Explore what's available to you.</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
            {[
              { icon: '🎭', label: 'Aspect Drill', sub: 'Perfective vs imperfective', scr: 'aspectdrill', bg: 'linear-gradient(135deg,#7c3aed,#5b21b6)' },
              { icon: '⚙️', label: 'Grammar Map', sub: 'Navigate all grammar', scr: 'grammarmap', bg: 'linear-gradient(135deg,#d97706,#92400e)' },
              { icon: '📖', label: 'B1 Stories', sub: 'Graded reading + audio', scr: 'graded_input', bg: 'linear-gradient(135deg,#059669,#065f46)' },
              { icon: '🗣️', label: 'Speaking', sub: 'Train spoken output', scr: 'speaking', bg: 'linear-gradient(135deg,#0e7490,#0369a1)' },
              { icon: '✍️', label: 'Production', sub: 'Sentence drills', scr: 'production_drill', bg: 'linear-gradient(135deg,#dc2626,#991b1b)' },
            ].map(item => (
              <button
                key={item.scr}
                onClick={() => setScr(item.scr)}
                style={{
                  flexShrink: 0, width: 112, padding: '12px 10px', borderRadius: 14,
                  border: 'none', cursor: 'pointer', textAlign: 'center',
                  background: item.bg, fontFamily: "'Outfit',sans-serif",
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}
              >
                <span style={{ fontSize: 26 }}>{item.icon}</span>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{item.label}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.75)', lineHeight: 1.3 }}>{item.sub}</div>
              </button>
            ))}
          </div>
        </div>
      )}

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
            fontSize:'var(--text-sm)', fontWeight:900,
            color: cefrLevel === 'B2' ? '#fff' : cefrLevel === 'B1' ? '#fff' : cefrLevel === 'A2' ? '#fff' : '#fff',
            background: cefrLevel === 'B2' ? '#14532d' : cefrLevel === 'B1' ? 'var(--info)' : cefrLevel === 'A2' ? 'var(--warning-dark,#92400e)' : 'var(--subtext)',
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
            <div key={l} style={{ fontSize:'var(--text-xs)', fontWeight:700, color: cefrLevel === l ? 'var(--heading)' : 'var(--subtext)' }}>{l}</div>
          ))}
        </div>
        {/* Near-milestone teaser — shown when ≥50% toward next CEFR level */}
        {cefrToNext && (
          <div style={{
            marginTop: 10, padding: '10px 12px', borderRadius: 10,
            background: cefrToNext.next === 'B1' ? 'rgba(14,116,144,.08)' : cefrToNext.next === 'B2' ? 'rgba(5,150,105,.08)' : 'rgba(124,58,237,.08)',
            border: cefrToNext.next === 'B1' ? '1px solid rgba(14,116,144,.25)' : cefrToNext.next === 'B2' ? '1px solid rgba(5,150,105,.25)' : '1px solid rgba(124,58,237,.25)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>🎯</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--heading)', marginBottom: 4 }}>
                {cefrToNext.pct}% toward {cefrToNext.next} — almost there!
              </div>
              <div style={{ height: 5, background: 'var(--bar-bg)', borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{ height: '100%', width: `${cefrToNext.pct}%`, borderRadius: 4, transition: 'width .6s', background: cefrToNext.next === 'B1' ? 'var(--info)' : cefrToNext.next === 'B2' ? 'var(--success)' : '#7c3aed' }} />
              </div>
              {cefrToNext.needs.length > 0 && (
                <div style={{ fontSize: 11, color: 'var(--subtext)', fontWeight: 600 }}>
                  Still need: {cefrToNext.needs.join(' · ')}
                </div>
              )}
            </div>
          </div>
        )}
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
        <BrowseContentModal
          allCats={allCats}
          icons={icons}
          st={st}
          setScr={setScr}
          sCurEx={sCurEx}
          sGl={sGl}
          sGp={sGp}
          sGx={sGx}
          sGs={sGs}
          sGa={sGa}
          sGsl={sGsl}
          launchVocab={launchVocab}
          launchAnimLesson={launchAnimLesson}
          onClose={() => setShowBrowse(false)}
        />
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
