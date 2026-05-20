// scripts/auditMisc.mjs
//
// Combined audit covering three remaining concerns:
//   3. Marketing-copy claims: hardcoded counts/promises in JSX/TSX strings
//      vs actual data. Looks for digits-near-noun patterns and obvious
//      promises that need verification.
//   5. Mock-vs-production schema drift: compares the field shape that
//      e2e/fixtures/seed-auth.js mockContent provides to the field shape
//      the real /api/content/* endpoints would return.
//   6. Sync-flag audit: every localStorage.setItem call in src/, checked
//      against keys read by buildProgressSnapshot + applyRemoteProgress.
//      Keys missing from those = device-local only, lost on new device.
//
// Read-only. Writes a single combined report:
//   docs/audit-misc-2026-05-20.md

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, relative, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const SRC = resolve(REPO_ROOT, 'src');
const E2E_FIXTURES = resolve(REPO_ROOT, 'e2e/fixtures');
const REPORT_PATH = resolve(REPO_ROOT, 'docs/audit-misc-2026-05-20.md');

async function walk(root, exts = ['.ts', '.tsx', '.js']) {
  const out = [];
  async function w(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === 'node_modules' || e.name === '__tests__' || e.name.startsWith('.')) continue;
        await w(full);
      } else if (e.isFile() && exts.some((x) => e.name.endsWith(x))) {
        out.push(full);
      }
    }
  }
  await w(root);
  return out;
}

// ── Phase 3: marketing-copy claims ──────────────────────────────────────────

const COUNT_CLAIM_RE = /\b(\d{1,5})\s*(\+)?\s*(scenarios?|cities?|conversations?|lessons?|exercises?|words?|stories|languages?|tutorials?|users?|features?|levels?|topics?|verbs?|drills?|grammar\s+rules?)\b/gi;

async function scanMarketingClaims() {
  const files = await walk(SRC);
  const findings = [];
  for (const f of files) {
    const buf = await readFile(f, 'utf8');
    if (buf.length > 200_000) continue;
    for (const m of buf.matchAll(COUNT_CLAIM_RE)) {
      const idx = m.index;
      const line = buf.slice(buf.lastIndexOf('\n', idx) + 1, buf.indexOf('\n', idx));
      if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) continue;
      const ctx = buf.slice(Math.max(0, idx - 30), idx);
      if (/length\s*[<>=]+\s*$|=\s*$|\+\s*$/.test(ctx)) continue;
      findings.push({
        file: relative(REPO_ROOT, f).replace(/\\/g, '/'),
        line: buf.slice(0, idx).split('\n').length,
        match: m[0],
        context: line.trim().slice(0, 150),
      });
    }
  }
  return findings;
}

// ── Phase 5: mock vs production schema ─────────────────────────────────────

async function readSchemaFromMock() {
  const mockPath = resolve(E2E_FIXTURES, 'seed-auth.js');
  const buf = await readFile(mockPath, 'utf8');
  const idx = buf.indexOf('mockContent');
  if (idx < 0) return { error: 'mockContent not found in seed-auth.js' };
  const section = buf.slice(idx, idx + 8000);
  const keyRe = /^\s*([A-Z][A-Z0-9_]*)\s*:/gm;
  const keys = new Set();
  for (const m of section.matchAll(keyRe)) {
    keys.add(m[1]);
  }
  return { mockKeys: [...keys].sort() };
}

async function readSchemaFromProductionData() {
  const allFiles = [
    ...(await walk(resolve(REPO_ROOT, 'src/data'), ['.js', '.jsx', '.ts', '.tsx'])),
    ...(await walk(resolve(REPO_ROOT, 'functions/api/content/_data'), ['.js'])),
  ];
  const allKeys = new Set();
  for (const f of allFiles) {
    const buf = await readFile(f, 'utf8');
    const re = /^export\s+const\s+([A-Z][A-Z0-9_]*)\s*=/gm;
    for (const m of buf.matchAll(re)) {
      allKeys.add(m[1]);
    }
  }
  return { prodKeys: [...allKeys].sort() };
}

// ── Phase 6: sync-flag audit ───────────────────────────────────────────────

async function findLocalStorageKeys() {
  const files = await walk(SRC);
  const writes = new Map();
  const reads = new Map();
  for (const f of files) {
    const buf = await readFile(f, 'utf8');
    if (buf.length > 200_000) continue;
    const writeRe = /localStorage\.setItem\(\s*['"`]([^'"`]+)['"`]/g;
    for (const m of buf.matchAll(writeRe)) {
      const k = m[1];
      const line = buf.slice(0, m.index).split('\n').length;
      const list = writes.get(k) || [];
      list.push({ file: relative(REPO_ROOT, f).replace(/\\/g, '/'), line });
      writes.set(k, list);
    }
    const readRe = /localStorage\.getItem\(\s*['"`]([^'"`]+)['"`]/g;
    for (const m of buf.matchAll(readRe)) {
      const k = m[1];
      const list = reads.get(k) || [];
      list.push({ file: relative(REPO_ROOT, f).replace(/\\/g, '/') });
      reads.set(k, list);
    }
  }
  return { writes, reads };
}

async function findSyncedKeys() {
  const snapPath = resolve(REPO_ROOT, 'src/lib/progressSnapshot.ts');
  const applyPath = resolve(REPO_ROOT, 'src/lib/applyRemoteProgress.ts');
  const synced = new Set();
  for (const p of [snapPath, applyPath]) {
    try {
      const buf = await readFile(p, 'utf8');
      const re = /['"`]([a-zA-Z_][a-zA-Z0-9_]+)['"`]/g;
      for (const m of buf.matchAll(re)) {
        const k = m[1];
        if (k.length >= 2 && k.length <= 60) synced.add(k);
      }
    } catch (e) {
      console.warn(`could not read ${p}: ${e.message}`);
    }
  }
  return synced;
}

function classifyDeviceLocal(key) {
  if (/^nh_(placement|goal|onboard|streak|premium|recap|stage|ceremony|hero)/.test(key)) return 'suspicious';
  if (/^(placement_done|onboarded|streak_|stage[0-9]+_|first_use|completed_)/.test(key)) return 'suspicious';
  if (/_v\d+$/.test(key)) return 'benign';
  if (/^(darkMode|cookie_consent|nh_hero_expanded|nh_weekly_recap|nh_premium_welcome)/.test(key)) return 'benign';
  if (/^(uS|uA|uP_|uStreak)$/.test(key)) return 'benign';
  if (/^_/.test(key)) return 'benign';
  return 'suspicious';
}

function renderReport({ marketing, mockMissingKeys, prodMissingKeys, syncFindings }) {
  const lines = [];
  lines.push('# Miscellaneous Audit — 2026-05-20');
  lines.push('');
  lines.push('Generated by `scripts/auditMisc.mjs`. Read-only.');
  lines.push('');

  lines.push('## #3 Marketing-copy claims');
  lines.push('');
  lines.push(`Found ${marketing.length} numeric "N nouns" claims in JSX/TSX/TS to verify against real data.`);
  lines.push('');
  lines.push('| File | Line | Claim | Context |');
  lines.push('|---|---|---|---|');
  for (const m of marketing.slice(0, 200)) {
    lines.push(`| \`${m.file}\` | ${m.line} | \`${m.match}\` | ${m.context.replace(/\|/g, '\\|')} |`);
  }
  if (marketing.length > 200) {
    lines.push(`| ... | ... | (truncated, ${marketing.length - 200} more) | ... |`);
  }
  lines.push('');

  lines.push('## #5 Mock-vs-production schema drift');
  lines.push('');
  lines.push('Top-level data exports in production data files but NOT in `mockContent`:');
  lines.push('');
  for (const k of prodMissingKeys.slice(0, 200)) lines.push(`- \`${k}\``);
  if (prodMissingKeys.length > 200) lines.push(`- ... (${prodMissingKeys.length - 200} more)`);
  lines.push('');
  lines.push('Keys in `mockContent` with no matching `export const` in real data:');
  lines.push('');
  for (const k of mockMissingKeys.slice(0, 100)) lines.push(`- \`${k}\``);
  lines.push('');

  lines.push('## #6 Sync-flag audit');
  lines.push('');
  lines.push('Keys written via `localStorage.setItem` from `src/` but NOT referenced in `progressSnapshot.ts` or `applyRemoteProgress.ts`. These do NOT sync to Firebase, so a new device starts without them.');
  lines.push('');
  lines.push(`Total distinct write keys: ${syncFindings.totalWriteKeys}`);
  lines.push(`Synced keys (referenced in snapshot or apply): ${syncFindings.syncedSet.size}`);
  lines.push(`Device-local keys: ${syncFindings.deviceLocal.length}`);
  lines.push('');
  lines.push('### Suspicious — likely should sync across devices');
  lines.push('');
  for (const k of syncFindings.suspicious) {
    lines.push(`- **\`${k.key}\`** — ${k.locations[0].file}:${k.locations[0].line}${k.locations.length > 1 ? ` (+${k.locations.length - 1} more)` : ''}`);
  }
  lines.push('');
  lines.push('### Benign — likely intentionally device-local');
  lines.push('');
  for (const k of syncFindings.benign.slice(0, 100)) {
    lines.push(`- \`${k.key}\``);
  }

  return lines.join('\n');
}

async function main() {
  console.log('=== #3 Marketing claims ===');
  const marketing = await scanMarketingClaims();
  console.log(`  ${marketing.length} claim mentions found`);

  console.log('=== #5 Mock vs production ===');
  const mock = await readSchemaFromMock();
  const prod = await readSchemaFromProductionData();
  const mockKeySet = new Set(mock.mockKeys || []);
  const prodKeySet = new Set(prod.prodKeys || []);
  const prodMissingKeys = [...prodKeySet].filter((k) => !mockKeySet.has(k));
  const mockMissingKeys = [...mockKeySet].filter((k) => !prodKeySet.has(k));
  console.log(`  mock keys: ${mockKeySet.size}, prod keys: ${prodKeySet.size}`);
  console.log(`  prod NOT in mock: ${prodMissingKeys.length}`);
  console.log(`  mock NOT in prod: ${mockMissingKeys.length}`);

  console.log('=== #6 Sync flags ===');
  const { writes } = await findLocalStorageKeys();
  const syncedSet = await findSyncedKeys();
  const totalWriteKeys = writes.size;
  const deviceLocal = [];
  for (const [key, locs] of writes.entries()) {
    if (!syncedSet.has(key)) deviceLocal.push({ key, locations: locs });
  }
  const suspicious = deviceLocal.filter((d) => classifyDeviceLocal(d.key) === 'suspicious');
  const benign = deviceLocal.filter((d) => classifyDeviceLocal(d.key) === 'benign');
  console.log(`  total write keys: ${totalWriteKeys}`);
  console.log(`  synced: ${syncedSet.size}`);
  console.log(`  device-local: ${deviceLocal.length} (${suspicious.length} suspicious, ${benign.length} benign)`);

  const md = renderReport({
    marketing,
    mockMissingKeys,
    prodMissingKeys,
    syncFindings: { totalWriteKeys, syncedSet, deviceLocal, suspicious, benign },
  });
  await writeFile(REPORT_PATH, md, 'utf8');
  console.log(`Wrote ${md.length} bytes to ${relative(REPO_ROOT, REPORT_PATH)}`);
}

await main();
