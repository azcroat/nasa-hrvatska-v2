/**
 * Q-3: PBKDF2 password hashing — Web Crypto API
 *
 * Authentication passwords are handled by Firebase Auth (server-side, bcrypt).
 * This module provides PBKDF2 for any locally-hashed sensitive data
 * (e.g. offline PIN, local account tokens).
 *
 * Backward-compatibility strategy:
 *   On login: try PBKDF2 first. If no match, try SHA-256 (legacy).
 *   On SHA-256 match: migrate silently — save PBKDF2 hash, return success.
 *   On registration: PBKDF2 only.
 *
 * Note: SHA-256 was removed from the auth flow in a prior security migration
 * (all auth now goes through Firebase). PBKDF2 is available here for any
 * future local-data protection needs.
 */

const SALT = 'nasa-hrvatska-salt-v1';

/**
 * Hash a password using PBKDF2 (100k iterations, SHA-256, 256-bit output).
 * @param {string} password
 * @returns {Promise<string>} hex string
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const salt = encoder.encode(SALT);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(bits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Legacy SHA-256 hash (used only for migration detection).
 * @param {string} password
 * @returns {Promise<string>} hex string
 */
async function hashPasswordSHA256(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify a password against a stored hash.
 * Tries PBKDF2 first; if that fails, tries SHA-256 (legacy migration).
 *
 * @param {string} password   — plaintext input
 * @param {string} storedHash — hex hash from storage
 * @param {function} [onMigrate] - called with the new PBKDF2 hash if migration happens
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, storedHash, onMigrate) {
  // Try PBKDF2 first
  const pbkdf2Hash = await hashPassword(password);
  if (pbkdf2Hash === storedHash) return true;

  // Try legacy SHA-256
  const sha256Hash = await hashPasswordSHA256(password);
  if (sha256Hash === storedHash) {
    // Migrate: replace stored hash with PBKDF2
    if (typeof onMigrate === 'function') {
      onMigrate(pbkdf2Hash);
    }
    return true;
  }

  return false;
}
