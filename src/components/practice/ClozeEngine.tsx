import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { H, speak, stopAudio, srMark } from '../../data';
import { useStats } from '../../context/StatsContext';
import { markQuest } from '../../lib/quests.js';
import { logError } from '../../lib/learnerErrors.js';
import { apiFetch } from '../../lib/apiFetch.js';

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
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shuffle(arr: any[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  goBack: () => void;
  award?: (xp: number) => void;
}
export default function ClozeEngine({ goBack, award }: Props) {
  const { level } = useStats();
  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );
  const questions = useMemo(() => shuffle(SENTENCE_BANK).slice(0, 12), []);
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
        const res = await apiFetch('/api/explain-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wrong, correct, context, type: 'cloze', level: level || 'B1' }),
          signal: AbortSignal.timeout(20000),
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
      const earned = Math.round((score / questions.length) * 30) + 10;
      if (award) award(earned);
      markQuest('grammar');
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
