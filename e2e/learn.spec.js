import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS } from './fixtures/seed-auth.js';

test.describe('Learn tab', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    // Scope to the nav bar to avoid the "Learn 39 categories" Jump In button
    await page.getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: 'Learn', exact: true }).click();
    await expect(page.getByText(/📚 Vocabulary/)).toBeVisible({ timeout: 5_000 });
  });

  test.describe('Vocabulary section', () => {
    test('renders vocabulary section heading with category count', async ({ page }) => {
      await expect(page.getByText('📚 Vocabulary')).toBeVisible();
      await expect(page.getByText(/categories · tap/i)).toBeVisible();
    });

    test('shows multiple vocabulary categories', async ({ page }) => {
      const categoryButtons = page.locator('button.tc').filter({ hasText: /\d+ words/ });
      const count = await categoryButtons.count();
      expect(count).toBeGreaterThan(5);
    });

    test('each category shows a word count badge', async ({ page }) => {
      const firstCategory = page.locator('button.tc').filter({ hasText: /\d+ words/ }).first();
      await expect(firstCategory.getByText(/\d+ words/)).toBeVisible();
    });

    test('clicking a vocabulary category opens the lesson screen', async ({ page }) => {
      const firstCategory = page.locator('button.tc').filter({ hasText: /\d+ words/ }).first();
      await firstCategory.click();
      // Lesson screen in "learn" mode shows "Quiz Me! →" button
      await expect(page.getByText('Quiz Me! →')).toBeVisible({ timeout: 5_000 });
    });
  });

  test.describe('Grammar section', () => {
    test('renders Grammar section heading', async ({ page }) => {
      await expect(page.getByText('📝 Grammar')).toBeVisible();
    });

    test('shows Tenses & Gender button', async ({ page }) => {
      await expect(page.getByText('Tenses & Gender')).toBeVisible();
    });

    test('shows Cases Intro button', async ({ page }) => {
      await expect(page.getByText('Cases Intro')).toBeVisible();
    });

    test('shows Conjugation button', async ({ page }) => {
      await expect(page.getByText('Conjugation')).toBeVisible();
    });

    test('clicking Cases Intro opens the Padeži screen', async ({ page }) => {
      await page.getByText('Cases Intro').click();
      await expect(page.getByText(/Padeži/i).first()).toBeVisible({ timeout: 5_000 });
    });

    test('clicking Tenses & Gender opens tenses screen', async ({ page }) => {
      await page.getByText('Tenses & Gender').click();
      await expect(page.getByText(/Tenses & Gender/i).first()).toBeVisible({ timeout: 5_000 });
    });

    test('clicking Grammar Intro opens grammar screen with content (not blank)', async ({ page }) => {
      await page.getByText('Grammar Intro').click();
      // GrammarScreen should show the first lesson title and a Practice button — not a blank page
      await expect(page.getByText(/Noun Genders|Verb Biti|Negation/i)).toBeVisible({ timeout: 5_000 });
    });

    test('clicking Declension opens declension trainer without error', async ({ page }) => {
      await page.getByText('Declension').click();
      // DeclensionScreen should show the heading and case names
      await expect(page.getByText(/Noun Declension/i)).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText('Nominativ')).toBeVisible({ timeout: 3_000 });
    });
  });

  test.describe('Reference section', () => {
    test('renders Reference section heading', async ({ page }) => {
      await expect(page.getByText('📌 Reference')).toBeVisible();
    });

    test('clicking Alphabet opens the alphabet screen', async ({ page }) => {
      await page.getByText('Alphabet').click();
      await expect(page.getByText(/Croatian Alphabet/i)).toBeVisible({ timeout: 5_000 });
    });
  });

  test.describe('Back navigation', () => {
    test('back button returns to Learn tab from a vocabulary lesson', async ({ page }) => {
      await page.locator('button.tc').filter({ hasText: /\d+ words/ }).first().click();
      await expect(page.getByText('Quiz Me! →')).toBeVisible({ timeout: 5_000 });
      // Navigate back via the Learn tab in the nav bar
      await page.getByRole('navigation', { name: 'Main navigation' })
        .getByRole('button', { name: 'Learn', exact: true }).click();
      await expect(page.getByText(/📚 Vocabulary/)).toBeVisible({ timeout: 5_000 });
    });
  });
});
