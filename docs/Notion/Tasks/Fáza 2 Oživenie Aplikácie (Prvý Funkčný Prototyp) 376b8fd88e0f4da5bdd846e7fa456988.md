# Fáza 2: Oživenie Aplikácie (Prvý Funkčný Prototyp)

Is Sub-task: No
Priority: High
Stage: Fáza 2: Prvý Prototyp
Status: Backlog

### Cieľ

Vytvoriť funkčnú, viacjazyčnú "kostru" aplikácie a overiť základný end-to-end tok.

---

### Podúlohy

- [ ]  **Nastavenie Spojenia:**
    - [ ]  Vo Windmille si vytvoriť "Resources" pre bezpečné uloženie API kľúčov (Supabase service_role_key, Resend API key).
- [ ]  **Implementácia Notifikačného Systému:**
    - [ ]  Vytvoriť vo Windmille skript (TypeScript/Python), ktorý načíta dokumenty s blížiacou sa exspiráciou zo Supabase.
    - [ ]  Vytvoriť ďalší skript, ktorý pošle email cez Resend.
    - [ ]  Spojiť ich do jedného workflow a nastaviť ho, aby sa spúšťal ako Cron Job raz denne.
- [ ]  **Implementácia Dead Man's Switch (Základ):**
    - [ ]  Vytvoriť vo Windmille ďalší Cron Job, ktorý kontroluje neaktivitu používateľov.
    - [ ]  Vytvoriť skript, ktorý v prípade neaktivity pošle prvú sériu varovných emailov.
- [ ]  **Implementácia Generovania PDF:**
    - [ ]  Vytvoriť vo Windmille skript, ktorý prijme dáta (napr. ID závetu), načíta ich zo Supabase a pomocou knižnice (napr. `Puppeteer`) vygeneruje PDF.
    - [ ]  Vystaviť tento skript ako webhook, ktorý môže volať vaša Next.js aplikácia.
- [ ]  **Implementovať Supabase Auth v Next.js:**
    - [ ]  Vytvoriť prihlasovaciu a registračnú stránku (napr. pomocou Supabase Auth UI).
    - [ ]  Vytvoriť chránené routy pomocou Next.js Middleware, ktoré overuje session zo Supabase.
- [ ]  **Vytvoriť Základný UI Layout a Internacionalizáciu (i18n):**
    - [ ]  Implementovať hlavný layout s bočným panelom (Sidebar) a hlavičkou (Header).
    - [ ]  Nastaviť `i18next` a `react-i18next` pre Next.js.
    - [ ]  Vytvoriť štruktúru prekladov (`/public/locales/en`, `/public/locales/sk`, `/public/locales/cs`) s logickými mennými priestormi (`common.json`, `navigation.json`).
    - [ ]  Preložiť základné texty v UI (názvy v navigácii, tlačidlá) pomocou `t()` funkcie.
    - [ ]  Implementovať jednoduchý prepínač jazykov.
- [ ]  **Vytvoriť Prvý End-to-End Tok (s Windmillom):**
    - [ ]  Vytvoriť jednoduchý formulár na stránke `/vault` (napr. len s jedným textovým poľom).
    - [ ]  Po odoslaní formulár zavolá **webhook vo Windmille** (ktorý ste si vytvorili vo Fáze 1).
    - [ ]  Workflow vo Windmille prijme dáta, pomocou uložených credentials sa pripojí k Supabase a zapíše testovacie dáta do tabuľky `documents`.
    - [ ]  Frontend zobrazí správu o úspechu (napr. `t('vault.upload_success')`).

---