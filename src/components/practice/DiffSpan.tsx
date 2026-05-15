// SP6: temporary stub — replaced with full implementation in Task 2.
// Kept minimal so Task 1's pure-function tests run without a real DOM component.
import React from 'react';

export interface DiffSpanProps {
  original: string;
  corrected: string;
  note?: string;
  index: number;
}

export function DiffSpan(props: DiffSpanProps): React.ReactElement {
  return React.createElement('span', { 'data-stub-diff-span': props.index }, props.original);
}
