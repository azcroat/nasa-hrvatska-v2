// src/tests/aiEndpoints.auth-matrix.test.js
//
// Enterprise guard: proves every paid AI endpoint (a) 401s anonymous requests and
// (b) fails closed (500) when FIREBASE_PROJECT_ID is missing from the environment.
//
// Why this matters:
//   (a) No anonymous AI lane — every real user is signed in; unconditional 401 blocks zero
//       real users while stopping cost-drain from unauthenticated rotating-IP abuse.
//   (b) Fail-closed config check — a missing env var must NEVER silently disable auth,
//       which is how the previous soft-auth pattern ("if projectId then verify else skip")
//       would pass anonymous traffic in a misconfigured deployment.
//
// If any endpoint fails either assertion, that is a REAL gap to fix — do NOT loosen
// these assertions to >= 400 or similar.

import { describe, it, expect, vi } from 'vitest';

// ── Mocks (must be declared before any dynamic imports so vitest hoisting applies) ──
// Mocking the three modules that _requireAuth and ai-quota-status depend on for
// network I/O, so the tests run without real Firebase/D1/KV bindings.

vi.mock('../../functions/api/_verifyToken.js', () => ({
  // Returns a uid only when Authorization header is present — simulates a real Firebase verify.
  // Missing project-id branch never reaches here (500 fires first in requireAuthedAI).
  getFirebaseUid: vi.fn(async (req) => {
    const auth = req.headers.get('authorization');
    return auth ? 'uid-test' : null;
  }),
}));

vi.mock('../../functions/api/_rateLimit.js', () => ({
  // Always under limit — we're testing auth, not rate limiting.
  checkRateLimit: vi.fn(async () => true),
}));

vi.mock('../../functions/api/_aiQuota.js', () => ({
  // Quota always passes — we're testing auth, not quota.
  checkAIQuota: vi.fn(async () => ({
    allowed: true,
    remaining: 299,
    resetAt: '2026-01-01T00:00:00Z',
  })),
  // getQuotaStatus is used by ai-quota-status directly.
  getQuotaStatus: vi.fn(async () => ({
    used: 0,
    limit: 300,
    remaining: 300,
    resetAt: '2026-01-01T00:00:00Z',
  })),
}));

// ── Endpoint lists ─────────────────────────────────────────────────────────────

// All endpoints that expose onRequestPost.
const POST_ENDPOINTS = [
  'correct',
  'conversational-tutor',
  'dialogue',
  'explain-error',
  'micro-lesson',
  'listening',
  'vocab-expand',
  'flash-context',
  'ai-chat',
  'conversation',
  'maja',
  'maja-debrief',
  'grammar-diagnosis',
  'daily-plan',
  'live-tutor-summary',
  'adaptive-insights',
  'photo-vocab',
  'stt',
  'pronunciation-assess',
  'pronunciation-coach',
  'translate',
  'tts',
  'assess-speaking',
  'srs-sync',
  'did-stream',
  'flux-generate',
];

// All endpoints that expose onRequestGet.
const GET_ENDPOINTS = ['news', 'daily-culture', 'npc-video', 'ai-quota-status'];

// ── Request builder ────────────────────────────────────────────────────────────

/**
 * Build a minimal Request for the given method.
 * @param {'POST'|'GET'} method
 * @param {string|null} auth  Authorization header value, or null for anonymous.
 */
function req(method, auth) {
  const headers = {
    'content-type': 'application/json',
    origin: 'https://nasahrvatska.com',
  };
  if (auth) headers.authorization = auth;
  return new Request('https://nasahrvatska.com/api/x', {
    method,
    headers,
    // POST needs a body so endpoints that parse JSON don't throw before the gate runs.
    body: method === 'POST' ? '{}' : undefined,
  });
}

// ── Matrix test ────────────────────────────────────────────────────────────────

describe('AI endpoint auth matrix — every paid endpoint', () => {
  // ── POST endpoints ──────────────────────────────────────────────────────────
  for (const name of POST_ENDPOINTS) {
    describe(name, () => {
      it('401 when unauthenticated (no auth header)', async () => {
        const mod = await import(`../../functions/api/${name}.js`);
        const handler = mod.onRequestPost;
        const res = await handler({
          request: req('POST', null),
          env: { FIREBASE_PROJECT_ID: 'proj', ENVIRONMENT: 'production' },
        });
        expect(res.status, `${name} must return 401 for anonymous requests`).toBe(401);
      });

      it('500 fail-closed when FIREBASE_PROJECT_ID is missing', async () => {
        const mod = await import(`../../functions/api/${name}.js`);
        const handler = mod.onRequestPost;
        const res = await handler({
          request: req('POST', 'Bearer anything'),
          env: { ENVIRONMENT: 'production' }, // no FIREBASE_PROJECT_ID
        });
        expect(
          res.status,
          `${name} must fail closed (500) when FIREBASE_PROJECT_ID is missing`,
        ).toBe(500);
      });
    });
  }

  // ── GET endpoints ───────────────────────────────────────────────────────────
  for (const name of GET_ENDPOINTS) {
    describe(name, () => {
      it('401 when unauthenticated (no auth header)', async () => {
        const mod = await import(`../../functions/api/${name}.js`);
        const handler = mod.onRequestGet;
        const res = await handler({
          request: req('GET', null),
          env: { FIREBASE_PROJECT_ID: 'proj', ENVIRONMENT: 'production' },
        });
        expect(res.status, `${name} must return 401 for anonymous requests`).toBe(401);
      });

      it('500 fail-closed when FIREBASE_PROJECT_ID is missing', async () => {
        const mod = await import(`../../functions/api/${name}.js`);
        const handler = mod.onRequestGet;
        const res = await handler({
          request: req('GET', 'Bearer anything'),
          env: { ENVIRONMENT: 'production' }, // no FIREBASE_PROJECT_ID
        });
        expect(
          res.status,
          `${name} must fail closed (500) when FIREBASE_PROJECT_ID is missing`,
        ).toBe(500);
      });
    });
  }
});
