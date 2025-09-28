# SUM 01 — CONTRIBUTING_SOLO

Area: Infra, Product
Status: Draft
Type: Dev Guidelines

### 1. Architektúra a Rozhodnutia (Zjednodušené ADR)

- **Stack:** Next.js + Supabase + Windmill. **Prečo:** Hybridný model pre optimálne náklady a flexibilitu.
- **Backend:** Windmill pre asynchrónne úlohy, LangGraph pre AI. **Prečo:** Vyhnutie sa komplexnosti vlastného Node.js servera.
- **UI Komponenty:** shadcn/ui. **Prečo:** Konzistentnosť a rýchlosť vývoja.

---

### 2. Vývojový Workflow (Pravidlá pre Seba)

- **Branching:** "Všetko robím vo `feature` branchi (napr. `feature/will-generator`). Keď je to hotové a otestované lokálne, mergujem to do `main`."
- **Commity:** "Snažím sa robiť malé, atomické commity s jasným popisom (npr. `feat: add live preview to will generator`)."
- **Release:** "`main` branch je vždy nasadený na produkciu cez Vercel. Hotovo."

---

### 3. Konfigurácia a Tajomstvá (Secrets Management)

- "Všetky tajomstvá (API kľúče) sú uložené ako Environment Variables na Verceli pre produkciu a vo Windmille. Lokálne sú v `.env.local`, ktorý je v `.gitignore`."

---

### 4. Databáza a Testovacie Dáta

- "Schéma databázy je definovaná v SQL migráciách v priečinku `/supabase/migrations`. Toto je jediný zdroj pravdy. Pre testovanie si vytvorím jednoduchý skript (`seed.ts`), ktorý mi naplní databázu pár testovacími používateľmi a dokumentmi."

---

### 5. Bezpečnosť (Zdravý Rozum)

- "Moje top 3 riziká sú: 1. Únik dát, 2. Neoprávnený prístup, 3. Zlyhanie služby."
- "Riešim ich takto: 1. E2E šifrovanie a RLS v Supabase. 2. Supabase Auth s 2FA. 3. Používam spoľahlivé cloudové služby (Vercel, Supabase) a mám monitoring."

---

### 6. Testovanie (Pragmatická Stratégia)

- "Pre každú novú, kľúčovú funkciu napíšem aspoň jeden základný End-to-End test v Playwright, ktorý overí jej hlavný scenár. Manuálne preklikám hraničné prípady."

---

### 7. Operácie (Plán "Čo ak?")

- "Ak sa produkcia pokazí, použijem funkciu 'Redeploy' na Verceli a vrátim sa k predchádzajúcemu, funkčnému deploymentu."
- "Ak Supabase zlyhá, skontrolujem ich status stránku a v najhoršom prípade použijem ich 'Point-in-Time Recovery' na obnovu zo zálohy."