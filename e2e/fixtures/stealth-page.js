import { test as base } from '@playwright/test';

// Patches navigator.webdriver and other fingerprinting vectors Cloudflare checks,
// so Playwright runs without triggering the bot-challenge page.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
      window.chrome = { runtime: {} };
    });
    await use(page);
  },
});

export { expect } from '@playwright/test';
