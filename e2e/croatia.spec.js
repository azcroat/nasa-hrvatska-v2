import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, mockContent, openDoor } from './fixtures/seed-auth.js';

test.describe('Hrvatska tab (doors)', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    await page.goto('/croatia');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('Danas u Hrvatskoj')).toBeVisible({ timeout: 20_000 });
  });

  test('renders the Danas card + five doors', async ({ page }) => {
    // Door rows render "<icon> <title>" so match on the title substring.
    for (const title of ['Priče', 'Krajevi', 'Život', 'Povijest i jezik', 'Mediji']) {
      await expect(page.getByText(title).first()).toBeVisible();
    }
  });

  test('opening Krajevi shows region cards', async ({ page }) => {
    await openDoor(page, 'Krajevi');
    await expect(page.getByText('← Hrvatska')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Zagreb').first()).toBeVisible();
    await expect(page.getByText('Interaktivna karta')).toBeVisible();
  });

  test('a region card opens its region screen', async ({ page }) => {
    await openDoor(page, 'Krajevi');
    await page.getByText('Zagreb').first().click();
    // RegionScreen is lazy-loaded; tabs appear after the chunk loads.
    await expect(page.getByText('Overview').first()).toBeVisible({ timeout: 15_000 });
  });

  test('Priče embeds the Stories letters', async ({ page }) => {
    await openDoor(page, 'Priče');
    await expect(page.getByText('← Hrvatska')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText("Baka's Summer")).toBeVisible();
  });

  test('Povijest i jezik shows the Domovinski Rat card and opens history', async ({ page }) => {
    await openDoor(page, 'Povijest i jezik');
    const btn = page.locator('button.exercise-card').filter({ hasText: 'Domovinski Rat' }).first();
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await expect(page.getByText('Timeline').first()).toBeVisible({ timeout: 15_000 });
  });

  test('back from a door returns to the door list', async ({ page }) => {
    await openDoor(page, 'Mediji');
    await expect(page.getByText('← Hrvatska')).toBeVisible({ timeout: 8_000 });
    await page.getByText('← Hrvatska').click();
    await expect(page.getByText('Danas u Hrvatskoj')).toBeVisible({ timeout: 8_000 });
  });
});
