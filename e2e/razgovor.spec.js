import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, mockContent, enterPartner } from './fixtures/seed-auth.js';

test.describe('Razgovor tab', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    await page.goto('/ai');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('Danas', { exact: true })).toBeVisible({ timeout: 20_000 });
  });

  test('renders the Today card + five partners + Alati shelf', async ({ page }) => {
    for (const n of ['Ana', 'Marko', 'Baka Marija', 'prof. Kovač', 'Ivo']) {
      await expect(page.getByText(n, { exact: true }).first()).toBeVisible();
    }
    await expect(page.getByText(/AI alati/i)).toBeVisible();
  });

  test('opening Ana shows her greeting + conversation modes', async ({ page }) => {
    await page.getByText('Ana', { exact: true }).first().click();
    await expect(page.getByText('← Razgovor')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/O čemu ćemo danas pričati/)).toBeVisible();
    await expect(page.getByText('Počni razgovor')).toBeVisible();
    await expect(page.getByText('Odigraj scenu')).toBeVisible();
  });

  test('prof. Kovač shows the correction-tools cluster', async ({ page }) => {
    await enterPartner(page, 'prof. Kovač');
    await expect(page.getByText('Vođeni sat')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Pošalji mi tekst')).toBeVisible();
    await expect(page.getByText('Slijepe točke')).toBeVisible();
  });

  test('Alati shelf expands to the AI utilities', async ({ page }) => {
    await page.getByText('AI alati').click();
    await expect(page.getByText('AI slušanje')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Foto skener riječi')).toBeVisible();
  });

  test('back from a partner returns to the partner list', async ({ page }) => {
    await page.getByText('Marko', { exact: true }).first().click();
    await expect(page.getByText('← Razgovor')).toBeVisible({ timeout: 8_000 });
    await page.getByText('← Razgovor').click();
    await expect(page.getByText('S kim ćeš pričati?')).toBeVisible({ timeout: 8_000 });
  });
});
