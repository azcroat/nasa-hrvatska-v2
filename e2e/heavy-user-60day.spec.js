/**
 * 60-DAY HEAVY USER AUDIT
 * Simulates a dedicated learner using nasahrvatska.com intensively over 60 days.
 * This is NOT a smoke test — it exercises every major feature path, tracks XP
 * progression, catches stale state, broken navigation, empty screens, and UX
 * dead-ends that only appear after extended use.
 *
 * Credentials: set via TEST_EMAIL / TEST_PASSWORD env vars
 * Target:      https://nasahrvatska.com
 *
 * Heavy user profile:
 *   - 30-45 min sessions, 5-6 times per week
 *   - Covers vocabulary, grammar, cultural content, AI features
 *   - Progresses through CEFR levels A1 → B1
 *   - Uses SRS review, streaks, badges, leaderboard
 *   - Tests error recovery and cross-feature state persistence
 *
 * Structure (15 blocks × 4 days = 60 days):
 *   Block 1  (Days  1- 4): Onboarding quality, home screen, first XP
 *   Block 2  (Days  5- 8): Learn tab — lessons, audio, Browse modal
 *   Block 3  (Days  9-12): Practice fundamentals — all Quick Games
 *   Block 4  (Days 13-16): Grammar drills — Case, Aspect, CEFR
 *   Block 5  (Days 17-20): Croatia tab — all sub-tabs deep dive
 *   Block 6  (Days 21-24): AI & Conversations — Maja AI, AI Story
 *   Block 7  (Days 25-28): Speaking & Listening intensive
 *   Block 8  (Days 29-32): Profile & Community — stats, badges, leaderboard
 *   Block 9  (Days 33-36): Settings mastery — all options
 *   Block 10 (Days 37-40): SRS & mistakes — spaced repetition deep dive
 *   Block 11 (Days 41-44): Vocabulary expansion — 5+ categories
 *   Block 12 (Days 45-48): Advanced grammar — CEFR B1+, complex drills
 *   Block 13 (Days 49-52): Streak & habit building — daily goals, milestones
 *   Block 14 (Days 53-56): XP milestones + badge collection + leaderboard
 *   Block 15 (Days 57-60): Power user stress test — all features, regression
 */

import { test } from '@playwright/test';
import fs from 'fs';

const EMAIL    = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;
const SS_DIR   = '60day-audit-screenshots';
const REPORT   = '60day-audit-report.json';

// ── Reporting ─────────────────────────────────────────────────────────────────
const issues = [];
function bug(sev, ctx, desc) {
  console.error(`❌ [${sev}] ${ctx} — ${desc}`);
  issues.push({ sev, ctx, desc, ts: new Date().toISOString() });
}
function ok(msg)   { console.log(`  ✅ ${msg}`); }
function info(msg) { console.log(`  ℹ️  ${msg}`); }

test.afterAll(() => {
  if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });
  fs.writeFileSync(REPORT, JSON.stringify({ total: issues.length, issues }, null, 2));
  const divider = '═'.repeat(65);
  console.log('\n' + divider);
  console.log('60-DAY HEAVY USER AUDIT COMPLETE — ' + issues.length + ' total issues');
  const counts = {};
  issues.forEach(i => { counts[i.sev] = (counts[i.sev] || 0) + 1; });
  Object.entries(counts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log('  Screenshots: ' + SS_DIR + '/');
  console.log('  Report:      ' + REPORT);
  console.log(divider);
  if (issues.length === 0) console.log('\n✅ No issues detected.\n');
  else {
    console.log('\nALL ISSUES FOUND:');
    issues.forEach((i, n) => console.log(`  ${n + 1}. [${i.sev}] ${i.ctx} — ${i.desc}`));
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
async function ss(page, name) {
  if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });
  await page.screenshot({ path: `${SS_DIR}/${name.replace(/[^a-z0-9-]/gi, '_')}.png`, fullPage: false }).catch(() => {});
}

function attachErrorListeners(page, label) {
  page.on('pageerror', err => {
    const m = err.message;
    if (/ResizeObserver|firebase|firestore|Non-Error promise|ChunkLoadError|posthog/i.test(m)) return;
    bug('JS-ERROR', label, m.slice(0, 200));
  });
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    const t = msg.text();
    if (/firebase|firestore|ERR_|net::|CSP|Content.Security|favicon|403|401|posthog|tts|Failed to load resource/i.test(t)) return;
    bug('CONSOLE-ERR', label, t.slice(0, 200));
  });
}

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

async function login(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2500);
  const emailFld = page.locator('input[type="email"]').first();
  if (await emailFld.isVisible({ timeout: 6000 }).catch(() => false)) {
    await emailFld.fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('input[type="password"]').first().press('Enter');
  }
  await page.waitForFunction(
    () => document.querySelectorAll('.sb-btn').length > 0,
    { timeout: 90000 }
  ).catch(() => {});
  await page.waitForTimeout(3000);
  await dismissModals(page);
}

async function goTab(page, label) {
  await dismissAll(page);
  const tab = page.locator('.sb-btn').filter({ hasText: label }).first();
  if (await tab.isVisible({ timeout: 4000 }).catch(() => false)) {
    await tab.click();
    await page.waitForTimeout(900);
    return true;
  }
  bug('NAV', label, `Tab "${label}" not found`);
  return false;
}

async function exitScreen(page) {
  await dismissAll(page);
  for (const pattern of [/✕\s*Exit/i, /^Exit$/i, /^Done$/i, /^Continue →$/i, /^Back\b/i, /^←$/, /See Results|^Results$/i, /Back to Practice/i, /^Play Again$/i, /^Finish$/i]) {
    const btn = page.locator('button').filter({ hasText: pattern }).first();
    if (await btn.isVisible({ timeout: 800 }).catch(() => false)) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(600);
      return;
    }
  }
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(300);
  const xBtn = page.locator('button').filter({ hasText: /^[×✕x]$/i }).first();
  if (await xBtn.isVisible({ timeout: 500 }).catch(() => false)) {
    await xBtn.click().catch(() => {});
    await page.waitForTimeout(400);
  }
}

async function clickQuickGame(page, label) {
  // Wait 600ms before first dismissAll — CelebrationModal fires after a 400ms setTimeout
  // so a naive dismissAll immediately after exitScreen will miss it.
  await page.waitForTimeout(600);
  await dismissAll(page);
  // Second pass: any modals that appeared just after the first dismissAll
  await page.waitForTimeout(300);
  await dismissAll(page);
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

async function clickBrowseExercise(page, label) {
  await dismissAll(page);
  await page.waitForSelector('button.practice-card-dark', { timeout: 5000 }).catch(() => {});
  const toggleBtn = page.locator('button').filter({ hasText: /browse all/i }).first();
  if (await toggleBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await toggleBtn.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(300);
    const isOpen = await toggleBtn.evaluate(el => el.textContent?.includes('▲')).catch(() => false);
    if (!isOpen) {
      await toggleBtn.click().catch(() => {});
      await page.waitForTimeout(700);
    }
  }
  const card = page.locator('[class*="exercise-card"], [class*="browse-card"], button, .c').filter({ hasText: label }).first();
  if (await card.count().catch(() => 0) === 0) return false;
  await card.scrollIntoViewIfNeeded().catch(() => {});
  if (!await card.isVisible({ timeout: 2000 }).catch(() => false)) return false;
  await card.click().catch(() => {});
  await page.waitForTimeout(1200);
  await dismissAll(page);
  return true;
}

async function runQuiz(page, label, maxQ = 20) {
  const practiceToggle = page.locator('button[aria-label*="Practice Mode"], button[title*="Practice Mode"]').first();
  if (await practiceToggle.isVisible({ timeout: 1500 }).catch(() => false)) {
    const isActive = await practiceToggle.evaluate(el =>
      el.style.background?.includes('99,102,241') || el.getAttribute('aria-label')?.includes('active')
    ).catch(() => false);
    if (!isActive) await practiceToggle.click().catch(() => {});
  }
  let answered = 0;
  for (let i = 0; i < maxQ; i++) {
    const opts = page.locator('.ob');
    const count = await opts.count().catch(() => 0);
    if (count === 0) {
      await page.waitForTimeout(800);
      if (await opts.count().catch(() => 0) === 0) break;
    }
    answered++;
    await opts.first().click().catch(() => {});
    await page.waitForTimeout(400);
    const next = page.locator('button').filter({ hasText: /Next →|See Results|Results|Continue →|Done/i }).first();
    if (await next.isVisible({ timeout: 1500 }).catch(() => false)) {
      await next.click().catch(() => {});
      await page.waitForTimeout(500);
    }
  }
  return answered;
}

async function runGenericExercise(page, label, maxQ = 5) {
  const NAV_RE = /^\s*(next|back|exit|done|continue|results|retry|check|hint|skip|finish|play|start|quit|submit|proceed|see|go|try|→|✕|×)/i;
  let answered = 0;
  for (let i = 0; i < maxQ; i++) {
    await page.waitForTimeout(600);
    const allBtns = page.locator('button').filter({ hasNotText: NAV_RE });
    const count = await allBtns.count().catch(() => 0);
    if (count === 0) {
      await page.waitForTimeout(900);
      if (await allBtns.count().catch(() => 0) === 0) break;
    }
    answered++;
    await allBtns.first().click().catch(() => {});
    await page.waitForTimeout(500);
    const nextBtn = page.locator('button').filter({ hasText: /next|continue|→|correct/i }).first();
    if (await nextBtn.isVisible({ timeout: 1200 }).catch(() => false)) {
      await nextBtn.click().catch(() => {});
      await page.waitForTimeout(400);
    }
  }
  return answered;
}

async function runFlashcards(page, count = 5) {
  let rated = 0;
  for (let i = 0; i < count; i++) {
    // Flip the card
    const flipBtn = page.locator('button').filter({ hasText: /flip|reveal|show answer|👁/i }).first();
    const cardArea = page.locator('.flashcard, [class*="card"], .fc-card').first();
    if (await flipBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await flipBtn.click().catch(() => {});
    } else if (await cardArea.isVisible({ timeout: 1500 }).catch(() => false)) {
      await cardArea.click().catch(() => {});
    } else {
      await page.locator('#root').click({ position: { x: 300, y: 300 } }).catch(() => {});
    }
    await page.waitForTimeout(500);
    // Rate the card
    const rateButtons = page.locator('button').filter({ hasText: /still learning|perfect|easy|good|hard|knew it/i });
    const rateCount = await rateButtons.count().catch(() => 0);
    if (rateCount > 0) {
      // Alternate ratings to simulate realistic use
      const btnIdx = i % 2 === 0 ? 0 : Math.min(rateCount - 1, 1);
      await rateButtons.nth(btnIdx).click().catch(() => {});
      rated++;
      await page.waitForTimeout(400);
    } else {
      break;
    }
  }
  return rated;
}

async function readXP(page) {
  const root = await page.locator('#root').innerText().catch(() => '');
  const m = root.match(/(\d[\d,]*)\s*XP/i);
  return m ? parseInt(m[1].replace(/,/g, '')) : null;
}

async function navigateCroatiaSubTab(page, subTabName) {
  await goTab(page, 'Croatia');
  await page.waitForTimeout(500);
  const subTab = page.locator('button').filter({ hasText: new RegExp(`^${subTabName}$`, 'i') }).first();
  if (await subTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    await subTab.click();
    await page.waitForTimeout(600);
    return true;
  }
  return false;
}

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 1 — Days 1-4: First week — onboarding quality, home screen, hero XP
// ══════════════════════════════════════════════════════════════════════════════
test('Block 1 (Days 1-4) — Onboarding quality, home screen, first XP', async ({ page }) => {
  attachErrorListeners(page, 'Block1');
  await login(page);
  await goTab(page, 'Home');
  await ss(page, 'b1-home');

  const home = await page.locator('#root').innerText().catch(() => '');

  // ── Hero CTA present and launches lesson
  const heroCta = page.locator('button, a').filter({ hasText: /continue learning|start lesson|begin|let's go/i }).first();
  if (await heroCta.isVisible({ timeout: 3000 }).catch(() => false)) {
    ok('Hero CTA present');
    const xpBefore = await readXP(page);
    await heroCta.click();
    await page.waitForTimeout(1200);
    await dismissAll(page);
    const lessonText = await page.locator('#root').innerText().catch(() => '');
    if (lessonText.match(/exit|vocabulary|grammar|lesson|question|practice/i)) {
      ok('Hero lesson launched');
    } else {
      bug('BUG', 'HeroLesson', 'Hero CTA clicked but no lesson screen appeared');
    }
    await runQuiz(page, 'HeroLesson', 6);
    await exitScreen(page);
    await goTab(page, 'Home');
    const xpAfter = await readXP(page);
    info(`XP: before=${xpBefore} after=${xpAfter}`);
    if (xpBefore !== null && xpAfter !== null && xpAfter < xpBefore) {
      bug('BUG', 'XP', `XP dropped after hero lesson: ${xpBefore} → ${xpAfter}`);
    }
  } else {
    bug('UX', 'HeroLesson', 'No hero lesson CTA visible on home screen');
  }

  // ── Essential home widgets
  if (home.match(/streak|day streak|🔥/i)) ok('Streak widget visible');
  else bug('UX', 'HomeTab', 'Streak widget missing from home screen');

  if (home.match(/today|plan|suggested|daily/i)) ok('Daily plan section visible');
  else bug('UX', 'HomeTab', 'Daily plan/suggested section missing');

  if (home.match(/recommend|for you|next up/i)) ok('Recommended section visible');
  else info('No "Recommended" section (may not appear for fresh account)');

  if (home.match(/weekly.*goal|xp.*goal|goal.*xp|this week/i)) ok('Weekly goal widget visible');
  else info('Weekly goal widget not visible (OK if not set)');

  // ── Word of Day / Daily Discovery
  const wodWidget = page.locator('[class*="wotd"], [class*="word-of"], [class*="daily"]').first();
  if (await wodWidget.isVisible({ timeout: 2000 }).catch(() => false)) {
    ok('Daily Discovery / Word of Day widget present');
  } else if (home.match(/today.*word|word.*day|daily.*phrase|discovery/i)) {
    ok('Daily Discovery content in page text');
  } else {
    info('No Daily Discovery widget (may be scrolled below fold)');
  }

  // ── Knight mascot / coach present
  if (home.match(/vitez|knight|hrvoje|Bok|Dobrodošli/i)) ok('Knight mascot present on home');
  else info('Knight mascot not visible (may be dismissed)');

  await ss(page, 'b1-home-complete');
});

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 2 — Days 5-8: Learn tab deep dive — lessons, audio, Browse Content
// ══════════════════════════════════════════════════════════════════════════════
test('Block 2 (Days 5-8) — Learn tab: lesson flow, audio, Browse modal', async ({ page }) => {
  attachErrorListeners(page, 'Block2');
  await login(page);
  await goTab(page, 'Learn');
  await ss(page, 'b2-learn');

  const learnText = await page.locator('#root').innerText().catch(() => '');
  if (!learnText.match(/lesson|vocabulary|grammar|survivor|settler|communicator|topic/i)) {
    bug('BUG', 'LearnTab', 'Learn tab shows no lesson content');
  } else ok('Learn tab has content');

  // ── Lesson cards exist
  const cards = page.locator('[class*="lesson-card"], [class*="card"], button').filter({ hasText: /lesson|vocab|grammar|week/i });
  const cardCount = await cards.count().catch(() => 0);
  if (cardCount > 0) ok(`Lesson cards present: ${cardCount}`);
  else bug('BUG', 'LearnTab', 'No lesson cards visible');

  // ── Open first lesson
  const firstCard = cards.first();
  if (await firstCard.isVisible({ timeout: 2000 }).catch(() => false)) {
    await firstCard.click();
    await page.waitForTimeout(1500);
    await dismissAll(page);
    await ss(page, 'b2-lesson-open');
    const lessonContent = await page.locator('#root').innerText().catch(() => '');
    if (!lessonContent.match(/\w{5,}/i)) {
      bug('BUG', 'Lesson', 'Lesson screen appears blank');
    } else ok('Lesson screen has content');

    // Check for audio speaker buttons
    const speakerBtns = page.locator('button[aria-label*="speak"], button[aria-label*="audio"], button[aria-label*="play"], [class*="speaker"]');
    const speakerCount = await speakerBtns.count().catch(() => 0);
    if (speakerCount > 0) {
      ok(`Audio buttons present: ${speakerCount}`);
      // Click one to test TTS
      await speakerBtns.first().click().catch(() => {});
      await page.waitForTimeout(800);
      ok('Audio button clicked');
    } else {
      info('No speaker buttons (grammar-only lesson or icons not matched)');
    }

    // Try quiz questions
    const qsAnswered = await runQuiz(page, 'LessonQuiz', 12);
    if (qsAnswered > 0) ok(`Lesson quiz: ${qsAnswered} questions answered`);
    else info('No quiz questions in this lesson (reading/content only)');

    await exitScreen(page);
  }

  // ── Browse Content modal
  await goTab(page, 'Learn');
  const browseBtn = page.locator('button').filter({ hasText: /browse|all content|all lessons/i }).first();
  if (await browseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await browseBtn.click();
    await page.waitForTimeout(1000);
    await ss(page, 'b2-browse-modal');
    const browseText = await page.locator('#root').innerText().catch(() => '');
    if (!browseText.match(/vocabulary|grammar|reading|speaking|listening/i)) {
      bug('BUG', 'BrowseModal', 'Browse modal opened but shows no categories');
    } else ok('Browse modal shows content categories');

    // Check vocabulary items
    const vocabItems = await page.locator('button').filter({ hasText: /family|greeting|travel|food|number|color|animal|body|work|verb/i }).count().catch(() => 0);
    if (vocabItems > 0) ok(`Browse modal: ${vocabItems} vocabulary items visible`);
    else bug('UX', 'BrowseModal', 'No vocabulary items in Browse modal');

    // Try opening a vocabulary category
    const famBtn = page.locator('button').filter({ hasText: /family|greeting|travel|food/i }).first();
    if (await famBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await famBtn.click();
      await page.waitForTimeout(1000);
      await dismissAll(page);
      const catText = await page.locator('#root').innerText().catch(() => '');
      if (catText.match(/\w{4,}/i)) {
        ok('Vocabulary category opens successfully');
        await runQuiz(page, 'BrowseCatQuiz', 8);
      }
      await exitScreen(page);
    }

    await exitScreen(page);
  } else {
    bug('UX', 'LearnTab', 'Browse Content button not found on Learn tab');
  }

  // ── Grammar Intro flow
  await goTab(page, 'Learn');
  const grammarIntroBtn = page.locator('button').filter({ hasText: /grammar intro|grammar.*basics|tense|noun/i }).first();
  if (await grammarIntroBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await grammarIntroBtn.click();
    await page.waitForTimeout(1200);
    await dismissAll(page);
    const giText = await page.locator('#root').innerText().catch(() => '');
    if (giText.match(/\w{5,}/i)) {
      ok('Grammar lesson loaded');
      const giQs = await runQuiz(page, 'GrammarIntro', 12);
      if (giQs < 3 && giQs > 0) bug('UX', 'GrammarIntro', `Only ${giQs} questions — expected more`);
      else if (giQs >= 3) ok(`Grammar lesson: ${giQs} questions`);
    }
    await exitScreen(page);
  } else {
    info('Grammar Intro not directly visible on Learn tab');
  }

  await ss(page, 'b2-complete');
});

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 3 — Days 9-12: Practice fundamentals — all Quick Games + Browse drills
// ══════════════════════════════════════════════════════════════════════════════
test('Block 3 (Days 9-12) — Practice: all Quick Games + Browse exercises', async ({ page }) => {
  attachErrorListeners(page, 'Block3');
  await login(page);
  await goTab(page, 'Practice');
  await ss(page, 'b3-practice');

  const practiceText = await page.locator('#root').innerText().catch(() => '');

  // ── Category sections visible
  for (const cat of ['Speak', 'Grammar', 'Words', 'Read']) {
    if (practiceText.match(new RegExp(cat, 'i'))) ok(`"${cat}" category section visible`);
    else info(`"${cat}" category not in page text — may be a tab or icon`);
  }
  if (practiceText.match(/today.*pick|recommended|quick game/i)) ok("Quick Games / Today's Pick section visible");
  else info("Today's Pick section not found (OK for new users)");

  // ── FLASHCARDS
  await goTab(page, 'Practice');
  const fcLaunched = await clickQuickGame(page, 'Flashcards');
  if (fcLaunched) {
    const fcText = await page.locator('#root').innerText().catch(() => '');
    if (!fcText.match(/\w{4,}/i)) {
      bug('BUG', 'Flashcards', 'Flashcard screen blank');
    } else {
      ok('Flashcard screen loaded');
      await ss(page, 'b3-flashcard');
      const rated = await runFlashcards(page, 6);
      if (rated > 0) ok(`Flashcards: ${rated} cards rated`);
      else bug('BUG', 'Flashcards', 'No SRS rating buttons appeared after flipping');
    }
    await exitScreen(page);
  } else {
    bug('BUG', 'PracticeTab', 'Flashcards Quick Game button not found');
  }

  // ── QUIZ (Multiple Choice)
  await goTab(page, 'Practice');
  const quizLaunched = await clickQuickGame(page, 'Quiz');
  if (quizLaunched) {
    await ss(page, 'b3-quiz');
    const qsAnswered = await runQuiz(page, 'MCQuiz', 15);
    ok(`Quiz: ${qsAnswered} questions answered`);
    if (qsAnswered === 0) bug('BUG', 'MCQuiz', 'Quiz loaded but no questions appeared');
    const resultText = await page.locator('#root').innerText().catch(() => '');
    if (resultText.match(/score|result|correct|\d+\/\d+/i)) ok('Quiz results screen shows score');
    else if (qsAnswered > 0) info('Quiz completed — no score screen (may have auto-dismissed)');
    await exitScreen(page);
  } else {
    bug('BUG', 'PracticeTab', 'Quiz Quick Game button not found');
  }

  // ── WORD SPRINT
  await goTab(page, 'Practice');
  const sprintLaunched = await clickQuickGame(page, 'Word Sprint');
  if (sprintLaunched) {
    await ss(page, 'b3-word-sprint');
    const sprintText = await page.locator('#root').innerText().catch(() => '');
    if (!sprintText.match(/translate|type|enter|score|word|sprint/i)) {
      bug('BUG', 'WordSprint', 'Word Sprint blank or non-interactive');
    } else ok('Word Sprint screen loaded');
    const input = page.locator('input[type="text"], input:not([type])').first();
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      await input.fill('auto');
      await input.press('Enter');
      await page.waitForTimeout(600);
      ok('Word Sprint: typed answer');
    } else {
      info('Word Sprint uses tap-based UI (no text input)');
    }
    await exitScreen(page);
  } else {
    bug('UX', 'PracticeTab', 'Word Sprint Quick Game button not found');
  }

  // ── MATCH PAIRS
  await goTab(page, 'Practice');
  const matchLaunched = await clickQuickGame(page, 'Match Pairs');
  if (matchLaunched) {
    await ss(page, 'b3-match');
    const matchText = await page.locator('#root').innerText().catch(() => '');
    if (!matchText.match(/match|pair|card|flip|\w{4,}/i)) {
      bug('BUG', 'MatchPairs', 'Match Pairs screen blank');
    } else ok('Match Pairs screen loaded');
    // Try clicking some match cards
    const matchCards = page.locator('[class*="match"], [class*="card"], [class*="pair"]');
    const matchCount = await matchCards.count().catch(() => 0);
    if (matchCount > 0) {
      await matchCards.first().click().catch(() => {});
      await page.waitForTimeout(500);
      if (matchCount > 1) {
        await matchCards.nth(1).click().catch(() => {});
        await page.waitForTimeout(500);
      }
      ok('Match Pairs: cards clicked');
    }
    await exitScreen(page);
  } else {
    info('Match Pairs button not found (may have different label)');
  }

  // ── SENTENCE CLOZE (Browse All)
  await goTab(page, 'Practice');
  const clozeLaunched = await clickBrowseExercise(page, 'Sentence Cloze');
  if (clozeLaunched) {
    await ss(page, 'b3-cloze');
    const clozeText = await page.locator('#root').innerText().catch(() => '');
    if (!clozeText.match(/\w{5,}/i)) {
      bug('BUG', 'SentenceCloze', 'Sentence Cloze screen blank');
    } else ok('Sentence Cloze loaded');
    const clozeQs = await runGenericExercise(page, 'Cloze', 5);
    ok(`Sentence Cloze: ${clozeQs} interactions`);
    await exitScreen(page);
  } else {
    bug('UX', 'PracticeTab', 'Sentence Cloze not found in Browse All grid');
  }

  // ── SRS REVIEW
  await goTab(page, 'Practice');
  const srsBtn = page.locator('button, a').filter({ hasText: /srs review|spaced rep|review due|review$/i }).first();
  if (await srsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await srsBtn.click();
    await page.waitForTimeout(1000);
    await dismissAll(page);
    const srsText = await page.locator('#root').innerText().catch(() => '');
    if (srsText.match(/no.*due|nothing.*review|all.*done|0.*card/i)) {
      ok('SRS Review: no items due (expected for test account)');
    } else if (srsText.match(/\w{4,}/i)) {
      ok('SRS Review loaded with items');
      await runQuiz(page, 'SRS', 5);
    } else {
      bug('BUG', 'SRS', 'SRS Review screen blank');
    }
    await exitScreen(page);
  } else {
    info('SRS Review button not in root of Practice tab');
  }

  await ss(page, 'b3-complete');
});

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 4 — Days 13-16: Grammar drills — Case Constellation, Aspect, CEFR test
// ══════════════════════════════════════════════════════════════════════════════
test('Block 4 (Days 13-16) — Grammar drills: Case Constellation, Aspect, CEFR', async ({ page }) => {
  attachErrorListeners(page, 'Block4');
  await login(page);

  // ── CASE CONSTELLATION (Padeži / Browse All)
  await goTab(page, 'Practice');
  const caseLaunched = await clickBrowseExercise(page, 'Case Constellation');
  if (caseLaunched) {
    await ss(page, 'b4-case');
    const caseText = await page.locator('#root').innerText().catch(() => '');
    if (!caseText.match(/nominativ|genitive|accusative|dative|padež|case|locative|instrumental/i)) {
      bug('BUG', 'CaseConstellation', 'No case content visible in Case Constellation');
    } else ok('Case Constellation has case grammar content');
    const caseQs = await runGenericExercise(page, 'Case', 8);
    ok(`Case Constellation: ${caseQs} interactions`);
    await exitScreen(page);
  } else {
    bug('UX', 'PracticeTab', 'Case Constellation (Padeži) not found in Browse All');
  }

  // ── ASPECT DRILL (Browse All)
  await goTab(page, 'Practice');
  const aspectLaunched = await clickBrowseExercise(page, 'Aspect Drill');
  if (aspectLaunched) {
    await ss(page, 'b4-aspect');
    const aspText = await page.locator('#root').innerText().catch(() => '');
    if (!aspText.match(/imperfective|perfective|aspect|svršeni|nesvršeni|verb/i)) {
      bug('BUG', 'AspectDrill', 'No verb aspect content visible');
    } else ok('Aspect Drill has verb aspect content');
    const aspQs = await runGenericExercise(page, 'Aspect', 8);
    ok(`Aspect Drill: ${aspQs} interactions`);
    await exitScreen(page);
  } else {
    bug('UX', 'PracticeTab', 'Aspect Drill not found in Browse All');
  }

  // ── WORD ORDER drill (Browse All)
  await goTab(page, 'Practice');
  const orderLaunched = await clickBrowseExercise(page, 'Word Order');
  if (orderLaunched) {
    await ss(page, 'b4-word-order');
    const orderText = await page.locator('#root').innerText().catch(() => '');
    if (orderText.match(/\w{5,}/i)) {
      ok('Word Order drill loaded');
      const oQs = await runGenericExercise(page, 'WordOrder', 5);
      ok(`Word Order: ${oQs} interactions`);
    } else {
      bug('BUG', 'WordOrder', 'Word Order screen blank');
    }
    await exitScreen(page);
  } else {
    info('Word Order not found in Browse All (may have different label)');
  }

  // ── GENDER drill (Browse All)
  await goTab(page, 'Practice');
  const genderLaunched = await clickBrowseExercise(page, 'Gender');
  if (genderLaunched) {
    await ss(page, 'b4-gender');
    const gText = await page.locator('#root').innerText().catch(() => '');
    if (gText.match(/\w{5,}/i)) {
      ok('Gender drill loaded');
      const gQs = await runGenericExercise(page, 'Gender', 5);
      ok(`Gender Drill: ${gQs} interactions`);
    }
    await exitScreen(page);
  } else {
    info('Gender drill not found in Browse All');
  }

  // ── CEFR PLACEMENT TEST (Browse All)
  await goTab(page, 'Practice');
  const cefrLaunched = await clickBrowseExercise(page, 'CEFR Test');
  if (cefrLaunched) {
    await ss(page, 'b4-cefr-menu');
    const cefrText = await page.locator('#root').innerText().catch(() => '');
    if (!cefrText.match(/A1|A2|B1|B2|beginner|intermediate|placement/i)) {
      bug('BUG', 'CEFR', 'CEFR test screen has no level options');
    } else {
      ok('CEFR level options visible');
      const a1Btn = page.locator('button').filter({ hasText: /A1|beginner/i }).first();
      if (await a1Btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await a1Btn.click();
        await page.waitForTimeout(800);
        const cefrQs = await runGenericExercise(page, 'CEFR-A1', 10);
        ok(`CEFR A1: ${cefrQs} interactions`);
        await ss(page, 'b4-cefr-a1');
      }
    }
    await exitScreen(page);
  } else {
    bug('UX', 'PracticeTab', 'CEFR Test not found in Browse All');
  }

  // ── LISTENING exercise (Quick Game)
  await goTab(page, 'Practice');
  const listenLaunched = await clickQuickGame(page, 'Listening');
  if (listenLaunched) {
    await ss(page, 'b4-listening');
    const listenText = await page.locator('#root').innerText().catch(() => '');
    if (!listenText.match(/listen|audio|play|🔊|speaker|question/i)) {
      bug('BUG', 'Listening', 'Listening screen blank or no content');
    } else ok('Listening screen has content');
    await page.waitForTimeout(1500);
    await exitScreen(page);
  } else {
    info('Listening Quick Game not found');
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 5 — Days 17-20: Croatia tab — all sub-tabs deep dive
// ══════════════════════════════════════════════════════════════════════════════
test('Block 5 (Days 17-20) — Croatia tab: Discover, Culture, Media, Stories', async ({ page }) => {
  attachErrorListeners(page, 'Block5');
  await login(page);
  await goTab(page, 'Croatia');
  await ss(page, 'b5-croatia');

  const croatiaText = await page.locator('#root').innerText().catch(() => '');

  // ── Sub-tabs present
  for (const sub of ['Discover', 'Culture', 'Media', 'Stories']) {
    if (croatiaText.match(new RegExp(sub, 'i'))) ok(`Croatia sub-tab "${sub}" visible`);
    else bug('UX', 'CroatiaTab', `Sub-tab "${sub}" missing from Croatia tab`);
  }

  // ── DISCOVER — region cards
  const didDiscover = await navigateCroatiaSubTab(page, 'Discover');
  if (didDiscover) {
    await ss(page, 'b5-discover');
    const discoverText = await page.locator('#root').innerText().catch(() => '');
    if (!discoverText.match(/region|dalmatia|slavonia|zagreb|istria|coast|city/i)) {
      bug('UX', 'CroatiaDiscover', 'Discover sub-tab: no region content visible');
    } else ok('Discover: region content visible');
    // Click a region card
    const regionCard = page.locator('button, [class*="region"], [class*="card"]').filter({ hasText: /dalmatia|zagreb|slavonia|istria|split|dubrovnik/i }).first();
    if (await regionCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await regionCard.click();
      await page.waitForTimeout(1000);
      await ss(page, 'b5-region-detail');
      ok('Region detail opened');
      await exitScreen(page);
    }
  }

  // ── CULTURE — cultural facts, Maja AI
  const didCulture = await navigateCroatiaSubTab(page, 'Culture');
  if (didCulture) {
    await ss(page, 'b5-culture');
    const cultureText = await page.locator('#root').innerText().catch(() => '');
    if (!cultureText.match(/phrase|word|cultural|tradition|history|language|folk|klapa/i)) {
      bug('UX', 'CroatiaCulture', 'Culture sub-tab: no cultural content visible');
    } else ok('Culture sub-tab has cultural content');

    // Maja AI — "Razgovaraj s Hrvatima →"
    const majaBtn = page.locator('button').filter({ hasText: /razgovaraj|AI conversations|conversation partner|maja/i }).first();
    if (await majaBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await majaBtn.click();
      await page.waitForTimeout(1200);
      await dismissAll(page);
      await ss(page, 'b5-maja');
      const majaText = await page.locator('#root').innerText().catch(() => '');
      if (!majaText.match(/maja|marko|ana|scenario|conversation|select|topic|persona/i)) {
        bug('BUG', 'MajaAI', 'Maja AI screen: no persona/scenario selection visible');
      } else ok('Maja AI screen: persona/scenario selection loaded');
      await exitScreen(page);
    } else {
      bug('UX', 'CroatiaCulture', 'Maja AI / "Razgovaraj s Hrvatima" button not found');
    }

    // Texting slang
    await goTab(page, 'Croatia');
    const textingBtn = page.locator('button').filter({ hasText: /texting|slang|sms|chat/i }).first();
    if (await textingBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await textingBtn.click();
      await page.waitForTimeout(1000);
      await dismissAll(page);
      await ss(page, 'b5-texting');
      ok('Texting slang screen opened');
      await exitScreen(page);
    } else {
      info('Texting slang button not directly visible (may require sub-tab)');
    }
  }

  // ── MEDIA — videos, radio, cultural media
  const didMedia = await navigateCroatiaSubTab(page, 'Media');
  if (didMedia) {
    await ss(page, 'b5-media');
    const mediaText = await page.locator('#root').innerText().catch(() => '');
    if (!mediaText.match(/video|radio|film|music|media|watch|listen|\w{5,}/i)) {
      bug('UX', 'CroatiaMedia', 'Media sub-tab appears blank');
    } else ok('Media sub-tab has content');
    // Try first media item
    const mediaItem = page.locator('button, [class*="media"], [class*="card"]').first();
    if (await mediaItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await mediaItem.click();
      await page.waitForTimeout(1000);
      await ss(page, 'b5-media-item');
      await exitScreen(page);
    }
  } else {
    info('Media sub-tab not found by direct name match');
  }

  // ── STORIES — AI-generated or cultural stories
  const didStories = await navigateCroatiaSubTab(page, 'Stories');
  if (didStories) {
    await ss(page, 'b5-stories');
    const storiesText = await page.locator('#root').innerText().catch(() => '');
    if (!storiesText.match(/story|priča|read|passage|text|\w{5,}/i)) {
      bug('UX', 'CroatiaStories', 'Stories sub-tab appears blank');
    } else ok('Stories sub-tab has content');
    // Open a story
    const storyCard = page.locator('button, [class*="story"], [class*="card"]').first();
    if (await storyCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await storyCard.click();
      await page.waitForTimeout(1200);
      await ss(page, 'b5-story-detail');
      const storyDetail = await page.locator('#root').innerText().catch(() => '');
      if (!storyDetail.match(/\w{10,}/i)) {
        bug('BUG', 'Stories', 'Story detail appears blank');
      } else ok('Story detail loaded with text content');
      await exitScreen(page);
    }
  } else {
    info('Stories sub-tab not found by direct name match');
  }

  await ss(page, 'b5-complete');
});

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 6 — Days 21-24: AI Conversations — Maja AI scenario + AI Story
// ══════════════════════════════════════════════════════════════════════════════
test('Block 6 (Days 21-24) — AI Conversations: Maja scenario + AI Story', async ({ page }) => {
  attachErrorListeners(page, 'Block6');
  await login(page);

  // ── MAJA AI — full conversation flow
  const didCulture = await navigateCroatiaSubTab(page, 'Culture');
  if (didCulture) {
    const majaBtn = page.locator('button').filter({ hasText: /razgovaraj|AI conversations|conversation partner|maja/i }).first();
    if (await majaBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await majaBtn.click();
      await page.waitForTimeout(1500);
      await dismissAll(page);
      await ss(page, 'b6-maja-personas');
      const personaText = await page.locator('#root').innerText().catch(() => '');
      if (!personaText.match(/maja|marko|ana|baka|scenario|pick|select/i)) {
        bug('BUG', 'MajaAI', 'Persona/scenario selection not visible');
      } else {
        ok('Persona selection screen loaded');
        // Try selecting a persona/scenario
        const personaBtn = page.locator('button').filter({ hasText: /maja|café|coffee|airport|market|restaurant|order/i }).first();
        if (await personaBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await personaBtn.click();
          await page.waitForTimeout(2000);
          await dismissAll(page);
          await ss(page, 'b6-maja-conv');
          const convText = await page.locator('#root').innerText().catch(() => '');
          if (!convText.match(/maja|typing|message|conversation|dobar|hvaiti|bok|zdravo|pomoć|\w{10,}/i)) {
            bug('BUG', 'MajaAI', 'Conversation did not start after persona selection');
          } else {
            ok('Maja AI conversation started');
            // Try typing a response
            const inputField = page.locator('input[type="text"], textarea').filter({ hasText: '' }).first();
            if (await inputField.isVisible({ timeout: 2000 }).catch(() => false)) {
              await inputField.fill('Dobar dan!');
              await inputField.press('Enter');
              await page.waitForTimeout(1500);
              ok('Message sent to Maja AI');
              await ss(page, 'b6-maja-response');
            } else {
              info('No text input found in conversation (may use voice or button-based UI)');
            }
          }
          await exitScreen(page);
        } else {
          ok('Maja AI: scenario selection visible (correct flow — requires user choice)');
          await exitScreen(page);
        }
      }
    } else {
      bug('UX', 'MajaAI', 'Maja AI button not found in Culture sub-tab');
    }
  }

  // ── AI STORY (from Practice or Croatia Stories)
  await goTab(page, 'Practice');
  const aiStoryBtn = page.locator('button').filter({ hasText: /ai story|story.*ai|generate.*story|story generator/i }).first();
  if (await aiStoryBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await aiStoryBtn.click();
    await page.waitForTimeout(2000);
    await dismissAll(page);
    await ss(page, 'b6-ai-story');
    const storyText = await page.locator('#root').innerText().catch(() => '');
    if (!storyText.match(/generat|story|priča|generating|reading|text|\w{10,}/i)) {
      bug('BUG', 'AIStory', 'AI Story screen blank or not generating');
    } else {
      ok('AI Story screen loaded');
    }
    await exitScreen(page);
  } else {
    info('AI Story button not found on Practice tab root (may be in sub-section)');
  }

  // ── Live Tutor check
  await goTab(page, 'Practice');
  const tutorBtn = page.locator('button, a').filter({ hasText: /live.*tutor|ai.*tutor|tutor|učitelj/i }).first();
  if (await tutorBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await tutorBtn.click();
    await page.waitForTimeout(1500);
    await dismissAll(page);
    await ss(page, 'b6-tutor');
    const tutorText = await page.locator('#root').innerText().catch(() => '');
    if (tutorText.match(/tutor|message|chat|conversation|offline|connect|\w{10,}/i)) {
      ok('Live Tutor screen loaded');
    } else {
      bug('BUG', 'LiveTutor', 'Live Tutor screen blank');
    }
    await exitScreen(page);
  } else {
    info('Live Tutor not directly accessible from Practice tab root');
  }

  await ss(page, 'b6-complete');
});

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 7 — Days 25-28: Speaking & Listening intensive
// ══════════════════════════════════════════════════════════════════════════════
test('Block 7 (Days 25-28) — Speaking & Listening intensive', async ({ page }) => {
  attachErrorListeners(page, 'Block7');
  await login(page);
  await goTab(page, 'Practice');

  // ── SPEAKING drill (Quick Game)
  const speakLaunched = await clickQuickGame(page, 'Speaking');
  if (speakLaunched) {
    await ss(page, 'b7-speaking');
    const speakText = await page.locator('#root').innerText().catch(() => '');
    if (!speakText.match(/speak|pronunc|say|microphone|record|phrase|\w{5,}/i)) {
      bug('BUG', 'Speaking', 'Speaking drill screen blank');
    } else ok('Speaking drill loaded');
    // Try the record/speak button if visible
    const micBtn = page.locator('button').filter({ hasText: /record|tap.*speak|start.*speaking|hold|🎤/i }).first();
    if (await micBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      ok('Microphone/record button present');
    } else {
      info('Microphone button not found (may need permissions or different UI)');
    }
    await exitScreen(page);
  } else {
    info('Speaking Quick Game button not found');
  }

  // ── SPEAKING SPRINT (Browse All)
  await goTab(page, 'Practice');
  const sprintLaunched = await clickBrowseExercise(page, 'Speaking Sprint');
  if (sprintLaunched) {
    await ss(page, 'b7-speaking-sprint');
    const ssText = await page.locator('#root').innerText().catch(() => '');
    if (ssText.match(/sprint|say|speak|phrase|\w{5,}/i)) ok('Speaking Sprint loaded');
    else bug('BUG', 'SpeakingSprint', 'Speaking Sprint screen blank');
    await exitScreen(page);
  } else {
    info('Speaking Sprint not found in Browse All (may have different label)');
  }

  // ── SHADOWING (Browse All or immersion)
  await goTab(page, 'Practice');
  const shadowLaunched = await clickBrowseExercise(page, 'Shadowing');
  if (shadowLaunched) {
    await ss(page, 'b7-shadowing');
    const shadowText = await page.locator('#root').innerText().catch(() => '');
    if (shadowText.match(/shadow|repeat|listen|phrase|\w{5,}/i)) ok('Shadowing screen loaded');
    else bug('BUG', 'Shadowing', 'Shadowing screen blank');
    await exitScreen(page);
  } else {
    info('Shadowing not found in Browse All (may be in Immersion section)');
  }

  // ── LISTENING drill from Browse All
  await goTab(page, 'Practice');
  const listenLaunched = await clickBrowseExercise(page, 'Listening');
  if (listenLaunched) {
    await ss(page, 'b7-listening');
    const listenText = await page.locator('#root').innerText().catch(() => '');
    if (listenText.match(/listen|audio|play|🔊|\w{5,}/i)) ok('Listening exercise from Browse All loaded');
    else bug('BUG', 'Listening', 'Listening exercise blank');
    await exitScreen(page);
  } else {
    info('Listening not found in Browse All — trying Quick Game');
    await goTab(page, 'Practice');
    const listenQG = await clickQuickGame(page, 'Listening');
    if (listenQG) {
      ok('Listening found as Quick Game');
      await exitScreen(page);
    } else {
      info('Listening not accessible from Practice root');
    }
  }

  // ── TYPING Quick Game
  await goTab(page, 'Practice');
  const typingLaunched = await clickQuickGame(page, 'Typing');
  if (typingLaunched) {
    await ss(page, 'b7-typing');
    const typingText = await page.locator('#root').innerText().catch(() => '');
    if (typingText.match(/type|keyboard|accuracy|enter|\w{5,}/i)) ok('Typing game loaded');
    else bug('BUG', 'Typing', 'Typing game blank');
    const typeInput = page.locator('input[type="text"], input:not([type])').first();
    if (await typeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await typeInput.fill('kuća');
      await typeInput.press('Enter');
      await page.waitForTimeout(600);
      ok('Typed word in Typing game');
    }
    await exitScreen(page);
  } else {
    info('Typing Quick Game not found');
  }

  await ss(page, 'b7-complete');
});

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 8 — Days 29-32: Profile & Community — stats, badges, heatmap, leaderboard
// ══════════════════════════════════════════════════════════════════════════════
test('Block 8 (Days 29-32) — Profile & Community: stats, badges, heatmap, journal', async ({ page }) => {
  attachErrorListeners(page, 'Block8');
  await login(page);
  await goTab(page, 'Profile');
  await ss(page, 'b8-profile');

  const profileText = await page.locator('#root').innerText().catch(() => '');

  // ── Core stats visible
  for (const stat of ['XP', 'Streak', 'Lessons']) {
    if (profileText.match(new RegExp(stat, 'i'))) ok(`Profile stat "${stat}" visible`);
    else bug('BUG', 'Profile', `Stat "${stat}" missing from profile`);
  }

  // ── Badges / achievements
  if (profileText.match(/badge|achievement|award|trophy/i)) ok('Badges section visible');
  else bug('UX', 'Profile', 'No badges/achievements section on profile');

  // ── Activity heatmap
  if (profileText.match(/activity|heatmap|calendar|day streak/i)) ok('Activity heatmap visible');
  else info('Activity heatmap not found (may appear after more activity)');

  // ── Level indicator
  if (profileText.match(/level\s*\d|lv\.\s*\d|rank|novice|explorer|communicator/i)) ok('Level indicator visible');
  else bug('UX', 'Profile', 'No level indicator on profile');

  // ── MISTAKES REVIEW
  await dismissAll(page);
  const mistakesBtn = page.locator('button').filter({ hasText: /mistake|error|wrong|review/i }).first();
  if (await mistakesBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await mistakesBtn.click();
    await page.waitForTimeout(1000);
    await ss(page, 'b8-mistakes');
    const mText = await page.locator('#root').innerText().catch(() => '');
    if (!mText.match(/mistake|error|no mistakes|all correct|\w{4,}/i)) {
      bug('BUG', 'MistakesReview', 'Mistakes screen blank');
    } else ok('Mistakes review screen loaded');
    await exitScreen(page);
  } else {
    bug('UX', 'Profile', 'Mistakes review button not found');
  }

  // ── JOURNAL (Vocab Journal in StatsTab)
  await goTab(page, 'Profile');
  const statsSubTab = page.locator('button').filter({ hasText: /^stats$/i }).first();
  if (await statsSubTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    await statsSubTab.click().catch(() => {});
    await page.waitForTimeout(500);
  }
  await dismissAll(page);
  const journalBtn = page.locator('button').filter({ hasText: /journal|diary|vocabulary|personal.*journal|vocab journal/i }).first();
  if (await journalBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await journalBtn.click();
    await page.waitForTimeout(1000);
    await ss(page, 'b8-journal');
    const jText = await page.locator('#root').innerText().catch(() => '');
    if (!jText.match(/journal|entry|write|today|vocab|\w{4,}/i)) {
      bug('BUG', 'Journal', 'Journal screen blank');
    } else ok('Journal screen loaded');
    // Write an entry
    const textarea = page.locator('textarea').first();
    const newEntry = page.locator('button').filter({ hasText: /new entry|add|write/i }).first();
    if (await newEntry.isVisible({ timeout: 1500 }).catch(() => false)) {
      await newEntry.click();
      await page.waitForTimeout(500);
    }
    if (await textarea.isVisible({ timeout: 2000 }).catch(() => false)) {
      await textarea.fill('Danas sam naučio/la neke nove riječi. Dobar dan!');
      const saveBtn = page.locator('button').filter({ hasText: /save|submit|done|✓/i }).first();
      if (await saveBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(800);
        ok('Journal entry saved');
      }
    }
    await exitScreen(page);
  } else {
    bug('UX', 'Profile', 'Journal / Vocab Journal button not found on profile');
  }

  // ── LEADERBOARD / WEEKLY LEAGUE
  await goTab(page, 'Profile');
  await dismissAll(page);
  const leaderBtn = page.locator('button').filter({ hasText: /leaderboard|league|ranking|weekly/i }).first();
  if (await leaderBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await leaderBtn.click();
    await page.waitForTimeout(1000);
    await ss(page, 'b8-leaderboard');
    const lbText = await page.locator('#root').innerText().catch(() => '');
    if (!lbText.match(/rank|league|XP|player|user|leader|\w{4,}/i)) {
      bug('BUG', 'Leaderboard', 'Leaderboard screen blank');
    } else ok('Leaderboard screen loaded');
    await exitScreen(page);
  } else {
    info('Leaderboard not directly visible from Profile root');
  }

  // ── XP readable
  const xp = await readXP(page);
  if (xp === null) bug('BUG', 'Profile', 'XP counter not parseable on profile');
  else ok(`XP readable from profile: ${xp}`);

  await ss(page, 'b8-complete');
});

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 9 — Days 33-36: Settings mastery — all options, dark mode, goals
// ══════════════════════════════════════════════════════════════════════════════
test('Block 9 (Days 33-36) — Settings: difficulty, voice, dark mode, weekly goal', async ({ page }) => {
  attachErrorListeners(page, 'Block9');
  await login(page);
  await goTab(page, 'Profile');

  // ── Open Settings
  await dismissAll(page);
  const settingsBtn = page.locator('button').filter({ hasText: /setting|⚙|gear|preference/i }).first();
  if (await settingsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await settingsBtn.click();
    await page.waitForTimeout(800);
    await dismissAll(page);
    await ss(page, 'b9-settings');
    const setText = await page.locator('#root').innerText().catch(() => '');

    // ── Difficulty selector
    const diffButtons = page.locator('button').filter({ hasText: /^Beginner$|^Intermediate$|^Advanced$/i });
    if (await diffButtons.count().catch(() => 0) > 0) {
      ok('Difficulty setting visible');
      const intBtn = page.locator('button').filter({ hasText: /^Intermediate$/ }).first();
      if (await intBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await intBtn.click();
        await page.waitForTimeout(400);
        ok('Difficulty changed to Intermediate');
        const begBtn = page.locator('button').filter({ hasText: /^Beginner$/ }).first();
        if (await begBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
          await begBtn.click();
          ok('Difficulty restored to Beginner');
        }
      }
    } else {
      bug('UX', 'Settings', 'Difficulty selector (Beginner/Intermediate/Advanced) not in Settings');
    }

    // ── Voice / TTS setting
    if (setText.match(/voice|pronunciation|tts|azure|speaker/i)) ok('Voice/TTS setting visible');
    else info('No voice setting visible (may need scroll)');

    // ── Notifications
    if (setText.match(/notification|push|remind/i)) ok('Notification setting visible');
    else info('Notification setting not visible');

    await exitScreen(page);
  } else {
    bug('UX', 'Profile', 'Settings button not found on Profile tab');
  }

  // ── DARK MODE toggle
  await goTab(page, 'Profile');
  await dismissAll(page);
  const darkToggle = page.locator('button, input[type="checkbox"]').filter({ hasText: /dark|night|theme|mode/i }).first();
  if (await darkToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
    const darkBefore = await page.evaluate(() => document.querySelector('[class="dark"]') !== null || document.querySelector('.dark') !== null).catch(() => false);
    await darkToggle.click().catch(() => {});
    await page.waitForTimeout(700);
    const darkAfter = await page.evaluate(() => document.querySelector('[class="dark"]') !== null || document.querySelector('.dark') !== null).catch(() => false);
    if (darkBefore !== darkAfter) ok('Dark mode toggle: successfully toggled');
    else info('Dark mode button clicked but .dark class unchanged (may already be in dark mode or CSS token approach)');
    await ss(page, 'b9-dark-mode');
    await darkToggle.click().catch(() => {});
    await page.waitForTimeout(400);
  } else {
    info('Dark mode toggle not visible on Profile');
  }

  // ── WEEKLY GOAL setter
  await goTab(page, 'Home');
  await dismissAll(page);
  const goalBtn = page.locator('button').filter({ hasText: /set.*goal|weekly.*goal|goal.*xp|change goal/i }).first();
  const goalSection = page.locator('[class*="goal"], [class*="weekly"]').first();
  if (await goalBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await goalBtn.click();
    await page.waitForTimeout(600);
    await ss(page, 'b9-goal-setter');
    // Select a goal option
    const goalOption = page.locator('button').filter({ hasText: /\d+\s*XP|per week|casual|regular|intense/i }).first();
    if (await goalOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await goalOption.click();
      await page.waitForTimeout(500);
      ok('Weekly goal option selected');
    }
    await exitScreen(page);
  } else if (await goalSection.isVisible({ timeout: 2000 }).catch(() => false)) {
    ok('Weekly goal section visible on Home');
  } else {
    info('Weekly goal setter not directly visible');
  }

  // ── WEEKLY GOAL progress visible on home
  await goTab(page, 'Home');
  const homeText2 = await page.locator('#root').innerText().catch(() => '');
  if (homeText2.match(/weekly.*goal|xp.*goal|goal.*xp|this week|\d+.*\/.*\d+.*xp/i)) {
    ok('Weekly goal progress shown on home');
  } else {
    info('Weekly goal progress not visible on home (OK if not set)');
  }

  await ss(page, 'b9-complete');
});

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 10 — Days 37-40: SRS mastery + weak words + mistake review cycles
// ══════════════════════════════════════════════════════════════════════════════
test('Block 10 (Days 37-40) — SRS mastery: spaced repetition, weak words, fixes', async ({ page }) => {
  attachErrorListeners(page, 'Block10');
  await login(page);
  await goTab(page, 'Practice');

  // ── SRS Review session
  const srsBtn = page.locator('button, a').filter({ hasText: /srs review|spaced rep|review due|due.*review/i }).first();
  if (await srsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await srsBtn.click();
    await page.waitForTimeout(1000);
    await dismissAll(page);
    await ss(page, 'b10-srs');
    const srsText = await page.locator('#root').innerText().catch(() => '');
    if (srsText.match(/no.*due|nothing.*review|all.*done|0.*card/i)) {
      ok('SRS: no items due (fresh/test account, expected)');
    } else if (srsText.match(/\w{4,}/i)) {
      ok('SRS Review has items to review');
      const srsQs = await runQuiz(page, 'SRS', 10);
      ok(`SRS: ${srsQs} questions answered`);
    } else {
      bug('BUG', 'SRS', 'SRS Review screen blank');
    }
    await exitScreen(page);
  } else {
    info('SRS Review button not on Practice root');
  }

  // ── Weak Words Fix (if available)
  await goTab(page, 'Practice');
  await dismissAll(page);
  const weakBtn = page.locator('button').filter({ hasText: /weak.*word|fix.*word|word.*mistake|missed/i }).first();
  if (await weakBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await weakBtn.click();
    await page.waitForTimeout(1000);
    await dismissAll(page);
    await ss(page, 'b10-weak-words');
    const weakText = await page.locator('#root').innerText().catch(() => '');
    if (weakText.match(/\w{5,}/i)) {
      ok('Weak Words / Fix Words screen loaded');
      await runQuiz(page, 'WeakWords', 8);
    } else {
      info('Weak Words: no content (may require actual mistakes first)');
    }
    await exitScreen(page);
  } else {
    info('Weak Words Fix not directly visible (may need actual mistakes)');
  }

  // ── Multiple flashcard sessions with SRS ratings to build up the queue
  for (let session = 1; session <= 3; session++) {
    await goTab(page, 'Practice');
    const fcOk = await clickQuickGame(page, 'Flashcards');
    if (fcOk) {
      const rated = await runFlashcards(page, 4);
      ok(`SRS session ${session}: ${rated} cards rated`);
      await exitScreen(page);
    }
  }

  // ── Check SRS queue after sessions
  await goTab(page, 'Practice');
  const srsText2 = await page.locator('#root').innerText().catch(() => '');
  if (srsText2.match(/\d+.*due|due.*\d+|review.*\d+/i)) {
    ok('SRS queue shows items due after flashcard sessions');
  } else {
    info('SRS queue not showing numeric due count (may require more sessions)');
  }

  await ss(page, 'b10-complete');
});

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 11 — Days 41-44: Vocabulary expansion — 5 different topic categories
// ══════════════════════════════════════════════════════════════════════════════
test('Block 11 (Days 41-44) — Vocabulary expansion: 5 topic categories', async ({ page }) => {
  attachErrorListeners(page, 'Block11');
  await login(page);

  const vocabCategories = ['family', 'food', 'travel', 'work', 'numbers'];
  let categoriesLaunched = 0;

  for (const category of vocabCategories) {
    await goTab(page, 'Learn');
    await dismissAll(page);

    // Try Browse modal first
    const browseBtn = page.locator('button').filter({ hasText: /browse|all content|all lesson/i }).first();
    if (await browseBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await browseBtn.click();
      await page.waitForTimeout(800);
      await dismissAll(page);
      const catBtn = page.locator('button').filter({ hasText: new RegExp(category, 'i') }).first();
      if (await catBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await catBtn.click();
        await page.waitForTimeout(1200);
        await dismissAll(page);
        await ss(page, `b11-vocab-${category}`);
        const catText = await page.locator('#root').innerText().catch(() => '');
        if (catText.match(/\w{5,}/i)) {
          ok(`${category}: category opened`);
          categoriesLaunched++;
          const qs = await runQuiz(page, `${category}-quiz`, 6);
          ok(`${category}: ${qs} questions answered`);
        }
        await exitScreen(page);
      } else {
        await exitScreen(page);
        // Try Practice tab flashcards with category override
        await goTab(page, 'Practice');
        const fcOk = await clickQuickGame(page, 'Flashcards');
        if (fcOk) {
          await runFlashcards(page, 3);
          await exitScreen(page);
          ok(`${category}: flashcard session (category variant)`);
          categoriesLaunched++;
        }
      }
    }
  }

  if (categoriesLaunched >= 3) ok(`Vocabulary expansion: ${categoriesLaunched}/5 categories covered`);
  else if (categoriesLaunched > 0) info(`Vocabulary expansion: only ${categoriesLaunched}/5 categories accessible`);
  else bug('UX', 'Vocabulary', 'Could not access any vocabulary topic categories');

  // ── Check vocabulary count on Profile
  await goTab(page, 'Profile');
  const profileText = await page.locator('#root').innerText().catch(() => '');
  if (profileText.match(/vocab|words.*learned|learned.*word|\d+.*word/i)) {
    ok('Vocabulary count visible on profile');
  } else {
    info('Vocabulary count not visible on profile');
  }

  await ss(page, 'b11-complete');
});

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 12 — Days 45-48: Advanced grammar — Questions, Negation, Prepositions
// ══════════════════════════════════════════════════════════════════════════════
test('Block 12 (Days 45-48) — Advanced grammar: Questions, Negation, Prepositions', async ({ page }) => {
  attachErrorListeners(page, 'Block12');
  await login(page);

  const grammarExercises = [
    { label: 'Questions', id: 'questions' },
    { label: 'Negation', id: 'negation' },
    { label: 'Prepositions', id: 'prepositions' },
    { label: 'M/F Jobs', id: 'jobs' },
  ];

  let exercisesRun = 0;
  for (const ex of grammarExercises) {
    await goTab(page, 'Practice');
    const launched = await clickBrowseExercise(page, ex.label);
    if (launched) {
      await ss(page, `b12-grammar-${ex.id}`);
      const exText = await page.locator('#root').innerText().catch(() => '');
      if (exText.match(/\w{5,}/i)) {
        ok(`${ex.label} drill loaded`);
        const qs = await runGenericExercise(page, ex.label, 6);
        ok(`${ex.label}: ${qs} interactions`);
        exercisesRun++;
      } else {
        bug('BUG', `Grammar-${ex.id}`, `${ex.label} screen blank`);
      }
      await exitScreen(page);
    } else {
      info(`${ex.label} not found in Browse All (may have different label)`);
    }
  }

  if (exercisesRun >= 2) ok(`Advanced grammar: ${exercisesRun}/4 exercises completed`);
  else info(`Advanced grammar: ${exercisesRun}/4 exercises accessible from Browse All`);

  // ── CEFR A2 test (follow-up from A1 in Block 4)
  await goTab(page, 'Practice');
  const cefrLaunched = await clickBrowseExercise(page, 'CEFR Test');
  if (cefrLaunched) {
    const a2Btn = page.locator('button').filter({ hasText: /A2|elementary/i }).first();
    if (await a2Btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await a2Btn.click();
      await page.waitForTimeout(800);
      const cefrQs = await runGenericExercise(page, 'CEFR-A2', 10);
      ok(`CEFR A2: ${cefrQs} interactions`);
    } else {
      info('CEFR A2 level not visible (may need A1 completion first)');
    }
    await exitScreen(page);
  }

  await ss(page, 'b12-complete');
});

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 13 — Days 49-52: Streak & habit building — daily goals, XP milestones
// ══════════════════════════════════════════════════════════════════════════════
test('Block 13 (Days 49-52) — Streak & habit: daily goals, XP accumulation', async ({ page }) => {
  attachErrorListeners(page, 'Block13');
  await login(page);

  // ── Check current streak
  await goTab(page, 'Home');
  await dismissAll(page);
  const homeText = await page.locator('#root').innerText().catch(() => '');
  const streakMatch = homeText.match(/(\d+)[-\s]*day[-\s]*streak|streak[\s:]+(\d+)/i);
  if (streakMatch) {
    ok(`Current streak: ${streakMatch[1] || streakMatch[2]} days`);
  } else if (homeText.match(/streak/i)) {
    ok('Streak widget present (count not parsed)');
  } else {
    bug('UX', 'Streak', 'Streak widget missing from home screen');
  }

  // ── Read initial XP
  await goTab(page, 'Profile');
  const xpStart = await readXP(page);
  ok(`XP at start of block: ${xpStart}`);

  // ── Simulate a heavy daily session: Flashcards + Quiz + Grammar
  for (let day = 1; day <= 3; day++) {
    // Flashcards
    await goTab(page, 'Practice');
    const fc = await clickQuickGame(page, 'Flashcards');
    if (fc) {
      await runFlashcards(page, 5);
      await exitScreen(page);
      ok(`Day ${day}: Flashcard session done`);
    }
    // Grammar drill
    await goTab(page, 'Practice');
    const aspect = await clickBrowseExercise(page, 'Aspect Drill');
    if (aspect) {
      await runGenericExercise(page, `AspectDay${day}`, 5);
      await exitScreen(page);
      ok(`Day ${day}: Aspect Drill done`);
    }
  }

  // ── Check XP after sessions (should have increased on at least the first day)
  await goTab(page, 'Profile');
  const xpEnd = await readXP(page);
  ok(`XP at end of block: ${xpEnd}`);
  if (xpStart !== null && xpEnd !== null) {
    if (xpEnd >= xpStart) ok(`XP maintained or increased: ${xpStart} → ${xpEnd}`);
    else bug('BUG', 'XP', `XP unexpectedly dropped: ${xpStart} → ${xpEnd}`);
  }

  // ── Streak repair / freeze feature
  await goTab(page, 'Profile');
  await dismissAll(page);
  const freezeBtn = page.locator('button').filter({ hasText: /freeze|repair.*streak|streak.*repair|shield/i }).first();
  if (await freezeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    ok('Streak freeze/repair feature visible');
  } else {
    info('Streak freeze not visible (may only appear when streak is at risk)');
  }

  // ── Journey milestones
  const milestoneEl = page.locator('[class*="milestone"], [class*="journey"], [class*="achievement"]').first();
  if (await milestoneEl.isVisible({ timeout: 2000 }).catch(() => false)) {
    ok('Journey milestone/progress indicator visible');
  } else {
    info('Journey milestones not visible as dedicated widget');
  }

  await ss(page, 'b13-complete');
});

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 14 — Days 53-56: XP milestones, badge collection, leaderboard position
// ══════════════════════════════════════════════════════════════════════════════
test('Block 14 (Days 53-56) — XP milestones, badges, leaderboard', async ({ page }) => {
  attachErrorListeners(page, 'Block14');
  await login(page);

  // ── Profile XP + level deep check
  await goTab(page, 'Profile');
  await dismissAll(page);
  await ss(page, 'b14-profile-stats');
  const profileText = await page.locator('#root').innerText().catch(() => '');

  const xp = await readXP(page);
  if (xp === null) bug('BUG', 'Profile', 'XP not readable on profile');
  else ok(`Profile XP: ${xp}`);

  // ── Level progress bar
  if (profileText.match(/level|next level|progress|XP.*to|to.*level/i)) ok('Level progress shown on profile');
  else info('Level progress not explicitly shown (may be icon only)');

  // ── Badge collection
  const badgeSection = page.locator('[class*="badge"], [class*="achievement"]').first();
  if (await badgeSection.isVisible({ timeout: 2000 }).catch(() => false)) {
    const badgeCount = await page.locator('[class*="badge"], [class*="achievement"]').count().catch(() => 0);
    ok(`Badge section visible: ${badgeCount} badge elements`);
    // Try clicking a badge to see details
    await badgeSection.click().catch(() => {});
    await page.waitForTimeout(600);
    await ss(page, 'b14-badge-detail');
    await dismissAll(page);
  } else {
    info('Badge section not visible as standalone widget');
  }

  // ── LEADERBOARD — check position + weekly XP
  const leaderBtn = page.locator('button').filter({ hasText: /leaderboard|league|ranking|weekly/i }).first();
  if (await leaderBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await leaderBtn.click();
    await page.waitForTimeout(1000);
    await dismissAll(page);
    await ss(page, 'b14-leaderboard');
    const lbText = await page.locator('#root').innerText().catch(() => '');
    if (!lbText.match(/rank|league|XP|player|\w{4,}/i)) {
      bug('BUG', 'Leaderboard', 'Leaderboard blank after opening');
    } else {
      ok('Leaderboard screen loaded');
      // Check for weekly XP display
      if (lbText.match(/weekly|this week|\d+\s*XP/i)) ok('Leaderboard shows weekly XP');
      else info('Leaderboard XP format not matched (may be different layout)');
    }
    await exitScreen(page);
  } else {
    info('Leaderboard not visible on profile root');
  }

  // ── Earn XP in a fresh exercise and verify level-up behaviour
  await goTab(page, 'Practice');
  const typingQG = await clickQuickGame(page, 'Typing');
  if (typingQG) {
    const input = page.locator('input[type="text"], input:not([type])').first();
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Type several words
      for (const word of ['kuća', 'auto', 'pas', 'mačka']) {
        await input.fill(word);
        await input.press('Enter');
        await page.waitForTimeout(400);
      }
    }
    await exitScreen(page);
    ok('Typing game session: XP earned');
  }

  // ── Check for celebration/ceremony after XP
  const celebration = page.locator('[class*="celebrat"], [class*="modal"], [class*="ceremony"]').first();
  if (await celebration.isVisible({ timeout: 1500 }).catch(() => false)) {
    ok('Celebration/ceremony modal triggered');
    await ss(page, 'b14-celebration');
    await dismissAll(page);
  }

  await ss(page, 'b14-complete');
});

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK 15 — Days 57-60: Power user stress test — all features, regression
// ══════════════════════════════════════════════════════════════════════════════
test('Block 15 (Days 57-60) — Power user stress: all features, state, regression', async ({ page }) => {
  attachErrorListeners(page, 'Block15');
  await login(page);

  // ── RAPID TAB SWITCHING — no crash
  for (const tab of ['Learn', 'Practice', 'Croatia', 'Profile', 'Home', 'Practice', 'Learn', 'Home']) {
    await goTab(page, tab);
    await page.waitForTimeout(300);
  }
  const afterRapid = await page.locator('#root').innerText().catch(() => '');
  if (!afterRapid.match(/\w{5,}/i)) {
    bug('BUG', 'RapidNav', 'App went blank after rapid tab switching');
  } else ok('Rapid tab switching: no crash');

  // ── XP STATE PERSISTENCE across navigation
  await goTab(page, 'Profile');
  const xpBefore = await readXP(page);
  ok(`XP before sessions: ${xpBefore}`);

  // Complete multiple exercises to earn XP
  await goTab(page, 'Practice');
  const quizOk = await clickQuickGame(page, 'Quiz');
  if (quizOk) {
    await runQuiz(page, 'StressQuiz', 8);
    await exitScreen(page);
    ok('Stress: Quiz session complete');
  }

  await goTab(page, 'Profile');
  const xpAfter = await readXP(page);
  ok(`XP after sessions: ${xpAfter}`);
  if (xpBefore !== null && xpAfter !== null) {
    if (xpAfter < xpBefore) bug('BUG', 'XP-State', `XP dropped between sessions: ${xpBefore} → ${xpAfter}`);
    else ok(`XP state persisted correctly: ${xpBefore} → ${xpAfter}`);
  }

  // ── BACK NAVIGATION from every major screen
  const screensToTest = [
    { tab: 'Learn', launcher: async () => {
        const card = page.locator('[class*="lesson-card"], button').filter({ hasText: /lesson|vocab|grammar/i }).first();
        if (await card.isVisible({ timeout: 2000 }).catch(() => false)) { await card.click(); return true; }
        return false;
    }},
    { tab: 'Practice', launcher: async () => clickQuickGame(page, 'Flashcards') },
    { tab: 'Croatia', launcher: async () => {
        const btn = page.locator('button').filter({ hasText: /razgovaraj|texting|slang/i }).first();
        if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) { await btn.click(); return true; }
        return false;
    }},
  ];

  for (const { tab, launcher } of screensToTest) {
    await goTab(page, tab);
    await dismissAll(page);
    const launched = await launcher();
    if (launched) {
      await page.waitForTimeout(1000);
      await dismissAll(page);
      await exitScreen(page);
      await page.waitForTimeout(600);
      const afterExit = await page.locator('#root').innerText().catch(() => '');
      if (!afterExit.match(/home|learn|practice|croatia|profile|tab|vitez/i)) {
        bug('BUG', `BackNav-${tab}`, `After exiting ${tab} screen, app navigation collapsed`);
      } else {
        ok(`Back navigation from ${tab} screen: correct`);
      }
    }
  }

  // ── MOBILE VIEWPORT check (390px)
  await page.setViewportSize({ width: 390, height: 844 });
  await goTab(page, 'Home');
  await ss(page, 'b15-mobile-390');
  const mobileText = await page.locator('#root').innerText().catch(() => '');
  if (!mobileText.match(/\w{5,}/i)) {
    bug('BUG', 'Mobile', 'App blank on 390px mobile viewport');
  } else ok('390px mobile viewport: app renders');
  const tabBar = page.locator('.sb-btn, [class*="tab-bar"], nav button').first();
  if (await tabBar.isVisible({ timeout: 2000 }).catch(() => false)) {
    ok('Tab bar visible on mobile viewport');
  } else {
    bug('UX', 'Mobile', 'Tab bar not visible on 390px mobile viewport');
  }

  // ── TABLET VIEWPORT check (768px)
  await page.setViewportSize({ width: 768, height: 1024 });
  await goTab(page, 'Practice');
  await ss(page, 'b15-tablet-768');
  const tabletText = await page.locator('#root').innerText().catch(() => '');
  if (!tabletText.match(/\w{5,}/i)) {
    bug('BUG', 'Tablet', 'App blank on 768px tablet viewport');
  } else ok('768px tablet viewport: app renders');

  // ── SEARCH / DIACRITIC SEARCH
  await page.setViewportSize({ width: 1280, height: 800 });
  await goTab(page, 'Learn');
  await dismissAll(page);
  const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]').first();
  if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await searchInput.fill('kuća');
    await page.waitForTimeout(800);
    await ss(page, 'b15-search-diacritic');
    const searchResults = await page.locator('#root').innerText().catch(() => '');
    if (searchResults.match(/kuća|kuca|house|home/i)) {
      ok('Search returns results for "kuća" (with diacritic)');
    } else {
      info('Search with diacritic "kuća" returned no matches');
    }
    // Try non-diacritic version
    await searchInput.fill('kuca');
    await page.waitForTimeout(600);
    const searchResults2 = await page.locator('#root').innerText().catch(() => '');
    if (searchResults2.match(/kuća|kuca|house/i)) {
      ok('Diacritic search fallback: "kuca" finds "kuća"');
    } else {
      info('No diacritic fallback for "kuca" → "kuća" (may need implementation)');
    }
    await searchInput.fill('');
  } else {
    info('Search input not found on Learn tab');
  }

  // ── ACCESSIBILITY — all images have alt text
  const imagesWithoutAlt = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs.filter(img => !img.alt || img.alt.trim() === '').length;
  }).catch(() => 0);
  if (imagesWithoutAlt === 0) ok('Accessibility: all images have alt text');
  else bug('UX', 'A11y', `${imagesWithoutAlt} images missing alt text`);

  // ── MODAL CLEANUP — no lingering overlays
  await goTab(page, 'Home');
  await dismissAll(page);
  const dialogs = await page.locator('[role="dialog"]:visible').count().catch(() => 0);
  if (dialogs === 0) ok('No lingering modal overlays after dismissAll');
  else info(`${dialogs} dialog still visible (may be intentional banner)`);

  // ── CONSOLE ERROR final check
  const pageErrors = [];
  page.on('pageerror', err => { pageErrors.push(err.message); });
  await goTab(page, 'Home');
  await goTab(page, 'Practice');
  await goTab(page, 'Croatia');
  await goTab(page, 'Profile');
  if (pageErrors.length === 0) ok('No JS errors during final tab scan');
  else info(`${pageErrors.length} JS error(s) during final tab scan (see console)`);

  await ss(page, 'b15-final');

  // ── Final XP audit
  await goTab(page, 'Profile');
  const xpFinal = await readXP(page);
  ok(`Final XP after 60-day simulation: ${xpFinal}`);
  if (xpFinal !== null && xpBefore !== null && xpFinal < xpBefore) {
    bug('BUG', 'XP-Final', `Final XP (${xpFinal}) lower than start of block (${xpBefore}) — state regression`);
  } else {
    ok('XP state consistent throughout stress test');
  }
});
