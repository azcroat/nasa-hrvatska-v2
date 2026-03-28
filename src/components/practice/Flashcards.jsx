import React, { useState, useRef, useEffect } from 'react';
import { H, Bar, srMark } from '../../data.jsx';
import CroatianKnight from '../shared/CroatianKnight';
import confetti from 'canvas-confetti';
import { speak } from '../../lib/audio.js';

// Fetch AI-generated contextual image for a vocabulary word via FLUX
async function fetchCardImage(word, meaning, cacheRef, signal) {
  const key = `img:${word}`;
  if (cacheRef.current[key]) return cacheRef.current[key];
  // Check sessionStorage to avoid re-generating across card navigation
  try {
    const stored = sessionStorage.getItem(`nh_fc_img_${word}`);
    if (stored) { cacheRef.current[key] = stored; return stored; }
  } catch {}
  try {
    const r = await fetch('/api/flux-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'vocab', word, meaning }),
      signal,
    });
    if (!r.ok) return null;
    const { imageUrl } = await r.json();
    if (imageUrl) {
      cacheRef.current[key] = imageUrl;
      try { sessionStorage.setItem(`nh_fc_img_${word}`, imageUrl); } catch {}
    }
    return imageUrl || null;
  } catch { return null; }
}

const STILL_LEARNING_MSG_DURATION = 1200;

// ── Pronunciation engine ──────────────────────────────────────────────────────
// Converts Croatian text to a simple English phonetic approximation.
// Multi-character digraphs are handled first (order matters).
function getPronunciation(word) {
  if (!word) return '';
  // Work on lowercase; preserve original casing intent via replacement
  let s = word;
  // Digraphs first
  s = s.replace(/[Dd][žŽ]/g, 'j');  // dž = /dʒ/ like 'j' in "jeans"
  s = s.replace(/[Ll][jJ]/g, 'ly');
  s = s.replace(/[Nn][jJ]/g, 'ny');
  // Single special characters
  s = s.replace(/[čČ]/g, 'ch');     // č = /tʃ/ like 'ch' in "church"
  s = s.replace(/[ćĆ]/g, 'ty');    // ć = /tɕ/ palatalized, softer than č; 'ty' approximation
  s = s.replace(/[šŠ]/g, 'sh');
  s = s.replace(/[žŽ]/g, 'zh');
  s = s.replace(/[đĐ]/g, 'dj');    // đ = /dʑ/ palatalized d, voiced counterpart of ć
  s = s.replace(/[jJ]/g, 'y');
  s = s.replace(/[cC]/g, 'ts');
  // Roll indicator — mark r before vowel or in consonant cluster
  s = s.replace(/[rR]/g, 'r');
  return s;
}

// ── Word-type contextual tip ──────────────────────────────────────────────────
// Derive a simple tip from the Croatian word when no example sentence exists.
function getWordTip(croatianWord, englishMeaning) {
  if (!croatianWord || !englishMeaning) return null;
  const w = croatianWord.trim();
  const en = englishMeaning.toLowerCase();

  // Verb detection: English starts with "to " or Croatian ends in -ti / -ći
  const isVerb = en.startsWith('to ') || /[tć]i$/i.test(w);
  if (isVerb) {
    // Strip infinitive suffix to hint at stem
    const stem = w.replace(/[tć]i$/i, '');
    return { type: 'verb', hr: `${w} → ${stem}im / ${stem}iš`, en: 'infinitive → I / you (present)' };
  }

  // Adjective: English is common adjective word and Croatian ends in -i/-a/-o
  const adjEndings = /[iao]$/i;
  const adjKeywords = ['good','bad','big','small','happy','sad','beautiful','old','new','fast','slow','hard','easy','hot','cold','long','short','young','old','free','full','empty','dark','light','heavy','clean','dirty'];
  const looksAdj = adjEndings.test(w) && adjKeywords.some(k => en.includes(k));
  if (looksAdj) {
    return { type: 'adj', hr: null, en: 'Agrees with noun gender (m./f./n.)' };
  }

  // Noun gender: Croatian nouns ending in consonant = m., -a = f., -o/-e = n.
  const lastChar = w.replace(/[!?,.'"-]/g, '').slice(-1).toLowerCase();
  let gender = null;
  if (/[aá]/.test(lastChar)) gender = 'f.';
  else if (/[oe]/.test(lastChar)) gender = 'n.';
  else if (/[bcčćdfghjklmnprsštvzž]/.test(lastChar)) gender = 'm.';

  if (gender) {
    const labels = { 'm.': 'masculine', 'f.': 'feminine', 'n.': 'neuter' };
    return { type: 'noun', gender, en: `${labels[gender]} noun` };
  }

  return null;
}

const XP_PER_KNOWN = 2;
const XP_COMPLETION_BONUS = 5;

export default function Flashcards({ pool, goBack, award }) {
  const finishFired = useRef(false);
  const [activePool, setActivePool] = useState(pool);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [missed, setMissed] = useState([]);
  const [done, setDone] = useState(false);
  const [correctAnim, setCorrectAnim] = useState(false);
  const [wrongAnim, setWrongAnim] = useState(false);
  const [showStillLearning, setShowStillLearning] = useState(false);
  const [sparkPos, setSparkPos] = useState(null);
  const [exiting, setExiting] = useState(false);
  const [entering, setEntering] = useState(false);
  const cardRef = useRef(null);
  const knowBtnRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const mountedRef = useRef(true);
  // Auto-TTS: track last spoken word to prevent double-play
  const lastSpokenRef = useRef(null);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const [aiSentence, setAiSentence] = useState(null); // {hr, en, note} or null
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);
  const aiCacheRef = useRef({}); // {word: {hr, en, note}}

  // AI image state — one image per card (fetched on card mount, shown on front)
  const [cardImg, setCardImg] = useState(null);
  const [cardImgLoading, setCardImgLoading] = useState(false);
  const imgCacheRef = useRef({});

  // Reset AI state when card index changes
  useEffect(() => {
    setAiSentence(null);
    setAiLoading(false);
    setAiError(false);
  }, [idx]);

  // Fetch contextual image when card changes
  useEffect(() => {
    if (done) return;
    const card = activePool[idx];
    if (!card) return;
    const word = card[0];
    const meaning = card[1];
    const key = `img:${word}`;
    // Use cached immediately if available
    if (imgCacheRef.current[key]) { setCardImg(imgCacheRef.current[key]); return; }
    const controller = new AbortController();
    setCardImg(null);
    setCardImgLoading(true);
    fetchCardImage(word, meaning, imgCacheRef, controller.signal).then(url => {
      if (!mountedRef.current) return;
      setCardImg(url || null);
      setCardImgLoading(false);
    });
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, done]);

  // Fetch AI example sentence when card is flipped and no static example exists
  useEffect(() => {
    if (!flipped || done) return;
    const card = activePool[idx];
    if (!card) return;
    const word = card[0];
    const meaning = card[1];
    // Only fetch if no static example
    if (card[3]) return;
    // Check session cache
    if (aiCacheRef.current[word]) {
      setAiSentence(aiCacheRef.current[word]);
      return;
    }
    // Fetch from API
    const level = localStorage.getItem('nh_level') || 'B1';
    setAiSentence(null);
    setAiLoading(true);
    setAiError(false);
    const controller = new AbortController();
    fetch('/api/flash-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, meaning, level }),
      signal: controller.signal,
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        if (!mountedRef.current) return;
        const sentence = { hr: data.hr, en: data.en, note: data.note || null };
        aiCacheRef.current[word] = sentence;
        setAiSentence(sentence);
        setAiLoading(false);
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setAiLoading(false);
        setAiError(true);
      });
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, idx, done]);

  // When buttons appear (card flipped), focus "I Know It" so keyboard users can act
  useEffect(() => {
    if (flipped && knowBtnRef.current) knowBtnRef.current.focus();
  }, [flipped]);

  // When a new card loads, return focus to the card
  useEffect(() => {
    if (!flipped && !done && cardRef.current) cardRef.current.focus();
  }, [idx, flipped, done]);

  // Auto-TTS on flip: speak Croatian word 300ms after card is flipped front→back
  useEffect(() => {
    if (!flipped || done) return;
    const autoTTS = localStorage.getItem('nh_autotts') !== 'false'; // default on
    if (!autoTTS) return;
    const word = activePool[idx] && activePool[idx][0];
    if (!word) return;
    const key = `${idx}:${word}`;
    if (lastSpokenRef.current === key) return;
    lastSpokenRef.current = key;
    const t = setTimeout(() => {
      if (mountedRef.current) speak(word);
    }, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, idx]);

  function finish(finalKnown) {
    if (finishFired.current) return;
    finishFired.current = true;
    award(finalKnown * XP_PER_KNOWN + XP_COMPLETION_BONUS);
    setDone(true);
    if (finalKnown === activePool.length) {
      setTimeout(() => confetti({
        particleCount: 60,
        spread: 70,
        origin: { x: 0.5, y: 0.4 },
        colors: ['#f59e0b', '#16a34a', '#0e7490', '#b61800', '#ffffff'],
        ticks: 150,
      }), 300);
    }
  }

  function studyMissedAgain(missedCards) {
    finishFired.current = false;
    setActivePool(missedCards);
    setIdx(0);
    setFlipped(false);
    setKnown(0);
    setMissed([]);
    setDone(false);
  }

  // ── RESULT SCREEN ──
  if (done) {
    const knownCount = activePool.length - missed.length;
    const missedCount = missed.length;
    const totalFlipped = activePool.length;
    const accuracy = totalFlipped > 0 ? knownCount / totalFlipped : 0;
    let difficultyRec = null;
    if (accuracy < 0.5) {
      difficultyRec = 'Try the basic vocabulary exercises to build your foundation 💪';
    } else if (accuracy >= 0.8) {
      difficultyRec = "You're ready for harder content — try Grammar exercises! 🎯";
    }
    return (
      <div className="scr-wrap">
        <div style={{textAlign:"center",padding:"40px 20px 20px"}}>
          <CroatianKnight
            size={80}
            mood={missedCount === 0 ? 'celebrating' : 'happy'}
            style={{margin:'0 auto 12px', display:'block'}}
          />
          <div style={{fontSize:64}}>{missedCount === 0 ? "🌟" : "🎉"}</div>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"var(--heading)",marginTop:12}}>
            {missedCount === 0 ? "Perfect round!" : "Round complete!"}
          </h3>
          <p style={{color:"var(--subtext)",marginTop:6,fontSize:14}}>
            Known: <strong style={{color:"var(--success)"}}>{knownCount}</strong>
            {missedCount > 0 && <> · Still learning: <strong style={{color:"#f59e0b"}}>{missedCount}</strong></>}
            {' '}/ {activePool.length}
          </p>
          <div style={{fontSize:'var(--text-2xl)', fontWeight:900, color:'#fbbf24', marginTop:8}}>
            +{knownCount * 2 + 5} XP
          </div>
          <div style={{fontSize:'var(--text-sm)', color:'var(--subtext)', marginTop:4}}>
            {missedCount === 0 ?
              '🌟 Perfect! Ready for new words.' :
              `${missedCount} card${missedCount !== 1 ? 's' : ''} need review — they'll come back tomorrow`
            }
          </div>
          {difficultyRec && (
            <div style={{
              marginTop:16,
              padding:'10px 16px',
              background: accuracy >= 0.8 ? 'rgba(22,163,74,0.08)' : 'rgba(245,158,11,0.08)',
              border: `1px solid ${accuracy >= 0.8 ? 'rgba(22,163,74,0.25)' : 'rgba(245,158,11,0.25)'}`,
              borderRadius:12,
              fontSize:13,
              fontWeight:600,
              color: accuracy >= 0.8 ? 'var(--success)' : '#92400e',
              lineHeight:1.5,
            }}>
              {difficultyRec}
            </div>
          )}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,padding:"0 0 20px"}}>
          {missed.length > 0 && (
            <button className="b bp" style={{width:"100%"}} onClick={() => studyMissedAgain(missed)}>
              📖 Study {missed.length} missed {missed.length === 1 ? "card" : "cards"} again
            </button>
          )}
          <button className={missed.length > 0 ? "b bg" : "b bp"} style={{width:"100%"}} onClick={goBack}>
            {missed.length === 0 ? "Continue →" : "← Done for now"}
          </button>
        </div>
      </div>
    );
  }

  function advanceCard(direction, callback) {
    setExiting(direction);
    setTimeout(() => {
      if (!mountedRef.current) return;
      setExiting(false);
      callback();
      setEntering(true);
      setTimeout(() => {
        if (!mountedRef.current) return;
        setEntering(false);
      }, 220);
    }, 180);
  }

  function handleStillLearning() {
    const q = 2;
    const correct = q >= 3;
    srMark(activePool[idx][0], correct);
    setWrongAnim(true);
    setTimeout(() => { if (mountedRef.current) setWrongAnim(false); }, 400);
    setShowStillLearning(true);
    setTimeout(() => { if (mountedRef.current) setShowStillLearning(false); }, STILL_LEARNING_MSG_DURATION);
    const currentIdx = idx;
    const currentKnown = known;
    const currentCard = activePool[idx];
    advanceCard('left', () => {
      setMissed(m => [...m, currentCard]);
      setFlipped(false);
      if (currentIdx < activePool.length - 1) { setIdx(currentIdx + 1); }
      else { finish(currentKnown); }
    });
  }

  function handleKnown() {
    setSparkPos({ x: 50, y: 50 });
    setTimeout(() => { if (mountedRef.current) setSparkPos(null); }, 700);
    const q = 4;
    const correct = q >= 3;
    srMark(activePool[idx][0], correct);
    setCorrectAnim(true);
    setTimeout(() => { if (mountedRef.current) setCorrectAnim(false); }, 500);
    const newKnown = known + 1;
    const currentIdx = idx;
    advanceCard('right', () => {
      setKnown(newKnown);
      setFlipped(false);
      if (currentIdx < activePool.length - 1) { setIdx(currentIdx + 1); }
      else { finish(newKnown); }
    });
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    touchStartX.current = null;
    touchStartY.current = null;

    if (absDx < 20 && absDy < 20) return; // too short, ignore

    if (absDy > absDx && dy < -40 && !flipped) {
      // Swipe up = flip card
      setFlipped(true);
      return;
    }

    if (absDx > absDy && flipped) {
      if (dx > 60) {
        handleKnown(); // swipe right = I know it
      } else if (dx < -60) {
        handleStillLearning(); // swipe left = still learning
      }
    }
  };

  // Empty pool (or exhausted) — show celebratory done state
  if (!activePool[idx]) {
    return (
      <div className="scr-wrap">
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <CroatianKnight
            size={90}
            mood="celebrating"
            style={{ margin: '0 auto 16px', display: 'block' }}
          />
          <div style={{ fontSize: 52 }}>🎉</div>
          <h3 style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 22,
            color: 'var(--heading)',
            marginTop: 12,
          }}>
            All caught up!
          </h3>
          <p style={{
            color: 'var(--subtext)',
            marginTop: 8,
            fontSize: 14,
            lineHeight: 1.6,
          }}>
            No more cards due right now.<br/>Come back tomorrow for your next review session.
          </p>
          <button className="b bp" style={{ marginTop: 20, width: '100%' }} onClick={goBack}>
            Continue →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="scr-wrap" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {H("🃏 Flashcards","Tap card to flip, then choose below.")}
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <span key={idx} className="anim-fade-up" style={{fontSize:14,fontWeight:700}}>{idx+1} / {activePool.length}</span>
        <div style={{fontSize:14,fontWeight:700,color:"var(--success)"}}>✅ Know: {known}</div>
      </div>
      <Bar v={idx+1} mx={activePool.length} h={6} color="#f59e0b" />
      <div
        className={`fc-scene${correctAnim ? ' anim-bounce-in' : ''}${wrongAnim ? ' anim-wrong' : ''}${exiting === 'right' ? ' slide-out-left' : ''}${exiting === 'left' ? ' slide-out-right' : ''}${entering ? ' slide-in-right' : ''}`}
        style={{ position: 'relative' }}
      >
        <div
          ref={cardRef}
          className={`fc-card${flipped?" flipped":""}`}
          onClick={()=>setFlipped(f=>!f)}
          onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setFlipped(f=>!f);}}}
          role="button"
          tabIndex={0}
          aria-label={flipped ? `${activePool[idx][1]} — tap to flip back` : `${activePool[idx][0]} — tap to see English`}
        >
          <div className="fc-face fc-front" style={{ padding: 0, overflow: 'hidden', borderRadius: 'inherit' }}>
            {/* AI contextual scene image */}
            <div style={{
              width: '100%', height: 130, position: 'relative', flexShrink: 0, overflow: 'hidden',
              background: cardImgLoading
                ? 'linear-gradient(135deg,rgba(14,116,144,.08),rgba(14,116,144,.04))'
                : cardImg
                  ? undefined
                  : 'linear-gradient(135deg,rgba(14,116,144,.06),rgba(12,74,110,.10))',
            }}>
              {cardImg && (
                <img
                  src={cardImg}
                  alt=""
                  aria-hidden="true"
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    display: 'block',
                  }}
                />
              )}
              {cardImgLoading && !cardImg && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 4,
                }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: 'var(--info)', opacity: 0.4,
                      animation: `dot-bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
                    }} />
                  ))}
                </div>
              )}
              {!cardImg && !cardImgLoading && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 36, opacity: 0.18,
                }}>🇭🇷</div>
              )}
              {/* Bottom gradient fade into card */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 50,
                background: 'linear-gradient(to bottom, transparent, var(--card))',
                pointerEvents: 'none',
              }} />
              {/* AI badge */}
              {cardImg && (
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
                  borderRadius: 20, padding: '2px 8px',
                  fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: '.04em',
                }}>✦ AI</div>
              )}
            </div>

            {/* Word / fill-in-the-blank content */}
            <div style={{ padding: '8px 20px 16px', textAlign: 'center' }}>
              {(() => {
                const word = activePool[idx][0];
                const example = activePool[idx][3];
                const blankedExample = example ? example.replace(new RegExp(word, 'gi'), '___') : null;
                return blankedExample ? (
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:11, color:'var(--subtext)', marginBottom:8, fontWeight:600}}>Fill in the blank:</div>
                    <div style={{fontSize:17, fontWeight:700, color:'var(--heading)', lineHeight:1.5}}>{blankedExample}</div>
                  </div>
                ) : (
                  <>
                    <div style={{fontSize:30,fontWeight:800,color:"var(--info)",fontFamily:"'Playfair Display',serif",textAlign:"center",lineHeight:1.3}}>
                      {word}
                    </div>
                    {activePool[idx][2]&&<div style={{fontSize:14,color:"var(--subtext)",marginTop:6}}>/{activePool[idx][2]}/</div>}
                  </>
                );
              })()}
              <div style={{fontSize:12,color:"var(--subtext)",marginTop:10}}>tap to see English</div>
            </div>
          </div>
          <div className="fc-face fc-back">
            <div style={{fontSize:14,color:"var(--subtext)",marginTop:4,textAlign:"center",fontWeight:700}}>{activePool[idx][1]}</div>

            {/* Pronunciation pill + speak button */}
            {(() => {
              const croatianWord = activePool[idx][0];
              const phonetic = getPronunciation(croatianWord);
              // Only show if phonetic differs from the original (i.e. has special chars)
              const hasSpecial = croatianWord !== phonetic;
              return hasSpecial ? (
                <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:8, flexWrap:'wrap'}}>
                  <span style={{
                    background:'var(--bar-bg)',
                    borderRadius:20,
                    padding:'4px 12px',
                    fontSize:12,
                    color:'var(--subtext)',
                    fontStyle:'italic',
                    letterSpacing:'0.02em',
                  }}>
                    🔊 {phonetic}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); speak(croatianWord); }}
                    aria-label={`Hear pronunciation of ${croatianWord}`}
                    style={{
                      background:'var(--bar-bg)',
                      border:'none',
                      borderRadius:20,
                      padding:'4px 10px',
                      fontSize:13,
                      cursor:'pointer',
                      color:'var(--info)',
                      fontWeight:700,
                      lineHeight:1,
                    }}
                    title="Hear it"
                  >▶</button>
                </div>
              ) : (
                <div style={{display:'flex', alignItems:'center', justifyContent:'center', marginTop:8}}>
                  <button
                    onClick={e => { e.stopPropagation(); speak(croatianWord); }}
                    aria-label={`Hear pronunciation of ${croatianWord}`}
                    style={{
                      background:'var(--bar-bg)',
                      border:'none',
                      borderRadius:20,
                      padding:'4px 14px',
                      fontSize:13,
                      cursor:'pointer',
                      color:'var(--info)',
                      fontWeight:700,
                    }}
                    title="Hear it"
                  >🔊 Hear it</button>
                </div>
              );
            })()}

            {/* Example sentence or contextual tip */}
            {(() => {
              const card = activePool[idx];
              const croatianWord = card[0];
              const englishMeaning = card[1];
              const exampleSentence = card[3]; // index 3 = example sentence in data

              if (exampleSentence) {
                return (
                  <div style={{
                    background:'var(--bar-bg)',
                    borderRadius:10,
                    padding:'10px 12px',
                    marginTop:8,
                    textAlign:'left',
                  }}>
                    <p style={{
                      fontSize:12,
                      fontStyle:'italic',
                      color:'var(--body)',
                      margin:0,
                      lineHeight:1.5,
                    }}>
                      "{exampleSentence}"
                    </p>
                  </div>
                );
              }

              // Fallback: contextual tip
              const tip = getWordTip(croatianWord, englishMeaning);
              if (!tip) return null;

              if (tip.type === 'verb') {
                return (
                  <div style={{
                    background:'var(--bar-bg)',
                    borderRadius:10,
                    padding:'10px 12px',
                    marginTop:8,
                    textAlign:'left',
                  }}>
                    <div style={{fontSize:11,fontWeight:700,color:'var(--subtext)',marginBottom:3,textTransform:'uppercase',letterSpacing:'0.05em'}}>Verb forms</div>
                    <div style={{fontSize:12,fontStyle:'italic',color:'var(--body)',lineHeight:1.5}}>{tip.hr}</div>
                    <div style={{fontSize:11,color:'var(--subtext)',marginTop:2}}>{tip.en}</div>
                  </div>
                );
              }

              if (tip.type === 'adj') {
                return (
                  <div style={{
                    background:'var(--bar-bg)',
                    borderRadius:10,
                    padding:'10px 12px',
                    marginTop:8,
                    textAlign:'center',
                  }}>
                    <div style={{fontSize:11,color:'var(--subtext)',lineHeight:1.5}}>{tip.en}</div>
                  </div>
                );
              }

              if (tip.type === 'noun' && tip.gender) {
                const genderColor = tip.gender === 'm.' ? '#3b82f6' : tip.gender === 'f.' ? '#ec4899' : '#a855f7';
                return (
                  <div style={{
                    display:'flex',
                    justifyContent:'center',
                    marginTop:8,
                  }}>
                    <span style={{
                      background: genderColor + '20',
                      border: `1px solid ${genderColor}50`,
                      borderRadius:8,
                      padding:'4px 12px',
                      fontSize:12,
                      fontWeight:700,
                      color: genderColor,
                    }}>
                      {tip.gender} {tip.en}
                    </span>
                  </div>
                );
              }

              return null;
            })()}

            {/* AI-generated example sentence */}
            {!activePool[idx][3] && (
              <div style={{
                marginTop: 12,
                padding: '10px 14px',
                background: 'rgba(14,116,144,0.07)',
                borderRadius: 12,
                border: '1px solid rgba(14,116,144,0.18)',
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#0e7490', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  ✨ AI Example
                </div>
                {aiLoading && (
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center', padding: '4px 0' }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#0e7490', opacity: 0.5, animation: `dot-bounce 1.2s ease-in-out ${i*0.15}s infinite` }} />
                    ))}
                  </div>
                )}
                {!aiLoading && aiSentence && (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--heading)', lineHeight: 1.5 }}>{aiSentence.hr}</div>
                    <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 3, fontStyle: 'italic' }}>{aiSentence.en}</div>
                    {aiSentence.note && (
                      <div style={{ fontSize: 11, color: '#0e7490', marginTop: 4, fontWeight: 600 }}>📌 {aiSentence.note}</div>
                    )}
                  </>
                )}
                {!aiLoading && aiError && (
                  <div style={{ fontSize: 12, color: 'var(--subtext)', fontStyle: 'italic' }}>Example unavailable</div>
                )}
              </div>
            )}

            <div style={{fontSize:12,color:"var(--subtext)",marginTop:10}}>tap to flip back</div>
          </div>
        </div>
        {sparkPos && (
          <div style={{ position:'absolute', top:'50%', left:'50%', pointerEvents:'none', zIndex:10 }}>
            {['⭐','✨','🌟','💫','⚡','✨'].map((em, i) => (
              <span key={i} style={{
                position:'absolute',
                fontSize: 14 + (i % 3) * 4,
                animation: `xpFloat 0.6s ease forwards`,
                animationDelay: `${i * 0.08}s`,
                top: `${Math.sin(i * 60 * Math.PI/180) * 40}px`,
                left: `${Math.cos(i * 60 * Math.PI/180) * 40}px`,
                opacity: 1,
              }}>{em}</span>
            ))}
          </div>
        )}
      </div>
      {showStillLearning && (
        <div style={{
          fontSize:11, color:'var(--error)', fontWeight:600,
          textAlign:'center', marginTop:6, animation:'rise .3s'
        }}>
          🌱 Keep going — practice makes permanent
        </div>
      )}
      {flipped && (
        <div style={{
          fontSize: 11,
          color: 'var(--subtext)',
          textAlign: 'center',
          marginTop: 2,
          opacity: 0.65,
        }}>
          ← swipe left · swipe right →
        </div>
      )}
      {flipped&&(
        <div style={{marginTop:16}}>
        <div style={{fontSize:12,fontWeight:700,color:"var(--subtext)",textAlign:"center",marginBottom:8}}>How well did you know it?</div>
        <div role="group" aria-label="How well did you know it?" style={{display:'flex', gap:10}}>
          <button
            onClick={handleStillLearning}
            aria-label="Still learning — review again soon"
            style={{
              flex:1, height:56, borderRadius:16,
              border:'2px solid #d97706',
              background:'rgba(217,119,6,0.08)',
              color:'#d97706',
              fontFamily:"'Outfit',sans-serif",
              fontSize:15, fontWeight:900,
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center',
              cursor:'pointer',
            }}
          >
            🔄 Still Learning
            <span style={{fontSize:10, fontWeight:600, opacity:.7, marginTop:4}}>Review again soon</span>
          </button>
          <button
            ref={knowBtnRef}
            onClick={handleKnown}
            aria-label="I know it — move to next interval"
            style={{
              flex:1, height:56, borderRadius:16,
              border:'2px solid var(--success-b)',
              background:'var(--success-bg)',
              color:'var(--success)',
              fontFamily:"'Outfit',sans-serif",
              fontSize:15, fontWeight:900,
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center',
              cursor:'pointer',
            }}
          >
            Perfect ✓
            <span style={{fontSize:10, fontWeight:600, opacity:.7, marginTop:4}}>Move to next interval</span>
          </button>
        </div>
        </div>
      )}
    </div>
  );
}
