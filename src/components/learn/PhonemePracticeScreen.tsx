import React, { useState, useEffect } from 'react';
import { speak } from '../../data';
import { markQuest } from '../../lib/quests.js';
import { knightSpeak } from '../../lib/knightSpeak.js';

const STORAGE_KEY = 'nh_phonemes_mastered';

function loadMastered() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function saveMastered(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {}
}

const PHONEMES = [
  {
    key: 'č',
    letter: 'Č',
    name: 'Hard CH',
    ipa: '/tʃ/',
    type: 'Retroflex affricate',
    color: '#0e7490',
    tongue: 'Curl your tongue tip slightly back, like saying "ch" in "church" but firmer',
    words: [
      { hr: 'čaj', en: 'tea' },
      { hr: 'čovjek', en: 'man' },
      { hr: 'učiti', en: 'to learn' },
      { hr: 'večer', en: 'evening' },
    ],
    minimalPair: { a: 'čas', aEn: 'lesson/moment', b: 'ćas', bEn: 'momentary (dialectal)' },
    sentence: { hr: 'Čaj je jako dobar.', en: 'Tea is very good.' },
  },
  {
    key: 'ć',
    letter: 'Ć',
    name: 'Soft CH',
    ipa: '/tɕ/',
    type: 'Palatal affricate',
    color: '#7c3aed',
    tongue: 'Use the flat middle of your tongue, softer than Č, like "ty" said very quickly',
    words: [
      { hr: 'kuća', en: 'house' },
      { hr: 'noć', en: 'night' },
      { hr: 'ćevapi', en: 'grilled meat' },
      { hr: 'vrući', en: 'hot' },
    ],
    minimalPair: { a: 'kuća', aEn: 'house', b: 'kuča', bEn: 'learner mistake — not a word' },
    sentence: { hr: 'Kuća je lijepa noću.', en: 'The house is beautiful at night.' },
  },
  {
    key: 'š',
    letter: 'Š',
    name: 'SH sound',
    ipa: '/ʃ/',
    type: 'Postalveolar fricative',
    color: '#b45309',
    tongue: 'Lips rounded, tongue back — almost exactly like English "sh"',
    words: [
      { hr: 'šuma', en: 'forest' },
      { hr: 'škola', en: 'school' },
      { hr: 'šešir', en: 'hat' },
      { hr: 'miš', en: 'mouse' },
    ],
    minimalPair: { a: 'šuma', aEn: 'forest', b: 'suma', bEn: 'sum/total' },
    sentence: { hr: 'Šuma je puna ptica.', en: 'The forest is full of birds.' },
  },
  {
    key: 'ž',
    letter: 'Ž',
    name: 'ZH sound',
    ipa: '/ʒ/',
    type: 'Postalveolar fricative (voiced Š)',
    color: '#065f46',
    tongue: 'Voice your Š — add vibration to your vocal cords',
    words: [
      { hr: 'žena', en: 'woman' },
      { hr: 'život', en: 'life' },
      { hr: 'žuti', en: 'yellow' },
      { hr: 'može', en: 'can/may' },
    ],
    minimalPair: { a: 'žena', aEn: 'woman', b: 'sena', bEn: 'hay (dialectal)' },
    sentence: { hr: 'Žena živi u gradu.', en: 'The woman lives in the city.' },
  },
  {
    key: 'lj',
    letter: 'LJ',
    name: 'LY sound',
    ipa: '/ʎ/',
    type: 'Palatal lateral approximant',
    color: '#9f1239',
    tongue: 'Say "l" and "y" as a single merged sound — tongue blade touches palate',
    words: [
      { hr: 'ljubav', en: 'love' },
      { hr: 'ljeto', en: 'summer' },
      { hr: 'ljudi', en: 'people' },
      { hr: 'volje', en: 'wills' },
    ],
    minimalPair: null,
    sentence: { hr: 'Ljubav ljeti cvjeta.', en: 'Love blooms in summer.' },
  },
  {
    key: 'nj',
    letter: 'NJ',
    name: 'NY sound',
    ipa: '/ɲ/',
    type: 'Palatal nasal',
    color: '#1e3a8a',
    tongue: 'Say "n" and "y" merged — like Spanish ñ, tongue blade on palate',
    words: [
      { hr: 'njega', en: 'care/him' },
      { hr: 'njiva', en: 'field' },
      { hr: 'njezin', en: 'her' },
      { hr: 'konj', en: 'horse' },
    ],
    minimalPair: null,
    sentence: { hr: 'Njezin konj trči po njivi.', en: 'Her horse runs across the field.' },
  },
];

export default function PhonemePracticeScreen({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (pts: number, celebrate?: boolean, activityType?: string) => void;
}) {
  const [mastered, setMastered] = useState<Set<string>>(() => loadMastered() as Set<string>);
  const [active, setActive] = useState<number | null>(null);
  const [celebrated, setCelebrated] = useState(false);

  useEffect(() => {
    knightSpeak(
      'teaching',
      'These 6 sounds are your secret weapon. Master them and Croats will think you studied for years! 🎯',
      800,
    );
  }, []);

  function markMastered(key: string) {
    const next = new Set(mastered);
    next.add(key);
    setMastered(next);
    saveMastered(next);
    if (typeof award === 'function') award(15, false, 'pronunciation');
    setActive(null);

    if (next.size === PHONEMES.length && !celebrated) {
      setCelebrated(true);
      if (typeof award === 'function') award(100, true, 'pronunciation');
      markQuest('grammar');
      setTimeout(() => {
        knightSpeak(
          'victory',
          'Phoneme Master! Native speakers will be amazed. Svaka čast! 🏆',
          300,
        );
      }, 400);
    }
  }

  const masteredCount = mastered.size;

  // ── All-mastered celebration screen ──────────────────────────────────────
  if (celebrated || (masteredCount === PHONEMES.length && !active)) {
    return (
      <div className="scr-wrap">
        <button className="b bg" style={{ marginBottom: 16, fontSize: 13 }} onClick={goBack}>
          ← Back
        </button>
        <div
          style={{
            background: 'linear-gradient(135deg, #0e7490, #7c3aed)',
            borderRadius: 18,
            padding: '32px 24px',
            marginBottom: 24,
            color: 'white',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 12 }}>🏆</div>
          <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Phoneme Master!</div>
          <div style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.6 }}>
            You've mastered all 6 Croatian phonemes.
            <br />
            Native speakers will notice the difference immediately.
          </div>
        </div>
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--card-b)',
            borderRadius: 14,
            padding: '16px 18px',
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>+100 XP</div>
          <div style={{ fontSize: 14, color: 'var(--subtext)' }}>
            Bonus awarded for mastering all phonemes
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {PHONEMES.map((p) => (
            <div
              key={p.key}
              style={{
                background: 'var(--card)',
                borderRadius: 14,
                padding: '14px 16px',
                border: `2px solid ${p.color}`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: p.color,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 900,
                  fontFamily: "'Playfair Display', serif",
                  flexShrink: 0,
                }}
              >
                {p.letter}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)' }}>
                  {p.letter}
                </div>
                <div style={{ fontSize: 10, color: 'var(--subtext)', fontFamily: 'monospace' }}>
                  {p.ipa}
                </div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 18 }}>✅</span>
            </div>
          ))}
        </div>
        <button className="b bp" style={{ width: '100%' }} onClick={goBack}>
          Back to Learn Tab
        </button>
      </div>
    );
  }

  // ── Active phoneme drill ───────────────────────────────────────────────────
  if (active !== null) {
    const p = PHONEMES[active]!;
    const isMastered = mastered.has(p.key);
    return (
      <div className="scr-wrap">
        <button
          className="b bg"
          style={{ marginBottom: 16, fontSize: 13 }}
          onClick={() => setActive(null)}
        >
          ← All Phonemes
        </button>

        {/* Letter hero */}
        <div
          style={{
            background: `linear-gradient(135deg, ${p.color}dd, ${p.color})`,
            borderRadius: 18,
            padding: '28px 24px',
            marginBottom: 20,
            color: 'white',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 900,
              lineHeight: 1,
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            {p.letter}
          </div>
          <div style={{ fontSize: 20, marginTop: 8, fontFamily: 'monospace', opacity: 0.95 }}>
            {p.ipa}
          </div>
          <div style={{ fontSize: 13, marginTop: 4, opacity: 0.85 }}>{p.type}</div>
          <div style={{ fontSize: 13, marginTop: 2, opacity: 0.85, fontWeight: 700 }}>{p.name}</div>
        </div>

        {/* Tongue position guidance */}
        <div
          style={{
            background: 'rgba(14,116,144,0.06)',
            borderLeft: '3px solid var(--info)',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--info)', marginBottom: 4 }}>
            👅 TONGUE POSITION
          </div>
          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{p.tongue}</div>
        </div>

        {/* Example words */}
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--card-b)',
            borderRadius: 14,
            padding: '16px 18px',
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)', marginBottom: 12 }}>
            🔊 Hear the Sound
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {p.words.map((w, i) => (
              <button
                key={i}
                onClick={() => speak(w.hr)}
                style={{
                  background: 'var(--card)',
                  border: `1px solid var(--card-b)`,
                  borderRadius: 10,
                  padding: '10px 12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color .15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = p.color)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--card-b)')}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: 'var(--heading)',
                    fontFamily: "'Playfair Display', serif",
                  }}
                >
                  {w.hr}
                </div>
                <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 2 }}>{w.en}</div>
                <div style={{ fontSize: 10, color: p.color, marginTop: 4, fontWeight: 700 }}>
                  ▶ tap to hear
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Minimal pair */}
        {p.minimalPair && (
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--card-b)',
              borderRadius: 14,
              padding: '16px 18px',
              marginBottom: 16,
            }}
          >
            <div
              style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)', marginBottom: 12 }}
            >
              👂 Minimal Pair — Hear the Difference
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => speak(p.minimalPair.a)}
                style={{
                  flex: 1,
                  background: `${p.color}12`,
                  border: `2px solid ${p.color}`,
                  borderRadius: 12,
                  padding: '12px 14px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: p.color,
                    fontFamily: "'Playfair Display', serif",
                  }}
                >
                  {p.minimalPair.a}
                </div>
                <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 4 }}>
                  {p.minimalPair.aEn}
                </div>
                <div style={{ fontSize: 10, color: p.color, marginTop: 4, fontWeight: 700 }}>
                  ▶ play
                </div>
              </button>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 18,
                  color: 'var(--subtext)',
                  fontWeight: 700,
                }}
              >
                VS
              </div>
              <button
                onClick={() => speak(p.minimalPair.b)}
                style={{
                  flex: 1,
                  background: 'rgba(100,100,100,0.06)',
                  border: '2px solid var(--card-b)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: 'var(--heading)',
                    fontFamily: "'Playfair Display', serif",
                  }}
                >
                  {p.minimalPair.b}
                </div>
                <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 4 }}>
                  {p.minimalPair.bEn}
                </div>
                <div
                  style={{ fontSize: 10, color: 'var(--subtext)', marginTop: 4, fontWeight: 700 }}
                >
                  ▶ play
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Practice sentence */}
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--card-b)',
            borderRadius: 14,
            padding: '16px 18px',
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)', marginBottom: 10 }}>
            🗣️ Practice Sentence
          </div>
          <button
            onClick={() => speak(p.sentence.hr)}
            style={{
              width: '100%',
              background: `${p.color}10`,
              border: `1px solid ${p.color}44`,
              borderRadius: 12,
              padding: '14px 16px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: 'var(--heading)',
                fontFamily: "'Playfair Display', serif",
                lineHeight: 1.4,
              }}
            >
              {p.sentence.hr}
            </div>
            <div
              style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 4, fontStyle: 'italic' }}
            >
              {p.sentence.en}
            </div>
            <div style={{ fontSize: 11, color: p.color, marginTop: 6, fontWeight: 700 }}>
              ▶ tap to hear full sentence
            </div>
          </button>
        </div>

        {/* CTA */}
        {isMastered ? (
          <div
            style={{
              background: 'rgba(22,163,74,0.1)',
              border: '2px solid #16a34a',
              borderRadius: 14,
              padding: '16px 18px',
              textAlign: 'center',
              color: '#15803d',
              fontWeight: 800,
              fontSize: 15,
            }}
          >
            ✅ You've mastered {p.letter}!
          </div>
        ) : (
          <button
            className="b bp"
            style={{ width: '100%', fontSize: 16, padding: '16px' }}
            onClick={() => markMastered(p.key)}
          >
            I've got it! +15 XP
          </button>
        )}
      </div>
    );
  }

  // ── Overview grid ─────────────────────────────────────────────────────────
  return (
    <div className="scr-wrap">
      <button className="b bg" style={{ marginBottom: 16, fontSize: 13 }} onClick={goBack}>
        ← Back
      </button>

      {/* Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0e7490dd, #0e7490)',
          borderRadius: 18,
          padding: '20px 20px',
          marginBottom: 20,
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 44 }}>🔤</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>Croatian Phonemes</div>
            <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.5 }}>
              Master the 6 sounds that define fluency
            </div>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--card-b)',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--subtext)', marginBottom: 2 }}>
            PROGRESS
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--heading)' }}>
            {masteredCount} / {PHONEMES.length} mastered
          </div>
        </div>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: `conic-gradient(var(--info) ${(masteredCount / PHONEMES.length) * 360}deg, var(--card-b) 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'var(--card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 900,
              color: 'var(--info)',
            }}
          >
            {Math.round((masteredCount / PHONEMES.length) * 100)}%
          </div>
        </div>
      </div>

      {/* Phoneme grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {PHONEMES.map((p, i) => {
          const isMastered = mastered.has(p.key);
          return (
            <button
              key={p.key}
              onClick={() => setActive(i)}
              style={{
                background: 'var(--card)',
                border: `2px solid ${isMastered ? p.color : 'var(--card-b)'}`,
                borderRadius: 16,
                padding: '18px 14px',
                cursor: 'pointer',
                textAlign: 'center',
                position: 'relative',
                transition: 'border-color .2s, transform .1s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {isMastered && (
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#16a34a',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                >
                  ✓
                </div>
              )}
              <div
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  color: p.color,
                  fontFamily: "'Playfair Display', Georgia, serif",
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                {p.letter}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--subtext)',
                  fontFamily: 'monospace',
                  marginBottom: 4,
                }}
              >
                {p.ipa}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--subtext)' }}>{p.name}</div>
              <div
                style={{
                  fontSize: 10,
                  marginTop: 6,
                  color: isMastered ? '#16a34a' : 'var(--info)',
                  fontWeight: 700,
                }}
              >
                {isMastered ? '✓ Mastered' : 'Tap to practice →'}
              </div>
            </button>
          );
        })}
      </div>

      {masteredCount > 0 && masteredCount < PHONEMES.length && (
        <div
          style={{
            background: 'rgba(14,116,144,0.06)',
            border: '1px solid rgba(14,116,144,0.15)',
            borderRadius: 12,
            padding: '12px 16px',
            fontSize: 13,
            color: 'var(--info)',
            lineHeight: 1.6,
          }}
        >
          <strong>Keep going!</strong> {PHONEMES.length - masteredCount} more phoneme
          {PHONEMES.length - masteredCount !== 1 ? 's' : ''} to unlock the Phoneme Master badge.
        </div>
      )}
    </div>
  );
}
