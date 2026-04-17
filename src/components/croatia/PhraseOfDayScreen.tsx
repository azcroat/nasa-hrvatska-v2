// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { H } from '../../data';
import { useStats } from '../../context/StatsContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { apiFetch } from '../../lib/apiFetch.js';
import { getVoicePreference } from '../../lib/soundSettings.js';

// ── Category definitions ──────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'greeting', label: '🌅 Greeting' },
  { id: 'work',     label: '💼 Work' },
  { id: 'travel',   label: '✈️ Travel' },
  { id: 'food',     label: '🍽️ Food' },
  { id: 'slang',    label: '🔥 Slang' },
  { id: 'love',     label: '💕 Love' },
  { id: 'sports',   label: '⚽ Sports' },
  { id: 'family',   label: '👨‍👩‍👧 Family' },
];

const CATEGORY_COLORS = {
  greeting: '#0e7490',
  work:     '#0369a1',
  travel:   '#7c3aed',
  food:     '#b45309',
  slang:    '#dc2626',
  love:     '#db2777',
  sports:   '#16a34a',
  family:   '#9333ea',
};

// ── Hardcoded seed phrases per category (shown before/if API fails) ───────────
const SEED_PHRASES = {
  greeting: {
    phrase: 'Kako si, brate?',
    translation: 'How are you, man?',
    literal: 'How are you, brother?',
    pronunciation_guide: 'KA-ko si, BRA-te?',
    when_to_use: 'A casual, warm greeting between male friends or acquaintances. Women sometimes use it too, but less commonly.',
    cultural_note: 'In Croatia, "brate" (brother) is one of the most common terms of address between friends — even total strangers. It signals warmth and solidarity, not an actual family relationship.',
    example_dialogue: [
      { speaker: 'A', line: 'Ej, kako si, brate?' },
      { speaker: 'B', line: 'Dobro, dobro! A ti?' },
    ],
    word_breakdown: [
      { word: 'kako', meaning: 'how', note: 'interrogative adverb' },
      { word: 'si', meaning: 'are (you)', note: '2nd person singular of "biti"' },
      { word: 'brate', meaning: 'brother', note: 'vocative case of "brat"' },
    ],
    related_phrases: ['Što ima?', 'Ima li novosti?', 'Sve u redu?'],
  },
  work: {
    phrase: 'Imam full puno posla.',
    translation: 'I\'m absolutely swamped with work.',
    literal: 'I have completely full of work.',
    pronunciation_guide: 'I-mam full PU-no POS-la.',
    when_to_use: 'When you want to express that you are very busy with work. Common in modern Croatian urban speech, especially in Zagreb offices.',
    cultural_note: '"Full" is an English loanword that has been fully adopted into colloquial Croatian as an intensifier. Younger Croatians use it constantly. It sits comfortably next to native Croatian words.',
    example_dialogue: [
      { speaker: 'A', line: 'Hoćeš li na kavu?' },
      { speaker: 'B', line: 'Ne mogu, imam full puno posla danas.' },
    ],
    word_breakdown: [
      { word: 'imam', meaning: 'I have', note: '1st person singular of "imati"' },
      { word: 'full', meaning: 'completely / totally', note: 'English loanword used as intensifier' },
      { word: 'puno', meaning: 'a lot', note: 'adverb of quantity' },
      { word: 'posla', meaning: 'work', note: 'genitive of "posao"' },
    ],
    related_phrases: ['Pretrpan sam.', 'Nemam vremena.', 'Stresno je.'],
  },
  travel: {
    phrase: 'Gdje mogu kupiti kartu?',
    translation: 'Where can I buy a ticket?',
    literal: null,
    pronunciation_guide: 'GD-ye MO-gu KU-pi-ti KAR-tu?',
    when_to_use: 'At train stations, bus terminals, ferry ports. Essential for navigating Croatian public transport.',
    cultural_note: 'Croatian trains are famously scenic but slow. Split to Zagreb takes about 5-6 hours — but the mountain views are extraordinary. Locals say "vlak" (train) is for people with time; "bus" is for people with less.',
    example_dialogue: [
      { speaker: 'Tourist', line: 'Oprostite, gdje mogu kupiti kartu za Split?' },
      { speaker: 'Local', line: 'Tamo, na blagajni — vidite li?' },
    ],
    word_breakdown: [
      { word: 'gdje', meaning: 'where', note: 'interrogative adverb of place' },
      { word: 'mogu', meaning: 'I can', note: '1st person singular of "moći"' },
      { word: 'kupiti', meaning: 'to buy', note: 'perfective infinitive' },
      { word: 'kartu', meaning: 'ticket', note: 'accusative of "karta"' },
    ],
    related_phrases: ['Kada polazi vlak?', 'Ima li slobodnih mjesta?', 'Koliko košta?'],
  },
  food: {
    phrase: 'Prstima se oblizat!',
    translation: 'Finger-licking good!',
    literal: 'You will lick your fingers!',
    pronunciation_guide: 'PRSTI-ma se ob-LI-zat!',
    when_to_use: 'When food is exceptionally delicious — at a home-cooked meal, a restaurant, or a market stall. A genuine compliment to the cook.',
    cultural_note: 'Complimenting food is very important in Croatian culture. A host who has cooked for you expects — and truly needs — to hear that you enjoyed it. Silence is worse than criticism.',
    example_dialogue: [
      { speaker: 'Guest', line: 'Baka, ova sarma je prstima se oblizat!' },
      { speaker: 'Baka', line: 'Ma hajde, uzmi još malo!' },
    ],
    word_breakdown: [
      { word: 'prstima', meaning: 'fingers', note: 'instrumental plural of "prst"' },
      { word: 'se', meaning: 'reflexive particle', note: 'marks reflexive verb' },
      { word: 'oblizat', meaning: 'to lick off', note: 'perfective infinitive (colloquial)' },
    ],
    related_phrases: ['Odlično je!', 'Baš je ukusno!', 'Još malo, molim!'],
  },
  slang: {
    phrase: 'Daj, ne idi mi na živce!',
    translation: 'Come on, stop getting on my nerves!',
    literal: 'Come on, don\'t go to my nerves!',
    pronunciation_guide: 'DAY, ne I-di mi na ŽI-vce!',
    when_to_use: 'When someone is being annoying. Slightly irritated, but not deeply offensive. Can be said with a smile among friends.',
    cultural_note: 'Croatian has a rich tradition of expressive complaint. This phrase is perfectly acceptable in everyday speech. A stronger version exists, but this is the polite form you can use freely.',
    example_dialogue: [
      { speaker: 'A', line: 'Ajde, pričaj mi o tome još jednom.' },
      { speaker: 'B', line: 'Daj, ne idi mi na živce s tim!' },
    ],
    word_breakdown: [
      { word: 'daj', meaning: 'come on / give (imperative)', note: 'imperative of "dati", used as discourse particle' },
      { word: 'ne idi', meaning: 'don\'t go', note: 'negative imperative of "ići"' },
      { word: 'mi', meaning: 'me / my (dative)', note: 'dative of "ja"' },
      { word: 'živce', meaning: 'nerves', note: 'accusative plural of "živac"' },
    ],
    related_phrases: ['Pusti me na miru.', 'Dosta je.', 'Dovoljno je.'],
  },
  love: {
    phrase: 'Nedostaješ mi.',
    translation: 'I miss you.',
    literal: 'You are lacking to me.',
    pronunciation_guide: 'Ne-dos-TA-yeš mi.',
    when_to_use: 'When you miss someone — a partner, a close friend, or a family member far away. One of the most emotionally resonant phrases in Croatian.',
    cultural_note: 'Croatian expresses "I miss you" from the perspective of absence rather than longing — it\'s literally "you are lacking to me." This reflects a deeper, more melancholic sense of loss. Diaspora Croatians abroad know this feeling well.',
    example_dialogue: [
      { speaker: 'A', line: 'Nedostaješ mi jako puno.' },
      { speaker: 'B', line: 'I ti meni. Jedva čekam da se vidimo.' },
    ],
    word_breakdown: [
      { word: 'nedostaješ', meaning: 'you are lacking / missing', note: '2nd person singular of "nedostajati"' },
      { word: 'mi', meaning: 'to me', note: 'dative of "ja"' },
    ],
    related_phrases: ['Volim te.', 'Jedva čekam da te vidim.', 'Mislio sam na tebe.'],
  },
  sports: {
    phrase: 'Idemo Vatreni!',
    translation: 'Let\'s go, Fiery Ones!',
    literal: 'Let\'s go, Fiery Ones!',
    pronunciation_guide: 'I-de-mo VA-tre-ni!',
    when_to_use: 'At any Croatia national football match, sports bar, or wherever Croatians gather to watch the national team. Possibly the most emotionally loaded phrase in Croatian sports culture.',
    cultural_note: '"Vatreni" (The Fiery Ones) is the beloved nickname of Croatia\'s national football team. The name reflects the passion and fighting spirit Croatians believe defines their play. The 2018 World Cup final run united the diaspora worldwide in ways few events have.',
    example_dialogue: [
      { speaker: 'Fan 1', line: 'Jesi spreman? Utakmica počinje za pet minuta!' },
      { speaker: 'Fan 2', line: 'Spreman! Idemo Vatreni!!! 🇭🇷' },
    ],
    word_breakdown: [
      { word: 'idemo', meaning: 'let\'s go / we go', note: '1st person plural of "ići", used as encouragement' },
      { word: 'Vatreni', meaning: 'Fiery Ones', note: 'nominative plural of "vatren" (fiery), nickname of Croatian national team' },
    ],
    related_phrases: ['Za dom!', 'Hrvatska, Hrvatska!', 'Gol!!!'],
  },
  family: {
    phrase: 'Krv nije voda.',
    translation: 'Blood is thicker than water.',
    literal: 'Blood is not water.',
    pronunciation_guide: 'Krv ni-YE VO-da.',
    when_to_use: 'When explaining why family comes first, or why you stood by a family member despite disagreements. A proverb but used in real conversation.',
    cultural_note: 'Family loyalty is foundational in Croatian culture. Extended family (rodbina) is not a separate social category — it\'s a primary one. Decisions are often made with family in mind first. This proverb captures that instinct precisely.',
    example_dialogue: [
      { speaker: 'A', line: 'Zašto mu pomažeš? Pa znaš kakav je.' },
      { speaker: 'B', line: 'Pa krv nije voda. Što da radim.' },
    ],
    word_breakdown: [
      { word: 'krv', meaning: 'blood', note: 'nominative singular, feminine noun' },
      { word: 'nije', meaning: 'is not', note: 'negation of "je" (to be)' },
      { word: 'voda', meaning: 'water', note: 'nominative singular, feminine noun' },
    ],
    related_phrases: ['Obitelj je sve.', 'Rodbina je rodbina.', 'Naša je naša.'],
  },
};

// ── Beautiful loading skeleton ────────────────────────────────────────────────
function PhraseSkeletonLoader({ color }) {
  const c = color || '#0e7490';
  return (
    <div>
      <style>{`
        @keyframes pod-pulse { 0%,100%{opacity:1}50%{opacity:.35} }
        .pod-skel { animation: pod-pulse 1.5s ease-in-out infinite; border-radius: 8px; }
      `}</style>
      {/* Hero card skeleton */}
      <div style={{
        borderRadius: 20, padding: '28px 20px', marginBottom: 16,
        background: `linear-gradient(160deg, ${c}cc, ${c}99)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
      }}>
        <div className="pod-skel" style={{ height: 14, width: '30%', background: 'rgba(255,255,255,.3)' }} />
        <div className="pod-skel" style={{ height: 36, width: '85%', background: 'rgba(255,255,255,.4)' }} />
        <div className="pod-skel" style={{ height: 18, width: '55%', background: 'rgba(255,255,255,.25)' }} />
        <div className="pod-skel" style={{ height: 14, width: '70%', background: 'rgba(255,255,255,.2)' }} />
      </div>
      {/* Detail skeletons */}
      {[90, 70, 85, 60].map((w, i) => (
        <div key={i} className="pod-skel" style={{ height: 14, width: `${w}%`, background: 'var(--card-b)', marginBottom: 10 }} />
      ))}
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function PhraseOfDayScreen({ goBack, award }) {
  const { level: userLevel } = useStats();
  const isOnline = useOnlineStatus();

  const [selectedCategory, setSelectedCategory] = useState('greeting');
  const [phraseData, setPhraseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPracticeChat, setShowPracticeChat] = useState(false);
  const [chatHistory, setChatHistory] = useState([]); // {role:'maja'|'user', content:string}
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // Track award (hear it + cultural note read)
  const [heardIt, setHeardIt] = useState(false);
  const [readCultural, setReadCultural] = useState(false);
  const awardGiven = useRef(false);

  function checkAward(heard, cultural) {
    if (!awardGiven.current && (heard || cultural)) {
      awardGiven.current = true;
      award && award(5);
    }
  }

  const color = CATEGORY_COLORS[selectedCategory] || '#0e7490';
  const catLabel = CATEGORIES.find(c => c.id === selectedCategory)?.label || selectedCategory;

  const fetchPhrase = useCallback(async (category) => {
    setLoading(true);
    setError(null);
    setPhraseData(null);
    // Reset award state when loading new phrase
    setHeardIt(false);
    setReadCultural(false);
    awardGiven.current = false;

    if (!isOnline) {
      setPhraseData(SEED_PHRASES[category] || SEED_PHRASES.greeting);
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await apiFetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'phrase_of_day',
          messages: [{ role: 'user', content: `Generate ${category} phrase for ${today}` }],
          params: {
            category,
            level: userLevel || 'B1',
            seed: `${today}-${category}`,
          },
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // The backend returns parsed JSON directly for phrase_of_day mode
      // but currently phrase_of_day isn't a defined mode — handle both cases
      let parsed = null;
      if (data && typeof data === 'object' && data.phrase) {
        parsed = data;
      } else if (data && data.text) {
        try {
          parsed = JSON.parse(data.text);
        } catch {
          parsed = null;
        }
      }

      if (parsed && parsed.phrase) {
        setPhraseData(parsed);
      } else {
        throw new Error('Invalid phrase data from API');
      }
    } catch {
      // Fall back to seed data
      setError('Using curated phrase (AI unavailable)');
      setPhraseData(SEED_PHRASES[category] || SEED_PHRASES.greeting);
    } finally {
      setLoading(false);
    }
  }, [isOnline, userLevel]);

  useEffect(() => {
    fetchPhrase(selectedCategory);
  }, [selectedCategory, fetchPhrase]);

  async function handleHearIt() {
    if (playing || !phraseData) return;
    setPlaying(true);
    try {
      const res = await apiFetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: phraseData.phrase, slow: false, voice: getVoicePreference() }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const blob = await res.blob();
      // Use base64 data URL — blob: URLs fail silently on some Android OEM WebViews
      const url = await new Promise(resolve => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(blob); });
      const audio = new Audio(url);
      audio.onended = () => { setPlaying(false); };
      audio.onerror = () => { setPlaying(false); };
      await audio.play();
      if (!heardIt) {
        setHeardIt(true);
        checkAward(true, readCultural);
      }
    } catch {
      setPlaying(false);
    }
  }

  function handleCopyShare() {
    if (!phraseData) return;
    const text = `Croatian phrase: ${phraseData.phrase} = ${phraseData.translation} 🇭🇷 #NašaHrvatska`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  function handleReadCultural() {
    if (!readCultural) {
      setReadCultural(true);
      checkAward(heardIt, true);
    }
  }

  // ── Inline phrase practice chat ───────────────────────────────────────────
  async function openPracticeChat() {
    if (!phraseData) return;
    setShowPracticeChat(p => {
      if (p) return false; // toggle off
      return true;
    });
    if (showPracticeChat) return;
    // Reset chat and kick off first turn from Maja
    setChatHistory([]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await apiFetch('/api/maja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Hajde, vježbajmo frazu: "${phraseData.phrase}" (${phraseData.translation}). Koristi je prirodno u razgovoru sa mnom.`,
          history: [],
          session: { count: 0, nextTopic: `Practice phrase: ${phraseData.phrase}` },
          userLevel: userLevel || 'B1',
          isSessionStart: false,
          persona: 'teacher',
        }),
      });
      if (!res.ok) throw new Error('api_error');
      const data = await res.json();
      const reply = data.reply || 'Bok! Hajde vježbati!';
      setChatHistory([{ role: 'maja', content: reply }]);
    } catch {
      setChatHistory([{ role: 'maja', content: `Hajde vježbati! Pokušaj upotrijebiti frazu: "${phraseData.phrase}" u rečenici.` }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatInputRef.current?.focus(), 100);
    }
  }

  async function sendChatMessage() {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    const newHistory = [...chatHistory, { role: 'user', content: msg }];
    setChatHistory(newHistory);
    setChatInput('');
    setChatLoading(true);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    try {
      const res = await apiFetch('/api/maja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: newHistory.slice(0, -1), // history without the just-added user msg
          session: { count: 1 },
          userLevel: userLevel || 'B1',
          isSessionStart: false,
          persona: 'teacher',
        }),
      });
      if (!res.ok) throw new Error('api_error');
      const data = await res.json();
      const reply = data.reply || 'Bravo! Nastavi!';
      setChatHistory(h => [...h, { role: 'maja', content: reply }]);
    } catch {
      setChatHistory(h => [...h, { role: 'maja', content: 'Oprosti, nešto je pošlo po krivu. Pokušaj opet!' }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }

  return (
    <div className="scr-wrap">
      {H('🗓️ Fraza Dana', 'Daily Croatian phrase with cultural context', goBack)}

      {/* Category selector — horizontally scrollable */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 20,
        scrollbarWidth: 'none', msOverflowStyle: 'none',
      }}>
        {CATEGORIES.map(cat => {
          const catColor = CATEGORY_COLORS[cat.id];
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                flexShrink: 0, padding: '7px 14px', borderRadius: 20,
                cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 700,
                background: active ? catColor : 'var(--card)',
                color: active ? '#fff' : 'var(--subtext)',
                border: `1.5px solid ${active ? catColor : 'var(--card-b)'}`,
                transition: 'all .18s',
                boxShadow: active ? `0 2px 8px ${catColor}44` : 'none',
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Offline banner */}
      {!isOnline && (
        <div style={{
          background: 'var(--error-bg)', border: '1px solid var(--error-b)',
          borderRadius: 12, padding: '9px 14px', marginBottom: 14,
          fontSize: 12, color: 'var(--error)', fontWeight: 600,
        }}>
          📴 Offline — showing curated phrase
        </div>
      )}

      {/* Loading skeleton */}
      {loading && <PhraseSkeletonLoader color={color} />}

      {/* Phrase content */}
      {!loading && phraseData && (
        <>
          {/* ── HERO CARD ─────────────────────────────────────────────────── */}
          <div style={{
            borderRadius: 20, marginBottom: 18, overflow: 'hidden',
            boxShadow: `0 8px 32px ${color}33`,
          }}>
            {/* Hero background */}
            <div style={{
              padding: '28px 22px 24px',
              background: `linear-gradient(160deg, ${color}ee 0%, ${color}bb 100%)`,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              textAlign: 'center', gap: 0,
            }}>
              {/* Category label */}
              <div style={{
                fontSize: 11, fontWeight: 800, letterSpacing: '.08em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,.75)',
                marginBottom: 14,
              }}>
                {catLabel}
              </div>

              {/* THE PHRASE — centerpiece */}
              <div style={{
                fontSize: 30, fontWeight: 900, color: '#fff', lineHeight: 1.25,
                fontFamily: "'Playfair Display',serif",
                textShadow: '0 2px 12px rgba(0,0,0,.2)',
                marginBottom: 16, letterSpacing: '-.01em',
              }}>
                {phraseData.phrase}
              </div>

              {/* Pronunciation guide */}
              {phraseData.pronunciation_guide && (
                <div style={{
                  fontSize: 15, color: 'rgba(255,255,255,.85)',
                  fontFamily: "'Courier New',Courier,monospace",
                  letterSpacing: '.06em', marginBottom: 16,
                  background: 'rgba(0,0,0,.15)', borderRadius: 8,
                  padding: '4px 12px',
                }}>
                  /{phraseData.pronunciation_guide}/
                </div>
              )}

              {/* Natural English translation */}
              <div style={{
                fontSize: 19, fontWeight: 600, color: 'rgba(255,255,255,.95)',
                marginBottom: phraseData.literal ? 8 : 0, lineHeight: 1.3,
              }}>
                "{phraseData.translation}"
              </div>

              {/* Literal translation (if different) */}
              {phraseData.literal && phraseData.literal !== phraseData.translation && (
                <div style={{
                  fontSize: 12, color: 'rgba(255,255,255,.65)',
                  fontStyle: 'italic', marginTop: 2,
                }}>
                  Literally: "{phraseData.literal}"
                </div>
              )}
            </div>

            {/* Action buttons in hero footer */}
            <div style={{
              display: 'flex', gap: 0,
              background: `${color}22`, borderTop: `1px solid ${color}33`,
            }}>
              <button
                onClick={handleHearIt}
                disabled={playing}
                style={{
                  flex: 1, padding: '13px 8px', border: 'none', cursor: playing ? 'default' : 'pointer',
                  background: 'transparent', color: playing ? 'var(--subtext)' : color,
                  fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 800,
                  borderRight: `1px solid ${color}22`, transition: 'background .15s',
                }}
              >
                {playing ? <><span aria-hidden="true">⏸</span>{' Playing...'}</> : <><span aria-hidden="true">🔊</span>{' Hear it'}</>}
              </button>
              <button
                onClick={() => fetchPhrase(selectedCategory)}
                disabled={loading}
                style={{
                  flex: 1, padding: '13px 8px', border: 'none', cursor: 'pointer',
                  background: 'transparent', color,
                  fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 800,
                  borderRight: `1px solid ${color}22`, transition: 'background .15s',
                }}
              >
                🔄 New Phrase
              </button>
              <button
                onClick={handleCopyShare}
                style={{
                  flex: 1, padding: '13px 8px', border: 'none', cursor: 'pointer',
                  background: 'transparent', color: copied ? '#16a34a' : color,
                  fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 800,
                  transition: 'color .2s',
                }}
              >
                {copied ? '✅ Copied!' : '📤 Share'}
              </button>
            </div>
          </div>

          {/* ── PHRASE DETAILS ────────────────────────────────────────────── */}

          {/* When to use */}
          {phraseData.when_to_use && (
            <div style={{
              background: 'var(--card)', border: '1px solid var(--card-b)',
              borderRadius: 14, padding: '14px 16px', marginBottom: 12,
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--subtext)', marginBottom: 6 }}>
                📌 WHEN TO USE
              </div>
              <div style={{ fontSize: 13, color: 'var(--heading)', lineHeight: 1.65 }}>
                {phraseData.when_to_use}
              </div>
            </div>
          )}

          {/* Cultural note — amber/gold tone, triggers award */}
          {phraseData.cultural_note && (
            <div
              onClick={handleReadCultural}
              style={{
                background: 'linear-gradient(135deg,rgba(180,83,9,.08),rgba(202,138,4,.06))',
                border: '1.5px solid rgba(180,83,9,.22)',
                borderRadius: 14, padding: '14px 16px', marginBottom: 12, cursor: 'default',
              }}
            >
              <div style={{
                fontSize: 12, fontWeight: 800, letterSpacing: '.04em',
                color: '#92400e', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span>🏛️</span> CULTURAL NOTE
              </div>
              <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.7 }}>
                {phraseData.cultural_note}
              </div>
            </div>
          )}

          {/* Example dialogue */}
          {phraseData.example_dialogue && phraseData.example_dialogue.length > 0 && (
            <div style={{
              background: 'var(--card)', border: '1px solid var(--card-b)',
              borderRadius: 14, padding: '14px 16px', marginBottom: 12,
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--subtext)', marginBottom: 10 }}>
                💬 EXAMPLE DIALOGUE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {phraseData.example_dialogue.map((turn, i) => {
                  const isA = i % 2 === 0;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      flexDirection: isA ? 'row' : 'row-reverse',
                    }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        background: isA ? color : 'var(--card-b)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 800, color: isA ? '#fff' : 'var(--subtext)',
                      }}>
                        {turn.speaker || (isA ? 'A' : 'B')}
                      </div>
                      <div style={{
                        background: isA ? `${color}11` : 'var(--card)',
                        border: `1px solid ${isA ? color + '33' : 'var(--card-b)'}`,
                        borderRadius: 12, padding: '8px 12px', flex: 1, maxWidth: '85%',
                        fontSize: 13, color: 'var(--heading)', lineHeight: 1.5,
                      }}>
                        {turn.line}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Word by word breakdown */}
          {phraseData.word_breakdown && phraseData.word_breakdown.length > 0 && (
            <div style={{
              background: 'var(--card)', border: '1px solid var(--card-b)',
              borderRadius: 14, padding: '14px 16px', marginBottom: 12, overflow: 'hidden',
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--subtext)', marginBottom: 10 }}>
                🔤 WORD BY WORD
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--card-b)' }}>
                      {['Word', 'Meaning', 'Grammar note'].map(h => (
                        <th key={h} style={{
                          padding: '6px 10px', textAlign: 'left', fontWeight: 800,
                          color: 'var(--subtext)', fontSize: 11, letterSpacing: '.04em',
                          textTransform: 'uppercase',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {phraseData.word_breakdown.map((row, i) => (
                      <tr key={i} style={{
                        borderBottom: i < phraseData.word_breakdown.length - 1 ? '1px solid var(--card-b)' : 'none',
                      }}>
                        <td style={{ padding: '8px 10px', fontWeight: 800, color: color }}>
                          {row.word}
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--heading)', fontWeight: 600 }}>
                          {row.meaning}
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--subtext)', fontStyle: 'italic' }}>
                          {row.note}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Related phrases */}
          {phraseData.related_phrases && phraseData.related_phrases.length > 0 && (
            <div style={{
              background: 'var(--card)', border: '1px solid var(--card-b)',
              borderRadius: 14, padding: '14px 16px', marginBottom: 12,
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--subtext)', marginBottom: 10 }}>
                🔗 RELATED PHRASES
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {phraseData.related_phrases.map((phrase, i) => (
                  <div key={i} style={{
                    padding: '5px 12px', borderRadius: 20,
                    background: `${color}11`, border: `1px solid ${color}33`,
                    fontSize: 12, fontWeight: 700, color,
                  }}>
                    {phrase}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Practice It — inline Maja chat */}
          <div style={{ marginBottom: 20 }}>
            <button
              onClick={openPracticeChat}
              style={{
                width: '100%', padding: '14px', borderRadius: 14, border: `1.5px solid ${color}44`,
                background: showPracticeChat ? `${color}22` : `${color}0d`, color,
                fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 800,
                cursor: 'pointer', transition: 'all .2s',
              }}
            >
              💬 {showPracticeChat ? 'Close Practice' : 'Practice It with Maja'}
            </button>

            {showPracticeChat && (
              <div style={{
                marginTop: 8, borderRadius: 14, overflow: 'hidden',
                border: `1.5px solid ${color}33`,
                background: 'var(--card)',
              }}>
                {/* Chat header */}
                <div style={{
                  padding: '10px 14px', background: `${color}11`,
                  borderBottom: `1px solid ${color}22`,
                  fontSize: 12, fontWeight: 700, color,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span>🤖</span>
                  <span>Maja · Practice: "{phraseData.phrase}"</span>
                </div>

                {/* Messages */}
                <div style={{
                  maxHeight: 280, overflowY: 'auto', padding: '12px 12px 4px',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  {chatHistory.map((msg, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}>
                      <div style={{
                        maxWidth: '82%', padding: '8px 12px', borderRadius: 12,
                        fontSize: 13, lineHeight: 1.55, fontWeight: 500,
                        background: msg.role === 'user' ? color : 'var(--bar-bg)',
                        color: msg.role === 'user' ? '#fff' : 'var(--heading)',
                        borderBottomRightRadius: msg.role === 'user' ? 3 : 12,
                        borderBottomLeftRadius: msg.role === 'maja' ? 3 : 12,
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{ display: 'flex', gap: 4, padding: '4px 0 8px' }}>
                      {[0,1,2].map(i => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: color, opacity: 0.5, animation: `dot-bounce 1.2s ease-in-out ${i*0.15}s infinite` }} />
                      ))}
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input row */}
                <div style={{
                  padding: '8px 10px', borderTop: `1px solid ${color}22`,
                  display: 'flex', gap: 6, alignItems: 'center',
                }}>
                  <input
                    ref={chatInputRef}
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                    placeholder="Odgovori Maji…"
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: 10, fontSize: 13,
                      border: `1.5px solid ${color}33`, background: 'var(--bar-bg)',
                      color: 'var(--heading)', fontFamily: "'Outfit',sans-serif",
                      outline: 'none',
                    }}
                    disabled={chatLoading}
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={chatLoading || !chatInput.trim()}
                    style={{
                      padding: '9px 14px', borderRadius: 10, border: 'none',
                      background: chatInput.trim() ? color : 'var(--bar-bg)',
                      color: chatInput.trim() ? '#fff' : 'var(--subtext)',
                      fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 800,
                      cursor: chatInput.trim() ? 'pointer' : 'default',
                      transition: 'background .15s, color .15s',
                    }}
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error notice (soft) */}
          {error && (
            <div style={{
              textAlign: 'center', fontSize: 11, color: 'var(--subtext)',
              marginBottom: 10, fontStyle: 'italic',
            }}>
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
}
