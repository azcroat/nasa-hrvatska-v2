import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, mockContent } from './fixtures/seed-auth.js';

test.describe('Learn tab', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    // BrowseContentModal consumes useGrammar()+useContent(); without the content
    // mocks /api/content/* 404s under `vite preview` and the modal stays in
    // LoadingState (its header never renders).
    await mockContent(page);
    // Navigate directly to /learn to avoid post-auth navigate('/') race on tab click.
    await page.goto('/learn');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Your Path')).toBeVisible({ timeout: 20_000 });
  });

  test.describe('Calm surface', () => {
    test('renders Your Path heading', async ({ page }) => {
      await expect(page.getByText('Your Path')).toBeVisible();
    });

    test('shows the Profesor Kovac tutor hero', async ({ page }) => {
      await expect(page.getByTestId('portrait-kovac')).toBeVisible();
    });

    test('shows Grammar Ref button in hero', async ({ page }) => {
      await expect(page.getByText('📖 Ref')).toBeVisible();
    });

    test('shows the Browse all link', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Browse all lessons/ })).toBeVisible();
    });
  });

  test.describe('Browse catalog (relocated entry points)', () => {
    async function openBrowse(page) {
      await page.getByRole('button', { name: /Browse all lessons/ }).click();
      await expect(page.getByText('Browse All Content')).toBeVisible({ timeout: 10_000 });
    }

    test('Learning Paths & Tracks holds the relocated tracks', async ({ page }) => {
      await openBrowse(page);
      await page.getByRole('button', { name: /Learning Paths & Tracks/ }).click();
      await expect(page.getByText('AI Micro-Lesson')).toBeVisible({ timeout: 8_000 });
      await expect(page.getByText('Grammar Track A1→B2')).toBeVisible();
    });

    test('Pronunciation Lab holds the relocated pronunciation tools', async ({ page }) => {
      await openBrowse(page);
      await page.getByRole('button', { name: /Pronunciation Lab/ }).click();
      await expect(page.getByText('Pronunciation Course')).toBeVisible({ timeout: 8_000 });
      await expect(page.getByText('Pitch Accent')).toBeVisible();
    });

    test('launching a relocated track navigates without error', async ({ page }) => {
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await openBrowse(page);
      await page.getByRole('button', { name: /Learning Paths & Tracks/ }).click();
      await page.getByText('AI Micro-Lesson').waitFor({ state: 'visible', timeout: 8_000 });
      await page.getByText('AI Micro-Lesson').click();
      await page.waitForTimeout(500);
      const unexpected = errors.filter(
        e => !e.includes('firebase') && !e.includes('firestore') && !e.includes('fetch'),
      );
      expect(unexpected).toHaveLength(0);
    });
  });

  test.describe('Back navigation', () => {
    test('clicking Grammar Ref button navigates to grammar reference', async ({ page }) => {
      await page.getByText('📖 Ref').waitFor({ state: 'visible', timeout: 8_000 });
      await page.getByText('📖 Ref').click();
      await expect(page.getByText(/Grammar/i).first()).toBeVisible({ timeout: 10_000 });
    });
  });
});
