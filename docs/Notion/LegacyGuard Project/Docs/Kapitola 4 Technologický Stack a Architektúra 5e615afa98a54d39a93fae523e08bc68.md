# Kapitola 4: Technologický Stack a Architektúra

Area: Product
Chapter #: 4
Status: Final
Type: Spec

**Kapitola 4: Technologický Stack a Architektúra**

**4.1 Filozofia Výberu Technológií**

Náš technologický stack nebol vybraný náhodne. Každý nástroj a služba boli zvolené tak, aby spĺňali tri kľúčové kritériá:

1. **Bezpečnosť a Súkromie na Prvom Mieste:** Preferujeme riešenia, ktoré podporujú end-to-end šifrovanie, sú v súlade s GDPR a umožňujú nám budovať Zero-Knowledge architektúru.
2. **Prémiový Používateľský Zážitok:** Volíme technológie, ktoré umožňujú rýchle, plynulé a vizuálne bohaté rozhrania (napr. Framer Motion).
3. **Škálovateľnosť a Efektivita Vývoja:** Využívame moderné, serverless a "developer-friendly" platformy, ktoré nám umožňujú rýchlo iterovať a zároveň byť pripravení na budúci rast.

**4.2 Prehľad Architektúry**

LegacyGuard je postavený na modernej, oddelenej (jamstack) architektúre, kde je frontend plne oddelený od backendových služieb.

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   Používateľ     │      │    Frontend      │      │  Backend Služby  │
│ (Prehliadač)     ├─────►│ (Vite + React)   ├─────►│    (API-first)   │
└──────────────────┘      └──────────────────┘      └──────────────────┘
       ▲                      ▲         │                  ▲
       │                      │         │                  │
       └──────────────────────┴─────────┘                  │
            (End-to-End Šifrovanie)                        │
                                                           ▼
                                                  ┌──────────────────┐
                                                  │    Platformy     │
                                                  │    (Supabase)    │
                                                  └──────────────────┘
```

**4.3 Detailný Popis Komponentov Stacku**

- **Frontend (Klientská Aplikácia):**
    - **Framework:** Next.js. Zvolené pre extrémne rýchly vývojový server, robustný buildovací proces a typovú bezpečnosť, ktorú poskytuje TypeScript.
    - **Styling:** **Tailwind CSS**. Umožňuje rýchle prototypovanie a budovanie konzistentného dizajnového systému priamo v kóde. Všetky dizajnové tokeny (farby, fonty) sú centrálne definované v `tailwind.config.ts`.
    - **UI Komponenty:** Kombinácia **shadcn/ui** (pre základné, prístupné komponenty), **Tailadmin** a **Hero UI** (pre prémiové, hotové sekcie) a vlastných komponentov.
    - **Animácie a Interaktivita:** **Framer Motion**. Kľúčový nástroj na vytváranie plynulých prechodov, mikro-interakcií a komplexných animácií ("Záhrada Odkazu"), ktoré definujú prémiový pocit z aplikácie.
    - **Internacionalizácia (i18n):** **i18next** s **react-i18next**. Priemyselný štandard pre správu prekladov, ktorý umožňuje jednoduché pridávanie nových jazykov.
- **Backend a Platformy (Služby):**
    - **Autentifikácia a Správa Používateľov:** Supabase. Zvolené ako špecializované, bezpečné riešenie, ktoré za nás rieši registráciu, prihlasovanie, 2FA, sociálne prihlásenia a správu session. Umožňuje nám sústrediť sa na našu hlavnú logiku.
    - **Databáza a Súborové Úložisko:** **Supabase**. "Open-source Firebase alternatíva", ktorá nám poskytuje:
        
        ▪ **PostgreSQL Databázu:** Robustná, relačná databáza pre ukladanie metadát.
        
        ▪ **Supabase Storage:** Bezpečné úložisko pre end-to-end šifrované súbory.
        
        ▪ **Row Level Security (RLS):** Kľúčová funkcia, ktorá zabezpečuje dátovú izoláciu na úrovni databázy.
        
    - **Backend Logika (Serverless):** **Vercel Functions**. Všetka naša serverová logika (AI analýza, Cron Joby) beží v škálovateľnom, bez-serverovom prostredí.
        
        ▪ **API Endpoints:** Pre komunikáciu s externými službami (napr. Google Vision AI).
        
        ▪ **Cron Jobs:** Pre pravidelné úlohy, ako je kontrola exspirácií a "Dead Man's Switch".
        
    - **AI Analýza (OCR):** **Google Cloud Vision AI**. Zvolené pre vysokú presnosť, širokú jazykovú podporu a rozumnú cenu.
    - **Transakčné Emaily:** **Resend**. Moderná a spoľahlivá služba na doručovanie emailov (notifikácie, pozvánky), s vynikajúcou integráciou pre React a Vercel.
- **Deployment a Infraštruktúra:**
    - **Hosting a CI/CD:** **Vercel**. Platforma postavená pre moderné frontendové aplikácie. Poskytuje nám globálnu CDN, automatické nasadenie pri každom `git push` a bezproblémovú integráciu so serverless funkciami.