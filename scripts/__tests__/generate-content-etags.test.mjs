import { describe, it, expect } from 'vitest';
import { computeEtag } from '../generate-content-etags.mjs';

describe('generate-content-etags', () => {
  it('computeEtag returns a stable SHA-1 hex string for stable input', async () => {
    const a = await computeEtag({ id: 'x', body: 'hello' });
    const b = await computeEtag({ id: 'x', body: 'hello' });
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{40}$/);
  });

  it('computeEtag differs when content differs', async () => {
    const a = await computeEtag({ id: 'x', body: 'hello' });
    const b = await computeEtag({ id: 'x', body: 'world' });
    expect(a).not.toBe(b);
  });

  it('computeEtag is order-insensitive for object keys', async () => {
    const a = await computeEtag({ id: 'x', body: { a: 1, b: 2 } });
    const b = await computeEtag({ body: { b: 2, a: 1 }, id: 'x' });
    expect(a).toBe(b);
  });
});
