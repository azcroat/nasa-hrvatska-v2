import React, { useEffect, useState, useCallback, useContext } from 'react';
import { getSR, getStreak } from '../../data.jsx';
import AppContext from '../../context/AppContext.jsx';
import { getStyleContextForAPI } from '../../lib/learnerStyle.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const CACHE_KEY    = 'nh_daily_plan_v2'; // v2: self-contained screen IDs only
const CACHE_TTL_MS = 86400000; // 24 hours

const ACTIVITY_ICONS = {
  srsreview:         '🔁',
  aiconvo:           '🎧',
  live_tutor:        '🎤',
  writing:           '✍️',
  grammar_diagnosis: '🔬',
  dialogue:          '💬',
  shadowing:         '🗣️',
  aspectdrill:       '🔄',
};

const ACTIVITY_SCREENS = {
  srsreview:         'review',
  aiconvo:           'aiconvo',
  live_tutor:        'live_tutor',
  writing:           'writing',
  grammar_diagnosis: 'grammar_diagnosis',
  dialogue:          'maja',
  shadowing:         'shadowing',
  aspectdrill:       'aspectdrill',
};

// ── Cache helpers ─────────────────────────────────────────────────────────────

function loadCachedPlan() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached?.generatedAt || !Array.isArray(cached?.activities)) return null;
    if (Date.now() - cached.generatedAt > CACHE_TTL_MS) return null;
    return cached;
  } catch {
    return null;
  }
}

function savePlanToCache(plan) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(plan));
  } catch {}
}

// ── Done tracking ─────────────────────────────────────────────────────────────

const DONE_KEY = 'nh_plan_done_';
function getTodayDone() {
  const today = new Date().toISOString().slice(0, 10);
  try { return new Set(JSON.parse(localStorage.getItem(DONE_KEY + today) || '[]')); }
  catch { return new Set(); }
}
function markDone(idx) {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const done = getTodayDone();
    done.add(idx);
    localStorage.setItem(DONE_KEY + today, JSON.stringify([...done]));
  } catch {}
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingState() {
  const [dots, setDots] = useState('.');
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ marginBottom: 16, borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 20px rgba(14,116,144,.18)', border: '1.5px solid rgba(14,116,144,.2)' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #0e7490 60%, #0891b2 100%)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: 'rgba(255,255,255,.15)', border: '1.5px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
          📋
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2 }}>AI PERSONALIZED</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Dnevni Plan</div>
        </div>
      </div>
      {/* Loading body */}
      <div style={{ background: 'var(--card)', padding: '16px 18px', textAlign: 'center', color: 'var(--subtext)', fontSize: 13, fontStyle: 'italic' }}>
        Maja priprema tvoj plan{dots}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DailyPlanCard(/** @type {any} */ { level: _level, goal: _goal, streak: _streak, setScr: _setScrProp } = {}) {
  const { setScr, sCurEx } = useContext(AppContext);
  const [phase, setPhase] = useState('idle');
  const [plan, setPlan]   = useState(null);
  const [streak, setStreak] = useState(0);
  const [done, setDone]   = useState(() => getTodayDone());

  const collectPayload = useCallback(() => {
    const level = localStorage.getItem('nh_level') || 'B1';
    const srData = getSR();
    const srWeakWords = Object.entries(srData)
      .filter(([, v]) => v.w > 0)
      .sort((a, b) => (b[1].w / (b[1].r + 1)) - (a[1].w / (a[1].r + 1)))
      .slice(0, 8)
      .map(([w]) => w);
    const majaMemory  = JSON.parse(localStorage.getItem('majaMemory') || '{}');
    const majaPatterns = Array.isArray(majaMemory.mistakePatterns) ? majaMemory.mistakePatterns.slice(0, 10) : [];
    const goal   = localStorage.getItem('nh_goal') || 'fluent';
    const streak = getStreak();
    const today  = new Date().toISOString().slice(0, 10);
    const recentActivity = {
      flashcards: parseInt(localStorage.getItem('nh_session_flashcards_' + today) || '0', 10),
      listening:  parseInt(localStorage.getItem('nh_session_listening_' + today)  || '0', 10),
      speaking:   parseInt(localStorage.getItem('nh_session_speaking_' + today)   || '0', 10),
      writing:    parseInt(localStorage.getItem('nh_session_writing_' + today)    || '0', 10),
      lastActive: parseInt(localStorage.getItem('nh_last_active') || '0', 10),
    };
    return { level, srWeakWords, majaPatterns, recentActivity, goal, streak: streak.count ?? streak };
  }, []);

  const fetchPlan = useCallback(async () => {
    setPhase('loading');
    try {
      const payload = collectPayload();
      const res = await fetch('/api/daily-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, stylePreferences: getStyleContextForAPI() }),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) throw new Error('API error ' + res.status);
      const data = await res.json();
      if (!Array.isArray(data.activities) || data.activities.length !== 3) throw new Error('Invalid plan structure');
      savePlanToCache(data);
      setPlan(data);
      setPhase('ready');
    } catch (e) {
      console.warn('DailyPlanCard: fetch failed —', e.message);
      setPhase('error');
    }
  }, [collectPayload]);

  useEffect(() => {
    const streakObj = getStreak();
    setStreak(typeof streakObj === 'object' ? (streakObj.count ?? 0) : (streakObj ?? 0));
    const cached = loadCachedPlan();
    if (cached) { setPlan(cached); setPhase('ready'); }
    else { fetchPlan(); }
  }, [fetchPlan]);

  if (phase === 'error') return null;
  if (phase === 'loading' || phase === 'idle') return <LoadingState />;
  if (phase !== 'ready' || !plan) return null;

  const completedCount = plan.activities.filter((_, i) => done.has(i)).length;
  const allDone = completedCount === plan.activities.length;
  const isPersonalized = getStyleContextForAPI() !== null;

  return (
    <div style={{ marginBottom: 16, borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 20px rgba(14,116,144,.18)', border: '1.5px solid rgba(14,116,144,.2)' }}>

      {/* ── Gradient header ── */}
      <div style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #0e7490 60%, #0891b2 100%)', padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: 'rgba(255,255,255,.15)', border: '1.5px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            {allDone ? '🏆' : '📋'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2 }}>
              {isPersonalized ? '✨ AI PERSONALIZED' : 'DAILY PLAN'}
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Dnevni Plan</div>
          </div>
          {streak > 0 && (
            <div style={{ flexShrink: 0, background: 'rgba(255,255,255,.15)', border: '1.5px solid rgba(255,255,255,.25)', borderRadius: 10, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 13 }}>🔥</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{streak}</span>
            </div>
          )}
        </div>

        {/* Greeting */}
        {plan.greeting && (
          <div style={{ marginTop: 10, fontSize: 13, fontStyle: 'italic', color: 'rgba(255,255,255,.85)', lineHeight: 1.5, fontFamily: '"Playfair Display", serif' }}>
            "{plan.greeting}"
          </div>
        )}

        {/* Progress bar */}
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.6)' }}>Today's progress</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: allDone ? '#86efac' : 'rgba(255,255,255,.8)' }}>
              {completedCount}/{plan.activities.length} {allDone ? '· Complete! 🎉' : ''}
            </span>
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,.2)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(completedCount / plan.activities.length) * 100}%`, background: allDone ? '#86efac' : 'rgba(255,255,255,.75)', borderRadius: 3, transition: 'width .4s ease' }} />
          </div>
        </div>
      </div>

      {/* ── Activity cards ── */}
      <div style={{ background: 'var(--card)', padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Focus topic */}
        {plan.focus_topic && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Focus:</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0e7490', background: 'rgba(14,116,144,.1)', border: '1px solid rgba(14,116,144,.2)', borderRadius: 8, padding: '2px 8px' }}>
              {plan.focus_topic}
            </span>
          </div>
        )}

        {plan.activities.map((act, i) => {
          const icon   = ACTIVITY_ICONS[act.id] || '📚';
          const screen = ACTIVITY_SCREENS[act.id];
          const isDone = done.has(i);
          return (
            <button
              key={i}
              onClick={() => {
                if (!screen || !setScr) return;
                markDone(i);
                setDone(getTodayDone());
                if (sCurEx) sCurEx(act.id);
                sessionStorage.setItem('nh_ex_start', Date.now().toString());
                setScr(screen);
              }}
              disabled={!screen}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 14, width: '100%',
                border: isDone ? '1.5px solid rgba(22,163,74,.3)' : '1.5px solid var(--card-b)',
                background: isDone ? 'rgba(22,163,74,.06)' : 'var(--bar-bg)',
                cursor: screen ? 'pointer' : 'default',
                fontFamily: "'Outfit',sans-serif", textAlign: 'left',
                transition: 'border-color .15s, background .15s',
                opacity: isDone ? 0.8 : 1,
              }}
            >
              {/* Icon */}
              <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: isDone ? 'rgba(22,163,74,.15)' : 'rgba(14,116,144,.1)',
                border: `1.5px solid ${isDone ? 'rgba(22,163,74,.3)' : 'rgba(14,116,144,.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>
                {isDone ? '✓' : icon}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: isDone ? 'var(--subtext)' : 'var(--heading)', textDecoration: isDone ? 'line-through' : 'none', lineHeight: 1.2 }}>
                    {act.title}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--subtext)', fontWeight: 600 }}>· {act.duration} min</span>
                  {act.priority === 'high' && !isDone && (
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#0e7490', background: 'rgba(14,116,144,.12)', borderRadius: 5, padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '.04em' }}>top pick</span>
                  )}
                </div>
                {act.reason && (
                  <div style={{ fontSize: 11, color: 'var(--subtext)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {act.reason}
                  </div>
                )}
              </div>

              {/* Chevron */}
              {screen && !isDone && (
                <div style={{ fontSize: 18, color: 'var(--subtext)', opacity: .4, flexShrink: 0 }}>›</div>
              )}
            </button>
          );
        })}

        {/* Motivational note */}
        {plan.motivational_note && (
          <div style={{ fontSize: 11, color: 'var(--subtext)', fontStyle: 'italic', borderTop: '1px solid var(--card-b)', paddingTop: 8, marginTop: 2, lineHeight: 1.5 }}>
            {plan.motivational_note}
          </div>
        )}
      </div>
    </div>
  );
}
