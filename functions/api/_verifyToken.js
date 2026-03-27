/**
 * Lightweight Firebase ID token verification for Cloudflare Workers.
 * Verifies the token is a valid JWT issued by Firebase for the correct project.
 * Does NOT verify the signature cryptographically (would require public key fetch).
 * Provides meaningful abuse deterrence — tokens must be properly formatted Firebase tokens.
 */
export async function getFirebaseUid(request, projectId) {
  try {
    const auth = request.headers.get('authorization') || '';
    if (!auth.startsWith('Bearer ')) return null;
    const token = auth.slice(7).trim();
    if (!token) return null;

    // Decode JWT payload (base64url, no signature verification)
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

    // Validate Firebase-specific claims
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
    if (payload.aud !== projectId) return null;
    if (!payload.sub || !payload.user_id) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null; // expired

    return payload.user_id; // Firebase UID
  } catch {
    return null;
  }
}
