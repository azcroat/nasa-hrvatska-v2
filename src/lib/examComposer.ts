// src/lib/examComposer.ts
import type { CefrLevel } from './cefr.js';
import { CEFR_ORDER, cefrRank } from './cefr.js';
import type { SkillKey } from './cefrCertification.js';
import type { CheckpointBlueprint } from './examBlueprint.js';

export interface ExamItem {
  id: string;
  skill: SkillKey;
  level: CefrLevel;
}
export interface SpeakingTaskRef {
  id: string;
}
export interface ComposerBanks {
  itemsByLevel: Partial<Record<CefrLevel, ExamItem[]>>;
  speakingTasksByLevel: Partial<Record<CefrLevel, SpeakingTaskRef[]>>;
}
export interface ComposedExam {
  level: CefrLevel;
  coreItems: ExamItem[];
  retentionItems: ExamItem[];
  speakingTasks: SpeakingTaskRef[];
}

/** Injected RNG returning [0,1); pass a seeded fn in tests (no Math.random in pure code). */
export type Rng = () => number;

function pick<T>(arr: T[], n: number, rng: Rng): T[] {
  const pool = [...arr];
  const out: T[] = [];
  while (out.length < n && pool.length > 0) {
    const idx = Math.floor(rng() * pool.length) % pool.length;
    out.push(pool.splice(idx, 1)[0]!);
  }
  return out;
}

/**
 * Turns a blueprint into concrete items:
 *  - core: all items at `level`.
 *  - retention: `retentionCount` items from levels BELOW `level`, preferring
 *    items whose skill is in the learner's weak-topic list, then random.
 *    Retention items keep their original (lower) `level` so the scorer/UI can
 *    fold them into the right skill bucket (retention counts toward the gate).
 *  - speaking: `speakingCount` tasks at `level`.
 */
export function composeExam(
  bp: CheckpointBlueprint,
  banks: ComposerBanks,
  adaptive: { weakTopics: SkillKey[] },
  rng: Rng,
): ComposedExam {
  const coreItems = banks.itemsByLevel[bp.level] ?? [];

  const belowLevels = CEFR_ORDER.filter((l) => cefrRank(l) < cefrRank(bp.level));
  const belowPool: ExamItem[] = belowLevels.flatMap((l) => banks.itemsByLevel[l] ?? []);
  const weak = new Set(adaptive.weakTopics);
  const weakFirst = belowPool.filter((it) => weak.has(it.skill));
  const rest = belowPool.filter((it) => !weak.has(it.skill));
  const retentionItems = [
    ...pick(weakFirst, bp.retentionCount, rng),
    ...pick(
      rest,
      Math.max(0, bp.retentionCount - Math.min(weakFirst.length, bp.retentionCount)),
      rng,
    ),
  ].slice(0, bp.retentionCount);

  const speakingTasks = pick(banks.speakingTasksByLevel[bp.level] ?? [], bp.speakingCount, rng);

  return { level: bp.level, coreItems, retentionItems, speakingTasks };
}
