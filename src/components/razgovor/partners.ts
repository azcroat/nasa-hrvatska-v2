import type { CharacterName } from '../family/portraits';

export type PartnerId = 'ana' | 'marko' | 'baka' | 'kovac' | 'ivo';

export interface ConvoMode {
  id: string;
  label: string;
  desc: string;
  icon: string;
  launch: 'persona' | 'scr';
  persona?: string; // for launch:'persona' — a PersonaScreen key
  scr?: string; // for launch:'scr'
  curEx?: string;
}

export interface Partner {
  id: PartnerId;
  host: CharacterName;
  name: string;
  role: string;
  tint: string;
  greeting: { hr: string; en: string };
  modes: ConvoMode[]; // modes[0] = primary "Počni razgovor"
}

export interface AlatItem {
  id: string;
  label: string;
  icon: string;
  scr: string;
  curEx?: string;
}

const chat = (persona: string): ConvoMode => ({
  id: 'chat',
  label: 'Počni razgovor',
  desc: 'Slobodan razgovor — glas ili tekst',
  icon: '💬',
  launch: 'persona',
  persona,
});

export const PARTNERS: Partner[] = [
  {
    id: 'ana',
    host: 'ana',
    name: 'Ana',
    role: 'svakodnevni razgovor',
    tint: 'rgba(14,116,144,.12)',
    greeting: { hr: 'Bok! O čemu ćemo danas pričati?', en: 'Hi! What shall we talk about today?' },
    modes: [
      chat('secretary'),
      {
        id: 'roleplay',
        label: 'Odigraj scenu',
        desc: 'Naruči kavu, snađi se',
        icon: '🎭',
        launch: 'persona',
        persona: 'secretary',
      },
    ],
  },
  {
    id: 'marko',
    host: 'marko',
    name: 'Marko',
    role: 'more i tržnica',
    tint: 'rgba(5,150,105,.12)',
    greeting: { hr: 'Ej! Idemo na priču o moru?', en: "Hey! Let's talk about the sea?" },
    modes: [
      chat('fisherman'),
      {
        id: 'roleplay',
        label: 'Odigraj scenu',
        desc: 'Na tržnici, na rivi',
        icon: '🎭',
        launch: 'persona',
        persona: 'fisherman',
      },
    ],
  },
  {
    id: 'baka',
    host: 'baka',
    name: 'Baka Marija',
    role: 'priče uz kavu',
    tint: 'rgba(194,65,12,.12)',
    greeting: {
      hr: 'Dođi, sjedni — ispričat ću ti nešto.',
      en: 'Come, sit — let me tell you something.',
    },
    modes: [
      chat('baka'),
      {
        id: 'story',
        label: 'Priča uz kavu',
        desc: 'Priča iz tvojih slabih riječi',
        icon: '📖',
        launch: 'scr',
        scr: 'ai_story',
        curEx: 'ai_story',
      },
    ],
  },
  {
    id: 'kovac',
    host: 'kovac',
    name: 'prof. Kovač',
    role: 'ispravi mi greške',
    tint: 'rgba(124,58,237,.12)',
    greeting: {
      hr: 'Da vidimo gdje griješiš — bez brige.',
      en: "Let's find your mistakes — no worries.",
    },
    modes: [
      {
        id: 'tutor',
        label: 'Vođeni sat',
        desc: 'Live tutor — 1:1 sat za tebe',
        icon: '🎓',
        launch: 'scr',
        scr: 'live_tutor',
        curEx: 'live_tutor',
      },
      {
        id: 'profchat',
        label: 'Razgovor s profesorom',
        desc: 'Slobodan razgovor',
        icon: '💬',
        launch: 'persona',
        persona: 'teacher',
      },
      {
        id: 'writing',
        label: 'Pošalji mi tekst',
        desc: 'AI označi greške i objasni',
        icon: '✍️',
        launch: 'scr',
        scr: 'writing',
        curEx: 'writing',
      },
      {
        id: 'blind',
        label: 'Slijepe točke',
        desc: 'Tjedna analiza čestih grešaka',
        icon: '🔬',
        launch: 'scr',
        scr: 'grammar_diagnosis',
        curEx: 'grammar_diagnosis',
      },
    ],
  },
  {
    id: 'ivo',
    host: 'ivo',
    name: 'Ivo',
    role: 'ulični govor',
    tint: 'rgba(37,99,235,.12)',
    greeting: {
      hr: 'Uskači, naučit ću te kak se priča.',
      en: "Hop in, I'll teach you how people really talk.",
    },
    modes: [chat('cabbie')],
  },
];

export const ALATI: AlatItem[] = [
  { id: 'aiconvo', label: 'Brzi razgovor', icon: '💬', scr: 'aiconvo', curEx: 'aiconvo' },
  {
    id: 'ai_listening',
    label: 'AI slušanje',
    icon: '🎧',
    scr: 'ai_listening',
    curEx: 'ai_listening',
  },
  {
    id: 'video_lesson',
    label: 'AI video lekcija',
    icon: '🎬',
    scr: 'video_lesson',
    curEx: 'video_lesson',
  },
  {
    id: 'speaking_sprint',
    label: 'Izgovor sprint',
    icon: '🎤',
    scr: 'speaking_sprint',
    curEx: 'speaking_sprint',
  },
  {
    id: 'photo_vocab',
    label: 'Foto skener riječi',
    icon: '📷',
    scr: 'photo_vocab',
    curEx: 'photo_vocab',
  },
];

// The conversation/tool screens that must stay reachable from Razgovor. The
// `personas` picker is intentionally replaced by the partner rows (which launch
// `maja` with a preselected persona), so its capability is preserved via `maja`.
export const MUST_NOT_ORPHAN = [
  'maja',
  'aiconvo',
  'live_tutor',
  'ai_listening',
  'video_lesson',
  'writing',
  'speaking_sprint',
  'ai_story',
  'grammar_diagnosis',
  'photo_vocab',
];

export function recommendedChat(dayIdx: number): { partner: Partner; mode: ConvoMode } {
  const partner = PARTNERS[((dayIdx % 5) + 5) % 5]!;
  return { partner, mode: partner.modes[0]! };
}

/** Shared launcher used by RazgovorTab + PartnerScreen. */
export function launchMode(
  m: ConvoMode | AlatItem,
  nav: { setScr: (s: string) => void; sCurEx?: (e: string) => void },
): void {
  if ('launch' in m && m.launch === 'persona') {
    try {
      localStorage.setItem('maja_persona', m.persona!);
    } catch {
      /* quota — continue */
    }
    nav.sCurEx?.('maja');
    nav.setScr('maja');
    return;
  }
  const scr = (m as { scr: string }).scr;
  const curEx = (m as { curEx?: string }).curEx;
  nav.sCurEx?.(curEx ?? scr);
  nav.setScr(scr);
}
