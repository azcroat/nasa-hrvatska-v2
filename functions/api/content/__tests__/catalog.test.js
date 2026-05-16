import { describe, it, expect, vi } from 'vitest';

vi.mock('../../_verifyToken.js', () => ({
  getFirebaseUid: vi.fn(async () => 'uid_test'),
}));

import { onRequestGet } from '../catalog.js';

function makeContext() {
  return {
    request: new Request('https://nasahrvatska.com/api/content/catalog', {
      headers: { authorization: 'Bearer fake', origin: 'https://nasahrvatska.com' },
    }),
    env: {
      FIREBASE_PROJECT_ID: 'nh-test',
      CONTENT_DAILY_CAP: '500',
      AI_QUOTA_DB: { get: async () => null, put: async () => {} },
    },
  };
}

describe('GET /api/content/catalog', () => {
  it('returns 200 with stories and grammarUnits arrays', async () => {
    const res = await onRequestGet(makeContext());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.data.stories)).toBe(true);
    expect(Array.isArray(json.data.grammarUnits)).toBe(true);
    expect(json.data.stories.length).toBeGreaterThan(0);
    expect(json.data.grammarUnits.length).toBeGreaterThan(0);
    expect(json.etag).toMatch(/^[0-9a-f]{40}$/);
  });

  it('catalog entries include id, level, title, etag - never full body', async () => {
    const res = await onRequestGet(makeContext());
    const json = await res.json();
    const s = json.data.stories[0];
    expect(s).toHaveProperty('id');
    expect(s).toHaveProperty('level');
    expect(s).toHaveProperty('title');
    expect(s).toHaveProperty('etag');
    // Catalog must NOT leak full content
    expect(s).not.toHaveProperty('paragraphs');
    expect(s).not.toHaveProperty('quizzes');
    expect(s).not.toHaveProperty('vocab');
  });
});
