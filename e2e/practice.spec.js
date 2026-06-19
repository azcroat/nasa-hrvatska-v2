/**
 * practice.spec.js
 *
 * E2E tests for the Grad tab (/practice route — Practice became "Grad" in the
 * Phase 6 redesign) and the exercises reached through its places.
 *
 * Covers:
 *   1. Grad surface — Today card, six places, list/Karta toggle
 *   2. ClozeEngine — reached via Kovaceva soba -> Recenice -> Sentence Cloze
 *   3. DictationScreen — reached via Kovaceva soba -> Izgovor -> Dictation
 *   4. SpeedChallenge — reached via Trg (the games square)
 */

import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, mockContent } from './fixtures/seed-auth.js';

async function gotoGrad(page) {
  await page.goto('/practice');
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText('Danas u gradu')).toBeVisible({ timeout: 20_000 });
}

// Open an exercise inside Kovac's study: enter the place, open the subgroup
// accordion, then click the exercise card.
async function openSobaExercise(page, subgroupLabel, exerciseLabel) {
  await page.getByText('Kovačeva soba').click();
  await page.getByText(new RegExp(subgroupLabel)).first().click(); // expand subgroup
  await page.getByText(exerciseLabel, { exact: false }).first().click();
}

// ===========================================================================
// 1. Grad surface
// ===========================================================================

test.describe('Grad surface', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    await gotoGrad(page);
  });

  test('renders the Today card', async ({ page }) => {
    await expect(page.getByText('Danas u gradu')).toBeVisible();
  });

  test('renders all six places', async ({ page }) => {
    for (const name of [
      'Anina kavana',
      'Markova tržnica',
      'Kovačeva soba',
      'Bakina kuhinja',
      'Ivina ulica',
      'Trg',
    ]) {
      await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
    }
  });

  test('toggles between Popis and Karta views', async ({ page }) => {
    await page.getByRole('button', { name: /Karta/i }).click();
    await expect(page.getByText('Naš grad na moru')).toBeVisible({ timeout: 8_000 });
    await page.getByRole('button', { name: /Popis/i }).click();
    await expect(page.getByText('Mjesta u gradu')).toBeVisible({ timeout: 8_000 });
  });

  test('opening a place shows the host interior with a back button', async ({ page }) => {
    await page.getByText('Anina kavana').click();
    await expect(page.getByText('← Grad')).toBeVisible({ timeout: 8_000 });
  });
});

// ===========================================================================
// 2. ClozeEngine — Sentence Cloze (Kovac's study -> Recenice)
// ===========================================================================

test.describe('ClozeEngine — Sentence Cloze', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
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
    await gotoGrad(page);
  });

  test('opens the ClozeEngine screen from Recenice', async ({ page }) => {
    await openSobaExercise(page, 'Rečenice', 'Sentence Cloze');
    await expect(page.getByText('🧩 Sentence Cloze')).toBeVisible({ timeout: 8_000 });
  });

  test('renders a sentence card with a blank (_____) and progress 1 / 12', async ({ page }) => {
    await openSobaExercise(page, 'Rečenice', 'Sentence Cloze');
    await expect(page.getByText('🧩 Sentence Cloze')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('_____')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('1 / 12')).toBeVisible({ timeout: 5_000 });
  });

  test('selecting an answer shows correctness feedback', async ({ page }) => {
    await openSobaExercise(page, 'Rečenice', 'Sentence Cloze');
    await expect(page.getByText('🧩 Sentence Cloze')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('_____')).toBeVisible({ timeout: 5_000 });
    await page.locator('div[style*="grid-template-columns: 1fr 1fr"] button').first().click();
    await expect(
      page
        .locator('div')
        .filter({ hasText: /✓ Correct!|✗ The answer was/ })
        .first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Next → advances to question 2 / 12', async ({ page }) => {
    await openSobaExercise(page, 'Rečenice', 'Sentence Cloze');
    await expect(page.getByText('1 / 12')).toBeVisible({ timeout: 8_000 });
    await page.locator('div[style*="grid-template-columns: 1fr 1fr"] button').first().click();
    await page
      .locator('button.b.bp')
      .filter({ hasText: /Next →/ })
      .click();
    await expect(page.getByText('2 / 12')).toBeVisible({ timeout: 5_000 });
  });
});

// ===========================================================================
// 3. DictationScreen (Kovac's study -> Izgovor) — needs B1
// ===========================================================================

test.describe('DictationScreen', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page, { xp: 1500 }); // B1 so Dictation (B1) is unlocked
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    await gotoGrad(page);
  });

  test('opens the DictationScreen from Izgovor with progress 1 / 20', async ({ page }) => {
    await openSobaExercise(page, 'Izgovor', 'Dictation');
    await expect(page.getByText('🎧 Dictation')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('1 / 20')).toBeVisible({ timeout: 5_000 });
  });

  test('shows the Play audio button and the answer input', async ({ page }) => {
    await openSobaExercise(page, 'Izgovor', 'Dictation');
    await expect(page.getByText('🎧 Dictation')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('button[title="Play audio"]')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('input[placeholder="Type what you heard..."]')).toBeVisible({
      timeout: 5_000,
    });
  });

  test('a diacritic button inserts its character into the input', async ({ page }) => {
    await openSobaExercise(page, 'Izgovor', 'Dictation');
    await expect(page.getByText('🎧 Dictation')).toBeVisible({ timeout: 8_000 });
    const input = page.locator('input[placeholder="Type what you heard..."]');
    await input.click();
    await page.locator('button').filter({ hasText: /^Č$/ }).click();
    await expect(input).toHaveValue('Č');
  });
});

// ===========================================================================
// 4. SpeedChallenge — Trg (the games square)
//    serial because it mutates nh_speed_challenge_played
// ===========================================================================

test.describe('SpeedChallenge — Trg', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    await page.addInitScript(() => localStorage.removeItem('nh_speed_challenge_played'));
    await gotoGrad(page);
    await page.getByText('Trg', { exact: true }).first().click();
    await expect(page.getByText('Speed Challenge').first()).toBeVisible({ timeout: 10_000 });
    await page.getByText('Speed Challenge').first().click(); // expand
    await page.waitForTimeout(300);
  });

  test('expands to the idle state with a Play button', async ({ page }) => {
    await expect(page.getByText('60 seconds · how many can you get?')).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.locator('button').filter({ hasText: /^Play →$/ })).toBeVisible({
      timeout: 5_000,
    });
  });

  test('clicking Play → starts the countdown', async ({ page }) => {
    await page
      .locator('button')
      .filter({ hasText: /^Play →$/ })
      .click();
    await expect(page.getByText(/^\d+s$/).first()).toBeVisible({ timeout: 10_000 });
  });
});
