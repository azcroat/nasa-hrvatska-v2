/**
 * AI Horde Job Poller — checks status of pending jobs and downloads when complete
 * Run: node scripts/poll-horde-jobs.mjs
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PORTRAITS_DIR = path.join(ROOT, 'public', 'images', 'portraits');
const SCENES_DIR    = path.join(ROOT, 'public', 'images', 'scenes');
const API_KEY = '0000000000';

// ── Pending jobs ──────────────────────────────────────────────────────────────
const JOBS = [
  { id: '83593d2b-fa1f-4eae-9d03-53b09d67a3df', file: path.join(PORTRAITS_DIR, 'taxi-driver.jpg'), name: 'taxi-driver.jpg' },
  { id: '5afff3bc-769c-41b8-befe-b7aa9be14cb1', file: path.join(SCENES_DIR, 'mostar.jpg'),        name: 'mostar.jpg' },
  { id: '41ed9e18-df51-4fde-8863-c655a81f751c', file: path.join(SCENES_DIR, 'labin.jpg'),          name: 'labin.jpg' },
];

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function apiGet(urlPath) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'stablehorde.net',
      path: `/api/v2${urlPath}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
        'Client-Agent': 'NasaHrvatska/1.0',
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch(e) { reject(new Error(`Bad JSON (${res.statusCode}): ${d.substring(0,200)}`)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Request timeout')); });
    req.end();
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    function get(u, depth) {
      if (depth > 5) { file.destroy(); return reject(new Error('Too many redirects')); }
      const lib = u.startsWith('https') ? https : http;
      lib.get(u, { headers: { 'User-Agent': 'NasaHrvatska/1.0' } }, res => {
        if ([301,302,307,308].includes(res.statusCode)) {
          res.destroy();
          return get(res.headers.location, depth + 1);
        }
        if (res.statusCode !== 200) {
          file.destroy(); fs.unlink(dest, () => {});
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
        file.on('error', e => { fs.unlink(dest, () => {}); reject(e); });
      }).on('error', e => { fs.unlink(dest, () => {}); reject(e); });
    }
    get(url, 0);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Check and download one job ────────────────────────────────────────────────

async function checkJob(job) {
  // Skip if already downloaded
  if (fs.existsSync(job.file) && fs.statSync(job.file).size > 10000) {
    console.log(`  ✓ ${job.name} — already exists`);
    return 'done';
  }

  const check = await apiGet(`/generate/check/${job.id}`);
  if (check.status !== 200) {
    console.log(`  ? ${job.name} — check failed (${check.status})`);
    return 'error';
  }

  const { done, processing, waiting, queue_position, faulted } = check.body;

  if (faulted) {
    console.log(`  ✗ ${job.name} — FAULTED (job failed on AI Horde side)`);
    return 'faulted';
  }

  if (done) {
    process.stdout.write(`  ⟳ ${job.name} — done, fetching result… `);
    const result = await apiGet(`/generate/status/${job.id}`);
    if (result.status !== 200 || !result.body.generations?.length) {
      console.log(`FAILED — no generations in result`);
      return 'error';
    }
    const imgUrl = result.body.generations[0].img;
    if (!imgUrl) { console.log(`FAILED — no image URL`); return 'error'; }

    fs.mkdirSync(path.dirname(job.file), { recursive: true });
    await downloadFile(imgUrl, job.file);
    const kb = Math.round(fs.statSync(job.file).size / 1024);
    const model = result.body.generations[0].model || 'unknown';
    console.log(`✓ downloaded (${kb}KB, model: ${model})`);
    return 'done';
  }

  console.log(`  ⏳ ${job.name} — queue: ${queue_position ?? '?'}, processing: ${processing}, waiting: ${waiting}`);
  return 'pending';
}

// ── Main poll loop ────────────────────────────────────────────────────────────

async function main() {
  console.log('🎨 Naša Hrvatska — AI Horde Job Poller\n');

  let pending = [...JOBS];
  let attempts = 0;
  const MAX_ATTEMPTS = 120; // 20 minutes max (10s intervals)

  while (pending.length > 0 && attempts < MAX_ATTEMPTS) {
    attempts++;
    console.log(`\n[Poll ${attempts}/${MAX_ATTEMPTS}] — ${new Date().toLocaleTimeString()}`);

    const remaining = [];
    for (const job of pending) {
      const status = await checkJob(job);
      if (status === 'pending' || status === 'error') {
        remaining.push(job);
      }
    }
    pending = remaining;

    if (pending.length > 0) {
      process.stdout.write(`  Waiting 10s… `);
      await sleep(10000);
      console.log('');
    }
  }

  if (pending.length === 0) {
    console.log('\n✅ All jobs complete!');
  } else {
    console.log(`\n⚠️  Timed out. Still pending: ${pending.map(j => j.name).join(', ')}`);
    console.log('   Re-run this script to continue polling.');
  }
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
