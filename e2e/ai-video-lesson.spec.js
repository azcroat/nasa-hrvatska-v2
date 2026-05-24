// e2e/ai-video-lesson.spec.js
//
// E2E tests for VideoLessonScreen, launched exclusively from the AI Tutor tab
// (consolidation refactor 2026-05-24 moved this surface out of PracticeTab).
//
// Each test enters via /ai → "AI Video Lesson" card → VideoLessonScreen,
// then asserts the behavioural contract:
//   - Setup screen renders heading, "Choose a Topic", "Difficulty Level"
//     A1–C2 selector, disabled Start CTA until a topic is selected.
//   - Selecting a topic re-labels Start to "▶ Start Lesson — {topic.hr}"
//     and enables the button.
//   - Generating transitions to playing phase: "▶ Play Dialogue", transcript
//     toggle, "Skip to Questions →".
//   - Skip → transitions to quiz phase: "Comprehension Check" heading and
//     "1 / N" question counter.
//
// Recovered (with re-wired navigation) from practice.spec.js@621eb04. The
// previous Video Lesson entry point under Practice → Quick Game → AI
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
// Helper — navigate to VideoLessonScreen via the AI Tutor tab.
// ---------------------------------------------------------------------------
async function openAIVideoLesson(page) {
  await page.goto('/ai');
  await page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
    timeout: 20_000,
  });
  const card = page.locator('button').filter({ hasText: 'AI Video Lesson' }).first();
  await expect(card).toBeVisible({ timeout: 20_000 });
  await card.click();
  await expect(page.getByText('🎬 Video Lesson')).toBeVisible({ timeout: 15_000 });
}

test.describe('VideoLessonScreen', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    await page.route('**/api/listening', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LISTENING_RESPONSE),
      }),
    );
    // scene-video returns no URL so no background video request is made
    await page.route('**/api/scene-video**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, url: null }),
      }),
    );
  });

  test('opens from the AI Tutor tab and renders the setup heading', async ({ page }) => {
    await openAIVideoLesson(page);
    // Heading visibility is the openAIVideoLesson helper's exit assertion.
  });

  test('setup screen shows "Choose a Topic" section', async ({ page }) => {
    await openAIVideoLesson(page);
    await expect(page.getByText('Choose a Topic')).toBeVisible({ timeout: 5_000 });
  });

  test('setup screen shows "Difficulty Level" selector with A1–C2 buttons', async ({ page }) => {
    await openAIVideoLesson(page);
    await expect(page.getByText('Difficulty Level')).toBeVisible({ timeout: 5_000 });
    for (const lvl of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
      await expect(page.locator('button').filter({ hasText: lvl }).last()).toBeVisible({
        timeout: 3_000,
      });
    }
  });

  test('Start button is disabled when no topic is selected (shows "Select a topic above")', async ({
    page,
  }) => {
    await openAIVideoLesson(page);
    await expect(page.getByText('Select a topic above')).toBeVisible({ timeout: 5_000 });
    // The start button is disabled when no topic is selected
    const startBtn = page.locator('button').filter({ hasText: /Select a topic above/ });
    await expect(startBtn).toBeDisabled({ timeout: 3_000 });
  });

  test('selecting a topic changes the Start button to "▶ Start Lesson — {topic.hr}"', async ({
    page,
  }) => {
    await openAIVideoLesson(page);
    // Click the "U kafiću" topic button in the VideoLesson topic grid
    await page.locator('button').filter({ hasText: 'U kafiću' }).first().click();
    await expect(page.getByText('▶ Start Lesson — U kafiću')).toBeVisible({ timeout: 5_000 });
  });

  test('selecting a topic enables the Start button', async ({ page }) => {
    await openAIVideoLesson(page);
    await page.locator('button').filter({ hasText: 'U kafiću' }).first().click();
    await expect(page.locator('button').filter({ hasText: /▶ Start Lesson/ })).toBeEnabled({
      timeout: 5_000,
    });
  });

  test('generating shows the playing phase with "▶ Play Dialogue" button', async ({ page }) => {
    await openAIVideoLesson(page);
    await page.locator('button').filter({ hasText: 'U kafiću' }).first().click();
    await page
      .locator('button')
      .filter({ hasText: /▶ Start Lesson/ })
      .click();
    // loading → playing phase: "▶ Play Dialogue" button appears
    await expect(page.getByText('▶ Play Dialogue')).toBeVisible({ timeout: 10_000 });
  });

  test('playing phase shows "📝 Transcript" toggle', async ({ page }) => {
    await openAIVideoLesson(page);
    await page.locator('button').filter({ hasText: 'U kafiću' }).first().click();
    await page
      .locator('button')
      .filter({ hasText: /▶ Start Lesson/ })
      .click();
    await expect(page.getByText('▶ Play Dialogue')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/📝 Transcript/)).toBeVisible({ timeout: 5_000 });
  });

  test('playing phase shows "Skip to Questions →" button', async ({ page }) => {
    await openAIVideoLesson(page);
    await page.locator('button').filter({ hasText: 'U kafiću' }).first().click();
    await page
      .locator('button')
      .filter({ hasText: /▶ Start Lesson/ })
      .click();
    await expect(page.getByText('▶ Play Dialogue')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Skip to Questions →')).toBeVisible({ timeout: 5_000 });
  });

  test('clicking "Skip to Questions →" transitions to quiz phase with "Comprehension Check"', async ({
    page,
  }) => {
    await openAIVideoLesson(page);
    await page.locator('button').filter({ hasText: 'U kafiću' }).first().click();
    await page
      .locator('button')
      .filter({ hasText: /▶ Start Lesson/ })
      .click();
    await expect(page.getByText('Skip to Questions →')).toBeVisible({ timeout: 10_000 });
    await page.getByText('Skip to Questions →').click();

    // Quiz phase renders "Comprehension Check" heading and question counter
    await expect(page.getByText('Comprehension Check')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/1 \//)).toBeVisible({ timeout: 5_000 });
  });
});
