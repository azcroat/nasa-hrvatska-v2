// Static data for StoryModeScreen

export const STORY_CITIES = [
  { name: 'Zagreb',    icon: '🏛️', color: '#0e7490', region: 'Central Croatia' },
  { name: 'Split',     icon: '🏟️', color: '#b45309', region: 'Dalmatia' },
  { name: 'Dubrovnik', icon: '🏯', color: '#7c3aed', region: 'Southern Dalmatia' },
  { name: 'Hvar',      icon: '🌿', color: '#16a34a', region: 'Dalmatia' },
  { name: 'Rovinj',    icon: '🎨', color: '#dc2626', region: 'Istria' },
  { name: 'Šibenik',   icon: '⛪', color: '#0369a1', region: 'Northern Dalmatia' },
  { name: 'Plitvice',  icon: '🌊', color: '#0e7490', region: 'Lika' },
  { name: 'Labin',     icon: '⛏️', color: '#0e7490', region: 'Istria' },
  { name: 'Mostar',    icon: '🌉', color: '#b45309', region: 'Herzegovina' },
  { name: 'Varaždin',  icon: '🎶', color: '#7c3aed', region: 'Northern Croatia' },
  { name: 'Zadar',     icon: '🌅', color: '#b45309', region: 'Northern Dalmatia' },
  { name: 'Rijeka',    icon: '🚢', color: '#0369a1', region: 'Kvarner' },
];

export const CITY_PHOTOS = {
  Zagreb:    '/images/scenes/zagreb.webp',
  Split:     'https://images.unsplash.com/photo-1559570704-fea2efaf9e79?w=800&q=85&fit=crop',
  Dubrovnik: '/images/scenes/dubrovnik-ai.webp',
  Hvar:      'https://images.unsplash.com/photo-1527515637462-cff94edd89b6?w=800&q=85&fit=crop',
  Rovinj:    'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=85&fit=crop',
  Plitvice:  '/images/scenes/plitvice.webp',
  Labin:     '/images/scenes/labin.webp',
  Mostar:    '/images/scenes/mostar.webp',
  default:   '/images/scenes/dalmatian-ai.webp',
};

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const GOAL_META = {
  heritage: {
    label: 'Heritage Seeker',
    icon: '🧬',
    cities: ['Zagreb', 'Varaždin', 'Šibenik'],
    theme: 'family history and Croatian roots',
    tip: 'Stories about ancestry, old family homes, and cultural identity',
  },
  family: {
    label: 'Family Connection',
    icon: '👨‍👩‍👧',
    cities: ['Split', 'Zagreb', 'Zadar'],
    theme: 'everyday family life and domestic moments',
    tip: 'Stories set in homes, markets, and family gatherings',
  },
  travel: {
    label: 'Traveler',
    icon: '✈️',
    cities: ['Dubrovnik', 'Hvar', 'Rovinj'],
    theme: 'travel, exploration, and local discoveries',
    tip: 'Stories as a visitor navigating real Croatian places',
  },
  culture: {
    label: 'Culture Lover',
    icon: '🎭',
    cities: ['Šibenik', 'Zadar', 'Varaždin'],
    theme: 'art, music, festivals, and Croatian traditions',
    tip: 'Stories rich in cultural references and local customs',
  },
  partner: {
    label: 'Partner Goal',
    icon: '💑',
    cities: ['Rovinj', 'Hvar', 'Dubrovnik'],
    theme: 'romantic settings and heartfelt conversations',
    tip: 'Stories set in intimate, scenic Croatian locations',
  },
  fluent: {
    label: 'Fluency Goal',
    icon: '🗣️',
    cities: ['Zagreb', 'Split', 'Rijeka'],
    theme: 'authentic everyday Croatian life and natural dialogue',
    tip: 'Stories with rich vocabulary and natural speech patterns',
  },
};
