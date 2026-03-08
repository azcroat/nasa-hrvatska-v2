import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS } from './fixtures/seed-auth.js';

test.describe('Croatia tab', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: 'Croatia', exact: true }).click();
    await expect(page.getByRole('heading', { name: /History.*Regions/i })).toBeVisible({ timeout: 5_000 });
  });

  test.describe('History & Regions section', () => {
    test('renders the History & Regions heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /History.*Regions/i })).toBeVisible();
    });

    test('shows Domovinski Rat card', async ({ page }) => {
      await expect(page.getByText('Domovinski Rat').first()).toBeVisible();
    });

    test('shows Vukovar card', async ({ page }) => {
      await expect(page.getByText('Vukovar').first()).toBeVisible();
    });

    test('shows Croatian Kings card', async ({ page }) => {
      await expect(page.getByText('Croatian Kings').first()).toBeVisible();
    });

    test('shows Zagreb card', async ({ page }) => {
      await expect(page.getByText('Zagreb').first()).toBeVisible();
    });

    test('clicking Domovinski Rat opens the history screen (shows Timeline)', async ({ page }) => {
      await page.getByText('Domovinski Rat').first().click();
      // HistoryScreen renders a "Timeline" heading
      await expect(page.getByText('Timeline').first()).toBeVisible({ timeout: 5_000 });
    });

    test('tab bar returns to Croatia after viewing history', async ({ page }) => {
      await page.getByText('Domovinski Rat').first().click();
      await expect(page.getByText('Timeline').first()).toBeVisible({ timeout: 5_000 });
      // Navigate back via the Croatia tab in the nav bar
      await page.getByRole('navigation', { name: 'Main navigation' })
        .getByRole('button', { name: 'Croatia', exact: true }).click();
      await expect(page.getByRole('heading', { name: /History.*Regions/i })).toBeVisible({ timeout: 5_000 });
    });

    test('clicking a region card (Zagreb) navigates to that region screen', async ({ page }) => {
      await page.getByText('Zagreb').first().click();
      // RegionScreen renders tabs: Overview, Timeline, People, Language, Quiz
      await expect(page.getByText('Overview').first()).toBeVisible({ timeout: 5_000 });
    });
  });

  test.describe('Media & Immersion accordion', () => {
    test('renders the Media & Immersion section heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Media.*Immersion|Immersion/i })).toBeVisible();
    });

    test('shows at least one media category button', async ({ page }) => {
      const accordionButtons = page.locator('button').filter({ hasText: /TV|Radio|YouTube|Podcast|Music|Film/i });
      await expect(accordionButtons.first()).toBeVisible({ timeout: 3_000 });
    });

    test('clicking a media category expands its content', async ({ page }) => {
      const firstAccordion = page.locator('button').filter({ hasText: /TV|Radio|YouTube|Podcast|Music|Film/i }).first();
      if (await firstAccordion.count() > 0) {
        await firstAccordion.click();
        await page.waitForTimeout(350);
        // After expanding, links to external content should appear
        const links = page.locator('a[href]');
        const count = await links.count();
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Shopping & Food section', () => {
    test('renders Shopping & Food section heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Shopping.*Food|Food.*Shopping/i })).toBeVisible();
    });

    test('shows at least one card', async ({ page }) => {
      const cards = page.locator('button.tc').filter({ hasText: /.{4,}/ });
      expect(await cards.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Daily Life section', () => {
    test('renders Daily Life section heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Daily Life/i })).toBeVisible();
    });

    test('shows at least one card', async ({ page }) => {
      const cards = page.locator('button.tc').filter({ hasText: /.{4,}/ });
      expect(await cards.count()).toBeGreaterThan(0);
    });
  });
});
