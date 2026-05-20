// scripts/validateBatch.mjs
//
// Validates one or more subagent batch outputs against the city-entry schema
// and quality bar set in scripts/_subagent_prompt_template.md.
//
// Usage: node scripts/validateBatch.mjs <path-to-batch.json> [...]
//
// Exit code 0 if all batches pass, 1 otherwise. Prints a per-batch report
// to stdout so the caller can decide whether to merge.

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const BANNED_PHRASES = [
  'charming village',
  'picturesque',
  'must-visit',
  'hidden gem',
  "mediterranean jewel",
  'crystal-clear waters',
  'a beautiful',
  'simply stunning',
];

const REQUIRED_FIELDS = [
  'name', 'region', 'icon', 'color', 'tagline',
  'intro', 'history', 'facts', 'vocab', 'didYouKnow',
];

const VALID_COLORS = new Set([
  '#dc2626', '#0e7490', '#0284c7', '#16a34a',
  '#7c3aed', '#92400e', '#78716c',
]);

function wordCount(s) {
  return String(s || '').trim().split(/\s+/).filter(Boolean).length;
}

function validateEntry(c, idx) {
  const issues = [];
  for (const f of REQUIRED_FIELDS) {
    if (!(f in c)) issues.push(`missing field "${f}"`);
  }
  if (typeof c.name !== 'string' || !c.name.trim()) issues.push('empty name');
  if (typeof c.region !== 'string' || !c.region.trim()) issues.push('empty region');
  if (typeof c.tagline !== 'string') issues.push('tagline not string');
  if (typeof c.intro !== 'string') issues.push('intro not string');
  if (typeof c.history !== 'string') issues.push('history not string');
  if (typeof c.didYouKnow !== 'string') issues.push('didYouKnow not string');
  if (!Array.isArray(c.facts)) issues.push('facts not array');
  if (!Array.isArray(c.vocab)) issues.push('vocab not array');
  if (Array.isArray(c.facts) && c.facts.length < 4) issues.push(`only ${c.facts.length} facts (min 4)`);
  if (Array.isArray(c.facts) && c.facts.length > 7) issues.push(`${c.facts.length} facts (>7 — too many)`);
  if (Array.isArray(c.vocab) && c.vocab.length !== 3) issues.push(`${c.vocab.length} vocab items (need 3)`);
  // Length sanity (warnings, not failures)
  const introWords = wordCount(c.intro);
  if (introWords < 30) issues.push(`intro too short (${introWords} words, min 30)`);
  if (introWords > 130) issues.push(`intro too long (${introWords} words, max 130)`);
  const histWords = wordCount(c.history);
  if (histWords < 50) issues.push(`history too short (${histWords} words, min 50)`);
  if (histWords > 250) issues.push(`history too long (${histWords} words, max 250)`);
  const tagWords = wordCount(c.tagline);
  if (tagWords < 3 || tagWords > 12) issues.push(`tagline word count ${tagWords} (expect 4-10)`);
  // Color must be on palette
  if (c.color && !VALID_COLORS.has(c.color)) issues.push(`color "${c.color}" not on palette`);
  // Banned-phrase scan
  const blob = [c.tagline, c.intro, c.history, c.didYouKnow, ...(c.facts || [])].join(' \n').toLowerCase();
  for (const p of BANNED_PHRASES) {
    if (blob.includes(p)) issues.push(`banned phrase "${p}"`);
  }
  // Vocab entries
  if (Array.isArray(c.vocab)) {
    for (const [vi, v] of c.vocab.entries()) {
      if (!v || typeof v !== 'object') {
        issues.push(`vocab[${vi}] not object`);
        continue;
      }
      if (!v.hr) issues.push(`vocab[${vi}] missing hr`);
      if (!v.en) issues.push(`vocab[${vi}] missing en`);
      if (!v.note || wordCount(v.note) < 5) issues.push(`vocab[${vi}] note too short`);
    }
  }
  return { idx, name: c.name, issues };
}

async function validateBatch(path) {
  const buf = await readFile(path, 'utf8');
  const parsed = JSON.parse(buf);
  const cities = Array.isArray(parsed.newCities) ? parsed.newCities : null;
  if (!cities) {
    return { path, fatal: 'no newCities array', entries: 0, issues: [] };
  }
  // Internal name dedup
  const nameSet = new Set();
  const dupes = [];
  for (const c of cities) {
    const k = String(c.name || '').toLowerCase().trim();
    if (nameSet.has(k)) dupes.push(c.name);
    nameSet.add(k);
  }
  const reports = cities.map((c, i) => validateEntry(c, i));
  const bad = reports.filter((r) => r.issues.length > 0);
  return {
    path,
    entries: cities.length,
    duplicateNames: dupes,
    failingEntries: bad,
  };
}

async function main() {
  const paths = process.argv.slice(2);
  if (paths.length === 0) {
    console.error('Usage: node validateBatch.mjs <batch.json> [...]');
    process.exit(2);
  }
  let anyFailures = false;
  for (const p of paths) {
    const abs = resolve(p);
    let report;
    try {
      report = await validateBatch(abs);
    } catch (e) {
      console.log(`=== ${p} === FATAL: ${e.message}`);
      anyFailures = true;
      continue;
    }
    console.log(`=== ${p} ===`);
    console.log(`  entries: ${report.entries}`);
    if (report.duplicateNames.length > 0) {
      console.log(`  duplicate names within batch: ${report.duplicateNames.join(', ')}`);
      anyFailures = true;
    }
    if (report.failingEntries.length === 0) {
      console.log('  schema/quality: ALL PASS');
    } else {
      console.log(`  failing entries: ${report.failingEntries.length}`);
      for (const f of report.failingEntries.slice(0, 10)) {
        console.log(`    #${f.idx} ${f.name}: ${f.issues.join('; ')}`);
      }
      if (report.failingEntries.length > 10) {
        console.log(`    ... and ${report.failingEntries.length - 10} more`);
      }
      anyFailures = true;
    }
  }
  process.exit(anyFailures ? 1 : 0);
}

await main();
