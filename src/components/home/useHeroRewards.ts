import { useState, useEffect } from 'react';
import { useStats } from '../../context/StatsContext';
import { earnFreeze, getStreakFreezes } from '../../data';
import {
  getXPBoost,
  activateXPBoost,
  canActivateXPBoost,
  XP_BOOST_COST,
} from '../../lib/appUtils.js';

/**
 * Hero rewards state + actions — streak freezes, 2× XP boost, and streak
 * recovery. Extracted from HeroSection as part of the 1c decomposition. Owns the
 * freeze/boost/restore state, the 10s boost-countdown effect, and the three
 * purchase/restore handlers (reading stats via useStats() directly). Behavior-
 * identical to the prior inline state + onClick closures. `today` and onSyncNow
 * come from the caller (the restore handler writes per-day keys + flushes sync).
 */
export function useHeroRewards({ today, onSyncNow }: { today: string; onSyncNow?: () => void }) {
  const { stats: st, setStats, award } = useStats();
  const [freezes, setFreezes] = useState(getStreakFreezes);
  const [freezeMsg, setFreezeMsg] = useState('');
  const [boost, setBoost] = useState(() => getXPBoost());
  const [boostMsg, setBoostMsg] = useState('');
  const [streakRestored, setStreakRestored] = useState(false);
  const [streakRestoreMsg, setStreakRestoreMsg] = useState('');

  // Refresh boost countdown every 10 s while active
  useEffect(() => {
    if (!boost.active) return undefined;
    const id = setInterval(() => {
      const b = getXPBoost();
      setBoost(b);
      if (!b.active) clearInterval(id);
    }, 10000);
    return () => clearInterval(id);
  }, [boost.active]);

  const activateBoost = () => {
    if (st.xp < XP_BOOST_COST) {
      setBoostMsg(`Need ${XP_BOOST_COST} XP to activate boost`);
      setTimeout(() => setBoostMsg(''), 3000);
      return;
    }
    if (!canActivateXPBoost()) {
      setBoostMsg('Boost available once per 24 hours');
      setTimeout(() => setBoostMsg(''), 3000);
      return;
    }
    setStats((s) => ({ ...s, xp: Math.max(0, s.xp - XP_BOOST_COST) }));
    activateXPBoost();
    setBoost(getXPBoost());
  };

  const earnFreezeReward = () => {
    if (st.xp >= 200) {
      earnFreeze();
      setFreezes((f) => f + 1);
      setFreezeMsg('✓ Streak freeze earned! Your streak is protected for one missed day.');
    } else setFreezeMsg('You need 200 XP to earn a streak freeze. Keep going!');
  };

  const restoreStreak = () => {
    award && award(-200, false, 'default');
    localStorage.setItem('nh_streak_restored_' + today, '1');
    // Write streak back to 1 using the uStreak key (same format as getStreak in data.jsx)
    localStorage.setItem('uStreak', JSON.stringify({ count: 1, last: today }));
    // Sync with streak.js repair key so canRepairStreak() returns false this session
    try {
      const rd = JSON.parse(localStorage.getItem('nh_streak_repair') || '{}');
      rd.lastRepair = today;
      localStorage.setItem('nh_streak_repair', JSON.stringify(rd));
    } catch (_) {}
    setStreakRestored(true);
    setStreakRestoreMsg('✓ Streak restored! Keep it alive today 🔥');
    if (onSyncNow) onSyncNow();
  };

  return {
    freezes,
    freezeMsg,
    boost,
    boostMsg,
    streakRestored,
    streakRestoreMsg,
    activateBoost,
    earnFreezeReward,
    restoreStreak,
  };
}

export type RewardsState = ReturnType<typeof useHeroRewards>;
