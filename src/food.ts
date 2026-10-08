// Voedingsgegevens ophalen: Open Food Facts (barcode en zoeken) en een
// optionele inschatting van foto's of tekst via Claude.

import type { FoodItem, Per100 } from './store';

const OFF_HEADERS = { 'User-Agent': 'Licht-Afvalapp/1.1 (Android; persoonlijk gebruik)' };
const OFF_FIELDS = [
  'code',
  'product_name',
  'product_name_nl',
  'product_name_fr',
  'product_name_en',
  'generic_name',
  'generic_name_nl',
  'abbreviated_product_name',
  'brands',
  'nutriments',
  'serving_quantity',
  'serving_size',
  'product_quantity',
  'quantity',
  'image_front_small_url',
].join(',');

interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_nl?: string;
  product_name_fr?: string;
  product_name_en?: string;
  generic_name?: string;
  generic_name_nl?: string;
  abbreviated_product_name?: string;
  brands?: string | string[];
  nutriments?: Record<string, number | string | undefined>;
  serving_quantity?: number | string;
  serving_size?: string;
  product_quantity?: number | string;
  quantity?: string;
  image_front_small_url?: string;
}

function num(v: unknown): number {
  const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function pickName(p: OffProduct): string {
  const names = [
    p.product_name_nl,
    p.product_name,
    p.product_name_fr,
    p.product_name_en,
    p.abbreviated_product_name,
    p.generic_name_nl,
    p.generic_name,
  ];
  return (names.find((n) => typeof n === 'string' && n.trim().length > 0) ?? '').trim();
}

function pickBrand(p: OffProduct): string | undefined {
  const b = Array.isArray(p.brands) ? p.brands[0] : p.brands?.split(',')[0];
  return b?.trim() || undefined;
}

/** Voedingswaarden per 100 g, met alle terugvalopties die Open Food Facts toelaat. */
function readPer100(p: OffProduct): Per100 | null {
  const n = p.nutriments ?? {};
  const serving = num(p.serving_quantity);
  const get = (key: string): number => {
    const per100 = num(n[`${key}_100g`]);
    if (per100) return per100;
    // Sommige producten hebben alleen waarden per portie.
    const perServing = num(n[`${key}_serving`]);
    if (perServing && serving > 0) return (perServing / serving) * 100;
    return 0;
  };

  let kcal = get('energy-kcal');
  if (!kcal) {
    const kj = get('energy-kj') || get('energy');
    if (kj) kcal = kj / 4.184;
  }
  const protein = get('proteins');
  const carbs = get('carbohydrates');
  const fat = get('fat');
  const fiber = get('fiber');
  // Geen energie, wel macro's: zelf uitrekenen.
  if (!kcal && (protein || carbs || fat)) kcal = protein * 4 + carbs * 4 + fat * 9;
  // Meer dan 900 kcal per 100 g kan niet: dan is het eigenlijk kJ.
  if (kcal > 900) kcal = kcal / 4.184;
  if (!kcal) return null;
  return { kcal: Math.round(kcal), protein, carbs, fat, fiber };
}

interface Portion {
  grams: number;
  step: number;
  servingLabel?: string;
}

function readPortion(p: OffProduct): Portion {
  const serving = num(p.serving_quantity);
  if (serving > 0 && serving <= 1000) {
    return {
      grams: serving,
      step: serving,
      servingLabel: `1 portie = ${Math.round(serving)} g${p.serving_size ? ` (${p.serving_size})` : ''}`,
    };
  }
  // Kleine verpakking (reep, potje yoghurt): standaard de hele verpakking.
  const pack = num(p.product_quantity);
  if (pack > 0 && pack <= 200) {
    return {
      grams: pack,
      step: pack <= 75 ? pack : 10,
      servingLabel: `1 verpakking = ${Math.round(pack)} g`,
    };
  }
  return { grams: 100, step: 10 };
}

function offToItem(p: OffProduct): FoodItem | null {
  const name = pickName(p);
  const per100 = readPer100(p);
  if (!name || !per100) return null;
  return {
    name,
    brand: pickBrand(p),
    per100,
    ...readPortion(p),
    imageUrl: p.image_front_small_url,
  };
}

// ---------- Barcode ----------

/** Controleert het controlecijfer van een EAN-8, EAN-13 of UPC-A code. */
export function validBarcode(code: string): boolean {
  if (!/^\d{8}$|^\d{12,14}$/.test(code)) return false;
  const digits = code.split('').map(Number);
  const check = digits.pop()!;
  const sum = digits
    .reverse()
    .reduce((s, d, i) => s + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

/** Dezelfde barcode kan in de database staan met of zonder voorloopnul. */
function variants(code: string): string[] {
  const out = [code];
  if (code.length === 12) out.push(`0${code}`);
  if (code.length === 13 && code.startsWith('0')) out.push(code.slice(1));
  if (code.length === 14 && code.startsWith('0')) out.push(code.slice(1));
  return [...new Set(out)];
}

async function fetchJson(url: string, timeoutMs = 10000): Promise<{ status: number; json: unknown }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: OFF_HEADERS, signal: ctrl.signal });
    const json = res.status === 404 || res.ok ? await res.json().catch(() => null) : null;
    return { status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

/** Haalt een product op, met één nieuwe poging als de server even hapert. */
async function fetchProduct(code: string): Promise<OffProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${code}.json?lc=nl&fields=${OFF_FIELDS}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { status, json } = await fetchJson(url);
      if (status === 404) return null;
      const body = json as { status?: number; product?: OffProduct } | null;
      if (status === 200 && body) return body.status === 1 && body.product ? body.product : null;
    } catch (e) {
      if (attempt === 1) throw e;
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  throw new Error('Open Food Facts reageert niet');
}

export type LookupResult =
  | { kind: 'found'; item: FoodItem }
  /** Het product bestaat, maar de voedingswaarden ontbreken. */
  | { kind: 'incomplete'; name?: string; brand?: string; portion?: number }
  | { kind: 'notfound' };

export async function lookupBarcode(code: string): Promise<LookupResult> {
  let partial: OffProduct | null = null;
  let anyAnswer = false;
  let lastError: unknown = null;
  for (const v of variants(code)) {
    try {
      const p = await fetchProduct(v);
      anyAnswer = true;
      if (!p) continue;
      const item = offToItem(p);
      if (item) return { kind: 'found', item };
      partial = partial ?? p;
    } catch (e) {
      lastError = e;
    }
  }
  if (partial) {
    const serving = num(partial.serving_quantity);
    return {
      kind: 'incomplete',
      name: pickName(partial) || undefined,
      brand: pickBrand(partial),
      portion: serving > 0 && serving <= 1000 ? serving : undefined,
    };
  }
  if (!anyAnswer && lastError) throw lastError;
  return { kind: 'notfound' };
}

// ---------- Zoeken ----------

function dedupe(items: FoodItem[]): FoodItem[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = `${i.name}|${i.brand ?? ''}`.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Snelle zoekdienst van Open Food Facts. */
async function searchFast(query: string): Promise<FoodItem[]> {
  const url =
    `https://search.openfoodfacts.org/search?q=${encodeURIComponent(query)}` +
    `&langs=nl,fr,en&page_size=30&fields=${OFF_FIELDS}`;
  const { status, json } = await fetchJson(url, 8000);
  if (status !== 200 || !json) throw new Error(`search ${status}`);
  const hits = (json as { hits?: OffProduct[] }).hits ?? [];
  return hits.map(offToItem).filter((x): x is FoodItem => x !== null);
}

/** Oudere, tragere zoekfunctie als terugval. Belgische producten eerst. */
async function searchClassic(query: string): Promise<FoodItem[]> {
  const url =
    'https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=30' +
    `&search_terms=${encodeURIComponent(query)}&lc=nl&cc=be&fields=${OFF_FIELDS}`;
  const { status, json } = await fetchJson(url, 15000);
  if (status !== 200 || !json) throw new Error(`Zoeken mislukt (${status})`);
  const products = (json as { products?: OffProduct[] }).products ?? [];
  return products.map(offToItem).filter((x): x is FoodItem => x !== null);
}

export async function searchFoods(query: string): Promise<FoodItem[]> {
  try {
    const fast = await searchFast(query);
    if (fast.length > 0) return dedupe(fast);
  } catch {
    // Valt terug op de klassieke zoekfunctie.
  }
  return dedupe(await searchClassic(query));
}

// ---------- Claude: foto, etiket of tekst laten lezen ----------

const CLAUDE_MODEL = 'claude-sonnet-5-5';

const ESTIMATE_PROMPT = `Je bent een voedingsassistent in een afslank-app. Schat wat er gegeten wordt en geef per onderdeel het geschatte gewicht in gram en de voedingswaarden PER 100 GRAM.
Antwoord ALLEEN met JSON, zonder uitleg eromheen, in exact dit formaat:
{"items":[{"name":"Nederlandse naam","grams":150,"kcal100":120,"protein100":5,"carbs100":15,"fat100":4}],"note":"korte opmerking in het Nederlands, bv. waar je onzeker over bent"}
Wees realistisch over portiegroottes. Als je niets eetbaars ziet, geef een lege items-lijst en leg het uit in note.`;

const LABEL_PROMPT = `Je leest de voedingswaardetabel op een verpakking. Neem de waarden PER 100 g (of per 100 ml) exact over van het etiket, niet schatten.
Staat er alleen een waarde per portie, reken dan om naar 100 g met het portiegewicht op het etiket.
Antwoord ALLEEN met JSON, zonder uitleg, in exact dit formaat:
{"name":"productnaam als die zichtbaar is, anders null","kcal100":250,"protein100":8,"carbs100":30,"fat100":10,"fiber100":3,"servingGrams":30,"note":"korte opmerking in het Nederlands, of null"}
Gebruik null voor waarden die je niet kan lezen. Is er geen voedingswaardetabel te zien, zet kcal100 op null en leg het uit in note.`;

interface ClaudeItem {
  name?: unknown;
  grams?: unknown;
  kcal100?: unknown;
  protein100?: unknown;
  carbs100?: unknown;
  fat100?: unknown;
}

async function askClaude(apiKey: string, system: string, content: unknown[]): Promise<unknown> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content }],
    }),
  });
  if (res.status === 401) throw new Error('De API-sleutel klopt niet. Kijk ze na bij Doel › Instellingen.');
  if (!res.ok) throw new Error(`Inlezen mislukt (fout ${res.status}). Probeer opnieuw.`);
  const json = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = (json.content ?? []).filter((c) => c.type === 'text').map((c) => c.text ?? '').join('');
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Kon het antwoord niet lezen. Probeer opnieuw.');
  return JSON.parse(match[0]);
}

async function estimate(apiKey: string, content: unknown[]): Promise<{ items: FoodItem[]; note?: string }> {
  const parsed = (await askClaude(apiKey, ESTIMATE_PROMPT, content)) as { items?: ClaudeItem[]; note?: unknown };
  const items: FoodItem[] = (parsed.items ?? [])
    .map((i) => ({
      name: String(i.name ?? 'Onbekend'),
      grams: Math.max(0, Math.round(num(i.grams))),
      step: 10,
      per100: {
        kcal: num(i.kcal100),
        protein: num(i.protein100),
        carbs: num(i.carbs100),
        fat: num(i.fat100),
      },
    }))
    .filter((i) => i.grams > 0 && i.per100.kcal > 0);
  return { items, note: typeof parsed.note === 'string' ? parsed.note : undefined };
}

export function estimateFromPhoto(apiKey: string, base64Jpeg: string) {
  return estimate(apiKey, [
    { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Jpeg } },
    { type: 'text', text: 'Wat staat er op dit bord en hoeveel is het ongeveer?' },
  ]);
}

export function estimateFromText(apiKey: string, description: string) {
  return estimate(apiKey, [{ type: 'text', text: `Ik heb gegeten: ${description}` }]);
}

export interface LabelValues {
  name?: string;
  per100: Partial<Per100>;
  servingGrams?: number;
  note?: string;
}

/** Leest de voedingswaardetabel van een foto van het etiket. */
export async function readLabel(apiKey: string, base64Jpeg: string): Promise<LabelValues> {
  const p = (await askClaude(apiKey, LABEL_PROMPT, [
    { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Jpeg } },
    { type: 'text', text: 'Lees de voedingswaarden van dit etiket.' },
  ])) as Record<string, unknown>;
  const opt = (v: unknown) => (v === null || v === undefined || v === '' ? undefined : num(v));
  return {
    name: typeof p.name === 'string' && p.name.trim() ? p.name.trim() : undefined,
    per100: {
      kcal: opt(p.kcal100),
      protein: opt(p.protein100),
      carbs: opt(p.carbs100),
      fat: opt(p.fat100),
      fiber: opt(p.fiber100),
    },
    servingGrams: opt(p.servingGrams) || undefined,
    note: typeof p.note === 'string' ? p.note : undefined,
  };
}
