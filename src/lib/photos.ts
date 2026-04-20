/**
 * photos.ts — Curated Unsplash photo library for Naša Hrvatska
 */

export const LOCAL_PHOTOS: Record<string, string> = {
  dubrovnik: '/images/scenes/dubrovnik-hero.webp',
  adriatic: '/images/scenes/dalmatian-coast.webp',
  plitvice: '/images/scenes/plitvice.webp',
  zagreb: '/images/scenes/zagreb.webp',
  dubrovnik_ai: '/images/scenes/dubrovnik-ai.webp',
  adriatic_ai: '/images/scenes/dalmatian-ai.webp',
  food: '/images/scenes/croatian-food.webp',
  mostar: '/images/scenes/mostar.webp',
  labin: '/images/scenes/labin.webp',
  rabac: '/images/scenes/rabac.webp',
  bibinje: '/images/scenes/bibinje.webp',
};

export const PHOTOS: Record<string, string> = {
  dubrovnik: '/images/scenes/dubrovnik-ai.webp',
  adriatic: '/images/scenes/dalmatian-ai.webp',
  plitvice: '/images/scenes/plitvice.webp',
  zagreb: '/images/scenes/zagreb.webp',
  hvar: 'https://images.unsplash.com/photo-1527515637462-cff94edd89b6?w=1200&q=85&fit=crop&auto=format',
  dalmatia:
    'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1200&q=85&fit=crop&auto=format',
  split:
    'https://images.unsplash.com/photo-1559570704-fea2efaf9e79?w=1200&q=85&fit=crop&auto=format',
  lavender:
    'https://images.unsplash.com/photo-1527515673-84f37b4c89ae?w=1200&q=85&fit=crop&auto=format',
  food: '/images/scenes/croatian-food.webp',
  market: '/images/scenes/zagreb.webp',
  stone:
    'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=1200&q=85&fit=crop&auto=format',
  rovinj:
    'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&q=85&fit=crop&auto=format',
  mostar: '/images/scenes/mostar.webp',
  labin: '/images/scenes/labin.webp',
  rabac: '/images/scenes/rabac.webp',
  bibinje: '/images/scenes/bibinje.webp',
  vinkovci: '/images/scenes/vinkovci.webp',
};

export const PHOTO_THUMBS: Record<string, string> = PHOTOS;

export default PHOTOS;

export const UNSPLASH_CREDIT = 'Photos via Unsplash';

export const PHOTO_CREDITS: Record<string, string> = {
  labin: 'Photo © Bjoertvedt, CC BY-SA 3.0, via Wikimedia Commons',
  rabac: 'Photo © Czeva, CC BY-SA 3.0, via Wikimedia Commons',
  mostar: 'Photo © Ramirez HUN, CC BY-SA 4.0, via Wikimedia Commons',
  bibinje: 'Photo © Voilierprovencal, CC BY-SA 3.0, via Wikimedia Commons',
  vinkovci: 'Photo © Ivvon Tomek, CC BY 3.0, via Wikimedia Commons',
};
