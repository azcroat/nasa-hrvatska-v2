/**
 * Weekly League API — Cloudflare Pages Function
 * Manages Duolingo-style 30-person weekly league groups with Bronze→Diamond tiers.
 *
 * GET  /api/league?week={weekKey}  — get current user's standings
 * POST /api/league                 — join or update XP for current week
 *
 * KV keys (using PUSH_SUBSCRIPTIONS namespace):
 *   league:{weekKey}:{uid}             → { groupId, tier }
 *   league_meta:{weekKey}              → { groupCount: N }
 *   league_group:{weekKey}:{groupId}   → { members: [{uid, name, xp}] }
 */

import { getFirebaseUid } from './_verifyToken.js';
import { checkRateLimit } from './_rateLimit.js';

// FIREBASE_PROJECT_ID is read from env only — no hardcoded fallback
const MAX_GROUP_SIZE = 30;

function isAllowedOrigin(origin, isDev) {
  // Empty origin: PWA standalone mode (iOS/Android) and Capacitor. Auth is enforced via Firebase token.
  if (!origin) return true;
  try {
    const hostname = new URL(origin).hostname;
    if (isDev && hostname === 'localhost') return true;
    return hostname === 'nasahrvatska.com'
      || hostname.endsWith('.nasahrvatska.com')
      || hostname === 'nasa-hrvatska-v2.pages.dev'
      || hostname.endsWith('.nasa-hrvatska-v2.pages.dev');
  } catch { return false; }
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || 'https://nasahrvatska.com',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

function err(msg, status = 400, origin = '') {
  return json({ error: msg }, status, origin);
}

/** Determine tier from previous week's final XP (passed by client or defaulted). */
function getTier(xp) {
  if (xp >= 600) return 'diamond';
  if (xp >= 300) return 'platinum';
  if (xp >= 100) return 'gold';
  if (xp >= 50)  return 'silver';
  return 'bronze';
}

const TIER_META = {
  diamond:  { name: 'Diamond',  icon: '💎', color: '#0e7490', order: 4 },
  platinum: { name: 'Platinum', icon: '🏆', color: '#7c3aed', order: 3 },
  gold:     { name: 'Gold',     icon: '🥇', color: '#d97706', order: 2 },
  silver:   { name: 'Silver',   icon: '🥈', color: '#6b7280', order: 1 },
  bronze:   { name: 'Bronze',   icon: '🥉', color: '#b45309', order: 0 },
};

/** Sort members by XP descending and add rank. */
function rankMembers(members) {
  const sorted = [...members].sort((a, b) => b.xp - a.xp);
  return sorted.map((m, i) => ({ ...m, rank: i + 1 }));
}

/** Find or create a league group for the given weekKey, add uid to it. Returns groupId. */
async function assignGroup(kv, weekKey, uid, name, xp) {
  const metaKey = `league_meta:${weekKey}`;
  const assignKey = `league:${weekKey}:${uid}`;

  // Check if already assigned
  const existing = await kv.get(assignKey, 'json');
  if (existing) {
    // Already in a group — just return groupId
    return existing.groupId;
  }

  // Load or init meta
  let meta = await kv.get(metaKey, 'json');
  if (!meta) meta = { groupCount: 0 };

  // Try to find an open group (< MAX_GROUP_SIZE members)
  let targetGroupId = null;
  for (let g = 1; g <= meta.groupCount; g++) {
    const groupKey = `league_group:${weekKey}:${g}`;
    const group = await kv.get(groupKey, 'json');
    if (group && group.members && group.members.length < MAX_GROUP_SIZE) {
      targetGroupId = g;
      break;
    }
  }

  if (targetGroupId === null) {
    // Create a new group
    meta.groupCount += 1;
    targetGroupId = meta.groupCount;
    await kv.put(metaKey, JSON.stringify(meta), { expirationTtl: 60 * 60 * 24 * 14 }); // 2 weeks
    await kv.put(
      `league_group:${weekKey}:${targetGroupId}`,
      JSON.stringify({ members: [{ uid, name, xp }] }),
      { expirationTtl: 60 * 60 * 24 * 14 }
    );
  } else {
    // Add user to existing group
    const groupKey = `league_group:${weekKey}:${targetGroupId}`;
    const group = await kv.get(groupKey, 'json');
    const members = group?.members || [];
    // Guard against duplicate uid racing
    if (!members.find(m => m.uid === uid)) {
      members.push({ uid, name, xp });
      await kv.put(groupKey, JSON.stringify({ members }), { expirationTtl: 60 * 60 * 24 * 14 });
    }
  }

  // Save assignment
  await kv.put(assignKey, JSON.stringify({ groupId: targetGroupId }), {
    expirationTtl: 60 * 60 * 24 * 14,
  });

  return targetGroupId;
}

/** Update user's XP in their group and return ranked members. */
async function updateAndGetStandings(kv, weekKey, groupId, uid, name, xp) {
  const groupKey = `league_group:${weekKey}:${groupId}`;
  const group = await kv.get(groupKey, 'json');
  const members = group?.members || [];

  const idx = members.findIndex(m => m.uid === uid);
  if (idx !== -1) {
    members[idx].xp = xp;  
    if (name) members[idx].name = name;  
  } else {
    members.push({ uid, name, xp });
  }

  await kv.put(groupKey, JSON.stringify({ members }), { expirationTtl: 60 * 60 * 24 * 14 });

  const ranked = rankMembers(members);
  const myEntry = ranked.find(m => m.uid === uid);
  return { ranked, myRank: myEntry?.rank ?? ranked.length };
}

/** Build the response payload. */
function buildResponse(uid, groupId, ranked, weekKey, xp) {
  const tierId = getTier(xp);
  const tier = TIER_META[tierId];  

  // Top 10 for display (Duolingo-style)
  const top10 = ranked.slice(0, 10);
  const myEntry = ranked.find(m => m.uid === uid);
  const myRank = myEntry?.rank ?? ranked.length;
  const total = ranked.length;

  // Promotion zone: top 3 | Demotion zone: bottom 5
  const promotionThreshold = ranked[2]?.xp ?? 0; // 3rd place XP
  const demotionCutoff = ranked[Math.max(0, total - 5)]?.xp ?? 0; // 26th place XP

  return {
    groupId,
    weekKey,
    tier: { id: tierId, ...tier },
    rank: myRank,
    total,
    xp,
    promotionXP: promotionThreshold,
    demotionXP: demotionCutoff,
    inPromotionZone: myRank <= 3,
    inDemotionZone: myRank > total - 5 && total >= 5,
    members: top10,
    myMember: myEntry || null,
  };
}

export async function onRequest(context) {
  const { request, env } = context;

  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  const isDev = env.ENVIRONMENT !== 'production';

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  // Origin allowlist — reject requests from unlisted origins.
  // Empty origin is allowed: PWA home-screen / Capacitor native apps never send an Origin header;
  // their identity is verified via the Firebase JWT instead.
  if (origin && !isAllowedOrigin(origin, isDev)) {
    return err('Forbidden', 403, origin);
  }

  // Rate limit: 30/min for GET, 10/min for POST
  const limit = request.method === 'POST' ? 10 : 30;
  const allowed = await checkRateLimit(request, limit);
  if (!allowed) return err('Too many requests. Please wait a moment.', 429, origin);

  // Auth — required for both GET and POST
  const projectId = env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID || '';
  if (!projectId) return err('Server misconfigured.', 500, origin);
  const uid = await getFirebaseUid(request, projectId);
  if (!uid) return err('Authentication required.', 401, origin);

  // KV namespace
  const kv = env.PUSH_SUBSCRIPTIONS;
  if (!kv) return err('Storage unavailable.', 503, origin);

  const url = new URL(request.url);

  // ── GET — fetch current standings ─────────────────────────────────────────
  if (request.method === 'GET') {
    const _wkParam = url.searchParams.get('week');
    // Validate weekKey format to prevent KV key injection via query string.
    // Allow only YYYY-WNN format (current or historical); reject anything else.
    if (_wkParam && !/^\d{4}-W\d{2}$/.test(_wkParam)) {
      return err('Invalid weekKey.', 400, origin);
    }
    const weekKey = _wkParam || getCurrentWeekKey();

    const assignKey = `league:${weekKey}:${uid}`;
    const assignment = await kv.get(assignKey, 'json');

    if (!assignment) {
      return json({ notJoined: true, weekKey }, 200, origin);
    }

    const { groupId } = assignment;
    const groupKey = `league_group:${weekKey}:${groupId}`;
    const group = await kv.get(groupKey, 'json');
    const members = group?.members || [];
    const ranked = rankMembers(members);
    const myEntry = ranked.find(m => m.uid === uid);
    const xp = myEntry?.xp ?? 0;

    return json(buildResponse(uid, groupId, ranked, weekKey, xp), 200, origin);
  }

  // ── POST — join or update XP ──────────────────────────────────────────────
  if (request.method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch {
      return err('Invalid JSON body.', 400, origin);
    }

    const { xp = 0, name = 'Learner', weekKey = getCurrentWeekKey() } = body;

    // 10,000 XP/week cap — 20 lessons/day at ~70 XP each × 7 days ≈ 9,800 max for a power user
    if (typeof xp !== 'number' || xp < 0 || xp > 10000) {
      return err('Invalid xp value.', 400, origin);
    }
    if (typeof weekKey !== 'string' || !/^\d{4}-W\d{2}$/.test(weekKey)) {
      return err('Invalid weekKey format. Expected e.g. "2026-W13".', 400, origin);
    }
    const safeName = String(name).slice(0, 40).replace(/[^\p{L}\p{N} '-]/gu, '').trim() || 'Learner';

    // Assign group (idempotent — returns existing group if already assigned)
    const groupId = await assignGroup(kv, weekKey, uid, safeName, xp);

    // Update XP and get full standings
    const { ranked } = await updateAndGetStandings(kv, weekKey, groupId, uid, safeName, xp);

    return json(buildResponse(uid, groupId, ranked, weekKey, xp), 200, origin);
  }

  return err('Method not allowed.', 405, origin);
}

/** ISO week key in format "YYYY-Www" (same algorithm used in Leaderboard.jsx). */
function getCurrentWeekKey() {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const year = d.getFullYear();
  const week = Math.ceil(((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}
