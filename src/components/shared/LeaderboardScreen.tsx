// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { subscribeToLeaderboard, getMyRank, getLeagueForRank, LEAGUES, getWeekKey } from '../../lib/leaderboard.js';

// ── Tier order for promotion comparison (lower index = worse tier) ──
const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

function getTierProgress(rank) {
  if (!rank) return null;
  if (rank <= 3)  return { message: '👑 You\'re at the top — defend your crown!', isTop: true };
  if (rank <= 10) return { message: `You're #${rank} — reach top 3 for Diamond 👑`, isTop: false };
  if (rank <= 20) return { message: `You're #${rank} — reach top 10 for Platinum 💎`, isTop: false };
  if (rank <= 40) return { message: `You're #${rank} — reach top 20 for Gold 🥇`, isTop: false };
  return { message: 'Earn more XP to reach Silver (top 40)', isTop: false };
}

function daysUntilMonday() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, …, 6=Sat
  // days until next Monday
  const diff = day === 1 ? 7 : (8 - day) % 7;
  return diff === 0 ? 7 : diff;
}

export default function LeaderboardScreen({ db, user, weekXP = 0, goBack }) {
  const [entries, setEntries] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [league, setLeague] = useState(LEAGUES[0]);

  // Rank trend state
  const [rankTrend, setRankTrend] = useState(null); // { delta, dir: 'up'|'down'|'same' }

  // Promotion celebration state
  const [promotionTier, setPromotionTier] = useState(null); // tier name string, or null

  // user has shape { u: uid/email, d: displayName, e: email }
  const uid = user?.u;

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    // Real-time subscription — updates arrive within 1-2s when any user earns XP
    const unsub = subscribeToLeaderboard(db, 50, (data) => {
      if (!mounted) return;
      setEntries(data);
      setLoading(false);
    });

    // Rank is derived from a broader query (top 200) so keep as one-time call
    getMyRank(db, uid).then(rank => {
      if (!mounted) return;
      setMyRank(rank);

      if (rank) {
        const currentLeague = getLeagueForRank(rank);
        setLeague(currentLeague);

        // ── Rank trend ──
        const lastRankRaw = localStorage.getItem('nh_last_week_rank');
        const lastRank = lastRankRaw ? parseInt(lastRankRaw, 10) : null;
        if (lastRank && !isNaN(lastRank)) {
          const delta = lastRank - rank; // positive = improved (lower rank number is better)
          if (delta > 0)      setRankTrend({ delta, dir: 'up' });
          else if (delta < 0) setRankTrend({ delta: Math.abs(delta), dir: 'down' });
          else                setRankTrend({ delta: 0, dir: 'same' });
        }
        // Update stored rank for next week
        localStorage.setItem('nh_last_week_rank', String(rank));

        // ── Promotion celebration ──
        const lastTier = localStorage.getItem('nh_last_league_tier');
        if (lastTier && lastTier !== currentLeague.id) {
          const lastIdx = TIER_ORDER.indexOf(lastTier);
          const currIdx = TIER_ORDER.indexOf(currentLeague.id);
          if (currIdx > lastIdx) {
            setPromotionTier(currentLeague.name);
          }
        }
        localStorage.setItem('nh_last_league_tier', currentLeague.id);
      }
    });

    return () => { mounted = false; unsub(); };
  }, [db, uid]);

  const _myEntry = { uid, displayName: user?.d || 'You', xp: weekXP, rank: myRank };

  // ── Nearby rivals ──
  // Find user's index in the top-50 list
  const myIndexInList = entries.findIndex(e => e.uid === uid);
  const isInTopList = myIndexInList !== -1;
  // "Neighborhood" = 2 above + 2 below, only if user is NOT already visible in top 10
  const showNeighborhood = isInTopList && myIndexInList > 9;
  const neighborhoodIndices = showNeighborhood
    ? new Set([
        myIndexInList - 2, myIndexInList - 1,
        myIndexInList,
        myIndexInList + 1, myIndexInList + 2,
      ].filter(i => i >= 0 && i < entries.length))
    : new Set();

  const tierProgress = getTierProgress(myRank);
  const daysLeft = daysUntilMonday();

  return (
    <div className="scr-wrap">
      {/* Promotion celebration banner */}
      {promotionTier && (
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b22, #f59e0b11)',
          border: '1.5px solid #f59e0b88',
          borderRadius: 14,
          padding: '12px 18px',
          marginBottom: 16,
          textAlign: 'center',
          fontSize: 'var(--text-sm)',
          fontWeight: 700,
          color: '#f59e0b',
        }}>
          🎉 You moved up to {promotionTier}! Keep going!
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button onClick={goBack} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--heading)' }} aria-label="Go back">←</button>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:'var(--heading)', margin:0, flex:1 }}>Weekly Leaderboard</h2>
        {/* Weekly reset countdown */}
        <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', fontWeight:600, whiteSpace:'nowrap' }}>
          🔄 Resets in {daysLeft}d
        </div>
      </div>

      {/* Current league card */}
      <div style={{ background:`linear-gradient(135deg, ${league.color}22, ${league.color}11)`,
        border:`1.5px solid ${league.color}44`, borderRadius:16, padding:'16px 20px', marginBottom:8,
        display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:'var(--text-xs)', fontWeight:700, color:'var(--subtext)', textTransform:'uppercase', letterSpacing:'.08em' }}>Your League</div>
          <div style={{ fontSize:22, fontWeight:900, color: league.color, marginTop:4 }}>
            {league.icon} {league.name}
          </div>
          {myRank && (
            <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', marginTop:2, display:'flex', alignItems:'center', gap:6 }}>
              Rank #{myRank} this week
              {/* Rank trend indicator */}
              {rankTrend && rankTrend.dir === 'up' && (
                <span style={{ color:'#22c55e', fontWeight:800 }}>▲ +{rankTrend.delta}</span>
              )}
              {rankTrend && rankTrend.dir === 'down' && (
                <span style={{ color:'#ef4444', fontWeight:800 }}>▼ -{rankTrend.delta}</span>
              )}
              {rankTrend && rankTrend.dir === 'same' && (
                <span style={{ color:'var(--subtext)', fontWeight:700 }}>—</span>
              )}
            </div>
          )}
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', fontWeight:700 }}>Week</div>
          <div style={{ fontSize:13, fontWeight:800, color:'var(--info)' }}>{getWeekKey()}</div>
          <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', marginTop:2 }}>Your XP: <strong>{weekXP}</strong></div>
        </div>
      </div>

      {/* Tier progress indicator */}
      {tierProgress && myRank && (
        <div style={{
          padding: '8px 16px',
          marginBottom: 16,
          borderRadius: 10,
          background: tierProgress.isTop ? `${league.color}18` : 'var(--bar-bg)',
          border: `1px solid ${tierProgress.isTop ? league.color + '44' : 'transparent'}`,
          fontSize: 'var(--text-xs)',
          color: tierProgress.isTop ? league.color : 'var(--subtext)',
          fontWeight: 600,
          textAlign: 'center',
        }}>
          {tierProgress.message}
        </div>
      )}

      {/* League tiers */}
      <div style={{ display:'flex', gap:6, marginBottom:16, overflowX:'auto', paddingBottom:4 }}>
        {LEAGUES.slice().reverse().map(l => (
          <div key={l.id} style={{ flex:'0 0 auto', padding:'6px 12px', borderRadius:20,
            background: l.id === league.id ? `${l.color}33` : 'var(--bar-bg)',
            border: l.id === league.id ? `1.5px solid ${l.color}` : '1.5px solid transparent',
            fontSize:'var(--text-xs)', fontWeight:700, color: l.id === league.id ? l.color : 'var(--subtext)',
            whiteSpace:'nowrap' }}>
            {l.icon} {l.name}
          </div>
        ))}
      </div>

      {/* Leaderboard list */}
      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'var(--subtext)' }}>Loading rankings…</div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign:'center', padding:40 }}>
          <div style={{ fontSize:40 }}>🏆</div>
          <p style={{ color:'var(--subtext)', marginTop:12 }}>No entries yet this week.<br/>Complete lessons to get ranked!</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {entries.map((e, i) => {
            const isMe = e.uid === uid;
            const entryLeague = getLeagueForRank(e.rank);
            const isNeighbor = !isMe && neighborhoodIndices.has(i);
            const isNeighborhoodStart = showNeighborhood && i === Math.max(0, myIndexInList - 2) && myIndexInList > 9;

            return (
              <React.Fragment key={e.uid || i}>
                {/* "Your neighborhood" separator */}
                {isNeighborhoodStart && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0',
                  }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--card-b)' }} />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      Your neighborhood
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'var(--card-b)' }} />
                  </div>
                )}
                <div style={{
                  display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
                  borderRadius:14,
                  background: isMe ? 'var(--info-bg)' : isNeighbor ? 'var(--bar-bg)' : 'var(--card)',
                  border: isMe ? '1.5px solid var(--info-b, rgba(14,116,144,0.3))' : isNeighbor ? '1px solid var(--card-b)' : '1px solid var(--card-b)',
                  boxShadow: isMe ? '0 2px 12px rgba(14,116,144,.1)' : 'none',
                }}>
                  <div style={{ width:28, textAlign:'center', fontSize:e.rank <= 3 ? 20 : 13,
                    fontWeight:900, color: e.rank === 1 ? 'var(--medal-gold, #f59e0b)' : e.rank === 2 ? 'var(--medal-silver, #94a3b8)' : e.rank === 3 ? 'var(--medal-bronze, #cd7f32)' : 'var(--subtext)' }}>
                    {e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : `#${e.rank}`}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:'var(--text-sm)', color:'var(--heading)',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {isMe ? '⚡ You' : e.displayName}
                    </div>
                    <div style={{ fontSize:'var(--text-xs)', color: entryLeague.color, fontWeight:600 }}>
                      {entryLeague.icon} {entryLeague.name}
                    </div>
                  </div>
                  <div style={{ fontWeight:900, fontSize:15, color: isMe ? 'var(--info)' : 'var(--heading)' }}>
                    {e.xp} <span style={{ fontSize:11, fontWeight:600, color:'var(--subtext)' }}>XP</span>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* My rank if not in top 50 */}
      {myRank && myRank > 50 && (
        <div style={{ marginTop:16, padding:'12px 16px', borderRadius:14,
          background:'var(--info-bg)', border:'1.5px solid var(--info-b, rgba(14,116,144,0.2))',
          display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ fontWeight:900, color:'var(--info)' }}>#{myRank}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:'var(--text-sm)' }}>⚡ You</div>
            <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)' }}>Keep earning XP to climb the ranks!</div>
          </div>
          <div style={{ fontWeight:900, fontSize:15, color:'var(--info)' }}>{weekXP} XP</div>
        </div>
      )}
    </div>
  );
}
