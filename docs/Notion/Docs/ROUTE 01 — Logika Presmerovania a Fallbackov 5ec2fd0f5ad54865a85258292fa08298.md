# ROUTE 01 — Logika Presmerovania a Fallbackov

Status: Draft
Type: Dev Guidelines

## Účel

Popísať deterministickú logiku presmerovania medzi doménami a výber jazyka s jasnými fallbackmi, aby routing podporoval SEO, dôveru používateľov a konzistentný produktový zážitok.

## Logika presmerovania a fallbackov

## Krok 1: Detekcia na úrovni servera/edge (Vercel Middleware)

- Zisťovanie IP geolokácie: middleware zistí krajinu návštevníka.
- Akcia: ak IP pochádza z trhu so samostatnou doménou, vykonaj serverové presmerovanie 308 na lokálnu doménu (napr. CZ IP → legacyguard.cz namiesto legacyguard.com).
  - Prečo 308: trvalé presmerovanie zachová metódu a telo requestu, pomáha SEO a používateľovi okamžite ukazuje lokálnu doménu.

## Krok 2: Detekcia na úrovni klienta (na lokálnej doméne)

- Spustí sa LocalizationContext.
  - currentJurisdiction: je pevne daná doménou, napr. legacyguard.cz → "cz". Táto hodnota sa už na kliente nemení.
  - Detekcia jazyka prehliadača: prečíta sa navigator.language (napr. de-DE → "de").
  - Kontrola voči matici jazykov pre danú doménu: ak je jazyk podporovaný, currentLanguage sa nastaví na daný jazyk (napr. "de").

## Krok 3: Nepodporovaný jazyk (fallback)

- Ak jazyk prehliadača nie je pre doménu podporovaný, currentLanguage sa nastaví na hlavný jazyk danej krajiny/jurisdikcie (napr. na .cz doméne fallback na "cs").
- Až ak ani ten nie je dostupný, použi "en" ako posledný fallback.

## Krok 4: Nepodporovaná krajina/doména

- Ak IP geolokácia smeruje na krajinu bez vyhradenej domény/jurisdikcie, presmeruj na medzinárodnú doménu legacyguard.eu.
  - Na .eu: predvolený jazyk je "en" (alebo podporovaný jazyk podľa prehliadača, ak je k dispozícii).
  - Funkcia Tvorcu Závetu: deaktivovaná alebo s jasným upozornením: "Pre vašu krajinu zatiaľ neponúkame právne platné šablóny závetov. Môžete však využiť ostatné funkcie na organizáciu dokumentov a ochranu rodiny."

## Pseudokód (Edge Middleware)

```tsx
// Importuj mapy zo single source of truth (I18N 02 — Language Matrix per Domain)
import { SUPPORTED_LANGS_BY_DOMAIN, PRIMARY_LANG_BY_DOMAIN } from '@/config/languageMatrix';

export function middleware(req: Request) {
  const country = geoCountryFrom(req); // napr. 'CZ', 'BR'
  const url = new URL(req.url);
  const host = url.host;

  const target = DOMAIN_BY_COUNTRY[country] ?? 'legacyguard.eu';
  if (host !== target) {
    url.host = target;
    return Response.redirect(url.toString(), 308);
  }
  return undefined;
}

// Na klientovi (LocalizationContext)
export function resolveLanguageForHost(host: string, browserLang: string) {
  const supported = SUPPORTED_LANGS_BY_DOMAIN[host] ?? ['en'];
  const primary = PRIMARY_LANG_BY_DOMAIN[host] ?? 'en';
  return supported.includes(browserLang) ? browserLang : primary;
}
```

```tsx
const MARKET_BY_COUNTRY = { CZ: 'legacyguard.cz', SK: 'legacyguard.sk' } as const;
const DEFAULT_DOMAIN = 'legacyguard.eu';
const PRIMARY_LANG_BY_DOMAIN = { 'legacyguard.cz': 'cs', 'legacyguard.sk': 'sk', 'legacyguard.eu': 'en' } as const;
const SUPPORTED_LANGS_BY_DOMAIN = {
  'legacyguard.cz': ['cs', 'en', 'de'],
  'legacyguard.sk': ['sk', 'en'],
  'legacyguard.eu': ['en'],
} as const;

export function middleware(req: Request) {
  const country = geoCountryFrom(req); // napr. 'CZ', 'BR'
  const url = new URL(req.url);
  const host = url.host; // napr. legacyguard.com
  const target = MARKET_BY_COUNTRY[country as keyof typeof MARKET_BY_COUNTRY] ?? DEFAULT_DOMAIN;

  if (host !== target) {
    url.host = target;
    return Response.redirect(url.toString(), 308);
  }

  return undefined; // pokračuj do aplikácie
}
```

### Výber jazyka na klientovi (LocalizationContext)

```tsx
const host = window.location.host; // napr. legacyguard.cz
const browserLang = navigator.language.split('-')[0]; // napr. 'de'

const SUPPORTED = {
  'legacyguard.cz': ['cs', 'en', 'de'],
  'legacyguard.sk': ['sk', 'en'],
  'legacyguard.eu': ['en'],
} as const;
const PRIMARY = { 'legacyguard.cz': 'cs', 'legacyguard.sk': 'sk', 'legacyguard.eu': 'en' } as const;

const supported = SUPPORTED[host as keyof typeof SUPPORTED] ?? ['en'];
const primary = PRIMARY[host as keyof typeof PRIMARY] ?? 'en';

export const currentLanguage = supported.includes(browserLang) ? browserLang : primary;
export const currentJurisdiction = host.endsWith('.cz') ? 'cz' : host.endsWith('.sk') ? 'sk' : 'eu';
```

### Dôvody a prínosy

- SEO: trvalé 308 presmerovanie na lokálne domény.
- Dôvera: lokálna doména zodpovedá očakávaniu trhu.
- UX: jazyk vychádza z preferencií prehliadača, no rešpektuje podporu na konkrétnej doméne.
- Predvídateľnosť: jurisdikcia je vždy odvodená z domény, nie z jazyka.

## Súvisiace

- [I18N 02 — Language Matrix per Domain](I18N%2002%20%E2%80%94%20Language%20Matrix%20per%20Domain%20774b6b5d04684661b827e714ab23e414.md)
- Feature: Domain and Language Middleware, LocalizationContext
- Dokumenty: ADR 002 — Detekcia jurisdikcie podľa domény a jazyka, I18N 01 — Namespaces
- Revízia:
