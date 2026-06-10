// src/lib/conjugation/types.ts
// Canonical, explicitly-stored verb conjugation data. No runtime form generation:
// every cell is authored so nothing displayed is ever wrong.

export type Aspect = 'impf' | 'pf' | 'bi'; // imperfective | perfective | biaspectual
// Present-tense class teaching labels:
//  'a-am' = -ati → -am (čitati→čitam); 'a-em' = e-present (pisati→pišem, ići→idem);
//  'i-im' = -iti/-jeti → -im (govoriti→govorim); 'irr' = irregular (biti, htjeti).
export type PresentClass = 'a-am' | 'a-em' | 'i-im' | 'irr';

export type FormType = 'present' | 'past' | 'future1' | 'imperative' | 'conditional';
export type Gender = 'm' | 'f' | 'n';

export interface PastForms {
  m: string[]; // 6 forms: ja, ti, on, mi, vi, oni  (e.g. 'pisao sam' … 'pisali su')
  f: string[]; // 6 forms (feminine subject)
  n: string[]; // 6 forms (neuter / mixed-neuter plural)
}

export interface ConjVerb {
  inf: string; // 'pisati'
  en: string; // 'to write'
  aspect: Aspect;
  pair: string | null; // aspect partner infinitive, e.g. 'napisati'; null if none
  klass: PresentClass;
  cefr: 'A1' | 'A2' | 'B1' | 'B2';
  irregular: boolean;
  note?: string;
  present?: string[]; // 6
  past?: PastForms;
  future1?: string[]; // 6
  imperative?: string[]; // 3: [2sg, 1pl, 2pl]
  conditional?: string[]; // 6 (masculine baseline; gender handled by note + past data)
}

// A single drillable unit of conjugation.
export interface ConjCell {
  inf: string;
  formType: FormType;
  personIdx: number; // 0..5 for present/past/future1/conditional; 0..2 for imperative
  gender?: Gender; // present only on past/conditional
}

export const PERSONS_6 = ['ja', 'ti', 'on/ona', 'mi', 'vi', 'oni/one'] as const;
export const PERSONS_IMP = ['ti', 'mi', 'vi'] as const; // imperative addressees
