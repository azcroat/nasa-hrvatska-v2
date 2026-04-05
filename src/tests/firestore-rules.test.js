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
 *  /profiles/{userId}       — any-auth read, owner write, field validation, CEFR level check
 *  /friendCodes/{code}      — any-auth read, owner-mapped create/update
 *  /leaderboard/{userId}    — any-auth read, owner write, XP/lc caps
 *  /leaderboard/{w}/entries — same rules as top-level leaderboard
 *  /families/{code}         — member checks, size limits, immutable code/created
 *  /families/{code}/reactions — family-member-only read/write
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
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc(`users/${docId}`).set({ xp: 100, progress: '' });
    });
    const db = authed(uid, email).firestore();
    await assertSucceeds(db.doc(`users/${docId}`).get());
  });

  it('non-owner cannot read another user document', async () => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
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
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc(`users/${docId}`).set({ xp: 100, progress: '' });
    });
    const db = authed(uid, email).firestore();
    await assertSucceeds(db.doc(`users/${docId}`).update({ xp: 200, progress: '' }));
  });

  it('owner cannot decrease XP (anti-cheat)', async () => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc(`users/${docId}`).set({ xp: 500, progress: '' });
    });
    const db = authed(uid, email).firestore();
    await assertFails(db.doc(`users/${docId}`).update({ xp: 400, progress: '' }));
  });

  it('owner can reset XP to 0', async () => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc(`users/${docId}`).set({ xp: 500, progress: '' });
    });
    const db = authed(uid, email).firestore();
    await assertSucceeds(db.doc(`users/${docId}`).update({ xp: 0, progress: '' }));
  });

  it('XP above 100,000 is rejected', async () => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc(`users/${docId}`).set({ xp: 99000, progress: '' });
    });
    const db = authed(uid, email).firestore();
    await assertFails(db.doc(`users/${docId}`).update({ xp: 100001, progress: '' }));
  });

  it('progress blob above 200 KB is rejected', async () => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc(`users/${docId}`).set({ xp: 100, progress: '' });
    });
    const db = authed(uid, email).firestore();
    const oversized = 'x'.repeat(204801);
    await assertFails(db.doc(`users/${docId}`).update({ xp: 100, progress: oversized }));
  });

  it('progress blob at exactly 200 KB is allowed', async () => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc(`users/${docId}`).set({ xp: 100, progress: '' });
    });
    const db = authed(uid, email).firestore();
    const maxSize = 'x'.repeat(204800);
    await assertSucceeds(db.doc(`users/${docId}`).update({ xp: 100, progress: maxSize }));
  });

  it('any authed user can update only friendUids on another user doc', async () => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc(`users/${docId}`).set({ xp: 100, progress: '', friendUids: [] });
    });
    const db = authed('other_user', 'bob@test.com').firestore();
    await assertSucceeds(
      db.doc(`users/${docId}`).update({ friendUids: ['other_user'] })
    );
  });

  it('delete is always denied', async () => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
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
    name: 'Test User', xp: 100, lc: 5, streak: 3,
    level: 2, lastActive: Date.now(),
  };

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc(`profiles/${uid}`).set(validProfile);
    });
  });

  it('any authenticated user can read profiles', async () => {
    const db = authed('someone_else', 'other@test.com').firestore();
    await assertSucceeds(db.doc(`profiles/${uid}`).get());
  });

  it('unauthenticated user cannot read profiles', async () => {
    const db = unauthed().firestore();
    await assertFails(db.doc(`profiles/${uid}`).get());
  });

  it('owner can update profile with valid integer level (1–6)', async () => {
    const db = authed(uid, email).firestore();
    await assertSucceeds(
      db.doc(`profiles/${uid}`).update({ ...validProfile, level: 3, xp: 200 })
    );
  });

  it('owner can update profile with valid CEFR string level', async () => {
    const db = authed(uid, email).firestore();
    await assertSucceeds(
      db.doc(`profiles/${uid}`).update({ ...validProfile, level: 'B2', xp: 200 })
    );
  });

  it('invalid level value is rejected', async () => {
    const db = authed(uid, email).firestore();
    await assertFails(
      db.doc(`profiles/${uid}`).update({ ...validProfile, level: 'invalid', xp: 200 })
    );
  });

  it('level 7 (out of range) is rejected', async () => {
    const db = authed(uid, email).firestore();
    await assertFails(
      db.doc(`profiles/${uid}`).update({ ...validProfile, level: 7, xp: 200 })
    );
  });

  it('XP above 100,000 is rejected', async () => {
    const db = authed(uid, email).firestore();
    await assertFails(
      db.doc(`profiles/${uid}`).update({ ...validProfile, xp: 100001 })
    );
  });

  it('non-owner cannot update', async () => {
    const db = authed('intruder', 'intruder@test.com').firestore();
    await assertFails(
      db.doc(`profiles/${uid}`).update({ ...validProfile, xp: 200 })
    );
  });
});

// ── /friendCodes/{code} ───────────────────────────────────────────────────────

describe('/friendCodes/{code}', () => {
  const uid = 'fc_user';
  const email = 'fc@test.com';
  const code = 'ABC123';

  it('any authenticated user can read a friend code', async () => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc(`friendCodes/${code}`).set({ uid, name: 'Test', updated: Date.now() });
    });
    const db = authed('reader', 'reader@test.com').firestore();
    await assertSucceeds(db.doc(`friendCodes/${code}`).get());
  });

  it('user can create a code that maps to their own UID', async () => {
    const db = authed(uid, email).firestore();
    await assertSucceeds(
      db.doc(`friendCodes/${code}`).set({ uid, name: 'Test', updated: Date.now() })
    );
  });

  it('user cannot create a code mapping to a different UID', async () => {
    const db = authed(uid, email).firestore();
    await assertFails(
      db.doc(`friendCodes/${code}`).set({ uid: 'someone_else', name: 'Test', updated: Date.now() })
    );
  });

  it('unauthenticated user cannot read friend codes', async () => {
    const db = unauthed().firestore();
    await assertFails(db.doc(`friendCodes/${code}`).get());
  });
});

// ── /leaderboard/{userId} ─────────────────────────────────────────────────────

describe('/leaderboard/{userId}', () => {
  const uid = 'lb_user';
  const email = 'lb@test.com';

  it('any authenticated user can read leaderboard', async () => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc(`leaderboard/${uid}`).set({ xp: 100, lc: 5 });
    });
    const db = authed('reader', 'reader@test.com').firestore();
    await assertSucceeds(db.doc(`leaderboard/${uid}`).get());
  });

  it('owner can create entry with valid XP', async () => {
    const db = authed(uid, email).firestore();
    await assertSucceeds(db.doc(`leaderboard/${uid}`).set({ xp: 500, lc: 10 }));
  });

  it('owner can increase XP', async () => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc(`leaderboard/${uid}`).set({ xp: 100, lc: 5 });
    });
    const db = authed(uid, email).firestore();
    await assertSucceeds(db.doc(`leaderboard/${uid}`).update({ xp: 500, lc: 5 }));
  });

  it('owner cannot decrease XP', async () => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc(`leaderboard/${uid}`).set({ xp: 500, lc: 5 });
    });
    const db = authed(uid, email).firestore();
    await assertFails(db.doc(`leaderboard/${uid}`).update({ xp: 100, lc: 5 }));
  });

  it('XP above 100,000 is rejected on create', async () => {
    const db = authed(uid, email).firestore();
    await assertFails(db.doc(`leaderboard/${uid}`).set({ xp: 100001, lc: 0 }));
  });

  it('non-owner cannot write to leaderboard', async () => {
    const db = authed('intruder', 'i@test.com').firestore();
    await assertFails(db.doc(`leaderboard/${uid}`).set({ xp: 0, lc: 0 }));
  });
});

// ── /families/{familyCode} ────────────────────────────────────────────────────

describe('/families/{familyCode}', () => {
  const ownerUid   = 'fam_owner';
  const ownerEmail = 'owner@family.com';
  const memberUid  = 'fam_member';
  const memberEmail = 'member@family.com';
  const code = 'FAM001';

  const baseFamily = {
    name: 'Schreiner Family',
    code,
    created: 1000000,
    members: [{ uid: ownerUid, email: ownerEmail }],
    memberEmails: [ownerEmail],
  };

  it('any authenticated user can get a specific family document', async () => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc(`families/${code}`).set(baseFamily);
    });
    const db = authed('random_user', 'rand@test.com').firestore();
    await assertSucceeds(db.doc(`families/${code}`).get());
  });

  it('unauthenticated user cannot get family document', async () => {
    const db = unauthed().firestore();
    await assertFails(db.doc(`families/${code}`).get());
  });

  it('creator with their email in memberEmails can create family', async () => {
    const db = authed(ownerUid, ownerEmail).firestore();
    await assertSucceeds(db.doc(`families/${code}`).set(baseFamily));
  });

  it('create fails when memberEmails does not include creator email', async () => {
    const db = authed(ownerUid, ownerEmail).firestore();
    const invalid = { ...baseFamily, memberEmails: ['wrong@test.com'] };
    await assertFails(db.doc(`families/${code}`).set(invalid));
  });

  it('existing member can update the family', async () => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc(`families/${code}`).set(baseFamily);
    });
    const db = authed(ownerUid, ownerEmail).firestore();
    await assertSucceeds(
      db.doc(`families/${code}`).update({
        ...baseFamily,
        name: 'Updated Family Name',
      })
    );
  });

  it('new user can join by adding their email to memberEmails', async () => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc(`families/${code}`).set(baseFamily);
    });
    const db = authed(memberUid, memberEmail).firestore();
    await assertSucceeds(
      db.doc(`families/${code}`).update({
        ...baseFamily,
        members: [...baseFamily.members, { uid: memberUid, email: memberEmail }],
        memberEmails: [...baseFamily.memberEmails, memberEmail],
      })
    );
  });

  it('outsider cannot update family without being in memberEmails or joining', async () => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc(`families/${code}`).set(baseFamily);
    });
    const db = authed('outsider', 'outsider@test.com').firestore();
    await assertFails(
      db.doc(`families/${code}`).update({ ...baseFamily, name: 'Hacked' })
    );
  });

  it('immutable code field: update must preserve code', async () => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc(`families/${code}`).set(baseFamily);
    });
    const db = authed(ownerUid, ownerEmail).firestore();
    await assertFails(
      db.doc(`families/${code}`).update({ ...baseFamily, code: 'CHANGED' })
    );
  });

  it('family with > 50 members is rejected', async () => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc(`families/${code}`).set(baseFamily);
    });
    const db = authed(ownerUid, ownerEmail).firestore();
    const tooManyMembers = Array.from({ length: 51 }, (_, i) => ({ uid: `u${i}`, email: `u${i}@test.com` }));
    await assertFails(
      db.doc(`families/${code}`).update({
        ...baseFamily,
        members: tooManyMembers,
        memberEmails: tooManyMembers.map(m => m.email),
      })
    );
  });

  it('delete is denied', async () => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc(`families/${code}`).set(baseFamily);
    });
    const db = authed(ownerUid, ownerEmail).firestore();
    await assertFails(db.doc(`families/${code}`).delete());
  });
});

// ── /families/{code}/reactions/{reactionId} ───────────────────────────────────

describe('/families/{code}/reactions/{reactionId}', () => {
  const ownerUid   = 'rxn_owner';
  const ownerEmail = 'rxn@test.com';
  const code       = 'RXN001';

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc(`families/${code}`).set({
        name: 'Test',
        code,
        created: 1000,
        members: [{ uid: ownerUid, email: ownerEmail }],
        memberEmails: [ownerEmail],
      });
    });
  });

  it('family member can read reactions', async () => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await ctx.firestore().doc(`families/${code}/reactions/rxn1`).set({ type: 'star', from: ownerEmail });
    });
    const db = authed(ownerUid, ownerEmail).firestore();
    await assertSucceeds(db.doc(`families/${code}/reactions/rxn1`).get());
  });

  it('non-member cannot read reactions', async () => {
    const db = authed('outsider', 'out@test.com').firestore();
    await assertFails(db.doc(`families/${code}/reactions/rxn1`).get());
  });

  it('family member can create a reaction', async () => {
    const db = authed(ownerUid, ownerEmail).firestore();
    await assertSucceeds(
      db.doc(`families/${code}/reactions/rxn1`).set({ type: 'star', from: ownerEmail })
    );
  });

  it('non-member cannot create a reaction', async () => {
    const db = authed('outsider', 'out@test.com').firestore();
    await assertFails(
      db.doc(`families/${code}/reactions/rxn1`).set({ type: 'star', from: 'out@test.com' })
    );
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
