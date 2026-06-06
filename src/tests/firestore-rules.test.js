/**
 * Firestore Security Rules Test Suite
 *
 * Tests every match block in firestore.rules against the Firebase Rules Emulator.
 * Run with: npx firebase emulators:exec --only firestore "vitest run src/tests/firestore-rules.test.js"
 *
 * Or start the emulator separately and run: vitest run src/tests/firestore-rules.test.js
 * with FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 set in the environment.
 *
 * What this covers:
 *  /users/{userId}          — owner read/write, XP monotonic increase, 100k cap, progress size cap
 *  /profiles/{userId}       — any-auth read, owner create+update (hasAll shape), CEFR level check
 *  /srs/{userId}            — owner-only read/write, hasAll({cards,updated}), delete for cleanup
 *  Deny-all catch-all       — arbitrary paths must be rejected
 */

import { describe, it, beforeAll, afterAll, afterEach } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RULES_PATH = resolve(__dirname, '../../firestore.rules');

// ── Test environment ──────────────────────────────────────────────────────────

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'nasa-hrvatska-test',
    firestore: {
      rules: readFileSync(RULES_PATH, 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Authenticated user context — uid and email are both set. */
function authed(uid, email) {
  return testEnv.authenticatedContext(uid, { email });
}

/** Unauthenticated context. */
function unauthed() {
  return testEnv.unauthenticatedContext();
}

// ── /users/{userId} ───────────────────────────────────────────────────────────

describe('/users/{userId}', () => {
  const uid = 'user123';
  const email = 'alice@test.com';
  const docId = uid;

  it('owner can read their own document', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`users/${docId}`).set({ xp: 100, progress: '' });
    });
    const db = authed(uid, email).firestore();
    await assertSucceeds(db.doc(`users/${docId}`).get());
  });

  it('non-owner cannot read another user document', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`users/${docId}`).set({ xp: 100, progress: '' });
    });
    const db = authed('other_user', 'bob@test.com').firestore();
    await assertFails(db.doc(`users/${docId}`).get());
  });

  it('unauthenticated user cannot read', async () => {
    const db = unauthed().firestore();
    await assertFails(db.doc(`users/${docId}`).get());
  });

  it('owner can create their own document', async () => {
    const db = authed(uid, email).firestore();
    await assertSucceeds(db.doc(`users/${docId}`).set({ xp: 0, progress: '' }));
  });

  it('owner can update with monotonically increasing XP', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`users/${docId}`).set({ xp: 100, progress: '' });
    });
    const db = authed(uid, email).firestore();
    await assertSucceeds(db.doc(`users/${docId}`).update({ xp: 200, progress: '' }));
  });

  it('owner cannot decrease XP (anti-cheat)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`users/${docId}`).set({ xp: 500, progress: '' });
    });
    const db = authed(uid, email).firestore();
    await assertFails(db.doc(`users/${docId}`).update({ xp: 400, progress: '' }));
  });

  it('owner can reset XP to 0', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`users/${docId}`).set({ xp: 500, progress: '' });
    });
    const db = authed(uid, email).firestore();
    await assertSucceeds(db.doc(`users/${docId}`).update({ xp: 0, progress: '' }));
  });

  it('XP above 100,000 is rejected', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`users/${docId}`).set({ xp: 99000, progress: '' });
    });
    const db = authed(uid, email).firestore();
    await assertFails(db.doc(`users/${docId}`).update({ xp: 100001, progress: '' }));
  });

  it('progress blob above 200 KB is rejected', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`users/${docId}`).set({ xp: 100, progress: '' });
    });
    const db = authed(uid, email).firestore();
    const oversized = 'x'.repeat(204801);
    await assertFails(db.doc(`users/${docId}`).update({ xp: 100, progress: oversized }));
  });

  it('progress blob at exactly 200 KB is allowed', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`users/${docId}`).set({ xp: 100, progress: '' });
    });
    const db = authed(uid, email).firestore();
    const maxSize = 'x'.repeat(204800);
    await assertSucceeds(db.doc(`users/${docId}`).update({ xp: 100, progress: maxSize }));
  });

  it('any authed user can add THEIR OWN uid to friendUids on another user doc', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`users/${docId}`).set({ xp: 100, progress: '', friendUids: [] });
    });
    const db = authed('other_user', 'bob@test.com').firestore();
    await assertSucceeds(db.doc(`users/${docId}`).update({ friendUids: ['other_user'] }));
  });

  it('any authed user can REMOVE their own uid from friendUids on another user doc', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx
        .firestore()
        .doc(`users/${docId}`)
        .set({ xp: 100, progress: '', friendUids: ['other_user', 'third_user'] });
    });
    const db = authed('other_user', 'bob@test.com').firestore();
    await assertSucceeds(db.doc(`users/${docId}`).update({ friendUids: ['third_user'] }));
  });

  it("rejects adding SOMEONE ELSE's uid to another user doc (friendUids injection)", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`users/${docId}`).set({ xp: 100, progress: '', friendUids: [] });
    });
    const db = authed('other_user', 'bob@test.com').firestore();
    // Attacker bob tries to make alice "friends" with someone she didn't add.
    await assertFails(db.doc(`users/${docId}`).update({ friendUids: ['stranger'] }));
  });

  it('rejects bloating friendUids with many uids (DoS via 200KB cap)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`users/${docId}`).set({ xp: 100, progress: '', friendUids: [] });
    });
    const db = authed('other_user', 'bob@test.com').firestore();
    const bloat = Array.from({ length: 1000 }, (_, i) => `uid_${i}`);
    await assertFails(db.doc(`users/${docId}`).update({ friendUids: bloat }));
  });

  it('rejects adding self + others simultaneously', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`users/${docId}`).set({ xp: 100, progress: '', friendUids: [] });
    });
    const db = authed('other_user', 'bob@test.com').firestore();
    // Even though 'other_user' is in the new list, 'extra' is also added without consent.
    await assertFails(db.doc(`users/${docId}`).update({ friendUids: ['other_user', 'extra'] }));
  });

  it('rejects removing someone else from friendUids', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx
        .firestore()
        .doc(`users/${docId}`)
        .set({ xp: 100, progress: '', friendUids: ['third_user'] });
    });
    const db = authed('other_user', 'bob@test.com').firestore();
    // Bob has never been in alice's friendUids; removing 'third_user' isn't bob's right.
    await assertFails(db.doc(`users/${docId}`).update({ friendUids: [] }));
  });

  it('delete is always denied', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`users/${docId}`).set({ xp: 0, progress: '' });
    });
    const db = authed(uid, email).firestore();
    await assertFails(db.doc(`users/${docId}`).delete());
  });
});

// ── /profiles/{userId} ────────────────────────────────────────────────────────

describe('/profiles/{userId}', () => {
  const uid = 'profuser';
  const email = 'prof@test.com';
  const validProfile = {
    name: 'Test User',
    xp: 100,
    lc: 5,
    streak: 3,
    level: 2,
    lastActive: Date.now(),
  };

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`profiles/${uid}`).set(validProfile);
    });
  });

  it('owner can read their own profile', async () => {
    const db = authed(uid, email).firestore();
    await assertSucceeds(db.doc(`profiles/${uid}`).get());
  });

  it('a DIFFERENT authenticated user CANNOT read another user profile (PII lockdown)', async () => {
    // Regression guard for the 2026-06-06 fix: profiles read was previously
    // `if isAuthenticated()`, letting any signed-in account enumerate every
    // user's email-derived doc ID + name + stats. Must stay owner-only.
    const db = authed('someone_else', 'other@test.com').firestore();
    await assertFails(db.doc(`profiles/${uid}`).get());
  });

  it('unauthenticated user cannot read profiles', async () => {
    const db = unauthed().firestore();
    await assertFails(db.doc(`profiles/${uid}`).get());
  });

  it('owner can update profile with valid integer level (1–6)', async () => {
    const db = authed(uid, email).firestore();
    await assertSucceeds(db.doc(`profiles/${uid}`).update({ ...validProfile, level: 3, xp: 200 }));
  });

  it('owner can update profile with valid CEFR string level', async () => {
    const db = authed(uid, email).firestore();
    await assertSucceeds(
      db.doc(`profiles/${uid}`).update({ ...validProfile, level: 'B2', xp: 200 }),
    );
  });

  it('invalid level value is rejected', async () => {
    const db = authed(uid, email).firestore();
    await assertFails(
      db.doc(`profiles/${uid}`).update({ ...validProfile, level: 'invalid', xp: 200 }),
    );
  });

  it('level 7 (out of range) is rejected', async () => {
    const db = authed(uid, email).firestore();
    await assertFails(db.doc(`profiles/${uid}`).update({ ...validProfile, level: 7, xp: 200 }));
  });

  it('XP above 100,000 is rejected', async () => {
    const db = authed(uid, email).firestore();
    await assertFails(db.doc(`profiles/${uid}`).update({ ...validProfile, xp: 100001 }));
  });

  it('non-owner cannot update', async () => {
    const db = authed('intruder', 'intruder@test.com').firestore();
    await assertFails(db.doc(`profiles/${uid}`).update({ ...validProfile, xp: 200 }));
  });

  it('owner can create profile with all required fields', async () => {
    // Use a different uid so the beforeEach seed doc does not exist yet
    const freshUid = 'profuser_new';
    const freshDb = authed(freshUid, 'profnew@test.com').firestore();
    await assertSucceeds(freshDb.doc(`profiles/${freshUid}`).set(validProfile));
  });

  it('create fails when required fields are missing (no streak)', async () => {
    const freshUid = 'profuser_bad';
    const freshDb = authed(freshUid, 'profbad@test.com').firestore();
    const { streak: _omit, ...noStreak } = validProfile;
    await assertFails(freshDb.doc(`profiles/${freshUid}`).set(noStreak));
  });
});

// ── /srs/{userId} ─────────────────────────────────────────────────────────────

describe('/srs/{userId}', () => {
  const uid = 'srs_user';
  const email = 'srs@test.com';
  // Schema: { cards(map), updated(timestamp) } — written by fbSaveSRS with merge:false
  const validSrs = {
    cards: { 'pisati|to write': { d: 1700000000000, e: 2.5, i: 1 } },
    updated: new Date(),
  };

  it('owner can read their SRS data', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`srs/${uid}`).set(validSrs);
    });
    const db = authed(uid, email).firestore();
    await assertSucceeds(db.doc(`srs/${uid}`).get());
  });

  it('non-owner cannot read SRS data', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`srs/${uid}`).set(validSrs);
    });
    const db = authed('intruder', 'i@test.com').firestore();
    await assertFails(db.doc(`srs/${uid}`).get());
  });

  it('owner can write SRS data with { cards, updated }', async () => {
    const db = authed(uid, email).firestore();
    await assertSucceeds(db.doc(`srs/${uid}`).set(validSrs));
  });

  it('write fails when required fields are missing (no updated)', async () => {
    const db = authed(uid, email).firestore();
    await assertFails(db.doc(`srs/${uid}`).set({ cards: validSrs.cards }));
  });

  it('write fails when required fields are missing (no cards)', async () => {
    const db = authed(uid, email).firestore();
    await assertFails(db.doc(`srs/${uid}`).set({ updated: new Date() }));
  });

  it('owner can delete their SRS data (for account deletion)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`srs/${uid}`).set(validSrs);
    });
    const db = authed(uid, email).firestore();
    await assertSucceeds(db.doc(`srs/${uid}`).delete());
  });

  it('non-owner cannot delete SRS data', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`srs/${uid}`).set(validSrs);
    });
    const db = authed('intruder', 'i@test.com').firestore();
    await assertFails(db.doc(`srs/${uid}`).delete());
  });
});

// ── Deny-all catch-all ────────────────────────────────────────────────────────

describe('catch-all deny rule', () => {
  it('arbitrary top-level collection is denied even for authenticated user', async () => {
    const db = authed('any_user', 'any@test.com').firestore();
    await assertFails(db.doc('arbitrary_collection/some_doc').get());
    await assertFails(db.doc('arbitrary_collection/some_doc').set({ data: 'value' }));
  });

  it('arbitrary subcollection is denied', async () => {
    const db = authed('any_user', 'any@test.com').firestore();
    await assertFails(db.doc('users/uid/private_data/secret').get());
  });
});
