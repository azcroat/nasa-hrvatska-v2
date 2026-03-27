/**
 * AI Portrait + Scene Generator — Pollinations.ai (Free, no API key)
 * Uses FLUX model via Pollinations API
 * Run: node scripts/generate-portraits.mjs
 */

import fs from 'fs';
import https from 'https';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const PORTRAITS_DIR = path.join(ROOT, 'public', 'images', 'portraits');
const SCENES_DIR    = path.join(ROOT, 'public', 'images', 'scenes');

fs.mkdirSync(PORTRAITS_DIR, { recursive: true });
fs.mkdirSync(SCENES_DIR,    { recursive: true });

// ── Image definitions ────────────────────────────────────────────────────────

const PORTRAITS = [
  {
    id: 'young-woman',
    file: 'young-woman.jpg',
    prompt: 'portrait photograph beautiful young Croatian woman 27 years old, dark brown wavy hair, warm genuine smile, Mediterranean olive skin, natural makeup, casual elegant blouse, soft bokeh background, professional portrait photography, photorealistic, cinematic lighting, sharp focus, 4K',
    seed: 9271, w: 512, h: 512,
  },
  {
    id: 'mature-woman',
    file: 'mature-woman.jpg',
    prompt: 'portrait photograph warm Croatian woman 46 years old, kind brown eyes, slight smile, dark hair with natural waves, traditional Croatian small town background softly blurred, friendly welcoming expression, natural daylight portrait, photorealistic, 4K',
    seed: 3847, w: 512, h: 512,
  },
  {
    id: 'grandmother',
    file: 'grandmother.jpg',
    prompt: 'portrait photograph Croatian grandmother 68 years old, warm loving smile, silver hair tied back, bright kind eyes, traditional embroidered apron, rustic Dalmatian kitchen background blurred, natural window light, photorealistic portrait, 4K',
    seed: 5523, w: 512, h: 512,
  },
  {
    id: 'young-man',
    file: 'young-man.jpg',
    prompt: 'portrait photograph handsome young Croatian man 30 years old, short brown hair, confident friendly smile, Mediterranean features, casual open collar shirt, Croatia coastline softly blurred in background, natural daylight portrait, photorealistic, 4K',
    seed: 1192, w: 512, h: 512,
  },
  {
    id: 'mature-man',
    file: 'mature-man.jpg',
    prompt: 'portrait photograph Croatian man 50 years old, strong Mediterranean features, weathered warm face, broad smile, dark stubble, casual shirt, Split Croatia background softly blurred, natural outdoor daylight, photorealistic portrait photography, 4K',
    seed: 7734, w: 512, h: 512,
  },
  {
    id: 'fisherman',
    file: 'fisherman.jpg',
    prompt: 'portrait photograph authentic Dalmatian Croatian fisherman 58 years old, deeply tanned weathered skin, grey stubble, wise dark eyes, navy blue captain shirt, harbour and fishing boats softly blurred behind, golden hour light, photorealistic, cinematic, 4K',
    seed: 2281, w: 512, h: 512,
  },
  {
    id: 'barista',
    file: 'barista.jpg',
    prompt: 'portrait photograph friendly Croatian barista woman 35 years old at Zagreb café counter, warm smile, dark hair tied up, café apron, espresso machine visible behind, cozy warm café interior lighting, photorealistic portrait, 4K',
    seed: 8856, w: 512, h: 512,
  },
  {
    id: 'vendor',
    file: 'vendor.jpg',
    prompt: 'portrait photograph proud Croatian market vendor man 55 years old at Split open air pazar, warm direct smile, tanned Mediterranean skin, grey temples, colorful fruit and vegetable stall visible behind, natural outdoor market light, photorealistic, 4K',
    seed: 4419, w: 512, h: 512,
  },
  {
    id: 'taxi-driver',
    file: 'taxi-driver.jpg',
    prompt: 'portrait photograph talkative Croatian taxi driver man 48 years old, cropped grey hair, big genuine laugh, casual polo shirt, Zagreb street visible through car window in background, photorealistic portrait, 4K',
    seed: 6637, w: 512, h: 512,
  },
  {
    id: 'fan',
    file: 'fan.jpg',
    prompt: 'portrait photograph passionate Croatian football fan man 38 years old, wearing red and white Croatia national team jersey with šahovnica checkerboard, big enthusiastic smile, stadium crowd softly blurred behind, photorealistic portrait, 4K',
    seed: 3301, w: 512, h: 512,
  },
  {
    id: 'tutor-hero',
    file: 'tutor-hero.jpg',
    prompt: 'portrait photograph beautiful Croatian language teacher woman 32 years old, warm professional smile, dark wavy hair, wearing light blue blouse, holding a small Croatian flag, Zagreb cathedral softly visible in background, professional portrait photography, warm sunlight, photorealistic, cinematic, 4K',
    seed: 5591, w: 600, h: 600,
  },
];

const SCENES = [
  {
    id: 'dubrovnik-hero',
    file: 'dubrovnik-hero.jpg',
    prompt: 'aerial panoramic photograph Dubrovnik old city Croatia, golden hour sunset, dramatic orange and pink sky, terracotta rooftops, ancient stone walls, deep blue Adriatic sea, Lokrum island visible, cinematic wide shot, photorealistic, 8K, Nat Geo quality',
    seed: 1847, w: 1200, h: 480,
  },
  {
    id: 'dalmatian-coast',
    file: 'dalmatian-coast.jpg',
    prompt: 'panoramic photograph crystal clear turquoise Adriatic sea Dalmatian coast Croatia, dramatic limestone cliffs, lush Mediterranean pine trees, sailboats anchored in bay, Hvar island visible, golden afternoon light, photorealistic, 8K, cinematic wide shot',
    seed: 9922, w: 1200, h: 480,
  },
  {
    id: 'plitvice',
    file: 'plitvice.jpg',
    prompt: 'panoramic photograph Plitvice Lakes National Park Croatia, cascading turquoise waterfalls, wooden walkway over crystal clear water, lush green forest, morning light rays through trees, UNESCO world heritage site, photorealistic, 8K, cinematic',
    seed: 3771, w: 1200, h: 480,
  },
  {
    id: 'zagreb',
    file: 'zagreb.jpg',
    prompt: 'panoramic photograph Zagreb Croatia, Ban Jelacic Square, Cathedral twin towers in background, tram passing, evening golden light, locals walking, European city atmosphere, photorealistic, 8K, cinematic',
    seed: 7283, w: 1200, h: 480,
  },
  {
    id: 'croatian-food',
    file: 'croatian-food.jpg',
    prompt: 'overhead photograph traditional Croatian food table spread, burek, peka lamb, grilled fish, octopus salad, dalmatinski prsut, local wine, olive oil, rustic stone table in Dalmatian courtyard, warm afternoon light, food photography, photorealistic, 4K',
    seed: 4418, w: 800, h: 600,
  },
];

// ── Downloader ───────────────────────────────────────────────────────────────

function buildUrl(prompt, seed, w, h) {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${w}&height=${h}&seed=${seed}&model=flux-realism&nologo=true`;
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    function get(u) {
      const lib = u.startsWith('https') ? https : http;
      lib.get(u, { headers: { 'User-Agent': 'NasaHrvatska/1.0' } }, res => {
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
          file.destroy();
          return get(res.headers.location);
        }
        if (res.statusCode !== 200) {
          file.destroy();
          fs.unlink(dest, () => {});
          return reject(new Error(`HTTP ${res.statusCode} for ${u}`));
        }
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
        file.on('error', e => { fs.unlink(dest, () => {}); reject(e); });
        res.on('error', e => { fs.unlink(dest, () => {}); reject(e); });
      }).on('error', e => { fs.unlink(dest, () => {}); reject(e); });
    }
    get(url);
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function generate(items, dir, label) {
  console.log(`\n── ${label} (${items.length} images) ─────────────────────`);
  for (const item of items) {
    const dest = path.join(dir, item.file);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 10000) {
      console.log(`  ✓ ${item.file} (cached)`);
      continue;
    }
    const url = buildUrl(item.prompt, item.seed, item.w, item.h);
    process.stdout.write(`  ⟳ ${item.file} … `);
    try {
      await download(url, dest);
      const kb = Math.round(fs.statSync(dest).size / 1024);
      console.log(`done (${kb}KB)`);
    } catch (e) {
      console.log(`FAILED: ${e.message}`);
    }
    // Small delay to be polite to the free API
    await new Promise(r => setTimeout(r, 800));
  }
}

async function main() {
  console.log('🎨 Naša Hrvatska — AI Image Generator (Pollinations FLUX, free)');
  await generate(PORTRAITS, PORTRAITS_DIR, 'Portraits');
  await generate(SCENES,    SCENES_DIR,    'Scenes');
  console.log('\n✅ Done. Images saved to public/images/');
}

main().catch(e => { console.error(e); process.exit(1); });
