import React, { useState } from 'react';
import { Bar } from '../../data.jsx';
import CroatianKnight from '../shared/CroatianKnight';

const PLACEMENT_QUESTIONS = [
  // Level 1 — A1 Survival
  { level: 1, q: 'What does "Dobar dan" mean?', options: ['Good morning', 'Good afternoon', 'Good night', 'Goodbye'], answer: 1 },
  { level: 1, q: 'How do you say "thank you" in Croatian?', options: ['Molim', 'Hvala', 'Oprosti', 'Zdravo'], answer: 1 },

  // Level 2 — A2 Settler
  { level: 2, q: '"Koliko košta?" means:', options: ['Where is it?', 'How much does it cost?', 'What time is it?', 'How far is it?'], answer: 1 },
  { level: 2, q: 'Complete: "Ja ___ student." (I am a student)', options: ['je', 'sam', 'si', 'smo'], answer: 1 },

  // Level 3 — B1 Communicator
  { level: 3, q: 'Which is the correct past tense? "She went to school"', options: ['Ona ide u školu', 'Ona je išla u školu', 'Ona će ići u školu', 'Ona bi išla u školu'], answer: 1 },
  { level: 3, q: '"Pišem" vs "napisati" — what is the difference?', options: ['Pišem is past, napisati is present', 'Pišem is imperfective (ongoing), napisati is perfective (completed)', 'They mean the same thing', 'Pišem is formal, napisati is informal'], answer: 1 },

  // Level 4 — B2 Explorer
  { level: 4, q: 'Choose the correct genitive plural: "a lot of books"', options: ['puno knjiga', 'puno knjige', 'puno knjizi', 'puno knjigama'], answer: 0 },
  { level: 4, q: '"Kad bih imao novca, putovao bih." This uses:', options: ['Present tense', 'Future tense', 'Conditional mood', 'Imperative'], answer: 2 },

  // Level 5 — C1 Hrvat
  { level: 5, q: '"Da + present" construction expresses:', options: ['A wish or necessity (subjunctive-like)', 'Simple future', 'Past habit', 'Passive voice'], answer: 0 },
  { level: 5, q: 'Which is the correct reflexive passive? "Croatian is spoken here"', options: ['Hrvatska se govori ovdje', 'Ovdje se govori hrvatski', 'Ovdje govori se hrvatski', 'Se govori ovdje hrvatski'], answer: 1 },
];

const LEVEL_NAMES = ['', 'A1 Survival', 'A2 Settler', 'B1 Communicator', 'B2 Explorer', 'C1 Hrvat'];
const LEVEL_DESC = [
  '',
  'You\'re just starting out — let\'s build your foundations with greetings, numbers, and everyday words.',
  'You know the basics — time to expand your vocabulary and handle simple conversations.',
  'You can communicate — let\'s master verb tenses, cases, and more complex grammar.',
  'You\'re exploring advanced territory — conditional mood, clitics, and nuanced expressions.',
  'You\'re approaching native-like fluency — let\'s polish the finer points of Croatian.',
];

function calculatePlacement(levelCorrect) {
  // levelCorrect: { 1: [true, false, true], 2: [...], ... }
  let placed = 1;
  for (let lv = 1; lv <= 5; lv++) {
    const answers = levelCorrect[lv] || [];
    const correct = answers.filter(Boolean).length;
    if (correct >= 2) placed = lv;
  }
  return placed;
}

export default function PlacementTest({ onComplete }) {
  const [showIntro, setShowIntro] = useState(true);
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState(/** @type {number|null} */ (null));
  const [answered, setAnswered] = useState(false);
  const [levelCorrect, setLevelCorrect] = useState(/** @type {Record<number, boolean[]>} */ ({}));
  const [wrongStreak, setWrongStreak] = useState(0);
  const [done, setDone] = useState(false);
  const [placedLevel, setPlacedLevel] = useState(1);

  const q = PLACEMENT_QUESTIONS[qi];

  function finishTest(lc) {
    const level = calculatePlacement(lc);
    setPlacedLevel(level);
    setDone(true);
  }

  function handleAnswer(i) {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    const isCorrect = i === q.answer;
    const newStreak = isCorrect ? 0 : wrongStreak + 1;
    setWrongStreak(newStreak);
    const newLc = { ...levelCorrect };
    if (!newLc[q.level]) newLc[q.level] = [];
    newLc[q.level] = [...newLc[q.level], isCorrect];
    setLevelCorrect(newLc);

    // Stop early if 3 consecutive wrong answers
    if (newStreak >= 3) {
      setTimeout(() => finishTest(newLc), 800);
      return;
    }
  }

  function handleNext() {
    if (qi >= PLACEMENT_QUESTIONS.length - 1) {
      finishTest(levelCorrect);
      return;
    }
    setQi(qi + 1);
    setSelected(null);
    setAnswered(false);
  }

  if (showIntro) {
    return (
      <div className="scr-wrap">
        <div style={{ textAlign: 'center', padding: '28px 20px 16px' }}>
          <CroatianKnight
            size={100}
            mood="happy"
            style={{ margin: '0 auto 12px', display: 'block' }}
          />
          <h2 style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 24,
            color: 'var(--heading)',
            marginBottom: 8,
          }}>
            Let's find your level!
          </h2>
          <p style={{
            color: 'var(--subtext)',
            fontSize: 14,
            lineHeight: 1.6,
            marginBottom: 6,
          }}>
            A few quick questions — about 2 minutes.
            The test adapts as you go and stops early if needed. 🧠
          </p>
          <p style={{
            color: 'var(--subtext)',
            fontSize: 13,
            lineHeight: 1.5,
            marginBottom: 24,
            fontStyle: 'italic',
          }}>
            Don't worry if some questions feel hard — that's exactly how we find your level!
          </p>
          <button
            className="b bp"
            style={{ width: '100%', marginBottom: 10 }}
            onClick={() => setShowIntro(false)}
          >
            Start the test →
          </button>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--subtext)',
              fontSize: 13,
              cursor: 'pointer',
              textDecoration: 'underline',
              display: 'block',
              margin: '0 auto',
            }}
            onClick={() => {
              localStorage.setItem('nh_placement_done', 'true');
              onComplete(1);
            }}
          >
            Skip — I'll start at A1
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="scr-wrap" style={{ paddingBottom: 80, textAlign: 'center' }}>
        <CroatianKnight
          size={90}
          mood={placedLevel >= 3 ? 'celebrating' : 'happy'}
          style={{ margin: '0 auto 12px', display: 'block' }}
        />
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, color: 'var(--heading)', marginBottom: 8 }}>
          Placement Complete!
        </h2>
        <div style={{
          background: 'linear-gradient(135deg,#0e7490,#164e63)',
          borderRadius: 20, padding: '24px 20px', color: '#fff',
          marginBottom: 20, marginTop: 16,
        }}>
          <div style={{ fontSize: 13, opacity: .75, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>
            Your Level
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 4 }}>Level {placedLevel}</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{LEVEL_NAMES[placedLevel]}</div>
          <div style={{ fontSize: 14, opacity: .88, lineHeight: 1.5 }}>{LEVEL_DESC[placedLevel]}</div>
        </div>
        <button
          onClick={() => onComplete(placedLevel)}
          style={{
            width: '100%', padding: '16px', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg,#0e7490,#164e63)',
            color: '#fff', fontSize: 16, fontWeight: 800,
            cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
          }}
        >
          Start Learning at Level {placedLevel} →
        </button>
      </div>
    );
  }

  return (
    <div className="scr-wrap">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--subtext)', fontWeight: 700, marginBottom: 4 }}>
            Placement Test · Question {qi + 1} of {PLACEMENT_QUESTIONS.length}
          </div>
          <Bar v={qi + 1} mx={PLACEMENT_QUESTIONS.length} h={6} />
        </div>
        <div style={{
          background: 'linear-gradient(135deg,#0e7490,#164e63)',
          color: '#fff', borderRadius: 10, padding: '4px 10px',
          fontSize: 11, fontWeight: 800,
        }}>
          Level {q.level} — {LEVEL_NAMES[q.level]}
        </div>
      </div>
      <div style={{
        fontSize: 10, color: 'rgba(255,255,255,0.5)',
        textAlign: 'center', marginBottom: 8
      }}>
        The test adapts to your level — it stops early if needed
      </div>

      <div className="c" style={{ marginTop: 16 }}>
        {qi === 3 && (
          <div style={{
            textAlign:'center', fontSize:'var(--text-sm)',
            color:'rgba(255,255,255,0.7)', marginBottom:12,
            animation: 'rise .4s'
          }}>
            You're doing great! Keep going 💪
          </div>
        )}
        <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: 'var(--heading)', lineHeight: 1.5 }}>
          {q.q}
        </p>
        {q.options.map((o, i) => (
          <button
            key={i}
            className={'ob ' + (answered ? (i === q.answer ? 'ok' : selected === i ? 'no' : '') : '')}
            onClick={() => handleAnswer(i)}
            style={{ marginBottom: 10 }}
          >
            {o}
          </button>
        ))}
        {answered && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <CroatianKnight
                size={50}
                mood={selected === q.answer ? 'happy' : 'encouraged'}
                style={{ flexShrink: 0 }}
              />
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: selected === q.answer ? 'var(--success)' : 'var(--subtext)',
              }}>
                {selected === q.answer ? 'Točno! ✓ Great job!' : "Netočno — keep going, you've got this!"}
              </div>
            </div>
            <button
              className="b bp"
              style={{ width: '100%', marginTop: 12 }}
              onClick={handleNext}
            >
              {qi < PLACEMENT_QUESTIONS.length - 1 ? 'Next →' : 'See Results'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
