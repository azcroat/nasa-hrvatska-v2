// src/tests/grammarDiagnosis.integration.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequestPost } from '../../functions/api/grammar-diagnosis.js';

let capturedClaudeBody = null;

beforeEach(() => {
  capturedClaudeBody = null;
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
    capturedClaudeBody = JSON.parse(init.body);
    return new Response(
      JSON.stringify({ content: [{ type: 'text', text: '{"blindSpots":[]}' }] }),
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
  const request = new Request('https://nasahrvatska.com/api/grammar-diagnosis', {
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

// Real API contract: level / srMistakes / majaPatterns / writingMistakes
const baseBody = {
  level: 'A2',
  srMistakes: { mama: { wrong_count: 3, right_count: 1 } },
  majaPatterns: ['accusative confusion'],
  writingMistakes: ['Imam mama.'],
};

const validContext = {
  version: 1,
  generatedAt: Date.now(),
  level: { cefr: 'A2', xp: 800, streak: 3 },
  weakTopics: [{ topic: 'accusative', accuracy: 0.42, attempts: 19 }],
  recentErrors: [],
  vocab: { learned: 280, dueToday: 15, hardest: [] },
};

describe('grammar-diagnosis.js — integration', () => {
  it('personalized path: system prompt contains rendered context prose', async () => {
    await onRequestPost(makeReq({ ...baseBody, userContext: validContext }));
    expect(capturedClaudeBody.system).toContain('A2');
    expect(capturedClaudeBody.system).toContain('accusative');
  });

  it('fallback path: stateless when userContext absent', async () => {
    await onRequestPost(makeReq(baseBody));
    expect(capturedClaudeBody.system).not.toContain('USER ERROR CONTEXT');
  });
});
