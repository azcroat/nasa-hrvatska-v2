/**
 * Memory hooks — etymological connections and mnemonics for Croatian words.
 * Helps English speakers remember vocabulary by connecting to familiar roots.
 * Keys are the Croatian word (lowercase, no diacritics for easy lookup).
 */
const MEMORY_HOOKS = {
  // Body & health
  'glava':    '💡 Like "glave" — imagine a head glowing',
  'ruka':     '💡 "Ruka" sounds like "ruler" — a tool you hold in your hand',
  'noga':     '💡 "Noga" → "no go" without legs!',
  'oko':      '💡 Short like eyes — two letters, two eyes 👁️',
  'uho':      '💡 "Uho" rhymes with "you-ho!" — what you shout to be heard',
  'nos':      '💡 "Nos" sounds like English "nose" — same root!',
  'srce':     '💡 "Srce" (heart) has the same Slavic root as "cardiac"',
  'zub':      '💡 "Zub" → "sub" — a tooth can sink a ship',
  // Food & drink
  'kruh':     '💡 "Kruh" (bread) → like "crude" — simple, basic food',
  'voda':     '💡 "Voda" → "vodka" is just water with a kick!',
  'mlijeko':  '💡 "Mlijeko" (milk) shares root with Latin "lac" → dairy',
  'kava':     '💡 "Kava" sounds like "java" — coffee by any name!',
  'vino':     '💡 "Vino" = wine — same root as French "vin", Latin "vinum"',
  'pivo':     '💡 "Pivo" = beer — "pivo" sounds like "pivot" on a barstool',
  'sol':      '💡 "Sol" = salt — same root as "salary" (Roman soldiers paid in salt)',
  'med':      '💡 "Med" = honey — same root as "mead" (honey wine)',
  'jabuka':   '💡 "Jabuka" (apple) → think "yakuza" who likes apples',
  // Time
  'danas':    '💡 "Danas" (today) → "this day" — dan = day',
  'sutra':    '💡 "Sutra" (tomorrow) sounds like "suture" — healing takes a day',
  'jucer':    '💡 "Jučer" (yesterday) — "you-chair" sat here yesterday',
  'jutro':    '💡 "Jutro" (morning) — "Jupiter" rises in the morning',
  'vecer':    '💡 "Večer" (evening) → Latin "vesper" → evening star Venus',
  // People
  'covjek':   '💡 "Čovjek" (person/man) → Slavic cousin of Czech "člověk"',
  'prijatelj': '💡 "Prijatelj" (friend) — contains "prija" (to agree/suit)',
  'baka':     '💡 "Baka" (grandma) — sweet and short, like baking cookies',
  'djed':     '💡 "Djed" (grandpa) — sounds like "dead" but full of life!',
  // Places & movement
  'grad':     '💡 "Grad" (city) → same root as "grade" — built up',
  'more':     '💡 "More" (sea) → Latin "mare" → English "marine"',
  'put':      '💡 "Put" (road/way) → you "put" yourself on the path',
  'kuca':     '💡 "Kuća" (house) → sounds like "cozy" — your cozy home',
  // Verbs
  'ici':      '💡 "Ići" (to go) → "ee-chee" — where shall I go?',
  'biti':     '💡 "Biti" (to be) → "beat" of existence',
  'imati':    '💡 "Imati" (to have) → "I matter" — because you have it!',
  'znati':    '💡 "Znati" (to know) → sounds like "gnostic" — knowing',
  'htjeti':   '💡 "Htjeti" (to want) → "hate it when you want things!"',
  'vidjeti':  '💡 "Vidjeti" (to see) → Latin "video" — to see',
  'govoriti': '💡 "Govoriti" (to speak) → "govern" with words',
  'pisati':   '💡 "Pisati" (to write) — Slavic root, think "epistles"',
  'citati':   '💡 "Čitati" (to read) → sounds like "cheat-ati" — no cheating!',
  'jesti':    '💡 "Jesti" (to eat) → "feast-i" — a mini feast',
  'piti':     '💡 "Piti" (to drink) → "pity" you\'re thirsty',
  // Common adjectives
  'velik':    '💡 "Velik" (big) → "velocity" — big speed',
  'mali':     '💡 "Mali" (small) → "ma li\'" — small nickname',
  'lijep':    '💡 "Lijep" (beautiful) → "leap" of joy at beauty',
  'star':     '💡 "Star" (old) → same root! Stars are ancient',
  'nov':      '💡 "Nov" (new) → "nova" star — something new and bright',
  'dobar':    '💡 "Dobar" (good) → sounds like "dober" (German gut/good)',
  'los':      '💡 "Loš" (bad) → "loss" — a bad outcome',
  // Colors
  'crvena':   '💡 "Crvena" (red) → from "crv" (worm) — red like cochineal dye',
  'plava':    '💡 "Plava" (blue) → "plava" sounds like flowing "play-va"',
  'zelena':   '💡 "Zelena" (green) → "zeal" + "ena" — green with enthusiasm',
  'bijela':   '💡 "Bijela" (white) → "bi-ela" — bright and dual',
  'crna':     '💡 "Crna" (black) → "churn-a" — dark churning clouds',
};

/**
 * Get memory hook for a Croatian word.
 * Normalizes diacritics for lookup.
 * @param {string} hrWord - Croatian word
 * @returns {string|null} Memory hook or null if not available
 */
export function getMemoryHook(hrWord) {
  if (!hrWord) return null;
  const key = hrWord.toLowerCase()
    .replace(/[čć]/g, 'c')
    .replace(/š/g, 's')
    .replace(/ž/g, 'z')
    .replace(/đ/g, 'd')
    .split(/[,\/\s]/)[0]  // take first word if compound
    .replace(/[^a-z]/g, '');
  return MEMORY_HOOKS[key] || null;
}
