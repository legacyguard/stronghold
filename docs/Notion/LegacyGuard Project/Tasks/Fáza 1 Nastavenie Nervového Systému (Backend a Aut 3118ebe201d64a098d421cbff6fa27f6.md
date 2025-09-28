# Fáza 1: Nastavenie "Nervového Systému" (Backend a Auth)

Is Sub-task: No
Priority: High
Stage: Fáza 1: Základy
Status: In Progress

### Cieľ

Mať funkčný a bezpečný backendový základ.

---

### Podúlohy

- [x]  **Nastaviť Supabase CLI**
    - [x]  Prepojiť lokálny projekt s remote Supabase projektom (`supabase link`)
- [x]  **Vytvoriť prvú SQL migráciu**
    - [x]  Definovať tabuľku `documents`
    - [x]  Definovať tabuľku `guardians`
    - [x]  Nastaviť Row Level Security (RLS) pre obe tabuľky
    - [x]  Aplikovať migráciu na remote databázu (`supabase db push`)
- [x]  **Nastaviť Supabase Auth**
    - [x]  Povoliť prihlasovanie emailom a cez sociálne siete (Google, Apple)
- [ ]  **Základné UI a Funkcie:**
    - [ ]  Pripraviť `tailwind.config.ts` s vaším Dizajn Manuálom.
    - [ ]  Vytvoriť základný layout aplikácie (Sidebar, Header).
    - [ ]  Implementovať **jednoduchý** `DocumentUploader` komponent, ktorý len nahrá súbor do Supabase Storage a zapíše metadáta do DB.
    - [ ]  Implementovať `DocumentList` na zobrazenie nahratých dokumentov.
    - [ ]  Implementovať základnú správu Strážcov (pridanie, zobrazenie).
    

---

### Poznámky

V tejto fáze sa nesnažíme o žiadnu AI analýzu ani zložité procesy. Cieľom je mať funkčnú "hlúpu" aplikáciu, kde používateľ môže manuálne nahrávať a spravovať svoje dáta.