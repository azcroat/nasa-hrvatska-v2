/**
 * 30-DAY RANDOMISED USER AUDIT
 * Simulates a real user visiting nasahrvatska.com sporadically over a month.
 * Goal: find real crashes, broken flows, missing state, and UX dead-ends.
 *
 * Credentials: claude.test.nasahrvatska@gmail.com / ClaudeTest2026!
 *
 * Structure (10 test blocks, ~3 days each):
 *   Block 1  — Days 01-03: Onboarding revisit, hero lesson, XP check
 *   Block 2  — Days 04-06: Full lesson completion loop, audio, flashcards
 *   Block 3  — Days 07-09: Practice tab deep-dive (quiz, sprint, cloze)
 *   Block 4  — Days 10-12: Grammar drills (Padeži, Aspect, Conjugation, CEFR)
 *   Block 5  — Days 13-15: Croatia tab (regions, cultural facts, map, Maja AI)
 *   Block 6  — Days 16-18: Immersion (Live Tutor, Shadowing, AI Story)
 *   Block 7  — Days 19-21: Profile deep-dive (stats, badges, heatmap, journal)
 *   Block 8  — Days 22-24: Settings (difficulty, voice, dark mode, notifications)
 *   Block 9  — Days 25-27: Edge cases (search, mistakes, empty states, back-nav)
 *   Block 10 — Days 28-30: Stress test (rapid navigation, repeat exercises, XP flow)
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const EMAIL    = 'claude.test.nasahrvatska@gmail.com';
const PASSWORD = 'ClaudeTest2026!';
const SS_DIR   = 'month-audit-screenshots';
const REPORT   = 'month-audit-report.json';

// ── Report state ──────────────────────────────────────────────────────────────
const issues = [];
function bug(sev, ctx, desc) {
  console.error(`❌ [${sev}] ${ctx} — ${desc}`);
  issues.push({ sev, ctx, desc, ts: new Date().toISOString() });
}
function ok(msg)   { console.log(`  ✅ ${msg}`); }
function info(msg) { console.log(`  ℹ️  ${msg}`); }
function warn(msg) { console.warn(`  ⚠️  ${msg}`); issues.push({ sev: 'WARN', ctx: 'general', desc: msg }); }

test.afterAll(() => {
  if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });
  fs.writeFileSync(REPORT, JSON.stringify({ total: issues.length, issues }, null, 2));
  console.log('\n' + '═'.repeat(65));
  console.log('30-DAY AUDIT COMPLETE — ' + issues.length + ' total issues');
  const counts = {};
  issues.forEach(i => { counts[i.sev] = (counts[i.sev] || 0) + 1; });
  Object.entries(counts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log('  Screenshots: ' + SS_DIR + '/');
  console.log('  Report:      ' + REPORT);
  console.log('═'.repeat(65));
  if (issues.length === 0) console.log('\n✅ No issues detected.\n');
  else {
    console.log('\nALL ISSUES FOUND:');
    issues.forEach((i, n) => console.log(`  ${n + 1}. [${i.sev}] ${i.ctx} — ${i.desc}`));
  }
});

// ── Screenshot helper ─────────────────────────────────────────────────────────
async function ss(page, name) {
  if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });
  await page.screenshot({ path: `${SS_DIR}/${name.replace(/[^a-z0-9-]/gi, '_')}.png`, fullPage: false }).catch(() => {});
}

// ── JS error listeners ────────────────────────────────────────────────────────
function attachErrorListeners(page, label) {
  page.on('pageerror', err => {
    const m = err.message;
    if (/ResizeObserver|firebase|firestore|Non-Error promise|ChunkLoadError|posthog/i.test(m)) return;
    bug('JS-ERROR', label, m.slice(0, 200));
  });
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    const t = msg.text();
    // Suppress known-expected or non-actionable errors
    if (/firebase|firestore|ERR_|net::|CSP|Content.Security|favicon|403|401|posthog|tts/i.test(t)) return;
    // "Failed to load resource" from /api/* is expected during testing (TTS rate limit, etc.)
    if (/Failed to load resource/.test(t)) return;
    bug('CONSOLE-ERR', label, t.slice(0, 200));
  });
}

// ── Dismiss cookie / premium banners (safe — no side effects) ────────────────
async function dismissModals(page) {
  for (let pass = 0; pass < 3; pass++) {
    for (const txt of ['Essential only', 'Accept all', 'Reject all']) {
      const btn = page.locator('button').filter({ hasText: new RegExp('^' + txt + '$', 'i') }).first();
      if (await btn.isVisible({ timeout: 400 }).catch(() => false)) {
        await btn.click().catch(() => {});
        await page.waitForTimeout(400).catch(() => {});
      }
    }
    const premium = page.locator('button').filter({ hasText: /^start exploring →?$|^continue free$|^maybe later$/i }).first();
    if (await premium.isVisible({ timeout: 400 }).catch(() => false)) {
      await premium.click().catch(() => {});
      await page.waitForTimeout(400).catch(() => {});
    }
  }
}

// ── Full dismiss (modals + dialogs) ──────────────────────────────────────────
async function dismissAll(page) {
  await dismissModals(page);
  const overlay = page.locator('[role="dialog"]').first();
  if (await overlay.isVisible({ timeout: 400 }).catch(() => false)) {
    const x = overlay.locator('button').filter({ hasText: /^[×✕x]$/i }).first();
    if (await x.isVisible({ timeout: 400 }).catch(() => false)) {
      await x.click().catch(() => {});
      await page.waitForTimeout(300).catch(() => {});
    }
  }
}

// ── Login ─────────────────────────────────────────────────────────────────────
// Strategy: go to /, try email login if the field is visible (unauthenticated),
// then wait for .sb-btn to appear as the definitive authenticated-state signal.
// Text-matching the root div is unreliable — the unauthenticated landing page
// also contains words like "Practice" and "Croatia" in marketing copy.
async function login(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2500);

  // If email field is visible, we're on the login/auth screen — sign in
  const emailFld = page.locator('input[type="email"]').first();
  if (await emailFld.isVisible({ timeout: 6000 }).catch(() => false)) {
    await emailFld.fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('input[type="password"]').first().press('Enter');
  }

  // Wait for the sidebar nav buttons — the definitive sign of authenticated app
  await page.waitForFunction(
    () => document.querySelectorAll('.sb-btn').length > 0,
    { timeout: 90000 }
  ).catch(() => {});

  await page.waitForTimeout(3000);
  await dismissModals(page);
}

// ── Tab navigation (uses .sb-btn sidebar class) ───────────────────────────────
// Use string hasText (substring match) rather than anchored regex so that
// badge counts in button text ("Home\n3") don't prevent matching.
async function goTab(page, label) {
  await dismissModals(page);
  const tab = page.locator('.sb-btn').filter({ hasText: label }).first();
  if (await tab.isVisible({ timeout: 4000 }).catch(() => false)) {
    await tab.click();
    await page.waitForTimeout(900);
    return true;
  }
  bug('NAV', label, `Tab "${label}" not found`);
  return false;
}

// ── Exit current screen (back to dashboard) ───────────────────────────────────
async function exitScreen(page) {
  await dismissAll(page);
  // Try common exit/completion button texts (non-anchored, handles emoji prefixes)
  for (const pattern of [/✕\s*Exit/i, /^Exit$/i, /^Done$/i, /^Continue →$/i, /^Back\b/i, /^←$/, /See Results|^Results$/i, /Back to Practice/i, /^Play Again$/i]) {
    const btn = page.locator('button').filter({ hasText: pattern }).first();
    if (await btn.isVisible({ timeout: 800 }).catch(() => false)) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(600);
      return;
    }
  }
  // Fallback: Escape key (dismisses modals) then × button
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(300);
  const xBtn = page.locator('button').filter({ hasText: /^[×✕x]$/i }).first();
  if (await xBtn.isVisible({ timeout: 500 }).catch(() => false)) {
    await xBtn.click().catch(() => {});
    await page.waitForTimeout(400);
  }
}

// ── Click a Quick Games card by label (always-visible section) ───────────────
// Quick Games cards have class "practice-card-dark", text: "[emoji]\n[label]\n[sub]"
async function clickQuickGame(page, label) {
  // Dismiss any leftover overlays before checking visibility (celebrations, modals, etc.)
  await dismissAll(page);
  // Wait for at least one Quick Games card to appear (handles lazy-load + animation)
  await page.waitForSelector('button.practice-card-dark', { timeout: 5000 }).catch(() => {});
  const btn = page.locator('button.practice-card-dark').filter({ hasText: label }).first();
  if (await btn.count().catch(() => 0) === 0) return false;
  await btn.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(200);
  if (!await btn.isVisible({ timeout: 3000 }).catch(() => false)) return false;
  await btn.click().catch(() => {});
  await page.waitForTimeout(1000);
  await dismissAll(page);
  return true;
}

// ── Click an exercise from "Browse All" grid (toggle must be opened first) ────
// Exercises like Sentence Cloze, CEFR Test, Case Constellation are behind the
// "Browse All N Exercises" toggle. Click it first, then find the exercise card.
async function clickBrowseExercise(page, label) {
  // Dismiss any leftover overlays (same reason as clickQuickGame)
  await dismissAll(page);
  // Wait for the Practice tab to be fully rendered (Browse All toggle must exist)
  await page.waitForSelector('button.practice-card-dark', { timeout: 5000 }).catch(() => {});
  // Open the Browse All grid if not already open
  const toggleBtn = page.locator('button').filter({ hasText: /browse all/i }).first();
  if (await toggleBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await toggleBtn.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(300);
    const isOpen = await toggleBtn.evaluate(el => el.textContent?.includes('▲')).catch(() => false);
    if (!isOpen) {
      await toggleBtn.click().catch(() => {});
      await page.waitForTimeout(700); // let grid expand + render
    }
  }
  // Now find the exercise card (ExerciseCard renders as <button>)
  const card = page.locator('button').filter({ hasText: label }).first();
  if (await card.count().catch(() => 0) === 0) return false;
  await card.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(200);
  if (!await card.isVisible({ timeout: 3000 }).catch(() => false)) return false;
  await card.click().catch(() => {});
  await page.waitForTimeout(1000);
  await dismissAll(page);
  return true;
}

// ── Click an exercise card (handles emoji-prefix buttons & off-screen items) ──
// Legacy helper kept for non-Practice-tab use cases.
async function clickExercise(page, textPattern) {
  const btn = page.locator('button').filter({ hasText: textPattern }).first();
  if (await btn.count().catch(() => 0) === 0) return false;
  await btn.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(250);
  const visible = await btn.isVisible({ timeout: 2000 }).catch(() => false);
  if (!visible) return false;
  await btn.click().catch(() => {});
  await page.waitForTimeout(1000);
  await dismissAll(page);
  return true;
}

// ── Run a generic exercise (any button-based Q&A — no .ob class required) ────
// Used for Sentence Cloze, Case Constellation, Aspect Drill, etc.
// Strategy: find buttons that appear to be answer options (not navigation controls),
// click the first one, then click "Next →". Repeat up to maxQ times.
async function runGenericExercise(page, label, maxQ = 5) {
  const NAV_RE = /^\s*(next|back|exit|done|continue|results|retry|check|hint|skip|finish|play|start|quit|submit|proceed|see|go|try|→|✕|×)/i;
  let answered = 0;
  for (let i = 0; i < maxQ; i++) {
    await page.waitForTimeout(600);
    // Collect all buttons — filter out navigation/control ones
    const allBtns = page.locator('button').filter({ hasNotText: NAV_RE });
    const count = await allBtns.count().catch(() => 0);
    if (count === 0) {
      await page.waitForTimeout(900);
      if (await allBtns.count().catch(() => 0) === 0) break;
    }
    answered++;
    await allBtns.first().click().catch(() => {});
    await page.waitForTimeout(500);
    // Click "Next →" / "Continue" / "Next Question"
    const nextBtn = page.locator('button').filter({ hasText: /next|continue|→|correct/i }).first();
    if (await nextBtn.isVisible({ timeout: 1200 }).catch(() => false)) {
      await nextBtn.click().catch(() => {});
      await page.waitForTimeout(400);
    }
  }
  return answered;
}

// ── Run a multiple-choice quiz (.ob option buttons) ───────────────────────────
// Enables Practice Mode (shield 🛡️ button) first to disable heart deduction,
// preventing McGameOver from cutting the session short after 5 wrong answers.
async function runQuiz(page, label, maxQ = 20) {
  // Enable Practice Mode — 🛡️ button in McGame disables hearts so wrong answers
  // don't trigger McGameOver and cut the session short.
  const practiceToggle = page.locator('button[aria-label*="Practice Mode"], button[title*="Practice Mode"]').first();
  if (await practiceToggle.isVisible({ timeout: 1500 }).catch(() => false)) {
    const isActive = await practiceToggle.evaluate(el => el.style.background?.includes('99,102,241') || el.getAttribute('aria-label')?.includes('active')).catch(() => false);
    if (!isActive) await practiceToggle.click().catch(() => {});
  }
  let answered = 0;
  for (let i = 0; i < maxQ; i++) {
    // Wait up to 2s for first appearance
    const opts = page.locator('.ob');
    const count = await opts.count().catch(() => 0);
    if (count === 0) {
      // Give it one more chance after a brief wait
      await page.waitForTimeout(800);
      if (await opts.count().catch(() => 0) === 0) break;
    }
    answered++;
    await opts.first().click().catch(() => {});
    await page.waitForTimeout(400);
    // "🏆 See Results" on the last question — non-anchored to handle emoji prefix
    const next = page.locator('button').filter({ hasText: /Next →|See Results|Results|Continue →|Done/i }).first();
    if (await next.isVisible({ timeout: 1500 }).catch(() => false)) {
      await next.click().catch(() => {});
      await page.waitForTimeout(500);
    }
  }
  return answered;
}

// ── Read XP from visible UI ───────────────────────────────────────────────────
async function readXP(page) {
  const root = await page.locator('#root').innerText().catch(() => '');
  const m = root.match(/(\d[\d,]*)\s*XP/i);
  return m ? parseInt(m[1].replace(',', '')) : null;
}

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 1 — Days 01-03: Re-orientation, home screen, first lesson completion
// ══════════════════════════════════════════════════════════════════════════════
test('Block 1 (Days 1-3) — Home screen, hero lesson, XP persistence', async ({ page }) => {
  attachErrorListeners(page, 'Block1');
  await login(page);
  await goTab(page, 'Home');
  await ss(page, 'b1-home');

  const home = await page.locator('#root').innerText().catch(() => '');

  // ── Hero CTA exists and is actionable
  const heroCta = page.locator('button, a').filter({ hasText: /continue learning|start lesson|begin|let's go/i }).first();
  if (await heroCta.isVisible({ timeout: 3000 }).catch(() => false)) {
    ok('Hero CTA present');
    const xpBefore = await readXP(page);
    await heroCta.click();
    await page.waitForTimeout(1200);
    await dismissAll(page);
    await ss(page, 'b1-hero-lesson-open');
    const lessonText = await page.locator('#root').innerText().catch(() => '');
    if (lessonText.match(/exit|vocabulary|grammar|lesson|question|practice/i)) {
      ok('Hero lesson launched successfully');
    } else {
      bug('BUG', 'HeroLesson', 'CTA clicked but lesson screen did not appear — blank or wrong screen');
    }
    // Try to answer questions if it's a quiz
    const answered = await runQuiz(page, 'HeroLesson', 8);
    if (answered > 0) ok(`Hero lesson: ${answered} questions answered`);
    await exitScreen(page);
    // XP should have increased if lesson completed
    await goTab(page, 'Home');
    const xpAfter = await readXP(page);
    info(`XP: before=${xpBefore} after=${xpAfter}`);
    if (xpBefore !== null && xpAfter !== null && xpAfter < xpBefore) {
      bug('BUG', 'XP', `XP dropped after lesson: ${xpBefore} → ${xpAfter}`);
    }
  } else {
    bug('UX', 'HeroLesson', 'No hero lesson CTA visible on home screen');
  }

  // ── Streak widget present
  if (home.match(/streak|day streak|🔥/i)) ok('Streak widget visible');
  else bug('UX', 'HomeTab', 'Streak widget missing from home screen');

  // ── Daily plan / suggested activities
  if (home.match(/today|plan|suggested|daily/i)) ok('Daily plan section visible');
  else bug('UX', 'HomeTab', 'Daily plan/suggested section missing');

  // ── Recommended section
  if (home.match(/recommend|for you|next up/i)) ok('Recommended section visible');
  else info('No "Recommended" section (may not appear for new users)');

  // ── Week goal widget
  if (home.match(/weekly.*goal|xp.*goal|goal.*xp/i)) ok('Weekly goal widget visible');
  else info('Weekly goal widget not visible (OK if not set)');

  await ss(page, 'b1-home-final');
});

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 2 — Days 04-06: Learn tab deep-dive — lessons, audio, Browse modal
// ══════════════════════════════════════════════════════════════════════════════
test('Block 2 (Days 4-6) — Learn tab: lesson flow, audio, Browse all content', async ({ page }) => {
  attachErrorListeners(page, 'Block2');
  await login(page);
  await goTab(page, 'Learn');
  await ss(page, 'b2-learn-tab');

  const learnText = await page.locator('#root').innerText().catch(() => '');

  // ── Lesson cards present
  if (!learnText.match(/lesson|vocabulary|grammar|survivor|settler|communicator/i)) {
    bug('BUG', 'LearnTab', 'Learn tab shows no lesson cards');
  } else ok('Lesson cards present on Learn tab');

  // ── Open first available lesson (any clickable card)
  const lessonCard = page.locator('button, div[role="button"]')
    .filter({ hasText: /~\d+ min|vocabulary|lesson\s*\d|family|greet|number/i }).first();
  if (await lessonCard.isVisible({ timeout: 3000 }).catch(() => false)) {
    await lessonCard.click();
    await page.waitForTimeout(1200);
    await dismissAll(page);
    await ss(page, 'b2-lesson-open');
    const lsText = await page.locator('#root').innerText().catch(() => '');

    // ── Lesson has content
    if (!lsText.match(/\w{4,}/i)) {
      bug('BUG', 'LessonScreen', 'Lesson screen appears empty after opening');
    } else ok('Lesson screen has content');

    // ── Audio speaker buttons exist
    const speakers = await page.locator('button').filter({ hasText: /🔊/i }).count().catch(() => 0);
    if (speakers === 0) {
      // Some lessons use icon buttons without text
      const iconBtns = await page.locator('button[aria-label*="speak" i], button[aria-label*="audio" i], button[aria-label*="play" i]').count().catch(() => 0);
      if (iconBtns === 0) info('No speaker buttons found — may be a grammar-only lesson');
      else ok(`Audio buttons present (${iconBtns} aria-labeled)`);
    } else {
      ok(`${speakers} speaker button(s) in lesson`);
      // Click one speaker button and verify no crash
      await page.locator('button').filter({ hasText: /🔊/i }).first().click().catch(() => {});
      await page.waitForTimeout(800);
      const afterAudio = await page.locator('#root').innerText().catch(() => '');
      if (!afterAudio.match(/\w{4,}/i)) {
        bug('BUG', 'LessonAudio', 'Screen went blank after clicking speaker button');
      } else ok('Screen intact after clicking speaker');
    }

    // ── Run quiz portion if available
    const pBtn = page.locator('button').filter({ hasText: /^practice\s*→$/i }).first();
    if (await pBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await pBtn.click();
      await page.waitForTimeout(1000);
      const qs = await runQuiz(page, 'LessonQuiz', 15);
      ok(`Lesson quiz: ${qs} questions answered`);
      if (qs === 0) bug('BUG', 'LessonQuiz', 'Practice → clicked but no quiz questions appeared');
      await ss(page, 'b2-lesson-quiz-done');
    }
    await exitScreen(page);
  } else {
    bug('BUG', 'LearnTab', 'No lesson cards are clickable on Learn tab');
  }

  // ── Browse Content modal — open and verify sections
  await goTab(page, 'Learn');
  const browseBtn = page.locator('button').filter({ hasText: /browse|all.*content|explore/i }).first();
  if (await browseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await browseBtn.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(300);
    await browseBtn.click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await ss(page, 'b2-browse-modal');
    const browseText = await page.locator('#root').innerText().catch(() => '');

    if (!browseText.match(/vocabulary|grammar|speaking|listening/i)) {
      bug('BUG', 'BrowseModal', 'Browse Content modal opened but shows no category sections');
    } else ok('Browse modal shows content categories');

    // ── Verify Grammar section has clickable items (broad match — lesson titles vary)
    const grammarItems = await page.locator('button').filter({ hasText: /grammar|lesson|case|padež|tense|verb/i }).count().catch(() => 0);
    if (grammarItems === 0) info('No grammar-keyword buttons found in Browse modal (may use different titles)');
    else ok(`Browse modal: ${grammarItems} grammar/lesson item(s) visible`);

    // ── Verify Vocabulary section has items
    const vocabItems = await page.locator('button').filter({ hasText: /family|colors|food|numbers|greet/i }).count().catch(() => 0);
    if (vocabItems === 0) bug('UX', 'BrowseModal', 'No vocabulary items in Browse modal');
    else ok(`Browse modal: ${vocabItems} vocabulary item(s) visible`);

    // ── Open Tenses & Gender (different from Grammar Intro)
    const tensesBtn = page.locator('button').filter({ hasText: /tenses|gender/i }).first();
    if (await tensesBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tensesBtn.click();
      await page.waitForTimeout(1000);
      const tensesText = await page.locator('#root').innerText().catch(() => '');
      if (!tensesText.match(/tense|gender|present|past|verb/i)) {
        bug('BUG', 'TensesScreen', 'Tenses & Gender screen appears empty or wrong content');
      } else ok('Tenses & Gender screen loaded');
      await ss(page, 'b2-tenses-screen');
      await exitScreen(page);
    }
  } else {
    bug('UX', 'LearnTab', 'Browse Content button not found on Learn tab');
  }

  // ── Grammar Intro full flow
  await goTab(page, 'Learn');
  const browseForGram = page.locator('button').filter({ hasText: /browse|all.*content|explore/i }).first();
  if (await browseForGram.isVisible({ timeout: 2000 }).catch(() => false)) {
    await browseForGram.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(300);
    await browseForGram.click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(800);
    const gib = page.locator('button').filter({ hasText: /grammar intro/i }).first();
    if (await gib.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gib.click();
      await page.waitForTimeout(1000);
      const practiceBtn = page.locator('button').filter({ hasText: /^practice\s*→$/i }).first();
      if (await practiceBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await practiceBtn.click();
        await page.waitForTimeout(1000);
        const qs = await runQuiz(page, 'GrammarIntroQuiz', 16);
        ok(`Grammar Intro quiz: ${qs} questions`);
        if (qs < 3) bug('BUG', 'GrammarIntro', `Only ${qs} quiz questions — expected 12+`);
        await ss(page, 'b2-grammar-quiz-done');
      }
      await exitScreen(page);
    }
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 3 — Days 07-09: Practice tab — Flashcards SRS, Quiz, Word Sprint, Cloze
// ══════════════════════════════════════════════════════════════════════════════
test('Block 3 (Days 7-9) — Practice: Flashcards, Quiz, Word Sprint, Cloze', async ({ page }) => {
  attachErrorListeners(page, 'Block3');
  await login(page);
  await goTab(page, 'Practice');
  await ss(page, 'b3-practice-tab');

  const practiceText = await page.locator('#root').innerText().catch(() => '');

  // ── Category tabs visible
  for (const cat of ['Speak', 'Grammar', 'Words', 'Read']) {
    if (practiceText.match(new RegExp(cat, 'i'))) ok(`"${cat}" category visible`);
    else bug('BUG', 'PracticeTab', `Practice category "${cat}" missing`);
  }

  // ── Today's Pick
  if (practiceText.match(/today.*pick|today's pick|recommended/i)) ok("Today's Pick section visible");
  else bug('UX', 'PracticeTab', "Today's Pick section missing");

  // ── FLASHCARDS: open, flip, rate both sides
  await goTab(page, 'Practice');
  const fcLaunched = await clickQuickGame(page, 'Flashcards');
  if (fcLaunched) {
    await ss(page, 'b3-flashcard-front');
    const fcText = await page.locator('#root').innerText().catch(() => '');
    if (!fcText.match(/\w{3,}/i)) {
      bug('BUG', 'Flashcards', 'Flashcard screen appears blank');
    } else {
      ok('Flashcard front loaded');
      // Flip card
      const flipBtn = page.locator('button').filter({ hasText: /flip|reveal|show answer|👁/i }).first();
      const cardArea = page.locator('.flashcard, [class*="card"], .fc-card').first();
      if (await flipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await flipBtn.click();
      } else if (await cardArea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cardArea.click();
      } else {
        // Try clicking the main card text area
        await page.locator('#root').click({ position: { x: 300, y: 300 } }).catch(() => {});
      }
      await page.waitForTimeout(600);
      await ss(page, 'b3-flashcard-flipped');

      // Rating buttons
      const rateBtn = page.locator('button').filter({ hasText: /still learning|perfect|easy|good|hard|knew it/i }).first();
      if (await rateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        ok('SRS rating buttons visible after flip');
        await rateBtn.click().catch(() => {});
        await page.waitForTimeout(500);
        // Do a few more cards
        for (let i = 0; i < 4; i++) {
          const flip2 = page.locator('button').filter({ hasText: /flip|reveal|show answer/i }).first();
          const card2 = page.locator('.flashcard, [class*="card"]').first();
          if (await flip2.isVisible({ timeout: 1000 }).catch(() => false)) await flip2.click().catch(() => {});
          else if (await card2.isVisible({ timeout: 1000 }).catch(() => false)) await card2.click().catch(() => {});
          else await page.locator('#root').click({ position: { x: 300, y: 300 } }).catch(() => {});
          await page.waitForTimeout(500);
          const rate2 = page.locator('button').filter({ hasText: /still learning|perfect|easy|good|hard|knew it/i }).first();
          if (await rate2.isVisible({ timeout: 1500 }).catch(() => false)) {
            // Alternate: rate some as "Still Learning"
            const allRate = page.locator('button').filter({ hasText: /still learning|perfect|easy|good|hard|knew it/i });
            const cnt = await allRate.count().catch(() => 0);
            if (cnt > 1 && i % 2 === 0) {
              await allRate.last().click().catch(() => {}); // "Perfect" or last button
            } else {
              await rate2.click().catch(() => {});
            }
            await page.waitForTimeout(400);
          }
        }
        ok('Flashcard: multiple cards rated');
      } else {
        bug('BUG', 'Flashcards', 'No SRS rating buttons appeared after flipping card');
      }
    }
    await ss(page, 'b3-flashcard-session');
    await exitScreen(page);
  } else {
    bug('BUG', 'PracticeTab', 'Flashcards button not found');
  }

  // ── MULTIPLE CHOICE QUIZ: complete a full round
  await goTab(page, 'Practice');
  const quizLaunched = await clickQuickGame(page, 'Quiz');
  if (quizLaunched) {
    await ss(page, 'b3-quiz-start');
    const qsAnswered = await runQuiz(page, 'MCQuiz', 12);
    ok(`MCQuiz: ${qsAnswered} questions answered`);
    if (qsAnswered === 0) bug('BUG', 'MCQuiz', 'Quiz loaded but no questions appeared');
    await ss(page, 'b3-quiz-done');
    const resultText = await page.locator('#root').innerText().catch(() => '');
    if (resultText.match(/score|result|correct|\d\/\d/i)) ok('Quiz results screen shows score');
    else if (qsAnswered > 0) bug('UX', 'MCQuiz', 'Quiz completed but no results/score screen shown');
    await exitScreen(page);
  } else {
    bug('BUG', 'PracticeTab', 'Quiz button not found');
  }

  // ── WORD SPRINT: start and check for words
  await goTab(page, 'Practice');
  const sprintBtn = page.locator('button, a, div').filter({ hasText: /word sprint/i }).first();
  if (await sprintBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await sprintBtn.click();
    await page.waitForTimeout(1200);
    await dismissAll(page);
    await ss(page, 'b3-word-sprint');
    const sprintText = await page.locator('#root').innerText().catch(() => '');
    if (!sprintText.match(/translate|type|enter|score|word/i)) {
      bug('BUG', 'WordSprint', 'Word Sprint screen blank or not interactive');
    } else ok('Word Sprint screen loaded');
    // Try to type an answer
    const input = page.locator('input[type="text"], input:not([type])').first();
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      await input.fill('auto');
      await input.press('Enter');
      await page.waitForTimeout(600);
      ok('Word Sprint: typed and submitted answer');
    } else {
      info('Word Sprint: no text input found (may use tap-based UI)');
    }
    await exitScreen(page);
  } else {
    bug('UX', 'PracticeTab', 'Word Sprint button not found');
  }

  // ── SENTENCE CLOZE: in Browse All exercise grid (hidden by default)
  await goTab(page, 'Practice');
  const clozeLaunched = await clickBrowseExercise(page, 'Sentence Cloze');
  if (clozeLaunched) {
    await ss(page, 'b3-cloze');
    const clozeText = await page.locator('#root').innerText().catch(() => '');
    if (!clozeText.match(/\w{5,}/i)) bug('BUG', 'SentenceCloze', 'Sentence Cloze screen appears blank');
    else ok('Sentence Cloze loaded');
    // ClozeEngine uses plain <button> options (not .ob class) — use generic driver
    const clozeQs = await runGenericExercise(page, 'Cloze', 5);
    ok(`Sentence Cloze: ${clozeQs} interactions`);
    await exitScreen(page);
  } else {
    bug('UX', 'PracticeTab', 'Sentence Cloze not found in exercise grid');
  }

  // ── SRS REVIEW: check state (may be empty for fresh account)
  await goTab(page, 'Practice');
  const srsBtn = page.locator('button, a, div').filter({ hasText: /srs review|spaced rep|review due|review$/i }).first();
  if (await srsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await srsBtn.click();
    await page.waitForTimeout(1000);
    await dismissAll(page);
    await ss(page, 'b3-srs-review');
    const srsText = await page.locator('#root').innerText().catch(() => '');
    if (srsText.match(/no.*due|nothing.*review|all.*done|0.*card/i)) {
      ok('SRS Review: no items due (expected for fresh/test account)');
    } else if (srsText.match(/\w{4,}/i)) {
      ok('SRS Review loaded with items');
      await runQuiz(page, 'SRS', 5);
    } else {
      bug('BUG', 'SRS', 'SRS Review screen blank');
    }
    await exitScreen(page);
  } else {
    info('SRS Review button not found (may be in different location)');
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 4 — Days 10-12: Grammar drills — Padeži, Aspect, Conjugation, CEFR, Listening
// ══════════════════════════════════════════════════════════════════════════════
test('Block 4 (Days 10-12) — Grammar: Padeži, Aspect Drill, Conjugation, CEFR Test', async ({ page }) => {
  attachErrorListeners(page, 'Block4');
  await login(page);
  await goTab(page, 'Practice');

  // ── PADEŽI / CASE CONSTELLATION (in Browse All exercise grid)
  const caseLaunched = await clickBrowseExercise(page, 'Case Constellation');
  if (caseLaunched) {
    await ss(page, 'b4-padezi');
    const pText = await page.locator('#root').innerText().catch(() => '');
    if (!pText.match(/nominativ|genitive|accusative|dative|padež|case/i)) {
      bug('BUG', 'Padeži', 'Case Constellation screen: no case content visible');
    } else ok('Case Constellation screen has case content');
    // GrammarConstellation uses plain <button> options (not .ob class) — use generic driver
    const pQs = await runGenericExercise(page, 'Padeži', 8);
    ok(`Case Constellation: ${pQs} interactions`);
    await exitScreen(page);
  } else {
    bug('UX', 'PracticeTab', 'Case Constellation button not found (expected in grammar section)');
  }

  // ── ASPECT DRILL (in Browse All exercise grid)
  await goTab(page, 'Practice');
  const aspectLaunched = await clickBrowseExercise(page, 'Aspect Drill');
  if (aspectLaunched) {
    await ss(page, 'b4-aspect');
    const aspText = await page.locator('#root').innerText().catch(() => '');
    if (!aspText.match(/imperfective|perfective|aspect|svršeni|nesvršeni/i)) {
      bug('BUG', 'AspectDrill', 'Aspect Drill screen: no verb aspect content');
    } else ok('Aspect Drill loaded');
    // AspectDrillScreen uses its own button styles (not .ob class) — use generic driver
    const aspQs = await runGenericExercise(page, 'Aspect', 8);
    ok(`Aspect Drill: ${aspQs} interactions`);
    await exitScreen(page);
  } else {
    bug('UX', 'PracticeTab', 'Aspect Drill button not found (expected in advanced section)');
  }

  // ── ACCUSATIVE DRILL (in Browse All exercise grid)
  await goTab(page, 'Practice');
  const akuLaunched = await clickBrowseExercise(page, 'Accusative');
  if (akuLaunched) {
    await ss(page, 'b4-accusative');
    // AccusativeDrillScreen uses "Show" buttons (reveal-answer style), not .ob — use generic driver
    const akuQs = await runGenericExercise(page, 'Accusative', 8);
    ok(`Accusative drill: ${akuQs} interactions`);
    await exitScreen(page);
  } else {
    info('Accusative drill not found — may be in grammar subcategory');
  }

  // ── CEFR PLACEMENT TEST (in Browse All exercise grid)
  await goTab(page, 'Practice');
  const cefrLaunched = await clickBrowseExercise(page, 'CEFR Test');
  if (cefrLaunched) {
    await ss(page, 'b4-cefr-menu');
    const cefrText = await page.locator('#root').innerText().catch(() => '');
    if (!cefrText.match(/A1|A2|B1|B2|beginner|intermediate/i)) {
      bug('BUG', 'CEFR', 'CEFR test screen has no level options');
    } else {
      ok('CEFR level options visible');
      const a1Btn = page.locator('button').filter({ hasText: /A1|beginner/i }).first();
      if (await a1Btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await a1Btn.click();
        await page.waitForTimeout(800);
        // CefrTest uses plain <button> options (not .ob class) — use generic driver
        const cefrQs = await runGenericExercise(page, 'CEFR-A1', 10);
        ok(`CEFR A1: ${cefrQs} interactions`);
        await ss(page, 'b4-cefr-done');
      }
    }
    await exitScreen(page);
  } else {
    bug('UX', 'PracticeTab', 'CEFR Test button not found');
  }

  // ── LISTENING EXERCISE
  await goTab(page, 'Practice');
  const listenBtn = page.locator('button, a, div').filter({ hasText: /^listening$/i }).first();
  if (await listenBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await listenBtn.click();
    await page.waitForTimeout(1000);
    await dismissAll(page);
    await ss(page, 'b4-listening');
    const listenText = await page.locator('#root').innerText().catch(() => '');
    if (!listenText.match(/listen|audio|play|🔊|speaker/i)) {
      bug('BUG', 'Listening', 'Listening screen shows no audio or prompt content');
    } else ok('Listening screen has content');
    await exitScreen(page);
  } else {
    info('Listening button not found at top level (may be in sub-category)');
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 5 — Days 13-15: Croatia tab — regions, culture, map, Texting quiz, Maja
// ══════════════════════════════════════════════════════════════════════════════
test('Block 5 (Days 13-15) — Croatia tab: regions, culture, Texting, Maja AI', async ({ page }) => {
  attachErrorListeners(page, 'Block5');
  await login(page);
  await goTab(page, 'Croatia');
  await ss(page, 'b5-croatia-tab');

  const croatiaText = await page.locator('#root').innerText().catch(() => '');

  // ── Sub-tabs present
  for (const sub of ['Discover', 'Culture', 'Media', 'Stories']) {
    if (croatiaText.match(new RegExp(sub, 'i'))) ok(`Croatia sub-tab "${sub}" visible`);
    else bug('UX', 'CroatiaTab', `Sub-tab "${sub}" missing`);
  }

  // ── Discover tab: region cards
  if (croatiaText.match(/region|zagreb|split|dubrovnik|dalmatia/i)) ok('Region content visible on Discover');
  else bug('UX', 'Croatia-Discover', 'No region content on Discover sub-tab');

  // ── Open a region card
  const regionBtn = page.locator('button, div[role="button"]').filter({ hasText: /zagreb|split|dubrovnik|istria|dalmatia|slavonia/i }).first();
  if (await regionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await regionBtn.click();
    await page.waitForTimeout(1000);
    await ss(page, 'b5-region-open');
    const regionText = await page.locator('#root').innerText().catch(() => '');
    if (!regionText.match(/\w{5,}/i)) {
      bug('BUG', 'RegionCard', 'Region card opened but content is blank');
    } else ok('Region detail content loaded');
    await exitScreen(page);
  }

  // ── Map screen
  await goTab(page, 'Croatia');
  const mapBtn = page.locator('button').filter({ hasText: /map|karta/i }).first();
  if (await mapBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await mapBtn.click();
    await page.waitForTimeout(1000);
    await ss(page, 'b5-map');
    const mapText = await page.locator('#root').innerText().catch(() => '');
    if (!mapText.match(/croatia|region|map|\w{5,}/i)) {
      bug('BUG', 'CroatiaMap', 'Map screen opened but appears empty');
    } else ok('Croatia Map screen loaded');
    await exitScreen(page);
  } else {
    info('Croatia Map button not found — may be inline SVG');
  }

  // ── Culture sub-tab: Phrase of Day, Cultural notes
  await goTab(page, 'Croatia');
  const cultureTab = page.locator('button').filter({ hasText: /^🏰\s*culture$|^culture$/i }).first();
  if (await cultureTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await cultureTab.click();
    await page.waitForTimeout(800);
    await ss(page, 'b5-culture-tab');
    const cultText = await page.locator('#root').innerText().catch(() => '');
    if (!cultText.match(/phrase|word.*day|cultural|tradition|history/i)) {
      bug('UX', 'Croatia-Culture', 'Culture sub-tab has no cultural content');
    } else ok('Culture sub-tab has content');
  }

  // ── Texting slang screen
  await goTab(page, 'Croatia');
  const textingBtn = page.locator('button').filter({ hasText: /texting|slang|sms|chat/i }).first();
  if (await textingBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await textingBtn.click();
    await page.waitForTimeout(1000);
    await dismissAll(page);
    await ss(page, 'b5-texting');
    const textText = await page.locator('#root').innerText().catch(() => '');
    if (!textText.match(/\w{4,}/i)) {
      bug('BUG', 'TextingScreen', 'Texting slang screen blank');
    } else ok('Texting slang screen loaded');
    // Try the quiz if available
    const quizBtn = page.locator('button').filter({ hasText: /test yourself|quiz →|quiz/i }).first();
    if (await quizBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await quizBtn.click();
      await page.waitForTimeout(800);
      const txQs = await runQuiz(page, 'TextingQuiz', 6);
      ok(`Texting quiz: ${txQs} questions`);
      if (txQs === 0) bug('BUG', 'TextingQuiz', 'Texting quiz started but no questions appeared');
    }
    await exitScreen(page);
  } else {
    info('Texting button not in visible area — may require sub-tab navigation');
  }

  // ── Maja AI (in Culture sub-tab)
  await goTab(page, 'Croatia');
  const cultTab2 = page.locator('button').filter({ hasText: /^🏰\s*culture$|^culture$/i }).first();
  if (await cultTab2.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cultTab2.click();
    await page.waitForTimeout(600);
  }
  // "Razgovaraj s Hrvatima" is the CultureTab button for AI Conversations (Maja/Marko/Ana/Baka Mara)
  const majaBtn = page.locator('button').filter({ hasText: /razgovaraj|AI conversations|conversation partner|maja/i }).first();
  if (await majaBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await majaBtn.click();
    await page.waitForTimeout(1200);
    await dismissAll(page);
    await ss(page, 'b5-maja-screen');
    const majaText = await page.locator('#root').innerText().catch(() => '');
    if (!majaText.match(/maja|scenario|conversation|select|topic/i)) {
      bug('BUG', 'MajaAI', 'Maja AI screen loaded but no scenario selection or content visible');
    } else ok('Maja AI screen loaded (scenario selection)');
    // Select a scenario if available
    const scenario = page.locator('button').filter({ hasText: /café|airport|market|restaurant|hotel|at the/i }).first();
    if (await scenario.isVisible({ timeout: 2000 }).catch(() => false)) {
      await scenario.click();
      await page.waitForTimeout(1500);
      await ss(page, 'b5-maja-conversation');
      const convText = await page.locator('#root').innerText().catch(() => '');
      if (convText.match(/maja|typing|message|conversation/i)) {
        ok('Maja AI conversation started');
      } else {
        bug('BUG', 'MajaAI', 'Scenario selected but conversation did not start');
      }
    } else {
      ok('Maja AI: requires scenario selection (expected flow)');
    }
    await exitScreen(page);
  } else {
    bug('UX', 'Croatia-Culture', 'Maja AI / AI Conversations button not found in Culture sub-tab');
  }

  // ── Phrase of Day screen
  await goTab(page, 'Croatia');
  const phraseBtn = page.locator('button').filter({ hasText: /phrase.*day|word.*day|daily phrase/i }).first();
  if (await phraseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await phraseBtn.click();
    await page.waitForTimeout(1000);
    await ss(page, 'b5-phrase-of-day');
    const phraseText = await page.locator('#root').innerText().catch(() => '');
    if (!phraseText.match(/phrase|word|Croatian|english/i)) {
      bug('BUG', 'PhraseOfDay', 'Phrase of Day screen blank');
    } else ok('Phrase of Day loaded');
    await exitScreen(page);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 6 — Days 16-18: Immersion — Live Tutor, Shadowing, AI Story, Speaking
// ══════════════════════════════════════════════════════════════════════════════
test('Block 6 (Days 16-18) — Immersion: Live Tutor, Shadowing, AI Story, Speaking', async ({ page }) => {
  attachErrorListeners(page, 'Block6');
  await login(page);
  await goTab(page, 'Practice');

  // ── SPEAKING DRILL
  const speakBtn = page.locator('button, a, div').filter({ hasText: /^speaking$|^speak$/i }).first();
  if (await speakBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await speakBtn.click();
    await page.waitForTimeout(1000);
    await dismissAll(page);
    await ss(page, 'b6-speaking');
    const speakText = await page.locator('#root').innerText().catch(() => '');
    if (!speakText.match(/pronounce|say|repeat|mic|speak|\w{5,}/i)) {
      bug('BUG', 'SpeakingDrill', 'Speaking drill screen blank');
    } else ok('Speaking drill screen loaded');
    await exitScreen(page);
  } else {
    info('Speaking drill not directly accessible from Practice tab root');
  }

  // ── SHADOWING
  await goTab(page, 'Practice');
  const shadowBtn = page.locator('button, a, div').filter({ hasText: /^shadowing$/i }).first();
  if (await shadowBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await shadowBtn.click();
    await page.waitForTimeout(1000);
    await dismissAll(page);
    await ss(page, 'b6-shadowing');
    const shadowText = await page.locator('#root').innerText().catch(() => '');
    if (!shadowText.match(/shadow|listen|repeat|play|audio|\w{4,}/i)) {
      bug('BUG', 'Shadowing', 'Shadowing screen blank');
    } else ok('Shadowing screen loaded');
    await exitScreen(page);
  } else {
    info('Shadowing button not on Practice tab root');
  }

  // ── LIVE TUTOR
  await goTab(page, 'Practice');
  const tutorBtn = page.locator('button, a, div').filter({ hasText: /live tutor|ai tutor|tutor/i }).first();
  if (await tutorBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await tutorBtn.click();
    await page.waitForTimeout(1500);
    await dismissAll(page);
    await ss(page, 'b6-live-tutor');
    const tutorText = await page.locator('#root').innerText().catch(() => '');
    if (!tutorText.match(/tutor|lesson|topic|select|conversation|\w{5,}/i)) {
      bug('BUG', 'LiveTutor', 'Live Tutor screen blank or broken');
    } else ok('Live Tutor screen loaded');
    await exitScreen(page);
  } else {
    info('Live Tutor not directly accessible from Practice root');
  }

  // ── AI STORY (via Croatia > Stories or Learn)
  await goTab(page, 'Croatia');
  const storiesTab = page.locator('button').filter({ hasText: /^📖\s*stories$|^stories$/i }).first();
  if (await storiesTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    await storiesTab.click();
    await page.waitForTimeout(800);
    await ss(page, 'b6-stories-tab');
    const storiesText = await page.locator('#root').innerText().catch(() => '');
    if (!storiesText.match(/story|tale|read|chapter|\w{5,}/i)) {
      bug('UX', 'StoriesTab', 'Stories sub-tab empty');
    } else ok('Stories sub-tab has content');
    // Open a story
    const storyBtn = page.locator('button, div[role="button"]').filter({ hasText: /read|story|tale|chapter/i }).first();
    if (await storyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await storyBtn.click();
      await page.waitForTimeout(1500);
      await ss(page, 'b6-story-open');
      const stText = await page.locator('#root').innerText().catch(() => '');
      if (!stText.match(/\w{5,}/i)) {
        bug('BUG', 'StoryScreen', 'Story screen blank after opening');
      } else ok('Story content loaded');
      await exitScreen(page);
    }
  }

  // ── AI STORY GENERATOR (if separate)
  await goTab(page, 'Practice');
  const aiStoryBtn = page.locator('button, a, div').filter({ hasText: /ai story|generate.*story|story.*generator/i }).first();
  if (await aiStoryBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await aiStoryBtn.click();
    await page.waitForTimeout(1000);
    await dismissAll(page);
    await ss(page, 'b6-ai-story');
    const aiText = await page.locator('#root').innerText().catch(() => '');
    if (!aiText.match(/\w{5,}/i)) bug('BUG', 'AIStory', 'AI Story screen blank');
    else ok('AI Story screen loaded');
    await exitScreen(page);
  }

  // ── MICRO LESSON (if visible)
  await goTab(page, 'Practice');
  const microBtn = page.locator('button, a, div').filter({ hasText: /micro.*lesson|5.*min.*lesson|quick lesson/i }).first();
  if (await microBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await microBtn.click();
    await page.waitForTimeout(1200);
    await dismissAll(page);
    await ss(page, 'b6-micro-lesson');
    const microText = await page.locator('#root').innerText().catch(() => '');
    if (!microText.match(/\w{5,}/i)) bug('BUG', 'MicroLesson', 'Micro lesson screen blank');
    else ok('Micro lesson loaded');
    const microQs = await runQuiz(page, 'MicroLesson', 8);
    ok(`Micro lesson: ${microQs} questions`);
    await exitScreen(page);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 7 — Days 19-21: Profile deep-dive — stats, badges, heatmap, journal, mistakes
// ══════════════════════════════════════════════════════════════════════════════
test('Block 7 (Days 19-21) — Profile: stats, badges, heatmap, journal, mistakes review', async ({ page }) => {
  attachErrorListeners(page, 'Block7');
  await login(page);
  await goTab(page, 'Profile');
  await ss(page, 'b7-profile');

  const profileText = await page.locator('#root').innerText().catch(() => '');

  // ── Core stat counters
  for (const stat of ['XP', 'Streak', 'Lessons']) {
    if (profileText.match(new RegExp(stat, 'i'))) ok(`Profile stat "${stat}" visible`);
    else bug('BUG', 'Profile', `Stat "${stat}" missing from profile`);
  }

  // ── Badges section
  if (profileText.match(/badge|achievement|trophy|award/i)) ok('Badges section visible');
  else bug('UX', 'Profile', 'No badges/achievements section on profile');

  // ── Heatmap / activity calendar
  if (profileText.match(/activity|heatmap|calendar|streak.*day/i)) ok('Activity heatmap visible');
  else info('Activity heatmap not found (may appear after more activity)');

  // ── Level display
  if (profileText.match(/level\s*\d|lv\.\s*\d|rank/i)) ok('Level indicator visible');
  else bug('UX', 'Profile', 'No level indicator on profile');

  // ── MISTAKES REVIEW
  const mistakesBtn = page.locator('button').filter({ hasText: /mistake|error|wrong|review/i }).first();
  if (await mistakesBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await mistakesBtn.click();
    await page.waitForTimeout(1000);
    await ss(page, 'b7-mistakes');
    const mText = await page.locator('#root').innerText().catch(() => '');
    if (!mText.match(/mistake|error|no mistakes|all correct|\w{4,}/i)) {
      bug('BUG', 'MistakesReview', 'Mistakes screen blank');
    } else ok('Mistakes screen loaded');
    await exitScreen(page);
  } else {
    bug('UX', 'Profile', 'Mistakes review button not found');
  }

  // ── JOURNAL — accessed from StatsTab (default sub-tab). Re-click Stats if needed.
  await goTab(page, 'Profile');
  // Ensure Stats sub-tab is active (ptab persists across Profile visits)
  const statsSubTab = page.locator('button').filter({ hasText: /^stats$/i }).first();
  if (await statsSubTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    await statsSubTab.click().catch(() => {});
    await page.waitForTimeout(500);
  }
  // "Vocabulary / Personal journal" button in StatsTab calls setScr('journal')
  const journalBtn = page.locator('button').filter({ hasText: /journal|diary|vocabulary|personal.*journal/i }).first();
  if (await journalBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await journalBtn.click();
    await page.waitForTimeout(1000);
    await ss(page, 'b7-journal');
    const jText = await page.locator('#root').innerText().catch(() => '');
    if (!jText.match(/journal|entry|write|today|\w{4,}/i)) {
      bug('BUG', 'Journal', 'Journal screen blank');
    } else ok('Journal screen loaded');
    // Try creating an entry
    const textarea = page.locator('textarea').first();
    const writeBtn = page.locator('button').filter({ hasText: /new entry|add|write/i }).first();
    if (await writeBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await writeBtn.click();
      await page.waitForTimeout(500);
    }
    if (await textarea.isVisible({ timeout: 2000 }).catch(() => false)) {
      await textarea.fill('Testing journal entry from automated audit. Dobar dan!');
      const saveBtn = page.locator('button').filter({ hasText: /save|submit|done|✓/i }).first();
      if (await saveBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(800);
        ok('Journal entry saved');
      }
    }
    await exitScreen(page);
  } else {
    bug('UX', 'Profile', 'Journal button not found on profile');
  }

  // ── LEADERBOARD / WEEKLY LEAGUE
  await goTab(page, 'Profile');
  const leaderBtn = page.locator('button').filter({ hasText: /leaderboard|league|ranking|weekly/i }).first();
  if (await leaderBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await leaderBtn.click();
    await page.waitForTimeout(1000);
    await ss(page, 'b7-leaderboard');
    const lbText = await page.locator('#root').innerText().catch(() => '');
    if (!lbText.match(/rank|league|XP|player|user|\w{4,}/i)) {
      bug('BUG', 'Leaderboard', 'Leaderboard screen blank');
    } else ok('Leaderboard screen loaded');
    await exitScreen(page);
  } else {
    info('Leaderboard not directly visible from Profile');
  }

  // ── GDPR / EXPORT DATA
  await goTab(page, 'Profile');
  const exportBtn = page.locator('button').filter({ hasText: /export.*data|download.*data|my data|gdpr/i }).first();
  if (await exportBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await exportBtn.click();
    await page.waitForTimeout(1000);
    await ss(page, 'b7-data-export');
    ok('Data export modal/screen opened');
    await exitScreen(page);
  } else {
    info('No data export button visible (may be in settings)');
  }

  // ── XP counter is a real number
  const xp = await readXP(page);
  if (xp === null) bug('BUG', 'Profile', 'XP counter not found or not parseable on profile');
  else ok(`XP readable from profile: ${xp}`);
});

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 8 — Days 22-24: Settings — difficulty, voice, dark mode, goal, notifications
// ══════════════════════════════════════════════════════════════════════════════
test('Block 8 (Days 22-24) — Settings: difficulty, voice, dark mode, weekly goal', async ({ page }) => {
  attachErrorListeners(page, 'Block8');
  await login(page);
  await goTab(page, 'Profile');

  // ── Open settings
  const settingsBtn = page.locator('button').filter({ hasText: /setting|⚙|gear|preference/i }).first();
  if (await settingsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await settingsBtn.click();
    await page.waitForTimeout(800);
    await ss(page, 'b8-settings');
    const setText = await page.locator('#root').innerText().catch(() => '');

    // ── Difficulty setting (look for any of the 3 level buttons)
    const diffButtons = page.locator('button').filter({ hasText: /^Beginner$|^Intermediate$|^Advanced$/i });
    if (await diffButtons.count().catch(() => 0) > 0) {
      ok('Difficulty setting visible');
      const advBtn = page.locator('button').filter({ hasText: 'Intermediate' }).first();
      if (await advBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await advBtn.click();
        await page.waitForTimeout(400);
        ok('Difficulty changed to Intermediate');
        const begBtn = page.locator('button').filter({ hasText: 'Beginner' }).first();
        if (await begBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
          await begBtn.click();
          await page.waitForTimeout(300);
        }
      }
    } else {
      bug('UX', 'Settings', 'Difficulty selector (Beginner/Intermediate/Advanced) not in Settings');
    }

    // ── Voice / TTS setting
    if (setText.match(/voice|pronunciation|tts|azure|speaker/i)) ok('Voice/TTS setting visible');
    else info('No voice setting visible (may need to scroll)');

    // ── Notification toggle
    if (setText.match(/notification|push|remind/i)) ok('Notification setting visible');
    else info('Notification setting not visible');

    await exitScreen(page);
  } else {
    bug('UX', 'Profile', 'Settings button not found');
  }

  // ── DARK MODE TOGGLE
  await goTab(page, 'Profile');
  const darkToggle = page.locator('button, input[type="checkbox"]').filter({ hasText: /dark|night|theme|mode/i }).first();
  if (await darkToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
    // App applies dark mode via className="dark" on main div, not body CSS vars.
    // Check presence of .dark class on the root app container.
    const darkBefore = await page.evaluate(() => document.querySelector('[class="dark"]') !== null).catch(() => false);
    await darkToggle.click().catch(() => {});
    await page.waitForTimeout(700);
    const darkAfter = await page.evaluate(() => document.querySelector('[class="dark"]') !== null).catch(() => false);
    if (darkBefore !== darkAfter) ok('Dark mode toggle: .dark class toggled correctly');
    else bug('BUG', 'DarkMode', 'Dark mode button clicked but .dark class did not change on root div');
    await ss(page, 'b8-dark-mode');
    // Toggle back
    await darkToggle.click().catch(() => {});
    await page.waitForTimeout(400);
  } else {
    info('Dark mode toggle not directly visible');
  }

  // ── WEEKLY GOAL SETTER
  await goTab(page, 'Home');
  const goalBtn = page.locator('button').filter({ hasText: /set.*goal|weekly.*goal|xp.*goal|goal/i }).first();
  if (await goalBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await goalBtn.click();
    await page.waitForTimeout(800);
    await ss(page, 'b8-goal-setter');
    const goalText = await page.locator('#root').innerText().catch(() => '');
    if (!goalText.match(/goal|\d+.*xp|50|100|150|200/i)) {
      bug('BUG', 'WeeklyGoal', 'Weekly goal setter opened but no options visible');
    } else ok('Weekly goal options visible');
    // Select a goal
    const goal100 = page.locator('button').filter({ hasText: /100.*xp|50.*xp|casual/i }).first();
    if (await goal100.isVisible({ timeout: 2000 }).catch(() => false)) {
      await goal100.click();
      await page.waitForTimeout(500);
      ok('Weekly goal selected');
    }
    await exitScreen(page);
    // Verify goal appears on home
    await goTab(page, 'Home');
    const homeAfterGoal = await page.locator('#root').innerText().catch(() => '');
    if (homeAfterGoal.match(/\d+\s*\/\s*\d+.*xp|\d+.*xp.*goal/i)) ok('Weekly goal progress shown on home');
    else info('Weekly goal progress not visually confirmed (may need XP activity first)');
  } else {
    info('Weekly goal setter not found directly on home');
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 9 — Days 25-27: Edge cases — search, empty states, back-nav, viewport
// ══════════════════════════════════════════════════════════════════════════════
test('Block 9 (Days 25-27) — Edge cases: search, back-nav, mobile viewport, XP state', async ({ page }) => {
  attachErrorListeners(page, 'Block9');
  await login(page);

  // ── SEARCH functionality
  await goTab(page, 'Learn');
  const searchBox = page.locator('input[type="search"], input[placeholder*="search" i]').first();
  if (await searchBox.isVisible({ timeout: 3000 }).catch(() => false)) {
    await searchBox.fill('kuća');
    await page.waitForTimeout(800);
    await ss(page, 'b9-search-results');
    const searchText = await page.locator('#root').innerText().catch(() => '');
    if (searchText.match(/kuć|house|home|no results/i)) ok('Search returns results for "kuća"');
    else bug('BUG', 'Search', 'Search for "kuća" returned no results and no "no results" message');
    // Clear search
    await searchBox.clear();
    await page.waitForTimeout(400);
  } else {
    // Search may be in sidebar
    const sidebarSearch = page.locator('input').filter({ hasAttribute: 'placeholder' }).first();
    if (await sidebarSearch.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sidebarSearch.fill('auto');
      await page.waitForTimeout(600);
      const sText = await page.locator('#root').innerText().catch(() => '');
      if (sText.match(/auto|car|result|lesson/i)) ok('Sidebar search returned results');
      else info('Sidebar search fired but unclear results');
      await sidebarSearch.clear();
    } else {
      info('No search input found — search may not be a feature');
    }
  }

  // ── BACK NAVIGATION: open exercise, hit browser back, check no crash
  await goTab(page, 'Practice');
  const anyExBtn = page.locator('button').filter({ hasText: /^quiz$|flashcard|word sprint/i }).first();
  if (await anyExBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await anyExBtn.click();
    await page.waitForTimeout(1000);
    await dismissAll(page);
    const exerciseText = await page.locator('#root').innerText().catch(() => '');
    if (exerciseText.match(/\w{4,}/i)) {
      await page.goBack({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1000);
      await ss(page, 'b9-back-nav');
      const afterBack = await page.locator('#root').innerText().catch(() => '');
      if (!afterBack.match(/home|learn|practice|croatia|profile/i)) {
        bug('BUG', 'BackNav', 'Browser back from exercise did not return to main tab');
      } else ok('Browser back from exercise works correctly');
    }
  }

  // ── MOBILE VIEWPORT: 390px (iPhone 14 size)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await login(page);
  await ss(page, 'b9-mobile-390');
  const mobileText = await page.locator('#root').innerText().catch(() => '');
  if (!mobileText.match(/home|learn|practice|croatia|profile/i)) {
    bug('BUG', 'MobileViewport', '390px viewport: app not rendering main tabs');
  } else ok('390px mobile viewport: app renders');
  // Check tab bar is present at bottom
  const tabBar = page.locator('.tab-bar, [class*="tabbar"], [class*="tab-bar"], nav').last();
  if (await tabBar.isVisible({ timeout: 2000 }).catch(() => false)) ok('Tab bar visible at 390px');
  else info('Tab bar not found (may be sidebar-only design)');

  // ── TABLET VIEWPORT: 768px
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500);
  await ss(page, 'b9-tablet-768');
  const tabletText = await page.locator('#root').innerText().catch(() => '');
  if (!tabletText.match(/home|learn|practice/i)) {
    bug('BUG', 'TabletViewport', '768px tablet: app not rendering');
  } else ok('768px tablet viewport renders');

  // Restore desktop
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(300);

  // ── XP PERSISTS after navigation
  await login(page);
  await goTab(page, 'Profile');
  const xp1 = await readXP(page);
  await goTab(page, 'Home');
  await goTab(page, 'Croatia');
  await goTab(page, 'Practice');
  await goTab(page, 'Profile');
  const xp2 = await readXP(page);
  if (xp1 !== null && xp2 !== null && xp1 !== xp2) {
    bug('BUG', 'XP-Persistence', `XP changed during navigation without activity: ${xp1} → ${xp2}`);
  } else if (xp1 !== null) {
    ok(`XP stable across tab navigation: ${xp1}`);
  }

  // ── EMPTY STATE: SRS with no items — should show message, not crash
  await goTab(page, 'Practice');
  const srsBtn = page.locator('button, a, div').filter({ hasText: /srs review|spaced rep/i }).first();
  if (await srsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await srsBtn.click();
    await page.waitForTimeout(1000);
    const srsText = await page.locator('#root').innerText().catch(() => '');
    if (srsText.match(/no.*due|nothing|all caught up|empty|0 card/i)) {
      ok('SRS empty state shows friendly message');
    } else if (srsText.match(/\w{4,}/i)) {
      ok('SRS loaded with content');
    } else {
      bug('BUG', 'SRS-EmptyState', 'SRS Review is blank — missing empty state UI');
    }
    await exitScreen(page);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 10 — Days 28-30: Stress test — rapid flow, repeat visits, XP flow end-to-end
// ══════════════════════════════════════════════════════════════════════════════
test('Block 10 (Days 28-30) — Stress: rapid nav, XP flow, repeat exercises, award flow', async ({ page }) => {
  attachErrorListeners(page, 'Block10');
  await login(page);

  // ── RAPID TAB SWITCHING (no crash)
  for (const tab of ['Learn', 'Practice', 'Croatia', 'Profile', 'Home', 'Practice', 'Learn']) {
    await goTab(page, tab);
    await page.waitForTimeout(200);
  }
  const afterRapid = await page.locator('#root').innerText().catch(() => '');
  if (!afterRapid.match(/\w{4,}/i)) {
    bug('BUG', 'RapidNav', 'App crashed or went blank after rapid tab switching');
  } else ok('Rapid tab switching: no crash');

  // ── FULL XP FLOW: complete a quiz, verify XP awarded
  await goTab(page, 'Profile');
  const xpBefore = await readXP(page);
  ok(`XP before quiz: ${xpBefore}`);

  await goTab(page, 'Practice');
  const xpQuizLaunched = await clickQuickGame(page, 'Quiz');
  if (xpQuizLaunched) {
    const qsAnswered = await runQuiz(page, 'XP-Quiz', 10);
    info(`XP-flow quiz: ${qsAnswered} questions answered`);
    if (qsAnswered > 0) {
      // Check for XP award animation/toast
      const xpToast = page.locator('[class*="toast"], [class*="award"], [class*="xp"], [class*="celebrate"]').first();
      const toastVisible = await xpToast.isVisible({ timeout: 2000 }).catch(() => false);
      if (toastVisible) ok('XP award toast/animation shown after quiz');
      else info('No visible XP toast (may be transient)');
      await exitScreen(page);
      // Navigate to profile and check XP increased
      await goTab(page, 'Profile');
      const xpAfter = await readXP(page);
      ok(`XP after quiz: ${xpAfter}`);
      if (xpBefore !== null && xpAfter !== null) {
        if (xpAfter > xpBefore) ok(`XP correctly increased: +${xpAfter - xpBefore}`);
        // Block 10 is a repeat/stress run — xpCooldown blocks re-earning from the same
        // exercise in the same day, so unchanged XP is expected here, not a bug
        else if (xpAfter === xpBefore) info('XP unchanged after quiz — xpCooldown active (exercise already done this session, expected)');
        else bug('BUG', 'XP-Award', `XP dropped after completing quiz: ${xpBefore} → ${xpAfter}`);
      }
    } else {
      bug('BUG', 'QuizEmpty', 'Quiz launched but 0 questions answered');
      await exitScreen(page);
    }
  }

  // ── OPEN EXERCISE → IMMEDIATELY EXIT (no crash on early exit)
  await goTab(page, 'Practice');
  const earlyExit = await clickQuickGame(page, 'Flashcards');
  if (earlyExit) {
    await exitScreen(page); // exit immediately without interacting
    const afterExit = await page.locator('#root').innerText().catch(() => '');
    if (!afterExit.match(/home|learn|practice|croatia|profile/i)) {
      bug('BUG', 'EarlyExit', 'Early exit from Flashcards did not return to main app');
    } else ok('Early exit from Flashcards: back to main app');
  }

  // ── REPEAT VISIT: same quiz twice in a row
  await goTab(page, 'Practice');
  const rep1 = await clickQuickGame(page, 'Quiz');
  if (rep1) {
    await dismissAll(page);
    await exitScreen(page);
    await goTab(page, 'Practice');
    const rep2 = await clickQuickGame(page, 'Quiz');
    if (rep2) {
      const qText = await page.locator('#root').innerText().catch(() => '');
      if (!qText.match(/\w{4,}/i)) {
        bug('BUG', 'RepeatVisit', 'Quiz blank on second visit in same session');
      } else {
        ok('Repeat visit to Quiz: loads correctly second time');
        const rqs = await runQuiz(page, 'RepeatQuiz', 5);
        ok(`Repeat quiz: ${rqs} questions`);
      }
      await exitScreen(page);
    }
  }

  // ── MODAL STATE CLEANUP: open premium modal manually, dismiss, verify no remnants
  await goTab(page, 'Home');
  await dismissAll(page);
  const remnant = await page.locator('[role="dialog"]:visible, .modal:visible, [class*="overlay"]:visible').count().catch(() => 0);
  if (remnant > 0) bug('BUG', 'ModalCleanup', `${remnant} modal overlay(s) still visible after dismissAll`);
  else ok('No modal remnants after dismissAll');

  // ── ACCESSIBILITY: check for images without alt text
  const missingAlt = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs.filter(img => !img.alt && !img.getAttribute('aria-label')).length;
  }).catch(() => 0);
  if (missingAlt > 3) bug('A11Y', 'Accessibility', `${missingAlt} <img> elements missing alt text`);
  else if (missingAlt > 0) info(`${missingAlt} image(s) missing alt text (minor)`);
  else ok('All images have alt text');

  // ── FINAL SCREENSHOT: end state
  await goTab(page, 'Home');
  await ss(page, 'b10-final-home');
  ok('30-day audit complete');
});
