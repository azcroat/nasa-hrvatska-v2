/**
 * get-vapid.mjs
 * Uses Playwright Chromium + copied Chrome profile to access Firebase Console
 * and retrieve the VAPID key for project ucimohrvatski-488f9
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import os from 'os';

const PROJECT_ID = 'ucimohrvatski-488f9';
const VAPID_URL = `https://console.firebase.google.com/project/${PROJECT_ID}/settings/cloudmessaging`;

async function main() {
  const srcProfile = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
  const tmpProfile = path.join(os.tmpdir(), 'chrome-vapid-' + Date.now());

  console.log('Setting up temp profile at:', tmpProfile);
  fs.mkdirSync(path.join(tmpProfile, 'Default'), { recursive: true });

  // Copy files needed for authenticated session + DPAPI cookie decryption
  const filesToCopy = [
    ['Default/Cookies', 'Default/Cookies'],
    ['Default/Network/Cookies', 'Default/Network/Cookies'],
    ['Local State', 'Local State'],
    ['Default/Preferences', 'Default/Preferences'],
  ];

  for (const [src, dst] of filesToCopy) {
    const srcPath = path.join(srcProfile, src);
    const dstPath = path.join(tmpProfile, dst);
    try {
      fs.mkdirSync(path.dirname(dstPath), { recursive: true });
      fs.copyFileSync(srcPath, dstPath);
      console.log('Copied:', src);
    } catch (e) {
      // ok if missing
    }
  }

  // Use Playwright's own Chromium (not system Chrome) — avoids profile lock conflict
  // DPAPI is user-bound, so Chromium can decrypt Chrome's cookies when running as same user
  const browser = await chromium.launchPersistentContext(tmpProfile, {
    headless: false,
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-features=VizDisplayCompositor',
    ],
  });

  const page = browser.pages()[0] || await browser.newPage();

  console.log('Navigating to Firebase Console...');
  try {
    await page.goto(VAPID_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (e) {
    console.log('Navigation timeout/error:', e.message);
  }

  const url = page.url();
  console.log('URL after navigation:', url.substring(0, 100));

  if (url.includes('accounts.google.com') || url.includes('signin') || url.includes('ServiceLogin')) {
    console.log('Redirected to login — session not preserved in copied profile');
    await page.screenshot({ path: 'C:/Users/jschr/Desktop/firebase-login.png' });
    console.log('Screenshot saved to Desktop (firebase-login.png)');
    await browser.close();
    return null;
  }

  // Wait for Angular/React app to load
  console.log('Waiting for app to load...');
  await page.waitForTimeout(8000);

  // Take screenshot to see current state
  await page.screenshot({ path: 'C:/Users/jschr/Desktop/firebase-console.png', fullPage: false });
  console.log('Screenshot saved (firebase-console.png)');

  // Look for VAPID key — base64url string of ~87 chars
  const vapidKey = await page.evaluate(() => {
    // Search all input elements for base64url-like strings
    const inputs = Array.from(document.querySelectorAll('input'));
    for (const el of inputs) {
      const val = el.value || '';
      if (val.length >= 80 && val.length <= 100 && /^[A-Za-z0-9_\-]+$/.test(val)) {
        return val;
      }
    }
    // Search spans/divs for key-like content
    const textEls = Array.from(document.querySelectorAll('span, p, div, td, code, pre'));
    for (const el of textEls) {
      const text = (el.textContent || '').trim();
      if (text.length >= 80 && text.length <= 100 && /^[A-Za-z0-9_\-]+$/.test(text)) {
        return text;
      }
    }
    // Last resort: search entire page text with regex
    const matches = document.body.innerText.match(/[A-Za-z0-9_\-]{86,90}/g);
    return matches ? matches[0] : null;
  });

  if (vapidKey) {
    console.log('\n✅ VAPID KEY FOUND:', vapidKey);
    fs.writeFileSync('C:/Users/jschr/Desktop/vapid-key.txt', vapidKey);
    await browser.close();
    return vapidKey;
  }

  // Try clicking a "Generate key pair" button if visible
  console.log('No VAPID key found yet — looking for Generate button...');
  const generateBtn = page.locator('button').filter({ hasText: /generate.*key|generate.*pair/i }).first();
  const importBtn = page.locator('button').filter({ hasText: /import/i }).first();

  try {
    if (await generateBtn.isVisible({ timeout: 5000 })) {
      console.log('Clicking Generate key pair...');
      await generateBtn.click();
      await page.waitForTimeout(5000);

      // Re-check for key
      const newKey = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        for (const el of inputs) {
          const val = el.value || '';
          if (val.length >= 80 && val.length <= 100 && /^[A-Za-z0-9_\-]+$/.test(val)) return val;
        }
        const matches = document.body.innerText.match(/[A-Za-z0-9_\-]{86,90}/g);
        return matches ? matches[0] : null;
      });

      if (newKey) {
        console.log('\n✅ VAPID KEY GENERATED:', newKey);
        fs.writeFileSync('C:/Users/jschr/Desktop/vapid-key.txt', newKey);
        await browser.close();
        return newKey;
      }
    }
  } catch (e) {
    console.log('Generate button error:', e.message);
  }

  // Dump page text for debugging
  const pageText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
  console.log('Page text snippet:', pageText.substring(0, 500));

  await page.screenshot({ path: 'C:/Users/jschr/Desktop/firebase-console-2.png', fullPage: true });
  await browser.close();
  return null;
}

main().then(key => {
  if (key) {
    console.log('\n✅ SUCCESS:', key);
    process.exit(0);
  } else {
    console.log('\n❌ Could not retrieve VAPID key automatically');
    process.exit(1);
  }
}).catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
