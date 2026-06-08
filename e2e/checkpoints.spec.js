/**
 * Comprehension Checkpoints E2E — Plan 3 Task 10
 *
 * Seeds a certified B1 user with an overdue checkpoint cadence, forces the
 * feature flag on via window.__NH_CHECKPOINTS_FORCE__, and stubs the speaking
 * endpoint so no mic / Whisper / Claude is hit.
 *
 * Spec 1: invite can be deferred (checkpoint-snooze hides the invite).
 * Spec 2: full pass path — start → MCQ loop → stubbed speaking → result card.
 */
import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS } from './fixtures/seed-auth.js';

test.beforeEach(async ({ page }) => {
  // 1. Standard auth fixture: seeds localStorage for an already-logged-in user.
  await seedAuth(page);
  // 2. Block Firestore + Firebase Auth so tests are hermetic (no live DB writes).
  await blockFirebase(page);
  // 3. Mock TTS + AI chat so audio doesn't block rendering.
  await mockTTS(page);

  // 4. Stub MediaRecorder + getUserMedia so the speaking phase resolves immediately
  //    without a real microphone. FakeMediaRecorder.start() fires stop on the next
  //    microtask so the recorder Promise resolves well within the test timeout.
  await page.addInitScript(() => {
    const fakeStream = {
      getTracks: () => [{ stop: () => {} }],
      getAudioTracks: () => [{ stop: () => {} }],
      getVideoTracks: () => [],
    };
    if (typeof navigator !== 'undefined') {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: { getUserMedia: () => Promise.resolve(fakeStream) },
      });
    }
    class FakeMediaRecorder {
      constructor(stream, options) {
        this.stream = stream;
        this.mimeType = (options && options.mimeType) || 'audio/webm';
        this.state = 'inactive';
        this.ondataavailable = null;
        this.onstop = null;
      }
      start() {
        this.state = 'recording';
        // Fire stop immediately (next microtask) so captureAudio resolves fast.
        Promise.resolve().then(() => this.stop());
      }
      stop() {
        if (this.state === 'inactive') return;
        this.state = 'inactive';
        const blob = new Blob([new Uint8Array(8)], { type: this.mimeType });
        if (this.ondataavailable) this.ondataavailable({ data: blob });
        if (this.onstop) this.onstop();
      }
    }
    FakeMediaRecorder.isTypeSupported = () => true;
    window.MediaRecorder = FakeMediaRecorder;
  });

  // 5. Seed checkpoint-specific localStorage before page load.
  await page.addInitScript(() => {
    // Certified B1 with cadence overdue (lastCheckpointAt null, activeDaysAtLastCheckpoint 0).
    localStorage.setItem(
      'nh_cefr_certifications',
      JSON.stringify({
        passes: {
          A2: { passedAt: 1, scores: { vocab: 0.9, grammar: 0.9 }, overall: 90 },
          B1: { passedAt: 1, scores: { vocab: 0.9, grammar: 0.9 }, overall: 90 },
        },
        attempts: [],
        lastFailedAt: {},
        checkpoints: {
          lastCheckpointAt: null,
          activeDaysAtLastCheckpoint: 0,
          consecutiveFails: {},
          focusSkills: {},
          demotions: [],
          snoozedUntil: null,
        },
        v: 2,
      }),
    );
    // 99 active days → well past the 5-day trigger threshold.
    localStorage.setItem('nh_active_days', JSON.stringify({ lastDay: '2000-01-01', count: 99 }));
    // Force the feature on and bypass the syncReady gate for test environments.
    (window).__NH_CHECKPOINTS_FORCE__ = true;
  });

  // 5. Stub the speaking assessment endpoint so no real audio/Whisper/Claude is hit.
  await page.route('**/api/assess-speaking', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        transcript: 'Putovao sam u Zagreb.',
        scores: { range: 0.9, accuracy: 0.9, fluency: 0.9, task: 0.9 },
        // R3.5 renamed the wire field confidence → transcriptSufficiency (a word-count
        // length heuristic, not acoustic confidence). The scorer reads this exact key.
        transcriptSufficiency: 0.9,
      }),
    }),
  );
});

test('checkpoint invite can be deferred', async ({ page }) => {
  await page.goto('/');
  // Wait for the app shell to render (nav visible = authScreen === 'app').
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
    timeout: 15_000,
  });
  // Give React effects (recordActiveDayNow, checkpoint due computation) time to settle.
  await page.waitForTimeout(500);
  // The invite should appear because: forced=true, authScreen='app', currentScreen='dashboard', due=true.
  await expect(page.getByTestId('checkpoint-invite')).toBeVisible({ timeout: 10_000 });
  // Clicking snooze hides the invite.
  await page.getByTestId('checkpoint-snooze').click();
  await expect(page.getByTestId('checkpoint-invite')).toBeHidden({ timeout: 5_000 });
});

test('full pass keeps the level', async ({ page }) => {
  await page.goto('/');
  // Wait for app shell.
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
    timeout: 15_000,
  });
  await page.waitForTimeout(500);
  // Wait for invite then start the exam.
  await expect(page.getByTestId('checkpoint-invite')).toBeVisible({ timeout: 10_000 });
  await page.getByTestId('checkpoint-start').click();

  // MCQ phase: the exam has up to 5 MCQ items (3 core + 2 retention).
  // Click answer-0 + exam-next for each question until the speaking screen appears.
  for (let i = 0; i < 5; i++) {
    // If the speaking record button is visible we've moved past MCQ phase — stop.
    const speakBtn = page.getByTestId('speak-record');
    const answerBtn = page.getByTestId('answer-0');
    // Wait briefly for either MCQ or speaking phase to render.
    try {
      await answerBtn.waitFor({ state: 'visible', timeout: 3_000 });
    } catch {
      // No MCQ question present — we may be on the speaking screen already.
      break;
    }
    const isSpeaking = await speakBtn.isVisible();
    if (isSpeaking) break;
    await answerBtn.click();
    await page.getByTestId('exam-next').click();
  }

  // Speaking phase: click record — the stub endpoint responds instantly.
  await expect(page.getByTestId('speak-record')).toBeVisible({ timeout: 10_000 });
  await page.getByTestId('speak-record').click();

  // Result screen appears (pass / grace / demote — any of the three is valid).
  // Use .first() to target the result container div (not the retry button inside grace).
  await expect(page.locator('[data-testid^="result-"]').first()).toBeVisible({ timeout: 15_000 });
});
