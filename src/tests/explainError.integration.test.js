// src/tests/explainError.integration.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../functions/api/_requireAuth.js', () => ({
  requireAuthedAI: vi.fn(async (context) => ({
    ok: true,
    uid: 'test-uid',
    origin: context?.request?.headers?.get?.('origin') || 'https://nasahrvatska.com',
    isDev: false,
  })),
}));

import { onRequestPost } from '../../functions/api/explain-error.js';

let capturedClaudeBody = null;

beforeEach(() => {
  capturedClaudeBody = null;
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
    capturedClaudeBody = JSON.parse(init.body);
    return new Response(
      JSON.stringify({
        content: [
          {
            type: 'text',
            text: '{"explanation":"e","rule":"r","tip":"t","example":"ex"}',
          },
        ],
      }),
      { status: 200 },
    );
  });
});

function makeReq(body) {
  const kvStore = new Map();
  const stubKV = {
    get: async (key) => kvStore.get(key) ?? null,
    put: async (key, value) => {
      kvStore.set(key, value);
    },
  };
  const request = new Request('https://nasahrvatska.com/api/explain-error', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://nasahrvatska.com' },
    body: JSON.stringify(body),
  });
  const env = {
    ANTHROPIC_API_KEY: 'fake-key',
    ENVIRONMENT: 'test',
    VITE_FIREBASE_PROJECT_ID: '',
    PUSH_SUBSCRIPTIONS: stubKV,
  };
  return { request, env };
}

// Real API contract: wrong / correct / context / type / level
const baseBody = {
  wrong: 'knjiga',
  correct: 'knjigu',
  context: 'Vidim ____.',
  type: 'cloze',
  level: 'B1',
};

const validContext = {
  version: 1,
  generatedAt: Date.now(),
  level: { cefr: 'B1', xp: 1500, streak: 6 },
  weakTopics: [{ topic: 'accusative', accuracy: 0.42, attempts: 19 }],
  recentErrors: [],
  vocab: { learned: 540, dueToday: 28, hardest: [] },
};

describe('explain-error.js — integration', () => {
  it('personalized path: system prompt contains rendered context prose', async () => {
    await onRequestPost(makeReq({ ...baseBody, userContext: validContext }));
    expect(capturedClaudeBody.system).toContain('B1');
    expect(capturedClaudeBody.system).toContain('accusative');
  });

  it('fallback path: system prompt unchanged when userContext absent', async () => {
    await onRequestPost(makeReq(baseBody));
    expect(capturedClaudeBody.system).not.toContain('USER ERROR CONTEXT');
  });
});
