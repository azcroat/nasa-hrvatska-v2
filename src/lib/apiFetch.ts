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
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  } catch (tokenErr: unknown) {
    const err = tokenErr as Error | undefined;
    console.error('[apiFetch] Failed to get auth token:', err?.message);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('nh:auth-token-error', { detail: { url, error: err?.message } }),
      );
    }
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
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isNetworkError = err instanceof TypeError;
      const isAbort = (err as Error)?.name === 'AbortError';
      if (isAbort || !isNetworkError || attempt === MAX_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500));
    }
  }
  // Should never reach here — loop either returns or throws
  throw new Error('apiFetch: max retries exceeded');
}
