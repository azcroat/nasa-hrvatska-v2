/**
 * PitchAccentMastery — teach the 4 Croatian pitch accents.
 *
 * Croatian is one of the few European languages with a fully functional
 * pitch accent system (like Japanese or Swedish). This screen takes learners
 * from zero awareness to practical recognition in 6 lessons.
 */
import React, { useState, useRef, useEffect } from 'react';
import { speak } from '../../data';
import { speakProsody } from '../../lib/audio.js';
import { markQuest } from '../../lib/quests.js';
import { useStats } from '../../context/StatsContext';
import { knightSpeak } from '../../lib/knightSpeak.js';
import CharacterPortrait from '../family/CharacterPortrait';
import { PITCH_ACCENT_LESSONS } from '../../data/pitchAccentContent.js';

// Map accent id → rich lesson data
const LESSON_BY_ACCENT = {
  kratkosilazni: PITCH_ACCENT_LESSONS.find((l) => l.id === 'short_falling'),
  kratkouzlazni: PITCH_ACCENT_LESSONS.find((l) => l.id === 'short_rising'),
  dugosilazni: PITCH_ACCENT_LESSONS.find((l) => l.id === 'long_falling'),
  dugouzlazni: PITCH_ACCENT_LESSONS.find((l) => l.id === 'long_rising'),
};

// ── Prosody descriptors for each accent ───────────────────────────────────────
// These are approximate SSML contours; they cannot perfectly reproduce native
// pitch-accent but create an acoustically DIFFERENT rendering for each accent type.
// The two members of any minimal pair always have different accents, so they will
// always receive different prosody descriptors — giving learners an audible contrast.
const ACCENT_PROSODY: Record<string, { pitch?: string; contour?: string; rate?: string }> = {
  kratkosilazni: { rate: '+0%', contour: '(0%,+8%) (100%,-22%)' }, // short-falling: starts high, drops sharply
  dugosilazni: { rate: '-25%', contour: '(0%,+12%) (100%,-28%)' }, // long-falling: sustained then drops
  kratkouzlazni: { rate: '+0%', contour: '(0%,-10%) (100%,+15%)' }, // short-rising: dips then rises
  dugouzlazni: { rate: '-25%', contour: '(0%,-15%) (100%,+22%)' }, // long-rising: sustained low-to-high
};

// ── Accent system data ────────────────────────────────────────────────────────
const ACCENTS = [
  {
    id: 'kratkosilazni',
    symbol: '`',
    name: 'Kratkosilazni',
    nameEn: 'Short-Falling',
    emoji: '⬇️',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    rule: 'Short vowel, pitch drops sharply. Only on the FIRST syllable.',
    desc: `The kratkosilazni (short-falling) accent sounds like a quick, heavy drop in pitch. Think of how an English speaker says "NO!" when refusing something — that sudden downward punch. In Croatian, it always lands on the first syllable and the vowel is short. It cannot appear on any other syllable in standard speech.`,
    examples: [
      {
        hr: 'grȁd',
        en: 'hail (weather)',
        audio: 'grad',
        tip: 'vs. grȃd = city — same consonants, different pitch and vowel length',
      },
      {
        hr: 'kȕća',
        en: 'house',
        audio: 'kuća',
        tip: 'The most Croatian word — short, punchy first syllable',
      },
      {
        hr: 'sȁt',
        en: 'hour / clock',
        audio: 'sat',
        tip: 'A single syllable with that heavy drop',
      },
      { hr: 'rȉba', en: 'fish', audio: 'riba', tip: 'First syllable falls, second syllable fades' },
      {
        hr: 'pȁs',
        en: 'dog',
        audio: 'pas',
        tip: 'vs. pȃs = belt — minimal pair, vowel length only',
      },
      {
        hr: 'lȕka',
        en: 'harbor / port',
        audio: 'luka',
        tip: 'vs. lûka = Luke (name) — pitch and length differ',
      },
    ],
    pairs: [
      {
        a: { hr: 'grȁd', en: 'hail', audio: 'grad', accentId: 'kratkosilazni' },
        b: { hr: 'grȃd', en: 'city', audio: 'grad', accentId: 'dugosilazni' },
        note: 'Same spelling in everyday text — context tells you which one',
      },
      {
        a: { hr: 'pȁs', en: 'dog', audio: 'pas', accentId: 'kratkosilazni' },
        b: { hr: 'pȃs', en: 'belt / waist', audio: 'pas', accentId: 'dugosilazni' },
        note: 'Crucial for market shopping — different objects entirely',
      },
      {
        a: { hr: 'lȕka', en: 'harbor', audio: 'luka', accentId: 'kratkosilazni' },
        b: { hr: 'lûka', en: 'Luke (name)', audio: 'luka', accentId: 'dugouzlazni' },
        note: 'Place vs person — pitch accent makes the difference',
      },
    ],
    quiz: [
      {
        q: 'The kratkosilazni accent can appear on which syllable?',
        opts: ['First syllable only', 'Any syllable', 'Last syllable only', 'Second syllable only'],
        correct: 'First syllable only',
      },
      {
        q: 'How long is the vowel in a kratkosilazni syllable?',
        opts: ['Short', 'Long', 'Variable', 'Silent'],
        correct: 'Short',
      },
      {
        q: 'Which word means "hail" (weather)?',
        opts: ['grȁd', 'grȃd', 'grád', 'gràd'],
        correct: 'grȁd',
      },
      {
        q: 'pȁs means "dog". What does pȃs mean?',
        opts: ['belt / waist', 'cat', 'dog (plural)', 'leg'],
        correct: 'belt / waist',
      },
    ],
  },
  {
    id: 'kratkouzlazni',
    symbol: '´',
    name: 'Kratkouzlazni',
    nameEn: 'Short-Rising',
    emoji: '⬆️',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    rule: 'Short vowel, pitch rises quickly. The MOST COMMON accent in Croatian.',
    desc: `The kratkouzlazni (short-rising) accent is the bread and butter of Croatian speech — you'll hear it constantly. It sounds like a quick, bright lift in pitch. Imagine an English speaker saying "really?" with genuine curiosity — that upward flick. In Croatian, it can appear on any syllable except the last one.`,
    examples: [
      {
        hr: 'vòda',
        en: 'water',
        audio: 'voda',
        tip: 'First syllable rises, the whole word sounds alive',
      },
      {
        hr: 'žèna',
        en: 'woman / wife',
        audio: 'žena',
        tip: 'Short rise on že-, then -na naturally fades',
      },
      {
        hr: 'nòga',
        en: 'leg / foot',
        audio: 'noga',
        tip: 'Everyday word with that characteristic lift',
      },
      { hr: 'sèlo', en: 'village', audio: 'selo', tip: 'Rural Croatian at its most musical' },
      {
        hr: 'kràva',
        en: 'cow',
        audio: 'krava',
        tip: 'Three letters, one rise — classic A1 vocabulary',
      },
      { hr: 'glàva', en: 'head', audio: 'glava', tip: 'Short-rising gla-, then -va trails off' },
    ],
    pairs: [
      {
        a: { hr: 'vòda', en: 'water', audio: 'voda', accentId: 'kratkouzlazni' },
        b: {
          hr: 'vȍda',
          en: 'water (archaic/dialectal)',
          audio: 'voda',
          accentId: 'kratkosilazni',
        },
        note: 'Standard Croatian uses the rising form — the most common Croatian word for water',
      },
      {
        a: { hr: 'nòga', en: 'leg (nom.)', audio: 'noga', accentId: 'kratkouzlazni' },
        b: {
          hr: 'nȏga',
          en: 'leg (some dialects, long-rising variant)',
          audio: 'noga',
          accentId: 'dugouzlazni',
        },
        note: 'Hear the difference: short-rising vs long-rising on the first syllable',
      },
      {
        a: { hr: 'glàva', en: 'head', audio: 'glava', accentId: 'kratkouzlazni' },
        b: { hr: 'glâva', en: 'head (some dialects)', audio: 'glava', accentId: 'dugosilazni' },
        note: 'Standard uses kratkouzlazni; Dalmatian variants may differ',
      },
    ],
    quiz: [
      {
        q: 'The kratkouzlazni accent is described as what?',
        opts: [
          'The most common Croatian accent',
          'Only in formal speech',
          'Only in Dalmatia',
          'The rarest accent',
        ],
        correct: 'The most common Croatian accent',
      },
      {
        q: "On which syllable CAN'T the kratkouzlazni appear?",
        opts: ['The last syllable', 'The first syllable', 'The second syllable', 'Any syllable'],
        correct: 'The last syllable',
      },
      {
        q: 'Which word means "water" in standard Croatian?',
        opts: ['vòda', 'vȍda', 'vȃda', 'vôda'],
        correct: 'vòda',
      },
      { q: 'What does glàva mean?', opts: ['head', 'hand', 'foot', 'shoulder'], correct: 'head' },
    ],
  },
  {
    id: 'dugosilazni',
    symbol: '¯',
    name: 'Dugosilazni',
    nameEn: 'Long-Falling',
    emoji: '📉',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    rule: 'Long vowel, pitch falls slowly. Sounds weighty and definitive. First syllable only.',
    desc: `The dugosilazni (long-falling) accent sounds authoritative and deliberate — like someone making a firm statement. The vowel is held longer before the pitch falls. Think of how a news anchor pronounces a city name: "ZAGREB" — that sustained, falling note. In Croatian formal speech and newsreader pronunciation, you hear this accent on key words.`,
    examples: [
      {
        hr: 'grȃd',
        en: 'city / town',
        audio: 'grad',
        tip: 'vs. grȁd = hail — this one sounds weightier, more important',
      },
      { hr: 'rȃd', en: 'work / labor', audio: 'rad', tip: 'Single syllable held long, then drops' },
      {
        hr: 'pȃs',
        en: 'belt / waist',
        audio: 'pas',
        tip: 'vs. pȁs = dog — the long vowel changes the meaning entirely',
      },
      { hr: 'stȃn', en: 'apartment', audio: 'stan', tip: 'Essential word for moving to Croatia' },
      {
        hr: 'bȃn',
        en: 'governor (historical title)',
        audio: 'ban',
        tip: 'Croatian history in one word — the Ban of Croatia',
      },
      {
        hr: 'pȃr',
        en: 'pair / couple',
        audio: 'par',
        tip: 'Shopping vocabulary: a pair of shoes = par cipela',
      },
    ],
    pairs: [
      {
        a: { hr: 'grȃd', en: 'city', audio: 'grad', accentId: 'dugosilazni' },
        b: { hr: 'grȁd', en: 'hail', audio: 'grad', accentId: 'kratkosilazni' },
        note: 'The word for "city" sounds more important — the long vowel adds weight',
      },
      {
        a: { hr: 'pȃs', en: 'belt / waist', audio: 'pas', accentId: 'dugosilazni' },
        b: { hr: 'pȁs', en: 'dog', audio: 'pas', accentId: 'kratkosilazni' },
        note: 'Long vowel = belt; short vowel = dog. Context is everything.',
      },
      {
        a: { hr: 'rȃd', en: 'work (noun)', audio: 'rad', accentId: 'dugosilazni' },
        b: {
          hr: 'ràd',
          en: 'willing/glad to (as in rad ću)',
          audio: 'rad',
          accentId: 'kratkouzlazni',
        },
        note: '"Rado" (gladly) has a different pitch pattern than "rad" (work)',
      },
    ],
    quiz: [
      {
        q: 'How long is the vowel in a dugosilazni syllable?',
        opts: ['Long', 'Short', 'Variable', 'Depends on context'],
        correct: 'Long',
      },
      {
        q: 'grȃd means city. What does grȁd mean?',
        opts: ['hail (weather)', 'garden', 'wall', 'gate'],
        correct: 'hail (weather)',
      },
      {
        q: 'The dugosilazni accent sounds like:',
        opts: ['A sustained, falling note', 'A quick rise', 'A quick drop', 'A sustained rise'],
        correct: 'A sustained, falling note',
      },
      {
        q: 'Which word means "apartment"?',
        opts: ['stȃn', 'stȁn', 'stàn', 'stân'],
        correct: 'stȃn',
      },
    ],
  },
  {
    id: 'dugouzlazni',
    symbol: 'ˆ',
    name: 'Dugouzlazni',
    nameEn: 'Long-Rising',
    emoji: '📈',
    color: '#0e7490',
    bg: '#f0f9ff',
    border: '#bae6fd',
    rule: 'Long vowel, pitch rises slowly. Sounds musical, almost questioning. Any syllable except last.',
    desc: `The dugouzlazni (long-rising) accent is the most musical of the four — it sounds warm and almost questioning. Imagine someone saying "really?" with a long, rising lilt. The vowel is held longer while the pitch climbs. You hear it most clearly in Dalmatian Croatian, which has a distinctive sing-song quality that comes largely from this accent on key words.`,
    examples: [
      {
        hr: 'rûka',
        en: 'hand / arm',
        audio: 'ruka',
        tip: 'The classic example — feel the vowel held long while pitch rises',
      },
      {
        hr: 'lûka',
        en: 'Luke (male name)',
        audio: 'luka',
        tip: 'vs. lȕka = harbor — the name rises, the place falls',
      },
      { hr: 'nȏž', en: 'knife', audio: 'nož', tip: 'Single syllable held with rising melody' },
      {
        hr: 'sȏl',
        en: 'salt',
        audio: 'sol',
        tip: 'Essential kitchen vocabulary with musical quality',
      },
      {
        hr: 'stȏl',
        en: 'table',
        audio: 'stol',
        tip: 'Home furniture — the word itself sounds solid yet uplifted',
      },
      {
        hr: 'mȏre',
        en: 'sea',
        audio: 'more',
        tip: 'The Dalmatian spirit — hear the long, rising quality on the first syllable',
      },
    ],
    pairs: [
      {
        a: { hr: 'lûka', en: 'Luke (name)', audio: 'luka', accentId: 'dugouzlazni' },
        b: { hr: 'lȕka', en: 'harbor', audio: 'luka', accentId: 'kratkosilazni' },
        note: 'Long-rising for the person, short-falling for the place',
      },
      {
        a: { hr: 'rûka', en: 'hand/arm', audio: 'ruka', accentId: 'dugouzlazni' },
        b: { hr: 'rùka', en: 'hand (dialectal variant)', audio: 'ruka', accentId: 'kratkouzlazni' },
        note: 'Standard Croatian uses the long-rising form for "hand"',
      },
      {
        a: { hr: 'nȏž', en: 'knife (nom.)', audio: 'nož', accentId: 'dugouzlazni' },
        b: { hr: 'nòžu', en: 'to/for the knife (dat.)', audio: 'nožu', accentId: 'kratkouzlazni' },
        note: 'Case endings can shift the accent — this is advanced, but notice the change',
      },
    ],
    quiz: [
      {
        q: 'The dugouzlazni sounds most like:',
        opts: ['A long, rising musical note', 'A quick drop', 'A short rise', 'A sustained fall'],
        correct: 'A long, rising musical note',
      },
      {
        q: 'Which form of Croatian speech often features lots of dugouzlazni?',
        opts: ['Dalmatian Croatian', 'Zagreb city speech', 'Slavonian', 'Kajkavian'],
        correct: 'Dalmatian Croatian',
      },
      { q: 'rûka means:', opts: ['hand / arm', 'foot', 'head', 'shoulder'], correct: 'hand / arm' },
      {
        q: 'lûka vs lȕka — which is the male name "Luke"?',
        opts: ['lûka (long-rising)', 'lȕka (short-falling)', 'They are the same', 'Neither'],
        correct: 'lûka (long-rising)',
      },
    ],
  },
];

const PRACTICAL = {
  title: 'Pitch Accent in Real Speech',
  subtitle: 'What actually matters for learners',
  emoji: '🗣️',
  color: '#7c3aed',
  bg: '#f5f3ff',
  border: '#ddd6fe',
  sections: [
    {
      heading: 'The truth about pitch accent',
      text: `Most native Croatian speakers don't consciously think about pitch accent — they acquired it naturally as children. When you ask a Croatian person "what accent is that word?", many won't know the technical term, even though they produce it perfectly. This is important: you don't need to master pitch accent production to communicate. What you need is awareness — so you're not confused when words sound "different" from what you expect.`,
    },
    {
      heading: 'Regional variation is massive',
      text: `The pitch accent system described here is standard Neo-Štokavian Croatian — what you hear on HRT (Croatian Radio-Television). But Zagreb street speech, Dalmatian coastal Croatian, and Slavonian Croatian all sound different. Dalmatian Croatian has a beautiful sing-song quality (lots of dugouzlazni). Zagreb is more "flat" in everyday speech. Don't panic if what you hear in Split sounds nothing like this — it's all authentic Croatian.`,
    },
    {
      heading: 'Focus on vowel length first',
      text: `For production, vowel length (long vs short vowel) is more noticeable to native ears than pitch direction. Croatians will almost never misunderstand you because you used a falling instead of rising pitch. But they might be confused if you shorten a long vowel or lengthen a short one. When in doubt: learn whether a vowel is long or short — the pitch direction will come naturally with exposure.`,
    },
    {
      heading: 'The passive recognition rule',
      text: `At minimum, know these patterns: (1) If a word has two syllables and the first sounds heavier/longer than you expect — it's probably a falling accent. (2) If a word sounds unexpectedly bright or questioning — it's a rising accent. (3) If two words look identical in text but sound different — pitch accent is distinguishing them. Over time, you'll internalize these without thinking.`,
    },
  ],
  tips: [
    {
      icon: '🎵',
      text: 'Klapa music is your best teacher. The melodies follow Croatian pitch accent naturally — your ear absorbs the patterns through song.',
    },
    {
      icon: '📻',
      text: 'HRT Radio newsreaders use textbook standard pronunciation. Listen for 10 minutes a day and the patterns sink in.',
    },
    {
      icon: '🔄',
      text: "Shadowing works: play a Croatian sentence, pause, repeat it back immediately. Don't think — just mimic the melody.",
    },
    {
      icon: '📝',
      text: 'When learning a new word, look up its pitch accent notation in a Croatian dictionary (rječnik). The best free one is hjp.znanje.hr.',
    },
  ],
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function PitchAccentMastery({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (pts: number, celebrate?: boolean, activityType?: string) => void;
}) {
  const { setStats, writeDelta } = useStats();
  const [phase, setPhase] = useState('intro'); // intro | lesson | practical | done
  const [accentIdx, setAccentIdx] = useState(0);
  const [lessonPhase, setLessonPhase] = useState('theory'); // theory | examples | pairs | quiz
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSelected, setQuizSelected] = useState(-1);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [_completedAccents, setCompletedAccents] = useState(new Set());
  const awardFired = useRef(false);

  const accent = ACCENTS[accentIdx]!;

  useEffect(() => {
    knightSpeak(
      'thinking',
      "Croatian pitch accent — one of Europe's last living tonal systems. Most learners never study this. You're about to go deeper than 99% of Croatian students. 🎵",
      800,
    );
  }, []);

  function nextAccent() {
    setCompletedAccents((prev) => new Set([...prev, accent.id]));
    if (accentIdx < ACCENTS.length - 1) {
      setAccentIdx((i) => i + 1);
      setLessonPhase('theory');
      setQuizIdx(0);
      setQuizSelected(-1);
      setQuizAnswered(false);
      setQuizScore(0);
    } else {
      setPhase('practical');
    }
  }

  function handleQuizAnswer(optIdx: number) {
    if (quizAnswered) return;
    const correct = accent.quiz[quizIdx]!.opts[optIdx]! === accent.quiz[quizIdx]!.correct;
    setQuizSelected(optIdx);
    setQuizAnswered(true);
    if (correct) setQuizScore((s) => s + 1);
  }

  function nextQuiz() {
    if (quizIdx < accent.quiz.length - 1) {
      setQuizIdx((i) => i + 1);
      setQuizSelected(-1);
      setQuizAnswered(false);
    } else {
      // Finished all quiz questions for this accent
      knightSpeak(
        quizScore >= accent.quiz.length - 1 ? 'celebrating' : 'encouraged',
        quizScore >= accent.quiz.length - 1
          ? `Savršeno! You\'ve mastered the ${accent.nameEn} accent. ${accentIdx < ACCENTS.length - 1 ? 'On to the next one!' : 'Almost there!'} 🌟`
          : `Dobro! ${quizScore}/${accent.quiz.length} — review the examples and it\'ll click. 💪`,
        300,
      );
      nextAccent();
    }
  }

  function finishCourse() {
    if (!awardFired.current) {
      awardFired.current = true;
      if (typeof award === 'function') award(40, false, 'pronunciation');
      markQuest('grammar');
      setStats((s) => ({ ...s, gc: s.gc + 1 }));
      writeDelta({ gc: 1 });
      knightSpeak(
        'victory',
        'Nevjerojatno! You completed the Croatian Pitch Accent course. You now know something most Croatian textbooks never teach. Čestitam! 🏆',
        400,
      );
    }
    setPhase('done');
  }

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === 'intro')
    return (
      <div className="scr-wrap">
        <button className="b bg" style={{ marginBottom: 16, fontSize: 13 }} onClick={goBack}>
          ← Back
        </button>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>🎵</div>
          <h2
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 26,
              color: '#164e63',
              fontWeight: 900,
              marginBottom: 8,
            }}
          >
            Croatian Pitch Accent
          </h2>
          <p
            style={{
              fontSize: 14,
              color: '#78716c',
              lineHeight: 1.6,
              maxWidth: 320,
              margin: '0 auto',
            }}
          >
            Croatian is one of only a handful of European languages with a living pitch accent
            system — like Japanese or Ancient Greek. No other Croatian language app teaches this.
          </p>
        </div>

        {/* Knight */}
        <div
          style={{
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start',
            background: 'var(--card)',
            border: '1px solid var(--card-b)',
            borderRadius: 16,
            padding: '14px 16px',
            marginBottom: 20,
          }}
        >
          <CharacterPortrait name="kovac" size={52} />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#7c3aed',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                marginBottom: 4,
              }}
            >
              prof. Kovač kaže
            </div>
            <div style={{ fontSize: 13, color: 'var(--body)', lineHeight: 1.6 }}>
              Pitch accent is why Croatian sounds like music to foreign ears. It&apos;s also why two
              words can be spelled identically but mean completely different things. Master this and
              your comprehension jumps a full level.
            </div>
          </div>
        </div>

        {/* The 4 accents overview */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              color: '#78716c',
              textTransform: 'uppercase',
              letterSpacing: '.1em',
              marginBottom: 12,
            }}
          >
            The 4 Croatian Pitch Accents
          </div>
          {ACCENTS.map((a) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                padding: '10px 14px',
                background: a.bg,
                border: `1.5px solid ${a.border}`,
                borderRadius: 12,
                marginBottom: 8,
              }}
            >
              <div style={{ fontSize: 22, flexShrink: 0 }}>{a.emoji}</div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: a.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  {a.nameEn}{' '}
                  <span style={{ fontWeight: 500, color: '#78716c', fontSize: 11 }}>
                    ({a.name})
                  </span>
                  <span
                    className={`cefr cefr-${(LESSON_BY_ACCENT[a.id as keyof typeof LESSON_BY_ACCENT]?.cefr ?? 'B1').toLowerCase()}`}
                  >
                    {LESSON_BY_ACCENT[a.id as keyof typeof LESSON_BY_ACCENT]?.cefr ?? 'B1'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#78716c', marginTop: 1 }}>{a.rule}</div>
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: a.color,
                  fontFamily: 'monospace',
                  flexShrink: 0,
                }}
              >
                {a.symbol}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg,#fef3c7,#fde68a)',
            border: '1px solid #fcd34d',
            borderRadius: 14,
            padding: '12px 16px',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              color: '#92400e',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              marginBottom: 6,
            }}
          >
            What you&apos;ll learn
          </div>
          {[
            'How each of the 4 accents sounds and feels',
            'Minimal pairs — identical words with different meanings',
            'Regional variation (Dalmatia vs Zagreb vs HRT standard)',
            'Practical rules: what actually matters for comprehension',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <span style={{ color: '#d97706', fontWeight: 800, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 12, color: '#78350f' }}>{item}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => setPhase('lesson')}
          style={{
            width: '100%',
            padding: '15px 20px',
            background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
            color: '#fff',
            border: 'none',
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 900,
            cursor: 'pointer',
            fontFamily: "'Outfit',sans-serif",
            boxShadow: '0 6px 20px rgba(124,58,237,.35)',
          }}
        >
          Start Course → 4 Lessons
        </button>
      </div>
    );

  // ── LESSON ────────────────────────────────────────────────────────────────
  if (phase === 'lesson') {
    const currentQ = accent.quiz[quizIdx];

    return (
      <div className="scr-wrap">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button
            onClick={() => {
              lessonPhase === 'theory' ? setPhase('intro') : setLessonPhase('theory');
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 13,
              color: 'var(--subtext)',
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
              fontWeight: 700,
              padding: '4px 0',
            }}
          >
            ← Back
          </button>
          <div style={{ flex: 1 }}>
            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 6 }}>
              {ACCENTS.map((a, i) => (
                <div
                  key={a.id}
                  style={{
                    height: 4,
                    flex: 1,
                    borderRadius: 2,
                    background:
                      i < accentIdx ? '#16a34a' : i === accentIdx ? accent.color : 'var(--card-b)',
                    transition: 'background .3s',
                  }}
                />
              ))}
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--subtext)' }}>
            {accentIdx + 1}/{ACCENTS.length}
          </div>
        </div>

        {/* Accent identity card */}
        <div
          style={{
            background: accent.bg,
            border: `2px solid ${accent.border}`,
            borderRadius: 20,
            padding: '18px 20px',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 48 }}>{accent.emoji}</div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: accent.color,
              fontFamily: 'monospace',
              letterSpacing: '.05em',
              marginBottom: 4,
            }}
          >
            {accent.symbol}
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: accent.color }}>{accent.nameEn}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#78716c', marginTop: 2 }}>
            {accent.name}
          </div>
          <div
            style={{
              marginTop: 10,
              padding: '8px 16px',
              background: 'white',
              borderRadius: 12,
              display: 'inline-block',
              fontSize: 12,
              fontWeight: 700,
              color: accent.color,
            }}
          >
            {accent.rule}
          </div>
        </div>

        {/* Sub-navigation pills */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {[
            { id: 'theory', label: '📖 Theory' },
            { id: 'examples', label: '🔊 Examples' },
            { id: 'pairs', label: '⚔️ Pairs' },
            { id: 'quiz', label: '🎯 Quiz' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setLessonPhase(tab.id)}
              style={{
                flex: 1,
                padding: '8px 4px',
                border: `1px solid ${lessonPhase === tab.id ? accent.color : 'var(--card-b)'}`,
                borderRadius: 10,
                background: lessonPhase === tab.id ? accent.color : 'var(--card)',
                color: lessonPhase === tab.id ? '#fff' : 'var(--subtext)',
                fontWeight: 700,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all .2s',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* THEORY */}
        {lessonPhase === 'theory' &&
          (() => {
            const lesson = (
              LESSON_BY_ACCENT as Record<
                string,
                (typeof LESSON_BY_ACCENT)[keyof typeof LESSON_BY_ACCENT]
              >
            )[accent.id];
            return (
              <div>
                <div
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--card-b)',
                    borderRadius: 16,
                    padding: '16px',
                    marginBottom: 12,
                    fontSize: 14,
                    color: 'var(--body)',
                    lineHeight: 1.8,
                  }}
                >
                  {(lesson?.theory || accent.desc).split('\n\n').map((para: string, i: number) => (
                    <p key={i} style={{ margin: i === 0 ? 0 : '12px 0 0' }}>
                      {para}
                    </p>
                  ))}
                </div>
                {(lesson?.keyPoints?.length ?? 0) > 0 && (
                  <div
                    style={{
                      background: `${accent.bg}`,
                      border: `1px solid ${accent.border}`,
                      borderRadius: 14,
                      padding: '14px 16px',
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 900,
                        color: accent.color,
                        textTransform: 'uppercase',
                        letterSpacing: '.08em',
                        marginBottom: 10,
                      }}
                    >
                      Key Points
                    </div>
                    {lesson?.keyPoints?.map((pt: string, i: number) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          gap: 10,
                          marginBottom: i < (lesson?.keyPoints?.length ?? 0) - 1 ? 8 : 0,
                          alignItems: 'flex-start',
                        }}
                      >
                        <div
                          style={{ fontSize: 14, color: accent.color, flexShrink: 0, marginTop: 1 }}
                        >
                          •
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--body)', lineHeight: 1.55 }}>
                          {pt}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setLessonPhase('examples')}
                  style={{
                    width: '100%',
                    padding: '13px',
                    background: accent.color,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 14,
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: "'Outfit',sans-serif",
                  }}
                >
                  Hear Examples →
                </button>
              </div>
            );
          })()}

        {/* EXAMPLES */}
        {lessonPhase === 'examples' && (
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                color: '#78716c',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                marginBottom: 12,
              }}
            >
              Tap to hear each word
            </div>
            {accent.examples.map((ex, i) => (
              <button
                key={i}
                onClick={() => speak(ex.audio)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  background: 'var(--card)',
                  border: `1.5px solid var(--card-b)`,
                  borderLeft: `4px solid ${accent.color}`,
                  borderRadius: 14,
                  padding: '14px 16px',
                  marginBottom: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: 26, flexShrink: 0 }}>🔊</div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 900,
                      color: accent.color,
                      fontFamily: "'Playfair Display',serif",
                    }}
                  >
                    {ex.hr}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--subtext)', fontWeight: 600 }}>
                    {ex.en}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--subtext)',
                      marginTop: 3,
                      fontStyle: 'italic',
                    }}
                  >
                    {ex.tip}
                  </div>
                </div>
              </button>
            ))}
            <button
              onClick={() => setLessonPhase('pairs')}
              style={{
                width: '100%',
                padding: '13px',
                background: accent.color,
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
                marginTop: 8,
              }}
            >
              Minimal Pairs →
            </button>
          </div>
        )}

        {/* MINIMAL PAIRS */}
        {lessonPhase === 'pairs' && (
          <div>
            <div
              style={{
                background: 'var(--card)',
                border: '1px solid var(--card-b)',
                borderRadius: 14,
                padding: '12px 16px',
                marginBottom: 16,
                fontSize: 12,
                color: 'var(--subtext)',
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: 'var(--heading)' }}>Minimal pairs</strong> are words that look
              identical in everyday text but have different pitch accents — and therefore different
              meanings. Croatian accent marks are only used in dictionaries and linguistic texts, so
              spoken context is crucial.{' '}
              <span style={{ fontStyle: 'italic', color: '#a16207' }}>
                Audio uses an approximate synthesized pitch contour — not a native recording, but
                acoustically distinct between the two members.
              </span>
            </div>
            {accent.pairs.map((pair, i) => (
              <div
                key={i}
                data-testid={`pair-card-${accent.id}-${i}`}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--card-b)',
                  borderRadius: 16,
                  padding: '16px',
                  marginBottom: 12,
                }}
              >
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <button
                    data-testid={`pair-member-a-${accent.id}-${i}`}
                    onClick={() =>
                      speakProsody(
                        pair.a.audio,
                        ACCENT_PROSODY[
                          (pair.a as { accentId?: string }).accentId ?? 'kratkosilazni'
                        ] ?? ACCENT_PROSODY.kratkosilazni!,
                      )
                    }
                    style={{
                      flex: 1,
                      padding: '14px 10px',
                      background: accent.bg,
                      border: `2px solid ${accent.border}`,
                      borderRadius: 12,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: accent.color,
                        fontFamily: "'Playfair Display',serif",
                      }}
                    >
                      {pair.a.hr}
                    </div>
                    <div style={{ fontSize: 12, color: '#78716c', marginTop: 3 }}>{pair.a.en}</div>
                    <div style={{ fontSize: 18, marginTop: 4 }}>🔊</div>
                  </button>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontWeight: 900,
                      color: '#78716c',
                      fontSize: 20,
                    }}
                  >
                    vs
                  </div>
                  <button
                    data-testid={`pair-member-b-${accent.id}-${i}`}
                    onClick={() =>
                      speakProsody(
                        pair.b.audio,
                        ACCENT_PROSODY[
                          (pair.b as { accentId?: string }).accentId ?? 'kratkouzlazni'
                        ] ?? ACCENT_PROSODY.kratkouzlazni!,
                      )
                    }
                    style={{
                      flex: 1,
                      padding: '14px 10px',
                      background: 'var(--card)',
                      border: '2px solid var(--card-b)',
                      borderRadius: 12,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: 'var(--heading)',
                        fontFamily: "'Playfair Display',serif",
                      }}
                    >
                      {pair.b.hr}
                    </div>
                    <div style={{ fontSize: 12, color: '#78716c', marginTop: 3 }}>{pair.b.en}</div>
                    <div style={{ fontSize: 18, marginTop: 4 }}>🔊</div>
                  </button>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--subtext)',
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                    padding: '8px 12px',
                    background: '#f9f9f9',
                    borderRadius: 8,
                  }}
                >
                  {pair.note}
                </div>
              </div>
            ))}
            <button
              onClick={() => {
                setLessonPhase('quiz');
                setQuizIdx(0);
                setQuizSelected(-1);
                setQuizAnswered(false);
                setQuizScore(0);
              }}
              style={{
                width: '100%',
                padding: '13px',
                background: accent.color,
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
                marginTop: 8,
              }}
            >
              Take the Quiz →
            </button>
          </div>
        )}

        {/* QUIZ */}
        {lessonPhase === 'quiz' && currentQ && (
          <div>
            {/* Progress */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {accent.quiz.map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    background:
                      i < quizIdx ? '#16a34a' : i === quizIdx ? accent.color : 'var(--card-b)',
                  }}
                />
              ))}
            </div>

            <div
              style={{
                background: 'var(--card)',
                border: '1px solid var(--card-b)',
                borderRadius: 16,
                padding: '18px 16px',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: accent.color,
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  marginBottom: 8,
                }}
              >
                Question {quizIdx + 1} of {accent.quiz.length}
              </div>
              <div
                style={{ fontSize: 16, fontWeight: 800, color: 'var(--heading)', lineHeight: 1.5 }}
              >
                {currentQ.q}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {currentQ.opts.map((opt, i) => {
                const isCorrect = opt === currentQ.correct;
                const isSelected = quizSelected === i;
                let bg = 'var(--card)',
                  border = '1.5px solid var(--card-b)',
                  color = 'var(--body)';
                if (quizAnswered) {
                  if (isCorrect) {
                    bg = '#f0fdf4';
                    border = '2px solid #16a34a';
                    color = '#166534';
                  } else if (isSelected && !isCorrect) {
                    bg = '#fff1f2';
                    border = '2px solid #dc2626';
                    color = '#9b1c1c';
                  }
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleQuizAnswer(i)}
                    disabled={quizAnswered}
                    style={{
                      padding: '14px 16px',
                      background: bg,
                      border,
                      borderRadius: 12,
                      textAlign: 'left',
                      fontSize: 14,
                      fontWeight: 600,
                      color,
                      cursor: quizAnswered ? 'default' : 'pointer',
                      fontFamily: "'Outfit',sans-serif",
                      transition: 'all .2s',
                    }}
                  >
                    {quizAnswered && isCorrect && '✓ '}
                    {quizAnswered && isSelected && !isCorrect && '✗ '}
                    {opt}
                  </button>
                );
              })}
            </div>

            {quizAnswered && (
              <button
                onClick={nextQuiz}
                style={{
                  width: '100%',
                  padding: '13px',
                  background: accent.color,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 14,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: "'Outfit',sans-serif",
                }}
              >
                {quizIdx < accent.quiz.length - 1
                  ? 'Next Question →'
                  : accentIdx < ACCENTS.length - 1
                    ? `Next Accent: ${ACCENTS[accentIdx + 1]!.nameEn} →`
                    : 'Final Section →'}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── PRACTICAL ────────────────────────────────────────────────────────────
  if (phase === 'practical')
    return (
      <div className="scr-wrap">
        <button
          className="b bg"
          style={{ marginBottom: 16, fontSize: 13 }}
          onClick={() => setPhase('lesson')}
        >
          ← Back
        </button>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 48 }}>{PRACTICAL.emoji}</div>
          <h2
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 22,
              color: '#164e63',
              fontWeight: 900,
              marginBottom: 4,
            }}
          >
            {PRACTICAL.title}
          </h2>
          <p style={{ fontSize: 13, color: '#78716c' }}>{PRACTICAL.subtitle}</p>
        </div>

        {PRACTICAL.sections.map((s, i) => (
          <div
            key={i}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--card-b)',
              borderLeft: `4px solid #7c3aed`,
              borderRadius: 14,
              padding: '14px 16px',
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: '#5b21b6', marginBottom: 6 }}>
              {s.heading}
            </div>
            <div style={{ fontSize: 13, color: 'var(--body)', lineHeight: 1.7 }}>{s.text}</div>
          </div>
        ))}

        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              color: '#78716c',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              marginBottom: 10,
            }}
          >
            Practical Tips
          </div>
          {PRACTICAL.tips.map((t, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 12,
                padding: '10px 14px',
                background: '#f5f3ff',
                border: '1px solid #ddd6fe',
                borderRadius: 12,
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>{t.icon}</span>
              <span style={{ fontSize: 13, color: '#44403c', lineHeight: 1.6 }}>{t.text}</span>
            </div>
          ))}
        </div>

        <button
          onClick={finishCourse}
          style={{
            width: '100%',
            padding: '15px 20px',
            background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
            color: '#fff',
            border: 'none',
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 900,
            cursor: 'pointer',
            fontFamily: "'Outfit',sans-serif",
            boxShadow: '0 6px 20px rgba(124,58,237,.35)',
          }}
        >
          Complete Course → +40 XP
        </button>
      </div>
    );

  // ── DONE ─────────────────────────────────────────────────────────────────
  return (
    <div className="scr-wrap" style={{ textAlign: 'center', paddingTop: 40 }}>
      <div style={{ fontSize: 80, marginBottom: 16 }}>🏆</div>
      <h2
        style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: 26,
          color: '#164e63',
          fontWeight: 900,
          marginBottom: 8,
        }}
      >
        Course Complete!
      </h2>
      <p
        style={{
          fontSize: 14,
          color: '#78716c',
          lineHeight: 1.6,
          maxWidth: 300,
          margin: '0 auto 24px',
        }}
      >
        You&apos;ve mastered Croatian pitch accent theory — something most learners never study.
        Your listening comprehension just leveled up.
      </p>
      <div
        style={{
          background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)',
          border: '2px solid #c4b5fd',
          borderRadius: 20,
          padding: '20px',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {ACCENTS.map((a) => (
            <div key={a.id} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28 }}>{a.emoji}</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: a.color, marginTop: 2 }}>
                {a.nameEn.split('-')[0]}
              </div>
              <div style={{ fontSize: 18, color: '#16a34a', fontWeight: 900 }}>✓</div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={goBack} className="b bp" style={{ width: '100%' }}>
        Continue →
      </button>
    </div>
  );
}
