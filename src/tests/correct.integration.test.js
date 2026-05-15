// src/tests/correct.integration.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequestPost } from '../../functions/api/correct.js';

function makeReq(body, env = {}) {
  const kvStore = new Map();
  const stubKV = {
    get: async (key) => kvStore.get(key) ?? null,
    put: async (key, value) => {
      kvStore.set(key, value);
    },
  };
  const baseEnv = {
    ANTHROPIC_API_KEY: 'fake-key',
    ENVIRONMENT: 'test',
    VITE_FIREBASE_PROJECT_ID: '',
    PUSH_SUBSCRIPTIONS: stubKV,
    ...env,
  };
  const request = new Request('https://nasahrvatska.com/api/correct', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://nasahrvatska.com' },
    body: JSON.stringify(body),
  });
  return { request, env: baseEnv };
}

let capturedClaudeBody = null;

beforeEach(() => {
  capturedClaudeBody = null;
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
    capturedClaudeBody = JSON.parse(init.body);
    return new Response(
      JSON.stringify({ content: [{ type: 'text', text: '{"corrected_text":"x","score":80}' }] }),
      { status: 200 },
    );
  });
});

const baseBody = {
  prompt: 'Write 3 sentences about your family.',
  text: 'Imam mama i tata.',
};

const validContext = {
  version: 1,
  generatedAt: Date.now(),
  level: { cefr: 'B1', xp: 1500, streak: 6 },
  weakTopics: [{ topic: 'accusative', accuracy: 0.42, attempts: 19 }],
  recentErrors: [
    {
      topic: 'accusative',
      prompt: 'Vidim ____ knjigu',
      userAnswer: 'knjiga',
      correctAnswer: 'knjigu',
      minutesAgo: 5,
    },
  ],
  vocab: { learned: 540, dueToday: 28, hardest: ['studeni'] },
};

describe('correct.js — integration', () => {
  it('personalized path: system prompt contains rendered context prose', async () => {
    const ctx = makeReq({ ...baseBody, userContext: validContext });
    await onRequestPost(ctx);
    expect(capturedClaudeBody.system).toContain('B1');
    expect(capturedClaudeBody.system).toContain('accusative');
    expect(capturedClaudeBody.system).toContain('knjigu');
  });

  it('fallback path: system prompt does NOT contain context prose when userContext missing', async () => {
    const ctx = makeReq(baseBody);
    await onRequestPost(ctx);
    expect(capturedClaudeBody.system).not.toContain('USER ERROR CONTEXT');
  });
});
