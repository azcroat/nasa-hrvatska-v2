/**
 * Family Group E2E tests.
 * Tests the UI flows for family management via FriendsScreen:
 *  - Navigate: Profile → Insights tab → "Friends & Family" → "Family Group" tab
 *  - Empty state: Learn Together / Create / Join prompts
 *  - Input validation: code length, auto-uppercase
 *  - No uncaught JS errors
 *
 * Note: Tests that require live Firestore family data are omitted here because
 * blockFirebase() aborts all Firestore requests. FriendsScreen's FamilyTab
 * calls fbLoadUserFamily() (Firestore), so family data cannot be seeded via
 * localStorage in this hermetic environment. Those flows are covered by
 * the live-login E2E suite instead.
 */
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, mockContent } from './fixtures/seed-auth.js';

async function goToFamilyGroup(page) {
  // Profile defaults to Stats — Friends & Family is in Insights subtab
  await page.getByRole('button', { name: /Insights/i }).click();
  await page.getByRole('button', { name: /Friends & Family/i }).click();
  // FriendsScreen has two tabs: Friends | Family Group
  await page.getByRole('button', { name: /Family Group/i }).click();
  await expect(
    page.getByRole('heading', { name: /Friends & Family/i }),
  ).toBeVisible({ timeout: 5_000 });
}

test.describe('Family Group', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    // Navigate directly to /profile to avoid post-auth navigate('/') race.
    await page.goto('/profile');
    await expect(
      page.getByRole('navigation', { name: 'Main navigation' }),
    ).toBeVisible({ timeout: 10_000 });
    // Switch to Insights tab so Friends & Family button is reachable
    await page.getByRole('button', { name: /Insights/i }).click();
    await expect(
      page.getByRole('button', { name: /Friends & Family/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Friends & Family screen opens and shows create/join prompts', async ({ page }) => {
    await goToFamilyGroup(page);
    // Empty state shows "Learn Together" heading and create/join UI
    await expect(
      page.getByText(/Learn Together|Create.*Family|Enter invite code/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Create a Family Group button is visible', async ({ page }) => {
    await goToFamilyGroup(page);
    await expect(
      page.getByRole('button', { name: /Create a Family Group/i }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Join via invite code input is visible', async ({ page }) => {
    await goToFamilyGroup(page);
    await expect(
      page.getByPlaceholder(/Enter invite code/i),
    ).toBeVisible({ timeout: 3_000 });
  });

  test('Join button is disabled when invite code is empty', async ({ page }) => {
    await goToFamilyGroup(page);
    const joinBtn = page.getByRole('button', { name: /^Join$/i });
    await expect(joinBtn).toBeDisabled();
  });

  test('Invite code input uppercases automatically', async ({ page }) => {
    await goToFamilyGroup(page);
    const input = page.getByPlaceholder(/Enter invite code/i);
    await input.fill('abc123');
    const value = await input.inputValue();
    expect(value).toBe('ABC123');
  });

  test('Friends & Family screen has no uncaught JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await goToFamilyGroup(page);
    await page.waitForTimeout(500);
    const unexpected = errors.filter(
      (e) => !e.includes('firebase') && !e.includes('firestore') && !e.includes('fetch'),
    );
    expect(unexpected).toHaveLength(0);
  });
});
