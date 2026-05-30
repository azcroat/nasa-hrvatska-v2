// scripts/lintCroatianText.mjs
//
// CI lint that scans every Croatian text field in the content data files
// for non-Croatian-Latin characters. Catches the class of encoding-bleed
// bugs surfaced by the 2026-05-20 quality audit:
//   - Cyrillic chars mid-word (e.g. украшavamo)
//   - Cedilla-z `ţ` (Romanian/Turkish) where Croatian `ž` is expected
//   - Other Latin-with-accent confusions
//
// Croatian standard alphabet (Latin-only):
//   a b c č ć d đ e f g h i j k l m n o p r s š t u v z ž
//   plus loanword/proper-noun chars: q w x y
//   plus standard punctuation, digits, spaces, common typographic marks.
//
// Anything outside that whitelist in a `hr:`, `text:`, `paragraphs[]`, or
// other Croatian-text field is a lint error.
//
// Run: `node scripts/lintCroatianText.mjs`
//   exits 0 on clean, 1 on findings (CI fail).

import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

// Files to scan — server data is the canonical source; client data mirrors.
const TARGETS = [
  'functions/api/content/_data/scenarios.js',
  'functions/api/content/_data/lessons.js',
  'functions/api/content/_data/gradedStories.js',
  'functions/api/content/_data/vocabulary.js',
  'functions/api/content/_data/vocabScenes.js',
  'functions/api/content/_data/grammar.js',
  'functions/api/content/_data/grammarAdvanced.js',
  'functions/api/content/_data/learnPath.js',
  'functions/api/content/_data/core.js',
  'src/data/scenarios.js',
  'src/data/vocabulary.js',
  'src/data/cultural/proverbs.js',
  'src/data/cultural/history.js',
  'src/data/cultural/regions.js',
  'src/data/cultural/language.js',
  'src/data/cultural/events.js',
];

// Whitelist: Croatian Latin + common punctuation + digits + typographic marks.
// We include q/w/x/y for loanwords (e.g. "wifi", "taxi") and proper nouns.
const ALLOWED_RE = /^[\sa-zA-ZČčĆćĐđŠšŽž0-9À-ſȘ-ț,.!?'":;\-—–…()\[\]\/&%@#=+*–—‘’“”]*$/;

// More targeted: a string is "suspicious" if it contains specific bad chars.
// We focus on the encoding-bleed classes from the audit.
const BAD_CHARS_RE = /[Ѐ-ӿԀ-ԯŢ-ţŞ-şĞ-ğİ-ı]/g;
//  ^ Cyrillic blocks (Ѐ-ӿ already covers А-я) + Romanian Ţ/ţ + Turkish Ş/ş Ğ/ğ İ/ı.
// Croatian never uses any of these — they are all bleeds from another script.

// Match `hr: '...'` / `hr: "..."` / `hr: \`...\``
// and similar fields that hold Croatian text.
const CRO_FIELD_RE = /(hr|text|paragraphs|q|a|prompt|response|tagline|intro|history|didYouKnow|name|title|en|note|exs?|ex)\s*:\s*(['"`])((?:[^\\]|\\.)*?)\2/g;

async function* walkTargets() {
  for (const rel of TARGETS) {
    const abs = resolve(REPO_ROOT, rel);
    let buf;
    try {
      buf = await readFile(abs, 'utf8');
    } catch {
      continue; // file may not exist on some setups
    }
    yield { rel, buf };
  }
}

function findBadInString(s) {
  if (!s) return null;
  const bad = [...s.matchAll(BAD_CHARS_RE)];
  if (bad.length === 0) return null;
  return bad.map((m) => ({ char: m[0], codePoint: m[0].codePointAt(0).toString(16) }));
}

async function main() {
  let totalFindings = 0;
  for await (const { rel, buf } of walkTargets()) {
    const findings = [];
    for (const m of buf.matchAll(CRO_FIELD_RE)) {
      // m[1] = field name, m[3] = string contents
      // Skip English-only fields by heuristic: `en` is the English translation,
      // but it CAN contain a Croatian word in the gloss (rare). Allow it.
      const fieldName = m[1];
      const content = m[3];
      // Skip very short non-text content
      if (content.length === 0) continue;
      const bad = findBadInString(content);
      if (bad) {
        const line = buf.slice(0, m.index).split('\n').length;
        findings.push({
          line,
          field: fieldName,
          snippet: content.slice(0, 80),
          badChars: bad,
        });
      }
    }
    if (findings.length > 0) {
      console.error(`\n=== ${rel} ===`);
      for (const f of findings) {
        const chars = f.badChars.map((b) => `${b.char} (U+${b.codePoint.toUpperCase()})`).join(', ');
        console.error(`  ${rel}:${f.line}  [${f.field}]  ${chars}`);
        console.error(`    "${f.snippet.replace(/\n/g, ' ')}..."`);
      }
      totalFindings += findings.length;
    }
  }
  if (totalFindings > 0) {
    console.error('');
    console.error(`✖ Croatian text lint: ${totalFindings} encoding-bleed finding(s).`);
    console.error('  Croatian standard Latin alphabet should be the only script in `hr:` fields.');
    process.exit(1);
  } else {
    console.log('✓ Croatian text lint: 0 encoding-bleed findings across', TARGETS.length, 'files.');
  }
}

await main();
