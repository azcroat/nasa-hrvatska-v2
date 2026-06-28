import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { H, speak, stopAudio, srMark } from '../../data';
import { useStats } from '../../context/StatsContext';
import { markQuest } from '../../lib/quests.js';
import { logError } from '../../lib/learnerErrors.js';
import { _aiPost } from '../../lib/aiPost';

// Sentence bank — fill-in-the-blank Croatian sentences covering cases, prepositions, and grammar
// Format: { sentence: 'full sentence', blank: 'word to hide', options: [correct, wrong1, wrong2, wrong3], translation: 'English', hint: 'grammar note' }
const SENTENCE_BANK = [
  // Nominative
  {
    sentence: 'Moj brat je visok.',
    blank: 'brat',
    options: ['brat', 'sestra', 'otac', 'majka'],
    translation: 'My brother is tall.',
    hint: 'Nominative — subject of sentence',
  },
  {
    sentence: 'Ta žena govori hrvatski.',
    blank: 'žena',
    options: ['žena', 'muškarac', 'dijete', 'prijatelj'],
    translation: 'That woman speaks Croatian.',
    hint: 'Nominative subject',
  },
  // Accusative
  {
    sentence: 'Pijem vodu svaki dan.',
    blank: 'vodu',
    options: ['vodu', 'vode', 'vodi', 'vodom'],
    translation: 'I drink water every day.',
    hint: 'Accusative — direct object after pijem',
  },
  {
    sentence: 'Vidim tvoju majku.',
    blank: 'majku',
    options: ['majku', 'majke', 'majci', 'majka'],
    translation: 'I see your mother.',
    hint: 'Accusative — direct object after vidim',
  },
  {
    sentence: 'Volim kruh i sir.',
    blank: 'kruh',
    options: ['kruh', 'kruha', 'kruhu', 'kruhom'],
    translation: 'I love bread and cheese.',
    hint: 'Accusative after volim',
  },
  // Genitive
  {
    sentence: 'Nema kruha na stolu.',
    blank: 'kruha',
    options: ['kruha', 'kruh', 'kruhu', 'kruhom'],
    translation: 'There is no bread on the table.',
    hint: 'Genitive after nema (negation)',
  },
  {
    sentence: 'Čaša vode, molim.',
    blank: 'vode',
    options: ['vode', 'vodu', 'vodi', 'vodom'],
    translation: 'A glass of water, please.',
    hint: 'Genitive — "of water"',
  },
  {
    sentence: 'Kuća moje bake je lijepa.',
    blank: 'bake',
    options: ['bake', 'baku', 'baki', 'bakom'],
    translation: "My grandmother's house is beautiful.",
    hint: 'Genitive — possession',
  },
  // Dative
  {
    sentence: 'Dajem cvijece mojoj majci.',
    blank: 'majci',
    options: ['majci', 'majku', 'majka', 'majke'],
    translation: 'I give flowers to my mother.',
    hint: 'Dative — indirect object (to whom)',
  },
  {
    sentence: 'Kažem prijatelju istinu.',
    blank: 'prijatelju',
    options: ['prijatelju', 'prijatelja', 'prijateljem', 'prijatelji'],
    translation: 'I tell my friend the truth.',
    hint: 'Dative — recipient of telling',
  },
  // Locative
  {
    sentence: 'Živim u Zagrebu.',
    blank: 'u',
    options: ['u', 'na', 'od', 'do'],
    translation: 'I live in Zagreb.',
    hint: 'Locative — u + city name (location)',
  },
  {
    sentence: 'Knjiga je na stolu.',
    blank: 'na',
    options: ['na', 'u', 'od', 'pri'],
    translation: 'The book is on the table.',
    hint: 'Locative — na + surface (on)',
  },
  {
    sentence: 'Razgovaramo o obitelji.',
    blank: 'o',
    options: ['o', 'od', 'do', 'na'],
    translation: 'We are talking about family.',
    hint: 'Locative — o + topic',
  },
  // Instrumental
  {
    sentence: 'Idem autobusom na posao.',
    blank: 'autobusom',
    options: ['autobusom', 'autobus', 'autobusa', 'autobusu'],
    translation: 'I go to work by bus.',
    hint: 'Instrumental — means of transport',
  },
  {
    sentence: 'Pišem olovkom.',
    blank: 'olovkom',
    options: ['olovkom', 'olovku', 'olovke', 'olovka'],
    translation: 'I write with a pencil.',
    hint: 'Instrumental — instrument used',
  },
  // Vocative
  {
    sentence: 'Bako, jesi li tu?',
    blank: 'Bako',
    options: ['Bako', 'Baka', 'Bake', 'Baku'],
    translation: 'Grandma, are you here?',
    hint: 'Vocative — direct address (baka → bako)',
  },
  {
    sentence: 'Tata, dođi ovamo!',
    blank: 'Tata',
    options: ['Tata', 'Tatu', 'Tate', 'Tati'],
    translation: 'Dad, come here!',
    hint: 'Vocative — tata stays tata in vocative',
  },
  // Prepositions
  {
    sentence: 'Idem u školu svaki dan.',
    blank: 'u',
    options: ['u', 'na', 'od', 'za'],
    translation: 'I go to school every day.',
    hint: 'Accusative direction — u + destination',
  },
  {
    sentence: 'On dolazi iz Splita.',
    blank: 'iz',
    options: ['iz', 'od', 'do', 'u'],
    translation: 'He comes from Split.',
    hint: 'Genitive origin — iz (from, out of)',
  },
  {
    sentence: 'Idem do prodavaonice.',
    blank: 'do',
    options: ['do', 'od', 'iz', 'na'],
    translation: "I'm going to the store.",
    hint: 'Genitive — do (up to, as far as)',
  },
  // Time expressions
  {
    sentence: 'Vidjeli smo se prije tjedan dana.',
    blank: 'prije',
    options: ['prije', 'nakon', 'za', 'od'],
    translation: 'We saw each other a week ago.',
    hint: 'Time — prije (before/ago) + genitive',
  },
  {
    sentence: 'Dolazim za sat vremena.',
    blank: 'za',
    options: ['za', 'u', 'od', 'do'],
    translation: "I'm coming in an hour.",
    hint: 'Future time — za + accusative',
  },
  // Conjunctions
  {
    sentence: 'Volim kavu, ali ne i čaj.',
    blank: 'ali',
    options: ['ali', 'jer', 'da', 'ili'],
    translation: 'I like coffee but not tea.',
    hint: 'Contrast conjunction — ali (but)',
  },
  {
    sentence: 'Idem jer moram raditi.',
    blank: 'jer',
    options: ['jer', 'ali', 'da', 'iako'],
    translation: "I'm going because I have to work.",
    hint: 'Cause conjunction — jer (because)',
  },
  // Verb agreement
  {
    sentence: 'Mi idemo u kino večeras.',
    blank: 'idemo',
    options: ['idemo', 'idem', 'idu', 'ide'],
    translation: 'We are going to the cinema tonight.',
    hint: 'Verb conjugation — mi + idemo (1st person plural)',
  },
  {
    sentence: 'Oni govore engleski dobro.',
    blank: 'govore',
    options: ['govore', 'govorim', 'govoriš', 'govori'],
    translation: 'They speak English well.',
    hint: 'Verb conjugation — oni + govore (3rd person plural)',
  },
  {
    sentence: 'Moja sestra ima crnu mačku.',
    blank: 'sestra',
    options: ['sestra', 'sestru', 'sestre', 'sestri'],
    translation: 'My sister has a black cat.',
    hint: 'Nominative — subject of sentence',
  },
  {
    sentence: 'Djed sjedi na klupi u parku.',
    blank: 'Djed',
    options: ['Djed', 'Djeda', 'Djedu', 'Djedom'],
    translation: 'Grandpa is sitting on the bench in the park.',
    hint: 'Nominative — subject of sentence',
  },
  {
    sentence: 'Učiteljica govori polako i jasno.',
    blank: 'Učiteljica',
    options: ['Učiteljica', 'Učiteljicu', 'Učiteljice', 'Učiteljici'],
    translation: 'The teacher speaks slowly and clearly.',
    hint: 'Nominative — subject of sentence',
  },
  {
    sentence: 'Kupujem novu knjigu za školu.',
    blank: 'knjigu',
    options: ['knjigu', 'knjiga', 'knjige', 'knjizi'],
    translation: 'I am buying a new book for school.',
    hint: 'Accusative — direct object',
  },
  {
    sentence: 'Jedem jabuku poslije ručka.',
    blank: 'jabuku',
    options: ['jabuku', 'jabuka', 'jabuke', 'jabukom'],
    translation: 'I am eating an apple after lunch.',
    hint: 'Accusative — direct object',
  },
  {
    sentence: 'Čekamo autobus na stanici.',
    blank: 'autobus',
    options: ['autobus', 'autobusa', 'autobusu', 'autobusom'],
    translation: 'We are waiting for the bus at the stop.',
    hint: 'Accusative — direct object (inanimate masculine)',
  },
  {
    sentence: 'Vidim more s prozora.',
    blank: 'more',
    options: ['more', 'mora', 'moru', 'morem'],
    translation: 'I see the sea from the window.',
    hint: 'Accusative — direct object (neuter)',
  },
  {
    sentence: 'Nemam dovoljno novca za kartu.',
    blank: 'novca',
    options: ['novca', 'novac', 'novcu', 'novcem'],
    translation: 'I do not have enough money for a ticket.',
    hint: 'Genitive after negation / quantity',
  },
  {
    sentence: 'Čaša mlijeka stoji na stolu.',
    blank: 'mlijeka',
    options: ['mlijeka', 'mlijeko', 'mlijeku', 'mlijekom'],
    translation: 'A glass of milk is standing on the table.',
    hint: 'Genitive — partitive (of milk)',
  },
  {
    sentence: 'Vraćam se iz grada navečer.',
    blank: 'grada',
    options: ['grada', 'grad', 'gradu', 'gradom'],
    translation: 'I am returning from the city in the evening.',
    hint: 'Genitive after preposition "iz"',
  },
  {
    sentence: 'Boja njezine haljine je plava.',
    blank: 'haljine',
    options: ['haljine', 'haljina', 'haljinu', 'haljini'],
    translation: 'The colour of her dress is blue.',
    hint: 'Genitive — possession (of the dress)',
  },
  {
    sentence: 'Dajem poklon svojoj sestri.',
    blank: 'sestri',
    options: ['sestri', 'sestra', 'sestru', 'sestre'],
    translation: 'I am giving a gift to my sister.',
    hint: 'Dative — indirect object',
  },
  {
    sentence: 'Pomažem starcu prijeći cestu.',
    blank: 'starcu',
    options: ['starcu', 'starac', 'starca', 'starcem'],
    translation: 'I am helping the old man cross the street.',
    hint: 'Dative — indirect object',
  },
  {
    sentence: 'Pišem pismo svom učitelju.',
    blank: 'učitelju',
    options: ['učitelju', 'učitelj', 'učitelja', 'učiteljem'],
    translation: 'I am writing a letter to my teacher.',
    hint: 'Dative — indirect object',
  },
  {
    sentence: 'Mačka spava na kauču.',
    blank: 'kauču',
    options: ['kauču', 'kauč', 'kauča', 'kaučem'],
    translation: 'The cat is sleeping on the couch.',
    hint: 'Locative after "na"',
  },
  {
    sentence: 'Radim u velikoj bolnici.',
    blank: 'bolnici',
    options: ['bolnici', 'bolnica', 'bolnicu', 'bolnice'],
    translation: 'I work in a big hospital.',
    hint: 'Locative after "u"',
  },
  {
    sentence: 'Mislim o tebi cijeli dan.',
    blank: 'tebi',
    options: ['tebi', 'ti', 'tebe', 'tobom'],
    translation: 'I think about you all day.',
    hint: 'Locative after "o" (personal pronoun)',
  },
  {
    sentence: 'Govorimo o ljetu na moru.',
    blank: 'ljetu',
    options: ['ljetu', 'ljeto', 'ljeta', 'ljetom'],
    translation: 'We are talking about summer at the seaside.',
    hint: 'Locative after "o"',
  },
  {
    sentence: 'Putujem vlakom do Rijeke.',
    blank: 'vlakom',
    options: ['vlakom', 'vlak', 'vlaka', 'vlaku'],
    translation: 'I am travelling by train to Rijeka.',
    hint: 'Instrumental — means of transport',
  },
  {
    sentence: 'Režem kruh nožem.',
    blank: 'nožem',
    options: ['nožem', 'nož', 'noža', 'nožu'],
    translation: 'I am cutting bread with a knife.',
    hint: 'Instrumental — means / tool',
  },
  {
    sentence: 'Šetam s prijateljicom po gradu.',
    blank: 'prijateljicom',
    options: ['prijateljicom', 'prijateljica', 'prijateljicu', 'prijateljici'],
    translation: 'I am walking with a friend around the city.',
    hint: 'Instrumental after "s" (accompaniment)',
  },
  {
    sentence: 'Marko, gdje si bio jučer?',
    blank: 'Marko',
    options: ['Marko', 'Marka', 'Marku', 'Markom'],
    translation: 'Marko, where were you yesterday?',
    hint: 'Vocative — direct address',
  },
  {
    sentence: 'Gospodine, mogu li vam pomoći?',
    blank: 'Gospodine',
    options: ['Gospodine', 'Gospodin', 'Gospodina', 'Gospodinu'],
    translation: 'Sir, may I help you?',
    hint: 'Vocative — direct address',
  },
  {
    sentence: 'Prijatelju, dobro došao!',
    blank: 'Prijatelju',
    options: ['Prijatelju', 'Prijatelj', 'Prijatelja', 'Prijateljem'],
    translation: 'Friend, welcome!',
    hint: 'Vocative — direct address',
  },
  {
    sentence: 'Sjedimo ispred kuće na suncu.',
    blank: 'ispred',
    options: ['ispred', 'iza', 'pored', 'kraj'],
    translation: 'We are sitting in front of the house in the sun.',
    hint: 'Preposition + genitive (in front of)',
  },
  {
    sentence: 'Knjiga je pala pod stol.',
    blank: 'pod',
    options: ['pod', 'na', 'uz', 'kroz'],
    translation: 'The book fell under the table.',
    hint: 'Preposition + accusative (direction: under)',
  },
  {
    sentence: 'Idemo na plažu jer je vruće.',
    blank: 'jer',
    options: ['jer', 'ali', 'iako', 'dok'],
    translation: 'We are going to the beach because it is hot.',
    hint: 'Conjunction — cause (because)',
  },
  {
    sentence: 'Želim spavati ali ne mogu.',
    blank: 'ali',
    options: ['ali', 'jer', 'pa', 'ili'],
    translation: 'I want to sleep but I cannot.',
    hint: 'Conjunction — contrast (but)',
  },
  {
    sentence: 'Ovo je njezin auto.',
    blank: 'njezin',
    options: ['njezin', 'njegov', 'njihov', 'naš'],
    translation: 'This is her car.',
    hint: 'Possessive pronoun (her) — masculine',
  },
  {
    sentence: 'Daj mi tu olovku, molim te.',
    blank: 'mi',
    options: ['mi', 'me', 'mu', 'ti'],
    translation: 'Give me that pencil, please.',
    hint: 'Pronoun — dative clitic (to me)',
  },
  {
    sentence: 'Jučer smo gledali film u kinu.',
    blank: 'gledali',
    options: ['gledali', 'gledamo', 'gledat ćemo', 'gledao'],
    translation: 'Yesterday we watched a film at the cinema.',
    hint: 'Past tense — perfekt (plural)',
  },
  {
    sentence: 'Sutra ću kupiti novi mobitel.',
    blank: 'ću',
    options: ['ću', 'sam', 'bih', 'ćeš'],
    translation: 'Tomorrow I will buy a new phone.',
    hint: 'Future tense — futur I (1st person)',
  },
  {
    sentence: 'Djeca se igraju u dvorištu.',
    blank: 'igraju',
    options: ['igraju', 'igra', 'igrao', 'igrati'],
    translation: 'The children are playing in the yard.',
    hint: 'Present tense — 3rd person plural',
  },
  // Instrumental (extra — so the topic-filtered drill has a full set)
  {
    sentence: 'Putujem avionom u Ameriku.',
    blank: 'avionom',
    options: ['avionom', 'avion', 'aviona', 'avionu'],
    translation: 'I travel by plane to America.',
    hint: 'Instrumental — means of transport',
  },
  {
    sentence: 'Jedem juhu žlicom.',
    blank: 'žlicom',
    options: ['žlicom', 'žlica', 'žlicu', 'žlice'],
    translation: 'I eat soup with a spoon.',
    hint: 'Instrumental — instrument used',
  },
  {
    sentence: 'Ona piše kredom po ploči.',
    blank: 'kredom',
    options: ['kredom', 'kreda', 'kredu', 'krede'],
    translation: 'She writes with chalk on the board.',
    hint: 'Instrumental — instrument used',
  },
  // Vocative (extra — so the topic-filtered drill has a full set)
  {
    sentence: 'Sine, slušaj me!',
    blank: 'Sine',
    options: ['Sine', 'Sin', 'Sina', 'Sinu'],
    translation: 'Son, listen to me!',
    hint: 'Vocative — direct address (sin → sine)',
  },
  {
    sentence: 'Profesore, imam pitanje.',
    blank: 'Profesore',
    options: ['Profesore', 'Profesor', 'Profesora', 'Profesoru'],
    translation: 'Professor, I have a question.',
    hint: 'Vocative — direct address',
  },
  {
    sentence: 'Ivane, gdje ideš?',
    blank: 'Ivane',
    options: ['Ivane', 'Ivan', 'Ivana', 'Ivanu'],
    translation: 'Ivan, where are you going?',
    hint: 'Vocative — direct address',
  },
];

function shuffle(arr: any[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Topic-aware cloze ────────────────────────────────────────────────────────
// "Today's Session" routes the adaptive grammar categories `dative-locative`,
// `instrumental`, and `vocative` to this screen (no dedicated drill exists for
// them). The session chip advertises that exact topic — so the drill MUST serve
// sentences for that topic, not a random mix of every case. Without this, the
// chip said e.g. "Instrumental" but the user got a generic all-cases cloze:
// "not going to the lessons stated." The launcher writes the requested category
// to sessionStorage; we read it once on mount and narrow the bank to it.
const CLOZE_TOPIC_KEY = 'nh_cloze_topic';
// Minimum topic-matched sentences required before we commit to a topic-only
// drill; below this we fall back to the full bank so a thin topic never yields a
// 1–2 question "drill".
const TOPIC_MIN = 6;

export type ClozeTopic = 'dative-locative' | 'instrumental' | 'vocative';

// Derive a sentence's grammar topic from its hint (hints consistently lead with
// the case name, e.g. "Instrumental — …", "Locative after …", "Dative — …").
// Only the three session-routed topics are distinguished; everything else is
// 'other' and only appears in the generic (untargeted) drill.
export function clozeHintTopic(hint: string): ClozeTopic | 'other' {
  const h = (hint || '').trim().toLowerCase();
  if (h.startsWith('instrumental')) return 'instrumental';
  if (h.startsWith('vocative')) return 'vocative';
  if (h.startsWith('dative') || h.startsWith('locative')) return 'dative-locative';
  return 'other';
}

// Pick the question bank for a requested session category. Returns the
// topic-filtered subset when the category is one of the three session-routed
// grammar topics AND enough sentences exist; otherwise the full mixed bank.
export function selectClozeBank(topic: string | null) {
  if (topic === 'dative-locative' || topic === 'instrumental' || topic === 'vocative') {
    const filtered = SENTENCE_BANK.filter((s) => clozeHintTopic(s.hint) === topic);
    if (filtered.length >= TOPIC_MIN) return filtered;
  }
  return SENTENCE_BANK;
}

interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}
export default function ClozeEngine({ goBack, award }: Props) {
  const { level, stats, setStats, writeDelta } = useStats();
  const mountedRef = useRef(true);
  const finishFired = useRef(false);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );
  // Read the session-requested grammar topic once (set by the daily-session
  // launcher for dative-locative / instrumental / vocative). Consumed on mount
  // so a later generic launch (e.g. from the Practice tab) isn't narrowed by a
  // stale value.
  const [clozeTopic] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(CLOZE_TOPIC_KEY);
    } catch {
      return null;
    }
  });
  useEffect(() => {
    try {
      sessionStorage.removeItem(CLOZE_TOPIC_KEY);
    } catch {
      /* sessionStorage unavailable — non-fatal */
    }
  }, []);
  const questions = useMemo(() => shuffle(selectClozeBank(clozeTopic)).slice(0, 10), [clozeTopic]);
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [typingMode, setTypingMode] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [feedbackAnim, setFeedbackAnim] = useState<'correct' | 'wrong' | null>(null);
  const [aiExplain, setAiExplain] = useState<null | 'loading' | Record<string, string>>(null);

  const fetchExplanation = useCallback(
    async (wrong: string, correct: string, context: string) => {
      setAiExplain('loading');
      try {
        const res = await _aiPost('/api/explain-error', {
          wrong,
          correct,
          context,
          type: 'cloze',
          level: level || 'B1',
        });
        if (!mountedRef.current) return;
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        if (mountedRef.current) setAiExplain(data);
      } catch {
        if (mountedRef.current)
          setAiExplain({
            explanation: 'Could not load explanation. Check your connection.',
            rule: '',
            tip: '',
            example: '',
          });
      }
    },
    [level],
  );

  const q = questions[qi]!;
  // Shuffle options once per question
  const options = useMemo(() => shuffle(q?.options || []), [q]);

  const isCorrect = selected === q?.blank;
  const isAnswered = selected !== null;

  function handleSelect(opt: string) {
    if (isAnswered) return;
    setSelected(opt);
    if (opt === q.blank) {
      setScore((s) => s + 1);
      srMark(q.blank, true, 0);
      speak(q.sentence);
      setFeedbackAnim('correct');
      setTimeout(() => {
        if (mountedRef.current) setFeedbackAnim(null);
      }, 500);
    } else {
      srMark(q.blank, false, 0);
      logError(q.blank, 'grammar', { wrong: opt, correct: q.blank, source: 'cloze_engine' });
      setFeedbackAnim('wrong');
      setTimeout(() => {
        if (mountedRef.current) setFeedbackAnim(null);
      }, 400);
    }
  }

  function handleNext() {
    stopAudio();
    if (qi + 1 >= questions.length) {
      if (!finishFired.current) {
        finishFired.current = true;
        const earned = Math.round((score / questions.length) * 30) + 10;
        if (typeof award === 'function') award(earned, false, 'grammar');
        markQuest('grammar');
        if (!stats.vs?.includes('cloze')) {
          setStats((prev) => {
            if (prev.vs?.includes('cloze')) return prev;
            return { ...prev, gc: (prev.gc || 0) + 1, vs: [...(prev.vs || []), 'cloze'] };
          });
          if (writeDelta) writeDelta({ gc: 1, vs: ['cloze'] });
        }
      }
      setDone(true);
    } else {
      setQi(qi + 1);
      setSelected(null);
      setShowHint(false);
      setTypedAnswer('');
      setFeedbackAnim(null);
      setAiExplain(null);
    }
  }

  function handleTypedSubmit() {
    if (!typedAnswer.trim()) return;
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .trim()
        .replace(/č/g, 'c')
        .replace(/ć/g, 'c')
        .replace(/š/g, 's')
        .replace(/ž/g, 'z')
        .replace(/đ/g, 'd');
    const correct =
      normalize(typedAnswer) === normalize(q.blank) ||
      typedAnswer.trim().toLowerCase() === q.blank.toLowerCase();
    handleSelect(correct ? q.blank : typedAnswer.trim());
    setTypedAnswer('');
  }

  function renderSentenceWithBlank() {
    if (!q) return null;
    // Replace only the FIRST occurrence of the blank word so sentences where the
    // target word appears more than once still render the full sentence correctly.
    const idx = q.sentence.indexOf(q.blank);
    if (idx === -1) return <span>{q.sentence}</span>;
    const before = q.sentence.slice(0, idx);
    const after = q.sentence.slice(idx + q.blank.length);
    const blankDisplay = isAnswered ? (
      <span
        style={{
          padding: '2px 10px',
          borderRadius: 8,
          fontWeight: 900,
          background: isCorrect ? '#dcfce7' : '#fee2e2',
          color: isCorrect ? '#166534' : '#991b1b',
          display: 'inline-block',
        }}
      >
        {selected}
      </span>
    ) : (
      <span
        style={{
          display: 'inline-block',
          minWidth: 60,
          borderBottom: '2px solid #0e7490',
          margin: '0 4px',
          textAlign: 'center',
          color: '#0e7490',
          fontWeight: 700,
        }}
      >
        _____
      </span>
    );
    return (
      <>
        {before}
        {blankDisplay}
        {after}
      </>
    );
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div>
        {H('✅ Cloze Complete!', 'Sentence completion results', goBack)}
        <div
          style={{
            textAlign: 'center',
            padding: '40px 24px',
            background: 'linear-gradient(135deg,#0e7490,#164e63)',
            borderRadius: 20,
            marginBottom: 24,
            color: '#fff',
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 12 }}>
            {pct >= 80 ? '🏆' : pct >= 60 ? '⭐' : '💪'}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              fontFamily: "'Playfair Display',serif",
              marginBottom: 4,
            }}
          >
            {score}/{questions.length}
          </div>
          <div style={{ fontSize: 15, opacity: 0.85, marginBottom: 16 }}>{pct}% correct</div>
          <div style={{ fontSize: 13, opacity: 0.75 }}>
            {pct >= 80
              ? 'Odlično! Excellent work!'
              : pct >= 60
                ? 'Dobro! Keep practicing!'
                : 'Nastavi — practice makes perfect!'}
          </div>
        </div>
        <button
          className="b bp"
          style={{ width: '100%', fontSize: 15, padding: '14px', marginBottom: 10 }}
          onClick={() => {
            setQi(0);
            setSelected(null);
            setScore(0);
            setDone(false);
            setShowHint(false);
            setTypedAnswer('');
          }}
        >
          Play Again
        </button>
        <button
          onClick={goBack}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: 14,
            cursor: 'pointer',
            background: 'var(--card)',
            border: '1px solid var(--card-b)',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--subtext)',
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          ← Back to Practice
        </button>
      </div>
    );
  }

  return (
    <div>
      {H('🧩 Sentence Cloze', 'Complete the Croatian sentence', goBack)}

      {/* Progress */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 12, color: 'var(--subtext)', fontWeight: 700 }}>
          {qi + 1} / {questions.length}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>✓ {score} correct</div>
          <button
            onClick={() => {
              setTypingMode((t) => !t);
              setSelected(null);
              setTypedAnswer('');
            }}
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 8,
              border: '1.5px solid var(--card-b)',
              background: typingMode ? '#0e7490' : 'var(--card)',
              color: typingMode ? '#fff' : 'var(--subtext)',
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
              transition: 'all .15s',
            }}
          >
            {typingMode ? '📝 Typing' : '🔘 Multiple Choice'}
          </button>
        </div>
      </div>
      <div
        style={{
          height: 4,
          background: 'var(--bar-bg)',
          borderRadius: 4,
          marginBottom: 20,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${((qi + 1) / questions.length) * 100}%`,
            background: '#0e7490',
            borderRadius: 4,
            transition: 'width .3s',
          }}
        />
      </div>

      {/* Sentence card */}
      <div
        key={qi}
        className="anim-spring-in"
        style={{
          background: 'var(--card)',
          border: '1.5px solid var(--card-b)',
          borderRadius: 16,
          padding: '24px 20px',
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontFamily: "'Playfair Display',serif",
            fontWeight: 700,
            color: 'var(--heading)',
            lineHeight: 1.6,
            marginBottom: 12,
          }}
        >
          {renderSentenceWithBlank()}
        </div>
        {isAnswered && (
          <div
            style={{ fontSize: 13, color: 'var(--subtext)', fontStyle: 'italic', marginBottom: 8 }}
          >
            {q.translation}
          </div>
        )}
        {isAnswered && (
          <button
            onClick={() => speak(q.sentence)}
            style={{
              background: 'none',
              border: '1px solid var(--card-b)',
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 12,
              color: 'var(--subtext)',
              fontWeight: 700,
              fontFamily: "'Outfit',sans-serif",
              padding: '6px 14px',
            }}
          >
            <span aria-hidden="true">🔊</span> Hear it
          </button>
        )}
      </div>

      {/* Hint */}
      {!isAnswered && (
        <button
          onClick={() => setShowHint((h) => !h)}
          style={{
            display: 'block',
            width: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            color: '#0e7490',
            fontWeight: 700,
            fontFamily: "'Outfit',sans-serif",
            marginBottom: 8,
            padding: '4px',
          }}
        >
          💡 {showHint ? q.hint : 'Show grammar hint'}
        </button>
      )}
      {isAnswered && (
        <div
          className={
            feedbackAnim === 'correct'
              ? 'anim-bounce-in'
              : feedbackAnim === 'wrong'
                ? 'anim-wrong'
                : ''
          }
          style={{
            background: isCorrect ? '#f0fdf4' : '#fff1f2',
            border: `1.5px solid ${isCorrect ? '#86efac' : '#fca5a5'}`,
            borderRadius: 12,
            padding: '10px 14px',
            marginBottom: !isCorrect ? 8 : 12,
            fontSize: 12,
            fontWeight: 700,
            color: isCorrect ? '#166534' : '#991b1b',
          }}
        >
          {isCorrect ? '✓ Correct! ' : `✗ The answer was "${q.blank}". `}
          <span style={{ fontWeight: 600, color: 'var(--subtext)' }}>{q.hint}</span>
        </div>
      )}
      {isAnswered && !isCorrect && !aiExplain && (
        <button
          onClick={() => fetchExplanation(selected, q.blank, q.sentence)}
          style={{
            display: 'block',
            width: '100%',
            marginBottom: 12,
            padding: '8px',
            borderRadius: 10,
            border: '1.5px solid #bae6fd',
            background: '#f0f9ff',
            color: '#0369a1',
            fontWeight: 700,
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          🧠 Why is "{q.blank}" correct?
        </button>
      )}
      {aiExplain === 'loading' && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: '#f0f9ff',
            border: '1.5px solid #bae6fd',
            marginBottom: 12,
            fontSize: 12,
            color: '#0369a1',
            fontWeight: 600,
          }}
        >
          Explaining…
        </div>
      )}
      {aiExplain && aiExplain !== 'loading' && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 12,
            background: '#f0f9ff',
            border: '1.5px solid #bae6fd',
            marginBottom: 12,
          }}
        >
          {aiExplain.rule && (
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#0369a1',
                marginBottom: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {aiExplain.rule}
            </div>
          )}
          <div
            style={{
              fontSize: 13,
              color: 'var(--heading)',
              lineHeight: 1.6,
              marginBottom: aiExplain.example ? 6 : 0,
            }}
          >
            {aiExplain.explanation}
          </div>
          {aiExplain.example && (
            <div
              style={{
                fontSize: 12,
                color: '#0369a1',
                fontStyle: 'italic',
                borderTop: '1px solid #bae6fd',
                paddingTop: 6,
                marginTop: 4,
              }}
            >
              e.g. <strong>{aiExplain.example}</strong>
            </div>
          )}
        </div>
      )}

      {/* Options */}
      {typingMode ? (
        <div style={{ marginBottom: 20 }}>
          {!isAnswered ? (
            <>
              <input
                data-testid="cloze-input"
                type="text"
                placeholder="Type the Croatian word..."
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTypedSubmit()}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: 16,
                  borderRadius: 8,
                  border: '1.5px solid var(--card-b)',
                  background: 'var(--card)',
                  color: 'var(--heading)',
                  marginTop: 12,
                  boxSizing: 'border-box',
                  fontFamily: "'Outfit',sans-serif",
                }}
                autoFocus
              />
              <button
                data-testid="cloze-submit"
                onClick={handleTypedSubmit}
                style={{
                  marginTop: 8,
                  width: '100%',
                  padding: '12px',
                  borderRadius: 8,
                  background: '#0e7490',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  fontFamily: "'Outfit',sans-serif",
                }}
              >
                Check ✓
              </button>
            </>
          ) : (
            !isCorrect && (
              <div
                style={{
                  marginTop: 12,
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: '#f0f9ff',
                  border: '1.5px solid #bae6fd',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--subtext)',
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  Correct answer:
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: '#0e7490',
                    fontFamily: "'Playfair Display',serif",
                  }}
                >
                  {q.blank}
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {options.map((opt) => {
            let bg = 'var(--card)',
              border = 'var(--card-b)',
              color = 'var(--heading)';
            if (isAnswered) {
              if (opt === q.blank) {
                bg = '#dcfce7';
                border = '#86efac';
                color = '#166534';
              } else if (opt === selected) {
                bg = '#fee2e2';
                border = '#fca5a5';
                color = '#991b1b';
              }
            }
            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                style={{
                  padding: '14px 10px',
                  borderRadius: 14,
                  border: `2px solid ${border}`,
                  background: bg,
                  cursor: isAnswered ? 'default' : 'pointer',
                  fontSize: 15,
                  fontWeight: 800,
                  color,
                  transition: 'all .15s',
                  fontFamily: "'Playfair Display',serif",
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {isAnswered && (
        <button
          className="b bp"
          style={{ width: '100%', fontSize: 15, padding: '14px' }}
          onClick={handleNext}
        >
          {qi + 1 >= questions.length ? 'See Results →' : 'Next →'}
        </button>
      )}
    </div>
  );
}
