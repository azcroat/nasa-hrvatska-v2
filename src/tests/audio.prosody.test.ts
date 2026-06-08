// src/tests/audio.prosody.test.ts
import { it, expect, vi } from 'vitest';
vi.mock('../lib/audio', async (orig) => orig());
import { speakProsody } from '../lib/audio';

it('speakProsody posts prosody to /api/tts', async () => {
  // Resolve immediately with a tiny audio blob so speakProsody doesn't hang
  // waiting for HTMLAudio playback (jsdom never fires 'ended').
  const fetchMock = vi.fn(
    async () =>
      new Response(new Blob(['x']), { status: 200, headers: { 'content-type': 'audio/mpeg' } }),
  );
  vi.stubGlobal('fetch', fetchMock);

  // Kick off speakProsody but don't await full completion — audio events don't
  // fire in jsdom, so we only need to verify the network POST body.
  const promise = speakProsody('grad', { contour: '(0%,+20%) (100%,-10%)', rate: '-20%' });
  promise.catch(() => {});

  // Poll until fetchMock has been called (the POST happens before playback).
  await vi.waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(0), { timeout: 5000 });

  const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit)?.body as string);
  expect(body.prosody).toEqual({ contour: '(0%,+20%) (100%,-10%)', rate: '-20%' });
});
