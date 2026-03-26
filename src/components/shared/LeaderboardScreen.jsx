import React, { useState, useEffect } from 'react';
import { getLeaderboard, getMyRank, getLeagueForRank, LEAGUES, getWeekKey } from '../../lib/leaderboard.js';

export default function LeaderboardScreen({ db, user, weekXP = 0, goBack }) {
  const [entries, setEntries] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [league, setLeague] = useState(LEAGUES[0]);

  // user has shape { u: uid/email, d: displayName, e: email }
  const uid = user?.u;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getLeaderboard(db, 50);
      setEntries(data);
      const rank = await getMyRank(db, uid);
      setMyRank(rank);
      if (rank) setLeague(getLeagueForRank(rank));
      setLoading(false);
    }
    load();
  }, [db, uid]);

  const myEntry = { uid, displayName: user?.d || 'You', xp: weekXP, rank: myRank };

  return (
    <div className="scr-wrap">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button onClick={goBack} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--heading)' }} aria-label="Go back">←</button>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:'var(--heading)', margin:0 }}>Weekly Leaderboard</h2>
      </div>

      {/* Current league card */}
      <div style={{ background:`linear-gradient(135deg, ${league.color}22, ${league.color}11)`,
        border:`1.5px solid ${league.color}44`, borderRadius:16, padding:'16px 20px', marginBottom:20,
        display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:'var(--text-xs)', fontWeight:700, color:'var(--subtext)', textTransform:'uppercase', letterSpacing:'.08em' }}>Your League</div>
          <div style={{ fontSize:22, fontWeight:900, color: league.color, marginTop:4 }}>{league.icon} {league.name}</div>
          {myRank && <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', marginTop:2 }}>Rank #{myRank} this week</div>}
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', fontWeight:700 }}>Week</div>
          <div style={{ fontSize:13, fontWeight:800, color:'var(--info)' }}>{getWeekKey()}</div>
          <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', marginTop:2 }}>Your XP: <strong>{weekXP}</strong></div>
        </div>
      </div>

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
            return (
              <div key={e.uid || i} style={{
                display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
                borderRadius:14, background: isMe ? 'var(--info-bg)' : 'var(--card)',
                border: isMe ? '1.5px solid var(--info-b, rgba(14,116,144,0.3))' : '1px solid var(--card-b)',
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
