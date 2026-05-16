import { authedRead } from './_authedRead.js';
import { ETAGS } from './_data/_etags.js';
import { LESSONS } from './_data/lessons.js';

export async function onRequestGet(context) {
  return authedRead({
    request: context.request,
    env: context.env,
    etag: ETAGS.lessons,
    buildBody: () => ({ data: LESSONS }),
  });
}

export const onRequestOptions = onRequestGet;
