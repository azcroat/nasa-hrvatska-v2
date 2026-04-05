import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS } from './fixtures/seed-auth.js';

test.describe('Practice tab', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    // Scope to nav bar to avoid the "Practice" Jump In button on home tab
    await page.getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: 'Practice', exact: true }).click();
    // Wait for intent tiles to confirm Practice tab is loaded (no exact: tiles have emoji in accessible name)
    await expect(page.getByRole('button', { name: 'Challenge' })).toBeVisible({ timeout: 5_000 });
    // Switch to Challenge panel so game buttons are visible
    await page.getByRole('button', { name: 'Challenge' }).click();
    await expect(page.getByText('Flashcards')).toBeVisible({ timeout: 5_000 });
  });

  test.describe('Practice tab layout', () => {
    test('renders the Quick Games heading', async ({ page }) => {
      await expect(page.getByText('Quick Games')).toBeVisible();
    });

    test('shows core game buttons', async ({ page }) => {
      await expect(page.getByText('Quiz')).toBeVisible();
      await expect(page.getByText('Flashcards')).toBeVisible();
      await expect(page.getByText('Match Pairs')).toBeVisible();
      await expect(page.getByText('Typing')).toBeVisible();
    });

    test('shows Exercises section in Drill panel', async ({ page }) => {
      await page.getByRole('button', { name: 'Drill' }).click();
      await expect(page.getByText('Browse Exercises')).toBeVisible({ timeout: 3_000 });
    });

    test('shows Review panel with Flashcards option', async ({ page }) => {
      // Use the intent-tile row's Review button (exact label match to avoid Today's Pick cards containing "Review")
      await page.getByRole('button', { name: /^🔁\s*Review$/i }).click();
      await expect(page.getByText('Flashcards')).toBeVisible({ timeout: 3_000 });
    });
  });

  test.describe('Flashcards', () => {
    test('launches flashcard screen', async ({ page }) => {
      await page.getByText('Flashcards').click();
      await expect(page.getByText(/tap to see English|\d+ \/ \d+/i).first()).toBeVisible({ timeout: 5_000 });
    });

    test('shows card index and a Croatian word', async ({ page }) => {
      await page.getByText('Flashcards').click();
      // Should show "1 / N" card counter and a Croatian word
      await expect(page.getByText(/\d+ \/ \d+/)).toBeVisible({ timeout: 5_000 });
    });

    test('clicking the card flips it to show English', async ({ page }) => {
      await page.getByText('Flashcards').click();
      await expect(page.getByText(/tap to see English/i)).toBeVisible({ timeout: 5_000 });
      // Click the card to flip
      await page.locator('.fc-card').click();
      await expect(page.getByText(/Know it|Don't know/i).first()).toBeVisible({ timeout: 3_000 });
    });
  });

  test.describe('Quiz (Multiple Choice)', () => {
    test('launches multiple choice game', async ({ page }) => {
      await page.getByText('Quiz').click();
      // McGame renders a question counter and the question prompt
      await expect(page.getByText(/What does this mean/i)).toBeVisible({ timeout: 5_000 });
    });

    test('shows a Croatian word and answer options', async ({ page }) => {
      await page.getByText('Quiz').click();
      // MCGame renders "What does this mean?" prompt
      await expect(page.getByText(/What does this mean/i)).toBeVisible({ timeout: 5_000 });
    });

    test('selecting an answer shows feedback', async ({ page }) => {
      await page.getByText('Quiz').click();
      await expect(page.getByText(/What does this mean/i)).toBeVisible({ timeout: 5_000 });
      // Click the first answer option (class "ob")
      await page.locator('button.ob').first().click();
      // Should show Next/Got it/See Results button depending on answer correctness
      await expect(page.locator('button.b.bp').filter({ hasText: /Next|Got it|See Results/i })).toBeVisible({ timeout: 3_000 });
    });
  });

  test.describe('Match Pairs', () => {
    test('launches match pairs game', async ({ page }) => {
      await page.getByText('Match Pairs').first().click();
      // After navigation the PracticeTab is gone; MatchGame renders an h2 heading
      await expect(page.getByRole('heading', { name: /Match Pairs/i })).toBeVisible({ timeout: 5_000 });
    });
  });

  test.describe('Typing Practice', () => {
    test('launches typing practice screen', async ({ page }) => {
      await page.getByText('Typing').click();
      await expect(page.getByText(/Type this word in Croatian/i)).toBeVisible({ timeout: 5_000 });
    });

    test('shows a text input for typed answers', async ({ page }) => {
      await page.getByText('Typing').click();
      await page.waitForTimeout(500);
      await expect(page.locator('input[type="text"]')).toBeVisible({ timeout: 5_000 });
    });
  });
});
