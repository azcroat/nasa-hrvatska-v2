// scripts/applyCroatianFixes.mjs
//
// Applies the 16 BLOCKER + 5 HIGH + 2 LOW grammatical/orthographic fixes
// identified in docs/audit-croatian-quality-2026-05-20.md, plus the
// LEVEL_NARRATIVE duplicate-entry fix from
// docs/audit-data-integrity-2026-05-20.md.
//
// Each patch is verified: the script checks that the OLD string is found
// exactly once in the target file before replacing. If a patch fails to
// find its expected text (the file moved or was already fixed), the script
// aborts before any write, so partial application cannot happen.
//
// Mirrored files (scenarios.js, vocabulary.js) are patched in BOTH copies.
//
// Run: `node scripts/applyCroatianFixes.mjs`

import { readFile, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

const FUNC_DATA = resolve(REPO_ROOT, 'functions/api/content/_data');
const SRC_DATA = resolve(REPO_ROOT, 'src/data');

const SCEN_FUNC = resolve(FUNC_DATA, 'scenarios.js');
const SCEN_SRC = resolve(SRC_DATA, 'scenarios.js');
const VOCAB_FUNC = resolve(FUNC_DATA, 'vocabulary.js');
const VOCAB_SRC = resolve(SRC_DATA, 'vocabulary.js');
const STORIES = resolve(FUNC_DATA, 'gradedStories.js');
const LESSONS = resolve(FUNC_DATA, 'lessons.js');
const CORE = resolve(FUNC_DATA, 'core.js');

/**
 * Each patch: { file, paths (target absolute paths), oldStr, newStr, finding, severity, expectOccurrences }
 * For mirror pairs, paths contains both file paths and they must each contain
 * the oldStr exactly `expectOccurrences` times.
 */
const PATCHES = [
  // ── scenarios.js — mirrored ───────────────────────────────────────────────
  {
    paths: [SCEN_FUNC, SCEN_SRC],
    oldStr: 'antes nego',
    newStr: 'prije nego što',
    finding: 'F1 — Spanish bleed "antes nego" → "prije nego što"',
    severity: 'BLOCKER',
    expectOccurrences: 1,
  },
  {
    paths: [SCEN_FUNC, SCEN_SRC],
    oldStr: 'Stijedeći dan',
    newStr: 'Sljedeći dan',
    finding: 'F2 — Typo "Stijedeći" → "Sljedeći"',
    severity: 'BLOCKER',
    expectOccurrences: 1,
  },
  {
    paths: [SCEN_FUNC, SCEN_SRC],
    oldStr: 'za miesec dana',
    newStr: 'za mjesec dana',
    finding: 'F3 — Missing j "miesec" → "mjesec"',
    severity: 'BLOCKER',
    expectOccurrences: 1,
  },
  {
    paths: [SCEN_FUNC, SCEN_SRC],
    oldStr: 'Kašikom stavljaj',
    newStr: 'Žlicom stavljaj',
    finding: 'F4 — Bosnian "Kašikom" → Croatian "Žlicom"',
    severity: 'HIGH',
    expectOccurrences: 1,
  },
  {
    paths: [SCEN_FUNC, SCEN_SRC],
    oldStr: 'Potvrda stize na',
    newStr: 'Potvrda stiže na',
    finding: 'F5 — Missing diacritic "stize" → "stiže"',
    severity: 'HIGH',
    expectOccurrences: 1,
  },
  {
    paths: [SCEN_FUNC, SCEN_SRC],
    oldStr: 'Je li donosila neku poruku o grešci?',
    newStr: 'Je li prikazala neku poruku o grešci?',
    finding: 'F6 — Calque "donosila poruku" → "prikazala poruku"',
    severity: 'HIGH',
    expectOccurrences: 1,
  },

  // ── gradedStories.js — not mirrored ───────────────────────────────────────
  {
    paths: [STORIES],
    oldStr: 'Mi djeca украшavamo',
    newStr: 'Mi djeca ukrašavamo',
    finding: 'F7 — Cyrillic→Latin "украшavamo" → "ukrašavamo"',
    severity: 'BLOCKER',
    expectOccurrences: 1,
  },
  {
    paths: [STORIES],
    oldStr: 'otišli na plaţu',
    newStr: 'otišli na plažu',
    finding: 'F8a — Cedilla-z "plaţu" → "plažu"',
    severity: 'BLOCKER',
    expectOccurrences: 1,
  },
  {
    paths: [STORIES],
    oldStr: 'gledali mladeţ',
    newStr: 'gledali mladež',
    finding: 'F8b — Cedilla-z "mladeţ" → "mladež"',
    severity: 'BLOCKER',
    expectOccurrences: 1,
  },
  {
    paths: [STORIES],
    oldStr: 'rublja i kavčem',
    newStr: 'rublja i kaučem',
    finding: 'F9 — Wrong stem "kavčem" → "kaučem"',
    severity: 'BLOCKER',
    expectOccurrences: 1,
  },
  {
    paths: [STORIES],
    oldStr: 'ali vrijelo je svake lipe',
    newStr: 'ali vrijedilo je svake lipe',
    finding: 'F10 — Wrong verb "vrijelo" (boiled) → "vrijedilo" (was worth)',
    severity: 'BLOCKER',
    expectOccurrences: 1,
  },
  {
    paths: [STORIES],
    oldStr: 'Juče navečer,',
    newStr: 'Jučer navečer,',
    finding: 'F11 — Bosnian/Serbian "Juče" → Croatian "Jučer"',
    severity: 'HIGH',
    expectOccurrences: 1,
  },
  {
    paths: [STORIES],
    oldStr: 'da joj je suze krenule',
    newStr: 'da su joj suze krenule',
    finding: 'F12 — Clitic + plural agreement fix',
    severity: 'BLOCKER',
    expectOccurrences: 1,
  },
  {
    paths: [STORIES],
    oldStr: 'smireno i samouzdano',
    newStr: 'smireno i samopouzdano',
    finding: 'F13a — "samouzdano" → "samopouzdano"',
    severity: 'BLOCKER',
    expectOccurrences: 1,
  },
  {
    paths: [STORIES],
    oldStr: "hr: 'samouzdanje'",
    newStr: "hr: 'samopouzdanje'",
    finding: 'F13b — vocab "samouzdanje" → "samopouzdanje"',
    severity: 'BLOCKER',
    expectOccurrences: 1,
  },
  {
    paths: [STORIES],
    oldStr: 'Imala je samouzdanja.',
    newStr: 'Imala je samopouzdanja.',
    finding: 'F13c — vocab example "samouzdanja" → "samopouzdanja"',
    severity: 'BLOCKER',
    expectOccurrences: 1,
  },
  {
    paths: [STORIES],
    oldStr: 'Krležina dijela koja',
    newStr: 'Krležina djela koja',
    finding: 'F14 — "dijela" (parts) → "djela" (works/deeds)',
    severity: 'BLOCKER',
    expectOccurrences: 1,
  },
  {
    paths: [STORIES],
    oldStr: 'sad si pravi Zagrepčan!',
    newStr: 'sad si pravi Zagrepčanin!',
    finding: 'F15 — Colloquial "Zagrepčan" → standard "Zagrepčanin"',
    severity: 'HIGH',
    expectOccurrences: 1,
  },

  // ── lessons.js — not mirrored ─────────────────────────────────────────────
  {
    paths: [LESSONS],
    oldStr: "'Dao sam knjugu Ani.'",
    newStr: "'Dao sam knjigu Ani.'",
    finding: 'F16 — Dative example "knjugu" → "knjigu"',
    severity: 'BLOCKER',
    expectOccurrences: 1,
  },
  {
    paths: [LESSONS],
    oldStr: "'Ću čitati'",
    newStr: "'Čitat ću' (or 'Ja ću čitati')",
    finding: 'F17a — Clitic-first error "Ću čitati" → "Čitat ću"',
    severity: 'BLOCKER',
    expectOccurrences: 1,
  },
  {
    paths: [LESSONS],
    oldStr: "'Ću pročitati'",
    newStr: "'Pročitat ću' (or 'Ja ću pročitati')",
    finding: 'F17b — Clitic-first error "Ću pročitati" → "Pročitat ću"',
    severity: 'BLOCKER',
    expectOccurrences: 1,
  },
  {
    paths: [LESSONS],
    oldStr: "This is the accusation for one of Croatian's most common",
    newStr: "This is the formation pattern for one of Croatian's most common",
    finding: 'F18 — English typo "accusation" → "formation pattern"',
    severity: 'LOW',
    expectOccurrences: 1,
  },

  // ── vocabulary.js — mirrored ──────────────────────────────────────────────
  {
    paths: [VOCAB_FUNC, VOCAB_SRC],
    oldStr: "['svekr', \"father-in-law (husband's father)\", 'svekr']",
    newStr: "['svekar', \"father-in-law (husband's father)\", 'sve-kar']",
    finding: 'F19 — Wrong nominative "svekr" → "svekar"',
    severity: 'BLOCKER',
    expectOccurrences: 1,
  },
  {
    paths: [VOCAB_FUNC, VOCAB_SRC],
    oldStr: "['pomajka', 'stepmother', 'po-my-ka']",
    newStr: "['pomajka', 'stepmother', 'po-may-ka']",
    finding: 'F20 — Wrong pronunciation guide "po-my-ka" → "po-may-ka"',
    severity: 'LOW',
    expectOccurrences: 1,
  },
  {
    paths: [VOCAB_FUNC, VOCAB_SRC],
    oldStr: "['Tisuću', 'One thousand']",
    newStr: "['Tisuća', 'One thousand']",
    finding: 'F21 — Accusative→Nominative dictionary form "Tisuću" → "Tisuća"',
    severity: 'HIGH',
    expectOccurrences: 1,
  },
  {
    paths: [VOCAB_FUNC, VOCAB_SRC],
    oldStr: "['Dvjesta', 'Two hundred']",
    newStr: "['Dvjesto', 'Two hundred']",
    finding: 'F22 — Štokavian "Dvjesta" → Croatian standard "Dvjesto"',
    severity: 'HIGH',
    expectOccurrences: 1,
  },
  {
    paths: [VOCAB_FUNC, VOCAB_SRC],
    oldStr: "'Primite moje iskreno sućut.',\n      'Please accept my sincere condolences.',\n      'pri-mi-te mo-ye is-kre-no su-chut',",
    newStr: "'Primite moju iskrenu sućut.',\n      'Please accept my sincere condolences.',\n      'pri-mi-te mo-yu is-kre-nu su-chut',",
    finding: 'F23 — Gender agreement in condolence phrase',
    severity: 'BLOCKER',
    expectOccurrences: 1,
  },

  // ── core.js — LEVEL_NARRATIVE duplicate fix ───────────────────────────────
  // Each narrative array ends with "Naš Čovjek", "Naš Čovjek" (duplicate).
  // Remove the second "Naš Čovjek" entry in each. Match by surrounding context.
  {
    paths: [CORE],
    oldStr: "'Coming Home',\n    'Naš Čovjek',\n    'Naš Čovjek',",
    newStr: "'Coming Home',\n    'Naš Čovjek',",
    finding: 'D1 — LEVEL_NARRATIVE.heritage dup "Naš Čovjek"',
    severity: 'MEDIUM',
    expectOccurrences: 1,
  },
  {
    paths: [CORE],
    oldStr: "'Native Flow',\n    'Naš Čovjek',\n    'Naš Čovjek',",
    newStr: "'Native Flow',\n    'Naš Čovjek',",
    finding: 'D2 — LEVEL_NARRATIVE.family dup "Naš Čovjek"',
    severity: 'MEDIUM',
    expectOccurrences: 1,
  },
  {
    paths: [CORE],
    oldStr: "'Croatian Soul',\n    'Naš Čovjek',\n    'Naš Čovjek',",
    newStr: "'Croatian Soul',\n    'Naš Čovjek',",
    finding: 'D3 — LEVEL_NARRATIVE.travel dup "Naš Čovjek"',
    severity: 'MEDIUM',
    expectOccurrences: 1,
  },
  {
    paths: [CORE],
    oldStr: "'Living Croatia',\n    'Naš Čovjek',\n    'Naš Čovjek',",
    newStr: "'Living Croatia',\n    'Naš Čovjek',",
    finding: 'D4 — LEVEL_NARRATIVE.culture dup "Naš Čovjek"',
    severity: 'MEDIUM',
    expectOccurrences: 1,
  },
];

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let count = 0;
  let pos = 0;
  while (true) {
    const next = haystack.indexOf(needle, pos);
    if (next < 0) break;
    count++;
    pos = next + needle.length;
  }
  return count;
}

async function dryRun() {
  // Read each unique file once, then test all patches against it in memory.
  const uniquePaths = new Set();
  for (const p of PATCHES) for (const f of p.paths) uniquePaths.add(f);
  const fileContents = new Map();
  for (const f of uniquePaths) {
    fileContents.set(f, await readFile(f, 'utf8'));
  }
  const issues = [];
  for (const p of PATCHES) {
    for (const file of p.paths) {
      const buf = fileContents.get(file);
      const found = countOccurrences(buf, p.oldStr);
      if (found !== p.expectOccurrences) {
        issues.push({
          finding: p.finding,
          file: relative(REPO_ROOT, file),
          expected: p.expectOccurrences,
          found,
        });
      }
    }
  }
  return issues;
}

async function apply() {
  // Group patches by file so we minimise I/O
  const byFile = new Map();
  for (const p of PATCHES) {
    for (const file of p.paths) {
      const list = byFile.get(file) || [];
      list.push({ oldStr: p.oldStr, newStr: p.newStr, finding: p.finding, severity: p.severity });
      byFile.set(file, list);
    }
  }
  let totalApplied = 0;
  for (const [file, patches] of byFile.entries()) {
    let buf = await readFile(file, 'utf8');
    for (const patch of patches) {
      const newBuf = buf.split(patch.oldStr).join(patch.newStr);
      if (newBuf === buf) {
        throw new Error(`No-op patch in ${relative(REPO_ROOT, file)}: ${patch.finding}`);
      }
      buf = newBuf;
      totalApplied++;
      console.log(`  ✓ ${patch.severity.padEnd(8)} ${relative(REPO_ROOT, file)}: ${patch.finding}`);
    }
    await writeFile(file, buf, 'utf8');
  }
  return totalApplied;
}

async function main() {
  console.log('=== Dry-run: verifying all patches find their target text ===');
  const issues = await dryRun();
  if (issues.length > 0) {
    console.error('Pre-flight check FAILED. Aborting before any file is written.');
    for (const i of issues) {
      console.error(`  ❌ ${i.finding}`);
      console.error(`     file: ${i.file}`);
      console.error(`     expected ${i.expected} occurrence(s), found ${i.found}`);
    }
    process.exit(1);
  }
  console.log(`Pre-flight OK: all ${PATCHES.length} patches will apply cleanly across mirrored copies.`);
  console.log('');
  console.log('=== Applying patches ===');
  const n = await apply();
  console.log('');
  console.log(`Applied ${n} string replacements.`);
}

await main();
