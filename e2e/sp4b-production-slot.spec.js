// e2e/sp4b-production-slot.spec.js
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS } from './fixtures/seed-auth.js';

test.describe('SP4b — production slot in daily session', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page, { xp: 1500 }); // B1-level seeded user
    await blockFirebase(page);
    await mockTTS(page);
  });

  test('daily session contains a production exercise (mic available)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('nh_mic_state', 'available');
    });
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
    const productionLabels = [
      'Speaking Sprint',
      'Shadowing',
      'Production',
      'Free Writing',
      'Dictation',
    ];
    let found = false;
    for (const label of productionLabels) {
      if ((await page.getByText(label).count()) > 0) {
        found = true;
        break;
      }
    }
    expect(found, 'expected a production exercise label on the home screen').toBe(true);
  });

  test('mic-denied user sees keyboard-only production label', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('nh_mic_state', 'denied');
    });
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });
    const keyboardLabels = ['Free Writing', 'Dictation'];
    let found = false;
    for (const label of keyboardLabels) {
      if ((await page.getByText(label).count()) > 0) {
        found = true;
        break;
      }
    }
    expect(found, 'expected a keyboard-only production label for mic-denied user').toBe(true);
  });
});
