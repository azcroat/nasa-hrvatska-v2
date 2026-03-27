/**
 * generate-knight.mjs
 * Generates AI Croatian knight mascot images via Stable Horde (free community GPU)
 * and saves them to public/images/knights/
 *
 * Usage: node scripts/generate-knight.mjs
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'knights');
const API_BASE = 'https://stablehorde.net/api/v2';
const API_KEY = '0000000000';
const POLL_INTERVAL_MS = 15000;
const MAX_WAIT_MS = 25 * 60 * 1000; // 25 minutes

const GENERATION_PARAMS = {
  width: 512,
  height: 768,
  steps: 30,
  cfg_scale: 7.5,
  sampler_name: 'k_dpmpp_2m',
  n: 1,
};

const BASE_PROMPT = 'photorealistic Croatian medieval knight in full ornate silver plate armor, šahovnica red and white checkerboard shield, crimson feather plume on helmet, gold trim on armor, detailed fantasy portrait, cinematic lighting, dramatic atmosphere, game art style, 4K detail, highly detailed';
const NEGATIVE = 'ugly, deformed, cartoon, sketch, low quality, blurry, anime, 2d, flat, simple';

const KNIGHTS = [
  {
    file: 'knight-neutral.jpg',
    prompt: `${BASE_PROMPT}, neutral confident pose, standing tall, direct gaze, sword at side, professional hero portrait`,
    model: 'AlbedoBase XL (SDXL)',
  },
  {
    file: 'knight-happy.jpg',
    prompt: `${BASE_PROMPT}, cheerful victorious expression, warm golden hour lighting, sword raised in salute, hero pose, triumphant warrior`,
    model: 'AlbedoBase XL (SDXL)',
  },
  {
    file: 'knight-celebrating.jpg',
    prompt: `${BASE_PROMPT}, triumphant celebration pose, arms raised in victory, golden light burst, confetti particles, glowing aura, jubilant hero, dramatic celebration lighting`,
    model: 'AlbedoBase XL (SDXL)',
  },
  {
    file: 'knight-sad.jpg',
    prompt: `${BASE_PROMPT}, dejected downcast pose, head slightly bowed, slumped shoulders, soft blue melancholic lighting, solemn warrior mood`,
    model: 'AlbedoBase XL (SDXL)',
  },
  {
    file: 'knight-thinking.jpg',
    prompt: `${BASE_PROMPT}, contemplative thoughtful pose, gauntleted hand raised to chin, looking upward, soft warm ambient lighting, wise scholarly warrior`,
    model: 'AlbedoBase XL (SDXL)',
  },
];

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function jsonRequest(method, url, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
        'Client-Agent': 'generate-knight.mjs:1.0:nasa-hrvatska',
      },
    };

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const follow = (redirectUrl) => {
      const p = new URL(redirectUrl);
      const lib = p.protocol === 'https:' ? https : http;
      const opts = {
        hostname: p.hostname,
        port: p.port || (p.protocol === 'https:' ? 443 : 80),
        path: p.pathname + p.search,
        method: 'GET',
      };
      const req = lib.request(opts, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          follow(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed with status ${res.statusCode}`));
          return;
        }
        const file = fs.createWriteStream(destPath);
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
        file.on('error', reject);
      });
      req.on('error', reject);
      req.end();
    };
    follow(url);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Stable Horde workflow
// ---------------------------------------------------------------------------

async function submitJob(prompt, model) {
  const payload = {
    prompt: `${prompt} ### ${NEGATIVE}`,
    params: { ...GENERATION_PARAMS },
    models: [model],
    r2: false,
    shared: false,
    nsfw: false,
    censor_nsfw: true,
    trusted_workers: false,
  };

  const res = await jsonRequest('POST', `${API_BASE}/generate/async`, payload);
  if (!res.body.id) {
    throw new Error(`Submit failed (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return res.body.id;
}

async function pollUntilDone(id) {
  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    const res = await jsonRequest('GET', `${API_BASE}/generate/check/${id}`);
    if (res.status !== 200) {
      console.log(`  Poll error (${res.status}): ${JSON.stringify(res.body)}`);
      continue;
    }
    const check = res.body;
    const elapsed = Math.round((MAX_WAIT_MS - (deadline - Date.now())) / 1000);
    console.log(`  [${elapsed}s] queue=${check.queue_position ?? '?'} waiting=${check.waiting} done=${check.done} faulted=${check.faulted}`);

    if (check.faulted) throw new Error('Job faulted on the server');
    if (check.done) return true;
  }
  throw new Error('Timed out waiting for job (25 min limit)');
}

async function fetchResult(id) {
  const res = await jsonRequest('GET', `${API_BASE}/generate/status/${id}`);
  if (res.status !== 200) throw new Error(`Status fetch failed (${res.status}): ${JSON.stringify(res.body)}`);
  return res.body;
}

// ---------------------------------------------------------------------------
// Per-knight orchestration
// ---------------------------------------------------------------------------

async function generateKnight(knight, attempt = 1) {
  const label = `[${knight.file}] (attempt ${attempt})`;
  console.log(`\n${label} Submitting job...`);

  const id = await submitJob(knight.prompt, knight.model);
  console.log(`  Job ID: ${id}`);
  console.log(`  Polling every 15s (max 25 min)...`);
  await pollUntilDone(id);

  const result = await fetchResult(id);
  const gen = result.generations && result.generations[0];
  if (!gen) throw new Error('No generation returned');

  if (gen.censored) {
    if (attempt < 3) {
      console.log(`  CENSORED — retrying...`);
      return generateKnight(knight, attempt + 1);
    }
    throw new Error(`Censored after ${attempt} attempts`);
  }

  const imgData = gen.img;
  const destPath = path.join(OUTPUT_DIR, knight.file);

  if (imgData.startsWith('http://') || imgData.startsWith('https://')) {
    console.log(`  Downloading from URL...`);
    await downloadFile(imgData, destPath);
  } else {
    console.log(`  Decoding base64 image...`);
    const base64 = imgData.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(destPath, Buffer.from(base64, 'base64'));
  }

  console.log(`  Saved: ${destPath}`);
  return id;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('=== Naša Hrvatska Knight Generator ===');
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Knights to generate: ${KNIGHTS.length}`);
  console.log(`Model: AlbedoBase XL (SDXL) via Stable Horde`);
  console.log('');

  const results = [];

  for (let i = 0; i < KNIGHTS.length; i++) {
    const knight = KNIGHTS[i];
    console.log(`\n--- Knight ${i + 1}/${KNIGHTS.length}: ${knight.file} ---`);

    try {
      const id = await generateKnight(knight);
      results.push({ file: knight.file, id, status: 'success' });
      console.log(`  DONE: ${knight.file}`);
    } catch (err) {
      console.error(`  FAILED: ${knight.file} — ${err.message}`);
      results.push({ file: knight.file, status: 'failed', error: err.message });
    }
  }

  console.log('\n\n=== SUMMARY ===');
  for (const r of results) {
    const icon = r.status === 'success' ? 'OK' : 'FAIL';
    console.log(`  [${icon}] ${r.file}${r.error ? ` — ${r.error}` : ''}`);
  }

  const succeeded = results.filter((r) => r.status === 'success').length;
  console.log(`\n${succeeded}/${KNIGHTS.length} knight images generated.`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
