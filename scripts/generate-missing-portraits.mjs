/**
 * Missing Portrait Generator — AI Horde (Free, no API key required)
 * Uses Realistic Vision model via AI Horde's crowdsourced GPU network
 * Run: node scripts/generate-missing-portraits.mjs
 *
 * Zero cost — anonymous key '0000000000' queues at lowest priority.
 * Generation takes 1–5 minutes per image depending on queue depth.
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
const API_KEY = '0000000000'; // AI Horde anonymous key — free, no account needed
const BASE    = 'https://stablehorde.net/api/v2';

// ── Images to generate ────────────────────────────────────────────────────────

const IMAGES = [
  {
    file: path.join(PORTRAITS_DIR, 'taxi-driver.jpg'),
    prompt: 'portrait photograph of a Croatian male taxi driver 48 years old, cropped grey hair, broad genuine laugh, wearing a casual polo shirt, Zagreb city street visible through car window in background, golden hour light, photorealistic, sharp focus, 4K, professional portrait photography',
    negprompt: 'blur, lowres, bad anatomy, bad face, deformed, ugly, cartoon, illustration, painting, drawing, sketch, anime',
    w: 512, h: 512,
  },
  {
    file: path.join(PORTRAITS_DIR, 'fan.jpg'),
    prompt: 'portrait photograph of a passionate Croatian football fan male 38 years old, wearing red and white Croatia national team jersey with checkered crest, big enthusiastic smile, stadium crowd softly blurred behind, natural light, photorealistic, sharp focus, 4K, professional portrait photography',
    negprompt: 'blur, lowres, bad anatomy, bad face, deformed, ugly, cartoon, illustration, painting, drawing, sketch, anime',
    w: 512, h: 512,
  },
  {
    file: path.join(SCENES_DIR, 'croatian-food.jpg'),
    prompt: 'overhead photograph of a traditional Croatian food table spread, burek, peka lamb, grilled fish, octopus salad, Dalmatian prsut cured ham, local Croatian wine, olive oil, fresh bread, rustic stone table in a Dalmatian courtyard, warm golden afternoon light, professional food photography, photorealistic, 4K',
    negprompt: 'blur, lowres, bad quality, cartoon, illustration, painting, sketch, people',
    w: 768, h: 576,
  },
];

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function apiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'stablehorde.net',
      path: `/api/v2${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
        'Client-Agent': 'NasaHrvatska/1.0',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
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
    if (data) req.write(data);
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

// ── Core generator ─────────────────────────────────────────────────────────────

async function generate(img) {
  const name = path.basename(img.file);

  // Skip if already exists with reasonable size
  if (fs.existsSync(img.file) && fs.statSync(img.file).size > 10000) {
    console.log(`  ✓ ${name} (cached)`);
    return;
  }

  process.stdout.write(`  ⟳ ${name} — submitting job… `);

  const submitRes = await apiRequest('POST', '/generate/async', {
    prompt: img.prompt,
    params: {
      sampler_name: 'k_dpmpp_2m',
      cfg_scale: 7.5,
      steps: 30,
      width: img.w,
      height: img.h,
      n: 1,
      post_processing: ['RealESRGAN_x4plus_anime_6B'],
    },
    models: ['Realistic Vision', 'AbsoluteReality', 'Deliberate'],
    r2: true,
    nsfw: false,
    trusted_workers: false,
    negative_prompt: img.negprompt,
  });

  if (submitRes.status !== 202) {
    console.log(`FAILED (submit ${submitRes.status}): ${JSON.stringify(submitRes.body)}`);
    return;
  }

  const jobId = submitRes.body.id;
  console.log(`queued (id: ${jobId})`);

  // Poll until done
  let attempts = 0;
  while (attempts < 80) {
    await sleep(6000);
    attempts++;
    const check = await apiRequest('GET', `/generate/check/${jobId}`, null);
    if (check.status !== 200) { console.log(`  Check failed: ${check.status}`); continue; }
    const { done, processing, waiting, queue_position, faulted } = check.body;
    if (faulted) { console.log(`  ✗ ${name} — job faulted (no workers for model?)`); return; }
    process.stdout.write(`\r  ⟳ ${name} — pos: ${queue_position ?? '?'}, processing: ${processing}, done: ${done}  `);
    if (done) break;
  }
  console.log('');

  // Get result
  const result = await apiRequest('GET', `/generate/status/${jobId}`, null);
  if (result.status !== 200 || !result.body.generations?.length) {
    console.log(`  ✗ ${name} — no generations in result`);
    return;
  }

  const gen = result.body.generations[0];
  const imgUrl = gen.img;

  if (!imgUrl) { console.log(`  ✗ ${name} — no image URL`); return; }

  // Download image
  await downloadFile(imgUrl, img.file);
  const kb = Math.round(fs.statSync(img.file).size / 1024);
  console.log(`  ✓ ${name} — done (${kb}KB, model: ${gen.model || 'unknown'})`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎨 Naša Hrvatska — Missing Image Generator (AI Horde, free)');
  console.log('   Using anonymous key — queue priority is lowest tier.');
  console.log('   Each image takes ~2–5 minutes. Please wait...\n');

  fs.mkdirSync(PORTRAITS_DIR, { recursive: true });
  fs.mkdirSync(SCENES_DIR, { recursive: true });

  for (const img of IMAGES) {
    await generate(img);
  }

  console.log('\n✅ Done.');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
