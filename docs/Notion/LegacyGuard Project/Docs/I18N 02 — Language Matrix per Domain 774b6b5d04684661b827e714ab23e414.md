# I18N 02 — Language Matrix per Domain

Area: Product, Routing, i18n
Related Feature: UI i18n Layer (../Features%2065472ecceccf486fa4e2b758eb9d3e12/UI%20i18n%20Layer%2097b50617281d417c8a6fb7ef5b133a51.md), Domain and Language Middleware (../Features%2065472ecceccf486fa4e2b758eb9d3e12/Domain%20and%20Language%20Middleware%206533d40329844dff82ec013d7bb8d453.md)
Status: Draft
Type: Dev Guidelines

### Purpose

Central map of supported languages per domain to power middleware routing and client language selection.

### Tier 1 launch markets (domains → languages)

- [legacyguard.de](http://legacyguard.de): DE (primary), EN, PL, UK, RU
- [legacyguard.cz](http://legacyguard.cz): CS (primary), SK, EN, DE, UK
- [legacyguard.sk](http://legacyguard.sk): SK (primary), CS, EN, DE, UK
- [legacyguard.pl](http://legacyguard.pl): PL (primary), EN, DE, CS, UK
- [legacyguard.dk](http://legacyguard.dk): DA (primary), EN, DE, SV, UK
- [legacyguard.at](http://legacyguard.at): DE (primary), EN, IT, CS, UK
- [legacyguard.fr](http://legacyguard.fr): FR (primary), EN, DE, ES, UK
- [legacyguard.ch](http://legacyguard.ch): DE, FR, IT, EN, UK
- [legacyguard.it](http://legacyguard.it): IT (primary), EN, DE, FR, UK
- [legacyguard.hr](http://legacyguard.hr): HR (primary), EN, DE, IT, SR
- [legacyguard.be](http://legacyguard.be): NL, FR, EN, DE, UK
- [legacyguard.lu](http://legacyguard.lu): FR, DE, EN, PT, UK
- [legacyguard.li](http://legacyguard.li): DE (primary), EN, FR, IT, UK
- [legacyguard.es](http://legacyguard.es): ES (primary), EN, FR, DE, UK
- [legacyguard.se](http://legacyguard.se): SV (primary), EN, DE, FI, UK
- [legacyguard.fi](http://legacyguard.fi): FI (primary), SV, EN, DE, UK
- [legacyguard.pt](http://legacyguard.pt): PT (primary), EN, ES, FR, UK
- [legacyguard.gr](http://legacyguard.gr): EL (primary), EN, DE, FR, UK
- [legacyguard.nl](http://legacyguard.nl): NL (primary), EN, DE, FR, UK
- [legacyguard.uk](http://legacyguard.uk): EN (primary), PL, FR, DE, UK
- [legacyguard.lt](http://legacyguard.lt): LT (primary), EN, RU, PL, UK
- [legacyguard.lv](http://legacyguard.lv): LV (primary), RU, EN, DE, UK
- [legacyguard.ee](http://legacyguard.ee): ET (primary), RU, EN, FI, UK
- [legacyguard.hu](http://legacyguard.hu): HU (primary), EN, DE, SK, RO
- [legacyguard.si](http://legacyguard.si): SL (primary), EN, DE, HR, IT
- [legacyguard.mt](http://legacyguard.mt): MT (primary), EN, IT, DE, FR
- [legacyguard.cy](http://legacyguard.cy): EL (primary), EN, TR, RU, UK
- [legacyguard.ie](http://legacyguard.ie): EN (primary), GA, PL, FR, UK
- [legacyguard.no](http://legacyguard.no): NO (primary), EN, SV, DA, UK
- [legacyguard.is](http://legacyguard.is): IS (primary), EN, DA, NO, UK

### Tier 2 expansion markets

- [legacyguard.ro](http://legacyguard.ro): RO (primary), EN, DE, HU, UK
- [legacyguard.bg](http://legacyguard.bg): BG (primary), EN, DE, RU, UK
- [legacyguard.rs](http://legacyguard.rs): SR (primary), EN, DE, RU, HR
- [legacyguard.al](http://legacyguard.al): SQ (primary), EN, IT, DE, EL
- [legacyguard.mk](http://legacyguard.mk): MK (primary), SQ, EN, DE, BG
- [legacyguard.me](http://legacyguard.me): ME (primary), SR, EN, DE, RU
- [legacyguard.md](http://legacyguard.md): RO (primary), RU, EN, UK, BG
- [legacyguard.ua](http://legacyguard.ua): UK (primary), RU, EN, PL, RO
- [legacyguard.ba](http://legacyguard.ba): BS (primary), HR, SR, EN, DE

### Implementation notes

- Use these sets in Edge middleware for geolocation-based 308 redirects and in client boot for language availability.
- The first language in each list is the primary fallback for the domain.
- Keep this doc as the single source of truth for SUPPORTED_LANGS_BY_DOMAIN and PRIMARY_LANG_BY_DOMAIN.

### Success criteria linkage

- Each domain exposes 4–5 languages in the language switcher.
- Primary language is defaulted when browser language is unsupported.

### Review

### Related

- [ADR 002 — Detekcia jurisdikcie podľa domény a jazyka](ADR%20002%20%E2%80%94%20Detekcia%20jurisdikcie%20pod%C4%BEa%20dom%C3%A9ny%20a%20jazy%20a59a0bffb8344edfb9415af72295f031.md)
- Last Reviewed: