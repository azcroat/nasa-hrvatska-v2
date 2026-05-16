import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../_rateLimit.js', () => ({
  checkRateLimit: vi.fn(async () => true),
}));

import { onRequestPost } from '../verify.js';

const ORIGIN = 'https://nasahrvatska.com';

function ctx({ body = {}, env = {}, headers = {}, contentType = 'application/json' } = {}) {
  return {
    request: new Request('https://nasahrvatska.com/api/turnstile/verify', {
      method: 'POST',
      headers: {
        'content-type': contentType,
        origin: ORIGIN,
        ...headers,
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    env: {
      ENVIRONMENT: 'production',
      ...env,
    },
  };
}

describe('POST /api/turnstile/verify', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns ok:true skipped:true when TURNSTILE_SECRET_KEY is not configured', async () => {
    const res = await onRequestPost(ctx({ body: { token: 'tok' }, env: {} }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true, skipped: true });
  });

  it('rejects non-JSON content-type with 400', async () => {
    const res = await onRequestPost(
      ctx({ env: { TURNSTILE_SECRET_KEY: 'sk' }, body: 'x=1', contentType: 'text/plain' }),
    );
    expect(res.status).toBe(400);
  });

  it('rejects missing token with 400', async () => {
    const res = await onRequestPost(ctx({ env: { TURNSTILE_SECRET_KEY: 'sk' }, body: {} }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it('rejects token longer than 4096 chars with 400', async () => {
    const huge = 'a'.repeat(5000);
    const res = await onRequestPost(
      ctx({ env: { TURNSTILE_SECRET_KEY: 'sk' }, body: { token: huge } }),
    );
    expect(res.status).toBe(400);
  });

  it('passes secret + token + remoteip to siteverify and returns ok on success', async () => {
    globalThis.fetch.mockResolvedValue(
      new Response(JSON.stringify({ success: true, action: 'signup' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const res = await onRequestPost(
      ctx({
        env: { TURNSTILE_SECRET_KEY: 'sk_xyz' },
        body: { token: 'cf_t', action: 'signup' },
        headers: { 'cf-connecting-ip': '203.0.113.5' },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true });

    // siteverify was called with form-encoded body
    const callArgs = globalThis.fetch.mock.calls[0];
    expect(callArgs[0]).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    const sentBody = callArgs[1].body;
    expect(sentBody).toContain('secret=sk_xyz');
    expect(sentBody).toContain('response=cf_t');
    expect(sentBody).toContain('remoteip=203.0.113.5');
  });

  it('returns 400 with codes when siteverify reports failure', async () => {
    globalThis.fetch.mockResolvedValue(
      new Response(JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const res = await onRequestPost(
      ctx({ env: { TURNSTILE_SECRET_KEY: 'sk' }, body: { token: 'bad' } }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.codes).toContain('invalid-input-response');
  });

  it('returns 400 when expected action does not match returned action', async () => {
    globalThis.fetch.mockResolvedValue(
      new Response(JSON.stringify({ success: true, action: 'login' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const res = await onRequestPost(
      ctx({
        env: { TURNSTILE_SECRET_KEY: 'sk' },
        body: { token: 't', action: 'signup' },
      }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/action mismatch/i);
  });

  it('returns 502 when siteverify network fetch throws', async () => {
    globalThis.fetch.mockRejectedValue(new Error('connection reset'));
    const res = await onRequestPost(
      ctx({ env: { TURNSTILE_SECRET_KEY: 'sk' }, body: { token: 't' } }),
    );
    expect(res.status).toBe(502);
  });
});
