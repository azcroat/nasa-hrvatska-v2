import React, { useState, useMemo, useCallback } from 'react';
import { H, speak, srMark } from '../../data.jsx';

// Sentence bank — fill-in-the-blank Croatian sentences covering cases, prepositions, and grammar
// Format: { sentence: 'full sentence', blank: 'word to hide', options: [correct, wrong1, wrong2, wrong3], translation: 'English', hint: 'grammar note' }
const SENTENCE_BANK = [
  // Nominative
  { sentence: 'Moj brat je visok.', blank: 'brat', options: ['brat','sestra','otac','majka'], translation: 'My brother is tall.', hint: 'Nominative — subject of sentence' },
  { sentence: 'Ta žena govori hrvatski.', blank: 'žena', options: ['žena','muškarac','dijete','prijatelj'], translation: 'That woman speaks Croatian.', hint: 'Nominative subject' },
  // Accusative
  { sentence: 'Pijem vodu svaki dan.', blank: 'vodu', options: ['vodu','vode','vodi','vodom'], translation: 'I drink water every day.', hint: 'Accusative — direct object after pijem' },
  { sentence: 'Vidim tvoju majku.', blank: 'majku', options: ['majku','majke','majci','majka'], translation: 'I see your mother.', hint: 'Accusative — direct object after vidim' },
  { sentence: 'Volim kruh i sir.', blank: 'kruh', options: ['kruh','kruha','kruhu','kruhom'], translation: 'I love bread and cheese.', hint: 'Accusative after volim' },
  // Genitive
  { sentence: 'Nema kruha na stolu.', blank: 'kruha', options: ['kruha','kruh','kruhu','kruhom'], translation: 'There is no bread on the table.', hint: 'Genitive after nema (negation)' },
  { sentence: 'Čaša vode, molim.', blank: 'vode', options: ['vode','vodu','vodi','vodom'], translation: 'A glass of water, please.', hint: 'Genitive — "of water"' },
  { sentence: 'Kuća moje bake je lijepa.', blank: 'bake', options: ['bake','baku','baki','bakom'], translation: 'My grandmother\'s house is beautiful.', hint: 'Genitive — possession' },
  // Dative
  { sentence: 'Dajem cvijece mojoj majci.', blank: 'majci', options: ['majci','majku','majka','majke'], translation: 'I give flowers to my mother.', hint: 'Dative — indirect object (to whom)' },
  { sentence: 'Kažem prijatelju istinu.', blank: 'prijatelju', options: ['prijatelju','prijatelja','prijateljem','prijatelji'], translation: 'I tell my friend the truth.', hint: 'Dative — recipient of telling' },
  // Locative
  { sentence: 'Živim u Zagrebu.', blank: 'u', options: ['u','na','od','do'], translation: 'I live in Zagreb.', hint: 'Locative — u + city name (location)' },
  { sentence: 'Knjiga je na stolu.', blank: 'na', options: ['na','u','od','pri'], translation: 'The book is on the table.', hint: 'Locative — na + surface (on)' },
  { sentence: 'Razgovaramo o obitelji.', blank: 'o', options: ['o','od','do','na'], translation: 'We are talking about family.', hint: 'Locative — o + topic' },
  // Instrumental
  { sentence: 'Idem autobusom na posao.', blank: 'autobusom', options: ['autobusom','autobus','autobusa','autobusu'], translation: 'I go to work by bus.', hint: 'Instrumental — means of transport' },
  { sentence: 'Pišem olovkom.', blank: 'olovkom', options: ['olovkom','olovku','olovke','olovka'], translation: 'I write with a pencil.', hint: 'Instrumental — instrument used' },
  // Vocative
  { sentence: 'Bako, jesi li tu?', blank: 'Bako', options: ['Bako','Baka','Bake','Baku'], translation: 'Grandma, are you here?', hint: 'Vocative — direct address (baka → bako)' },
  { sentence: 'Tata, dođi ovamo!', blank: 'Tata', options: ['Tata','Tatu','Tate','Tati'], translation: 'Dad, come here!', hint: 'Vocative — tata stays tata in vocative' },
  // Prepositions
  { sentence: 'Idem u školu svaki dan.', blank: 'u', options: ['u','na','od','za'], translation: 'I go to school every day.', hint: 'Accusative direction — u + destination' },
  { sentence: 'On dolazi iz Splita.', blank: 'iz', options: ['iz','od','do','u'], translation: 'He comes from Split.', hint: 'Genitive origin — iz (from, out of)' },
  { sentence: 'Idem do prodavaonice.', blank: 'do', options: ['do','od','iz','na'], translation: 'I\'m going to the store.', hint: 'Genitive — do (up to, as far as)' },
  // Time expressions
  { sentence: 'Vidjeli smo se prije tjedan dana.', blank: 'prije', options: ['prije','nakon','za','od'], translation: 'We saw each other a week ago.', hint: 'Time — prije (before/ago) + genitive' },
  { sentence: 'Dolazim za sat vremena.', blank: 'za', options: ['za','u','od','do'], translation: 'I\'m coming in an hour.', hint: 'Future time — za + accusative' },
  // Conjunctions
  { sentence: 'Volim kavu, ali ne i čaj.', blank: 'ali', options: ['ali','jer','da','ili'], translation: 'I like coffee but not tea.', hint: 'Contrast conjunction — ali (but)' },
  { sentence: 'Idem jer moram raditi.', blank: 'jer', options: ['jer','ali','da','iako'], translation: 'I\'m going because I have to work.', hint: 'Cause conjunction — jer (because)' },
  // Verb agreement
  { sentence: 'Mi idemo u kino večeras.', blank: 'idemo', options: ['idemo','idem','idu','ide'], translation: 'We are going to the cinema tonight.', hint: 'Verb conjugation — mi + idemo (1st person plural)' },
  { sentence: 'Oni govore engleski dobro.', blank: 'govore', options: ['govore','govorim','govoriš','govori'], translation: 'They speak English well.', hint: 'Verb conjugation — oni + govore (3rd person plural)' },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ClozeEngine({ goBack, award }) {
  const questions = useMemo(() => shuffle(SENTENCE_BANK).slice(0, 12), []);
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const q = questions[qi];
  // Shuffle options once per question
  const options = useMemo(() => shuffle(q?.options || []), [qi]); // eslint-disable-line react-hooks/exhaustive-deps

  const isCorrect = selected === q?.blank;
  const isAnswered = selected !== null;

  function handleSelect(opt) {
    if (isAnswered) return;
    setSelected(opt);
    if (opt === q.blank) {
      setScore(s => s + 1);
      srMark(q.blank, true);
      speak(q.sentence);
    } else {
      srMark(q.blank, false);
    }
  }

  function handleNext() {
    if (qi + 1 >= questions.length) {
      const earned = Math.round((score / questions.length) * 30) + 10;
      if (award) award(earned);
      setDone(true);
    } else {
      setQi(qi + 1);
      setSelected(null);
      setShowHint(false);
    }
  }

  function renderSentenceWithBlank() {
    if (!q) return null;
    const parts = q.sentence.split(q.blank);
    if (parts.length < 2) return <span>{q.sentence}</span>;
    const blankDisplay = isAnswered ? (
      <span style={{
        padding: '2px 10px', borderRadius: 8, fontWeight: 900,
        background: isCorrect ? '#dcfce7' : '#fee2e2',
        color: isCorrect ? '#166534' : '#991b1b',
        display: 'inline-block',
      }}>{selected}</span>
    ) : (
      <span style={{
        display: 'inline-block', minWidth: 60, borderBottom: '2px solid #0e7490',
        margin: '0 4px', textAlign: 'center', color: '#0e7490', fontWeight: 700,
      }}>_____</span>
    );
    return <>{parts[0]}{blankDisplay}{parts[1]}</>;
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div>
        {H('✅ Cloze Complete!', 'Sentence completion results')}
        <div style={{
          textAlign: 'center', padding: '40px 24px',
          background: 'linear-gradient(135deg,#0e7490,#164e63)',
          borderRadius: 20, marginBottom: 24, color: '#fff',
        }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>
            {pct >= 80 ? '🏆' : pct >= 60 ? '⭐' : '💪'}
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "'Playfair Display',serif", marginBottom: 4 }}>
            {score}/{questions.length}
          </div>
          <div style={{ fontSize: 15, opacity: .85, marginBottom: 16 }}>{pct}% correct</div>
          <div style={{ fontSize: 13, opacity: .75 }}>
            {pct >= 80 ? 'Odlično! Excellent work!' : pct >= 60 ? 'Dobro! Keep practicing!' : 'Nastavi — practice makes perfect!'}
          </div>
        </div>
        <button
          className="b bp"
          style={{ width: '100%', fontSize: 15, padding: '14px', marginBottom: 10 }}
          onClick={() => { setQi(0); setSelected(null); setScore(0); setDone(false); setShowHint(false); }}
        >
          Play Again
        </button>
        <button
          onClick={goBack}
          style={{
            width: '100%', padding: '13px', borderRadius: 14, cursor: 'pointer',
            background: 'var(--card)', border: '1px solid var(--card-b)',
            fontSize: 14, fontWeight: 700, color: 'var(--subtext)', fontFamily: "'Outfit',sans-serif",
          }}
        >
          ← Back to Practice
        </button>
      </div>
    );
  }

  return (
    <div>
      {H('🧩 Sentence Cloze', 'Complete the Croatian sentence')}

      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--subtext)', fontWeight: 700 }}>{qi + 1} / {questions.length}</div>
        <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>✓ {score} correct</div>
      </div>
      <div style={{ height: 4, background: 'var(--bar-bg)', borderRadius: 4, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${((qi + 1) / questions.length) * 100}%`, background: '#0e7490', borderRadius: 4, transition: 'width .3s' }} />
      </div>

      {/* Sentence card */}
      <div style={{
        background: 'var(--card)', border: '1.5px solid var(--card-b)',
        borderRadius: 16, padding: '24px 20px', marginBottom: 16, textAlign: 'center',
      }}>
        <div style={{
          fontSize: 20, fontFamily: "'Playfair Display',serif", fontWeight: 700,
          color: 'var(--heading)', lineHeight: 1.6, marginBottom: 12,
        }}>
          {renderSentenceWithBlank()}
        </div>
        {isAnswered && (
          <div style={{ fontSize: 13, color: 'var(--subtext)', fontStyle: 'italic', marginBottom: 8 }}>
            {q.translation}
          </div>
        )}
        {isAnswered && (
          <button
            onClick={() => speak(q.sentence)}
            style={{
              background: 'none', border: '1px solid var(--card-b)', borderRadius: 10,
              cursor: 'pointer', fontSize: 12, color: 'var(--subtext)', fontWeight: 700,
              fontFamily: "'Outfit',sans-serif", padding: '6px 14px',
            }}
          >
            🔊 Hear it
          </button>
        )}
      </div>

      {/* Hint */}
      {!isAnswered && (
        <button
          onClick={() => setShowHint(h => !h)}
          style={{
            display: 'block', width: '100%', background: 'none', border: 'none',
            cursor: 'pointer', fontSize: 12, color: '#0e7490', fontWeight: 700,
            fontFamily: "'Outfit',sans-serif", marginBottom: 8, padding: '4px',
          }}
        >
          💡 {showHint ? q.hint : 'Show grammar hint'}
        </button>
      )}
      {isAnswered && (
        <div style={{
          background: isCorrect ? '#f0fdf4' : '#fff1f2',
          border: `1.5px solid ${isCorrect ? '#86efac' : '#fca5a5'}`,
          borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 12, fontWeight: 700,
          color: isCorrect ? '#166534' : '#991b1b',
        }}>
          {isCorrect ? '✓ Correct! ' : `✗ The answer was "${q.blank}". `}
          <span style={{ fontWeight: 600, color: 'var(--subtext)' }}>{q.hint}</span>
        </div>
      )}

      {/* Options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {options.map(opt => {
          let bg = 'var(--card)', border = 'var(--card-b)', color = 'var(--heading)';
          if (isAnswered) {
            if (opt === q.blank) { bg = '#dcfce7'; border = '#86efac'; color = '#166534'; }
            else if (opt === selected) { bg = '#fee2e2'; border = '#fca5a5'; color = '#991b1b'; }
          }
          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              style={{
                padding: '14px 10px', borderRadius: 14, border: `2px solid ${border}`,
                background: bg, cursor: isAnswered ? 'default' : 'pointer',
                fontSize: 15, fontWeight: 800,
                color, transition: 'all .15s',
                fontFamily: "'Playfair Display',serif",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <button className="b bp" style={{ width: '100%', fontSize: 15, padding: '14px' }} onClick={handleNext}>
          {qi + 1 >= questions.length ? 'See Results →' : 'Next →'}
        </button>
      )}
    </div>
  );
}
