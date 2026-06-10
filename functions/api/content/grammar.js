import { authedRead } from './_authedRead.js';
import { ETAGS } from './_data/_etags.js';
import * as GRAMMAR from './_data/grammar.js';

function buildBody() {
  return {
    data: {
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
      VERBS: GRAMMAR.VERBS,
    },
  };
}

export async function onRequestGet(context) {
  return authedRead({
    request: context.request,
    env: context.env,
    etag: ETAGS.grammar,
    buildBody,
  });
}

export const onRequestOptions = onRequestGet;
