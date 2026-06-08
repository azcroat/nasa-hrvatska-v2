// src/tests/aiQuota.limit.test.js
import { describe, it, expect } from 'vitest';
import { getQuotaStatus } from '../../functions/api/_aiQuota.js';

describe('authed daily AI quota is a generous abuse ceiling (not a paywall)', () => {
  it('limit for a signed-in user is 300/day', async () => {
    // No D1/KV bound in test env → getQuotaStatus returns the limit for the uid path.
    const status = await getQuotaStatus({}, 'uid-123');
    expect(status.limit).toBe(300);
  });
});
