// Alle berekeningen van de app op één plek.

export type Sex = 'man' | 'vrouw';
export type Job = 'zittend' | 'staand' | 'fysiek' | 'zwaar' | 'geen';
export type Commute = 'auto' | 'ov' | 'fiets' | 'voet' | 'thuis';
export type SportFreq = '0' | '1-2' | '3-4' | '5';
export type StepsGuess = 'laag' | 'mid' | 'hoog' | 'top' | 'weetniet';
export type Habit =
  | 'avond'
  | 'porties'
  | 'frisdrank'
  | 'alcohol'
  | 'onregelmatig'
  | 'buiten'
  | 'stress'
  | 'tijd';
export type Sleep = 'goed' | 'wisselend' | 'slecht';
export type MealsPerDay = '2' | '3' | '4' | '5';

export interface Profile {
  name: string;
  age: number;
  height: number; // cm
  weight: number; // kg (startgewicht)
  target: number; // kg
  sex: Sex;
}

export interface Answers {
  job: Job;
  commute: Commute;
  freq: SportFreq;
  sports: string[];
  steps: StepsGuess;
  habits: Habit[];
  meals: MealsPerDay;
  sleep: Sleep;
}

export const KCAL_PER_KG = 7700;
/** Deel van de gemeten actieve calorieën dat we bij het budget tellen (trackers schatten vaak te hoog). */
export const ACTIVE_SHARE = 0.75;

/** Rustverbruik volgens Mifflin-St Jeor. */
export function bmr(p: Profile, currentWeight: number): number {
  const base = 10 * currentWeight + 6.25 * p.height - 5 * p.age;
  return p.sex === 'man' ? base + 5 : base - 161;
}

const JOB_FACTOR: Record<Job, number> = {
  zittend: 1.2,
  geen: 1.2,
  staand: 1.35,
  fysiek: 1.5,
  zwaar: 1.7,
};

const SPORT_EXTRA: Record<SportFreq, number> = { '0': 0, '1-2': 0.075, '3-4': 0.15, '5': 0.225 };

/**
 * Activiteitsfactor.
 * Met Health Connect gekoppeld tellen we sport NIET in de factor: die komt dan dagelijks
 * gemeten bij het budget. Zo tellen we niets dubbel.
 */
export function activityFactor(a: Answers, healthConnected: boolean): number {
  let f = JOB_FACTOR[a.job];
  if (a.commute === 'fiets' || a.commute === 'voet') f += 0.05;
  if (!healthConnected) f += SPORT_EXTRA[a.freq];
  return Math.min(f, 1.9);
}

export function activityLabel(a: Answers): string {
  const f = JOB_FACTOR[a.job] + SPORT_EXTRA[a.freq] + (a.commute === 'fiets' || a.commute === 'voet' ? 0.05 : 0);
  if (f < 1.3) return 'Weinig actief';
  if (f < 1.45) return 'Licht actief';
  if (f < 1.65) return 'Actief';
  return 'Zeer actief';
}

export function maintenance(p: Profile, a: Answers, currentWeight: number, healthConnected: boolean): number {
  return Math.round(bmr(p, currentWeight) * activityFactor(a, healthConnected));
}

export function minimumBudget(sex: Sex): number {
  return sex === 'man' ? 1500 : 1200;
}

export interface Budget {
  maintenance: number;
  budget: number;
  deficit: number;
  floored: boolean;
}

export function dailyBudget(
  p: Profile,
  a: Answers,
  pace: number,
  currentWeight: number,
  healthConnected: boolean,
): Budget {
  const m = maintenance(p, a, currentWeight, healthConnected);
  const wanted = Math.round((pace * KCAL_PER_KG) / 7);
  const floor = minimumBudget(p.sex);
  const raw = m - wanted;
  const budget = Math.max(floor, raw);
  return {
    maintenance: m,
    budget: roundTo(budget, 10),
    deficit: m - budget,
    floored: raw < floor,
  };
}

export function weeksToGoal(currentWeight: number, target: number, pace: number): number {
  const diff = Math.max(0, currentWeight - target);
  if (diff === 0 || pace <= 0) return 0;
  return Math.ceil(diff / pace);
}

export interface MacroTargets {
  protein: number;
  fat: number;
  carbs: number;
}

export function macroTargets(budget: number, target: number): MacroTargets {
  const protein = Math.round(Math.min(1.6 * target, (budget * 0.35) / 4));
  const fat = Math.round((budget * 0.3) / 9);
  const carbs = Math.max(0, Math.round((budget - protein * 4 - fat * 9) / 4));
  return { protein, fat, carbs };
}

const STEP_START: Record<StepsGuess, number> = {
  laag: 5000,
  mid: 6500,
  hoog: 8500,
  top: 10000,
  weetniet: 7000,
};

/** Stapdoel dat elke twee weken met 500 stijgt tot 10.000. */
export function stepGoal(a: Answers, planStart: string, today = new Date()): number {
  const start = STEP_START[a.steps];
  if (start >= 10000) return start;
  const days = Math.max(0, Math.floor((today.getTime() - new Date(planStart).getTime()) / 86400000));
  const steps = Math.floor(days / 14);
  return Math.min(10000, start + steps * 500);
}

export function stepRamp(a: Answers): number[] {
  const start = STEP_START[a.steps];
  if (start >= 10000) return [start];
  const out: number[] = [];
  for (let s = start; s < 10000; s += 1000) out.push(s);
  out.push(10000);
  return out.slice(0, 5);
}

/** Calorieën die we vrijhouden voor de avond (alleen wie dat moeilijk vindt). */
export function eveningReserve(a: Answers): number {
  return a.habits.includes('avond') ? 200 : 0;
}

export interface Tip {
  title: string;
  text: string;
}

export function tipsFor(a: Answers): Tip[] {
  const t: Tip[] = [];
  if (a.habits.includes('avond'))
    t.push({
      title: 'Ruimte voor ’s avonds',
      text: 'De app houdt elke dag ± 200 kcal vrij voor een avondsnack, zodat je niets hoeft te verbieden.',
    });
  if (a.habits.includes('frisdrank'))
    t.push({
      title: 'Frisdrank omwisselen',
      text: 'Water, bruisend water of light in plaats van gewone frisdrank: één blikje cola is al ± 140 kcal.',
    });
  if (a.habits.includes('alcohol'))
    t.push({
      title: 'Alcohol bewust plannen',
      text: 'Kies vooraf op welke dagen je drinkt. Een glas wijn of een pintje is ± 100–150 kcal, en maakt honger groter.',
    });
  if (a.habits.includes('porties'))
    t.push({
      title: 'Kleiner bord, eerst groenten',
      text: 'Schep op in de keuken in plaats van aan tafel en vul de helft van je bord met groenten.',
    });
  if (a.habits.includes('stress'))
    t.push({
      title: 'Even pauzeren bij stress',
      text: 'Zin om te eten zonder honger? Wacht tien minuten, drink water of wandel even. Vaak zakt het.',
    });
  if (a.habits.includes('onregelmatig'))
    t.push({
      title: 'Vaste eetmomenten',
      text: 'Eet op ongeveer dezelfde uren. Lang niets eten maakt de kans op een grote eetbui groter.',
    });
  if (a.habits.includes('buiten'))
    t.push({
      title: 'Buitenshuis slim kiezen',
      text: 'Scan of zoek je gerecht vooraf op, en kies gegrild in plaats van gefrituurd.',
    });
  if (a.habits.includes('tijd'))
    t.push({
      title: 'Eén keer koken, twee keer eten',
      text: 'Maak een dubbele portie en neem de rest mee als lunch. Scheelt tijd én snacks onderweg.',
    });
  if (a.job === 'zittend' || a.job === 'geen')
    t.push({
      title: 'Bewegen in je dag',
      text: 'Een wandeling van 15 minuten over de middag, en een seintje als je lang stilzit.',
    });
  if (a.sleep !== 'goed')
    t.push({
      title: 'Vast slaapritme',
      text: 'Slecht slapen maakt meer honger. Probeer op vaste uren te gaan slapen en op te staan.',
    });
  if (a.freq === '0')
    t.push({
      title: 'Klein beginnen met sport',
      text: 'Begin met twee keer per week 20 minuten iets dat je leuk vindt. Volhouden is belangrijker dan zwaar.',
    });
  if (t.length === 0)
    t.push({
      title: 'Elke dag registreren',
      text: 'Wie alles bijhoudt, valt gemiddeld meer af. Scan ook de kleine dingen.',
    });
  return t.slice(0, 4);
}

export function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

/** 12345 → "12.345" */
export function fmt(n: number): string {
  const sign = n < 0 ? '−' : '';
  return sign + Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** 1.25 → "1,3" */
export function fmt1(n: number): string {
  return (Math.round(n * 10) / 10).toString().replace('.', ',');
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
const MONTHS = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

export function longDate(d = new Date()): string {
  const day = DAYS[d.getDay()];
  return `${day[0].toUpperCase()}${day.slice(1)} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function shortDay(d: Date): string {
  return DAYS[d.getDay()].slice(0, 2).replace(/^./, (c) => c.toUpperCase());
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 12) return 'Goeiemorgen';
  if (h < 18) return 'Goeiemiddag';
  return 'Goeienavond';
}
