// Voedingsgegevens ophalen: Open Food Facts (barcode en zoeken) en een
// optionele inschatting van foto's of tekst via Claude.

import { FoodItem, Per100 } from './store';

const OFF_HEADERS = { 'User-Agent': 'Licht-Afvalapp/1.0 (persoonlijk gebruik)' };
const OFF_FIELDS = 'code,product_name,product_name_nl,brands,nutriments,serving_quantity,serving_size,image_front_small_url';

interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_nl?: string;
  brands?: string;
  nutriments?: Record<string, number | string | undefined>;
  serving_quantity?: number | string;
  serving_size?: string;
  image_front_small_url?: string;
}

function num(v: unknown): number {
  const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : 0;
}

function offToItem(p: OffProduct): FoodItem | null {
  const n = p.nutriments ?? {};
  let kcal = num(n['energy-kcal_100g']);
  if (!kcal && n['energy_100g']) kcal = num(n['energy_100g']) / 4.184; // kJ → kcal
  const name = (p.product_name_nl || p.product_name || '').trim();
  if (!name || !kcal) return null;
  const per100: Per100 = {
    kcal,
    protein: num(n['proteins_100g']),
    carbs: num(n['carbohydrates_100g']),
    fat: num(n['fat_100g']),
    fiber: num(n['fiber_100g']),
  };
  const serving = num(p.serving_quantity);
  const brand = p.brands?.split(',')[0]?.trim() || undefined;
  return {
    name,
    brand,
    per100,
    grams: serving > 0 ? serving : 100,
    step: serving > 0 ? serving : 10,
    servingLabel: serving > 0 ? `1 portie = ${Math.round(serving)} g${p.serving_size ? ` (${p.serving_size})` : ''}` : undefined,
    imageUrl: p.image_front_small_url,
  };
}

export async function lookupBarcode(code: string): Promise<FoodItem | null> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${OFF_FIELDS}`,
    { headers: OFF_HEADERS },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Open Food Facts gaf fout ${res.status}`);
  const json = (await res.json()) as { status?: number; product?: OffProduct };
  if (json.status !== 1 || !json.product) return null;
  return offToItem(json.product);
}

export async function searchFoods(query: string): Promise<FoodItem[]> {
  const url =
    'https://be.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=25' +
    `&search_terms=${encodeURIComponent(query)}&fields=${OFF_FIELDS}`;
  const res = await fetch(url, { headers: OFF_HEADERS });
  if (!res.ok) throw new Error(`Zoeken mislukt (${res.status})`);
  const json = (await res.json()) as { products?: OffProduct[] };
  const items = (json.products ?? []).map(offToItem).filter((x): x is FoodItem => x !== null);
  // Dubbels (zelfde naam en merk) eruit.
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = `${i.name}|${i.brand ?? ''}`.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ---------- Claude: foto of tekst laten inschatten ----------

const CLAUDE_MODEL = 'claude-sonnet-5-5';

const ESTIMATE_PROMPT = `Je bent een voedingsassistent in een afslank-app. Schat wat er gegeten wordt en geef per onderdeel het geschatte gewicht in gram en de voedingswaarden PER 100 GRAM.
Antwoord ALLEEN met JSON, zonder uitleg eromheen, in exact dit formaat:
{"items":[{"name":"Nederlandse naam","grams":150,"kcal100":120,"protein100":5,"carbs100":15,"fat100":4}],"note":"korte opmerking in het Nederlands, bv. waar je onzeker over bent"}
Wees realistisch over portiegroottes. Als je niets eetbaars ziet, geef een lege items-lijst en leg het uit in note.`;

interface ClaudeItem {
  name?: unknown;
  grams?: unknown;
  kcal100?: unknown;
  protein100?: unknown;
  carbs100?: unknown;
  fat100?: unknown;
}

async function askClaude(apiKey: string, content: unknown[]): Promise<{ items: FoodItem[]; note?: string }> {
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
      system: ESTIMATE_PROMPT,
      messages: [{ role: 'user', content }],
    }),
  });
  if (res.status === 401) throw new Error('De API-sleutel klopt niet. Kijk ze na bij Doel › Instellingen.');
  if (!res.ok) throw new Error(`Inschatten mislukt (fout ${res.status}). Probeer opnieuw.`);
  const json = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = (json.content ?? []).filter((c) => c.type === 'text').map((c) => c.text ?? '').join('');
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Kon het antwoord niet lezen. Probeer opnieuw.');
  const parsed = JSON.parse(match[0]) as { items?: ClaudeItem[]; note?: unknown };
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
  return askClaude(apiKey, [
    { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Jpeg } },
    { type: 'text', text: 'Wat staat er op dit bord en hoeveel is het ongeveer?' },
  ]);
}

export function estimateFromText(apiKey: string, description: string) {
  return askClaude(apiKey, [{ type: 'text', text: `Ik heb gegeten: ${description}` }]);
}
