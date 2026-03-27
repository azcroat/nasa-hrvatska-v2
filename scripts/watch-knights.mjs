/**
 * watch-knights.mjs
 * Polls public/images/knights/ every 60s.
 * When all 5 knight images are present, commits and pushes automatically.
 *
 * Usage: node scripts/watch-knights.mjs
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KNIGHTS_DIR = path.join(__dirname, '..', 'public', 'images', 'knights');
const EXPECTED = [
  'knight-neutral.jpg',
  'knight-happy.jpg',
  'knight-celebrating.jpg',
  'knight-sad.jpg',
  'knight-thinking.jpg',
];
const POLL_MS = 60_000;

function allPresent() {
  return EXPECTED.every(f => {
    try {
      const stat = fs.statSync(path.join(KNIGHTS_DIR, f));
      return stat.size > 5000; // at least 5KB — real image
    } catch { return false; }
  });
}

function run(cmd) {
  try {
    const out = execSync(cmd, { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
    if (out.trim()) console.log(out.trim());
  } catch (e) {
    console.error(`Command failed: ${cmd}\n${e.message}`);
  }
}

function commitAndPush() {
  console.log('\n=== All 5 knight images ready — committing and pushing ===');
  run('git add public/images/knights/');
  run(`git commit -m "feat: AI knight mascot images generated (5 mood variants)\n\nAlbedoBase XL (SDXL) 512×768 via Stable Horde — neutral, happy,\ncelebrating, sad, thinking moods. CroatianKnight component auto-switches\nfrom SVG fallback to photorealistic AI portraits.\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"`);
  run('git push origin master');
  console.log('=== Pushed to Cloudflare — deploy triggered ===');
}

console.log('=== Knight Watcher Started ===');
console.log(`Watching: ${KNIGHTS_DIR}`);
console.log(`Polling every ${POLL_MS / 1000}s for: ${EXPECTED.join(', ')}`);

function check() {
  const found = EXPECTED.filter(f => {
    try { return fs.statSync(path.join(KNIGHTS_DIR, f)).size > 5000; } catch { return false; }
  });
  console.log(`[${new Date().toLocaleTimeString()}] ${found.length}/${EXPECTED.length} knights ready`);

  if (found.length === EXPECTED.length) {
    commitAndPush();
    process.exit(0);
  }
}

check();
setInterval(check, POLL_MS);
