// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { markQuest } from '../../lib/quests.js';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { isSpeechRecognitionSupported } from '../../lib/platform.js';
import { apiFetch } from '../../lib/apiFetch.js';
import { getVoicePreference } from '../../lib/soundSettings.js';
import SprintSetupScreen from './SprintSetupScreen';
import SprintCountdownScreen from './SprintCountdownScreen';
import SprintSpeakingPhase from './SprintSpeakingPhase';
import SprintModelPhase from './SprintModelPhase';
import SprintFeedbackPhase from './SprintFeedbackPhase';

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
    {
      hr: 'Odakle si?',
      en: 'Where are you from?',
      model_response: 'Ja sam iz Splita. A ti, odakle si?',
    },
    {
      hr: 'Koliko imaš godina?',
      en: 'How old are you?',
      model_response: 'Imam trideset godina. A ti?',
    },
    {
      hr: 'Što radiš?',
      en: 'What do you do?',
      model_response: 'Ja sam učiteljica. A ti, što radiš?',
    },
    {
      hr: 'Govoriš li hrvatski?',
      en: 'Do you speak Croatian?',
      model_response: 'Da, govorim hrvatski. Učim ga svaki dan.',
    },
    {
      hr: 'Sviđa ti se Hrvatska?',
      en: 'Do you like Croatia?',
      model_response: 'Da, jako mi se sviđa! Hrvatska je prekrasna zemlja.',
    },
    {
      hr: 'Što voliš jesti?',
      en: 'What do you like to eat?',
      model_response: 'Volim janjetinu i dagnje. A ti, što voliš?',
    },
    {
      hr: 'Imaš li kućnog ljubimca?',
      en: 'Do you have a pet?',
      model_response: 'Da, imam psa. Zove se Bruno.',
    },
  ],
  A2: [
    {
      hr: 'Opiši svoju obitelj.',
      en: 'Describe your family.',
      model_response:
        'Imam malu obitelj. Živim s roditeljima i sestrom. Tata radi kao inženjer, a mama je liječnica.',
    },
    {
      hr: 'Što si radio/radila jučer?',
      en: 'What did you do yesterday?',
      model_response:
        'Jučer sam išla na tržnicu ujutro, a poslijepodne sam čitala knjigu i pila kavu s prijateljicom.',
    },
    {
      hr: 'Opiši svoju kuću ili stan.',
      en: 'Describe your house or apartment.',
      model_response:
        'Živim u malom stanu u centru grada. Imam dnevni boravak, jednu spavaću sobu i malu kuhinju.',
    },
    {
      hr: 'Što planiraš raditi ovog vikenda?',
      en: 'What are you planning to do this weekend?',
      model_response:
        'Ovaj vikend idem u Dubrovnik s prijateljima. Planiram posjetiti stari grad i pojesti dobru ribu.',
    },
    {
      hr: 'Koji je tvoj omiljeni film?',
      en: 'What is your favourite film?',
      model_response:
        'Moj omiljeni film je "Tko pjeva zlo ne misli". To je stara hrvatska komedija, jako smiješna.',
    },
    {
      hr: 'Pričaj mi o svom gradu.',
      en: 'Tell me about your city.',
      model_response:
        'Živim u Zagrebu. To je glavni grad Hrvatske. Ima lijepe parkove, muzeje i odličnu kafićsku kulturu.',
    },
    {
      hr: 'Kako provodiš slobodno vrijeme?',
      en: 'How do you spend your free time?',
      model_response:
        'U slobodno vrijeme volim čitati, šetati po gradu i kuhati. Ponekad idem na koncerte.',
    },
    {
      hr: 'Što misliš o učenju stranih jezika?',
      en: 'What do you think about learning foreign languages?',
      model_response:
        'Mislim da je učenje stranih jezika jako korisno. Otvara vrata novim kulturama i prijateljstvima.',
    },
  ],
  B1: [
    {
      hr: 'Zašto učiš hrvatski?',
      en: 'Why are you learning Croatian?',
      model_response:
        'Učim hrvatski jer imam prijatelje iz Hrvatske i želim bolje razumjeti njihovu kulturu i humor. Jezik je ključ za pravo razumijevanje naroda.',
    },
    {
      hr: 'Opiši najljepše putovanje u svom životu.',
      en: 'Describe the most beautiful trip of your life.',
      model_response:
        'Najljepše putovanje u mom životu bilo je na Plitvička jezera. Boje vode — od smaragdno zelene do turkizno plave — jednostavno su nevjerojatne.',
    },
    {
      hr: 'Što misliš o modernoj tehnologiji?',
      en: 'What do you think about modern technology?',
      model_response:
        'Moderna tehnologija ima i prednosti i mana. S jedne strane, olakšava komunikaciju i pristup informacijama. S druge strane, previše vremena provodimo ispred zaslona.',
    },
    {
      hr: 'Kakav bi bio tvoj idealan dan?',
      en: 'What would your ideal day look like?',
      model_response:
        'Idealan dan bi počeo s kavom na terasi s pogledom na more. Potom bih plivao, ručao svježu ribu, a večer proveo s dobrim prijateljima uz gitaru.',
    },
    {
      hr: 'Što ti znači dom?',
      en: 'What does home mean to you?',
      model_response:
        'Dom mi znači mjesto gdje se osjećam sigurno i opušteno. Nije nužno fizičko mjesto — može biti i s određenim ljudima.',
    },
    {
      hr: 'Kakva je razlika između prijatelja i poznanika?',
      en: 'What is the difference between a friend and an acquaintance?',
      model_response:
        'Poznanik je netko koga poznaješ, ali s kim nemaš duboku vezu. Pravi prijatelj je onaj koji te prihvaća takva kakav jesi i uz tebe je u dobrim i lošim trenucima.',
    },
  ],
  B2: [
    {
      hr: 'Što misliš o klimatskim promjenama i odgovornosti pojedinca?',
      en: 'What do you think about climate change and individual responsibility?',
      model_response:
        'Klimatske promjene su jedan od najvećih izazova našeg vremena. Mislim da svaki pojedinac mora preuzeti odgovornost — od smanjenja potrošnje plastike do svjesnijeg putovanja. Ali bez sustavnih promjena od strane vlada i korporacija, individualni napori nisu dovoljni.',
    },
    {
      hr: 'Kako bi opisao/opisala hrvatsku kulturu nekome tko nikad nije bio u Hrvatskoj?',
      en: 'How would you describe Croatian culture to someone who has never been to Croatia?',
      model_response:
        'Hrvatska je zemlja kontrasta — između kontinentalne tradicije i mediteranskog načina života, između burne povijesti i opuštene sadašnjosti. Hrvati su ponosni na svoju kulturu, goste dočekuju s toplinom, a kava uz razgovor je gotovo sveta institucija.',
    },
    {
      hr: 'Raspravi o prednostima i nedostacima urbanog i ruralnog života.',
      en: 'Discuss the advantages and disadvantages of urban and rural life.',
      model_response:
        'Urbani život nudi raznolikost — posao, kulturu, anonimnost. Ali nosi i stres, buku i otuđenost. Ruralni život je mirniji, s jačim zajedništvom, ali ograničenijim prilikama. Idealno bi bilo kombinirati oboje — živjeti u prirodi, a imati pristup gradskim sadržajima.',
    },
  ],
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const SR_SUPPORTED = isSpeechRecognitionSupported();

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

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function SpeakingSprintScreen({ goBack, award }) {
  const { isOnline } = useOnlineStatus();
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
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

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
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  // ── Countdown phase ─────────────────────────
  useEffect(() => {
    if (phase !== 'countdown') return undefined;
    if (countdown <= 0) {
      const prompt = pickPrompt();
      setCurrentPrompt(prompt);
      setUserTranscript('');
      setLiveTranscript('');
      setTextInput('');
      setMicDenied(false);
      setPhase('speaking');
      startListening();
      return undefined;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  function stopMic() {
    clearTimeout(silenceTimerRef.current);
    setIsRecording(false);
    if (recRef.current) {
      try {
        recRef.current.stop();
      } catch {
        /* already stopped */
      }
      recRef.current = null;
    }
  }

  function startListening() {
    transcriptRef.current = '';
    setLiveTranscript('');
    setIsRecording(true);

    if (!SR_SUPPORTED) return;

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

    try {
      rec.start();
    } catch {
      /* already started */
    }
  }

  function handleUserDone(transcript) {
    const finalText = transcript || textInput || '';
    setUserTranscript(finalText);
    setPhase('model');
    loadTTS(currentPrompt.model_response);
  }

  async function loadTTS(text) {
    setTtsLoading(true);
    setTtsError('');
    setAudioUrl(null);
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    try {
      const res = await apiFetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, slow: false, voice: getVoicePreference() }),
      });
      if (!res.ok) throw new Error(`TTS ${res.status}`);
      const blob = await res.blob();
      // Use base64 data URL — blob: URLs fail silently on some Android OEM WebViews
      const url = await new Promise((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.readAsDataURL(blob);
      });
      audioUrlRef.current = url;
      setAudioUrl(url);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play().catch(() => {});
    } catch {
      setTtsError('Could not load audio. Check your connection and try again.');
    } finally {
      setTtsLoading(false);
    }
  }

  function startRound() {
    stopMic();
    setCountdown(3);
    setPhase('countdown');
  }

  function nextRound() {
    setRounds((r) => r + 1);
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

  function handleDone() {
    stopMic();
    if (!finishFired.current) {
      finishFired.current = true;
      const totalRounds = rounds + (phase === 'feedback' ? 1 : 0);
      if (award && totalRounds > 0) award(totalRounds * 5);
      markQuest('speak');
    }
    goBack();
  }

  const level = getUserLevel();

  // ── Setup phase ──────────────────────────────
  if (phase === 'setup') {
    return (
      <SprintSetupScreen level={level} onStart={startRound} onBack={goBack} isOnline={isOnline} />
    );
  }

  // ── Countdown phase ──────────────────────────
  if (phase === 'countdown') {
    return <SprintCountdownScreen countdown={countdown} />;
  }

  // ── Speaking phase ───────────────────────────
  if (phase === 'speaking' && currentPrompt) {
    return (
      <SprintSpeakingPhase
        rounds={rounds}
        level={level}
        currentPrompt={currentPrompt}
        micDenied={micDenied}
        isRecording={isRecording}
        liveTranscript={liveTranscript}
        textInput={textInput}
        onTextInputChange={setTextInput}
        onStartListening={startListening}
        onDoneSpeaking={() => {
          stopMic();
          handleUserDone(transcriptRef.current || textInput);
        }}
        onSkip={() => {
          stopMic();
          setUserTranscript('');
          setPhase('model');
          loadTTS(currentPrompt.model_response);
        }}
      />
    );
  }

  // ── Model phase (native playback) ────────────
  if (phase === 'model' && currentPrompt) {
    return (
      <SprintModelPhase
        currentPrompt={currentPrompt}
        ttsLoading={ttsLoading}
        ttsError={ttsError}
        audioUrl={audioUrl}
        audioRef={audioRef}
        userTranscript={userTranscript}
        onGetFeedback={() => setPhase('feedback')}
      />
    );
  }

  // ── Feedback phase ───────────────────────────
  if (phase === 'feedback' && currentPrompt) {
    return (
      <SprintFeedbackPhase
        currentPrompt={currentPrompt}
        userTranscript={userTranscript}
        rounds={rounds}
        onNextRound={nextRound}
        onDone={handleDone}
      />
    );
  }

  // Fallback / loading
  return (
    <div
      className="scr-wrap"
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}
    >
      <p style={{ color: 'var(--subtext)' }}>Loading…</p>
    </div>
  );
}
