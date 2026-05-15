// e2e/fixtures/mockRnd.js
// SP10: overrides Math.random() to return a fixed value.

export async function mockRnd(page, value = 0) {
  if (typeof value !== 'number' || value < 0 || value >= 1) {
    throw new Error('mockRnd value must be in [0, 1)');
  }
  await page.addInitScript((v) => {
    Math.random = () => v;
  }, value);
}
