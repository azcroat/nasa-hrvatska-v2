import type { CharacterName } from '../family/portraits';

export type PlaceId = 'kavana' | 'trznica' | 'soba' | 'kuhinja' | 'ulica' | 'trg';
export type BucketId = PlaceId | 'today';

export interface Place {
  id: PlaceId;
  name: string; // Croatian
  nameEn: string; // English subtitle
  host: CharacterName | null; // null for trg (the town)
  icon: string;
  blurb: string;
  tint: string; // rgba disc/marker tint
  mapPos: { x: number; y: number }; // % position on the Karta
  subgroups?: { key: string; label: string }[];
}

export const PLACES: Place[] = [
  {
    id: 'kavana',
    name: 'Anina kavana',
    nameEn: "Ana's café",
    host: 'ana',
    icon: '☕',
    blurb: 'Naruči, razgovaraj, snađi se',
    tint: 'rgba(14,116,144,.12)',
    mapPos: { x: 62, y: 54 },
  },
  {
    id: 'trznica',
    name: 'Markova tržnica',
    nameEn: "Marko's market",
    host: 'marko',
    icon: '🐟',
    blurb: 'Riječi za svaki dan',
    tint: 'rgba(5,150,105,.12)',
    mapPos: { x: 33, y: 66 },
  },
  {
    id: 'soba',
    name: 'Kovačeva soba',
    nameEn: "Kovač's study",
    host: 'kovac',
    icon: '📚',
    blurb: 'Gramatika i izgovor',
    tint: 'rgba(124,58,237,.12)',
    mapPos: { x: 49, y: 30 },
    subgroups: [
      { key: 'padezi', label: 'Padeži' },
      { key: 'glagoli', label: 'Glagoli' },
      { key: 'recenice', label: 'Rečenice' },
      { key: 'izgovor', label: 'Izgovor' },
    ],
  },
  {
    id: 'kuhinja',
    name: 'Bakina kuhinja',
    nameEn: "Baka's kitchen",
    host: 'baka',
    icon: '🍲',
    blurb: 'Priče, zagonetke, brzalice',
    tint: 'rgba(194,65,12,.12)',
    mapPos: { x: 80, y: 40 },
  },
  {
    id: 'ulica',
    name: 'Ivina ulica',
    nameEn: "Ivo's street",
    host: 'ivo',
    icon: '🚕',
    blurb: 'Ulični govor i snalaženje',
    tint: 'rgba(37,99,235,.12)',
    mapPos: { x: 84, y: 62 },
    subgroups: [
      { key: 'snalazenje', label: 'Snalaženje' },
      { key: 'svakodnevni', label: 'Svakodnevni sleng' },
      { key: 'regionalni', label: 'Regionalni' },
      { key: 'kultura', label: 'Kultura' },
    ],
  },
  {
    id: 'trg',
    name: 'Trg',
    nameEn: 'The Square',
    host: null,
    icon: '🎪',
    blurb: 'Alka, brze igre, izazovi',
    tint: 'rgba(212,0,48,.10)',
    mapPos: { x: 30, y: 46 },
  },
];

export interface ExtraItem {
  id: string;
  label: string;
  icon: string;
  place: PlaceId;
  cefr: string;
  kind: 'quiz' | 'flash' | 'match' | 'listen' | 'speaking' | 'scr';
  scr?: string; // for kind 'scr'
}

// Non-catalog launches. quiz/flash/match/listen/speaking use the props GradTab
// receives; 'scr' uses setScr(scr).
export const GRAD_EXTRAS: ExtraItem[] = [
  { id: 'quiz', label: 'Kviz', icon: '❓', place: 'trznica', cefr: 'A1+', kind: 'quiz' },
  { id: 'flash', label: 'Kartice', icon: '🃏', place: 'trznica', cefr: 'A1+', kind: 'flash' },
  { id: 'match', label: 'Spoji parove', icon: '🔗', place: 'trznica', cefr: 'A1+', kind: 'match' },
  { id: 'speaking', label: 'Govori', icon: '🗣️', place: 'kavana', cefr: 'A1+', kind: 'speaking' },
  { id: 'listening', label: 'Slušanje', icon: '👂', place: 'trg', cefr: 'A1+', kind: 'listen' },
  {
    id: 'typing',
    label: 'Tipkanje',
    icon: '⌨️',
    place: 'trg',
    cefr: 'A1+',
    kind: 'scr',
    scr: 'typing',
  },
  {
    id: 'wordsprint',
    label: 'Brzina riječi',
    icon: '⚡',
    place: 'trg',
    cefr: 'A1+',
    kind: 'scr',
    scr: 'wordsprint',
  },
  {
    id: 'arcade',
    label: 'Arkada · Alka',
    icon: '🎪',
    place: 'trg',
    cefr: 'A1+',
    kind: 'scr',
    scr: 'arcade',
  },
];

// Authoritative exercise -> bucket map (catalog ids). See the design spec section 1.
export const PLACE_ASSIGNMENTS: Record<string, { place: BucketId; subgroup?: string }> = {
  // kavana
  restaurant: { place: 'kavana' },
  convmatch: { place: 'kavana' },
  scenes: { place: 'kavana' },
  dialogue: { place: 'kavana' },
  // trznica
  znam: { place: 'trznica' },
  possess: { place: 'trznica' },
  opposites: { place: 'trznica' },
  ordinals: { place: 'trznica' },
  emogender: { place: 'trznica' },
  verbdrill: { place: 'trznica' },
  pronouns: { place: 'trznica' },
  collocations: { place: 'trznica' },
  wordfamilies: { place: 'trznica' },
  numtime: { place: 'trznica' },
  // soba / padezi
  grammarmap: { place: 'soba', subgroup: 'padezi' },
  prepdrill: { place: 'soba', subgroup: 'padezi' },
  genderdrill: { place: 'soba', subgroup: 'padezi' },
  profgender: { place: 'soba', subgroup: 'padezi' },
  sibil: { place: 'soba', subgroup: 'padezi' },
  accusativedrill: { place: 'soba', subgroup: 'padezi' },
  numcases: { place: 'soba', subgroup: 'padezi' },
  neggen: { place: 'soba', subgroup: 'padezi' },
  animateacc: { place: 'soba', subgroup: 'padezi' },
  instrumental: { place: 'soba', subgroup: 'padezi' },
  dative: { place: 'soba', subgroup: 'padezi' },
  // soba / glagoli
  future: { place: 'soba', subgroup: 'glagoli' },
  reflexive: { place: 'soba', subgroup: 'glagoli' },
  imperative: { place: 'soba', subgroup: 'glagoli' },
  passive: { place: 'soba', subgroup: 'glagoli' },
  fleetinga: { place: 'soba', subgroup: 'glagoli' },
  conjlab: { place: 'soba', subgroup: 'glagoli' },
  aspectdrill: { place: 'soba', subgroup: 'glagoli' },
  tenseflip: { place: 'soba', subgroup: 'glagoli' },
  // soba / recenice
  cloze: { place: 'soba', subgroup: 'recenice' },
  unjumble: { place: 'soba', subgroup: 'recenice' },
  qwords: { place: 'soba', subgroup: 'recenice' },
  negation: { place: 'soba', subgroup: 'recenice' },
  comparatives: { place: 'soba', subgroup: 'recenice' },
  coloragree: { place: 'soba', subgroup: 'recenice' },
  relpron: { place: 'soba', subgroup: 'recenice' },
  sentbuild: { place: 'soba', subgroup: 'recenice' },
  sentencetiles: { place: 'soba', subgroup: 'recenice' },
  clitic: { place: 'soba', subgroup: 'recenice' },
  translate_drills: { place: 'soba', subgroup: 'recenice' },
  production_drill: { place: 'soba', subgroup: 'recenice' },
  // soba / izgovor
  pitchaccent: { place: 'soba', subgroup: 'izgovor' },
  shadowing: { place: 'soba', subgroup: 'izgovor' },
  dictation: { place: 'soba', subgroup: 'izgovor' },
  proncontrast: { place: 'soba', subgroup: 'izgovor' },
  pronunciation_assess: { place: 'soba', subgroup: 'izgovor' },
  // kuhinja
  storyselect: { place: 'kuhinja' },
  fillstory: { place: 'kuhinja' },
  riddles: { place: 'kuhinja' },
  logicquiz: { place: 'kuhinja' },
  brzalice: { place: 'kuhinja' },
  // ulica
  cityloc: { place: 'ulica', subgroup: 'snalazenje' },
  slang_everyday: { place: 'ulica', subgroup: 'svakodnevni' },
  slang_slang: { place: 'ulica', subgroup: 'svakodnevni' },
  slang_genz: { place: 'ulica', subgroup: 'svakodnevni' },
  slang_football: { place: 'ulica', subgroup: 'svakodnevni' },
  slang_dalmatian: { place: 'ulica', subgroup: 'regionalni' },
  slang_zagreb: { place: 'ulica', subgroup: 'regionalni' },
  slang_regional: { place: 'ulica', subgroup: 'regionalni' },
  slang_satrovski: { place: 'ulica', subgroup: 'regionalni' },
  slang_classics: { place: 'ulica', subgroup: 'kultura' },
  slang_people: { place: 'ulica', subgroup: 'kultura' },
  slang_pijani: { place: 'ulica', subgroup: 'kultura' },
  slang_art: { place: 'ulica', subgroup: 'kultura' },
  // today (adaptive bucket — surfaced by the Today card, not a map place)
  srsreview: { place: 'today' },
  adaptive_review: { place: 'today' },
  cefrtest: { place: 'today' },
};
