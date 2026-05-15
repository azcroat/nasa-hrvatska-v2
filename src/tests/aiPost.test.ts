// src/tests/aiPost.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { _aiPost } from '../lib/aiPost';

vi.mock('../lib/audio', () => ({
  getFirebaseBearer: vi.fn(async () => 'fake-bearer-token'),
}));

vi.mock('../lib/userContext', () => ({
  buildUserContext: vi.fn(() => ({ version: 1, level: { cefr: 'B1', xp: 1500, streak: 6 } })),
}));

describe('_aiPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('attaches userContext to the request body by default', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));
    await _aiPost('/api/correct', { text: 'hello' });
    const call = fetchSpy.mock.calls[0]!;
    const sentBody = JSON.parse((call[1] as RequestInit).body as string);
    expect(sentBody.text).toBe('hello');
    expect(sentBody.userContext).toBeDefined();
    expect(sentBody.userContext.version).toBe(1);
  });

  it('attaches Authorization Bearer header from getFirebaseBearer', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));
    await _aiPost('/api/correct', { text: 'hello' });
    const call = fetchSpy.mock.calls[0]!;
    const headers = (call[1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer fake-bearer-token');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('omits userContext when skipUserContext is true', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));
    await _aiPost('/api/correct', { text: 'hello' }, { skipUserContext: true });
    const sentBody = JSON.parse((fetchSpy.mock.calls[0]![1] as RequestInit).body as string);
    expect(sentBody.userContext).toBeUndefined();
  });

  it('omits Authorization header when getFirebaseBearer returns null', async () => {
    const audio = (await import('../lib/audio')) as unknown as {
      getFirebaseBearer: () => Promise<string | null>;
    };
    vi.mocked(audio.getFirebaseBearer).mockResolvedValueOnce(null);
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));
    await _aiPost('/api/correct', { text: 'hello' });
    const headers = (fetchSpy.mock.calls[0]![1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });
});
