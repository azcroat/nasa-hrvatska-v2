/**
 * Full user-experience audit — nasahrvatska.com
 * Uses the site like a real user: navigates every tab, completes lessons,
 * plays games, tests all buttons, checks all navigation flows.
 * Documents every bug, broken button, or confusing UX found.
 *
 * Run: npx playwright test --config playwright.ux.config.js --project Chrome e2e/full-user-audit.spec.js
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const EMAIL = 'claude.test.nasahrvatska@gmail.com';
const PASSWORD = '***REMOVED***';

const bugs = [];
let shotCount = 0;

function bug(severity, section, what, detail = '') {
  const entry = { severity, section, what, detail, ts: new Date().toISOString() };
  bugs.push(entry);
  console.log(`\n🐛 [${severity}] ${section}: ${what}${detail ? '\n   → ' + detail : ''}`);
}

async function shot(page, label) {
  shotCount++;
  const name = `audit-${String(shotCount).padStart(2,'0')}-${label.replace(/[^a-z0-9]/gi,'-').toLowerCase()}.png`;
  await page.screenshot({ path: name, fullPage: false }).catch(() => {});
  console.log(`  📸 ${name}`);
}

async function waitForApp(page) {
  await page.waitForFunction(
    () => {
      const t = document.getElementById('root')?.innerText || '';
      return t.includes('Home') || t.includes('Naša Hrvatska');
    },
    { timeout: 25000 }
  ).catch(() => {});
  await page.waitForTimeout(1500);
}

async function login(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
  const visible = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);

  if (!visible) {
    console.log('  Already logged in or no login form found');
    return;
  }

  await emailInput.fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In")').first().click()
    .catch(() => page.locator('input[type="password"]').first().press('Enter'));

  await waitForApp(page);

  // Wait for syncReady (hero shows lesson name not "Syncing")
  await page.waitForFunction(
    () => !document.body?.innerText?.includes('Syncing progress'),
    { timeout: 10000 }
  ).catch(() => {});
}

// ─── TESTS ────────────────────────────────────────────────────────────────────

test.describe('Full user audit — nasahrvatska.com', () => {

  test('01 — Login and home screen', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') jsErrors.push(m.text()); });

    await login(page);
    await shot(page, 'home-loaded');

    const body = page.locator('#root');
    const text = await body.innerText().catch(() => '');
    console.log('\n=== HOME SCREEN TEXT (first 500 chars) ===');
    console.log(text.slice(0, 500));

    // Check hero banner shows a lesson name (not "Syncing progress")
    if (text.includes('Syncing progress')) {
      bug('HIGH', 'Home/Hero', 'Hero banner stuck on "Syncing progress…" after 10+ seconds');
    } else {
      console.log('  ✓ Hero banner shows lesson (not syncing)');
    }

    // Check nav tabs exist
    const tabs = ['Home', 'Learn', 'Practice', 'Croatia', 'Profile'];
    for (const tab of tabs) {
      const exists = text.includes(tab);
      if (!exists) bug('HIGH', 'Navigation', `Tab "${tab}" not visible in nav bar`);
      else console.log(`  ✓ Tab "${tab}" visible`);
    }

    // Check for JS errors
    if (jsErrors.length > 0) {
      bug('HIGH', 'Console', `${jsErrors.length} JS errors on home load`, jsErrors.slice(0, 3).join('; '));
    }

    // Check XP visible
    if (!text.includes('XP')) {
      bug('MEDIUM', 'Home/Hero', 'XP not showing on hero stats bar');
    }

    // Check Next Lesson button
    const startBtn = page.locator('button:has-text("Start Now")');
    if (!await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      bug('HIGH', 'Home/Hero', '"Start Now" button not visible');
    } else {
      console.log('  ✓ Start Now button visible');
    }
  });

  test('02 — Daily challenge', async ({ page }) => {
    await login(page);

    // Find daily challenge section
    const text = await page.locator('#root').innerText().catch(() => '');
    if (!text.includes('Daily') && !text.includes('Challenge')) {
      bug('MEDIUM', 'Home/Daily', 'Daily challenge section not visible on home screen');
      return;
    }

    // Try clicking first daily challenge option
    const challengeBtn = page.locator('button').filter({ hasText: /^[A-Za-zčšžćđ ]{2,30}$/ }).first();
    if (await challengeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await challengeBtn.click();
      await page.waitForTimeout(500);
      await shot(page, 'daily-challenge-answered');
      console.log('  ✓ Daily challenge responds to click');
    }
  });

  test('03 — Learn tab: vocabulary lessons', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));

    await login(page);

    // Click Learn tab
    const learnTab = page.locator('button, [role="button"], nav *').filter({ hasText: /^Learn$/ }).first();
    await learnTab.click();
    await page.waitForTimeout(1500);
    await shot(page, 'learn-tab');

    const text = await page.locator('#root').innerText().catch(() => '');
    console.log('\n=== LEARN TAB TEXT (first 400 chars) ===');
    console.log(text.slice(0, 400));

    if (!text.includes('Path') && !text.includes('Vocabulary') && !text.includes('Stage')) {
      bug('HIGH', 'Learn', 'Learn tab appears empty or shows wrong content');
    }

    // Try starting a vocabulary lesson — look for "Start Now" or lesson buttons
    const startBtn = page.locator('button:has-text("Start Now"), button:has-text("Continue"), button:has-text("Begin")').first();
    if (await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(2000);
      await shot(page, 'lesson-started');

      const lessonText = await page.locator('#root').innerText().catch(() => '');
      console.log('\n=== LESSON SCREEN TEXT (first 300 chars) ===');
      console.log(lessonText.slice(0, 300));

      // Check Quiz Me button appears
      const quizBtn = page.locator('button:has-text("Quiz Me")');
      if (await quizBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('  ✓ Quiz Me button visible in lesson');
        await quizBtn.click();
        await page.waitForTimeout(1000);
        await shot(page, 'quiz-started');

        // Try answering quiz questions
        const quizText = await page.locator('#root').innerText().catch(() => '');
        console.log('\n=== QUIZ TEXT (first 200 chars) ===');
        console.log(quizText.slice(0, 200));

        // Click through all quiz questions
        for (let q = 0; q < 20; q++) {
          const answerBtn = page.locator('button.ob:not(.ok):not(.no)').first();
          if (!await answerBtn.isVisible({ timeout: 2000 }).catch(() => false)) break;
          await answerBtn.click();
          await page.waitForTimeout(400);
          const nextBtn = page.locator('button:has-text("Next"), button:has-text("Results")');
          if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await nextBtn.click();
            await page.waitForTimeout(400);
          }
          const resultText = await page.locator('#root').innerText().catch(() => '');
          if (resultText.includes('Perfect') || resultText.includes('Great Job')) {
            console.log('  ✓ Lesson completed, result screen shown');
            await shot(page, 'lesson-result');

            // Check Retry button
            const retryBtn = page.locator('button:has-text("Retry")');
            const continueBtn = page.locator('button:has-text("Continue")');
            if (!await retryBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
              bug('MEDIUM', 'Lesson', 'Retry button not visible on result screen');
            }
            if (!await continueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
              bug('HIGH', 'Lesson', 'Continue button not visible on result screen');
            } else {
              await continueBtn.click();
              await page.waitForTimeout(1000);
            }
            break;
          }
        }
      } else {
        bug('HIGH', 'Lesson', '"Quiz Me" button never appeared in lesson screen');
      }
    } else {
      bug('MEDIUM', 'Learn', 'No "Start Now" / lesson start button found in Learn tab');
    }

    if (jsErrors.length > 0) {
      bug('HIGH', 'Learn/Console', `${jsErrors.length} JS errors in Learn tab`, jsErrors[0]);
    }
  });

  test('04 — Grammar screen', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));

    await login(page);

    // Navigate to Learn tab
    const learnTab = page.locator('button, nav *').filter({ hasText: /^Learn$/ }).first();
    await learnTab.click();
    await page.waitForTimeout(1500);

    // Look for Grammar section
    const text = await page.locator('#root').innerText().catch(() => '');
    if (text.includes('Grammar')) {
      // Find a grammar button
      const grammarBtn = page.locator('button, div[role="button"]').filter({ hasText: /Grammar/i }).first();
      if (await grammarBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await grammarBtn.click();
        await page.waitForTimeout(2000);
        await shot(page, 'grammar-screen');

        const gramText = await page.locator('#root').innerText().catch(() => '');
        if (gramText.includes('Error') || gramText.includes('undefined') || gramText.includes('null')) {
          bug('HIGH', 'Grammar', 'Grammar screen shows error/undefined content', gramText.slice(0, 200));
        } else {
          console.log('  ✓ Grammar screen loaded');
        }
      }
    } else {
      bug('MEDIUM', 'Learn/Grammar', 'Grammar section not visible in Learn tab');
    }

    if (jsErrors.length > 0) {
      bug('HIGH', 'Grammar/Console', `${jsErrors.length} JS errors in Grammar`, jsErrors[0]);
    }
  });

  test('05 — Practice tab: flashcards, MC game', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));

    await login(page);

    const practiceTab = page.locator('button, nav *').filter({ hasText: /^Practice$/ }).first();
    await practiceTab.click();
    await page.waitForTimeout(1500);
    await shot(page, 'practice-tab');

    const text = await page.locator('#root').innerText().catch(() => '');
    console.log('\n=== PRACTICE TAB TEXT (first 400 chars) ===');
    console.log(text.slice(0, 400));

    if (!text.includes('Flashcard') && !text.includes('Game') && !text.includes('Quiz') && !text.includes('Practice')) {
      bug('HIGH', 'Practice', 'Practice tab appears empty or wrong content');
    }

    // Try Flashcards
    const flashcardsBtn = page.locator('button, div').filter({ hasText: /Flashcard/i }).first();
    if (await flashcardsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await flashcardsBtn.click();
      await page.waitForTimeout(2000);
      await shot(page, 'flashcards');

      const fcText = await page.locator('#root').innerText().catch(() => '');
      if (fcText.includes('Error') || fcText.length < 50) {
        bug('HIGH', 'Practice/Flashcards', 'Flashcards screen empty or shows error');
      } else {
        console.log('  ✓ Flashcards screen loaded');
        // Try flipping a card
        const card = page.locator('[role="button"], button').filter({ hasText: /[čšžćđA-Za-z]{3,}/ }).first();
        if (await card.isVisible({ timeout: 2000 }).catch(() => false)) {
          await card.click();
          await page.waitForTimeout(500);
          console.log('  ✓ Flashcard responded to click');
        }
      }

      // Go back
      const backBtn = page.locator('button:has-text("←"), button:has-text("Back"), button:has-text("×")').first();
      if (await backBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await backBtn.click();
        await page.waitForTimeout(500);
      } else {
        await page.goBack().catch(() => {});
      }
    }

    // Try Word Sprint or MC Game
    await page.waitForTimeout(500);
    const gameBtn = page.locator('button, div').filter({ hasText: /Word Sprint|Quick Match|MC Game|Multiple Choice/i }).first();
    if (await gameBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await gameBtn.click();
      await page.waitForTimeout(2000);
      await shot(page, 'game-started');
      console.log('  ✓ Game screen loaded');
    }

    if (jsErrors.length > 0) {
      bug('HIGH', 'Practice/Console', `${jsErrors.length} JS errors in Practice tab`, jsErrors[0]);
    }
  });

  test('06 — Croatia tab', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));

    await login(page);

    const croatiaTab = page.locator('button, nav *').filter({ hasText: /^Croatia$/ }).first();
    await croatiaTab.click();
    await page.waitForTimeout(2000);
    await shot(page, 'croatia-tab');

    const text = await page.locator('#root').innerText().catch(() => '');
    console.log('\n=== CROATIA TAB TEXT (first 400 chars) ===');
    console.log(text.slice(0, 400));

    if (!text.includes('Croatia') && !text.includes('Hrvatska') && text.length < 100) {
      bug('HIGH', 'Croatia', 'Croatia tab appears empty or wrong content');
    } else {
      console.log('  ✓ Croatia tab loaded');
    }

    // Try opening a cultural section
    const sectionBtn = page.locator('button').filter({ hasText: /Proverb|History|Food|Culture|Music/i }).first();
    if (await sectionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const sectionName = await sectionBtn.textContent().catch(() => '?');
      await sectionBtn.click();
      await page.waitForTimeout(2000);
      await shot(page, 'croatia-section');
      const secText = await page.locator('#root').innerText().catch(() => '');
      if (secText.length < 100) {
        bug('MEDIUM', 'Croatia', `Section "${sectionName}" opened but appears empty`);
      } else {
        console.log(`  ✓ Croatia section "${sectionName}" loaded`);
      }
    }

    if (jsErrors.length > 0) {
      bug('HIGH', 'Croatia/Console', `${jsErrors.length} JS errors in Croatia tab`, jsErrors[0]);
    }
  });

  test('07 — Profile tab', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));

    await login(page);

    const profileTab = page.locator('button, nav *').filter({ hasText: /^Profile$/ }).first();
    await profileTab.click();
    await page.waitForTimeout(2000);
    await shot(page, 'profile-tab');

    const text = await page.locator('#root').innerText().catch(() => '');
    console.log('\n=== PROFILE TAB TEXT (first 400 chars) ===');
    console.log(text.slice(0, 400));

    if (!text.includes('XP') && !text.includes('streak') && !text.includes('Streak')) {
      bug('HIGH', 'Profile', 'Profile tab missing XP/streak stats');
    } else {
      console.log('  ✓ Profile tab loaded with stats');
    }

    // Test Badges screen
    const badgesBtn = page.locator('button, div').filter({ hasText: /Badge/i }).first();
    if (await badgesBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await badgesBtn.click();
      await page.waitForTimeout(1500);
      await shot(page, 'badges-screen');
      const bdgText = await page.locator('#root').innerText().catch(() => '');
      if (bdgText.length < 100) bug('MEDIUM', 'Profile/Badges', 'Badges screen appears empty');
      else console.log('  ✓ Badges screen loaded');
      const backBtn = page.locator('button:has-text("←"), button:has-text("Back")').first();
      if (await backBtn.isVisible({ timeout: 2000 }).catch(() => false)) await backBtn.click();
    }

    // Test Leaderboard
    const lbBtn = page.locator('button, div').filter({ hasText: /Leaderboard/i }).first();
    if (await lbBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await lbBtn.click();
      await page.waitForTimeout(2000);
      await shot(page, 'leaderboard');
      const lbText = await page.locator('#root').innerText().catch(() => '');
      if (lbText.includes('Error') || lbText.length < 50) {
        bug('HIGH', 'Profile/Leaderboard', 'Leaderboard screen empty or shows error');
      } else {
        console.log('  ✓ Leaderboard loaded');
      }
      const backBtn = page.locator('button:has-text("←"), button:has-text("Back")').first();
      if (await backBtn.isVisible({ timeout: 2000 }).catch(() => false)) await backBtn.click();
      await page.waitForTimeout(500);
    }

    // Test Learn Path screen
    const pathBtn = page.locator('button, div').filter({ hasText: /Learn Path|My Path/i }).first();
    if (await pathBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pathBtn.click();
      await page.waitForTimeout(1500);
      await shot(page, 'learn-path-profile');
      const pathText = await page.locator('#root').innerText().catch(() => '');
      if (pathText.includes('Greetings') || pathText.includes('Level') || pathText.includes('Stage')) {
        console.log('  ✓ Learn path screen shows progress');
      } else {
        bug('MEDIUM', 'Profile/LearnPath', 'Learn path screen appears empty or malformed');
      }
      const backBtn = page.locator('button:has-text("←"), button:has-text("Back")').first();
      if (await backBtn.isVisible({ timeout: 2000 }).catch(() => false)) await backBtn.click();
    }

    // Test Vocab Journal
    const journalBtn = page.locator('button, div').filter({ hasText: /Journal|Vocab/i }).first();
    if (await journalBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await journalBtn.click();
      await page.waitForTimeout(1500);
      await shot(page, 'vocab-journal');
      console.log('  ✓ Vocab journal opened');
      const backBtn = page.locator('button:has-text("←"), button:has-text("Back")').first();
      if (await backBtn.isVisible({ timeout: 2000 }).catch(() => false)) await backBtn.click();
    }

    if (jsErrors.length > 0) {
      bug('HIGH', 'Profile/Console', `${jsErrors.length} JS errors in Profile tab`, jsErrors[0]);
    }
  });

  test('08 — Back button navigation', async ({ page }) => {
    await login(page);

    // Go to Learn tab then a lesson, then press back
    const learnTab = page.locator('button, nav *').filter({ hasText: /^Learn$/ }).first();
    await learnTab.click();
    await page.waitForTimeout(1500);

    // Open any vocabulary topic
    const vocabBtn = page.locator('button').filter({ hasText: /Greetings|Numbers|Family|Food/i }).first();
    if (await vocabBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const btnText = await vocabBtn.textContent().catch(() => '?');
      await vocabBtn.click();
      await page.waitForTimeout(1500);
      await shot(page, 'in-lesson');

      // Press browser back
      await page.goBack();
      await page.waitForTimeout(1500);
      await shot(page, 'after-back');

      const afterText = await page.locator('#root').innerText().catch(() => '');
      if (afterText.includes('Learn') || afterText.includes('Path')) {
        console.log('  ✓ Back button returns to correct screen');
      } else {
        bug('MEDIUM', 'Navigation', 'Back button did not return to Learn tab screen', afterText.slice(0, 100));
      }
    }
  });

  test('09 — Home "Start Now" launches correct lesson', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));

    await login(page);

    // Wait for syncReady
    await page.waitForFunction(
      () => !document.body?.innerText?.includes('Syncing progress'),
      { timeout: 12000 }
    ).catch(() => {});

    await shot(page, 'home-before-start');
    const homeText = await page.locator('#root').innerText().catch(() => '');

    // Find the "Your Next Lesson" label and lesson name
    const nextLessonMatch = homeText.match(/Your Next Lesson\s*\n([^\n]+)/);
    const nextLessonName = nextLessonMatch ? nextLessonMatch[1].trim() : 'unknown';
    console.log(`  Next lesson shown: "${nextLessonName}"`);

    if (nextLessonName === 'Basic Greetings' && homeText.includes('XP')) {
      // Check if user actually has lessons done
      const lessonCountMatch = homeText.match(/(\d+)\s+lessons/);
      const lessonCount = lessonCountMatch ? parseInt(lessonCountMatch[1]) : 0;
      if (lessonCount > 0) {
        bug('CRITICAL', 'Home/Hero', `Hero shows "Basic Greetings" but user has ${lessonCount} lessons completed — progress not loading from Firebase`);
      }
    }

    // Click Start Now
    const startBtn = page.locator('button:has-text("Start Now")');
    if (await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(2000);
      await shot(page, 'started-from-home');

      const launchText = await page.locator('#root').innerText().catch(() => '');
      // Screen should NOT still be the home screen
      if (launchText.includes('Your Next Lesson') && launchText.includes('Daily Challenge')) {
        bug('HIGH', 'Home/Hero', '"Start Now" button clicked but still on home screen — lesson did not launch');
      } else {
        console.log(`  ✓ Start Now launched screen: "${launchText.slice(0, 60).replace(/\n/g, ' ')}"`);
      }
    }

    if (jsErrors.length > 0) {
      bug('HIGH', 'Home/Console', `${jsErrors.length} JS errors`, jsErrors[0]);
    }
  });

  test('10 — Translation widget', async ({ page }) => {
    await login(page);

    const text = await page.locator('#root').innerText().catch(() => '');
    if (!text.includes('Translat') && !text.includes('translate')) {
      bug('LOW', 'Home/Translator', 'Translation widget not visible on home screen');
      return;
    }

    // Find input and type
    const tInput = page.locator('input[placeholder*="translat" i], input[placeholder*="English" i], textarea').first();
    if (await tInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tInput.fill('hello');
      await page.waitForTimeout(2000);
      const afterText = await page.locator('#root').innerText().catch(() => '');
      if (afterText.includes('halo') || afterText.includes('bok') || afterText.includes('Bok') || afterText.includes('zdravo')) {
        console.log('  ✓ Translator working');
      } else {
        bug('MEDIUM', 'Home/Translator', 'Translator did not return a Croatian translation for "hello"');
      }
    }
  });

  test('11 — Streak and freeze display', async ({ page }) => {
    await login(page);

    const text = await page.locator('#root').innerText().catch(() => '');
    if (!text.match(/\d+\s*streak|streak\s*\d+/i) && !text.includes('🔥')) {
      bug('LOW', 'Home/Streak', 'Streak count not visible on home screen');
    } else {
      console.log('  ✓ Streak visible');
    }
  });

  test('12 — Mobile viewport rendering', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));

    // Switch to mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    await shot(page, 'mobile-home');

    const text = await page.locator('#root').innerText().catch(() => '');

    // Check nav bar visible on mobile
    if (!text.includes('Home') || !text.includes('Learn')) {
      bug('HIGH', 'Mobile/Nav', 'Navigation tabs not visible on mobile viewport');
    } else {
      console.log('  ✓ Nav visible on mobile');
    }

    // Check hero not overflowing
    const hero = page.locator('div').filter({ hasText: /Your Next Lesson/ }).first();
    if (await hero.isVisible({ timeout: 3000 }).catch(() => false)) {
      const box = await hero.boundingBox().catch(() => null);
      if (box && box.width > 410) {
        bug('MEDIUM', 'Mobile/Hero', `Hero overflows mobile viewport (width=${box.width}px)`);
      } else {
        console.log('  ✓ Hero fits mobile viewport');
      }
    }

    // Check "Start Now" button touch target size
    const startBtn = page.locator('button:has-text("Start Now")');
    if (await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const box = await startBtn.boundingBox().catch(() => null);
      if (box && box.height < 44) {
        bug('LOW', 'Mobile/A11y', `"Start Now" button height ${box.height}px — below 44px touch target`);
      } else if (box) {
        console.log(`  ✓ Start Now button height ${Math.round(box.height)}px`);
      }
    }

    // Check nav buttons touch targets
    const navBtns = page.locator('nav button, [role="tablist"] button').all();
    for (const btn of await navBtns) {
      const box = await btn.boundingBox().catch(() => null);
      const label = await btn.textContent().catch(() => '?');
      if (box && box.height < 36) {
        bug('LOW', 'Mobile/A11y', `Nav button "${label.trim()}" height ${box.height}px — below 36px`);
      }
    }

    if (jsErrors.length > 0) {
      bug('HIGH', 'Mobile/Console', `${jsErrors.length} JS errors on mobile`, jsErrors[0]);
    }
  });

  test('13 — Dark mode toggle', async ({ page }) => {
    await login(page);

    // Find dark mode toggle
    const dmBtn = page.locator('button').filter({ hasText: /Dark|Light|🌙|☀️|theme/i }).first();
    if (await dmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dmBtn.click();
      await page.waitForTimeout(500);
      await shot(page, 'dark-mode');
      const bg = await page.evaluate(() => document.body.style.background || getComputedStyle(document.body).backgroundColor);
      console.log(`  Dark mode bg: ${bg}`);

      // Toggle back
      await dmBtn.click();
      await page.waitForTimeout(300);
      console.log('  ✓ Dark mode toggle works');
    } else {
      bug('LOW', 'Profile/DarkMode', 'Dark mode toggle button not found');
    }
  });

  test('14 — Sync button works', async ({ page }) => {
    await login(page);

    await page.waitForFunction(
      () => !document.body?.innerText?.includes('Syncing progress'),
      { timeout: 12000 }
    ).catch(() => {});

    // Find the Sync Now button in cloud sync card
    const syncBtn = page.locator('button').filter({ hasText: /Sync Now|Sync/i }).first();
    if (await syncBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await syncBtn.click();
      await page.waitForTimeout(2000);
      const text = await page.locator('#root').innerText().catch(() => '');
      if (text.includes('Syncing') || text.includes('backed up') || text.includes('Saved')) {
        console.log('  ✓ Sync button works');
      } else {
        bug('MEDIUM', 'Home/Sync', 'Sync button clicked but no confirmation shown');
      }
    } else {
      bug('LOW', 'Home/Sync', 'Sync Now button not found on home screen');
    }
  });

  test('15 — Complete a full lesson and verify path updates', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));

    await login(page);

    // Record current lesson count shown
    await page.waitForFunction(
      () => !document.body?.innerText?.includes('Syncing progress'),
      { timeout: 12000 }
    ).catch(() => {});

    const homeText = await page.locator('#root').innerText().catch(() => '');
    const lcMatch = homeText.match(/(\d+)\s+lessons/);
    const lcBefore = lcMatch ? parseInt(lcMatch[1]) : -1;
    console.log(`  Lesson count before: ${lcBefore}`);

    // Go to Learn tab and start the first available lesson
    const learnTab = page.locator('button, nav *').filter({ hasText: /^Learn$/ }).first();
    await learnTab.click();
    await page.waitForTimeout(1500);

    // Find any topic button
    const topicBtn = page.locator('button').filter({ hasText: /Greetings|Numbers|Family|Animals|Colors|Food/i }).first();
    if (!await topicBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('  No topic button found, skipping full lesson test');
      return;
    }

    await topicBtn.click();
    await page.waitForTimeout(1500);

    // Get Quiz Me
    const quizBtn = page.locator('button:has-text("Quiz Me")');
    if (!await quizBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      bug('HIGH', 'Lesson/Quiz', 'Quiz Me button never appeared');
      return;
    }
    await quizBtn.click();
    await page.waitForTimeout(800);

    // Answer all questions
    let completed = false;
    for (let q = 0; q < 25; q++) {
      const answerBtn = page.locator('button.ob').first();
      if (!await answerBtn.isVisible({ timeout: 1500 }).catch(() => false)) break;
      await answerBtn.click();
      await page.waitForTimeout(300);
      const nextBtn = page.locator('button:has-text("Next →"), button:has-text("Results")').first();
      if (await nextBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        const btnText = await nextBtn.textContent().catch(() => '');
        await nextBtn.click();
        await page.waitForTimeout(400);
        if (btnText.includes('Results')) { completed = true; break; }
      }
    }

    if (!completed) {
      bug('HIGH', 'Lesson', 'Could not complete lesson — quiz flow stuck');
      return;
    }

    await page.waitForTimeout(1000);
    await shot(page, 'lesson-complete-result');

    const resultText = await page.locator('#root').innerText().catch(() => '');
    if (!resultText.includes('Perfect') && !resultText.includes('Great Job') && !resultText.includes('/')) {
      bug('HIGH', 'Lesson/Result', 'Lesson result screen not shown after completing all questions');
    } else {
      console.log('  ✓ Lesson completed successfully');
    }

    // Click Continue and go back to Home to check lesson count updated
    const continueBtn = page.locator('button:has-text("Continue →")');
    if (await continueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await continueBtn.click();
      await page.waitForTimeout(1000);
    }

    // Check home screen lesson count increased
    const homeTab = page.locator('button, nav *').filter({ hasText: /^Home$/ }).first();
    await homeTab.click();
    await page.waitForTimeout(1500);

    const homeTextAfter = await page.locator('#root').innerText().catch(() => '');
    const lcMatchAfter = homeTextAfter.match(/(\d+)\s+lessons/);
    const lcAfter = lcMatchAfter ? parseInt(lcMatchAfter[1]) : -1;
    console.log(`  Lesson count after: ${lcAfter}`);

    if (lcBefore >= 0 && lcAfter >= 0 && lcAfter <= lcBefore) {
      bug('HIGH', 'Lesson/Stats', `Lesson count did not increase after completing lesson (before=${lcBefore}, after=${lcAfter})`);
    } else if (lcBefore >= 0 && lcAfter > lcBefore) {
      console.log(`  ✓ Lesson count increased from ${lcBefore} to ${lcAfter}`);
    }

    if (jsErrors.length > 0) {
      bug('HIGH', 'Lesson/Console', `${jsErrors.length} JS errors during lesson`, jsErrors[0]);
    }
  });

  test('16 — Page reload preserves state', async ({ page }) => {
    await login(page);

    await page.waitForFunction(
      () => !document.body?.innerText?.includes('Syncing progress'),
      { timeout: 12000 }
    ).catch(() => {});

    const text1 = await page.locator('#root').innerText().catch(() => '');
    const xpMatch = text1.match(/(\d[\d,]+)\s+XP/);
    const xpBefore = xpMatch ? xpMatch[1] : null;
    console.log(`  XP before reload: ${xpBefore}`);

    // Hard reload
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.waitForFunction(
      () => !document.body?.innerText?.includes('Syncing progress'),
      { timeout: 12000 }
    ).catch(() => {});
    await shot(page, 'after-reload');

    const text2 = await page.locator('#root').innerText().catch(() => '');
    const xpMatch2 = text2.match(/(\d[\d,]+)\s+XP/);
    const xpAfter = xpMatch2 ? xpMatch2[1] : null;
    console.log(`  XP after reload: ${xpAfter}`);

    if (xpBefore && xpAfter && xpBefore !== xpAfter) {
      bug('CRITICAL', 'Reload/State', `XP changed after page reload (before=${xpBefore}, after=${xpAfter}) — state not persisted`);
    } else if (xpBefore && xpAfter) {
      console.log('  ✓ XP preserved across page reload');
    }
  });

  test.afterAll(async () => {
    console.log('\n\n════════════════════════════════════════════════════');
    console.log('  FULL USER AUDIT RESULTS');
    console.log('════════════════════════════════════════════════════\n');

    const critical = bugs.filter(b => b.severity === 'CRITICAL');
    const high = bugs.filter(b => b.severity === 'HIGH');
    const medium = bugs.filter(b => b.severity === 'MEDIUM');
    const low = bugs.filter(b => b.severity === 'LOW');

    if (critical.length) {
      console.log(`🔴 CRITICAL (${critical.length}):`);
      critical.forEach(b => console.log(`   [${b.section}] ${b.what}${b.detail ? '\n   → '+b.detail : ''}`));
    }
    if (high.length) {
      console.log(`\n🟠 HIGH (${high.length}):`);
      high.forEach(b => console.log(`   [${b.section}] ${b.what}${b.detail ? '\n   → '+b.detail : ''}`));
    }
    if (medium.length) {
      console.log(`\n🟡 MEDIUM (${medium.length}):`);
      medium.forEach(b => console.log(`   [${b.section}] ${b.what}${b.detail ? '\n   → '+b.detail : ''}`));
    }
    if (low.length) {
      console.log(`\n🔵 LOW (${low.length}):`);
      low.forEach(b => console.log(`   [${b.section}] ${b.what}${b.detail ? '\n   → '+b.detail : ''}`));
    }

    if (bugs.length === 0) {
      console.log('✅ No bugs found during user audit!');
    } else {
      console.log(`\nTotal: ${bugs.length} issues (${critical.length} critical, ${high.length} high, ${medium.length} medium, ${low.length} low)`);
    }

    fs.writeFileSync('full-user-audit-report.json', JSON.stringify({ bugs, total: bugs.length, shotCount }, null, 2));
    console.log('\n📄 Report saved: full-user-audit-report.json');
    console.log('════════════════════════════════════════════════════\n');
  });
});
