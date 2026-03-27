/**
 * download-portraits.mjs
 * Generates AI portrait images via Stable Horde (free community GPU)
 * and downloads them to public/images/portraits/
 *
 * Usage: node scripts/download-portraits.mjs
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'portraits');
const API_BASE = 'https://stablehorde.net/api/v2';
const API_KEY = '0000000000';
const POLL_INTERVAL_MS = 15000;   // 15 seconds
const MAX_WAIT_MS = 20 * 60 * 1000; // 20 minutes

const GENERATION_PARAMS = {
  width: 512,
  height: 512,
  steps: 25,
  cfg_scale: 7.5,
  sampler_name: 'k_dpmpp_2m',
  n: 1,
};

const PORTRAITS = [
  {
    file: 'young-woman.jpg',
    prompt: 'professional photo portrait of a Croatian woman, warm smile, Mediterranean features, dark brown hair, photorealistic, studio portrait photography, high quality',
    fallbackPrompt: 'female professional portrait, business attire, office background, warm smile, photorealistic, high quality',
    model: 'Realistic Vision',
  },
  {
    file: 'mature-woman.jpg',
    prompt: 'professional headshot of a Croatian woman in her 40s, kind eyes, warm smile, photorealistic portrait photography',
    fallbackPrompt: 'female professional headshot, business attire, friendly smile, office background, photorealistic',
    model: 'Realistic Vision',
  },
  {
    file: 'grandmother.jpg',
    prompt: 'portrait of an elderly Croatian woman, silver hair, warm loving smile, traditional embroidered blouse, photorealistic, natural light',
    fallbackPrompt: 'portrait of an elderly woman, silver hair, warm smile, traditional blouse, photorealistic, natural light',
    model: 'Realistic Vision',
  },
  {
    file: 'young-man.jpg',
    prompt: 'professional headshot of a Croatian man, friendly smile, Mediterranean features, dark hair, photorealistic portrait photography',
    fallbackPrompt: 'male professional headshot, business attire, friendly smile, office background, photorealistic',
    model: 'Realistic Vision',
  },
  {
    file: 'mature-man.jpg',
    prompt: 'portrait of a Croatian man in his 50s, weathered face, warm smile, dark stubble, photorealistic, natural outdoor light',
    fallbackPrompt: 'portrait of a middle-aged man, warm smile, stubble, outdoor background, photorealistic, natural light',
    model: 'Realistic Vision',
  },
  {
    file: 'fisherman.jpg',
    prompt: 'portrait of a weathered Dalmatian fisherman, tanned skin, grey stubble, navy shirt, harbour background, photorealistic, golden hour',
    fallbackPrompt: 'portrait of a fisherman, tanned skin, navy shirt, harbour background, photorealistic, golden hour lighting',
    model: 'Realistic Vision',
  },
  {
    file: 'barista.jpg',
    prompt: 'portrait of a Croatian woman working as barista, warm smile, hair tied up, apron, café interior background, photorealistic',
    fallbackPrompt: 'female barista portrait, warm smile, hair tied up, apron, café background, photorealistic',
    model: 'Realistic Vision',
  },
  {
    file: 'vendor.jpg',
    prompt: 'portrait of a Croatian market vendor man, friendly smile, tanned skin, outdoor market background, photorealistic',
    fallbackPrompt: 'portrait of a market vendor, friendly smile, tanned skin, outdoor market background, photorealistic',
    model: 'Realistic Vision',
  },
  {
    file: 'tutor-hero.jpg',
    prompt: 'professional portrait of a Croatian woman language teacher, warm professional smile, dark wavy hair, light blue blouse, photorealistic, natural daylight',
    fallbackPrompt: 'female professional portrait, language teacher, warm smile, light blue blouse, photorealistic, natural daylight',
    model: 'Realistic Vision',
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
        'Client-Agent': 'download-portraits.mjs:1.0:nasa-hrvatska',
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
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;

    const follow = (redirectUrl) => {
      const p = new URL(redirectUrl);
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
          reject(new Error(`Download failed with status ${res.statusCode} from ${redirectUrl}`));
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
    prompt,
    params: { ...GENERATION_PARAMS },
    models: [model],
    r2: false,
    shared: false,
    nsfw: false,
    censor_nsfw: true,
    trusted_workers: false,
  };

  const res = await jsonRequest('POST', `${API_BASE}/generate/async`, payload);
  if (res.status !== 202 || !res.body.id) {
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
    console.log(`  [${elapsed}s] queue_position=${check.queue_position ?? '?'} waiting=${check.waiting} processing=${check.processing} done=${check.done} faulted=${check.faulted}`);

    if (check.faulted) throw new Error('Job faulted on the server');
    if (check.done) return true;
  }
  throw new Error('Timed out waiting for job to complete (20 min limit)');
}

async function fetchResult(id) {
  const res = await jsonRequest('GET', `${API_BASE}/generate/status/${id}`);
  if (res.status !== 200) throw new Error(`Status fetch failed (${res.status}): ${JSON.stringify(res.body)}`);
  return res.body; // { generations: [{ img, censored, ... }] }
}

// ---------------------------------------------------------------------------
// Per-portrait orchestration
// ---------------------------------------------------------------------------

async function generatePortrait(portrait, attempt = 1) {
  const prompt = attempt === 1 ? portrait.prompt : portrait.fallbackPrompt;
  const label = `[${portrait.file}] (attempt ${attempt})`;

  console.log(`\n${label} Submitting job...`);
  console.log(`  Prompt: ${prompt}`);

  const id = await submitJob(prompt, portrait.model);
  console.log(`  Job ID: ${id}`);

  console.log(`  Polling every 15s (max 20 min)...`);
  await pollUntilDone(id);

  const result = await fetchResult(id);
  const gen = result.generations && result.generations[0];

  if (!gen) throw new Error('No generation returned in result');

  if (gen.censored) {
    console.log(`  CENSORED. ${attempt < 3 ? 'Retrying with fallback prompt...' : 'Giving up after 3 attempts.'}`);
    if (attempt < 3) return generatePortrait(portrait, attempt + 1);
    throw new Error(`Image was censored after ${attempt} attempts`);
  }

  const imgData = gen.img;
  const destPath = path.join(OUTPUT_DIR, portrait.file);

  // Stable Horde can return either a URL or base64 data
  if (imgData.startsWith('http://') || imgData.startsWith('https://')) {
    console.log(`  Downloading from URL: ${imgData.substring(0, 80)}...`);
    await downloadFile(imgData, destPath);
  } else {
    // base64-encoded image
    console.log(`  Decoding base64 image...`);
    const base64 = imgData.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(destPath, Buffer.from(base64, 'base64'));
  }

  console.log(`  Saved to: ${destPath}`);
  return id;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('=== Naša Hrvatska Portrait Generator ===');
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Portraits to generate: ${PORTRAITS.length}`);
  console.log(`Model: Realistic Vision via Stable Horde`);
  console.log('');

  const results = [];

  for (let i = 0; i < PORTRAITS.length; i++) {
    const portrait = PORTRAITS[i];
    console.log(`\n--- Portrait ${i + 1}/${PORTRAITS.length}: ${portrait.file} ---`);

    try {
      const id = await generatePortrait(portrait);
      results.push({ file: portrait.file, id, status: 'success' });
      console.log(`  DONE: ${portrait.file}`);
    } catch (err) {
      console.error(`  FAILED: ${portrait.file} — ${err.message}`);
      results.push({ file: portrait.file, id: null, status: 'failed', error: err.message });
    }
  }

  // Summary
  console.log('\n\n=== SUMMARY ===');
  for (const r of results) {
    const icon = r.status === 'success' ? 'OK' : 'FAIL';
    console.log(`  [${icon}] ${r.file}${r.id ? ` (job ${r.id})` : ''}${r.error ? ` — ${r.error}` : ''}`);
  }

  const succeeded = results.filter((r) => r.status === 'success').length;
  console.log(`\n${succeeded}/${PORTRAITS.length} portraits generated successfully.`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
