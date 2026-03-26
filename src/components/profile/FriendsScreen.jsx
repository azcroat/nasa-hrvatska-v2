import React, { useState, useEffect } from 'react';
import { fbCreateFamily, fbJoinFamily, fbGetFamilyMembers, fbLeaveFamily, fbLoadUserFamily } from '../../lib/firebase.js';

export default function FriendsScreen({ user, goBack }) {
  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // user has shape { u: uid/email, d: displayName, e: email }
  const uid = user?.u || '';
  const email = user?.e || user?.u || '';
  const displayName = user?.d || 'Learner';

  useEffect(() => {
    async function loadFamily() {
      if (!email) return;
      try {
        const fam = await fbLoadUserFamily(email);
        if (fam) {
          setFamily(fam);
          const mems = await fbGetFamilyMembers(fam.code);
          setMembers(mems);
        }
      } catch (_) {
        // No family yet — stay in "no group" state
      }
    }
    loadFamily();
  }, [email]);

  async function handleCreate() {
    setLoading(true);
    setError('');
    try {
      const familyName = displayName ? `${displayName}'s Family` : 'My Family';
      const result = await fbCreateFamily(familyName, uid, email, displayName);
      if (result && result.ok) {
        setFamily(result.family || { name: familyName, code: result.code, role: 'admin' });
        const mems = await fbGetFamilyMembers(result.code);
        setMembers(mems);
      } else {
        setError(result?.err || 'Could not create group. Try again.');
      }
    } catch (_) {
      setError('Could not create group. Try again.');
    }
    setLoading(false);
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await fbJoinFamily(joinCode.trim(), uid, email, displayName);
      if (result && result.ok) {
        setFamily(result.family || { code: joinCode.trim().toUpperCase(), role: 'member' });
        const mems = await fbGetFamilyMembers(joinCode.trim().toUpperCase());
        setMembers(mems);
        setJoinCode('');
      } else {
        setError(result?.err || 'Invalid code or group not found.');
      }
    } catch (_) {
      setError('Invalid code or group not found.');
    }
    setLoading(false);
  }

  async function handleLeave() {
    if (!family || !window.confirm('Leave this group?')) return;
    setLoading(true);
    try {
      await fbLeaveFamily(family.code, email);
      setFamily(null);
      setMembers([]);
    } catch (_) {
      setError('Could not leave group. Try again.');
    }
    setLoading(false);
  }

  function copyCode(code) {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="scr-wrap">
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button onClick={goBack} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--heading)' }}>←</button>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:'var(--heading)', margin:0 }}>Friends & Family</h2>
      </div>

      {error && <div style={{ background:'var(--error-bg)', border:'1px solid var(--error-b)', borderRadius:10, padding:'10px 14px', color:'var(--error)', fontSize:'var(--text-sm)', marginBottom:16 }}>{error}</div>}

      {!family ? (
        /* No group yet */
        <div>
          <div style={{ background:'var(--card)', borderRadius:16, border:'1px solid var(--card-b)', padding:20, marginBottom:16, textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>👨‍👩‍👧‍👦</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:'var(--heading)' }}>Learn Together</h3>
            <p style={{ color:'var(--subtext)', fontSize:'var(--text-sm)', marginTop:8, lineHeight:1.6 }}>
              Create a family group to share your progress, streaks, and cheer each other on.
            </p>
          </div>

          <button className="b bp" style={{ width:'100%', marginBottom:12 }} onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating…' : '➕ Create a Family Group'}
          </button>

          <div style={{ textAlign:'center', color:'var(--subtext)', fontSize:'var(--text-xs)', margin:'12px 0' }}>— or join with a code —</div>

          <div style={{ display:'flex', gap:8 }}>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter invite code"
              maxLength={8}
              style={{ flex:1, padding:'12px 14px', borderRadius:12, border:'1.5px solid var(--card-b)', background:'var(--card)', color:'var(--heading)', fontSize:'var(--text-sm)', fontFamily:"'Outfit',sans-serif", letterSpacing:2 }}
            />
            <button className="b bp" onClick={handleJoin} disabled={loading || !joinCode.trim()}>
              Join
            </button>
          </div>
        </div>
      ) : (
        /* Has a group */
        <div>
          {/* Invite code */}
          <div style={{ background:'var(--info-bg)', border:'1px solid var(--info-b, rgba(14,116,144,.3))', borderRadius:16, padding:20, marginBottom:20 }}>
            <div style={{ fontSize:'var(--text-xs)', fontWeight:700, color:'var(--subtext)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>Your Invite Code</div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ flex:1, fontFamily:'monospace', fontSize:24, fontWeight:900, color:'var(--info)', letterSpacing:4 }}>
                {family.code || '------'}
              </div>
              <button onClick={() => copyCode(family.code)} style={{ padding:'8px 16px', borderRadius:10, border:'1.5px solid var(--info)', background:'transparent', color:'var(--info)', fontWeight:700, cursor:'pointer', fontSize:'var(--text-xs)' }}>
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', marginTop:8 }}>Share this code with family or friends so they can join</div>
          </div>

          {/* Members list */}
          <div style={{ fontSize:'var(--text-xs)', fontWeight:700, color:'var(--subtext)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12 }}>
            Members ({members.length})
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {members.map((m, i) => {
              const isMe = m.email === email || m.uid === uid;
              return (
                <div key={m.email || m.uid || i} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px', borderRadius:14, background:'var(--card)', border:'1px solid var(--card-b)' }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:'var(--info-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                    {isMe ? '⚡' : '👤'}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:'var(--text-sm)', color:'var(--heading)' }}>
                      {m.name || 'Learner'} {isMe && <span style={{ color:'var(--info)', fontSize:'var(--text-xs)' }}>(You)</span>}
                    </div>
                    {m.streak != null && <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', marginTop:2 }}>🔥 {m.streak} day streak</div>}
                  </div>
                  {m.xp != null && <div style={{ fontWeight:900, color:'var(--heading)', fontSize:14 }}>{m.xp} XP</div>}
                </div>
              );
            })}
          </div>

          <button
            onClick={handleLeave}
            disabled={loading}
            style={{ marginTop:24, width:'100%', padding:'12px', borderRadius:12, border:'1.5px solid var(--error-b, #dc2626)', background:'transparent', color:'var(--error)', fontWeight:700, cursor:'pointer', fontSize:'var(--text-sm)' }}
          >
            {loading ? 'Leaving…' : 'Leave Group'}
          </button>
        </div>
      )}
    </div>
  );
}
