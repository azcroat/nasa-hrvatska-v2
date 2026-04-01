import { getAuth } from 'firebase/auth';

/**
 * Wrapper around fetch that automatically includes the Firebase ID token
 * for authenticated API calls to /api/* endpoints.
 *
 * Applies a 30-second default timeout to prevent permanent loading spinners.
 * Automatically retries up to 2 times on network errors (not HTTP errors,
 * not aborts) with exponential backoff — but only when the caller has NOT
 * provided their own AbortSignal (to respect caller-controlled timeouts).
 */
export async function apiFetch(url, options = {}) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      };
    }
  } catch {
    // If token fetch fails, send request without auth (rate limiting still protects)
  }

  // If caller supplies their own signal, respect it exactly — no retry wrapping
  if (options.signal) {
    return fetch(url, options);
  }

  // Managed path: internal timeout + retry on transient network errors
  const MAX_RETRIES = 2;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      const isNetworkError = err instanceof TypeError;
      const isAbort = err?.name === 'AbortError';
      // Don't retry user-aborts or our own 30 s timeout, and don't retry past the limit
      if (isAbort || !isNetworkError || attempt === MAX_RETRIES) throw err;
      // Exponential backoff: 500 ms, 1000 ms
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500));
    }
  }
}
