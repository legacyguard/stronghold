# Fáza 2: Oživenie Aplikácie (Prvý Funkčný Prototyp)

Is Sub-task: No
Priority: High
Stage: Fáza 2: Prvý Prototyp
Status: Backlog

### Cieľ

Vytvoriť funkčnú, viacjazyčnú "kostru" aplikácie. Overiť nielen základné používateľské akcie (registrácia, zápis/čítanie dát), ale aj implementovať a otestovať **základy pre kľúčové asynchrónne a plánované procesy**, ktoré tvoria inteligenciu aplikácie.

---

### Podúlohy

- [ ]  **Časť A: Základ Aplikácie a Používateľské Rozhranie**
    - [ ]  **Implementovať Supabase Auth a Základný Layout:**
        - [ ]  Vytvoriť prihlasovacie a registračné stránky.
        - [ ]  Nastaviť `middleware.ts` na ochranu stránok.
        - [ ]  Implementovať hlavný layout (Sidebar, Header).
        - [ ]  **Nastaviť `i18next`** a preložiť základné UI texty do SK/CZ/EN.
- [ ]  **Časť B: Overenie Základného End-to-End Toku (Server Actions)**
    - [ ]  **Implementovať Základnú Správu Dokumentov:**
        - [ ]  Vytvoriť Server Action `addDocument` na zápis metadát do Supabase.
        - [ ]  Vytvoriť Server Action `getDocumentsForUser` na čítanie dát.
        - [ ]  Vytvoriť na stránke `/vault` formulár (`SimpleDocumentUploader`) a zoznam (`DocumentList`), ktoré tieto akcie používajú.
        - [ ]  **Overiť, že celý cyklus (pridanie a následné zobrazenie) funguje.**
- [ ]  **Časť C: Implementácia Základov pre Asynchrónne Procesy (Vercel Functions & Cron)**
    - [ ]  Cieľ: Nahradiť logiku plánovanú pre n8n/Windmill pomocou Vercel Functions. V tejto fáze vytvoríme "kostru" týchto funkcií a overíme, že sa dajú spustiť.
    - [ ]  **Nastaviť Vercel Cron Jobs:**
        - [ ]  Vytvoriť v koreňovom priečinku súbor `vercel.json`.
        - [ ]  Zadefinovať v ňom dva Cron joby podľa nášho plánu:
            - [ ]  Jeden, ktorý sa spúšťa raz denne pre kontrolu exspirácií (cesta: `/api/cron/check-expirations`).
            - [ ]  Druhý, ktorý sa spúšťa raz denne pre kontrolu neaktivity (cesta: `/api/cron/dead-mans-switch`).
        - [ ]  Pridať do Environment Variables na Verceli tajný kľúč `CRON_SECRET` na zabezpečenie týchto endpointov.
    - [ ]  **Implementovať "Kostru" Notifikačného Systému:**
        - [ ]  Vytvoriť súbor `/app/api/cron/check-expirations/route.ts`.
        - [ ]  V tejto funkcii implementovať základnú logiku:
            - [ ]  Overiť `CRON_SECRET`.
            - [ ]  Vytvoriť Supabase klienta so `service_role_key`.
            - [ ]  **Zatiaľ len zalogovať správu** (napr. `console.log("Checking for expiring documents...")`) namiesto reálneho posielania emailov.
        - [ ]  Nasadiť na Vercel a v logoch overiť, že sa funkcia naozaj spúšťa raz denne.
    - [ ]  **Implementovať "Kostru" Dead Man's Switch:**
        - [ ]  Vytvoriť súbor `/app/api/cron/dead-mans-switch/route.ts`.
        - [ ]  V tejto funkcii implementovať základnú logiku:
            - [ ]  Overiť `CRON_SECRET`.
            - [ ]  **Zatiaľ len zalogovať správu** (napr. `console.log("Checking for inactive users...")`).
        - [ ]  Nasadiť na Vercel a v logoch overiť, že sa funkcia spúšťa.
    - [ ]  **Implementovať "Kostru" Generovania PDF:**
        - [ ]  Vytvoriť súbor `/app/api/generate-pdf/route.ts`.
        - [ ]  V tejto funkcii implementovať základnú logiku:
            - [ ]  Overiť, či je používateľ prihlásený.
            - [ ]  **Zatiaľ vrátiť jednoduchú textovú odpoveď** (napr. `return new Response("PDF generation endpoint is working")`) namiesto reálneho generovania PDF.
        - [ ]  Vytvoriť na nejakej stránke testovacie tlačidlo, ktoré zavolá tento endpoint, a overiť, že odpoveď príde správne.