import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { AwardActivityType } from '../../types/index.js';
import { useStats } from '../../context/StatsContext';
import { markQuest } from '../../lib/quests.js';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { apiFetch } from '../../lib/apiFetch.js';
import { _aiPost } from '../../lib/aiPost';
import { getAudioContext } from '../../lib/audio.js';
import { getVoicePreference } from '../../lib/soundSettings.js';
import { STORY_CITIES, GOAL_META } from './StoryModeData.js';
import StorySetupPanel from './StorySetupPanel';
import StoryViewPanel from './StoryViewPanel';

interface StoryData {
  story: string;
  title?: string;
  title_en?: string;
  cultural_note?: string;
  vocabulary?: {
    hr?: string;
    en?: string;
    croatian?: string;
    english?: string;
    word?: string;
    translation?: string;
  }[];
  comprehension_questions?: string[];
  [key: string]: unknown;
}

interface GoalMeta {
  label: string;
  icon: string;
  cities: string[];
  theme: string;
  tip: string;
}

interface AudioPlayer {
  pause(): void;
  addEventListener(ev: string, fn: () => void): void;
}

// ── TTS helper ────────────────────────────────────────────────────────────────
const _iosDevice =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

async function playTTS(text: string): Promise<AudioPlayer | HTMLAudioElement> {
  const res = await apiFetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, slow: false, voice: getVoicePreference() }),
  });
  if (!res.ok) throw new Error('TTS failed');
  const blob = await res.blob();

  // iOS path: AudioContext — use blob.arrayBuffer() directly, no blob URL needed
  const ctx = _iosDevice ? getAudioContext() : null;
  if (ctx) {
    try {
      await ctx.resume();
      const ab = await blob.arrayBuffer();
      const decoded = await ctx.decodeAudioData(ab);
      const src = ctx.createBufferSource();
      src.buffer = decoded;
      src.connect(ctx.destination);
      src.start(0);
      return {
        pause() {
          try {
            src.stop();
          } catch {}
        },
        addEventListener(ev: string, fn: () => void) {
          if (ev === 'ended') src.onended = fn;
        },
      };
    } catch {
      throw new Error('TTS playback failed');
    }
  }

  // Non-iOS: use base64 data URL — blob: URLs fail silently on some Android OEM WebViews
  const url = await new Promise<string>((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.readAsDataURL(blob);
  });
  const audio = new Audio(url);
  try {
    await audio.play();
  } catch {
    throw new Error('play() blocked');
  }
  return audio;
}

// ── Pulsing dots ──────────────────────────────────────────────────────────────
function PulsingDots({ color }: { color?: string }) {
  return (
    <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: color || '#0e7490',
            display: 'inline-block',
            animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function StoryModeScreen({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: AwardActivityType) => void;
}) {
  const { level: userLevel } = useStats();
  const isOnline = useOnlineStatus();

  // Read user goal
  const userGoal = (() => {
    try {
      return localStorage.getItem('nh_goal') || '';
    } catch {
      return '';
    }
  })();
  const goalMeta = (GOAL_META as Record<string, GoalMeta>)[userGoal] ?? null;

  // Setup state — pre-select a goal-recommended city if available
  const [selectedCity, setSelectedCity] = useState(() => {
    if (goalMeta) {
      const rec = STORY_CITIES.find((c) => goalMeta.cities.includes(c.name));
      if (rec) return rec;
    }
    return STORY_CITIES[0]!;
  });
  const [selectedLevel, setSelectedLevel] = useState<string>(String(userLevel || 'A2'));
  const [characterName, setCharacterName] = useState('');

  // Phase: setup | loading | story | error
  const [phase, setPhase] = useState('setup');
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [error, setError] = useState('');

  // Story interaction state
  const [tappedWords, setTappedWords] = useState(0);
  const [vocabOpen, setVocabOpen] = useState(false);
  const [discussOpen, setDiscussOpen] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const audioRef = useRef<AudioPlayer | HTMLAudioElement | null>(null);
  const awardFired = useRef(false);
  const _unmountedRef = useRef(false);
  const storyRef = useRef<HTMLDivElement | null>(null);
  const tappedWordsRef = useRef(0);

  // Keep ref in sync so scroll handler always sees current value without re-adding listener
  useEffect(() => {
    tappedWordsRef.current = tappedWords;
  }, [tappedWords]);

  // Track reading completion via scroll — only re-attach when phase changes, not on every word tap
  useEffect(() => {
    if (phase !== 'story' || !storyRef.current) return undefined;
    const el = storyRef.current;
    const check = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (
        scrollTop + clientHeight >= scrollHeight - 80 &&
        tappedWordsRef.current >= 5 &&
        !awardFired.current
      ) {
        awardFired.current = true;
        if (typeof award === 'function') award(15, false, 'story');
        markQuest('reading');
      }
    };
    el.addEventListener('scroll', check, { passive: true });
    return () => el.removeEventListener('scroll', check);
  }, [phase, award]);

  const generateStory = useCallback(async () => {
    if (!isOnline) {
      setError('You need an internet connection to generate stories.');
      return;
    }
    setPhase('loading');
    setError('');
    awardFired.current = false;
    setTappedWords(0);
    try {
      const res = await _aiPost('/api/ai-chat', {
        mode: 'story',
        messages: [
          {
            role: 'user',
            content: `Generate an immersive Croatian story set in ${selectedCity.name}`,
          },
        ],
        params: {
          city: selectedCity.name,
          region: selectedCity.region,
          level: selectedLevel,
          character_name: characterName || 'you',
          goal: userGoal || undefined,
          goal_theme: goalMeta?.theme || undefined,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStoryData(data);
      setPhase('story');
    } catch (e) {
      setError('Could not generate story. Please try again.');
      setPhase('setup');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, selectedCity, selectedLevel, characterName]);

  const handleTTS = useCallback(async () => {
    if (!storyData || ttsPlaying) return;
    setTtsPlaying(true);
    try {
      const audio = await playTTS(storyData.story);
      if (_unmountedRef.current) return;
      audioRef.current = audio;
      audio.addEventListener('ended', () => {
        if (!_unmountedRef.current) setTtsPlaying(false);
      });
      audio.addEventListener('error', () => {
        if (!_unmountedRef.current) setTtsPlaying(false);
      });
      audio.addEventListener('pause', () => {
        if (!_unmountedRef.current) setTtsPlaying(false);
      });
    } catch {
      if (!_unmountedRef.current) setTtsPlaying(false);
    }
  }, [storyData, ttsPlaying]);

  useEffect(() => {
    return () => {
      _unmountedRef.current = true;
    };
  }, []);

  const stopTTS = useCallback(() => {
    if (audioRef.current) {
      (audioRef.current as { pause(): void }).pause();
      audioRef.current = null;
    }
    setTtsPlaying(false);
  }, []);

  const handleWordTap = useCallback(() => {
    setTappedWords((n) => n + 1);
  }, []);

  // ── SETUP PHASE ─────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <StorySetupPanel
        goalMeta={goalMeta}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        selectedLevel={selectedLevel}
        setSelectedLevel={setSelectedLevel}
        characterName={characterName}
        setCharacterName={setCharacterName}
        error={error}
        onGenerate={generateStory}
        onBack={goBack}
      />
    );
  }

  // ── LOADING PHASE ────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="scr-wrap">
        <style>{`
          @keyframes pulse-dot {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
          }
          @keyframes city-spin {
            0% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(180deg) scale(1.1); }
            100% { transform: rotate(360deg) scale(1); }
          }
        `}</style>
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
          }}
        >
          <div style={{ fontSize: 72, animation: 'city-spin 2s ease-in-out infinite' }}>
            {selectedCity.icon}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{ fontSize: 18, fontWeight: 700, color: 'var(--heading)', marginBottom: 8 }}
            >
              Crafting your story in {selectedCity.name}…
            </div>
            <div style={{ fontSize: 14, color: 'var(--subtext)', marginBottom: 16 }}>
              Weaving language, culture, and place into your {selectedLevel} adventure
            </div>
            <PulsingDots color={selectedCity.color} />
          </div>
        </div>
      </div>
    );
  }

  // ── STORY PHASE ──────────────────────────────────────────────────────────────
  if (phase === 'story' && storyData) {
    return (
      <StoryViewPanel
        storyData={storyData}
        selectedCity={selectedCity}
        selectedLevel={selectedLevel}
        ttsPlaying={ttsPlaying}
        tappedWords={tappedWords}
        vocabOpen={vocabOpen}
        setVocabOpen={setVocabOpen}
        discussOpen={discussOpen}
        setDiscussOpen={setDiscussOpen}
        storyRef={storyRef}
        onWordTap={handleWordTap}
        onTTSToggle={ttsPlaying ? stopTTS : handleTTS}
        onNewStory={() => {
          stopTTS();
          setPhase('setup');
          setStoryData(null);
        }}
        onBack={() => {
          stopTTS();
          goBack();
        }}
      />
    );
  }

  return null;
}
