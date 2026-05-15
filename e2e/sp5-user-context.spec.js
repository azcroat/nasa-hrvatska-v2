// e2e/sp5-user-context.spec.js
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS } from './fixtures/seed-auth.js';

test.describe('SP5 — user-context payload visible at AI request site', () => {
  test.beforeEach(async ({ page }) => {
    // xp:3000 → total 3275 → B1 (covers the writing/dictation production exercises)
    await seedAuth(page, { xp: 3000 });
    await blockFirebase(page);
    await mockTTS(page);
    // Seed an error and topic_accuracy so buildUserContext has signals to send
    await page.addInitScript(() => {
      localStorage.removeItem('nh_daily_session');
      const fiveMinAgo = Date.now() - 5 * 60 * 1000;
      localStorage.setItem(
        'nh_recent_errors',
        JSON.stringify([
          {
            topic: 'accusative',
            prompt: 'Vidim ____ knjigu',
            userAnswer: 'knjiga',
            correctAnswer: 'knjigu',
            at: fiveMinAgo,
          },
        ]),
      );
      localStorage.setItem(
        'topic_accuracy',
        JSON.stringify({
          accusative: { attempts: 19, correct: 8, lastAttempt: Date.now() },
        }),
      );
    });
  });

  test('POST to /api/correct includes a v1 userContext payload with seeded signals', async ({ page }) => {
    const capturedBodies = [];
    await page.route('**/api/correct', async (route) => {
      const req = route.request();
      try {
        const body = JSON.parse(req.postData() ?? '{}');
        capturedBodies.push(body);
      } catch {
        capturedBodies.push({ _parseError: true });
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          corrected_text: 'x',
          score: 80,
          level_demonstrated: 'B1',
          changes: [],
          strengths: ['ok'],
          improvements: ['ok'],
          encouragement: 'Bravo!',
        }),
      });
    });

    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 15_000,
    });

    // Navigate to the Practice tab where Writing lives
    const practiceBtn = page.getByRole('button', { name: /practice/i }).first();
    await practiceBtn.click();

    // Click the writing/free-write entry — try several selectors since the UI evolves
    const writingEntry = page
      .getByRole('button', { name: /free writing|writing|napiši/i })
      .first();
    await writingEntry.click({ trial: false }).catch(async () => {
      // If button-role not found, fall back to text-role
      await page.getByText(/free writing/i).first().click();
    });

    // Type something and submit
    const writingInput = page.getByRole('textbox').first();
    await writingInput.fill('Imam mama i tata.');

    const submitBtn = page.getByRole('button', { name: /correct|submit|check|provjeri/i }).first();
    await submitBtn.click();

    // Wait for the /api/correct request to fire
    await page.waitForRequest('**/api/correct', { timeout: 15_000 });

    expect(capturedBodies.length).toBeGreaterThan(0);
    const body = capturedBodies[capturedBodies.length - 1];
    expect(body.userContext, 'expected userContext field on body').toBeDefined();
    expect(body.userContext.version).toBe(1);
    expect(body.userContext.level.cefr).toBe('B1');
    expect(body.userContext.recentErrors.length).toBeGreaterThan(0);
    expect(body.userContext.recentErrors[0].topic).toBe('accusative');
  });
});
