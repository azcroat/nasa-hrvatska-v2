// @ts-nocheck
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useStats } from '../../context/StatsContext';
import PronunciationScorer from '../shared/PronunciationScorer';
import { scoreColor, scoreEmoji, scoreLabel } from '../shared/pronunciationUtils.js';
import { markQuest } from '../../lib/quests.js';

// ── Assessment phrase banks per CEFR level ──────────────────────────────────
const PHRASES = {
  A1: [
    { hr: 'Dobar dan.', en: 'Good day.' },
    { hr: 'Kako se zoveš?', en: 'What is your name?' },
    { hr: 'Ja sam dobro.', en: 'I am fine.' },
    { hr: 'Hvala lijepo.', en: 'Thank you very much.' },
    { hr: 'Molim vas.', en: "Please / You're welcome." },
    { hr: 'Gdje je wc?', en: 'Where is the bathroom?' },
    { hr: 'Jedan kava, molim.', en: 'One coffee, please.' },
    { hr: 'Koliko košta?', en: 'How much does it cost?' },
    { hr: 'Ne razumijem.', en: "I don't understand." },
    { hr: 'Možete li ponoviti?', en: 'Can you repeat that?' },
  ],
  A2: [
    { hr: 'Volim čitati knjige.', en: 'I love reading books.' },
    { hr: 'Gdje živiš?', en: 'Where do you live?' },
    { hr: 'Imam brata i sestru.', en: 'I have a brother and a sister.' },
    { hr: 'Sutra idem na more.', en: "Tomorrow I'm going to the sea." },
    { hr: 'Što radiš za vikend?', en: 'What do you do on weekends?' },
    { hr: 'Ovo je jako ukusno.', en: 'This is very delicious.' },
    { hr: 'Mogu li dobiti račun?', en: 'Can I get the bill?' },
    { hr: 'Tražim hotel u centru.', en: "I'm looking for a hotel in the centre." },
    { hr: 'Koji je tvoj broj telefona?', en: 'What is your phone number?' },
    { hr: 'Putovao sam u Zagreb prošle godine.', en: 'I travelled to Zagreb last year.' },
  ],
  B1: [
    {
      hr: 'Hrvatska ima lijepu obalu i bogatu kulturu.',
      en: 'Croatia has a beautiful coastline and rich culture.',
    },
    { hr: 'Trebam rezervirati sobu za dvoje.', en: 'I need to book a room for two.' },
    { hr: 'Može li se platiti karticom?', en: 'Can one pay by card?' },
    { hr: 'Koliko dugo ste već u Zagrebu?', en: 'How long have you been in Zagreb?' },
    { hr: 'Jučer sam pogledao zanimljiv film.', en: 'Yesterday I watched an interesting film.' },
    {
      hr: 'Ljubav je najvažnija stvar na svijetu.',
      en: 'Love is the most important thing in the world.',
    },
    { hr: 'Šuma je puna divljih životinja.', en: 'The forest is full of wild animals.' },
    {
      hr: 'Nikola Tesla je bio genijalan izumitelj.',
      en: 'Nikola Tesla was a brilliant inventor.',
    },
    { hr: 'Đak uči novi jezik svaki dan.', en: 'The student learns a new language every day.' },
    {
      hr: 'Trebali bismo čuvati prirodu za buduće generacije.',
      en: 'We should preserve nature for future generations.',
    },
  ],
  B2: [
    {
      hr: 'Glagolski vid je jedna od najtežih pojava u hrvatskom.',
      en: 'Verbal aspect is one of the most difficult phenomena in Croatian.',
    },
    {
      hr: 'Dalmatinska obala privlači milijune turista svake godine.',
      en: 'The Dalmatian coast attracts millions of tourists every year.',
    },
    {
      hr: 'Uvođenje eura značajno je promijenilo svakodnevni život.',
      en: 'The introduction of the euro significantly changed everyday life.',
    },
    {
      hr: 'Knjiga koju sam pročitao prošlog tjedna bila je iznimno zanimljiva.',
      en: 'The book I read last week was exceptionally interesting.',
    },
    {
      hr: 'Bez obzira na poteškoće, nastavio je učiti hrvatski.',
      en: 'Despite the difficulties, he continued learning Croatian.',
    },
    {
      hr: 'Njezina ljubaznost i strpljenje ostavili su dubok dojam.',
      en: 'Her kindness and patience left a deep impression.',
    },
    {
      hr: 'Kada bih imao više vremena, više bih putovao po Balkanu.',
      en: 'If I had more time, I would travel more around the Balkans.',
    },
    {
      hr: 'Hrvatska povijest isprepletena je s europskim zbivanjima od davnina.',
      en: 'Croatian history is intertwined with European events from ancient times.',
    },
    {
      hr: 'Klapa je tradicijska vrsta višeglasnog pjevanja iz Dalmacije.',
      en: 'Klapa is a traditional form of polyphonic singing from Dalmatia.',
    },
    {
      hr: 'Stjepan Radić je bio jedan od najvažnijih hrvatskih političara dvadesetog stoljeća.',
      en: 'Stjepan Radić was one of the most important Croatian politicians of the twentieth century.',
    },
  ],
};

// Map CEFR level strings to phrase bank keys
function levelKey(level) {
  if (!level) return 'A1';
  const l = String(level).toUpperCase();
  if (l.startsWith('B2') || l.startsWith('C')) return 'B2';
  if (l.startsWith('B1')) return 'B1';
  if (l.startsWith('A2')) return 'A2';
  return 'A1';
}

// Grade based on average score
function overallGrade(avg) {
  if (avg >= 90)
    return {
      letter: 'A',
      label: 'Excellent',
      color: '#16a34a',
      advice:
        'Outstanding Croatian pronunciation! Your sounds are clear and accurate. Keep challenging yourself with longer, more complex sentences.',
    };
  if (avg >= 80)
    return {
      letter: 'B',
      label: 'Good',
      color: '#0284c7',
      advice:
        'Strong pronunciation with good clarity. Focus on the sounds that scored yellow to reach native-level accuracy.',
    };
  if (avg >= 70)
    return {
      letter: 'C',
      label: 'Developing',
      color: '#d97706',
      advice:
        "Good foundation — keep practising the phoneme drills, especially for ć/č, š/ž, and the rolled 'r'.",
    };
  if (avg >= 55)
    return {
      letter: 'D',
      label: 'Needs Work',
      color: '#ea580c',
      advice:
        'Regular pronunciation practice will make a big difference. Try the Phoneme Course to master each sound individually.',
    };
  return {
    letter: 'F',
    label: 'Beginner',
    color: '#dc2626',
    advice:
      'Every expert started here. Focus on the Phoneme Course first to build the sounds, then return for a re-test.',
  };
}

// ── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, color = '#D4002D' }) {
  return (
    <div style={{ height: 6, borderRadius: 4, background: 'var(--card-b)', overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          borderRadius: 4,
          background: color,
          width: `${Math.min(100, Math.max(0, value))}%`,
          transition: 'width .5s ease',
        }}
      />
    </div>
  );
}

// ── Score chip ───────────────────────────────────────────────────────────────
function ScoreChip({ score }) {
  const c = scoreColor(score);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 10px',
        borderRadius: 20,
        background: `${c}18`,
        border: `1px solid ${c}40`,
        fontSize: 13,
        fontWeight: 700,
        color: c,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {scoreEmoji(score)} {score}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PronunciationAssessScreen({ goBack, award }) {
  const { setScr } = useApp();
  const { level } = useStats();

  const phrases = useMemo(() => {
    const bank = PHRASES[levelKey(level)] || PHRASES.A1;
    // Shuffle and take 8 phrases for a focused assessment
    const shuffled = [...bank].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 8);
  }, [level]);

  const [step, setStep] = useState(0); // 0 = intro, 1..n = phrase n-1, n+1 = results
  const [scores, setScores] = useState({}); // phraseIdx → score
  const xpAwarded = useRef(false);

  const totalPhrases = phrases.length;
  const currentIdx = step - 1; // 0-based
  const isIntro = step === 0;
  const isResults = step > totalPhrases;
  const currentPhrase = !isIntro && !isResults ? phrases[currentIdx] : null;
  const completedCount = Object.keys(scores).length;
  const avgScore =
    completedCount > 0
      ? Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / completedCount)
      : 0;

  const handleScore = useCallback(
    (result) => {
      setScores((prev) => ({ ...prev, [currentIdx]: result.score }));
    },
    [currentIdx],
  );

  const handleNext = useCallback(() => {
    setStep((s) => s + 1);
  }, []);

  const handleFinish = useCallback(() => {
    if (!xpAwarded.current && typeof award === 'function' && completedCount > 0) {
      xpAwarded.current = true;
      award(20 + Math.round(avgScore / 5)); // 20–40 XP based on quality
      markQuest('speak');
    }
    setStep(totalPhrases + 1);
  }, [award, completedCount, avgScore, totalPhrases]);

  const handleRestart = useCallback(() => {
    setScores({});
    setStep(0);
    xpAwarded.current = false;
  }, []);

  // ── Intro screen ─────────────────────────────────────────────────────────
  if (isIntro) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0 12px', gap: 8 }}>
          <button
            onClick={goBack}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--heading)',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 0',
            }}
          >
            ← Natrag
          </button>
        </div>

        <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎙️</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--heading)', marginBottom: 8 }}>
            Pronunciation Assessment
          </h1>
          <p style={{ fontSize: 14, color: 'var(--subtext)', lineHeight: 1.6, marginBottom: 0 }}>
            Speak 8 Croatian phrases and receive a personalised pronunciation score. Powered by
            Azure Speech recognition for hr-HR Croatian.
          </p>
        </div>

        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--card-b)',
            borderRadius: 14,
            padding: '20px 18px',
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)', marginBottom: 12 }}>
            What you'll be assessed on:
          </div>
          {[
            ['🔤', 'Accuracy', 'How clearly each sound matches Croatian phonemes'],
            ['🌊', 'Fluency', 'Natural rhythm and smooth delivery'],
            ['✅', 'Completeness', 'Coverage of all sounds in the phrase'],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)' }}>
                  {title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--subtext)', lineHeight: 1.4 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            background: 'rgba(212,0,45,0.06)',
            border: '1px solid rgba(212,0,45,0.2)',
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 24,
            fontSize: 13,
            color: 'var(--subtext)',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: 'var(--heading)' }}>💡 Tips:</strong> Find a quiet space · Speak
          clearly and at normal pace · The first attempt always counts most · Chrome / Edge give the
          most accurate results
        </div>

        <button
          onClick={() => setStep(1)}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 12,
            background: '#D4002D',
            color: '#fff',
            border: 'none',
            fontSize: 17,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(212,0,45,0.35)',
          }}
        >
          Start Assessment →
        </button>

        <button
          onClick={() => setScr('pronunciation_course')}
          style={{
            width: '100%',
            marginTop: 12,
            padding: '12px 0',
            background: 'none',
            border: 'none',
            color: 'var(--info)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          📚 Study phonemes first →
        </button>
      </div>
    );
  }

  // ── Results screen ────────────────────────────────────────────────────────
  if (isResults) {
    const grade = overallGrade(avgScore);
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0 12px', gap: 8 }}>
          <button
            onClick={goBack}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--heading)',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 0',
            }}
          >
            ← Done
          </button>
        </div>

        {/* Overall grade card */}
        <div
          style={{
            background: `linear-gradient(135deg, ${grade.color}15, ${grade.color}08)`,
            border: `1.5px solid ${grade.color}40`,
            borderRadius: 16,
            padding: '28px 24px',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: `${grade.color}20`,
              border: `2px solid ${grade.color}50`,
              fontSize: 32,
              fontWeight: 900,
              color: grade.color,
              marginBottom: 12,
            }}
          >
            {grade.letter}
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: grade.color, marginBottom: 4 }}>
            {avgScore} / 100
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--heading)', marginBottom: 8 }}>
            {grade.label}
          </div>
          <p style={{ fontSize: 13, color: 'var(--subtext)', lineHeight: 1.6, margin: 0 }}>
            {grade.advice}
          </p>
        </div>

        {/* Phrase-by-phrase breakdown */}
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--card-b)',
            borderRadius: 14,
            padding: '16px 16px 8px',
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)', marginBottom: 12 }}>
            Phrase Breakdown
          </div>
          {phrases.map((p, i) => {
            const s = scores[i];
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  paddingBottom: 10,
                  marginBottom: 10,
                  borderBottom: i < phrases.length - 1 ? '1px solid var(--card-b)' : 'none',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--subtext)',
                    width: 20,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--heading)',
                      marginBottom: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {p.hr}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--subtext)' }}>{p.en}</div>
                </div>
                {s !== undefined ? (
                  <ScoreChip score={s} />
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--subtext)' }}>—</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => setScr('pronunciation_course')}
            style={{
              padding: '14px',
              borderRadius: 12,
              border: '1.5px solid rgba(212,0,45,0.4)',
              background: 'rgba(212,0,45,0.06)',
              color: '#D4002D',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            📚 Study Phoneme Course
          </button>
          <button
            onClick={() => setScr('proncontrast')}
            style={{
              padding: '14px',
              borderRadius: 12,
              border: '1.5px solid var(--card-b)',
              background: 'var(--card)',
              color: 'var(--heading)',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🎯 Minimal Pairs Drill
          </button>
          <button
            onClick={handleRestart}
            style={{
              padding: '12px',
              borderRadius: 12,
              border: 'none',
              background: 'none',
              color: 'var(--subtext)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🔄 Retake Assessment
          </button>
        </div>
      </div>
    );
  }

  // ── Assessment phrase screen ──────────────────────────────────────────────
  const phraseScore = scores[currentIdx];
  const isScored = phraseScore !== undefined;
  const isLast = currentIdx === totalPhrases - 1;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 100px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 0 12px',
        }}
      >
        <button
          onClick={goBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--heading)',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          ← Cancel
        </button>
        <span style={{ fontSize: 13, color: 'var(--subtext)', fontVariantNumeric: 'tabular-nums' }}>
          {step} / {totalPhrases}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 24 }}>
        <ProgressBar value={(completedCount / totalPhrases) * 100} color="#D4002D" />
      </div>

      {/* Phrase card */}
      <div
        style={{
          background: 'var(--card)',
          border: '1.5px solid var(--card-b)',
          borderRadius: 16,
          padding: '24px 20px',
          marginBottom: 20,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'var(--subtext)',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Say this in Croatian
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: 'var(--heading)',
            lineHeight: 1.3,
            marginBottom: 8,
          }}
        >
          {currentPhrase.hr}
        </div>
        <div style={{ fontSize: 14, color: 'var(--subtext)', fontStyle: 'italic' }}>
          {currentPhrase.en}
        </div>
      </div>

      {/* Scorer */}
      <PronunciationScorer
        targetText={currentPhrase.hr}
        level={level || 'B1'}
        onScore={handleScore}
      />

      {/* Score result + next button */}
      {isScored && (
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '16px',
              borderRadius: 12,
              background: `${scoreColor(phraseScore)}10`,
              border: `1px solid ${scoreColor(phraseScore)}30`,
              marginBottom: 16,
            }}
          >
            <ScoreChip score={phraseScore} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--heading)' }}>
              {scoreLabel(phraseScore)}
            </span>
          </div>

          <button
            onClick={isLast ? handleFinish : handleNext}
            style={{
              width: '100%',
              height: 50,
              borderRadius: 12,
              background: '#D4002D',
              color: '#fff',
              border: 'none',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(212,0,45,0.3)',
            }}
          >
            {isLast ? '📊 See Results' : `Next Phrase (${step + 1}/${totalPhrases}) →`}
          </button>
        </div>
      )}

      {/* Skip button (before scored) */}
      {!isScored && (
        <button
          onClick={handleNext}
          style={{
            width: '100%',
            marginTop: 16,
            padding: '12px',
            background: 'none',
            border: 'none',
            color: 'var(--subtext)',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Skip this phrase →
        </button>
      )}
    </div>
  );
}
