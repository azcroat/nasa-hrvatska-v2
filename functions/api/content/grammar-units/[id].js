import { authedRead } from '../_authedRead.js';
import { ETAGS } from '../_data/_etags.js';
import { ADVANCED_UNITS } from '../_data/grammarAdvanced.js';

const UNIT_BY_ID = new Map(ADVANCED_UNITS.map((u) => [u.id, u]));

export async function onRequestGet(context) {
  const { id } = context.params;
  const unit = UNIT_BY_ID.get(id);
  const etag = ETAGS.grammarUnits[id];

  if (!unit || !etag) {
    return new Response(JSON.stringify({ error: 'not_found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return authedRead({
    request: context.request,
    env: context.env,
    etag,
    buildBody: () => ({ data: unit }),
  });
}

export const onRequestOptions = onRequestGet;
