/**
 * tsx-migrate.cjs — Bulk .jsx → .tsx migration
 *
 * Step 1: Rename all src/**\/*.jsx files to .tsx (excluding src/tests/).
 * Step 2: Strip explicit .jsx extensions from every import/mock in src/.
 *
 * Run: node scripts/tsx-migrate.cjs
 */

const fs   = require('fs');
const path = require('path');

const ROOT = 'C:\\Users\\jschr\\Dropbox\\Croatian Learning Application\\Source Code\\nasa-hrvatska-v2';
const SRC  = path.join(ROOT, 'src');

// ── helpers ──────────────────────────────────────────────────────────────────

function walk(dir, exts, excludeSubstrings = []) {
  const out = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch (e) { return out; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!excludeSubstrings.some(x => full.includes(x))) out.push(...walk(full, exts, excludeSubstrings));
    } else if (exts.some(x => e.name.endsWith(x))) {
      out.push(full);
    }
  }
  return out;
}

// ── Step 1: collect .jsx files to rename ─────────────────────────────────────

// Keep test files as .jsx — tsconfig excludes them and vitest handles them fine
const EXCLUDE_RENAME = ['src\\tests\\', 'src/tests/'];
const jsxFiles = walk(SRC, ['.jsx'], EXCLUDE_RENAME);
console.log(`\n[Step 1] Renaming ${jsxFiles.length} .jsx → .tsx files…`);

let renamed = 0;
for (const f of jsxFiles) {
  const newPath = f.replace(/\.jsx$/, '.tsx');
  if (fs.existsSync(f)) {
    fs.renameSync(f, newPath);
    renamed++;
  }
}
console.log(`  Done: ${renamed} files renamed`);

// ── Step 2: update imports in ALL source files (including tests) ──────────────

const allSrc = walk(SRC, ['.ts', '.tsx', '.js', '.jsx']);
console.log(`\n[Step 2] Stripping .jsx from imports in ${allSrc.length} files…`);

const patterns = [
  [/from '([^']+)\.jsx'/g,       "from '$1'"],
  [/from "([^"]+)\.jsx"/g,       'from "$1"'],
  [/import\('([^']+)\.jsx'\)/g,  "import('$1')"],
  [/import\("([^"]+)\.jsx"\)/g,  'import("$1")'],
  [/vi\.mock\('([^']+)\.jsx'/g,  "vi.mock('$1'"],
  [/vi\.mock\("([^"]+)\.jsx"/g,  'vi.mock("$1"'],
];

let updated = 0;
for (const f of allSrc) {
  try {
    const orig = fs.readFileSync(f, 'utf8');
    let content = orig;
    for (const [re, rep] of patterns) content = content.replace(re, rep);
    if (content !== orig) { fs.writeFileSync(f, content, 'utf8'); updated++; }
  } catch (e) { console.error(`  ERROR ${path.basename(f)}: ${e.message}`); }
}
console.log(`  Updated imports in: ${updated} files`);

// ── Done ──────────────────────────────────────────────────────────────────────

const tsxCount = walk(SRC, ['.tsx'], []).length;
const tsCount  = walk(SRC, ['.ts'],  []).filter(f => !f.endsWith('.d.ts')).length;
const jsxLeft  = walk(SRC, ['.jsx'], []).length;
const total    = tsxCount + tsCount + jsxLeft;

console.log(`\n[Done]`);
console.log(`  .tsx: ${tsxCount}  .ts: ${tsCount}  .jsx remaining (tests): ${jsxLeft}`);
console.log(`  TypeScript coverage: ${Math.round((tsxCount + tsCount) / total * 100)}%\n`);
