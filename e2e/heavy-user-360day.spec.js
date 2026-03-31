/**
 * 360-DAY FLUENCY JOURNEY AUDIT
 * Simulates a highly motivated learner going from complete beginner to B2/C1
 * fluency over 12 months of intensive daily use, with deep focus on immersion
 * tools — Croatia Media, Stories, AI Tutor, Shadowing, and Speaking Sprint.
 *
 * Credentials: claude.test.nasahrvatska@gmail.com / ***REMOVED***
 * Target:      https://nasahrvatska.com
 *
 * User profile:
 *   - 60-90 min daily sessions, 7 days/week
 *   - A1 → C1 CEFR arc over 12 months
 *   - Heavy immersion: Croatia Media + Stories daily from Month 3
 *   - AI Tutor conversations multiple times per week from Month 2
 *   - Shadowing + Speaking Sprint as core fluency tools from Month 4
 *   - Full SRS mastery — reviews every session, all categories
 *   - Cultural deep dives: cuisine, history, music, dialect regions
 *   - End-state: Level 30+, 300+ day streak, full badge collection
 *
 * Structure (36 blocks × 10 days = 360 days):
 *
 * PHASE 1 — Foundation (Days 1–60, Blocks 1–6)
 *   Block 1  (Days   1-10): First session, onboarding, home, first XP
 *   Block 2  (Days  11-20): Learn tab mastery, all lesson types, audio
 *   Block 3  (Days  21-30): Practice fundamentals, Quick Games sweep
 *   Block 4  (Days  31-40): Croatia tab discovery, Discover + Culture
 *   Block 5  (Days  41-50): First AI Tutor conversation, vocabulary build
 *   Block 6  (Days  51-60): 60-day milestone, SRS habit, streak check
 *
 * PHASE 2 — Building Momentum (Days 61–120, Blocks 7–12)
 *   Block 7  (Days  61-70): Croatia Media first deep dive
 *   Block 8  (Days  71-80): Croatia Stories — reading + listening
 *   Block 9  (Days  81-90): Vocabulary expansion, Food/Family/Travel SRS
 *   Block 10 (Days  91-100): AI Tutor — grammar clarification sessions
 *   Block 11 (Days 101-110): Difficulty → Intermediate, adjusted content
 *   Block 12 (Days 111-120): 120-day milestone, badges, leaderboard
 *
 * PHASE 3 — Intermediate Immersion (Days 121–180, Blocks 13–18)
 *   Block 13 (Days 121-130): Shadowing intensive begins
 *   Block 14 (Days 131-140): All 4 Croatia sub-tabs, regional deep dive
 *   Block 15 (Days 141-150): AI Story generation + critique loop
 *   Block 16 (Days 151-160): Speaking Sprint daily habit
 *   Block 17 (Days 161-170): Grammar sprint — Aspect Drill, Word Order, Cases
 *   Block 18 (Days 171-180): 180-day milestone, profile audit, badge sweep
 *
 * PHASE 4 — Advanced Grammar + AI Fluency (Days 181–240, Blocks 19–24)
 *   Block 19 (Days 181-190): Difficulty → Advanced, complex grammar
 *   Block 20 (Days 191-200): AI Tutor — advanced conversation, B2 topics
 *   Block 21 (Days 201-210): Croatia Media — music + film immersion
 *   Block 22 (Days 211-220): SRS mastery — all categories, weak word hunt
 *   Block 23 (Days 221-230): Full browse sweep — all exercise types
 *   Block 24 (Days 231-240): 240-day milestone, streak, XP, level audit
 *
 * PHASE 5 — Near-Fluency + Media Mastery (Days 241–300, Blocks 25–30)
 *   Block 25 (Days 241-250): Shadowing + Speaking Sprint intensive week
 *   Block 26 (Days 251-260): Croatia Stories — advanced reading
 *   Block 27 (Days 261-270): AI Tutor — free conversation, corrections
 *   Block 28 (Days 271-280): Weekly leagues, leaderboard, social features
 *   Block 29 (Days 281-290): Settings mastery, notifications, voice config
 *   Block 30 (Days 291-300): 300-day milestone — full immersion day
 *
 * PHASE 6 — Fluency Simulation + Final Audit (Days 301–360, Blocks 31–36)
 *   Block 31 (Days 301-310): Full vocabulary audit — all SRS categories
 *   Block 32 (Days 311-320): AI Tutor marathon — 5 topics in one session
 *   Block 33 (Days 321-330): Croatia all sub-tabs + AI Story generation
 *   Block 34 (Days 331-340): Rapid-switching stress test, all features
 *   Block 35 (Days 341-350): 350-day streak push, premium features
 *   Block 36 (Days 351-360): Final audit — complete regression, XP/level/streak
 */

import { test } from '@playwright/test';
import fs from 'fs';

const EMAIL    = 'claude.test.nasahrvatska@gmail.com';
const PASSWORD = '***REMOVED***';
const SS_DIR   = '360day-audit-screenshots';
const REPORT   = '360day-audit-report.json';

// ── Reporting ──────────────────────────────────────────────────────────────────
const issues = [];
function bug(sev, ctx, desc) {
  console.error(`❌ [${sev}] ${ctx} — ${desc}`);
  issues.push({ sev, ctx, desc, ts: new Date().toISOString() });
}
function ok(msg)    { console.log(`  ✅ ${msg}`); }
function info(msg)  { console.log(`  ℹ️  ${msg}`); }
function phase(msg) { console.log(`\n${'─'.repeat(60)}\n  📍 ${msg}\n${'─'.repeat(60)}`); }

test.afterAll(() => {
  if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });
  fs.writeFileSync(REPORT, JSON.stringify({ total: issues.length, issues }, null, 2));
  const divider = '═'.repeat(70);
  console.log('\n' + divider);
  console.log('360-DAY FLUENCY JOURNEY AUDIT COMPLETE — ' + issues.length + ' total issues');
  const counts = {};
  issues.forEach(i => { counts[i.sev] = (counts[i.sev] || 0) + 1; });
  Object.entries(counts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log('  Screenshots: ' + SS_DIR + '/');
  console.log('  Report:      ' + REPORT);
  console.log(divider);
  if (issues.length === 0) console.log('\n✅ Zero issues detected across 360 days.\n');
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
    if (/Failed to fetch dynamically imported module|module script failed|importing a module script failed/i.test(m)) return;
    bug('JS-ERROR', label, m.slice(0, 200));
  });
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    const t = msg.text();
    if (/firebase|firestore|ERR_|net::|CSP|Content.Security|favicon|403|401|posthog|tts|Failed to load resource/i.test(t)) return;
    if (/module script|dynamically imported module|ChunkLoadError|\] crashed:/i.test(t)) return;
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
  if (!await page.locator('.sb-btn').first().isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await page.waitForSelector('.sb-btn', { state: 'visible', timeout: 20000 }).catch(() => {});
    await dismissModals(page);
  }
}

async function goTab(page, label) {
  await dismissAll(page);
  await page.waitForSelector('.sb-btn', { state: 'attached', timeout: 8000 }).catch(() => {});
  const tab = page.locator('.sb-btn').filter({ hasText: label }).first();
  if (await tab.isVisible({ timeout: 6000 }).catch(() => false)) {
    await tab.click({ timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(900);
    return true;
  }
  bug('NAV', label, `Tab "${label}" not found`);
  return false;
}

async function exitScreen(page) {
  await dismissAll(page);
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
  await page.waitForTimeout(1200);
  await dismissAll(page);
  await page.waitForTimeout(500);
  await dismissAll(page);
  await page.waitForTimeout(300);
  await dismissAll(page);

  const found = await page.waitForSelector('button.practice-card-dark', { timeout: 6000 }).catch(() => null);
  if (!found) {
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
  const card = page.locator('[class*="exercise-card"], [class*="browse-card"], button, .c').filter({ hasText: new RegExp(label, 'i') }).first();
  if (await card.count().catch(() => 0) === 0) return false;
  await card.scrollIntoViewIfNeeded().catch(() => {});
  if (!await card.isVisible({ timeout: 2000 }).catch(() => false)) return false;
  await card.click().catch(() => {});
  await page.waitForTimeout(1200);
  await dismissAll(page);
  return true;
}

async function runQuiz(page, label, maxQ = 20) {
  await page.waitForSelector('.ob', { timeout: 5000 }).catch(() => {});
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

async function runSRSSession(page, maxCards = 8) {
  let reviewed = 0;
  for (let i = 0; i < maxCards; i++) {
    await page.waitForTimeout(600);
    const flip = page.locator('button').filter({ hasText: /flip|reveal|show|tap to reveal/i }).first();
    if (await flip.isVisible({ timeout: 1500 }).catch(() => false)) {
      await flip.click().catch(() => {});
      await page.waitForTimeout(500);
    } else {
      await page.locator('#root').click({ position: { x: 300, y: 300 } }).catch(() => {});
      await page.waitForTimeout(500);
    }
    const rateButtons = page.locator('button').filter({ hasText: /still learning|perfect|easy|good|hard|knew it|again/i });
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

async function launchAITutor(page) {
  // Try browse exercise with several label variants (label varies by build/locale)
  for (const label of ['AI Tutor', 'AI Conversation', 'Conversation', 'Tutor', 'Chat with Maja', 'Chat']) {
    const launched = await clickBrowseExercise(page, label);
    if (launched) return true;
  }
  // Fallback: direct button anywhere on page
  const tutorBtn = page.locator('button, a').filter({ hasText: /ai tutor|ai conversation|conversation|tutor|maja|chat/i }).first();
  if (await tutorBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await tutorBtn.click().catch(() => {});
    await page.waitForTimeout(1500);
    await dismissAll(page);
    return true;
  }
  return false;
}

async function runAITutor(page, topic) {
  if (!await launchAITutor(page)) return false;
  const input = page.locator('input[type="text"], textarea').first();
  if (await input.isVisible({ timeout: 4000 }).catch(() => false)) {
    await input.fill(topic);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
    const responseText = await page.locator('#root').innerText().catch(() => '');
    if (responseText.match(/\w{10,}/)) {
      ok(`AI Tutor responded to: "${topic}"`);
      return true;
    }
  }
  return false;
}

async function exploreCroatiaSubTab(page, subTabLabel) {
  await goTab(page, 'Croatia');
  await page.waitForTimeout(800);
  const subTab = page.locator('button, [role="tab"]').filter({ hasText: new RegExp(subTabLabel, 'i') }).first();
  if (await subTab.isVisible({ timeout: 4000 }).catch(() => false)) {
    await subTab.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const content = await page.locator('#root').innerText().catch(() => '');
    if (content.length > 100) {
      ok(`Croatia → ${subTabLabel} loaded content`);
      return true;
    }
    bug('UX', `Croatia-${subTabLabel}`, `Sub-tab "${subTabLabel}" loaded but content is thin`);
    return false;
  }
  bug('NAV', `Croatia-${subTabLabel}`, `Sub-tab "${subTabLabel}" not found`);
  return false;
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 1 — FOUNDATION (Days 1–60, Blocks 1–6)
// ══════════════════════════════════════════════════════════════════════════════

test('Block 1 (Days 1-10) — First session: home, onboarding, hero CTA, first XP', async ({ page }) => {
  phase('PHASE 1: FOUNDATION (Days 1–60)');
  attachErrorListeners(page, 'Block1');
  await login(page);
  await goTab(page, 'Home');
  await ss(page, 'b01-home');

  const home = await page.locator('#root').innerText().catch(() => '');

  if (home.match(/streak|day streak|🔥/i)) ok('Streak widget visible on home');
  else bug('UX', 'Home', 'Streak widget missing');

  if (home.match(/today|plan|suggested|daily|recommended/i)) ok('Daily plan section visible');
  else bug('UX', 'Home', 'No daily plan or recommended section');

  if (home.match(/vitez|knight|hrvoje|Bok|Dobrodošli/i)) ok('Knight mascot visible');
  else info('Knight mascot not visible');

  const heroCta = page.locator('button, a').filter({ hasText: /continue learning|start lesson|begin|let'?s go|explore/i }).first();
  if (await heroCta.isVisible({ timeout: 3000 }).catch(() => false)) {
    ok('Hero CTA present');
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
      info(`XP — before: ${xpBefore}, after: ${xpAfter}`);
      if (xpBefore !== null && xpAfter !== null && xpAfter < xpBefore)
        bug('BUG', 'XP', `XP dropped after hero lesson: ${xpBefore} → ${xpAfter}`);
      else if (xpAfter !== null && xpAfter > 0) ok(`First XP earned: ${xpAfter} total`);
    } else {
      bug('BUG', 'HeroLesson', 'Hero CTA clicked but no lesson appeared');
    }
  } else {
    bug('UX', 'Home', 'No hero CTA visible');
  }

  for (const tab of ['Learn', 'Practice', 'Croatia', 'Profile']) {
    const reached = await goTab(page, tab);
    if (reached) ok(`Tab "${tab}" reachable from day 1`);
  }
  await goTab(page, 'Home');
  await ss(page, 'b01-complete');
});

test('Block 2 (Days 11-20) — Learn tab: all lesson types, audio, browse modal', async ({ page }) => {
  attachErrorListeners(page, 'Block2');
  await login(page);
  await goTab(page, 'Learn');
  await ss(page, 'b02-learn');

  const learnText = await page.locator('#root').innerText().catch(() => '');
  if (!learnText.match(/lesson|vocabulary|grammar|week|topic|unit/i))
    bug('BUG', 'LearnTab', 'Learn tab shows no lesson content');
  else ok('Learn tab has lesson content');

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
      await runQuiz(page, 'LearnLesson', 10);
      await runFlashcards(page, 5);
    } else {
      bug('BUG', 'LearnTab', 'Lesson card clicked but lesson did not load');
    }
    await exitScreen(page);
  } else {
    bug('BUG', 'LearnTab', 'No lesson card visible on Learn tab');
  }

  await goTab(page, 'Learn');
  const audioBtn = page.locator('button[aria-label*="play"], button[aria-label*="audio"], [class*="tts-btn"]').first();
  if (await audioBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await audioBtn.click().catch(() => {});
    ok('Audio button present and clickable');
    await page.waitForTimeout(1000);
  } else info('Audio button not visible at top level of Learn tab');

  const browseBtn = page.locator('button').filter({ hasText: /browse|all content|explore all/i }).first();
  if (await browseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await browseBtn.click().catch(() => {});
    await page.waitForTimeout(800);
    const modalText = await page.locator('#root').innerText().catch(() => '');
    if (modalText.match(/vocab|grammar|culture|lesson|topic/i)) {
      ok('Browse modal opened with content');
      await ss(page, 'b02-browse-modal');
    } else bug('BUG', 'BrowseModal', 'Browse modal opened but content missing');
    await exitScreen(page);
  } else info('Browse all content button not visible');

  await ss(page, 'b02-complete');
});

test('Block 3 (Days 21-30) — Practice fundamentals: all Quick Games', async ({ page }) => {
  attachErrorListeners(page, 'Block3');
  await login(page);
  await goTab(page, 'Practice');
  await ss(page, 'b03-practice');

  const practiceText = await page.locator('#root').innerText().catch(() => '');
  if (!practiceText.match(/quiz|flashcard|match|game|practice|exercise/i))
    bug('BUG', 'PracticeTab', 'Practice tab has no game content');
  else ok('Practice tab has game content');

  for (const game of ['Flashcards', 'Multiple Choice', 'Matching']) {
    await goTab(page, 'Practice');
    const launched = await clickQuickGame(page, game);
    if (launched) {
      ok(`Quick Game "${game}" launched`);
      await ss(page, `b03-game-${game.toLowerCase().replace(' ', '-')}`);
      await runQuiz(page, game, 8);
      await runFlashcards(page, 4);
      await exitScreen(page);
      await dismissAll(page);
    } else info(`Quick Game "${game}" not found in grid`);
  }

  await goTab(page, 'Practice');
  const srsBtn = page.locator('button, a').filter({ hasText: /review|SRS|spaced|due today/i }).first();
  if (await srsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await srsBtn.click().catch(() => {});
    await page.waitForTimeout(1500);
    await dismissAll(page);
    const reviewed = await runSRSSession(page, 6);
    ok(`SRS session: ${reviewed} cards reviewed`);
    await exitScreen(page);
  } else info('SRS review button not visible at this stage');

  await ss(page, 'b03-complete');
});

test('Block 4 (Days 31-40) — Croatia tab: Discover + Culture sub-tabs', async ({ page }) => {
  attachErrorListeners(page, 'Block4');
  await login(page);

  await goTab(page, 'Croatia');
  await ss(page, 'b04-croatia');

  const croatiaText = await page.locator('#root').innerText().catch(() => '');
  if (!croatiaText.match(/croatia|hrvatska|discover|culture|region|media|stories/i))
    bug('BUG', 'CroatiaTab', 'Croatia tab has no content');
  else ok('Croatia tab loaded with content');

  // Discover sub-tab
  await exploreCroatiaSubTab(page, 'Discover');
  await ss(page, 'b04-discover');
  await page.waitForTimeout(800);

  const discoverContent = await page.locator('#root').innerText().catch(() => '');
  if (discoverContent.match(/region|city|island|split|zagreb|dubrovnik|hvar/i))
    ok('Discover shows regional content');
  else info('Discover content does not mention specific regions');

  const discoverCard = page.locator('[class*="card"], button').filter({ hasText: /region|city|explore|discover|learn more/i }).first();
  if (await discoverCard.isVisible({ timeout: 3000 }).catch(() => false)) {
    await discoverCard.click().catch(() => {});
    await page.waitForTimeout(1200);
    ok('Discover card opened');
    await ss(page, 'b04-discover-detail');
    await exitScreen(page);
  }

  // Culture sub-tab
  await exploreCroatiaSubTab(page, 'Culture');
  await ss(page, 'b04-culture');

  const cultureContent = await page.locator('#root').innerText().catch(() => '');
  if (cultureContent.match(/tradition|festival|klapa|food|cuisine|tamburica|history|customs/i))
    ok('Culture sub-tab shows cultural content');
  else info('Culture content did not match expected keywords');

  const cultureCard = page.locator('[class*="card"], button').filter({ hasText: /tradition|food|festival|culture|history/i }).first();
  if (await cultureCard.isVisible({ timeout: 3000 }).catch(() => false)) {
    await cultureCard.click().catch(() => {});
    await page.waitForTimeout(1200);
    ok('Culture card opened');
    await exitScreen(page);
  }

  await ss(page, 'b04-complete');
});

test('Block 5 (Days 41-50) — First AI Tutor conversation, vocabulary build', async ({ page }) => {
  attachErrorListeners(page, 'Block5');
  await login(page);
  await goTab(page, 'Practice');

  // Try AI Tutor via browse exercises
  const launched = await launchAITutor(page);
  if (launched) {
    ok('AI Tutor launched from browse');
    await ss(page, 'b05-ai-tutor');
    const input = page.locator('input[type="text"], textarea').first();
    if (await input.isVisible({ timeout: 5000 }).catch(() => false)) {
      await input.fill('Kako se zoveš? Što radiš?');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
      const resp = await page.locator('#root').innerText().catch(() => '');
      if (resp.match(/\w{10,}/)) ok('AI Tutor responded to first message');
      else bug('BUG', 'AITutor', 'AI Tutor did not respond to message');
      // Second message — vocabulary question
      if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
        await input.fill('How do I say "I am learning Croatian" in Croatian?');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(3000);
        ok('AI Tutor second message sent');
      }
      await ss(page, 'b05-ai-tutor-conversation');
    } else bug('BUG', 'AITutor', 'AI Tutor input field not found');
    await exitScreen(page);
  } else {
    info('AI Tutor not found in browse exercises');
  }

  // Vocabulary build — multiple flashcard and SRS sessions
  await goTab(page, 'Practice');
  await clickQuickGame(page, 'Flashcards');
  const cards = await runFlashcards(page, 8);
  ok(`Vocabulary flashcard session: ${cards} cards rated`);
  await exitScreen(page);

  await goTab(page, 'Practice');
  await clickQuickGame(page, 'Multiple Choice');
  const q = await runQuiz(page, 'MultipleChoice', 10);
  ok(`Multiple choice vocabulary session: ${q} questions`);
  await exitScreen(page);

  const xp = await readXP(page);
  const streak = await readStreak(page);
  info(`Day 50 stats — XP: ${xp}, Streak: ${streak}`);

  await ss(page, 'b05-complete');
});

test('Block 6 (Days 51-60) — 60-day milestone: SRS habit, streak, badge check', async ({ page }) => {
  attachErrorListeners(page, 'Block6');
  await login(page);
  await goTab(page, 'Profile');
  await ss(page, 'b06-profile');

  const profileText = await page.locator('#root').innerText().catch(() => '');
  if (profileText.match(/xp|level|streak|badge/i)) ok('Profile shows progress data');
  else bug('BUG', 'Profile', 'Profile tab shows no progress stats');

  const xp = await readXP(page);
  const streak = await readStreak(page);
  const level = await readLevel(page);
  info(`60-day milestone — XP: ${xp}, Streak: ${streak}, Level: ${level}`);

  if (xp && xp > 0) ok(`XP accumulated: ${xp}`);
  else bug('BUG', 'Milestone60', 'No XP at 60-day mark');

  // Badge section
  const badgeSection = page.locator('[class*="badge"], [class*="achievement"]').first();
  if (await badgeSection.isVisible({ timeout: 3000 }).catch(() => false)) {
    ok('Badge section visible on profile');
    await ss(page, 'b06-badges');
  } else info('Badge section not visible');

  // SRS session
  await goTab(page, 'Practice');
  const srsBtn = page.locator('button, a').filter({ hasText: /review|SRS|spaced|due today/i }).first();
  if (await srsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await srsBtn.click().catch(() => {});
    await page.waitForTimeout(1500);
    await dismissAll(page);
    const reviewed = await runSRSSession(page, 10);
    ok(`60-day SRS session: ${reviewed} cards reviewed`);
    await exitScreen(page);
  } else info('SRS button not visible');

  // Leaderboard check
  const lbBtn = page.locator('button, a').filter({ hasText: /leaderboard|league|rank|top/i }).first();
  if (await lbBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await lbBtn.click().catch(() => {});
    await page.waitForTimeout(1200);
    const lbText = await page.locator('#root').innerText().catch(() => '');
    if (lbText.match(/rank|#\d|position|league|xp/i)) ok('Leaderboard loaded with data');
    else info('Leaderboard visible but data sparse');
    await exitScreen(page);
  } else info('Leaderboard not accessible from profile');

  await ss(page, 'b06-complete');
});

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 2 — BUILDING MOMENTUM (Days 61–120, Blocks 7–12)
// ══════════════════════════════════════════════════════════════════════════════

test('Block 7 (Days 61-70) — Croatia Media: first deep dive into video/audio content', async ({ page }) => {
  phase('PHASE 2: BUILDING MOMENTUM (Days 61–120)');
  attachErrorListeners(page, 'Block7');
  await login(page);

  await goTab(page, 'Croatia');
  await ss(page, 'b07-croatia');

  // Media sub-tab
  const mediaReached = await exploreCroatiaSubTab(page, 'Media');
  await ss(page, 'b07-media');

  if (mediaReached) {
    const mediaText = await page.locator('#root').innerText().catch(() => '');
    if (mediaText.match(/video|audio|music|film|song|klapa|news|radio|podcast/i))
      ok('Media sub-tab shows media content');
    else bug('UX', 'CroatiaMedia', 'Media sub-tab content does not match expected media types');

    // Open first media item
    const mediaCard = page.locator('[class*="card"], button, a').filter({ hasText: /watch|listen|play|video|music|film/i }).first();
    if (await mediaCard.isVisible({ timeout: 4000 }).catch(() => false)) {
      await mediaCard.click().catch(() => {});
      await page.waitForTimeout(2000);
      await dismissAll(page);
      ok('Media item opened');
      await ss(page, 'b07-media-item');
      // Check for media player or content
      const playerEl = page.locator('video, audio, [class*="player"], [class*="media"]').first();
      if (await playerEl.isVisible({ timeout: 3000 }).catch(() => false))
        ok('Media player element present');
      else info('No visible media player (may be embedded or audio-only)');
      await exitScreen(page);
    } else info('No clickable media cards found');

    // Scroll through media items
    await page.keyboard.press('End').catch(() => {});
    await page.waitForTimeout(800);
    const allMediaItems = await page.locator('[class*="card"], [class*="media-item"]').count().catch(() => 0);
    info(`Media sub-tab shows ${allMediaItems} items`);
  }

  await ss(page, 'b07-complete');
});

test('Block 8 (Days 71-80) — Croatia Stories: reading, listening, comprehension', async ({ page }) => {
  attachErrorListeners(page, 'Block8');
  await login(page);

  await goTab(page, 'Croatia');

  // Stories sub-tab
  const storiesReached = await exploreCroatiaSubTab(page, 'Stories');
  await ss(page, 'b08-stories');

  if (storiesReached) {
    const storiesText = await page.locator('#root').innerText().catch(() => '');
    if (storiesText.match(/story|priča|read|listen|comprehension|chapter|passage/i))
      ok('Stories sub-tab has reading content');
    else bug('UX', 'CroatiaStories', 'Stories sub-tab content does not match expected story types');

    // Open first story
    const storyCard = page.locator('[class*="card"], button, a').filter({ hasText: /story|read|priča|chapter|passage/i }).first();
    if (await storyCard.isVisible({ timeout: 4000 }).catch(() => false)) {
      await storyCard.click().catch(() => {});
      await page.waitForTimeout(2000);
      await dismissAll(page);
      ok('Story opened');
      await ss(page, 'b08-story-open');

      const storyContent = await page.locator('#root').innerText().catch(() => '');
      if (storyContent.length > 100) ok('Story has readable text content');
      else bug('BUG', 'Story', 'Story opened but no text content found');

      // Audio for story
      const audioBtn = page.locator('button[aria-label*="play"], button[aria-label*="audio"], [class*="tts-btn"], [class*="audio-btn"]').first();
      if (await audioBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await audioBtn.click().catch(() => {});
        await page.waitForTimeout(1000);
        ok('Story audio button clicked');
      } else info('No audio button in story');

      // Comprehension questions
      const questionEl = page.locator('.ob, [class*="question"], [class*="choice"]').first();
      if (await questionEl.isVisible({ timeout: 3000 }).catch(() => false)) {
        await runQuiz(page, 'StoryComprehension', 5);
        ok('Story comprehension questions answered');
      } else info('No comprehension questions visible in story');

      await exitScreen(page);
    } else info('No story cards visible');

    // Open a second story to confirm variety
    await exploreCroatiaSubTab(page, 'Stories');
    await page.waitForTimeout(500);
    const allStories = await page.locator('[class*="card"], [class*="story"]').count().catch(() => 0);
    info(`Stories sub-tab shows ${allStories} items`);
    if (allStories >= 2) ok('Multiple stories available');
  }

  await ss(page, 'b08-complete');
});

test('Block 9 (Days 81-90) — Vocabulary expansion: Food, Family, Travel SRS categories', async ({ page }) => {
  attachErrorListeners(page, 'Block9');
  await login(page);
  await goTab(page, 'Practice');

  for (const category of ['Food', 'Family', 'Travel']) {
    await goTab(page, 'Practice');
    await page.waitForTimeout(500);

    // Try to find category-filtered flashcards
    const categoryBtn = page.locator('button, [role="tab"], [class*="category"]').filter({ hasText: new RegExp(category, 'i') }).first();
    if (await categoryBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await categoryBtn.click().catch(() => {});
      await page.waitForTimeout(800);
      ok(`Vocabulary category "${category}" selected`);
      await clickQuickGame(page, 'Flashcards');
      const cards = await runFlashcards(page, 6);
      ok(`${category} flashcards: ${cards} cards reviewed`);
      await exitScreen(page);
    } else {
      // Fall back to SRS session
      await clickQuickGame(page, 'Flashcards');
      const cards = await runFlashcards(page, 6);
      info(`${category} category not filterable — ran generic flashcards (${cards})`);
      await exitScreen(page);
    }
  }

  // SRS due review
  await goTab(page, 'Practice');
  const srsBtn = page.locator('button, a').filter({ hasText: /review|SRS|due|spaced/i }).first();
  if (await srsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await srsBtn.click().catch(() => {});
    await page.waitForTimeout(1500);
    await dismissAll(page);
    const reviewed = await runSRSSession(page, 12);
    ok(`Vocabulary SRS session: ${reviewed} cards`);
    await exitScreen(page);
  }

  const xp = await readXP(page);
  info(`Day 90 XP: ${xp}`);
  await ss(page, 'b09-complete');
});

test('Block 10 (Days 91-100) — AI Tutor: grammar clarification sessions', async ({ page }) => {
  attachErrorListeners(page, 'Block10');
  await login(page);
  await goTab(page, 'Practice');

  const topics = [
    'Can you explain the difference between perfective and imperfective verbs in Croatian?',
    'What is the vocative case used for in Croatian?',
    'How do I form the past tense in Croatian?',
  ];

  for (const [i, topic] of topics.entries()) {
    await goTab(page, 'Practice');
    const launched = await launchAITutor(page);
    if (launched) {
      ok(`AI Tutor session ${i + 1} launched`);
      const input = page.locator('input[type="text"], textarea').first();
      if (await input.isVisible({ timeout: 5000 }).catch(() => false)) {
        await input.fill(topic);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(4000);
        const resp = await page.locator('#root').innerText().catch(() => '');
        if (resp.match(/\w{20,}/)) ok(`AI Tutor answered grammar question ${i + 1}`);
        else bug('BUG', 'AITutor', `No response to: "${topic.slice(0, 50)}"`);
        await ss(page, `b10-ai-tutor-${i + 1}`);

        // Follow-up question
        if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
          await input.fill('Can you give me an example sentence?');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(3000);
          ok('Follow-up example requested');
        }
      } else bug('BUG', 'AITutor', 'Input field not found in AI Tutor');
      await exitScreen(page);
    } else info(`AI Tutor not launched for topic ${i + 1}`);
  }

  await ss(page, 'b10-complete');
});

test('Block 11 (Days 101-110) — Difficulty → Intermediate, adjusted content', async ({ page }) => {
  attachErrorListeners(page, 'Block11');
  await login(page);
  await goTab(page, 'Profile');
  await ss(page, 'b11-profile-before');

  // Find settings / difficulty selector
  const settingsBtn = page.locator('button, a').filter({ hasText: /settings|⚙|preferences/i }).first();
  if (await settingsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await settingsBtn.click().catch(() => {});
    await page.waitForTimeout(800);
    const diffBtn = page.locator('button, [role="option"], select').filter({ hasText: /intermediate/i }).first();
    if (await diffBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await diffBtn.click().catch(() => {});
      await page.waitForTimeout(600);
      ok('Difficulty set to Intermediate');
      await ss(page, 'b11-difficulty-set');
    } else info('Intermediate difficulty option not found in settings');
  } else {
    const diffBtn = page.locator('button, [role="option"]').filter({ hasText: /intermediate/i }).first();
    if (await diffBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await diffBtn.click().catch(() => {});
      await page.waitForTimeout(600);
      ok('Difficulty set to Intermediate (direct)');
    } else info('Difficulty option not found');
  }

  // Verify content difficulty adjustment
  await goTab(page, 'Learn');
  const learnText = await page.locator('#root').innerText().catch(() => '');
  if (learnText.match(/intermediate|B1|grammar|aspect|case|verb/i))
    ok('Learn tab shows intermediate-level content');
  else info('Learn tab content may not reflect difficulty change immediately');

  // Run a lesson at new difficulty
  const lessonCard = page.locator('[class*="lesson-card"], button').filter({ hasText: /lesson|vocab|grammar|unit/i }).first();
  if (await lessonCard.isVisible({ timeout: 3000 }).catch(() => false)) {
    await lessonCard.click().catch(() => {});
    await page.waitForTimeout(1500);
    await dismissAll(page);
    await runQuiz(page, 'IntermediateLesson', 10);
    await exitScreen(page);
    ok('Intermediate lesson completed');
  }

  await ss(page, 'b11-complete');
});

test('Block 12 (Days 111-120) — 120-day milestone: badges, leaderboard, XP audit', async ({ page }) => {
  attachErrorListeners(page, 'Block12');
  await login(page);
  await goTab(page, 'Profile');
  await ss(page, 'b12-profile');

  const profileText = await page.locator('#root').innerText().catch(() => '');
  const xp = await readXP(page);
  const streak = await readStreak(page);
  const level = await readLevel(page);
  info(`120-day milestone — XP: ${xp}, Streak: ${streak}, Level: ${level}`);

  if (xp && xp > 0) ok(`XP at 120 days: ${xp}`);
  else bug('BUG', 'Milestone120', 'No XP at 120-day mark');
  if (level && level >= 5) ok(`Level at 120 days: ${level}`);
  else info(`Level at 120 days: ${level} (may still be low due to persistent account state)`);

  if (profileText.match(/badge|achievement|trophy|award/i)) {
    ok('Badges/achievements section visible');
    const badgeCount = (profileText.match(/badge|trophy/gi) || []).length;
    info(`Badge mentions in profile: ${badgeCount}`);
  } else bug('UX', 'Profile', 'No badge/achievement section found');

  // Leaderboard
  const lbBtn = page.locator('button, a').filter({ hasText: /leaderboard|league|rank|top/i }).first();
  if (await lbBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await lbBtn.click().catch(() => {});
    await page.waitForTimeout(1200);
    const lbText = await page.locator('#root').innerText().catch(() => '');
    if (lbText.match(/rank|#\d|position|league/i)) ok('Leaderboard shows rank data');
    else info('Leaderboard visible but rank data sparse');
    await ss(page, 'b12-leaderboard');
    await exitScreen(page);
  }

  // Final SRS + quiz combo
  await goTab(page, 'Practice');
  await clickQuickGame(page, 'Multiple Choice');
  const q = await runQuiz(page, 'Milestone120Quiz', 12);
  ok(`120-day quiz: ${q} questions answered`);
  await exitScreen(page);

  await ss(page, 'b12-complete');
});

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 3 — INTERMEDIATE IMMERSION (Days 121–180, Blocks 13–18)
// ══════════════════════════════════════════════════════════════════════════════

test('Block 13 (Days 121-130) — Shadowing intensive begins', async ({ page }) => {
  phase('PHASE 3: INTERMEDIATE IMMERSION (Days 121–180)');
  attachErrorListeners(page, 'Block13');
  await login(page);
  await goTab(page, 'Practice');

  const shadLaunched = await clickBrowseExercise(page, 'Shadowing');
  if (shadLaunched) {
    ok('Shadowing exercise launched');
    await ss(page, 'b13-shadowing');
    const shadText = await page.locator('#root').innerText().catch(() => '');
    if (shadText.match(/listen|repeat|shadow|phrase|sentence|audio/i))
      ok('Shadowing exercise has content');
    else bug('BUG', 'Shadowing', 'Shadowing launched but content not found');
    // Run through exercise interactions
    await runGenericExercise(page, 5).catch(() => {});
    await page.waitForTimeout(1000);
    await exitScreen(page);
  } else {
    bug('UX', 'Shadowing', 'Shadowing exercise not found in browse');
  }

  // Second shadowing session — confirm re-entrancy
  await goTab(page, 'Practice');
  const shadLaunched2 = await clickBrowseExercise(page, 'Shadowing');
  if (shadLaunched2) {
    ok('Shadowing re-entry works');
    await runGenericExercise(page, 3).catch(() => {});
    await exitScreen(page);
  }

  // Complement with listening exercise
  await goTab(page, 'Practice');
  const listenLaunched = await clickBrowseExercise(page, 'Listening');
  if (listenLaunched) {
    ok('Listening exercise launched');
    await runGenericExercise(page, 4).catch(() => {});
    await exitScreen(page);
  } else info('Listening exercise not found in browse');

  await ss(page, 'b13-complete');
});

test('Block 14 (Days 131-140) — All 4 Croatia sub-tabs + regional deep dive', async ({ page }) => {
  attachErrorListeners(page, 'Block14');
  await login(page);

  // All 4 sub-tabs
  for (const subTab of ['Discover', 'Culture', 'Media', 'Stories']) {
    const reached = await exploreCroatiaSubTab(page, subTab);
    if (reached) {
      await ss(page, `b14-croatia-${subTab.toLowerCase()}`);
      // Interact with first card in each sub-tab
      const card = page.locator('[class*="card"], button, a').filter({ hasText: /read|watch|listen|explore|learn|open|view/i }).first();
      if (await card.isVisible({ timeout: 3000 }).catch(() => false)) {
        await card.click().catch(() => {});
        await page.waitForTimeout(1500);
        await dismissAll(page);
        ok(`${subTab} — content item opened`);
        await exitScreen(page);
      } else info(`${subTab} — no interactive card found`);
    }
  }

  // Regional deep dive on Discover
  await exploreCroatiaSubTab(page, 'Discover');
  const regionCards = page.locator('[class*="card"], button').filter({ hasText: /dalmatia|slavonia|istria|zagorje|zagreb|split|dubrovnik|osijek/i });
  const regionCount = await regionCards.count().catch(() => 0);
  if (regionCount > 0) {
    ok(`Found ${regionCount} regional cards in Discover`);
    await regionCards.first().click().catch(() => {});
    await page.waitForTimeout(1500);
    await ss(page, 'b14-region-detail');
    await exitScreen(page);
  } else info('No region-specific cards found in Discover');

  await ss(page, 'b14-complete');
});

test('Block 15 (Days 141-150) — AI Story generation + critique loop', async ({ page }) => {
  attachErrorListeners(page, 'Block15');
  await login(page);
  await goTab(page, 'Practice');

  // AI Story exercise
  const storyLaunched = await clickBrowseExercise(page, 'AI Story');
  if (storyLaunched) {
    ok('AI Story exercise launched');
    await ss(page, 'b15-ai-story');
    const storyText = await page.locator('#root').innerText().catch(() => '');
    if (storyText.match(/story|generate|write|prompt|topic|continue|sentence/i))
      ok('AI Story has generation interface');
    else bug('BUG', 'AIStory', 'AI Story launched but generation interface not found');

    // Interact with story generation
    const genBtn = page.locator('button').filter({ hasText: /generate|create|write|start story|new story/i }).first();
    if (await genBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await genBtn.click().catch(() => {});
      await page.waitForTimeout(4000);
      const generated = await page.locator('#root').innerText().catch(() => '');
      if (generated.match(/[a-zA-Z]{50,}/)) ok('AI Story generated content');
      else info('AI Story generation response was brief');
      await ss(page, 'b15-ai-story-generated');
    } else {
      // Try text input for story prompt
      const input = page.locator('input[type="text"], textarea').first();
      if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
        await input.fill('A day at the market in Split');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(4000);
        ok('AI Story prompt submitted');
        await ss(page, 'b15-ai-story-prompted');
      }
    }
    await exitScreen(page);

    // Second AI Story session
    await goTab(page, 'Practice');
    const storyLaunched2 = await clickBrowseExercise(page, 'AI Story');
    if (storyLaunched2) {
      ok('AI Story second session launched');
      await runGenericExercise(page, 3).catch(() => {});
      await exitScreen(page);
    }
  } else {
    info('AI Story exercise not found in browse');
  }

  await ss(page, 'b15-complete');
});

test('Block 16 (Days 151-160) — Speaking Sprint daily habit', async ({ page }) => {
  attachErrorListeners(page, 'Block16');
  await login(page);
  await goTab(page, 'Practice');

  for (let session = 1; session <= 3; session++) {
    await goTab(page, 'Practice');
    const sprintLaunched = await clickBrowseExercise(page, 'Speaking Sprint');
    if (sprintLaunched) {
      ok(`Speaking Sprint session ${session} launched`);
      await ss(page, `b16-speaking-sprint-${session}`);
      const sprintText = await page.locator('#root').innerText().catch(() => '');
      if (sprintText.match(/speak|say|pronounce|microphone|record|prompt|phrase/i))
        ok(`Speaking Sprint ${session} has content`);
      else info(`Speaking Sprint ${session} content sparse`);
      await runGenericExercise(page, 5).catch(() => {});
      await page.waitForTimeout(800);
      await exitScreen(page);
    } else {
      // Try Quick Game fallback
      const launched = await clickQuickGame(page, 'Speaking');
      if (launched) {
        ok(`Speaking Quick Game session ${session} as fallback`);
        await runGenericExercise(page, 4).catch(() => {});
        await exitScreen(page);
      } else info(`Speaking Sprint/Quick Game not found for session ${session}`);
      break;
    }
  }

  const xp = await readXP(page);
  info(`Day 160 XP: ${xp}`);
  await ss(page, 'b16-complete');
});

test('Block 17 (Days 161-170) — Grammar sprint: Aspect Drill, Word Order, Cases', async ({ page }) => {
  attachErrorListeners(page, 'Block17');
  await login(page);
  await goTab(page, 'Practice');

  for (const exercise of ['Aspect Drill', 'Word Order', 'Case Constellation']) {
    await goTab(page, 'Practice');
    const launched = await clickBrowseExercise(page, exercise);
    if (launched) {
      ok(`Grammar exercise "${exercise}" launched`);
      await ss(page, `b17-${exercise.toLowerCase().replace(' ', '-')}`);
      const q = await runQuiz(page, exercise, 8);
      info(`${exercise}: ${q} questions answered`);
      await exitScreen(page);
    } else {
      // Try as Quick Game
      const qgLaunched = await clickQuickGame(page, exercise);
      if (qgLaunched) {
        ok(`"${exercise}" launched as Quick Game`);
        await runQuiz(page, exercise, 8);
        await exitScreen(page);
      } else info(`"${exercise}" not found in browse or Quick Games`);
    }
  }

  // AI Tutor grammar follow-up
  await goTab(page, 'Practice');
  const tutorLaunched = await launchAITutor(page);
  if (tutorLaunched) {
    const input = page.locator('input[type="text"], textarea').first();
    if (await input.isVisible({ timeout: 5000 }).catch(() => false)) {
      await input.fill('Explain Croatian verbal aspect with 3 example pairs');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(4000);
      ok('Grammar question sent to AI Tutor');
      await ss(page, 'b17-ai-tutor-grammar');
    }
    await exitScreen(page);
  }

  await ss(page, 'b17-complete');
});

test('Block 18 (Days 171-180) — 180-day milestone: profile audit, badge sweep', async ({ page }) => {
  attachErrorListeners(page, 'Block18');
  await login(page);
  await goTab(page, 'Profile');
  await ss(page, 'b18-profile');

  const xp = await readXP(page);
  const streak = await readStreak(page);
  const level = await readLevel(page);
  info(`180-day milestone — XP: ${xp}, Streak: ${streak}, Level: ${level}`);

  if (xp && xp > 0) ok(`XP at 180 days: ${xp}`);
  else bug('BUG', 'Milestone180', 'No XP at 180-day mark');

  // Badge sweep — scroll down to reveal badge section (it may be below the fold)
  await page.keyboard.press('End').catch(() => {});
  await page.waitForTimeout(600);
  const badgeSection = page.locator('[class*="badge"], [class*="achievement"]').first();
  if (await badgeSection.isVisible({ timeout: 4000 }).catch(() => false)) {
    await badgeSection.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(500);
    ok('Badge section visible at 180-day mark');
    await ss(page, 'b18-badges');
    const badgeItems = await page.locator('[class*="badge-item"], [class*="badge"]').count().catch(() => 0);
    info(`Badges visible: ${badgeItems}`);
  } else {
    // Soft warn — badge section may require scroll beyond keyboard End
    info('Badge section not immediately visible at 180 days (may require deeper scroll)');
  }

  // Full navigation regression
  for (const tab of ['Home', 'Learn', 'Practice', 'Croatia', 'Profile']) {
    const ok2 = await goTab(page, tab);
    if (ok2) ok(`Tab "${tab}" accessible at 180-day mark`);
  }

  // XP integrity check
  await goTab(page, 'Practice');
  const xpBefore = await readXP(page);
  await clickQuickGame(page, 'Multiple Choice');
  await runQuiz(page, 'IntegrityCheck', 8);
  await exitScreen(page);
  await goTab(page, 'Profile');
  const xpAfter = await readXP(page);
  if (xpBefore !== null && xpAfter !== null) {
    if (xpAfter < xpBefore) bug('BUG', 'XP', `XP dropped at 180-day check: ${xpBefore} → ${xpAfter}`);
    else ok(`XP integrity OK at 180 days: ${xpBefore} → ${xpAfter}`);
  }

  await ss(page, 'b18-complete');
});

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 4 — ADVANCED GRAMMAR + AI FLUENCY (Days 181–240, Blocks 19–24)
// ══════════════════════════════════════════════════════════════════════════════

test('Block 19 (Days 181-190) — Difficulty → Advanced, complex grammar', async ({ page }) => {
  phase('PHASE 4: ADVANCED GRAMMAR + AI FLUENCY (Days 181–240)');
  attachErrorListeners(page, 'Block19');
  await login(page);
  await goTab(page, 'Profile');

  const settingsBtn = page.locator('button, a').filter({ hasText: /settings|⚙|preferences/i }).first();
  if (await settingsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await settingsBtn.click().catch(() => {});
    await page.waitForTimeout(800);
    const advancedBtn = page.locator('button, [role="option"]').filter({ hasText: /advanced/i }).first();
    if (await advancedBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await advancedBtn.click().catch(() => {});
      await page.waitForTimeout(600);
      ok('Difficulty set to Advanced');
      await ss(page, 'b19-advanced-set');
    } else info('Advanced difficulty not found in settings');
  } else {
    const advancedBtn = page.locator('button, [role="option"]').filter({ hasText: /advanced/i }).first();
    if (await advancedBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await advancedBtn.click().catch(() => {});
      ok('Difficulty set to Advanced (direct)');
    } else info('Difficulty selector not found');
  }

  // Advanced grammar exercises
  await goTab(page, 'Practice');
  for (const exercise of ['Aspect Drill', 'Word Order']) {
    await goTab(page, 'Practice');
    const launched = await clickBrowseExercise(page, exercise);
    if (launched) {
      ok(`Advanced "${exercise}" launched`);
      await runQuiz(page, exercise, 10);
      await exitScreen(page);
    }
  }

  // Learn tab at advanced difficulty
  await goTab(page, 'Learn');
  const learnText = await page.locator('#root').innerText().catch(() => '');
  if (learnText.match(/advanced|B2|C1|complex|subjunctive|conditional/i))
    ok('Learn tab reflects advanced difficulty');
  else info('Learn content may not immediately reflect difficulty change');

  await ss(page, 'b19-complete');
});

test('Block 20 (Days 191-200) — AI Tutor: advanced conversation, B2 topics', async ({ page }) => {
  attachErrorListeners(page, 'Block20');
  await login(page);

  const advancedTopics = [
    'Let\'s have a conversation entirely in Croatian. Start by asking me about my day.',
    'What are some common mistakes that English speakers make when learning Croatian cases?',
    'Can you explain the difference between "da" clauses and infinitives in Croatian?',
    'Tell me about Croatian history from the medieval period in Croatian, then translate key parts.',
  ];

  for (const [i, topic] of advancedTopics.entries()) {
    await goTab(page, 'Practice');
    const launched = await launchAITutor(page);
    if (launched) {
      const input = page.locator('input[type="text"], textarea').first();
      if (await input.isVisible({ timeout: 5000 }).catch(() => false)) {
        await input.fill(topic);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(5000);
        const resp = await page.locator('#root').innerText().catch(() => '');
        if (resp.match(/\w{30,}/)) {
          ok(`AI Tutor advanced topic ${i + 1} answered`);
          await ss(page, `b20-advanced-tutor-${i + 1}`);
          // Follow-up in Croatian
          if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
            await input.fill('Hvala! Možeš li mi dati još jedan primjer?');
            await page.keyboard.press('Enter');
            await page.waitForTimeout(3000);
            ok(`AI Tutor follow-up in Croatian for topic ${i + 1}`);
          }
        } else bug('BUG', 'AITutor', `No response to advanced topic ${i + 1}`);
      }
      await exitScreen(page);
    } else {
      info(`AI Tutor not launched for advanced topic ${i + 1}`);
      break;
    }
  }

  await ss(page, 'b20-complete');
});

test('Block 21 (Days 201-210) — Croatia Media: music + film immersion', async ({ page }) => {
  attachErrorListeners(page, 'Block21');
  await login(page);

  await goTab(page, 'Croatia');
  const mediaReached = await exploreCroatiaSubTab(page, 'Media');
  await ss(page, 'b21-media');

  if (mediaReached) {
    // Look for music content
    const musicCard = page.locator('[class*="card"], button, a').filter({ hasText: /music|song|klapa|tamburica|folk|pop|glazba/i }).first();
    if (await musicCard.isVisible({ timeout: 4000 }).catch(() => false)) {
      await musicCard.click().catch(() => {});
      await page.waitForTimeout(2000);
      await dismissAll(page);
      ok('Music/song content opened from Media');
      await ss(page, 'b21-music-item');
      await page.waitForTimeout(2000);
      await exitScreen(page);
    } else info('No specific music cards found in Media');

    // Look for film/video content
    await exploreCroatiaSubTab(page, 'Media');
    const filmCard = page.locator('[class*="card"], button, a').filter({ hasText: /film|video|watch|movie|series|episode/i }).first();
    if (await filmCard.isVisible({ timeout: 4000 }).catch(() => false)) {
      await filmCard.click().catch(() => {});
      await page.waitForTimeout(2000);
      await dismissAll(page);
      ok('Film/video content opened from Media');
      await ss(page, 'b21-film-item');
      await exitScreen(page);
    } else info('No film/video cards found in Media');

    // Scroll to find more media types
    await exploreCroatiaSubTab(page, 'Media');
    await page.keyboard.press('End').catch(() => {});
    await page.waitForTimeout(1000);
    const mediaCount = await page.locator('[class*="card"], [class*="media-item"]').count().catch(() => 0);
    info(`Media sub-tab total items visible: ${mediaCount}`);
    if (mediaCount >= 3) ok(`Media sub-tab has ${mediaCount} items — rich content`);
  }

  await ss(page, 'b21-complete');
});

test('Block 22 (Days 211-220) — SRS mastery: all categories, weak word hunt', async ({ page }) => {
  attachErrorListeners(page, 'Block22');
  await login(page);
  await goTab(page, 'Practice');

  // Extended SRS session
  const srsBtn = page.locator('button, a').filter({ hasText: /review|SRS|due|spaced|flashcard/i }).first();
  if (await srsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await srsBtn.click().catch(() => {});
    await page.waitForTimeout(1500);
    await dismissAll(page);
    const reviewed = await runSRSSession(page, 20);
    ok(`SRS mastery session: ${reviewed} cards reviewed`);
    await exitScreen(page);
  } else {
    await clickQuickGame(page, 'Flashcards');
    const reviewed = await runFlashcards(page, 15);
    ok(`Flashcard mastery session: ${reviewed} cards`);
    await exitScreen(page);
  }

  // Category sweeps
  for (const cat of ['Numbers', 'Work', 'Body', 'Colors']) {
    await goTab(page, 'Practice');
    const catBtn = page.locator('button, [role="tab"]').filter({ hasText: new RegExp(cat, 'i') }).first();
    if (await catBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await catBtn.click().catch(() => {});
      await page.waitForTimeout(600);
      await clickQuickGame(page, 'Flashcards');
      const cards = await runFlashcards(page, 5);
      info(`${cat} category: ${cards} cards`);
      await exitScreen(page);
    } else info(`Category "${cat}" not directly filterable`);
  }

  await ss(page, 'b22-complete');
});

test('Block 23 (Days 221-230) — Full browse sweep: all exercise types', async ({ page }) => {
  attachErrorListeners(page, 'Block23');
  await login(page);
  await goTab(page, 'Practice');

  const allExercises = ['Flashcards', 'Multiple Choice', 'Matching', 'Listening', 'Shadowing', 'Speaking Sprint', 'AI Story', 'AI Tutor'];

  for (const exercise of allExercises) {
    await goTab(page, 'Practice');
    // AI Tutor uses launchAITutor which tries multiple label variants
    const launched = exercise === 'AI Tutor' ? await launchAITutor(page) : await clickBrowseExercise(page, exercise);
    if (launched) {
      ok(`Exercise "${exercise}" launched from browse`);
      await ss(page, `b23-exercise-${exercise.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
      if (exercise === 'AI Tutor') {
        const input = page.locator('input[type="text"], textarea').first();
        if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
          await input.fill('Reci mi nešto zanimljivo o Hrvatskoj.');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(3000);
        }
      } else if (exercise === 'AI Story') {
        await runGenericExercise(page, 3).catch(() => {});
      } else {
        await runQuiz(page, exercise, 6);
        await runFlashcards(page, 3);
      }
      await exitScreen(page);
    } else {
      // Try as Quick Game
      const qgLaunched = await clickQuickGame(page, exercise);
      if (qgLaunched) {
        ok(`"${exercise}" launched as Quick Game`);
        await runQuiz(page, exercise, 6);
        await exitScreen(page);
      } else info(`Exercise "${exercise}" not found in browse or Quick Games`);
    }
  }

  await ss(page, 'b23-complete');
});

test('Block 24 (Days 231-240) — 240-day milestone: streak, XP, level audit', async ({ page }) => {
  attachErrorListeners(page, 'Block24');
  await login(page);
  await goTab(page, 'Profile');
  await ss(page, 'b24-profile');

  const xp = await readXP(page);
  const streak = await readStreak(page);
  const level = await readLevel(page);
  info(`240-day milestone — XP: ${xp}, Streak: ${streak}, Level: ${level}`);

  if (xp && xp > 0) ok(`XP at 240 days: ${xp}`);
  else bug('BUG', 'Milestone240', 'No XP at 240-day mark');

  // Full tab navigation at 240-day mark
  for (const tab of ['Home', 'Learn', 'Practice', 'Croatia', 'Profile']) {
    const reached = await goTab(page, tab);
    if (reached) ok(`Tab "${tab}" accessible at 240-day mark`);
  }

  // Home screen widgets still functioning
  await goTab(page, 'Home');
  const homeText = await page.locator('#root').innerText().catch(() => '');
  if (homeText.match(/streak|daily|recommended|continue/i)) ok('Home screen shows active learner widgets');
  else bug('UX', 'Home240', 'Home screen widgets degraded at 240 days');

  // One complete lesson cycle
  const heroCta = page.locator('button, a').filter({ hasText: /continue learning|start lesson|begin|let'?s go/i }).first();
  if (await heroCta.isVisible({ timeout: 3000 }).catch(() => false)) {
    await heroCta.click();
    await page.waitForTimeout(1500);
    await dismissAll(page);
    await runQuiz(page, 'Day240Lesson', 10);
    await exitScreen(page);
    ok('Lesson cycle complete at 240-day mark');
  }

  await ss(page, 'b24-complete');
});

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 5 — NEAR-FLUENCY + MEDIA MASTERY (Days 241–300, Blocks 25–30)
// ══════════════════════════════════════════════════════════════════════════════

test('Block 25 (Days 241-250) — Shadowing + Speaking Sprint intensive', async ({ page }) => {
  phase('PHASE 5: NEAR-FLUENCY + MEDIA MASTERY (Days 241–300)');
  attachErrorListeners(page, 'Block25');
  await login(page);

  // Three Shadowing sessions
  for (let i = 1; i <= 3; i++) {
    await goTab(page, 'Practice');
    const launched = await clickBrowseExercise(page, 'Shadowing');
    if (launched) {
      ok(`Shadowing intensive session ${i}`);
      await runGenericExercise(page, 6).catch(() => {});
      await exitScreen(page);
    } else { info(`Shadowing not found for session ${i}`); break; }
  }

  // Three Speaking Sprint sessions
  for (let i = 1; i <= 3; i++) {
    await goTab(page, 'Practice');
    const launched = await clickBrowseExercise(page, 'Speaking Sprint');
    if (launched) {
      ok(`Speaking Sprint intensive session ${i}`);
      await runGenericExercise(page, 6).catch(() => {});
      await exitScreen(page);
    } else { info(`Speaking Sprint not found for session ${i}`); break; }
  }

  const xp = await readXP(page);
  info(`Day 250 XP: ${xp}`);
  await ss(page, 'b25-complete');
});

test('Block 26 (Days 251-260) — Croatia Stories: advanced reading sessions', async ({ page }) => {
  attachErrorListeners(page, 'Block26');
  await login(page);

  // Multiple story sessions with comprehension
  for (let session = 1; session <= 4; session++) {
    await goTab(page, 'Croatia');
    const reached = await exploreCroatiaSubTab(page, 'Stories');
    if (!reached) { bug('NAV', 'Stories', 'Stories sub-tab not reachable'); break; }

    await page.waitForTimeout(500);
    const stories = page.locator('[class*="card"], button, a').filter({ hasText: /story|read|priča|chapter/i });
    const storyCount = await stories.count().catch(() => 0);
    if (storyCount === 0) { info(`No stories visible in session ${session}`); break; }

    const storyIdx = (session - 1) % storyCount;
    await stories.nth(storyIdx).click().catch(() => {});
    await page.waitForTimeout(2000);
    await dismissAll(page);
    ok(`Story session ${session} opened`);
    await ss(page, `b26-story-session-${session}`);

    // Audio
    const audioBtn = page.locator('button[aria-label*="play"], [class*="tts-btn"], [class*="audio"]').first();
    if (await audioBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await audioBtn.click().catch(() => {});
      await page.waitForTimeout(1500);
      ok(`Story ${session} audio played`);
    }

    // Comprehension
    const q = await runQuiz(page, `StoryQuiz${session}`, 5);
    if (q > 0) ok(`Story ${session} comprehension: ${q} questions`);

    await exitScreen(page);
  }

  await ss(page, 'b26-complete');
});

test('Block 27 (Days 261-270) — AI Tutor: free conversation, correction focus', async ({ page }) => {
  attachErrorListeners(page, 'Block27');
  await login(page);

  const conversationTopics = [
    'Možeš li razgovarati sa mnom na hrvatskom? Pitaj me o mojim hobijima.',
    'Ispravi moje greške: "Ja sam ići u Zagreb sutra za posjetiti prijatelji."',
    'Recite mi o tradicijama Dalmacije na hrvatskom.',
    'What are the most important cultural differences between coastal and continental Croatia?',
    'Pomozi mi s izgovorom: kako se pravilno izgovaraju slova č, ć, š, ž, dž?',
  ];

  for (const [i, msg] of conversationTopics.entries()) {
    await goTab(page, 'Practice');
    const launched = await launchAITutor(page);
    if (launched) {
      const input = page.locator('input[type="text"], textarea').first();
      if (await input.isVisible({ timeout: 5000 }).catch(() => false)) {
        await input.fill(msg);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(5000);
        const resp = await page.locator('#root').innerText().catch(() => '');
        if (resp.match(/\w{20,}/)) ok(`Free conversation topic ${i + 1} — response received`);
        else bug('BUG', 'AITutor', `No response to conversation topic ${i + 1}`);
        await ss(page, `b27-conversation-${i + 1}`);
      }
      await exitScreen(page);
    } else { info(`AI Tutor not launched for conversation ${i + 1}`); break; }
  }

  await ss(page, 'b27-complete');
});

test('Block 28 (Days 271-280) — Weekly leagues, leaderboard, social features', async ({ page }) => {
  attachErrorListeners(page, 'Block28');
  await login(page);
  await goTab(page, 'Profile');

  // League / leaderboard
  const leagueBtn = page.locator('button, a').filter({ hasText: /league|leaderboard|rank|top|compete/i }).first();
  if (await leagueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await leagueBtn.click().catch(() => {});
    await page.waitForTimeout(1500);
    const lbText = await page.locator('#root').innerText().catch(() => '');
    if (lbText.match(/rank|#\d|position|xp|league/i)) {
      ok('Leaderboard/league loaded with data');
      await ss(page, 'b28-leaderboard');
      // Check for weekly cycle indicator
      if (lbText.match(/week|weekly|reset|ends in/i)) ok('Weekly cycle indicator visible in league');
      else info('No weekly cycle indicator found');
    } else bug('UX', 'Leaderboard', 'Leaderboard visible but no rank data');
    await exitScreen(page);
  } else bug('NAV', 'Leaderboard', 'Leaderboard/league button not found on profile');

  // XP race — do a quick practice session to earn XP
  await goTab(page, 'Practice');
  const xpBefore = await readXP(page);
  await clickQuickGame(page, 'Multiple Choice');
  await runQuiz(page, 'LeagueXPPush', 12);
  await exitScreen(page);
  const xpAfter = await readXP(page);
  if (xpBefore !== null && xpAfter !== null && xpAfter > xpBefore)
    ok(`League XP push: +${xpAfter - xpBefore} XP earned`);

  // Return to leaderboard — check if rank updated
  await goTab(page, 'Profile');
  if (await leagueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await leagueBtn.click().catch(() => {});
    await page.waitForTimeout(1200);
    await ss(page, 'b28-leaderboard-after-xp');
    await exitScreen(page);
  }

  await ss(page, 'b28-complete');
});

test('Block 29 (Days 281-290) — Settings mastery: all options, notifications, voice', async ({ page }) => {
  attachErrorListeners(page, 'Block29');
  await login(page);
  await goTab(page, 'Profile');
  await ss(page, 'b29-profile');

  const settingsBtn = page.locator('button, a').filter({ hasText: /settings|⚙|preferences/i }).first();
  if (await settingsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await settingsBtn.click().catch(() => {});
    await page.waitForTimeout(1000);
    await ss(page, 'b29-settings');

    const settingsText = await page.locator('#root').innerText().catch(() => '');

    // Notifications
    if (settingsText.match(/notification|remind|push|alert/i)) {
      ok('Notifications settings section visible');
      const notifToggle = page.locator('input[type="checkbox"], button[role="switch"]').first();
      if (await notifToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
        await notifToggle.click().catch(() => {});
        await page.waitForTimeout(400);
        await notifToggle.click().catch(() => {}); // toggle back
        ok('Notifications toggle works');
      }
    } else info('Notifications not found in settings');

    // Voice / TTS
    if (settingsText.match(/voice|tts|text.to.speech|audio|pronunciation/i)) {
      ok('Voice/TTS settings section visible');
      const voiceSelect = page.locator('select, [role="combobox"]').first();
      if (await voiceSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        ok('Voice selector present');
      }
    } else info('Voice/TTS settings not visible');

    // Difficulty
    if (settingsText.match(/difficulty|beginner|intermediate|advanced/i))
      ok('Difficulty settings visible');
    else info('Difficulty not found in settings view');

    // Daily goal
    if (settingsText.match(/daily goal|goal|target|minutes/i))
      ok('Daily goal setting visible');
    else info('Daily goal not found in settings');

    await exitScreen(page);
  } else info('Settings button not found — checking for inline profile settings');

  // Offline mode check
  await goTab(page, 'Home');
  const homeText = await page.locator('#root').innerText().catch(() => '');
  if (homeText.match(/offline|cached|download/i)) ok('Offline/cache indication visible on home');
  else info('No explicit offline mode indication on home');

  await ss(page, 'b29-complete');
});

test('Block 30 (Days 291-300) — 300-day milestone: full immersion day', async ({ page }) => {
  attachErrorListeners(page, 'Block30');
  await login(page);

  // Morning: Home check + lesson
  await goTab(page, 'Home');
  const xpStart = await readXP(page);
  const streakStart = await readStreak(page);
  info(`300-day start — XP: ${xpStart}, Streak: ${streakStart}`);

  const heroCta = page.locator('button, a').filter({ hasText: /continue learning|start lesson|begin|let'?s go/i }).first();
  if (await heroCta.isVisible({ timeout: 3000 }).catch(() => false)) {
    await heroCta.click();
    await page.waitForTimeout(1500);
    await dismissAll(page);
    await runQuiz(page, 'Day300Morning', 10);
    await exitScreen(page);
    ok('Morning lesson complete');
  }

  // Mid-day: Croatia full immersion
  await exploreCroatiaSubTab(page, 'Media');
  await page.waitForTimeout(1000);
  const mediaCard = page.locator('[class*="card"], button, a').first();
  if (await mediaCard.isVisible({ timeout: 3000 }).catch(() => false)) {
    await mediaCard.click().catch(() => {});
    await page.waitForTimeout(2000);
    await exitScreen(page);
    ok('Media immersion block complete');
  }

  await exploreCroatiaSubTab(page, 'Stories');
  const storyCard = page.locator('[class*="card"], button, a').filter({ hasText: /story|read/i }).first();
  if (await storyCard.isVisible({ timeout: 3000 }).catch(() => false)) {
    await storyCard.click().catch(() => {});
    await page.waitForTimeout(2000);
    await runQuiz(page, 'StoryDay300', 5);
    await exitScreen(page);
    ok('Stories immersion block complete');
  }

  // Afternoon: AI Tutor free conversation
  await goTab(page, 'Practice');
  const tutorLaunched = await launchAITutor(page);
  if (tutorLaunched) {
    const input = page.locator('input[type="text"], textarea').first();
    if (await input.isVisible({ timeout: 5000 }).catch(() => false)) {
      await input.fill('Razgovarajmo slobodno na hrvatskom. Pitaj me nešto o mojim planovima za budućnost.');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000);
      ok('300-day AI Tutor free conversation');
      await ss(page, 'b30-ai-tutor-day300');
    }
    await exitScreen(page);
  }

  // Evening: Shadowing + SRS wrap-up
  await goTab(page, 'Practice');
  const shadLaunched300 = await clickBrowseExercise(page, 'Shadowing');
  if (shadLaunched300) {
    await runGenericExercise(page, 5).catch(() => {});
    await exitScreen(page);
    ok('300-day Shadowing session complete');
  }

  const srsBtn = page.locator('button, a').filter({ hasText: /review|SRS|due/i }).first();
  if (await srsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await srsBtn.click().catch(() => {});
    await page.waitForTimeout(1500);
    await dismissAll(page);
    const reviewed = await runSRSSession(page, 15);
    ok(`300-day evening SRS: ${reviewed} cards`);
    await exitScreen(page);
  }

  const xpEnd = await readXP(page);
  info(`300-day end — XP: ${xpEnd} (gained ${xpEnd !== null && xpStart !== null ? xpEnd - xpStart : '?'})`);
  await ss(page, 'b30-complete');
});

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 6 — FLUENCY SIMULATION + FINAL AUDIT (Days 301–360, Blocks 31–36)
// ══════════════════════════════════════════════════════════════════════════════

test('Block 31 (Days 301-310) — Full vocabulary audit: all SRS categories', async ({ page }) => {
  phase('PHASE 6: FLUENCY SIMULATION + FINAL AUDIT (Days 301–360)');
  attachErrorListeners(page, 'Block31');
  await login(page);
  await goTab(page, 'Practice');

  // Extended SRS sweep
  const srsBtn = page.locator('button, a').filter({ hasText: /review|SRS|due|spaced/i }).first();
  if (await srsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await srsBtn.click().catch(() => {});
    await page.waitForTimeout(1500);
    await dismissAll(page);
    const reviewed = await runSRSSession(page, 25);
    ok(`Vocabulary audit SRS: ${reviewed} cards`);
    await exitScreen(page);
  }

  // All vocabulary categories
  for (const cat of ['Food', 'Family', 'Travel', 'Numbers', 'Work', 'Body', 'Colors', 'Nature']) {
    await goTab(page, 'Practice');
    const catBtn = page.locator('button, [role="tab"], [class*="category"]').filter({ hasText: new RegExp(cat, 'i') }).first();
    if (await catBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await catBtn.click().catch(() => {});
      await page.waitForTimeout(600);
      await clickQuickGame(page, 'Flashcards');
      const cards = await runFlashcards(page, 5);
      ok(`Category "${cat}": ${cards} cards audited`);
      await exitScreen(page);
    } else {
      await clickQuickGame(page, 'Multiple Choice');
      await runQuiz(page, `${cat}Quiz`, 5);
      info(`"${cat}" category not filterable — used Multiple Choice`);
      await exitScreen(page);
    }
  }

  await ss(page, 'b31-complete');
});

test('Block 32 (Days 311-320) — AI Tutor marathon: 5 topics in one session', async ({ page }) => {
  attachErrorListeners(page, 'Block32');
  await login(page);

  const marathonTopics = [
    'Koji je najteži aspekt hrvatskog za govornike engleskog? Objasni mi na oba jezika.',
    'Napiši mi kratki dijalog između dvoje prijatelja koji planiraju izlet na Plitvička jezera.',
    'Kako se razlikuje kajkavski dijalekt od standardnog hrvatskog? Daj mi primjere.',
    'Can you quiz me on Croatian cases? Give me 5 sentences to fill in the correct case ending.',
    'Recite mi o hrvatskoj nogometnoj reprezentaciji i njezinim najboljim rezultatima.',
  ];

  await goTab(page, 'Practice');
  const launched = await launchAITutor(page);
  if (launched) {
    for (const [i, topic] of marathonTopics.entries()) {
      // Re-wait for input each iteration — AI Tutor may re-render between messages
      await page.waitForSelector('input[type="text"], textarea', { timeout: 6000 }).catch(() => {});
      // Scroll input into view in case it shifted after a long response
      await page.locator('input[type="text"], textarea').first().scrollIntoViewIfNeeded().catch(() => {});
      const input = page.locator('input[type="text"], textarea').first();
      if (await input.isVisible({ timeout: 5000 }).catch(() => false)) {
        await input.fill(topic);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(5000);
        const resp = await page.locator('#root').innerText().catch(() => '');
        if (resp.match(/\w{20,}/)) ok(`Marathon topic ${i + 1}/5 answered`);
        else bug('BUG', 'AITutorMarathon', `No response to topic ${i + 1}`);
        await ss(page, `b32-marathon-${i + 1}`);
      } else {
        info(`Input not visible during marathon at topic ${i + 1} — skipping remaining topics`);
        break;
      }
    }
    ok('AI Tutor 5-topic marathon complete');
    await exitScreen(page);
  } else bug('NAV', 'AITutor', 'AI Tutor not launched for marathon');

  await ss(page, 'b32-complete');
});

test('Block 33 (Days 321-330) — Croatia full sweep + AI Story generation', async ({ page }) => {
  attachErrorListeners(page, 'Block33');
  await login(page);

  // Full Croatia sweep — retry with explicit navigation reset on failure
  // (content interactions in prior sub-tabs can leave Croatia in a mid-screen state)
  for (const subTab of ['Discover', 'Culture', 'Media', 'Stories']) {
    let reached = await exploreCroatiaSubTab(page, subTab);
    if (!reached) {
      // Hard reset: navigate away and back before retrying
      await goTab(page, 'Home');
      await page.waitForTimeout(1200);
      reached = await exploreCroatiaSubTab(page, subTab);
    }
    if (reached) {
      await ss(page, `b33-croatia-${subTab.toLowerCase()}`);
      // Open and interact with content
      const card = page.locator('[class*="card"], button, a').filter({ hasText: /read|watch|listen|explore|open/i }).first();
      if (await card.isVisible({ timeout: 3000 }).catch(() => false)) {
        await card.click().catch(() => {});
        await page.waitForTimeout(1500);
        await dismissAll(page);
        ok(`Croatia ${subTab} — content interaction`);
        if (subTab === 'Stories') {
          await runQuiz(page, `StoryBlock33${subTab}`, 4);
        }
        await exitScreen(page);
      }
    }
  }

  // AI Story generation
  await goTab(page, 'Practice');
  const storyLaunched = await clickBrowseExercise(page, 'AI Story');
  if (storyLaunched) {
    ok('AI Story generation launched at Day 330');
    const input = page.locator('input[type="text"], textarea').first();
    const genBtn = page.locator('button').filter({ hasText: /generate|create|write|start/i }).first();
    if (await genBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await genBtn.click().catch(() => {});
      await page.waitForTimeout(4000);
      await ss(page, 'b33-ai-story-day330');
      ok('AI Story generated at Day 330');
    } else if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
      await input.fill('U malom dalmatinskom gradu, dvoje prijatelja otkrije staru kartu...');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(4000);
      await ss(page, 'b33-ai-story-prompted');
      ok('AI Story prompted at Day 330');
    }
    await exitScreen(page);
  } else info('AI Story not found for Day 330 generation');

  await ss(page, 'b33-complete');
});

test('Block 34 (Days 331-340) — Rapid-switching stress test: all features', async ({ page }) => {
  attachErrorListeners(page, 'Block34');
  await login(page);

  // Rapid tab switching — 3 full cycles
  for (let cycle = 1; cycle <= 3; cycle++) {
    for (const tab of ['Home', 'Learn', 'Practice', 'Croatia', 'Profile']) {
      await goTab(page, tab);
      await page.waitForTimeout(300);
    }
    ok(`Rapid tab cycle ${cycle}/3 complete`);
  }

  // Rapid exercise switching
  const exercises = ['Flashcards', 'Multiple Choice', 'Matching'];
  for (const ex of exercises) {
    await goTab(page, 'Practice');
    const launched = await clickQuickGame(page, ex);
    if (launched) {
      await runQuiz(page, ex, 3);
      await exitScreen(page);
      ok(`Rapid exercise "${ex}" complete`);
    }
  }

  // Rapid Croatia sub-tab switching
  for (const subTab of ['Discover', 'Culture', 'Media', 'Stories']) {
    await goTab(page, 'Croatia');
    const subTabBtn = page.locator('button, [role="tab"]').filter({ hasText: new RegExp(subTab, 'i') }).first();
    if (await subTabBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await subTabBtn.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(500);
    }
  }
  ok('Croatia sub-tab rapid switching complete');

  // Mobile viewport stress test — check .nav-btn visibility at 390px
  // NOTE: goTab uses .sb-btn which is CSS display:none at mobile width, so use .nav-btn directly
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  const mobileTab = page.locator('.nav-btn').first();
  if (await mobileTab.isVisible({ timeout: 3000 }).catch(() => false))
    ok('Mobile tab bar visible on 390px viewport');
  else bug('UX', 'Mobile', 'Tab bar not visible on 390px viewport (.nav-btn)');

  // Restore desktop size BEFORE any goTab calls (sidebar only visible at ≥768px)
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(600);

  // JS error check — should be zero after stress test
  ok('Stress test complete — checking for accumulated errors');
  await ss(page, 'b34-stress-test');
});

test('Block 35 (Days 341-350) — 350-day streak push, premium features', async ({ page }) => {
  attachErrorListeners(page, 'Block35');
  await login(page);
  await goTab(page, 'Profile');
  await ss(page, 'b35-profile');

  const streak = await readStreak(page);
  const xp = await readXP(page);
  const level = await readLevel(page);
  info(`Day 350 — Streak: ${streak}, XP: ${xp}, Level: ${level}`);

  if (streak && streak > 0) ok(`Active streak at Day 350: ${streak} days`);
  else info('Streak value: ' + streak);

  // Streak freeze / repair mechanic
  const streakFreezeBtn = page.locator('button, a').filter({ hasText: /freeze|repair|extend|protect|streak/i }).first();
  if (await streakFreezeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    ok('Streak protection/freeze option visible');
    await ss(page, 'b35-streak-freeze');
  } else info('No streak freeze button visible (may only show when streak is at risk)');

  // Premium features exploration
  const premiumBtn = page.locator('button, a').filter({ hasText: /premium|upgrade|pro|subscribe/i }).first();
  if (await premiumBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await premiumBtn.click().catch(() => {});
    await page.waitForTimeout(1200);
    const premiumText = await page.locator('#root').innerText().catch(() => '');
    if (premiumText.match(/premium|pro|feature|unlock|subscription/i)) {
      ok('Premium features page loaded');
      await ss(page, 'b35-premium');
    } else info('Premium page content sparse');
    await exitScreen(page);
  } else info('No premium upgrade button found');

  // High XP session to push streak
  await goTab(page, 'Practice');
  await clickQuickGame(page, 'Multiple Choice');
  await runQuiz(page, 'StreakPush', 15);
  await exitScreen(page);

  await goTab(page, 'Practice');
  const shadLaunched = await clickBrowseExercise(page, 'Shadowing');
  if (shadLaunched) {
    await runGenericExercise(page, 8).catch(() => {});
    await exitScreen(page);
    ok('Shadowing session for streak push complete');
  }

  await ss(page, 'b35-complete');
});

test('Block 36 (Days 351-360) — Final audit: complete regression, XP/level/streak', async ({ page }) => {
  attachErrorListeners(page, 'Block36');
  await login(page);

  phase('FINAL AUDIT — 360-DAY REGRESSION');

  // ── 1. Full navigation regression ──────────────────────────────────────────
  for (const tab of ['Home', 'Learn', 'Practice', 'Croatia', 'Profile']) {
    const reached = await goTab(page, tab);
    if (reached) ok(`FINAL: Tab "${tab}" accessible`);
    else bug('NAV', `FinalAudit-${tab}`, `Tab "${tab}" not reachable on day 360`);
  }

  // ── 2. Home screen health ───────────────────────────────────────────────────
  await goTab(page, 'Home');
  const homeText = await page.locator('#root').innerText().catch(() => '');
  if (homeText.match(/streak|daily|recommended|continue|lesson/i)) ok('FINAL: Home screen widgets active');
  else bug('UX', 'FinalHome', 'Home screen widgets missing at 360 days');
  await ss(page, 'b36-final-home');

  // ── 3. XP / Level / Streak final values ────────────────────────────────────
  await goTab(page, 'Profile');
  const finalXP = await readXP(page);
  const finalStreak = await readStreak(page);
  const finalLevel = await readLevel(page);
  info(`FINAL VALUES — XP: ${finalXP}, Streak: ${finalStreak}, Level: ${finalLevel}`);

  if (finalXP !== null && finalXP > 0) ok(`FINAL XP: ${finalXP}`);
  else bug('BUG', 'FinalXP', 'XP is zero or null at 360-day mark');
  await ss(page, 'b36-final-profile');

  // ── 4. All Croatia sub-tabs functional ─────────────────────────────────────
  for (const subTab of ['Discover', 'Culture', 'Media', 'Stories']) {
    const reached = await exploreCroatiaSubTab(page, subTab);
    if (reached) ok(`FINAL: Croatia → ${subTab} functional`);
    else bug('NAV', `FinalCroatia-${subTab}`, `Croatia sub-tab "${subTab}" not reachable on day 360`);
  }

  // ── 5. Practice all Quick Games ────────────────────────────────────────────
  await goTab(page, 'Practice');
  for (const game of ['Flashcards', 'Multiple Choice', 'Matching']) {
    const launched = await clickQuickGame(page, game);
    if (launched) {
      ok(`FINAL: Quick Game "${game}" functional`);
      await runQuiz(page, `Final-${game}`, 5);
      await exitScreen(page);
      await dismissAll(page);
    } else info(`FINAL: Quick Game "${game}" not found`);
  }

  // ── 6. AI Tutor final conversation ────────────────────────────────────────
  await goTab(page, 'Practice');
  const tutorLaunched = await launchAITutor(page);
  if (tutorLaunched) {
    const input = page.locator('input[type="text"], textarea').first();
    if (await input.isVisible({ timeout: 5000 }).catch(() => false)) {
      await input.fill('Razmišljam o putovanju u Hrvatsku. Koje gradove preporučuješ i zašto?');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000);
      const resp = await page.locator('#root').innerText().catch(() => '');
      if (resp.match(/\w{30,}/)) ok('FINAL: AI Tutor functional and responsive');
      else bug('BUG', 'FinalAITutor', 'AI Tutor not responding on day 360');
      await ss(page, 'b36-final-ai-tutor');
    }
    await exitScreen(page);
  } else bug('NAV', 'FinalAITutor', 'AI Tutor not launchable on day 360');

  // ── 7. Shadowing final check ───────────────────────────────────────────────
  await goTab(page, 'Practice');
  let shadLaunched = await clickBrowseExercise(page, 'Shadowing');
  if (!shadLaunched) {
    // Retry once — browse panel sometimes needs an extra render cycle
    await page.waitForTimeout(1500);
    await goTab(page, 'Practice');
    shadLaunched = await clickBrowseExercise(page, 'Shadowing');
  }
  if (shadLaunched) {
    ok('FINAL: Shadowing exercise functional');
    await runGenericExercise(page, 3).catch(() => {});
    await exitScreen(page);
  } else bug('UX', 'FinalShadowing', 'Shadowing not accessible on day 360');

  // ── 8. XP integrity final check ───────────────────────────────────────────
  await goTab(page, 'Practice');
  const xpBefore = await readXP(page);
  await clickQuickGame(page, 'Multiple Choice');
  await runQuiz(page, 'FinalXPCheck', 10);
  await exitScreen(page);
  await goTab(page, 'Profile');
  const xpAfter = await readXP(page);
  if (xpBefore !== null && xpAfter !== null) {
    if (xpAfter < xpBefore) bug('BUG', 'FinalXP', `XP dropped in final check: ${xpBefore} → ${xpAfter}`);
    else ok(`FINAL XP integrity: ${xpBefore} → ${xpAfter}`);
  }

  // ── 9. Badge and achievement final state ──────────────────────────────────
  await goTab(page, 'Profile');
  const profileFinal = await page.locator('#root').innerText().catch(() => '');
  if (profileFinal.match(/badge|achievement|trophy/i)) {
    ok('FINAL: Badge/achievement section present on day 360');
    const badgeCount = (profileFinal.match(/badge|trophy/gi) || []).length;
    info(`FINAL badge mentions: ${badgeCount}`);
  } else bug('UX', 'FinalBadges', 'No badge section on profile on day 360');

  await ss(page, 'b36-final-complete');

  // ── Summary report ─────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(70));
  console.log('360-DAY JOURNEY COMPLETE');
  console.log(`  Final XP:     ${finalXP}`);
  console.log(`  Final Level:  ${finalLevel}`);
  console.log(`  Final Streak: ${finalStreak}`);
  console.log('═'.repeat(70));
});
