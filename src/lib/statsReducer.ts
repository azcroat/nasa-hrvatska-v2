import { mergeStatsFromRemote } from './mergeStatsFromRemote.js';
import type { Stats } from '../types/index.js';

export type StatsAction =
  | { type: 'RESET'; payload: Stats }
  | { type: 'MERGE_REMOTE'; payload: unknown; ds: Stats }
  | { type: 'APPLY'; payload: (prev: Stats) => Stats };

export function statsReducer(state: Stats, action: StatsAction): Stats {
  switch (action.type) {
    case 'RESET':
      return action.payload;
    case 'MERGE_REMOTE':
      return mergeStatsFromRemote(state, action.payload, action.ds);
    case 'APPLY':
      return action.payload(state);
    default:
      return state;
  }
}
