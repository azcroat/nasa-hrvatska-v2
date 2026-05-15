// src/tests/correctionDiff.utils.test.ts
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { projectChangesToNodes } from '../components/practice/correctionDiff.utils';

function countElements(nodes: React.ReactNode[]): number {
  return nodes.filter((n) => React.isValidElement(n)).length;
}

function stringNodes(nodes: React.ReactNode[]): string[] {
  return nodes.filter((n): n is string => typeof n === 'string');
}

describe('projectChangesToNodes', () => {
  it('empty changes returns single text node containing original text', () => {
    const result = projectChangesToNodes('Imam mama.', []);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('Imam mama.');
  });

  it('one change in middle splits into [prefix, DiffSpan, suffix]', () => {
    const result = projectChangesToNodes('Imam mama danas.', [
      { original: 'mama', corrected: 'majku', note: 'accusative' },
    ]);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Imam ');
    expect(React.isValidElement(result[1])).toBe(true);
    expect(result[2]).toBe(' danas.');
  });

  it('two non-overlapping changes produce 5 nodes (text/span/text/span/text)', () => {
    const result = projectChangesToNodes('Imam mama i tata.', [
      { original: 'mama', corrected: 'majku', note: 'acc' },
      { original: 'tata', corrected: 'tatu', note: 'acc' },
    ]);
    expect(result).toHaveLength(5);
    expect(stringNodes(result)).toEqual(['Imam ', ' i ', '.']);
    expect(countElements(result)).toBe(2);
  });

  it('duplicate original substring with two change entries marks both occurrences', () => {
    const result = projectChangesToNodes('mama je mama.', [
      { original: 'mama', corrected: 'majka', note: 'A' },
      { original: 'mama', corrected: 'majka', note: 'B' },
    ]);
    expect(countElements(result)).toBe(2);
  });

  it('duplicate original substring with one change entry marks only first occurrence', () => {
    const result = projectChangesToNodes('mama je mama.', [
      { original: 'mama', corrected: 'majka', note: 'first only' },
    ]);
    expect(countElements(result)).toBe(1);
    expect(result[result.length - 1]).toContain('mama.');
  });

  it('hallucinated original (not in text) is silently skipped', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = projectChangesToNodes('Imam mama.', [
      { original: 'zzzz', corrected: 'qqqq', note: 'hallucinated' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('Imam mama.');
    warnSpy.mockRestore();
  });

  it('all-hallucinated changes returns plain text (caller falls back)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = projectChangesToNodes('Imam mama.', [
      { original: 'xxxx', corrected: 'yyy', note: 'gone' },
      { original: 'wwww', corrected: 'vvv', note: 'gone' },
    ]);
    expect(countElements(result)).toBe(0);
    warnSpy.mockRestore();
  });

  it('change at index 0 produces no leading text node', () => {
    const result = projectChangesToNodes('mama danas.', [
      { original: 'mama', corrected: 'majka', note: 'nom' },
    ]);
    expect(React.isValidElement(result[0])).toBe(true);
    expect(result[1]).toBe(' danas.');
  });

  it('change at end of text produces no trailing text node', () => {
    const result = projectChangesToNodes('Imam mama', [
      { original: 'mama', corrected: 'majku', note: 'acc' },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('Imam ');
    expect(React.isValidElement(result[1])).toBe(true);
  });

  it('empty original string is skipped', () => {
    const result = projectChangesToNodes('Imam mama.', [
      { original: '', corrected: 'X', note: 'noop' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('Imam mama.');
  });

  it('missing corrected field renders empty insert (still produces marker)', () => {
    const result = projectChangesToNodes('Imam mama.', [
      // @ts-expect-error — intentionally pass a malformed change
      { original: 'mama', corrected: undefined, note: 'no replacement' },
    ]);
    expect(countElements(result)).toBe(1);
  });
});
