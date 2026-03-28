#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// generate-scene-videos.mjs
// Generates looping cinematic scene videos from existing WebP images
// using the Runway ML Gen-3 Alpha Turbo image-to-video API.
//
// Usage:
//   RUNWAY_API_KEY=your_key node scripts/generate-scene-videos.mjs
//
// Output: /public/videos/scenes/*.mp4  (5-second looping clips, 720p)
//
// Requires:
//   - RUNWAY_API_KEY env var (get from app.runwayml.com → API keys)
//   - Node 18+ (for native fetch + fs/promises)
//   - Scene WebP images already in /public/images/scenes/
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;
if (!RUNWAY_API_KEY) {
  console.error('❌  RUNWAY_API_KEY not set.\n   Export it: export RUNWAY_API_KEY=your_key_here');
  process.exit(1);
}

// Scene definitions: image path → output mp4 name + motion prompt
const SCENES = [
  {
    image:  'public/images/scenes/dubrovnik-hero.webp',
    output: 'public/videos/scenes/dubrovnik.mp4',
    motion: 'Slow cinematic drone push forward over the Dubrovnik old city walls, gentle Adriatic waves, golden hour light, birds gliding, seamless loop',
  },
  {
    image:  'public/images/scenes/dalmatian-coast.webp',
    output: 'public/videos/scenes/dalmatian.mp4',
    motion: 'Gentle right-to-left pan along the Dalmatian coast, turquoise water shimmering, light ocean breeze, seamless loop',
  },
  {
    image:  'public/images/scenes/plitvice.webp',
    output: 'public/videos/scenes/plitvice.mp4',
    motion: 'Slow push-in toward the Plitvice waterfalls, water cascading gently, mist rising, lush green foliage swaying, seamless loop',
  },
  {
    image:  'public/images/scenes/zagreb.webp',
    output: 'public/videos/scenes/zagreb.mp4',
    motion: 'Slow Ken Burns zoom-out over Zagreb Gornji Grad rooftops, trams moving in the distance, gentle morning light, seamless loop',
  },
  {
    image:  'public/images/scenes/labin.webp',
    output: 'public/videos/scenes/labin.mp4',
    motion: 'Slow pan across the Labin hilltop medieval town, Istrian countryside in distance, soft afternoon light, seamless loop',
  },
  {
    image:  'public/images/scenes/mostar.webp',
    output: 'public/videos/scenes/mostar.mp4',
    motion: 'Gentle tilt-up over the Stari Most bridge, Neretva river shimmering, warm dusk light, seamless loop',
  },
  {
    image:  'public/images/scenes/croatian-food.webp',
    output: 'public/videos/scenes/food.mp4',
    motion: 'Very slow zoom-in on a Croatian seafood spread on a stone table, steam rising gently, dappled Mediterranean sunlight, seamless loop',
  },
];

const RUNWAY_API_BASE = 'https://api.runwayml.com/v1';
const POLL_INTERVAL_MS = 5000;
const MAX_POLLS = 60; // 5 minutes max per video

function toBase64DataUrl(filePath) {
  const ext = filePath.split('.').pop().toLowerCase();
  const mime = ext === 'webp' ? 'image/webp' : ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  const data = readFileSync(resolve(ROOT, filePath));
  return `data:${mime};base64,${data.toString('base64')}`;
}

async function generateVideo(scene) {
  const { image, output, motion } = scene;
  const imagePath = resolve(ROOT, image);

  if (!existsSync(imagePath)) {
    console.warn(`  ⚠️  Image not found: ${image} — skipping`);
    return false;
  }

  const outputPath = resolve(ROOT, output);
  if (existsSync(outputPath)) {
    console.log(`  ✓  Already exists: ${output} — skipping`);
    return true;
  }

  console.log(`\n  📸 → 🎬  ${image}`);
  console.log(`       Motion: "${motion.slice(0, 60)}…"`);

  // 1. Submit generation task
  const imageData = toBase64DataUrl(image);
  const createRes = await fetch(`${RUNWAY_API_BASE}/image_to_video`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RUNWAY_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': '2024-11-06',
    },
    body: JSON.stringify({
      model: 'gen3a_turbo',
      promptImage: imageData,
      promptText: motion,
      duration: 5,
      ratio: '1280:720',
      watermark: false,
    }),
  });

  if (!createRes.ok) {
    const txt = await createRes.text().catch(() => '');
    console.error(`  ❌  Create failed ${createRes.status}: ${txt.slice(0, 200)}`);
    return false;
  }

  const { id } = await createRes.json();
  if (!id) { console.error('  ❌  No task ID returned'); return false; }
  console.log(`  ⏳  Task ${id} — polling…`);

  // 2. Poll until done
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    const pollRes = await fetch(`${RUNWAY_API_BASE}/tasks/${id}`, {
      headers: {
        Authorization: `Bearer ${RUNWAY_API_KEY}`,
        'X-Runway-Version': '2024-11-06',
      },
    });
    if (!pollRes.ok) continue;
    const task = await pollRes.json();

    if (task.status === 'SUCCEEDED') {
      const videoUrl = task.output?.[0];
      if (!videoUrl) { console.error('  ❌  No output URL'); return false; }

      // 3. Download and save
      console.log(`  ⬇️  Downloading…`);
      const dlRes = await fetch(videoUrl);
      if (!dlRes.ok) { console.error('  ❌  Download failed'); return false; }
      const buffer = Buffer.from(await dlRes.arrayBuffer());
      mkdirSync(resolve(ROOT, 'public/videos/scenes'), { recursive: true });
      writeFileSync(outputPath, buffer);
      console.log(`  ✅  Saved → ${output} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
      return true;
    }

    if (task.status === 'FAILED' || task.status === 'CANCELLED') {
      console.error(`  ❌  Task ${task.status}:`, task.failure || '');
      return false;
    }

    const pct = task.progress != null ? ` (${Math.round(task.progress * 100)}%)` : '';
    process.stdout.write(`\r  ⏳  ${task.status}${pct}   `);
  }

  console.error('\n  ❌  Timed out after 5 minutes');
  return false;
}

async function main() {
  console.log('🎬  Naša Hrvatska — Scene Video Generator');
  console.log('   Runway Gen-3 Alpha Turbo · 5s · 720p\n');

  mkdirSync(resolve(ROOT, 'public/videos/scenes'), { recursive: true });

  let ok = 0, fail = 0;
  for (const scene of SCENES) {
    const success = await generateVideo(scene);
    success ? ok++ : fail++;
  }

  console.log(`\n✅  Done: ${ok} generated, ${fail} failed`);
  if (ok > 0) {
    console.log('\nNext steps:');
    console.log('  1. git add public/videos/scenes/');
    console.log('  2. git commit -m "feat: add cinematic scene videos"');
    console.log('  3. git push origin master');
    console.log('\nThe VideoBackground component will automatically use these .mp4 files.');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
