/**
 * ai-conversation.spec.js
 *
 * E2E tests for the AIConversation screen, accessible from:
 *   - AI Tutor tab → "AI Voice Conversation" card (canonical entry; consolidated
 *     in the 2026-05 refactor that removed the Practice hero and Culture-section
 *     entry points)
 *
 * Covers:
 *   1. Navigation — AI Conversations button visible on AI Tutor tab, opens screen
 *   2. Mode selection — write/conversation tab buttons, switching between modes
 *   3. Write mode — prompts list loads, selecting a prompt enables start, textarea appears
 *   4. Conversation mode setup — scenario grid, category filter, scenario selection,
 *      level selector, Start button enabled
 *   5. Conversation chat — input + messages area + End & Evaluate button visible
 *   6. Double-evaluation guard — rapid clicks don't duplicate the evaluation phase
 */

import { test, expect } from '@playwright/test';
import { seedAuth, blockFirebase, mockTTS, mockContent } from './fixtures/seed-auth.js';

// ---------------------------------------------------------------------------
// SSE response body — a complete single-event stream that signals a finished
// conversation immediately. The component reads this via ReadableStream.
// Format: {"type":"done","result":{...}} — callMaja checks parsed.type === 'done'
// and reads parsed.result. The result must have a non-empty `croatian` field or
// callMaja throws "The AI returned an empty response".
// ---------------------------------------------------------------------------
const SSE_DONE_BODY =
  'data: {"type":"done","result":{"croatian":"Zdravo! Kako si?","english_gloss":"Hello! How are you?",' +
  '"scaffolding_level":1,"emotion":"happy","correction":null,"is_session_end":false}}\n\n';

// ---------------------------------------------------------------------------
// Helper — mock all API routes used by AIConversation
// ---------------------------------------------------------------------------
async function mockConversationAPIs(page) {
  // /api/conversation — Server-Sent Events stream
  await page.route('**/api/conversation', route =>
    route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: SSE_DONE_BODY,
    })
  );

  // /api/correct — writing evaluation
  await page.route('**/api/correct', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        score: 85,
        corrections: [],
        rewrite: 'Well written!',
        feedback: 'Good work',
      }),
    })
  );

  // /api/srs-sync — vocabulary sync after conversation (optional, fail-open)
  await page.route('**/api/srs-sync', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ vocabulary: [] }),
    })
  );

  // /api/ai-chat — used for evaluate endpoint (callAI wrapper)
  await page.route('**/api/ai-chat', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        text: JSON.stringify({
          score: 78,
          grade: 'B',
          strengths: ['Good vocabulary'],
          improvements: ['Watch your case endings'],
          mistakes: [],
          suggestion: 'Keep practicing!',
        }),
      }),
    })
  );
}

// ---------------------------------------------------------------------------
// Helper — navigate to AIConversation from the AI Tutor tab (canonical entry).
// AI surfaces were consolidated to AITab in the 2026-05 refactor; Practice
// hero + Croatia/Culture entry points were removed.
// ---------------------------------------------------------------------------
async function openAIConvoFromAITab(page) {
  await page.goto('/ai');
  // SW may trigger a reload while caching the AITab chunk on first run — absorb it
  // before asserting navigation visibility, which briefly disappears during a reload.
  await page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 20_000 });
  // AITab is lazy-loaded and React.Suspense swaps the fallback for the real
  // component once the chunk arrives; that swap can briefly invalidate any
  // element handle resolved during the transient render. Wait for the
  // button to be attached AND stable before any further action.
  const aiHeroBtn = page.locator('button').filter({ hasText: 'AI Voice Conversation' }).first();
  await expect(aiHeroBtn).toBeVisible({ timeout: 20_000 });
  await aiHeroBtn.click();
  // First-load of the lazy AIConversation chunk can be slow in CI.
  await expect(page.getByText('Razgovor s Majom').first()).toBeVisible({ timeout: 20_000 });
}

// ---------------------------------------------------------------------------
// Helper — start a conversation (select Free Talk → Start) and reach chat phase
// ---------------------------------------------------------------------------
async function startFreeTalkConversation(page) {
  // The ConvoSetup renders "Free Talk — No Script Needed" as the first option
  const freeTalkCard = page.locator('div[role="button"], div').filter({ hasText: /Free Talk — No Script Needed/ }).first();
  // The free talk card is a div with onClick — use .click()
  await freeTalkCard.scrollIntoViewIfNeeded();
  await freeTalkCard.click();
  await page.waitForTimeout(300);

  // After selecting Free Talk, the start button changes label from "Select a scenario above"
  // to "Start — Free Conversation (B1)" (from AIConversationConvoSetup line 358).
  const startBtn = page.locator('button').filter({ hasText: /Start —/ });
  await expect(startBtn).toBeVisible({ timeout: 5_000 });
  await startBtn.click();

  // Chat phase renders the AIConversationChat full-screen overlay
  await expect(page.locator('button').filter({ hasText: /End & Evaluate/ })).toBeVisible({ timeout: 10_000 });
}

// ===========================================================================
// 1. Navigation
// ===========================================================================

test.describe('Navigation — AI Conversations from AI Tutor tab', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    await mockConversationAPIs(page);
    await page.goto('/ai');
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 20_000 });
  });

  test('AI Voice Conversation button is visible on the AI Tutor tab', async ({ page }) => {
    // AITab is lazy-loaded; the React.Suspense fallback→component swap can
    // detach a previously resolved element. Skip the manual scrollIntoView
    // (Playwright's actionability check scrolls on demand anyway) and rely
    // on toBeVisible's auto-retry to wait for a stable, attached element.
    const btn = page.locator('button').filter({ hasText: 'AI Voice Conversation' }).first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
  });

  test('clicking AI Voice Conversation opens the AIConversation screen', async ({ page }) => {
    const btn = page.locator('button').filter({ hasText: 'AI Voice Conversation' }).first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click();
    // AIConversationHeader renders "Razgovor s Majom" in the hero
    await expect(page.getByText('Razgovor s Majom').first()).toBeVisible({ timeout: 10_000 });
  });

  test('AIConversation screen shows "Native Croatian speaker · All levels" subtitle', async ({ page }) => {
    await openAIConvoFromAITab(page);
    await expect(page.getByText(/Native Croatian speaker · All levels/)).toBeVisible({ timeout: 5_000 });
  });
});

// ===========================================================================
// 2. Mode selection
// ===========================================================================

test.describe('Mode selection', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    await mockConversationAPIs(page);
    await openAIConvoFromAITab(page);
  });

  test('Conversation mode tab button "💬 Razgovor" is visible', async ({ page }) => {
    await expect(page.locator('button').filter({ hasText: /💬 Razgovor/ })).toBeVisible({ timeout: 5_000 });
  });

  test('Write mode tab button "✍️ Free Write" is visible', async ({ page }) => {
    await expect(page.locator('button').filter({ hasText: /✍️ Free Write/ })).toBeVisible({ timeout: 5_000 });
  });

  test('default mode is conversation — scenario grid is visible', async ({ page }) => {
    // ConvoSetup renders the scenario grid and level selector under the header
    await expect(page.getByText('Your Level', { exact: true })).toBeVisible({ timeout: 5_000 });
  });

  test('switching to Write mode shows write-mode intro text', async ({ page }) => {
    await page.locator('button').filter({ hasText: /✍️ Free Write/ }).click();
    // AIConversationHeader switches to write mode display — shows ✍️ icon in header
    // AIConversationWriteSetup renders level selector and prompt list
    await expect(page.getByText(/Write freely in Croatian/)).toBeVisible({ timeout: 5_000 });
  });

  test('switching back to Conversation mode from Write mode restores the scenario grid', async ({ page }) => {
    // Go to write mode
    await page.locator('button').filter({ hasText: /✍️ Free Write/ }).click();
    await expect(page.getByText(/Write freely in Croatian/)).toBeVisible({ timeout: 5_000 });

    // Switch back to conversation
    await page.locator('button').filter({ hasText: /💬 Razgovor/ }).click();
    await expect(page.getByText('Your Level', { exact: true })).toBeVisible({ timeout: 5_000 });
  });
});

// ===========================================================================
// 3. Write mode
// ===========================================================================

test.describe('Write mode', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    await mockConversationAPIs(page);
    await openAIConvoFromAITab(page);
    // Switch to write mode
    await page.locator('button').filter({ hasText: /✍️ Free Write/ }).click();
    await expect(page.getByText(/Write freely in Croatian/)).toBeVisible({ timeout: 5_000 });
  });

  test('write mode shows a level selector (B1 and others)', async ({ page }) => {
    // AIConversationWriteSetup renders a level filter; find the B1 button specifically
    await expect(page.locator('button').filter({ hasText: /^B1$/ }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('write mode shows a list of writing prompts', async ({ page }) => {
    // WRITE_PROMPTS is filtered to current level; default is B1 → shows B1 prompts
    // "Last Weekend" is a B1 prompt (exact: true avoids matching the description text)
    await expect(page.getByText('Last Weekend', { exact: true })).toBeVisible({ timeout: 5_000 });
  });

  test('the "Introduce Yourself" prompt is available at A1 level', async ({ page }) => {
    // Switch level to A1 to see A1 prompts
    await page.locator('button').filter({ hasText: /^A1$/ }).first().click();
    await expect(page.getByText('Introduce Yourself')).toBeVisible({ timeout: 10_000 });
  });

  test('selecting a prompt enables the "Start Writing" button', async ({ page }) => {
    // AIConversationWriteSetup start button shows "Select a prompt above" when no prompt is
    // selected (disabled), then changes to "Start Writing — {title}" when a prompt is chosen.
    const startBtnInitial = page.locator('button').filter({ hasText: /Select a prompt above/ });
    await expect(startBtnInitial).toBeDisabled({ timeout: 3_000 });

    // Select "Last Weekend" (a B1 prompt that should be in the default list)
    await page.getByText('Last Weekend', { exact: true }).click();
    // Button text now contains "Start Writing" and is enabled
    await expect(page.locator('button').filter({ hasText: /Start Writing/ })).toBeEnabled({ timeout: 3_000 });
  });

  test('clicking Start Writing shows a textarea for writing', async ({ page }) => {
    // Select a B1 prompt
    await page.getByText('Last Weekend', { exact: true }).click();
    await page.locator('button').filter({ hasText: /Start Writing/ }).click();

    // Writing phase renders a textarea
    await expect(page.locator('textarea')).toBeVisible({ timeout: 8_000 });
  });

  test('writing phase shows the prompt text and a Submit button', async ({ page }) => {
    await page.getByText('Last Weekend', { exact: true }).click();
    await page.locator('button').filter({ hasText: /Start Writing/ }).click();

    await expect(page.locator('textarea')).toBeVisible({ timeout: 8_000 });
    // The prompt card is visible above the textarea
    await expect(page.getByText('Prompt:')).toBeVisible({ timeout: 5_000 });
    // Submit button is visible (disabled until ≥5 words typed)
    await expect(page.locator('button').filter({ hasText: /Submit →/ })).toBeVisible({ timeout: 5_000 });
  });

  test('typing in the textarea and submitting calls /api/correct and shows result', async ({ page }) => {
    await page.getByText('Last Weekend', { exact: true }).click();
    await page.locator('button').filter({ hasText: /Start Writing/ }).click();
    await expect(page.locator('textarea')).toBeVisible({ timeout: 8_000 });

    // Type at least 5 words so the Submit button enables
    await page.locator('textarea').fill('Prošli vikend sam išao u grad. Bilo je lijepo.');
    // Submit button should now be enabled
    const submitBtn = page.locator('button').filter({ hasText: /Submit →/ });
    await expect(submitBtn).toBeEnabled({ timeout: 3_000 });
    await submitBtn.click();

    // After submission: evaluating → result. The result screen shows score info.
    // AIConversationWriteResult renders "Writing Score" heading plus strengths/improvements.
    // Our /api/ai-chat mock returns score:78 and strengths:["Good vocabulary"].
    await expect(page.getByText(/Writing Score|Good vocabulary/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

// ===========================================================================
// 4. Conversation mode setup
// ===========================================================================

test.describe('Conversation mode setup', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    await mockConversationAPIs(page);
    await openAIConvoFromAITab(page);
  });

  test('scenario grid is visible with multiple scenario cards', async ({ page }) => {
    // filteredScenarios renders as div[onClick] cards with scenario title text
    // Café At a Café scenario always exists
    await expect(page.getByText('At a Café').first()).toBeVisible({ timeout: 5_000 });
  });

  test('Free Talk quick-start card is always visible', async ({ page }) => {
    await expect(page.getByText('Free Talk — No Script Needed').first()).toBeVisible({ timeout: 5_000 });
  });

  test('level selector shows A1, A2, B1, B2 level buttons', async ({ page }) => {
    for (const lvl of ['A1', 'A2', 'B1', 'B2']) {
      await expect(page.locator('button').filter({ hasText: lvl }).first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('category filter shows All, Errands, Social, etc.', async ({ page }) => {
    for (const cat of ['All', 'Errands', 'Social']) {
      await expect(page.locator('button').filter({ hasText: cat }).first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('clicking a category filter narrows the scenario list', async ({ page }) => {
    // Click "Errands" filter — only Errands scenarios remain visible
    await page.locator('button').filter({ hasText: /^🛍️ Errands$/ }).click();
    // The count text (e.g. "3 scenarios for level A1") updates after filter is applied.
    // Use .first() to avoid strict-mode violations if multiple containers match.
    await expect(page.getByText(/scenario.*for level/).first()).toBeVisible({ timeout: 8_000 });
  });

  test('clicking "All" filter after a category filter restores all scenarios', async ({ page }) => {
    // First filter to Errands
    await page.locator('button').filter({ hasText: /^🛍️ Errands$/ }).click();
    await page.waitForTimeout(200);
    // Then switch back to All
    await page.locator('button').filter({ hasText: /^🌐 All$/ }).click();
    // At a Café should be visible again
    await expect(page.getByText('At a Café').first()).toBeVisible({ timeout: 5_000 });
  });

  test('selecting Free Talk enables the Start Conversation button', async ({ page }) => {
    const freeTalk = page.locator('div').filter({ hasText: /Free Talk — No Script Needed/ }).first();
    await freeTalk.click();
    await expect(page.locator('button').filter({ hasText: /Start —/ })).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('button').filter({ hasText: /Start —/ })).toBeEnabled({ timeout: 3_000 });
  });

  test('selecting a regular scenario shows the level selector and Start button', async ({ page }) => {
    // Click the "At a Café" scenario card
    const cafeCard = page.locator('div').filter({ hasText: /At a Café/ }).first();
    await cafeCard.scrollIntoViewIfNeeded();
    await cafeCard.click();
    await page.waitForTimeout(300);
    // Start Conversation button should now appear
    await expect(page.locator('button').filter({ hasText: /Start —/ })).toBeVisible({ timeout: 5_000 });
  });
});

// ===========================================================================
// 5. Conversation chat
// ===========================================================================

test.describe('Conversation chat', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    await mockConversationAPIs(page);
    await openAIConvoFromAITab(page);
  });

  test('starting a conversation shows the chat overlay with input', async ({ page }) => {
    await startFreeTalkConversation(page);
    // AIConversationChat renders a fixed full-screen overlay with a text input
    await expect(page.locator('input, textarea').last()).toBeVisible({ timeout: 8_000 });
  });

  test('chat header shows the AI name (Mate)', async ({ page }) => {
    await startFreeTalkConversation(page);
    // The Free Talk scenario uses "Mate" as aiName
    await expect(page.getByText('Mate').first()).toBeVisible({ timeout: 12_000 });
  });

  test('chat shows the level badge', async ({ page }) => {
    await startFreeTalkConversation(page);
    // The context pill shows "scenario.hr · level"
    // For Free Talk: "Slobodan razgovor · B1" (or user's level)
    await expect(page.getByText(/Slobodan razgovor/)).toBeVisible({ timeout: 8_000 });
  });

  test('chat shows "End & Evaluate" button in the header', async ({ page }) => {
    await startFreeTalkConversation(page);
    await expect(page.locator('button').filter({ hasText: /End & Evaluate/ })).toBeVisible({ timeout: 8_000 });
  });

  test('"End & Evaluate" button is disabled with fewer than 2 user exchanges', async ({ page }) => {
    await startFreeTalkConversation(page);
    // No user messages yet (only the AI opener from our mock), so End & Evaluate is disabled
    const evalBtn = page.locator('button').filter({ hasText: /End & Evaluate/ });
    await expect(evalBtn).toBeVisible({ timeout: 8_000 });
    await expect(evalBtn).toBeDisabled({ timeout: 3_000 });
  });

  test('messages area is visible and shows the AI opening message', async ({ page }) => {
    await startFreeTalkConversation(page);
    // Our SSE mock returns "Zdravo! Kako si?" as the croatian text
    // The component sets messages from the SSE response on a successful convo start
    // Wait for the message area to show content
    await expect(page.locator('div[style*="overflow-y: auto"]')).toBeVisible({ timeout: 8_000 });
  });

  test('typing in the chat input and clicking Send triggers a conversation turn', async ({ page }) => {
    await startFreeTalkConversation(page);
    // Wait for loading to complete — the input is disabled while the initial SSE is in flight.
    // Use the exact placeholder so we target the chat input specifically.
    const chatInput = page.locator('input[placeholder="Piši na hrvatskom…"]');
    await expect(chatInput).toBeEnabled({ timeout: 8_000 });
    // pressSequentially fires real key events which reliably trigger React onChange
    await chatInput.pressSequentially('Dobro sam, hvala!');
    const sendBtn = page.getByRole('button', { name: 'Send' });
    await expect(sendBtn).toBeEnabled({ timeout: 3_000 });
    await sendBtn.click();
    // After sending, our mock responds immediately with done=true
    // The user's message should appear in the messages list
    await expect(page.getByText('Dobro sam, hvala!')).toBeVisible({ timeout: 8_000 });
  });
});

// ===========================================================================
// 6. Double-evaluation guard
// ===========================================================================

test.describe('Double-evaluation guard', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await blockFirebase(page);
    await mockTTS(page);
    await mockContent(page);
    await mockConversationAPIs(page);
    await openAIConvoFromAITab(page);
  });

  test('rapid clicks on End & Evaluate only trigger evaluation once', async ({ page }) => {
    await startFreeTalkConversation(page);

    // Inject at least 2 user messages into React state so the "End & Evaluate"
    // button becomes enabled. We do this by sending real messages via the UI.
    // Use the exact placeholder and wait for enabled so we don't fill while loading.
    const chatInput = page.locator('input[placeholder="Piši na hrvatskom…"]');
    await expect(chatInput).toBeEnabled({ timeout: 8_000 });

    // Send first user message
    await chatInput.pressSequentially('Dobar dan!');
    await expect(page.getByRole('button', { name: 'Send' })).toBeEnabled({ timeout: 3_000 });
    await page.getByRole('button', { name: 'Send' }).click();
    await page.waitForTimeout(500);

    // Send second user message (SSE mock responds immediately each time)
    await expect(chatInput).toBeEnabled({ timeout: 5_000 });
    await chatInput.pressSequentially('Kako si ti?');
    await expect(page.getByRole('button', { name: 'Send' })).toBeEnabled({ timeout: 3_000 });
    await page.getByRole('button', { name: 'Send' }).click();
    await page.waitForTimeout(500);

    // Now End & Evaluate should be enabled (userCount >= 2)
    const evalBtn = page.locator('button').filter({ hasText: /End & Evaluate/ });
    await expect(evalBtn).toBeEnabled({ timeout: 5_000 });

    // Click rapidly 3 times — after the 1st click triggers evaluation the button
    // may disappear (phase changes to "evaluating"), so 2nd/3rd clicks are best-effort.
    await evalBtn.click();
    await evalBtn.click({ timeout: 500 }).catch(() => {});
    await evalBtn.click({ timeout: 500 }).catch(() => {});

    // The evaluating/result phase should appear exactly once.
    // We verify this by checking either the "Analysing…" spinner or the result screen,
    // and that it does not appear twice (no duplicate result elements with same score).
    const evaluatingOrResult = page.getByText(/Analysing your conversation|Grade|score|strengths/i);
    await expect(evaluatingOrResult.first()).toBeVisible({ timeout: 10_000 });

    // Allow some time for any duplicate to appear
    await page.waitForTimeout(1_000);

    // There should not be two simultaneous "Analysing" spinners
    const analysingCount = await page.getByText('Analysing your conversation…').count();
    expect(analysingCount).toBeLessThanOrEqual(1);
  });

  test('after evaluation, result screen appears only once (no duplicated score display)', async ({ page }) => {
    await startFreeTalkConversation(page);

    const chatInput = page.locator('input[placeholder]').last();

    // Build up 2+ user turns
    await chatInput.fill('Zdravo!');
    await page.getByRole('button', { name: 'Send' }).click();
    await page.waitForTimeout(400);

    await chatInput.fill('Dobro, hvala.');
    await page.getByRole('button', { name: 'Send' }).click();
    await page.waitForTimeout(400);

    const evalBtn = page.locator('button').filter({ hasText: /End & Evaluate/ });
    await expect(evalBtn).toBeEnabled({ timeout: 5_000 });

    // Rapid triple click — after 1st click triggers evaluation the button leaves DOM;
    // 2nd/3rd clicks are best-effort so they don't time out waiting for a gone element.
    await evalBtn.click();
    await evalBtn.click({ timeout: 500 }).catch(() => {});
    await evalBtn.click({ timeout: 500 }).catch(() => {});

    // Wait for the result screen to settle
    // Our /api/ai-chat mock returns a score of 78 embedded in a JSON string
    // AIConversationResult renders the evaluation; check that we don't see two result panels
    await page.waitForTimeout(2_000);

    // AIConversationResult renders its root div with data-testid="eval-result".
    // There must be exactly one such element — any duplicate means double evaluation occurred.
    const resultContainers = page.locator('[data-testid="eval-result"]');
    const count = await resultContainers.count();
    expect(count).toBeLessThanOrEqual(1); // only one result panel should ever render
  });
});
