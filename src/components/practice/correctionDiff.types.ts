// SP6b: shared type module to break the import cycle between
// correctionDiff.utils.ts (which imports DiffSpan as a value to create
// React elements) and DiffSpan.tsx (which needs ErrorType).

export type ErrorType =
  | 'case'
  | 'aspect'
  | 'agreement'
  | 'tense'
  | 'word_order'
  | 'vocab'
  | 'spelling'
  | 'other';

export interface CorrectionChange {
  original: string;
  corrected: string;
  note?: string;
  errorType?: ErrorType;
}
