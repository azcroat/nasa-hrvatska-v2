// scripts/generate-regular-forms.mjs
// Dev aid (NOT runtime): given verb metadata stubs, print regular forms to paste
// into VERBS. Forms remain explicitly stored; the morphology test re-derives to confirm.
// Usage:
//   npx tsx scripts/generate-regular-forms.mjs '[{"inf":"kuhati","en":"to cook","klass":"a-am","aspect":"impf","pair":"skuhati","cefr":"A1","forms":["present","past","future1"]}]'
import { expectedForms } from '../src/lib/conjugation/morphology.ts';

const stubs = JSON.parse(process.argv[2] || '[]');
for (const s of stubs) {
  const v = { irregular: false, pair: null, ...s };
  const out = {
    inf: v.inf,
    en: v.en,
    aspect: v.aspect,
    pair: v.pair,
    klass: v.klass,
    cefr: v.cefr,
    irregular: false,
  };
  if (v.presentStem) out.presentStem = v.presentStem;
  for (const ft of v.forms || ['present']) {
    const f = expectedForms(v, ft);
    if (f == null) {
      console.error(`! ${v.inf}.${ft}: not derivable — author by hand + flag`);
      continue;
    }
    out[ft] = f;
  }
  console.log(JSON.stringify(out, null, 2) + ',');
}
