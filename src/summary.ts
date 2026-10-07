import { useMemo } from 'react';

import {
  ACTIVE_SHARE,
  dailyBudget,
  eveningReserve,
  macroTargets,
  stepGoal,
  todayKey,
} from './calc';
import { currentWeight, useStore } from './store';

/** Alle cijfers voor vandaag, op basis van wat er opgeslagen is en de gemeten beweging. */
export function useTodaySummary(activeKcal: number) {
  const profile = useStore((s) => s.profile);
  const answers = useStore((s) => s.answers);
  const pace = useStore((s) => s.pace);
  const planStart = useStore((s) => s.planStart);
  const entries = useStore((s) => s.entries);
  const weights = useStore((s) => s.weights);
  const connected = useStore((s) => s.healthConnected);

  return useMemo(() => {
    const weight = currentWeight({ weights, profile });
    const b = dailyBudget(profile, answers, pace, weight, connected);
    const today = todayKey();
    const todays = entries.filter((e) => e.date === today);
    const eaten = todays.reduce((s, e) => s + e.kcal, 0);
    const movement = connected ? Math.round(activeKcal * ACTIVE_SHARE) : 0;
    const total = b.budget + movement;
    const macros = macroTargets(total, profile.target);
    const eatenMacros = todays.reduce(
      (s, e) => ({ protein: s.protein + e.protein, carbs: s.carbs + e.carbs, fat: s.fat + e.fat }),
      { protein: 0, carbs: 0, fat: 0 },
    );
    const reserve = eveningReserve(answers);
    const hasEvening = todays.some((e) => e.meal === 'avondeten' || e.meal === 'tussendoor') && new Date().getHours() >= 17;
    return {
      weight,
      budget: b.budget,
      floored: b.floored,
      maintenance: b.maintenance,
      eaten,
      movement,
      total,
      remaining: total - eaten,
      macros,
      eatenMacros,
      todays,
      reserve: hasEvening ? 0 : reserve,
      stepGoal: stepGoal(answers, planStart),
    };
  }, [profile, answers, pace, planStart, entries, weights, connected, activeKcal]);
}
