import { describe, it, expect, vi } from 'vitest';

vi.mock('../../_verifyToken.js', () => ({
  getFirebaseUid: vi.fn(),
}));

import { onRequestGet } from '../grammar.js';
import { getFirebaseUid } from '../../_verifyToken.js';

function makeContext({ auth = null } = {}) {
  const headers = new Headers();
  if (auth) headers.set('authorization', auth);
  headers.set('origin', 'https://nasahrvatska.com');
  return {
    request: new Request('https://nasahrvatska.com/api/content/grammar', { headers }),
    env: {
      FIREBASE_PROJECT_ID: 'nh-test',
      CONTENT_DAILY_CAP: '500',
      AI_QUOTA_DB: { get: async () => null, put: async () => {} },
    },
  };
}

describe('GET /api/content/grammar', () => {
  it('returns 401 with no Bearer', async () => {
    getFirebaseUid.mockResolvedValueOnce(null);
    const res = await onRequestGet(makeContext());
    expect(res.status).toBe(401);
  });

  it('returns 200 with all 13 named exports when authed', async () => {
    getFirebaseUid.mockResolvedValueOnce('uid_test');
    const res = await onRequestGet(makeContext({ auth: 'Bearer fake' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.etag).toMatch(/^[0-9a-f]{40}$/);
    for (const k of [
      'PADEZI',
      'GRAM',
      'CONJ',
      'MODAL',
      'TENSES',
      'ASPECT',
      'ASPECT_PAIRS',
      'CONDITIONAL',
      'FORMAL_REGISTER',
      'IMPERSONAL',
      'PHONOLOGY',
      'PITCH_ACCENT',
      'PADEZI_FULL',
    ]) {
      expect(json.data, `missing export "${k}"`).toHaveProperty(k);
    }
  });

  it('ETag header matches _etags.js entry', async () => {
    getFirebaseUid.mockResolvedValueOnce('uid_test');
    const { ETAGS } = await import('../_data/_etags.js');
    const res = await onRequestGet(makeContext({ auth: 'Bearer fake' }));
    expect(res.headers.get('etag')).toBe(`"${ETAGS.grammar}"`);
  });

  it('returns 304 when If-None-Match matches', async () => {
    getFirebaseUid.mockResolvedValueOnce('uid_test');
    const { ETAGS } = await import('../_data/_etags.js');
    const ctx = makeContext({ auth: 'Bearer fake' });
    ctx.request.headers.set('if-none-match', `"${ETAGS.grammar}"`);
    const res = await onRequestGet(ctx);
    expect(res.status).toBe(304);
  });
});
