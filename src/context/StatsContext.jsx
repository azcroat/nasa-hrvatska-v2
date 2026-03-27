import React, { createContext, useContext } from 'react';

const StatsContext = createContext(null);

export function StatsProvider({ value, children }) {
  return <StatsContext.Provider value={value}>{children}</StatsContext.Provider>;
}

export function useStats() {
  const ctx = useContext(StatsContext);
  if (!ctx) throw new Error('useStats must be used within StatsProvider');
  return ctx;
}
