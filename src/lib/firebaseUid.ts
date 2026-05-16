// Tiny helper so contentClient can ask "what UID's IDB namespace should I use"
// without pulling all of audio.ts in.
//
// Dynamic import matches the pattern used in audio.ts (_getFirebaseBearer),
// which avoids forcing firebase/auth into every consumer's bundle.
export async function getCurrentUid(): Promise<string | null> {
  try {
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const u = auth.currentUser;
    return u?.uid ?? null;
  } catch {
    return null;
  }
}
