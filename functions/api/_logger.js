/* eslint-disable no-console */
/**
 * Structured JSON logger for Cloudflare Pages Functions.
 *
 * All output is written to console as single-line JSON, which Cloudflare
 * Workers logs (and any log drain / tail worker) can parse and filter.
 *
 * Usage:
 *   import { log, logError, logWarn } from './_logger.js';
 *
 *   log('tts', 'Cache hit', { voice: 'gabrijela', textLen: text.length });
 *   logWarn('scene-video', 'Pexels quota low', { remaining: 5 });
 *   logError('ai-chat', 'Claude upstream error', err, { uid, statusCode: 500 });
 */

/**
 * @param {'info'|'warn'|'error'} level
 * @param {string} endpoint   - Function name (e.g. 'tts', 'ai-chat')
 * @param {string} message    - Human-readable summary
 * @param {object} [extras]   - Structured key-value pairs (safe to log)
 */
function write(level, endpoint, message, extras = {}) {
  const entry = {
    ts:       new Date().toISOString(),
    level,
    endpoint,
    message,
    ...extras,
  };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export function log(endpoint, message, extras)      { write('info',  endpoint, message, extras); }
export function logWarn(endpoint, message, extras)  { write('warn',  endpoint, message, extras); }
export function logError(endpoint, message, error, extras = {}) {
  write('error', endpoint, message, {
    error: error?.message || String(error),
    stack: error?.stack?.split('\n')[0], // first line only — avoid log noise
    ...extras,
  });
}

/**
 * Wrap an async handler with automatic timing + error logging.
 * Returns a new function that logs duration on every call.
 *
 * @param {string} endpoint
 * @param {function} handler  - async ({ request, env, ...rest }) => Response
 */
export function withLogging(endpoint, handler) {
  return async function(...args) {
    const start = Date.now();
    try {
      const result = await handler(...args);
      log(endpoint, 'Request completed', { ms: Date.now() - start, status: result?.status });
      return result;
    } catch (err) {
      logError(endpoint, 'Unhandled exception', err, { ms: Date.now() - start });
      throw err;
    }
  };
}
