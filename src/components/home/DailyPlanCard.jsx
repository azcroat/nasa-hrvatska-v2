import React, { useEffect, useState, useCallback, useContext } from 'react';
import { getSR, getStreak } from '../../data.jsx';
import AppContext from '../../context/AppContext.jsx';
import CroatianGrb from '../shared/CroatianGrb.jsx';
import { getStyleContextForAPI } from '../../lib/learnerStyle.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const CACHE_KEY    = 'nh_daily_plan';
const CACHE_TTL_MS = 86400000; // 24 hours

const ACTIVITY_ICONS = {
  flashcards:        '🃏',
  srsreview:         '🔁',
  ai_listening:      '🎧',
  speaking:          '🎤',
  writing:           '✍️',
  grammar_diagnosis: '🔬',
  dialogue:          '💬',
  shadowing:         '🗣️',
  aspectdrill:       '🔄',
};

// Map activity IDs to app screen IDs
const ACTIVITY_SCREENS = {
  flashcards:        'flashcards',
  srsreview:         'review',
  ai_listening:      'listening',
  speaking:          'speaking',
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
  } catch {
    // localStorage quota exceeded — silently ignore
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LoadingDots() {
  const [dots, setDots] = useState('.');
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ padding: '18px 0', textAlign: 'center', color: 'var(--subtext)', fontSize: 14 }}>
      Maja priprema tvoj plan{dots}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DailyPlanCard() {
  const { setScr } = useContext(AppContext);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'loading' | 'ready' | 'error'
  const [plan, setPlan]   = useState(null);
  const [streak, setStreak] = useState(0);

  // ── Collect learner data ──
  const collectPayload = useCallback(() => {
    const level = localStorage.getItem('nh_level') || 'B1';

    const srData     = getSR();
    const srWeakWords = Object.entries(srData)
      .filter(([, v]) => v.w > 0)
      .sort((a, b) => (b[1].w / (b[1].r + 1)) - (a[1].w / (a[1].r + 1)))
      .slice(0, 8)
      .map(([w]) => w);

    const majaMemory  = JSON.parse(localStorage.getItem('majaMemory') || '{}');
    const majaPatterns = Array.isArray(majaMemory.mistakePatterns)
      ? majaMemory.mistakePatterns.slice(0, 10)
      : [];

    const goal   = localStorage.getItem('nh_goal') || 'fluent';
    const streak = getStreak();

    // Recent activity counts from localStorage session markers
    const today = new Date().toISOString().slice(0, 10);
    const recentActivity = {
      flashcards: parseInt(localStorage.getItem('nh_session_flashcards_' + today) || '0', 10),
      listening:  parseInt(localStorage.getItem('nh_session_listening_' + today)  || '0', 10),
      speaking:   parseInt(localStorage.getItem('nh_session_speaking_' + today)   || '0', 10),
      writing:    parseInt(localStorage.getItem('nh_session_writing_' + today)    || '0', 10),
      lastActive: parseInt(localStorage.getItem('nh_last_active') || '0', 10),
    };

    return { level, srWeakWords, majaPatterns, recentActivity, goal, streak: streak.count ?? streak };
  }, []);

  // ── Fetch plan from API ──
  const fetchPlan = useCallback(async () => {
    setPhase('loading');
    try {
      const payload = collectPayload();
      const res = await fetch('/api/daily-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, stylePreferences: getStyleContextForAPI() }),
      });
      if (!res.ok) throw new Error('API error ' + res.status);
      const data = await res.json();
      if (!Array.isArray(data.activities) || data.activities.length !== 3) {
        throw new Error('Invalid plan structure');
      }
      savePlanToCache(data);
      setPlan(data);
      setPhase('ready');
    } catch (e) {
      console.warn('DailyPlanCard: fetch failed —', e.message);
      setPhase('error');
    }
  }, [collectPayload]);

  // ── On mount: check cache, else auto-fetch ──
  useEffect(() => {
    const streakObj = getStreak();
    setStreak(typeof streakObj === 'object' ? (streakObj.count ?? 0) : (streakObj ?? 0));

    const cached = loadCachedPlan();
    if (cached) {
      setPlan(cached);
      setPhase('ready');
    } else {
      fetchPlan();
    }
  }, [fetchPlan]);

  // ── Error: render nothing ──
  if (phase === 'error') return null;

  // ── Loading ──
  if (phase === 'loading' || phase === 'idle') {
    return (
      <div className="c" style={{ borderLeft: '4px solid #0e7490', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <CroatianGrb size={20} />
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--heading)', letterSpacing: 0.3 }}>
            Dnevni Plan
          </span>
        </div>
        <LoadingDots />
      </div>
    );
  }

  // ── Ready ──
  if (phase !== 'ready' || !plan) return null;

  return (
    <div className="c" style={{ borderLeft: '4px solid #0e7490', marginBottom: 12 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CroatianGrb size={20} />
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--heading)', letterSpacing: 0.3 }}>
            Dnevni Plan
          </span>
          {getStyleContextForAPI() !== null && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: 'var(--info)',
              background: 'var(--info-bg)', border: '1px solid var(--info-b)',
              borderRadius: 6, padding: '2px 6px', marginLeft: 6,
            }}>
              ✨ Personalized
            </span>
          )}
        </div>
        {streak > 0 && (
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            background: 'rgba(251,146,60,0.15)',
            color: '#c2410c',
            borderRadius: 10,
            padding: '2px 8px',
          }}>
            🔥 {streak} day streak
          </span>
        )}
      </div>

      {/* Greeting */}
      {plan.greeting && (
        <div style={{
          fontFamily: '"Playfair Display", serif',
          fontStyle: 'italic',
          fontSize: 14,
          color: 'var(--heading)',
          marginBottom: 3,
          lineHeight: 1.4,
        }}>
          "{plan.greeting}"
        </div>
      )}

      {/* Subtitle */}
      <div style={{ fontSize: 11, color: 'var(--subtext)', marginBottom: 7 }}>
        Your 15-min plan for today
      </div>

      {/* Focus topic pill */}
      {plan.focus_topic && (
        <div style={{ marginBottom: 8 }}>
          <span style={{
            display: 'inline-block',
            background: '#0e7490',
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 10,
            padding: '2px 10px',
            letterSpacing: 0.2,
          }}>
            {plan.focus_topic}
          </span>
        </div>
      )}

      {/* Activity rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
        {plan.activities.map((act, i) => {
          const icon   = ACTIVITY_ICONS[act.id] || '📚';
          const screen = ACTIVITY_SCREENS[act.id];
          return (
            <div
              key={i}
              onClick={() => screen && setScr && setScr(screen)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '6px 8px',
                borderRadius: 8,
                cursor: screen ? 'pointer' : 'default',
                background: 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (screen) e.currentTarget.style.background = 'rgba(14,116,144,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              role={screen ? 'button' : undefined}
              tabIndex={screen ? 0 : undefined}
              onKeyDown={e => { if (screen && (e.key === 'Enter' || e.key === ' ')) setScr && setScr(screen); }}
            >
              {/* Icon circle */}
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(14,116,144,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                flexShrink: 0,
                marginTop: 1,
              }}>
                {icon}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--heading)' }}>
                    {act.title}
                  </span>
                  <span style={{ color: 'var(--subtext)', fontSize: 11 }}>
                    · {act.duration}min
                  </span>
                  {act.priority === 'high' && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#0e7490',
                      background: 'rgba(14,116,144,0.1)',
                      borderRadius: 6,
                      padding: '1px 5px',
                    }}>
                      ★
                    </span>
                  )}
                </div>
                {act.reason && (
                  <div style={{
                    fontSize: 11,
                    color: 'var(--subtext)',
                    marginTop: 1,
                    lineHeight: 1.35,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {act.reason}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Motivational note */}
      {plan.motivational_note && (
        <div style={{
          fontSize: 11,
          color: 'var(--subtext)',
          fontStyle: 'italic',
          borderTop: '1px solid rgba(14,116,144,0.15)',
          paddingTop: 6,
          lineHeight: 1.4,
        }}>
          {plan.motivational_note}
        </div>
      )}
    </div>
  );
}
