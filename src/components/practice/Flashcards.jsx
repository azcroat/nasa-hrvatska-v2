import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bar, srMark } from '../../data.jsx';
import ScreenHeader from '../shared/ScreenHeader.jsx';
import confetti from 'canvas-confetti';
import { speak } from '../../lib/audio.js';
import FlashcardResultScreen from './FlashcardResultScreen.jsx';
import FlashcardEmptyState from './FlashcardEmptyState.jsx';
import FlashcardCardFront from './FlashcardCardFront.jsx';
import FlashcardCardBack from './FlashcardCardBack.jsx';
import { knightSpeak } from '../../lib/knightSpeak.js';
import { apiFetch } from '../../lib/apiFetch.js';

// Fetch AI-generated contextual image for a vocabulary word via FLUX
async function fetchCardImage(word, meaning, cacheRef, signal) {
  const key = `img:${word}`;
  if (cacheRef.current[key]) return cacheRef.current[key];
  try {
    const stored = sessionStorage.getItem(`nh_fc_img_${word}`);
    if (stored) { cacheRef.current[key] = stored; return stored; }
  } catch {}
  try {
    const r = await apiFetch('/api/flux-generate', {
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

const STILL_LEARNING_MSG_DURATION = 2000;
const XP_PER_KNOWN = 2;
const XP_COMPLETION_BONUS = 5;
const FLASH_RESUME_KEY = 'nh_flash_resume';

export default function Flashcards({ pool, goBack, award }) {
  const finishFired = useRef(false);
  const [activePool, setActivePool] = useState(pool);
  const [idx, setIdx] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(FLASH_RESUME_KEY) || 'null');
      if (saved && pool && pool[0]
          && saved.firstWord === pool[0][0]
          && saved.poolLength === pool.length) {
        return Math.min(saved.idx, pool.length - 1);
      }
    } catch { /* ignore */ }
    return 0;
  });
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [missed, setMissed] = useState([]);
  const [done, setDone] = useState(false);
  const [correctAnim, setCorrectAnim] = useState(false);
  const [wrongAnim, setWrongAnim] = useState(false);
  const [showStillLearning, setShowStillLearning] = useState(false);
  const [sparkPos, setSparkPos] = useState(null);
  const [exiting, setExiting] = /** @type {[false|string, Function]} */ (useState(false));
  const [entering, setEntering] = useState(false);
  const cardRef = useRef(null);
  const knowBtnRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const mountedRef = useRef(true);
  const lastSpokenRef = useRef(null);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // Persist current card index so the user can resume mid-session
  useEffect(() => {
    if (!activePool || !activePool[0]) return;
    try {
      sessionStorage.setItem(FLASH_RESUME_KEY, JSON.stringify({
        idx,
        firstWord: activePool[0][0],
        poolLength: activePool.length,
        ts: Date.now(),
      }));
    } catch { /* ignore */ }
  }, [idx, activePool]);

  const [aiSentence, setAiSentence] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);
  const aiCacheRef = useRef({});

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
    if (done) return undefined;
    const card = activePool[idx];
    if (!card) return undefined;
    const word = card[0];
    const meaning = card[1];
    const key = `img:${word}`;
    if (imgCacheRef.current[key]) { setCardImg(imgCacheRef.current[key]); return undefined; }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    setCardImg(null);
    setCardImgLoading(true);
    fetchCardImage(word, meaning, imgCacheRef, controller.signal).then(url => {
      clearTimeout(timeoutId);
      if (!mountedRef.current) return;
      setCardImg(url || null);
      setCardImgLoading(false);
    }).catch(() => { clearTimeout(timeoutId); if (mountedRef.current) setCardImgLoading(false); });
    return () => { controller.abort(); clearTimeout(timeoutId); };
   
  }, [idx, done]);

  // Fetch AI example sentence when card is flipped and no static example exists
  useEffect(() => {
    if (!flipped || done) return undefined;
    const card = activePool[idx];
    if (!card) return undefined;
    const word = card[0];
    const meaning = card[1];
    if (card[3]) return undefined;
    if (aiCacheRef.current[word]) {
      setAiSentence(aiCacheRef.current[word]);
      return undefined;
    }
    const level = localStorage.getItem('nh_level') || 'B1';
    setAiSentence(null);
    setAiLoading(true);
    setAiError(false);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    apiFetch('/api/flash-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, meaning, level }),
      signal: controller.signal,
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        clearTimeout(timeoutId);
        if (!mountedRef.current) return;
        const sentence = { hr: data.hr, en: data.en, note: data.note || null };
        aiCacheRef.current[word] = sentence;
        setAiSentence(sentence);
        setAiLoading(false);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        if (!mountedRef.current) return;
        setAiLoading(false);
        setAiError(true);
      });
    return () => { controller.abort(); clearTimeout(timeoutId); };
   
  }, [flipped, idx, done]);

  // When buttons appear (card flipped), focus "I Know It" so keyboard users can act
  useEffect(() => {
    if (flipped && knowBtnRef.current) knowBtnRef.current.focus();
  }, [flipped]);

  // Global keyboard shortcuts: Space/Enter = flip, ArrowRight/K = Know it, ArrowLeft/S = Still learning
  useEffect(() => {
    if (done) return undefined;
    function handleKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.key === ' ' || e.key === 'Enter') && !flipped) {
        e.preventDefault();
        setFlipped(true);
      } else if ((e.key === 'ArrowRight' || e.key === 'k' || e.key === 'K') && flipped) {
        e.preventDefault();
        handleKnown();
      } else if ((e.key === 'ArrowLeft' || e.key === 's' || e.key === 'S') && flipped) {
        e.preventDefault();
        handleStillLearning();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [flipped, done, idx]);

  // When a new card loads, return focus to the card
  useEffect(() => {
    if (!flipped && !done && cardRef.current) cardRef.current.focus();
  }, [idx, flipped, done]);

  // Auto-TTS on flip
  useEffect(() => {
    if (!flipped || done) return undefined;
    const autoTTS = localStorage.getItem('nh_autotts') !== 'false';
    if (!autoTTS) return undefined;
    const word = activePool[idx] && activePool[idx][0];
    if (!word) return undefined;
    const key = `${idx}:${word}`;
    if (lastSpokenRef.current === key) return undefined;
    lastSpokenRef.current = key;
    const t = setTimeout(() => {
      if (mountedRef.current) speak(word);
    }, 300);
    return () => clearTimeout(t);
   
  }, [flipped, idx]);

  function finish(finalKnown) {
    if (finishFired.current) return;
    finishFired.current = true;
    try { sessionStorage.removeItem(FLASH_RESUME_KEY); } catch { /* ignore */ }
    if (typeof award === 'function') award(finalKnown * XP_PER_KNOWN + XP_COMPLETION_BONUS);
    knightSpeak(
      finalKnown === activePool.length ? 'victory' : finalKnown >= activePool.length * 0.7 ? 'celebrating' : 'encouraged',
      finalKnown === activePool.length
        ? `${finalKnown} words — all known! Your memory is working. 🧠`
        : `${finalKnown}/${activePool.length} words mastered this session. Spaced repetition is building your foundation. 📚`,
      500
    );
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
    lastSpokenRef.current = null;
    try { sessionStorage.removeItem(FLASH_RESUME_KEY); } catch { /* ignore */ }
    setActivePool(missedCards);
    setIdx(0);
    setFlipped(false);
    setKnown(0);
    setMissed([]);
    setDone(false);
  }

  // ── RESULT SCREEN ──
  if (done) {
    return (
      <FlashcardResultScreen
        activePool={activePool}
        known={known}
        missed={missed}
        onGoBack={goBack}
        onStudyMissed={studyMissedAgain}
      />
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
    srMark(activePool[idx][0], false); // "Still Learning" = wrong for SRS scheduling
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
    srMark(activePool[idx][0], true); // "Know It" = correct for SRS scheduling
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
    if (absDx < 20 && absDy < 20) return;
    if (absDy > absDx && dy < -40 && !flipped) {
      setFlipped(true);
      return;
    }
    if (absDx > absDy && flipped) {
      if (dx > 60) { handleKnown(); }
      else if (dx < -60) { handleStillLearning(); }
    }
  };

  // Empty pool — show celebratory done state
  if (!activePool[idx]) {
    return <FlashcardEmptyState onGoBack={goBack} />;
  }

  const card = activePool[idx];

  return (
    <div className={flipped ? 'scr-wrap has-cta' : 'scr-wrap'} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <ScreenHeader title="🃏 Flashcards" goBack={goBack} pill={`${idx + 1}/${activePool.length}`} />
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
          aria-label={flipped ? `${card[1]} — tap to flip back` : `${card[0]} — tap to see English`}
        >
          <FlashcardCardFront card={card} cardImg={cardImg} cardImgLoading={cardImgLoading} />
          <div className="fc-face fc-back">
            <FlashcardCardBack
              card={card}
              aiLoading={aiLoading}
              aiSentence={aiSentence}
              aiError={aiError}
            />
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
          ← swipe left · swipe right → &nbsp;·&nbsp; S / → Still learning &nbsp;·&nbsp; K / → Know it
        </div>
      )}
      {/* CTA rendered as sticky bar when card is flipped */}
      {flipped && (
        <div className="cta-bar" style={{ flexDirection: 'column', gap: 6, paddingTop: 8 }} role="group" aria-label="How well did you know it?">
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--subtext)', textAlign: 'center' }}>How well did you know it?</span>
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <motion.button
            onClick={handleStillLearning}
            aria-label="Still learning — review again soon"
            whileTap={{ scale: 0.94 }}
            transition={{ type:'spring', stiffness:400, damping:17 }}
            style={{
              flex:1, height:52, borderRadius:14,
              border:'2px solid #d97706',
              background:'rgba(217,119,6,0.08)',
              color:'#d97706',
              fontFamily:"'Outfit',sans-serif",
              fontSize:14, fontWeight:900,
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center',
              cursor:'pointer',
            }}
          >
            🔄 Still Learning
          </motion.button>
          <motion.button
            ref={knowBtnRef}
            onClick={handleKnown}
            aria-label="I know it — move to next interval"
            whileTap={{ scale: 0.94 }}
            transition={{ type:'spring', stiffness:400, damping:17 }}
            style={{
              flex:1, height:52, borderRadius:14,
              border:'2px solid var(--success-b)',
              background:'var(--success-bg)',
              color:'var(--success)',
              fontFamily:"'Outfit',sans-serif",
              fontSize:14, fontWeight:900,
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center',
              cursor:'pointer',
            }}
          >
            Perfect ✓
          </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
