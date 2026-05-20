// scripts/applyCefrFixes.mjs
//
// Targeted CEFR-tag fixes per docs/audit-cefr-drift-2026-05-20.md.
//
// Highest-impact fixes only (BLOCKER):
//   - PADEZI: already retagged A1 → A2 inline (in grammar.js)
//   - PITCH_ACCENT: all 19 entries currently `cefr: 'B1'`, should be `cefr: 'C1'`.
//     Croatian's 4-accent system is C1-level phonology, not B1.
//
// Other CEFR drift findings are HIGH/MEDIUM and require content re-distribution
// (e.g., redistributing grammar.js B1-heavy bucket into B2/C1). Deferred to a
// follow-up content task — too broad to mechanically patch.

import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

async function retagPitchAccent() {
  const path = resolve(REPO_ROOT, 'functions/api/content/_data/grammar.js');
  const buf = await readFile(path, 'utf8');

  // Find PITCH_ACCENT array boundaries — start at the export, end at the
  // matching `];` closing the array at top level.
  const startMarker = 'export const PITCH_ACCENT = [';
  const start = buf.indexOf(startMarker);
  if (start < 0) throw new Error('PITCH_ACCENT export not found');

  // Find the closing `];` of the array. Look for the first `];` at column 0
  // after `start`.
  const after = buf.slice(start);
  const closeIdx = after.indexOf('\n];');
  if (closeIdx < 0) throw new Error('PITCH_ACCENT array close not found');
  const arrayBody = after.slice(0, closeIdx + 3);

  // Replace `cefr: 'B1',` with `cefr: 'C1',` ONLY inside this slice.
  const before = arrayBody;
  const updated = arrayBody.split("cefr: 'B1',").join("cefr: 'C1',");
  const changes = arrayBody.split("cefr: 'B1',").length - 1;
  if (changes === 0) {
    console.log('  PITCH_ACCENT: no B1 tags found — perhaps already retagged.');
    return 0;
  }

  // Splice the updated slice back into the full buffer.
  const newBuf = buf.slice(0, start) + updated + buf.slice(start + arrayBody.length);
  await writeFile(path, newBuf, 'utf8');
  console.log(`  PITCH_ACCENT: retagged ${changes} entries from B1 → C1`);
  return changes;
}

async function main() {
  console.log('=== CEFR drift fixes ===');
  const total = await retagPitchAccent();
  console.log('');
  console.log(`Applied ${total} CEFR retags.`);
}

await main();
