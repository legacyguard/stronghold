# Fáza 3: Inteligentný Mozog (LangGraph + Vercel AI SDK)

Is Sub-task: No
Priority: High
Stage: Fáza 3: Prémiové Funkcie
Status: Backlog

### Cieľ

Na funkčný základ z Fázy 2 postupne implementovať kľúčové, inteligentné a emocionálne funkcie, ktoré definujú unikátnu hodnotu LegacyGuard. V tejto fáze premeníme "kostru" na živý, dýchajúci produkt.

---

### Podúlohy

- [ ]  **Časť A: Implementácia Inteligentného Organizátora Dokumentov**
    - [ ]  Cieľ: Nahradiť "hlúpy" upload z Fázy 2 plne automatizovanou AI analýzou.
    - [ ]  **Nastavenie Nástrojov pre AI:**
        - [ ]  Založiť si účet na **LangSmith** pre monitoring a získať API kľúče.
        - [ ]  (Voliteľné, odporúčané) Rozbehnúť si lokálne **Flowise** na rýchle prototypovanie AI chainov.
    - [ ]  **Vytvoriť API Endpoint pre Analýzu Dokumentov:**
        - [ ]  Vytvoriť súbor `/app/api/analyze-document/route.ts`.
        - [ ]  V tomto endpointe implementovať **LangGraph** chain, ktorý:
            1. Prijme súbor od používateľa.
            2. Zavolá externé OCR API (napr. Google Vision AI) na extrakciu textu.
            3. Pošle extrahovaný text do LLM (napr. GPT-4o) s promptom na extrakciu metadát, návrh kategórie a vytvorenie "balíčka".
            4. Vráti štruktúrovaný JSON s výsledkami.
        - [ ]  Prepojiť tento chain s **LangSmith** pre detailný tracing.
    - [ ]  **Aktualizovať Frontend Komponent (`DocumentUploader`):**
        - [ ]  Upraviť `DocumentUploader` tak, aby po výbere súboru najprv zavolal tento nový API endpoint.
        - [ ]  Vytvoriť novú "Potvrdzovaciu Obrazovku" (alebo modálne okno), kde sa používateľovi zobrazia výsledky analýzy (navrhnutá kategória, metadáta, návrh na balíček) a môže ich potvrdiť alebo upraviť.
        - [ ]  Až po potvrdení používateľom sa zavolá Server Action, ktorá finálne dáta zapíše do Supabase.
- [ ]  **Časť B: Implementácia Emocionálneho Jadra**
    - [ ]  Cieľ: Pridať funkcie, ktoré budujú hlboké osobné a emocionálne puto s produktom.
    - [ ]  **Implementovať "Časovú Schránku" (Time Capsule):**
        - [ ]  Vytvoriť UI na nahrávanie video/audio správ a nastavenie podmienok doručenia (`ON_DATE` alebo `ON_DEATH`).
        - [ ]  Vytvoriť Server Action, ktorá nahrá mediálny súbor do Supabase Storage a zapíše metadáta do tabuľky `time_capsules`.
        - [ ]  **Dokončiť logiku v Cron Jobe** (`/api/cron/check-time-capsules`): Pridať reálnu logiku, ktorá načíta kapsule na doručenie a pošle email cez Resend.
    - [ ]  **Implementovať "Záhradu Odkazu" na Dashboarde:**
        - [ ]  Vytvoriť vizuálny SVG komponent `LegacyGarden`, ktorý mení svoj vzhľad na základe dát (napr. počet odomknutých míľnikov).
        - [ ]  Vytvoriť v databáze systém na sledovanie "míľnikov" pre každého používateľa.
        - [ ]  Prepojiť akcie v aplikácii (napr. nahratie prvého dokumentu, pridanie strážcu) s odomykaním týchto míľnikov.
        - [ ]  Implementovať "Moment Uznania" (elegantný banner) po odomknutí nového míľnika.
- [ ]  **Časť C: Implementácia Finálnych Prémiových Funkcií**
    - [ ]  Cieľ: Dodať najkomplexnejšie funkcie, ktoré kompletizujú ponuku produktu.
    - [ ]  **Implementovať "Sprievodcu Poslednou Vôľou":**
        - [ ]  Vytvoriť viac-krokový `WillGeneratorWizard` komponent s "Režimom Sústredenia".
        - [ ]  Implementovať "Živý Náhľad" a "Kontrolu od Sofie".
        - [ ]  **Dokončiť logiku v API endpointe** (`/api/generate-pdf`): Pridať reálnu logiku, ktorá pomocou `Puppeteer` (alebo inej knižnice) vygeneruje finálne PDF z dát závetu.
    - [ ]  **Implementovať Plnohodnotného AI Asistenta Sofiu:**
        - [ ]  Vytvoriť finálny `SofiaAssistant` UI komponent s podporou pre Markdown, auto-scroll a kontextové návrhy.
        - [ ]  Vytvoriť API endpoint (`/api/chat/route.ts`), ktorý bude obsahovať hlavný **LangGraph** "mozog" Sofie.
        - [ ]  Implementovať logiku pre **Adaptívnu Osobnosť** (Empatický vs. Pragmatický režim) na základe `user.publicMetadata`.
        - [ ]  Vytvoriť pre agenta Sofie sadu "nástrojov" (tools), ktoré môže volať (napr. `searchDocuments`, `getGuardians`, `checkWillStatus`).

---