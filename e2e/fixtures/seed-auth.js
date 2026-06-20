/**
 * E2E Auth Helpers
 * Seeds localStorage to bypass the login screen so tests can go straight to the app.
 * Blocks Firebase/Firestore network calls so tests are hermetic and fast.
 */

export const TEST_EMAIL = 'e2e@nasahrvatska.com';
export const TEST_NAME = 'Test Učenik';

/**
 * Inject localStorage keys before the page loads to simulate a valid logged-in session.
 * Call this with page.addInitScript before page.goto().
 *
 * @param {object} [statOverrides] - Optional overrides for the `st` stats block.
 *   CEFR formula: total = xp + lc*15 + gc*25
 *   A1 (<300) | A2 (<1200) | B1 (<3500) | B2 (<8000) | C1 (<18000) | C2
 *   Examples:
 *     seedAuth(page)              → A2 (250+150+125 = 525)
 *     seedAuth(page, {xp:1500})  → B1 (1500+150+125 = 1775)
 *     seedAuth(page, {xp:5000})  → B2 (5000+150+125 = 5275)
 */
export function seedAuth(page, statOverrides = {}) {
  return page.addInitScript(({ email, name, now, today, statOverrides }) => {
    const baseStats = {
      xp: 250, lc: 10, gc: 5, sp: 3, de: 2,
      rc: 1, pf: 2, al: 1, mv: 0, hi: 0, rs: [], ct: ['greetings','numbers','restaurant','transport','family'],
      vs: ['listening','alphabet','tenses','grammar'],
      badges: [],
    };
    localStorage.setItem('uS', JSON.stringify({ u: email, lastActive: now }));
    localStorage.setItem('uA', JSON.stringify({ [email]: { d: name, e: email } }));
    localStorage.setItem('uP_' + email, JSON.stringify({
      name,
      cp: true,
      st: { ...baseStats, ...statOverrides },
      sr: {},
      streak: { count: 5, last: today },
      favs: [],
      journal: [],
    }));
    // Pre-set a streak so streak count shows as 5
    localStorage.setItem('uStreak', JSON.stringify({ count: 5, last: today }));
    // Dismiss cookie consent dialog so it doesn't block test interactions
    localStorage.setItem('cookie_consent_v1', 'accepted');
    // Force light mode so dark-mode CSS overrides never produce low-contrast
    // quest button colours that fail WCAG AA in axe scans
    localStorage.setItem('darkMode', 'false');
    // Mark goal as set so the GoalSetterModal never blocks tests
    localStorage.setItem('nh_goal_set', '1');
    // Mark weekly recap as shown so WeeklyRecapModal never blocks tests
    localStorage.setItem('nh_weekly_recap_shown_' + new Date().toISOString().slice(0, 10).replace(/-/g, '').slice(0, 8), '1');
    // Ensure hero is always expanded so hero stats / translate pill are accessible
    localStorage.setItem('nh_hero_expanded', '1');
    // Pre-dismiss all ceremony modals (stage + streak) so they never fire mid-test
    // and block button clicks (CeremonyModal is position:fixed zIndex:9999).
    // Stage gates: [5, 11, 22, 34, 45] lessons → stages 1–5
    for (let i = 1; i <= 5; i++) {
      localStorage.setItem('nh_stage' + i + '_ceremony', '1');
    }
    localStorage.setItem('nh_ceremony_streak_30', '1');
    localStorage.setItem('nh_ceremony_streak_50', '1');
    localStorage.setItem('nh_ceremony_streak_100', '1');
    // Pre-dismiss the Premium-welcome banner (role="dialog" aria-modal) which
    // otherwise overlays buttons and breaks click targeting in Practice tests.
    localStorage.setItem('nh_premium_welcome_shown', '1');
  }, {
    email: TEST_EMAIL,
    name: TEST_NAME,
    now: Date.now(),
    today: new Date().toISOString().slice(0, 10),
    statOverrides,
  });
}

/**
 * Abort Firebase/Firestore network calls so tests run offline and don't touch
 * the real database. The app handles these failures gracefully.
 */
export async function blockFirebase(page) {
  await page.route('**/firestore.googleapis.com/**', route => route.abort());
  await page.route('**/firebase.googleapis.com/**', route => route.abort());
  await page.route('**/identitytoolkit.googleapis.com/**', route => route.abort());
  await page.route('**/securetoken.googleapis.com/**', route => route.abort());
}

/**
 * Launch a vocabulary lesson via the Browse modal.
 *
 * The Quick Vocab pills were removed from the Learn surface in the Ucenje
 * redesign (Phase 5); vocabulary now lives in BrowseContentModal's Vocabulary
 * section (open by default), where each category is a `button.tc`. Assumes the
 * page is already on /learn with the calm surface loaded ("Your Path" visible).
 */
export async function startVocabLesson(page) {
  await page.getByRole('button', { name: /Browse all lessons/ }).click();
  await page.getByText('Browse All Content').waitFor({ state: 'visible', timeout: 10_000 });
  await page.locator('#learn-section-vocabulary button.tc').first().click();
}

/**
 * Open a Grad place by its visible Croatian name (Grad replaced the old Practice
 * tab in Phase 6; the tab route key is still /practice). Assumes auth/content
 * mocks are already applied.
 */
export async function enterPlace(page, name) {
  await page.goto('/practice');
  await page.getByText('Danas u gradu').waitFor({ state: 'visible', timeout: 20_000 });
  // exact match so a short name like "Trg" doesn't collide with "…na Trgu" in the
  // Today card copy.
  await page.getByText(name, { exact: true }).first().click();
}

/**
 * Reach the Arcade hub: Grad -> Trg (the games square) -> Arcade tile.
 */
export async function openArcade(page) {
  await enterPlace(page, 'Trg');
  await page
    .getByRole('button', { name: /Arkada/ })
    .first()
    .click();
}

/**
 * Razgovor (Phase 7a): the AI tab became Razgovor — family conversation
 * partners + an "Alati" utilities shelf. Tab route key is still /ai.
 */
export async function enterPartner(page, name) {
  await page.goto('/ai');
  await page.getByText('Danas', { exact: true }).waitFor({ state: 'visible', timeout: 20_000 });
  await page.getByText(name, { exact: true }).first().click();
}

/** Open an AI utility from the collapsed "Alati" shelf by its visible label. */
export async function openAlat(page, label) {
  await page.goto('/ai');
  await page.getByText('Danas', { exact: true }).waitFor({ state: 'visible', timeout: 20_000 });
  await page.getByText('AI alati').click(); // expand the shelf
  await page.getByText(label, { exact: false }).first().click();
}

/**
 * Hrvatska (Phase 7b): the Croatia tab became a doors surface — a "Danas u
 * Hrvatskoj" card + five host-voiced doors (Priče/Krajevi/Život/Povijest i
 * jezik/Mediji). Tab route key is still /croatia. Opens a door by its visible
 * title (substring match so a door whose title carries an icon prefix still
 * matches).
 */
export async function openDoor(page, name) {
  await page.goto('/croatia');
  await page.getByText('Danas u Hrvatskoj').waitFor({ state: 'visible', timeout: 20_000 });
  await page.getByText(name).first().click();
}

/**
 * Returns the viewport-correct "Me"/profile entry-point locator.
 * Phase 4 moved profile OFF the mobile bottom bar: desktop keeps it in the
 * Sidebar ('Main navigation' > 'Me'), mobile shows it in the AppHeader
 * (data-testid 'header-profile', aria-label 'Me', desktop-hidden via CSS).
 * The bottom TabBar has no 'Me', so a nav-scoped `name: 'Me'` lookup fails on
 * mobile projects (Pixel 5 / iPhone 14). Use this everywhere instead.
 */
// NB: the AppHeader avatar is display:none on desktop but still PRESENT in the
// DOM, so a Playwright `.or()` would match two elements there and trip strict
// mode. Resolve to the element that is actually visible in the current viewport.
export async function meButton(page) {
  const sidebarMe = page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('button', { name: 'Me', exact: true });
  return (await sidebarMe.isVisible().catch(() => false))
    ? sidebarMe
    : page.getByTestId('header-profile');
}

/** Click the Me/profile entry point regardless of viewport. */
export async function clickMe(page, options) {
  await (await meButton(page)).click(options);
}

/**
 * Mock the MyMemory translation API used by Quick Translate.
 */
export async function mockTranslate(page, translatedText = 'Dobar dan') {
  await page.route('**/api/translate', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ translation: translatedText }),
  }));
}

/**
 * Mock the Cloudflare Pages Functions for TTS and AI chat to avoid real API calls in tests.
 */
export async function mockTTS(page) {
  await page.route('**/api/tts', route => route.fulfill({
    status: 200,
    contentType: 'audio/mpeg',
    body: Buffer.from([]),
  }));
  await page.route('**/api/ai-chat', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ text: 'Zdravo! Kako si?' }),
  }));
}

/**
 * Wait for the test user's stats to actually hydrate into localStorage with
 * the seeded XP value. App.tsx's onSignedIn dispatches MERGE_REMOTE from the
 * seeded uP_<email>, but that runs asynchronously after page load. Tests that
 * depend on CEFR-gated UI (Practice tab availableExercises filter, etc.) must
 * wait for this hydration to complete OR the cards they expect won't be in
 * the DOM.
 *
 * Pass `minXp` >= the value forceCefr seeded (or seedAuth's default 250).
 * Polls localStorage for up to `timeout` ms. Throws on timeout.
 */
export async function waitForStatsHydration(page, minXp, timeout = 10_000) {
  await page.waitForFunction(
    (min) => {
      try {
        const uS = JSON.parse(localStorage.getItem('uS') || '{}');
        const email = uS.u;
        if (!email) return false;
        const profile = JSON.parse(localStorage.getItem('uP_' + email) || '{}');
        const xp = profile && profile.st && typeof profile.st.xp === 'number' ? profile.st.xp : 0;
        return xp >= min;
      } catch {
        return false;
      }
    },
    minXp,
    { timeout },
  );
}

/**
 * Mock all 6 /api/content/* endpoints with the same payloads the production
 * CF Functions serve.
 *
 * Why: e2e tests run against `vite preview`, which serves static files only
 * and does NOT execute CF Pages Functions. Without this mock, every
 * /api/content/* request returns 404, the useContent/useGrammar/useLessons/
 * catalog/stories/grammar-units hooks never hydrate, and any UI that
 * consumes them (lesson screens, vocab pills, history Timeline, LearnPath
 * screen, Story of the Day card, SpeedChallenge, GradedInput, etc.) stays
 * stuck in LoadingState — blocking ~24 e2e tests across 12 spec files.
 *
 * Endpoints handled:
 *   GET /api/content/core                 → CONTENT_FIXTURE
 *   GET /api/content/grammar              → GRAMMAR_FIXTURE
 *   GET /api/content/lessons              → LESSONS_FIXTURE
 *   GET /api/content/catalog              → CATALOG_FIXTURE
 *   GET /api/content/stories/{id}         → matched via regex
 *   GET /api/content/grammar-units/{id}   → matched via regex
 *
 * Payloads come from the same server-side modules the production endpoints
 * compose (functions/api/content/_data/*.js). Playwright's page.route
 * intercepts browser fetches in node — nothing here ships to the client
 * bundle, so the SP11 bundle-audit test is unaffected.
 *
 * Call AFTER seedAuth/blockFirebase/mockTTS and BEFORE page.goto in beforeEach.
 */
export async function mockContent(page) {
  const {
    CONTENT_FIXTURE,
    GRAMMAR_FIXTURE,
    LESSONS_FIXTURE,
    CATALOG_FIXTURE,
    STORIES_BY_ID,
    GRAMMAR_UNITS_BY_ID,
  } = await import('./content-fixture.js');

  // 4 fixed-path endpoints
  const fixedRoutes = [
    ['**/api/content/core', CONTENT_FIXTURE, 'mock-core'],
    ['**/api/content/grammar', GRAMMAR_FIXTURE, 'mock-grammar'],
    ['**/api/content/lessons', LESSONS_FIXTURE, 'mock-lessons'],
    ['**/api/content/catalog', CATALOG_FIXTURE, 'mock-catalog'],
  ];
  for (const [pattern, data, etag] of fixedRoutes) {
    await page.route(pattern, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data, etag }),
        headers: { ETag: `"${etag}"` },
      }),
    );
  }

  // 2 dynamic-path endpoints: regex match the id, look it up in the map, 404 if missing
  await page.route(/\/api\/content\/stories\/([^/?]+)/, (route) => {
    const m = route.request().url().match(/\/api\/content\/stories\/([^/?#]+)/);
    const id = m ? decodeURIComponent(m[1]) : '';
    const story = STORIES_BY_ID.get(id);
    if (!story) {
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'not_found' }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: story, etag: `mock-story-${id}` }),
      headers: { ETag: `"mock-story-${id}"` },
    });
  });
  await page.route(/\/api\/content\/grammar-units\/([^/?]+)/, (route) => {
    const m = route.request().url().match(/\/api\/content\/grammar-units\/([^/?#]+)/);
    const id = m ? decodeURIComponent(m[1]) : '';
    const unit = GRAMMAR_UNITS_BY_ID.get(id);
    if (!unit) {
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'not_found' }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: unit, etag: `mock-gu-${id}` }),
      headers: { ETag: `"mock-gu-${id}"` },
    });
  });
}
