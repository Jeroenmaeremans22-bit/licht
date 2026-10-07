import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { Answers, Profile, todayKey } from './calc';

export type Meal = 'ontbijt' | 'lunch' | 'tussendoor' | 'avondeten';

export const MEALS: { id: Meal; label: string }[] = [
  { id: 'ontbijt', label: 'Ontbijt' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'tussendoor', label: 'Tussendoor' },
  { id: 'avondeten', label: 'Avondeten' },
];

export function mealForNow(d = new Date()): Meal {
  const h = d.getHours();
  if (h < 10) return 'ontbijt';
  if (h < 14) return 'lunch';
  if (h < 17) return 'tussendoor';
  return 'avondeten';
}

/** Voedingswaarden per 100 g. */
export interface Per100 {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

/** Eén ding dat je kan toevoegen: een product of een onderdeel van een foto. */
export interface FoodItem {
  name: string;
  brand?: string;
  per100: Per100;
  grams: number;
  /** Stap voor de −/+ knoppen, bv. één sneetje of 10 g. */
  step: number;
  /** Bv. "1 sneetje = 35 g" */
  servingLabel?: string;
  imageUrl?: string;
}

export interface PendingFood {
  source: 'barcode' | 'foto' | 'zoeken' | 'schatting';
  items: FoodItem[];
  note?: string;
}

export interface Entry {
  id: string;
  date: string; // YYYY-MM-DD
  meal: Meal;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WeightLog {
  date: string;
  kg: number;
}

export interface Recent {
  name: string;
  brand?: string;
  per100: Per100;
  grams: number;
  step: number;
  servingLabel?: string;
}

interface State {
  onboarded: boolean;
  profile: Profile;
  answers: Answers;
  pace: number;
  planStart: string;
  entries: Entry[];
  weights: WeightLog[];
  recents: Recent[];
  healthConnected: boolean;
  apiKey: string;
  pending: PendingFood | null;

  setProfile: (p: Partial<Profile>) => void;
  setAnswers: (a: Partial<Answers>) => void;
  setPace: (p: number) => void;
  finishOnboarding: () => void;
  restartOnboarding: () => void;
  addEntries: (meal: Meal, items: FoodItem[]) => void;
  removeEntry: (id: string) => void;
  logWeight: (kg: number) => void;
  setHealthConnected: (v: boolean) => void;
  setApiKey: (k: string) => void;
  setPending: (p: PendingFood | null) => void;
}

const defaultProfile: Profile = { name: '', age: 35, height: 175, weight: 85, target: 78, sex: 'man' };
const defaultAnswers: Answers = {
  job: 'zittend',
  commute: 'auto',
  freq: '1-2',
  sports: [],
  steps: 'weetniet',
  habits: [],
  meals: '3',
  sleep: 'goed',
};

export function itemTotals(i: FoodItem) {
  const f = i.grams / 100;
  return {
    kcal: Math.round(i.per100.kcal * f),
    protein: i.per100.protein * f,
    carbs: i.per100.carbs * f,
    fat: i.per100.fat * f,
    fiber: (i.per100.fiber ?? 0) * f,
  };
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      onboarded: false,
      profile: defaultProfile,
      answers: defaultAnswers,
      pace: 0.5,
      planStart: todayKey(),
      entries: [],
      weights: [],
      recents: [],
      healthConnected: false,
      apiKey: '',
      pending: null,

      setProfile: (p) => set({ profile: { ...get().profile, ...p } }),
      setAnswers: (a) => set({ answers: { ...get().answers, ...a } }),
      setPace: (pace) => set({ pace }),
      finishOnboarding: () => {
        const { profile, weights } = get();
        const today = todayKey();
        set({
          onboarded: true,
          planStart: today,
          weights: [...weights.filter((w) => w.date !== today), { date: today, kg: profile.weight }],
        });
      },
      restartOnboarding: () => set({ onboarded: false }),
      addEntries: (meal, items) => {
        const date = todayKey();
        const newEntries: Entry[] = items
          .filter((i) => i.grams > 0)
          .map((i, n) => {
            const t = itemTotals(i);
            return {
              id: `${Date.now()}-${n}`,
              date,
              meal,
              name: i.name,
              kcal: t.kcal,
              protein: t.protein,
              carbs: t.carbs,
              fat: t.fat,
            };
          });
        const recents = [
          ...items.map((i) => ({
            name: i.name,
            brand: i.brand,
            per100: i.per100,
            grams: i.grams,
            step: i.step,
            servingLabel: i.servingLabel,
          })),
          ...get().recents.filter((r) => !items.some((i) => i.name === r.name)),
        ].slice(0, 12);
        // Alleen de laatste 120 dagen bewaren.
        const cutoff = todayKey(new Date(Date.now() - 120 * 86400000));
        set({
          entries: [...get().entries.filter((e) => e.date >= cutoff), ...newEntries],
          recents,
        });
      },
      removeEntry: (id) => set({ entries: get().entries.filter((e) => e.id !== id) }),
      logWeight: (kg) => {
        const date = todayKey();
        set({ weights: [...get().weights.filter((w) => w.date !== date), { date, kg }] });
      },
      setHealthConnected: (healthConnected) => set({ healthConnected }),
      setApiKey: (apiKey) => set({ apiKey: apiKey.trim() }),
      setPending: (pending) => set({ pending }),
    }),
    {
      name: 'licht-data',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => {
        const { pending, ...rest } = s;
        return rest;
      },
    },
  ),
);

export function currentWeight(s: { weights: WeightLog[]; profile: Profile }): number {
  if (s.weights.length === 0) return s.profile.weight;
  return [...s.weights].sort((a, b) => a.date.localeCompare(b.date))[s.weights.length - 1].kg;
}
