import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { H, Bar, srMark, speak } from '../../data';
import { useContent } from '../../hooks/useContent';
import { rnd } from '../../lib/random.js';
import { completeExercise } from '../../hooks/useExerciseCompletion';
import { useStats } from '../../context/StatsContext';
import { knightFlash, knightSpeak } from '../../lib/knightSpeak.js';

interface TimerDisplayProps {
  timeLeft: number;
  color: string;
}
const TimerDisplay = React.memo(function TimerDisplay({ timeLeft, color }: TimerDisplayProps) {
  return (
    <div
      style={{
        fontSize: 'var(--text-2xl)',
        fontWeight: 900,
        color,
        fontVariantNumeric: 'tabular-nums',
        minWidth: 36,
        textAlign: 'center',
      }}
    >
      {timeLeft}s
    </div>
  );
});

const ROUND_TIME = 30;
const QUESTIONS_PER_ROUND = 15;

interface WordItem {
  hr: string;
  en: string;
  cat: string;
}
interface Question {
  prompt: string;
  answer: string;
  opts: string[];
  word: WordItem;
}
interface ResultItem {
  q: Question;
  chosen: string;
  correct: boolean;
}
type ShuffleFn = (a: any[]) => any[];

function buildPool(V: Record<string, string[][]>, cats: string[], sh: ShuffleFn): WordItem[] {
  const all = cats.flatMap((c: string) =>
    (V[c] || []).map((w: string[]) => ({
      hr: w[0]!,
      en: w[1]!,
      cat: c,
    })),
  );
  return sh(all) as WordItem[];
}

function makeQuestion(word: WordItem, allWords: WordItem[], sh: ShuffleFn): Question | null {
  const wrong: WordItem[] = (
    sh(allWords.filter((w: WordItem) => w.en !== word.en)) as WordItem[]
  ).slice(0, 3);
  if (wrong.length < 3) return null;
  const dir = rnd() < 0.5;
  if (dir) {
    return {
      prompt: word.hr,
      answer: word.en,
      opts: sh([word.en, wrong[0]!.en, wrong[1]!.en, wrong[2]!.en]) as string[],
      word,
    };
  } else {
    return {
      prompt: word.en,
      answer: word.hr,
      opts: sh([word.hr, wrong[0]!.hr, wrong[1]!.hr, wrong[2]!.hr]) as string[],
      word,
    };
  }
}

const catIcons = {
  greetings: '👋',
  numbers: '🔢',
  family: '👨‍👩‍👧‍👦',
  food: '🍕',
  animals: '🐾',
  'body & face': '🦴',
  colors: '🎨',
  'home & rooms': '🏠',
  clothing: '👔',
  'weather & seasons': '☀️',
  places: '📍',
  transport: '🚗',
  verbs: '💬',
  adjectives: '📏',
  'time & calendar': '📅',
  months: '🗓️',
  directions: '🧭',
  emotions: '💭',
  professions: '💼',
  restaurant: '🍽️',
  shopping: '🛍️',
  travel: '✈️',
  health: '🏥',
  questions: '❓',
  conjunctions: '🔗',
  culture: '🏛️',
  'daily routine': '🌅',
  'in the classroom': '📖',
  hobbies: '🎯',
  zagreb: '🏙️',
  opposites: '🔄',
  comparatives: '📊',
  fruits: '🍎',
  vegetables: '🥦',
  sports: '⚽',
  holidays: '🎄',
  personality: '😊',
  'fairy tales': '📜',
  'commands at home': '🏡',
};

interface WordSprintProps {
  sh: ShuffleFn;
  award: (n: number, celebrate?: boolean, activityType?: string) => void;
  goBack: () => void;
}
export default function WordSprint({ sh, award, goBack }: WordSprintProps) {
  const { stats, setStats, writeDelta } = useStats();
  const { content } = useContent();
  const V = useMemo(() => (content?.V ?? {}) as Record<string, string[][]>, [content]);
  const finishFired = useRef(false);
  const catList = Object.keys(V);
  const [phase, setPhase] = useState('menu');
  const [selectedCats, setSelectedCats] = useState(['greetings', 'food', 'animals']);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [chosen, setChosen] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedRef = useRef(false);
  const consecCorrectRef = useRef(0);
  const consecWrongRef = useRef(0);
  const worriedFiredRef = useRef(false);

  const startGame = useCallback(() => {
    const cats = selectedCats.length > 0 ? selectedCats : catList.slice(0, 5);
    const pool = buildPool(V, cats, sh);
    if (pool.length < 4) return;
    const qs: Question[] = [];
    const shuffled: WordItem[] = sh(pool) as WordItem[];
    for (let i = 0; i < QUESTIONS_PER_ROUND && i < shuffled.length; i++) {
      const q = makeQuestion(shuffled[i]!, pool, sh);
      if (q) qs.push(q);
    }
    setQuestions(qs);
    setQi(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTimeLeft(ROUND_TIME);
    setChosen(null);
    setFeedback(null);
    setResults([]);
    consecCorrectRef.current = 0;
    consecWrongRef.current = 0;
    worriedFiredRef.current = false;
    setPhase('playing');
  }, [selectedCats, sh, catList, V]);

  // Speak the Croatian word whenever a new question loads (Croatian prompt only)
  useEffect(() => {
    if (phase !== 'playing' || !questions[qi]) return;
    const q = questions[qi]!;
    if (q.prompt === q.word.hr) speak(q.word.hr);
  }, [qi, phase, questions]);

  useEffect(() => {
    if (phase !== 'playing') return undefined;
    timerRef.current = setInterval(() => {
      if (pausedRef.current) return; // paused during answer feedback
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current !== null) clearInterval(timerRef.current);
          setPhase('result');
          return 0;
        }
        if (t === 6 && !worriedFiredRef.current) {
          worriedFiredRef.current = true;
          knightFlash('worried', 1500);
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  }, [phase]);

  useEffect(() => {
    if (feedback === null) return undefined;
    feedbackRef.current = setTimeout(() => {
      pausedRef.current = false; // resume timer
      setChosen(null);
      setFeedback(null);
      if (qi + 1 >= questions.length) {
        if (timerRef.current !== null) clearInterval(timerRef.current);
        setPhase('result');
      } else {
        setQi((q) => q + 1);
      }
    }, 600);
    return () => {
      if (feedbackRef.current !== null) clearTimeout(feedbackRef.current);
    };
  }, [feedback, qi, questions.length]);

  function answer(opt: string) {
    if (chosen !== null || phase !== 'playing') return;
    const q = questions[qi];
    if (!q) return;
    pausedRef.current = true; // pause timer during feedback
    setChosen(opt);
    const correct = opt === q.answer;
    if (q && q.word) {
      const word = q.word.hr || '';
      if (word) srMark(word, correct, undefined);
    }
    setFeedback(correct ? 'correct' : 'wrong');
    setResults((r: ResultItem[]) => [...r, { q, chosen: opt, correct }]);
    if (correct) {
      consecWrongRef.current = 0;
      consecCorrectRef.current += 1;
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak((b) => Math.max(b, newStreak));
      const pts = newStreak >= 5 ? 3 : newStreak >= 3 ? 2 : 1;
      setScore((s) => s + pts);
      if (newStreak % 5 === 0) {
        if (typeof award === 'function') award(15, false, 'vocabulary');
      }
      if (consecCorrectRef.current >= 3) knightFlash('onfire', 2000);
      else if (rnd() < 0.2) knightFlash('winking', 1500);
    } else {
      consecCorrectRef.current = 0;
      consecWrongRef.current += 1;
      knightFlash(
        consecWrongRef.current >= 3 ? 'struggling' : 'oops',
        consecWrongRef.current >= 3 ? 2000 : 1500,
      );
      setStreak(0);
    }
  }

  useEffect(() => {
    if (phase === 'result' && score > 0) {
      if (finishFired.current) return;
      finishFired.current = true;
      // Timed sprint has no pass threshold — registered as 'effort', credited on a
      // genuine finish (score > 0) via the single completion authority.
      completeExercise({
        key: 'wordsprint',
        xp: Math.min(score * 2, 50),
        stats,
        setStats,
        writeDelta,
        award,
        activityType: 'grammar', // preserve original XP attribution
      });
    }
  }, [phase, score, award, stats, setStats, writeDelta]);

  useEffect(() => {
    if (phase !== 'result') return;
    const correctCount = results.filter((r) => r.correct).length;
    const pct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    if (pct >= 90) {
      knightSpeak('tearsofjoy', `${pct}% — Savršeno! Brzi si kao munja! ⚡`, 300);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCat = (c: string) =>
    setSelectedCats((prev) =>
      prev.includes(c) ? (prev.length > 1 ? prev.filter((x) => x !== c) : prev) : [...prev, c],
    );

  const timerColor =
    timeLeft > 15 ? 'var(--success)' : timeLeft > 8 ? 'var(--warning)' : 'var(--error)';

  // ── MENU ──
  if (phase === 'menu')
    return (
      <div className="scr-wrap">
        {H(
          '⚡ Word Sprint',
          'Race the clock — 30 seconds, 15 words. Streaks earn bonus points!',
          goBack,
        )}

        <div className="g3" style={{ marginBottom: 20 }}>
          {[
            { i: '⏱️', l: '30 sec', d: 'Per round' },
            { i: '🔥', l: 'Streaks', d: '+2/+3 pts' },
            { i: '🎯', l: '15 words', d: 'Per game' },
          ].map((s, i) => (
            <div key={i} className="c" style={{ textAlign: 'center', padding: '12px 8px' }}>
              <div style={{ fontSize: 'var(--text-2xl)' }}>{s.i}</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--heading)' }}>
                {s.l}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)' }}>{s.d}</div>
            </div>
          ))}
        </div>

        <div className="c" style={{ marginBottom: 20 }}>
          <div className="sh" style={{ marginTop: 0 }}>
            Choose Categories ({selectedCats.length} selected)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {catList.map((c) => (
              <button
                key={c}
                onClick={() => toggleCat(c)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: '2px solid',
                  borderColor: selectedCats.includes(c) ? 'var(--info)' : 'var(--card-b)',
                  background: selectedCats.includes(c) ? 'var(--info-bg)' : 'transparent',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: selectedCats.includes(c) ? 'var(--info)' : 'var(--subtext)',
                  fontFamily: "'Outfit',sans-serif",
                  transition: 'all .15s',
                }}
              >
                {(catIcons as Record<string, string>)[c] || '📝'} {c}
              </button>
            ))}
          </div>
        </div>

        <button className="b bp" style={{ width: '100%' }} onClick={startGame}>
          Start Sprint ⚡
        </button>
        <button className="b bg" style={{ width: '100%', marginTop: 10 }} onClick={goBack}>
          ← Back
        </button>
      </div>
    );

  // ── PLAYING ──
  if (phase === 'playing') {
    const q = questions[qi];
    if (!q) return null;
    return (
      <div className="scr-wrap">
        {H('⚡ Word Sprint', undefined, goBack)}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--subtext)' }}>
            {qi + 1} / {questions.length}
          </div>
          <TimerDisplay timeLeft={timeLeft} color={timerColor} />
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--info)' }}>
            ⭐ {score} pts
          </div>
        </div>

        <Bar v={timeLeft} mx={ROUND_TIME} color={timerColor} h={6} />

        {streak >= 3 && (
          <div
            className="c"
            style={{
              marginTop: 12,
              textAlign: 'center',
              padding: '8px 12px',
              borderLeft: '4px solid var(--warning)',
              background: 'var(--warning-bg)',
            }}
          >
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--warning)' }}>
              🔥 {streak} streak! +{streak >= 5 ? 3 : 2} pts per answer
            </span>
          </div>
        )}

        <div
          className="c"
          style={{
            marginTop: 12,
            textAlign: 'center',
            padding: '24px 20px',
            borderLeft: '4px solid var(--info)',
          }}
        >
          <div
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--subtext)',
              fontWeight: 600,
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {q.prompt === q.word.hr ? 'What does this mean?' : 'How do you say this in Croatian?'}
          </div>
          <div
            style={{
              fontSize: 'var(--text-3xl)',
              fontWeight: 900,
              color: 'var(--heading)',
              fontFamily: "'Playfair Display',serif",
            }}
          >
            {q.prompt}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          {q.opts.map((opt, oi) => (
            <button
              key={oi}
              className={
                'ob ' +
                (chosen !== null ? (opt === q.answer ? 'ok' : opt === chosen ? 'no' : '') : '')
              }
              onClick={() => answer(opt)}
            >
              {opt}
            </button>
          ))}
        </div>

        {feedback === 'correct' && (
          <div
            className="c"
            style={{
              marginTop: 4,
              textAlign: 'center',
              padding: '8px',
              background: 'var(--success-bg)',
              borderLeft: '4px solid var(--success)',
            }}
          >
            <span
              style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--success)' }}
            >
              ✓ Correct! +{streak >= 5 ? 3 : streak >= 3 ? 2 : 1} pt{streak >= 3 ? 's' : ''}
            </span>
          </div>
        )}
        {feedback === 'wrong' && (
          <div
            className="c"
            style={{
              marginTop: 4,
              textAlign: 'center',
              padding: '8px',
              background: 'var(--error-bg)',
              borderLeft: '4px solid var(--error)',
            }}
          >
            <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--error)' }}>
              ✗ Answer: {q.answer}
            </span>
          </div>
        )}
      </div>
    );
  }

  // ── RESULT ──
  const correct = results.filter((r) => r.correct).length;
  const pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
  const grade =
    pct >= 90
      ? { e: '🏆', l: 'Excellent!' }
      : pct >= 70
        ? { e: '⭐', l: 'Great job!' }
        : pct >= 50
          ? { e: '👍', l: 'Good effort!' }
          : { e: '💪', l: 'Keep practicing!' };

  return (
    <div className="scr-wrap">
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 'var(--text-4xl)' }}>{grade.e}</div>
        <h2
          style={{
            fontFamily: "'Playfair Display',serif",
            color: 'var(--heading)',
            fontWeight: 800,
          }}
        >
          {grade.l}
        </h2>
        <div style={{ fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'var(--info)' }}>
          {score} pts
        </div>
        <div style={{ fontSize: 'var(--text-base)', color: 'var(--subtext)', marginTop: 4 }}>
          {correct} / {questions.length} correct · Best streak: {bestStreak} 🔥
        </div>
      </div>

      {results.filter((r) => !r.correct).length > 0 && (
        <div className="c" style={{ marginBottom: 20 }}>
          <div className="sh" style={{ marginTop: 0 }}>
            Review Missed Words
          </div>
          {results
            .filter((r) => !r.correct)
            .map((r, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--card-b)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--heading)' }}>{r.q.word.hr}</span>
                <span style={{ color: 'var(--subtext)' }}>→</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>{r.q.word.en}</span>
              </div>
            ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="b bp" style={{ flex: 1 }} onClick={startGame}>
          🔄 Play Again
        </button>
        <button className="b bg" style={{ flex: 1 }} onClick={() => setPhase('menu')}>
          📋 Menu
        </button>
        <button className="b bg" style={{ flex: 1 }} onClick={goBack}>
          🏠 Done
        </button>
      </div>
    </div>
  );
}
