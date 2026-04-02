import React, { useState, useEffect, useCallback } from 'react';
import {
  fbCreateFamily, fbJoinFamily, fbGetFamilyMembers, fbLeaveFamily, fbLoadUserFamily,
  getFriendCode, fbRegisterFriendCode, fbAddFriend, fbGetFriends, fbRemoveFriend,
} from '../../lib/firebase.js';
import { trackFriendAdded, trackFamilyJoined } from '../../lib/analytics.js';

// ─── Shared helpers ────────────────────────────────────────────────────────
function Avatar({ name, isMe, size = 40 }) {
  const initials = (name || '?').trim().slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: isMe ? 'var(--info-bg)' : 'linear-gradient(135deg,#0e7490,#164e63)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 900, color: isMe ? 'var(--info)' : '#fff',
    }}>
      {isMe ? '⚡' : initials}
    </div>
  );
}

function MemberCard({ m, isMe, onRemove }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
      borderRadius: 14, background: 'var(--card)', border: '1px solid var(--card-b)',
    }}>
      <Avatar name={m.name} isMe={isMe} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--heading)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {m.name || 'Learner'}
          </span>
          {isMe && <span style={{ color: 'var(--info)', fontSize: 'var(--text-xs)', flexShrink: 0 }}>(You)</span>}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 2, display: 'flex', gap: 10 }}>
          {m.streak != null && <span>🔥 {m.streak}</span>}
          {m.level && <span>📚 {m.level}</span>}
        </div>
      </div>
      <div style={{ fontWeight: 900, color: 'var(--heading)', fontSize: 14, flexShrink: 0 }}>
        {(m.xp || 0).toLocaleString()} XP
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label="Remove friend"
          style={{ background: 'none', border: 'none', color: 'var(--subtext)', fontSize: 18, cursor: 'pointer', padding: '0 4px', flexShrink: 0 }}
        >
          ×
        </button>
      )}
    </div>
  );
}

// ─── Family Group tab ──────────────────────────────────────────────────────
function FamilyTab({ user }) {
  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const uid = user?.u || '';
  const email = user?.e || user?.u || '';
  const displayName = user?.d || 'Learner';

  useEffect(() => {
    if (!email) return;
    let mounted = true;
    fbLoadUserFamily(email).then(fam => {
      if (!mounted) return;
      if (fam) {
        setFamily(fam);
        fbGetFamilyMembers(fam.code).then(m => { if (mounted) setMembers(m); }).catch(() => {});
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, [email]);

  async function handleCreate() {
    setLoading(true); setError('');
    const familyName = displayName ? `${displayName}'s Family` : 'My Family';
    const result = await fbCreateFamily(familyName, uid, email, displayName);
    if (result?.ok) {
      setFamily(result.family || { name: familyName, code: result.code, role: 'admin' });
      fbGetFamilyMembers(result.code).then(setMembers).catch(() => {});
      trackFamilyJoined();
    } else {
      setError(result?.err || 'Could not create group. Try again.');
    }
    setLoading(false);
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setLoading(true); setError('');
    const result = await fbJoinFamily(joinCode.trim(), uid, email, displayName);
    if (result?.ok) {
      setFamily(result.family || { code: joinCode.trim().toUpperCase(), role: 'member' });
      fbGetFamilyMembers(joinCode.trim().toUpperCase()).then(setMembers).catch(() => {});
      setJoinCode('');
      trackFamilyJoined();
    } else {
      setError(result?.err || 'Invalid code or group not found.');
    }
    setLoading(false);
  }

  async function handleLeave() {
    if (!family || !window.confirm('Leave this group?')) return;
    setLoading(true);
    await fbLeaveFamily(family.code, email).catch(() => {});
    setFamily(null); setMembers([]);
    setLoading(false);
  }

  function copyCode(code) {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!family) {
    return (
      <div>
        <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--card-b)', padding: 20, marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👨‍👩‍👧‍👦</div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: 'var(--heading)', margin: '0 0 8px' }}>Learn Together</h3>
          <p style={{ color: 'var(--subtext)', fontSize: 'var(--text-sm)', lineHeight: 1.6, margin: 0 }}>
            Create a family group to share your progress, streaks, and cheer each other on.
          </p>
        </div>
        {error && <div style={{ background: 'var(--error-bg)', borderRadius: 10, padding: '10px 14px', color: 'var(--error)', fontSize: 'var(--text-sm)', marginBottom: 12 }}>{error}</div>}
        <button className="b bp" style={{ width: '100%', marginBottom: 12 }} onClick={handleCreate} disabled={loading}>
          {loading ? 'Creating…' : '➕ Create a Family Group'}
        </button>
        <div style={{ textAlign: 'center', color: 'var(--subtext)', fontSize: 'var(--text-xs)', margin: '12px 0' }}>— or join with a code —</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Enter invite code"
            maxLength={8}
            style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--card-b)', background: 'var(--card)', color: 'var(--heading)', fontSize: 'var(--text-sm)', fontFamily: "'Outfit',sans-serif", letterSpacing: 2 }}
          />
          <button className="b bp" onClick={handleJoin} disabled={loading || !joinCode.trim()}>Join</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: 'var(--info-bg)', border: '1px solid var(--info-b, rgba(14,116,144,.3))', borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Your Invite Code</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, fontFamily: 'monospace', fontSize: 24, fontWeight: 900, color: 'var(--info)', letterSpacing: 4 }}>{family.code || '------'}</div>
          <button onClick={() => copyCode(family.code)} style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid var(--info)', background: 'transparent', color: 'var(--info)', fontWeight: 700, cursor: 'pointer', fontSize: 'var(--text-xs)' }}>
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 8 }}>Share this code with family or friends so they can join</div>
      </div>

      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
        Members ({members.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {members.map((m, i) => {
          const isMe = m.email === email || m.uid === uid;
          return <MemberCard key={m.email || m.uid || i} m={m} isMe={isMe} />;
        })}
      </div>

      {error && <div style={{ background: 'var(--error-bg)', borderRadius: 10, padding: '10px 14px', color: 'var(--error)', fontSize: 'var(--text-sm)', marginTop: 16 }}>{error}</div>}
      <button
        onClick={handleLeave}
        disabled={loading}
        style={{ marginTop: 24, width: '100%', padding: 12, borderRadius: 12, border: '1.5px solid var(--error-b, #dc2626)', background: 'transparent', color: 'var(--error)', fontWeight: 700, cursor: 'pointer', fontSize: 'var(--text-sm)' }}
      >
        {loading ? 'Leaving…' : 'Leave Group'}
      </button>
    </div>
  );
}

// ─── Friends tab ───────────────────────────────────────────────────────────
function FriendsTab({ user }) {
  const [friends, setFriends] = useState([]);
  const [friendCode, setFriendCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const uid = user?.u || '';
  const displayName = user?.d || 'Learner';
  const myCode = uid ? getFriendCode(uid.replace(/[.#$/\[\]]/g, '_')) : '------';

  const loadFriends = useCallback(async () => {
    if (!uid) return;
    setLoadingFriends(true);
    const list = await fbGetFriends(uid);
    setFriends(list);
    setLoadingFriends(false);
  }, [uid]);

  useEffect(() => { loadFriends(); }, [loadFriends]);

  async function handleAdd() {
    if (!friendCode.trim() || !uid) return;
    setLoading(true); setError('');
    const result = await fbAddFriend(uid, displayName, friendCode.trim());
    if (result?.ok) {
      setFriendCode('');
      trackFriendAdded();
      await loadFriends();
    } else {
      setError(result?.err || 'Could not add friend. Try again.');
    }
    setLoading(false);
  }

  async function handleRemove(theirUid) {
    if (!window.confirm('Remove this friend?')) return;
    await fbRemoveFriend(uid, theirUid);
    setFriends(f => f.filter(fr => fr.uid !== theirUid));
  }

  function copyMyCode() {
    navigator.clipboard?.writeText(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      {/* My code */}
      <div style={{ background: 'var(--info-bg)', border: '1px solid var(--info-b, rgba(14,116,144,.3))', borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Your Friend Code</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, fontFamily: 'monospace', fontSize: 28, fontWeight: 900, color: 'var(--info)', letterSpacing: 6 }}>{myCode}</div>
          <button onClick={copyMyCode} style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid var(--info)', background: 'transparent', color: 'var(--info)', fontWeight: 700, cursor: 'pointer', fontSize: 'var(--text-xs)' }}>
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 8 }}>Share this with anyone to connect — they'll enter it below</div>
      </div>

      {/* Add friend */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Add a Friend</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={friendCode}
            onChange={e => setFriendCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Enter their 6-char code"
            maxLength={6}
            style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--card-b)', background: 'var(--card)', color: 'var(--heading)', fontSize: 'var(--text-sm)', fontFamily: "'Outfit',sans-serif", letterSpacing: 3, textTransform: 'uppercase' }}
          />
          <button className="b bp" onClick={handleAdd} disabled={loading || friendCode.length < 6}>
            {loading ? '…' : 'Add'}
          </button>
        </div>
        {error && <div style={{ color: 'var(--error)', fontSize: 'var(--text-xs)', marginTop: 8 }}>{error}</div>}
      </div>

      {/* Friend list */}
      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
        Friends {!loadingFriends && `(${friends.length})`}
      </div>

      {loadingFriends ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--subtext)', fontSize: 'var(--text-sm)' }}>Loading…</div>
      ) : friends.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', background: 'var(--card)', borderRadius: 16, border: '1px dashed var(--card-b)' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🤝</div>
          <div style={{ color: 'var(--subtext)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
            No friends yet. Share your code above<br />or enter a friend's code to connect.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {friends.map(f => (
            <MemberCard
              key={f.uid}
              m={f}
              isMe={false}
              onRemove={() => handleRemove(f.uid)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────
export default function FriendsScreen({ user, goBack }) {
  const [activeTab, setActiveTab] = useState('friends');

  const tabStyle = (id) => ({
    flex: 1, padding: '10px 0', border: 'none', borderRadius: 10, cursor: 'pointer',
    fontFamily: "'Outfit',sans-serif", fontSize: 'var(--text-sm)', fontWeight: 700,
    background: activeTab === id ? 'var(--info)' : 'transparent',
    color: activeTab === id ? '#fff' : 'var(--subtext)',
    transition: 'all .2s',
  });

  return (
    <div className="scr-wrap">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={goBack} aria-label="Go back" style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--heading)' }}>←</button>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: 'var(--heading)', margin: 0 }}>Friends & Family</h2>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 6, padding: 6, background: 'var(--bar-bg)', borderRadius: 14, marginBottom: 24 }}>
        <button style={tabStyle('friends')} onClick={() => setActiveTab('friends')}>Friends</button>
        <button style={tabStyle('family')} onClick={() => setActiveTab('family')}>Family Group</button>
      </div>

      {activeTab === 'friends' ? (
        <FriendsTab user={user} />
      ) : (
        <FamilyTab user={user} />
      )}
    </div>
  );
}
