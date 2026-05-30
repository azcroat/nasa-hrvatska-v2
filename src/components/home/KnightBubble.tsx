import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CroatianKnight from '../shared/CroatianKnight';
import TypewriterText from './TypewriterText';
import QuickReplyBanner from './QuickReplyBanner';
import { speak } from '../../data';
import { QUICK_CULTURE, QUICK_GRAMMAR, QUICK_MOTIVATE } from './heroData';
import type { KnightSpeech } from './useKnightSpeech';

/**
 * Knight mascot + interactive speech bubble + quick-reply pills + inline
 * translate panel. Extracted from HeroSection as part of the 1c decomposition.
 * Receives the useKnightSpeech surface as `knight` and destructures it, so the
 * markup is the verbatim prior block. Presentational beyond that hook.
 */
export default function KnightBubble({
  knight,
  name,
  isNative,
}: {
  knight: KnightSpeech;
  name?: string;
  isNative: boolean;
}) {
  const {
    greeting,
    setGreeting,
    showTranslate,
    setShowTranslate,
    tDir,
    setTDir,
    tIn,
    setTIn,
    tOut,
    setTOut,
    tL,
    doTr,
    pickPool,
    cycleBubble,
  } = knight;
  const greetingByTime = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Dobro jutro';
    if (h < 18) return 'Dobar dan';
    return 'Dobra večer';
  };
  return (
    <React.Fragment>
      {/* ── Knight mascot hero — interactive speech bubble ──────── */}
      {/* The row is a plain div so the knight stays mounted continuously.
              Previously key={greeting.mood} was on the whole row, causing the
              knight to unmount+remount (replaying its entry animation) every
              time the user cycled messages — visually "stuck / loading". */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 10 }}>
        {/* Knight — stable mount; mood prop updates the animation variant
                without remounting, so the knight is never frozen during message cycles */}
        <motion.div
          initial={isNative ? false : { scale: 0.75 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 340, damping: 18, delay: 0.1 }}
          style={{ flexShrink: 0 }}
        >
          <CroatianKnight size={92} mood={greeting.mood} />
        </motion.div>

        {/* Interactive speech bubble — AnimatePresence scoped to the bubble only,
                so text transitions are smooth without disturbing the knight */}
        <AnimatePresence mode="wait">
          <motion.div
            key={greeting.mood + '\x00' + greeting.text.slice(0, 40)}
            initial={isNative ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={isNative ? { y: -4 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ flex: 1, position: 'relative' }}
          >
            {/* left-pointing triangle toward knight */}
            <div
              style={{
                position: 'absolute',
                left: -9,
                top: 18,
                width: 0,
                height: 0,
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderRight: '8px solid rgba(255,255,255,0.18)',
              }}
            />
            <div
              role="button"
              tabIndex={0}
              onClick={cycleBubble}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') cycleBubble();
              }}
              title="Tap to hear something new"
              style={{
                background: 'rgba(255,255,255,0.14)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                borderRadius: '4px 16px 16px 16px',
                padding: '12px 14px 10px',
                border: '1px solid rgba(255,255,255,0.22)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                cursor: 'pointer',
                transition: 'background .15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.20)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.14)';
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(200,152,10,0.95)',
                  marginBottom: 5,
                }}
              >
                {greetingByTime()}, {name || 'Učenik'}!
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.95)',
                  lineHeight: 1.5,
                }}
              >
                <TypewriterText text={greeting.text} />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: 3,
                  marginTop: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: 'rgba(255,255,255,0.38)',
                    fontWeight: 600,
                    letterSpacing: '.04em',
                  }}
                >
                  tap for more
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>↺</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Quick-reply pills — Culture / Grammar / Krenimo / Translate */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: showTranslate ? 10 : 16,
          overflowX: 'auto',
          flexWrap: 'nowrap',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingBottom: 2,
        }}
      >
        <QuickReplyBanner
          label="🏛️ Culture"
          onClick={() => {
            setShowTranslate(false);
            setGreeting(pickPool(QUICK_CULTURE, 'culture'));
          }}
        />
        <QuickReplyBanner
          label="📐 Grammar"
          onClick={() => {
            setShowTranslate(false);
            setGreeting(pickPool(QUICK_GRAMMAR, 'grammar'));
          }}
        />
        <QuickReplyBanner
          label="💪 Krenimo!"
          onClick={() => {
            setShowTranslate(false);
            setGreeting(pickPool(QUICK_MOTIVATE, 'motivate'));
          }}
        />
        <QuickReplyBanner
          label="⇄ Translate"
          onClick={() => {
            setShowTranslate((t) => !t);
            setTOut('');
          }}
        />
      </div>

      {/* ── Inline Translate Panel ── */}
      {showTranslate && (
        <div
          style={{
            background: 'rgba(0,0,0,0.28)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderRadius: 16,
            padding: '14px 16px',
            marginBottom: 16,
            border: '1px solid rgba(255,255,255,0.18)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <button
              onClick={() => {
                setTDir((d) => (d === 'en-hr' ? 'hr-en' : 'en-hr'));
                setTOut('');
              }}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.28)',
                borderRadius: 10,
                padding: '5px 13px',
                fontSize: 11,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.92)',
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              {tDir === 'en-hr' ? 'EN → HR ⇄' : 'HR → EN ⇄'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={tIn}
              onChange={(e) => setTIn(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') doTr();
              }}
              placeholder={tDir === 'en-hr' ? 'Type English…' : 'Unesite hrvatski…'}
              style={{
                flex: 1,
                fontSize: 13,
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.22)',
                borderRadius: 10,
                color: 'white',
                fontFamily: "'Outfit',sans-serif",
                outline: 'none',
              }}
            />
            <button
              onClick={doTr}
              disabled={tL}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 10,
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 700,
                color: 'white',
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              {tL ? '⏳' : 'Go'}
            </button>
          </div>
          {tOut && (
            <button
              onClick={() => speak(tDir === 'en-hr' ? tOut : tIn)}
              style={{
                width: '100%',
                marginTop: 10,
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.22)',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                color: 'white',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: "'Outfit',sans-serif",
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              aria-label={`Play audio for ${tOut}`}
            >
              <span>{tOut}</span>
              <span aria-hidden="true" style={{ fontSize: 18 }}>
                🔊
              </span>
            </button>
          )}
        </div>
      )}
    </React.Fragment>
  );
}
