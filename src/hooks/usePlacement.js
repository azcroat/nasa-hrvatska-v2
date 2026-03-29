/**
 * usePlacement — placement test state and ct-reconstruction helper.
 *
 * Extracted from App.jsx to isolate the 5 placement-test state variables
 * and the getPlacementCt utility that maps a level to completed-topics array.
 */
import { useState } from 'react';
import { LEARN_PATH } from '../data.jsx';

export function usePlacement() {
  const [placementIdx, setPlacementIdx] = useState(0);
  const [placementScore, setPlacementScore] = useState(0);
  const [placementAnswers, setPlacementAnswers] = useState(false);
  const [placementXp, setPlacementXp] = useState(-1);
  const [placementQ, setPlacementQ] = useState([]);

  function getPlacementCt(level) {
    const ct = [];
    const targets = [0, 0, 5, 10, 15, 20];
    const max = targets[level] || 0;
    for (const lv of LEARN_PATH) {
      for (const it of lv.items) {
        if (it.topic && ct.length < max) ct.push(it.topic);
      }
    }
    return ct;
  }

  return {
    placementIdx, setPlacementIdx,
    placementScore, setPlacementScore,
    placementAnswers, setPlacementAnswers,
    placementXp, setPlacementXp,
    placementQ, setPlacementQ,
    getPlacementCt,
  };
}
