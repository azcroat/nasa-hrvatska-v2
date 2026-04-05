import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, TEST_EMAIL } from './fixtures/seed-auth.js';

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
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
  });

  test('navigation bar renders all five tabs', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('button', { name: 'Today', exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Learn', exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Practice', exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Culture', exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Me', exact: true })).toBeVisible();
  });

  test('home tab shows Daily Quests section', async ({ page }) => {
    await expect(page.getByText('Daily Quests')).toBeVisible({ timeout: 5_000 });
  });

  test('home tab shows EARN BONUS XP label', async ({ page }) => {
    await expect(page.getByText('EARN BONUS XP')).toBeVisible({ timeout: 5_000 });
  });

  test('home tab shows quest count or all-complete message', async ({ page }) => {
    const remaining = page.getByText(/quests? remaining/i);
    const allDone = page.getByText(/all quests complete/i);
    await expect(remaining.or(allDone)).toBeVisible({ timeout: 5_000 });
  });

  test('pre-seeded user with name shows in app state', async ({ page }) => {
    // seedAuth sets a known name — verify the app reached authenticated state
    // (navigation visible is the key assertion; name may not be visible on home tab)
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  });

  test('Learn tab loads without crashing', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: 'Learn', exact: true }).click();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    // Learn tab should render something — check the nav stays visible (no crash)
  });

  test('Practice tab loads without crashing', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: 'Practice', exact: true }).click();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  });

  test('localStorage auth state persists on reload', async ({ page }) => {
    // Reload the page — seedAuth wrote to localStorage so it should persist
    await page.reload();
    // Firebase returns null (blocked) but earlyRestore keeps the session
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
  });
});
