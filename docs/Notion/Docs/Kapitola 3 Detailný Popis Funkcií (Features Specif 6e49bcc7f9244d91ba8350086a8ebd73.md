# Kapitola 3: Detailný Popis Funkcií (Features Specification)

Area: Product
Chapter #: 3
Status: Final
Type: Spec

## 3.1 Základné Funkcie (Core Features - Srdce MVP)

Tieto funkcie tvoria jadro zážitku a sú navrhnuté tak, aby priniesli okamžitú hodnotu a vybudovali dôveru.

### 3.1.1 Funkcia: "Magic Onboarding" - Nastavenie na Dve Otázky

- **Problém:** Používatelia sú zahltení zložitými registračnými procesmi a odchádzajú z aplikácií, ktoré im hneď na začiatku ukážu prázdnu obrazovku a povedia "teraz pracuj".
- **Naše Riešenie:** Transformujeme onboarding z administratívnej prekážky na prvý "wow" moment. Pomocou dvoch jednoduchých kontextových otázok okamžite pochopíme situáciu používateľa a vygenerujeme mu personalizovaný plán, čím mu dodáme pocit, že aplikácia mu rozumie a je tu pre neho.
- **Používateľský Príbeh:**
  - **Ako** zaneprázdnená matka ("Family Protector Maria"),
  - **Chcem** hneď po registrácii vidieť relevantné a dosiahnuteľné kroky,
  - **Aby som** nemusela premýšľať, kde začať, a okamžite som cítila, že robím pokrok v ochrane svojej rodiny.

### 3.1.2 Funkcia: "Inteligentný Organizátor Dokumentov"

- **Problém:** Manuálne nahrávanie, pomenovávanie a kategorizácia desiatok dokumentov je zdĺhavá, nudná a demotivujúca práca.
- **Naše Riešenie:** Využívame pokročilú AI (OCR + LLM), ktorá dokument nielen uloží, ale aj "pochopí". Automaticky extrahuje kľúčové metadáta (dátumy, sumy, čísla zmlúv), navrhne správnu kategóriu, vytvorí logické "balíčky" (napr. všetky dokumenty k jednému autu) a nastaví pripomienky. Používateľovi stačí len skontrolovať a potvrdiť.
- **Používateľský Príbeh:**
  - **Ako** človek s neporiadkom v papieroch,
  - **Chcem** len odfotiť poistnú zmluvu a nechať aplikáciu, aby sa postarala o všetko ostatné,
  - **Aby som** ušetril čas a mal istotu, že na dôležitý termín exspirácie nikdy nezabudnem.

### 3.1.3 Funkcia: "Rodinný Štít" - Správa Ochrany Rodiny

- **Problém:** Plánovanie pre prípad núdze je často len o jednom človeku. V kríze však musia konať ostatní, ktorí často nevedia, čo robiť.
- **Naše Riešenie:** Vytvárame centrálne miesto pre aktívnu ochranu rodiny. Používateľ môže pozvať Strážcov (Guardians) a prideliť im granulárne právomoci (napr. "môže vidieť zdravotné dokumenty", "môže kontaktovať právnika"). Súčasťou je aj nastavenie "Dead Man's Switch" a tvorba "Manuálu Prežitia", ktorý dá rodine jasný návod.
- **Používateľský Príbeh:**
  - **Ako** zodpovedný rodič,
  - **Chcem** mať istotu, že ak by som bol hospitalizovaný, môj partner bude mať okamžitý a bezpečný prístup k zdravotným poistkám a kontaktom na lekárov,
  - **Aby** mohol konať rýchlo a bez zbytočného stresu a hľadania.

### 3.1.4 Funkcia: "Sofia AI Companion" - Empatický Sprievodca

- **Problém:** Generické AI chatboty sú neosobné a nerozumejú citlivému kontextu životného plánovania.
- **Naše Riešenie:** Sofia nie je chatbot, je to osobnosť. Je navrhnutá ako starostlivá sprievodkyňa ("Svetluška"), ktorá proaktívne pomáha, vysvetľuje a povzbudzuje. Kľúčovou vlastnosťou je jej **adaptívna osobnosť**, ktorá prispôsobuje svoj komunikačný štýl (empatický vs. pragmatický) preferenciám používateľa.
- **Používateľský Príbeh:**
  - **Ako** niekto, kto sa cíti neisto v právnych otázkach,
  - **Chcem** asistenta, ktorý mi zložité pojmy vysvetlí ľudsky a trpezlivo,
  - **Aby som** mal odvahu a istotu pustiť sa aj do komplexných úloh, ako je tvorba závetu.

## 3.2 Prémiové Funkcie (Premium Features)

Tieto funkcie predstavujú najvyššiu hodnotu produktu a sú kľúčové pre konverziu na platený plán.

### 3.2.1 Funkcia: "Sprievodca Poslednou Vôľou" - Tvorca Závetu

- **Problém:** Tvorba závetu je právne zložitá, emocionálne náročná a drahá, ak sa rieši cez právnika od nuly.
- **Naše Riešenie:** Ponúkame interaktívneho sprievodcu, ktorý mení tvorbu závetu na zmysluplný a posilňujúci zážitok. Funkcie ako **"Návrh na Jedno Kliknutie"**, **"Živý Náhľad"** a **"Real-Time Právna Validácia"** odstraňujú neistotu a šetria čas. Systém je od začiatku navrhnutý pre rôzne jurisdikcie (SK/CZ ako prvé).
- **Používateľský Príbeh:**
  - **Ako** podnikateľ ("Business Owner Peter"),
  - **Chcem** rýchlo a efektívne vytvoriť právne korektný návrh závetu, ktorý zohľadní môj majetok a rodinnú situáciu,
  - **Aby som** mal túto kľúčovú povinnosť splnenú a mohol sa sústrediť na svoje podnikanie s vedomím, že moja rodina je zabezpečená.

### 3.2.2 Funkcia: "Časová Schránka" - Odkazy Naprieč Časom

- **Problém:** Neexistuje jednoduchý a spoľahlivý spôsob, ako zanechať osobné, emocionálne odkazy svojim blízkym, ktoré budú doručené v presne určený čas v budúcnosti.
- **Naše Riešenie:** Vytvárame bezpečný a dôstojný systém na nahrávanie video, audio alebo textových správ. Tieto "kapsule" môžu byť doručené na konkrétny dátum (napr. 18. narodeniny dieťaťa) alebo po aktivácii "Rodinného Štítu". Je to nástroj na zachovanie toho najcennejšieho – hlasu, tváre a odkazu lásky.
- **Používateľský Príbeh:**
  - **Ako** stará mama ("Empty Nester Anna"),
  - **Chcem** nahrať odkaz pre svoje vnúčatá, ktorý si budú môcť pozrieť, keď budú dospelé,
  - **Aby som** im mohla odovzdať svoje životné rady a spomienky, aj keď tu už možno nebudem.

### 3.2.3 Funkcia: "Sieť Profesionálov" - Prepojenie na Právnikov

- **Problém:** Aj ten najlepší digitálny nástroj nenahradí istotu, ktorú dáva konzultácia so živým expertom. Nájsť a overiť kvalitného právnika je však zložité.
- **Naše Riešenie:** Vytvárame kurátorovanú sieť partnerských advokátskych kancelárií. Používateľ si môže priamo z aplikácie na pár klikov objednať platenú odbornú kontrolu svojho závetu. Po kontrole získa jeho dokument vylepšenú **"Pečať Dôvery"**, ktorá potvrdzuje jeho právnu správnosť.
- **Používateľský Príbeh:**
  - **Ako** niekto, kto chce mať 110% istotu,
  - **Chcem** možnosť nechať si svoj digitálne vytvorený závet rýchlo a za rozumnú cenu skontrolovať reálnym právnikom,
  - **Aby som** mal absolútny pokoj v duši, že som neurobil žiadnu chybu.
