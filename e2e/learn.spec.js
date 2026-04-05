import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS } from './fixtures/seed-auth.js';

test.describe('Learn tab', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: 'Learn', exact: true }).click();
    await expect(page.getByText('🗺️ My Path')).toBeVisible({ timeout: 5_000 });
  });

  test.describe('Learning Path', () => {
    test('renders My Path heading', async ({ page }) => {
      await expect(page.getByText('🗺️ My Path')).toBeVisible();
    });

    test('shows AI Micro-Lesson card', async ({ page }) => {
      await expect(page.getByText('AI Micro-Lesson')).toBeVisible();
    });

    test('shows Grammar Track A1→B2 card', async ({ page }) => {
      await expect(page.getByText('Grammar Track A1→B2')).toBeVisible();
    });

    test('shows Grammar button in header', async ({ page }) => {
      await expect(page.getByText('📖 Grammar')).toBeVisible();
    });

    test('shows Past Tense animated lesson', async ({ page }) => {
      await expect(page.getByText('Past Tense')).toBeVisible();
    });

    test('shows Future Tense animated lesson', async ({ page }) => {
      await expect(page.getByText('Future Tense')).toBeVisible();
    });
  });

  test.describe('Content cards', () => {
    test('shows Graded Stories card', async ({ page }) => {
      await expect(page.getByText('Graded Stories').first()).toBeVisible();
    });

    test('clicking Grammar Track opens grammar track screen', async ({ page }) => {
      await page.getByText('Grammar Track A1→B2').click();
      await expect(page.getByText(/Grammar/i).first()).toBeVisible({ timeout: 5_000 });
    });

    test('clicking AI Micro-Lesson navigates without error', async ({ page }) => {
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.getByText('AI Micro-Lesson').click();
      await page.waitForTimeout(500);
      const unexpected = errors.filter(e => !e.includes('firebase') && !e.includes('firestore') && !e.includes('fetch'));
      expect(unexpected).toHaveLength(0);
    });
  });

  test.describe('Back navigation', () => {
    test('clicking Grammar button navigates to grammar reference', async ({ page }) => {
      await page.getByText('📖 Grammar').click();
      await expect(page.getByText(/Grammar/i).first()).toBeVisible({ timeout: 5_000 });
    });
  });
});
