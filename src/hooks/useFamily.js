/**
 * useFamily — family/leaderboard group state.
 * Extracted from App.jsx. All family-related state lives here.
 */
import { useState } from 'react';
import { getLocalFamily } from '../lib/firebase.js';

export function useFamily() {
  const [famData, setFamData] = useState(() => getLocalFamily());
  const [famMembers, setFamMembers] = useState([]);
  const [famLoading, setFamLoading] = useState(false);
  const [famName, setFamName] = useState('');
  const [famCode, setFamCode] = useState('');
  const [famErr, setFamErr] = useState('');
  const [famTab, setFamTab] = useState('main');

  return {
    famData, setFamData,
    famMembers, setFamMembers,
    famLoading, setFamLoading,
    famName, setFamName,
    famCode, setFamCode,
    famErr, setFamErr,
    famTab, setFamTab,
  };
}
