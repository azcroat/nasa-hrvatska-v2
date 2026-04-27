---
name: cloudflare-pages-functions
description: Standard patterns for Cloudflare Pages Functions endpoints in the NASA Hrvatska codebase. Use this skill when creating or modifying ANY file under functions/ — new endpoints, edits to existing endpoints, middleware changes, KV namespace usage, or anything that imports from functions/_verifyToken.js or functions/_middleware.js. Documents the file-to-route mapping, the canonical endpoint template, the auth verification import and call signature, the corsHeaders shape, env var access via context.env, KV read/write with TTL, request body parsing, the standard error response format, the hard-reject pattern when credentials are missing, and the middleware chain. Trigger this even for "just a small endpoint change" — copy-pasting from a neighboring file without checking the canonical pattern is how silent regressions get introduced. The hard-reject pattern in particular was applied across 5 files recently and must stay consistent.
---

# Cloudflare Pages Functions — Endpoint Patterns

Every endpoint in `functions/` follows the same shape. The shape is here. Deviations from it should be deliberate and noted in the PR.

## File-to-route mapping

Cloudflare Pages Functions maps the filesystem to URLs:

```
functions/api/sync.js              →  /api/sync
functions/api/srs/[deckId].js      →  /api/srs/<deckId>      (param)
functions/api/auth/[[path]].js     →  /api/auth/<anything>   (catch-all)
functions/_middleware.js           →  runs for everything beneath this directory
functions/_verifyToken.js          →  shared helper, NOT a route (leading underscore)
```

Files starting with `_` are never routes. Use that convention for shared helpers (`_verifyToken.js`, `_corsHeaders.js`, etc.) and for middleware (`_middleware.js`). Putting a helper at a non-underscored path exposes it as an endpoint, which has bitten this codebase before.

A handler file exports HTTP-method-named functions:

```js
export async function onRequestPost(context) { ... }
export async function onRequestOptions(context) { ... }   // CORS preflight
export async function onRequestGet(context) { ... }
// or, for any method:
export async function onRequest(context) { ... }
```

The `context` argument is where everything you need lives.

## What's in `context`

```js
context.request   // a standard Request object
context.env       // bindings: env vars, KV namespaces, secrets
context.params    // route parameters from [bracketed] filenames
context.next      // pass-through to the next handler (used in middleware)
context.waitUntil // schedule background work past the response
```

Read env vars directly off `context.env`. Anything declared in `wrangler.toml` or set as a secret in the Cloudflare dashboard is on this object. There is no `process.env` in Pages Functions.

## The canonical endpoint template

Copy this whole block when creating a new endpoint. Don't pick and choose pieces — every line is here for a reason. After pasting, fill in the body of `onRequestPost` with your actual logic.

```js
import { verifyToken } from "../_verifyToken.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context) {
  try {
    // 1. Hard-reject if required credentials/config are missing.
    //    Better to fail loud at the endpoint than produce a silent 500 deeper.
    if (!context.env.FIREBASE_PROJECT_ID || !context.env.FIREBASE_CLIENT_EMAIL) {
      return jsonError("server_misconfigured", 500);
    }

    // 2. Verify the bearer token. verifyToken throws on failure.
    let claims;
    try {
      claims = await verifyToken(context.request, context.env);
    } catch (err) {
      return jsonError("unauthorized", 401);
    }
    const uid = claims.uid;

    // 3. Parse the body. Catch malformed JSON early.
    let body;
    try {
      body = await context.request.json();
    } catch {
      return jsonError("invalid_json", 400);
    }

    // 4. Your endpoint logic. Use context.env for KV, secrets, project ids.
    //    Example KV read:
    //    const cached = await context.env.MY_KV.get(`u:${uid}:state`);
    //    Example KV write with 1-hour TTL:
    //    await context.env.MY_KV.put(`u:${uid}:state`, JSON.stringify(value), { expirationTtl: 3600 });

    const result = { ok: true /* ... */ };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    // Last-resort catch. Log to Cloudflare's tail, return a generic 500 to the client.
    console.error("endpoint failure", err);
    return jsonError("internal_error", 500);
  }
}

function jsonError(code, status) {
  return new Response(JSON.stringify({ error: code }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

This template encodes seven decisions:
1. Hard-reject when env config is missing, before doing any work.
2. Auth verification before anything else, with a 401 (not 500) on failure.
3. Body parsing wrapped in try/catch with a 400 on malformed input.
4. CORS headers on every response, including errors.
5. A standard error envelope: `{ error: "code" }` with an HTTP status that matches.
6. A top-level try/catch that logs to Cloudflare tail and returns a 500.
7. CORS preflight handler in the same file (Cloudflare requires this; it doesn't auto-handle OPTIONS).

## `_verifyToken` usage

The shared helper at `functions/_verifyToken.js` validates the Firebase ID token in the `Authorization: Bearer <token>` header. The expected call signature:

```js
import { verifyToken } from "../_verifyToken.js";
// from deeper paths, adjust the relative import:
import { verifyToken } from "../../_verifyToken.js";

const claims = await verifyToken(context.request, context.env);
// claims.uid is the verified Firebase user id
// throws on missing token, malformed token, expired token, or signature mismatch
```

Always wrap the call in its own try/catch and convert the throw into a 401 response. Don't let `verifyToken` errors fall through to the outer 500 handler — that produces incorrect status codes (auth failures should be 401, not 500) and confuses the frontend's error handling.

**Before using this helper in a new file**, briefly open `_verifyToken.js` and confirm the exported name and arguments match. If the helper has been updated to take a third parameter (e.g. an audience claim) or returns something other than the raw claims, the template above needs to match.

## CORS headers — the exact shape

Use the same `corsHeaders` object in every endpoint. Variations have caused real bugs (one endpoint allowing only POST, another allowing GET, a third missing `Authorization` in `Access-Control-Allow-Headers`).

The required fields:

| Field | Value | Why |
|---|---|---|
| `Access-Control-Allow-Origin` | `*` or the exact production origin | Permissive `*` is fine for endpoints behind auth; lock down only if the endpoint serves credentials with `Access-Control-Allow-Credentials: true`. |
| `Access-Control-Allow-Methods` | The methods the endpoint actually handles, plus `OPTIONS` | The browser preflight checks this. |
| `Access-Control-Allow-Headers` | At minimum `Content-Type, Authorization` | Any additional custom header the frontend sends must be listed here. |
| `Access-Control-Max-Age` | `86400` (24 hours) | Tells the browser how long to cache the preflight result. |

If you need credentials (`Access-Control-Allow-Credentials: true`), `Access-Control-Allow-Origin` cannot be `*` — it must be the exact origin string. This codebase uses bearer tokens in the Authorization header, not cookies, so credentials mode is generally not needed.

## Reading env vars and secrets

```js
const projectId = context.env.FIREBASE_PROJECT_ID;
const clientEmail = context.env.FIREBASE_CLIENT_EMAIL;
const privateKey = context.env.FIREBASE_PRIVATE_KEY;
```

There's no `process.env` and no `.env` file at runtime. Bindings come from:
- `wrangler.toml` for non-secrets (set with `[vars]` blocks).
- The Cloudflare dashboard or `wrangler secret put` for secrets.

KV namespaces are also bindings:

```js
const cached = await context.env.MY_KV.get("some-key");
```

If you reference an env binding that isn't configured, it's `undefined` at runtime — there's no error at deploy time. That's why the hard-reject pattern (next section) is critical.

## Hard-reject when credentials are missing

This pattern was applied across 5 files recently and must stay consistent. The principle: an endpoint that reaches its main logic without required env vars is in an undefined state. Return early with a 500 and a specific error code rather than letting the failure surface as a confusing downstream error.

```js
if (!context.env.FIREBASE_PROJECT_ID || !context.env.FIREBASE_CLIENT_EMAIL) {
  return jsonError("server_misconfigured", 500);
}
```

Do this check FIRST in the handler, before auth verification, body parsing, or anything else. Two reasons:
1. If env is misconfigured, auth verification will fail in a way that looks like a token problem but isn't — the operator will spend time debugging the wrong thing.
2. The 500 with `server_misconfigured` is grep-able in Cloudflare logs. A confused 401 is not.

The exact list of vars to check is per-endpoint. Most endpoints in this codebase need at least the Firebase Admin SDK trio (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`). Endpoints that read or write KV also need their KV binding to exist (`!context.env.MY_KV` is the check).

## KV — read and write with TTL

```js
// Read. Returns null if the key doesn't exist (does not throw).
const raw = await context.env.MY_KV.get(`u:${uid}:state`);
const state = raw ? JSON.parse(raw) : null;

// Write with TTL.
await context.env.MY_KV.put(
  `u:${uid}:state`,
  JSON.stringify(state),
  { expirationTtl: 3600 }   // 1 hour, in seconds
);

// Write without TTL (persists indefinitely; use sparingly).
await context.env.MY_KV.put(`config:flags`, JSON.stringify(flags));

// Delete.
await context.env.MY_KV.delete(`u:${uid}:state`);

// List by prefix.
const list = await context.env.MY_KV.list({ prefix: `u:${uid}:` });
```

Three things that bite people:
1. KV is eventually consistent. A `put` followed immediately by a `get` from a different edge location may not see the write for up to 60 seconds. Don't use KV as the source of truth for anything that requires read-after-write consistency.
2. KV values are strings. JSON-encode on the way in, parse on the way out. There's no built-in JSON helper.
3. The minimum TTL is 60 seconds. `expirationTtl: 30` is silently treated as 60.

## Request body parsing

```js
let body;
try {
  body = await context.request.json();
} catch {
  return jsonError("invalid_json", 400);
}
```

Always wrap in try/catch. A client sending malformed JSON without this guard produces a 500 (because `request.json()` throws), which misleads the frontend's error handling.

For form data: `await context.request.formData()`. For raw text: `await context.request.text()`. Same try/catch principle applies.

## Standard error response format

The frontend expects this exact shape:

```json
{ "error": "snake_case_code" }
```

With an HTTP status code that matches the semantic meaning of the error:

| Status | When | Example codes |
|---|---|---|
| 400 | Client sent invalid input | `invalid_json`, `missing_field`, `bad_param` |
| 401 | Auth failed or missing | `unauthorized`, `expired_token` |
| 403 | Authenticated but not allowed | `forbidden`, `not_owner` |
| 404 | Resource doesn't exist | `not_found` |
| 429 | Rate limited | `rate_limited` |
| 500 | Server bug or misconfiguration | `server_misconfigured`, `internal_error` |

Frontend code switches on the `error` string. Don't put human-readable messages in the `error` field; use a stable code that the UI translates. If you need to include extra detail, add a separate field (e.g. `{ "error": "missing_field", "field": "deckId" }`).

## The middleware chain

`functions/_middleware.js` runs before every handler in its directory subtree. The chain pattern:

```js
export async function onRequest(context) {
  // pre-handler work, e.g. attach a request id, log timing
  const start = Date.now();

  const response = await context.next();

  // post-handler work, e.g. add response headers, log duration
  const duration = Date.now() - start;
  response.headers.set("X-Request-Duration", String(duration));
  return response;
}
```

What middleware in this codebase typically provides to downstream handlers (consult `_middleware.js` for the actual current set):
- A request id attached to the request for log correlation.
- Common security headers on the response.
- Optionally, attempts at auth verification so handlers can read claims off the context — but the canonical template above re-verifies in the handler itself, which is the safer pattern when in doubt.

**Don't put endpoint-specific logic in middleware.** It runs for every route in the subtree. If only one handler needs it, put it in that handler.

## Pre-flight checklist before merging a `functions/` change

1. CORS preflight (`onRequestOptions`) is exported and returns the same `corsHeaders`.
2. The hard-reject for missing env vars is the first thing in the handler.
3. Auth verification is in its own try/catch returning 401 on failure.
4. Body parsing is in its own try/catch returning 400 on failure.
5. The error envelope is `{ error: "snake_case_code" }`.
6. Every error response includes `corsHeaders` (otherwise the browser swallows the body).
7. New env bindings are documented in `wrangler.toml` AND set in the dashboard for production.
8. KV writes have a TTL unless the data is genuinely permanent.

## Keeping this skill current

If `_verifyToken.js` changes its signature, if a new shared helper appears, or if the error envelope shape changes, update this skill in the same PR. Endpoints copy from here; if "here" is wrong, the whole codebase drifts.
