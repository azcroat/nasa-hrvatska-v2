// src/tests/aiChat.integration.test.js
// SP5 Task 13: ai-chat.js hint/explain/story modes consume userContext.
// Untouched modes (translate, eval, correct, convo, etc.) must produce byte-identical prompts.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequestPost } from '../../functions/api/ai-chat.js';

let capturedClaudeBody = null;

beforeEach(() => {
  capturedClaudeBody = null;
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
    capturedClaudeBody = JSON.parse(init.body);
    return new Response(
      JSON.stringify({
        content: [{ type: 'text', text: '{"title":"x","translation":"hello"}' }],
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
  const request = new Request('https://nasahrvatska.com/api/ai-chat', {
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

const validContext = {
  version: 1,
  generatedAt: Date.now(),
  level: { cefr: 'B1', xp: 1500, streak: 6 },
  weakTopics: [{ topic: 'accusative', accuracy: 0.42, attempts: 19 }],
  recentErrors: [],
  vocab: { learned: 540, dueToday: 28, hardest: [] },
};

describe('ai-chat.js — integration', () => {
  it('hint mode: personalized path adds hint context prose', async () => {
    await onRequestPost(
      makeReq({
        mode: 'hint',
        params: { topic: 'accusative' },
        messages: [{ role: 'user', content: 'I need a hint' }],
        userContext: validContext,
      }),
    );
    expect(capturedClaudeBody.system).toContain('B1');
    expect(capturedClaudeBody.system).toContain('weak in accusative');
  });

  it('explain mode: personalized path adds tutor context prose', async () => {
    await onRequestPost(
      makeReq({
        mode: 'explain',
        params: { topic: 'accusative', level: 'B1' },
        userContext: validContext,
      }),
    );
    expect(capturedClaudeBody.system).toContain('TUTOR CONTEXT');
  });

  it('story mode: personalized path adds story context prose', async () => {
    await onRequestPost(
      makeReq({
        mode: 'story',
        params: { city: 'Split', region: 'Dalmacija', level: 'B1' },
        messages: [{ role: 'user', content: 'Generate a story' }],
        userContext: validContext,
      }),
    );
    expect(capturedClaudeBody.system).toContain('STORY CONTEXT');
  });

  it('untouched modes (e.g., translate) do NOT receive context prose', async () => {
    await onRequestPost(
      makeReq({
        mode: 'translate',
        params: {},
        messages: [{ role: 'user', content: 'hello' }],
        userContext: validContext,
      }),
    );
    expect(capturedClaudeBody.system).not.toContain('TUTOR CONTEXT');
    expect(capturedClaudeBody.system).not.toContain('STORY CONTEXT');
    expect(capturedClaudeBody.system).not.toContain('weak in');
  });
});
