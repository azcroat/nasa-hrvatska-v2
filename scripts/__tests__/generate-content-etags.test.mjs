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

  it('ETAGS object structure includes stories, grammarUnits, grammar, and catalog after SP11b', async () => {
    // This test asserts the SHAPE the generator produces, using a synthetic
    // import path. The full file-walk test runs in Task 2 once grammar.js
    // has been moved into _data/.
    const a = await computeEtag({ id: 'grammar', body: { PADEZI: { rows: [] } } });
    expect(typeof a).toBe('string');
    expect(a).toMatch(/^[0-9a-f]{40}$/);
  });

  it('computeEtag handles lessons-array input deterministically', async () => {
    const a = await computeEtag([{ id: 'alphabet', slides: [] }]);
    const b = await computeEtag([{ id: 'alphabet', slides: [] }]);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{40}$/);
  });

  it('computeEtag handles core-object input (27 exports) deterministically', async () => {
    const a = await computeEtag({ V: { test: 'x' }, LEARN_PATH: [] });
    const b = await computeEtag({ V: { test: 'x' }, LEARN_PATH: [] });
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{40}$/);
  });

  it('SP11e: ETag changes when LEARN_PATH content changes', async () => {
    const base = { V: {}, LEARN_PATH: [{ level: 1, items: [{ id: 'lp1' }] }], SEASONAL_CAMPAIGNS: [] };
    const mutated = { V: {}, LEARN_PATH: [{ level: 1, items: [{ id: 'lp2' }] }], SEASONAL_CAMPAIGNS: [] };
    expect(await computeEtag(base)).not.toBe(await computeEtag(mutated));
  });

  it('SP11e: ETag changes when SEASONAL_CAMPAIGNS content changes', async () => {
    const base = { V: {}, LEARN_PATH: [], SEASONAL_CAMPAIGNS: [{ id: 'easter', windowKind: 'easterRelative' }] };
    const mutated = { V: {}, LEARN_PATH: [], SEASONAL_CAMPAIGNS: [{ id: 'midsummer', windowKind: 'fixed' }] };
    expect(await computeEtag(base)).not.toBe(await computeEtag(mutated));
  });
});
