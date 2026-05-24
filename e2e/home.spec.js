import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, TEST_NAME } from './fixtures/seed-auth.js';

test.describe('Home tab', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {});
    // Wait for the session card — the reliable ready signal for the new HomeTab
    await page.getByText("Today's Session").first().waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});
    // Wait for the user name in the knight greeting
    await page.getByText(new RegExp(TEST_NAME)).first().waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(300);
  });

  test.describe('Knight greeting', () => {
    test('shows personalised greeting with user name', async ({ page }) => {
      // Knight greeting renders "Dobro jutro, <name>! 👋" at top of HomeTab
      await expect(page.getByText(new RegExp(TEST_NAME)).first()).toBeVisible({ timeout: 20_000 });
    });
  });

  test.describe('Daily Session Hub', () => {
    test("shows Today's Session card", async ({ page }) => {
      await expect(page.getByText("Today's Session").first()).toBeVisible({ timeout: 10_000 });
    });

    test('shows Begin Session button', async ({ page }) => {
      // Use the stable session-begin-cta testid for the visibility check. The
      // role-based locator matched on the *label* ("▶ Begin Session →"),
      // which is rendered through an `inProgress ? 'Continue Session →' : '▶
      // Begin Session →'` ternary. If the SessionCard mounts with
      // inProgress=true (transient state during async useDailySession
      // re-derive), the label is "Continue Session" and the regex never
      // matches, so the test timed out even with 20s on CI run 26347877456.
      // Asserting visibility on the testid first, then text afterward, makes
      // the visibility check robust to label transitions.
      const cta = page.getByTestId('session-begin-cta');
      await expect(cta).toBeVisible({ timeout: 25_000 });
      await expect(cta).toContainText('Begin Session');
    });

    test('shows session stat pills — Streak, Week XP, Due', async ({ page }) => {
      // Three StatPill components below the SessionCard
      await expect(page.getByText('Streak').first()).toBeVisible({ timeout: 8_000 });
      await expect(page.getByText('Week XP').first()).toBeVisible({ timeout: 8_000 });
      await expect(page.getByText('Due').first()).toBeVisible({ timeout: 8_000 });
    });

    test('shows seeded streak value of 5 in stat pills', async ({ page }) => {
      // seedAuth sets streak = 5; the Streak stat pill shows this value
      const content = await page.locator('#main-content, [role="main"], body').first().textContent();
      expect(content).toMatch(/(?<!\d)5(?!\d)/);
    });

    test('shows estimated session time and activity count', async ({ page }) => {
      // SessionCard shows "~X min · Y activities" for a fresh session
      await expect(page.getByText(/min\s*·\s*\d+\s*activit/i).first()).toBeVisible({ timeout: 10_000 });
    });
  });
});
