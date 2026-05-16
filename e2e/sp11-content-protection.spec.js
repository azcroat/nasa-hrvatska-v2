// e2e/sp11-content-protection.spec.js
// SP11 — verifies content endpoints are Bearer-gated and the bundle is clean.
// The bundle-audit test is the canary: if anyone re-imports a server-side data
// file from client code, this test fails the CI build.
import { test, expect } from '@playwright/test';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { seedAuth, blockFirebase, mockTTS } from './fixtures/seed-auth.js';

// 5 distinctive Croatian-language curriculum strings from the now-server-side
// data files. If any of these turn up in dist/assets/*.js, the SP11 closure has
// regressed and the curriculum is leaking back into the public bundle.
const NEEDLES = [
  'Ana ide na tržnicu svake subote',
  'Peka je jedan od najstarijih načina kuhanja u Dalmaciji',
  'Kultura nije puka pozadina na kojoj se odvija individualni život',
  'Futur II is formed with the future of "biti"',
  'Peka — drevna tradicija',
];

test.describe('SP11 — content endpoints + bundle audit', () => {
  test('anonymous GET /api/content/stories/gs_a1_1 returns 401', async ({ request }) => {
    const res = await request.get('/api/content/stories/gs_a1_1');
    expect(res.status()).toBe(401);
  });

  test('anonymous GET /api/content/catalog returns 401', async ({ request }) => {
    const res = await request.get('/api/content/catalog');
    expect(res.status()).toBe(401);
  });

  test('anonymous GET /api/content/grammar-units/futur-ii returns 401', async ({ request }) => {
    const res = await request.get('/api/content/grammar-units/futur-ii');
    expect(res.status()).toBe(401);
  });

  test('Story of the Day card renders when endpoints are mocked', async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);

    // Mock the catalog so the card has data to render
    await page.route('**/api/content/catalog', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            stories: [
              {
                id: 'gs_a1_1',
                level: 'A1',
                title: 'Test priča',
                titleEn: 'Test story',
                focus: 'accusative',
                icon: '📖',
                duration: 5,
                intro: 'A test story for e2e.',
                levelColor: '#166534',
                levelBg: '#dcfce7',
                etag: 'e1',
              },
            ],
            grammarUnits: [],
          },
          etag: 'cat1',
        }),
        headers: { ETag: '"cat1"' },
      }),
    );

    await page.goto('/');
    await expect(page.getByTestId('story-of-the-day-card')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText('Test priča')).toBeVisible();
  });

  test('bundle audit: no curriculum needles in dist/assets/*.js', async () => {
    const distDir = resolve(process.cwd(), 'dist', 'assets');
    let files;
    try {
      files = (await readdir(distDir)).filter((f) => f.endsWith('.js'));
    } catch {
      test.skip(true, 'dist/ not built — run `npm run build` before this spec');
      return;
    }
    const contents = await Promise.all(
      files.map((f) => readFile(resolve(distDir, f), 'utf8')),
    );
    const combined = contents.join('\n');
    for (const needle of NEEDLES) {
      expect(combined, `needle "${needle}" must NOT appear in built bundle`).not.toContain(needle);
    }
  });
});
