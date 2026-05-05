/** Converts any Firebase UID or email to the Firestore document ID. */
export function toDocId(uid) {
  // Replace ALL non-alphanumeric characters (including '/', null bytes, etc.)
  // to prevent KV key injection or Firestore path traversal.
  return uid.replace(/[^a-zA-Z0-9_-]/g, '_');
}
