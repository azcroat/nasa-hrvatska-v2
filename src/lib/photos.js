/**
 * Croatian photography for the Naša Hrvatska app
 * All photos are from Unsplash (free to use, credit appreciated)
 * Format: https://images.unsplash.com/photo-{ID}?w={width}&q=80&fit=crop
 *
 * IDs verified via Unsplash search — March 2026
 */
export const PHOTOS = {
  // Landscapes
  dubrovnik: 'https://images.unsplash.com/photo-1555990538-c4c71e9a4bab?w=800&q=80&fit=crop',   // Dubrovnik old town aerial sunset
  adriatic:  'https://images.unsplash.com/photo-1560703650-ef3e0f254ae0?w=800&q=80&fit=crop',   // Dubrovnik sits on the Adriatic
  plitvice:  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&fit=crop', // Plitvice Lakes waterfall
  zagreb:    'https://images.unsplash.com/photo-1564594736694-d73f80c4a7fe?w=800&q=80&fit=crop', // Zagreb city aerial
  hvar:      'https://images.unsplash.com/photo-1548871022-20024d7b2e44?w=800&q=80&fit=crop',   // Hvar island aerial
  dalmatia:  'https://images.unsplash.com/photo-1559570704-fea2efaf9e79?w=800&q=80&fit=crop',   // Dalmatian coast brown rooftops

  // Culture & nature
  lavender:  'https://images.unsplash.com/photo-1527515673-84f37b4c89ae?w=800&q=80&fit=crop',   // Lavender field (Hvar/Croatia)
  food:      'https://images.unsplash.com/photo-1565299543923-37dd37887442?w=800&q=80&fit=crop', // Croatian traditional food
  market:    'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&q=80&fit=crop', // Croatian market / Split

  // Abstract/texture
  stone:     'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&fit=crop',   // Stone texture

  // Thumbnails (smaller, lower quality for cards)
  thumb: {
    dubrovnik: 'https://images.unsplash.com/photo-1555990538-c4c71e9a4bab?w=400&q=70&fit=crop',
    adriatic:  'https://images.unsplash.com/photo-1560703650-ef3e0f254ae0?w=400&q=70&fit=crop',
    plitvice:  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=70&fit=crop',
    hvar:      'https://images.unsplash.com/photo-1548871022-20024d7b2e44?w=400&q=70&fit=crop',
    zagreb:    'https://images.unsplash.com/photo-1564594736694-d73f80c4a7fe?w=400&q=70&fit=crop',
  },
};

// Photo credit helper
export const UNSPLASH_CREDIT = 'Photos via Unsplash';
