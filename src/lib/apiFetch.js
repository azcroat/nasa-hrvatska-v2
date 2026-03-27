import { getAuth } from 'firebase/auth';

/**
 * Wrapper around fetch that automatically includes the Firebase ID token
 * for authenticated API calls to /api/* endpoints.
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
  return fetch(url, options);
}
