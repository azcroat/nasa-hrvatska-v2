// @ts-nocheck
import React, { useState, useRef } from 'react';
import { H, Bar } from '../../data';
import { markQuest } from '../../lib/quests.js';
import { rnd } from '../../lib/random.js';
function shLocal(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

const LEVELS = {
  A1: {
    label: 'A1 — Beginner',
    color: '#dcfce7',
    border: '#86efac',
    text: '#166534',
    emoji: '🌱',
    desc: 'Basic greetings, numbers, and survival phrases',
    questions: [
      {
        q: "What does 'hvala' mean?",
        opts: ['Thank you', 'Hello', 'Goodbye', 'Please'],
        answer: 0,
        tip: "'Hvala' = thank you. 'Molim' = please/you're welcome. 'Bog' = hello/bye.",
      },
      {
        q: "How do you say 'I am from England'?",
        opts: ['Ja sam iz Engleske.', 'Ja sam Engleska.', 'Iz Engleske ja.', 'Sam Engleska ja.'],
        answer: 0,
        tip: "'Ja sam iz + country in genitive' — Engleske is the genitive of Engleska.",
      },
      {
        q: "What does 'Gdje je WC?' mean?",
        opts: [
          'Where is the toilet?',
          'What time is it?',
          'How much does it cost?',
          'Where are you from?',
        ],
        answer: 0,
        tip: "'Gdje' = where, 'je' = is. 'Gdje je...?' = Where is...?",
      },
      {
        q: "'Dog' in Croatian:",
        opts: ['pas', 'mačka', 'ptica', 'riba'],
        answer: 0,
        tip: 'pas = dog, mačka = cat, ptica = bird, riba = fish',
      },
      {
        q: "How do you say 'Good morning'?",
        opts: ['Dobro jutro', 'Dobra večer', 'Laku noć', 'Dobar dan'],
        answer: 0,
        tip: 'jutro = morning, večer = evening, noć = night, dan = day',
      },
      {
        q: 'What is the Croatian number for 5?',
        opts: ['pet', 'četiri', 'šest', 'tri'],
        answer: 0,
        tip: '1=jedan, 2=dva, 3=tri, 4=četiri, 5=pet, 6=šest',
      },
      {
        q: "'My name is...' in Croatian:",
        opts: ['Zovem se...', 'Ja sam ime...', 'Moje je...', 'Ime moje je...'],
        answer: 0,
        tip: "'Zovem se' = I call myself (reflexive). Standard introduction.",
      },
      {
        q: "'Water' in Croatian:",
        opts: ['voda', 'kruh', 'mlijeko', 'kava'],
        answer: 0,
        tip: 'voda = water, kruh = bread, mlijeko = milk, kava = coffee',
      },
      {
        q: "How do you say 'I don't understand'?",
        opts: ['Ne razumijem.', 'Razumijem.', 'Govorim.', 'Ne znam.'],
        answer: 0,
        tip: "'Ne razumijem' = I don't understand. One of the most important phrases!",
      },
      {
        q: "'How much does it cost?' in Croatian:",
        opts: ['Koliko košta?', 'Gdje je?', 'Što je ovo?', 'Kako se zoveš?'],
        answer: 0,
        tip: "'Koliko' = how much, 'košta' = costs. Essential for shopping.",
      },
      {
        q: "'Today' in Croatian:",
        opts: ['danas', 'sutra', 'jučer', 'sada'],
        answer: 0,
        tip: 'danas = today, sutra = tomorrow, jučer = yesterday, sada = now',
      },
      {
        q: "What does 'Mogu li pomoći?' mean?",
        opts: ['Can I help?', 'Can you help?', 'I need help.', 'Help me!'],
        answer: 0,
        tip: "'Mogu li' = can I, 'pomoći' = to help. Shop assistants say this.",
      },
      {
        q: "'Big' in Croatian:",
        opts: ['velik', 'mali', 'novi', 'star'],
        answer: 0,
        tip: 'velik = big, mali = small, novi = new, star = old',
      },
      {
        q: "How do you say 'please' when making a request?",
        opts: ['molim', 'hvala', 'izvolite', 'oprostite'],
        answer: 0,
        tip: "'Molim' = please (making a request) / 'you're welcome' (responding to thanks)",
      },
      {
        q: "'I love Croatia' in Croatian:",
        opts: ['Volim Hrvatsku.', 'Ja ljubim Hrvatska.', 'Volim Hrvatska.', 'Volim u Hrvatska.'],
        answer: 0,
        tip: "'Volim' + accusative: Croatia is 'Hrvatska' → accusative 'Hrvatsku'",
      },
    ],
  },
  A2: {
    label: 'A2 — Elementary',
    color: '#dbeafe',
    border: '#93c5fd',
    text: '#1d4ed8',
    emoji: '🌿',
    desc: 'Past tense, basic cases, daily conversations',
    questions: [
      {
        q: "'I went to the shop' in Croatian:",
        opts: [
          'Otišao/Otišla sam u trgovinu.',
          'Ja idu u trgovina.',
          'Otišao sam u trgovina.',
          'Išao u dućan sam.',
        ],
        answer: 0,
        tip: "Past tense: 'Otišao/Otišla' (m/f) + 'sam' (auxiliary). 'Otišao sam' = I went (male speaker)",
      },
      {
        q: "'She is taller than him' in Croatian:",
        opts: [
          'Ona je viša od njega.',
          'Ona je više od on.',
          'Ona je viša nego on.',
          'Ona viša njega.',
        ],
        answer: 0,
        tip: "Both options 0 and 2 are correct! 'Viša od + genitive' or 'viša nego + nominative'",
      },
      {
        q: "Fill in: 'Idem ___ posla.' (I'm going from work)",
        opts: ['s', 'od', 'iz', 'na'],
        answer: 2,
        tip: "'Ići iz' = to go from (origin). 'Iz' takes genitive. 'Idem iz posla' = I'm going from work",
      },
      {
        q: "'What did you do yesterday?' in Croatian:",
        opts: [
          'Što si radio/radila jučer?',
          'Što ti radiš jučer?',
          'Što radio jučer?',
          'Što si jučer radi?',
        ],
        answer: 0,
        tip: "Past tense question: 'što si radio/radila' = what did you do (m/f)",
      },
      {
        q: "Which is correct: 'I have 3 books'?",
        opts: ['Imam tri knjige.', 'Imam tri knjiga.', 'Imam tri knjizi.', 'Imam tri knjig.'],
        answer: 0,
        tip: "3 + genitive singular: knjiga → knjige. '3 knjige'",
      },
      {
        q: "'I was born in Zagreb' in Croatian:",
        opts: [
          'Rodio/Rodila sam se u Zagrebu.',
          'Ja sam rođen u Zagreb.',
          'Ja rodio u Zagre.',
          'Sam se rodio Zagreb.',
        ],
        answer: 0,
        tip: "'Roditi se' (to be born) — reflexive. 'U Zagrebu' = in Zagreb (locative)",
      },
      {
        q: "'We need to go' in Croatian:",
        opts: ['Trebamo ići.', 'Mi trebamo idu.', 'Trebamo idemo.', 'Trebamo ići mi.'],
        answer: 0,
        tip: 'Modal + infinitive: trebati (need) + ići (go infinitive). Simple!',
      },
      {
        q: "The accusative of 'prijatelj' (friend, masc animate) is:",
        opts: ['prijatelja', 'prijatelj', 'prijatelju', 'prijateljem'],
        answer: 0,
        tip: "Masculine animate nouns: accusative = genitive. 'prijatelja'",
      },
      {
        q: "'Can you speak more slowly?' in Croatian:",
        opts: [
          'Možete li govoriti sporije?',
          'Možete govorite sporije?',
          'Govori sporije možete?',
          'Vi možete sporije govoriti?',
        ],
        answer: 0,
        tip: "'Možete li' (can you-formal) + infinitive 'govoriti'. 'Sporije' = more slowly (comparative)",
      },
      {
        q: "'I like swimming' in Croatian:",
        opts: ['Volim plivati.', 'Volim plivanje.', 'Sviđa mi se plivati.', 'Rado plivam.'],
        answer: 0,
        tip: "'Volim + infinitive' is the most common pattern. All 4 are technically correct but option 0 is most natural.",
      },
      {
        q: "'Last year' in Croatian:",
        opts: ['prošle godine', 'prošla godina', 'prošloj godini', 'prošlu godinu'],
        answer: 0,
        tip: "'Prošle godine' = last year. Genitive case (a time expression without preposition)",
      },
      {
        q: "'I don't have a car' in Croatian:",
        opts: ['Nemam auta.', 'Nemam auto.', 'Ne imam auto.', 'Nemam autom.'],
        answer: 0,
        tip: "Genitive of negation! 'Nemam + genitive'. 'Auto' → genitive 'auta'",
      },
      {
        q: "'She likes Zagreb very much' in Croatian:",
        opts: [
          'Zagreb joj se jako sviđa.',
          'Ona jako voli Zagreb.',
          'Ona jako sviđa Zagreb.',
          'Zagreb ona jako sviđa.',
        ],
        answer: 0,
        tip: "'Sviđati se' pattern: place + dative pronoun + se + sviđa. Options 0 and 1 are both natural.",
      },
      {
        q: "'How long have you lived here?' in Croatian:",
        opts: [
          'Koliko dugo živiš ovdje?',
          'Koliko si živio ovdje?',
          'Otkad živiš tu?',
          'Koliko živiš?',
        ],
        answer: 0,
        tip: "'Koliko dugo' (how long) + present tense (not past — ongoing action). Options 0 and 2 are both good.",
      },
      {
        q: "'I arrived yesterday' in Croatian:",
        opts: [
          'Stigao/Stigla sam jučer.',
          'Ja stigao jučer.',
          'Dolazio sam jučer.',
          'Stigao sam jučer bio.',
        ],
        answer: 0,
        tip: "'Stići' (arrive, perfective) → past: 'stigao/stigla sam'. 'Dolaziti' is imperfective (arriving repeatedly).",
      },
    ],
  },
  B1: {
    label: 'B1 — Intermediate',
    color: '#fef3c7',
    border: '#fcd34d',
    text: '#92400e',
    emoji: '🌳',
    desc: 'All cases, aspect, conditionals, complex sentences',
    questions: [
      {
        q: 'Which sentence correctly uses the genitive of negation?',
        opts: [
          'Ne čitam te knjige.',
          'Ne čitam tu knjigu.',
          'Ne čitam te knjiga.',
          'Ne čitam tih knjiga.',
        ],
        answer: 0,
        tip: "'Te knjige' — genitive plural of 'ta knjiga'. Negation triggers genitive: 'tu knjigu' (acc) → 'te knjige' (gen)",
      },
      {
        q: "'If I had more time, I would travel.' = ___",
        opts: [
          'Kad bih imao više vremena, putovao bih.',
          'Ako imam više vremena, putujem.',
          'Kada imam više vremena, putovao bih.',
          'Ako bih imao čas, putovao.',
        ],
        answer: 0,
        tip: "Conditional: 'kad/da bih + past participle' in both clauses. 'Kad bih imao... putovao bih'",
      },
      {
        q: "The correct clitic order in 'He gave it to me' is:",
        opts: ['Dao mi ga je.', 'Dao ga mi je.', 'Dao je mi ga.', 'Mi ga dao je.'],
        answer: 0,
        tip: "'Dao mi ga je' — dative (mi) precedes accusative (ga). 'Je' (3rd sg past auxiliary) is special: it may appear sentence-finally after the other clitics, unlike other biti forms (sam/si/smo) which strictly precede dative. Chain: bi → sam/si/smo… → dative → accusative → se; je moves to end.",
      },
      {
        q: "'She has been working here for 5 years' in Croatian:",
        opts: [
          'Radi ovdje već pet godina.',
          'Radila je ovdje pet godina.',
          'Radi ovdje od pet godina.',
          'Radila ovdje pet godine.',
        ],
        answer: 0,
        tip: "Ongoing action uses present tense + 'već' (already/for). 'Pet godina' = genitive plural.",
      },
      {
        q: "The perfective of 'pisati' (to write) is:",
        opts: ['napisati', 'napišati', 'pisovati', 'zapisivati'],
        answer: 0,
        tip: "'Napisati' = to write (completion). 'Pisati' = to be writing (process). This is the perfective/imperfective aspect pair.",
      },
      {
        q: "'I'm bored' in Croatian:",
        opts: ['Dosađuje mi se.', 'Ja sam dosadan.', 'Mi se dosađujem.', 'Dosađujem.'],
        answer: 0,
        tip: "'Dosađivati se' — impersonal: 'dosađuje mi se' (it bores me / I'm bored to myself)",
      },
      {
        q: "'The book that I'm reading' in Croatian:",
        opts: ['knjiga koju čitam', 'knjiga koji čitam', 'knjiga koje čitam', 'knjiga što čitam'],
        answer: 0,
        tip: "'Koji/Koja/Koje' agrees with the noun: 'knjiga' is feminine → 'koju' (acc of koja)",
      },
      {
        q: "Which verb uses 'se' as a true reflexive?",
        opts: ['oblačiti se', 'pitati se', 'javiti se', 'graditi se'],
        answer: 0,
        tip: "'Oblačiti se' = to get dressed (truly reflexive — dressing oneself). Others use 'se' for different reasons.",
      },
      {
        q: "'Despite the rain, we went' in Croatian:",
        opts: [
          'Usprkos kiši, otišli smo.',
          'Unatoč kiša, otišli smo.',
          'Bez kiše, otišli smo.',
          'Zbog kiše, otišli smo.',
        ],
        answer: 0,
        tip: "'Usprkos/Unatoč + dative' = despite. 'Kiša' → dative 'kiši'. 'Zbog + genitive' = because of.",
      },
      {
        q: "'I've never been to Dubrovnik' in Croatian:",
        opts: [
          'Nikad nisam bio/bila u Dubrovniku.',
          'Nisam nikad u Dubrovnik.',
          'Nikad ne bio u Dubrovniku.',
          'Nikad nisam bio Dubrovnik.',
        ],
        answer: 0,
        tip: "'Nikad nisam bio/bila' = I never was. 'U Dubrovniku' = locative case after 'biti u'",
      },
      {
        q: "The correct form of 'dobar' with a feminine noun is:",
        opts: ['dobra', 'dobri', 'dobro', 'dobrom'],
        answer: 0,
        tip: "'Dobar/Dobra/Dobro' — feminine nominative is 'dobra'. 'Dobri' is masculine plural or definite form.",
      },
      {
        q: "'Make yourself at home!' in Croatian:",
        opts: ['Budi kao kod kuće!', 'Budi doma!', 'Kao kuća budi!', 'Neka budeš kod kuće!'],
        answer: 0,
        tip: "'Budi kao kod kuće' (be as if at home) — a set phrase for welcoming guests",
      },
      {
        q: "'I prefer coffee to tea' in Croatian:",
        opts: [
          'Više volim kavu nego čaj.',
          'Volim kava više čaj.',
          'Preferiram kava od čaj.',
          'Kava mi je više od čaj.',
        ],
        answer: 0,
        tip: "'Više volim X nego Y' = I prefer X to Y. 'Nego' = than in comparisons after 'više'",
      },
      {
        q: "'It's been raining since morning' in Croatian:",
        opts: [
          'Kiša pada od jutra.',
          'Kiša je padala od jutra.',
          'Kiša pada jutros.',
          'Od jutra pada kiša bila.',
        ],
        answer: 0,
        tip: "'Od + genitive' = since. 'Jutro' → genitive 'jutra'. Present tense for ongoing until now.",
      },
      {
        q: "'I'm afraid of heights' in Croatian:",
        opts: [
          'Bojim se visine.',
          'Strah sam od visine.',
          'Bojim se visinu.',
          'Imam strah od visina.',
        ],
        answer: 0,
        tip: "'Bojati se + genitive': visina (heights) → genitive 'visine'. 'Bojim se' = I am afraid",
      },
    ],
  },
  B2: {
    label: 'B2 — Upper Intermediate',
    color: '#f3e8ff',
    border: '#d8b4fe',
    text: '#6b21a8',
    emoji: '🌲',
    desc: 'Near-native fluency, idioms, complex grammar',
    questions: [
      {
        q: "'No sooner had she sat down than the phone rang.' Correct Croatian:",
        opts: [
          'Jedva je sjela kad je zazvonio telefon.',
          'Čim je sjela, zazvonio je telefon.',
          'Tek što je sjela, zazvonio je telefon.',
          'Kad je sjela, zazvonio je telefon.',
        ],
        answer: 2,
        tip: "'Tek što + past, past' = no sooner...than. 'Jedva' = barely. Option 2 is the most precise equivalent.",
      },
      {
        q: "The idiomatic meaning of 'baciti kamen u more' is:",
        opts: [
          'An impossible task / drop in the ocean',
          'To swim in deep water',
          'To throw someone under the bus',
          'To make a big splash',
        ],
        answer: 0,
        tip: "'Baciti kamen u more' (throw a stone into the sea) = a drop in the ocean — pointless tiny gesture",
      },
      {
        q: "'He turned out to be right' in natural Croatian:",
        opts: [
          'Ispostavilo se da je bio u pravu.',
          'On se pokazao da je pravo.',
          'Ispostavilo da je u pravu.',
          'On je bio u pravu se ispostavilo.',
        ],
        answer: 0,
        tip: "'Ispostaviti se' = to turn out. 'Da + past tense' for the that-clause. 'Biti u pravu' = to be right",
      },
      {
        q: "'The more you practice, the better you get.' Correct Croatian:",
        opts: [
          'Što više vježbaš, to bolje postaneš.',
          'Više vježbaš, bolje budeš.',
          'Koliko vježbaš, toliko bolje.',
          'Što vježbaš to postaneš bolje.',
        ],
        answer: 0,
        tip: "'Što više X, to više Y' — the Croatian correlative comparative structure",
      },
      {
        q: "Which sentence uses 'da' as a purpose clause (expressing goal or intention)?",
        opts: [
          'Trčim da smršavim.',
          'Znam da imaš pravo.',
          'Rekao je da dolazi.',
          'Vidim da pišeš.',
        ],
        answer: 0,
        tip: "'Da + present' after a motion/action verb expresses purpose: 'Trčim da smršavim' = I run in order to lose weight. This is standard Croatian. Note: after volitional verbs (htjeti, željeti), Croatian prefers the infinitive — 'Hoću ići', not 'Hoću da idem'.",
      },
      {
        q: "'We barely made it on time' in Croatian:",
        opts: [
          'Jedva smo stigli na vrijeme.',
          'Teško smo stigli na vrijeme.',
          'Jedva da smo stigli na vrijeme.',
          'Samo smo stigli na vrijeme.',
        ],
        answer: 0,
        tip: "'Jedva' = barely/with difficulty. 'Jedva da' is also correct but slightly more emphatic.",
      },
      {
        q: "The difference between 'pitati' and 'upitati' is:",
        opts: [
          'pitati is imperfective (asking repeatedly); upitati is perfective (one question)',
          'upitati is more polite',
          'pitati is formal; upitati is informal',
          'There is no meaningful difference',
        ],
        answer: 0,
        tip: 'Aspect pair: pitati (ongoing/repeated asking) vs upitati (one completed act of asking)',
      },
      {
        q: "'Frankly speaking' — Croatian equivalent:",
        opts: ['Iskreno govoreći,', 'Iskreno rečeno,', 'Da budem iskren,', 'Na ravno,'],
        answer: 1,
        tip: "'Iskreno rečeno' (honestly spoken) = frankly speaking. All 3 are natural; 'iskreno rečeno' is most idiomatic.",
      },
      {
        q: "'He speaks Croatian as if he were born here.' Correct Croatian:",
        opts: [
          'Govori hrvatski kao da se ovdje rodio.',
          'Govori hrvatski kako da se rodio ovdje.',
          'Govori hrvatski kao se rodio ovdje.',
          'Govori hrvatski kako je rodio ovdje.',
        ],
        answer: 0,
        tip: "'Kao da + conditional/past' = as if. 'Rodio' (past participle masculine) after conditional auxiliary",
      },
      {
        q: "'Against all odds' in Croatian:",
        opts: ['Usprkos svemu', 'Protiv svega', 'Unatoč svim preprekama', 'Bez obzira na sve'],
        answer: 2,
        tip: "'Unatoč svim preprekama' (despite all obstacles) is the closest to 'against all odds'. Others are also valid.",
      },
      {
        q: "'The meeting was postponed' in natural Croatian:",
        opts: [
          'Sastanak je odgođen.',
          'Sastanak je bio odgođen.',
          'Odgodili su sastanak.',
          'Sastanak se odgodio.',
        ],
        answer: 0,
        tip: "Passive 'je odgođen' (was postponed) is natural. Option 2 (active — they postponed) is also very common.",
      },
      {
        q: "'Not to mention...' — Croatian equivalent:",
        opts: ['Da ne govorimo o...', 'A kamoli...', 'Nekmoli...', 'Ne da kažem...'],
        answer: 1,
        tip: "'A kamoli' = let alone / not to mention (stronger). 'Da ne govorimo o' = not to speak of. Both natural.",
      },
      {
        q: "Which correctly uses the gerund-equivalent 'glagolski prilog'?",
        opts: [
          'Čitajući novine, pronašao sam zanimljiv članak.',
          'Čitao novine, pronašao sam članak.',
          'Dok čitam novine, pronašao sam.',
          'Čitanje novina, pronašao sam.',
        ],
        answer: 0,
        tip: "'Glagolski prilog sadašnji' (present verbal adverb): verb stem + -ući. 'Čitajući' = while reading",
      },
      {
        q: "'I couldn't help laughing' in Croatian:",
        opts: [
          'Nisam se mogao/mogla suzdržati od smijeha.',
          'Ne mogu pomoći smijeh.',
          'Nisam mogao ne smijati se.',
          'Smijeh nisam mogao izbjeći.',
        ],
        answer: 0,
        tip: "'Suzdržati se od + genitive' = to hold back/refrain from. Natural idiom.",
      },
      {
        q: "The stylistic difference between 'reći' and 'kazati' is:",
        opts: [
          "Both mean 'to say'; 'kazati' is slightly more formal/literary",
          "'reći' is imperfective; 'kazati' is perfective",
          "'kazati' is dialectal only",
          "'reći' is older, 'kazati' is modern",
        ],
        answer: 0,
        tip: "Both are perfective and mean 'to say'. 'Kazati' appears more in literature, formal speech, and some dialects.",
      },
    ],
  },
};

const LEVEL_KEYS = ['A1', 'A2', 'B1', 'B2'];

function gradeMessage(pct) {
  if (pct >= 90) return { icon: '🏆', msg: "Excellent! You've mastered this level!" };
  if (pct >= 75) return { icon: '⭐', msg: 'Great! Ready to move up!' };
  if (pct >= 60) return { icon: '📚', msg: 'Good progress! Review and retry.' };
  return { icon: '💪', msg: "Keep practicing! You'll get there." };
}

// Shuffle one level's questions: randomise question order AND option order,
// storing the correct answer by value so index checks remain valid.
function shuffleLevel(levelKey) {
  const raw = LEVELS[levelKey].questions;
  return shLocal([...raw]).map((q) => {
    const correctText = q.opts[q.answer];
    const shuffledOpts = shLocal([...q.opts]);
    return { ...q, opts: shuffledOpts, answer: shuffledOpts.indexOf(correctText) };
  });
}

export default function CefrTest({ award }) {
  const finishFired = useRef(false);
  const [levelKey, setLevelKey] = useState(null);
  // Shuffled questions for the active level — rebuilt each time a level is started
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(-1);
  const [done, setDone] = useState(false);

  function startLevel(key) {
    finishFired.current = false;
    setLevelKey(key);
    setShuffledQuestions(shuffleLevel(key));
    setQIdx(0);
    setScore(0);
    setAnswered(false);
    setSelected(-1);
    setDone(false);
  }

  // Active question list: use shuffled version if available, fall back to raw
  const activeQuestions = shuffledQuestions.length
    ? shuffledQuestions
    : levelKey
      ? LEVELS[levelKey].questions
      : [];

  function handleSelect(i) {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    if (i === activeQuestions[qIdx].answer) {
      setScore((sc) => sc + 1);
    }
  }

  function handleNext() {
    const total = activeQuestions.length;
    const nextIdx = qIdx + 1;
    if (nextIdx >= total) {
      if (!finishFired.current) {
        finishFired.current = true;
        if (award) award(score * 7);
        markQuest('grammar');
      }
      setDone(true);
    } else {
      setQIdx(nextIdx);
      setAnswered(false);
      setSelected(-1);
    }
  }

  function goBack() {
    setLevelKey(null);
    setShuffledQuestions([]);
    setDone(false);
    setAnswered(false);
    setSelected(-1);
    setQIdx(0);
    setScore(0);
  }

  // --- LEVEL SELECT SCREEN ---
  if (!levelKey) {
    return (
      <div className="scr-wrap">
        {H('🎓 CEFR Assessment', 'Test your Croatian proficiency')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {LEVEL_KEYS.map((key) => {
            const lv = LEVELS[key];
            return (
              <button
                key={key}
                className="tc"
                onClick={() => startLevel(key)}
                style={{
                  textAlign: 'left',
                  padding: '16px 14px',
                  background: lv.color,
                  border: `1.5px solid ${lv.border}`,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 6 }}>{lv.emoji}</div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    color: lv.text,
                    lineHeight: 1.3,
                    marginBottom: 4,
                  }}
                >
                  {lv.label}
                </div>
                <div style={{ fontSize: 11, color: lv.text, opacity: 0.75, lineHeight: 1.4 }}>
                  {lv.desc}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 10,
                    fontWeight: 700,
                    color: lv.text,
                    opacity: 0.6,
                  }}
                >
                  {lv.questions.length} questions
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const level = LEVELS[levelKey];
  const total = activeQuestions.length;

  // --- RESULTS SCREEN ---
  if (done) {
    const finalScore = score;
    const pct = Math.round((finalScore / total) * 100);
    const { icon, msg } = gradeMessage(pct);
    return (
      <div className="scr-wrap">
        {H('🎓 ' + level.label, 'Assessment complete')}
        <div
          style={{
            background: level.color,
            border: `1.5px solid ${level.border}`,
            borderRadius: 18,
            padding: '28px 24px',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: level.text, marginBottom: 4 }}>
            {finalScore} / {total}
          </div>
          <div style={{ fontSize: 15, color: level.text, opacity: 0.75, marginBottom: 16 }}>
            {pct}% correct
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.55)',
              borderRadius: 12,
              padding: '12px 16px',
              fontSize: 15,
              fontWeight: 700,
              color: level.text,
            }}
          >
            {msg}
          </div>
        </div>

        {/* Progress bars for visual feedback */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--subtext)' }}>Score</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: level.text }}>{pct}%</span>
          </div>
          <div
            style={{
              height: 10,
              background: 'var(--bar-bg)',
              borderRadius: 99,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: level.border,
                borderRadius: 99,
                transition: 'width 0.6s ease',
              }}
            />
          </div>
        </div>

        <button
          className="tc"
          onClick={goBack}
          style={{
            width: '100%',
            padding: '14px',
            fontWeight: 800,
            fontSize: 14,
            color: 'var(--heading)',
          }}
        >
          Try Another Level
        </button>
      </div>
    );
  }

  // --- TEST SCREEN ---
  const q = activeQuestions[qIdx];
  const isCorrect = selected === q.answer;

  return (
    <div className="scr-wrap">
      {H('🎓 ' + level.label, `Question ${qIdx + 1} of ${total}`)}
      <Bar v={qIdx + 1} mx={total} h={6} color={level.border} />

      {/* Question card */}
      <div
        style={{
          background: level.color,
          border: `1.5px solid ${level.border}`,
          borderRadius: 16,
          padding: '18px 16px',
          marginTop: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: level.text,
            opacity: 0.7,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {level.label}
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: level.text,
            lineHeight: 1.5,
          }}
        >
          {q.q}
        </div>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {q.opts.map((opt, i) => {
          let bg = 'var(--card)';
          let border = '1.5px solid var(--card-b)';
          let color = 'var(--heading)';

          if (answered) {
            if (i === q.answer) {
              bg = '#dcfce7';
              border = '1.5px solid #86efac';
              color = '#166534';
            } else if (i === selected && i !== q.answer) {
              bg = '#fee2e2';
              border = '1.5px solid #fca5a5';
              color = '#991b1b';
            } else {
              color = 'var(--subtext)';
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={answered}
              style={{
                background: bg,
                border,
                borderRadius: 12,
                padding: '12px 14px',
                textAlign: 'left',
                fontSize: 14,
                fontWeight: 600,
                color,
                cursor: answered ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: "'Outfit',sans-serif",
                lineHeight: 1.4,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 24,
                  height: 24,
                  borderRadius: '50%',
                  background:
                    answered && i === q.answer
                      ? '#86efac'
                      : answered && i === selected && i !== q.answer
                        ? '#fca5a5'
                        : 'var(--bar-bg)',
                  color:
                    answered && (i === q.answer || (i === selected && i !== q.answer))
                      ? '#fff'
                      : 'var(--subtext)',
                  fontSize: 11,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {answered && i === q.answer
                  ? '✓'
                  : answered && i === selected && i !== q.answer
                    ? '✗'
                    : String.fromCharCode(65 + i)}
              </span>
              <span style={{ flex: 1 }}>{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Tip box */}
      {answered && (
        <div
          style={{
            background: isCorrect ? '#dcfce7' : '#fef3c7',
            border: `1.5px solid ${isCorrect ? '#86efac' : '#fcd34d'}`,
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: isCorrect ? '#166534' : '#92400e',
              marginBottom: 4,
            }}
          >
            {isCorrect ? '✅ Correct!' : '💡 Grammar tip:'}
          </div>
          <div
            style={{
              fontSize: 13,
              color: isCorrect ? '#15803d' : '#78350f',
              lineHeight: 1.5,
            }}
          >
            {q.tip}
          </div>
        </div>
      )}

      {/* Next button */}
      {answered && (
        <button
          className="tc"
          onClick={handleNext}
          style={{
            width: '100%',
            padding: '14px',
            fontWeight: 800,
            fontSize: 15,
            color: 'var(--heading)',
          }}
        >
          {qIdx + 1 >= total ? 'See Results →' : 'Next Question →'}
        </button>
      )}

      {/* Back link */}
      <button
        onClick={goBack}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--subtext)',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          padding: '8px 0',
          marginTop: 4,
          fontFamily: "'Outfit',sans-serif",
        }}
      >
        ← Change level
      </button>
    </div>
  );
}
