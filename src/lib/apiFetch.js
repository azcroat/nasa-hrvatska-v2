import { getAuth } from 'firebase/auth';

/**
 * Wrapper around fetch that automatically includes the Firebase ID token
 * for authenticated API calls to /api/* endpoints.
 * Applies a 30-second default timeout to prevent permanent loading spinners.
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

  // Apply timeout unless the caller has already set a signal
  if (!options.signal) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  return fetch(url, options);
}
