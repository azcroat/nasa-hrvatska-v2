/**
 * usePlacement — placement test state and ct-reconstruction helper.
 *
 * Extracted from App.jsx to isolate the 5 placement-test state variables
 * and the getPlacementCt utility that maps a level to completed-topics array.
 */
import { useState } from 'react';

export function usePlacement(): {
  placementIdx: number;
  setPlacementIdx: React.Dispatch<React.SetStateAction<number>>;
  placementScore: number;
  setPlacementScore: React.Dispatch<React.SetStateAction<number>>;
  placementAnswers: boolean;
  setPlacementAnswers: React.Dispatch<React.SetStateAction<boolean>>;
  placementXp: number;
  setPlacementXp: React.Dispatch<React.SetStateAction<number>>;
  placementQ: unknown[];
  setPlacementQ: React.Dispatch<React.SetStateAction<unknown[]>>;
  getPlacementCt: (level: number) => Promise<string[]>;
} {
  const [placementIdx, setPlacementIdx] = useState(0);
  const [placementScore, setPlacementScore] = useState(0);
  const [placementAnswers, setPlacementAnswers] = useState(false);
  const [placementXp, setPlacementXp] = useState(-1);
  const [placementQ, setPlacementQ] = useState<unknown[]>([]);

  // LEARN_PATH is only needed when placement completes — lazy import keeps it out of startup bundle.
  async function getPlacementCt(level: number): Promise<string[]> {
    const { LEARN_PATH } = await import('../data');
    const ct: string[] = [];
    const targets = [0, 0, 5, 10, 15, 20];
    const max = targets[level] || 0;
    for (const lv of LEARN_PATH as { items: { topic?: string }[] }[]) {
      for (const it of lv.items) {
        if (it.topic && ct.length < max) ct.push(it.topic);
      }
    }
    return ct;
  }

  return {
    placementIdx,
    setPlacementIdx,
    placementScore,
    setPlacementScore,
    placementAnswers,
    setPlacementAnswers,
    placementXp,
    setPlacementXp,
    placementQ,
    setPlacementQ,
    getPlacementCt,
  };
}
