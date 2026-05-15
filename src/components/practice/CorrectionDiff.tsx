// src/components/practice/CorrectionDiff.tsx
// SP6: presentational wrapper that renders the AI's correction as an inline diff.
// Pure component — no fetching, no localStorage, no side effects.
import React, { useMemo } from 'react';
import { projectChangesToNodes, type CorrectionChange } from './correctionDiff.utils';

export type { CorrectionChange };

export interface CorrectionDiffProps {
  originalText: string;
  correctedText: string;
  changes?: CorrectionChange[];
}

const STYLES = {
  paragraph: {
    lineHeight: 1.7,
    fontSize: 15,
    color: '#1f2937',
    margin: 0,
  },
};

export function CorrectionDiff({
  originalText,
  correctedText,
  changes = [],
}: CorrectionDiffProps): React.ReactElement {
  const nodes = useMemo(
    () => projectChangesToNodes(originalText, changes),
    [originalText, changes],
  );

  const noSurvivingChanges = changes.length === 0 || !nodes.some((n) => React.isValidElement(n));

  if (noSurvivingChanges) {
    return <p style={STYLES.paragraph}>{correctedText}</p>;
  }

  return <p style={STYLES.paragraph}>{nodes}</p>;
}
