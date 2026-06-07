// src/tests/assess-speaking.integration.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub the Firebase token verifier so we control auth in tests.
vi.mock('../../functions/api/_verifyToken.js', () => ({
  getFirebaseUid: vi.fn(async (request) =>
    request.headers.get('authorization') === 'Bearer good' ? 'uid-1' : null,
  ),
}));

import { onRequestPost } from '../../functions/api/assess-speaking.js';

function req(body, auth) {
  return new Request('https://nasahrvatska.com/api/assess-speaking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(auth ? { authorization: auth } : {}) },
    body: JSON.stringify(body),
  });
}

const env = () => ({
  FIREBASE_PROJECT_ID: 'proj',
  ANTHROPIC_API_KEY: 'k',
  AI: { run: vi.fn(async () => ({ text: 'Putovao sam u Zagreb prošli tjedan.' })) },
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
    expect(json.confidence).toBeGreaterThan(0);
    expect(e.AI.run).toHaveBeenCalledWith(
      '@cf/openai/whisper',
      expect.objectContaining({ audio: expect.any(Array) }),
    );
  });
});
