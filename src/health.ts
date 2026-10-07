// Beweging uit Health Connect (Android). Health Connect voegt gegevens van je gsm,
// smartwatch en andere apps samen en haalt dubbels eruit, dus dit is de meest
// nauwkeurige bron die Android heeft.

import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import {
  aggregateRecord,
  ExerciseType,
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  openHealthConnectSettings,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

import { useStore } from './store';

export type HcStatus = 'unavailable' | 'update' | 'available';

export async function hcStatus(): Promise<HcStatus> {
  if (Platform.OS !== 'android') return 'unavailable';
  try {
    const s = await getSdkStatus();
    if (s === SdkAvailabilityStatus.SDK_AVAILABLE) return 'available';
    if (s === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) return 'update';
    return 'unavailable';
  } catch {
    return 'unavailable';
  }
}

const PERMS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'Distance' },
  { accessType: 'read', recordType: 'ExerciseSession' },
] as const;

/** Vraagt toegang. Geeft true terug als minstens de stappen gedeeld worden. */
export async function connectHealth(): Promise<boolean> {
  if ((await hcStatus()) !== 'available') return false;
  await initialize();
  const granted = await requestPermission([...PERMS]);
  return granted.some((p) => 'recordType' in p && p.recordType === 'Steps');
}

async function hasStepsPermission(): Promise<boolean> {
  try {
    await initialize();
    const granted = await getGrantedPermissions();
    return granted.some((p) => 'recordType' in p && p.recordType === 'Steps');
  } catch {
    return false;
  }
}

export { openHealthConnectSettings };

function dayRange(d: Date) {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const now = new Date();
  return { operator: 'between' as const, startTime: start.toISOString(), endTime: (end > now ? now : end).toISOString() };
}

const EXERCISE_NAMES: Record<number, string> = {
  [ExerciseType.WALKING]: 'Wandelen',
  [ExerciseType.RUNNING]: 'Lopen',
  [ExerciseType.BIKING]: 'Fietsen',
  [ExerciseType.BIKING_STATIONARY]: 'Fietsen (binnen)',
  [ExerciseType.SWIMMING_POOL]: 'Zwemmen',
  [ExerciseType.SWIMMING_OPEN_WATER]: 'Zwemmen',
  [ExerciseType.STRENGTH_TRAINING]: 'Krachttraining',
  [ExerciseType.WEIGHTLIFTING]: 'Gewichtheffen',
  [ExerciseType.HIKING]: 'Wandeltocht',
  [ExerciseType.YOGA]: 'Yoga',
  [ExerciseType.SOCCER]: 'Voetbal',
  [ExerciseType.TENNIS]: 'Tennis',
  [ExerciseType.DANCING]: 'Dansen',
  [ExerciseType.HIGH_INTENSITY_INTERVAL_TRAINING]: 'HIIT',
  [ExerciseType.ELLIPTICAL]: 'Crosstrainer',
  [ExerciseType.ROWING_MACHINE]: 'Roeien',
};

export interface Exercise {
  name: string;
  minutes: number;
  start: string;
}

export interface DayActivity {
  steps: number;
  activeKcal: number;
  distanceKm: number;
  exercises: Exercise[];
}

export async function readDay(d = new Date()): Promise<DayActivity> {
  const range = dayRange(d);
  const [steps, kcal, dist, sessions] = await Promise.all([
    aggregateRecord({ recordType: 'Steps', timeRangeFilter: range }).catch(() => null),
    aggregateRecord({ recordType: 'ActiveCaloriesBurned', timeRangeFilter: range }).catch(() => null),
    aggregateRecord({ recordType: 'Distance', timeRangeFilter: range }).catch(() => null),
    readRecords('ExerciseSession', { timeRangeFilter: range }).catch(() => null),
  ]);
  return {
    steps: steps?.COUNT_TOTAL ?? 0,
    activeKcal: Math.round(kcal?.ACTIVE_CALORIES_TOTAL?.inKilocalories ?? 0),
    distanceKm: dist?.DISTANCE?.inKilometers ?? 0,
    exercises: (sessions?.records ?? []).map((r) => ({
      name: r.title || EXERCISE_NAMES[r.exerciseType] || 'Training',
      minutes: Math.round((new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000),
      start: r.startTime,
    })),
  };
}

export async function readWeekSteps(): Promise<{ date: Date; steps: number }[]> {
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return Promise.all(
    days.map(async (date) => {
      const r = await aggregateRecord({ recordType: 'Steps', timeRangeFilter: dayRange(date) }).catch(() => null);
      return { date, steps: r?.COUNT_TOTAL ?? 0 };
    }),
  );
}

const EMPTY: DayActivity = { steps: 0, activeKcal: 0, distanceKm: 0, exercises: [] };

/** Leest de beweging van vandaag telkens het scherm in beeld komt. */
export function useTodayActivity() {
  const connected = useStore((s) => s.healthConnected);
  const setConnected = useStore((s) => s.setHealthConnected);
  const [data, setData] = useState<DayActivity>(EMPTY);
  const [week, setWeek] = useState<{ date: Date; steps: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    try {
      if (!(await hasStepsPermission())) {
        setConnected(false);
        return;
      }
      const [day, w] = await Promise.all([readDay(), readWeekSteps()]);
      setData(day);
      setWeek(w);
    } finally {
      setLoading(false);
    }
  }, [connected, setConnected]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { connected, data, week, loading, refresh };
}
