import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTranslate, mockTTS, TEST_NAME } from './fixtures/seed-auth.js';

test.describe('Home tab', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockTranslate(page, 'Dobar dan');
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    // Wait for the app's post-auth routing and React renders to fully settle.
    // networkidle is soft — slower browsers (Firefox/WebKit/mobile) may not reach it;
    // the hero-ready wait below is the authoritative "page is ready" signal.
    await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {});
    // Wait for the hero stats row — the most reliable signal that the main content has
    // rendered and profile data (st.xp, name) is available.
    // 20s covers Mobile Chrome/Safari where React's async state batching can delay render.
    await page.getByText(/total XP/i).first().waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});
    // Also wait for user name — Mobile Chrome name state resolves 15-20s+ after stats on
    // device emulation (Firebase auth IndexedDB resolution is slower on Pixel 5 viewport).
    // .first() required: Desktop sidebar AND hero greeting both contain TEST_NAME.
    await page.getByText(new RegExp(TEST_NAME)).first().waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(300);
  });

  test.describe('Hero section', () => {
    test('shows personalised greeting with user name', async ({ page }) => {
      // .first() required: Desktop sidebar AND hero greeting both contain TEST_NAME,
      // causing a strict-mode violation without it.
      // 30s covers Mobile Chrome (Pixel 5) where name state resolves 15-20s+ after stats.
      await expect(page.getByText(new RegExp(TEST_NAME)).first()).toBeVisible({ timeout: 30_000 });
    });

    test('shows current level number', async ({ page }) => {
      // 30s covers Mobile Chrome (Pixel 5) where Level X renders after name state resolves.
      await expect(page.getByText(/Level \d+/i).first()).toBeVisible({ timeout: 30_000 });
    });

    test('shows XP in hero stats', async ({ page }) => {
      await expect(page.getByText(/total XP/i).first()).toBeVisible({ timeout: 8_000 });
    });

    test('shows streak count in hero', async ({ page }) => {
      await expect(page.getByText(/day streak/i).first()).toBeVisible({ timeout: 8_000 });
    });

    test('shows mastered word count', async ({ page }) => {
      await expect(page.getByText(/mastered/i).first()).toBeVisible({ timeout: 8_000 });
    });

    test('shows seeded XP value of 250 on screen', async ({ page }) => {
      const content = await page.locator('#main-content, [role="main"], body').first().textContent();
      expect(content).toContain('250');
    });
  });

  test.describe('CEFR progress', () => {
    test('shows CEFR level label in hero', async ({ page }) => {
      await expect(page.getByText(/CEFR LEVEL/i).first()).toBeVisible({ timeout: 8_000 });
    });
  });

  test.describe('AI Voice feature', () => {
    test('shows AI Conversation card', async ({ page }) => {
      // HomeTab renders an "AI Conversation" card in the daily-content section (below hero)
      // on all viewports. Desktop sidebar also shows "AI Voice Conversation →" (sidebar-only).
      // 12s allows for slower render on Firefox/WebKit/mobile under parallel load.
      await expect(page.getByText('AI Conversation').first()).toBeVisible({ timeout: 12_000 });
    });

    test('shows Daily Discovery section', async ({ page }) => {
      await expect(page.getByText(/Daily Discovery/i)).toBeVisible({ timeout: 12_000 });
    });
  });

  test.describe('Daily content', () => {
    test('shows Phrase of the Day', async ({ page }) => {
      await expect(page.getByText(/Phrase of the Day/i)).toBeVisible({ timeout: 12_000 });
    });

    test('shows AI Conversation card', async ({ page }) => {
      await expect(page.getByText(/AI Conversation/i).first()).toBeVisible({ timeout: 12_000 });
    });

    test('shows Live AI Tutor card', async ({ page }) => {
      await expect(page.getByText(/Live AI Tutor/i)).toBeVisible({ timeout: 12_000 });
    });
  });

  test.describe('Translate feature in hero', () => {
    test('translate toggle is accessible via hero quick-reply pill', async ({ page }) => {
      await expect(page.getByText('⇄ Translate').first()).toBeVisible({ timeout: 10_000 });
    });

    test('clicking Translate pill opens inline translate panel', async ({ page }) => {
      // Re-evaluate locator at each step — avoids "not attached to DOM" errors caused by
      // React re-renders between waitFor and the subsequent action (WebKit is especially sensitive).
      await page.getByText('⇄ Translate').first().waitFor({ state: 'visible', timeout: 10_000 });
      await page.getByText('⇄ Translate').first().click();
      await expect(page.getByPlaceholder(/Type English/i)).toBeVisible({ timeout: 8_000 });
      await expect(page.getByText('EN → HR ⇄')).toBeVisible({ timeout: 6_000 });
    });

    test('can toggle translation direction', async ({ page }) => {
      await page.getByText('⇄ Translate').first().waitFor({ state: 'visible', timeout: 10_000 });
      await page.getByText('⇄ Translate').first().click();
      await expect(page.getByText('EN → HR ⇄')).toBeVisible({ timeout: 6_000 });
      // Re-evaluate before click to avoid stale-element errors (WebKit/Firefox sensitive).
      // 10s timeout on result: Firefox React re-render after direction toggle is slower.
      await page.getByText('EN → HR ⇄').waitFor({ state: 'visible', timeout: 6_000 });
      await page.getByText('EN → HR ⇄').click();
      await expect(page.getByText('HR → EN ⇄')).toBeVisible({ timeout: 10_000 });
    });

    test('submits translation and shows result', async ({ page }) => {
      await page.getByText('⇄ Translate').first().waitFor({ state: 'visible', timeout: 10_000 });
      await page.getByText('⇄ Translate').first().click();
      const input = page.getByPlaceholder(/Type English/i);
      await input.waitFor({ state: 'visible', timeout: 8_000 });
      // React controlled inputs (value={tIn} + onChange) require a native input event to
      // update state. On WebKit, Playwright's fill() and pressSequentially() don't reliably
      // trigger React's synthetic onChange. Use the React Testing Library approach:
      // set the DOM value via the native HTMLInputElement prototype setter (bypasses React's
      // own override) then dispatch a bubbling 'input' event so React's event delegation
      // fires onChange and calls setTIn('Good day').
      await input.evaluate(el => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, 'Good day');
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      // Brief wait for React to finish re-rendering with tIn='Good day' before clicking Go.
      // Without this, doTr()'s closure may still capture the stale tIn='' from a prior render.
      await page.waitForTimeout(150);
      await page.getByRole('button', { name: 'Go', exact: true }).click();
      await expect(page.getByText('Dobar dan').first()).toBeVisible({ timeout: 10_000 });
    });

    test('submits translation via Enter key', async ({ page }) => {
      await page.getByText('⇄ Translate').first().waitFor({ state: 'visible', timeout: 10_000 });
      await page.getByText('⇄ Translate').first().click();
      const input = page.getByPlaceholder(/Type English/i);
      await input.waitFor({ state: 'visible', timeout: 8_000 });
      // Same React Testing Library approach as above — native setter + bubbling input event.
      await input.evaluate(el => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, 'Good day');
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      // Wait for React re-render before Enter so onKeyDown's doTr() closure sees tIn='Good day'.
      await page.waitForTimeout(150);
      // locator.press() ensures the element is focused before dispatching the keydown.
      await input.press('Enter');
      await expect(page.getByText('Dobar dan').first()).toBeVisible({ timeout: 10_000 });
    });
  });
});
