import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTranslate, mockTTS, TEST_NAME } from './fixtures/seed-auth.js';

test.describe('Home tab', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockTranslate(page, 'Dobar dan');
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
  });

  test.describe('Hero section', () => {
    test('shows personalised greeting with user name', async ({ page }) => {
      await expect(page.getByText(new RegExp(TEST_NAME))).toBeVisible();
    });

    test('shows current level number', async ({ page }) => {
      await expect(page.getByText(/Level \d+/i).first()).toBeVisible();
    });

    test('shows XP in hero stats', async ({ page }) => {
      // Hero mini stat row shows "total XP" label
      await expect(page.getByText(/total XP/i).first()).toBeVisible();
    });

    test('shows streak count in hero', async ({ page }) => {
      await expect(page.getByText(/day streak/i).first()).toBeVisible();
    });

    test('shows mastered word count', async ({ page }) => {
      await expect(page.getByText(/mastered/i).first()).toBeVisible();
    });

    test('shows seeded XP value of 250 on screen', async ({ page }) => {
      const content = await page.locator('#main-content, [role="main"], body').first().textContent();
      expect(content).toContain('250');
    });
  });

  test.describe('CEFR progress', () => {
    test('shows CEFR level label in hero', async ({ page }) => {
      await expect(page.getByText(/CEFR LEVEL/i)).toBeVisible();
    });
  });

  test.describe('AI Voice feature', () => {
    test('shows AI Voice Conversation card', async ({ page }) => {
      await expect(page.getByText('AI Voice Conversation').first()).toBeVisible();
    });

    test('shows Immerse Yourself section', async ({ page }) => {
      await expect(page.getByText('Immerse Yourself')).toBeVisible();
    });
  });

  test.describe('Daily content', () => {
    test('shows Proverb of the Day', async ({ page }) => {
      await expect(page.getByText(/Proverb of the Day/i)).toBeVisible();
    });

    test('shows Did You Know section', async ({ page }) => {
      await expect(page.getByText(/Did You Know/i)).toBeVisible();
    });

    test('shows City of the Day', async ({ page }) => {
      await expect(page.getByText(/City of the Day/i)).toBeVisible();
    });
  });

  test.describe('Translate feature in hero', () => {
    test('translate toggle is accessible via hero quick-reply pill', async ({ page }) => {
      await expect(page.getByText('⇄ Translate')).toBeVisible();
    });

    test('clicking Translate pill opens inline translate panel', async ({ page }) => {
      await page.getByText('⇄ Translate').click();
      await expect(page.getByPlaceholder(/Type English/i)).toBeVisible({ timeout: 3_000 });
      await expect(page.getByText('EN → HR ⇄')).toBeVisible();
    });

    test('can toggle translation direction', async ({ page }) => {
      await page.getByText('⇄ Translate').click();
      await page.getByText('EN → HR ⇄').click();
      await expect(page.getByText('HR → EN ⇄')).toBeVisible();
    });

    test('submits translation and shows result', async ({ page }) => {
      await page.getByText('⇄ Translate').click();
      await page.getByPlaceholder(/Type English/i).fill('Good day');
      await page.getByRole('button', { name: 'Go', exact: true }).click();
      await expect(page.locator('button').filter({ hasText: 'Dobar dan' }).filter({ hasText: '🔊' })).toBeVisible({ timeout: 5_000 });
    });

    test('submits translation via Enter key', async ({ page }) => {
      await page.getByText('⇄ Translate').click();
      await page.getByPlaceholder(/Type English/i).fill('Good day');
      await page.keyboard.press('Enter');
      await expect(page.locator('button').filter({ hasText: 'Dobar dan' }).filter({ hasText: '🔊' })).toBeVisible({ timeout: 5_000 });
    });
  });
});
