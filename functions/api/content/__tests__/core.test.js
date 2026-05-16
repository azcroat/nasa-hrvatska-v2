import { describe, it, expect, vi } from 'vitest';

vi.mock('../../_verifyToken.js', () => ({
  getFirebaseUid: vi.fn(),
}));

import { onRequestGet } from '../core.js';
import { getFirebaseUid } from '../../_verifyToken.js';

function makeContext({ auth = null } = {}) {
  const headers = new Headers();
  if (auth) headers.set('authorization', auth);
  headers.set('origin', 'https://nasahrvatska.com');
  return {
    request: new Request('https://nasahrvatska.com/api/content/core', { headers }),
    env: {
      FIREBASE_PROJECT_ID: 'nh-test',
      CONTENT_DAILY_CAP: '500',
      AI_QUOTA_DB: { get: async () => null, put: async () => {} },
    },
  };
}

const ALL_KEYS = [
  'V',
  'COUNTRIES',
  'PROFESSIONS',
  'WEATHER',
  'CLOTHES',
  'BODYDESC',
  'TECH_VOC',
  'BUREAUCRATIC',
  'PROVERBS',
  'IDIOMS',
  'BRZALICE',
  'HISTORY',
  'EVENTS',
  'KINGS',
  'REGIONS',
  'DIALECTS',
  'CROATIAN_CITIES',
  'FOODORDER',
  'TRANSPORT',
  'GROCERY',
  'RECIPES',
  'PRACTICAL',
  'SCENES',
  'LEVEL_NARRATIVE',
  'SHADOWING',
];

describe('GET /api/content/core', () => {
  it('returns 401 with no Bearer', async () => {
    getFirebaseUid.mockResolvedValueOnce(null);
    const res = await onRequestGet(makeContext());
    expect(res.status).toBe(401);
  });

  it('returns 200 with all 25 named exports when authed', async () => {
    getFirebaseUid.mockResolvedValueOnce('uid_test');
    const res = await onRequestGet(makeContext({ auth: 'Bearer fake' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.etag).toMatch(/^[0-9a-f]{40}$/);
    for (const k of ALL_KEYS) {
      expect(json.data, `missing export "${k}"`).toHaveProperty(k);
    }
  });

  it('ETag header matches _etags.js entry', async () => {
    getFirebaseUid.mockResolvedValueOnce('uid_test');
    const { ETAGS } = await import('../_data/_etags.js');
    const res = await onRequestGet(makeContext({ auth: 'Bearer fake' }));
    expect(res.headers.get('etag')).toBe(`"${ETAGS.core}"`);
  });

  it('returns 304 when If-None-Match matches', async () => {
    getFirebaseUid.mockResolvedValueOnce('uid_test');
    const { ETAGS } = await import('../_data/_etags.js');
    const ctx = makeContext({ auth: 'Bearer fake' });
    ctx.request.headers.set('if-none-match', `"${ETAGS.core}"`);
    const res = await onRequestGet(ctx);
    expect(res.status).toBe(304);
  });
});
