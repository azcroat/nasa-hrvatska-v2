import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS } from './fixtures/seed-auth.js';

test.describe('Croatia tab', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    // Navigate directly to /croatia to avoid post-auth navigate('/') race on tab click.
    await page.goto('/croatia');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /History.*Regions/i })).toBeVisible({ timeout: 15_000 });
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
      const btn = page.locator('button.exercise-card').filter({ hasText: 'Domovinski Rat' }).first();
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      // CroatiaHistoryScreen renders a "Timeline" label above the events list
      await expect(page.getByText('Timeline').first()).toBeVisible({ timeout: 5_000 });
    });

    test('tab bar returns to Croatia after viewing history', async ({ page }) => {
      const btn = page.locator('button.exercise-card').filter({ hasText: 'Domovinski Rat' }).first();
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      await expect(page.getByText('Timeline').first()).toBeVisible({ timeout: 5_000 });
      // Navigate back via the Croatia tab in the nav bar
      await page.getByRole('navigation', { name: 'Main navigation' })
        .getByRole('button', { name: 'Croatia', exact: true }).click();
      await expect(page.getByRole('heading', { name: /History.*Regions/i })).toBeVisible({ timeout: 10_000 });
    });

    test('clicking a region card (Zagreb) navigates to that region screen', async ({ page }) => {
      const btn = page.locator('button.exercise-card').filter({ hasText: 'Zagreb' }).first();
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      // RegionScreen renders tabs: Overview, Timeline, People, Language, Quiz
      await expect(page.getByText('Overview').first()).toBeVisible({ timeout: 5_000 });
    });
  });

  test.describe('Immersion section', () => {
    test('renders the Immersion section heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Immersion/i })).toBeVisible({ timeout: 10_000 });
    });

    test('shows at least one immersion feature button', async ({ page }) => {
      // Immersion section has Live Tutor, AI Conversations, Immersion Hub buttons
      const btns = page.locator('button').filter({ hasText: /Tutor|AI Conversations|Immersion Hub/i });
      await expect(btns.first()).toBeVisible({ timeout: 3_000 });
    });
  });

  test.describe('Croatian Life section', () => {
    test('renders Croatian Life section heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Croatian Life/i })).toBeVisible();
    });

    test('shows at least one card', async ({ page }) => {
      // Croatian Life cards use the exercise-card class — use retrying assertion
      const cards = page.locator('button.exercise-card').filter({ hasText: /.{4,}/ });
      await expect(cards.first()).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('Language & Culture section', () => {
    test('renders Language & Culture section heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Language.*Culture/i })).toBeVisible();
    });

    test('shows at least one card', async ({ page }) => {
      // Language & Culture uses .tc class cards — use retrying assertion
      const cards = page.locator('button.tc').filter({ hasText: /.{4,}/ });
      await expect(cards.first()).toBeVisible({ timeout: 10_000 });
    });
  });
});
