import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { H } from '../../data.jsx';

// ─── Scenario data ────────────────────────────────────────────────────────────

const SCENARIOS = [
  {
    id: 'shop',
    icon: '🛒',
    title: 'U dućanu',
    titleEn: 'At the shop',
    color: '#16a34a',
    description: 'Buy groceries, ask for prices, pay',
    difficulty: 'A1',
    phrases: [
      { hr: 'Koliko košta?', en: 'How much does it cost?', note: 'Essential price question' },
      { hr: 'Mogu li platiti karticom?', en: 'Can I pay by card?', note: 'Very common' },
      { hr: 'Imate li...?', en: 'Do you have...?', note: 'Use with any noun' },
      { hr: 'Dajte mi, molim, kilu jabuka.', en: 'Give me, please, a kilo of apples.', note: 'Market shopping' },
      { hr: 'To je preskupo.', en: 'That is too expensive.', note: 'Polite haggling' },
      { hr: 'Gdje je kasa?', en: 'Where is the checkout?', note: 'Finding the till' },
      { hr: 'Hvala, doviđenja.', en: 'Thank you, goodbye.', note: 'Always say this leaving a shop' },
      { hr: 'Primajte li Visa karticu?', en: 'Do you accept Visa?', note: 'Card payment' },
      { hr: 'Ima li popusta?', en: 'Is there a discount?', note: 'Asking about sales' },
      { hr: 'Mogu li dobiti račun?', en: 'Can I get a receipt?', note: 'Always useful' },
    ],
    dialogue: [
      { role: 'A', speaker: 'You', text: 'Dobar dan! Imate li svježe kruha?', trans: 'Good day! Do you have fresh bread?' },
      { role: 'B', speaker: 'Shopkeeper', text: 'Imamo, naravno. Bijeli ili crni?', trans: 'We do, of course. White or dark?' },
      { role: 'A', speaker: 'You', text: 'Bijeli, molim. I kilu jabuka.', trans: 'White, please. And a kilo of apples.' },
      { role: 'B', speaker: 'Shopkeeper', text: 'To je petnaest kuna ukupno.', trans: 'That is fifteen kuna in total.' },
      { role: 'A', speaker: 'You', text: 'Mogu li platiti karticom?', trans: 'Can I pay by card?' },
      { role: 'B', speaker: 'Shopkeeper', text: 'Može, naravno. Hvala lijepa!', trans: 'Of course. Thank you very much!' },
    ],
    quiz: [
      { q: 'How do you ask "How much does it cost?"', options: ['Koliko košta?', 'Gdje je kasa?', 'Imate li?', 'Hvala.'], ans: 0 },
      { q: 'Which phrase means "Can I pay by card?"', options: ['Ima li popusta?', 'Mogu li platiti karticom?', 'Dajte mi kruh.', 'To je preskupo.'], ans: 1 },
      { q: '"Doviđenja" means:', options: ['Hello', 'Please', 'Goodbye', 'Thank you'], ans: 2 },
    ],
  },
  {
    id: 'doctor',
    icon: '🏥',
    title: 'Kod liječnika',
    titleEn: 'At the doctor',
    color: '#dc2626',
    description: 'Describe symptoms, understand instructions',
    difficulty: 'A2',
    phrases: [
      { hr: 'Boli me glava.', en: 'My head hurts.', note: 'Boli me + body part' },
      { hr: 'Boli me grlo.', en: 'My throat hurts.', note: 'Very common illness phrase' },
      { hr: 'Imam temperaturu.', en: 'I have a fever.', note: 'Common illness phrase' },
      { hr: 'Ne osjećam se dobro.', en: "I don't feel well.", note: 'General unwell' },
      { hr: 'Trebam liječnika.', en: 'I need a doctor.', note: 'Emergency phrase' },
      { hr: 'Alergičan/alergična sam na...', en: 'I am allergic to...', note: 'Critical for safety' },
      { hr: 'Uzimam lijekove.', en: 'I am taking medication.', note: 'Important info' },
      { hr: 'Gdje je ljekarna?', en: 'Where is the pharmacy?', note: 'After consultation' },
      { hr: 'Mogu li dobiti recept?', en: 'Can I get a prescription?', note: 'Asking for script' },
      { hr: 'Koliko tableta dnevno?', en: 'How many tablets per day?', note: 'Dosage question' },
    ],
    dialogue: [
      { role: 'A', speaker: 'You', text: 'Dobar dan. Ne osjećam se dobro.', trans: 'Good day. I do not feel well.' },
      { role: 'B', speaker: 'Doctor', text: 'Što vas boli?', trans: 'What is hurting you?' },
      { role: 'A', speaker: 'You', text: 'Boli me grlo i imam temperaturu.', trans: 'My throat hurts and I have a fever.' },
      { role: 'B', speaker: 'Doctor', text: 'Od kada imate temperaturu?', trans: 'Since when have you had a fever?' },
      { role: 'A', speaker: 'You', text: 'Od jučer. Alergičan sam na penicilin.', trans: 'Since yesterday. I am allergic to penicillin.' },
      { role: 'B', speaker: 'Doctor', text: 'Dat ću vam recept za antibiotike.', trans: 'I will give you a prescription for antibiotics.' },
    ],
    quiz: [
      { q: '"Boli me glava" means:', options: ['I have a fever', 'My head hurts', 'I need a doctor', 'I am allergic'], ans: 1 },
      { q: 'How do you say "I am allergic to..."?', options: ['Imam temperaturu', 'Trebam liječnika', 'Alergičan/a sam na...', 'Gdje je ljekarna?'], ans: 2 },
      { q: 'What does "Gdje je ljekarna?" mean?', options: ['Where is the doctor?', 'Where is the hospital?', 'Where is the pharmacy?', 'Where is the clinic?'], ans: 2 },
    ],
  },
  {
    id: 'immigration',
    icon: '🏛️',
    title: 'Uredi i obrasci',
    titleEn: 'Offices and forms',
    color: '#7c3aed',
    description: 'Visa, registration, official communication',
    difficulty: 'B1',
    phrases: [
      { hr: 'Trebam produžiti vizu.', en: 'I need to extend my visa.', note: 'Very common need' },
      { hr: 'Gdje se prijavljujem za boravišnu dozvolu?', en: 'Where do I register for a residence permit?', note: 'Key phrase' },
      { hr: 'Trebam ovjeriti dokument.', en: 'I need to certify a document.', note: 'Notarisation' },
      { hr: 'Mogu li dobiti potvrdu?', en: 'Can I get a confirmation?', note: 'Requesting official docs' },
      { hr: 'Koji su potrebni dokumenti?', en: 'Which documents are needed?', note: 'Always ask this first' },
      { hr: 'Nisam razumio/razumjela. Možete li ponoviti?', en: "I didn't understand. Can you repeat?", note: 'Essential polite phrase' },
      { hr: 'Govorite li engleski?', en: 'Do you speak English?', note: 'Fallback in offices' },
      { hr: 'Trebam prevoditelja.', en: 'I need a translator.', note: 'Right to interpreter' },
      { hr: 'Kada je rok?', en: 'When is the deadline?', note: 'Critical in immigration' },
      { hr: 'Mogu li zakupiti termin?', en: 'Can I book an appointment?', note: 'Most offices require this' },
    ],
    dialogue: [
      { role: 'A', speaker: 'You', text: 'Dobar dan. Trebam produžiti vizu.', trans: 'Good day. I need to extend my visa.' },
      { role: 'B', speaker: 'Official', text: 'Imate li sve potrebne dokumente?', trans: 'Do you have all the necessary documents?' },
      { role: 'A', speaker: 'You', text: 'Koji su potrebni dokumenti?', trans: 'Which documents are needed?' },
      { role: 'B', speaker: 'Official', text: 'Putovnica, dokaz o smještaju i financijsko jamstvo.', trans: 'Passport, proof of accommodation and financial guarantee.' },
      { role: 'A', speaker: 'You', text: 'Nisam razumio. Možete li ponoviti?', trans: "I didn't understand. Can you repeat?" },
      { role: 'B', speaker: 'Official', text: 'Naravno. Trebate putovnicu i potvrdu o smještaju.', trans: 'Of course. You need your passport and accommodation confirmation.' },
    ],
    quiz: [
      { q: 'How do you say "I need to extend my visa"?', options: ['Trebam prevoditelja.', 'Trebam produžiti vizu.', 'Koji su dokumenti?', 'Mogu li dobiti potvrdu?'], ans: 1 },
      { q: '"Nisam razumio/razumjela" means:', options: ['I need a translator', "I didn't understand", 'Can you repeat?', 'When is the deadline?'], ans: 1 },
      { q: 'What does "Kada je rok?" mean?', options: ['When does it close?', 'When is the deadline?', 'When can I come?', 'When is the appointment?'], ans: 1 },
    ],
  },
  {
    id: 'family',
    icon: '👨‍👩‍👧‍👦',
    title: 'U obitelji',
    titleEn: 'With family',
    color: '#d97706',
    description: 'Visiting Croatian family, Ti vs Vi, expressing affection',
    difficulty: 'A2',
    phrases: [
      { hr: 'Drago mi je što te vidim!', en: 'I am glad to see you!', note: 'Informal greeting for family' },
      { hr: 'Kako si? / Kako ste?', en: 'How are you? (informal/formal)', note: 'Ti vs Vi difference shown' },
      { hr: 'Mnogo mi nedostaješ.', en: 'I miss you a lot.', note: 'Emotional, diaspora context' },
      { hr: 'Ostajete li na večeru?', en: 'Are you staying for dinner?', note: 'Very common invitation' },
      { hr: 'Hvala na gostoprimstvu.', en: 'Thank you for your hospitality.', note: 'After a visit' },
      { hr: 'Koji si razred?', en: 'What grade are you in?', note: 'Asking children' },
      { hr: 'Kako ti ide škola?', en: 'How is school going for you?', note: 'Informal family chat' },
      { hr: 'Baka, pomaži me malo.', en: 'Grandma, help me a little.', note: 'Diminutive baka = grandma' },
      { hr: 'Čuvaj se!', en: 'Take care of yourself!', note: 'Common farewell' },
      { hr: 'Dođi nam opet!', en: 'Come visit us again!', note: 'Parting phrase' },
    ],
    dialogue: [
      { role: 'A', speaker: 'You', text: 'Baka, drago mi je što te vidim!', trans: 'Grandma, I am so glad to see you!' },
      { role: 'B', speaker: 'Grandma', text: 'I meni, srce moje! Kako si?', trans: 'Me too, my heart! How are you?' },
      { role: 'A', speaker: 'You', text: 'Dobro, hvala. Mnogo mi nedostajete.', trans: 'Good, thank you. I miss you all so much.' },
      { role: 'B', speaker: 'Grandma', text: 'Ostajete li na večeru? Pravim sarmu.', trans: 'Are you staying for dinner? I am making sarma.' },
      { role: 'A', speaker: 'You', text: 'Naravno! Sarmu obožavam!', trans: 'Of course! I love sarma!' },
      { role: 'B', speaker: 'Grandma', text: 'Odlično. Dođite za sat vremena.', trans: 'Excellent. Come in an hour.' },
    ],
    quiz: [
      { q: '"Mnogo mi nedostaješ" means:', options: ['I love you', 'I miss you a lot', 'I am glad to see you', 'Take care'], ans: 1 },
      { q: 'What is the formal way to say "How are you?"', options: ['Kako si?', 'Kako je?', 'Kako ste?', 'Kako ti je?'], ans: 2 },
      { q: '"Čuvaj se!" means:', options: ['Come again!', 'Thank you!', 'Goodbye!', 'Take care of yourself!'], ans: 3 },
    ],
  },
];

// ─── Difficulty badge colours ─────────────────────────────────────────────────

const DIFF_COLOR = {
  A1: '#16a34a',
  A2: '#2563eb',
  B1: '#d97706',
  B2: '#7c3aed',
};

// ─── localStorage key ─────────────────────────────────────────────────────────

const STUDIED_KEY = 'nh_practical_studied';

function getStudied() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STUDIED_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function markStudied(id) {
  try {
    const s = getStudied();
    s.add(id);
    localStorage.setItem(STUDIED_KEY, JSON.stringify([...s]));
  } catch {
    // ignore
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DiffBadge({ level }) {
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 10,
      fontWeight: 800,
      color: '#fff',
      background: DIFF_COLOR[level] || '#64748b',
      borderRadius: 6,
      padding: '2px 7px',
      letterSpacing: '.05em',
      lineHeight: 1.6,
    }}>
      {level}
    </span>
  );
}

function MenuView({ onSelect }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {SCENARIOS.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s)}
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--card-b)',
            borderRadius: 16,
            padding: '16px 14px',
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: "'Outfit', sans-serif",
            transition: 'box-shadow .15s, border-color .15s',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 32 }}>{s.icon}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)', fontFamily: "'Playfair Display', serif" }}>
              {s.title}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--subtext)', fontStyle: 'italic', lineHeight: 1.3 }}>
            {s.titleEn}
          </div>
          <DiffBadge level={s.difficulty} />
          <div style={{ fontSize: 11, color: 'var(--subtext)', lineHeight: 1.4, marginTop: 2 }}>
            {s.description}
          </div>
          <div style={{
            marginTop: 4,
            display: 'inline-block',
            fontSize: 11,
            fontWeight: 700,
            color: s.color,
            borderTop: `2px solid ${s.color}`,
            paddingTop: 6,
          }}>
            Tap to learn →
          </div>
        </button>
      ))}
    </div>
  );
}

function PhrasesTab({ phrases }) {
  const [copied, setCopied] = useState(null);

  function handleCopy(hr, idx) {
    try {
      navigator.clipboard.writeText(hr).catch(() => {});
    } catch {
      // ignore
    }
    setCopied(idx);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {phrases.map((p, i) => (
        <div
          key={i}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--card-b)',
            borderRadius: 14,
            padding: '12px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 17,
              fontWeight: 700,
              color: 'var(--heading)',
              lineHeight: 1.3,
              marginBottom: 3,
            }}>
              {p.hr}
            </div>
            <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 4 }}>
              {p.en}
            </div>
            <div style={{ fontSize: 11, color: 'var(--subtext)', fontStyle: 'italic', opacity: .75 }}>
              {p.note}
            </div>
          </div>
          <button
            onClick={() => handleCopy(p.hr, i)}
            aria-label={`Copy "${p.hr}" to clipboard`}
            style={{
              flexShrink: 0,
              background: copied === i ? '#dcfce7' : 'var(--card-b)',
              border: 'none',
              borderRadius: 8,
              padding: '5px 9px',
              fontSize: 11,
              fontWeight: 700,
              color: copied === i ? '#16a34a' : 'var(--subtext)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background .2s, color .2s',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {copied === i ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>
      ))}
    </div>
  );
}

function DialogueTab({ dialogue }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {dialogue.map((line, i) => {
        const isA = line.role === 'A';
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isA ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--subtext)',
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: '.06em',
            }}>
              {line.speaker}
            </div>
            <div style={{
              maxWidth: '82%',
              background: isA ? 'var(--info)' : 'var(--card)',
              color: isA ? '#fff' : 'var(--heading)',
              borderRadius: isA ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              padding: '10px 14px',
              border: isA ? 'none' : '1px solid var(--card-b)',
              boxShadow: '0 1px 4px rgba(0,0,0,.06)',
            }}>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1.4,
                marginBottom: 5,
              }}>
                {line.text}
              </div>
              <div style={{
                fontSize: 11,
                fontStyle: 'italic',
                opacity: isA ? .85 : 1,
                color: isA ? 'rgba(255,255,255,.88)' : 'var(--subtext)',
                lineHeight: 1.4,
              }}>
                {line.trans}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LearnView({ scenario, onStartQuiz, onBack }) {
  const [tab, setTab] = useState('phrases');

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(0,0,0,.06)' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, color: 'var(--subtext)',
            marginBottom: 8, padding: '4px 0', fontFamily: "'Outfit', sans-serif",
          }}
        >
          ‹ Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>{scenario.icon}</span>
          <div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 22, color: 'var(--heading)',
              fontWeight: 800, letterSpacing: '-.02em',
              lineHeight: 1.2, margin: 0,
            }}>
              {scenario.title}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--subtext)', fontStyle: 'italic' }}>{scenario.titleEn}</span>
              <DiffBadge level={scenario.difficulty} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['phrases', 'dialogue'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 10,
              border: tab === t ? `2px solid ${scenario.color}` : '2px solid var(--card-b)',
              background: tab === t ? scenario.color : 'var(--card)',
              color: tab === t ? '#fff' : 'var(--subtext)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
              transition: 'all .15s',
            }}
          >
            {t === 'phrases' ? 'Phrases' : 'Dialogue'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'phrases' && <PhrasesTab phrases={scenario.phrases} />}
      {tab === 'dialogue' && <DialogueTab dialogue={scenario.dialogue} />}

      {/* Start quiz button */}
      <button
        onClick={onStartQuiz}
        style={{
          display: 'block',
          width: '100%',
          marginTop: 20,
          padding: '14px 0',
          borderRadius: 14,
          border: 'none',
          background: scenario.color,
          color: '#fff',
          fontSize: 15,
          fontWeight: 800,
          cursor: 'pointer',
          fontFamily: "'Outfit', sans-serif",
          letterSpacing: '.01em',
          boxShadow: `0 3px 12px ${scenario.color}44`,
        }}
      >
        Start Quiz →
      </button>
    </div>
  );
}

function QuizView({ scenario, onBack }) {
  const { award } = useApp();
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [done, setDone] = useState(false);

  const questions = scenario.quiz;
  const current = questions[qIdx];

  function handleSelect(optIdx) {
    if (selected !== null) return;
    setSelected(optIdx);
  }

  function handleNext() {
    const updated = [...answers, selected];
    if (qIdx + 1 >= questions.length) {
      const correct = updated.filter((a, i) => a === questions[i].ans).length;
      if (typeof award === 'function') award(correct * 5);
      setAnswers(updated);
      setDone(true);
    } else {
      setAnswers(updated);
      setSelected(null);
      setQIdx(qIdx + 1);
    }
  }

  if (done) {
    const correct = answers.filter((a, i) => a === questions[i].ans).length;
    const perfect = correct === questions.length;
    const xp = correct * 5;

    return (
      <div>
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, color: 'var(--subtext)',
            marginBottom: 16, padding: '4px 0', fontFamily: "'Outfit', sans-serif",
          }}
        >
          ‹ Back
        </button>

        {/* Score card */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--card-b)',
          borderRadius: 20,
          padding: '28px 24px',
          textAlign: 'center',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>
            {perfect ? '🎉' : correct >= 2 ? '💪' : '📚'}
          </div>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 28,
            fontWeight: 800,
            color: 'var(--heading)',
            marginBottom: 4,
          }}>
            {correct}/{questions.length}
          </div>
          <div style={{ fontSize: 14, color: 'var(--subtext)', marginBottom: 12 }}>
            {perfect
              ? 'Perfect score! Excellent Croatian!'
              : correct >= 2
              ? 'Great work! Keep practising.'
              : 'Good effort — try again to improve!'}
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(234,179,8,.12)',
            borderRadius: 10,
            padding: '7px 16px',
          }}>
            <span style={{ fontSize: 18 }}>⭐</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#d97706' }}>+{xp} XP</span>
          </div>
          {perfect && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--subtext)', fontStyle: 'italic' }}>
              🎊 Confetti! Savršeno!
            </div>
          )}
        </div>

        {/* Answer review */}
        <div style={{ marginBottom: 16 }}>
          {questions.map((q, i) => {
            const userAns = answers[i];
            const isRight = userAns === q.ans;
            return (
              <div
                key={i}
                style={{
                  background: isRight ? '#dcfce7' : '#fee2e2',
                  border: `1px solid ${isRight ? '#16a34a' : '#dc2626'}`,
                  borderRadius: 12,
                  padding: '10px 14px',
                  marginBottom: 8,
                  fontSize: 12,
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--heading)', marginBottom: 4 }}>
                  {i + 1}. {q.q}
                </div>
                <div style={{ color: isRight ? '#14532d' : '#7f1d1d' }}>
                  {isRight ? '✓ ' : '✗ '}
                  {isRight
                    ? q.options[q.ans]
                    : `Correct: ${q.options[q.ans]}`}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => {
              setQIdx(0);
              setSelected(null);
              setAnswers([]);
              setDone(false);
            }}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 12,
              border: '2px solid var(--card-b)',
              background: 'var(--card)',
              color: 'var(--heading)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Try Again
          </button>
          <button
            onClick={onBack}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 12,
              border: 'none',
              background: scenario.color,
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
              boxShadow: `0 2px 8px ${scenario.color}44`,
            }}
          >
            Back to Scenarios
          </button>
        </div>
      </div>
    );
  }

  // Active quiz question
  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 700, color: 'var(--subtext)',
          marginBottom: 16, padding: '4px 0', fontFamily: "'Outfit', sans-serif",
        }}
      >
        ‹ Back
      </button>

      {/* Progress */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--subtext)' }}>
            {scenario.icon} {scenario.title}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--subtext)' }}>
            {qIdx + 1} / {questions.length}
          </span>
        </div>
        <div style={{
          height: 5,
          background: 'var(--card-b)',
          borderRadius: 99,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${((qIdx + (selected !== null ? 1 : 0)) / questions.length) * 100}%`,
            background: scenario.color,
            borderRadius: 99,
            transition: 'width .3s',
          }} />
        </div>
      </div>

      {/* Question */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--card-b)',
        borderRadius: 16,
        padding: '18px 16px',
        marginBottom: 14,
      }}>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--heading)',
          lineHeight: 1.4,
        }}>
          {current.q}
        </div>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {current.options.map((opt, oi) => {
          let bg = 'var(--card)';
          let border = '2px solid var(--card-b)';
          let color = 'var(--heading)';

          if (selected !== null) {
            if (oi === current.ans) {
              bg = '#dcfce7'; border = '2px solid #16a34a'; color = '#14532d';
            } else if (oi === selected) {
              bg = '#fee2e2'; border = '2px solid #dc2626'; color = '#7f1d1d';
            }
          } else if (selected === oi) {
            border = `2px solid ${scenario.color}`;
          }

          return (
            <button
              key={oi}
              onClick={() => handleSelect(oi)}
              disabled={selected !== null}
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                border,
                background: bg,
                color,
                fontSize: 13,
                fontWeight: 600,
                cursor: selected !== null ? 'default' : 'pointer',
                textAlign: 'left',
                fontFamily: "'Outfit', sans-serif",
                transition: 'all .18s',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* Feedback + Next */}
      {selected !== null && (
        <div>
          <div style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: selected === current.ans ? 'rgba(22,163,74,.1)' : 'rgba(220,38,38,.08)',
            color: selected === current.ans ? '#14532d' : '#7f1d1d',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 12,
          }}>
            {selected === current.ans
              ? '✓ Correct! Izvrsno!'
              : `✗ Correct answer: ${current.options[current.ans]}`}
          </div>
          <button
            onClick={handleNext}
            style={{
              display: 'block',
              width: '100%',
              padding: '13px 0',
              borderRadius: 13,
              border: 'none',
              background: scenario.color,
              color: '#fff',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
              boxShadow: `0 3px 10px ${scenario.color}44`,
            }}
          >
            {qIdx + 1 >= questions.length ? 'See Results' : 'Next Question →'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PracticalCroatianScreen({ goBack, stats }) {
  const { award } = useApp();
  const [view, setView] = useState('menu'); // 'menu' | 'learn' | 'quiz'
  const [scenario, setScenario] = useState(null);

  function handleSelectScenario(s) {
    setScenario(s);
    setView('learn');
  }

  function handleStartQuiz() {
    // Award 10 XP for studying — once per scenario
    const studied = getStudied();
    if (!studied.has(scenario.id)) {
      if (typeof award === 'function') award(10);
      markStudied(scenario.id);
    }
    setView('quiz');
  }

  function handleBackToMenu() {
    setScenario(null);
    setView('menu');
  }

  function handleBackToLearn() {
    setView('learn');
  }

  return (
    <div className="scr-wrap">
      {view === 'menu' && (
        <>
          {H('🗣️ Practical Croatian', 'Survival phrases for real-world situations', goBack)}
          <div style={{
            marginBottom: 16,
            padding: '10px 14px',
            background: 'rgba(14,116,144,.07)',
            borderRadius: 12,
            fontSize: 12,
            color: '#0e7490',
            lineHeight: 1.6,
          }}>
            💡 Four scenarios diaspora and visitors need most. Learn phrases, follow the dialogue, then test yourself.
          </div>
          <MenuView onSelect={handleSelectScenario} />
        </>
      )}

      {view === 'learn' && scenario && (
        <LearnView
          scenario={scenario}
          onStartQuiz={handleStartQuiz}
          onBack={handleBackToMenu}
        />
      )}

      {view === 'quiz' && scenario && (
        <QuizView
          scenario={scenario}
          onBack={handleBackToLearn}
        />
      )}
    </div>
  );
}
