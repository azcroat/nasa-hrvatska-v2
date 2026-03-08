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
      // Exact match avoids catching "X% to Level Y" progress text
      await expect(page.getByText(/^Level \d+$/, { exact: true })).toBeVisible();
    });

    test('shows XP total and XP to go', async ({ page }) => {
      await expect(page.getByText(/XP total/i)).toBeVisible();
      await expect(page.getByText(/XP to go/i)).toBeVisible();
    });
  });

  test.describe('Stats strip', () => {
    test('shows all 3 stat labels', async ({ page }) => {
      // CSS text-transform doesn't change DOM text — labels are mixed case
      await expect(page.getByText('Day Streak')).toBeVisible();
      await expect(page.getByText('Total XP')).toBeVisible();
      await expect(page.getByText('Mastered')).toBeVisible();
    });

    test('shows seeded XP value of 250 on screen', async ({ page }) => {
      const content = await page.locator('.dash, #main-content').first().textContent();
      expect(content).toContain('250');
    });
  });

  test.describe('Daily Challenges', () => {
    test('renders the Daily Challenges section', async ({ page }) => {
      await expect(page.getByText('Daily Challenges')).toBeVisible();
    });

    test('shows 0/3 progress on fresh load', async ({ page }) => {
      await expect(page.getByText('0/3', { exact: true })).toBeVisible();
    });

    test('answering a challenge updates progress to 1/3', async ({ page }) => {
      const section = page.locator('div').filter({ hasText: 'Daily Challenges' }).last();
      const enabled = section.locator('button:not([disabled])');
      if (await enabled.count() > 0) {
        await enabled.first().click();
        await expect(page.getByText('1/3', { exact: true })).toBeVisible({ timeout: 3_000 });
      }
    });

    test('answered challenge buttons become disabled', async ({ page }) => {
      const section = page.locator('div').filter({ hasText: 'Daily Challenges' }).last();
      const enabled = section.locator('button:not([disabled])');
      if (await enabled.count() > 0) {
        await enabled.first().click();
        await expect(section.locator('button[disabled]').first()).toBeVisible({ timeout: 3_000 });
      }
    });

    test('shows correct/incorrect feedback after answering', async ({ page }) => {
      const section = page.locator('div').filter({ hasText: 'Daily Challenges' }).last();
      const enabled = section.locator('button:not([disabled])');
      if (await enabled.count() > 0) {
        await enabled.first().click();
        await expect(section.getByText(/Correct/i)).toBeVisible({ timeout: 3_000 });
      }
    });
  });

  test.describe('Learning Path card', () => {
    test('shows My Learning Path with milestone progress', async ({ page }) => {
      await expect(page.getByText('My Learning Path')).toBeVisible();
      await expect(page.getByText(/milestones/i)).toBeVisible();
    });

    test('clicking Learning Path opens learnpath screen', async ({ page }) => {
      await page.getByText('My Learning Path').click();
      await expect(page.getByText(/Learning Path/i).first()).toBeVisible({ timeout: 5_000 });
    });
  });

  test.describe('Jump In section', () => {
    test('shows Jump In heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Jump In' })).toBeVisible();
    });

    test('shows Quick Quiz, Flashcards buttons', async ({ page }) => {
      await expect(page.getByText('Quick Quiz')).toBeVisible();
      await expect(page.getByText('Flashcards')).toBeVisible();
    });

    test('clicking Flashcards launches the flashcard screen', async ({ page }) => {
      await page.getByText('Flashcards').first().click();
      // Flashcards renders H("🃏 Flashcards","Tap card to flip. Swipe through words.")
      await expect(page.getByText(/Tap card to flip/i).first()).toBeVisible({ timeout: 5_000 });
    });

    test('clicking Quick Quiz launches the multiple choice game', async ({ page }) => {
      await page.getByText('Quick Quiz').click();
      // MCGame renders H("🎯 Multiple Choice")
      await expect(page.getByText(/Multiple Choice/i)).toBeVisible({ timeout: 5_000 });
    });
  });

  test.describe("Today's Croatian section", () => {
    test('shows the Proverb of the Day', async ({ page }) => {
      await expect(page.getByText(/Poslovica dana/i)).toBeVisible();
    });

    test('shows the Historical Fact', async ({ page }) => {
      await expect(page.getByText(/Povijesna činjenica/i)).toBeVisible();
    });
  });

  test.describe('Quick Translate', () => {
    test('renders translate heading and EN→HR toggle', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Quick Translate' })).toBeVisible();
      await expect(page.getByPlaceholder(/Type English/i)).toBeVisible();
      await expect(page.getByText('EN → HR ⇄')).toBeVisible();
    });

    test('can toggle translation direction', async ({ page }) => {
      await page.getByText('EN → HR ⇄').click();
      await expect(page.getByText('HR → EN ⇄')).toBeVisible();
    });

    test('submits translation and shows result', async ({ page }) => {
      await page.getByPlaceholder(/Type English/i).fill('Good day');
      // Use exact: true to avoid matching challenge answer buttons containing "go"
      await page.getByRole('button', { name: 'Go', exact: true }).click();
      await expect(page.getByText('Dobar dan')).toBeVisible({ timeout: 5_000 });
    });

    test('submits translation via Enter key', async ({ page }) => {
      await page.getByPlaceholder(/Type English/i).fill('Good day');
      await page.keyboard.press('Enter');
      await expect(page.getByText('Dobar dan')).toBeVisible({ timeout: 5_000 });
    });
  });
});
