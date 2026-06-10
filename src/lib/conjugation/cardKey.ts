// src/lib/conjugation/cardKey.ts
import type { ConjCell, FormType, Gender } from './types';

const PREFIX = 'conj';
const FORM_TYPES: FormType[] = ['present', 'past', 'future1', 'imperative', 'conditional'];
const GENDERS: Gender[] = ['m', 'f', 'n'];

// Infinitives are letters only, so '|' is a safe delimiter.
export function buildCardKey(cell: ConjCell): string {
  const parts = [PREFIX, cell.inf, cell.formType, String(cell.personIdx)];
  if (cell.gender) parts.push(cell.gender);
  return parts.join('|');
}

export function parseCardKey(key: string): ConjCell | null {
  if (typeof key !== 'string' || !key.startsWith(PREFIX + '|')) return null;
  const parts = key.split('|');
  if (parts.length < 4 || parts.length > 5) return null;
  const [, inf, formType, personStr, gender] = parts;
  if (!inf || !FORM_TYPES.includes(formType as FormType)) return null;
  const personIdx = Number(personStr);
  if (!Number.isInteger(personIdx) || personIdx < 0) return null;
  const cell: ConjCell = { inf, formType: formType as FormType, personIdx };
  if (gender !== undefined) {
    if (!GENDERS.includes(gender as Gender)) return null;
    cell.gender = gender as Gender;
  }
  return cell;
}
