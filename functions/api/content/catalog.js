import { authedRead } from './_authedRead.js';
import { ETAGS } from './_data/_etags.js';
import { GRADED_STORIES } from './_data/gradedStories.js';
import { ADVANCED_UNITS } from './_data/grammarAdvanced.js';

// Display metadata fields safe to expose in the catalog. The IP (paragraphs,
// vocabulary, quiz, intro, drills, examples, forms, tips) stays server-only —
// reachable only via /api/content/stories/{id} and /api/content/grammar-units/{id}.
function buildCatalog() {
  const stories = GRADED_STORIES.map((s) => ({
    id: s.id,
    level: s.level,
    title: s.title,
    titleEn: s.titleEn,
    focus: s.focus,
    icon: s.icon,
    duration: s.duration,
    intro: s.intro, // English-language teaser summary (~100 chars), not curriculum prose
    levelColor: s.levelColor,
    levelBg: s.levelBg,
    etag: ETAGS.stories[s.id],
  }));
  // Grammar units use `cefr` field name internally; expose as `level` for stable contract.
  const grammarUnits = ADVANCED_UNITS.map((u) => ({
    id: u.id,
    level: u.cefr,
    title: u.title,
    subtitle: u.subtitle,
    focus: u.focus,
    etag: ETAGS.grammarUnits[u.id],
  }));
  return { data: { stories, grammarUnits } };
}

export async function onRequestGet(context) {
  return authedRead({
    request: context.request,
    env: context.env,
    etag: ETAGS.catalog,
    buildBody: buildCatalog,
  });
}

export async function onRequestOptions(context) {
  return authedRead({
    request: context.request,
    env: context.env,
    etag: ETAGS.catalog,
    buildBody: buildCatalog,
  });
}
