// scripts/auditData.mjs
//
// Comprehensive data integrity audit. Runs three checks:
//
// 1. Mirror-pair drift: for every file that lives in BOTH src/data/* and
//    functions/api/content/_data/* (same relative path), report whether they
//    are byte-identical. The City of Day rebuild guaranteed sync for one
//    pair — this confirms the others are also in lockstep.
//
// 2. Dataset uniqueness: for every named array export in any data file,
//    count total entries and unique entries (keyed on the array's most
//    natural identity field — name | id | key | hr | first element).
//    Reports the dup count and lists the most-duplicated names.
//
// 3. Distribution by CEFR / level: where items carry a cefr/level field,
//    print the per-level histogram so structural gaps are visible.
//
// Run as: `node scripts/auditData.mjs`
//
// Output: a single markdown report at docs/audit-data-integrity-2026-05-20.md
//
// Read-only. Does not modify any source file.

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { dirname, resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const SRC_DATA = resolve(REPO_ROOT, 'src/data');
const FUNC_DATA = resolve(REPO_ROOT, 'functions/api/content/_data');
const REPORT_PATH = resolve(REPO_ROOT, 'docs/audit-data-integrity-2026-05-20.md');

async function listFilesRecursively(root) {
  const out = [];
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.isFile()) out.push(full);
    }
  }
  try {
    await walk(root);
  } catch {
    /* dir might not exist on a given side; ignore */
  }
  return out;
}

async function sha(path) {
  const buf = await readFile(path);
  return createHash('sha256').update(buf).digest('hex');
}

async function importExports(path) {
  const url = pathToFileURL(path).href + '?t=' + Date.now();
  try {
    return await import(url);
  } catch (e) {
    return { __importError: String(e.message || e) };
  }
}

function identityKey(item) {
  if (item == null) return null;
  if (typeof item === 'string' || typeof item === 'number') return String(item).toLowerCase().trim();
  if (Array.isArray(item)) return JSON.stringify(item.slice(0, 1)).toLowerCase();
  if (typeof item === 'object') {
    for (const f of ['id', 'name', 'key', 'hr', 'title', 'screen', 'topic']) {
      if (item[f] != null) return String(item[f]).toLowerCase().trim();
    }
    // Fall back to a JSON fingerprint of the first 200 chars
    return JSON.stringify(item).slice(0, 200).toLowerCase();
  }
  return null;
}

function countDups(arr) {
  const counts = new Map();
  for (const it of arr) {
    const k = identityKey(it);
    if (k == null) continue;
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const dups = [...counts.entries()].filter(([, n]) => n > 1);
  dups.sort((a, b) => b[1] - a[1]);
  return { uniqueCount: counts.size, dups };
}

function cefrField(item) {
  if (!item || typeof item !== 'object') return null;
  return item.cefr || item.level || item.difficulty || null;
}

function distByCefr(arr) {
  const dist = new Map();
  let withTag = 0;
  for (const it of arr) {
    const c = cefrField(it);
    if (!c) continue;
    withTag++;
    dist.set(String(c).toUpperCase(), (dist.get(String(c).toUpperCase()) || 0) + 1);
  }
  return { withTag, dist: [...dist.entries()].sort() };
}

async function auditFile(path) {
  const mod = await importExports(path);
  if (mod.__importError) {
    return { path, importError: mod.__importError, arrays: [], objects: [] };
  }
  const arrays = [];
  const objects = [];
  for (const [k, v] of Object.entries(mod)) {
    if (Array.isArray(v)) {
      const { uniqueCount, dups } = countDups(v);
      const { withTag, dist } = distByCefr(v);
      arrays.push({
        name: k,
        total: v.length,
        unique: uniqueCount,
        dupRatio: v.length > 0 ? +((v.length - uniqueCount) / v.length).toFixed(3) : 0,
        topDups: dups.slice(0, 8),
        cefrTagged: withTag,
        cefrDist: dist,
        sample: v.slice(0, 1),
      });
    } else if (v && typeof v === 'object') {
      // Object whose values are arrays (e.g., V = { greetings: [...], numbers: [...] })
      const subArrays = Object.entries(v).filter(([, sv]) => Array.isArray(sv));
      if (subArrays.length > 0) {
        for (const [subK, subV] of subArrays) {
          const { uniqueCount, dups } = countDups(subV);
          arrays.push({
            name: `${k}.${subK}`,
            total: subV.length,
            unique: uniqueCount,
            dupRatio: subV.length > 0 ? +((subV.length - uniqueCount) / subV.length).toFixed(3) : 0,
            topDups: dups.slice(0, 5),
            cefrTagged: 0,
            cefrDist: [],
            sample: subV.slice(0, 1),
          });
        }
      } else {
        objects.push({ name: k, type: 'object', keyCount: Object.keys(v).length });
      }
    }
  }
  return { path, arrays, objects };
}

async function findMirrorPairs() {
  const srcFiles = (await listFilesRecursively(SRC_DATA))
    .filter((f) => f.endsWith('.js'))
    .map((f) => ({ abs: f, rel: relative(SRC_DATA, f) }));
  const funcFiles = (await listFilesRecursively(FUNC_DATA))
    .filter((f) => f.endsWith('.js'))
    .map((f) => ({ abs: f, rel: relative(FUNC_DATA, f) }));
  const funcByRel = new Map(funcFiles.map((f) => [f.rel.replace(/\\/g, '/'), f]));
  const pairs = [];
  const srcOnly = [];
  for (const sf of srcFiles) {
    const relForward = sf.rel.replace(/\\/g, '/');
    const f = funcByRel.get(relForward);
    if (f) {
      const [hSrc, hFunc] = await Promise.all([sha(sf.abs), sha(f.abs)]);
      const stSrc = await stat(sf.abs);
      const stFunc = await stat(f.abs);
      pairs.push({
        rel: relForward,
        identical: hSrc === hFunc,
        srcSize: stSrc.size,
        funcSize: stFunc.size,
      });
      funcByRel.delete(relForward);
    } else {
      srcOnly.push(relForward);
    }
  }
  const funcOnly = [...funcByRel.keys()];
  return { pairs, srcOnly, funcOnly };
}

function fmtLine(s) {
  return s.replace(/[\r\n]+/g, ' ').slice(0, 100);
}

function renderReport({ mirror, fileAudits }) {
  const lines = [];
  lines.push('# Data Integrity Audit — 2026-05-20');
  lines.push('');
  lines.push('Generated by `scripts/auditData.mjs`. Read-only audit.');
  lines.push('');

  // Mirror drift
  lines.push('## Mirror-pair drift (#4)');
  lines.push('');
  lines.push('Files present in BOTH `src/data/` and `functions/api/content/_data/`:');
  lines.push('');
  lines.push('| File | Identical? | src bytes | func bytes |');
  lines.push('|---|---|---|---|');
  for (const p of mirror.pairs) {
    lines.push(`| \`${p.rel}\` | ${p.identical ? 'YES ✓' : '**NO ❌**'} | ${p.srcSize} | ${p.funcSize} |`);
  }
  lines.push('');
  lines.push('### Files only in src/data (no server mirror):');
  for (const f of mirror.srcOnly) lines.push(`- \`${f}\``);
  lines.push('');
  lines.push('### Files only in functions/api/content/_data (no client mirror):');
  for (const f of mirror.funcOnly) lines.push(`- \`${f}\``);
  lines.push('');

  // Per-file dataset audit
  lines.push('## Dataset uniqueness & CEFR distribution (#1, #2)');
  lines.push('');
  for (const fa of fileAudits) {
    lines.push(`### ${relative(REPO_ROOT, fa.path).replace(/\\/g, '/')}`);
    if (fa.importError) {
      lines.push(`- IMPORT ERROR: \`${fa.importError}\``);
      lines.push('');
      continue;
    }
    if (fa.arrays.length === 0) {
      lines.push('- No array exports found.');
      lines.push('');
      continue;
    }
    lines.push('');
    lines.push('| Array | Total | Unique | Dup % | CEFR tagged | CEFR dist |');
    lines.push('|---|---|---|---|---|---|');
    for (const a of fa.arrays) {
      const cefr = a.cefrDist.length ? a.cefrDist.map(([k, n]) => `${k}:${n}`).join(' ') : '—';
      const dupPct = (a.dupRatio * 100).toFixed(1) + '%';
      const flag = a.dupRatio > 0.05 ? ' ⚠️' : '';
      lines.push(`| \`${a.name}\` | ${a.total} | ${a.unique} | ${dupPct}${flag} | ${a.cefrTagged}/${a.total} | ${cefr} |`);
    }
    // Detail any high-dup arrays
    for (const a of fa.arrays) {
      if (a.dupRatio > 0.05 && a.topDups.length > 0) {
        lines.push('');
        lines.push(`**Top dups in \`${a.name}\`**:`);
        for (const [k, n] of a.topDups) {
          lines.push(`- ${n}× \`${fmtLine(k)}\``);
        }
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

async function main() {
  console.log('=== Mirror-pair drift ===');
  const mirror = await findMirrorPairs();
  for (const p of mirror.pairs) {
    console.log(
      `  ${p.identical ? '✓' : '❌'} ${p.rel} (src ${p.srcSize} / func ${p.funcSize})`,
    );
  }
  console.log(`  src-only files: ${mirror.srcOnly.length}`);
  console.log(`  func-only files: ${mirror.funcOnly.length}`);

  console.log('');
  console.log('=== Dataset uniqueness ===');
  const allFiles = [
    ...(await listFilesRecursively(SRC_DATA)).filter((f) => f.endsWith('.js')),
    ...(await listFilesRecursively(FUNC_DATA)).filter((f) => f.endsWith('.js')),
  ];
  const fileAudits = [];
  for (const f of allFiles) {
    const a = await auditFile(f);
    fileAudits.push(a);
    if (a.importError) {
      console.log(`  ERR ${relative(REPO_ROOT, f)}: ${a.importError.slice(0, 60)}`);
      continue;
    }
    for (const arr of a.arrays) {
      if (arr.dupRatio > 0.05) {
        console.log(
          `  ⚠️  ${relative(REPO_ROOT, f)}::${arr.name} total=${arr.total} unique=${arr.unique} (${(arr.dupRatio * 100).toFixed(1)}% dup)`,
        );
      }
    }
  }

  const md = renderReport({ mirror, fileAudits });
  await writeFile(REPORT_PATH, md, 'utf8');
  console.log('');
  console.log(`Wrote ${md.length} bytes to ${relative(REPO_ROOT, REPORT_PATH)}`);
}

await main();
