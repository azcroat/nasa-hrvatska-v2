// src/lib/recentErrors.ts
// Tracks the last few wrong answers a learner made so the AI feedback
// endpoints can reference recent mistake patterns. Device-local by design.

const KEY = 'nh_recent_errors';
const MAX = 5;
const TTL_MS = 24 * 60 * 60 * 1000;
const PROMPT_MAX = 80;
const ANSWER_MAX = 60;

interface RecentErrorEntry {
  topic: string;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  at: number;
}

export interface RecentErrorView {
  topic: string;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  minutesAgo: number;
}

function _read(): RecentErrorEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function _pruneStale(arr: RecentErrorEntry[]): RecentErrorEntry[] {
  const cutoff = Date.now() - TTL_MS;
  return arr.filter((e) => typeof e?.at === 'number' && e.at >= cutoff);
}

export function appendRecentError(input: {
  topic: string;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
}): void {
  if (!input || typeof input.topic !== 'string' || !input.topic) return;
  try {
    const arr = _pruneStale(_read());
    const entry: RecentErrorEntry = {
      topic: input.topic.slice(0, 40),
      prompt: String(input.prompt ?? '').slice(0, PROMPT_MAX),
      userAnswer: String(input.userAnswer ?? '').slice(0, ANSWER_MAX),
      correctAnswer: String(input.correctAnswer ?? '').slice(0, ANSWER_MAX),
      at: Date.now(),
    };
    arr.unshift(entry);
    const capped = arr.slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(capped));
  } catch {
    // QuotaExceededError or localStorage unavailable — non-fatal
  }
}

export function getRecentErrors(): RecentErrorView[] {
  const now = Date.now();
  return _pruneStale(_read()).map((e) => ({
    topic: e.topic,
    prompt: e.prompt,
    userAnswer: e.userAnswer,
    correctAnswer: e.correctAnswer,
    minutesAgo: Math.min(1440, Math.max(0, Math.floor((now - e.at) / 60000))),
  }));
}
