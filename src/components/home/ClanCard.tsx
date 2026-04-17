// @ts-nocheck
/**
 * ClanCard — 5-person study cohort with shared weekly XP goal.
 *
 * Shows clan overview, member progress bars, weekly goal progress,
 * and create/join UI. Uses /api/clan Cloudflare Function + NH_CLANS KV.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../../lib/apiFetch.js';

const WEEKLY_GOAL = 500;
const MAX_SIZE = 5;

function MemberBar({ member, isMe, max }) {
  const pct = Math.min(100, Math.round((member.weekXP || 0) / Math.max(max, 1) * 100));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: isMe ? 'linear-gradient(135deg,#7c3aed,#6366f1)' : 'var(--bar-bg)',
        border: isMe ? '2px solid rgba(129,140,248,0.6)' : '1.5px solid var(--card-b)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 900, color: isMe ? '#fff' : 'var(--subtext)',
      }}>
        {member.name?.charAt(0)?.toUpperCase() || '?'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
            {member.name || 'Member'}{isMe ? ' (you)' : ''}
          </span>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', flexShrink: 0 }}>
            {member.weekXP || 0} XP
          </span>
        </div>
        <div style={{ height: 5, background: 'var(--bar-bg)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: pct + '%', borderRadius: 3,
            background: isMe ? 'linear-gradient(90deg,#7c3aed,#818cf8)' : 'linear-gradient(90deg,#64748b,#94a3b8)',
            transition: 'width .4s ease',
          }} />
        </div>
      </div>
    </div>
  );
}

export default function ClanCard({ uid, displayName }) {
  const [phase, setPhase] = useState('loading'); // loading | none | active | creating | joining
  const [clan, setClan] = useState(null);
  const [totalXP, setTotalXP] = useState(0);
  const [error, setError] = useState(null);
  const [clanName, setClanName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  const loadMyClan = useCallback(async () => {
    if (!uid) { setPhase('none'); return; }
    try {
      const res = await apiFetch('/api/clan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mine', uid }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.clan) {
        setClan(data.clan);
        setTotalXP(data.totalXP || 0);
        setPhase('active');
      } else {
        setPhase('none');
      }
    } catch {
      setPhase('none');
    }
  }, [uid]);

  useEffect(() => { loadMyClan(); }, [loadMyClan]);

  const createClan = useCallback(async () => {
    const name = clanName.trim();
    if (!name || !uid) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch('/api/clan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', uid, displayName: displayName || 'Učenik', name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create clan');
      setClan(data.clan);
      setTotalXP(data.totalXP || 0);
      setPhase('active');
    } catch (e) {
      setError(e.message || 'Failed to create clan');
    } finally {
      setSubmitting(false);
    }
  }, [clanName, uid, displayName]);

  const joinClan = useCallback(async () => {
    const code = joinCode.trim().toLowerCase();
    if (!code || !uid) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch('/api/clan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', uid, displayName: displayName || 'Učenik', clanId: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join clan');
      setClan(data.clan);
      setTotalXP(data.totalXP || 0);
      setPhase('active');
    } catch (e) {
      setError(e.message || 'Failed to join clan');
    } finally {
      setSubmitting(false);
    }
  }, [joinCode, uid, displayName]);

  const leaveClan = useCallback(async () => {
    if (!clan?.id || !uid) return;
    setSubmitting(true);
    try {
      await apiFetch('/api/clan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'leave', uid, clanId: clan.id }),
      });
      setClan(null);
      setPhase('none');
    } catch {}
    setSubmitting(false);
  }, [clan, uid]);

  const copyCode = useCallback(() => {
    if (!clan?.id) return;
    navigator.clipboard?.writeText(clan.id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [clan]);

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div style={{ background: 'var(--card)', border: '1px solid var(--card-b)', borderRadius: 16, padding: '14px 16px', marginBottom: 12 }}>
        <div style={{ height: 16, width: '40%', borderRadius: 8, background: 'var(--bar-bg)', animation: 'shimmer 1.4s ease infinite', backgroundSize: '200% 100%' }} />
      </div>
    );
  }

  // ── NO CLAN: show create/join UI ───────────────────────────────────────────
  if (phase === 'none' || phase === 'creating' || phase === 'joining') {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(99,102,241,0.05) 100%)',
        border: '1.5px solid rgba(124,58,237,0.2)',
        borderRadius: 16, padding: '16px', marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 28 }}>⚔️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#7c3aed' }}>Study Clan</div>
            <div style={{ fontSize: 12, color: 'var(--subtext)', fontWeight: 500 }}>
              Join 4 others · Share a weekly XP goal · Motivate each other
            </div>
          </div>
        </div>

        {phase === 'none' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setPhase('creating'); setError(null); setTimeout(() => inputRef.current?.focus(), 50); }}
              style={{ flex: 1, height: 40, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
            >Create Clan</button>
            <button
              onClick={() => { setPhase('joining'); setError(null); setTimeout(() => inputRef.current?.focus(), 50); }}
              style={{ flex: 1, height: 40, background: 'var(--bar-bg)', color: 'var(--heading)', border: '1.5px solid var(--card-b)', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
            >Join with Code</button>
          </div>
        )}

        {phase === 'creating' && (
          <div>
            <input
              ref={inputRef}
              value={clanName}
              onChange={e => setClanName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createClan()}
              placeholder="Clan name (e.g. Dalmatians 🌊)"
              maxLength={32}
              style={{
                width: '100%', height: 42, borderRadius: 10, padding: '0 12px',
                border: '1.5px solid rgba(124,58,237,0.4)', background: 'var(--card)',
                fontSize: 13, fontWeight: 600, color: 'var(--heading)',
                fontFamily: "'Outfit',sans-serif", boxSizing: 'border-box', marginBottom: 8,
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setPhase('none'); setError(null); }} style={{ flex: 1, height: 40, background: 'var(--bar-bg)', color: 'var(--subtext)', border: '1px solid var(--card-b)', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
              <button onClick={createClan} disabled={submitting || !clanName.trim()} style={{ flex: 2, height: 40, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: submitting ? 'wait' : 'pointer', fontFamily: "'Outfit',sans-serif", opacity: !clanName.trim() ? 0.6 : 1 }}>
                {submitting ? 'Creating…' : 'Create Clan →'}
              </button>
            </div>
          </div>
        )}

        {phase === 'joining' && (
          <div>
            <input
              ref={inputRef}
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && joinClan()}
              placeholder="Clan code (e.g. ab3xk7r2)"
              maxLength={16}
              style={{
                width: '100%', height: 42, borderRadius: 10, padding: '0 12px',
                border: '1.5px solid rgba(124,58,237,0.4)', background: 'var(--card)',
                fontSize: 13, fontWeight: 600, color: 'var(--heading)', fontFamily: "'Outfit',sans-serif",
                boxSizing: 'border-box', marginBottom: 8, outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setPhase('none'); setError(null); }} style={{ flex: 1, height: 40, background: 'var(--bar-bg)', color: 'var(--subtext)', border: '1px solid var(--card-b)', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
              <button onClick={joinClan} disabled={submitting || !joinCode.trim()} style={{ flex: 2, height: 40, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: submitting ? 'wait' : 'pointer', fontFamily: "'Outfit',sans-serif", opacity: !joinCode.trim() ? 0.6 : 1 }}>
                {submitting ? 'Joining…' : 'Join Clan →'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#b91c1c', fontWeight: 600, padding: '6px 10px', background: 'rgba(220,38,38,0.08)', borderRadius: 8 }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  // ── ACTIVE CLAN ────────────────────────────────────────────────────────────
  const members = clan?.members || [];
  const sortedMembers = [...members].sort((a, b) => (b.weekXP || 0) - (a.weekXP || 0));
  const topXP = Math.max(...members.map(m => m.weekXP || 0), 1);
  const goalPct = Math.min(100, Math.round(totalXP / WEEKLY_GOAL * 100));
  const goalMet = totalXP >= WEEKLY_GOAL;
  const spots = MAX_SIZE - members.length;

  return (
    <div style={{
      background: 'var(--card)', border: '1.5px solid rgba(124,58,237,0.2)',
      borderRadius: 16, overflow: 'hidden', marginBottom: 12,
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(90deg, #4c1d95, #6d28d9)',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>⚔️</span>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clan?.name || 'My Clan'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
            {members.length}/{MAX_SIZE} members
          </span>
          <button
            onClick={copyCode}
            title={`Share clan code: ${clan?.id}`}
            style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 7, padding: '4px 8px', fontSize: 10, fontWeight: 800, color: '#e0e7ff', cursor: 'pointer' }}
          >
            {copied ? '✓ Copied' : `📋 ${clan?.id}`}
          </button>
        </div>
      </div>

      {/* Weekly goal bar */}
      <div style={{ padding: '12px 16px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
            Weekly Goal
          </span>
          <span style={{ fontSize: 11, fontWeight: 900, color: goalMet ? '#16a34a' : '#7c3aed' }}>
            {totalXP} / {WEEKLY_GOAL} XP {goalMet ? '🏆' : ''}
          </span>
        </div>
        <div style={{ height: 8, background: 'var(--bar-bg)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: goalPct + '%', borderRadius: 4,
            background: goalMet
              ? 'linear-gradient(90deg, #16a34a, #22c55e)'
              : 'linear-gradient(90deg, #7c3aed, #818cf8)',
            transition: 'width .5s ease',
          }} />
        </div>
        {goalMet && (
          <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, marginTop: 5, textAlign: 'center' }}>
            🎉 Clan goal reached this week! Sjajno!
          </div>
        )}
      </div>

      {/* Member list */}
      <div style={{ padding: '4px 16px 8px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>
          Members · This Week
        </div>
        {sortedMembers.map((m) => (
          <MemberBar key={m.uid} member={m} isMe={m.uid === uid} max={topXP} />
        ))}
        {spots > 0 && (
          <div style={{ fontSize: 12, color: 'var(--subtext)', fontWeight: 500, padding: '6px 0 2px', fontStyle: 'italic' }}>
            {spots} open spot{spots > 1 ? 's' : ''} — share your code: <span style={{ fontWeight: 800, fontStyle: 'normal', color: '#7c3aed' }}>{clan?.id}</span>
          </div>
        )}
      </div>

      {/* Leave button */}
      <div style={{ padding: '4px 16px 12px' }}>
        <button
          onClick={leaveClan}
          disabled={submitting}
          style={{ fontSize: 11, fontWeight: 600, color: 'var(--subtext)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
        >
          Leave clan
        </button>
      </div>
    </div>
  );
}
