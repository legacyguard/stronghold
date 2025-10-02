# Kapitola 5: Bezpečnosť a Súkromie - Naša Najvyššia Priorita

Area: Product
Chapter #: 5
Status: Final
Type: Spec

## 5.1 Základný Princíp: Zero-Knowledge Architecture

Základným kameňom našej bezpečnosti je, že **my, ako prevádzkovatelia služby, nemôžeme čítať citlivý obsah našich používateľov**. Toto nie je sľub, je to technický fakt, ktorý je vynútený našou architektúrou.

- **End-to-End Šifrovanie (E2EE):**
    1. Keď používateľ nahrá dokument, tento súbor je zašifrovaný **priamo v jeho prehliadači** pomocou silnej kryptografickej knižnice (napr. `tweetnacl-js`).
    2. Šifrovací kľúč je odvodený od hesla používateľa a **nikdy neopustí jeho zariadenie**.
    3. Do nášho úložiska (Supabase Storage) sa nahrá len zašifrovaný, nečitateľný "blob" dát.
    4. Keď si používateľ chce dokument zobraziť, zašifrovaný súbor sa stiahne do jeho prehliadača a dešifruje sa opäť lokálne pomocou jeho kľúča.

## 5.2 Ochrana Dát v Pokoji a pri Prenose (Data at Rest & in Transit)

- **Pri Prenose:** Všetka komunikácia medzi prehliadačom používateľa a našimi servermi je šifrovaná pomocou **HTTPS (TLS 1.2+)**.
- **V Pokoji (At Rest):**
  - **Obsah Súborov:** Je end-to-end šifrovaný kľúčom používateľa (viď bod 5.1).
  - **Metadáta v Databáze:** Samotná Supabase databáza šifruje všetky dáta na úrovni disku (encryption at rest).

## 5.3 Kontrola Prístupu a Dátová Izolácia

- **Autentifikácia:** Supabase zabezpečuje robustnú ochranu proti útokom, vynucuje silné heslá, ponúka dvojfaktorovú autentifikáciu (2FA) a chráni pred neoprávneným prístupom k účtu.
- **Autorizácia na Úrovni Databázy (RLS):** Využívame **Row Level Security** v Supabase na maximum. Každý dopyt do databázy je automaticky filtrovaný na úrovni servera tak, aby používateľ mohol čítať a zapisovať **výhradne svoje vlastné dáta**. Toto pravidlo je neobíditeľné a chráni pred chybami v kóde alebo pokusmi o neoprávnený prístup.
- **Granulárne Právomoci Strážcov:** Prístup Strážcov k dátam v núdzovom režime nie je plošný. Systém im zobrazí len tie informácie, na ktoré im používateľ explicitne udelil povolenie.

## 5.4 Súlad s GDPR a Európska Infraštruktúra

- **Umiestnenie Dát:** Všetky kľúčové služby (Supabase, Vercel Functions) sú nakonfigurované tak, aby bežali v **európskych dátových centrách** (napr. Frankfurt, Írsko), čím sa minimalizuje prenos dát mimo EÚ.
- **Práva Používateľa:** Aplikácia je navrhnutá tak, aby rešpektovala práva používateľa podľa GDPR:
  - **Právo na Prístup:** Používateľ si môže vyžiadať export svojich dát.
  - **Právo na Zabudnutie:** Proces zmazania účtu spúšťa kaskádové mazanie všetkých súvisiacich dát v našich systémoch.
- **Spracovatelia Údajov:** Vedieme zoznam všetkých sub-dodávateľov (Supabase, Google, Resend) a máme s nimi uzavreté zmluvy o spracovaní údajov (DPA).

## 5.5 Bezpečnosť na Strane Aplikácie

- **Ochrana API Kľúčov:** Všetky citlivé kľúče (Supabase Service Key, OpenAI API Key, Resend API Key) sú uložené výhradne v serverových premenných prostredia na Verceli a nikdy nie sú vystavené na frontende.
- **Zabezpečenie Serverless Funkcií:** Naše API endpointy sú chránené pred neoprávneným volaním (napr. Cron Joby overujú tajný kľúč).
