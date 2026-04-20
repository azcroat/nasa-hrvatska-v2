/**
 * Q-3: PBKDF2 password hashing — Web Crypto API
 *
 * Authentication passwords are handled by Firebase Auth (server-side, bcrypt).
 * This module provides PBKDF2 for any locally-hashed sensitive data
 * (e.g. offline PIN, local account tokens).
 */

const SALT = 'nasa-hrvatska-salt-v1';

/**
 * Hash a password using PBKDF2 (100k iterations, SHA-256, 256-bit output).
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const salt = encoder.encode(SALT);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  return Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Legacy SHA-256 hash (used only for migration detection).
 */
async function hashPasswordSHA256(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify a password against a stored hash.
 * Tries PBKDF2 first; if that fails, tries SHA-256 (legacy migration).
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
  onMigrate?: (newHash: string) => void,
): Promise<boolean> {
  const pbkdf2Hash = await hashPassword(password);
  if (pbkdf2Hash === storedHash) return true;

  const sha256Hash = await hashPasswordSHA256(password);
  if (sha256Hash === storedHash) {
    if (typeof onMigrate === 'function') {
      onMigrate(pbkdf2Hash);
    }
    return true;
  }

  return false;
}
