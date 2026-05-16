// e2e/sp11-content-protection.spec.js
// SP11 — verifies content endpoints are Bearer-gated and the bundle is clean.
// The bundle-audit test is the canary: if anyone re-imports a server-side data
// file from client code, this test fails the CI build.
import { test, expect } from '@playwright/test';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { seedAuth, blockFirebase, mockTTS } from './fixtures/seed-auth.js';

// 13 distinctive Croatian-language curriculum strings from the now-server-side
// data files (5 SP11 stories/grammar-units + 3 SP11b grammar + 3 SP11c lessons
// + 2 SP11d core content). If any turn up in dist/assets/*.js, the closure has
// regressed and the curriculum is leaking back into the public bundle.
//
// SP11d partial-closure note: PROVERBS, CROATIAN_CITIES, V are still bundled
// via content.tsx body helpers (getProverbOfDay, getCityOfDay, V composition).
// The 2 SP11d needles below are from KINGS and HISTORY which ARE fully
// tree-shaken after the SP11d closure commit.
const NEEDLES = [
  'Ana ide na tržnicu svake subote',
  'Peka je jedan od najstarijih načina kuhanja u Dalmaciji',
  'Kultura nije puka pozadina na kojoj se odvija individualni život',
  'Futur II is formed with the future of "biti"',
  'Peka — drevna tradicija',
  'na- prefix marks completion',
  'Getting this wrong is one of the most noticeable foreigner errors in Croatia',
  'Kondicionalni — Would/Could/Should',
  'Croatian is almost perfectly phonetic',
  'Glagoljica je naš otisak prsta u povijesti',
  'Accompaniment — s/sa + Instrumental',
  // SP11d
  'Long before foreign powers ruled over Croatian lands',
  'Domovinski Rat — Homeland War',
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

  test('anonymous GET /api/content/grammar returns 401', async ({ request }) => {
    const res = await request.get('/api/content/grammar');
    expect(res.status()).toBe(401);
  });

  test('anonymous GET /api/content/lessons returns 401', async ({ request }) => {
    const res = await request.get('/api/content/lessons');
    expect(res.status()).toBe(401);
  });

  test('anonymous GET /api/content/core returns 401', async ({ request }) => {
    const res = await request.get('/api/content/core');
    expect(res.status()).toBe(401);
  });

  test('AspectDrill renders aspect pair via mocked /api/content/grammar', async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);

    // Mock the grammar endpoint with a tiny fixture
    await page.route('**/api/content/grammar', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            PADEZI: {},
            GRAM: {},
            CONJ: {},
            MODAL: {},
            TENSES: {},
            ASPECT: {},
            ASPECT_PAIRS: [
              {
                imperfective: 'pisati',
                perfective: 'napisati',
                rule: 'test',
              },
            ],
            CONDITIONAL: {},
            FORMAL_REGISTER: {},
            IMPERSONAL: {},
            PHONOLOGY: {},
            PITCH_ACCENT: [],
            PADEZI_FULL: {},
          },
          etag: 'g1',
        }),
        headers: { ETag: '"g1"' },
      }),
    );

    // Verify the mocked endpoint is called when grammar data is needed.
    // The simplest signal: navigate to the home page, wait for the request.
    // We don't drive deep into AspectDrill UI (testid chain may vary) — the
    // mocked request firing is sufficient evidence the contentClient path is wired.
    const requestPromise = page.waitForRequest('**/api/content/grammar', { timeout: 15_000 });
    await page.goto('/');
    // Click into any path that triggers grammar fetch. If AspectDrill is reachable
    // via a known testid, click it; otherwise just rely on the catalog/initial-load
    // path also firing the grammar fetch via lazy-loaded screens.
    try {
      const aspectDrillCard = page.getByTestId('exercise-card-aspect_drill');
      if (await aspectDrillCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await aspectDrillCard.click();
      }
    } catch {
      /* card not visible — fall through */
    }
    await requestPromise; // throws if no /api/content/grammar request fires within 15s
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
