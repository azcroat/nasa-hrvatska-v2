# Server-Side XP Validation Design

## Goal

Close the client-side XP manipulation gap: a user who modifies their browser JS can currently call `award(99999)` and the XP flows unimpeded to Firestore. This spec adds a per-activity server validation layer while preserving full offline functionality.

## Architecture

Three-layer defense in depth:

```
ONLINE:
  award(xp, celebrate, activityType)
    → lXPgain() multiplier (client, unchanged)
    → POST /api/award { activityType, claimedXp }
    → Worker validates token, velocity, allowlist
    → returns { awarded }
    → fbApplyDelta({ xp: awarded })
    → Firestore (rules as backstop)

OFFLINE:
  award(xp, celebrate, activityType)
    → lXPgain() multiplier (client, unchanged)
    → fbApplyDelta({ xp: claimedXp })   ← existing path, unchanged
    → Firestore (rules backstop: ≤1000 XP per write)
    → offlineAwardQueue.enqueue({ activityType, claimedXp, timestamp })

ON RECONNECT:
  offlineAwardQueue.flush()
    → audit each queued item vs ACTIVITY_XP_MAP
    → flag excess (>10% over cap) to Firestore /analytics/xpAudit/{uid}
    → clear queue
```

## Components

### 1. `functions/api/_activityXp.js` (new)

Canonical source of truth for maximum XP per activity type. Caps are generous upper bounds that include the maximum seasonal multiplier (2×) plus the 50 XP comeback bonus, with 10 XP headroom.

```javascript
export const ACTIVITY_XP_MAP = {
  // Micro rewards
  media_view:      15,
  phrase_of_day:   15,
  daily_discovery: 20,

  // Standard practice (base ≤ 25 XP × 2 multiplier + 50 comeback + headroom)
  grammar:         80,
  vocabulary:      80,
  pronunciation:   80,
  listening:       80,
  reading:         80,
  speaking:       100,
  culture:        100,
  quest:          100,
  review:          80,

  // Major completions (base ≤ 100 XP × 2 multiplier + 50 comeback + 10 headroom)
  lesson:         210,
  heritage:       250,
  story:          100,

  // Catch-all for any unlisted activityType
  default:        210,
};
```

**Rationale for caps:**
- `lesson`: 50 XP base × 2.0 Domovina Day + 50 comeback + 10 headroom = 160 + headroom → 210
- `heritage`: 75 XP × 2.0 + 50 + 10 = 210 → 250 (higher base)
- `grammar/vocabulary/etc.`: 25 XP × 2.0 + 50 - 20 headroom reduction = 80 (comeback rarely fires mid-session)

### 2. `functions/api/award.js` (new)

`POST /api/award` — online validation endpoint.

**Request:**
```json
{ "activityType": "lesson", "claimedXp": 150, "exerciseId": "optional-string" }
```

**Response:**
```json
{ "awarded": 150, "activityType": "lesson" }
```
or on validation failure:
```json
{ "error": "unknown_activity_type" }  // 400
{ "error": "unauthorized" }           // 401
{ "error": "rate_limited" }           // 429
```

**Processing steps:**
1. `_rateLimit(request, ctx, 60)` — 60 req/min per IP (existing pattern).
2. `getFirebaseUid(request)` via `_verifyToken.js` — reject 401 if invalid.
3. Parse + validate body: `activityType` must be a non-empty string; `claimedXp` must be a positive integer ≤ 10000 (sanity bound before allowlist check).
4. Look up `maxXp = ACTIVITY_XP_MAP[activityType] ?? ACTIVITY_XP_MAP.default`.
5. **Per-user velocity check (KV):**
   - Key: `xpv2:${uid}` — value: `{ total: number, windowStart: number }` (JSON)
   - If `windowStart` is older than 10 minutes, reset: `{ total: 0, windowStart: now }`.
   - Remaining budget: `600 - entry.total` (600 XP per 10-minute window per user).
   - `awarded = Math.min(claimedXp, maxXp, Math.max(0, remaining_budget))`.
   - Update KV: `entry.total += awarded`, TTL = 700 seconds (10 min + buffer). `await ctx.waitUntil(kv.put(...))`.
6. Return `{ awarded, activityType }` with 200.

**No Firestore writes.** The Worker only validates and caps — the client writes the validated amount via the existing `fbApplyDelta` path. This avoids service account credentials in Cloudflare and keeps Firestore rules as an independent second layer.

**KV binding name:** `XP_VELOCITY` — must be added to `wrangler.toml` and Cloudflare dashboard.

### 3. `src/lib/offlineAwardQueue.ts` (new)

Manages the audit log for awards made during offline sessions.

```typescript
interface OfflineAwardEntry {
  activityType: string;
  claimedXp: number;
  timestamp: number;
}

const QUEUE_KEY = 'nh_offline_award_queue';
const TOLERANCE = 1.10; // 10% over cap = acceptable rounding

export function enqueue(entry: OfflineAwardEntry): void
export function flush(uid: string): Promise<void>  // called on reconnect
```

`flush()` behavior:
- Read and parse queue from localStorage.
- For each entry: compare `claimedXp` to `ACTIVITY_XP_MAP[activityType] * TOLERANCE`.
- Collect suspicious entries (claimedXp exceeds capped amount).
- If any suspicious entries exist, write a single document directly to Firestore `/users/{uid}/xpAudit/{timestamp}` using the Firebase client SDK (user is authenticated; rules allow append-only writes to own subcollection). No new Cloudflare endpoint needed.
- Clear the queue from localStorage.

### 4. `src/hooks/useAward.ts` (modify)

**New signature:**
```typescript
function award(amt: number, celebrate?: boolean, activityType?: AwardActivityType): void
```

`AwardActivityType` is a union type defined in `src/types/index.ts` matching the keys of `ACTIVITY_XP_MAP`.

**Online path (new):**
```typescript
if (isOnline && activityType) {
  const res = await apiFetch('/api/award', {
    method: 'POST',
    body: JSON.stringify({ activityType, claimedXp: totalAmt, exerciseId }),
  });
  const { awarded } = await res.json();
  // use awarded (not totalAmt) for writeDelta
  writeDelta({ xp: awarded, ... });
} else {
  // existing path
  writeDelta({ xp: totalAmt, ... });
  if (activityType) offlineAwardQueue.enqueue({ activityType, claimedXp: totalAmt, timestamp: Date.now() });
}
```

`totalAmt` is the post-multiplier amount (output of `lXPgain(amt)` — unchanged). The Worker caps it to `ACTIVITY_XP_MAP[activityType]` if needed.

**Fallback:** If `/api/award` fails (network timeout, 5xx), fall through to the existing offline path and enqueue for audit. No XP is lost on transient errors.

**activityType defaults:** Components that don't pass `activityType` fall back to `'default'` (210 XP cap). All call sites should be updated with the correct type, but the default prevents regressions.

### 5. `src/types/index.ts` (modify)

Add:
```typescript
export type AwardActivityType =
  | 'media_view' | 'phrase_of_day' | 'daily_discovery'
  | 'grammar' | 'vocabulary' | 'pronunciation' | 'listening'
  | 'reading' | 'speaking' | 'culture' | 'quest' | 'review'
  | 'lesson' | 'heritage' | 'story' | 'default';
```

### 6. `firestore.rules` (modify)

In `validXpUpdate()`, add the per-write increment backstop:

```javascript
function validXpUpdate() {
  let oldXp = resource.data.stats.xp;
  let newXp = request.resource.data.stats.xp;
  return newXp >= 0
    && newXp == int(newXp)
    && (newXp >= oldXp || newXp == 0)
    && newXp <= 100000
    && (newXp - oldXp) <= 1000;  // ADD THIS — per-write increment cap
}
```

The 1000 XP cap is well above any legitimate single award (~210 max) but blocks extreme offline manipulation attempts before they reach Firestore.

Add to Firestore rules an analytics subcollection rule:
```javascript
match /analytics/xpAudit/{userId} {
  allow read: if false;  // admin only
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

### 7. Call Site Updates (~35 files)

All `award(xp)` and `award(xp, celebrate)` calls get a third argument. Mapping:

| Screen pattern | activityType |
|---|---|
| Lesson completion (AnimatedLesson, LearnPath) | `'lesson'` |
| Grammar screens (GrammarScreen, ConjugationDrill, etc.) | `'grammar'` |
| Vocabulary screens (Flashcards, McGame, TypingScreen, WordSprint) | `'vocabulary'` |
| Speaking screens (SpeakingScreen, PronunciationContrast) | `'speaking'` |
| Listening/Dictation screens | `'listening'` |
| Reading screens (ReadingScreen, StoryMode) | `'reading'` |
| Story/Heritage/Baka Summer | `'heritage'` or `'story'` |
| Culture screens (LifeEvents, TextingScreen, etc.) | `'culture'` |
| Quest completion | `'quest'` |
| Daily discovery / phrase of day | `'daily_discovery'` / `'phrase_of_day'` |
| Media views | `'media_view'` |
| Review sessions | `'review'` |
| Any unmapped | `'default'` |

## Data Flow Diagram

```
Client (useAward)
  │
  ├─[online]──▶ POST /api/award
  │               │ _verifyToken → uid
  │               │ _rateLimit (60/min IP)
  │               │ ACTIVITY_XP_MAP lookup
  │               │ KV velocity check (600 XP / 10min per user)
  │               │ awarded = min(claimed, cap, remaining)
  │               └──▶ { awarded }
  │
  ├─[offline]─▶ fbApplyDelta(claimedXp) ──▶ Firestore (rules cap ≤1000/write)
  │           ▶ offlineAwardQueue.enqueue(...)
  │
  └─[reconnect]▶ offlineAwardQueue.flush()
                  │ audit vs allowlist
                  └──▶ /analytics/xpAudit/{uid} (if suspicious)

Firestore validXpUpdate():
  ✓ non-negative integer
  ✓ monotonic (never decreases)
  ✓ total ≤ 100,000
  ✓ per-write increment ≤ 1,000   ← NEW
```

## Error Handling

- `/api/award` 401 → fall through to offline path, enqueue for audit
- `/api/award` 429 → fall through to offline path, enqueue for audit
- `/api/award` 5xx / timeout → fall through to offline path, enqueue for audit
- KV unavailable → Worker falls back to allowlist cap only (no velocity check), logs warning
- Firestore increment blocked by rule → local state diverges from Firestore; next `fbSaveProgress` resolves via `Math.max` merge on leaderboard/profiles

## Testing

- Unit tests: `_activityXp.js` — all caps are ≥ legitimate max award for that type
- Unit tests: `offlineAwardQueue.ts` — enqueue, flush with suspicious and clean entries
- Integration tests: `award.js` Worker — 401 with bad token, 400 with unknown type, capped response, velocity window reset
- E2E: Complete a lesson online → verify awarded XP ≤ 210
- E2E: Complete a lesson offline → verify queue populated → reconnect → verify flush clears queue

## What This Does NOT Fix

- **Offline XP manipulation**: A user who manipulates JS offline can still write up to 1000 XP to Firestore (the per-write Firestore cap). The audit log flags this but does not claw back XP (Firestore rules prevent XP decrements).
- **Legitimate XP decrease for resets**: XP reset (to 0) remains allowed by `newXp == 0` exception in Firestore rules.
- **Admin corrections**: No admin endpoint to correct XP. Future work.

## Environment Variables Required

- `XP_VELOCITY` KV namespace binding in Cloudflare (create in dashboard, add to `wrangler.toml`)
- No new secrets needed (no service account)
