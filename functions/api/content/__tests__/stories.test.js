import { describe, it, expect, vi } from 'vitest';

vi.mock('../../_verifyToken.js', () => ({
  getFirebaseUid: vi.fn(async () => 'uid_test'),
}));

import { onRequestGet } from '../stories/[id].js';
import { GRADED_STORIES } from '../_data/gradedStories.js';

function makeContext(id) {
  return {
    request: new Request(`https://nasahrvatska.com/api/content/stories/${id}`, {
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

describe('GET /api/content/stories/[id]', () => {
  it('returns 404 for unknown id', async () => {
    const res = await onRequestGet(makeContext('does-not-exist'));
    expect(res.status).toBe(404);
  });

  it('returns 200 with full story body for known id', async () => {
    const known = GRADED_STORIES[0].id;
    const res = await onRequestGet(makeContext(known));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.id).toBe(known);
    const fullStory = GRADED_STORIES[0];
    expect(json.data).toEqual(fullStory);
    expect(json.etag).toMatch(/^[0-9a-f]{40}$/);
  });

  it('ETag header in response matches _etags.js entry', async () => {
    const { ETAGS } = await import('../_data/_etags.js');
    const known = GRADED_STORIES[0].id;
    const res = await onRequestGet(makeContext(known));
    expect(res.headers.get('etag')).toBe(`"${ETAGS.stories[known]}"`);
  });
});
