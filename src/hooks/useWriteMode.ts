/**
 * useWriteMode — all Free Write state for AIConversation.
 *
 * The write mode (essay/letter/story prompts) is functionally independent from
 * the live conversation mode. Keeping its state separate makes each mode
 * easy to reason about and reset independently.
 */

import { useState } from 'react';

export interface WritePrompt {
  id: string;
  level: string;
  icon: string;
  title: string;
  hr: string;
  prompt: string;
}

export interface WriteChange {
  original: string;
  corrected: string;
  note?: string;
}

export interface WriteEvaluation {
  score: number;
  level_demonstrated?: string;
  encouragement?: string;
  corrected_text?: string;
  changes?: WriteChange[];
  strengths?: string[];
  improvements?: string[];
  [key: string]: unknown;
}

export interface WriteMode {
  writePrompt: WritePrompt | null;
  setWritePrompt: (p: WritePrompt | null) => void;
  writeLevel: string;
  setWriteLevel: (l: string) => void;
  writeText: string;
  setWriteText: (t: string) => void;
  writePhase: 'setup' | 'writing' | 'evaluating' | 'result';
  setWritePhase: (p: 'setup' | 'writing' | 'evaluating' | 'result') => void;
  writeEval: WriteEvaluation | null;
  setWriteEval: (e: WriteEvaluation | null) => void;
  writeEvalError: string;
  setWriteEvalError: (e: string) => void;
}

export function useWriteMode(initialLevel = 'B1'): WriteMode {
  const [writePrompt, setWritePrompt] = useState<WritePrompt | null>(null);
  const [writeLevel, setWriteLevel] = useState<string>(initialLevel);
  const [writeText, setWriteText] = useState<string>('');
  const [writePhase, setWritePhase] = useState<'setup' | 'writing' | 'evaluating' | 'result'>(
    'setup',
  );
  const [writeEval, setWriteEval] = useState<WriteEvaluation | null>(null);
  const [writeEvalError, setWriteEvalError] = useState<string>('');

  return {
    writePrompt,
    setWritePrompt,
    writeLevel,
    setWriteLevel,
    writeText,
    setWriteText,
    writePhase,
    setWritePhase,
    writeEval,
    setWriteEval,
    writeEvalError,
    setWriteEvalError,
  };
}
