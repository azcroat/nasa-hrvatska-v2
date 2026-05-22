/**
 * practice.spec.js
 *
 * E2E tests for the Practice tab (/practice route) and Home tab SpeedChallenge.
 *
 * Covers:
 *   1. Practice tab structure — heading, Today's Pick, intent tiles, Drill category expand/collapse
 *   2. ClozeEngine — Sentence Cloze screen (via Grammar category in Drill panel)
 *   3. DictationScreen (via Advanced category in Drill panel)
 *   4. AIListeningScreen (via Challenge panel → AI Challenges)
 *   5. VideoLessonScreen (via Challenge panel → AI Challenges)
 *   6. SpeedChallenge — Home tab (serial, mutates localStorage)
 */

import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, mockContent } from './fixtures/seed-auth.js';

// ---------------------------------------------------------------------------
// Shared mock data
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
// Helper — open a category tile in the Drill panel
// ---------------------------------------------------------------------------

async function openCategory(page, categoryLabel) {
  // Switch to the Drill intent pill if not already active.
  // Pills are plain <button> elements with direct text — no inner div wrapper.
  const drillBtn = page.locator('button').filter({ hasText: /^Drill$/ });
  await drillBtn.click({ timeout: 8_000 }).catch(() => {});
  const catBtn = page.locator('button.cat-tile').filter({ hasText: categoryLabel });
  await expect(catBtn).toBeVisible({ timeout: 5_000 });
  await catBtn.scrollIntoViewIfNeeded();
  await catBtn.click();
  await page.waitForTimeout(200);
}

// ---------------------------------------------------------------------------
// Helper — navigate to /practice and wait until it is fully loaded
// ---------------------------------------------------------------------------

async function gotoPractice(page) {
  await page.goto('/practice');
  // Wait for the nav bar as a proxy that the app shell has hydrated
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
    timeout: 10_000,
  });
  // Confirm the Practice tab content is present via the page heading
  await expect(page.locator('text=Practice').first()).toBeVisible({ timeout: 10_000 });
}

// ===========================================================================
// 1. Practice tab structure
// ===========================================================================

test.describe('Practice tab structure', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    await gotoPractice(page);
  });

  test('renders the Practice heading', async ({ page }) => {
    await expect(page.locator('text=Practice').first()).toBeVisible();
  });

  // Removed in UX redesign 2026-04-27: Today's Pick section deleted
  // test("renders Today's Pick section with 3 exercise cards", async ({ page }) => {
  //   await expect(page.getByText("Today's Pick")).toBeVisible();
  //   // Today's Pick section always shows exactly 3 exercise-card buttons
  //   const picks = page.locator('.todays-picks-grid .exercise-card');
  //   await expect(picks).toHaveCount(3, { timeout: 5_000 });
  // });

  test('renders the intent pills: Weakest Areas, Drill, Quick Game', async ({ page }) => {
    // Pills are plain <button> elements with direct text — no inner div wrapper.
    await expect(page.locator('button').filter({ hasText: /Weakest Areas/ })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /^Drill$/ })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /^Quick Game$/ })).toBeVisible();
  });

  // Removed 2026-05-22: the AI Voice Conversation hero button was deleted
  // from PracticeTab during the AI-surface consolidation — all AI features
  // now live exclusively under the dedicated AI Tutor tab. This test
  // asserted the button still rendered on Practice; deleting the assertion
  // (not the test as a regression — the button is intentionally gone).

  test('Drill panel shows Browse Exercises section and four category tiles', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Drill$/ })
      .click();
    await expect(page.getByText('Browse Exercises')).toBeVisible({ timeout: 5_000 });
    for (const label of ['Grammar', 'Vocabulary', 'Practical', 'Advanced']) {
      await expect(page.locator('button.cat-tile').filter({ hasText: label })).toBeVisible();
    }
  });

  test('Grammar category tile expands on click and collapses again', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Drill$/ })
      .click();
    const grammarTile = page.locator('button.cat-tile').filter({ hasText: 'Grammar' });
    await grammarTile.scrollIntoViewIfNeeded();
    // Should be collapsed initially
    await expect(grammarTile).toHaveAttribute('aria-expanded', 'false');
    await grammarTile.click();
    await page.waitForTimeout(200);
    await expect(grammarTile).toHaveAttribute('aria-expanded', 'true');
    // Exercise cards are now visible
    await expect(page.locator('button.exercise-card').first()).toBeVisible({ timeout: 3_000 });
    // Click again — should collapse
    await grammarTile.click();
    await page.waitForTimeout(200);
    await expect(grammarTile).toHaveAttribute('aria-expanded', 'false');
  });

  test('Advanced category tile expands and shows exercise cards', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Drill$/ })
      .click();
    const advTile = page.locator('button.cat-tile').filter({ hasText: 'Advanced' });
    await advTile.scrollIntoViewIfNeeded();
    await advTile.click();
    await page.waitForTimeout(200);
    await expect(page.locator('button.exercise-card').first()).toBeVisible({ timeout: 3_000 });
  });

  test('Challenge panel shows Quick Games and AI Challenges sections', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Quick Game$/ })
      .click();
    await expect(page.getByText('Quick Games')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('AI Challenges')).toBeVisible({ timeout: 5_000 });
  });

  test('Daily Quests strip is always visible', async ({ page }) => {
    // QuestTracker renders at the top of Practice tab; use first() to avoid strict-mode
    // violation (parent container and inner div both contain 'Daily Quests' text)
    await expect(page.getByText('Daily Quests').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ===========================================================================
// 2. ClozeEngine — Sentence Cloze
// ===========================================================================

test.describe('ClozeEngine — Sentence Cloze', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    // Mock /api/explain-error so "Why is … correct?" button works without real API
    await page.route('**/api/explain-error', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          explanation: 'This is a test explanation.',
          rule: 'Accusative case',
          tip: 'Remember to change the noun ending.',
          example: 'Vidim ženu.',
        }),
      }),
    );
    await gotoPractice(page);
  });

  test('Sentence Cloze card is visible inside Grammar category', async ({ page }) => {
    await openCategory(page, 'Grammar');
    await expect(
      page.locator('button.exercise-card').filter({ hasText: 'Sentence Cloze' }).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('clicking Sentence Cloze opens the ClozeEngine screen', async ({ page }) => {
    await openCategory(page, 'Grammar');
    await page
      .locator('button.exercise-card')
      .filter({ hasText: 'Sentence Cloze' })
      .first()
      .click();
    await expect(page.getByText('🧩 Sentence Cloze')).toBeVisible({ timeout: 8_000 });
  });

  test('ClozeEngine renders a sentence card with a blank (_____)', async ({ page }) => {
    await openCategory(page, 'Grammar');
    await page
      .locator('button.exercise-card')
      .filter({ hasText: 'Sentence Cloze' })
      .first()
      .click();
    await expect(page.getByText('🧩 Sentence Cloze')).toBeVisible({ timeout: 8_000 });
    // The blank is rendered as the literal string "_____"
    await expect(page.getByText('_____')).toBeVisible({ timeout: 5_000 });
  });

  test('progress counter shows "1 / 12"', async ({ page }) => {
    await openCategory(page, 'Grammar');
    await page
      .locator('button.exercise-card')
      .filter({ hasText: 'Sentence Cloze' })
      .first()
      .click();
    await expect(page.getByText('🧩 Sentence Cloze')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('1 / 12')).toBeVisible({ timeout: 5_000 });
  });

  test('four answer buttons are shown in a 2x2 grid', async ({ page }) => {
    await openCategory(page, 'Grammar');
    await page
      .locator('button.exercise-card')
      .filter({ hasText: 'Sentence Cloze' })
      .first()
      .click();
    await expect(page.getByText('🧩 Sentence Cloze')).toBeVisible({ timeout: 8_000 });
    // Wait for options — they are plain buttons inside the options grid
    // The grid uses gridTemplateColumns: "1fr 1fr"
    await expect(page.getByText('_____')).toBeVisible({ timeout: 5_000 });
    // There should be exactly 4 option buttons (each a sibling button in the options grid)
    // They sit after the sentence card in the DOM; use the parent grid container
    const optionGrid = page
      .locator('div')
      .filter({
        has: page.locator('button[style*="Playfair"]'),
      })
      .last();
    const opts = optionGrid.locator('button');
    await expect(opts).toHaveCount(4, { timeout: 5_000 });
  });

  test('selecting a correct answer shows "✓ Correct!" feedback', async ({ page }) => {
    await openCategory(page, 'Grammar');
    await page
      .locator('button.exercise-card')
      .filter({ hasText: 'Sentence Cloze' })
      .first()
      .click();
    await expect(page.getByText('🧩 Sentence Cloze')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('_____')).toBeVisible({ timeout: 5_000 });

    // Find which button is the correct answer — it's the one whose text matches
    // the blank. Try each option; the feedback reveals correctness immediately.
    // Instead, click every option button one at a time and check feedback text.
    // We click the first button; feedback will be either correct or wrong.
    const optButtons = page.locator('div[style*="grid-template-columns: 1fr 1fr"] button');
    await optButtons.first().click();
    // Regardless of whether it was correct, some feedback appears
    const feedback = page
      .locator('div')
      .filter({ hasText: /✓ Correct!|✗ The answer was/ })
      .first();
    await expect(feedback).toBeVisible({ timeout: 5_000 });
  });

  test('selecting a wrong answer shows "✗ The answer was …" feedback', async ({ page }) => {
    await openCategory(page, 'Grammar');
    await page
      .locator('button.exercise-card')
      .filter({ hasText: 'Sentence Cloze' })
      .first()
      .click();
    await expect(page.getByText('🧩 Sentence Cloze')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('_____')).toBeVisible({ timeout: 5_000 });

    // To reliably get a wrong answer, iterate across multiple questions.
    // With 4 options per question (exactly 1 correct), probability of 12
    // consecutive correct picks is (1/4)^12 ≈ negligible.
    for (let i = 0; i < 12; i++) {
      // Re-query each time because options re-mount when the question changes
      const btn = page.locator('div[style*="grid-template-columns: 1fr 1fr"] button').nth(i % 4);
      if (!(await btn.isVisible({ timeout: 1_000 }).catch(() => false))) break;
      await btn.click();
      const isWrong = await page
        .getByText(/✗ The answer was/)
        .isVisible({ timeout: 1_000 })
        .catch(() => false);
      if (isWrong) break;
      // Was correct — advance to next question without breaking the outer loop
      const nextBtn = page.locator('button.b.bp').filter({ hasText: /Next →/ });
      if (await nextBtn.isVisible({ timeout: 800 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(300);
      }
    }

    await expect(page.getByText(/✗ The answer was/)).toBeVisible({ timeout: 5_000 });
  });

  test('wrong answer shows "Why is … correct?" AI explain button', async ({ page }) => {
    await openCategory(page, 'Grammar');
    await page
      .locator('button.exercise-card')
      .filter({ hasText: 'Sentence Cloze' })
      .first()
      .click();
    await expect(page.getByText('🧩 Sentence Cloze')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('_____')).toBeVisible({ timeout: 5_000 });

    // Force a wrong answer by finding which option is NOT the correct answer
    // The correct option gets a green background (#dcfce7) after answering;
    // the wrong one gets red. We click any button and check.
    const optButtons = page.locator('div[style*="grid-template-columns: 1fr 1fr"] button');
    await optButtons.first().click();

    const isWrong = await page
      .getByText(/✗ The answer was/)
      .isVisible({ timeout: 2_000 })
      .catch(() => false);
    if (!isWrong) {
      // Was correct — advance and try another question's options
      await page
        .locator('button.b.bp')
        .filter({ hasText: /Next →/ })
        .click();
      await page.waitForTimeout(200);
      // Click second option this time
      await page.locator('div[style*="grid-template-columns: 1fr 1fr"] button').nth(1).click();
    }

    // Whether first or second try, wrong answer feedback + explain button should appear
    await expect(page.getByText(/Why is ".*" correct\?/)).toBeVisible({ timeout: 5_000 });
  });

  test('Next → button advances to question 2 after answering', async ({ page }) => {
    await openCategory(page, 'Grammar');
    await page
      .locator('button.exercise-card')
      .filter({ hasText: 'Sentence Cloze' })
      .first()
      .click();
    await expect(page.getByText('🧩 Sentence Cloze')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('1 / 12')).toBeVisible({ timeout: 5_000 });

    // Answer the first question (any option)
    await page.locator('div[style*="grid-template-columns: 1fr 1fr"] button').first().click();
    await expect(page.locator('button.b.bp').filter({ hasText: /Next →/ })).toBeVisible({
      timeout: 3_000,
    });
    await page
      .locator('button.b.bp')
      .filter({ hasText: /Next →/ })
      .click();
    await expect(page.getByText('2 / 12')).toBeVisible({ timeout: 5_000 });
  });
});

// ===========================================================================
// 3. DictationScreen
// ===========================================================================

test.describe('DictationScreen', () => {
  test.beforeEach(async ({ page }) => {
    // Dictation requires B1. Default seed is A2 (xp:250 → total 525).
    // xp:1500 → total 1775 → B1, so the Dictation card appears in Available exercises.
    await seedAuth(page, { xp: 1500 });
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    await page.route('**/api/explain-error', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          explanation: 'This sentence uses the accusative case.',
          rule: 'Accusative',
          tip: 'Direct objects use accusative.',
          example: 'Pijem vodu.',
        }),
      }),
    );
    await gotoPractice(page);
  });

  test('Dictation card is visible inside Advanced category', async ({ page }) => {
    await openCategory(page, 'Advanced');
    await expect(page.locator('button.exercise-card').filter({ hasText: 'Dictation' })).toBeVisible(
      { timeout: 5_000 },
    );
  });

  test('clicking Dictation opens the DictationScreen', async ({ page }) => {
    await openCategory(page, 'Advanced');
    await page.locator('button.exercise-card').filter({ hasText: 'Dictation' }).click();
    await expect(page.getByText('🎧 Dictation')).toBeVisible({ timeout: 8_000 });
  });

  test('DictationScreen shows the progress counter "1 / 20"', async ({ page }) => {
    await openCategory(page, 'Advanced');
    await page.locator('button.exercise-card').filter({ hasText: 'Dictation' }).click();
    await expect(page.getByText('🎧 Dictation')).toBeVisible({ timeout: 8_000 });
    // Progress counter: idx + 1 (1) / total (20)
    await expect(page.getByText('1 / 20')).toBeVisible({ timeout: 5_000 });
  });

  test('Play audio button is visible (▶ with title "Play audio")', async ({ page }) => {
    await openCategory(page, 'Advanced');
    await page.locator('button.exercise-card').filter({ hasText: 'Dictation' }).click();
    await expect(page.getByText('🎧 Dictation')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('button[title="Play audio"]')).toBeVisible({ timeout: 5_000 });
  });

  test('text input with placeholder "Type what you heard..." is visible', async ({ page }) => {
    await openCategory(page, 'Advanced');
    await page.locator('button.exercise-card').filter({ hasText: 'Dictation' }).click();
    await expect(page.getByText('🎧 Dictation')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('input[placeholder="Type what you heard..."]')).toBeVisible({
      timeout: 5_000,
    });
  });

  test('all 10 diacritic buttons are rendered', async ({ page }) => {
    await openCategory(page, 'Advanced');
    await page.locator('button.exercise-card').filter({ hasText: 'Dictation' }).click();
    await expect(page.getByText('🎧 Dictation')).toBeVisible({ timeout: 8_000 });
    for (const ch of ['Č', 'Ć', 'Š', 'Ž', 'Đ', 'č', 'ć', 'š', 'ž', 'đ']) {
      await expect(page.locator('button').filter({ hasText: ch }).first()).toBeVisible({
        timeout: 3_000,
      });
    }
  });

  test('Check ✓ button is visible before submitting', async ({ page }) => {
    await openCategory(page, 'Advanced');
    await page.locator('button.exercise-card').filter({ hasText: 'Dictation' }).click();
    await expect(page.getByText('🎧 Dictation')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('button.b.bp').filter({ hasText: /Check ✓/ })).toBeVisible({
      timeout: 5_000,
    });
  });

  test('typing a wrong answer and checking reveals "Correct answer:" and the Explain button', async ({
    page,
  }) => {
    await openCategory(page, 'Advanced');
    await page.locator('button.exercise-card').filter({ hasText: 'Dictation' }).click();
    await expect(page.getByText('🎧 Dictation')).toBeVisible({ timeout: 8_000 });

    const input = page.locator('input[placeholder="Type what you heard..."]');
    await input.fill('ovo je krivi odgovor koji sigurno ne odgovara ničemu');
    await page
      .locator('button.b.bp')
      .filter({ hasText: /Check ✓/ })
      .click();

    // After checking a wrong answer, "Correct answer:" heading appears
    await expect(page.getByText('Correct answer:')).toBeVisible({ timeout: 5_000 });
    // The explain button also appears
    await expect(
      page.locator('button').filter({ hasText: '🧠 Explain this sentence' }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('diacritic button inserts character into the input', async ({ page }) => {
    await openCategory(page, 'Advanced');
    await page.locator('button.exercise-card').filter({ hasText: 'Dictation' }).click();
    await expect(page.getByText('🎧 Dictation')).toBeVisible({ timeout: 8_000 });

    const input = page.locator('input[placeholder="Type what you heard..."]');
    await input.click();
    // Click the Č diacritic button
    await page.locator('button').filter({ hasText: /^Č$/ }).click();
    await expect(input).toHaveValue('Č');
  });
});

// ===========================================================================
// 4. AIListeningScreen
// ===========================================================================

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
    await gotoPractice(page);
  });

  test('AI Listening button is visible in Challenge panel → AI Challenges', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Quick Game$/ })
      .click();
    await expect(page.getByText('AI Challenges')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('button.tc').filter({ hasText: 'AI Listening' })).toBeVisible({
      timeout: 5_000,
    });
  });

  test('clicking AI Listening opens the setup screen with heading "🎧 AI Listening"', async ({
    page,
  }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Quick Game$/ })
      .click();
    await page.locator('button.tc').filter({ hasText: 'AI Listening' }).click();
    await expect(page.getByText('🎧 AI Listening')).toBeVisible({ timeout: 8_000 });
  });

  test('setup screen shows a Level badge', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Quick Game$/ })
      .click();
    await page.locator('button.tc').filter({ hasText: 'AI Listening' }).click();
    await expect(page.getByText('🎧 AI Listening')).toBeVisible({ timeout: 8_000 });
    // Level badge shows the current CEFR level followed by "Level" — e.g. "B1 Level"
    // Use anchored regex to match the badge element exactly and avoid strict-mode violations
    await expect(page.getByText(/^[A-C][12] Level$/)).toBeVisible({ timeout: 3_000 });
  });

  test('all 10 topic buttons are visible', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Quick Game$/ })
      .click();
    await page.locator('button.tc').filter({ hasText: 'AI Listening' }).click();
    await expect(page.getByText('🎧 AI Listening')).toBeVisible({ timeout: 8_000 });

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
    await page
      .locator('button')
      .filter({ hasText: /^Quick Game$/ })
      .click();
    await page.locator('button.tc').filter({ hasText: 'AI Listening' }).click();
    await expect(page.getByText('🎧 AI Listening')).toBeVisible({ timeout: 8_000 });
    const generateBtn = page.locator('button.b.bp').filter({ hasText: /Generate →/ });
    await expect(generateBtn).toBeDisabled({ timeout: 3_000 });
  });

  test('selecting a topic enables the Generate → button', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Quick Game$/ })
      .click();
    await page.locator('button.tc').filter({ hasText: 'AI Listening' }).click();
    await expect(page.getByText('🎧 AI Listening')).toBeVisible({ timeout: 8_000 });

    // Select the first topic "U kafiću"
    await page.locator('button').filter({ hasText: 'U kafiću' }).click();
    const generateBtn = page.locator('button.b.bp').filter({ hasText: /Generate →/ });
    await expect(generateBtn).toBeEnabled({ timeout: 3_000 });
  });

  test('clicking Generate → transitions to the listening phase showing content title', async ({
    page,
  }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Quick Game$/ })
      .click();
    await page.locator('button.tc').filter({ hasText: 'AI Listening' }).click();
    await expect(page.getByText('🎧 AI Listening')).toBeVisible({ timeout: 8_000 });

    await page.locator('button').filter({ hasText: 'U kafiću' }).click();
    await page
      .locator('button.b.bp')
      .filter({ hasText: /Generate →/ })
      .click();

    // Should move through loading → listening; listening phase shows content.title in the heading
    await expect(page.getByText('U kafiću')).toBeVisible({ timeout: 10_000 });
  });

  test('listening phase shows Play/Pause audio control button', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Quick Game$/ })
      .click();
    await page.locator('button.tc').filter({ hasText: 'AI Listening' }).click();
    await expect(page.getByText('🎧 AI Listening')).toBeVisible({ timeout: 8_000 });

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
    await page
      .locator('button')
      .filter({ hasText: /^Quick Game$/ })
      .click();
    await page.locator('button.tc').filter({ hasText: 'AI Listening' }).click();
    await expect(page.getByText('🎧 AI Listening')).toBeVisible({ timeout: 8_000 });

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
    await page
      .locator('button')
      .filter({ hasText: /^Quick Game$/ })
      .click();
    await page.locator('button.tc').filter({ hasText: 'AI Listening' }).click();
    await expect(page.getByText('🎧 AI Listening')).toBeVisible({ timeout: 8_000 });

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
    await page
      .locator('button')
      .filter({ hasText: /^Quick Game$/ })
      .click();
    await page.locator('button.tc').filter({ hasText: 'AI Listening' }).click();
    await expect(page.getByText('🎧 AI Listening')).toBeVisible({ timeout: 8_000 });

    await page.locator('button').filter({ hasText: 'U kafiću' }).click();
    await page
      .locator('button.b.bp')
      .filter({ hasText: /Generate →/ })
      .click();

    // The component sets readyVisible after 5s or after audio ends; our mock audio is empty (0 bytes)
    // so the Audio element fires 'ended' immediately, which sets readyVisible=true.
    await expect(page.getByText("I'm Ready — Take the Quiz →")).toBeVisible({ timeout: 10_000 });
  });
});

// ===========================================================================
// 5. VideoLessonScreen
// ===========================================================================

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
    await gotoPractice(page);
  });

  test('Video Lesson button is visible in Challenge panel → AI Challenges', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Quick Game$/ })
      .click();
    await expect(page.getByText('AI Challenges')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('button.tc').filter({ hasText: 'Video Lesson' })).toBeVisible({
      timeout: 5_000,
    });
  });

  test('clicking Video Lesson opens the setup screen with "🎬 Video Lesson"', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Quick Game$/ })
      .click();
    await page.locator('button.tc').filter({ hasText: 'Video Lesson' }).click();
    await expect(page.getByText('🎬 Video Lesson')).toBeVisible({ timeout: 8_000 });
  });

  test('setup screen shows "Choose a Topic" section', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Quick Game$/ })
      .click();
    await page.locator('button.tc').filter({ hasText: 'Video Lesson' }).click();
    await expect(page.getByText('🎬 Video Lesson')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Choose a Topic')).toBeVisible({ timeout: 5_000 });
  });

  test('setup screen shows "Difficulty Level" selector with A1–C2 buttons', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Quick Game$/ })
      .click();
    await page.locator('button.tc').filter({ hasText: 'Video Lesson' }).click();
    await expect(page.getByText('🎬 Video Lesson')).toBeVisible({ timeout: 8_000 });
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
    await page
      .locator('button')
      .filter({ hasText: /^Quick Game$/ })
      .click();
    await page.locator('button.tc').filter({ hasText: 'Video Lesson' }).click();
    await expect(page.getByText('🎬 Video Lesson')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Select a topic above')).toBeVisible({ timeout: 5_000 });
    // The start button is disabled when no topic is selected
    const startBtn = page.locator('button').filter({ hasText: /Select a topic above/ });
    await expect(startBtn).toBeDisabled({ timeout: 3_000 });
  });

  test('selecting a topic changes the Start button to "▶ Start Lesson — {topic.hr}"', async ({
    page,
  }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Quick Game$/ })
      .click();
    await page.locator('button.tc').filter({ hasText: 'Video Lesson' }).click();
    await expect(page.getByText('🎬 Video Lesson')).toBeVisible({ timeout: 8_000 });

    // Click the "U kafiću" topic button in the VideoLesson topic grid
    // These are plain buttons with border/outline styling (not cat-tile or exercise-card)
    await page.locator('button').filter({ hasText: 'U kafiću' }).first().click();
    await expect(page.getByText('▶ Start Lesson — U kafiću')).toBeVisible({ timeout: 5_000 });
  });

  test('selecting a topic enables the Start button', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Quick Game$/ })
      .click();
    await page.locator('button.tc').filter({ hasText: 'Video Lesson' }).click();
    await expect(page.getByText('🎬 Video Lesson')).toBeVisible({ timeout: 8_000 });
    await page.locator('button').filter({ hasText: 'U kafiću' }).first().click();
    await expect(page.locator('button').filter({ hasText: /▶ Start Lesson/ })).toBeEnabled({
      timeout: 5_000,
    });
  });

  test('generating shows the playing phase with "▶ Play Dialogue" button', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Quick Game$/ })
      .click();
    await page.locator('button.tc').filter({ hasText: 'Video Lesson' }).click();
    await expect(page.getByText('🎬 Video Lesson')).toBeVisible({ timeout: 8_000 });
    await page.locator('button').filter({ hasText: 'U kafiću' }).first().click();
    await page
      .locator('button')
      .filter({ hasText: /▶ Start Lesson/ })
      .click();

    // loading → playing phase: "▶ Play Dialogue" button appears
    await expect(page.getByText('▶ Play Dialogue')).toBeVisible({ timeout: 10_000 });
  });

  test('playing phase shows "📝 Transcript" toggle', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Quick Game$/ })
      .click();
    await page.locator('button.tc').filter({ hasText: 'Video Lesson' }).click();
    await expect(page.getByText('🎬 Video Lesson')).toBeVisible({ timeout: 8_000 });
    await page.locator('button').filter({ hasText: 'U kafiću' }).first().click();
    await page
      .locator('button')
      .filter({ hasText: /▶ Start Lesson/ })
      .click();
    await expect(page.getByText('▶ Play Dialogue')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/📝 Transcript/)).toBeVisible({ timeout: 5_000 });
  });

  test('playing phase shows "Skip to Questions →" button', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Quick Game$/ })
      .click();
    await page.locator('button.tc').filter({ hasText: 'Video Lesson' }).click();
    await expect(page.getByText('🎬 Video Lesson')).toBeVisible({ timeout: 8_000 });
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
    await page
      .locator('button')
      .filter({ hasText: /^Quick Game$/ })
      .click();
    await page.locator('button.tc').filter({ hasText: 'Video Lesson' }).click();
    await expect(page.getByText('🎬 Video Lesson')).toBeVisible({ timeout: 8_000 });
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

// ===========================================================================
// 6. SpeedChallenge — Practice tab
//    serial mode because tests mutate the nh_speed_challenge_played localStorage key
//    Note: SpeedChallenge moved from Home tab to Practice tab
// ===========================================================================

test.describe('SpeedChallenge — Practice tab', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    // Clear the "played today" flag so the Play → button is always shown
    await page.addInitScript(() => {
      localStorage.removeItem('nh_speed_challenge_played');
    });
    await gotoPractice(page);
    // Wait for SpeedChallenge collapsed card to render (it's below QuestTracker on Practice tab)
    await expect(page.getByText('Speed Challenge').first()).toBeVisible({ timeout: 20_000 });
    // Expand the collapsed SpeedChallenge card to reveal inner content
    await page.getByText('Speed Challenge').first().click();
    await page.waitForTimeout(300);
  });

  test('SpeedChallenge container shows "Speed Challenge" text', async ({ page }) => {
    await expect(page.getByText('Speed Challenge')).toBeVisible();
  });

  test('idle state shows "60 seconds · how many can you get?" sub-text', async ({ page }) => {
    await expect(page.getByText('60 seconds · how many can you get?')).toBeVisible();
  });

  test('"Play →" button is visible when not played today', async ({ page }) => {
    await expect(page.locator('button').filter({ hasText: /^Play →$/ })).toBeVisible({
      timeout: 5_000,
    });
  });

  test('clicking "Play →" starts the game and shows a countdown timer', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Play →$/ })
      .click();
    // Playing phase: shows a timer value like "60s", "59s", etc.
    // Use .first() because the timer can briefly render in multiple slots
    // (countdown header + sticky strip) during the idle→playing transition.
    // Bumped timeout from 5s to 10s — Playwright cross-browser runs can
    // start slower than local Chrome, especially on CI worker contention.
    await expect(page.getByText(/^\d+s$/).first()).toBeVisible({ timeout: 10_000 });
  });

  test('clicking "Play →" shows the first question (a Croatian word prompt)', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Play →$/ })
      .click();
    // Playing phase: shows answer-choice buttons; at least 2 buttons visible
    // The question area has a Croatian word and four choice buttons
    await expect(page.locator('button').filter({ hasText: /^Play →$/ })).toBeHidden({
      timeout: 5_000,
    });
    // At least one answer choice button should be visible (the game renders 4)
    await expect(page.locator('button').nth(0)).toBeVisible({ timeout: 5_000 });
  });

  test('playing phase shows the score counter "⚡ 0"', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Play →$/ })
      .click();
    await expect(page.getByText('⚡ 0').first()).toBeVisible({ timeout: 5_000 });
  });
});
