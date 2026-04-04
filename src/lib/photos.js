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
  dubrovnik:    '/images/scenes/dubrovnik-hero.webp',
  adriatic:     '/images/scenes/dalmatian-coast.webp',
  plitvice:     '/images/scenes/plitvice.webp',
  zagreb:       '/images/scenes/zagreb.webp',
  dubrovnik_ai: '/images/scenes/dubrovnik-ai.webp',
  adriatic_ai:  '/images/scenes/dalmatian-ai.webp',
  food:         '/images/scenes/croatian-food.webp',  // AI-generated Croatian food table
  mostar:       '/images/scenes/mostar.webp',           // CC BY-SA 4.0 © Ramirez HUN via Wikimedia Commons — Mostar panorama
  labin:        '/images/scenes/labin.webp',            // CC BY-SA 3.0 © Bjoertvedt via Wikimedia Commons
  rabac:        '/images/scenes/rabac.webp',            // CC BY-SA 3.0 © Czeva via Wikimedia Commons
  bibinje:      '/images/scenes/bibinje.webp',          // CC BY-SA 3.0 © Voilierprovencal via Wikimedia Commons
};

export const PHOTOS = {
  // Hero: Dubrovnik — SDXL AI cinematic render (golden hour, 8K quality)
  dubrovnik: '/images/scenes/dubrovnik-ai.webp',

  // Adriatic coast: SDXL AI cinematic Dalmatian coast panorama
  adriatic:  '/images/scenes/dalmatian-ai.webp',

  // Plitvice Lakes: UNESCO waterfall cascade — local CC photo
  plitvice:  '/images/scenes/plitvice.webp',

  // Zagreb: cathedral + city — local CC photo
  zagreb:    '/images/scenes/zagreb.webp',

  // Hvar: lavender fields meeting the Adriatic sea — iconic Croatia
  hvar:      'https://images.unsplash.com/photo-1527515637462-cff94edd89b6?w=1200&q=85&fit=crop&auto=format',

  // Dalmatia: terracotta rooftops cascading to a cobalt sea
  dalmatia:  'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1200&q=85&fit=crop&auto=format',

  // Split: Diocletian's Palace peristyle at golden hour
  split:     'https://images.unsplash.com/photo-1559570704-fea2efaf9e79?w=1200&q=85&fit=crop&auto=format',

  // Lavender: Hvar island lavender fields in full bloom
  lavender:  'https://images.unsplash.com/photo-1527515673-84f37b4c89ae?w=1200&q=85&fit=crop&auto=format',

  // Food: AI-generated Croatian food table (peka, prstaci, burek) — local, no CDN dependency
  food:      '/images/scenes/croatian-food.webp',

  // Market: Zagreb city scene (local verified image)
  market:    '/images/scenes/zagreb.webp',

  // Stone: Korčula old town stone walls — texture and history
  stone:     'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=1200&q=85&fit=crop&auto=format',

  // Rovinj: colorful harbour houses reflected in calm water
  rovinj:    'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&q=85&fit=crop&auto=format',

  // Mostar: CC BY-SA 4.0 panorama of Stari Most (Old Bridge) area © Ramirez HUN, Wikimedia Commons
  mostar:    '/images/scenes/mostar.webp',

  // Labin: CC BY-SA 3.0 © Bjoertvedt, Wikimedia Commons
  labin:     '/images/scenes/labin.webp',

  // Rabac: CC BY-SA 3.0 aerial view of Rabac harbour © Czeva, Wikimedia Commons
  rabac:     '/images/scenes/rabac.webp',

  // Bibinje: CC BY-SA 3.0 marina view of Bibinje © Voilierprovencal, Wikimedia Commons
  bibinje:   '/images/scenes/bibinje.webp',

  // Vinkovci: CC BY 3.0 © Ivvon Tomek via Wikimedia Commons
  vinkovci:  '/images/scenes/vinkovci.webp',
};

// Thumbnail versions — local paths serve the same file (browser caches it)
export const PHOTO_THUMBS = PHOTOS;

// Default export for backward compatibility
export default PHOTOS;

// Photo credit helper
export const UNSPLASH_CREDIT = 'Photos via Unsplash';

export const PHOTO_CREDITS = {
  labin:   'Photo © Bjoertvedt, CC BY-SA 3.0, via Wikimedia Commons',
  rabac:   'Photo © Czeva, CC BY-SA 3.0, via Wikimedia Commons',
  mostar:  'Photo © Ramirez HUN, CC BY-SA 4.0, via Wikimedia Commons',
  bibinje: 'Photo © Voilierprovencal, CC BY-SA 3.0, via Wikimedia Commons',
  vinkovci: 'Photo © Ivvon Tomek, CC BY 3.0, via Wikimedia Commons',
};
