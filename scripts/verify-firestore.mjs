#!/usr/bin/env node
/**
 * Firestore Data Integrity Verification
 * Naša Hrvatska — nasahrvatska.com
 *
 * Usage: node scripts/verify-firestore.mjs
 *
 * Reads Firebase config from .env (VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_API_KEY).
 * Authenticates as the test user via Firebase Auth REST, then verifies
 * key Firestore documents exist and have valid structure.
 *
 * Exit codes: 0 = all checks pass, 1 = one or more checks failed.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ─── helpers ──────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs.readFileSync(envPath, 'utf8')
      .split('\n')
      .filter(l => l.includes('=') && !l.startsWith('#'))
      .map(l => {
        const idx = l.indexOf('=');
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
      })
  );
}

function emailToId(email) {
  return email.replace(/[.#$[\]@]/g, '_');
}

let passed = 0;
let failed = 0;

function pass(label) {
  console.log(`  ✅  PASS  ${label}`);
  passed++;
}

function fail(label, detail = '') {
  console.log(`  ❌  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  failed++;
}

// ─── checks ───────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n══════════════════════════════════════════');
  console.log('  Naša Hrvatska — Firestore Verification');
  console.log('══════════════════════════════════════════\n');

  const env = loadEnv();
  const PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const API_KEY    = env.VITE_FIREBASE_API_KEY    || process.env.VITE_FIREBASE_API_KEY;

  // CHECK 1 — env vars present
  if (PROJECT_ID && API_KEY) {
    pass('CHECK 1: .env has VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_API_KEY');
  } else {
    fail('CHECK 1: Missing Firebase env vars', '.env not found or incomplete — copy .env.example and fill in values');
    console.log('\n  Cannot proceed without Firebase credentials.\n');
    process.exit(1);
  }

  // CHECK 2 — lessons data file exists and is substantial
  const lessonsPath = path.join(ROOT, 'src', 'data', 'lessons.js');
  if (fs.existsSync(lessonsPath)) {
    const size = fs.statSync(lessonsPath).size;
    if (size > 1024) {
      pass(`CHECK 2: src/data/lessons.js exists (${Math.round(size / 1024)} KB)`);
    } else {
      fail('CHECK 2: src/data/lessons.js is suspiciously small', `${size} bytes`);
    }
  } else {
    fail('CHECK 2: src/data/lessons.js not found');
  }

  // CHECK 3 — Firebase Auth sign-in
  const TEST_EMAIL    = process.env.TEST_EMAIL;
  const TEST_PASSWORD = process.env.TEST_PASSWORD;
  let idToken = null;

  try {
    const authRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, returnSecureToken: true }),
      }
    );
    const authData = await authRes.json();
    if (authRes.ok && authData.idToken) {
      idToken = authData.idToken;
      pass(`CHECK 3: Firebase Auth sign-in succeeded (uid: ${authData.localId?.slice(0, 8)}…)`);
    } else {
      fail('CHECK 3: Firebase Auth sign-in failed', authData.error?.message || authRes.status);
    }
  } catch (e) {
    fail('CHECK 3: Firebase Auth request threw', e.message);
  }

  if (!idToken) {
    console.log('\n  Cannot run Firestore checks without an ID token.\n');
    console.log(`  Passed: ${passed}  Failed: ${failed}\n`);
    process.exit(1);
  }

  const docId = emailToId(TEST_EMAIL);
  const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

  // CHECK 4 — user document exists
  let userData = null;
  try {
    const userRes = await fetch(`${FIRESTORE_BASE}/users/${docId}`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (userRes.ok) {
      userData = await userRes.json();
      pass(`CHECK 4: Firestore users/${docId} document exists`);
    } else {
      fail('CHECK 4: User document not found', `HTTP ${userRes.status}`);
    }
  } catch (e) {
    fail('CHECK 4: Firestore request threw', e.message);
  }

  // CHECK 5 — progress field is valid JSON
  let progress = null;
  if (userData) {
    const raw = userData.fields?.progress?.stringValue;
    if (!raw) {
      fail('CHECK 5: User document missing "progress" field');
    } else {
      try {
        progress = JSON.parse(raw);
        pass('CHECK 5: "progress" field is valid JSON');
      } catch {
        fail('CHECK 5: "progress" field is not valid JSON');
      }
    }
  } else {
    fail('CHECK 5: Skipped — no user document');
  }

  // CHECK 6 — progress.st.xp is a number
  if (progress) {
    if (typeof progress?.st?.xp === 'number') {
      pass(`CHECK 6: progress.st.xp is a number (${progress.st.xp} XP)`);
    } else {
      fail('CHECK 6: progress.st.xp missing or not a number');
    }
  } else {
    fail('CHECK 6: Skipped — no parsed progress');
  }

  // CHECK 7 — leaderboard document exists
  try {
    const lbRes = await fetch(`${FIRESTORE_BASE}/leaderboard/${docId}`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (lbRes.ok) {
      const lbData = await lbRes.json();
      const xp = lbData.fields?.xp?.integerValue ?? lbData.fields?.xp?.doubleValue;
      pass(`CHECK 7: leaderboard/${docId} exists (xp: ${xp ?? 'unknown'})`);
    } else {
      fail('CHECK 7: Leaderboard document not found', `HTTP ${lbRes.status}`);
    }
  } catch (e) {
    fail('CHECK 7: Leaderboard request threw', e.message);
  }

  // ─── summary ────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════');
  console.log(`  Passed: ${passed}  Failed: ${failed}`);
  console.log('══════════════════════════════════════════\n');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
