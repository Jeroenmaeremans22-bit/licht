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
  source: 'barcode' | 'foto' | 'zoeken' | 'schatting' | 'eigen';
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
  /** Bewaard sinds versie 1.2, zodat je de hoeveelheid achteraf kan aanpassen. */
  grams?: number;
  step?: number;
  per100?: Per100;
}

export interface WeightLog {
  date: string;
  kg: number;
}

/** Een product dat op deze gsm bewaard wordt, op barcode. */
export interface SavedProduct {
  name: string;
  brand?: string;
  per100: Per100;
  grams: number;
  step: number;
  servingLabel?: string;
  imageUrl?: string;
  /** Zelf ingevuld of van het etiket gelezen. */
  own?: boolean;
  savedAt: string;
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
  products: Record<string, SavedProduct>;
  /** Laatst verwijderd item, om het ongedaan te kunnen maken (niet bewaard). */
  lastDeleted: Entry | null;

  setProfile: (p: Partial<Profile>) => void;
  setAnswers: (a: Partial<Answers>) => void;
  setPace: (p: number) => void;
  finishOnboarding: () => void;
  restartOnboarding: () => void;
  addEntries: (meal: Meal, items: FoodItem[]) => void;
  removeEntry: (id: string) => void;
  restoreEntry: (e: Entry) => void;
  clearLastDeleted: () => void;
  updateEntry: (id: string, patch: { grams?: number; meal?: Meal }) => void;
  logWeight: (kg: number) => void;
  setHealthConnected: (v: boolean) => void;
  setApiKey: (k: string) => void;
  setPending: (p: PendingFood | null) => void;
  saveProduct: (code: string, item: FoodItem, own?: boolean) => void;
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
      products: {},
      lastDeleted: null,

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
              grams: i.grams,
              step: i.step,
              per100: i.per100,
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
      removeEntry: (id) =>
        set({
          lastDeleted: get().entries.find((e) => e.id === id) ?? null,
          entries: get().entries.filter((e) => e.id !== id),
        }),
      restoreEntry: (e) => {
        if (get().entries.some((x) => x.id === e.id)) return set({ lastDeleted: null });
        set({ entries: [...get().entries, e], lastDeleted: null });
      },
      clearLastDeleted: () => set({ lastDeleted: null }),
      updateEntry: (id, patch) =>
        set({
          entries: get().entries.map((e) => {
            if (e.id !== id) return e;
            const next = { ...e, ...(patch.meal ? { meal: patch.meal } : {}) };
            if (patch.grams !== undefined && e.per100) {
              const f = patch.grams / 100;
              next.grams = patch.grams;
              next.kcal = Math.round(e.per100.kcal * f);
              next.protein = e.per100.protein * f;
              next.carbs = e.per100.carbs * f;
              next.fat = e.per100.fat * f;
            }
            return next;
          }),
        }),
      logWeight: (kg) => {
        const date = todayKey();
        set({ weights: [...get().weights.filter((w) => w.date !== date), { date, kg }] });
      },
      setHealthConnected: (healthConnected) => set({ healthConnected }),
      setApiKey: (apiKey) => set({ apiKey: apiKey.trim() }),
      setPending: (pending) => set({ pending }),
      saveProduct: (code, item, own) => {
        const all = { ...get().products };
        // Een eigen product nooit overschrijven met gegevens uit de database.
        if (all[code]?.own && !own) return;
        all[code] = {
          name: item.name,
          brand: item.brand,
          per100: item.per100,
          grams: item.grams,
          step: item.step,
          servingLabel: item.servingLabel,
          imageUrl: item.imageUrl,
          own,
          savedAt: new Date().toISOString(),
        };
        // Maximaal 400 producten bewaren; eigen producten blijven altijd.
        const keys = Object.keys(all);
        if (keys.length > 400) {
          keys
            .filter((k) => !all[k].own)
            .sort((a, b) => all[a].savedAt.localeCompare(all[b].savedAt))
            .slice(0, keys.length - 400)
            .forEach((k) => delete all[k]);
        }
        set({ products: all });
      },
    }),
    {
      name: 'licht-data',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => {
        const { pending, lastDeleted, ...rest } = s;
        return rest;
      },
    },
  ),
);

export function currentWeight(s: { weights: WeightLog[]; profile: Profile }): number {
  if (s.weights.length === 0) return s.profile.weight;
  return [...s.weights].sort((a, b) => a.date.localeCompare(b.date))[s.weights.length - 1].kg;
}
