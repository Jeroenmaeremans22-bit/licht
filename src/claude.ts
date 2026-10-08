// Verbinding met Claude (Anthropic API) voor foto's, etiketten en omschrijvingen.
// Elke fout wordt vertaald naar een duidelijke Nederlandse uitleg met wat je eraan doet.

const MODELS = ['claude-sonnet-5-5', 'claude-haiku-4-5-20251001'];
const URL = 'https://api.anthropic.com/v1/messages';

export class ClaudeError extends Error {
  /** true als de oplossing in de instellingen ligt (sleutel of tegoed). */
  settings: boolean;
  constructor(message: string, settings = false) {
    super(message);
    this.settings = settings;
  }
}

/** Haalt spaties, enters en aanhalingstekens weg die vaak mee geplakt worden. */
export function cleanKey(raw: string): string {
  return raw.replace(/[\s"'`“”‘’]/g, '');
}

export function keyLooksValid(key: string): boolean {
  return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(key);
}

function explain(status: number, type: string, message: string): ClaudeError {
  const m = message.toLowerCase();
  if (status === 401 || type === 'authentication_error')
    return new ClaudeError(
      'Je API-sleutel wordt niet aanvaard. Kopieer ze opnieuw van console.anthropic.com en plak ze bij Doel › Instellingen.',
      true,
    );
  if (m.includes('credit') || m.includes('billing') || m.includes('balance'))
    return new ClaudeError(
      'Je tegoed bij Anthropic is op (of nog niet opgeladen). Zet tegoed op via console.anthropic.com › Billing. Vanaf $5 kan je honderden foto’s laten inschatten.',
      true,
    );
  if (status === 403 || type === 'permission_error')
    return new ClaudeError('Deze sleutel mag Claude niet gebruiken. Maak een nieuwe sleutel aan op console.anthropic.com.', true);
  if (status === 429 || type === 'rate_limit_error')
    return new ClaudeError('Even te veel tegelijk. Wacht een halve minuut en probeer opnieuw.');
  if (status === 413 || m.includes('too large'))
    return new ClaudeError('De foto is te groot. Probeer opnieuw.');
  if (status >= 500 || type === 'overloaded_error')
    return new ClaudeError('Claude is even overbelast. Probeer het over een minuutje opnieuw.');
  return new ClaudeError(`Er ging iets mis (${status}${message ? `: ${message}` : ''}).`);
}

interface Block {
  type: string;
  text?: string;
}

async function post(key: string, model: string, body: object): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60000);
  try {
    return await fetch(URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, ...body }),
      signal: ctrl.signal,
    });
  } catch {
    throw new ClaudeError('Geen verbinding met Claude. Controleer je internet en probeer opnieuw.');
  } finally {
    clearTimeout(timer);
  }
}

/** Stuurt een vraag naar Claude en geeft de tekst van het antwoord terug. */
export async function askClaude(
  rawKey: string,
  system: string,
  content: unknown[],
  maxTokens = 1024,
): Promise<string> {
  const key = cleanKey(rawKey);
  if (!key) throw new ClaudeError('Stel eerst je API-sleutel in bij Doel › Instellingen.', true);
  if (!keyLooksValid(key))
    throw new ClaudeError('Dit lijkt geen geldige API-sleutel. Ze begint met “sk-ant-” en is lang. Kijk ze na in de instellingen.', true);

  let last: ClaudeError | null = null;
  for (const model of MODELS) {
    const res = await post(key, model, {
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content }],
    });
    if (res.ok) {
      const json = (await res.json()) as { content?: Block[] };
      return (json.content ?? []).filter((c) => c.type === 'text').map((c) => c.text ?? '').join('');
    }
    const err = (await res.json().catch(() => null)) as { error?: { type?: string; message?: string } } | null;
    const type = err?.error?.type ?? '';
    const message = err?.error?.message ?? '';
    // Model niet beschikbaar of overbelast: probeer het reservemodel.
    const tryNext = res.status === 404 || type === 'not_found_error' || res.status === 529 || res.status >= 500;
    last = explain(res.status, type, message);
    if (!tryNext) throw last;
  }
  throw last ?? new ClaudeError('Er ging iets mis. Probeer opnieuw.');
}

/** Haalt het JSON-object uit een antwoord van Claude. */
export function parseJson<T>(text: string): T {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new ClaudeError('Het antwoord kon niet gelezen worden. Probeer opnieuw.');
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    throw new ClaudeError('Het antwoord kon niet gelezen worden. Probeer opnieuw.');
  }
}

/** Kleine testvraag om te controleren of sleutel en tegoed in orde zijn. */
export async function testKey(rawKey: string): Promise<void> {
  await askClaude(rawKey, 'Antwoord met één woord.', [{ type: 'text', text: 'Zeg ok.' }], 5);
}
