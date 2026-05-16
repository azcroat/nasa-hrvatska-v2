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
  // SP11e: function/data split shipped — both names now serialize cleanly.
  'LEARN_PATH',
  'SEASONAL_CAMPAIGNS',
];

describe('GET /api/content/core', () => {
  it('returns 401 with no Bearer', async () => {
    getFirebaseUid.mockResolvedValueOnce(null);
    const res = await onRequestGet(makeContext());
    expect(res.status).toBe(401);
  });

  it('returns 200 with all 27 named exports when authed', async () => {
    getFirebaseUid.mockResolvedValueOnce('uid_test');
    const res = await onRequestGet(makeContext({ auth: 'Bearer fake' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.etag).toMatch(/^[0-9a-f]{40}$/);
    for (const k of ALL_KEYS) {
      expect(json.data, `missing export "${k}"`).toHaveProperty(k);
    }
  });

  it('SP11e: response includes LEARN_PATH with ckRule shape (no ck functions)', async () => {
    getFirebaseUid.mockResolvedValueOnce('uid_test');
    const res = await onRequestGet(makeContext({ auth: 'Bearer fake' }));
    const json = await res.json();
    const lp = json.data.LEARN_PATH;
    expect(Array.isArray(lp)).toBe(true);
    expect(lp.length).toBe(7);
    const firstItem = lp[0].items[0];
    expect(firstItem.ckRule).toBeDefined();
    expect(Array.isArray(firstItem.ckRule.anyOf)).toBe(true);
    expect(typeof firstItem.ck).toBe('undefined');
  });

  it('SP11e: response includes SEASONAL_CAMPAIGNS with windowKind discriminator', async () => {
    getFirebaseUid.mockResolvedValueOnce('uid_test');
    const res = await onRequestGet(makeContext({ auth: 'Bearer fake' }));
    const json = await res.json();
    const sc = json.data.SEASONAL_CAMPAIGNS;
    expect(Array.isArray(sc)).toBe(true);
    expect(sc.length).toBe(4);
    const easter = sc.find((c) => c.id === 'easter');
    expect(easter.windowKind).toBe('easterRelative');
    expect(easter.windowOffsets).toEqual([-7, 1]);
    expect(typeof easter.dynamicWindow).toBe('undefined');
    expect(sc.filter((c) => c.windowKind === 'fixed').length).toBe(3);
  });

  it('SP11e: V composition applied — topic aliases populated', async () => {
    getFirebaseUid.mockResolvedValueOnce('uid_test');
    const res = await onRequestGet(makeContext({ auth: 'Bearer fake' }));
    const json = await res.json();
    expect(Array.isArray(json.data.V['Order Food'])).toBe(true);
    expect(json.data.V['Order Food'].length).toBeGreaterThan(0);
    expect(Array.isArray(json.data.V['Alphabet'])).toBe(true);
    expect(json.data.V['Alphabet'].length).toBe(30);
    expect(Array.isArray(json.data.V['Emergency'])).toBe(true);
  });

  it('SP11e: V B2 aliases resolved server-side', async () => {
    getFirebaseUid.mockResolvedValueOnce('uid_test');
    const res = await onRequestGet(makeContext({ auth: 'Bearer fake' }));
    const json = await res.json();
    expect(Array.isArray(json.data.V['journalism'])).toBe(true);
    expect(Array.isArray(json.data.V['philosophy'])).toBe(true);
    expect(Array.isArray(json.data.V['literature'])).toBe(true);
    expect(Array.isArray(json.data.V['politics'])).toBe(true);
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
