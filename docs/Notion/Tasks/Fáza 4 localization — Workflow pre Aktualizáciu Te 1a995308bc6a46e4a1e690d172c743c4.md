# Fáza 4: localization — Workflow pre Aktualizáciu Textov

Is Sub-task: No
Links: <https://www.deepl.com>
Priority: High
Stage: Backlog (Zásobník Nápadov)
Status: Backlog

## Cieľ

Po dokončení všetkých kľúčových funkcií z Fázy 3 pripraviť produkt na jeho prvé verejné spustenie pre slovenský a český trh. Táto fáza zahŕňa vytvorenie verejnej "výkladnej skrine" (Landing Page), kompletnú lokalizáciu a dôkladné finálne testovanie.

---

## Podúlohy

- [ ]  **Časť A: Vytvorenie Verejnej Vstupnej Brány (Landing Page)**
  - [ ]  Cieľ: Vytvoriť prémiovú, presvedčivú a emocionálne rezonujúcu úvodnú stránku, ktorá premení návštevníkov na registrovaných používateľov.
  - [ ]  **Technická Príprava:**
    - [ ]  Vytvoriť novú, verejne prístupnú routu `/` pre landing page.
    - [ ]  Upraviť `middleware.ts` tak, aby sa chránené stránky aplikácie presunuli na `/dashboard` (alebo inú chránenú cestu) a prihlásených používateľov automaticky presmerovával z `/` na `/dashboard`.
  - [ ]  **Implementácia Scenára "Pozvanie na Cestu":**
    - [ ]  **Hero Sekcia:** Vytvoriť úvodnú sekciu na celú obrazovku s animovanou svetluškou Sofiou, ktorá reaguje na pohyb myši, a s hlavným nadpisom, ktorý sa postupne objavuje.
    - [ ]  **Sekcia "Problém & Prísľub":** Implementovať animovanú sekciu, kde sa "chaos" vizuálne transformuje na "poriadok" v "Škatuľke Istoty".
    - [ ]  **Sekcia "Ako to Funguje":** Vytvoriť interaktívny horizontálny scrollovací kontajner, ktorý v troch aktoch (Organize, Protect, Define) odhaľuje kľúčové funkcie pomocou animácií.
    - [ ]  **Sekcia "Naše Záväzky":** Elegantne odprezentovať štyri kľúčové hodnoty (Empatia, Bezpečnosť, Automatizácia, Živý Odkaz).
    - [ ]  **Sekcia "Social Proof":** Pridať sekciu s logami dôveryhodných technológií (Supabase, Vercel) a partnerov ([brnoadvokati.cz](http://brnoadvokati.cz)) na zvýšenie kredibility.
    - [ ]  **Finálne CTA:** Vytvoriť finálnu sekciu, ktorá vracia návštevníka do pokojnej nočnej krajiny a vyzýva ho k registrácii.
  - [ ]  **SEO a Právne Náležitosti:**
    - [ ]  Implementovať `react-helmet-async` na nastavenie správnych meta tagov (title, description, og:image) pre SEO a zdieľanie na sociálnych sieťach.
    - [ ]  Vytvoriť jednoduché stránky `/terms-of-service` a `/privacy-policy` a prepojiť ich z pätičky landing page.
- [ ]  **Časť B: Kompletná Lokalizácia pre SK a CZ Trh (i18n)**
  - [ ]  Cieľ: Zabezpečiť, aby bola celá aplikácia a landing page plne a kvalitne preložená do slovenčiny, češtiny a angličtiny.
  - [ ]  **Finalizácia Štruktúry Prekladov:**
    - [ ]  Skontrolovať, či sú všetky textové reťazce v aplikácii extrahované do `i18next` JSON súborov a či je štruktúra menných priestorov (`common.json`, `dashboard.json`, atď.) logická.
  - [ ]  **Proces Prekladu:**
    - [ ]  **Angličtina (`en`):** Skontrolovať a dokončiť všetky texty v angličtine, ktorá slúži ako hlavný zdroj (source of truth).
    - [ ]  **Slovenčina (`sk`):** Kompletne preložiť všetky menné priestory do slovenčiny.
    - [ ]  **Čeština (`cs`):** Kompletne preložiť všetky menné priestory do češtiny.
    - [ ]  **Kontrola Kvality:** Manuálne preklikať celú aplikáciu v každom z troch jazykov a skontrolovať, či preklady dávajú zmysel v kontexte, či nie sú príliš dlhé a či sa správne zobrazujú.
  - [ ]  **Nastavenie Automatickej Detekcie:**
    - [ ]  Dokončiť logiku v middleware, ktorá na základe domény (`.sk`, `.cz`) a jazyka prehliadača nastaví správnu predvolenú kombináciu jurisdikcie a jazyka.
- [ ]  **Časť C: Finálne Testovanie a Príprava na Nasadenie**
  - [ ]  Cieľ: Odhaliť posledné chyby a zabezpečiť, že produkt je stabilný a spoľahlivý.
  - [ ]  **Automatizované Testovanie:**
    - [ ]  Dokončiť a spustiť komplexný E2E test v Playwright (`full-user-journey.spec.ts`), ktorý simuluje celú cestu nového používateľa.
    - [ ]  Opraviť všetky chyby, ktoré test odhalí.
  - [ ]  **Manuálne Testovanie (Exploratory Testing):**
    - [ ]  Prejsť celú aplikáciu ako reálny používateľ a aktívne sa snažiť "rozbiť" ju.
    - [ ]  Otestovať na rôznych zariadeniach (desktop, tablet, mobil) a v rôznych prehliadačoch (Chrome, Firefox, Safari).
    - [ ]  Otestovať hraničné prípady (nahrávanie veľkých súborov, pomalé internetové pripojenie, zadávanie nesprávnych dát do formulárov).
  - [ ]  **Kontrola Produkčného Prostredia:**
    - [ ]  Na Verceli skontrolovať, či sú všetky Environment Variables (API kľúče, tajomstvá pre Cron) správne nastavené pre produkčné prostredie.
    - [ ]  V Supabase skontrolovať, či sú všetky databázové migrácie aplikované a RLS politiky aktívne.
    - [ ]  Overiť, či sú domény (`.sk`, `.cz`) správne nakonfigurované a smerujú na Vercel projekt.
