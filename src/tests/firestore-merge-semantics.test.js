/**
 * firestore-merge-semantics.test.js — EMULATOR test (real Firestore semantics).
 *
 * Run with: npx firebase emulators:exec --only firestore "vitest run src/tests/firestore-merge-semantics.test.js"
 * Excluded from the normal `vitest run` (needs the emulator on 127.0.0.1:8080).
 *
 * WHY THIS EXISTS: commit 44e45e1 folded the atomic-array reconciliation into
 * the fbSaveProgress writeBatch as a NESTED stats map written via
 * set({ merge: true }):
 *     b.set(usersRef, { progress, ..., stats: { vs: arrayUnion(...), ct: ... } }, { merge: true })
 * A code review raised a CRITICAL concern: that set({merge:true}) only does a
 * SHALLOW top-level merge, which would REPLACE the entire `stats` map and wipe
 * stats.xp / stats.lc (written elsewhere via increment() in fbApplyDelta).
 *
 * This test settles that against the REAL Firestore engine, not docs or mocks.
 * It exercises the exact operation shape fbSaveProgress uses. If the disputed
 * invariant (siblings preserved) is FALSE, the stats.xp assertions fail and the
 * fix is a data-corruption bug.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RULES_PATH = resolve(__dirname, '../../firestore.rules');
const FieldValue = firebase.firestore.FieldValue;

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'nasa-hrvatska-merge-test',
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

describe('Firestore set({merge:true}) nested-map semantics — guards fbSaveProgress fix 44e45e1', () => {
  it('nested-map set({merge:true}) PRESERVES sibling scalar fields (the disputed invariant)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const ref = ctx.firestore().doc('users/u1');
      // Seed: stats already holds xp/lc (as fbApplyDelta would have written).
      await ref.set({ stats: { xp: 100, lc: 5 } });
      // The EXACT operation fbSaveProgress performs: a nested `stats` map written
      // with merge:true alongside other top-level fields.
      await ref.set({ progress: 'blob', stats: { vs: ['a', 'b'] } }, { merge: true });

      const data = (await ref.get()).data();
      // If merge were shallow, stats.xp/lc would be GONE here.
      expect(data.stats.xp).toBe(100);
      expect(data.stats.lc).toBe(5);
      expect(data.stats.vs).toEqual(['a', 'b']);
      expect(data.progress).toBe('blob');
    });
  });

  it('arrayUnion() INSIDE a nested map under merge:true unions arrays AND keeps siblings', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const ref = ctx.firestore().doc('users/u2');
      await ref.set({ stats: { xp: 100, vs: ['old'], ct: ['A1'] } });
      // Production shape from _buildStatsUnion: { stats: { vs: arrayUnion(...), ct: arrayUnion(...) } }
      await ref.set(
        { stats: { vs: FieldValue.arrayUnion('new'), ct: FieldValue.arrayUnion('B1') } },
        { merge: true },
      );

      const stats = (await ref.get()).data().stats;
      expect(stats.xp).toBe(100); // sibling scalar preserved
      expect([...stats.vs].sort()).toEqual(['new', 'old']); // unioned, not replaced
      expect([...stats.ct].sort()).toEqual(['A1', 'B1']);
    });
  });

  it('end-to-end: increment() (fbApplyDelta) then nested-map merge set (fbSaveProgress) keeps the counter', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const ref = ctx.firestore().doc('users/u3');
      await ref.set({ stats: { xp: 0 } });
      // fbApplyDelta path: atomic increment of stats.xp via dot notation.
      await ref.update({ 'stats.xp': FieldValue.increment(50) });
      // fbSaveProgress path: nested-map reconcile write.
      await ref.set({ stats: { vs: FieldValue.arrayUnion('x') } }, { merge: true });

      const stats = (await ref.get()).data().stats;
      expect(stats.xp).toBe(50); // the increment must NOT be reset by the reconcile write
      expect(stats.vs).toEqual(['x']);
    });
  });
});
