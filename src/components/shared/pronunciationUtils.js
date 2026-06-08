// ── Croatian phoneme guides — IPA, English approx, articulation, example ──────
export const PHONEME_GUIDES = {
  ć: {
    ipa: '/tɕ/',
    approx: 'Like "ch" in "cheer" but softer — palatal affricate',
    articulate:
      'Tongue tip rests behind lower teeth. Blade of tongue touches the hard palate just behind the gum ridge. Lips slightly spread.',
    example: 'ćevap, noć, peć',
    contrast: 'Softer than č — tongue is further back, lips spread not pursed',
    lips: 'spread',
    tongue: 'palatal',
  },
  č: {
    ipa: '/tʃ/',
    approx: 'Like "ch" in "church" — alveo-palatal affricate',
    articulate:
      'Tongue tip curls slightly up toward the ridge behind upper teeth. Lips rounded/neutral. Harder, more forward than ć.',
    example: 'čaj, čovjek, noć',
    contrast: 'Harder than ć — tongue tip is forward, lips more rounded',
    lips: 'neutral',
    tongue: 'alveolar',
  },
  š: {
    ipa: '/ʃ/',
    approx: 'Like "sh" in "shoe" — alveo-palatal fricative',
    articulate:
      'Tongue raised toward the ridge behind upper teeth but not touching. Air flows over the tongue with friction. Lips slightly rounded.',
    example: 'šuma, škola, miš',
    contrast: 'Voiceless partner of ž',
    lips: 'rounded',
    tongue: 'alveolar-raised',
  },
  ž: {
    ipa: '/ʒ/',
    approx: 'Like "s" in "measure" or French "j" in "jour" — voiced fricative',
    articulate:
      'Same position as š but with vocal cords vibrating. Tongue raised near the ridge, air flows with friction.',
    example: 'žena, život, već',
    contrast: 'Voiced partner of š — add vibration to your throat',
    lips: 'rounded',
    tongue: 'alveolar-raised',
  },
  đ: {
    ipa: '/dʑ/',
    approx: 'Like "j" in "judge" but softer — voiced palatal affricate',
    articulate:
      'Voiced version of ć. Tongue blade touches hard palate, lips spread. Start with a "d" then release into the soft ć sound.',
    example: 'đak, đon, nađi',
    contrast: 'Voiced ć — same position but with vocal cords on',
    lips: 'spread',
    tongue: 'palatal',
  },
  lj: {
    ipa: '/ʎ/',
    approx: 'Like "lli" in "million" as one sound — palatal lateral',
    articulate:
      'Tongue body presses against the hard palate. Do not separate the l and j — it is one single liquid sound, not two.',
    example: 'ljubav, ljeto, polje',
    contrast: 'One sound, not "l" + "j" — the tongue is flat against the palate',
    lips: 'neutral',
    tongue: 'flat-palatal',
  },
  nj: {
    ipa: '/ɲ/',
    approx: 'Like "ñ" in Spanish "mañana" — palatal nasal',
    articulate:
      'Tongue body presses against the hard palate while air flows through the nose. One nasal sound, not "n" + "j".',
    example: 'njega, knjiga, konj',
    contrast: 'One nasal sound — tongue to palate, air through nose',
    lips: 'neutral',
    tongue: 'flat-palatal',
  },
  r: {
    ipa: '/r̩/ (syllabic) or /r/',
    approx: 'Rolled/trilled "r" — alveolar trill',
    articulate:
      'Tongue tip vibrates against the ridge just behind the upper front teeth. Relax the tongue completely, then let air flutter the tip. Can be syllabic in words like "krk", "trg", "vrh".',
    example: 'ruka, more, srce, krk',
    contrast: 'Not the English "r" — tongue tip must vibrate, not curl back',
    lips: 'neutral',
    tongue: 'tip-alveolar',
  },
};

// ── Croatian phoneme hints shown when a specific phoneme scores poorly ─────────
export const PHONEME_HINTS = {
  ć: 'Like English "ch" but softer — place tongue behind upper teeth',
  č: 'Like English "ch" in "church" — harder than ć',
  š: 'Like English "sh" in "shoe"',
  ž: 'Like French "j" in "jour" or English "s" in "measure"',
  đ: 'Like English "j" in "judge" but softer — voiced ć',
  lj: 'Like Spanish "ll" in "llama" — one liquid sound',
  nj: 'Like Spanish "ñ" in "mañana"',
  r: 'Rolled "r" — vibrate the tongue tip against the ridge behind upper teeth',
};

// Score threshold colours used throughout both modes
export function scoreColor(s) {
  if (s >= 90) return '#16a34a';
  if (s >= 70) return '#d97706';
  return '#dc2626';
}

export function scoreEmoji(s) {
  if (s >= 90) return '🟢';
  if (s >= 70) return '🟡';
  return '🔴';
}

export function scoreLabel(s) {
  if (s >= 90) return 'Excellent!';
  if (s >= 70) return 'Good!';
  if (s >= 50) return 'Keep practicing';
  return 'Try again';
}
