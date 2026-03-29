// Persona config, memory helpers, and utility functions for MajaScreen

// ── Keyframe CSS (injected once) ──────────────────────────────────────────────
export const MAJA_STYLES = `
@keyframes maja-pulse {
  0%   { transform: scale(1);   opacity: 0.65; }
  100% { transform: scale(2.3); opacity: 0;    }
}
@keyframes maja-dot {
  0%, 60%, 100% { transform: translateY(0);    opacity: 1;   }
  30%           { transform: translateY(-8px); opacity: 0.6; }
}
@keyframes maja-float {
  0%, 100% { transform: translateY(0px);  }
  50%      { transform: translateY(-4px); }
}
@keyframes maja-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
@keyframes debrief-pop {
  0%   { transform: scale(0.8);  opacity: 0; }
  80%  { transform: scale(1.03);             }
  100% { transform: scale(1);    opacity: 1; }
}
@keyframes maja-ellipsis {
  0%  { content: '.';   }
  33% { content: '..';  }
  66% { content: '...'; }
}
@keyframes maja-confetti-fall {
  0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
  100% { transform: translateY(80px)  rotate(360deg); opacity: 0; }
}
@keyframes maja-bar-pulse {
  0%, 100% { opacity: 0.7; }
  50%       { opacity: 1;   }
}
@keyframes maja-cursor-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
`;

// ── Persona configuration ─────────────────────────────────────────────────────
export const PERSONA_CONFIG = {
  teacher: {
    name: 'Maja Kovačević',
    title: 'Učiteljica Hrvatskog',
    avatar: '/images/portraits/tutor-hero.webp',
    fallbackEmoji: '👩‍🏫',
    orbColor: '#D4002D',
    thinkingColor: '#F59E0B',
    speakingColor: '#D4002D',
    listenColor: '#0e7490',
    accentColor: '#D4002D',
  },
  fisherman: {
    name: 'Marko',
    title: 'Ribar, Stari Grad, Hvar',
    avatar: '/images/portraits/fisherman.webp',
    fallbackEmoji: '⛵',
    orbColor: '#0284c7',
    thinkingColor: '#0369a1',
    speakingColor: '#0284c7',
    listenColor: '#0ea5e9',
    accentColor: '#0284c7',
  },
  secretary: {
    name: 'Ana Perković',
    title: 'Tajnica, Grad Zagreb',
    avatar: '/images/portraits/mature-woman.webp',
    fallbackEmoji: '💼',
    orbColor: '#7c3aed',
    thinkingColor: '#6d28d9',
    speakingColor: '#7c3aed',
    listenColor: '#8b5cf6',
    accentColor: '#7c3aed',
  },
  baka: {
    name: 'Baka Mara',
    title: 'Baka iz Vinkovaca, Slavonija',
    avatar: '/images/portraits/grandmother.webp',
    fallbackEmoji: '👵',
    orbColor: '#b45309',
    thinkingColor: '#92400e',
    speakingColor: '#b45309',
    listenColor: '#d97706',
    accentColor: '#b45309',
  },
};

export function getPersona() {
  try {
    const p = localStorage.getItem('maja_persona');
    return PERSONA_CONFIG[p] ? p : 'teacher';
  } catch {
    return 'teacher';
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────
export const SR_SUPPORTED =
  typeof window !== 'undefined' &&
  !!(window.SpeechRecognition || window.webkitSpeechRecognition);

export const DEFAULT_MEMORY = {
  sessionCount: 0,
  relationshipLevel: 0,
  totalMinutes: 0,
  knownFacts: {},
  mistakePatterns: [],
  lastSessionSummary: '',
  nextTopicSuggestion: '',
  recentVocab: [],
  sessions: [],
};

export const SILENCE_DELAY_MS = 2000;

// ── Memory persistence ────────────────────────────────────────────────────────
export function loadMemory() {
  try {
    const raw = localStorage.getItem('majaMemory');
    if (!raw) return { ...DEFAULT_MEMORY };
    return { ...DEFAULT_MEMORY, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_MEMORY };
  }
}

export function saveMemory(mem) {
  try {
    localStorage.setItem('majaMemory', JSON.stringify(mem));
  } catch {
    // quota exceeded — silently ignore
  }
}

// ── Formatting helpers ────────────────────────────────────────────────────────
export function fmtDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m} min ${s} sec`;
}

export function fmtElapsed(secs) {
  const m = Math.floor(secs / 60);
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export function relationshipLabel(level) {
  const labels = ['stranac', 'poznanik', 'redoviti polaznik', 'prijatelj', 'bliski prijatelj'];
  return labels[Math.min(level, 4)] || 'stranac';
}

export function computeRelationshipLevel(sessionCount) {
  if (sessionCount >= 20) return 4;
  if (sessionCount >= 10) return 3;
  if (sessionCount >= 5)  return 2;
  if (sessionCount >= 2)  return 1;
  return 0;
}
