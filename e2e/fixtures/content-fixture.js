/**
 * E2E content fixture — all 6 server-side content endpoints.
 *
 * Under `vite preview` (the e2e webServer in playwright.config.js), Cloudflare
 * Pages Functions are NOT served — so every /api/content/* endpoint returns
 * 404 instead of real Bearer-gated JSON. Without this fixture, useContent /
 * useGrammar / useLessons / catalog / stories / grammar-units hooks never
 * hydrate, and any UI that consumes them (lesson screens, Story of the Day,
 * speed challenges, history Timeline, LearnPath, etc.) stays in LoadingState.
 *
 * This module re-builds the SAME payloads the production CF Functions serve.
 * It runs in node only — Playwright's page.route() intercepts the browser's
 * fetch and replies with these. Nothing here ships to the client bundle, so
 * the SP11 bundle-audit test is unaffected.
 *
 * Endpoints covered:
 *   GET /api/content/core                       → CONTENT_FIXTURE
 *   GET /api/content/grammar                    → GRAMMAR_FIXTURE
 *   GET /api/content/lessons                    → LESSONS_FIXTURE
 *   GET /api/content/catalog                    → CATALOG_FIXTURE
 *   GET /api/content/stories/{id}               → STORIES_BY_ID[id]
 *   GET /api/content/grammar-units/{id}         → GRAMMAR_UNITS_BY_ID[id]
 */
import {
  V,
  COUNTRIES,
  PROFESSIONS,
  WEATHER,
  CLOTHES,
  BODYDESC,
  TECH_VOC,
  BUREAUCRATIC,
  PROVERBS,
  HISTORY,
  KINGS,
  EVENTS,
  REGIONS,
  DIALECTS,
  SHADOWING,
  CROATIAN_CITIES,
  IDIOMS,
  BRZALICE,
  FOODORDER,
  TRANSPORT,
  GROCERY,
  RECIPES,
  PRACTICAL,
  SCENES,
  LEARN_PATH,
  SEASONAL_CAMPAIGNS,
  V_B2,
  V_C1,
  LEVEL_NARRATIVE,
} from '../../functions/api/content/_data/core.js';
import * as GRAMMAR from '../../functions/api/content/_data/grammar.js';
import { LESSONS } from '../../functions/api/content/_data/lessons.js';
import { GRADED_STORIES } from '../../functions/api/content/_data/gradedStories.js';
import { ADVANCED_UNITS } from '../../functions/api/content/_data/grammarAdvanced.js';

// /api/content/core
export const CONTENT_FIXTURE = {
  V,
  COUNTRIES,
  PROFESSIONS,
  WEATHER,
  CLOTHES,
  BODYDESC,
  TECH_VOC,
  BUREAUCRATIC,
  PROVERBS,
  HISTORY,
  KINGS,
  EVENTS,
  REGIONS,
  DIALECTS,
  SHADOWING,
  CROATIAN_CITIES,
  IDIOMS,
  BRZALICE,
  FOODORDER,
  TRANSPORT,
  GROCERY,
  RECIPES,
  PRACTICAL,
  SCENES,
  LEARN_PATH,
  SEASONAL_CAMPAIGNS,
  V_B2,
  V_C1,
  LEVEL_NARRATIVE,
};

// /api/content/grammar — mirrors functions/api/content/grammar.js buildBody
export const GRAMMAR_FIXTURE = {
  PADEZI: GRAMMAR.PADEZI,
  GRAM: GRAMMAR.GRAM,
  CONJ: GRAMMAR.CONJ,
  MODAL: GRAMMAR.MODAL,
  TENSES: GRAMMAR.TENSES,
  ASPECT: GRAMMAR.ASPECT,
  ASPECT_PAIRS: GRAMMAR.ASPECT_PAIRS,
  CONDITIONAL: GRAMMAR.CONDITIONAL,
  FORMAL_REGISTER: GRAMMAR.FORMAL_REGISTER,
  IMPERSONAL: GRAMMAR.IMPERSONAL,
  PHONOLOGY: GRAMMAR.PHONOLOGY,
  PITCH_ACCENT: GRAMMAR.PITCH_ACCENT,
  PADEZI_FULL: GRAMMAR.PADEZI_FULL,
};

// /api/content/lessons
export const LESSONS_FIXTURE = LESSONS;

// /api/content/catalog — mirrors functions/api/content/catalog.js buildCatalog
export const CATALOG_FIXTURE = {
  stories: GRADED_STORIES.map((s) => ({
    id: s.id,
    level: s.level,
    title: s.title,
    titleEn: s.titleEn,
    focus: s.focus,
    icon: s.icon,
    duration: s.duration,
    intro: s.intro,
    levelColor: s.levelColor,
    levelBg: s.levelBg,
    etag: `mock-story-${s.id}`,
  })),
  grammarUnits: ADVANCED_UNITS.map((u) => ({
    id: u.id,
    level: u.cefr,
    title: u.title,
    subtitle: u.subtitle,
    focus: u.focus,
    etag: `mock-gu-${u.id}`,
  })),
};

// /api/content/stories/{id} — id-indexed lookup
export const STORIES_BY_ID = new Map(GRADED_STORIES.map((s) => [s.id, s]));

// /api/content/grammar-units/{id} — id-indexed lookup
export const GRAMMAR_UNITS_BY_ID = new Map(ADVANCED_UNITS.map((u) => [u.id, u]));
