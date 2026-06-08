// src/lib/speaking/__tests__/whisperClaudeScorer.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// The scorer now routes through the shared native-safe POST helper. Mock it so we
// control the transport result (a Response, or null on total transport failure).
vi.mock('../../nativePost', () => ({ _nativePost: vi.fn() }));

import { whisperClaudeScorer } from '../whisperClaudeScorer.js';
import { _nativePost } from '../../nativePost';

const nativePostMock = _nativePost as ReturnType<typeof vi.fn>;

function blob() {
  return new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'audio/webm' });
}

describe('whisperClaudeScorer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    nativePostMock.mockReset();
  });

  it('posts to /api/assess-speaking via _nativePost with the expected body fields', async () => {
    nativePostMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          transcript: 'Bok',
          scores: { range: 0.8, accuracy: 0.8, fluency: 0.8, task: 0.8 },
          confidence: 0.9,
        }),
        { status: 200 },
      ),
    );

    await whisperClaudeScorer.assess(blob(), {
      level: 'B1',
      prompt: 'Opišite putovanje.',
    });

    expect(nativePostMock).toHaveBeenCalledTimes(1);
    const [path, body] = nativePostMock.mock.calls[0] as unknown as [
      string,
      Record<string, unknown>,
    ];
    expect(path).toBe('/api/assess-speaking');
    expect(body.level).toBe('B1');
    expect(body.prompt).toBe('Opišite putovanje.');
    expect(typeof body.audioBase64).toBe('string');
    expect((body.audioBase64 as string).length).toBeGreaterThan(0);
  });

  it('maps a 200 response to an assessment', async () => {
    nativePostMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          transcript: 'Bok',
          scores: { range: 0.8, accuracy: 0.8, fluency: 0.8, task: 0.8 },
          confidence: 0.9,
        }),
        { status: 200 },
      ),
    );

    const res = await whisperClaudeScorer.assess(blob(), {
      level: 'B1',
      prompt: 'Opišite putovanje.',
    });
    expect(res).not.toBeNull();
    expect(res!.transcript).toBe('Bok');
    expect(res!.overall).toBeCloseTo(0.8, 5);
  });

  it('returns null on a non-200 response (fairness: never a failing score)', async () => {
    nativePostMock.mockResolvedValue(new Response('nope', { status: 502 }));
    const res = await whisperClaudeScorer.assess(blob(), { level: 'B1', prompt: 'x' });
    expect(res).toBeNull();
  });

  it('returns null on total transport failure (_nativePost returns null)', async () => {
    nativePostMock.mockResolvedValue(null);
    const res = await whisperClaudeScorer.assess(blob(), { level: 'B1', prompt: 'x' });
    expect(res).toBeNull();
  });

  it('returns null when required score fields are missing (partial body)', async () => {
    nativePostMock.mockResolvedValue(
      new Response(JSON.stringify({ transcript: 'x', scores: { range: 0.9 }, confidence: 0.9 }), {
        status: 200,
      }),
    );
    const res = await whisperClaudeScorer.assess(blob(), { level: 'B1', prompt: 'x' });
    expect(res).toBeNull();
  });

  it('returns null when confidence is below the usable floor', async () => {
    nativePostMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          transcript: '',
          scores: { range: 0.9, accuracy: 0.9, fluency: 0.9, task: 0.9 },
          confidence: 0.1,
        }),
        { status: 200 },
      ),
    );
    const res = await whisperClaudeScorer.assess(blob(), { level: 'B1', prompt: 'x' });
    expect(res).toBeNull();
  });
});
