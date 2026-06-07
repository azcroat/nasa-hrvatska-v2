// src/lib/speaking/__tests__/whisperClaudeScorer.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the bearer source so no Firebase is needed.
vi.mock('../../audio.js', () => ({ getFirebaseBearer: vi.fn(async () => 'tok123') }));

import { whisperClaudeScorer } from '../whisperClaudeScorer.js';

function blob() {
  return new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'audio/webm' });
}

describe('whisperClaudeScorer', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('posts audio with a Bearer token and maps a 200 response to an assessment', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            transcript: 'Bok',
            scores: { range: 0.8, accuracy: 0.8, fluency: 0.8, task: 0.8 },
            confidence: 0.9,
          }),
          { status: 200 },
        ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await whisperClaudeScorer.assess(blob(), {
      level: 'B1',
      prompt: 'Opišite putovanje.',
    });
    expect(res).not.toBeNull();
    expect(res!.transcript).toBe('Bok');
    expect(res!.overall).toBeCloseTo(0.8, 5);
    const call = (fetchMock.mock.calls as unknown as [string, RequestInit][])[0]!;
    expect(call[1].headers).toMatchObject({ Authorization: 'Bearer tok123' });
  });

  it('returns null on a non-200 response (fairness: never a failing score)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 502 })),
    );
    const res = await whisperClaudeScorer.assess(blob(), { level: 'B1', prompt: 'x' });
    expect(res).toBeNull();
  });

  it('returns null on a network throw', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );
    const res = await whisperClaudeScorer.assess(blob(), { level: 'B1', prompt: 'x' });
    expect(res).toBeNull();
  });

  it('returns null when confidence is below the usable floor', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              transcript: '',
              scores: { range: 0.9, accuracy: 0.9, fluency: 0.9, task: 0.9 },
              confidence: 0.1,
            }),
            { status: 200 },
          ),
      ),
    );
    const res = await whisperClaudeScorer.assess(blob(), { level: 'B1', prompt: 'x' });
    expect(res).toBeNull();
  });
});
