import { describe, it, expect, vi } from 'vitest';

vi.mock('../../_verifyToken.js', () => ({
  getFirebaseUid: vi.fn(async () => 'uid_test'),
}));

import { onRequestGet } from '../grammar-units/[id].js';
import { ADVANCED_UNITS } from '../_data/grammarAdvanced.js';

function makeContext(id) {
  return {
    request: new Request(`https://nasahrvatska.com/api/content/grammar-units/${id}`, {
      headers: { authorization: 'Bearer fake' },
    }),
    env: {
      FIREBASE_PROJECT_ID: 'nh-test',
      CONTENT_DAILY_CAP: '500',
      AI_QUOTA_DB: { get: async () => null, put: async () => {} },
    },
    params: { id },
  };
}

describe('GET /api/content/grammar-units/[id]', () => {
  it('returns 404 for unknown id', async () => {
    const res = await onRequestGet(makeContext('does-not-exist'));
    expect(res.status).toBe(404);
  });

  it('returns 200 with full unit body for known id', async () => {
    const known = ADVANCED_UNITS[0].id;
    const res = await onRequestGet(makeContext(known));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.id).toBe(known);
    expect(json.etag).toMatch(/^[0-9a-f]{40}$/);
  });
});
