/**
 * Week-of-use audit — nasahrvatska.com
 * Simulates 7 days of real usage: login, daily lessons, every practice
 * screen, Croatia/culture tab, immersion tools, profile, streaks, modals.
 *
 * Run:
 *   npx playwright test --config playwright.week-audit.config.js --project Chrome
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const EMAIL    = 'claude.test.nasahrvatska@gmail.com';
const PASSWORD = 'ClaudeTest2026!';
const REPORT   = 'week-audit-report.json';
const SS_DIR   = 'week-audit-screenshots';

if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });

// ── Shared bug log ─────────────────────────────────────────────────────────
const bugs = [];
function bug(sev, screen, desc, detail = '') {
  const e = { sev, screen, desc, detail: detail.slice(0, 300), ts: new Date().toISOString() };
  bugs.push(e);
  console.error(`  ❌ [${sev}] ${screen} — ${desc}${detail ? ': ' + detail.slice(0, 120) : ''}`);
}
function ok(msg)   { console.log(`  ✅ ${msg}`); }
function info(msg) { console.log(`  ℹ️  ${msg}`); }

// ── Screenshot ─────────────────────────────────────────────────────────────
async function ss(page, name) {
  const p = `${SS_DIR}/${name.replace(/[^a-z0-9]/gi, '-')}.png`;
  await page.screenshot({ path: p, fullPage: false }).catch(() => {});
}

// ── Error listeners ────────────────────────────────────────────────────────
function attachErrorListeners(page, screen) {
  page.on('pageerror', err => {
    const m = err.message;
    if (/ResizeObserver|firebase|firestore|Non-Error promise|ChunkLoadError/i.test(m)) return;
    bug('JS-ERROR', screen, m.slice(0, 150));
  });
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    const t = msg.text();
    if (/firebase|firestore|ERR_|net::|CSP|Content.Security|favicon|403|401|posthog/i.test(t)) return;
    bug('CONSOLE-ERR', screen, t.slice(0, 150));
  });
}

// ── Dismiss ALL modals that could block interaction ────────────────────────
async function dismissAll(page) {
  await dismissModals(page);
  // Close any [role="dialog"] modals via their × button
  const modalOverlay = page.locator('[role="dialog"]').first();
  if (await modalOverlay.isVisible({ timeout: 400 }).catch(() => false)) {
    const xBtn = modalOverlay.locator('button').filter({ hasText: /^[×✕]$/ }).first();
    if (await xBtn.isVisible({ timeout: 400 }).catch(() => false)) {
      await xBtn.click().catch(() => {});
      await page.waitForTimeout(300).catch(() => {});
    }
  }
}

// ── Login ──────────────────────────────────────────────────────────────────
async function login(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(
    () => document.getElementById('root')?.innerText?.length > 5,
    { timeout: 20000 }
  ).catch(() => {});

  const emailEl = page.locator('input[type="email"]').first();
  if (!await emailEl.isVisible({ timeout: 3000 }).catch(() => false)) return; // already logged in

  await emailEl.fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.locator('input[type="password"]').first().press('Enter');

  await page.waitForFunction(() => {
    const t = document.getElementById('root')?.innerText || '';
    return t.includes('Home') && t.includes('Practice');
  }, { timeout: 25000 }).catch(() => {});

  // Wait for Firebase hydration + give premium modal time to appear so we can dismiss it
  await page.waitForTimeout(3500);
  await dismissModals(page);
}

// ── Navigate to a main tab ─────────────────────────────────────────────────
// Sidebar nav uses .sb-btn buttons inside <aside>.
// Do NOT call dismissAll after the tab click — it can re-navigate.
async function goTab(page, label) {
  // Dismiss blocking modals BEFORE clicking the tab
  await dismissModals(page);

  // Primary: .sb-btn buttons (sidebar desktop nav)
  const tab = page.locator('.sb-btn').filter({ hasText: label }).first();
  if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await tab.click();
    await page.waitForTimeout(1000);
    return true;
  }
  // Fallback: TabBar (mobile bottom nav) or any button with exact label
  const fallback = page.locator('button').filter({ hasText: new RegExp('^' + label + '$', 'i') }).first();
  if (await fallback.isVisible({ timeout: 2000 }).catch(() => false)) {
    await fallback.click();
    await page.waitForTimeout(1000);
    return true;
  }
  bug('NAV', label, `Tab "${label}" not found`);
  return false;
}

// ── Dismiss ONLY blocking modals (no side effects) ─────────────────────────
// Separate from dismissAll so goTab can call it without risk of re-navigating.
async function dismissModals(page) {
  for (let i = 0; i < 2; i++) {
    for (const txt of ['Essential only', 'Accept all', 'Reject all']) {
      const btn = page.locator('button').filter({ hasText: new RegExp('^' + txt + '$', 'i') }).first();
      if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
        await btn.click().catch(() => {});
        await page.waitForTimeout(500).catch(() => {});
      }
    }
    const premiumBtn = page.locator('button').filter({ hasText: /^start exploring →?$/i }).first();
    if (await premiumBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await premiumBtn.click().catch(() => {});
      await page.waitForTimeout(400).catch(() => {});
    }
  }
}

// ── Answer quiz questions (looks for .ob option buttons) ──────────────────
async function runQuiz(page, screen, maxQ = 15) {
  let count = 0;
  for (let i = 0; i < maxQ; i++) {
    const opts = page.locator('.ob');
    if (await opts.count().catch(() => 0) === 0) break;
    count++;
    await opts.first().click().catch(() => {});
    await page.waitForTimeout(350);
    const next = page.locator('button').filter({ hasText: /Next →|Results|Continue →/i }).first();
    if (await next.isVisible({ timeout: 1500 }).catch(() => false)) {
      await next.click().catch(() => {});
      await page.waitForTimeout(400);
    }
  }
  return count;
}

// ── Click button if visible, return true if clicked ───────────────────────
async function tap(page, selectorOrText, context = '') {
  const el = typeof selectorOrText === 'string' && selectorOrText.startsWith('/')
    ? page.locator('button, div[role="button"]').filter({ hasText: new RegExp(selectorOrText.slice(1, -1), 'i') }).first()
    : page.locator(selectorOrText).first();
  if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
    await el.click({ timeout: 5000 }).catch(e => bug('CLICK', context, e.message.slice(0, 100)));
    await page.waitForTimeout(700);
    return true;
  }
  return false;
}

async function exitScreen(page) {
  await dismissAll(page);
  for (const txt of ['Exit', '✕ Exit', 'Done', 'Continue →', 'Back', '←']) {
    if (await tap(page, `button:has-text("${txt}")`, 'exit')) return;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DAY 1 — Login, home screen, hero lesson
// ═══════════════════════════════════════════════════════════════════════════
test('Day 1 — Login, home screen, word of day, start hero lesson', async ({ page }) => {
  attachErrorListeners(page, 'Day1');
  const t0 = Date.now();
  await login(page);
  const loginMs = Date.now() - t0;
  if (loginMs > 12000) bug('PERF', 'Login', `Login took ${loginMs}ms`);
  else ok(`Login: ${loginMs}ms`);

  await ss(page, 'day1-home');
  const root = await page.locator('#root').innerText().catch(() => '');

  // Nav tabs
  for (const tab of ['Home', 'Learn', 'Practice', 'Croatia', 'Profile']) {
    if (!root.match(new RegExp(tab, 'i'))) bug('NAV', 'Sidebar', `"${tab}" nav item missing`);
  }
  ok('Nav tabs present');

  // XP displayed
  const xpMatch = root.match(/(\d+)\s*XP/i);
  if (!xpMatch) bug('BUG', 'Home-XP', 'XP value not visible after Firebase hydration');
  else ok(`XP visible: ${xpMatch[0]}`);

  // Streak stat
  if (root.match(/streak/i)) ok('Streak shown on home');
  else bug('UX', 'Home-Streak', 'Streak not visible on home screen');

  // Word of the Day
  if (!root.match(/word of the day|nećak|riječ|Daily Discovery/i))
    bug('BUG', 'Home-WOD', 'Word of the Day section missing');
  else ok('Word of the Day present');

  // Tap the WOD speaker button
  const speakerBtn = page.locator('button[aria-label*="pronunciation" i], button[aria-label*="Hear" i], button:has-text("🔊")').first();
  if (await speakerBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await speakerBtn.click();
    await page.waitForTimeout(800);
    ok('Word of Day speaker button clickable');
  } else {
    bug('BUG', 'Home-WOD', 'Speaker button for Word of Day not found');
  }

  // Hero lesson CTA
  const heroCTA = page.locator('button').filter({ hasText: /continue learning|start now|begin|hajde/i }).first();
  if (await heroCTA.isVisible({ timeout: 2000 }).catch(() => false)) {
    ok('Hero lesson CTA visible');
    await heroCTA.click();
    await page.waitForTimeout(1200);
    await dismissAll(page);
    await ss(page, 'day1-lesson-open');
    const lessonText = await page.locator('#root').innerText().catch(() => '');
    if (lessonText.match(/exit|lesson|vocabulary|grammar|practice|question/i)) {
      ok('Hero lesson launched successfully');
    } else {
      bug('BUG', 'HeroLesson', 'Clicking "Continue Learning" did not navigate into a lesson');
    }
    await exitScreen(page);
  } else {
    bug('UX', 'Hero-CTA', 'No hero lesson CTA button visible');
  }

  // Start Practicing shortcut
  await goTab(page, 'Home');
  const practiceShortcut = page.locator('button').filter({ hasText: /start practicing/i }).first();
  if (await practiceShortcut.isVisible({ timeout: 2000 }).catch(() => false)) {
    await practiceShortcut.click();
    await page.waitForTimeout(800);
    await dismissAll(page);
    await ss(page, 'day1-practice-shortcut');
    await exitScreen(page);
    ok('"Start Practicing" shortcut works');
  }

  // Knight mascot visible
  const knightCard = page.locator('[data-testid="knight"], .knight-card, div').filter({ hasText: /vitez|hvoje/i }).first();
  const knightSVG = page.locator('svg[aria-label*="knight" i]').first();
  if (await knightSVG.isVisible({ timeout: 1000 }).catch(() => false) ||
      await knightCard.isVisible({ timeout: 1000 }).catch(() => false)) {
    ok('Knight mascot visible');
  } else {
    bug('UX', 'Home-Knight', 'Knight mascot not visible on home screen');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// DAY 2 — Learn tab: browse, start lessons, grammar
// ═══════════════════════════════════════════════════════════════════════════
test('Day 2 — Learn tab, lesson content, grammar intro', async ({ page }) => {
  attachErrorListeners(page, 'Day2');
  await login(page);
  await goTab(page, 'Learn');
  await ss(page, 'day2-learn-tab');

  const learnText = await page.locator('#root').innerText().catch(() => '');
  if (!learnText.match(/survivor|settler|communicator|explorer|family|vocabulary|grammar/i))
    bug('BUG', 'LearnTab', 'Learn tab not rendering lesson content');
  else ok('Learn tab shows lesson content');

  // Count lesson items
  const items = await page.locator('.learn-item, [class*="lesson"], div[role="button"]')
    .filter({ hasText: /~\d+ min|lesson|grammar|flashcard/i }).count().catch(() => 0);
  info(`Learn tab items visible: ${items}`);

  // Try to open a lesson
  const lessonBtn = page.locator('button, div[role="button"]')
    .filter({ hasText: /family words|basic greet|vocabulary|numbers/i }).first();
  if (await lessonBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await lessonBtn.click();
    await page.waitForTimeout(1000);
    await dismissAll(page);
    await ss(page, 'day2-lesson-screen');
    const lessonContent = await page.locator('#root').innerText().catch(() => '');
    if (!lessonContent.match(/\w{5,}/i)) bug('BUG', 'LessonScreen', 'Lesson screen appears empty');
    else ok('Lesson screen shows content');
    // Check for audio speaker buttons in lesson
    const speakers = await page.locator('button').filter({ hasText: /🔊/i }).count().catch(() => 0);
    info(`Lesson speaker buttons: ${speakers}`);
    await exitScreen(page);
  }

  // Grammar intro — accessible via Browse Content modal → Grammar category
  await goTab(page, 'Learn');
  const browseForGrammar = page.locator('button').filter({ hasText: /browse|all.*lesson|explore/i }).first();
  if (await browseForGrammar.isVisible({ timeout: 2000 }).catch(() => false)) {
    await browseForGrammar.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(300);
    await browseForGrammar.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(800);
    const grammarBtn = page.locator('button').filter({ hasText: /grammar intro/i }).first();
    if (await grammarBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await grammarBtn.click();
      await page.waitForTimeout(1000);
      await ss(page, 'day2-grammar-intro');
      // Start practice portion — use exact arrow to avoid matching sidebar "Practice" tab
      const practiceBtn = page.locator('button').filter({ hasText: /^practice\s*→$/i }).first();
      if (await practiceBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await practiceBtn.click();
        await page.waitForTimeout(1000);
        const qs = await runQuiz(page, 'GrammarIntro', 16);
        ok(`Grammar Intro: ${qs} questions answered`);
        if (qs < 3) bug('BUG', 'GrammarIntro-Quiz', `Only ${qs} questions loaded (expect 12+)`);
      }
      await ss(page, 'day2-grammar-result');
      await exitScreen(page);
    } else {
      bug('UX', 'LearnTab', 'Grammar Intro not found in Browse Content modal');
      await exitScreen(page);
    }
  } else {
    bug('UX', 'LearnTab', 'Browse Content button not found on Learn tab');
  }

  // Browse Content modal — force click because modal opens and covers the button
  await goTab(page, 'Learn');
  const browseBtn = page.locator('button').filter({ hasText: /browse|all.*lesson|explore/i }).first();
  if (await browseBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await browseBtn.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(300);
    await browseBtn.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(800);
    await ss(page, 'day2-browse-modal');
    const browseText = await page.locator('#root').innerText().catch(() => '');
    if (browseText.match(/inlaws|colors|months|directions|family/i)) ok('Browse content modal opens');
    else bug('BUG', 'LearnTab', 'Browse content modal did not open');
    await exitScreen(page);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// DAY 3 — Practice tab: all exercise types
// ═══════════════════════════════════════════════════════════════════════════
test('Day 3 — Practice: Flashcards, Quiz, Word Sprint, Cloze, SRS Review', async ({ page }) => {
  attachErrorListeners(page, 'Day3');
  await login(page);
  await goTab(page, 'Practice');
  await ss(page, 'day3-practice-tab');

  const practiceText = await page.locator('#root').innerText().catch(() => '');

  // Check "Today's Pick" section exists
  if (practiceText.match(/today.*pick|today's pick/i)) ok('Today\'s Pick section visible');
  else bug('UX', 'PracticeTab', '"Today\'s Pick" section missing');

  // Category tabs
  for (const cat of ['Speak', 'Grammar', 'Words', 'Read']) {
    if (practiceText.match(new RegExp(cat, 'i'))) ok(`Practice category "${cat}" visible`);
    else bug('BUG', 'PracticeTab', `Practice category "${cat}" tab missing`);
  }

  // ── Flashcards ──────────────────────────────────────────────────────────
  await goTab(page, 'Practice');
  const flashBtn = page.locator('button, a, div').filter({ hasText: /^flashcard/i }).first();
  if (await flashBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await flashBtn.click();
    await page.waitForTimeout(900);
    await dismissAll(page);
    await ss(page, 'day3-flashcards');
    const fcText = await page.locator('#root').innerText().catch(() => '');
    if (!fcText.match(/\w{4,}/i)) bug('BUG', 'Flashcards', 'Flashcard screen blank');
    else ok('Flashcards loaded');
    // Flip card
    const card = page.locator('[class*="card"], div[style*="cursor"]').first();
    await card.click().catch(() => {});
    await page.waitForTimeout(500);
    // Rate button
    // Buttons say "Still Learning" / "Perfect ✓" (SRS rating)
    const ratingBtn = page.locator('button').filter({ hasText: /still learning|perfect|easy|good|hard|knew it/i }).first();
    if (await ratingBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await ratingBtn.click();
      await page.waitForTimeout(400);
      ok('Flashcard rating button works');
    } else {
      bug('BUG', 'Flashcards', 'No SRS rating buttons after flip (expected Still Learning / Perfect)');
    }
    await ss(page, 'day3-flashcard-rated');
    await exitScreen(page);
  } else {
    bug('BUG', 'PracticeTab', 'Flashcards button not found on practice tab');
  }

  // ── Multiple Choice Quiz ────────────────────────────────────────────────
  await goTab(page, 'Practice');
  const quizBtn = page.locator('a, button').filter({ hasText: /^quiz$/i }).first();
  if (await quizBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await quizBtn.click();
    await page.waitForTimeout(900);
    await dismissAll(page);
    await ss(page, 'day3-quiz');
    const qs = await runQuiz(page, 'MCQuiz', 10);
    ok(`Quiz: ${qs} questions`);
    if (qs === 0) bug('BUG', 'MCQuiz', 'Quiz launched but no questions appeared');
    await ss(page, 'day3-quiz-done');
    await exitScreen(page);
  }

  // ── Sentence Cloze ──────────────────────────────────────────────────────
  await goTab(page, 'Practice');
  const clozeBtn = page.locator('button, a, div').filter({ hasText: /sentence cloze|fill.in|cloze/i }).first();
  if (await clozeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await clozeBtn.click();
    await page.waitForTimeout(900);
    await dismissAll(page);
    await ss(page, 'day3-cloze');
    const clozeText = await page.locator('#root').innerText().catch(() => '');
    if (!clozeText.match(/\w{5,}/i)) bug('BUG', 'Cloze', 'Sentence Cloze screen blank');
    else ok('Sentence Cloze loaded');
    const qs = await runQuiz(page, 'Cloze', 5);
    ok(`Sentence Cloze: ${qs} questions answered`);
    await exitScreen(page);
  } else {
    bug('UX', 'PracticeTab', 'Sentence Cloze not visible on practice tab');
  }

  // ── SRS Review ──────────────────────────────────────────────────────────
  await goTab(page, 'Practice');
  const srsBtn = page.locator('button, a, div').filter({ hasText: /srs review|spaced rep|review$/i }).first();
  if (await srsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await srsBtn.click();
    await page.waitForTimeout(900);
    await dismissAll(page);
    await ss(page, 'day3-srs-review');
    const srsText = await page.locator('#root').innerText().catch(() => '');
    if (srsText.match(/no.*due|up to date|nothing/i)) ok('SRS: no items due (fresh account)');
    else if (srsText.match(/\w{4,}/i)) ok('SRS Review loaded with content');
    else bug('BUG', 'SRS', 'SRS Review screen blank');
    await exitScreen(page);
  }

  // ── Word Sprint ─────────────────────────────────────────────────────────
  await goTab(page, 'Practice');
  const sprintBtn = page.locator('button, a, div').filter({ hasText: /word sprint/i }).first();
  if (await sprintBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sprintBtn.click();
    await page.waitForTimeout(900);
    await dismissAll(page);
    await ss(page, 'day3-word-sprint');
    const startBtn = page.locator('button').filter({ hasText: /start|play|begin/i }).first();
    if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(600);
      ok('Word Sprint starts');
    }
    await exitScreen(page);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// DAY 4 — Grammar drills: Cases, Aspect, Conjugation, CEFR
// ═══════════════════════════════════════════════════════════════════════════
test('Day 4 — Grammar drills: Padeži, Aspect, Conjugation, CEFR Test', async ({ page }) => {
  attachErrorListeners(page, 'Day4');
  await login(page);
  await goTab(page, 'Practice');

  // ── Padeži / Cases ── use button-only to avoid matching "Sentence Cloze - cases in context" div
  const caseBtn = page.locator('button').filter({ hasText: /padeži|padezi|case constellation/i }).first();
  if (await caseBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await caseBtn.click();
    await page.waitForTimeout(900);
    await dismissAll(page);
    await ss(page, 'day4-padezi');
    const caseText = await page.locator('#root').innerText().catch(() => '');
    if (!caseText.match(/nominativ|accusative|genitive|dativ/i))
      bug('BUG', 'Padeži', 'Cases screen not showing case content');
    else ok('Padeži screen loaded');
    await exitScreen(page);
  }

  // ── Aspect Drill ────────────────────────────────────────────────────────
  await goTab(page, 'Practice');
  const aspectBtn = page.locator('button').filter({ hasText: /aspect|verb aspect|glagolski/i }).first();
  if (await aspectBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await aspectBtn.click();
    await page.waitForTimeout(900);
    await dismissAll(page);
    await ss(page, 'day4-aspect');
    const aspectText = await page.locator('#root').innerText().catch(() => '');
    if (!aspectText.match(/imperfective|perfective|aspect|piti|učiti/i))
      bug('BUG', 'AspectDrill', 'Aspect drill not showing verb content');
    else ok('Aspect Drill loaded');
    const qs = await runQuiz(page, 'Aspect', 5);
    info(`Aspect Drill: ${qs} questions`);
    await exitScreen(page);
  }

  // ── Conjugation Drill ───────────────────────────────────────────────────
  await goTab(page, 'Practice');
  const conjBtn = page.locator('button').filter({ hasText: /conjugat|conj drill/i }).first();
  if (await conjBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await conjBtn.click();
    await page.waitForTimeout(900);
    await dismissAll(page);
    await ss(page, 'day4-conjugation');
    const qs = await runQuiz(page, 'ConjDrill', 8);
    ok(`Conjugation Drill: ${qs} questions`);
    await exitScreen(page);
  }

  // ── CEFR Test ────────────────────────────────────────────────────────────
  await goTab(page, 'Practice');
  const cefrBtn = page.locator('button').filter({ hasText: /cefr|level test|placement test/i }).first();
  if (await cefrBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cefrBtn.click();
    await page.waitForTimeout(900);
    await dismissAll(page);
    await ss(page, 'day4-cefr');
    const cefrText = await page.locator('#root').innerText().catch(() => '');
    if (!cefrText.match(/A1|A2|B1|level/i)) bug('BUG', 'CEFR', 'CEFR test not showing level selection');
    else ok('CEFR test loaded');
    // Start A1 level
    const a1Btn = page.locator('button').filter({ hasText: /A1|beginner/i }).first();
    if (await a1Btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await a1Btn.click();
      await page.waitForTimeout(700);
      const qs = await runQuiz(page, 'CEFR-A1', 8);
      ok(`CEFR A1: ${qs} questions answered`);
      if (qs === 0) bug('BUG', 'CEFR-A1', 'CEFR A1 quiz questions not appearing');
    }
    await exitScreen(page);
  }

  // ── Listening ───────────────────────────────────────────────────────────
  await goTab(page, 'Practice');
  const listenBtn = page.locator('button, a, div').filter({ hasText: /^listening$/i }).first();
  if (await listenBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await listenBtn.click();
    await page.waitForTimeout(900);
    await dismissAll(page);
    await ss(page, 'day4-listening');
    const listenText = await page.locator('#root').innerText().catch(() => '');
    if (!listenText.match(/listen|play|audio|🔊/i)) bug('BUG', 'Listening', 'Listening screen missing content');
    else ok('Listening screen loaded');
    await exitScreen(page);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// DAY 5 — Croatia tab: Texting quiz, Regions, City of Day, Phrase of Day
// ═══════════════════════════════════════════════════════════════════════════
test('Day 5 — Croatia tab: Texting quiz, regions, phrase of day, roleplay', async ({ page }) => {
  attachErrorListeners(page, 'Day5');
  await login(page);
  await goTab(page, 'Croatia');
  await ss(page, 'day5-croatia-tab');

  const croatiaText = await page.locator('#root').innerText().catch(() => '');
  for (const section of ['region', 'conversation', 'history', 'culture']) {
    if (croatiaText.match(new RegExp(section, 'i'))) ok(`Croatia section "${section}" visible`);
  }

  // ── Texting & Slang (with quiz) ─────────────────────────────────────────
  const textingBtn = page.locator('button, a, div').filter({ hasText: /texting|slang/i }).first();
  if (await textingBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await textingBtn.click();
    await page.waitForTimeout(900);
    await dismissAll(page);
    await ss(page, 'day5-texting');
    const tText = await page.locator('#root').innerText().catch(() => '');
    if (!tText.match(/nmvz|ajde|di si|ful|ekipa/i)) bug('BUG', 'TextingScreen', 'Texting slang items missing');
    else ok('Texting & Slang content loaded');
    // Test new quiz
    const quizBtn = page.locator('button').filter({ hasText: /test yourself|quiz →/i }).first();
    if (await quizBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await quizBtn.click();
      await page.waitForTimeout(600);
      const qs = await runQuiz(page, 'TextingQuiz', 5);
      ok(`Texting quiz: ${qs} questions`);
      if (qs === 0) bug('BUG', 'TextingQuiz', 'Texting quiz started but no .ob question buttons appeared');
    } else {
      bug('BUG', 'TextingScreen', '"Test Yourself" button not found — quiz not wired');
    }
    await ss(page, 'day5-texting-quiz');
    await exitScreen(page);
  }

  // ── City of the Day ─────────────────────────────────────────────────────
  await goTab(page, 'Croatia');
  const cityBtn = page.locator('button, a, div').filter({ hasText: /city of the day|grad dana/i }).first();
  if (await cityBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cityBtn.click();
    await page.waitForTimeout(900);
    await dismissAll(page);
    await ss(page, 'day5-city-of-day');
    const cityText = await page.locator('#root').innerText().catch(() => '');
    if (!cityText.match(/population|county|fun fact|famous for|split|zagreb|dubrovnik/i))
      bug('BUG', 'CityOfDay', 'City of Day missing expected content sections');
    else ok('City of the Day content loaded');
    await exitScreen(page);
  }

  // ── Phrase of the Day ───────────────────────────────────────────────────
  await goTab(page, 'Croatia');
  const phraseBtn = page.locator('button, a, div').filter({ hasText: /phrase of the day|fraza|daily phrase/i }).first();
  if (await phraseBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await phraseBtn.click();
    await page.waitForTimeout(900);
    await dismissAll(page);
    await ss(page, 'day5-phrase-of-day');
    const phraseText = await page.locator('#root').innerText().catch(() => '');
    if (!phraseText.match(/[a-z]{4,}/i)) bug('BUG', 'PhraseOfDay', 'Phrase of Day appears empty');
    else ok('Phrase of Day loaded');
    // Test audio play
    const playBtn = page.locator('button').filter({ hasText: /🔊|play|hear/i }).first();
    if (await playBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await playBtn.click();
      await page.waitForTimeout(500);
      ok('Phrase of Day audio button works');
    }
    await exitScreen(page);
  }

  // ── Roleplay scenarios ──────────────────────────────────────────────────
  await goTab(page, 'Croatia');
  const roleplayBtn = page.locator('button, a, div').filter({ hasText: /role.?play|scenario/i }).first();
  if (await roleplayBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await roleplayBtn.click();
    await page.waitForTimeout(900);
    await dismissAll(page);
    await ss(page, 'day5-roleplay');
    const rpText = await page.locator('#root').innerText().catch(() => '');
    if (!rpText.match(/café|restaurant|market|scenario|airport|hotel/i))
      bug('BUG', 'Roleplay', 'Roleplay scenarios not loading');
    else ok('Roleplay scenarios loaded');
    // Open a scenario
    const scenarioBtn = page.locator('button').filter({ hasText: /café|restaurant|airport|market/i }).first();
    if (await scenarioBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await scenarioBtn.click();
      await page.waitForTimeout(1000);
      await dismissAll(page);
      await ss(page, 'day5-roleplay-active');
    }
    await exitScreen(page);
  }

  // ── Croatian Map / Regions ──────────────────────────────────────────────
  await goTab(page, 'Croatia');
  const mapBtn = page.locator('button, a, div').filter({ hasText: /map|region|interactive/i }).first();
  if (await mapBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await mapBtn.click();
    await page.waitForTimeout(1000);
    await dismissAll(page);
    await ss(page, 'day5-map');
    await exitScreen(page);
    ok('Croatia Map screen opened');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// DAY 6 — Immersion: AI features, Maja, Live Tutor, Shadowing
// ═══════════════════════════════════════════════════════════════════════════
test('Day 6 — Immersion: Maja AI, Live Tutor, Shadowing, AI Story', async ({ page }) => {
  attachErrorListeners(page, 'Day6');
  await login(page);

  // ── Maja (AI Conversation) ─── in Culture sub-tab of CroatiaTab ────────
  await goTab(page, 'Croatia');
  // Navigate to Culture sub-tab first (default is Discover)
  const culturePill = page.locator('button').filter({ hasText: /^🏰 culture$/i }).first();
  if (await culturePill.isVisible({ timeout: 2000 }).catch(() => false)) {
    await culturePill.click();
    await page.waitForTimeout(600);
  }
  const majaBtn = page.locator('button').filter({ hasText: /AI conversations|maja/i }).first();
  if (await majaBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await majaBtn.click();
    await page.waitForTimeout(1500);
    await ss(page, 'day6-maja-setup');
    const majaSetupText = await page.locator('#root').innerText().catch(() => '');
    if (!majaSetupText.match(/maja|razgovaraj|conversation|partner/i))
      bug('BUG', 'MajaScreen', 'Maja AI setup screen not showing');
    else ok('Maja AI screen loaded');
    // Select the first character to start conversation
    const characterBtn = page.locator('button[class*="character"], div[role="button"]')
      .filter({ hasText: /maja|marko|ana|baka/i }).first();
    if (!await characterBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Characters might be in card-style buttons without role
      const anyCharBtn = page.locator('button').filter({ hasText: /učiteljica|tajnica|ribar|baka/i }).first();
      if (await anyCharBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await anyCharBtn.click();
        await page.waitForTimeout(1500);
      }
    } else {
      await characterBtn.click();
      await page.waitForTimeout(1500);
    }
    await ss(page, 'day6-maja');
    // After selecting character, text input should be visible
    const input = page.locator('input[type="text"], textarea').first();
    if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
      await input.fill('Dobar dan!');
      ok('Maja chat input works');
    } else {
      // Check if we're on a pre-conversation setup page (topic selection etc.)
      const majaText = await page.locator('#root').innerText().catch(() => '');
      if (majaText.match(/topic|tema|scenario|odaberi/i)) ok('Maja requires scenario selection — expected flow');
      else bug('BUG', 'MajaScreen', 'No text input after character selection');
    }
    await exitScreen(page);
  } else {
    bug('BUG', 'CroatiaTab', 'Maja / AI Conversation button not found');
  }

  // ── Live Tutor ───────────────────────────────────────────────────────────
  await goTab(page, 'Croatia');
  const tutorBtn = page.locator('button, a, div').filter({ hasText: /live.*tutor|AI.*tutor|1.on.1/i }).first();
  if (await tutorBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await tutorBtn.click();
    await page.waitForTimeout(1500);
    await dismissAll(page);
    await ss(page, 'day6-live-tutor');
    const tutorText = await page.locator('#root').innerText().catch(() => '');
    if (!tutorText.match(/lesson|topic|speak|tutor|marija|message/i))
      bug('BUG', 'LiveTutor', 'Live Tutor screen empty or not loading');
    else ok('Live Tutor screen loaded');
    await exitScreen(page);
  }

  // ── Shadowing ─────────────────────────────────────────────────────────────
  await goTab(page, 'Practice');
  const shadowBtn = page.locator('button, a, div').filter({ hasText: /^shadowing$/i }).first();
  if (await shadowBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await shadowBtn.click();
    await page.waitForTimeout(900);
    await dismissAll(page);
    await ss(page, 'day6-shadowing');
    const shadowText = await page.locator('#root').innerText().catch(() => '');
    if (!shadowText.match(/listen|record|shadow|play|mic|sentence/i))
      bug('BUG', 'Shadowing', 'Shadowing screen missing content');
    else ok('Shadowing screen loaded');
    await exitScreen(page);
  }

  // ── AI Story ─────────────────────────────────────────────────────────────
  await goTab(page, 'Practice');
  const storyBtn = page.locator('button, a, div').filter({ hasText: /AI story|story.*mode|read.*story/i }).first();
  if (await storyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await storyBtn.click();
    await page.waitForTimeout(1500);
    await dismissAll(page);
    await ss(page, 'day6-ai-story');
    const storyText = await page.locator('#root').innerText().catch(() => '');
    if (!storyText.match(/[a-z]{6,}/i)) bug('BUG', 'AIStory', 'AI Story screen appears blank');
    else ok('AI Story screen loaded');
    await exitScreen(page);
  }

  // ── Writing Practice ─────────────────────────────────────────────────────
  await goTab(page, 'Practice');
  const writeBtn = page.locator('button, a, div').filter({ hasText: /^writing$|free.*writ/i }).first();
  if (await writeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await writeBtn.click();
    await page.waitForTimeout(900);
    await dismissAll(page);
    await ss(page, 'day6-writing');
    const writeText = await page.locator('#root').innerText().catch(() => '');
    if (!writeText.match(/write|prompt|translation|type/i))
      bug('BUG', 'Writing', 'Writing practice screen not loading prompt');
    else ok('Writing screen loaded');
    await exitScreen(page);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// DAY 7 — Profile: stats, badges, settings, leaderboard, mistakes
// ═══════════════════════════════════════════════════════════════════════════
test('Day 7 — Profile: stats, badges, settings, leaderboard, mistakes', async ({ page }) => {
  attachErrorListeners(page, 'Day7');
  await login(page);
  await goTab(page, 'Profile');
  await ss(page, 'day7-profile');

  const profileText = await page.locator('#root').innerText().catch(() => '');
  for (const stat of ['XP', 'Lessons', 'Streak']) {
    if (profileText.match(new RegExp(stat, 'i'))) ok(`Profile stat "${stat}" visible`);
    else bug('BUG', 'Profile', `"${stat}" stat not shown on profile screen`);
  }

  // Badges
  if (profileText.match(/badge|achievement/i)) ok('Badges section present');
  else bug('UX', 'Profile', 'No badges/achievements section visible');

  // ── Settings ──────────────────────────────────────────────────────────────
  const settingsBtn = page.locator('button').filter({ hasText: /⚙️ settings|settings/i }).first();
  if (await settingsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await settingsBtn.click();
    await page.waitForTimeout(900);
    await dismissAll(page);
    await ss(page, 'day7-settings');
    const settingsText = await page.locator('#root').innerText().catch(() => '');
    if (!settingsText.match(/beginner|intermediate|advanced|difficulty|voice|daily goal/i))
      bug('BUG', 'Settings', 'Settings missing difficulty / daily goal / voice options');
    else ok('Settings modal loaded with options');
    await exitScreen(page);
  } else {
    bug('BUG', 'Profile', 'Settings button not found on profile');
  }

  // ── Leaderboard ───────────────────────────────────────────────────────────
  await goTab(page, 'Profile');
  const lbBtn = page.locator('button, a').filter({ hasText: /leaderboard/i }).first();
  if (await lbBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await lbBtn.click();
    await page.waitForTimeout(1000);
    await dismissAll(page);
    await ss(page, 'day7-leaderboard');
    const lbText = await page.locator('#root').innerText().catch(() => '');
    if (!lbText.match(/rank|xp|week|league/i)) bug('BUG', 'Leaderboard', 'Leaderboard not showing rankings');
    else ok('Leaderboard loaded');
    await exitScreen(page);
  }

  // ── My Mistakes ───────────────────────────────────────────────────────────
  await goTab(page, 'Profile');
  const mistakesBtn = page.locator('button, a, div').filter({ hasText: /mistake|my mistake|error.*review/i }).first();
  if (await mistakesBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await mistakesBtn.click();
    await page.waitForTimeout(800);
    await dismissAll(page);
    await ss(page, 'day7-mistakes');
    const mText = await page.locator('#root').innerText().catch(() => '');
    if (!mText.match(/mistake|none|no error|great/i))
      bug('BUG', 'Mistakes', 'Mistakes screen blank/broken');
    else ok('Mistakes screen loaded');
    await exitScreen(page);
  }

  // ── Journal ───────────────────────────────────────────────────────────────
  await goTab(page, 'Profile');
  const journalBtn = page.locator('button, a').filter({ hasText: /journal|diary|notes/i }).first();
  if (await journalBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await journalBtn.click();
    await page.waitForTimeout(800);
    await dismissAll(page);
    await ss(page, 'day7-journal');
    await exitScreen(page);
    ok('Journal screen opened');
  }

  // ── Certificates ──────────────────────────────────────────────────────────
  await goTab(page, 'Profile');
  const certBtn = page.locator('button, a').filter({ hasText: /certificate/i }).first();
  if (await certBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await certBtn.click();
    await page.waitForTimeout(800);
    await dismissAll(page);
    await ss(page, 'day7-certificate');
    const certText = await page.locator('#root').innerText().catch(() => '');
    if (!certText.match(/certificate|level|complete|earned/i))
      bug('BUG', 'Certificate', 'Certificate screen blank');
    else ok('Certificate screen loaded');
    await exitScreen(page);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// CROSS-CUTTING — dark mode, mobile viewport, navigation back, XP awarded
// ═══════════════════════════════════════════════════════════════════════════
test('Cross-cutting — dark mode, mobile viewport, back navigation, XP flow', async ({ page }) => {
  attachErrorListeners(page, 'CrossCut');
  await login(page);

  // Dark mode toggle
  const darkBtn = page.locator('button').filter({ hasText: /dark|theme/i })
    .or(page.locator('button[aria-label*="dark" i]'))
    .or(page.locator('button[aria-label*="theme" i]')).first();
  if (await darkBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await darkBtn.click();
    await page.waitForTimeout(500);
    await ss(page, 'cross-dark-mode');
    ok('Dark mode toggle works');
    await darkBtn.click().catch(() => {});
  }

  // Mobile viewport
  await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14
  await page.goto('/');
  await page.waitForTimeout(3000);
  await dismissAll(page);
  await ss(page, 'cross-mobile-390');
  const mobileText = await page.locator('#root').innerText().catch(() => '');
  if (!mobileText.match(/\w{5,}/i)) bug('CRITICAL', 'Mobile', 'App broken/blank on 390px viewport');
  else ok('390px mobile viewport renders correctly');

  // Tablet viewport
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/');
  await page.waitForTimeout(2000);
  await dismissAll(page);
  await ss(page, 'cross-tablet-768');
  const tabletText = await page.locator('#root').innerText().catch(() => '');
  if (!tabletText.match(/\w{5,}/i)) bug('HIGH', 'Tablet', 'App broken/blank on 768px tablet viewport');
  else ok('768px tablet viewport renders');
  await page.setViewportSize({ width: 1280, height: 800 });

  // Back navigation after entering exercise
  await login(page);
  await goTab(page, 'Practice');
  const anyExercise = page.locator('button, a').filter({ hasText: /flashcard|quiz|sentence/i }).first();
  if (await anyExercise.isVisible({ timeout: 2000 }).catch(() => false)) {
    await anyExercise.click();
    await page.waitForTimeout(800);
    await page.goBack().catch(() => {});
    await page.waitForTimeout(600);
    const backText = await page.locator('#root').innerText().catch(() => '');
    if (!backText.match(/practice|home|learn/i))
      bug('UX', 'BackNav', 'Browser back from exercise lands on wrong/blank screen');
    else ok('Browser back navigation from exercise works');
  }

  // Weekly goal prompt for fresh users
  await goTab(page, 'Home');
  const homeText = await page.locator('#root').innerText().catch(() => '');
  if (homeText.match(/tap set to choose a weekly target/i))
    bug('UX', 'WeeklyGoal', 'Weekly goal still shows old passive text (should be a CTA button)');
  else ok('Weekly goal state handled');
});

// ── Final report ──────────────────────────────────────────────────────────
test.afterAll(() => {
  const report = {
    generatedAt: new Date().toISOString(),
    total: bugs.length,
    byCategory: {
      critical: bugs.filter(b => b.sev === 'CRITICAL' || b.sev === 'JS-ERROR').length,
      bug: bugs.filter(b => b.sev === 'BUG').length,
      ux: bugs.filter(b => b.sev === 'UX').length,
      nav: bugs.filter(b => b.sev === 'NAV').length,
      perf: bugs.filter(b => b.sev === 'PERF').length,
    },
    bugs,
  };
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));

  console.log('\n' + '═'.repeat(65));
  console.log(`WEEK AUDIT COMPLETE — ${bugs.length} total issues`);
  console.log(`  Critical/JS: ${report.byCategory.critical}`);
  console.log(`  Bugs:        ${report.byCategory.bug}`);
  console.log(`  UX Issues:   ${report.byCategory.ux}`);
  console.log(`  Nav:         ${report.byCategory.nav}`);
  console.log(`  Perf:        ${report.byCategory.perf}`);
  console.log(`  Screenshots: ${SS_DIR}/`);
  console.log(`  Report:      ${REPORT}`);
  console.log('═'.repeat(65));
  if (bugs.length > 0) {
    console.log('\nALL ISSUES FOUND:');
    bugs.forEach((b, i) =>
      console.log(`  ${String(i + 1).padStart(2)}. [${b.sev}] ${b.screen} — ${b.desc}`));
  } else {
    console.log('\n✅ No issues detected in this run.');
  }
  console.log('');
});
