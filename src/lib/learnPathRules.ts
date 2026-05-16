// SP11e: client-side interpreter for LEARN_PATH ckRule DSL.
// The DSL replaces JavaScript predicate functions that used to live in
// src/data/content.tsx; data now ships from /api/content/core.
//
// CkLeaf shapes (interpreted by evalCk):
//   { ctIncludes: 'topic' }  → stats.ct includes topic
//   { vsIncludes: 'screen' } → stats.vs includes screen
//   { lcAtLeast: N }         → stats.lc >= N  (lesson count)
//   { gcAtLeast: N }         → stats.gc >= N  (grammar drill count)
//   { xpAtLeast: N }         → stats.xp >= N  (total XP)
//   { spAtLeast: N }         → stats.sp >= N  (speaking sessions)
//
// Combinators (recursive — nodes may be leaves OR sub-rules):
//   { anyOf: [...] } → at least one matches
//   { allOf: [...] } → all match
//
// Unknown leaf kinds evaluate false (forward-compat) so the server can ship
// new leaf types without breaking older clients.

export type CkLeaf =
  | { ctIncludes: string }
  | { vsIncludes: string }
  | { lcAtLeast: number }
  | { gcAtLeast: number }
  | { xpAtLeast: number }
  | { spAtLeast: number };

export type CkNode = CkLeaf | CkRule;

export type CkRule = { anyOf: CkNode[] } | { allOf: CkNode[] };

export interface Stats {
  ct?: string[];
  vs?: string[];
  lc?: number;
  gc?: number;
  xp?: number;
  sp?: number;
  [key: string]: unknown;
}

export interface LearnPathItem {
  id: string;
  name: string;
  go: string;
  topic?: string;
  diff: number;
  dur: string;
  cat?: string;
  icon?: string;
  desc?: string;
  lessonId?: string;
  filter?: string[];
  ckRule?: CkRule;
}

export interface LearnPathLevel {
  level: number;
  title: string;
  desc: string;
  items: LearnPathItem[];
}

function isRule(node: CkNode): node is CkRule {
  return node !== null && typeof node === 'object' && ('anyOf' in node || 'allOf' in node);
}

function evalLeaf(leaf: CkLeaf, s: Stats): boolean {
  if ('ctIncludes' in leaf) return Array.isArray(s.ct) && s.ct.includes(leaf.ctIncludes);
  if ('vsIncludes' in leaf) return Array.isArray(s.vs) && s.vs.includes(leaf.vsIncludes);
  if ('lcAtLeast' in leaf) return typeof s.lc === 'number' && s.lc >= leaf.lcAtLeast;
  if ('gcAtLeast' in leaf) return typeof s.gc === 'number' && s.gc >= leaf.gcAtLeast;
  if ('xpAtLeast' in leaf) return typeof s.xp === 'number' && s.xp >= leaf.xpAtLeast;
  if ('spAtLeast' in leaf) return typeof s.sp === 'number' && s.sp >= leaf.spAtLeast;
  return false;
}

function evalNode(node: CkNode, s: Stats): boolean {
  if (!node || typeof node !== 'object') return false;
  if (isRule(node)) {
    if ('anyOf' in node && Array.isArray(node.anyOf)) {
      return node.anyOf.some((child) => evalNode(child, s));
    }
    if ('allOf' in node && Array.isArray(node.allOf)) {
      return node.allOf.every((child) => evalNode(child, s));
    }
    return false;
  }
  return evalLeaf(node, s);
}

export function evalCk(rule: CkRule | undefined, stats: Stats): boolean {
  if (!rule) return false;
  return evalNode(rule, stats);
}
