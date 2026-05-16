// ─── Scene Data ───────────────────────────────────────────────────────────────
// SCENES array and localStorage helpers for VocabScenes.

export const SCENES = [
  {
    id: 'kitchen',
    title: 'Kuhinja',
    titleEn: 'The Kitchen',
    icon: '🍳',
    emoji: '🏠',
    color: '#d97706',
    bg: '#fffbeb',
    sceneStyle: {},
    items: [
      { id: 'fridge', hr: 'hladnjak', en: 'fridge', icon: '🧊', note: 'm.', x: 12, y: 20 },
      { id: 'stove', hr: 'štednjak', en: 'stove', icon: '🔥', note: 'm.', x: 30, y: 55 },
      { id: 'sink', hr: 'sudoper', en: 'sink', icon: '🚿', note: 'm.', x: 55, y: 50 },
      { id: 'table', hr: 'stol', en: 'table', icon: '🪑', note: 'm.', x: 50, y: 78 },
      { id: 'window', hr: 'prozor', en: 'window', icon: '🪟', note: 'm.', x: 75, y: 20 },
      { id: 'cup', hr: 'šalica', en: 'cup', icon: '☕', note: 'f.', x: 40, y: 45 },
      { id: 'plate', hr: 'tanjur', en: 'plate', icon: '🍽️', note: 'm.', x: 52, y: 75 },
      { id: 'fork', hr: 'vilica', en: 'fork', icon: '🍴', note: 'f.', x: 60, y: 75 },
      { id: 'knife', hr: 'nož', en: 'knife', icon: '🔪', note: 'm.', x: 65, y: 75 },
      { id: 'bottle', hr: 'boca', en: 'bottle', icon: '🍶', note: 'f.', x: 20, y: 45 },
      { id: 'bread', hr: 'kruh', en: 'bread', icon: '🍞', note: 'm.', x: 35, y: 70 },
      { id: 'chair', hr: 'stolica', en: 'chair', icon: '🪑', note: 'f.', x: 55, y: 88 },
    ],
  },
  {
    id: 'market',
    title: 'Tržnica',
    titleEn: 'The Market',
    icon: '🛒',
    emoji: '🏪',
    color: '#16a34a',
    bg: '#f0fdf4',
    sceneStyle: {},
    items: [
      { id: 'apple', hr: 'jabuka', en: 'apple', icon: '🍎', note: 'f.', x: 15, y: 40 },
      { id: 'orange', hr: 'naranča', en: 'orange', icon: '🍊', note: 'f.', x: 28, y: 40 },
      { id: 'tomato', hr: 'rajčica', en: 'tomato', icon: '🍅', note: 'f.', x: 40, y: 40 },
      { id: 'cucumber', hr: 'krastavac', en: 'cucumber', icon: '🥒', note: 'm.', x: 55, y: 40 },
      { id: 'cheese', hr: 'sir', en: 'cheese', icon: '🧀', note: 'm.', x: 70, y: 45 },
      { id: 'fish', hr: 'riba', en: 'fish', icon: '🐟', note: 'f.', x: 20, y: 65 },
      { id: 'bread2', hr: 'kruh', en: 'bread', icon: '🍞', note: 'm.', x: 35, y: 65 },
      { id: 'honey', hr: 'med', en: 'honey', icon: '🍯', note: 'm.', x: 50, y: 65 },
      { id: 'egg', hr: 'jaje', en: 'egg', icon: '🥚', note: 'n.', x: 65, y: 65 },
      { id: 'grapes', hr: 'grožđe', en: 'grapes', icon: '🍇', note: 'n.', x: 80, y: 40 },
      { id: 'onion', hr: 'luk', en: 'onion', icon: '🧅', note: 'm.', x: 10, y: 65 },
      { id: 'bag', hr: 'torba', en: 'bag', icon: '👜', note: 'f.', x: 80, y: 70 },
      { id: 'basket', hr: 'košara', en: 'basket', icon: '🧺', note: 'f.', x: 45, y: 80 },
    ],
  },
  {
    id: 'cafe',
    title: 'Kafić',
    titleEn: 'The Café',
    icon: '☕',
    emoji: '🏙️',
    color: '#92400e',
    bg: '#fffbeb',
    sceneStyle: {},
    items: [
      { id: 'coffee', hr: 'kava', en: 'coffee', icon: '☕', note: 'f.', x: 30, y: 55 },
      { id: 'tea', hr: 'čaj', en: 'tea', icon: '🍵', note: 'm.', x: 45, y: 55 },
      { id: 'juice', hr: 'sok', en: 'juice', icon: '🥤', note: 'm.', x: 60, y: 55 },
      { id: 'water', hr: 'voda', en: 'water', icon: '💧', note: 'f.', x: 20, y: 55 },
      { id: 'cake', hr: 'torta', en: 'cake', icon: '🎂', note: 'f.', x: 35, y: 75 },
      { id: 'menu', hr: 'jelovnik', en: 'menu', icon: '📋', note: 'm.', x: 15, y: 35 },
      { id: 'waiter', hr: 'konobar', en: 'waiter', icon: '🧑‍🍳', note: 'm.', x: 70, y: 40 },
      { id: 'chair2', hr: 'stolica', en: 'chair', icon: '🪑', note: 'f.', x: 50, y: 85 },
      { id: 'table2', hr: 'stol', en: 'table', icon: '🪑', note: 'm.', x: 40, y: 80 },
      { id: 'spoon', hr: 'žlica', en: 'spoon', icon: '🥄', note: 'f.', x: 55, y: 70 },
      { id: 'sugar', hr: 'šećer', en: 'sugar', icon: '🍬', note: 'm.', x: 25, y: 70 },
      { id: 'newspaper', hr: 'novine', en: 'newspaper', icon: '📰', note: 'f.pl.', x: 80, y: 35 },
    ],
  },
  {
    id: 'beach',
    title: 'Plaža',
    titleEn: 'The Beach',
    icon: '🏖️',
    emoji: '🌊',
    color: '#0891b2',
    bg: '#ecfeff',
    sceneStyle: {},
    items: [
      { id: 'sea', hr: 'more', en: 'sea', icon: '🌊', note: 'n.', x: 50, y: 25 },
      { id: 'sand', hr: 'pijesak', en: 'sand', icon: '⏳', note: 'm.', x: 50, y: 70 },
      { id: 'sun', hr: 'sunce', en: 'sun', icon: '☀️', note: 'n.', x: 80, y: 10 },
      { id: 'umbrella', hr: 'suncobran', en: 'parasol', icon: '⛱️', note: 'm.', x: 25, y: 55 },
      { id: 'towel', hr: 'ručnik', en: 'towel', icon: '🏊', note: 'm.', x: 40, y: 75 },
      { id: 'boat', hr: 'brod', en: 'boat', icon: '⛵', note: 'm.', x: 70, y: 30 },
      { id: 'shell', hr: 'školjka', en: 'shell', icon: '🐚', note: 'f.', x: 60, y: 80 },
      { id: 'icecream', hr: 'sladoled', en: 'ice cream', icon: '🍦', note: 'm.', x: 15, y: 45 },
      { id: 'glasses', hr: 'naočale', en: 'sunglasses', icon: '😎', note: 'f.pl.', x: 35, y: 65 },
      { id: 'hat', hr: 'šešir', en: 'hat', icon: '👒', note: 'm.', x: 55, y: 60 },
      { id: 'ball', hr: 'lopta', en: 'ball', icon: '⚽', note: 'f.', x: 70, y: 70 },
      { id: 'fish2', hr: 'riba', en: 'fish', icon: '🐟', note: 'f.', x: 45, y: 30 },
    ],
  },
  {
    id: 'livingroom',
    title: 'Dnevna soba',
    titleEn: 'The Living Room',
    icon: '🛋️',
    emoji: '🏠',
    color: '#7c3aed',
    bg: '#faf5ff',
    sceneStyle: {},
    items: [
      { id: 'sofa', hr: 'kauč', en: 'sofa', icon: '🛋️', note: 'm.', x: 40, y: 60 },
      { id: 'tv', hr: 'televizor', en: 'TV', icon: '📺', note: 'm.', x: 50, y: 30 },
      { id: 'lamp', hr: 'lampa', en: 'lamp', icon: '💡', note: 'f.', x: 20, y: 35 },
      { id: 'book2', hr: 'knjiga', en: 'book', icon: '📚', note: 'f.', x: 75, y: 55 },
      { id: 'phone2', hr: 'telefon', en: 'phone', icon: '📱', note: 'm.', x: 30, y: 70 },
      { id: 'clock', hr: 'sat', en: 'clock', icon: '🕰️', note: 'm.', x: 80, y: 20 },
      { id: 'painting', hr: 'slika', en: 'painting', icon: '🖼️', note: 'f.', x: 50, y: 15 },
      { id: 'carpet', hr: 'tepih', en: 'carpet', icon: '🏠', note: 'm.', x: 45, y: 80 },
      { id: 'door', hr: 'vrata', en: 'door', icon: '🚪', note: 'n.pl.', x: 15, y: 50 },
      { id: 'curtain', hr: 'zavjesa', en: 'curtain', icon: '🪟', note: 'f.', x: 75, y: 25 },
      { id: 'remote', hr: 'daljinski', en: 'remote', icon: '📡', note: 'm.', x: 60, y: 68 },
    ],
  },
  {
    id: 'classroom',
    title: 'Razred',
    titleEn: 'The Classroom',
    icon: '📚',
    emoji: '🏫',
    color: '#0369a1',
    bg: '#f0f9ff',
    sceneStyle: {},
    items: [
      { id: 'board', hr: 'ploča', en: 'blackboard', icon: '🟩', note: 'f.', x: 45, y: 20 },
      { id: 'chalk', hr: 'kreda', en: 'chalk', icon: '✏️', note: 'f.', x: 30, y: 35 },
      { id: 'desk', hr: 'klupa', en: 'desk', icon: '🪑', note: 'f.', x: 35, y: 65 },
      { id: 'pencil', hr: 'olovka', en: 'pencil', icon: '✏️', note: 'f.', x: 55, y: 55 },
      { id: 'ruler', hr: 'ravnalo', en: 'ruler', icon: '📏', note: 'n.', x: 65, y: 55 },
      { id: 'backpack', hr: 'ruksak', en: 'backpack', icon: '🎒', note: 'm.', x: 20, y: 70 },
      { id: 'notebook', hr: 'bilježnica', en: 'notebook', icon: '📓', note: 'f.', x: 45, y: 72 },
      { id: 'map', hr: 'karta', en: 'map', icon: '🗺️', note: 'f.', x: 75, y: 20 },
      { id: 'teacher', hr: 'učitelj', en: 'teacher', icon: '👨‍🏫', note: 'm.', x: 20, y: 35 },
      { id: 'globe', hr: 'globus', en: 'globe', icon: '🌍', note: 'm.', x: 80, y: 40 },
      { id: 'scissors', hr: 'škare', en: 'scissors', icon: '✂️', note: 'f.pl.', x: 70, y: 70 },
    ],
  },
  {
    id: 'city',
    title: 'Grad',
    titleEn: 'The City',
    icon: '🏙️',
    emoji: '🌆',
    color: '#374151',
    bg: '#f9fafb',
    sceneStyle: {},
    items: [
      { id: 'building', hr: 'zgrada', en: 'building', icon: '🏢', note: 'f.', x: 20, y: 40 },
      { id: 'church', hr: 'crkva', en: 'church', icon: '⛪', note: 'f.', x: 70, y: 35 },
      { id: 'tram', hr: 'tramvaj', en: 'tram', icon: '🚋', note: 'm.', x: 45, y: 65 },
      { id: 'car', hr: 'auto', en: 'car', icon: '🚗', note: 'm.', x: 25, y: 70 },
      { id: 'bike', hr: 'bicikl', en: 'bicycle', icon: '🚲', note: 'm.', x: 60, y: 72 },
      { id: 'tree', hr: 'drvo', en: 'tree', icon: '🌳', note: 'n.', x: 80, y: 50 },
      { id: 'bench', hr: 'klupa', en: 'bench', icon: '🪑', note: 'f.', x: 40, y: 75 },
      { id: 'fountain', hr: 'fontana', en: 'fountain', icon: '⛲', note: 'f.', x: 50, y: 55 },
      { id: 'shop', hr: 'dućan', en: 'shop', icon: '🏪', note: 'm.', x: 35, y: 45 },
      { id: 'pharmacy', hr: 'ljekarna', en: 'pharmacy', icon: '💊', note: 'f.', x: 15, y: 50 },
      { id: 'sky', hr: 'nebo', en: 'sky', icon: '☁️', note: 'n.', x: 50, y: 10 },
    ],
  },
  {
    id: 'home',
    title: 'Kuća',
    titleEn: 'The Croatian Home',
    icon: '🏡',
    emoji: '🇭🇷',
    color: '#dc2626',
    bg: '#fef2f2',
    sceneStyle: {},
    items: [
      { id: 'roof', hr: 'krov', en: 'roof', icon: '🏠', note: 'm.', x: 50, y: 10 },
      { id: 'door2', hr: 'vrata', en: 'door', icon: '🚪', note: 'n.pl.', x: 50, y: 65 },
      { id: 'garden', hr: 'vrt', en: 'garden', icon: '🌿', note: 'm.', x: 20, y: 75 },
      { id: 'car2', hr: 'auto', en: 'car', icon: '🚗', note: 'm.', x: 80, y: 75 },
      { id: 'chimney', hr: 'dimnjak', en: 'chimney', icon: '🏭', note: 'm.', x: 65, y: 15 },
      { id: 'balcony', hr: 'balkon', en: 'balcony', icon: '🏢', note: 'm.', x: 30, y: 40 },
      { id: 'stairs', hr: 'stepenice', en: 'stairs', icon: '🪜', note: 'f.pl.', x: 55, y: 75 },
      { id: 'fence', hr: 'ograda', en: 'fence', icon: '🔩', note: 'f.', x: 15, y: 60 },
      {
        id: 'mailbox',
        hr: 'poštanski sandučić',
        en: 'mailbox',
        icon: '📬',
        note: 'm.',
        x: 75,
        y: 60,
      },
      { id: 'dog2', hr: 'pas', en: 'dog', icon: '🐕', note: 'm.', x: 30, y: 80 },
      { id: 'flag', hr: 'zastava', en: 'flag', icon: '🇭🇷', note: 'f.', x: 80, y: 35 },
    ],
  },
];

// Total items across all scenes
export const TOTAL_WORDS = SCENES.reduce((s, sc) => s + sc.items.length, 0);

// ─── localStorage helpers ─────────────────────────────────────────────────────

export function loadDiscovered(sceneId) {
  try {
    const raw = localStorage.getItem(`nh_scene_${sceneId}`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveDiscovered(sceneId, set) {
  try {
    localStorage.setItem(`nh_scene_${sceneId}`, JSON.stringify([...set]));
  } catch {}
}

export function loadSRS() {
  try {
    const raw = localStorage.getItem('nh_scene_srs');
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveSRS(set) {
  try {
    localStorage.setItem('nh_scene_srs', JSON.stringify([...set]));
  } catch {}
}

export function loadSRSQueue() {
  try {
    const raw = localStorage.getItem('nh_scene_srs_queue');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSRSQueue(arr) {
  try {
    localStorage.setItem('nh_scene_srs_queue', JSON.stringify(arr));
  } catch {}
}
