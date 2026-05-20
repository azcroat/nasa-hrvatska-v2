// e2e/fixtures/mockRnd.js
// SP10: overrides Math.random() AND crypto.getRandomValues() to a fixed value.
//
// src/lib/random.ts's rnd() uses crypto.getRandomValues — NOT Math.random — so
// overriding Math.random alone leaves rnd() returning real entropy. That made
// SP4b's "production exercise = speaking_sprint when rnd=0" test fail 80% of
// the time in CI (P(all 3 retries miss) = 0.512). Override both so rnd() is
// deterministic for any code path that reaches it.

export async function mockRnd(page, value = 0) {
  if (typeof value !== 'number' || value < 0 || value >= 1) {
    throw new Error('mockRnd value must be in [0, 1)');
  }
  await page.addInitScript((v) => {
    Math.random = () => v;
    // rnd() computes: a[0] / 4294967296 — so a[0] must be floor(v * 2^32).
    // Replace getRandomValues with a stub that writes that into a[0]. Keep
    // the rest of the array zeroed; we only care about a[0] for rnd().
    const targetU32 = Math.floor(v * 4294967296);
    const realCrypto = globalThis.crypto;
    if (realCrypto && typeof realCrypto.getRandomValues === 'function') {
      realCrypto.getRandomValues = function (arr) {
        if (arr && typeof arr.length === 'number' && arr.length > 0) {
          arr[0] = targetU32;
          for (let i = 1; i < arr.length; i++) arr[i] = 0;
        }
        return arr;
      };
    }
  }, value);
}
