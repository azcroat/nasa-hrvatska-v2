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

  it('story catalog entries include display metadata but never the IP body', async () => {
    const res = await onRequestGet(makeContext());
    const json = await res.json();
    const s = json.data.stories[0];
    // Display metadata used by StoryOfTheDayCard + recommendStory()
    for (const k of [
      'id',
      'level',
      'title',
      'titleEn',
      'focus',
      'icon',
      'duration',
      'levelColor',
      'levelBg',
      'etag',
    ]) {
      expect(s, `story catalog entry missing "${k}"`).toHaveProperty(k);
    }
    // The IP: must NEVER appear in the catalog (actual field names from gradedStories.js)
    for (const k of ['paragraphs', 'vocabulary', 'quiz', 'intro']) {
      expect(s, `story catalog entry leaks IP field "${k}"`).not.toHaveProperty(k);
    }
  });

  it('grammar-unit catalog entries include display metadata but never the IP body', async () => {
    const res = await onRequestGet(makeContext());
    const json = await res.json();
    const u = json.data.grammarUnits[0];
    for (const k of ['id', 'level', 'title', 'subtitle', 'focus', 'etag']) {
      expect(u, `grammar catalog entry missing "${k}"`).toHaveProperty(k);
    }
    // The IP: must NEVER appear in the catalog (actual field names from grammarAdvanced.js)
    for (const k of ['intro', 'forms', 'examples', 'tips', 'drills']) {
      expect(u, `grammar catalog entry leaks IP field "${k}"`).not.toHaveProperty(k);
    }
  });
});
