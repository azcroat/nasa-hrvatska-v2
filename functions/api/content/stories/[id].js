import { authedRead } from '../_authedRead.js';
import { ETAGS } from '../_data/_etags.js';
import { GRADED_STORIES } from '../_data/gradedStories.js';

const STORY_BY_ID = new Map(GRADED_STORIES.map((s) => [s.id, s]));

export async function onRequestGet(context) {
  const { id } = context.params;
  const story = STORY_BY_ID.get(id);
  const etag = ETAGS.stories[id];

  if (!story || !etag) {
    return new Response(JSON.stringify({ error: 'not_found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return authedRead({
    request: context.request,
    env: context.env,
    etag,
    buildBody: () => ({ data: story }),
  });
}

export const onRequestOptions = onRequestGet;
