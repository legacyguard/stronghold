# Fáza 4: localization — Workflow pre Aktualizáciu Textov

Is Sub-task: No
Links: https://www.deepl.com
Priority: High
Stage: Backlog (Zásobník Nápadov)
Status: Backlog

### Workflow pre Aktualizáciu Textov (Localization)

1. **Zdroj Pravdy:** Všetky texty v angličtine (`en`) sú považované za hlavný zdroj (source of truth).
2. **Úprava Textu:** Ak je potrebná zmena textu, najprv sa upraví v príslušnom `en/translation.json` súbore.
3. **Preklad:** Následne sa rovnaká zmena (s rovnakým kľúčom) musí premietnuť do všetkých ostatných jazykových súborov (`sk/translation.json`, `cz/translation.json`, atď.).
4. **Nástroj na Pomoc:** Pre uľahčenie prekladov zvážiť použitie nástrojov ako [DeepL](https://www.deepl.com) alebo Google Translate, ale finálny preklad musí byť skontrolovaný človekom.

---

### Checklist pre Pridanie Novej Krajiny (napr. Rakúsko — `at`)

- [ ]  **Právna Analýza:** Získať základné právne šablóny a pravidlá pre závet pre danú krajinu.
- [ ]  **Vytvoriť Priečinok Jurisdikcie:** Vytvoriť novú zložku `/content/jurisdictions/at/`.
- [ ]  **Pridať Právne Súbory:**
    - [ ]  `will_templates/` (Markdown šablóny závetov pre Rakúsko).
    - [ ]  `legal_rules.json` (Definícia neopomenuteľných dedičov, atď. pre Rakúsko).
    - [ ]  `validation_rules.ts` (Funkcia na validáciu špecifická pre Rakúsko).
- [ ]  **Pridať Doménu:** V nastaveniach Vercelu pridať novú doménu [`legacyguard.at`](http://legacyguard.at).
- [ ]  **Aktualizovať Middleware:** V kóde middleware doplniť logiku pre rozpoznanie novej domény a priradenie jurisdikcie `at`.
- [ ]  **Pridať Jazykové Preklady:** Ak je potrebný nový jazyk (napr. nemčina — `de`), vytvoriť priečinok `/public/locales/de/` a preložiť všetky `.json` súbory.
- [ ]  **Aktualizovať Jazykovú Maticu:** V kóde doplniť zoznam podporovaných jazykov pre doménu `.at`.
- [ ]  **Otestovať:** Manuálne preklikať celý proces tvorby závetu pre novú jurisdikciu.