// e2e/ai-listening.spec.js
//
// E2E tests for AIListeningScreen, launched exclusively from the AI Tutor tab
// (consolidation refactor 2026-05-24 moved this surface out of PracticeTab).
//
// Each test enters via /ai → "AI Listening" card → AIListeningScreen,
// then asserts the behavioural contract:
//   - Setup screen renders heading, level badge, all 10 topic buttons.
//   - Generate → is disabled before topic selection, enabled after.
//   - Generate → transitions through loading → listening phase.
//   - Listening phase shows content title, audio control, transcript toggle,
//     vocab section, and the post-ready "I'm Ready — Take the Quiz" CTA.
//
// Recovered (with re-wired navigation) from practice.spec.js@621eb04. The
// previous AI Listening entry point under Practice → Quick Game → AI
// Challenges no longer exists.
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, mockContent } from './fixtures/seed-auth.js';

// ---------------------------------------------------------------------------
// Shared mock — preserved verbatim from the original test block.
// ---------------------------------------------------------------------------

const MOCK_LISTENING_RESPONSE = {
  title: 'U kafiću',
  en_summary: 'At the café',
  speakers: [
    { name: 'Maja', lines: ['Dobar dan! Što želite?', 'Hvala lijepa!'] },
    { name: 'Marko', lines: ['Jednu kavu, molim.', 'I ja, hvala.'] },
  ],
  narrator: null,
  vocab: [{ hr: 'kava', en: 'coffee' }],
  questions: [
    { q: 'What does Marko order?', options: ['Coffee', 'Tea', 'Water', 'Juice'], correct: 0 },
  ],
};

// ---------------------------------------------------------------------------
// Helper — navigate to AIListeningScreen via the AI Tutor tab.
// AITab is lazy-loaded and React.Suspense swaps the fallback for the loaded
// chunk; wait on toBeVisible (which auto-retries on stable + attached) rather
// than scrollIntoViewIfNeeded which can race the swap.
// ---------------------------------------------------------------------------
async function openAIListening(page) {
  await page.goto('/ai');
  await page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
    timeout: 20_000,
  });
  const card = page.locator('button').filter({ hasText: 'AI Listening' }).first();
  await expect(card).toBeVisible({ timeout: 20_000 });
  await card.click();
  await expect(page.getByText('🎧 AI Listening')).toBeVisible({ timeout: 15_000 });
}

test.describe('AIListeningScreen', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    // Mock the /api/listening endpoint to return our fixture immediately
    await page.route('**/api/listening', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LISTENING_RESPONSE),
      }),
    );
  });

  test('opens from the AI Tutor tab and renders the setup heading', async ({ page }) => {
    await openAIListening(page);
    // Heading visibility is the openAIListening helper's exit assertion.
  });

  test('setup screen shows a Level badge', async ({ page }) => {
    await openAIListening(page);
    // Level badge shows the current CEFR level followed by "Level" — e.g. "B1 Level"
    // Use anchored regex to match the badge element exactly and avoid strict-mode violations
    await expect(page.getByText(/^[A-C][12] Level$/)).toBeVisible({ timeout: 3_000 });
  });

  test('all 10 topic buttons are visible', async ({ page }) => {
    await openAIListening(page);
    const topicTexts = [
      'U kafiću',
      'Na tržnici',
      'Obitelj',
      'Putovanje',
      'Vrijeme',
      'Sport',
      'Posao',
      'Vikend',
      'Restoran',
      'Grad',
    ];
    for (const topic of topicTexts) {
      await expect(page.locator('button').filter({ hasText: topic })).toBeVisible({
        timeout: 5_000,
      });
    }
  });

  test('Generate → button is disabled before selecting a topic', async ({ page }) => {
    await openAIListening(page);
    const generateBtn = page.locator('button.b.bp').filter({ hasText: /Generate →/ });
    await expect(generateBtn).toBeDisabled({ timeout: 3_000 });
  });

  test('selecting a topic enables the Generate → button', async ({ page }) => {
    await openAIListening(page);
    // Select the first topic "U kafiću"
    await page.locator('button').filter({ hasText: 'U kafiću' }).click();
    const generateBtn = page.locator('button.b.bp').filter({ hasText: /Generate →/ });
    await expect(generateBtn).toBeEnabled({ timeout: 3_000 });
  });

  test('clicking Generate → transitions to the listening phase showing content title', async ({
    page,
  }) => {
    await openAIListening(page);
    await page.locator('button').filter({ hasText: 'U kafiću' }).click();
    await page
      .locator('button.b.bp')
      .filter({ hasText: /Generate →/ })
      .click();
    // Should move through loading → listening; listening phase shows content.title in the heading
    await expect(page.getByText('U kafiću')).toBeVisible({ timeout: 10_000 });
  });

  test('listening phase shows Play/Pause audio control button', async ({ page }) => {
    await openAIListening(page);
    await page.locator('button').filter({ hasText: 'U kafiću' }).click();
    await page
      .locator('button.b.bp')
      .filter({ hasText: /Generate →/ })
      .click();
    // listening phase audio control: aria-label "Play audio" or "Pause audio"
    await expect(
      page.locator('button[aria-label="Play audio"], button[aria-label="Pause audio"]'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('listening phase has Show Transcript / Hide Transcript toggle', async ({ page }) => {
    await openAIListening(page);
    await page.locator('button').filter({ hasText: 'U kafiću' }).click();
    await page
      .locator('button.b.bp')
      .filter({ hasText: /Generate →/ })
      .click();
    await expect(page.getByText(/Show Transcript|Hide Transcript/)).toBeVisible({
      timeout: 10_000,
    });
  });

  test('listening phase shows vocab section with the mock vocabulary', async ({ page }) => {
    await openAIListening(page);
    await page.locator('button').filter({ hasText: 'U kafiću' }).click();
    await page
      .locator('button.b.bp')
      .filter({ hasText: /Generate →/ })
      .click();
    // Vocabulary section contains the word from MOCK_LISTENING_RESPONSE.vocab
    await expect(page.getByText('kava')).toBeVisible({ timeout: 10_000 });
  });

  test('"I\'m Ready — Take the Quiz →" button appears after the ready timer (readyVisible)', async ({
    page,
  }) => {
    await openAIListening(page);
    await page.locator('button').filter({ hasText: 'U kafiću' }).click();
    await page
      .locator('button.b.bp')
      .filter({ hasText: /Generate →/ })
      .click();
    // The component sets readyVisible after 5s or after audio ends. The audio onended path only
    // fires when the user clicks play (getAudio() is called lazily); since this test never clicks
    // play, the only trigger is the 5s timer. Under CI load: generate API + TTS mock + blob→dataURL
    // + React render + 5s timer can exceed 10s. 20s absorbs CI variance without weakening the
    // assertion — readyVisible=true is a real UI state that must appear.
    await expect(page.getByText("I'm Ready — Take the Quiz →")).toBeVisible({ timeout: 20_000 });
  });
});
