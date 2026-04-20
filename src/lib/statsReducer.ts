import { mergeStatsFromRemote } from './mergeStatsFromRemote.js';
import type { Stats, StatsAction } from '../types/index.js';

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
