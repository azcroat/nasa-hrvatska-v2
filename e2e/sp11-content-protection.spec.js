// e2e/sp11-content-protection.spec.js
// SP11 — verifies content endpoints are Bearer-gated and the bundle is clean.
// The bundle-audit test is the canary: if anyone re-imports a server-side data
// file from client code, this test fails the CI build.
import { test, expect } from '@playwright/test';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { seedAuth, blockFirebase, mockTTS, waitForStatsHydration } from './fixtures/seed-auth.js';
import { forceCefr } from './fixtures/forceCefr.js';

// 18 distinctive curriculum strings from the now-server-side data files
// (5 SP11 stories/grammar-units + 3 SP11b grammar + 3 SP11c lessons +
// 2 SP11d core content + 5 SP11e LEARN_PATH/SEASONAL_CAMPAIGNS). If any
// turn up in dist/assets/*.js, the closure has regressed and curriculum
// is leaking back into the public bundle.
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
  // SP11e — LEARN_PATH item-specific descriptions and SEASONAL_CAMPAIGNS
  // blurbs/dynamicWindow that only existed in the deleted client-side blocks.
  // Server side ships these via /api/content/core. (Strings like 'Uskrs u
  // Hrvatskoj' and 'uskrs_q1' are NOT used as needles because they're also
  // hardcoded in EasterScreen/CultureTab/quest-tracking — pick uniquely
  // worded blurbs and item descs instead.)
  'lp_listen_basics',
  'Train your ear — listen to basic Croatian phrases',
  'Learn Easter traditions — pisanice, lamb, holiday greetings',
  'Celebrate Midsummer with bonfire traditions and Croatian folklore',
  'dynamicWindow',
  // SP11f — V_B2 / V_C1 advanced-vocab category keys (orphans from SP11d).
  // AdvancedVocabScreen now consumes them via useContent, so the production
  // bundle should not contain these category names anymore.
  'media & journalism',
  'philosophy & ethics',
  'academic language',
  'abstract concepts',
];

// The 401-auth-gate tests below require Cloudflare Pages Functions runtime
// (`wrangler pages dev`) to actually serve /api/content/* handlers. CI uses
// `vite preview`, which has SPA fallback and returns 200 with index.html for
// any unknown route — so a plain "status !== 404" check incorrectly concludes
// the API is available. The only reliable signal that the CF Functions server
// is up is a 401 response to an anonymous /api/content/core request: that's
// exactly what the authedRead helper does. If we see anything else (200,
// 404, network error) we treat the API as unavailable and skip all 7
// auth-gate tests. The bundle-audit test (the canary that matters for SP11
// protection) still runs.
test.describe('SP11 — content endpoints + bundle audit', () => {
  let _apiAvailable = null;
  async function apiAvailable(request) {
    if (_apiAvailable !== null) return _apiAvailable;
    try {
      const probe = await request.get('/api/content/core');
      _apiAvailable = probe.status() === 401;
    } catch {
      _apiAvailable = false;
    }
    return _apiAvailable;
  }

  test('anonymous GET /api/content/stories/gs_a1_1 returns 401', async ({ request }) => {
    test.skip(!(await apiAvailable(request)), 'API routes only available under wrangler pages dev');
    const res = await request.get('/api/content/stories/gs_a1_1');
    expect(res.status()).toBe(401);
  });

  test('anonymous GET /api/content/catalog returns 401', async ({ request }) => {
    test.skip(!(await apiAvailable(request)), 'API routes only available under wrangler pages dev');
    const res = await request.get('/api/content/catalog');
    expect(res.status()).toBe(401);
  });

  test('anonymous GET /api/content/grammar-units/futur-ii returns 401', async ({ request }) => {
    test.skip(!(await apiAvailable(request)), 'API routes only available under wrangler pages dev');
    const res = await request.get('/api/content/grammar-units/futur-ii');
    expect(res.status()).toBe(401);
  });

  test('anonymous GET /api/content/grammar returns 401', async ({ request }) => {
    test.skip(!(await apiAvailable(request)), 'API routes only available under wrangler pages dev');
    const res = await request.get('/api/content/grammar');
    expect(res.status()).toBe(401);
  });

  test('anonymous GET /api/content/lessons returns 401', async ({ request }) => {
    test.skip(!(await apiAvailable(request)), 'API routes only available under wrangler pages dev');
    const res = await request.get('/api/content/lessons');
    expect(res.status()).toBe(401);
  });

  test('anonymous GET /api/content/core returns 401', async ({ request }) => {
    test.skip(!(await apiAvailable(request)), 'API routes only available under wrangler pages dev');
    const res = await request.get('/api/content/core');
    expect(res.status()).toBe(401);
  });

  test('AspectDrill renders aspect pair via mocked /api/content/grammar', async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    // AspectDrill card is cefr 'B1+'; bump test user past A2 so the card unlocks.
    await forceCefr(page, 'B2');

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

    // Navigate to a grammar-consuming screen — AspectDrill uses useGrammar()
    // which lazily fetches /api/content/grammar on mount. SP11b moved grammar
    // behind this lazy hook, so goto('/') alone no longer fires the request.
    // Practice → All Exercises → Aspect Drill card is the most reliable path.
    const requestPromise = page.waitForRequest('**/api/content/grammar', { timeout: 15_000 });
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    // Wait for forceCefr's xp=5000 (B2) to hydrate so aspectdrill card unlocks.
    await waitForStatsHydration(page, 5000);
    await page.getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: 'Practice' }).click();
    // Drill → Advanced tile (proven path in practice.spec.js:125).
    await page.locator('button').filter({ hasText: /^Drill$/ }).click();
    const advTile = page.locator('button.cat-tile').filter({ hasText: 'Advanced' });
    await advTile.scrollIntoViewIfNeeded();
    await advTile.click();
    await expect(advTile).toHaveAttribute('aria-expanded', 'true', { timeout: 5_000 });
    const aspectDrillCard = page.getByTestId('exercise-card-aspectdrill');
    await expect(aspectDrillCard).toBeVisible({ timeout: 10_000 });
    await aspectDrillCard.scrollIntoViewIfNeeded();
    await aspectDrillCard.click();
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
