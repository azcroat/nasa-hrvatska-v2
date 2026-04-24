/**
 * HeritagePathScreen — a structured learning track for heritage Croatian speakers.
 *
 * Heritage speakers grew up hearing Croatian at home but never formally learned it.
 * They have passive knowledge (understand 60-80%) but struggle to produce actively.
 * This track focuses on activating what's already there, not starting from zero.
 */
import React, { useState, useEffect, useRef } from 'react';
import type { AwardActivityType } from '../../types/index.js';
import { speak } from '../../data';
import { markQuest } from '../../lib/quests.js';
import { knightSpeak } from '../../lib/knightSpeak.js';
import CroatianKnight from '../shared/CroatianKnight';

// ── Heritage module data ──────────────────────────────────────────────────────

const DIALECT_AWARENESS = [
  {
    name: 'Štokavian (Štokavski)',
    color: '#0e7490',
    bg: '#f0f9ff',
    icon: '📜',
    spoken: 'Standard Croatian, Slavonia, most of Dalmatia, Bosna i Hercegovina',
    hallmark: 'Uses "što" for "what" — the basis of the literary standard',
    examples: [
      { q: 'What?', a: 'Što?' },
      { q: 'I am going.', a: 'Ja idem.' },
      { q: 'house', a: 'kuća' },
    ],
    note: "This is what HRT broadcasts and what you'll learn in textbooks. Your grandparents from Slavonia or Dalmatia likely speak a regional variant of this.",
  },
  {
    name: 'Kajkavian (Kajkavski)',
    color: '#7c3aed',
    bg: '#f5f3ff',
    icon: '🏙️',
    spoken: 'Zagreb, Zagorje, Međimurje, Podravina',
    hallmark:
      'Uses "kaj" for "what" — distinct vowel system, sounds like a different language to outsiders',
    examples: [
      { q: 'What?', a: 'Kaj?' },
      { q: 'I am going.', a: 'Ja idem.' },
      { q: 'house', a: 'hiža' },
    ],
    note: 'If your family is from Zagreb or Zagorje, you might hear "kaj" constantly. This is not "bad Croatian" — it\'s a co-equal dialect with a rich literary tradition.',
  },
  {
    name: 'Čakavian (Čakavski)',
    color: '#16a34a',
    bg: '#f0fdf4',
    icon: '⛵',
    spoken: 'Istria, Kvarner islands, Dalmatian islands (Brač, Hvar, Korčula)',
    hallmark:
      'Uses "ča" for "what" — oldest documented Croatian dialect, closest to medieval Croatian',
    examples: [
      { q: 'What?', a: 'Ča?' },
      { q: 'I am going.', a: 'Ja gremu.' },
      { q: 'house', a: 'hiža' },
    ],
    note: 'Čakavian is why Istrian and island Croatian sounds so distinctive — and so beautiful. Marco Polo reportedly spoke this dialect. UNESCO has recognized several Čakavian traditions.',
  },
];

const PASSIVE_TO_ACTIVE = [
  {
    id: 'greeting',
    icon: '👋',
    title: 'Activating Greetings',
    subtitle: 'You know these — just say them first',
    color: '#0e7490',
    passive_note:
      "You've heard these your entire life. The block isn't knowledge — it's the habit of using Croatian first, before English takes over.",
    exercises: [
      {
        prompt: 'How do you greet your grandparents in the morning?',
        answer: 'Dobro jutro, bako/djede!',
        alt: ['Dobro jutro!', 'Jutro!'],
        note: 'Bako is vocative of baka (grandma), djede is vocative of djed (grandpa)',
      },
      {
        prompt: 'How does your baka answer the phone?',
        answer: 'Halo? Tko je?',
        alt: ['Halo?', 'Ja slušam.'],
        note: '"Tko je?" = "Who is it?" — you\'ve heard this hundreds of times',
      },
      {
        prompt: 'What do you say before eating?',
        answer: 'Dobar tek!',
        alt: ['Jedemo!', 'Hajdemo jesti.'],
        note: 'Like "bon appétit" — you already know this one',
      },
      {
        prompt: 'How do you say goodbye to family?',
        answer: 'Ćao! / Zdravo! / Pusa!',
        alt: ['Doviđenja!', 'Pa bok!'],
        note: '"Pusa!" (a kiss) is very family-specific — if your family uses it, you already know it',
      },
    ],
  },
  {
    id: 'family',
    icon: '👨‍👩‍👧',
    title: 'Family Terms You Already Know',
    subtitle: 'Activating your family vocabulary',
    color: '#d97706',
    passive_note:
      'Heritage speakers typically know family terms perfectly — but struggle to produce them in full sentences. These exercises build that bridge.',
    exercises: [
      {
        prompt: "How do you address your father's mother?",
        answer: 'Baka / Nona',
        alt: ['Baba', 'Stara mama'],
        note: '"Nona" is common in Dalmatia and diaspora communities. "Baba" is heard in some families — all valid.',
      },
      {
        prompt: "What's the word for your father's brother?",
        answer: 'Stric',
        alt: ["Ujak (mother's brother)"],
        note: "Croatian distinguishes father's brother (stric) from mother's brother (ujak) — does your family use both?",
      },
      {
        prompt: 'How do you say "my cousin" (male)?',
        answer: 'Moj bratić / moj rođak',
        alt: ['Cousin'],
        note: 'No exact English equivalent — "bratić" implies male cousin on father\'s side in some regional usage',
      },
      {
        prompt: 'What do you call the Saturday family gathering?',
        answer: 'Obiteljski ručak',
        alt: ['Ručak', 'Nedjeljna večera'],
        note: '"Ručak" (lunch) is the big midday meal in Croatian culture — more important than dinner',
      },
    ],
  },
  {
    id: 'food',
    icon: '🍽️',
    title: 'The Kitchen and the Table',
    subtitle: 'Where your Croatian is strongest',
    color: '#16a34a',
    passive_note:
      "Food and cooking vocabulary is almost always the strongest domain for heritage speakers — because baka used it every day. Let's activate it.",
    exercises: [
      {
        prompt: 'Name three dishes your baka makes.',
        answer: 'sarma, peka, štrukli, fritule, pašticada, brodetto...',
        alt: ['kulen', 'soparnik', 'makovnjača'],
        note: "These names ARE Croatian — you've been using them your whole life without knowing it",
      },
      {
        prompt: 'How does your family say "set the table"?',
        answer: 'Postavi stol! / Pokrij stol!',
        alt: ['Spremi stol!'],
        note: '"Postavi" and "pokrij" are both common — regional variation is real',
      },
      {
        prompt: "What's your family's word for the food storage pantry?",
        answer: 'Špiža / ostava / komora',
        alt: ['spremnica'],
        note: '"Špiža" is very Dalmatian/Istrian — if you\'ve heard this, you have coastal heritage',
      },
      {
        prompt: 'How do you ask for seconds at the table?',
        answer: 'Mogu još malo? / Daj mi još.',
        alt: ['Još jednom.', 'Nadam se još malo.'],
        note: '"Mogu" = "may I / can I" — your first Croatian modal verb, probably already in your vocabulary',
      },
    ],
  },
  {
    id: 'emotion',
    icon: '❤️',
    title: 'Emotional Language',
    subtitle: 'Croatian is how love is expressed',
    color: '#dc2626',
    passive_note:
      'Heritage speakers often find that their deepest emotional vocabulary is in Croatian — even when their everyday language has shifted to English. This is the language of the heart.',
    exercises: [
      {
        prompt: 'How do you tell your grandparent you love them?',
        answer: 'Volim te, bako!',
        alt: ['Ja te volim.', 'Ljubim te.'],
        note: '"Volim te" = "I love you" — this is the single most important Croatian sentence to say out loud',
      },
      {
        prompt: 'What does "srce moje" mean?',
        answer: 'my heart (term of endearment)',
        alt: ['my soul'],
        note: 'Croatian terms of endearment are among the most beautiful in any language — "srce moje", "dušo", "zlato moje" (my gold)',
      },
      {
        prompt: 'How do you say "I miss Croatia" (or your hometown)?',
        answer: 'Nedostaje mi Hrvatska.',
        alt: ['Čeznem za domovinom.', 'Tražim domovinu.'],
        note: '"Nedostaje mi" = "it is missing to me" — Croatian expresses missing as something that lacks from you, not that you lack it',
      },
      {
        prompt: "What's the Croatian word for homeland/home country?",
        answer: 'Domovina',
        alt: ['Zavičaj (hometown, local homeland)'],
        note: '"Za dom!" (For the homeland!) is etched in Croatian national memory. "Zavičaj" is the more intimate, local version.',
      },
    ],
  },
];

const GRAMMAR_GAPS = [
  {
    id: 'gender',
    title: "Noun Gender — You Know It, You Just Don't Know You Know It",
    color: '#7c3aed',
    icon: '🧩',
    intro:
      'Croatian has 3 genders. Heritage speakers usually get this right by ear — you just need to trust your instinct.',
    pattern:
      'Masculine: consonant ending (grad, muškarac, stol)\nFeminine: -a ending (žena, kuća, Hrvatska)\nNeuter: -o or -e ending (more, polje, dijete)',
    exercises: [
      {
        prompt: 'Which sounds right to you? "moj kuća" or "moja kuća"?',
        correct: 'moja kuća',
        explanation: 'Kuća is feminine (-a), so the adjective is also feminine: moja (my-fem.)',
      },
      {
        prompt: '"Lijep grad" or "lijepa grad"?',
        correct: 'Lijep grad',
        explanation:
          'Grad is masculine (ends in consonant), so masculine adjective form: lijep (not lijepa)',
      },
      {
        prompt: '"Plavo more" or "plavi more"?',
        correct: 'Plavo more',
        explanation: 'More is neuter (-e), so neuter adjective: plavo (blue-neut.)',
      },
    ],
  },
  {
    id: 'aspect',
    title: 'Verbal Aspect — The Hardest Thing No One Explained',
    color: '#d97706',
    icon: '⏱️',
    intro:
      "Croatian verbs come in pairs: imperfective (ongoing) and perfective (completed). You've heard both your whole life — let's name them.",
    pattern:
      'Imperfective (ongoing/repeated): pisati (to write/be writing), čitati (to read/be reading)\nPerfective (completed): napisati (to write [and finish]), pročitati (to read [and finish])',
    exercises: [
      {
        prompt: 'Baka is ALWAYS cooking on Sundays (ongoing). Which verb?',
        correct: 'Baka uvijek kuha nedjeljom. (kuhati, imperfective)',
        explanation:
          '"Kuha" is the imperfective — it\'s a repeated, ongoing habit. "Skuhala je" would mean "she has cooked [and it\'s done]".',
      },
      {
        prompt: 'She FINISHED writing the letter (completed). Which verb?',
        correct: 'Napisala je pismo. (napisati, perfective)',
        explanation:
          '"Napisala je" = she wrote and finished. "Pisala je" would mean she was writing (ongoing, may or may not have finished).',
      },
      {
        prompt: 'I understand Croatian (state, no completion). Which verb?',
        correct: 'Razumijem hrvatski. (razumjeti, imperfective)',
        explanation: 'Understanding is a state, not a completed action — always imperfective.',
      },
    ],
  },
  {
    id: 'cases',
    title: "Cases — You've Been Using Them Correctly Without Knowing",
    color: '#0e7490',
    icon: '📐',
    intro:
      'Croatian has 7 cases. Heritage speakers use them correctly in set phrases all the time. The goal is to name the pattern.',
    pattern:
      'Nominative: subject (Moja baka je lijepa.)\nAccusative: direct object (Volim baku.)\nDative: indirect object / to/for (Daj baki.)\nGenitive: possession / of (Kuća bake.)',
    exercises: [
      {
        prompt: '"Moja BAKA radi kolač." — which case is baka?',
        correct: 'Nominative — baka is the subject doing the action',
        explanation:
          'Base form, dictionary form. The subject of the sentence is always nominative.',
      },
      {
        prompt: '"Volim BAKU." — which case is baku?',
        correct: 'Accusative — baku is the direct object of love',
        explanation:
          'You\'ve been saying "volim baku" correctly your whole life — that -u ending is accusative feminine.',
      },
      {
        prompt: '"Daj to BAKI." — which case is baki?',
        correct: 'Dative — baki means "to/for grandma"',
        explanation:
          'Dative marks the recipient. "Baki" vs "baka" vs "baku" — three cases you already use correctly.',
      },
    ],
  },
];

const DIASPORA_VOCAB = [
  {
    heritage: 'friž(ider)',
    standard: 'hladnjak',
    en: 'refrigerator',
    note: 'Germanism/Anglicism used heavily in diaspora — standard Croatian is hladnjak',
  },
  {
    heritage: 'šofa',
    standard: 'vozač',
    en: 'driver',
    note: 'From German "Chauffeur" — still heard in older speech',
  },
  {
    heritage: 'auto',
    standard: 'automobil / auto',
    en: 'car',
    note: 'Actually both are fine — auto is colloquial but widely accepted',
  },
  {
    heritage: 'market',
    standard: 'tržnica / supermarket',
    en: 'market / supermarket',
    note: 'Heritage communities often use the English "market" — tržnica is the Croatian farmer\'s market',
  },
  {
    heritage: 'parking',
    standard: 'parkiralište',
    en: 'parking lot',
    note: '"Parking" is also used colloquially in Croatia — you\'re not wrong',
  },
  {
    heritage: 'šoping',
    standard: 'kupovina / nabavka',
    en: 'shopping',
    note: 'Anglicism that has entered Croatian — kupovina is the standard form',
  },
  {
    heritage: 'vikend',
    standard: 'vikend / kraj tjedna',
    en: 'weekend',
    note: '"Vikend" is fully accepted in Croatian — borrowed from English long ago',
  },
  {
    heritage: 'bejzbol',
    standard: 'bejzbol',
    en: 'baseball',
    note: "No Croatian equivalent — Croatian doesn't play it. This one's fine.",
  },
];

const HERITAGE_PROGRESS_KEY = 'nh_heritage_progress';
function loadProgress(): Set<string> {
  try {
    return new Set<string>(
      JSON.parse(localStorage.getItem(HERITAGE_PROGRESS_KEY) || '[]') as string[],
    );
  } catch {
    return new Set<string>();
  }
}
function saveProgress(set: Set<string>) {
  try {
    localStorage.setItem(HERITAGE_PROGRESS_KEY, JSON.stringify([...set]));
  } catch {}
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function HeritagePathScreen({
  goBack,
  award,
}: {
  goBack?: () => void;
  award?: (amt: number, celebrate?: boolean, activityType?: AwardActivityType) => void;
}) {
  const [section, setSection] = useState('home'); // home | dialects | passive | grammar | diaspora | done
  const [activeModule, setActiveModule] = useState(0);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [grammarModule, setGrammarModule] = useState(0);
  const [grammarExIdx, setGrammarExIdx] = useState(0);
  const [showGrammarAnswer, setShowGrammarAnswer] = useState(false);
  const [completed, setCompleted] = useState(() => loadProgress());
  const awardFired = useRef(false);

  useEffect(() => {
    knightSpeak(
      'happy',
      '"Koliko jezika znaš, toliko vrijediš." You already know Croatian in your heart — this path brings it to your tongue. 🇭🇷',
      800,
    );
  }, []);

  function completeModule(id: string) {
    setCompleted((prev) => {
      const next = new Set([...prev, id]);
      saveProgress(next);
      return next;
    });
  }

  function awardOnce(amt: number) {
    if (!awardFired.current) {
      awardFired.current = true;
      if (typeof award === 'function') award(amt, false, 'heritage');
      markQuest('reading');
    }
  }

  // ── HOME ────────────────────────────────────────────────────────────────
  if (section === 'home')
    return (
      <div className="scr-wrap">
        <button className="b bg" style={{ marginBottom: 16, fontSize: 13 }} onClick={goBack}>
          ← Back
        </button>

        {/* Hero */}
        <div
          style={{
            background: 'linear-gradient(135deg,#7c2d12,#9a3412,#c2410c)',
            borderRadius: 20,
            padding: '22px 20px',
            marginBottom: 20,
            color: '#fff',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,.7)',
              marginBottom: 6,
            }}
          >
            Heritage Speaker Path
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 900,
              fontFamily: "'Playfair Display',serif",
              marginBottom: 8,
              lineHeight: 1.2,
            }}
          >
            The Croatian you already know
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.85)', lineHeight: 1.65 }}>
            You grew up with Croatian voices, Croatian food, Croatian holidays. This language lives
            in you — it just needs a door opened. This track activates what&apos;s already there.
          </div>
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
          <CroatianKnight size={52} mood="happy" style={{ flexShrink: 0 }} />
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
              Vitez Hrvoje says
            </div>
            <div style={{ fontSize: 13, color: 'var(--body)', lineHeight: 1.65 }}>
              Heritage speakers are not beginners. You hear Croatian and understand the melody even
              if the words escape you. The goal here is not to learn — it&apos;s to{' '}
              <em>remember</em>. Big difference.
            </div>
          </div>
        </div>

        {/* Modules */}
        <div
          style={{
            marginBottom: 12,
            fontSize: 11,
            fontWeight: 900,
            color: '#78716c',
            textTransform: 'uppercase',
            letterSpacing: '.1em',
          }}
        >
          Your 4-Module Path
        </div>
        {[
          {
            id: 'dialects',
            icon: '🗺️',
            title: "Your Family's Dialect",
            desc: "Štokavian, Kajkavian, or Čakavian? Understand why your family's Croatian sounds different.",
            color: '#0e7490',
          },
          {
            id: 'passive',
            icon: '🔓',
            title: 'Passive → Active',
            desc: 'From understanding to speaking — activate the Croatian you already know in family contexts.',
            color: '#d97706',
          },
          {
            id: 'grammar',
            icon: '📐',
            title: 'The Grammar You Already Know',
            desc: 'Cases, aspect, gender — you use these correctly already. Now learn why they work.',
            color: '#7c3aed',
          },
          {
            id: 'diaspora',
            icon: '🌍',
            title: 'Heritage vs Standard Croatian',
            desc: 'Words your family uses that differ from standard Croatian — and what the standard equivalent is.',
            color: '#16a34a',
          },
        ].map((mod) => (
          <button
            key={mod.id}
            onClick={() => {
              setSection(mod.id);
              setActiveModule(0);
              setExerciseIdx(0);
              setShowAnswer(false);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              background: 'var(--card)',
              border: `1.5px solid ${completed.has(mod.id) ? '#16a34a' : 'var(--card-b)'}`,
              borderLeft: `4px solid ${completed.has(mod.id) ? '#16a34a' : mod.color}`,
              borderRadius: 14,
              padding: '14px 16px',
              marginBottom: 10,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 28, flexShrink: 0 }}>
              {completed.has(mod.id) ? '✅' : mod.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: completed.has(mod.id) ? '#16a34a' : 'var(--heading)',
                }}
              >
                {mod.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 2, lineHeight: 1.4 }}>
                {mod.desc}
              </div>
            </div>
            <div style={{ fontSize: 18, color: 'var(--subtext)' }}>→</div>
          </button>
        ))}

        {completed.size >= 4 && (
          <button
            onClick={() => {
              awardOnce(35);
              setSection('done');
            }}
            style={{
              width: '100%',
              padding: '15px',
              background: 'linear-gradient(135deg,#7c2d12,#c2410c)',
              color: '#fff',
              border: 'none',
              borderRadius: 16,
              fontSize: 16,
              fontWeight: 900,
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
              marginTop: 8,
            }}
          >
            Claim +35 XP — Path Complete! 🎉
          </button>
        )}
      </div>
    );

  // ── DIALECTS ──────────────────────────────────────────────────────────────
  if (section === 'dialects') {
    const dialect = DIALECT_AWARENESS[activeModule]!;
    return (
      <div className="scr-wrap">
        <button
          className="b bg"
          style={{ marginBottom: 16, fontSize: 13 }}
          onClick={() => setSection('home')}
        >
          ← Back
        </button>
        <div
          style={{
            fontSize: 11,
            fontWeight: 900,
            color: '#78716c',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            marginBottom: 4,
          }}
        >
          Dialect {activeModule + 1}/{DIALECT_AWARENESS.length}
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {DIALECT_AWARENESS.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: i <= activeModule ? dialect.color : 'var(--card-b)',
              }}
            />
          ))}
        </div>

        <div
          style={{
            background: dialect.bg,
            border: `2px solid ${dialect.color}`,
            borderRadius: 20,
            padding: '20px',
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>{dialect.icon}</div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: dialect.color,
              fontFamily: "'Playfair Display',serif",
              marginBottom: 4,
            }}
          >
            {dialect.name}
          </div>
          <div style={{ fontSize: 13, color: '#78716c', marginBottom: 12 }}>
            Spoken in: {dialect.spoken}
          </div>
          <div
            style={{
              padding: '10px 14px',
              background: 'white',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              color: dialect.color,
            }}
          >
            Key feature: {dialect.hallmark}
          </div>
        </div>

        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--card-b)',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: dialect.color,
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              marginBottom: 8,
            }}
          >
            Sample Phrases
          </div>
          {dialect.examples.map((ex, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: i % 2 === 0 ? 'rgba(0,0,0,.02)' : 'transparent',
                borderRadius: 8,
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--subtext)' }}>{ex.q}</span>
              <button
                onClick={() => speak(ex.a)}
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: dialect.color,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {ex.a} 🔊
              </button>
            </div>
          ))}
        </div>

        <div
          style={{
            background: dialect.bg,
            border: `1px solid ${dialect.color}`,
            borderLeft: `4px solid ${dialect.color}`,
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 20,
            fontSize: 13,
            color: '#44403c',
            lineHeight: 1.65,
          }}
        >
          {dialect.note}
        </div>

        <button
          onClick={() => {
            if (activeModule < DIALECT_AWARENESS.length - 1) {
              setActiveModule((i) => i + 1);
            } else {
              completeModule('dialects');
              setSection('home');
            }
          }}
          style={{
            width: '100%',
            padding: '13px',
            background: dialect.color,
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          {activeModule < DIALECT_AWARENESS.length - 1 ? 'Next Dialect →' : '✓ Complete Module'}
        </button>
      </div>
    );
  }

  // ── PASSIVE → ACTIVE ──────────────────────────────────────────────────────
  if (section === 'passive') {
    const mod = PASSIVE_TO_ACTIVE[activeModule]!;
    const ex = mod.exercises[exerciseIdx]!;
    return (
      <div className="scr-wrap">
        <button
          className="b bg"
          style={{ marginBottom: 16, fontSize: 13 }}
          onClick={() => setSection('home')}
        >
          ← Back
        </button>
        <div
          style={{
            fontSize: 11,
            fontWeight: 900,
            color: '#78716c',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            marginBottom: 4,
          }}
        >
          {mod.title} — Exercise {exerciseIdx + 1}/{mod.exercises.length}
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
          {PASSIVE_TO_ACTIVE.map((m, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background:
                  i < activeModule ? '#16a34a' : i === activeModule ? mod.color : 'var(--card-b)',
              }}
            />
          ))}
        </div>

        <div
          style={{
            background: 'var(--card)',
            border: `1.5px solid var(--card-b)`,
            borderLeft: `4px solid ${mod.color}`,
            borderRadius: 16,
            padding: '14px 16px',
            marginBottom: 12,
            fontSize: 13,
            color: 'var(--subtext)',
            fontStyle: 'italic',
            lineHeight: 1.6,
          }}
        >
          {mod.passive_note}
        </div>

        <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>{mod.icon}</div>
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--card-b)',
            borderRadius: 16,
            padding: '18px',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: mod.color,
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              marginBottom: 8,
            }}
          >
            Try to say in Croatian:
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--heading)', lineHeight: 1.5 }}>
            {ex.prompt}
          </div>
        </div>

        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            style={{
              width: '100%',
              padding: '13px',
              background: mod.color,
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            Reveal Answer
          </button>
        ) : (
          <div>
            <div
              style={{
                background: '#f0fdf4',
                border: '2px solid #16a34a',
                borderRadius: 14,
                padding: '16px',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#16a34a',
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  marginBottom: 6,
                }}
              >
                Standard Croatian Answer:
              </div>
              <button
                onClick={() => speak(ex.answer)}
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: '#166534',
                  fontFamily: "'Playfair Display',serif",
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {ex.answer} 🔊
              </button>
              {ex.alt?.length > 0 && (
                <div style={{ fontSize: 12, color: '#4d7c56', marginTop: 6 }}>
                  Also accepted: {ex.alt.join(', ')}
                </div>
              )}
              <div
                style={{
                  fontSize: 12,
                  color: '#4d7c56',
                  marginTop: 8,
                  padding: '8px 12px',
                  background: 'rgba(22,163,74,.08)',
                  borderRadius: 8,
                  lineHeight: 1.5,
                }}
              >
                {ex.note}
              </div>
            </div>
            <button
              onClick={() => {
                if (exerciseIdx < mod.exercises.length - 1) {
                  setExerciseIdx((i) => i + 1);
                  setShowAnswer(false);
                } else if (activeModule < PASSIVE_TO_ACTIVE.length - 1) {
                  setActiveModule((i) => i + 1);
                  setExerciseIdx(0);
                  setShowAnswer(false);
                } else {
                  completeModule('passive');
                  setSection('home');
                }
              }}
              style={{
                width: '100%',
                padding: '13px',
                background: mod.color,
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              {exerciseIdx < mod.exercises.length - 1
                ? 'Next Exercise →'
                : activeModule < PASSIVE_TO_ACTIVE.length - 1
                  ? 'Next Topic →'
                  : '✓ Complete Module'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── GRAMMAR ───────────────────────────────────────────────────────────────
  if (section === 'grammar') {
    const mod = GRAMMAR_GAPS[grammarModule]!;
    const ex = mod.exercises[grammarExIdx]!;
    return (
      <div className="scr-wrap">
        <button
          className="b bg"
          style={{ marginBottom: 16, fontSize: 13 }}
          onClick={() => setSection('home')}
        >
          ← Back
        </button>
        <div
          style={{
            fontSize: 11,
            fontWeight: 900,
            color: '#78716c',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            marginBottom: 4,
          }}
        >
          {mod.icon} {mod.title.split(' — ')[0]}
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {GRAMMAR_GAPS.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background:
                  i < grammarModule ? '#16a34a' : i === grammarModule ? mod.color : 'var(--card-b)',
              }}
            />
          ))}
        </div>

        <div
          style={{
            background: 'var(--card)',
            border: `1.5px solid var(--card-b)`,
            borderLeft: `4px solid ${mod.color}`,
            borderRadius: 16,
            padding: '14px 16px',
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: mod.color, marginBottom: 4 }}>
            {mod.icon} {mod.title}
          </div>
          <div style={{ fontSize: 13, color: 'var(--body)', lineHeight: 1.65 }}>{mod.intro}</div>
          <div
            style={{
              marginTop: 10,
              padding: '10px 12px',
              background: `${mod.color}10`,
              borderRadius: 10,
              fontFamily: 'monospace',
              fontSize: 12,
              color: mod.color,
              whiteSpace: 'pre-line',
            }}
          >
            {mod.pattern}
          </div>
        </div>

        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--card-b)',
            borderRadius: 16,
            padding: '18px',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: mod.color,
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              marginBottom: 8,
            }}
          >
            Question {grammarExIdx + 1}/{mod.exercises.length}:
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--heading)', lineHeight: 1.5 }}>
            {ex.prompt}
          </div>
        </div>

        {!showGrammarAnswer ? (
          <button
            onClick={() => setShowGrammarAnswer(true)}
            style={{
              width: '100%',
              padding: '13px',
              background: mod.color,
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            See Answer
          </button>
        ) : (
          <div>
            <div
              style={{
                background: '#f0fdf4',
                border: '2px solid #16a34a',
                borderRadius: 14,
                padding: '16px',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#16a34a',
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  marginBottom: 6,
                }}
              >
                Answer:
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#166534', lineHeight: 1.5 }}>
                {ex.correct}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#4d7c56',
                  marginTop: 8,
                  padding: '8px 12px',
                  background: 'rgba(22,163,74,.08)',
                  borderRadius: 8,
                  lineHeight: 1.5,
                }}
              >
                {ex.explanation}
              </div>
            </div>
            <button
              onClick={() => {
                if (grammarExIdx < mod.exercises.length - 1) {
                  setGrammarExIdx((i) => i + 1);
                  setShowGrammarAnswer(false);
                } else if (grammarModule < GRAMMAR_GAPS.length - 1) {
                  setGrammarModule((i) => i + 1);
                  setGrammarExIdx(0);
                  setShowGrammarAnswer(false);
                } else {
                  completeModule('grammar');
                  setSection('home');
                }
              }}
              style={{
                width: '100%',
                padding: '13px',
                background: mod.color,
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              {grammarExIdx < mod.exercises.length - 1
                ? 'Next →'
                : grammarModule < GRAMMAR_GAPS.length - 1
                  ? 'Next Grammar Topic →'
                  : '✓ Complete Module'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── DIASPORA VOCAB ─────────────────────────────────────────────────────────
  if (section === 'diaspora')
    return (
      <div className="scr-wrap">
        <button
          className="b bg"
          style={{ marginBottom: 16, fontSize: 13 }}
          onClick={() => setSection('home')}
        >
          ← Back
        </button>
        <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--heading)', marginBottom: 4 }}>
          🌍 Heritage vs Standard Croatian
        </div>
        <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 16, lineHeight: 1.6 }}>
          Diaspora Croatian often preserves older forms or borrows from local languages. Neither is
          "wrong" — but knowing the standard form helps you in Croatia.
        </div>

        {DIASPORA_VOCAB.map((item, i) => (
          <div
            key={i}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--card-b)',
              borderRadius: 14,
              padding: '14px 16px',
              marginBottom: 10,
            }}
          >
            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              <div
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#b45309',
                    textTransform: 'uppercase',
                    marginBottom: 2,
                  }}
                >
                  Heritage
                </div>
                <button
                  onClick={() => speak(item.heritage)}
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: '#92400e',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Playfair Display',serif",
                  }}
                >
                  {item.heritage} 🔊
                </button>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 16,
                  color: '#78716c',
                  fontWeight: 700,
                }}
              >
                →
              </div>
              <div
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#0e7490',
                    textTransform: 'uppercase',
                    marginBottom: 2,
                  }}
                >
                  Standard
                </div>
                <button
                  onClick={() => speak(item.standard)}
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: '#0c4a6e',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Playfair Display',serif",
                  }}
                >
                  {item.standard} 🔊
                </button>
              </div>
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--subtext)',
                fontStyle: 'italic',
                lineHeight: 1.5,
              }}
            >
              {item.note}
            </div>
          </div>
        ))}

        <button
          onClick={() => {
            completeModule('diaspora');
            setSection('home');
          }}
          style={{
            width: '100%',
            padding: '13px',
            background: '#16a34a',
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
          ✓ Complete Module
        </button>
      </div>
    );

  // ── DONE ──────────────────────────────────────────────────────────────────
  return (
    <div className="scr-wrap" style={{ textAlign: 'center', paddingTop: 40 }}>
      <div style={{ fontSize: 80, marginBottom: 16 }}>🧬</div>
      <h2
        style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: 26,
          color: '#164e63',
          fontWeight: 900,
          marginBottom: 8,
        }}
      >
        Nasljeđe aktivirano!
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
        Your heritage has always been part of you. Now it&apos;s on your tongue too. Čestitam —
        congratulations.
      </p>
      <div
        style={{
          background: 'linear-gradient(135deg,#fff7ed,#fed7aa)',
          border: '2px solid #fdba74',
          borderRadius: 20,
          padding: '20px',
          marginBottom: 24,
          fontSize: 16,
          fontWeight: 800,
          color: '#92400e',
        }}
      >
        +35 XP · Heritage Path Complete
      </div>
      <button onClick={goBack} className="b bp" style={{ width: '100%' }}>
        Continue →
      </button>
    </div>
  );
}
