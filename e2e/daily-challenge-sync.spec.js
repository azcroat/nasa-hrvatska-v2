import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, TEST_EMAIL } from './fixtures/seed-auth.js';

/**
 * Tests that daily challenge state persists correctly across devices.
 * Covers the cross-device sync fix (dcDay3 now stored in Firestore + localStorage).
 */
test.describe('Daily Challenge sync', () => {
  const today = new Date().toISOString().slice(0, 10);

  test('fresh load shows 0/3 unanswered', async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('0/3', { exact: true })).toBeVisible();
  });

  test('pre-seeded all-answered state restores (shows completion screen)', async ({ page }) => {
    await page.addInitScript(({ email, today }) => {
      const now = Date.now();
      localStorage.setItem('uS', JSON.stringify({ u: email, lastActive: now }));
      localStorage.setItem('uA', JSON.stringify({ [email]: { d: 'Test Učenik', e: email } }));
      localStorage.setItem('uP_' + email, JSON.stringify({
        name: 'Test Učenik', cp: true,
        st: { xp: 250, lc: 10, gc: 5, sp: 3, de: 2, rc: 1, al: 1, mv: 0, hi: 0, rs: 0, ct: 0, badges: [] },
      }));
      localStorage.setItem('dcDay3', JSON.stringify({
        day: today, answered: [true, true, true], selected: [0, 1, 0],
      }));
      localStorage.setItem('uStreak', JSON.stringify({ count: 5, last: today }));
    }, { email: TEST_EMAIL, today });
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    // Completed state shows "New challenges at midnight"
    await expect(page.getByText('New challenges at midnight')).toBeVisible({ timeout: 5_000 });
  });

  test('pre-seeded one-answered state restores as 1/3', async ({ page }) => {
    await page.addInitScript(({ email, today }) => {
      const now = Date.now();
      localStorage.setItem('uS', JSON.stringify({ u: email, lastActive: now }));
      localStorage.setItem('uA', JSON.stringify({ [email]: { d: 'Test Učenik', e: email } }));
      localStorage.setItem('uP_' + email, JSON.stringify({
        name: 'Test Učenik', cp: true,
        st: { xp: 250, lc: 10, gc: 5, sp: 3, de: 2, rc: 1, al: 1, mv: 0, hi: 0, rs: 0, ct: 0, badges: [] },
      }));
      // Simulate answering one challenge on another device (via Firestore sync)
      localStorage.setItem('dcDay3', JSON.stringify({
        day: today, answered: [true, false, false], selected: [0, -1, -1],
      }));
      localStorage.setItem('uStreak', JSON.stringify({ count: 5, last: today }));
    }, { email: TEST_EMAIL, today });
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    // Should restore 1/3 from the pre-seeded state (simulates cross-device sync)
    await expect(page.getByText('1/3', { exact: true })).toBeVisible({ timeout: 5_000 });
  });

  test('challenges from a previous day are not restored (expired)', async ({ page }) => {
    await page.addInitScript(({ email }) => {
      const now = Date.now();
      localStorage.setItem('uS', JSON.stringify({ u: email, lastActive: now }));
      localStorage.setItem('uA', JSON.stringify({ [email]: { d: 'Test Učenik', e: email } }));
      localStorage.setItem('uP_' + email, JSON.stringify({
        name: 'Test Učenik', cp: true,
        st: { xp: 250, lc: 10, gc: 5, sp: 3, de: 2, rc: 1, al: 1, mv: 0, hi: 0, rs: 0, ct: 0, badges: [] },
      }));
      // Old day's data — must not restore
      localStorage.setItem('dcDay3', JSON.stringify({
        day: '2020-01-01', answered: [true, true, true], selected: [0, 1, 0],
      }));
      localStorage.setItem('uStreak', JSON.stringify({ count: 5, last: '2020-01-01' }));
    }, { email: TEST_EMAIL });
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });
    // Old data should be ignored — fresh challenges = 0/3
    await expect(page.getByText('0/3', { exact: true })).toBeVisible();
  });

  test('answering a challenge writes correct data structure to localStorage', async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 10_000 });

    // Trigger an answer via JavaScript (challenge option buttons have no CSS class)
    await page.evaluate(() => {
      for (const btn of document.querySelectorAll('button')) {
        if (!btn.disabled && !btn.className && btn.textContent.trim().length > 0) {
          btn.click();
          break;
        }
      }
    });

    // Verify localStorage was written with the correct structure
    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('dcDay3');
      return raw ? JSON.parse(raw) : null;
    });

    expect(stored).not.toBeNull();
    expect(typeof stored.day).toBe('string');
    expect(stored.day).toBe(new Date().toISOString().slice(0, 10));
    expect(Array.isArray(stored.answered)).toBe(true);
    expect(stored.answered).toHaveLength(3);
    expect(Array.isArray(stored.selected)).toBe(true);
    // At least one challenge should be answered
    expect(stored.answered.some(a => a === true)).toBe(true);
  });
});
