import React, { useState, useRef, useEffect, useCallback } from 'react';
import { H } from '../../data.jsx';

// ─────────────────────────────────────────────
// KEYFRAME STYLES
// ─────────────────────────────────────────────
const SPRINT_STYLES = `
@keyframes sprint-pulse {
  0%   { transform: scale(1);   opacity: 0.7; }
  100% { transform: scale(2.2); opacity: 0;   }
}
@keyframes sprint-rec-dot {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}
@keyframes sprint-countdown {
  0%   { transform: scale(0.6); opacity: 0; }
  30%  { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1);   opacity: 1; }
}
`;

// ─────────────────────────────────────────────
// SPEAKING PROMPTS — 40 across CEFR levels
// ─────────────────────────────────────────────
const PROMPTS = {
  A1: [
    { hr: 'Kako se zoveš?', en: 'What is your name?', model_response: 'Zovem se Ana. A ti?' },
    { hr: 'Odakle si?', en: 'Where are you from?', model_response: 'Ja sam iz Splita. A ti, odakle si?' },
    { hr: 'Koliko imaš godina?', en: 'How old are you?', model_response: 'Imam trideset godina. A ti?' },
    { hr: 'Što radiš?', en: 'What do you do?', model_response: 'Ja sam učiteljica. A ti, što radiš?' },
    { hr: 'Govoriš li hrvatski?', en: 'Do you speak Croatian?', model_response: 'Da, govorim hrvatski. Učim ga svaki dan.' },
    { hr: 'Sviđa ti se Hrvatska?', en: 'Do you like Croatia?', model_response: 'Da, jako mi se sviđa! Hrvatska je prekrasna zemlja.' },
    { hr: 'Što voliš jesti?', en: 'What do you like to eat?', model_response: 'Volim janjetinu i dagnje. A ti, što voliš?' },
    { hr: 'Imaš li kućnog ljubimca?', en: 'Do you have a pet?', model_response: 'Da, imam psa. Zove se Bruno.' },
  ],
  A2: [
    { hr: 'Opiši svoju obitelj.', en: 'Describe your family.', model_response: 'Imam malu obitelj. Živim s roditeljima i sestrom. Tata radi kao inženjer, a mama je liječnica.' },
    { hr: 'Što si radio/radila jučer?', en: 'What did you do yesterday?', model_response: 'Jučer sam išla na tržnicu ujutro, a poslijepodne sam čitala knjigu i pila kavu s prijateljicom.' },
    { hr: 'Opiši svoju kuću ili stan.', en: 'Describe your house or apartment.', model_response: 'Živim u malom stanu u centru grada. Imam dnevni boravak, jednu spavaću sobu i malu kuhinju.' },
    { hr: 'Što planiraš raditi ovog vikenda?', en: 'What are you planning to do this weekend?', model_response: 'Ovaj vikend idem u Dubrovnik s prijateljima. Planiram posjetiti stari grad i pojesti dobru ribu.' },
    { hr: 'Koji je tvoj omiljeni film?', en: 'What is your favourite film?', model_response: 'Moj omiljeni film je "Tko pjeva zlo ne misli". To je stara hrvatska komedija, jako smiješna.' },
    { hr: 'Pričaj mi o svom gradu.', en: 'Tell me about your city.', model_response: 'Živim u Zagrebu. To je glavni grad Hrvatske. Ima lijepe parkove, muzeje i odličnu kafićsku kulturu.' },
    { hr: 'Kako provodiš slobodno vrijeme?', en: 'How do you spend your free time?', model_response: 'U slobodno vrijeme volim čitati, šetati po gradu i kuhati. Ponekad idem na koncerte.' },
    { hr: 'Što misliš o učenju stranih jezika?', en: 'What do you think about learning foreign languages?', model_response: 'Mislim da je učenje stranih jezika jako korisno. Otvara vrata novim kulturama i prijateljstvima.' },
  ],
  B1: [
    { hr: 'Zašto učiš hrvatski?', en: 'Why are you learning Croatian?', model_response: 'Učim hrvatski jer imam prijatelje iz Hrvatske i želim bolje razumjeti njihovu kulturu i humor. Jezik je ključ za pravo razumijevanje naroda.' },
    { hr: 'Opiši najljepše putovanje u svom životu.', en: 'Describe the most beautiful trip of your life.', model_response: 'Najljepše putovanje u mom životu bilo je na Plitvička jezera. Boje vode — od smaragdno zelene do turkizno plave — jednostavno su nevjerojatne.' },
    { hr: 'Što misliš o modernoj tehnologiji?', en: 'What do you think about modern technology?', model_response: 'Moderna tehnologija ima i prednosti i mana. S jedne strane, olakšava komunikaciju i pristup informacijama. S druge strane, previše vremena provodimo ispred zaslona.' },
    { hr: 'Kakav bi bio tvoj idealan dan?', en: 'What would your ideal day look like?', model_response: 'Idealan dan bi počeo s kavom na terasi s pogledom na more. Potom bih plivao, ručao svježu ribu, a večer proveo s dobrim prijateljima uz gitaru.' },
    { hr: 'Što ti znači dom?', en: 'What does home mean to you?', model_response: 'Dom mi znači mjesto gdje se osjećam sigurno i opušteno. Nije nužno fizičko mjesto — može biti i s određenim ljudima.' },
    { hr: 'Kakva je razlika između prijatelja i poznanika?', en: 'What is the difference between a friend and an acquaintance?', model_response: 'Poznanik je netko koga poznaješ, ali s kim nemaš duboku vezu. Pravi prijatelj je onaj koji te prihvaća takva kakav jesi i uz tebe je u dobrim i lošim trenucima.' },
  ],
  B2: [
    { hr: 'Što misliš o klimatskim promjenama i odgovornosti pojedinca?', en: 'What do you think about climate change and individual responsibility?', model_response: 'Klimatske promjene su jedan od najvećih izazova našeg vremena. Mislim da svaki pojedinac mora preuzeti odgovornost — od smanjenja potrošnje plastike do svjesnijeg putovanja. Ali bez sustavnih promjena od strane vlada i korporacija, individualni napori nisu dovoljni.' },
    { hr: 'Kako bi opisao/opisala hrvatsku kulturu nekome tko nikad nije bio u Hrvatskoj?', en: 'How would you describe Croatian culture to someone who has never been to Croatia?', model_response: 'Hrvatska je zemlja kontrasta — između kontinentalne tradicije i mediteranskog načina života, između burne povijesti i opuštene sadašnjosti. Hrvati su ponosni na svoju kulturu, goste dočekuju s toplinom, a kava uz razgovor je gotovo sveta institucija.' },
    { hr: 'Raspravi o prednostima i nedostacima urbanog i ruralnog života.', en: 'Discuss the advantages and disadvantages of urban and rural life.', model_response: 'Urbani život nudi raznolikost — posao, kulturu, anonimnost. Ali nosi i stres, buku i otuđenost. Ruralni život je mirniji, s jačim zajedništvom, ali ograničenijim prilikama. Idealno bi bilo kombinirati oboje — živjeti u prirodi, a imati pristup gradskim sadržajima.' },
  ],
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const SR_SUPPORTED =
  typeof window !== 'undefined' &&
  !!(window.SpeechRecognition || window.webkitSpeechRecognition);

function pickPrompt() {
  const level = localStorage.getItem('nh_level') || 'B1';
  const levelKey = ['A1', 'A2', 'B1', 'B2'].includes(level) ? level : 'B1';
  const pool = PROMPTS[levelKey] || PROMPTS.B1;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getUserLevel() {
  const level = localStorage.getItem('nh_level') || 'B1';
  return ['A1', 'A2', 'B1', 'B2'].includes(level) ? level : 'B1';
}

function computeFeedback(userSaid, modelResponse) {
  const clean = s => s.toLowerCase().replace(/[.,?!;:'"—–-]/g, '').split(/\s+/).filter(Boolean);
  const userWords = new Set(clean(userSaid));
  const modelWords = clean(modelResponse);
  if (modelWords.length === 0) return { grade: 'skip', overlap: 0, missing: [] };

  const shared = modelWords.filter(w => userWords.has(w));
  const overlap = shared.length / modelWords.length;
  const missing = modelWords.filter(w => !userWords.has(w)).slice(0, 3);
  let grade = 'low';
  if (overlap > 0.6) grade = 'high';
  else if (overlap > 0.3) grade = 'mid';
  return { grade, overlap, missing };
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function SpeakingSprintScreen({ goBack, award }) {
  const [phase, setPhase] = useState('setup');
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [userTranscript, setUserTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [rounds, setRounds] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [isRecording, setIsRecording] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsError, setTtsError] = useState('');
  const [micDenied, setMicDenied] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');

  const recRef = useRef(null);
  const finishFired = useRef(false);
  const silenceTimerRef = useRef(null);
  const transcriptRef = useRef('');
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const phaseRef = useRef('setup');

  // Keep phaseRef in sync
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Inject keyframe styles once
  useEffect(() => {
    const id = 'sprint-styles';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = SPRINT_STYLES;
      document.head.appendChild(style);
    }
    return () => {
      stopMic();
      clearTimeout(silenceTimerRef.current);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (audioUrlRef.current) { URL.revokeObjectURL(audioUrlRef.current); audioUrlRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Countdown phase ─────────────────────────
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      const prompt = pickPrompt();
      setCurrentPrompt(prompt);
      setUserTranscript('');
      setLiveTranscript('');
      setTextInput('');
      setMicDenied(false);
      setPhase('speaking');
      startListening();
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, countdown]);

  // ── Stop mic ────────────────────────────────
  function stopMic() {
    clearTimeout(silenceTimerRef.current);
    setIsRecording(false);
    if (recRef.current) {
      try { recRef.current.stop(); } catch { /* already stopped */ }
      recRef.current = null;
    }
  }

  // ── Start listening ─────────────────────────
  function startListening() {
    transcriptRef.current = '';
    setLiveTranscript('');
    setIsRecording(true);

    if (!SR_SUPPORTED) return; // fallback text input shown instead

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRec();
    rec.lang = 'hr-HR';
    rec.interimResults = true;
    rec.continuous = true;
    recRef.current = rec;

    const resetSilence = () => {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        const captured = transcriptRef.current.trim();
        if (captured.length > 1 && phaseRef.current === 'speaking') {
          stopMic();
          handleUserDone(captured);
        }
      }, 3000);
    };

    rec.onresult = (e) => {
      let full = '';
      for (let i = 0; i < e.results.length; i++) {
        full += e.results[i][0].transcript;
      }
      transcriptRef.current = full;
      setLiveTranscript(full);
      resetSilence();
    };

    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'permission-denied') {
        setMicDenied(true);
      }
      setIsRecording(false);
    };

    rec.onend = () => {
      if (phaseRef.current === 'speaking' && transcriptRef.current.trim().length > 1) {
        stopMic();
        handleUserDone(transcriptRef.current.trim());
      } else {
        setIsRecording(false);
      }
    };

    try { rec.start(); } catch { /* already started */ }
  }

  // ── User done speaking ───────────────────────
  function handleUserDone(transcript) {
    const finalText = transcript || textInput || '';
    setUserTranscript(finalText);
    setPhase('model');
    loadTTS(currentPrompt.model_response);
  }

  // ── Load TTS audio ──────────────────────────
  async function loadTTS(text) {
    setTtsLoading(true);
    setTtsError('');
    setAudioUrl(null);

    // Revoke previous URL
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, slow: false }),
      });
      if (!res.ok) throw new Error(`TTS ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      setAudioUrl(url);
      // Auto-play
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play().catch(() => {});
    } catch (err) {
      setTtsError('Could not load audio. Check your connection and try again.');
    } finally {
      setTtsLoading(false);
    }
  }

  // ── Start a round ───────────────────────────
  function startRound() {
    stopMic();
    setCountdown(3);
    setPhase('countdown');
  }

  // ── Next round from feedback ─────────────────
  function nextRound() {
    setRounds(r => r + 1);
    const prompt = pickPrompt();
    setCurrentPrompt(prompt);
    setUserTranscript('');
    setLiveTranscript('');
    setTextInput('');
    setMicDenied(false);
    setTtsError('');
    setAudioUrl(null);
    setPhase('speaking');
    startListening();
  }

  // ── Done / exit ──────────────────────────────
  function handleDone() {
    stopMic();
    if (!finishFired.current) {
      finishFired.current = true;
      const totalRounds = rounds + (phase === 'feedback' ? 1 : 0);
      if (award && totalRounds > 0) award(totalRounds * 5);
    }
    goBack();
  }

  const level = getUserLevel();

  // ════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════

  // ── Setup phase ──────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="scr-wrap" style={{ padding: '0 16px 32px', maxWidth: 600, margin: '0 auto' }}>
        {H('🎤 Speaking Sprint', 'Listen · Speak · Compare')}

        {/* Level pill */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{
            display: 'inline-block', padding: '4px 14px', borderRadius: 20,
            background: 'rgba(217,119,6,.12)', border: '1px solid rgba(217,119,6,.3)',
            color: '#d97706', fontSize: 13, fontWeight: 700, letterSpacing: 0.5,
          }}>
            Level: {level}
          </span>
        </div>

        {/* How it works */}
        <div style={{
          background: 'var(--card-bg, #f8fafc)', border: '1px solid var(--border, #e2e8f0)',
          borderRadius: 16, padding: '20px 24px', marginBottom: 28,
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--subtext)' }}>
            HOW IT WORKS
          </p>
          {[
            { num: '1', label: 'Hear the prompt', sub: 'A Croatian question or topic appears on screen' },
            { num: '2', label: 'Speak your answer', sub: 'Respond in Croatian — we transcribe your speech live' },
            { num: '3', label: 'Compare with a native', sub: 'Hear an ElevenLabs model response and compare' },
          ].map(step => (
            <div key={step.num} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #d4002d, #e63946)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 14, fontWeight: 800,
              }}>
                {step.num}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{step.label}</div>
                <div style={{ fontSize: 13, color: 'var(--subtext)', marginTop: 2 }}>{step.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* XP note */}
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--subtext)', marginBottom: 24 }}>
          +5 XP per round completed
        </p>

        <button
          onClick={startRound}
          style={{
            display: 'block', width: '100%', padding: '16px 0',
            background: 'linear-gradient(135deg, #d4002d, #e63946)',
            color: '#fff', border: 'none', borderRadius: 14,
            fontSize: 18, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.3,
          }}
        >
          Start Sprint →
        </button>

        <button
          onClick={goBack}
          style={{ display: 'block', width: '100%', marginTop: 12, padding: '12px 0',
            background: 'transparent', border: 'none', color: 'var(--subtext)',
            fontSize: 15, cursor: 'pointer' }}
        >
          ← Back
        </button>
      </div>
    );
  }

  // ── Countdown phase ──────────────────────────
  if (phase === 'countdown') {
    return (
      <div className="scr-wrap" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '60vh',
      }}>
        <div style={{
          fontSize: 100, fontWeight: 900, color: '#d4002d',
          animation: 'sprint-countdown 0.5s ease-out',
          key: countdown,
        }}>
          {countdown}
        </div>
        <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--subtext)', marginTop: 16 }}>
          Pripremi se!
        </p>
      </div>
    );
  }

  // ── Speaking phase ───────────────────────────
  if (phase === 'speaking' && currentPrompt) {
    return (
      <div className="scr-wrap" style={{ padding: '0 16px 32px', maxWidth: 600, margin: '0 auto' }}>
        {/* Round indicator */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--subtext)', fontWeight: 600 }}>
            ROUND {rounds + 1} · {level}
          </span>
        </div>

        {/* Croatian prompt */}
        <div style={{
          background: 'var(--card-bg, #f8fafc)', border: '1px solid var(--border, #e2e8f0)',
          borderRadius: 16, padding: '28px 24px', marginBottom: 12, textAlign: 'center',
        }}>
          <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: 0, lineHeight: 1.3 }}>
            {currentPrompt.hr}
          </p>
          <p style={{ fontSize: 14, color: 'var(--subtext)', marginTop: 10, marginBottom: 0 }}>
            {currentPrompt.en}
          </p>
        </div>

        {/* Recording indicator / mic denied fallback / no SR fallback */}
        {(micDenied || !SR_SUPPORTED) ? (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#d97706', marginBottom: 10, textAlign: 'center' }}>
              {micDenied
                ? 'Microphone access denied — type your response instead:'
                : 'Speech recognition not available — type your response:'}
            </p>
            <textarea
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Napišite odgovor ovdje... (Type your Croatian response)"
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '12px 14px',
                borderRadius: 10, border: '1px solid var(--border, #e2e8f0)',
                fontSize: 15, fontFamily: 'inherit', resize: 'vertical',
                background: 'var(--card-bg)', color: 'var(--text)',
              }}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
            {/* Pulsing red dot */}
            <div style={{ position: 'relative', width: 64, height: 64, marginBottom: 10 }}>
              {isRecording && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  border: '2px solid rgba(212,0,45,0.5)',
                  animation: 'sprint-pulse 1.4s ease-out infinite',
                }} />
              )}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 36, height: 36, borderRadius: '50%',
                background: isRecording ? '#d4002d' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: isRecording ? 'sprint-rec-dot 1s ease-in-out infinite' : 'none',
              }}>
                <span style={{ fontSize: 16 }}>🎤</span>
              </div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: isRecording ? '#d4002d' : 'var(--subtext)' }}>
              {isRecording ? 'Recording… speak now' : 'Tap "Start Recording" to begin'}
            </span>
            {!isRecording && (
              <button
                onClick={startListening}
                style={{
                  marginTop: 10, padding: '10px 24px', borderRadius: 10,
                  background: '#d4002d', color: '#fff', border: 'none',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Start Recording
              </button>
            )}
          </div>
        )}

        {/* Live transcript */}
        {liveTranscript && (
          <div style={{
            background: 'rgba(14,116,144,.07)', border: '1px solid rgba(14,116,144,.2)',
            borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 15,
            color: 'var(--text)', fontStyle: 'italic',
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0e7490', display: 'block', marginBottom: 4 }}>
              YOU'RE SAYING:
            </span>
            {liveTranscript}
          </div>
        )}

        {/* Done button */}
        <button
          onClick={() => { stopMic(); handleUserDone(transcriptRef.current || textInput); }}
          style={{
            display: 'block', width: '100%', padding: '14px 0',
            background: 'linear-gradient(135deg, #0e7490, #0891b2)',
            color: '#fff', border: 'none', borderRadius: 12,
            fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 10,
          }}
        >
          Done speaking →
        </button>

        <button
          onClick={() => { stopMic(); setUserTranscript(''); setPhase('model'); loadTTS(currentPrompt.model_response); }}
          style={{
            display: 'block', width: '100%', padding: '10px 0',
            background: 'transparent', border: 'none', color: 'var(--subtext)',
            fontSize: 14, cursor: 'pointer',
          }}
        >
          Skip →
        </button>
      </div>
    );
  }

  // ── Model phase (native playback) ────────────
  if (phase === 'model' && currentPrompt) {
    return (
      <div className="scr-wrap" style={{ padding: '0 16px 32px', maxWidth: 600, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--subtext)', fontWeight: 600, marginBottom: 4 }}>
            NOW HEAR A NATIVE RESPONSE
          </p>
          <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            {currentPrompt.hr}
          </p>
        </div>

        {/* Model response text */}
        <div style={{
          background: 'rgba(22,163,74,.07)', border: '1px solid rgba(22,163,74,.2)',
          borderRadius: 14, padding: '20px 20px', marginBottom: 20, textAlign: 'center',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', display: 'block', marginBottom: 8 }}>
            NATIVE RESPONSE
          </span>
          <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', margin: 0, lineHeight: 1.5 }}>
            {currentPrompt.model_response}
          </p>
        </div>

        {/* Audio controls */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          {ttsLoading ? (
            <p style={{ color: 'var(--subtext)', fontSize: 14 }}>Loading audio…</p>
          ) : ttsError ? (
            <p style={{ color: '#dc2626', fontSize: 13 }}>{ttsError}</p>
          ) : audioUrl ? (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => { if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); } else { const a = new Audio(audioUrl); audioRef.current = a; a.play().catch(() => {}); } }}
                style={{
                  padding: '10px 22px', borderRadius: 10, border: '1px solid rgba(22,163,74,.3)',
                  background: 'rgba(22,163,74,.1)', color: '#16a34a', fontSize: 14,
                  fontWeight: 700, cursor: 'pointer',
                }}
              >
                ▶ Play again
              </button>
              <button
                onClick={() => { if (audioRef.current) { audioRef.current.pause(); } }}
                style={{
                  padding: '10px 18px', borderRadius: 10, border: '1px solid var(--border)',
                  background: 'var(--card-bg)', color: 'var(--subtext)', fontSize: 14, cursor: 'pointer',
                }}
              >
                ⏸ Pause
              </button>
            </div>
          ) : null}
        </div>

        {/* User's response */}
        {userTranscript && (
          <div style={{
            background: 'rgba(14,116,144,.07)', border: '1px solid rgba(14,116,144,.2)',
            borderRadius: 14, padding: '16px 20px', marginBottom: 20,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0e7490', display: 'block', marginBottom: 6 }}>
              YOU SAID:
            </span>
            <p style={{ fontSize: 15, margin: 0, color: 'var(--text)', fontStyle: 'italic' }}>
              {userTranscript}
            </p>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--subtext)', marginBottom: 20 }}>
          Compare your response with the native speaker above, then get AI feedback below.
        </p>

        <button
          onClick={() => setPhase('feedback')}
          style={{
            display: 'block', width: '100%', padding: '14px 0',
            background: 'linear-gradient(135deg, #d4002d, #e63946)',
            color: '#fff', border: 'none', borderRadius: 12,
            fontSize: 16, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Get AI Feedback →
        </button>
      </div>
    );
  }

  // ── Feedback phase ───────────────────────────
  if (phase === 'feedback' && currentPrompt) {
    const { grade, missing } = computeFeedback(userTranscript, currentPrompt.model_response);
    const keyPhrase = currentPrompt.model_response.split(/\s+/).slice(0, 5).join(' ');

    const gradeConfig = {
      high: { emoji: '🌟', title: 'Izvrsno!', sub: 'Your response covered the key content.', color: '#16a34a', bg: 'rgba(22,163,74,.07)', border: 'rgba(22,163,74,.2)' },
      mid:  { emoji: '👍', title: 'Dobro!',   sub: 'You got the main idea across.', color: '#d97706', bg: 'rgba(217,119,6,.07)', border: 'rgba(217,119,6,.2)' },
      low:  { emoji: '💪', title: 'Pokušaj ponovo!', sub: `Try to use more of these key words: ${missing.join(', ') || '—'}`, color: '#dc2626', bg: 'rgba(220,38,38,.07)', border: 'rgba(220,38,38,.2)' },
      skip: { emoji: '⏭️', title: 'Skipped', sub: 'No response recorded — listen and try next time!', color: 'var(--subtext)', bg: 'var(--card-bg)', border: 'var(--border)' },
    };
    const cfg = gradeConfig[grade] || gradeConfig.skip;

    return (
      <div className="scr-wrap" style={{ padding: '0 16px 32px', maxWidth: 600, margin: '0 auto' }}>
        {/* Grade banner */}
        <div style={{
          background: cfg.bg, border: `1px solid ${cfg.border}`,
          borderRadius: 16, padding: '20px 24px', marginBottom: 20, textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>{cfg.emoji}</div>
          <p style={{ fontSize: 22, fontWeight: 800, color: cfg.color, margin: '0 0 6px' }}>{cfg.title}</p>
          <p style={{ fontSize: 14, color: 'var(--subtext)', margin: 0 }}>{cfg.sub}</p>
        </div>

        {/* XP badge */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span style={{
            display: 'inline-block', padding: '6px 18px', borderRadius: 20,
            background: 'rgba(124,58,237,.1)', border: '1px solid rgba(124,58,237,.25)',
            color: '#7c3aed', fontSize: 15, fontWeight: 800,
          }}>
            +5 XP earned
          </span>
        </div>

        {/* Model response */}
        <div style={{
          background: 'rgba(22,163,74,.07)', border: '1px solid rgba(22,163,74,.2)',
          borderRadius: 12, padding: '14px 18px', marginBottom: 14,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', display: 'block', marginBottom: 6 }}>
            NATIVE RESPONSE
          </span>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--text)', lineHeight: 1.5 }}>
            {currentPrompt.model_response}
          </p>
        </div>

        {/* User's response */}
        {userTranscript ? (
          <div style={{
            background: 'rgba(14,116,144,.07)', border: '1px solid rgba(14,116,144,.2)',
            borderRadius: 12, padding: '14px 18px', marginBottom: 14,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0e7490', display: 'block', marginBottom: 6 }}>
              YOU SAID
            </span>
            <p style={{ margin: 0, fontSize: 15, color: 'var(--text)', fontStyle: 'italic', lineHeight: 1.5 }}>
              {userTranscript}
            </p>
          </div>
        ) : (
          <div style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '14px 18px', marginBottom: 14,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--subtext)', display: 'block', marginBottom: 4 }}>
              YOU SAID
            </span>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--subtext)', fontStyle: 'italic' }}>
              No response recorded
            </p>
          </div>
        )}

        {/* Key phrase takeaway */}
        <div style={{
          background: 'rgba(124,58,237,.07)', border: '1px solid rgba(124,58,237,.2)',
          borderRadius: 12, padding: '14px 18px', marginBottom: 24,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', display: 'block', marginBottom: 6 }}>
            KEY PHRASE TO REMEMBER
          </span>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
            "{keyPhrase}…"
          </p>
        </div>

        {/* Rounds counter */}
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--subtext)', marginBottom: 20 }}>
          Rounds completed: {rounds + 1} · Total XP this session: {(rounds + 1) * 5}
        </p>

        {/* Navigation */}
        <button
          onClick={nextRound}
          style={{
            display: 'block', width: '100%', padding: '14px 0',
            background: 'linear-gradient(135deg, #d4002d, #e63946)',
            color: '#fff', border: 'none', borderRadius: 12,
            fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 10,
          }}
        >
          🔁 Next Round
        </button>

        <button
          onClick={handleDone}
          style={{
            display: 'block', width: '100%', padding: '12px 0',
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 12, color: 'var(--subtext)', fontSize: 15,
            cursor: 'pointer',
          }}
        >
          ← Done
        </button>
      </div>
    );
  }

  // Fallback / loading
  return (
    <div className="scr-wrap" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <p style={{ color: 'var(--subtext)' }}>Loading…</p>
    </div>
  );
}
