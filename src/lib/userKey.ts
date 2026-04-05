/**
 * Converts any Firebase UID or email to the Firestore document ID used app-wide.
 * Centralises the scattered uid.replace(/[.#$\/\[\]]/g, '_') calls.
 */
export function toDocId(uid: string): string {
  return uid.replace(/[.#$/[\]]/g, '_');
}
