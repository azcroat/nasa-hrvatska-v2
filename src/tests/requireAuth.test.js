// src/tests/requireAuth.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../functions/api/_verifyToken.js', () => ({
  getFirebaseUid: vi.fn(async (req) =>
    req.headers.get('authorization') === 'Bearer good' ? 'uid-1' : null,
  ),
}));
vi.mock('../../functions/api/_rateLimit.js', () => ({ checkRateLimit: vi.fn(async () => true) }));
vi.mock('../../functions/api/_aiQuota.js', () => ({
  checkAIQuota: vi.fn(async () => ({ allowed: true, remaining: 299, resetAt: 'x' })),
}));
import { requireAuthedAI } from '../../functions/api/_requireAuth.js';
import { checkAIQuota } from '../../functions/api/_aiQuota.js';

function ctx(auth, env = { FIREBASE_PROJECT_ID: 'proj', ENVIRONMENT: 'production' }) {
  const headers = { 'content-type': 'application/json', origin: 'https://nasahrvatska.com' };
  if (auth) headers.authorization = auth;
  return {
    request: new Request('https://nasahrvatska.com/api/x', { method: 'POST', headers }),
    env,
  };
}

describe('requireAuthedAI', () => {
  beforeEach(() => vi.clearAllMocks());

  it('500 fail-closed when FIREBASE_PROJECT_ID is missing (never silently open)', async () => {
    const g = await requireAuthedAI(ctx('Bearer good', { ENVIRONMENT: 'production' }), {
      cost: 1,
      rateLimit: 20,
    });
    expect(g.ok).toBe(false);
    expect(g.response.status).toBe(500);
  });

  it('401 when unauthenticated (no anonymous lane)', async () => {
    const g = await requireAuthedAI(ctx(null), { cost: 1, rateLimit: 20 });
    expect(g.ok).toBe(false);
    expect(g.response.status).toBe(401);
    expect(g.response.headers.get('content-type')).toContain('application/json');
  });

  it('passes for a signed-in user and charges quota with the given cost', async () => {
    const g = await requireAuthedAI(ctx('Bearer good'), { cost: 2, rateLimit: 20 });
    expect(g.ok).toBe(true);
    expect(g.uid).toBe('uid-1');
    expect(checkAIQuota).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'uid-1', 2);
  });

  it('429 when over quota', async () => {
    checkAIQuota.mockResolvedValueOnce({ allowed: false, remaining: 0, resetAt: 'x' });
    const g = await requireAuthedAI(ctx('Bearer good'), { cost: 1, rateLimit: 20 });
    expect(g.ok).toBe(false);
    expect(g.response.status).toBe(429);
  });
});
