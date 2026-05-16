import { authedRead } from './_authedRead.js';
import { ETAGS } from './_data/_etags.js';
import { GRADED_STORIES } from './_data/gradedStories.js';
import { ADVANCED_UNITS } from './_data/grammarAdvanced.js';

function buildCatalog() {
  const stories = GRADED_STORIES.map((s) => ({
    id: s.id,
    level: s.level,
    title: s.title,
    etag: ETAGS.stories[s.id],
  }));
  // Grammar units use `cefr` field name internally; expose as `level` for stable contract.
  const grammarUnits = ADVANCED_UNITS.map((u) => ({
    id: u.id,
    level: u.cefr,
    title: u.title,
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
