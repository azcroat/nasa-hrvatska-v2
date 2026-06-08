// src/tests/aiEndpoints.devleak.test.js
import { it, expect, vi } from 'vitest';
vi.mock('../../functions/api/_requireAuth.js', () => ({
  requireAuthedAI: vi.fn(async () => ({ ok: true, uid: 'u', origin: '', isDev: false })),
}));
import { onRequestPost } from '../../functions/api/ai-chat.js';

it('does not leak upstream error text when ENVIRONMENT is unset (treated as prod)', async () => {
  // Force the Anthropic call to fail; assert the response body has no internal detail.
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('Anthropic internal boom', { status: 500 })),
  );
  const req = new Request('https://x/api/ai-chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer good' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }], mode: 'chat' }),
  });
  const res = await onRequestPost({
    request: req,
    env: { ANTHROPIC_API_KEY: 'k' /* ENVIRONMENT unset */ },
  });
  const text = await res.text();
  expect(text).not.toContain('boom');
});
