// ═══════════════════════════════════════════════════════════
// Learner Style Model
// Tracks activity engagement to infer preferred learning modalities.
// Persisted to localStorage as 'nh_style_events'.
// ═══════════════════════════════════════════════════════════

const STORAGE_KEY = 'nh_style_events';
const MAX_EVENTS = 500;
const WINDOW_DAYS = 60; // only look at last 60 days

// Activity type categories
export const ACTIVITY_TYPES = {
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

function _load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function _save(events) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); }
  catch {}
}

function _prune(events) {
  const cutoff = Date.now() - WINDOW_DAYS * 86400000;
  return events.filter(e => e.ts > cutoff).slice(-MAX_EVENTS);
}

/**
 * Track when a user starts an activity.
 * Call this when a screen mounts / activity begins.
 */
export function trackStart(activityType) {
  if (!activityType) return;
  const events = _load();
  events.push({ type: activityType, action: 'start', ts: Date.now() });
  _save(_prune(events));
}

/**
 * Track when a user completes an activity.
 * Call this when award() fires or completion screen appears.
 */
export function trackComplete(activityType, durationMs = 0) {
  if (!activityType) return;
  const events = _load();
  events.push({ type: activityType, action: 'complete', ts: Date.now(), dur: durationMs });
  _save(_prune(events));
}

/**
 * Track when a user abandons an activity (went back without finishing).
 */
export function trackAbandon(activityType, durationMs = 0) {
  if (!activityType) return;
  const events = _load();
  // Only log abandon if they spent at least 5 seconds (filter accidental taps)
  if (durationMs < 5000) return;
  events.push({ type: activityType, action: 'abandon', ts: Date.now(), dur: durationMs });
  _save(_prune(events));
}

/**
 * Compute completion rates and engagement scores per activity type.
 */
export function getStylePreferences() {
  const events = _prune(_load());
  if (events.length < 5) return null; // not enough data yet

  const stats = {};
  for (const e of events) {
    if (!stats[e.type]) stats[e.type] = { starts: 0, completes: 0, abandons: 0, totalDur: 0 };
    const s = stats[e.type];
    if (e.action === 'start') s.starts++;
    else if (e.action === 'complete') { s.completes++; s.totalDur += (e.dur || 0); }
    else if (e.action === 'abandon') s.abandons++;
  }

  const scored = Object.entries(stats)
    .filter(([, s]) => s.starts >= 2) // need at least 2 starts to be meaningful
    .map(([type, s]) => {
      const attempts = s.completes + s.abandons;
      const completionRate = attempts > 0 ? s.completes / attempts : 0.5;
      const avgDur = s.completes > 0 ? s.totalDur / s.completes / 1000 : 0; // seconds
      const engagementScore = completionRate * Math.min(avgDur / 300, 1); // normalize to 5min max
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

/**
 * Get style context formatted for the daily-plan API.
 */
export function getStyleContextForAPI() {
  const prefs = getStylePreferences();
  if (!prefs) return null;
  return {
    preferredTypes: prefs.preferredTypes,
    avoidedTypes: prefs.avoidedTypes,
    completionRates: prefs.completionRates,
    dataPoints: prefs.dataPoints,
  };
}

/**
 * Get a human-readable style label for the UI.
 */
export function getStyleLabel() {
  const prefs = getStylePreferences();
  if (!prefs || !prefs.topType) return null;
  const labels = {
    flashcards: 'Visual Learner', quiz: 'Active Recall Learner',
    grammar: 'Analytical Learner', listening: 'Auditory Learner',
    speaking: 'Speaking-First Learner', conversation: 'Conversational Learner',
    reading: 'Reading Learner', srs_review: 'Systematic Learner',
    writing: 'Writing Learner', shadowing: 'Immersive Learner',
  };
  return labels[prefs.topType] || null;
}

export function getTotalEvents() {
  return _prune(_load()).length;
}
