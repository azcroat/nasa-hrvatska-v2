// src/tests/_userContext.render.test.js
import { describe, it, expect } from 'vitest';
import { renderContextPrompt } from '../../functions/api/_userContext.js';

const validCtx = {
  version: 1,
  generatedAt: Date.now(),
  level: { cefr: 'B1', xp: 1840, streak: 6 },
  weakTopics: [
    { topic: 'accusative', accuracy: 0.42, attempts: 19 },
    { topic: 'aspect-imperfective', accuracy: 0.51, attempts: 12 },
  ],
  recentErrors: [
    {
      topic: 'accusative',
      prompt: 'Vidim ____ knjigu',
      userAnswer: 'knjiga',
      correctAnswer: 'knjigu',
      minutesAgo: 5,
    },
  ],
  vocab: { learned: 540, dueToday: 28, hardest: ['studeni', 'cekati', 'brijac'] },
};

describe('renderContextPrompt', () => {
  it('returns empty string when ctx is null', () => {
    expect(renderContextPrompt(null, 'correct')).toBe('');
  });

  it('returns empty string when kind is unknown', () => {
    expect(renderContextPrompt(validCtx, 'unknown-kind')).toBe('');
  });

  it('diagnostic kind includes CEFR, weak topics, recent errors, and vocab summary', () => {
    const prose = renderContextPrompt(validCtx, 'correct');
    expect(prose).toContain('B1');
    expect(prose).toContain('accusative');
    expect(prose).toContain('42');
    expect(prose).toContain('knjigu');
    expect(prose).toContain('540');
    expect(prose).toContain('studeni');
  });

  it('explain-error and grammar-diagnosis use the same diagnostic framing', () => {
    expect(renderContextPrompt(validCtx, 'explain-error')).toBe(
      renderContextPrompt(validCtx, 'correct'),
    );
    expect(renderContextPrompt(validCtx, 'grammar-diagnosis')).toBe(
      renderContextPrompt(validCtx, 'correct'),
    );
  });

  it('maja kind uses warm "LEARNER NOTES" framing distinct from diagnostic', () => {
    const prose = renderContextPrompt(validCtx, 'maja');
    expect(prose).toContain('LEARNER NOTES');
    expect(prose).not.toContain('USER ERROR CONTEXT');
  });

  it('ai-chat-hint produces a brief framing (< 200 chars)', () => {
    const prose = renderContextPrompt(validCtx, 'ai-chat-hint');
    expect(prose.length).toBeLessThan(200);
    expect(prose).toContain('B1');
  });

  it('ai-chat-story emphasizes known vocab', () => {
    const prose = renderContextPrompt(validCtx, 'ai-chat-story');
    expect(prose).toContain('540');
  });

  it('omits empty sections when ctx has no weak topics and no recent errors', () => {
    const sparseCtx = {
      ...validCtx,
      weakTopics: [],
      recentErrors: [],
      vocab: { learned: 0, dueToday: 0, hardest: [] },
    };
    const prose = renderContextPrompt(sparseCtx, 'correct');
    expect(prose).toContain('B1');
    expect(prose).not.toContain('Persistent weakness');
    expect(prose).not.toContain('Recent mistakes');
  });
});
