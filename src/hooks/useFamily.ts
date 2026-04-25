/**
 * useFamily — family group state.
 * Extracted from App.jsx. All family-related state lives here.
 */
import { useState } from 'react';
import { getLocalFamily } from '../lib/firebase.js';

export interface FamilyMember {
  uid: string;
  name: string;
  xp: number;
  [key: string]: unknown;
}

export interface FamilyData {
  code: string;
  name?: string;
  [key: string]: unknown;
}

export function useFamily(): {
  famData: FamilyData | null;
  setFamData: React.Dispatch<React.SetStateAction<FamilyData | null>>;
  famMembers: FamilyMember[];
  setFamMembers: React.Dispatch<React.SetStateAction<FamilyMember[]>>;
  famLoading: boolean;
  setFamLoading: React.Dispatch<React.SetStateAction<boolean>>;
  famName: string;
  setFamName: React.Dispatch<React.SetStateAction<string>>;
  famCode: string;
  setFamCode: React.Dispatch<React.SetStateAction<string>>;
  famErr: string;
  setFamErr: React.Dispatch<React.SetStateAction<string>>;
  famTab: string;
  setFamTab: React.Dispatch<React.SetStateAction<string>>;
} {
  const [famData, setFamData] = useState<FamilyData | null>(
    () => getLocalFamily() as FamilyData | null,
  );
  const [famMembers, setFamMembers] = useState<FamilyMember[]>([]);
  const [famLoading, setFamLoading] = useState(false);
  const [famName, setFamName] = useState('');
  const [famCode, setFamCode] = useState('');
  const [famErr, setFamErr] = useState('');
  const [famTab, setFamTab] = useState('main');

  return {
    famData,
    setFamData,
    famMembers,
    setFamMembers,
    famLoading,
    setFamLoading,
    famName,
    setFamName,
    famCode,
    setFamCode,
    famErr,
    setFamErr,
    famTab,
    setFamTab,
  };
}
