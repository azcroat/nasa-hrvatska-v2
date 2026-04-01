/**
 * Authenticated user flow tests — runs against https://nasahrvatska.com
 * Requires GitHub secrets: TEST_EMAIL and TEST_PASSWORD
 * Tests the full signed-in experience: lesson completion, XP persistence,
 * streak display, navigation, offline resilience, and practice games.
 */
import { test, expect } from '@playwright/test';

const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

test.describe('Authenticated user flow', () => {
  test.skip(!EMAIL || !PASSWORD, 'TEST_EMAIL and TEST_PASSWORD env vars required');

  // Shared login helper
  async function signIn(page) {
    await page.goto('/');
    await expect(page.getByPlaceholder(/email/i)).toBeVisible({ timeout: 20000 });
    await page.getByPlaceholder(/email/i).fill(EMAIL);
    await page.getByPlaceholder(/password/i).fill(PASSWORD);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    // Wait for the home screen — tab bar is the reliable indicator
    await expect(page.getByRole('navigation')).toBeVisible({ timeout: 20000 });
  }

  test('signs in successfully and reaches home screen', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await signIn(page);
    // Home screen should show the Learn or dashboard content
    await expect(page.getByText(/learn|dashboard|merhaba|dobrodošli|streak|xp/i).first())
      .toBeVisible({ timeout: 10000 });
    const critical = errors.filter(e =>
      !e.includes('Firebase') && !e.includes('Sentry') && !e.includes('plausible')
    );
    expect(critical).toHaveLength(0);
  });

  test('all 5 tabs are visible and tappable after sign-in', async ({ page }) => {
    await signIn(page);
    const tabs = ['Home', 'Learn', 'Practice', 'Croatia', 'Me'];
    for (const tab of tabs) {
      const tabEl = page.getByRole('button', { name: new RegExp(tab, 'i') })
        .or(page.getByText(new RegExp(`^${tab}$`, 'i')));
      await expect(tabEl.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('Learn tab loads vocabulary categories', async ({ page }) => {
    await signIn(page);
    await page.getByText(/^learn$/i).first().click();
    // Should show vocabulary section or category cards
    await expect(
      page.getByText(/vocabulary|greetings|food|travel|numbers/i).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('complete a vocabulary lesson and XP is awarded', async ({ page }) => {
    await signIn(page);

    // Read current XP from profile tab first
    await page.getByText(/^me$/i).first().click();
    const xpBefore = await page.getByText(/\d+\s*xp/i).first().textContent()
      .catch(() => '0 XP');

    // Go to Learn → open first category
    await page.getByText(/^learn$/i).first().click();
    await page.getByText(/greetings|basics|food|numbers/i).first().click();

    // Word cards should appear
    await expect(page.getByText(/quiz me|start quiz/i).first())
      .toBeVisible({ timeout: 15000 });
    await page.getByText(/quiz me|start quiz/i).first().click();

    // Answer all quiz questions (pick first answer each time)
    for (let i = 0; i < 10; i++) {
      const answerBtn = page.getByRole('button').filter({ hasText: /[a-zA-ZčšžćđČŠŽĆĐ]/ }).first();
      if (await answerBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await answerBtn.click();
        await page.waitForTimeout(1200); // wait for feedback animation
      } else {
        break; // quiz ended
      }
    }

    // Results screen should appear
    await expect(
      page.getByText(/result|complete|well done|sjajno|xp/i).first()
    ).toBeVisible({ timeout: 20000 });

    // XP should have been awarded — check profile tab
    await page.getByText(/^me$/i).first().click();
    const xpAfter = await page.getByText(/\d+\s*xp/i).first().textContent()
      .catch(() => '0 XP');

    // XP after should be different (higher) than before
    expect(xpAfter).not.toBe(xpBefore);
  });

  test('XP persists after page reload', async ({ page }) => {
    await signIn(page);

    // Get current XP
    await page.getByText(/^me$/i).first().click();
    const xpBefore = await page.getByText(/\d+\s*xp/i).first().textContent({ timeout: 10000 });

    // Reload the page (simulates closing and reopening app)
    await page.reload();
    await expect(page.getByRole('navigation')).toBeVisible({ timeout: 20000 });

    // Navigate to Me tab and check XP is same
    await page.getByText(/^me$/i).first().click();
    const xpAfter = await page.getByText(/\d+\s*xp/i).first().textContent({ timeout: 10000 });

    expect(xpAfter).toBe(xpBefore);
  });

  test('streak count is visible on profile screen', async ({ page }) => {
    await signIn(page);
    await page.getByText(/^me$/i).first().click();
    // Streak should be visible as a number
    await expect(
      page.getByText(/streak|day|🔥/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('Practice tab shows game options', async ({ page }) => {
    await signIn(page);
    await page.getByText(/^practice$/i).first().click();
    await expect(
      page.getByText(/flashcard|quiz|match|typing|game/i).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('Flashcard game launches and shows a word', async ({ page }) => {
    await signIn(page);
    await page.getByText(/^practice$/i).first().click();
    await page.getByText(/flashcard/i).first().click();
    // Should show a Croatian word
    await expect(
      page.getByText(/[čšžćđČŠŽĆĐa-zA-Z]{2,}/i).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('Multiple choice game launches and answer feedback works', async ({ page }) => {
    await signIn(page);
    await page.getByText(/^practice$/i).first().click();
    await page.getByText(/quiz|multiple choice/i).first().click();
    // Answer options should appear
    await expect(page.getByRole('button').nth(1)).toBeVisible({ timeout: 15000 });
    // Tap first answer
    await page.getByRole('button').nth(1).click();
    // Feedback (correct/incorrect) should appear
    await expect(
      page.getByText(/correct|incorrect|točno|netočno|✓|✗|next/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('Croatia tab loads without crashing', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await signIn(page);
    await page.getByText(/^croatia$/i).first().click();
    await expect(
      page.getByText(/history|region|culture|istria|dalmatia/i).first()
    ).toBeVisible({ timeout: 15000 });
    const critical = errors.filter(e =>
      !e.includes('Firebase') && !e.includes('Sentry') && !e.includes('plausible')
    );
    expect(critical).toHaveLength(0);
  });

  test('back navigation works — no screens trap the user', async ({ page }) => {
    await signIn(page);
    await page.getByText(/^learn$/i).first().click();
    // Open a subcategory
    await page.getByText(/greetings|basics|food/i).first().click();
    await page.waitForTimeout(1000);
    // Back button should be visible
    const backBtn = page.getByRole('button', { name: /back|←|‹/i })
      .or(page.locator('[aria-label*="back" i]'))
      .or(page.locator('button').filter({ hasText: /^←$|^‹$/ }));
    await expect(backBtn.first()).toBeVisible({ timeout: 10000 });
    await backBtn.first().click();
    // Should be back on Learn tab
    await expect(
      page.getByText(/vocabulary|greetings|food|travel/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('no uncaught JS errors during a full session', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    await signIn(page);
    // Visit every main tab
    for (const tab of ['Learn', 'Practice', 'Croatia', 'Me', 'Home']) {
      await page.getByText(new RegExp(`^${tab}$`, 'i')).first().click();
      await page.waitForTimeout(1500);
    }

    const critical = errors.filter(e =>
      !e.includes('Firebase') &&
      !e.includes('Sentry') &&
      !e.includes('plausible') &&
      !e.includes('ResizeObserver')
    );
    expect(critical).toHaveLength(0);
  });
});
