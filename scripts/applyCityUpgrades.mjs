// scripts/applyCityUpgrades.mjs
//
// Applies content upgrades to EXISTING entries in CROATIAN_CITIES:
//   - appends a 5th fact to cities that have only 4
//   - appends a 3rd vocab entry to cities that have only 2
//
// Unlike rebuildCities.mjs (which only merges NEW city names), this patches
// existing entries in place. It re-emits both geography.js files using the
// exact same serializer as rebuildCities.mjs, so unchanged cities are
// byte-identical and the diff shows only the patched arrays.
//
// Usage: node scripts/applyCityUpgrades.mjs scripts/_cityUpgrade_patch_*.json
//
// Patch file shape: { "patches": [ { "name": "Solin", "addFact": "...",
//   "addVocab": { "hr": "...", "en": "...", "note": "..." } } ] }
//
// --check  validate only, do not write.

import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const SRC_PATH = resolve(REPO_ROOT, 'src/data/cultural/geography.js');
const FUNC_PATH = resolve(
  REPO_ROOT,
  'functions/api/content/_data/cultural/geography.js',
);

const BANNED_PHRASES = [
  'charming village', 'picturesque', 'must-visit', 'hidden gem',
  'mediterranean jewel', 'crystal-clear waters', 'a beautiful',
  'simply stunning',
];

function wordCount(s) {
  return String(s || '').trim().split(/\s+/).filter(Boolean).length;
}

// Identical serializer to rebuildCities.mjs::emitCities so output matches.
function emitCities(cities) {
  const lines = ['  /* eslint-disable */', ''];
  for (const c of cities) {
    lines.push('  {');
    for (const [k, v] of Object.entries(c)) {
      if (v == null) continue;
      lines.push(`    ${k}: ${JSON.stringify(v)},`);
    }
    lines.push('  },');
  }
  return lines.join('\n');
}

async function extractMapplacesSrc(src) {
  const raw = await readFile(src, 'utf8');
  const start = raw.indexOf('export const MAPPLACES');
  if (start < 0) throw new Error('MAPPLACES export not found');
  const fromStart = raw.slice(start);
  const endRel = fromStart.indexOf('\n};\n');
  if (endRel < 0) {
    const endRel2 = fromStart.indexOf('\n};');
    if (endRel2 < 0) throw new Error('MAPPLACES end not found');
    return fromStart.slice(0, endRel2 + 3);
  }
  return fromStart.slice(0, endRel + 3);
}

async function readCities() {
  const url = pathToFileURL(SRC_PATH).href + '?t=' + Date.now();
  const mod = await import(url);
  return mod.CROATIAN_CITIES;
}

function validatePatchEntry(p, city, errs) {
  const where = `"${p.name}"`;
  if (p.addFact !== undefined) {
    if (typeof p.addFact !== 'string' || wordCount(p.addFact) < 5) {
      errs.push(`${where}: addFact too short / not string`);
    }
    const low = p.addFact.toLowerCase();
    for (const b of BANNED_PHRASES) {
      if (low.includes(b)) errs.push(`${where}: addFact banned phrase "${b}"`);
    }
    // Not a near-duplicate of an existing fact.
    for (const ef of city.facts || []) {
      if (ef.trim().toLowerCase() === p.addFact.trim().toLowerCase()) {
        errs.push(`${where}: addFact duplicates an existing fact`);
      }
    }
  }
  if (p.addVocab !== undefined) {
    const v = p.addVocab;
    if (!v || typeof v !== 'object') errs.push(`${where}: addVocab not object`);
    else {
      if (!v.hr || typeof v.hr !== 'string') errs.push(`${where}: addVocab.hr missing`);
      if (!v.en || typeof v.en !== 'string') errs.push(`${where}: addVocab.en missing`);
      if (!v.note || wordCount(v.note) < 5) errs.push(`${where}: addVocab.note too short (min 5 words)`);
      const existingHr = (city.vocab || []).map((x) => String(x.hr).toLowerCase());
      if (v.hr && existingHr.includes(v.hr.toLowerCase())) {
        errs.push(`${where}: addVocab.hr "${v.hr}" duplicates existing vocab`);
      }
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  const patchPaths = args.filter((a) => !a.startsWith('--'));
  if (patchPaths.length === 0) {
    console.error('Usage: node applyCityUpgrades.mjs <patch.json> [...] [--check]');
    process.exit(2);
  }

  const cities = await readCities();
  const byName = new Map(cities.map((c) => [String(c.name).toLowerCase().trim(), c]));

  // Load + merge patches.
  const patches = [];
  for (const p of patchPaths) {
    const parsed = JSON.parse(await readFile(resolve(p), 'utf8'));
    if (!Array.isArray(parsed.patches)) throw new Error(`${p}: expected { patches: [...] }`);
    patches.push(...parsed.patches);
    console.log(`  loaded ${parsed.patches.length} patches from ${p}`);
  }

  const errs = [];
  const seen = new Set();
  let factCount = 0, vocabCount = 0;
  for (const p of patches) {
    const key = String(p.name || '').toLowerCase().trim();
    const city = byName.get(key);
    if (!city) { errs.push(`unknown city "${p.name}"`); continue; }
    if (seen.has(key)) errs.push(`duplicate patch for "${p.name}"`);
    seen.add(key);
    validatePatchEntry(p, city, errs);
    if (p.addFact !== undefined && (city.facts || []).length >= 5) {
      errs.push(`"${p.name}": already has ${city.facts.length} facts — addFact would overfill`);
    }
    if (p.addVocab !== undefined && (city.vocab || []).length >= 3) {
      errs.push(`"${p.name}": already has ${city.vocab.length} vocab — addVocab would overfill`);
    }
  }

  if (errs.length) {
    console.log(`\nVALIDATION FAILED (${errs.length}):`);
    errs.forEach((e) => console.log('  ✗ ' + e));
    process.exit(1);
  }

  // Apply (mutating in-memory objects; key order preserved).
  for (const p of patches) {
    const city = byName.get(String(p.name).toLowerCase().trim());
    if (p.addFact !== undefined) { city.facts = [...city.facts, p.addFact]; factCount++; }
    if (p.addVocab !== undefined) { city.vocab = [...city.vocab, p.addVocab]; vocabCount++; }
  }

  // Post-condition: every patched city now within schema bounds.
  for (const p of patches) {
    const city = byName.get(String(p.name).toLowerCase().trim());
    if (city.facts.length > 7) throw new Error(`${city.name}: ${city.facts.length} facts > 7`);
    if (city.vocab.length > 3) throw new Error(`${city.name}: ${city.vocab.length} vocab > 3`);
  }

  console.log(`\nValidation OK. facts added: ${factCount}, vocab added: ${vocabCount}`);
  if (checkOnly) { console.log('(--check: not writing)'); return; }

  const mapplacesSrc = await extractMapplacesSrc(SRC_PATH);
  const out = `// geography.js — regenerated by scripts/rebuildCities.mjs
${mapplacesSrc}

export const CROATIAN_CITIES = [
${emitCities(cities)}
];
`
    // MAPPLACES is sliced verbatim from the working tree, which is CRLF under
    // core.autocrlf=true; emitCities() uses LF. Normalize to pure LF so the
    // file matches the canonical (committed) blob byte-for-byte.
    .replace(/\r\n/g, '\n');
  await writeFile(SRC_PATH, out, 'utf8');
  await writeFile(FUNC_PATH, out, 'utf8');
  console.log(`Wrote ${cities.length} cities to both geography.js files.`);
}

await main();
