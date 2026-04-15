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
 */
export function seedAuth(page) {
  return page.addInitScript(({ email, name, now, today }) => {
    localStorage.setItem('uS', JSON.stringify({ u: email, lastActive: now }));
    localStorage.setItem('uA', JSON.stringify({ [email]: { d: name, e: email } }));
    localStorage.setItem('uP_' + email, JSON.stringify({
      name,
      cp: true,
      st: {
        xp: 250, lc: 10, gc: 5, sp: 3, de: 2,
        rc: 1, pf: 2, al: 1, mv: 0, hi: 0, rs: [], ct: ['greetings','numbers','restaurant','transport','family'],
        vs: ['listening','alphabet','tenses','grammar'],
        badges: [],
      },
      sr: {},
      streak: { count: 5, last: today },
      favs: [],
      journal: [],
    }));
    // Pre-set a streak so streak count shows as 5
    localStorage.setItem('uStreak', JSON.stringify({ count: 5, last: today }));
    // Dismiss cookie consent dialog so it doesn't block test interactions
    localStorage.setItem('cookie_consent_v1', 'accepted');
    // Mark goal as set so the GoalSetterModal never blocks tests
    localStorage.setItem('nh_goal_set', '1');
    // Mark weekly recap as shown so WeeklyRecapModal never blocks tests
    localStorage.setItem('nh_weekly_recap_shown_' + new Date().toISOString().slice(0, 10).replace(/-/g, '').slice(0, 8), '1');
    // Ensure hero is always expanded so hero stats / translate pill are accessible
    localStorage.setItem('nh_hero_expanded', '1');
  }, {
    email: TEST_EMAIL,
    name: TEST_NAME,
    now: Date.now(),
    today: new Date().toISOString().slice(0, 10),
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
