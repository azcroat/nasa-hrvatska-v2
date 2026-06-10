// src/lib/conjugation/forms.ts
import type { ConjVerb, ConjCell } from './types';

export function formFor(verb: ConjVerb, cell: ConjCell): string | null {
  switch (cell.formType) {
    case 'present':
      return verb.present?.[cell.personIdx] ?? null;
    case 'future1':
      return verb.future1?.[cell.personIdx] ?? null;
    case 'conditional':
      return verb.conditional?.[cell.personIdx] ?? null;
    case 'imperative':
      return verb.imperative?.[cell.personIdx] ?? null;
    case 'past': {
      const g = cell.gender ?? 'm';
      return verb.past?.[g]?.[cell.personIdx] ?? null;
    }
    default:
      return null;
  }
}
