// src/lib/aiPost.ts
// SP5: shared wrapper for AI endpoint POST requests.
// Attaches a Firebase Bearer token (when available) and the userContext payload.

import { getFirebaseBearer } from './audio';
import { buildUserContext } from './userContext';

export interface AiPostOptions {
  skipUserContext?: boolean;
}

export async function _aiPost(
  path: string,
  body: Record<string, unknown>,
  opts?: AiPostOptions,
): Promise<Response> {
  const bearer = await getFirebaseBearer();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (bearer) headers.Authorization = 'Bearer ' + bearer;

  const enrichedBody = opts?.skipUserContext ? body : { ...body, userContext: buildUserContext() };

  return fetch(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(enrichedBody),
  });
}
