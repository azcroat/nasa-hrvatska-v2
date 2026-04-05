import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/apiFetch.js';
import { getErrorLog } from '../../hooks/useErrorTracking';

// ── Constants ─────────────────────────────────────────────────────────────────
const BRAND_TEAL = '#0e7490';
const BRAND_TEAL_DIM = 'rgba(14,116,144,0.08)';
const BRAND_TEAL_BORDER = '#0e7490';

function _todayKey() {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function _cacheKey(uid) {
  return `nh_insights_cache_${uid}_${_todayKey()}`;
}

function _loadCache(uid) {
  try {
    return JSON.parse(localStorage.getItem(_cacheKey(uid)) || 'null');
  } catch {
    return null;
  }
}

function _saveCache(uid, data) {
  try {
    localStorage.setItem(_cacheKey(uid), JSON.stringify(data));
  } catch {}
}

function _loadSRWeakWords() {
  try {
    const sr = JSON.parse(localStorage.getItem('nh_sr') || '{}');
    // Return words where wrong > right and have at least 3 attempts
    return Object.entries(sr)
      .filter(([, v]) => {
        const r = v.r || 0;
        const w = v.w || 0;
        return w > r && (r + w) >= 3;
      })
      .map(([word, v]) => ({ word, right: v.r || 0, wrong: v.w || 0 }))
      .sort((a, b) => (b.wrong - b.right) - (a.wrong - a.right))
      .slice(0, 10);
  } catch {
    return [];
  }
}

// ── Severity dot ──────────────────────────────────────────────────────────────
function SeverityDot({ severity }) {
  const color = severity === 'high' ? '#D4002D'
    : severity === 'medium' ? '#d97706'
    : '#16a34a';
  return (
    <span style={{
      display: 'inline-block',
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: color,
      marginRight: 6,
      flexShrink: 0,
    }} />
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ padding: '2px 0' }}>
      {[80, 100, 65].map((w, i) => (
        <div
          key={`skeleton-${w}`}
          style={{
            height: 13,
            width: `${w}%`,
            background: 'var(--card-b)',
            borderRadius: 6,
            marginBottom: i < 2 ? 10 : 0,
            opacity: 0.6,
          }}
        />
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
      padding: '18px 12px',
      textAlign: 'center',
    }}>
      <span style={{ fontSize: 32 }}>🎯</span>
      <div style={{
        fontSize: 14,
        color: 'var(--subtext)',
        lineHeight: 1.5,
        maxWidth: 260,
      }}>
        Complete a few lessons and I'll personalize your practice!
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * AdaptiveInsightsCard
 *
 * @param {{
 *   uid: string,
 *   level?: string,
 *   lessonsCompleted?: number,
 *   goToScreen?: (screen: string) => void
 * }} props
 */
export default function AdaptiveInsightsCard({ uid, level = 'A2', lessonsCompleted = 0, goToScreen }) {
  const [phase, setPhase] = useState('loading'); // 'loading' | 'ready' | 'empty'
  const [insights, setInsights] = useState(null);

  const fetchInsights = useCallback(async () => {
    if (!uid) { setPhase('empty'); return; }

    // 1. Check cache first — show immediately if available
    const cached = _loadCache(uid);
    if (cached) {
      setInsights(cached);
      setPhase('ready');
      return;
    }

    // 2. Check if user has any error data
    const errorLog = getErrorLog(uid);
    const weakWords = _loadSRWeakWords();

    // New users with no data at all → empty state
    if (errorLog.length === 0 && weakWords.length === 0 && lessonsCompleted < 3) {
      setPhase('empty');
      return;
    }

    // 3. Fetch from API
    setPhase('loading');
    try {
      const data = await apiFetch('/api/adaptive-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          level,
          lessonsCompleted,
          errorLog,
          weakWords,
        }),
      });
      _saveCache(uid, data);
      setInsights(data);
      setPhase('ready');
    } catch {
      // On failure, show empty rather than an error (graceful degradation)
      setPhase('empty');
    }
  }, [uid, level, lessonsCompleted]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--card-b)',
      borderRadius: 16,
      overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '14px 16px 10px',
        borderBottom: '1px solid var(--card-b)',
      }}>
        <span style={{ fontSize: 20 }}>🧠</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--heading)' }}>
            Your Focus Today
          </div>
          <div style={{ fontSize: 11, color: 'var(--subtext)' }}>
            Personalized practice recommendations
          </div>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px 16px' }}>

        {/* Loading skeleton */}
        {phase === 'loading' && <Skeleton />}

        {/* Empty state */}
        {phase === 'empty' && <EmptyState />}

        {/* Ready: show insights */}
        {phase === 'ready' && insights && (
          <div>
            {/* todaysFocus */}
            {insights.todaysFocus && (
              <div style={{
                background: BRAND_TEAL_DIM,
                border: `1px solid ${BRAND_TEAL_BORDER}`,
                borderRadius: 10,
                padding: '10px 13px',
                fontSize: 14,
                color: 'var(--heading)',
                lineHeight: 1.55,
                marginBottom: 14,
              }}>
                {insights.todaysFocus}
              </div>
            )}

            {/* weakAreas badges */}
            {insights.weakAreas && insights.weakAreas.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--subtext)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  marginBottom: 8,
                }}>
                  Areas to strengthen
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {insights.weakAreas.slice(0, 2).map((area, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        background: 'var(--card-b)',
                        borderRadius: 20,
                        padding: '5px 12px',
                        alignSelf: 'flex-start',
                        maxWidth: '100%',
                      }}
                    >
                      <SeverityDot severity={area.severity} />
                      <span style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--heading)',
                      }}>
                        {area.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* drillSuggestions */}
            {insights.drillSuggestions && insights.drillSuggestions.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--subtext)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  marginBottom: 8,
                }}>
                  Quick drills
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {insights.drillSuggestions.slice(0, 2).map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => goToScreen && goToScreen(suggestion.screen)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: BRAND_TEAL_DIM,
                        border: `1.5px solid ${BRAND_TEAL}`,
                        borderRadius: 20,
                        padding: '7px 16px',
                        fontSize: 13,
                        fontWeight: 700,
                        color: BRAND_TEAL,
                        cursor: goToScreen ? 'pointer' : 'default',
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      {suggestion.icon && (
                        <span style={{ fontSize: 15 }}>{suggestion.icon}</span>
                      )}
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* encouragement */}
            {insights.encouragement && (
              <div style={{
                fontSize: 13,
                fontStyle: 'italic',
                color: 'var(--subtext)',
                lineHeight: 1.5,
                borderTop: '1px solid var(--card-b)',
                paddingTop: 12,
              }}>
                {insights.encouragement}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
