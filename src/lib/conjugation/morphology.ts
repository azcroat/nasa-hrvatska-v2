// src/lib/conjugation/morphology.ts
// Pure derivation of REGULAR Croatian conjugation forms from a verb's class +
// infinitive. Returns null when a form is not regularly derivable (irregular /
// missing presentStem) so the validator falls back to shape-checking only.
import type { ConjVerb, FormType, PastForms } from './types';

const PRES_AM = ['m', 'š', '', 'mo', 'te', 'ju'];
const PRES_IM = ['im', 'iš', 'i', 'imo', 'ite', 'e'];
const PRES_EM = ['em', 'eš', 'e', 'emo', 'ete', 'u'];
const FUT_CLITICS = ['ću', 'ćeš', 'će', 'ćemo', 'ćete', 'će'];
const COND_CLITICS = ['bih', 'bi', 'bi', 'bismo', 'biste', 'bi'];
const PAST_AUX = ['sam', 'si', 'je', 'smo', 'ste', 'su'];

// l-participle stem from a regular infinitive: drop -ti, keep the theme vowel.
// čitati→čita, govoriti→govori, voljeti→volje, pisati→pisa. Returns null for -ći etc.
function participleStem(inf: string): string | null {
  if (inf.endsWith('ti')) return inf.slice(0, -2);
  return null; // -ći and others are irregular → caller flags
}

// Present-tense root for derivable classes.
function presentRoot(verb: ConjVerb): string | null {
  if (verb.klass === 'a-am') return verb.inf.endsWith('ati') ? verb.inf.slice(0, -3) + 'a' : null; // čita
  if (verb.klass === 'i-im') {
    if (verb.inf.endsWith('iti')) return verb.inf.slice(0, -3); // govor
    if (verb.inf.endsWith('jeti')) return verb.inf.slice(0, -4); // vol
    return null;
  }
  if (verb.klass === 'a-em') return verb.presentStem ?? null; // piš
  return null; // irr
}

function present(verb: ConjVerb): string[] | null {
  const root = presentRoot(verb);
  if (root == null) return null;
  if (verb.klass === 'a-am') return PRES_AM.map((e) => root + e);
  if (verb.klass === 'i-im') return PRES_IM.map((e) => root + e);
  if (verb.klass === 'a-em') return PRES_EM.map((e) => root + e);
  return null;
}

function future1(verb: ConjVerb): string[] | null {
  if (!verb.inf.endsWith('ti') && !verb.inf.endsWith('ći')) return null;
  const base = verb.inf.endsWith('ti') ? verb.inf.slice(0, -1) : verb.inf; // čitat / ići
  return FUT_CLITICS.map((c) => `${base} ${c}`);
}

function past(verb: ConjVerb): PastForms | null {
  const stem = participleStem(verb.inf);
  if (stem == null) return null;
  const mk = (sg: string, pl: string) =>
    [0, 1, 2]
      .map((i) => `${stem}${sg} ${PAST_AUX[i]}`)
      .concat([3, 4, 5].map((i) => `${stem}${pl} ${PAST_AUX[i]}`));
  return {
    m: mk('o', 'li'),
    f: mk('la', 'le'),
    n: mk('lo', 'la'),
  };
}

function conditional(verb: ConjVerb): string[] | null {
  const stem = participleStem(verb.inf);
  if (stem == null) return null;
  return COND_CLITICS.map((c, i) => `${stem}${i < 3 ? 'o' : 'li'} ${c}`);
}

function imperative(verb: ConjVerb): string[] | null {
  // [2sg, 1pl, 2pl] from the present root.
  const root = presentRoot(verb);
  if (root == null) return null;
  if (verb.klass === 'a-am') return [root + 'j', root + 'jmo', root + 'jte']; // čitaj
  // i-im and a-em → root + i / imo / ite (govori, piši)
  return [root + 'i', root + 'imo', root + 'ite'];
}

export function expectedForms(verb: ConjVerb, formType: FormType): string[] | PastForms | null {
  if (verb.irregular) return null;
  switch (formType) {
    case 'present':
      return present(verb);
    case 'future1':
      return future1(verb);
    case 'past':
      return past(verb);
    case 'conditional':
      return conditional(verb);
    case 'imperative':
      return imperative(verb);
    default:
      return null;
  }
}
