/**
 * useConversationSession — groups all live-conversation state for AIConversation.
 *
 * Extracts 22 useState calls from AIConversation into a single hook so the
 * component body focuses on event handlers rather than state declarations.
 */

import { useState } from 'react';

export interface TooltipData {
  word: string;
  translation?: string | null;
  note?: string | null;
  loading?: boolean;
  saved?: boolean;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'hint';
  content: string;
  gloss?: string;
  scaffolding?: string;
  emotion?: string;
}

export interface ConversationSession {
  // Flow
  phase: 'setup' | 'chat' | 'evaluating' | 'result';
  setPhase: (p: 'setup' | 'chat' | 'evaluating' | 'result') => void;
  scenario: Record<string, unknown> | null;
  setScenario: (s: Record<string, unknown> | null) => void;
  level: string;
  setLevel: (l: string) => void;
  turnCount: number;
  setTurnCount: React.Dispatch<React.SetStateAction<number>>;
  // Messages
  messages: ConversationMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ConversationMessage[]>>;
  input: string;
  setInput: (v: string) => void;
  // Loading / errors
  loading: boolean;
  setLoading: (v: boolean) => void;
  chatError: string;
  setChatError: (v: string) => void;
  sendError: string;
  setSendError: (v: string) => void;
  // Post-conversation
  evaluation: Record<string, unknown> | null;
  setEvaluation: (v: Record<string, unknown> | null) => void;
  evalError: string;
  setEvalError: (v: string) => void;
  convoVocab: unknown[];
  setConvoVocab: React.Dispatch<React.SetStateAction<unknown[]>>;
  weakAreasForSession: string[];
  setWeakAreasForSession: (v: string[]) => void;
  corrections: Record<string, unknown>;
  setCorrections: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  // UI
  tooltip: TooltipData | null;
  setTooltip: React.Dispatch<React.SetStateAction<TooltipData | null>>;
  showStarters: boolean;
  setShowStarters: (v: boolean) => void;
  listening: boolean;
  setListening: (v: boolean) => void;
  muted: boolean;
  setMuted: React.Dispatch<React.SetStateAction<boolean>>;
  // NPC video
  npcVideoUrl: string | null;
  setNpcVideoUrl: (v: string | null) => void;
  npcVideoLoading: boolean;
  setNpcVideoLoading: (v: boolean) => void;
  // Speaking animation
  isSpeaking: boolean;
  setIsSpeaking: (v: boolean) => void;
  // Saved words (Set for O(1) lookup)
  savedWords: Set<string>;
  setSavedWords: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export function useConversationSession(initialLevel: string): ConversationSession {
  const [phase, setPhase] = useState<'setup' | 'chat' | 'evaluating' | 'result'>('setup');
  const [scenario, setScenario] = useState<Record<string, unknown> | null>(null);
  const [level, setLevel] = useState<string>(initialLevel);
  const [turnCount, setTurnCount] = useState<number>(0);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string>('');
  const [sendError, setSendError] = useState<string>('');
  const [evaluation, setEvaluation] = useState<Record<string, unknown> | null>(null);
  const [evalError, setEvalError] = useState<string>('');
  const [convoVocab, setConvoVocab] = useState<unknown[]>([]);
  const [weakAreasForSession, setWeakAreasForSession] = useState<string[]>([]);
  const [corrections, setCorrections] = useState<Record<string, unknown>>({});
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [showStarters, setShowStarters] = useState<boolean>(false);
  const [listening, setListening] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [npcVideoUrl, setNpcVideoUrl] = useState<string | null>(null);
  const [npcVideoLoading, setNpcVideoLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

  return {
    phase,
    setPhase,
    scenario,
    setScenario,
    level,
    setLevel,
    turnCount,
    setTurnCount,
    messages,
    setMessages,
    input,
    setInput,
    loading,
    setLoading,
    chatError,
    setChatError,
    sendError,
    setSendError,
    evaluation,
    setEvaluation,
    evalError,
    setEvalError,
    convoVocab,
    setConvoVocab,
    weakAreasForSession,
    setWeakAreasForSession,
    corrections,
    setCorrections,
    tooltip,
    setTooltip,
    showStarters,
    setShowStarters,
    listening,
    setListening,
    muted,
    setMuted,
    npcVideoUrl,
    setNpcVideoUrl,
    npcVideoLoading,
    setNpcVideoLoading,
    isSpeaking,
    setIsSpeaking,
    savedWords,
    setSavedWords,
  };
}
