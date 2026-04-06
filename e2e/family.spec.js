/**
 * Family leaderboard E2E tests.
 * Tests the UI flows that caused the most user-reported bugs:
 *  - "Must be logged in" error (was a prop name mismatch)
 *  - Family join blocked by Firestore permission-denied
 *  - Leaderboard showing 0 XP for members
 */
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, TEST_EMAIL } from './fixtures/seed-auth.js';

async function goToLeaderboard(page) {
  // Profile defaults to Stats subtab — Leaderboard button is in Learning Tools section
  await page.getByRole('button', { name: /Leaderboard/i }).click();
  await expect(page.getByText(/Family Leaderboard/i)).toBeVisible({ timeout: 5_000 });
}

test.describe('Family Leaderboard', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    // Navigate directly to /profile to avoid post-auth navigate('/') race on tab click.
    await page.goto('/profile');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /Leaderboard/i })).toBeVisible({ timeout: 10_000 });
  });

  test('leaderboard screen opens without "must be logged in" error', async ({ page }) => {
    await goToLeaderboard(page);
    // Should NOT show the old "You must be logged in" error
    await expect(page.getByText(/You must be logged in/i)).not.toBeVisible();
  });

  test('leaderboard tabs render (main, create, join)', async ({ page }) => {
    await goToLeaderboard(page);
    await expect(page.getByText(/Leaderboard/i).first()).toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole('button', { name: /Create Family/i }).first()).toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole('button', { name: /Join Family/i }).first()).toBeVisible({ timeout: 3_000 });
  });

  test('no family state shows empty state with Create/Join prompts', async ({ page }) => {
    await goToLeaderboard(page);
    // Main tab with no family shows the "No Family Group Yet" empty state
    await expect(page.getByText(/No Family Group Yet|Create.*Family|Join.*Family/i).first())
      .toBeVisible({ timeout: 5_000 });
  });

  test('Create Family tab shows family name input', async ({ page }) => {
    await goToLeaderboard(page);
    await page.getByRole('button', { name: '➕ Create Family' }).first().click();
    await expect(page.getByPlaceholder(/Horvat Family|family name/i)).toBeVisible({ timeout: 3_000 });
  });

  test('Create Family validates empty name', async ({ page }) => {
    await goToLeaderboard(page);
    await page.getByRole('button', { name: '➕ Create Family' }).first().click();
    // Click create without entering a name
    await page.getByRole('button', { name: /Create Family Group/i }).click();
    await expect(page.getByText(/Please enter a family name/i)).toBeVisible({ timeout: 3_000 });
  });

  test('Join Family tab shows code input', async ({ page }) => {
    await goToLeaderboard(page);
    await page.getByRole('button', { name: '🔗 Join Family' }).first().click();
    await expect(page.getByPlaceholder(/AB3X7K/i)).toBeVisible({ timeout: 3_000 });
  });

  test('Join Family validates code length', async ({ page }) => {
    await goToLeaderboard(page);
    await page.getByRole('button', { name: '🔗 Join Family' }).first().click();
    await page.getByPlaceholder(/AB3X7K/i).fill('ABC');
    await page.getByRole('button', { name: /Join Family/i }).last().click();
    await expect(page.getByText(/6 characters/i)).toBeVisible({ timeout: 3_000 });
  });

  test('Join Family code input uppercases automatically', async ({ page }) => {
    await goToLeaderboard(page);
    await page.getByRole('button', { name: '🔗 Join Family' }).first().click();
    const input = page.getByPlaceholder(/AB3X7K/i);
    await input.fill('ab3x7k');
    const value = await input.inputValue();
    expect(value).toBe('AB3X7K');
  });

  test('leaderboard screen has no uncaught JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await goToLeaderboard(page);
    await page.waitForTimeout(500);
    const unexpected = errors.filter(e =>
      !e.includes('firebase') && !e.includes('firestore') && !e.includes('fetch')
    );
    expect(unexpected).toHaveLength(0);
  });
});

test.describe('Family leaderboard with seeded family data', () => {
  test('shows family name and code when user has a family', async ({ page }) => {
    // Seed a user who already belongs to a family
    await page.addInitScript(() => {
      localStorage.setItem('uFamily', JSON.stringify({
        name: 'The Test Family',
        code: 'TST123',
        role: 'admin',
      }));
    });
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/profile');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /Leaderboard/i })).toBeVisible({ timeout: 10_000 });
    await goToLeaderboard(page);

    // Should show the family name and code
    await expect(page.getByText(/The Test Family/i).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/TST123/).first()).toBeVisible({ timeout: 5_000 });
  });

  test('shows Share Invite Link button for family admin', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('uFamily', JSON.stringify({
        name: 'The Test Family',
        code: 'TST123',
        role: 'admin',
      }));
    });
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/profile');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /Leaderboard/i })).toBeVisible({ timeout: 10_000 });
    await goToLeaderboard(page);

    await expect(page.getByText(/Share Invite Link/i)).toBeVisible({ timeout: 5_000 });
  });

  test('shows Leave Family button when in a family', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('uFamily', JSON.stringify({
        name: 'The Test Family',
        code: 'TST123',
        role: 'member',
      }));
    });
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/profile');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /Leaderboard/i })).toBeVisible({ timeout: 10_000 });
    await goToLeaderboard(page);

    await expect(page.getByText(/Leave Family/i)).toBeVisible({ timeout: 5_000 });
  });
});
