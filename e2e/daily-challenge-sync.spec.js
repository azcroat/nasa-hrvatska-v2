import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, TEST_EMAIL, meButton } from './fixtures/seed-auth.js';

/**
 * Home screen smoke tests — verifies the authenticated home tab renders correctly.
 * The old "daily challenge" (dcDay3) UI was replaced by QuestTracker; these tests
 * cover the current home screen features.
 */
test.describe('Home screen — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('navigation exposes the core tabs and the Me entry', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('button', { name: 'Today', exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Learn', exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Practice', exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Croatia', exact: true })).toBeVisible();
    // Me is in the Sidebar on desktop and the AppHeader avatar on mobile.
    await expect(await meButton(page)).toBeVisible();
  });

  test('Grad shows the Today (Danas u gradu) section', async ({ page }) => {
    // Phase 6: Practice became Grad — the Today card replaced the old quest strip.
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: 'Practice', exact: true })
      .click();
    await page.waitForLoadState('domcontentloaded', { timeout: 10_000 }).catch(() => {});
    await expect(page.getByText('Danas u gradu').first()).toBeVisible({ timeout: 20_000 });
  });

  test('Grad shows the daily-quest progress row', async ({ page }) => {
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: 'Practice', exact: true })
      .click();
    await page.waitForLoadState('domcontentloaded', { timeout: 10_000 }).catch(() => {});
    await expect(page.getByText(/dnevnih zadataka/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test('Trg (the Square) hosts the Speed Challenge', async ({ page }) => {
    // SpeedChallenge moved into the Trg games hub in the Grad redesign.
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: 'Practice', exact: true })
      .click();
    await page.waitForLoadState('domcontentloaded', { timeout: 10_000 }).catch(() => {});
    const trg = page.getByText('Trg', { exact: true }).first();
    await trg.waitFor({ state: 'visible', timeout: 20_000 });
    await trg.click();
    await expect(page.getByText('Speed Challenge').first()).toBeVisible({ timeout: 10_000 });
  });

  test('pre-seeded user with name shows in app state', async ({ page }) => {
    // seedAuth sets a known name — verify the app reached authenticated state
    // (navigation visible is the key assertion; name may not be visible on home tab)
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  });

  test('Learn tab loads without crashing', async ({ page }) => {
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: 'Learn', exact: true })
      .click();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    // Learn tab should render something — check the nav stays visible (no crash)
  });

  test('Practice tab loads without crashing', async ({ page }) => {
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: 'Practice', exact: true })
      .click();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  });

  test('localStorage auth state persists on reload', async ({ page }) => {
    // Reload the page — seedAuth wrote to localStorage so it should persist
    await page.reload();
    // Firebase returns null (blocked) but earlyRestore keeps the session
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 10_000,
    });
  });
});
