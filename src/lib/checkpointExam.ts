// src/lib/checkpointExam.ts
import type { CefrLevel } from './cefr.js';
import { CEFR_ORDER, cefrRank } from './cefr.js';
import type { SkillKey, CertificationState } from './cefrCertification.js';
import { buildCheckpointBlueprint } from './examBlueprint.js';
import { composeExam, type ComposerBanks, type ExamItem, type Rng } from './examComposer.js';
import { getNextTestFor } from '../data/cefrEquivalencyItems.js';
import { getSpeakingTasks, type SpeakingTask } from '../data/speakingTasks.js';
import { CHECKPOINT_CORE_COUNT } from './checkpointConfig.js';

export interface RunnerQuestion {
  id: string;
  skill: SkillKey;
  prompt: string;
  options: string[];
  correctIndex: number;
  passage?: string;
  level: CefrLevel;
}

export interface CheckpointExam {
  level: CefrLevel;
  questions: RunnerQuestion[];
  speaking: { level: CefrLevel; tasks: SpeakingTask[] };
}

/**
 * Map the equivalency item bank for `level` into renderable questions.
 * NOTE: EquivalencyItem stores answers in field `o` (not `options`).
 */
function questionsForLevel(level: CefrLevel): RunnerQuestion[] {
  const set = getNextTestFor(level); // set.levelFrom === level tests `level` competency
  if (!set) return [];
  return set.items.map((it, i) => ({
    id: `${level}#${i}`,
    skill: it.skill as SkillKey,
    prompt: it.q,
    options: [...it.o], // EquivalencyItem uses `o`, not `options`
    correctIndex: it.c,
    passage: it.passage,
    level,
  }));
}

function sample<T>(arr: T[], n: number, rng: Rng): T[] {
  const pool = [...arr];
  const out: T[] = [];
  while (out.length < n && pool.length > 0) {
    const idx = Math.floor(rng() * pool.length) % pool.length;
    out.push(pool.splice(idx, 1)[0]!);
  }
  return out;
}

/**
 * Builds a concrete checkpoint exam: CHECKPOINT_CORE_COUNT current-level
 * questions, 2 retention questions from below (weak-skill-weighted, via the
 * Plan 1 composer), and the speaking section (2 tasks if speaking was flagged,
 * else 1). Retention questions keep their lower level so the runner folds them
 * into the right skill bucket — retention counts toward the gate.
 */
export function buildCheckpointExam(
  level: CefrLevel,
  certState: CertificationState,
  weakSkills: SkillKey[],
  rng: Rng,
): CheckpointExam {
  // Build lookup of every below-level + current-level question by composer id.
  const levels = CEFR_ORDER.filter((l) => cefrRank(l) <= cefrRank(level));
  const lookup = new Map<string, RunnerQuestion>();
  const itemsByLevel: ComposerBanks['itemsByLevel'] = {};
  for (const lvl of levels) {
    const qs = questionsForLevel(lvl);
    qs.forEach((q) => lookup.set(q.id, q));
    itemsByLevel[lvl] = qs.map<ExamItem>((q) => ({ id: q.id, skill: q.skill, level: q.level }));
  }

  const speakingFlagged = (certState.checkpoints.focusSkills[level] ?? []).includes(
    'speaking' as SkillKey,
  );
  const bp = buildCheckpointBlueprint(level, { speakingFlagged });
  const banks: ComposerBanks = {
    itemsByLevel,
    speakingTasksByLevel: { [level]: getSpeakingTasks(level).map((t) => ({ id: t.id })) },
  };
  const composed = composeExam(bp, banks, { weakTopics: weakSkills }, rng);

  // Core: composer returns ALL current-level items → sample CHECKPOINT_CORE_COUNT.
  const core = sample(composed.coreItems, CHECKPOINT_CORE_COUNT, rng)
    .map((it) => lookup.get(it.id)!)
    .filter(Boolean);
  const retention = composed.retentionItems.map((it) => lookup.get(it.id)!).filter(Boolean);

  const tasksById = new Map(getSpeakingTasks(level).map((t) => [t.id, t]));
  const speakingTasks = composed.speakingTasks.map((s) => tasksById.get(s.id)!).filter(Boolean);

  return { level, questions: [...core, ...retention], speaking: { level, tasks: speakingTasks } };
}
