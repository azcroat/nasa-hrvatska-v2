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

// ── Locally committed CC/AI photos (always available, no CDN dependency) ────
// Generated/sourced by scripts/generate-portraits.mjs + Wikipedia Commons
export const LOCAL_PHOTOS = {
  dubrovnik:    '/images/scenes/dubrovnik-hero.jpg',
  adriatic:     '/images/scenes/dalmatian-coast.jpg',
  plitvice:     '/images/scenes/plitvice.jpg',
  zagreb:       '/images/scenes/zagreb.jpg',
  dubrovnik_ai: '/images/scenes/dubrovnik-ai.jpg',   // SDXL ultra-cinematic (when generated)
  adriatic_ai:  '/images/scenes/dalmatian-ai.jpg',   // SDXL ultra-cinematic (when generated)
};

export const PHOTOS = {
  // Hero: Dubrovnik — SDXL AI cinematic render (golden hour, 8K quality)
  dubrovnik: '/images/scenes/dubrovnik-ai.jpg',

  // Adriatic coast: SDXL AI cinematic Dalmatian coast panorama
  adriatic:  '/images/scenes/dalmatian-ai.jpg',

  // Plitvice Lakes: UNESCO waterfall cascade — local CC photo
  plitvice:  '/images/scenes/plitvice.jpg',

  // Zagreb: cathedral + city — local CC photo
  zagreb:    '/images/scenes/zagreb.jpg',

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

// Thumbnail versions — local paths serve the same file (browser caches it)
export const PHOTO_THUMBS = PHOTOS;

// Default export for backward compatibility
export default PHOTOS;

// Photo credit helper
export const UNSPLASH_CREDIT = 'Photos via Unsplash';
