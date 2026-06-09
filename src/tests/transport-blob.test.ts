// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/audio.js', () => ({
  isNative: () => false,
  getFirebaseBearer: async () => 'tok',
  _dataUrlToArrayBuffer: (u: string) => {
    const b64 = u.slice(u.indexOf(',') + 1);
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  },
}));

import { _nativePost } from '../lib/nativePost';

describe('_nativePost blob responseType', () => {
  beforeEach(() => {
    global.fetch = vi.fn(
      async () =>
        new Response(new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/mpeg' }), {
          status: 200,
          headers: { 'Content-Type': 'audio/mpeg', 'X-TTS-Backends': 'azure' },
        }),
    ) as unknown as typeof fetch;
  });

  it('returns the raw Response (blob preserved) when responseType is blob', async () => {
    const res = await _nativePost('/api/tts', { text: 'bok' }, { responseType: 'blob' });
    expect(res).not.toBeNull();
    expect(res!.headers.get('Content-Type')).toBe('audio/mpeg');
    const buf = await res!.arrayBuffer();
    expect(buf.byteLength).toBe(3);
  });
});
