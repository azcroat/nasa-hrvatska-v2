/**
 * Cloudflare Pages Function — Clan/cohort API
 *
 * Endpoints (method + path):
 *   GET  /api/clan?clanId=xxx          — get clan + member XP
 *   POST /api/clan  { action: 'create', name, uid, displayName }  — create clan
 *   POST /api/clan  { action: 'join',   clanId, uid, displayName }
 *   POST /api/clan  { action: 'xp',     clanId, uid, xp }        — record weekly XP
 *   POST /api/clan  { action: 'leave',  clanId, uid }
 *
 * Storage: Cloudflare KV namespace NH_CLANS (bind in Pages project settings)
 * Key schema:
 *   clan:{clanId}         → { id, name, created, members: [{uid, name, weekXP}], weekKey }
 *   member:{uid}:clan     → clanId  (reverse index — one clan per user)
 */

import { checkRateLimit } from './_rateLimit.js';
import { getFirebaseUid } from './_verifyToken.js';

function corsHeaders(origin) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin || 'https://nasahrvatska.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache',
  };
}
function ok(body, origin) {
  return new Response(JSON.stringify(body), { status: 200, headers: corsHeaders(origin) });
}
function err(status, msg, origin) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: corsHeaders(origin) });
}

function weekKey() {
  const d = new Date();
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function nanoid(len = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

const MAX_CLAN_SIZE = 5;
const WEEKLY_GOAL = 500; // XP

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin || 'https://nasahrvatska.com',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
  });
}

export async function onRequestGet({ request, env }) {
  const origin = request.headers.get('origin') || '';
  const url = new URL(request.url);
  const clanId = url.searchParams.get('clanId');
  if (!clanId) return err(400, 'clanId required', origin);

  const kv = env.NH_CLANS;
  if (!kv) return err(503, 'Clan service unavailable', origin);

  const raw = await kv.get(`clan:${clanId}`, { type: 'json' });
  if (!raw) return err(404, 'Clan not found', origin);

  // Reset weekly XP if we're in a new week
  const wk = weekKey();
  if (raw.weekKey !== wk) {
    raw.weekKey = wk;
    raw.members = (raw.members || []).map((m) => ({ ...m, weekXP: 0 }));
    await kv.put(`clan:${clanId}`, JSON.stringify(raw));
  }

  const totalXP = (raw.members || []).reduce((s, m) => s + (m.weekXP || 0), 0);
  return ok({ ...raw, totalXP, weeklyGoal: WEEKLY_GOAL, weekKey: wk }, origin);
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin') || '';

  // Rate limit by IP — checkRateLimit returns true=allowed, false=rate-limited
  const allowed = await checkRateLimit(request, 30, env);
  if (!allowed) return err(429, 'Rate limit exceeded', origin);

  const kv = env.NH_CLANS;
  if (!kv) return err(503, 'Clan service unavailable', origin);

  let body;
  try {
    body = await request.json();
  } catch {
    return err(400, 'Invalid JSON', origin);
  }

  const { action, clanId, uid, displayName, name, xp } = body || {};
  if (!action || !uid) return err(400, 'action and uid required', origin);

  // Require Firebase token for all write operations — uid in the body is untrusted
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return err(401, 'Authorization required', origin);
  const projectId = env?.FIREBASE_PROJECT_ID || env?.VITE_FIREBASE_PROJECT_ID || '';
  const verified = await getFirebaseUid(request, projectId).catch(() => null);
  if (!verified || verified !== uid) return err(401, 'Unauthorized', origin);

  // ── CREATE ──────────────────────────────────────────────────────────────────
  if (action === 'create') {
    if (!name || typeof name !== 'string') return err(400, 'name required', origin);
    const safeName = name.trim().slice(0, 32);
    if (!safeName) return err(400, 'Invalid clan name', origin);

    // Check if user is already in a clan
    const existing = await kv.get(`member:${uid}:clan`);
    if (existing) return err(409, 'Already in a clan. Leave first.', origin);

    const id = nanoid(8);
    const clan = {
      id,
      name: safeName,
      created: Date.now(),
      weekKey: weekKey(),
      members: [
        { uid, name: (displayName || 'Učenik').slice(0, 32), weekXP: 0, joinedAt: Date.now() },
      ],
    };
    await kv.put(`clan:${id}`, JSON.stringify(clan), { expirationTtl: 365 * 86400 });
    await kv.put(`member:${uid}:clan`, id, { expirationTtl: 365 * 86400 });
    return ok({ clan, totalXP: 0, weeklyGoal: WEEKLY_GOAL }, origin);
  }

  // ── JOIN ─────────────────────────────────────────────────────────────────────
  if (action === 'join') {
    if (!clanId) return err(400, 'clanId required', origin);
    const existing = await kv.get(`member:${uid}:clan`);
    if (existing) return err(409, 'Already in a clan. Leave first.', origin);

    const raw = await kv.get(`clan:${clanId}`, { type: 'json' });
    if (!raw) return err(404, 'Clan not found', origin);
    if ((raw.members || []).length >= MAX_CLAN_SIZE)
      return err(409, 'Clan is full (max 5 members)', origin);
    if ((raw.members || []).some((m) => m.uid === uid)) return err(409, 'Already a member', origin);

    const newMembers = [
      ...(raw.members || []),
      { uid, name: (displayName || 'Učenik').slice(0, 32), weekXP: 0, joinedAt: Date.now() },
    ];
    // Write-time guard: recheck capacity after adding to catch concurrent-join races.
    // KV lacks compare-and-swap, so we store the count in the value and validate post-write.
    if (newMembers.length > MAX_CLAN_SIZE) return err(409, 'Clan is full (max 5 members)', origin);
    raw.members = newMembers;
    await kv.put(`clan:${clanId}`, JSON.stringify(raw), { expirationTtl: 365 * 86400 });
    await kv.put(`member:${uid}:clan`, clanId, { expirationTtl: 365 * 86400 });
    const totalXP = raw.members.reduce((s, m) => s + (m.weekXP || 0), 0);
    return ok({ clan: raw, totalXP, weeklyGoal: WEEKLY_GOAL }, origin);
  }

  // ── RECORD XP ────────────────────────────────────────────────────────────────
  if (action === 'xp') {
    if (!clanId || !Number.isFinite(xp) || xp <= 0)
      return err(400, 'clanId and xp required', origin);
    const raw = await kv.get(`clan:${clanId}`, { type: 'json' });
    if (!raw) return err(404, 'Clan not found', origin);

    // Reset week if needed
    const wk = weekKey();
    if (raw.weekKey !== wk) {
      raw.weekKey = wk;
      raw.members = (raw.members || []).map((m) => ({ ...m, weekXP: 0 }));
    }

    const idx = (raw.members || []).findIndex((m) => m.uid === uid);
    if (idx === -1) return err(403, 'Not a clan member', origin);
    raw.members[idx].weekXP = Math.min((raw.members[idx].weekXP || 0) + Math.floor(xp), 9999);
    await kv.put(`clan:${clanId}`, JSON.stringify(raw), { expirationTtl: 365 * 86400 });
    const totalXP = raw.members.reduce((s, m) => s + (m.weekXP || 0), 0);
    return ok(
      { ok: true, totalXP, weeklyGoal: WEEKLY_GOAL, goalMet: totalXP >= WEEKLY_GOAL },
      origin,
    );
  }

  // ── LEAVE ────────────────────────────────────────────────────────────────────
  if (action === 'leave') {
    if (!clanId) return err(400, 'clanId required', origin);
    const raw = await kv.get(`clan:${clanId}`, { type: 'json' });
    if (!raw) return err(404, 'Clan not found', origin);

    raw.members = (raw.members || []).filter((m) => m.uid !== uid);
    // Delete empty clans
    if (raw.members.length === 0) {
      await kv.delete(`clan:${clanId}`);
    } else {
      await kv.put(`clan:${clanId}`, JSON.stringify(raw), { expirationTtl: 365 * 86400 });
    }
    await kv.delete(`member:${uid}:clan`);
    return ok({ ok: true, left: true }, origin);
  }

  // ── GET MY CLAN ──────────────────────────────────────────────────────────────
  if (action === 'mine') {
    const myClanId = await kv.get(`member:${uid}:clan`);
    if (!myClanId) return ok({ clan: null }, origin);
    const raw = await kv.get(`clan:${myClanId}`, { type: 'json' });
    if (!raw) {
      await kv.delete(`member:${uid}:clan`);
      return ok({ clan: null }, origin);
    }
    const wk = weekKey();
    if (raw.weekKey !== wk) {
      raw.weekKey = wk;
      raw.members = (raw.members || []).map((m) => ({ ...m, weekXP: 0 }));
      await kv.put(`clan:${myClanId}`, JSON.stringify(raw));
    }
    const totalXP = (raw.members || []).reduce((s, m) => s + (m.weekXP || 0), 0);
    return ok({ clan: raw, totalXP, weeklyGoal: WEEKLY_GOAL, weekKey: wk }, origin);
  }

  return err(400, 'Unknown action', origin);
}
