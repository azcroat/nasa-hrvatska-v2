import { authedRead } from './_authedRead.js';
import { ETAGS } from './_data/_etags.js';
import * as CORE from './_data/core.js';

const KEYS = [
  'V',
  'COUNTRIES',
  'PROFESSIONS',
  'WEATHER',
  'CLOTHES',
  'BODYDESC',
  'TECH_VOC',
  'BUREAUCRATIC',
  'PROVERBS',
  'IDIOMS',
  'BRZALICE',
  'HISTORY',
  'EVENTS',
  'KINGS',
  'REGIONS',
  'DIALECTS',
  'CROATIAN_CITIES',
  'FOODORDER',
  'TRANSPORT',
  'GROCERY',
  'RECIPES',
  'PRACTICAL',
  'SCENES',
  'LEVEL_NARRATIVE',
  'SHADOWING',
];

function buildBody() {
  const data = {};
  for (const k of KEYS) data[k] = CORE[k];
  return { data };
}

export async function onRequestGet(context) {
  return authedRead({
    request: context.request,
    env: context.env,
    etag: ETAGS.core,
    buildBody,
  });
}

export const onRequestOptions = onRequestGet;
