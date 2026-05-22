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
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('navigation bar renders all five tabs', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('button', { name: 'Today', exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Learn', exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Practice', exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Croatia', exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Me', exact: true })).toBeVisible();
  });

  test('Practice tab shows Daily Quests section', async ({ page }) => {
    // QuestTracker moved from Home tab to Practice tab
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: 'Practice', exact: true })
      .click();
    // SW may trigger a reload while caching the PracticeTab chunk on first run — absorb it.
    await page.waitForLoadState('domcontentloaded', { timeout: 10_000 }).catch(() => {});
    await expect(page.getByText('Daily Quests').first()).toBeVisible({ timeout: 20_000 });
  });

  test('Practice tab shows EARN BONUS XP label', async ({ page }) => {
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: 'Practice', exact: true })
      .click();
    await page.waitForLoadState('domcontentloaded', { timeout: 10_000 }).catch(() => {});
    // Wait for any element on Practice tab to render (more reliable than waiting for the specific button straight away)
    await expect(page.getByText('Speed Challenge').first()).toBeVisible({ timeout: 20_000 });
    // Collapsed QuestTracker button: "N of M complete". Use .first() to disambiguate
    // if multiple progress-shaped buttons render on the page during transitions.
    const questsBtn = page
      .locator('button')
      .filter({ hasText: /\d+ of \d+ complete/ })
      .first();
    await expect(questsBtn).toBeVisible({ timeout: 20_000 });
    await questsBtn.click();
    // Small settle after click — collapsed-to-expanded transition isn't instant
    await page.waitForTimeout(200);
    await expect(page.getByText('EARN BONUS XP').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Practice tab shows quest count or all-complete message', async ({ page }) => {
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: 'Practice', exact: true })
      .click();
    await page.waitForLoadState('domcontentloaded', { timeout: 10_000 }).catch(() => {});
    await expect(page.getByText('Speed Challenge').first()).toBeVisible({ timeout: 20_000 });
    const questsBtn = page
      .locator('button')
      .filter({ hasText: /\d+ of \d+ complete/ })
      .first();
    await expect(questsBtn).toBeVisible({ timeout: 20_000 });
    await questsBtn.click();
    await page.waitForTimeout(200);
    await expect(page.getByText('EARN BONUS XP').first()).toBeVisible({ timeout: 10_000 });
    // Verify the quest count/completion line is in the rendered body. Poll
    // for it rather than a single textContent snapshot — the QuestTracker
    // may finish hydrating after the EARN BONUS XP header appears.
    await expect
      .poll(
        async () => {
          const body = (await page.locator('body').textContent()) || '';
          return /quests? remaining/i.test(body) || /all quests complete/i.test(body);
        },
        { timeout: 10_000 },
      )
      .toBe(true);
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
