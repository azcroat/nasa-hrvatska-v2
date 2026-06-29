// src/tests/assess-speaking.integration.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub the Firebase token verifier so we control auth in tests.
vi.mock('../../functions/api/_verifyToken.js', () => ({
  getFirebaseUid: vi.fn(async (request) =>
    request.headers.get('authorization') === 'Bearer good' ? 'uid-1' : null,
  ),
}));

import { onRequestPost } from '../../functions/api/assess-speaking.js';

/** Minimal KV stub that satisfies the quota helper's get/put interface. */
function makeKvStub() {
  const store = new Map();
  return {
    get: async (key) => store.get(key) ?? null,
    put: async (key, value) => {
      store.set(key, value);
    },
  };
}

function req(body, auth) {
  return new Request('https://nasahrvatska.com/api/assess-speaking', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      origin: 'https://nasahrvatska.com',
      ...(auth ? { authorization: auth } : {}),
    },
    body: JSON.stringify(body),
  });
}

const env = () => ({
  FIREBASE_PROJECT_ID: 'proj',
  ANTHROPIC_API_KEY: 'k',
  AI: { run: vi.fn(async () => ({ text: 'Putovao sam u Zagreb prošli tjedan.' })) },
  // Quota helper requires at least one storage binding to avoid fail-closed rejection.
  PUSH_SUBSCRIPTIONS: makeKvStub(),
});

describe('POST /api/assess-speaking', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('401 when unauthenticated', async () => {
    const res = await onRequestPost({
      request: req({ level: 'B1', prompt: 'x', audioBase64: 'AAAA', mime: 'audio/webm' }),
      env: env(),
    });
    expect(res.status).toBe(401);
  });

  it('413 when the clip is too large', async () => {
    const big = 'A'.repeat(2_000_001);
    const res = await onRequestPost({
      request: req(
        { level: 'B1', prompt: 'x', audioBase64: big, mime: 'audio/webm' },
        'Bearer good',
      ),
      env: env(),
    });
    expect(res.status).toBe(413);
  });

  it('200 with rubric scores on the happy path', async () => {
    const e = env();
    // Stub the Anthropic rubric call.
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              content: [
                { type: 'text', text: '{"range":0.8,"accuracy":0.7,"fluency":0.9,"task":0.85}' },
              ],
            }),
            { status: 200 },
          ),
      ),
    );
    const res = await onRequestPost({
      request: req(
        { level: 'B1', prompt: 'Opišite putovanje.', audioBase64: 'AAAA', mime: 'audio/webm' },
        'Bearer good',
      ),
      env: e,
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.transcript).toContain('Zagreb');
    expect(json.scores.fluency).toBe(0.9);
    // Honest relabel: word-count heuristic is `transcriptSufficiency`, not `confidence`.
    expect(json.transcriptSufficiency).toBeGreaterThan(0);
    expect(json.confidence).toBeUndefined();
    // Whisper must be pinned to Croatian so short utterances aren't auto-detected as
    // Italian/Romanian etc.
    expect(e.AI.run).toHaveBeenCalledWith(
      '@cf/openai/whisper',
      expect.objectContaining({ audio: expect.any(Array), language: 'hr' }),
    );
  });

  it('iOS mp4 transcribes via the format-aware provider (Deepgram), not format-blind Workers AI', async () => {
    // Regression: Workers AI Whisper is handed a bare byte array and returns
    // empty text for iOS Safari's audio/mp4, leaving the answer ungradable. With
    // a format-aware key configured, mp4 must route there and NOT fall back to
    // Workers AI.
    const e = env();
    e.DEEPGRAM_API_KEY = 'dg-key';
    // Match the FULL origin, not a substring — `.includes('deepgram.com')` would
    // also match evil-deepgram.com.attacker.test (CodeQL js/incomplete-url-substring-sanitization).
    const isDeepgram = (u) => String(u).startsWith('https://api.deepgram.com/');
    const fetchMock = vi.fn(async (url) => {
      const u = String(url);
      if (isDeepgram(u)) {
        return new Response(
          JSON.stringify({
            results: { channels: [{ alternatives: [{ transcript: 'Idem autobusom na posao.' }] }] },
          }),
          { status: 200 },
        );
      }
      // Anthropic rubric call
      return new Response(
        JSON.stringify({
          content: [
            { type: 'text', text: '{"range":0.8,"accuracy":0.8,"fluency":0.8,"task":0.8}' },
          ],
        }),
        { status: 200 },
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await onRequestPost({
      request: req(
        { level: 'B1', prompt: 'Opišite putovanje.', audioBase64: 'AAAA', mime: 'audio/mp4' },
        'Bearer good',
      ),
      env: e,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.transcript).toContain('autobusom');
    // The format-blind Workers AI fallback must NOT have been used.
    expect(e.AI.run).not.toHaveBeenCalled();
    // Deepgram was called with the iOS mime as Content-Type (format-aware routing).
    const dgCall = fetchMock.mock.calls.find(([u]) => isDeepgram(u));
    expect(dgCall).toBeTruthy();
    expect(dgCall[1].headers['Content-Type']).toBe('audio/mp4');
  });

  it('scores a TYPED answer (no audio) without calling STT — mic-denied fallback', async () => {
    const e = env();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              content: [
                { type: 'text', text: '{"range":0.8,"accuracy":0.8,"fluency":0.8,"task":0.8}' },
              ],
            }),
            { status: 200 },
          ),
      ),
    );
    const res = await onRequestPost({
      request: req(
        { level: 'B1', prompt: 'Opišite putovanje.', text: 'Putovao sam u Zagreb prošli tjedan.' },
        'Bearer good',
      ),
      env: e,
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    // The typed answer is used directly as the transcript (no transcription).
    expect(json.transcript).toContain('Zagreb');
    expect(json.scores.range).toBe(0.8);
    expect(json.transcriptSufficiency).toBeGreaterThan(0);
    // No STT provider should be invoked for a typed answer.
    expect(e.AI.run).not.toHaveBeenCalled();
  });

  it('429 when daily quota is exceeded', async () => {
    // Seed the KV store with turns already at the per-day limit (300) so the
    // real checkAIQuota helper returns not-allowed for uid-1.
    // NOTE: limit was raised from 100 → 300 in Task 1 (generous abuse ceiling).
    const overLimitKv = makeKvStub();
    const today = new Date().toISOString().slice(0, 10);
    await overLimitKv.put(`quota:uid-1:${today}`, JSON.stringify({ turns: 300 }));

    const res = await onRequestPost({
      request: req(
        { level: 'B1', prompt: 'Opišite putovanje.', audioBase64: 'AAAA', mime: 'audio/webm' },
        'Bearer good',
      ),
      env: {
        ...env(),
        PUSH_SUBSCRIPTIONS: overLimitKv,
      },
    });
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toBe('daily_quota_exceeded');
  });
});
