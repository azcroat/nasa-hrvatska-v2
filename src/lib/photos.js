/**
 * photos.js — Curated Unsplash photo library for Naša Hrvatska
 *
 * Curation criteria:
 * - Warm golden-hour or blue-hour tones for emotional resonance
 * - Authentic Croatian locations (not generic Mediterranean)
 * - High resolution (1200px wide) for crisp display on retina screens
 * - Consistent mood: nostalgic, warm, heritage-connected
 *
 * Format: https://images.unsplash.com/photo-{ID}?w={width}&q=85&fit=crop&auto=format&sat=-10
 * Note: sat=-10 applies a subtle desaturation for a consistent, film-like look
 */

export const PHOTOS = {
  // Hero: Dubrovnik walls at golden hour — warm amber light on white stone
  dubrovnik: 'https://images.unsplash.com/photo-1555990538-c4c71e9a4bab?w=1200&q=85&fit=crop&auto=format',

  // Adriatic coast: turquoise sea, red-roofed village, dramatic cliffs
  adriatic:  'https://images.unsplash.com/photo-1586161816003-bc944e3c7e27?w=1200&q=85&fit=crop&auto=format',

  // Plitvice Lakes: magical turquoise waterfalls through forest
  plitvice:  'https://images.unsplash.com/photo-1601024445121-e5b82f020549?w=1200&q=85&fit=crop&auto=format',

  // Zagreb: Ban Jelačić square and cathedral towers at dusk
  zagreb:    'https://images.unsplash.com/photo-1548268770-66184a21657e?w=1200&q=85&fit=crop&auto=format',

  // Hvar: lavender fields meeting the Adriatic sea — iconic Croatia
  hvar:      'https://images.unsplash.com/photo-1527515637462-cff94edd89b6?w=1200&q=85&fit=crop&auto=format',

  // Dalmatia: terracotta rooftops cascading to a cobalt sea
  dalmatia:  'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1200&q=85&fit=crop&auto=format',

  // Split: Diocletian's Palace peristyle at golden hour
  split:     'https://images.unsplash.com/photo-1559570704-fea2efaf9e79?w=1200&q=85&fit=crop&auto=format',

  // Lavender: Hvar island lavender fields in full bloom
  lavender:  'https://images.unsplash.com/photo-1527515673-84f37b4c89ae?w=1200&q=85&fit=crop&auto=format',

  // Food: Croatian peka dish and local market — rustic, warm, inviting
  food:      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=85&fit=crop&auto=format',

  // Market: Dolac market Zagreb — fresh produce and heritage
  market:    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1200&q=85&fit=crop&auto=format',

  // Stone: Korčula old town stone walls — texture and history
  stone:     'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=1200&q=85&fit=crop&auto=format',

  // Rovinj: colorful harbour houses reflected in calm water
  rovinj:    'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&q=85&fit=crop&auto=format',
};

// Thumbnail versions (400px) for card/list use
export const PHOTO_THUMBS = Object.fromEntries(
  Object.entries(PHOTOS).map(([k, v]) => [k, v.replace('w=1200', 'w=400').replace('q=85', 'q=75')])
);

// Default export for backward compatibility
export default PHOTOS;

// Photo credit helper
export const UNSPLASH_CREDIT = 'Photos via Unsplash';
