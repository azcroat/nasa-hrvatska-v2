// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib/apiFetch.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function getCurrentWeekKey() {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const year = d.getFullYear();
  const week = Math.ceil(((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function getMsUntilMonday() {
  const now = new Date();
  const nextMonday = new Date(now);
  const dow = now.getDay(); // 0=Sun, 1=Mon, …
  const daysUntilMon = dow === 0 ? 1 : 8 - dow;
  nextMonday.setDate(now.getDate() + daysUntilMon);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday.getTime() - now.getTime();
}

function formatCountdown(ms) {
  if (ms <= 0) return '0h 0m';
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${mins}m`;
}

const TIER_META = {
  diamond:  { name: 'Diamond',  icon: '💎', color: '#0e7490', gradient: 'linear-gradient(135deg,#0e7490,#164e63)', border: '#67e8f9' },
  platinum: { name: 'Platinum', icon: '🏆', color: '#7c3aed', gradient: 'linear-gradient(135deg,#7c3aed,#5b21b6)', border: '#c4b5fd' },
  gold:     { name: 'Gold',     icon: '🥇', color: '#d97706', gradient: 'linear-gradient(135deg,#d97706,#92400e)', border: '#fcd34d' },
  silver:   { name: 'Silver',   icon: '🥈', color: '#6b7280', gradient: 'linear-gradient(135deg,#6b7280,#374151)', border: '#d1d5db' },
  bronze:   { name: 'Bronze',   icon: '🥉', color: '#b45309', gradient: 'linear-gradient(135deg,#b45309,#78350f)', border: '#fcd34d' },
};

const ALL_TIERS = [
  { id: 'diamond',  name: 'Diamond',  icon: '💎', xp: '600+',    desc: 'Top 3 promoted to next tier' },
  { id: 'platinum', name: 'Platinum', icon: '🏆', xp: '300–599', desc: 'Top 3 promoted to Diamond' },
  { id: 'gold',     name: 'Gold',     icon: '🥇', xp: '100–299', desc: 'Top 3 promoted to Platinum' },
  { id: 'silver',   name: 'Silver',   icon: '🥈', xp: '50–99',   desc: 'Top 3 promoted to Gold' },
  { id: 'bronze',   name: 'Bronze',   icon: '🥉', xp: '0–49',    desc: 'Top 3 promoted to Silver' },
];

// ── Skeleton ───────────────────────────────────────────────────────────────

function Skeleton({ h = 16, w = '100%', r = 8, mb = 8 }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: r, marginBottom: mb,
      background: 'linear-gradient(90deg,var(--bar-bg) 25%,var(--card-b) 50%,var(--bar-bg) 75%)',
      backgroundSize: '200% 100%',
      animation: 'nh-shimmer 1.4s infinite',
    }} />
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function WeeklyLeague({ authUser: au, name, stats, goBack }) {
  const weekKey = getCurrentWeekKey();
  const myWeekXP = parseInt(localStorage.getItem('nh_week_xp_' + weekKey) || '0', 10);

  const [loading, setLoading]     = useState(true);
  const [joining, setJoining]     = useState(false);
  const [error, setError]         = useState('');
  const [data, setData]           = useState(null); // null = not joined yet
  const [countdown, setCountdown] = useState(getMsUntilMonday());
  const [showTiers, setShowTiers] = useState(false);

  // Live countdown ticker
  useEffect(() => {
    const id = setInterval(() => setCountdown(getMsUntilMonday()), 60000);
    return () => clearInterval(id);
  }, []);

  // Fetch standings on mount
  const fetchStandings = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await apiFetch(`/api/league?week=${encodeURIComponent(weekKey)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Server error ${res.status}`);
        setLoading(false);
        return;
      }
      const payload = await res.json();
      if (payload.notJoined) {
        setData(null);
      } else {
        setData(payload);
      }
    } catch (e) {
      setError('Could not load league data. Check your connection.');
    }
    setLoading(false);
  }, [weekKey]);

  useEffect(() => { fetchStandings(); }, [fetchStandings]);

  // Join (POST) — sends current week XP
  const handleJoin = useCallback(async () => {
    if (!au) { setError('You must be logged in to join the league.'); return; }
    setJoining(true); setError('');
    try {
      const res = await apiFetch('/api/league', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xp: myWeekXP, name: name || au.d || 'Learner', weekKey }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Server error ${res.status}`);
        setJoining(false);
        return;
      }
      const payload = await res.json();
      setData(payload);
    } catch (e) {
      setError('Could not join league. Check your connection.');
    }
    setJoining(false);
  }, [au, myWeekXP, name, weekKey]);

  // Sync XP whenever league data is loaded (keeps standings fresh)
  const handleSyncXP = useCallback(async () => {
    if (!data || !au) return;
    try {
      const res = await apiFetch('/api/league', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xp: myWeekXP, name: name || au.d || 'Learner', weekKey }),
      });
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Sync failed (${res.status})`);
      }
    } catch {
      setError('Could not sync XP. Check your connection.');
    }
  }, [data, au, myWeekXP, name, weekKey]);

  const tier = data?.tier ? TIER_META[data.tier.id] || TIER_META.bronze : TIER_META.bronze;
  const myRank = data?.rank ?? null;
  const total = data?.total ?? 0;

  // ── Shimmer CSS (injected once) ────────────────────────────────────────
  useEffect(() => {
    if (document.getElementById('nh-shimmer-style')) return;
    const s = document.createElement('style');
    s.id = 'nh-shimmer-style';
    s.textContent = `@keyframes nh-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`;
    document.head.appendChild(s);
  }, []);

  // ── Loading skeleton ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="scr-wrap">
        <Skeleton h={28} w="60%" mb={16} />
        <Skeleton h={80} mb={12} />
        <Skeleton h={56} mb={12} />
        {[1,2,3,4,5].map(i => <Skeleton key={i} h={56} mb={8} />)}
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  const errorBanner = error ? (
    <div style={{ background:'rgba(220,38,38,.08)', border:'1px solid rgba(220,38,38,.2)', borderRadius:10,
      padding:'10px 14px', color:'#dc2626', fontSize:13, fontWeight:600, marginBottom:14 }}>
      {error}
    </div>
  ) : null;

  // ── Not joined state ───────────────────────────────────────────────────
  if (!data) {
    return (
      <div className="scr-wrap">
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:20, fontWeight:900, color:'var(--heading)' }}>Weekly League</div>
            <div style={{ fontSize:12, color:'var(--subtext)', fontWeight:600 }}>Resets Monday · {formatCountdown(countdown)} left</div>
          </div>
          <div style={{ fontSize:11, padding:'4px 10px', borderRadius:8,
            background:'rgba(14,116,144,.08)', color:'var(--info)', fontWeight:700 }}>
            {weekKey}
          </div>
        </div>

        {errorBanner}

        {/* Join card */}
        <div style={{ background:'linear-gradient(135deg,#0e7490,#164e63)', borderRadius:18,
          padding:'28px 24px', marginBottom:20, textAlign:'center', color:'#fff' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🏆</div>
          <div style={{ fontSize:18, fontWeight:900, marginBottom:8 }}>Join This Week's League</div>
          <div style={{ fontSize:13, opacity:.85, marginBottom:20, lineHeight:1.5 }}>
            Compete against 29 other learners in your tier.<br/>
            Top 3 get promoted. Bottom 5 drop a tier.
          </div>
          <div style={{ fontSize:22, fontWeight:900, marginBottom:4 }}>
            {myWeekXP} XP
          </div>
          <div style={{ fontSize:11, opacity:.7, marginBottom:20 }}>earned this week</div>
          <button
            onClick={handleJoin}
            disabled={joining || !au}
            style={{
              background:'#fff', color:'#0e7490', border:'none', borderRadius:12,
              padding:'14px 32px', fontSize:15, fontWeight:900, cursor: joining||!au ? 'not-allowed':'pointer',
              opacity: joining||!au ? .6 : 1, fontFamily:"'Outfit',sans-serif",
            }}>
            {joining ? '⏳ Joining…' : !au ? 'Log in to join' : '🏆 Join League'}
          </button>
        </div>

        {/* Tier explanation */}
        <TierExplainer showTiers={showTiers} setShowTiers={setShowTiers} />
      </div>
    );
  }

  // ── Joined — full standings view ───────────────────────────────────────
  const members = data.members || [];
  const amInTop10 = members.some(m => m.uid === au?.u);
  const showMyRow = !amInTop10 && data.myMember;

  const xpToPromo = Math.max(0, (data.promotionXP || 0) - myWeekXP + 1);
  const _safeFromDemotion = (data.demotionXP || 0) > myWeekXP
    ? Math.max(0, (data.demotionXP || 0) - myWeekXP)
    : null;

  return (
    <div className="scr-wrap">
      {/* Header row */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:20, fontWeight:900, color:'var(--heading)' }}>Weekly League</div>
          <div style={{ fontSize:12, color:'var(--subtext)', fontWeight:600 }}>
            Resets Monday · <span style={{ color:'#e53e3e', fontWeight:800 }}>{formatCountdown(countdown)}</span> left
          </div>
        </div>
        <button
          onClick={handleSyncXP}
          title="Sync my XP"
          style={{ background:'var(--bar-bg)', border:'1px solid var(--card-b)', borderRadius:8,
            padding:'6px 10px', fontSize:12, cursor:'pointer', color:'var(--subtext)', fontWeight:700 }}>
          🔄
        </button>
      </div>

      {errorBanner}

      {/* Tier + Rank banner */}
      <div style={{
        background: tier.gradient,
        borderRadius: 16,
        padding: '16px 18px',
        marginBottom: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        color: '#fff',
      }}>
        <div style={{ fontSize: 40, lineHeight: 1 }}>{tier.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 900 }}>{tier.name} League</div>
          <div style={{ fontSize: 12, opacity: .8, marginTop: 2 }}>
            {myRank != null ? `Rank #${myRank} of ${total}` : 'Calculating rank…'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 24, fontWeight: 900 }}>{myWeekXP}</div>
          <div style={{ fontSize: 10, opacity: .75, fontWeight: 700, textTransform: 'uppercase' }}>XP this week</div>
        </div>
      </div>

      {/* Promotion / Demotion info */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {/* Promotion */}
        <div style={{
          flex:1, background: data.inPromotionZone ? 'rgba(22,163,74,.1)' : 'var(--card)',
          border: `1.5px solid ${data.inPromotionZone ? '#86efac' : 'var(--card-b)'}`,
          borderRadius:12, padding:'10px 12px',
        }}>
          <div style={{ fontSize:11, fontWeight:800, color: data.inPromotionZone ? '#16a34a':'var(--subtext)', marginBottom:3 }}>
            {data.inPromotionZone ? '✅ Promotion zone!' : '⬆ Promotion'}
          </div>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--heading)' }}>
            {data.inPromotionZone
              ? 'Top 3 — keep it up!'
              : `Need ${xpToPromo} more XP`}
          </div>
          <div style={{ fontSize:10, color:'var(--subtext)', marginTop:2 }}>Top 3 advance next week</div>
        </div>
        {/* Demotion */}
        <div style={{
          flex:1, background: data.inDemotionZone ? 'rgba(220,38,38,.06)' : 'var(--card)',
          border: `1.5px solid ${data.inDemotionZone ? '#fca5a5' : 'var(--card-b)'}`,
          borderRadius:12, padding:'10px 12px',
        }}>
          <div style={{ fontSize:11, fontWeight:800, color: data.inDemotionZone ? '#dc2626':'var(--subtext)', marginBottom:3 }}>
            {data.inDemotionZone ? '⚠ Demotion risk!' : '🛡 Safe zone'}
          </div>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--heading)' }}>
            {data.inDemotionZone
              ? 'Earn more to stay!'
              : 'Not in bottom 5'}
          </div>
          <div style={{ fontSize:10, color:'var(--subtext)', marginTop:2 }}>Bottom 5 drop a tier</div>
        </div>
      </div>

      {/* Leaderboard — top 10 */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize:11, fontWeight:800, color:'var(--subtext)', letterSpacing:'.08em',
          textTransform:'uppercase', marginBottom:10 }}>
          Top 10 This Week
        </div>

        {members.length === 0 && (
          <div className="c" style={{ textAlign:'center', color:'var(--subtext)', padding:20 }}>
            No members yet this week.
          </div>
        )}

        {members.map((m, i) => {
          const isMe = m.uid === au?.u || m.uid === au?.uid || m.uid === au?.uid;
          const rank = m.rank ?? i + 1;
          const rankMedal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
          const inPromo = rank <= 3;
          const inDemotion = rank > (total - 5) && total >= 5;
          const barColor = inPromo ? '#16a34a' : inDemotion ? '#e53e3e' : '#0e7490';
          const maxXP = members[0]?.xp || 1;

          return (
            <div
              key={m.uid || i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 12,
                marginBottom: 6,
                background: isMe
                  ? 'linear-gradient(135deg,rgba(14,116,144,.12),rgba(14,116,144,.06))'
                  : inPromo
                    ? 'rgba(22,163,74,.04)'
                    : inDemotion
                      ? 'rgba(220,38,38,.04)'
                      : 'var(--card)',
                border: isMe
                  ? '1.5px solid rgba(14,116,144,.35)'
                  : inPromo
                    ? '1px solid rgba(22,163,74,.2)'
                    : inDemotion
                      ? '1px solid rgba(220,38,38,.15)'
                      : '1px solid var(--card-b)',
              }}
            >
              {/* Rank badge */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: rankMedal ? 22 : 14, fontWeight: 900,
                background: inPromo
                  ? 'linear-gradient(135deg,#16a34a,#15803d)'
                  : inDemotion
                    ? 'linear-gradient(135deg,#e53e3e,#b91c1c)'
                    : 'var(--bar-bg)',
                color: inPromo || inDemotion ? '#fff' : 'var(--subtext)',
              }}>
                {rankMedal || `#${rank}`}
              </div>

              {/* Name + bar */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--heading)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 6 }}>
                  {m.name || 'Learner'}
                  {isMe && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#0e7490',
                      background: 'rgba(14,116,144,.1)', borderRadius: 6, padding: '2px 6px' }}>
                      You
                    </span>
                  )}
                </div>
                <div style={{ height: 3, background: 'var(--bar-bg)', borderRadius: 2, marginTop: 4, maxWidth: 120 }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.round((m.xp / maxXP) * 100)}%`,
                    background: barColor,
                    borderRadius: 2,
                    transition: 'width .5s ease',
                  }} />
                </div>
              </div>

              {/* XP */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: barColor }}>{m.xp}</div>
                <div style={{ fontSize: 9, color: 'var(--subtext)', fontWeight: 700, textTransform: 'uppercase' }}>XP</div>
              </div>
            </div>
          );
        })}

        {/* Show my row if I'm outside top 10 */}
        {showMyRow && (
          <>
            <div style={{ textAlign:'center', color:'var(--subtext)', fontSize:12, padding:'4px 0', fontWeight:600 }}>
              · · ·
            </div>
            {(() => {
              const m = data.myMember;
              const rank = m.rank;
              const inDemotion = rank > (total - 5) && total >= 5;
              const maxXP = members[0]?.xp || 1;
              return (
                <div style={{
                  display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
                  borderRadius:12, marginBottom:6,
                  background:'linear-gradient(135deg,rgba(14,116,144,.12),rgba(14,116,144,.06))',
                  border:'1.5px solid rgba(14,116,144,.35)',
                }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', flexShrink:0,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:14, fontWeight:900, background:'var(--bar-bg)', color:'var(--subtext)' }}>
                    #{rank}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--heading)',
                      display:'flex', alignItems:'center', gap:6 }}>
                      {m.name || 'Learner'}
                      <span style={{ fontSize:10, fontWeight:700, color:'#0e7490',
                        background:'rgba(14,116,144,.1)', borderRadius:6, padding:'2px 6px' }}>
                        You
                      </span>
                    </div>
                    <div style={{ height:3, background:'var(--bar-bg)', borderRadius:2, marginTop:4, maxWidth:120 }}>
                      <div style={{ height:'100%', width:`${Math.round((m.xp/maxXP)*100)}%`,
                        background: inDemotion ? '#e53e3e' : '#0e7490', borderRadius:2 }} />
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:15, fontWeight:800, color: inDemotion?'#e53e3e':'#0e7490' }}>{m.xp}</div>
                    <div style={{ fontSize:9, color:'var(--subtext)', fontWeight:700, textTransform:'uppercase' }}>XP</div>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* Tier explainer */}
      <TierExplainer showTiers={showTiers} setShowTiers={setShowTiers} currentTierId={data?.tier?.id} />
    </div>
  );
}

// ── Tier Explainer (collapsible) ──────────────────────────────────────────

function TierExplainer({ showTiers, setShowTiers, currentTierId = null }) {
  return (
    <div style={{ marginTop:8 }}>
      <button
        onClick={() => setShowTiers(v => !v)}
        style={{ width:'100%', background:'var(--card)', border:'1px solid var(--card-b)',
          borderRadius:12, padding:'12px 16px', cursor:'pointer', textAlign:'left',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          fontSize:13, fontWeight:700, color:'var(--heading)', fontFamily:"'Outfit',sans-serif" }}>
        <span>🏅 How Leagues Work</span>
        <span style={{ color:'var(--subtext)', fontSize:16 }}>{showTiers ? '▲' : '▼'}</span>
      </button>

      {showTiers && (
        <div style={{ background:'var(--card)', border:'1px solid var(--card-b)',
          borderRadius:12, padding:'14px 16px', marginTop:4 }}>
          <div style={{ fontSize:12, color:'var(--subtext)', marginBottom:12, lineHeight:1.6 }}>
            Each week you compete in a group of up to 30 learners. Earn XP by completing lessons, streaks, and quests.
            <br/><br/>
            <strong style={{ color:'#16a34a' }}>Top 3</strong> get promoted to the next tier next week.
            <br/>
            <strong style={{ color:'#e53e3e' }}>Bottom 5</strong> drop to the tier below.
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {ALL_TIERS.map(t => {
              const isCurrent = t.id === currentTierId;
              const tm = TIER_META[t.id];
              return (
                <div key={t.id} style={{
                  display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
                  borderRadius:10,
                  background: isCurrent ? `${tm.color}15` : 'var(--bar-bg)',
                  border: isCurrent ? `1.5px solid ${tm.border}` : '1px solid transparent',
                }}>
                  <span style={{ fontSize:20 }}>{t.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:800, color: isCurrent ? tm.color : 'var(--heading)' }}>
                      {t.name}
                      {isCurrent && <span style={{ fontSize:10, marginLeft:6, opacity:.7 }}>← you're here</span>}
                    </div>
                    <div style={{ fontSize:10, color:'var(--subtext)' }}>{t.desc}</div>
                  </div>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--subtext)' }}>{t.xp} XP</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
