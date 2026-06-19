import { isUnlocked } from '../../lib/cefr';
import { getSR } from '../../data';
import type { CharacterName } from '../family/portraits';
import { PLACES, GRAD_EXTRAS, PLACE_ASSIGNMENTS, type PlaceId, type ExtraItem } from './places';

type CatalogItem = {
  id: string;
  label: string;
  icon: string;
  desc: string;
  cefr: string;
  action: () => void;
};

export interface ExtraLaunchers {
  quiz: () => void;
  flash: () => void;
  match: () => void;
  listen: () => void;
  speaking: () => void;
  scr: (id: string) => () => void;
}

export interface SmartRecs {
  dueReviews: number;
  weakCount: number;
  isNewUser: boolean;
  userGoal: string | null;
}

export interface ModelCtx {
  exercises: CatalogItem[];
  extras: ExtraLaunchers;
  userCefr: string;
  recs: SmartRecs;
  queue: unknown[];
}

export interface GradItem {
  id: string;
  label: string;
  icon: string;
  desc: string;
  cefr: string;
  placeId: PlaceId;
  subgroup?: string;
  locked: boolean;
  launch: () => void;
}

function extraLaunch(x: ExtraItem, ex: ExtraLaunchers): () => void {
  switch (x.kind) {
    case 'quiz':
      return ex.quiz;
    case 'flash':
      return ex.flash;
    case 'match':
      return ex.match;
    case 'listen':
      return ex.listen;
    case 'speaking':
      return ex.speaking;
    case 'scr':
      return ex.scr(x.scr!);
  }
}

export function itemsForPlace(placeId: PlaceId, ctx: ModelCtx): GradItem[] {
  const out: GradItem[] = [];
  for (const e of ctx.exercises) {
    const a = PLACE_ASSIGNMENTS[e.id];
    if (!a || a.place !== placeId) continue;
    out.push({
      id: e.id,
      label: e.label,
      icon: e.icon,
      desc: e.desc,
      cefr: e.cefr,
      placeId,
      subgroup: a.subgroup,
      locked: !isUnlocked(e.cefr, ctx.userCefr),
      launch: e.action,
    });
  }
  for (const x of GRAD_EXTRAS) {
    if (x.place !== placeId) continue;
    out.push({
      id: x.id,
      label: x.label,
      icon: x.icon,
      desc: '',
      cefr: x.cefr,
      placeId,
      locked: !isUnlocked(x.cefr, ctx.userCefr),
      launch: extraLaunch(x, ctx.extras),
    });
  }
  return out;
}

export function placeStats(placeId: PlaceId, ctx: ModelCtx) {
  const items = itemsForPlace(placeId, ctx);
  const sr = getSR() as Record<string, { r?: number; w?: number; due?: number }>;
  const now = Date.now();
  const lockedCount = items.filter((i) => i.locked).length;
  // "done"/"due" are approximate (SR is keyed by content items, not exercise ids,
  // so these are cosmetic signals — not part of the no-orphan guarantee).
  const done = items.filter((i) => {
    const e = sr[i.id];
    return !!e && (e.r || 0) > 0;
  }).length;
  const due = items.filter((i) => {
    const e = sr[i.id];
    return !!e && e.due != null && e.due <= now;
  }).length;
  return { total: items.length, done, due, lockedCount };
}

const HOST_OF = (placeId: PlaceId): CharacterName | null =>
  PLACES.find((p) => p.id === placeId)?.host ?? null;

export interface Recommendation {
  exerciseId: string;
  placeId: PlaceId | null; // null when the visit is the Today card itself (no place row)
  host: CharacterName | null;
  hr: string;
  en: string;
  count: number;
  durationMin: number;
  launch: () => void;
}

export function recommendedVisit(ctx: ModelCtx): Recommendation {
  const launchOf = (id: string): (() => void) =>
    ctx.exercises.find((e) => e.id === id)?.action ?? (() => {});
  // Priority ladder over EXISTING signals (no new adaptive logic).
  if (ctx.recs.dueReviews > 0) {
    return {
      exerciseId: 'srsreview',
      placeId: null,
      host: 'ana',
      hr: `Ana ti je spremila ${ctx.recs.dueReviews} fraza`,
      en: `${ctx.recs.dueReviews} reviews waiting`,
      count: ctx.recs.dueReviews,
      durationMin: 6,
      launch: launchOf('srsreview'),
    };
  }
  if (ctx.recs.weakCount > 0) {
    return {
      exerciseId: 'adaptive_review',
      placeId: 'soba',
      host: HOST_OF('soba'),
      hr: `Kovač je označio ${ctx.recs.weakCount} slabih točaka`,
      en: `${ctx.recs.weakCount} weak spots to review`,
      count: ctx.recs.weakCount,
      durationMin: 7,
      launch: launchOf('adaptive_review'),
    };
  }
  if (ctx.queue.length > 0) {
    return {
      exerciseId: 'adaptive_review',
      placeId: null,
      host: 'ana',
      hr: 'Pametno ponavljanje za tebe',
      en: 'A smart review built for you',
      count: ctx.queue.length,
      durationMin: 6,
      launch: launchOf('adaptive_review'),
    };
  }
  // free-day fallback — visit the Square / new content.
  return {
    exerciseId: 'arcade',
    placeId: 'trg',
    host: null,
    hr: 'Slobodan dan — zaigraj na Trgu',
    en: 'Free day — play on the Square',
    count: 0,
    durationMin: 5,
    launch: ctx.extras.scr('arcade'),
  };
}
