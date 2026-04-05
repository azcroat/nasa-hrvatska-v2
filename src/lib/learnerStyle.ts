// ═══════════════════════════════════════════════════════════
// Learner Style Model
// ═══════════════════════════════════════════════════════════

const STORAGE_KEY = 'nh_style_events';
const MAX_EVENTS = 500;
const WINDOW_DAYS = 60;

export const ACTIVITY_TYPES: Record<string, string> = {
  flashcards:   'visual',
  quiz:         'active_recall',
  grammar:      'analytical',
  cloze:        'analytical',
  listening:    'auditory',
  speaking:     'production',
  conversation: 'production',
  reading:      'receptive',
  srs_review:   'active_recall',
  writing:      'production',
  shadowing:    'auditory',
  matching:     'visual',
};

interface StyleEvent {
  type: string;
  action: 'start' | 'complete' | 'abandon';
  ts: number;
  dur?: number;
}

function _load(): StyleEvent[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function _save(events: StyleEvent[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); }
  catch {}
}

function _prune(events: StyleEvent[]): StyleEvent[] {
  const cutoff = Date.now() - WINDOW_DAYS * 86400000;
  return events.filter(e => e.ts > cutoff).slice(-MAX_EVENTS);
}

export function trackStart(activityType: string): void {
  if (!activityType) return;
  const events = _load();
  events.push({ type: activityType, action: 'start', ts: Date.now() });
  _save(_prune(events));
}

export function trackComplete(activityType: string, durationMs = 0): void {
  if (!activityType) return;
  const events = _load();
  events.push({ type: activityType, action: 'complete', ts: Date.now(), dur: durationMs });
  _save(_prune(events));
}

export function trackAbandon(activityType: string, durationMs = 0): void {
  if (!activityType) return;
  const events = _load();
  if (durationMs < 5000) return;
  events.push({ type: activityType, action: 'abandon', ts: Date.now(), dur: durationMs });
  _save(_prune(events));
}

interface StyleScore {
  type: string;
  completionRate: number;
  avgDur: number;
  engagementScore: number;
  completes: number;
}

interface StylePreferences {
  preferredTypes: string[];
  avoidedTypes: string[];
  completionRates: Record<string, number>;
  topType: string | null;
  dataPoints: number;
  scored: StyleScore[];
}

export function getStylePreferences(): StylePreferences | null {
  const events = _prune(_load());
  if (events.length < 5) return null;

  const stats: Record<string, { starts: number; completes: number; abandons: number; totalDur: number }> = {};
  for (const e of events) {
    if (!stats[e.type]) stats[e.type] = { starts: 0, completes: 0, abandons: 0, totalDur: 0 };
    const s = stats[e.type];
    if (e.action === 'start') s.starts++;
    else if (e.action === 'complete') { s.completes++; s.totalDur += (e.dur || 0); }
    else if (e.action === 'abandon') s.abandons++;
  }

  const scored: StyleScore[] = Object.entries(stats)
    .filter(([, s]) => s.starts >= 2)
    .map(([type, s]) => {
      const attempts = s.completes + s.abandons;
      const completionRate = attempts > 0 ? s.completes / attempts : 0.5;
      const avgDur = s.completes > 0 ? s.totalDur / s.completes / 1000 : 0;
      const engagementScore = completionRate * Math.min(avgDur / 300, 1);
      return { type, completionRate, avgDur, engagementScore, completes: s.completes };
    })
    .sort((a, b) => b.engagementScore - a.engagementScore);

  return {
    preferredTypes: scored.slice(0, 3).map(s => s.type),
    avoidedTypes: scored.filter(s => s.completionRate < 0.4).map(s => s.type),
    completionRates: Object.fromEntries(scored.map(s => [s.type, Math.round(s.completionRate * 100)])),
    topType: scored[0]?.type || null,
    dataPoints: events.length,
    scored,
  };
}

export function getStyleContextForAPI(): { preferredTypes: string[]; avoidedTypes: string[]; completionRates: Record<string, number>; dataPoints: number } | null {
  const prefs = getStylePreferences();
  if (!prefs) return null;
  return {
    preferredTypes: prefs.preferredTypes,
    avoidedTypes: prefs.avoidedTypes,
    completionRates: prefs.completionRates,
    dataPoints: prefs.dataPoints,
  };
}

export function getStyleLabel(): string | null {
  const prefs = getStylePreferences();
  if (!prefs || !prefs.topType) return null;
  const labels: Record<string, string> = {
    flashcards: 'Visual Learner', quiz: 'Active Recall Learner',
    grammar: 'Analytical Learner', listening: 'Auditory Learner',
    speaking: 'Speaking-First Learner', conversation: 'Conversational Learner',
    reading: 'Reading Learner', srs_review: 'Systematic Learner',
    writing: 'Writing Learner', shadowing: 'Immersive Learner',
  };
  return labels[prefs.topType] || null;
}

export function getTotalEvents(): number {
  return _prune(_load()).length;
}
