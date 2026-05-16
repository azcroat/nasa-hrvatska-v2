// src/lib/storyRecommendation.ts
// SP7: pure-function scorer that ranks the graded-story catalog using
// SP5's UserContext and the recent-reads exclusion list.

import { cefrRank } from './cefr';
import type { UserContext } from './userContext';

export interface GradedStoryLike {
  id: string;
  level: string;
  title: string;
  focus: string;
  levelColor: string;
  levelBg: string;
  icon: string;
  titleEn: string;
  duration: number;
  // SP11: IP fields are NOT used by recommendStory(); kept optional so
  // StoryCatalogEntry (display-only) satisfies the type. Full bodies still
  // available via getStory(id) when actually needed.
  intro?: string;
  paragraphs?: { hr: string; en: string }[];
  vocabulary?: { hr: string; en: string; ex: string }[];
  quiz?: { q: string; qEn: string; opts: string[]; correct: number }[];
}

export interface RankedStory {
  story: GradedStoryLike;
  score: number;
  rationale: string;
}

// Canonical topic id → human-readable keywords that may appear in story.focus.
// Case-insensitive substring matching.
const TOPIC_KEYWORDS: Record<string, string[]> = {
  accusative: ['accusative'],
  genitive: ['genitive'],
  'dative-locative': ['dative', 'locative'],
  instrumental: ['instrumental'],
  vocative: ['vocative'],
  'past-tense': ['past tense', 'past'],
  'future-tense': ['future tense', 'future'],
  'aspect-imperfective': ['imperfective', 'aspect'],
  'aspect-perfective': ['perfective', 'aspect'],
  'aspect-negation': ['negation', 'aspect'],
  conditional: ['conditional'],
  clitics: ['clitic', 'clitics'],
  'vocab-a2': [],
  'vocab-b1': [],
  'vocab-b2': [],
  speaking: [],
};

function matchesTopic(focus: string, topic: string): boolean {
  const keywords = TOPIC_KEYWORDS[topic];
  if (!keywords || keywords.length === 0) return false;
  const lower = focus.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

function scoreLevel(storyLevel: string, userLevel: string): number {
  const sRank = cefrRank(storyLevel);
  const uRank = cefrRank(userLevel);
  if (sRank === uRank) return 20;
  if (sRank === uRank - 1) return 10;
  return 0;
}

function buildRationale(
  story: GradedStoryLike,
  matchedTopic: string | null,
  userCefr: string,
): string {
  if (matchedTopic) {
    return `Practice ${matchedTopic} — your current weak spot.`;
  }
  if (cefrRank(story.level) === cefrRank(userCefr)) {
    return `Right at your ${userCefr} level — solid practice.`;
  }
  return `Confidence-building read at ${story.level}.`;
}

export function recommendStory(
  userContext: UserContext,
  catalog: GradedStoryLike[],
  recentReads: string[],
): RankedStory | null {
  if (!catalog || catalog.length === 0) return null;

  // Filter 1: CEFR unlock
  const unlocked = catalog.filter((s) => cefrRank(s.level) <= cefrRank(userContext.level.cefr));
  if (unlocked.length === 0) return null;

  // Filter 2: Recency exclusion (with fallback to full unlocked pool if it empties)
  let pool = unlocked.filter((s) => !recentReads.includes(s.id));
  if (pool.length === 0) pool = unlocked;

  // Score every story
  type Scored = { story: GradedStoryLike; score: number; matchedTopic: string | null };
  const scored: Scored[] = pool.map((s) => {
    let score = scoreLevel(s.level, userContext.level.cefr);
    let topicBonus = 0;
    let firstMatchedTopic: string | null = null;
    for (const t of userContext.weakTopics) {
      if (matchesTopic(s.focus, t.topic)) {
        topicBonus += 25;
        if (firstMatchedTopic === null) firstMatchedTopic = t.topic;
        if (topicBonus >= 50) break;
      }
    }
    score += topicBonus;
    return { story: s, score, matchedTopic: firstMatchedTopic };
  });

  // Sort by score desc, then title asc (deterministic tiebreak)
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.story.title.localeCompare(b.story.title);
  });

  const winner = scored[0]!;
  return {
    story: winner.story,
    score: winner.score,
    rationale: buildRationale(winner.story, winner.matchedTopic, userContext.level.cefr),
  };
}
