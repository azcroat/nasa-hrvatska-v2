import React, { createContext, useContext } from 'react';
import type { StatsContextValue } from '../types/index.js';

const StatsContext = createContext<StatsContextValue | null>(null);

export function StatsProvider({ value, children }: { value: StatsContextValue; children: React.ReactNode }) {
  return <StatsContext.Provider value={value}>{children}</StatsContext.Provider>;
}

export function useStats(): StatsContextValue {
  const ctx = useContext(StatsContext);
  if (!ctx) throw new Error('useStats must be used within StatsProvider');
  return ctx;
}
