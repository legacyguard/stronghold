# Fáza 3: Inteligentný Mozog (LangGraph + Vercel AI SDK)

Is Sub-task: No
Priority: High
Stage: Fáza 3: Prémiové Funkcie
Status: Backlog

### Cieľ

Postupne implementovať kľúčové, inteligentné funkcie, ktoré definujú hodnotu LegacyGuard.

---

### Podúlohy

- [ ]  **Nastavenie Prototypovacieho Nástroja:**
    - [ ]  Rozbehnúť si lokálne **Flowise** a "naklikať" si prvý jednoduchý RAG (Retrieval-Augmented Generation) chain, ktorý odpovedá na otázky na základe vašej znalostnej bázy. Overiť koncept.
- [ ]  **Nastavenie Monitoringu:**
    - [ ]  Založiť si účet na **LangSmith** a získať API kľúče.
- [ ]  **Implementácia AI Chatu (Sofia):**
    - [ ]  Vytvoriť Next.js API endpoint (`/api/chat`), ktorý bude obsahovať hlavný LangGraph "mozog" Sofie.
    - [ ]  V tomto endpointe implementovať **LangGraph** agenta.
    - [ ]  Vytvoriť pre agenta prvé "nástroje" (tools): `searchDocumentsInSupabase`, `getGuardiansList`.
    - [ ]  Prepojiť ho s LangSmith pre detailný tracing.
    - [ ]  Prepojiť `SofiaAssistant` UI komponent s týmto novým endpointom.
- [ ]  **Implementovať "Časovú Schránku"**
    - [ ]  Vytvoriť UI na nahrávanie video/audio správ
    - [ ]  Vytvoriť Cron Job vo Windmille pre plánované doručenie na konkrétny dátum
    - [ ]  Vytvoriť logiku, ktorá prepojí doručenie "po smrti" s aktiváciou Rodinného Štítu
- [ ]  **Implementovať "Záhradu Odkazu" na Dashboarde**
    - [ ]  Vytvoriť vizuálny komponent `LegacyGarden`
    - [ ]  Prepojiť ho s míľnikmi a akciami používateľa
- [ ]  **Implementovať AI Asistenta Sofiu**
    - [ ]  Vytvoriť `SofiaAssistant` UI komponent
    - [ ]  Implementovať adaptívnu osobnosť (Empatický vs. Pragmatický režim) na základe `user.publicMetadata`
    - [ ]  Vytvoriť workflow, ktorý slúži ako "mozog" Sofie
- [ ]  **Implementácia AI Analýzy Dokumentov:**
    - [ ]  Vytvoriť Next.js API endpoint (`/api/analyze-document`), ktorý bude obsahovať LangGraph logiku pre AI analýzu (OCR -> extrakcia metadát).
    - [ ]  Tento endpoint bude volať Google Vision AI pre OCR.
    - [ ]  Následne pošle extrahovaný text do **LangGraph** agenta, ktorý z neho extrahuje metadáta a navrhne kategóriu.
    - [ ]  Upraviť `DocumentUploader` tak, aby po nahratí súboru zavolal tento endpoint a zobrazil používateľovi výsledky na potvrdenie.

---