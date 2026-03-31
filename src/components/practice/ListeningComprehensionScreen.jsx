import React, { useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext.jsx';

// ── Built-in Comprehension Exercises by CEFR Level ───────────────────────────
// Format: { hr: "Croatian sentence (spoken)", en: "correct English answer", opts: ["opt1","opt2","opt3","opt4"] }
// The 'en' field is the correct answer; opts must include en as one of the choices.

const EXERCISES = {
  A1: {
    label: 'A1 — Starter',
    color: '#16a34a',
    headerBg: 'linear-gradient(135deg,#059669,#065f46)',
    bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
    border: '#bbf7d0',
    desc: 'Single words and simple greetings — build your ear from day one',
    sets: [
      {
        title: 'Greetings & Introductions',
        icon: '👋',
        questions: [
          { hr: 'Dobar dan.', en: 'Good day.', opts: ['Good morning.', 'Good day.', 'Good night.', 'Goodbye.'] },
          { hr: 'Kako se zoveš?', en: 'What is your name?', opts: ['How are you?', 'Where are you from?', 'What is your name?', 'How old are you?'] },
          { hr: 'Drago mi je.', en: 'Nice to meet you.', opts: ['I am happy.', 'Nice to meet you.', 'Thank you.', 'Excuse me.'] },
          { hr: 'Hvala lijepa.', en: 'Thank you very much.', opts: ['You are welcome.', 'Please.', 'Thank you very much.', 'I am sorry.'] },
          { hr: 'Gdje je toalet?', en: 'Where is the toilet?', opts: ['Where is the exit?', 'Where is the toilet?', 'Where is the hotel?', 'Where is the market?'] },
          { hr: 'Koliko košta?', en: 'How much does it cost?', opts: ['What time is it?', 'How far is it?', 'How much does it cost?', 'How many are there?'] },
          { hr: 'Govorite li engleski?', en: 'Do you speak English?', opts: ['Do you understand?', 'Do you speak Croatian?', 'Do you speak English?', 'Can you help me?'] },
          { hr: 'Jedan kava, molim.', en: 'One coffee, please.', opts: ['Two beers, please.', 'One coffee, please.', 'One water, please.', 'One tea, please.'] },
        ],
      },
      {
        title: 'Numbers & Colors',
        icon: '🔢',
        questions: [
          { hr: 'Imam pet jabuka.', en: 'I have five apples.', opts: ['I have three apples.', 'I have five apples.', 'I have seven apples.', 'I have ten apples.'] },
          { hr: 'Automobil je crven.', en: 'The car is red.', opts: ['The car is blue.', 'The car is red.', 'The car is green.', 'The car is white.'] },
          { hr: 'Koliko imaš godina?', en: 'How old are you?', opts: ['How many brothers do you have?', 'What day is it?', 'How old are you?', 'How many people are there?'] },
          { hr: 'Kuća je velika i bijela.', en: 'The house is big and white.', opts: ['The house is small and blue.', 'The house is big and white.', 'The house is old and yellow.', 'The house is new and red.'] },
          { hr: 'Dva i dva su četiri.', en: 'Two and two is four.', opts: ['Two and two is three.', 'Two and two is five.', 'Two and two is four.', 'Three and two is four.'] },
        ],
      },
    ],
  },
  A2: {
    label: 'A2 — Elementary',
    color: '#0e7490',
    headerBg: 'linear-gradient(135deg,#0e7490,#164e63)',
    bg: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)',
    border: '#bae6fd',
    desc: 'Short sentences about daily life — family, food, weather and routines',
    sets: [
      {
        title: 'Daily Routines',
        icon: '🌅',
        questions: [
          { hr: 'Svaki dan pijem kavu ujutro.', en: 'I drink coffee every morning.', opts: ['I drink tea every evening.', 'I drink coffee every morning.', 'I eat breakfast every morning.', 'I drink juice every afternoon.'] },
          { hr: 'On ide na posao autobusom.', en: 'He goes to work by bus.', opts: ['She goes to school by car.', 'He goes to work by bus.', 'He goes home by train.', 'She goes shopping by taxi.'] },
          { hr: 'Ona kuha večeru svaki dan.', en: 'She cooks dinner every day.', opts: ['She cleans the house every day.', 'She cooks lunch every day.', 'She cooks dinner every day.', 'He cooks breakfast every day.'] },
          { hr: 'Djeca idu u školu pješice.', en: 'The children go to school on foot.', opts: ['The children go to school by bicycle.', 'The children go to the park on foot.', 'The children go to school on foot.', 'The adults go to work on foot.'] },
          { hr: 'Volim čitati knjige navečer.', en: 'I love reading books in the evening.', opts: ['I love watching films in the evening.', 'I love reading books in the morning.', 'I love reading books in the evening.', 'I love listening to music in the evening.'] },
          { hr: 'Tata pere suđe poslije večere.', en: 'Dad washes the dishes after dinner.', opts: ['Mum washes the dishes after dinner.', 'Dad washes the car after dinner.', 'Dad washes the dishes after lunch.', 'Dad washes the dishes after dinner.'] },
        ],
      },
      {
        title: 'Family & Food',
        icon: '👨‍👩‍👧',
        questions: [
          { hr: 'Moja baka živi u Splitu.', en: 'My grandmother lives in Split.', opts: ['My grandfather lives in Zagreb.', 'My grandmother lives in Dubrovnik.', 'My grandmother lives in Split.', 'My mother lives in Rijeka.'] },
          { hr: 'Imamo dvoje djece — sina i kćer.', en: 'We have two children — a son and a daughter.', opts: ['We have three children.', 'They have one son.', 'We have two children — a son and a daughter.', 'We have two sons.'] },
          { hr: 'Za doručak jedem kruh s marmeladom.', en: 'For breakfast I eat bread with jam.', opts: ['For lunch I eat bread with cheese.', 'For breakfast I eat bread with jam.', 'For breakfast I eat eggs with bread.', 'For dinner I eat soup with bread.'] },
          { hr: 'Prstaci su tipično dalmatinsko jelo.', en: 'Date mussels are a typical Dalmatian dish.', opts: ['Sarma is a typical Dalmatian dish.', 'Peka is a typical Slavonian dish.', 'Date mussels are a typical Dalmatian dish.', 'Burek is a typical Croatian dessert.'] },
          { hr: 'Kolač je sladak i ukusan.', en: 'The cake is sweet and delicious.', opts: ['The soup is hot and delicious.', 'The bread is fresh and tasty.', 'The cake is sweet and delicious.', 'The coffee is strong and bitter.'] },
        ],
      },
    ],
  },
  B1: {
    label: 'B1 — Intermediate',
    color: '#d97706',
    headerBg: 'linear-gradient(135deg,#d97706,#92400e)',
    bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)',
    border: '#fde68a',
    desc: 'Conversations and descriptions — travel, plans and expressing opinions',
    sets: [
      {
        title: 'Travel & Directions',
        icon: '✈️',
        questions: [
          { hr: 'Vlak za Rijeku polazi u deset i petnaest.', en: 'The train to Rijeka departs at ten fifteen.', opts: ['The train to Rijeka arrives at ten fifteen.', 'The bus to Rijeka departs at ten fifteen.', 'The train to Zagreb departs at ten fifteen.', 'The train to Rijeka departs at ten fifteen.'] },
          { hr: 'Trebam rezervirati sobu za tri noći.', en: 'I need to book a room for three nights.', opts: ['I need to book a room for two nights.', 'I need to cancel a room for three nights.', 'I need to book a table for three people.', 'I need to book a room for three nights.'] },
          { hr: 'Plitvička jezera su proglašena zaštićenim parkom 1949. godine.', en: 'Plitvice Lakes were declared a protected park in 1949.', opts: ['Plitvice Lakes became a UNESCO site in 1949.', 'Krka National Park was founded in 1949.', 'Plitvice Lakes were declared a protected park in 1979.', 'Plitvice Lakes were declared a protected park in 1949.'] },
          { hr: 'Skrenite lijevo kod semafora, a zatim idite ravno.', en: 'Turn left at the traffic lights, then go straight on.', opts: ['Turn right at the crossroads, then turn left.', 'Turn left at the traffic lights, then go straight on.', 'Go straight ahead, then turn left at the lights.', 'Turn left at the corner, then turn right at the lights.'] },
          { hr: 'Imam alergiju na morske plodove.', en: 'I have an allergy to seafood.', opts: ['I love seafood dishes.', 'I have an allergy to nuts.', 'I have an allergy to seafood.', 'I cannot eat spicy food.'] },
        ],
      },
      {
        title: 'Opinions & Plans',
        icon: '💬',
        questions: [
          { hr: 'Mislim da je hrvatski jezik težak, ali jako lijep.', en: 'I think Croatian is difficult, but very beautiful.', opts: ['I think Croatian is easy and fun.', 'He thinks Croatian is the hardest language.', 'I think Croatian is difficult, but very beautiful.', 'She thinks Croatian is difficult and boring.'] },
          { hr: 'Idućeg ljeta planiramo otići na Hvar.', en: 'Next summer we plan to go to Hvar.', opts: ['Last summer we went to Hvar.', 'Next winter we plan to go to Hvar.', 'Next summer we plan to go to Hvar.', 'Next summer they plan to go to Korčula.'] },
          { hr: 'Ako bude lijepog vremena, idemo na plažu.', en: 'If the weather is nice, we will go to the beach.', opts: ['When the weather is nice, we go to the beach.', 'If the weather is nice, we will go to the beach.', 'Because the weather was nice, we went to the beach.', 'Although the weather was nice, we stayed at home.'] },
          { hr: 'Volim more, ali bojim se dubloke vode.', en: 'I love the sea, but I am afraid of deep water.', opts: ['I love the sea and I am a strong swimmer.', 'I hate the sea because I am afraid of water.', 'I love the sea, but I am afraid of deep water.', 'She loves the sea but cannot swim.'] },
          { hr: 'Baka mi je naučila kako se priprema sarma.', en: 'My grandmother taught me how to prepare sarma.', opts: ['My mother learned how to make sarma from a book.', 'My grandmother bought sarma at the market.', 'My grandmother taught me how to prepare sarma.', 'My aunt showed me how to make burek.'] },
        ],
      },
    ],
  },
  B2: {
    label: 'B2 — Upper Intermediate',
    color: '#7c3aed',
    headerBg: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
    bg: 'linear-gradient(135deg,#faf5ff,#ede9fe)',
    border: '#ddd6fe',
    desc: 'Complex sentences, nuance, culture and abstract topics',
    sets: [
      {
        title: 'Culture & History',
        icon: '🏛️',
        questions: [
          { hr: 'Hrvatska je postala članica Europske unije 2013. godine, što je bio važan korak za njenu europsku budućnost.', en: 'Croatia joined the European Union in 2013, which was an important step for its European future.', opts: ['Croatia joined the EU in 2004 as the eighth member.', 'Croatia joined the EU in 2013, completing accession talks started in 2005.', 'Croatia joined the European Union in 2013, which was an important step for its European future.', 'Croatia applied for EU membership in 2013 but did not join until 2020.'] },
          { hr: 'Dubrovnik je u 14. stoljeću razvio jedan od prvih sustava karantene na svijetu.', en: 'Dubrovnik developed one of the first quarantine systems in the world in the 14th century.', opts: ['Venice invented the quarantine system in the 15th century.', 'Dubrovnik developed one of the first quarantine systems in the world in the 14th century.', 'Dubrovnik established the first hospital in Europe in the 14th century.', 'Dubrovnik became a free republic in the 14th century.'] },
          { hr: 'Kravata, koju danas svi nose, dobila je ime po hrvatskim vojnicima koji su je nosili u 17. stoljeću.', en: 'The necktie, which everyone wears today, got its name from Croatian soldiers who wore it in the 17th century.', opts: ['The necktie was invented in France in the 18th century.', 'Croatian soldiers in the 17th century wore a neck cloth that inspired the French word cravate.', 'The necktie, which everyone wears today, got its name from Croatian soldiers who wore it in the 17th century.', 'The word cravat comes from the Slavic word for a scarf worn in the 16th century.'] },
        ],
      },
      {
        title: 'Abstract & Nuanced',
        icon: '🎭',
        questions: [
          { hr: 'Što se tiče naše tradicije, važno je da mladi naraštaji nauče ne samo jezik nego i vrijednosti koje se prenose s koljena na koljeno.', en: 'As far as our tradition is concerned, it is important that young generations learn not just the language but also the values passed down through generations.', opts: ['Young people today do not appreciate traditional values as much as their grandparents did.', 'Language is the most important part of any tradition and should be preserved.', 'As far as our tradition is concerned, it is important that young generations learn not just the language but also the values passed down through generations.', 'Our tradition requires that children speak only Croatian at home.'] },
          { hr: 'Diaspora Hrvata u Sjevernoj Americi čuva jezik i kulturu kroz zajednička društva, crkve i tečajeve hrvatskog.', en: 'The Croatian diaspora in North America preserves the language and culture through community organizations, churches and Croatian language classes.', opts: ['Croatian immigrants in North America have mostly forgotten their language within two generations.', 'The Croatian diaspora in Australia is larger than in North America.', 'The Croatian diaspora in North America preserves the language and culture through community organizations, churches and Croatian language classes.', 'Croatian language classes in North America are mostly attended by non-Croatians.'] },
          { hr: 'Glagoljaška tradicija, odnosno pisanje na glagoljici, dio je posebnog identiteta koji razlikuje hrvatsko kršćanstvo od ostalih europskih tradicija.', en: 'The Glagolitic tradition, that is, writing in the Glagolitic script, is part of a special identity that distinguishes Croatian Christianity from other European traditions.', opts: ['Glagolitic script was invented by Saints Cyril and Methodius for the Bulgarians.', 'The Glagolitic tradition disappeared from Croatia in the 15th century.', 'Glagolitic script is used in Croatia today for official church documents.', 'The Glagolitic tradition, that is, writing in the Glagolitic script, is part of a special identity that distinguishes Croatian Christianity from other European traditions.'] },
        ],
      },
    ],
  },
};

function shuffle(arr) {
  const b = [...arr];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export default function ListeningComprehensionScreen({ goBack, award }) {
  const { setScr } = useApp();
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedSet, setSelectedSet] = useState(null);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState(null);

  const levelIds = Object.keys(EXERCISES);
  const levelData = selectedLevel ? EXERCISES[selectedLevel] : null;

  function startSet(setData) {
    const qs = shuffle(setData.questions).map(q => ({ ...q, opts: shuffle(q.opts) }));
    setShuffledQuestions(qs);
    setSelectedSet(setData);
    setQuestionIdx(0);
    setChosen(null);
    setScore(0);
    setFinished(false);
  }

  function handleAnswer(opt) {
    if (chosen !== null) return;
    setChosen(opt);
    if (opt === shuffledQuestions[questionIdx].en) {
      setScore(s => s + 1);
    }
  }

  function next() {
    const qs = shuffledQuestions;
    if (questionIdx + 1 >= qs.length) {
      setFinished(true);
      const xp = Math.round((score + (chosen === qs[questionIdx].en ? 1 : 0)) / qs.length * 15) + 5;
      if (award) award(xp);
    } else {
      setQuestionIdx(i => i + 1);
      setChosen(null);
    }
  }

  function reset() {
    setSelectedSet(null);
    setShuffledQuestions(null);
    setChosen(null);
    setScore(0);
    setFinished(false);
    setQuestionIdx(0);
  }

  // ── Finished screen ──────────────────────────────────────────────────────
  if (finished && shuffledQuestions) {
    const total = shuffledQuestions.length;
    const finalScore = chosen === shuffledQuestions[total - 1]?.en ? score + 1 : score; // already counted via handleAnswer
    // Recalculate: score is accumulated via handleAnswer before final answer, then we add 1 if last was correct
    const displayScore = score; // score was incremented in handleAnswer for each correct answer
    const pct = Math.round(displayScore / total * 100);
    return (
      <div className="scr-wrap">
        <div style={{ textAlign: 'center', padding: '40px 20px 24px' }}>
          <div style={{ fontSize: 64 }}>{pct >= 80 ? '🌟' : pct >= 60 ? '🎉' : '💪'}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--heading)', fontFamily: "'Playfair Display',serif", marginTop: 12 }}>
            {pct >= 80 ? 'Odlično!' : pct >= 60 ? 'Dobro!' : 'Vježbaj dalje!'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--subtext)', marginTop: 8 }}>
            {displayScore}/{total} correct · {pct}%
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24', marginTop: 8 }}>
            +{Math.round(pct / 100 * 15) + 5} XP
          </div>
          {pct < 60 && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 12, fontSize: 13, color: '#92400e', fontWeight: 600 }}>
              Try listening with headphones — catching every syllable takes practice!
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 0 20px' }}>
          <button className="b bp" onClick={reset} style={{ width: '100%' }}>Try another set</button>
          <button className="b bg" onClick={() => { reset(); setSelectedLevel(null); }} style={{ width: '100%' }}>← Choose a different level</button>
        </div>
      </div>
    );
  }

  // ── Active question ──────────────────────────────────────────────────────
  if (selectedSet && shuffledQuestions) {
    const q = shuffledQuestions[questionIdx];
    const total = shuffledQuestions.length;
    const ld = EXERCISES[selectedLevel];
    return (
      <div className="scr-wrap" style={{ paddingBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={reset} style={{ background: 'var(--bar-bg)', border: 'none', borderRadius: 10, padding: '6px 12px', color: 'var(--subtext)', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>← Back</button>
          <div style={{ flex: 1, height: 6, background: 'var(--bar-bg)', borderRadius: 3 }}>
            <div style={{ width: ((questionIdx) / total * 100) + '%', height: '100%', background: ld.color, borderRadius: 3, transition: 'width .3s ease' }} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--subtext)', whiteSpace: 'nowrap' }}>{questionIdx + 1}/{total}</div>
        </div>

        <div style={{ background: 'var(--card)', border: '1.5px solid var(--card-b)', borderRadius: 16, padding: '20px 18px', marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: ld.color, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>
            🎧 Listen & understand
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--heading)', fontFamily: "'Playfair Display',serif", lineHeight: 1.4, marginBottom: 8 }}>
            "{q.hr}"
          </div>
          <div style={{ fontSize: 11, color: 'var(--subtext)', fontStyle: 'italic' }}>
            What does this mean in English?
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.opts.map((opt, i) => {
            const isCorrect = opt === q.en;
            const isChosen = opt === chosen;
            let bg = 'var(--card)', border = '1.5px solid var(--card-b)', color = 'var(--body)';
            if (chosen !== null) {
              if (isCorrect) { bg = 'var(--success-bg, #f0fdf4)'; border = '1.5px solid var(--success-b, #bbf7d0)'; color = 'var(--success)'; }
              else if (isChosen) { bg = '#fff1f2'; border = '1.5px solid #fecaca'; color = '#b91c1c'; }
            }
            return (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                style={{
                  padding: '14px 16px', borderRadius: 12, border, background: bg,
                  color, fontSize: 14, fontWeight: 600, cursor: chosen ? 'default' : 'pointer',
                  textAlign: 'left', fontFamily: "'Outfit',sans-serif", lineHeight: 1.4,
                  transition: 'background .2s, border .2s',
                }}
              >
                {chosen !== null && isCorrect && <span style={{ marginRight: 8 }}>✓</span>}
                {chosen !== null && isChosen && !isCorrect && <span style={{ marginRight: 8 }}>✗</span>}
                {opt}
              </button>
            );
          })}
        </div>

        {chosen !== null && (
          <button
            onClick={next}
            style={{ marginTop: 16, width: '100%', padding: '14px', borderRadius: 14, background: ld.color, color: 'white', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 900, fontFamily: "'Outfit',sans-serif" }}
          >
            {questionIdx + 1 >= total ? 'See Results' : 'Next →'}
          </button>
        )}
      </div>
    );
  }

  // ── Set selection ────────────────────────────────────────────────────────
  if (selectedLevel && levelData) {
    return (
      <div className="scr-wrap" style={{ paddingBottom: 24 }}>
        <button onClick={() => setSelectedLevel(null)} style={{ background: 'var(--bar-bg)', border: 'none', borderRadius: 10, padding: '8px 14px', color: 'var(--subtext)', cursor: 'pointer', marginBottom: 16, fontSize: 13, fontWeight: 700 }}>← Levels</button>
        <div style={{ background: levelData.headerBg, borderRadius: 16, padding: '16px 18px', marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 4 }}>
            {selectedLevel} Comprehension
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'white', marginBottom: 4 }}>{levelData.label}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)' }}>{levelData.desc}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {levelData.sets.map((set, i) => (
            <button
              key={i}
              onClick={() => startSet(set)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 18px', borderRadius: 16,
                background: levelData.bg, border: `1.5px solid ${levelData.border}`,
                cursor: 'pointer', textAlign: 'left', fontFamily: "'Outfit',sans-serif",
              }}
            >
              <div style={{ fontSize: 32, flexShrink: 0 }}>{set.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--heading)', marginBottom: 3 }}>{set.title}</div>
                <div style={{ fontSize: 12, color: 'var(--subtext)' }}>{set.questions.length} questions · multiple choice</div>
              </div>
              <div style={{ fontSize: 20, color: levelData.color }}>→</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Level selection ──────────────────────────────────────────────────────
  return (
    <div className="scr-wrap" style={{ paddingBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={goBack} style={{ background: 'var(--bar-bg)', border: 'none', borderRadius: 10, padding: '8px 14px', color: 'var(--subtext)', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>← Back</button>
      </div>

      <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)', borderRadius: 18, padding: '18px 18px 16px', marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 4 }}>LISTENING</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: 'white', fontFamily: "'Playfair Display',serif", marginBottom: 6 }}>Comprehension Track</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)' }}>Read Croatian sentences, choose the correct English meaning · A1 → B2</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {levelIds.map(lid => {
          const ld = EXERCISES[lid];
          const totalQ = ld.sets.reduce((s, st) => s + st.questions.length, 0);
          return (
            <button
              key={lid}
              onClick={() => setSelectedLevel(lid)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 18px', borderRadius: 16,
                background: ld.bg, border: `1.5px solid ${ld.border}`,
                cursor: 'pointer', textAlign: 'left', fontFamily: "'Outfit',sans-serif",
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: ld.headerBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 900, color: 'white',
              }}>{lid}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--heading)', marginBottom: 3 }}>{ld.label}</div>
                <div style={{ fontSize: 12, color: 'var(--subtext)', lineHeight: 1.4 }}>{ld.desc}</div>
                <div style={{ fontSize: 11, color: ld.color, fontWeight: 700, marginTop: 4 }}>{ld.sets.length} exercise sets · {totalQ} questions</div>
              </div>
              <div style={{ fontSize: 20, color: ld.color }}>→</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
