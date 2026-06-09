// src/lib/nativePost.ts
// ═══════════════════════════════════════════════════════════
// Shared native-safe POST helper — R3
// ═══════════════════════════════════════════════════════════
// Generalized transport extracted from audio.ts `_ttsPost` (the only POST path
// that correctly handles Capacitor native). It is parameterized over `path` so
// any authenticated JSON endpoint (e.g. /api/tts, /api/assess-speaking) can use it.
//
// What it does (matching `_ttsPost`'s proven behavior):
//   (a) Native base-URL resolution: on Capacitor native, relative URLs resolve to
//       the bundled WebView origin (https://localhost), not the live domain, so we
//       try each absolute endpoint in `_NATIVE_ENDPOINTS` in order. Web uses ''.
//   (b) Firebase bearer: attaches `Authorization: Bearer <getFirebaseBearer()>`
//       when a signed-in user exists (so server-side auth gates pass).
//   (c) Native HTTP: uses CapacitorHttp.post() (dynamic import of @capacitor/core)
//       on native to bypass WebView fetch() failures (SSL/OEM network policy);
//       falls back to fetch() if CapacitorHttp is unavailable.
//   (d) Failover: on 5xx, try the next endpoint; on 4xx, return immediately;
//       returns null only on total transport failure so callers can fall through.
import { getFirebaseBearer, isNative, _dataUrlToArrayBuffer } from './nativeTransport.js';
import { dbgInfo, dbgWarn } from './debugLog';

export interface NativePostOpts {
  signal?: AbortSignal;
  /** 'json' (default) returns a JSON-wrapped Response; 'blob' preserves binary
   *  bodies (e.g. audio/mpeg from /api/tts) and passes through response headers. */
  responseType?: 'json' | 'blob';
  /** Response header names to preserve on the blob path (e.g. ['X-TTS-Backends']). */
  passthroughHeaders?: string[];
}

// In Capacitor native builds, relative URLs resolve to the bundled WebView server
// (https://localhost), not to the live domain. We try each endpoint in order and
// use the first one that returns a successful (or 4xx) response.
//   1. nasahrvatska.com           — production custom domain (primary)
//   2. nasa-hrvatska-v2.pages.dev — Cloudflare Pages default (always works)
const _NATIVE_ENDPOINTS = ['https://nasahrvatska.com', 'https://nasa-hrvatska-v2.pages.dev'];

type _CapHttp = {
  post: (
    o: Record<string, unknown>,
  ) => Promise<{ status: number; data: unknown; headers: Record<string, string> }>;
};

// Convert a CapacitorHttp JSON response into a standard `Response`, so callers see
// the same shape whether they ran on web fetch() or the native bridge.
function _capDataToResponse(status: number, data: unknown): Response {
  let bodyText: string;
  if (typeof data === 'string') {
    bodyText = data;
  } else if (data == null) {
    bodyText = '';
  } else {
    // CapacitorHttp auto-parses JSON responses into an object; re-serialize so the
    // returned Response's .json()/.text() behave like a normal fetch() Response.
    bodyText = JSON.stringify(data);
  }
  return new Response(bodyText, {
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
  });
}

export async function _nativePost(
  path: string,
  body: Record<string, unknown>,
  opts?: NativePostOpts,
): Promise<Response | null> {
  const endpoints = isNative() ? _NATIVE_ENDPOINTS : [''];

  // Attach Firebase Bearer token so the server-side auth gate passes. Without it,
  // authenticated endpoints return 401.
  const bearer = await getFirebaseBearer();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (bearer) {
    headers.Authorization = `Bearer ${bearer}`;
  } else {
    dbgWarn(
      `[nativePost] no Firebase user signed in — request to "${path}" will be unauthenticated`,
    );
  }

  if (isNative()) {
    // Try CapacitorHttp (native Android/iOS HTTP — bypasses WebView fetch() failures).
    let capHttp: _CapHttp | null = null;
    try {
      // Dynamic import keeps @capacitor/core out of the web bundle's main chunk.
      const capacitorModule = (await import('@capacitor/core')) as unknown as {
        CapacitorHttp?: _CapHttp;
      };
      capHttp = capacitorModule.CapacitorHttp ?? null;
      if (capHttp) dbgInfo('[nativePost] CapacitorHttp available — using native HTTP');
    } catch {
      dbgWarn('[nativePost] CapacitorHttp import failed — falling back to fetch()');
    }

    if (capHttp) {
      for (const base of endpoints) {
        const url = `${base}${path}`;
        try {
          dbgInfo(`[nativePost] CapacitorHttp POST → "${url}"`);
          const capOpts: Record<string, unknown> = { url, headers, data: body };
          if (opts?.responseType === 'blob') capOpts.responseType = 'blob';
          const resp = await capHttp.post(capOpts);
          dbgInfo(
            `[nativePost] CapacitorHttp status=${resp.status}${opts?.responseType === 'blob' ? ` data-type=${typeof resp.data}` : ''}`,
          );
          if (resp.status >= 200 && resp.status < 300) {
            if (opts?.responseType === 'blob') {
              // Mirror _ttsPost in audio.ts exactly: native bridge returns binary as
              // a base64 string; convert to Blob and build a proper Response.
              let blob: Blob;
              if (resp.data instanceof Blob) {
                blob = resp.data;
              } else if (typeof resp.data === 'string' && resp.data.length > 0) {
                const ab = _dataUrlToArrayBuffer(`data:audio/mpeg;base64,${resp.data}`);
                blob = new Blob([ab], { type: 'audio/mpeg' });
              } else {
                dbgWarn(
                  `[nativePost] CapacitorHttp blob: unexpected data type "${typeof resp.data}" len=${String(resp.data).length} — trying next`,
                );
                continue;
              }
              // Build passthrough headers from the CapacitorHttp response
              const outHeaders: Record<string, string> = { 'Content-Type': 'audio/mpeg' };
              for (const name of opts?.passthroughHeaders ?? []) {
                const val = resp.headers[name.toLowerCase()] ?? resp.headers[name] ?? '';
                outHeaders[name] = val;
              }
              return new Response(blob, { status: 200, headers: new Headers(outHeaders) });
            }
            return _capDataToResponse(resp.status, resp.data);
          }
          if (resp.status >= 400 && resp.status < 500) {
            // 4xx — bad request, don't retry other endpoints
            if (opts?.responseType === 'blob') {
              // Mirror _ttsPost ~183–188: return a minimal Response preserving status
              const h: Record<string, string> = {};
              for (const name of opts?.passthroughHeaders ?? []) {
                h[name] = resp.headers[name.toLowerCase()] ?? resp.headers[name] ?? '';
              }
              return new Response('', { status: resp.status, headers: new Headers(h) });
            }
            return _capDataToResponse(resp.status, resp.data);
          }
          // 5xx: try next endpoint
        } catch (e: unknown) {
          const err = e as Error;
          dbgWarn(
            `[nativePost] CapacitorHttp → "${url}" error: ${err?.name} — ${err?.message?.slice(0, 100)} — trying next`,
          );
        }
      }
      dbgWarn('[nativePost] CapacitorHttp: all endpoints failed');
      return null;
    }
    // CapacitorHttp unavailable — fall through to fetch()
  }

  // Web (and native fallback): standard fetch()
  for (const base of endpoints) {
    const url = `${base}${path}`;
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        ...(opts?.signal ? { signal: opts.signal } : {}),
      });
      dbgInfo(`[nativePost] fetch POST → "${url}" status=${r.status}`);
      if (r.ok) return r;
      // 4xx from server: bad request — don't retry other endpoints
      if (r.status >= 400 && r.status < 500) return r;
      // 5xx or other: try next endpoint
    } catch (e: unknown) {
      const err = e as Error;
      if (err?.name === 'AbortError') throw e; // propagate abort immediately
      dbgWarn(
        `[nativePost] fetch → "${url}" error: ${err?.name} — ${err?.message?.slice(0, 80)} — trying next`,
      );
    }
  }
  return null; // all endpoints failed
}
