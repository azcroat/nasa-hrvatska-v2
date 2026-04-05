/** Converts any Firebase UID or email to the Firestore document ID. */
export function toDocId(uid) {
  return uid.replace(/[.#$/[\]]/g, '_');
}
