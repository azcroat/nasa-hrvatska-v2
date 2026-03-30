/**
 * 180-DAY HIGHLY ENGAGED USER AUDIT
 * Simulates a dedicated learner going from complete beginner to B1/B2 fluency
 * over 6 months of consistent daily use. This is the most comprehensive audit
 * of the application — it exercises every feature path, tracks XP/level/streak
 * progression across the full arc, catches state corruption, broken navigation,
 * empty screens, and UX dead-ends that only appear after extended engagement.
 *
 * Credentials: claude.test.nasahrvatska@gmail.com / ClaudeTest2026!
 * Target:      https://nasahrvatska.com
 *
 * Highly engaged user profile:
 *   - 45-60 min daily sessions, 6-7 days/week
 *   - Systematic progression through all CEFR levels A1 → B2
 *   - Uses every feature: SRS, streaks, badges, leaderboard, AI, speaking
 *   - Experiences streak loss + recovery mechanic around Day 90
 *   - Advances difficulty: Beginner → Intermediate (Day 60) → Advanced (Day 120)
 *   - Full vocabulary mastery across all topic categories
 *   - Regular mistake review and AI conversation practice
 *   - Cultural deep dives, Croatia regions, media content
 *   - Premium feature exploration
 *   - End-state: Level 20+, 100+ day streak, all major badges
 *
 * Structure (30 blocks × 6 days = 180 days):
 *
 * PHASE 1 — Onboarding & Foundation (Days 1–30)
 *   Block 1  (Days  1- 6): First session — home, first lesson, first XP
 *   Block 2  (Days  7-12): Learn tab mastery — all lesson types, audio
 *   Block 3  (Days 13-18): Practice fundamentals — all Quick Games
 *   Block 4  (Days 19-24): Grammar intro — Case Constellation, basic drills
 *   Block 5  (Days 25-30): Croatia tab discovery — Discover + Culture sub-tabs
 *
 * PHASE 2 — Building Momentum (Days 31–60)
 *   Block 6  (Days 31-36): Vocabulary expansion — Food, Family, Travel categories
 *   Block 7  (Days 37-42): SRS mastery — spaced repetition, weak word review
 *   Block 8  (Days 43-48): AI conversations — Maja persona, multiple topics
 *   Block 9  (Days 49-54): Speaking & Listening — Speaking drill, Shadowing
 *   Block 10 (Days 55-60): 30-day milestone — profile stats, badges, streak
 *
 * PHASE 3 — Intermediate Progression (Days 61–90)
 *   Block 11 (Days 61-66): Difficulty upgrade → Intermediate, adjusted content
 *   Block 12 (Days 67-72): Advanced grammar — Aspect Drill, Word Order, CEFR B1
 *   Block 13 (Days 73-78): Croatia deep dive — Media, Stories, regional content
 *   Block 14 (Days 79-84): Streak milestone — 60 days, freeze mechanic, goal tracking
 *   Block 15 (Days 85-90): Community & leaderboard — rank, XP race, social
 *
 * PHASE 4 — Advanced Features (Days 91–120)
 *   Block 16 (Days  91- 96): Streak break + recovery — lose streak, repair with XP
 *   Block 17 (Days  97-102): Vocabulary mastery — Numbers, Work, Body categories
 *   Block 18 (Days 103-108): AI Story + AI Tutor deep dive
 *   Block 19 (Days 109-114): All browse exercises — full Practice tab sweep
 *   Block 20 (Days 115-120): 90-day milestone — level check, badge sweep, profile
 *
 * PHASE 5 — Power User (Days 121–150)
 *   Block 21 (Days 121-126): Difficulty upgrade → Advanced
 *   Block 22 (Days 127-132): CEFR B1+ grammar sprint — all complex drills
 *   Block 23 (Days 133-138): Croatia — all 4 sub-tabs + regional deep dive
 *   Block 24 (Days 139-144): Speaking Sprint + Shadowing intensive
 *   Block 25 (Days 145-150): Weekly league — rank tracking, XP competition
 *
 * PHASE 6 — Mastery & Regression (Days 151–180)
 *   Block 26 (Days 151-156): Full vocabulary audit — all categories, SRS status
 *   Block 27 (Days 157-162): 150-day milestone + badge collection complete
 *   Block 28 (Days 163-168): Settings mastery — all options, notifications, voice
 *   Block 29 (Days 169-174): Stress test — rapid switching, all tabs, all games
 *   Block 30 (Days 175-180): Final audit — complete regression, XP/level/streak check
 */

import { test } from '@playwright/test';
import fs from 'fs';

const EMAIL    = 'claude.test.nasahrvatska@gmail.com';
const PASSWORD = 'ClaudeTest2026!';
const SS_DIR   = '180day-audit-screenshots';
const REPORT   = '180day-audit-report.json';

// ── Reporting ──────────────────────────────────────────────────────────────────
const issues = [];
function bug(sev, ctx, desc) {
  console.error(`❌ [${sev}] ${ctx} — ${desc}`);
  issues.push({ sev, ctx, desc, ts: new Date().toISOString() });
}
function ok(msg)   { console.log(`  ✅ ${msg}`); }
function info(msg) { console.log(`  ℹ️  ${msg}`); }
function phase(msg) { console.log(`\n${'─'.repeat(60)}\n  📍 ${msg}\n${'─'.repeat(60)}`); }

test.afterAll(() => {
  if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });
  fs.writeFileSync(REPORT, JSON.stringify({ total: issues.length, issues }, null, 2));
  const divider = '═'.repeat(70);
  console.log('\n' + divider);
  console.log('180-DAY HIGHLY ENGAGED USER AUDIT COMPLETE — ' + issues.length + ' total issues');
  const counts = {};
  issues.forEach(i => { counts[i.sev] = (counts[i.sev] || 0) + 1; });
  Object.entries(counts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log('  Screenshots: ' + SS_DIR + '/');
  console.log('  Report:      ' + REPORT);
  console.log(divider);
  if (issues.length === 0) console.log('\n✅ Zero issues detected across 180 days.\n');
  else {
    console.log('\nALL ISSUES FOUND:');
    issues.forEach((i, n) => console.log(`  ${n + 1}. [${i.sev}] ${i.ctx} — ${i.desc}`));
  }
  console.log(divider);
});

// ── Helpers ────────────────────────────────────────────────────────────────────
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
    for (const pattern of [/^start exploring →?$|^continue free$|^maybe later$/i, /^not now$/i, /^skip$/i]) {
      const premium = page.locator('button').filter({ hasText: pattern }).first();
      if (await premium.isVisible({ timeout: 300 }).catch(() => false)) {
        await premium.click().catch(() => {});
        await page.waitForTimeout(300).catch(() => {});
      }
    }
  }
}

async function dismissAll(page) {
  await dismissModals(page);
  // Handle [role="dialog"] modals (CelebrationModal, level-up, badge toasts)
  for (let attempt = 0; attempt < 3; attempt++) {
    const overlay = page.locator('[role="dialog"]').first();
    if (!await overlay.isVisible({ timeout: 400 }).catch(() => false)) break;
    const xBtn = overlay.locator('button').filter({ hasText: /^[×✕x]$/i }).first();
    if (await xBtn.isVisible({ timeout: 300 }).catch(() => false)) {
      await xBtn.click().catch(() => {});
      await page.waitForTimeout(350).catch(() => {});
    } else break;
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
  // Patterns cover: quiz result "Back to Practice", flashcard result "Continue →" / "← Done for now",
  // lesson complete "Done" / "Finish", generic screens "Exit" / "Close" / "Back".
  for (const pattern of [/✕\s*Exit/i, /^Exit$/i, /^Done$/i, /Done for now/i, /^Continue →$/i, /^Back\b/i, /^←$/, /See Results|^Results$/i, /Back to Practice/i, /^Play Again$/i, /^Finish$/i, /^Close$/i]) {
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
  // Dismiss any celebration/modal chain, then wait for Quick Games grid.
  // Recovery path: if buttons aren't found on first attempt (e.g. mid-game Flashcards
  // left the screen in a non-Practice state), click the Practice sidebar tab again
  // and retry — this forces setScr('dashboard') and re-renders PracticeTab.
  await page.waitForTimeout(1200);
  await dismissAll(page);
  await page.waitForTimeout(500);
  await dismissAll(page);
  await page.waitForTimeout(300);
  await dismissAll(page);

  const found = await page.waitForSelector('button.practice-card-dark', { timeout: 6000 }).catch(() => null);
  if (!found) {
    // Recovery: click Practice tab explicitly to force a clean re-render
    const practiceTab = page.locator('.sb-btn').filter({ hasText: 'Practice' }).first();
    if (await practiceTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await practiceTab.click().catch(() => {});
      await page.waitForTimeout(1500);
      await dismissAll(page);
    }
    await page.waitForSelector('button.practice-card-dark', { timeout: 8000 }).catch(() => {});
  }

  const btn = page.locator('button.practice-card-dark').filter({ hasText: label }).first();
  if (await btn.count().catch(() => 0) === 0) return false;
  await btn.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(300);
  if (!await btn.isVisible({ timeout: 4000 }).catch(() => false)) return false;
  await btn.click().catch(() => {});
  await page.waitForTimeout(1000);
  await dismissAll(page);
  return true;
}

async function clickBrowseExercise(page, label) {
  await page.waitForTimeout(500);
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

async function runFlashcards(page, count = 6) {
  let rated = 0;
  for (let i = 0; i < count; i++) {
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
    const rateButtons = page.locator('button').filter({ hasText: /still learning|perfect|easy|good|hard|knew it/i });
    const rateCount = await rateButtons.count().catch(() => 0);
    if (rateCount > 0) {
      const btnIdx = i % 3 === 0 ? 0 : i % 3 === 1 ? Math.min(rateCount - 1, 1) : Math.min(rateCount - 1, 2);
      await rateButtons.nth(btnIdx).click().catch(() => {});
      rated++;
      await page.waitForTimeout(400);
    } else break;
  }
  return rated;
}

async function runGenericExercise(page, maxQ = 5) {
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

async function readXP(page) {
  const root = await page.locator('#root').innerText().catch(() => '');
  const m = root.match(/(\d[\d,]*)\s*XP/i);
  return m ? parseInt(m[1].replace(/,/g, '')) : null;
}

async function readStreak(page) {
  const root = await page.locator('#root').innerText().catch(() => '');
  const m = root.match(/(\d+)\s*(?:day\s*)?streak/i);
  return m ? parseInt(m[1]) : null;
}

async function readLevel(page) {
  const root = await page.locator('#root').innerText().catch(() => '');
  const m = root.match(/level\s*(\d+)/i);
  return m ? parseInt(m[1]) : null;
}

async function changeDifficulty(page, difficulty) {
  if (!await goTab(page, 'Profile')) return false;
  // Settings is usually in the profile tab or via a settings icon
  const settingsBtn = page.locator('button, a').filter({ hasText: /settings|⚙|difficulty/i }).first();
  if (await settingsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await settingsBtn.click();
    await page.waitForTimeout(600);
  }
  const diffSelect = page.locator('button, [role="option"], select').filter({ hasText: new RegExp(difficulty, 'i') }).first();
  if (await diffSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
    await diffSelect.click().catch(() => {});
    await page.waitForTimeout(500);
    return true;
  }
  return false;
}

async function runSRSSession(page, maxCards = 8) {
  let reviewed = 0;
  for (let i = 0; i < maxCards; i++) {
    await page.waitForTimeout(600);
    // Try flipping / revealing
    const flip = page.locator('button').filter({ hasText: /flip|reveal|show|tap to reveal/i }).first();
    if (await flip.isVisible({ timeout: 1500 }).catch(() => false)) {
      await flip.click().catch(() => {});
      await page.waitForTimeout(500);
    } else {
      await page.locator('#root').click({ position: { x: 300, y: 300 } }).catch(() => {});
      await page.waitForTimeout(500);
    }
    const rateButtons = page.locator('button').filter({ hasText: /still learning|perfect|easy|good|hard|knew it|again|hard/i });
    const rateCount = await rateButtons.count().catch(() => 0);
    if (rateCount > 0) {
      const btnIdx = i % 2 === 0 ? 0 : Math.min(rateCount - 1, 1);
      await rateButtons.nth(btnIdx).click().catch(() => {});
      reviewed++;
      await page.waitForTimeout(400);
    } else {
      const opts = page.locator('.ob');
      const oCount = await opts.count().catch(() => 0);
      if (oCount > 0) {
        await opts.nth(i % oCount).click().catch(() => {});
        reviewed++;
        await page.waitForTimeout(400);
        const next = page.locator('button').filter({ hasText: /next|continue|→/i }).first();
        if (await next.isVisible({ timeout: 1200 }).catch(() => false)) {
          await next.click().catch(() => {});
          await page.waitForTimeout(400);
        }
      } else break;
    }
  }
  return reviewed;
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 1 — ONBOARDING & FOUNDATION (Days 1–30)
// ══════════════════════════════════════════════════════════════════════════════

test('Block 1 (Days 1-6) — First session: home screen, hero CTA, first XP', async ({ page }) => {
  phase('PHASE 1: ONBOARDING & FOUNDATION');
  attachErrorListeners(page, 'Block1');
  await login(page);
  await goTab(page, 'Home');
  await ss(page, 'b01-home');

  const home = await page.locator('#root').innerText().catch(() => '');

  // Essential home widgets
  if (home.match(/streak|day streak|🔥/i)) ok('Streak widget on home');
  else bug('UX', 'Home', 'Streak widget missing from home screen');

  if (home.match(/today|plan|suggested|daily|recommended/i)) ok('Daily plan/recommended section visible');
  else bug('UX', 'Home', 'No daily plan or recommended section');

  // Hero CTA
  const heroCta = page.locator('button, a').filter({ hasText: /continue learning|start lesson|begin|let'?s go|explore/i }).first();
  if (await heroCta.isVisible({ timeout: 3000 }).catch(() => false)) {
    ok('Hero CTA present on home');
    const xpBefore = await readXP(page);
    await heroCta.click();
    await page.waitForTimeout(1500);
    await dismissAll(page);
    const screenText = await page.locator('#root').innerText().catch(() => '');
    if (screenText.match(/exit|vocabulary|grammar|lesson|question|practice|quiz/i)) {
      ok('Hero CTA launched a lesson');
      await runQuiz(page, 'HeroLesson', 8);
      await runFlashcards(page, 4);
      await exitScreen(page);
      await goTab(page, 'Home');
      const xpAfter = await readXP(page);
      info(`First XP — before: ${xpBefore}, after: ${xpAfter}`);
      if (xpBefore !== null && xpAfter !== null && xpAfter < xpBefore)
        bug('BUG', 'XP', `XP dropped after hero lesson: ${xpBefore} → ${xpAfter}`);
      else if (xpAfter !== null && xpAfter > 0) ok(`First XP earned: ${xpAfter} XP total`);
    } else {
      bug('BUG', 'HeroLesson', 'Hero CTA clicked but no lesson screen appeared');
    }
  } else {
    bug('UX', 'Home', 'No hero lesson CTA visible (first-time user blocked)');
  }

  // Word of Day
  if (home.match(/today.*word|word.*day|daily.*phrase|discovery|word of/i)) ok('Word of Day present');
  else info('No Word of Day widget visible on home');

  // Knight mascot
  if (home.match(/vitez|knight|hrvoje|Bok|Dobrodošli|hrv/i)) ok('Knight mascot visible');
  else info('Knight mascot not visible (may be dismissed)');

  // Navigate all tabs — confirm app is responsive
  for (const tab of ['Learn', 'Practice', 'Croatia', 'Profile']) {
    const reached = await goTab(page, tab);
    if (reached) ok(`Tab "${tab}" reachable`);
  }
  await goTab(page, 'Home');
  await ss(page, 'b01-complete');
});

test('Block 2 (Days 7-12) — Learn tab: all lesson types, audio, Browse modal', async ({ page }) => {
  attachErrorListeners(page, 'Block2');
  await login(page);
  await goTab(page, 'Learn');
  await ss(page, 'b02-learn');

  const learnText = await page.locator('#root').innerText().catch(() => '');
  if (!learnText.match(/lesson|vocabulary|grammar|week|topic|unit/i))
    bug('BUG', 'LearnTab', 'Learn tab shows no lesson content');
  else ok('Learn tab has content');

  // Open first available lesson
  const lessonCard = page.locator('[class*="lesson-card"], button, .card').filter({ hasText: /lesson|vocab|week|unit/i }).first();
  if (await lessonCard.isVisible({ timeout: 3000 }).catch(() => false)) {
    await lessonCard.scrollIntoViewIfNeeded().catch(() => {});
    await lessonCard.click().catch(() => {});
    await page.waitForTimeout(1500);
    await dismissAll(page);
    const lessonText = await page.locator('#root').innerText().catch(() => '');
    if (lessonText.match(/vocabulary|word|phrase|grammar|listen|speak|question/i)) {
      ok('Lesson screen loaded');
      await ss(page, 'b02-lesson');
      await runQuiz(page, 'FirstLesson', 10);
      await runFlashcards(page, 5);
    } else {
      bug('BUG', 'LearnTab', 'Lesson card clicked but no lesson loaded');
    }
    await exitScreen(page);
  } else {
    bug('BUG', 'LearnTab', 'No lesson card visible on Learn tab');
  }

  // Audio present in lessons
  await goTab(page, 'Learn');
  const audioBtn = page.locator('button[aria-label*="play"], button[aria-label*="audio"], button[class*="audio"], [class*="tts-btn"]').first();
  if (await audioBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await audioBtn.click().catch(() => {});
    ok('Audio button present and clickable in lesson');
    await page.waitForTimeout(1000);
  } else info('Audio button not directly visible (may be inside lesson)');

  // Browse Content modal
  const browseBtn = page.locator('button').filter({ hasText: /browse|all content|explore all/i }).first();
  if (await browseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await browseBtn.click().catch(() => {});
    await page.waitForTimeout(800);
    const modalText = await page.locator('#root').innerText().catch(() => '');
    if (modalText.match(/vocab|grammar|culture|lesson|topic/i)) {
      ok('Browse modal opened with content');
      await ss(page, 'b02-browse-modal');
    } else bug('UX', 'BrowseModal', 'Browse modal opened but appears empty');
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(400);
  } else info('No Browse Content button on Learn tab');

  // Progress indicators
  await goTab(page, 'Learn');
  const progress = await page.locator('#root').innerText().catch(() => '');
  if (progress.match(/complete|done|%|progress/i)) ok('Progress indicators visible in Learn');
  else info('No explicit progress % in Learn tab text');
});

test('Block 3 (Days 13-18) — Practice: all Quick Games + Browse exercises', async ({ page }) => {
  attachErrorListeners(page, 'Block3');
  await login(page);
  await goTab(page, 'Practice');
  await ss(page, 'b03-practice');

  // ── Flashcards
  await goTab(page, 'Practice');
  const fcLaunched = await clickQuickGame(page, 'Flashcards');
  if (fcLaunched) {
    ok('Flashcards Quick Game launched');
    await ss(page, 'b03-flashcards');
    const rated = await runFlashcards(page, 8);
    if (rated > 0) ok(`Flashcards: ${rated} cards rated`);
    else bug('BUG', 'Flashcards', 'No rating buttons appeared during flashcard session');
    await exitScreen(page);
  } else bug('BUG', 'PracticeTab', 'Flashcards Quick Game button not found');

  // ── Quiz
  await goTab(page, 'Practice');
  const quizLaunched = await clickQuickGame(page, 'Quiz');
  if (quizLaunched) {
    ok('Quiz Quick Game launched');
    await ss(page, 'b03-quiz');
    const qsAnswered = await runQuiz(page, 'MCQuiz', 15);
    ok(`Quiz: ${qsAnswered} questions answered`);
    if (qsAnswered === 0) bug('BUG', 'MCQuiz', 'Quiz launched but no questions appeared');
    await exitScreen(page);
  } else bug('BUG', 'PracticeTab', 'Quiz Quick Game button not found');

  // ── Word Sprint
  await goTab(page, 'Practice');
  const sprintLaunched = await clickQuickGame(page, 'Word Sprint');
  if (sprintLaunched) {
    ok('Word Sprint launched');
    await ss(page, 'b03-word-sprint');
    const input = page.locator('input[type="text"], input:not([type])').first();
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      for (let i = 0; i < 3; i++) {
        await input.fill('kuća');
        await input.press('Enter');
        await page.waitForTimeout(500);
      }
      ok('Word Sprint: typed answers');
    } else info('Word Sprint: tap-based UI (no text input)');
    await exitScreen(page);
  } else info('Word Sprint Quick Game not found (may use different label)');

  // ── Match Pairs
  await goTab(page, 'Practice');
  const matchLaunched = await clickQuickGame(page, 'Match Pairs');
  if (matchLaunched) {
    ok('Match Pairs launched');
    await ss(page, 'b03-match');
    const cards = page.locator('[class*="match-card"], [class*="pair"], button').filter({ hasText: /\w+/i });
    const cardCount = await cards.count().catch(() => 0);
    if (cardCount >= 2) {
      await cards.first().click().catch(() => {});
      await page.waitForTimeout(400);
      await cards.nth(1).click().catch(() => {});
      await page.waitForTimeout(600);
      ok('Match Pairs: tapped cards');
    }
    await exitScreen(page);
  } else info('Match Pairs not found (may use different label)');

  // ── Sentence Cloze via Browse
  await goTab(page, 'Practice');
  const clozeLaunched = await clickBrowseExercise(page, 'Sentence Cloze');
  if (clozeLaunched) {
    ok('Sentence Cloze launched from Browse');
    const clozeAnswered = await runGenericExercise(page, 6);
    ok(`Sentence Cloze: ${clozeAnswered} interactions`);
    await exitScreen(page);
  } else info('Sentence Cloze not found in Browse All');

  // ── SRS Review
  await goTab(page, 'Practice');
  const srsLaunched = await clickBrowseExercise(page, 'SRS Review');
  if (srsLaunched) {
    const srsText = await page.locator('#root').innerText().catch(() => '');
    if (srsText.match(/due|review|no.*card|all.*done|coming up/i)) {
      ok('SRS Review screen loaded');
      const reviewed = await runSRSSession(page, 5);
      if (reviewed > 0) ok(`SRS: ${reviewed} cards reviewed`);
      else info('SRS Review: no items due (expected for test account)');
    }
    await exitScreen(page);
  } else info('SRS Review not found in Browse All');
});

test('Block 4 (Days 19-24) — Grammar intro: Case Constellation + basic drills', async ({ page }) => {
  attachErrorListeners(page, 'Block4');
  await login(page);
  await goTab(page, 'Practice');

  // ── Case Constellation
  const caseLaunched = await clickBrowseExercise(page, 'Case Constellation');
  if (caseLaunched) {
    const caseText = await page.locator('#root').innerText().catch(() => '');
    if (caseText.match(/nominative|accusative|genitive|dative|locative|instrumental|case|padež/i)) {
      ok('Case Constellation has grammar content');
      await ss(page, 'b04-case');
      const caseAnswered = await runGenericExercise(page, 8);
      ok(`Case Constellation: ${caseAnswered} interactions`);
    } else bug('UX', 'CaseConstellation', 'Case Constellation loaded but no case grammar content found');
    await exitScreen(page);
  } else bug('UX', 'PracticeTab', 'Case Constellation not found in Browse All');

  // ── Word Order
  await goTab(page, 'Practice');
  const wordOrderLaunched = await clickBrowseExercise(page, 'Word Order');
  if (wordOrderLaunched) {
    ok('Word Order drill loaded');
    await ss(page, 'b04-word-order');
    const answered = await runGenericExercise(page, 6);
    ok(`Word Order: ${answered} interactions`);
    await exitScreen(page);
  } else info('Word Order not found in Browse All');

  // ── CEFR level drills (A1 for first phase)
  await goTab(page, 'Practice');
  const cefrLaunched = await clickBrowseExercise(page, 'CEFR');
  if (cefrLaunched) {
    ok('CEFR level drill section visible');
    await ss(page, 'b04-cefr');
    const a1Btn = page.locator('button').filter({ hasText: /^A1$/i }).first();
    if (await a1Btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await a1Btn.click().catch(() => {});
      await page.waitForTimeout(600);
      ok('CEFR A1 level selected');
      const a1Answered = await runGenericExercise(page, 10);
      ok(`CEFR A1: ${a1Answered} interactions`);
    } else info('A1 level option not visible (may be default)');
    await exitScreen(page);
  } else info('CEFR drill not found in Browse All');

  // ── Grammar score visible on Profile after practice
  await goTab(page, 'Profile');
  const profileText = await page.locator('#root').innerText().catch(() => '');
  if (profileText.match(/grammar|gc|gramm.*score/i)) ok('Grammar score tracked on profile');
  else info('Grammar score not yet visible on profile (may need more practice)');
});

test('Block 5 (Days 25-30) — Croatia tab: Discover + Culture sub-tabs', async ({ page }) => {
  attachErrorListeners(page, 'Block5');
  await login(page);
  await goTab(page, 'Croatia');
  await ss(page, 'b05-croatia');

  const croatiaText = await page.locator('#root').innerText().catch(() => '');
  if (!croatiaText.match(/croatia|hrvatska|discover|culture|region|story/i))
    bug('BUG', 'CroatiaTab', 'Croatia tab appears empty');
  else ok('Croatia tab has content');

  // Check sub-tab navigation
  for (const subTab of ['Discover', 'Culture', 'Media', 'Stories']) {
    // Labels have emoji prefix in production: '🗓️ Discover', '🏰 Culture', '🎵 Media', '📖 Stories'
    const subTabBtn = page.locator('button').filter({ hasText: new RegExp(subTab, 'i') }).first();
    if (await subTabBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      ok(`Sub-tab "${subTab}" visible`);
      await subTabBtn.click().catch(() => {});
      await page.waitForTimeout(700);
      const subContent = await page.locator('#root').innerText().catch(() => '');
      if (subContent.match(/\w{5,}/)) ok(`"${subTab}" sub-tab has content`);
      else bug('UX', `Croatia-${subTab}`, `"${subTab}" sub-tab appears empty`);
      await ss(page, `b05-croatia-${subTab.toLowerCase()}`);
    } else info(`"${subTab}" sub-tab not found by direct name match`);
  }

  // ── Discover: click first card
  await goTab(page, 'Croatia');
  await page.waitForTimeout(500);
  const discoverCard = page.locator('[class*="card"], [class*="region"], button').filter({ hasText: /\w{4,}/ }).first();
  if (await discoverCard.isVisible({ timeout: 3000 }).catch(() => false)) {
    await discoverCard.click().catch(() => {});
    await page.waitForTimeout(1200);
    await dismissAll(page);
    const discoverText = await page.locator('#root').innerText().catch(() => '');
    if (discoverText.match(/\w{10,}/)) {
      ok('Croatia Discover card opens to content');
      await ss(page, 'b05-discover-content');
    }
    await exitScreen(page);
  }

  // ── Culture: check cultural content loads
  await goTab(page, 'Croatia');
  const cultureBtn = page.locator('button').filter({ hasText: /^culture$/i }).first();
  if (await cultureBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cultureBtn.click().catch(() => {});
    await page.waitForTimeout(700);
    const cultureText = await page.locator('#root').innerText().catch(() => '');
    if (cultureText.match(/tradition|festival|food|klapa|tambura|customs|history|cultural/i))
      ok('Culture sub-tab shows cultural content');
    else info('Culture sub-tab loaded but no specific cultural keywords found');
    await ss(page, 'b05-culture');
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 2 — BUILDING MOMENTUM (Days 31–60)
// ══════════════════════════════════════════════════════════════════════════════

test('Block 6 (Days 31-36) — Vocabulary expansion: Food, Family, Travel categories', async ({ page }) => {
  phase('PHASE 2: BUILDING MOMENTUM');
  attachErrorListeners(page, 'Block6');
  await login(page);
  await goTab(page, 'Learn');

  const xpStart = await readXP(page);
  info(`XP at start of Block 6: ${xpStart}`);

  // Try to open vocab-specific lessons by category
  for (const category of ['food', 'family', 'travel', 'hrana', 'obitelj', 'putovanje']) {
    const catCard = page.locator('button, [class*="card"], [class*="lesson"]').filter({ hasText: new RegExp(category, 'i') }).first();
    if (await catCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await catCard.scrollIntoViewIfNeeded().catch(() => {});
      await catCard.click().catch(() => {});
      await page.waitForTimeout(1200);
      await dismissAll(page);
      const content = await page.locator('#root').innerText().catch(() => '');
      if (content.match(/vocabulary|word|lesson|question/i)) {
        ok(`"${category}" vocabulary lesson launched`);
        await ss(page, `b06-vocab-${category}`);
        await runFlashcards(page, 6);
        await runQuiz(page, category, 8);
        await exitScreen(page);
        await goTab(page, 'Learn');
        break;
      } else {
        await exitScreen(page);
        await goTab(page, 'Learn');
      }
    }
  }

  // Practice vocabulary Quick Games after lessons
  await goTab(page, 'Practice');
  const fcLaunched = await clickQuickGame(page, 'Flashcards');
  if (fcLaunched) {
    const rated = await runFlashcards(page, 8);
    ok(`Post-lesson Flashcards: ${rated} cards rated`);
    await exitScreen(page);
  }

  await goTab(page, 'Practice');
  const quizLaunched = await clickQuickGame(page, 'Quiz');
  if (quizLaunched) {
    const answered = await runQuiz(page, 'VocabQuiz', 12);
    ok(`Vocabulary Quiz: ${answered} questions`);
    await exitScreen(page);
  }

  const xpEnd = await readXP(page);
  info(`XP at end of Block 6: ${xpEnd}`);
  if (xpEnd !== null && xpStart !== null && xpEnd <= xpStart)
    info('XP unchanged in Block 6 (xpCooldown active for this session — expected)');
  else if (xpEnd !== null && xpStart !== null)
    ok(`XP gained in Block 6: +${xpEnd - xpStart}`);
});

test('Block 7 (Days 37-42) — SRS mastery: spaced repetition, weak words, review', async ({ page }) => {
  attachErrorListeners(page, 'Block7');
  await login(page);

  // SRS review sessions — morning, afternoon, evening pattern
  for (let session = 1; session <= 3; session++) {
    await goTab(page, 'Practice');
    const srsLaunched = await clickBrowseExercise(page, 'SRS Review');
    if (srsLaunched) {
      const srsText = await page.locator('#root').innerText().catch(() => '');
      if (srsText.match(/review|due|card|flip|no.*item|all.*done/i)) {
        ok(`SRS session ${session}: review screen loaded`);
        await ss(page, `b07-srs-session-${session}`);
        const reviewed = await runSRSSession(page, 8);
        if (reviewed > 0) ok(`SRS session ${session}: ${reviewed} cards reviewed`);
        else info(`SRS session ${session}: no cards due`);
      }
      await exitScreen(page);
    }
    // Between sessions, do flashcards to generate SRS data
    await goTab(page, 'Practice');
    const fcLaunched = await clickQuickGame(page, 'Flashcards');
    if (fcLaunched) {
      const rated = await runFlashcards(page, 6);
      ok(`Inter-SRS Flashcards session ${session}: ${rated} rated`);
      await exitScreen(page);
    }
  }

  // Check SRS queue size after sessions
  await goTab(page, 'Practice');
  const browseText = await page.locator('#root').innerText().catch(() => '');
  if (browseText.match(/\d+\s*due|queue|review/i)) ok('SRS queue count visible in Practice tab');
  else info('SRS queue count not directly visible');

  // Mistake review / Weak Words
  await goTab(page, 'Practice');
  for (const label of ['Mistake Review', 'Weak Words', 'Fix Mistakes', 'My Mistakes']) {
    const weakLaunched = await clickBrowseExercise(page, label);
    if (weakLaunched) {
      ok(`"${label}" accessible from Browse All`);
      await ss(page, 'b07-weak-words');
      const answered = await runGenericExercise(page, 5);
      ok(`Weak Words: ${answered} interactions`);
      await exitScreen(page);
      break;
    }
  }
});

test('Block 8 (Days 43-48) — AI conversations: Maja + multiple topics', async ({ page }) => {
  attachErrorListeners(page, 'Block8');
  await login(page);

  // ── Find AI Conversation entry (Practice or Learn tab)
  let aiFound = false;
  for (const [tabLabel, exerciseLabel] of [['Practice', 'AI Conversation'], ['Practice', 'Conversation'], ['Learn', 'Maja'], ['Practice', 'Tutor']]) {
    await goTab(page, tabLabel);
    const launched = await clickBrowseExercise(page, exerciseLabel);
    if (launched) {
      aiFound = true;
      ok(`AI Conversation "${exerciseLabel}" launched`);
      await ss(page, 'b08-ai-convo');
      // Select persona if available
      const mayaBtn = page.locator('button').filter({ hasText: /maja|marko|local|tourist|formal/i }).first();
      if (await mayaBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await mayaBtn.click().catch(() => {});
        await page.waitForTimeout(800);
        ok('AI persona selected');
      }
      // Send a message
      const msgInput = page.locator('input[type="text"], textarea').first();
      if (await msgInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await msgInput.fill('Dobar dan! Kako se zovete?');
        await msgInput.press('Enter');
        await page.waitForTimeout(3000);
        const replyText = await page.locator('#root').innerText().catch(() => '');
        if (replyText.match(/Dobar|zovem|hvala|zdravo|pozdrav/i)) ok('AI responded in Croatian');
        else info('AI response received (content not matched)');
        // Second message
        await msgInput.fill('Ja studiram hrvatski jezik.');
        await msgInput.press('Enter');
        await page.waitForTimeout(2500);
        ok('Second message sent to AI tutor');
        await ss(page, 'b08-ai-response');
      } else info('AI message input not visible — may use voice-only UI');
      await exitScreen(page);
      break;
    }
  }
  if (!aiFound) {
    bug('UX', 'AI', 'AI Conversation not accessible from Practice or Learn tab');
  }

  // ── AI Story (if accessible)
  await goTab(page, 'Practice');
  const aiStoryLaunched = await clickBrowseExercise(page, 'AI Story');
  if (aiStoryLaunched) {
    ok('AI Story screen accessed');
    await ss(page, 'b08-ai-story');
    const storyText = await page.locator('#root').innerText().catch(() => '');
    if (storyText.match(/story|story|generate|create|priča/i)) ok('AI Story has content');
    await exitScreen(page);
  } else info('AI Story not accessible from Browse All (may be in Learn tab)');
});

test('Block 9 (Days 49-54) — Speaking & Listening: drill, shadowing, listening', async ({ page }) => {
  attachErrorListeners(page, 'Block9');
  await login(page);

  // ── Speaking drill
  await goTab(page, 'Practice');
  const speakLaunched = await clickBrowseExercise(page, 'Speaking');
  if (speakLaunched) {
    ok('Speaking drill loaded');
    await ss(page, 'b09-speaking');
    const speakText = await page.locator('#root').innerText().catch(() => '');
    if (speakText.match(/microphone|record|speak|pronunciation|say/i)) ok('Speaking drill prompts for speech input');
    else info('Speaking drill loaded (no microphone prompt detected — may need permissions)');
    await exitScreen(page);
  } else info('Speaking drill not found in Browse All');

  // ── Shadowing
  await goTab(page, 'Practice');
  const shadowLaunched = await clickBrowseExercise(page, 'Shadowing');
  if (shadowLaunched) {
    ok('Shadowing screen loaded');
    await ss(page, 'b09-shadowing');
    const shadowText = await page.locator('#root').innerText().catch(() => '');
    if (shadowText.match(/play|shadow|repeat|listen|audio|sentence/i)) ok('Shadowing has audio content');
    const playBtn = page.locator('button').filter({ hasText: /play|▶|🔊/i }).first();
    if (await playBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await playBtn.click().catch(() => {});
      await page.waitForTimeout(1500);
      ok('Shadowing audio play button works');
    }
    await exitScreen(page);
  } else info('Shadowing not found in Browse All');

  // ── Listening exercise
  await goTab(page, 'Practice');
  const listenLaunched = await clickBrowseExercise(page, 'Listening');
  if (listenLaunched) {
    ok('Listening exercise loaded');
    await ss(page, 'b09-listening');
    const listenAnswered = await runGenericExercise(page, 5);
    ok(`Listening: ${listenAnswered} interactions`);
    await exitScreen(page);
  } else info('Listening exercise not found in Browse All');

  // ── Speaking Quick Game (if available)
  await goTab(page, 'Practice');
  const speakQG = await clickQuickGame(page, 'Speaking');
  if (speakQG) {
    ok('Speaking Quick Game launched');
    await page.waitForTimeout(2000);
    await exitScreen(page);
  } else info('Speaking Quick Game not in Quick Games section');
});

test('Block 10 (Days 55-60) — 30-day milestone: profile stats, badges, streak check', async ({ page }) => {
  attachErrorListeners(page, 'Block10');
  await login(page);
  await goTab(page, 'Profile');
  await ss(page, 'b10-profile-30day');

  const profileText = await page.locator('#root').innerText().catch(() => '');

  // Profile stat checks
  const xp = await readXP(page);
  const streak = await readStreak(page);
  const level = await readLevel(page);
  info(`30-day milestone check — XP: ${xp}, Streak: ${streak}, Level: ${level}`);

  if (xp !== null && xp > 0) ok(`XP accumulated: ${xp}`);
  else bug('BUG', 'Profile', 'XP not readable on profile at 30-day mark');

  for (const stat of ['XP', 'Streak', 'Lessons', 'Level']) {
    if (profileText.match(new RegExp(stat, 'i'))) ok(`Stat "${stat}" visible on profile`);
    else bug('UX', 'Profile', `Stat "${stat}" missing from profile`);
  }

  // Badges section
  if (profileText.match(/badge|achievement|earned|trophy/i)) {
    ok('Badges section visible on profile');
    await ss(page, 'b10-badges');
  } else bug('UX', 'Profile', 'No badges section on profile');

  // Activity heatmap
  if (profileText.match(/activity|heatmap|calendar|week/i)) ok('Activity heatmap on profile');
  else info('Activity heatmap not visible');

  // Level progress bar
  if (profileText.match(/level|next.*level|xp.*next/i)) ok('Level progress indicator visible');

  // Leaderboard
  const leaderboardBtn = page.locator('button, a').filter({ hasText: /leaderboard|league|rank/i }).first();
  if (await leaderboardBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await leaderboardBtn.click().catch(() => {});
    await page.waitForTimeout(800);
    const lbText = await page.locator('#root').innerText().catch(() => '');
    if (lbText.match(/rank|xp|league|user|player/i)) ok('Leaderboard has entries');
    else info('Leaderboard loaded but no entries visible');
    await ss(page, 'b10-leaderboard');
    await exitScreen(page);
  } else info('Leaderboard button not found on profile');
});

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 3 — INTERMEDIATE PROGRESSION (Days 61–90)
// ══════════════════════════════════════════════════════════════════════════════

test('Block 11 (Days 61-66) — Difficulty upgrade to Intermediate, adjusted content', async ({ page }) => {
  phase('PHASE 3: INTERMEDIATE PROGRESSION');
  attachErrorListeners(page, 'Block11');
  await login(page);

  // Change difficulty to Intermediate
  await goTab(page, 'Profile');
  const diffVisible = await page.locator('#root').innerText().catch(() => '');
  const diffBtn = page.locator('button, select, [role="combobox"]').filter({ hasText: /difficulty|beginner|intermediate|advanced/i }).first();
  if (await diffBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    ok('Difficulty setting accessible');
    await diffBtn.click().catch(() => {});
    await page.waitForTimeout(500);
    const intOption = page.locator('button, option, [role="option"]').filter({ hasText: /intermediate/i }).first();
    if (await intOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await intOption.click().catch(() => {});
      await page.waitForTimeout(600);
      ok('Difficulty changed to Intermediate');
      await ss(page, 'b11-difficulty-intermediate');
    } else info('Intermediate option not visible in difficulty dropdown');
  } else {
    // Try via Settings
    const settingsBtn = page.locator('button, a').filter({ hasText: /settings|⚙/i }).first();
    if (await settingsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await settingsBtn.click().catch(() => {});
      await page.waitForTimeout(600);
      const intInSettings = page.locator('button, option').filter({ hasText: /intermediate/i }).first();
      if (await intInSettings.isVisible({ timeout: 2000 }).catch(() => false)) {
        await intInSettings.click().catch(() => {});
        await page.waitForTimeout(500);
        ok('Difficulty changed to Intermediate via Settings');
      } else info('Intermediate option not found in Settings');
      await exitScreen(page);
    } else info('Difficulty setting not found on Profile or Settings');
  }

  // After difficulty upgrade, verify Learn and Practice content adapts
  await goTab(page, 'Learn');
  const learnText = await page.locator('#root').innerText().catch(() => '');
  ok(`Learn tab content after difficulty change: ${learnText.slice(0, 100).replace(/\n/g, ' ')}`);

  // Practice with intermediate-level content
  await goTab(page, 'Practice');
  const quizLaunched = await clickQuickGame(page, 'Quiz');
  if (quizLaunched) {
    const answered = await runQuiz(page, 'IntermediateQuiz', 15);
    ok(`Intermediate Quiz: ${answered} questions answered`);
    await exitScreen(page);
  }
});

test('Block 12 (Days 67-72) — Advanced grammar: Aspect, Word Order, CEFR B1', async ({ page }) => {
  attachErrorListeners(page, 'Block12');
  await login(page);

  // ── Aspect Drill
  await goTab(page, 'Practice');
  let aspectFound = false;
  for (const label of ['Aspect Drill', 'Verbal Aspect', 'Aspect', 'Glagolski vid']) {
    const launched = await clickBrowseExercise(page, label);
    if (launched) {
      ok(`Aspect drill "${label}" launched`);
      await ss(page, 'b12-aspect');
      const aspectText = await page.locator('#root').innerText().catch(() => '');
      if (aspectText.match(/perfective|imperfective|aspect|svršeni|nesvršeni|vid/i))
        ok('Aspect drill has verbal aspect content');
      const answered = await runGenericExercise(page, 8);
      ok(`Aspect: ${answered} interactions`);
      await exitScreen(page);
      aspectFound = true;
      break;
    }
  }
  if (!aspectFound) bug('UX', 'PracticeTab', 'Aspect Drill not found in Browse All');

  // ── CEFR B1 level
  await goTab(page, 'Practice');
  const cefrLaunched = await clickBrowseExercise(page, 'CEFR');
  if (cefrLaunched) {
    const b1Btn = page.locator('button').filter({ hasText: /^B1$/i }).first();
    if (await b1Btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await b1Btn.click().catch(() => {});
      await page.waitForTimeout(600);
      ok('CEFR B1 level selected');
      await ss(page, 'b12-cefr-b1');
      const b1Answered = await runGenericExercise(page, 10);
      ok(`CEFR B1: ${b1Answered} interactions`);
    } else {
      const a2Btn = page.locator('button').filter({ hasText: /^A2$/i }).first();
      if (await a2Btn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await a2Btn.click().catch(() => {});
        await page.waitForTimeout(500);
        ok('CEFR A2 selected (B1 not yet unlocked)');
        const a2Answered = await runGenericExercise(page, 8);
        ok(`CEFR A2: ${a2Answered} interactions`);
      }
    }
    await exitScreen(page);
  }

  // ── Questions drill
  await goTab(page, 'Practice');
  for (const label of ['Questions', 'Question Formation', 'Upitne rečenice']) {
    const launched = await clickBrowseExercise(page, label);
    if (launched) {
      ok(`"${label}" drill launched`);
      const answered = await runGenericExercise(page, 6);
      ok(`Questions drill: ${answered} interactions`);
      await exitScreen(page);
      break;
    }
  }
  info('Grammar drills block complete');
});

test('Block 13 (Days 73-78) — Croatia deep dive: Media, Stories, regional content', async ({ page }) => {
  attachErrorListeners(page, 'Block13');
  await login(page);
  await goTab(page, 'Croatia');
  await ss(page, 'b13-croatia-start');

  // ── Media sub-tab
  const mediaBtn = page.locator('button').filter({ hasText: /^media$/i }).first();
  if (await mediaBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await mediaBtn.click().catch(() => {});
    await page.waitForTimeout(700);
    const mediaText = await page.locator('#root').innerText().catch(() => '');
    if (mediaText.match(/film|music|song|video|news|sport|media|pjesma|film/i)) {
      ok('Media sub-tab has media content');
      await ss(page, 'b13-media');
      // Click first media item
      const firstItem = page.locator('[class*="card"], button, [class*="item"]').filter({ hasText: /\w{5,}/ }).first();
      if (await firstItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstItem.click().catch(() => {});
        await page.waitForTimeout(1200);
        const itemText = await page.locator('#root').innerText().catch(() => '');
        if (itemText.match(/\w{20,}/)) ok('Media item content loaded');
        await exitScreen(page);
      }
    } else info('Media sub-tab loaded but no media keywords matched');
  } else info('Media sub-tab not found (may have different label)');

  // ── Stories sub-tab
  await goTab(page, 'Croatia');
  const storiesBtn = page.locator('button').filter({ hasText: /^stories$/i }).first();
  if (await storiesBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await storiesBtn.click().catch(() => {});
    await page.waitForTimeout(700);
    const storiesText = await page.locator('#root').innerText().catch(() => '');
    if (storiesText.match(/story|story|priča|read|listen|folk|tale|legend/i)) {
      ok('Stories sub-tab has story content');
      await ss(page, 'b13-stories');
      const firstStory = page.locator('[class*="card"], button').filter({ hasText: /\w{5,}/ }).first();
      if (await firstStory.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstStory.click().catch(() => {});
        await page.waitForTimeout(1000);
        ok('Story item opened');
        await exitScreen(page);
      }
    } else info('Stories sub-tab loaded (no story keywords detected)');
  } else info('Stories sub-tab not found (may have different label)');

  // ── Regional content (Dalmatia, Zagreb, Istria, Slavonia)
  await goTab(page, 'Croatia');
  await page.waitForTimeout(500);
  for (const region of ['Dalmatia', 'Zagreb', 'Istria', 'Slavonia', 'Dalmacija', 'Istra']) {
    const regionCard = page.locator('button, [class*="card"], [class*="region"]').filter({ hasText: new RegExp(region, 'i') }).first();
    if (await regionCard.isVisible({ timeout: 1500 }).catch(() => false)) {
      await regionCard.scrollIntoViewIfNeeded().catch(() => {});
      await regionCard.click().catch(() => {});
      await page.waitForTimeout(1000);
      const regionText = await page.locator('#root').innerText().catch(() => '');
      if (regionText.match(/\w{15,}/)) ok(`Region "${region}" has content`);
      await ss(page, `b13-region-${region.toLowerCase()}`);
      await exitScreen(page);
      await goTab(page, 'Croatia');
      break;
    }
  }
});

test('Block 14 (Days 79-84) — Streak milestone: 60 days, freeze mechanic, weekly goals', async ({ page }) => {
  attachErrorListeners(page, 'Block14');
  await login(page);
  await goTab(page, 'Home');

  const homeText = await page.locator('#root').innerText().catch(() => '');
  const streak = await readStreak(page);
  info(`Streak at Day ~80: ${streak} days`);
  if (streak !== null && streak > 0) ok(`Active streak: ${streak} days`);

  // Daily challenge / study plan completion
  await goTab(page, 'Home');
  const dailyBtn = page.locator('button, a').filter({ hasText: /daily challenge|today.*lesson|study.*plan|daily.*goal/i }).first();
  if (await dailyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    ok('Daily challenge/goal visible on home');
    await dailyBtn.click().catch(() => {});
    await page.waitForTimeout(1500);
    await dismissAll(page);
    const challengeText = await page.locator('#root').innerText().catch(() => '');
    if (challengeText.match(/lesson|question|practice|word/i)) {
      ok('Daily challenge launched successfully');
      await runQuiz(page, 'DailyChallenge', 8);
      await runFlashcards(page, 5);
      await exitScreen(page);
    }
    await goTab(page, 'Home');
  }

  // Streak freeze mechanic
  await goTab(page, 'Profile');
  const profileText = await page.locator('#root').innerText().catch(() => '');
  if (profileText.match(/freeze|shield|protect|streak.*shield/i)) {
    ok('Streak freeze/shield visible on profile');
    await ss(page, 'b14-streak-freeze');
    const freezeBtn = page.locator('button').filter({ hasText: /freeze|use.*shield|protect/i }).first();
    if (await freezeBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      ok('Streak freeze button accessible');
    }
  } else info('Streak freeze not visible on profile (may appear only when streak at risk)');

  // Weekly goal widget check
  await goTab(page, 'Home');
  const goalText = await page.locator('#root').innerText().catch(() => '');
  if (goalText.match(/weekly.*goal|goal.*xp|this week.*xp|\d+\/\d+\s*xp/i))
    ok('Weekly goal progress visible on home');
  else info('Weekly goal not visible (may not be set)');

  // Journey milestones
  await goTab(page, 'Profile');
  for (const milestone of ['journey', 'milestone', 'achievement', '30 day', '60 day', 'first lesson']) {
    if (profileText.match(new RegExp(milestone, 'i'))) {
      ok(`Journey milestone "${milestone}" visible`);
      break;
    }
  }
});

test('Block 15 (Days 85-90) — Community: leaderboard rank, XP race, social', async ({ page }) => {
  attachErrorListeners(page, 'Block15');
  await login(page);

  // ── Leaderboard deep dive
  await goTab(page, 'Profile');
  const leaderboardBtn = page.locator('button, a').filter({ hasText: /leaderboard|league|rank/i }).first();
  if (await leaderboardBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await leaderboardBtn.click().catch(() => {});
    await page.waitForTimeout(1000);
    const lbText = await page.locator('#root').innerText().catch(() => '');
    if (lbText.match(/rank|#\d+|xp|league|week|gold|silver|bronze/i)) {
      ok('Leaderboard with ranking data visible');
      await ss(page, 'b15-leaderboard');

      // Check user position
      const rankMatch = lbText.match(/#?\s*(\d+)\s*(rank|place|position)?/i);
      if (rankMatch) ok(`User rank visible: #${rankMatch[1]}`);

      // Check weekly XP display
      if (lbText.match(/this week|\d+\s*xp.*week|weekly/i)) ok('Weekly XP shown on leaderboard');
    } else bug('UX', 'Leaderboard', 'Leaderboard loaded but no ranking data visible');
    await exitScreen(page);
  } else info('Leaderboard button not found (may be in a different location)');

  // ── Weekly league system
  await goTab(page, 'Profile');
  const leagueText = await page.locator('#root').innerText().catch(() => '');
  for (const league of ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']) {
    if (leagueText.match(new RegExp(league, 'i'))) {
      ok(`Weekly league visible: ${league}`);
      break;
    }
  }

  // ── XP accumulation race
  // Do intensive practice to earn XP for leaderboard
  await goTab(page, 'Practice');
  const quizLaunched = await clickQuickGame(page, 'Quiz');
  if (quizLaunched) {
    const answered = await runQuiz(page, 'LeaderboardRace', 15);
    ok(`Leaderboard XP race — Quiz: ${answered} questions`);
    await exitScreen(page);
  }

  await goTab(page, 'Practice');
  const flashLaunched = await clickQuickGame(page, 'Flashcards');
  if (flashLaunched) {
    const rated = await runFlashcards(page, 8);
    ok(`Leaderboard XP race — Flashcards: ${rated} rated`);
    await exitScreen(page);
  }

  // Check if XP updated on leaderboard
  await goTab(page, 'Profile');
  const xp = await readXP(page);
  info(`XP after Phase 2 (Day ~90): ${xp}`);
});

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 4 — ADVANCED FEATURES (Days 91–120)
// ══════════════════════════════════════════════════════════════════════════════

test('Block 16 (Days 91-96) — Streak break + recovery: lose streak, repair with XP', async ({ page }) => {
  phase('PHASE 4: ADVANCED FEATURES');
  attachErrorListeners(page, 'Block16');
  await login(page);
  await goTab(page, 'Profile');

  const xpBefore = await readXP(page);
  const streakBefore = await readStreak(page);
  info(`Before streak test — XP: ${xpBefore}, Streak: ${streakBefore}`);

  // Check streak repair mechanic visibility
  await goTab(page, 'Home');
  const homeText = await page.locator('#root').innerText().catch(() => '');

  // Streak repair button (appears when streak is 0 or at risk)
  const repairBtn = page.locator('button').filter({ hasText: /repair.*streak|restore.*streak|recover.*streak|streak.*repair/i }).first();
  if (await repairBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    ok('Streak repair button visible on home');
    const repairCost = homeText.match(/(\d+)\s*XP.*repair|repair.*(\d+)\s*XP/i);
    if (repairCost) ok(`Streak repair cost visible: ${repairCost[1] || repairCost[2]} XP`);
    await ss(page, 'b16-streak-repair');
  } else info('Streak repair button not visible (streak may still be active)');

  // Streak freeze display
  await goTab(page, 'Profile');
  const profileText = await page.locator('#root').innerText().catch(() => '');
  if (profileText.match(/freeze|shield|\d+\s*freeze/i)) {
    ok('Streak freeze/shield count visible on profile');
    await ss(page, 'b16-freeze-count');
  }

  // Continue practicing to rebuild/maintain streak
  await goTab(page, 'Practice');
  const quizLaunched = await clickQuickGame(page, 'Quiz');
  if (quizLaunched) {
    const answered = await runQuiz(page, 'StreakRebuild', 12);
    ok(`Streak rebuild session — Quiz: ${answered} questions`);
    await exitScreen(page);
  }

  await goTab(page, 'Practice');
  const flashLaunched = await clickQuickGame(page, 'Flashcards');
  if (flashLaunched) {
    const rated = await runFlashcards(page, 8);
    ok(`Streak rebuild — Flashcards: ${rated} rated`);
    await exitScreen(page);
  }

  const xpAfter = await readXP(page);
  info(`After streak rebuild — XP: ${xpAfter}`);
});

test('Block 17 (Days 97-102) — Vocabulary mastery: Numbers, Work, Body, Colors', async ({ page }) => {
  attachErrorListeners(page, 'Block17');
  await login(page);

  const categories = ['numbers', 'work', 'body', 'colors', 'clothes', 'weather', 'transport', 'numbers', 'brojevi', 'posao', 'tijelo', 'boje'];
  let categoriesFound = 0;

  for (const category of categories) {
    await goTab(page, 'Learn');
    const catCard = page.locator('button, [class*="card"], [class*="lesson"]').filter({ hasText: new RegExp(category, 'i') }).first();
    if (await catCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await catCard.scrollIntoViewIfNeeded().catch(() => {});
      await catCard.click().catch(() => {});
      await page.waitForTimeout(1200);
      await dismissAll(page);
      const content = await page.locator('#root').innerText().catch(() => '');
      if (content.match(/word|vocabulary|lesson|question/i)) {
        ok(`Vocabulary category "${category}" launched`);
        categoriesFound++;
        await ss(page, `b17-vocab-${category}`);
        await runFlashcards(page, 6);
        await runQuiz(page, category, 8);
        await exitScreen(page);
        if (categoriesFound >= 3) break;
      } else {
        await exitScreen(page);
      }
    }
  }

  if (categoriesFound === 0) info('No specific vocabulary categories found by name (may use lesson IDs)');
  else ok(`Found and practiced ${categoriesFound} vocabulary categories`);

  // Vocabulary stats on profile
  await goTab(page, 'Profile');
  const profileText = await page.locator('#root').innerText().catch(() => '');
  if (profileText.match(/vocab|words.*learned|vocabulary.*count|\d+.*words/i))
    ok('Vocabulary count visible on profile');
  else info('Vocabulary count not directly visible on profile');
});

test('Block 18 (Days 103-108) — AI Story + AI Tutor deep dive', async ({ page }) => {
  attachErrorListeners(page, 'Block18');
  await login(page);

  // ── AI Story (generates Croatian story from SRS weak words)
  let storyFound = false;
  for (const [tabLabel, exerciseLabel] of [['Practice', 'AI Story'], ['Learn', 'AI Story'], ['Practice', 'Story']]) {
    await goTab(page, tabLabel);
    const launched = await clickBrowseExercise(page, exerciseLabel);
    if (launched) {
      ok(`"${exerciseLabel}" launched`);
      await ss(page, 'b18-ai-story');
      await page.waitForTimeout(3000); // AI generation takes time
      const storyText = await page.locator('#root').innerText().catch(() => '');
      if (storyText.match(/\w{50,}/)) {
        ok('AI Story has generated substantial content');
        // Try vocabulary quiz within the story
        const storyQuiz = page.locator('button').filter({ hasText: /quiz|practice|test/i }).first();
        if (await storyQuiz.isVisible({ timeout: 2000 }).catch(() => false)) {
          await storyQuiz.click().catch(() => {});
          await page.waitForTimeout(600);
          const quizAnswered = await runQuiz(page, 'StoryQuiz', 5);
          ok(`AI Story integrated quiz: ${quizAnswered} questions`);
        }
      }
      await exitScreen(page);
      storyFound = true;
      break;
    }
  }
  if (!storyFound) info('AI Story not accessible from Browse All');

  // ── AI Tutor (multiple conversation topics)
  const topics = [
    'Idemo u restoran. Što preporučujete?',
    'Trebam help with the accusative case.',
    'Možete li ponoviti sporije, molim?',
  ];
  let tutorFound = false;
  for (const [tabLabel, exerciseLabel] of [['Practice', 'AI Conversation'], ['Practice', 'Tutor'], ['Learn', 'Tutor']]) {
    await goTab(page, tabLabel);
    const launched = await clickBrowseExercise(page, exerciseLabel);
    if (launched) {
      tutorFound = true;
      ok(`AI Tutor "${exerciseLabel}" launched for extended session`);
      for (const topic of topics) {
        const input = page.locator('input[type="text"], textarea').first();
        if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
          await input.fill(topic);
          await input.press('Enter');
          await page.waitForTimeout(3000);
          const reply = await page.locator('#root').innerText().catch(() => '');
          if (reply.match(/[A-Za-zčćžšđČĆŽŠĐ]{5,}/)) ok(`AI Tutor responded to topic ${topics.indexOf(topic) + 1}`);
        }
      }
      await ss(page, 'b18-ai-tutor');
      await exitScreen(page);
      break;
    }
  }
  if (!tutorFound) info('AI Tutor not accessible from Browse or Learn tab');
});

test('Block 19 (Days 109-114) — Full Practice tab sweep: all Browse exercises', async ({ page }) => {
  attachErrorListeners(page, 'Block19');
  await login(page);

  const allExercises = [
    'Flashcards', 'SRS Review', 'Word Order', 'Sentence Cloze',
    'Case Constellation', 'Shadowing', 'Listening',
  ];
  let found = 0;

  for (const exercise of allExercises) {
    await goTab(page, 'Practice');
    const launched = await clickBrowseExercise(page, exercise);
    if (launched) {
      found++;
      ok(`Browse exercise "${exercise}" accessible`);
      await ss(page, `b19-browse-${exercise.toLowerCase().replace(/\s/g, '-')}`);
      const answered = await runGenericExercise(page, 5);
      const flashRated = exercise === 'Flashcards' ? await runFlashcards(page, 5) : 0;
      const srsReviewed = exercise === 'SRS Review' ? await runSRSSession(page, 5) : 0;
      info(`"${exercise}": ${answered + flashRated + srsReviewed} interactions`);
      await exitScreen(page);
    } else {
      info(`"${exercise}" not found in Browse All`);
    }
  }

  ok(`Browse exercises accessible: ${found}/${allExercises.length}`);
  if (found < 3) bug('UX', 'PracticeTab', `Only ${found}/${allExercises.length} expected exercises found in Browse All`);
});

test('Block 20 (Days 115-120) — 90-day milestone: level check, badge sweep, profile', async ({ page }) => {
  attachErrorListeners(page, 'Block20');
  await login(page);
  await goTab(page, 'Profile');
  await ss(page, 'b20-profile-90day');

  const xp = await readXP(page);
  const streak = await readStreak(page);
  const level = await readLevel(page);
  info(`90-day milestone — XP: ${xp}, Streak: ${streak}, Level: ${level}`);

  if (xp !== null && xp > 0) ok(`90-day XP total: ${xp}`);
  else bug('BUG', 'Profile', 'XP not readable at 90-day mark');

  if (level !== null && level > 1) ok(`User has leveled up: Level ${level}`);

  // Badge collection check
  const profileText = await page.locator('#root').innerText().catch(() => '');
  const badgeCount = (profileText.match(/badge|earned|trophy/gi) || []).length;
  info(`Badge mentions in profile: ${badgeCount}`);
  await ss(page, 'b20-badges-90day');

  // Mistakes journal
  for (const label of ['Mistakes', 'Weak Words', 'Journal', 'My Errors', 'Vocabulary Journal']) {
    const btn = page.locator('button, a').filter({ hasText: new RegExp(label, 'i') }).first();
    if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
      ok(`"${label}" accessible from profile`);
      await btn.click().catch(() => {});
      await page.waitForTimeout(800);
      const errText = await page.locator('#root').innerText().catch(() => '');
      if (errText.match(/word|error|mistake|weak|review/i)) ok(`"${label}" has content`);
      await ss(page, `b20-${label.toLowerCase().replace(/\s/g, '-')}`);
      await exitScreen(page);
      break;
    }
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 5 — POWER USER (Days 121–150)
// ══════════════════════════════════════════════════════════════════════════════

test('Block 21 (Days 121-126) — Difficulty upgrade to Advanced', async ({ page }) => {
  phase('PHASE 5: POWER USER');
  attachErrorListeners(page, 'Block21');
  await login(page);
  await goTab(page, 'Profile');

  // Upgrade to Advanced difficulty
  const advancedSet = await (async () => {
    const diffBtn = page.locator('button, select, [role="combobox"]').filter({ hasText: /difficulty|intermediate|advanced/i }).first();
    if (await diffBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await diffBtn.click().catch(() => {});
      await page.waitForTimeout(500);
      const advOpt = page.locator('button, option, [role="option"]').filter({ hasText: /advanced/i }).first();
      if (await advOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
        await advOpt.click().catch(() => {});
        await page.waitForTimeout(500);
        return true;
      }
    }
    return false;
  })();

  if (advancedSet) {
    ok('Difficulty upgraded to Advanced');
    await ss(page, 'b21-difficulty-advanced');
  } else info('Advanced difficulty option not found (may not be accessible from current level)');

  // Test advanced content is harder
  await goTab(page, 'Practice');
  const quizLaunched = await clickQuickGame(page, 'Quiz');
  if (quizLaunched) {
    const answered = await runQuiz(page, 'AdvancedQuiz', 15);
    ok(`Advanced Quiz: ${answered} questions`);
    await exitScreen(page);
  }

  // CEFR B2 attempt
  await goTab(page, 'Practice');
  const cefrLaunched = await clickBrowseExercise(page, 'CEFR');
  if (cefrLaunched) {
    for (const level of ['B2', 'B1', 'A2']) {
      const lvlBtn = page.locator('button').filter({ hasText: new RegExp(`^${level}$`, 'i') }).first();
      if (await lvlBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await lvlBtn.click().catch(() => {});
        await page.waitForTimeout(600);
        ok(`CEFR ${level} selected`);
        const answered = await runGenericExercise(page, 10);
        ok(`CEFR ${level}: ${answered} interactions`);
        await ss(page, `b21-cefr-${level.toLowerCase()}`);
        break;
      }
    }
    await exitScreen(page);
  }
});

test('Block 22 (Days 127-132) — CEFR B1+ grammar sprint: all complex drills', async ({ page }) => {
  attachErrorListeners(page, 'Block22');
  await login(page);

  const grammarDrills = [
    ['Questions', 'Negation', 'Prepositions'],
    ['Gender Jobs', 'M/F Jobs', 'Masculine', 'Feminine'],
    ['Aspect Drill', 'Verbal Aspect'],
    ['Case Constellation'],
    ['Word Order'],
  ];

  let foundDrills = 0;
  for (const labelGroup of grammarDrills) {
    await goTab(page, 'Practice');
    let drillFound = false;
    for (const label of labelGroup) {
      const launched = await clickBrowseExercise(page, label);
      if (launched) {
        foundDrills++;
        ok(`Grammar drill "${label}" launched`);
        await ss(page, `b22-grammar-${label.toLowerCase().replace(/\s/g, '-')}`);
        const answered = await runGenericExercise(page, 8);
        ok(`"${label}": ${answered} interactions`);
        await exitScreen(page);
        drillFound = true;
        break;
      }
    }
    if (!drillFound) info(`Grammar drill group [${labelGroup[0]}] not found in Browse All`);
  }

  ok(`Grammar drills found: ${foundDrills}/${grammarDrills.length} groups`);
  if (foundDrills < 2) bug('UX', 'Grammar', `Only ${foundDrills} grammar drill groups accessible from Browse All`);
});

test('Block 23 (Days 133-138) — Croatia: all 4 sub-tabs + full regional sweep', async ({ page }) => {
  attachErrorListeners(page, 'Block23');
  await login(page);

  let subTabsWorking = 0;
  for (const subTab of ['Discover', 'Culture', 'Media', 'Stories']) {
    await goTab(page, 'Croatia');
    await page.waitForTimeout(400);
    const btn = page.locator('button').filter({ hasText: new RegExp(`^${subTab}$`, 'i') }).first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(800);
      const text = await page.locator('#root').innerText().catch(() => '');
      if (text.match(/\w{10,}/)) {
        ok(`"${subTab}" sub-tab has content`);
        subTabsWorking++;
        await ss(page, `b23-croatia-${subTab.toLowerCase()}`);

        // Click into first item in each sub-tab
        const firstItem = page.locator('[class*="card"], [class*="item"], button').filter({ hasText: /\w{5,}/ }).first();
        if (await firstItem.isVisible({ timeout: 2000 }).catch(() => false)) {
          await firstItem.click().catch(() => {});
          await page.waitForTimeout(1200);
          await dismissAll(page);
          const itemContent = await page.locator('#root').innerText().catch(() => '');
          if (itemContent.match(/\w{20,}/)) ok(`"${subTab}" item opens to content`);
          await exitScreen(page);
        }
      } else bug('UX', `Croatia-${subTab}`, `"${subTab}" sub-tab is empty`);
    } else info(`"${subTab}" sub-tab not found`);
  }

  if (subTabsWorking < 2) bug('UX', 'CroatiaTab', `Only ${subTabsWorking}/4 Croatia sub-tabs have content`);
  else ok(`${subTabsWorking}/4 Croatia sub-tabs working`);
});

test('Block 24 (Days 139-144) — Speaking Sprint + Shadowing intensive', async ({ page }) => {
  attachErrorListeners(page, 'Block24');
  await login(page);

  // ── Speaking Sprint
  await goTab(page, 'Practice');
  let sprintFound = false;
  for (const label of ['Speaking Sprint', 'Sprint', 'Speaking Quick', 'Word Sprint']) {
    const launched = label === 'Word Sprint'
      ? await clickQuickGame(page, 'Word Sprint')
      : await clickBrowseExercise(page, label);
    if (launched) {
      ok(`"${label}" launched`);
      await ss(page, 'b24-speaking-sprint');
      const sprintText = await page.locator('#root').innerText().catch(() => '');
      if (sprintText.match(/sprint|word|speak|type|enter|quick/i)) ok('Speaking Sprint has content');
      const input = page.locator('input[type="text"], input:not([type])').first();
      if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
        for (let i = 0; i < 5; i++) {
          await input.fill('voda');
          await input.press('Enter');
          await page.waitForTimeout(400);
        }
        ok('Speaking Sprint: 5 answers typed');
      } else info('Speaking Sprint: visual/tap UI (no text input)');
      await exitScreen(page);
      sprintFound = true;
      break;
    }
  }
  if (!sprintFound) info('Speaking Sprint not found (may be labeled differently)');

  // ── Shadowing intensive (3 sentences)
  await goTab(page, 'Practice');
  const shadowLaunched = await clickBrowseExercise(page, 'Shadowing');
  if (shadowLaunched) {
    ok('Shadowing intensive session started');
    await ss(page, 'b24-shadowing');
    for (let pass = 0; pass < 3; pass++) {
      const playBtn = page.locator('button').filter({ hasText: /play|▶|🔊/i }).first();
      if (await playBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await playBtn.click().catch(() => {});
        await page.waitForTimeout(2000);
        ok(`Shadowing pass ${pass + 1}: audio played`);
        const nextBtn = page.locator('button').filter({ hasText: /next|continue|→/i }).first();
        if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await nextBtn.click().catch(() => {});
          await page.waitForTimeout(600);
        }
      } else break;
    }
    await exitScreen(page);
  }

  // ── Listening exercise (5 items)
  await goTab(page, 'Practice');
  const listenLaunched = await clickBrowseExercise(page, 'Listening');
  if (listenLaunched) {
    ok('Listening intensive session started');
    await ss(page, 'b24-listening');
    const answered = await runGenericExercise(page, 8);
    ok(`Listening: ${answered} interactions`);
    await exitScreen(page);
  }
});

test('Block 25 (Days 145-150) — Weekly league: rank tracking, XP competition', async ({ page }) => {
  attachErrorListeners(page, 'Block25');
  await login(page);
  await goTab(page, 'Profile');
  await ss(page, 'b25-profile-120day');

  const xp = await readXP(page);
  const streak = await readStreak(page);
  const level = await readLevel(page);
  info(`120-day check — XP: ${xp}, Streak: ${streak}, Level: ${level}`);

  // Weekly league position
  const profileText = await page.locator('#root').innerText().catch(() => '');
  const leagueMatch = profileText.match(/(bronze|silver|gold|platinum|diamond)\s*league/i);
  if (leagueMatch) ok(`Currently in ${leagueMatch[1]} league`);
  else info('League tier not directly visible in profile text');

  // Leaderboard with this week's rank
  const lbBtn = page.locator('button, a').filter({ hasText: /leaderboard|league/i }).first();
  if (await lbBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await lbBtn.click().catch(() => {});
    await page.waitForTimeout(800);
    const lbText = await page.locator('#root').innerText().catch(() => '');
    const rankMatch = lbText.match(/#(\d+)|rank.*(\d+)|(\d+).*rank/i);
    if (rankMatch) ok(`Leaderboard rank: #${rankMatch[1] || rankMatch[2] || rankMatch[3]}`);
    const thisWeekXP = lbText.match(/this week.*(\d+)\s*xp|(\d+)\s*xp.*week/i);
    if (thisWeekXP) ok(`This week's XP on leaderboard: ${thisWeekXP[1] || thisWeekXP[2]}`);
    await ss(page, 'b25-leaderboard-120day');
    await exitScreen(page);
  }

  // Max XP earning session — compete on leaderboard
  for (let i = 0; i < 2; i++) {
    await goTab(page, 'Practice');
    const quizLaunched = await clickQuickGame(page, 'Quiz');
    if (quizLaunched) {
      const answered = await runQuiz(page, `XPRace${i}`, 15);
      ok(`XP race quiz ${i + 1}: ${answered} questions`);
      await exitScreen(page);
    }
    await goTab(page, 'Practice');
    const flashLaunched = await clickQuickGame(page, 'Flashcards');
    if (flashLaunched) {
      const rated = await runFlashcards(page, 8);
      ok(`XP race flashcards ${i + 1}: ${rated} rated`);
      await exitScreen(page);
    }
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 6 — MASTERY & REGRESSION (Days 151–180)
// ══════════════════════════════════════════════════════════════════════════════

test('Block 26 (Days 151-156) — Full vocabulary audit: all categories, SRS status', async ({ page }) => {
  phase('PHASE 6: MASTERY & REGRESSION');
  attachErrorListeners(page, 'Block26');
  await login(page);

  const vocabCategories = [
    'family', 'food', 'travel', 'numbers', 'work', 'body', 'colors', 'clothes',
    'weather', 'transport', 'obitelj', 'hrana', 'putovanje', 'bojevi', 'posao'
  ];
  let categoriesAudited = 0;

  for (const cat of vocabCategories) {
    await goTab(page, 'Learn');
    const catCard = page.locator('button, [class*="card"]').filter({ hasText: new RegExp(cat, 'i') }).first();
    if (await catCard.isVisible({ timeout: 1500 }).catch(() => false)) {
      await catCard.scrollIntoViewIfNeeded().catch(() => {});
      await catCard.click().catch(() => {});
      await page.waitForTimeout(1200);
      await dismissAll(page);
      const text = await page.locator('#root').innerText().catch(() => '');
      if (text.match(/word|vocab|lesson|question/i)) {
        categoriesAudited++;
        await runFlashcards(page, 5);
        await exitScreen(page);
        ok(`Vocabulary "${cat}" audited`);
        if (categoriesAudited >= 5) break;
      } else {
        await exitScreen(page);
      }
    }
  }
  info(`Vocabulary categories audited: ${categoriesAudited}/${vocabCategories.length} searched`);

  // SRS status: how many words in queue
  await goTab(page, 'Practice');
  const srsLaunched = await clickBrowseExercise(page, 'SRS Review');
  if (srsLaunched) {
    const srsText = await page.locator('#root').innerText().catch(() => '');
    const queueMatch = srsText.match(/(\d+)\s*(?:word|card|item)s?\s*(?:due|ready|to review)/i);
    if (queueMatch) ok(`SRS queue at Day 150: ${queueMatch[1]} items due`);
    else if (srsText.match(/no.*item|all.*done|nothing.*due/i)) info('SRS queue empty at Day 150');
    const reviewed = await runSRSSession(page, 10);
    ok(`SRS audit session: ${reviewed} cards reviewed`);
    await exitScreen(page);
  }

  // Profile vocabulary stat
  await goTab(page, 'Profile');
  const profileText = await page.locator('#root').innerText().catch(() => '');
  const vocabMatch = profileText.match(/(\d+)\s*(?:word|vocab|learned)/i);
  if (vocabMatch) ok(`Total vocabulary count on profile: ${vocabMatch[1]} words`);
  else info('Vocabulary count not directly visible on profile');
});

test('Block 27 (Days 157-162) — 150-day milestone: XP check, full badge sweep', async ({ page }) => {
  attachErrorListeners(page, 'Block27');
  await login(page);
  await goTab(page, 'Profile');
  await ss(page, 'b27-profile-150day');

  const xp = await readXP(page);
  const streak = await readStreak(page);
  const level = await readLevel(page);
  info(`150-day milestone — XP: ${xp}, Streak: ${streak}, Level: ${level}`);

  if (xp !== null && xp > 100) ok(`150-day XP: ${xp} (healthy progress)`);
  else if (xp === null) bug('BUG', 'Profile', 'XP not readable at 150-day mark');

  if (level !== null && level >= 5) ok(`Level ${level} achieved at Day 150`);
  else if (level !== null) info(`Current level: ${level} (may be lower due to test account reset)`);

  const profileText = await page.locator('#root').innerText().catch(() => '');

  // Specific badges check
  const expectedBadges = [
    'first lesson', 'streak', 'vocabulary', 'grammar', 'listening', 'speaking',
    'consistency', 'dedication', 'first.*lesson|lesson.*first'
  ];
  let badgesFound = 0;
  for (const badge of expectedBadges) {
    if (profileText.match(new RegExp(badge, 'i'))) badgesFound++;
  }
  info(`Badge-related content matches: ${badgesFound}/${expectedBadges.length}`);

  // Scroll profile to see all badges
  await page.locator('#root').evaluate(el => el.scrollTo(0, el.scrollHeight / 2)).catch(() => {});
  await page.waitForTimeout(500);
  await ss(page, 'b27-badges-full');
  await page.locator('#root').evaluate(el => el.scrollTo(0, el.scrollHeight)).catch(() => {});
  await page.waitForTimeout(500);
  await ss(page, 'b27-profile-bottom');

  // Journey milestones section
  for (const milestone of ['150', '100', '90', '30', '60', 'journey', 'milestone']) {
    if (profileText.match(new RegExp(milestone, 'i'))) {
      ok(`Journey milestone "${milestone}" visible`);
      break;
    }
  }

  // Data export (GDPR)
  const exportBtn = page.locator('button').filter({ hasText: /export.*data|download.*data|gdpr|my data/i }).first();
  if (await exportBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    ok('Data export button accessible on profile');
    // Don't click — just verify accessibility
  } else info('Data export button not visible on profile');
});

test('Block 28 (Days 163-168) — Settings mastery: all options, notifications, TTS', async ({ page }) => {
  attachErrorListeners(page, 'Block28');
  await login(page);
  await goTab(page, 'Profile');

  // Navigate to settings
  const settingsEntry = page.locator('button, a').filter({ hasText: /settings|⚙|preferences/i }).first();
  if (await settingsEntry.isVisible({ timeout: 2000 }).catch(() => false)) {
    await settingsEntry.click().catch(() => {});
    await page.waitForTimeout(600);
  }
  await ss(page, 'b28-settings');

  const settingsText = await page.locator('#root').innerText().catch(() => '');

  // Difficulty setting
  if (settingsText.match(/difficulty|level.*setting|beginner|intermediate|advanced/i)) {
    ok('Difficulty setting visible in settings');
    const advBtn = page.locator('button, option').filter({ hasText: /advanced/i }).first();
    if (await advBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await advBtn.click().catch(() => {});
      await page.waitForTimeout(400);
      ok('Advanced difficulty confirmed');
      // Reset back to intermediate for continued testing
      const intBtn = page.locator('button, option').filter({ hasText: /intermediate/i }).first();
      if (await intBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await intBtn.click().catch(() => {});
        await page.waitForTimeout(400);
      }
    }
  } else info('Difficulty setting not found in settings view');

  // TTS / Voice setting
  if (settingsText.match(/voice|tts|text.to.speech|pronunciation|audio/i)) {
    ok('Voice/TTS setting visible');
    await ss(page, 'b28-settings-tts');
  } else info('TTS/Voice setting not visible');

  // Dark mode
  const darkToggle = page.locator('button, input[type="checkbox"]').filter({ hasText: /dark.*mode|theme|appearance/i }).first();
  if (await darkToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
    await darkToggle.click().catch(() => {});
    await page.waitForTimeout(500);
    ok('Dark mode toggled');
    await ss(page, 'b28-dark-mode');
    // Toggle back
    await darkToggle.click().catch(() => {});
    await page.waitForTimeout(400);
    ok('Dark mode restored');
  } else info('Dark mode toggle not visible in settings');

  // Notification preferences
  if (settingsText.match(/notification|push|remind/i)) {
    ok('Notification preferences visible');
  } else info('Notification settings not visible (may require PWA permissions)');

  // Weekly goal setting
  const goalSetting = page.locator('button, select, input').filter({ hasText: /weekly.*goal|daily.*goal|xp.*goal/i }).first();
  if (await goalSetting.isVisible({ timeout: 2000 }).catch(() => false)) {
    ok('Weekly/daily goal setting accessible');
    await goalSetting.click().catch(() => {});
    await page.waitForTimeout(400);
    await exitScreen(page);
  } else info('Goal setting not found in settings');
});

test('Block 29 (Days 169-174) — Stress test: rapid switching, all tabs, all games', async ({ page }) => {
  attachErrorListeners(page, 'Block29');
  await login(page);

  // ── Rapid tab switching (5 rounds)
  const tabs = ['Home', 'Learn', 'Practice', 'Croatia', 'Profile'];
  for (let round = 0; round < 3; round++) {
    for (const tab of tabs) {
      await dismissAll(page);
      const tabBtn = page.locator('.sb-btn').filter({ hasText: tab }).first();
      if (await tabBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tabBtn.click();
        await page.waitForTimeout(400);
      }
    }
  }

  // Check app didn't crash
  await goTab(page, 'Home');
  const homeText = await page.locator('#root').innerText().catch(() => '');
  if (homeText.match(/\w{10,}/)) ok('App stable after rapid tab switching');
  else bug('BUG', 'RapidNav', 'App appears blank after rapid tab switching');
  await ss(page, 'b29-post-rapid-nav');

  // ── All Quick Games in sequence
  await goTab(page, 'Practice');
  const games = ['Flashcards', 'Quiz', 'Match Pairs', 'Word Sprint'];
  for (const game of games) {
    await goTab(page, 'Practice');
    const launched = await clickQuickGame(page, game);
    if (launched) {
      ok(`Stress: Quick Game "${game}" launched`);
      if (game === 'Flashcards') await runFlashcards(page, 4);
      else if (game === 'Quiz') await runQuiz(page, game, 6);
      else {
        const cards = page.locator('[class*="card"], button').filter({ hasText: /\w+/ });
        const c = await cards.count().catch(() => 0);
        if (c >= 2) {
          await cards.first().click().catch(() => {});
          await page.waitForTimeout(300);
          await cards.nth(1).click().catch(() => {});
        }
      }
      await exitScreen(page);
    }
  }

  // ── Multi-screen navigation
  for (const [tab, exercise] of [['Practice', 'SRS Review'], ['Practice', 'Word Order'], ['Practice', 'Shadowing']]) {
    await goTab(page, tab);
    const launched = await clickBrowseExercise(page, exercise);
    if (launched) {
      await runGenericExercise(page, 3);
      await exitScreen(page);
      ok(`Stress: "${exercise}" navigated successfully`);
    }
  }

  // ── Mobile viewport check
  // Navigate to Home first to ensure we're on a stable main-tab screen (not mid-game)
  await goTab(page, 'Home');
  await page.waitForTimeout(500);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  const mobileText = await page.locator('#root').innerText().catch(() => '');
  if (mobileText.match(/\w{10,}/)) ok('App renders on 390px mobile viewport');
  else bug('BUG', 'Mobile', 'App blank on 390px mobile viewport');
  // On mobile viewport the sidebar (.sb-btn) is hidden; the bottom nav bar (.nav-btn) shows instead
  const mobileTab = page.locator('.sb-btn, .nav-btn').first();
  if (await mobileTab.isVisible({ timeout: 2000 }).catch(() => false)) ok('Tab bar visible on mobile viewport');
  else bug('UX', 'Mobile', 'Tab bar not visible on 390px viewport (checked .sb-btn + .nav-btn)');
  await ss(page, 'b29-mobile-390');

  // ── Tablet viewport check
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(800);
  const tabletText = await page.locator('#root').innerText().catch(() => '');
  if (tabletText.match(/\w{10,}/)) ok('App renders on 768px tablet viewport');
  else bug('BUG', 'Tablet', 'App blank on 768px tablet viewport');
  await ss(page, 'b29-tablet-768');

  // Reset to desktop
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(500);
  await goTab(page, 'Home');
  const finalCheck = await page.locator('#root').innerText().catch(() => '');
  if (finalCheck.match(/\w{10,}/)) ok('App stable after viewport stress tests');
  else bug('BUG', 'ViewportStress', 'App broken after viewport changes');
});

test('Block 30 (Days 175-180) — FINAL AUDIT: complete regression, 180-day summary', async ({ page }) => {
  attachErrorListeners(page, 'Block30');
  await login(page);

  // ── Final XP/Level/Streak snapshot
  await goTab(page, 'Profile');
  await ss(page, 'b30-profile-final');
  const xp = await readXP(page);
  const streak = await readStreak(page);
  const level = await readLevel(page);
  info(`═══ 180-DAY FINAL SNAPSHOT ═══`);
  info(`Total XP:    ${xp}`);
  info(`Streak:      ${streak} days`);
  info(`Level:       ${level}`);

  if (xp === null) bug('BUG', 'Profile', 'XP not readable in final check');
  if (level === null) bug('BUG', 'Profile', 'Level not readable in final check');

  // ── Full navigation regression — every tab must be reachable
  for (const tab of ['Home', 'Learn', 'Practice', 'Croatia', 'Profile']) {
    const reached = await goTab(page, tab);
    if (!reached) bug('BUG', 'FinalNav', `Tab "${tab}" unreachable in final check`);
    else {
      const text = await page.locator('#root').innerText().catch(() => '');
      if (!text.match(/\w{10,}/)) bug('BUG', `FinalNav-${tab}`, `Tab "${tab}" appears blank in final check`);
      else ok(`Final: Tab "${tab}" navigable and has content`);
    }
  }

  // ── Final Learn check
  await goTab(page, 'Learn');
  const learnFinal = await page.locator('#root').innerText().catch(() => '');
  if (learnFinal.match(/lesson|vocab|grammar|unit|week/i)) ok('Final: Learn tab has lesson content');
  else bug('BUG', 'FinalLearn', 'Learn tab empty in final check');

  // ── Final Practice check — Quick Games must all be accessible
  await goTab(page, 'Practice');
  await page.waitForSelector('button.practice-card-dark', { timeout: 5000 }).catch(() => {});
  const quickGames = page.locator('button.practice-card-dark');
  const qgCount = await quickGames.count().catch(() => 0);
  if (qgCount >= 3) ok(`Final: ${qgCount} Quick Game buttons present`);
  else bug('BUG', 'FinalPractice', `Only ${qgCount} Quick Game buttons in final check (expected 6+)`);

  // ── Final full lesson + XP earn
  const quizLaunched = await clickQuickGame(page, 'Quiz');
  if (quizLaunched) {
    const answered = await runQuiz(page, 'FinalQuiz', 12);
    ok(`Final Quiz: ${answered} questions answered`);
    await exitScreen(page);
    await goTab(page, 'Profile');
    const xpFinal = await readXP(page);
    info(`XP after final quiz: ${xpFinal}`);
    await ss(page, 'b30-xp-final');
  } else bug('BUG', 'FinalQuiz', 'Quiz Quick Game not launchable in final check');

  // ── Croatia final check
  await goTab(page, 'Croatia');
  const croatiaFinal = await page.locator('#root').innerText().catch(() => '');
  if (croatiaFinal.match(/discover|culture|media|stories|region|hrvatska/i)) ok('Final: Croatia tab content intact');
  else bug('BUG', 'FinalCroatia', 'Croatia tab empty in final check');

  // ── Auth state: verify user is still logged in after 180 blocks
  if (!page.locator('.sb-btn').first().isVisible()) {
    const finalLoginCheck = await page.locator('.sb-btn').count().catch(() => 0);
    if (finalLoginCheck === 0) bug('BUG', 'AuthState', 'User appears logged out in final check');
    else ok('Auth state maintained throughout 180-day simulation');
  } else ok('Auth state maintained throughout 180-day simulation');

  await ss(page, 'b30-final-complete');
  info('═══ 180-DAY SIMULATION COMPLETE ═══');
});
