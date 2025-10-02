## GAP analýza: Fáza 4 (Localization & Landing) + Family Collaboration

### Účel dokumentu
- **Cieľ**: Zjednotiť požiadavky Fázy 4 (verejná landing stránka, i18n, middleware, SEO, právne stránky) a Family Collaboration (pozvania, roly, kalendár, míľniky) s aktuálnym stavom kódu a navrhnúť bezpečný a realistický implementačný plán.
- **Zdrojové dokumenty**: `Kapitola 1–5 (Produktová vízia, cesta, funkcionality, tech stack, bezpečnosť)`, úloha `Fáza 4 localization — Workflow pre Aktualizáciu Textov`, feature návrhy `Family Collaboration`, `Moja rodina (Family Tree + roly)`.
- **Tón a cieľovka**: Primárne muži 35–65. Komunikácia a UI musia pôsobiť seriózne, profesionálne a kompetentne. Sofia je poradkyňa, nie personifikovaná „postavička“.

---

## 1) Fáza 4 – GAP analýza a plán

### 1.1 Aktuálny stav vs. požiadavky
- **Routing a presmerovania**: `middleware.ts` už rozlišuje verejné trasy a presmerúva prihlásených z `/` na `/dashboard` (OK).
- **Landing**: Komponenty existujú (`HeroSection`, `ProblemPromiseSection`, `HowItWorksSection`, `ValuesSection`, `SocialProofSection`, `FinalCTASection`). Vizuálne však využívajú „svetelnú Sofiu“, hviezdy, častice a výrazné animácie – to nesedí na cieľovú skupinu.
- **i18n**: Konfigurácia `i18next` existuje (`src/lib/i18n.ts`, `language-matrix.ts`), ale landing používa dočasný `useTranslationMock`. `LocalizationContext` je provizórny.
- **SEO/OG**: `page.tsx` používa Next.js `Metadata` API (OK). Je prítomný `api/og` (OK). Chýba JSON‑LD a jazykové alternates via doména + cookie.
- **Právne stránky**: `terms-of-service/page.tsx`, `privacy-policy/page.tsx` existujú (OK), ale bez i18n a SK/CZ/EN verzií.
- **Detekcia jazyka/jurisdikcie**: V `middleware.ts` chýba nastavenie jazykovo‑jurisdikčných cookies podľa domény a `Accept-Language`.
- **Brand**: v metadátach sa mieša „Stronghold“ a „LegacyGuard“ – vyžaduje zjednotenie.

### 1.2 Odporúčané zmeny (bezpečné minimum)
- **Tón a vizuál** (priorita):
  - Nahradiť „Sofia light“, hviezdy, hory a časticové efekty v `HeroSection`/`FinalCTASection` profesionálnym, statickým vizuálom (fotografia business triedy alebo decentná textúra). Mikro‑animácie iba jemné (fade/translate ≤200ms).
  - V textoch používať priamy, vecný jazyk. Zdôrazniť istotu, právnu korektnosť, úsporu času a ochranu rodiny.
- **Middleware**:
  - Podľa `hostname` nastaviť `lg_jurisdiction` (napr. `.sk`→`sk`, `.cz`→`cs`; iné→`en`).
  - Z `Accept-Language`/cookie určiť `lg_lang` s fallbackom na doménový primárny jazyk. Nastaviť cookie (TTL 1 rok).
- **SEO/OG/JSON‑LD**:
  - `generateMetadata` podľa jazyka a jurisdikcie, pridať `alternates.languages` (sk/cs/en) a JSON‑LD (`Organization`, `Product`/`WebSite`).
  - OG obrázok generovať cez `api/og` s lokalizovanými textami.
- **Právne stránky**:
  - Zapnúť i18n, prepojiť z pätičky landing, doplniť disclaimery a odkaz na GDPR.
- **Claimy**:
  - Overiť produkčnú pripravenosť jurisdikcií; ak nie všetky, komunikovať „SK/CZ teraz, ďalšie čoskoro“.
- **Brand**:
  - Zjednotiť názov (LegacyGuard vs. Stronghold) v metadátach, prekladoch a doménovej matici.

### 1.3 PR roadmapa (Fáza 4)
- **PR1 – i18n re‑enable + cookies**: zapnúť `i18n`, čítanie/zápis `lg_lang`/`lg_jurisdiction` v `middleware.ts`, migrácia landing na `react-i18next`.
- **PR2 – Hero/Final CTA refaktor**: odstrániť infantilné prvky, pridať profesionálny hero/CTA blok.
- **PR3 – Ostatné sekcie**: `Problem/Promise`, `HowItWorks` (3 fixné kroky), `Values` (bez častíc), `SocialProof` (reálne logá partnerov/tech stacku).
- **PR4 – SEO & JSON‑LD**: dynamické `generateMetadata`, alternates, JSON‑LD, vylepšený `api/og`.
- **PR5 – Právne stránky i18n**: `terms-of-service`, `privacy-policy` v SK/CZ/EN.
- **PR6 – Testy**: Playwright E2E (jazyk, sekcie, CTA, redirect), accessibility audit (kontrast, heading order), manuálne QA.

### 1.4 Otvorené otázky (Fáza 4)
- Branding: jednotný názov a domény? (LegacyGuard vs. Stronghold)
- Jurisdikcie na landing: 5× hneď, alebo „SK/CZ teraz, ostatné čoskoro“?
- Sofia na landing: ponechať iba textové referencie (poradkyňa) bez vizuálnej personifikácie?
- Mikro‑animácie: povolené minimalistické efekty (≤200ms), alebo úplne statické?
- Cookies: názvy/TTL `lg_lang`, `lg_jurisdiction` potvrdiť.
- Terms/Privacy: finálny obsah pre SK/CZ/EN vs. extrakcia z `docs/Will/Markdown`.
- Domény: finálne `.sk/.cz` pre `language-matrix.ts` a metadata.

---

## 2) Family Collaboration – architektonický plán

### 2.1 Aktuálny stav
- **DB**: `family_members` (owner, member, email, rola, permissions, invitation_status, emergency flag) – základ existuje.
- **FE prototypy**: `FamilyCollaborationManager` (in‑memory logika), `FamilyDashboard` UI pre členov/pozvánky/emergency, kalendár je placeholder.
- **Duplicitná doména**: existuje tabuľka `guardians` + server action `addGuardian` – prechodne zachovať, smerovať na jednotný model `family_members`.

### 2.2 Cieľový model
- **Jeden zdroj pravdy**: `family_members` pre členov, pozvánky, roly, granular permissions, emergency.
- **Pozvánky**: e‑mail + bezpečný jednorazový token (TTL 7 dní), stavový automat (pending→accepted/declined/expired), audit.
- **Oprávnenia**: default podľa roly, per‑member doladenie v `permissions` JSON (auditovateľné).
- **Kalendár/Míľniky**: samostatné tabuľky viazané na `family_owner_id`, RLS, indexy; ICS export. Integrácie (Google/Outlook) neskôr.
- **Konflikt pravidlá**: validačná vrstva (per jurisdikcia) v BE + vizuálne upozornenia v FE.

### 2.3 DB návrh (rozšírenia)
- **`family_members` doplniť**: `invitation_token` (unique), `token_expires_at`, `invited_by_user_id`, `accepted_by_user_id`, `meta jsonb`.
- **Nové tabuľky**:
  - `family_calendar_events`: `id, family_owner_id, title, description, type, start_at, end_at, organizer_user_id, attendee_member_ids uuid[], related_document_id, related_milestone_id, created_at, updated_at`.
  - `family_milestones`: `id, family_owner_id, title, description, type, due_at, beneficiary_member_id, status enum('planned','done','skipped'), completed_at, created_at, updated_at`.
- **RLS**: plný prístup pre `family_owner_id`, člen má SELECT na vlastné záznamy/pozvánky cez `member_user_id`.
- **Migrácia `guardians` → `family_members`**: jednorazový INSERT s mapovaním rolí, status `accepted`.

### 2.4 Server Actions (Next.js)
- `actions/family/invitations.ts`: `createInvitation`, `revokeInvitation`, `acceptInvitation`, `declineInvitation`.
- `actions/family/members.ts`: `listMembers`, `updateMemberRole`, `updateMemberPermissions`, `removeMember`.
- `actions/family/calendar.ts`: `createEvent`, `updateEvent`, `deleteEvent`, `listEvents`.
- `actions/family/milestones.ts`: `createMilestone`, `completeMilestone`, `listMilestones`.
- `actions/family/emergency.ts`: `configureDeadMansSwitch`, `checkIn`, `triggerEmergency`.

### 2.5 Frontend (seriózny UI)
- **FamilyDashboard**: sekcie Members, Invitations, Emergency, Calendar, Milestones; bez gamifikácie, jasné stavy a upozornenia.
- **Family Tree**: nový komponent `FamilyTree.tsx` – čitateľný hierarchický layout, pan/zoom jemný, bez častíc; zvýraznenie konfliktov neutrálne.
- **Calendar/Milestones**: zoznam + detail, ICS export; integrácie neskôr.

### 2.6 Roly, oprávnenia, konflikty
- **Roly**: `guardian`, `executor`, `heir`, `emergency_contact`, `advisor`, `witness`.
- **Permissions**: defaulty podľa roly, možnosť per‑member úprav (audit).
- **Konfliktné pravidlá** (minimálne SK/CZ):
  - `executor` ≠ `witness` (konflikt záujmov).
  - `witness` vek ≥18, v niektorých jurisdikciách nesmie byť priamy dedič.
  - `guardian` vek ≥18; `emergency_contact` odporúčané ≥18.
  - Validácia v BE (`legal/validation-engine`) + UI upozornenia.

### 2.7 Notifikácie a e‑maily
- Resend šablóny: Invitation, Invitation Reminder, Emergency Triggered.
- Tón: formálny, vecný, bez emotikonov; právne disclaimery, odkazy na Terms/Privacy.

### 2.8 Audit a bezpečnosť
- Auditovať zmeny členov/rolí/permissions (`audit_logs`).
- Tokeny: jednorazové, viazané na e‑mail a ownera, krátke TTL, `meta` s IP/UA odtlačkom.
- Zdieľanie dokumentov výlučne cez `document_shares`.

### 2.9 Roadmapa (Family Collaboration)
- **PR1 – DB rozšírenia + RLS + migrácia guardians**
- **PR2 – Server Actions + notifikácie**
- **PR3 – UI Members/Invitations/Emergency + i18n**
- **PR4 – Family Tree MVP + konfliktná validácia**
- **PR5 – Calendar/Milestones UI + ICS export**
- **PR6 – E2E testy (pozvánky, role, emergency, ICS), accessibility**

### 2.10 Otvorené otázky (Family)
- 1 owner na „family workspace“, alebo viac spoluvlastníkov?
- Kto môže pozývať: iba owner/executor, alebo aj iné roly s `inviteMembers`?
- Kalendár: stačí interný + ICS export vs. hneď OAuth sync?
- Konflikty: implementovať minimálne SK/CZ hneď a ostatné neskôr?
- Súhlas s deprecáciou tabuľky `guardians` (ponechať RO pre spätnú kompatibilitu)?
- Resend: použitie jednoduchých transakčných šablón a logging doručenia áno?
- Family Tree: React Flow vs. vlastný „clean“ layout bez ďalších závislostí?

---

## 3) Emergency Activation System – analýza a plán

### 3.1 Cieľ a princípy
- **Cieľ**: Detegovať krízové stavy (neaktivita, manuálne spustenie), overiť ich 24h potvrdením strážcov a fázovane sprístupňovať vopred definované informácie.
- **Princípy bezpečnosti**: Žiadny serverový prístup k E2EE obsahu. V MVP sprístupňujeme len „Emergency Instructions“ (pokyny, kontakty), notifikácie a meta‑informácie, nie obsah trezora.

### 3.2 Stav v kóde – oporné body
- Cron „dead man’s switch“ a `DeadMansSwitchService` (detekcia neaktivity, prahy `WARNING/CRITICAL/EMERGENCY`).
- Tabuľky: `emergency_access_events`, `document_shares`, `family_members`, `audit_logs` (logovanie). 
- Notifikácie: `NotificationService` – doplníme šablóny a e‑mail provider.

### 3.3 DB návrh (doplnky)
- **`emergency_access_policies` (per user)**: `user_id`, prahy `warning_days/critical_days/emergency_days`, `confirmations_required`, `guardians_whitelist uuid[]`, `phases jsonb`, `created_at`, `updated_at`.
- **`emergency_confirmations`**: `id`, `owner_user_id`, `guardian_member_id`, `event_id`, `token_hash`, `status enum('pending','confirmed','expired','revoked')`, `expires_at`, `created_at`.
- **`emergency_instructions`**: `id`, `user_id`, `title`, `content` (bez citlivých údajov), `locale`, `updated_at`.
- Re‑use: `emergency_access_events` (incidenty) a `document_shares` (len ak používateľ výslovne označí „emergency‑safe“ položky – nie E2EE obsah).

### 3.4 API, server actions a cron
- Rozšíriť `/api/cron/dead-mans-switch`: načítať per‑user policies, vytvoriť `event` a prejsť stavmi: `pending_confirmation → confirmed → escalated`.
- Endpointy: `/api/emergency/confirm` (GET s jednorazovým HMAC tokenom), `/api/emergency/cancel` (POST – zrušenie falošného poplachu majiteľom).
- Server actions (`actions/family/emergency.ts`): `configurePolicy`, `getStatus`, `triggerManualActivation`, `confirmGuardian`, `resolveEvent`.
- Notifikácie (Resend): „24h confirm“, „escalated“, „resolved“; pripomienky počas hold intervalu.

### 3.5 UI/UX (seriózne, bez gamifikácie)
- V `FamilyDashboard` > Emergency: konfigurácia prahov (default 30/60/90), kvórum potvrdení, výber strážcov, editor „Emergency Instructions“.
- Prehľad: „Days since last check‑in“, „Hold pending confirmations (X/Y)“, akcie „Check‑in“/„Cancel“.
- Strážca: potvrzovacia stránka po kliknutí z e‑mailu; bez prístupu k dokumentom v MVP.

### 3.6 Bezpečnosť a GDPR
- Žiadne dešifrovanie E2EE dokumentov na serveri. „Emergency Instructions“ nesmú obsahovať obsah trezora.
- Tokeny: jednorazové, krátke TTL (24–48h), v DB ukladať hash; audit všetkých akcií.
- Logy bez PII; obmedzené payloady v cron výpisoch.

### 3.7 Roadmapa (MVP → Fáza 2)
- **MVP**: policies/confirmations/instructions + cron rozšírenie + e‑mail confirmations + základný UI + E2E happy path.
- **Fáza 2**: „Emergency envelope“ (dobrovoľný šifrovaný balík pre strážcov), threshold unlock (2‑of‑N), integrácia s `document_shares` bez narušenia E2EE.

### 3.8 Otvorené otázky (Emergency)
- Kvórum potvrdení: 1‑of‑N vs. 2‑of‑N? Per‑user konfigurovateľné?
- Obsah „Emergency Instructions“: presné zásady (čo smie/nesmie byť, aby sme zachovali E2EE model)?
- MVP rozsah: zahrnúť „manual activation“ pre majiteľa a „guardian request check‑in“?
- Notifikácie: stačí e‑mail, alebo požadujete SMS (vyžaduje ďalšieho providera/DPA)?
- GPS/nemocnica: plánovať až s mobilnou app (out‑of‑scope pre web MVP)?

## 4) Akceptačné kritériá (výber)
- Landing bez infantilných prvkov; UX konzervatívne; kontrast a čitateľnosť overené.
- i18n: jazyk/jurisdikcia správne defaultované podľa domény/prehliadača; prepínač jazyka funguje.
- SEO: korektné `alternate` linky, OG a JSON‑LD.
- Family: pozvánka→prijatie flow, úprava role/permissions, emergency check‑in/trigger, ICS export.
- RLS a audit: všetky operácie rešpektujú RLS; kritické zmeny logované.

---

### Poznámky
- Tento dokument je plánovací artefakt; implementácia bude rozdelená do samostatných PR podľa roadmapy. Všetky texty v UI a komunikácii budú seriózne, zamerané na istotu a kompetenciu.


