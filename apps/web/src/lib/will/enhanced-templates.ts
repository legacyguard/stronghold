import { WillTemplate } from './templates';

// Enhanced Will Templates for different user tiers and jurisdictions
export const ENHANCED_WILL_TEMPLATES: Record<string, WillTemplate> = {

  // ====================================
  // SLOVAK REPUBLIC ENHANCED TEMPLATES
  // ====================================

  enhanced_sk_free: {
    id: 'enhanced_sk_free',
    jurisdiction: 'SK',
    scenario: 'single',
    type: 'holographic',
    userTier: 'free',
    template: `ZÁVET

Ja, {{fullName}}, rodený/á {{birthDate}} v {{birthPlace}}, s trvalým pobytom {{address}}, občan/ka Slovenskej republiky, pri plnom vedomí a zdravom rozume, bez donútenia, týmto vyslovujem svoju poslednú vôľu:

ČLÁNOK I. - ÚVODNÉ USTANOVENIA
Týmto odvolávam všetky predchádzajúce závety a závetné ustanovenia, ktoré som učinil/a.

ČLÁNOK II. - VYKONÁVATEĽ ZÁVETU
Za vykonávateľa závetu určujem {{executor.name}}, bytom {{executor.address}}.
{{#if alternateExecutor}}
V prípade, že by určený vykonávateľ nemohol alebo nechcel túto funkciu vykonávať, určujem za náhradného vykonávateľa {{alternateExecutor.name}}, bytom {{alternateExecutor.address}}.
{{/if}}

ČLÁNOK III. - ROZDELENIE MAJETKU
{{#each assets}}
{{description}} odkazujem {{beneficiary}}{{#if percentage}} v podiele {{percentage}}%{{/if}}.
{{/each}}

{{#if hasChildren}}
{{#if guardian}}
ČLÁNOK IV. - OPATROVNÍK MALOLETÝCH DETÍ
Pre prípad potreby určujem za opatrovníka svojich maloletých detí {{guardian.name}}, bytom {{guardian.address}}.
{{/if}}
{{/if}}

{{#if funeralWishes}}
ČLÁNOK V. - POHREBNÉ ŽELANIA
{{funeralWishes}}
{{/if}}

{{#if digitalAssets}}
ČLÁNOK VI. - DIGITÁLNE AKTÍVA
{{#each digitalAssets}}
Pre účet {{platform}}: {{instructions}}
{{/each}}
{{/if}}

Tento závet píšem vlastnoručne a podpisujem.

Dátum: {{date}}
Miesto: {{city}}

                                    _________________________
                                         {{fullName}}
                                    (vlastnoručný podpis)`,
    requiredFields: ['fullName', 'birthDate', 'birthPlace', 'address', 'executor'],
    optionalFields: ['alternateExecutor', 'guardian', 'funeralWishes', 'digitalAssets'],
    costTier: 'free',
    legalValidation: true,
    estimatedTokens: 1200
  },

  enhanced_sk_paid: {
    id: 'enhanced_sk_paid',
    jurisdiction: 'SK',
    scenario: 'complex',
    type: 'witnessed',
    userTier: 'paid',
    template: `ZÁVET

Ja, {{fullName}}, rodený/á {{birthDate}} v {{birthPlace}}, s trvalým pobytom {{address}}, občan/ka {{citizenship}}, rodné číslo {{birthNumber}}, {{#if maritalStatus}}{{maritalStatus}}{{#if spouseName}}, manžel/ka {{spouseName}}{{/if}}{{/if}}, pri plnom vedomí a zdravom rozume, bez donútenia, týmto vyslovujem svoju poslednú vôľu:

ČLÁNOK I. - ÚVODNÉ USTANOVENIA A ODVOLANIE
1. Týmto odvolávam všetky predchádzajúce závety, kodicily a závetné ustanovenia.
2. Vyhlasuj em, že tento závet obsahuje moju úplnú a konečnú vôľu.
3. V prípade pochybností o výklade tohto závetu rozhoduje vykonávateľ závetu.

ČLÁNOK II. - VYKONÁVATEĽ A SPRÁVA DEDIČSTVA
1. Za vykonávateľa závetu určujem {{executor.name}}, bytom {{executor.address}}, {{executor.relationship}}.
{{#if alternateExecutor}}
2. Za náhradného vykonávateľa určujem {{alternateExecutor.name}}, bytom {{alternateExecutor.address}}, {{alternateExecutor.relationship}}.
{{/if}}
3. Vykonávateľ je oprávnený:
   - vykonávať všetky právne úkony potrebné na vysporiadanie dedičstva
   - predávať nehnuteľnosti a hnuteľné veci v záujme dedičov
   - spravovať majetok do jeho rozdelenia
   - zastupovať dedičskú masu pred súdmi a úradmi

ČLÁNOK III. - ROZDELENIE MAJETKU A DEDIČSKÉ PODIELY
{{#if maritalStatus}}
{{#if spouse}}
1. MANŽELSKÝ PODIEL
Môjmu manželovi/manželke {{spouseName}} odkazujem nasledovný majetok:
{{#each assets}}
{{#if spouseInheritance}}
- {{description}} {{#if value}}(hodnota približne {{value}} EUR){{/if}}{{#if percentage}} - podiel {{percentage}}%{{/if}}
{{/if}}
{{/each}}
{{/if}}
{{/if}}

{{#if hasChildren}}
2. PODIEL DETÍ
Mojim deťom:
{{#each children}}
- {{name}}, {{relationship}}, rodené/é {{birthDate}}
{{/each}}
odkazujem nasledovný majetok:
{{#each assets}}
{{#if childrenInheritance}}
- {{description}} {{#if value}}(hodnota približne {{value}} EUR){{/if}}{{#if percentage}} - podiel {{percentage}}%{{/if}}
{{/if}}
{{/each}}
{{/if}}

3. VŠEOBECNÉ DEDIČSKÉ USTANOVENIA
{{#each assets}}
{{#unless processed}}
{{description}} odkazujem {{beneficiary}}{{#if percentage}} v podiele {{percentage}}%{{/if}}{{#if conditions}} za podmienky: {{conditions}}{{/if}}.
{{/unless}}
{{/each}}

{{#if hasChildren}}
{{#if guardian}}
ČLÁNOK IV. - OPATROVNÍCTVO MALOLETÝCH DETÍ
1. Pre prípad, že by som zomrel/zomrela skôr, než sa moje deti stanú plnoletými, určujem za ich opatrovníka {{guardian.name}}, bytom {{guardian.address}}, {{guardian.relationship}}.
2. Opatrovník má právo rozhodovať o výchove, vzdelávaní a majetku detí v ich najlepšom záujme.
3. Za výkon opatrovníctva môže opatrovník čerpať zo zdrojov určených pre deti primerané odmeňovanie.
{{/if}}
{{/if}}

{{#if specialInstructions}}
ČLÁNOK V. - OSOBITNÉ POKYNY A PODMIENKY
{{specialInstructions}}
{{/if}}

{{#if funeralWishes}}
ČLÁNOK VI. - POHREBNÉ A PIETNE ŽELANIA
1. Pohrebné úkony: {{funeralWishes}}
2. Náklady na pohreb sa uhrádzajú z dedičskej masy prednostne.
3. Žiadam, aby bol pohreb dôstojný ale nie okázalý.
{{/if}}

{{#if digitalAssets}}
ČLÁNOK VII. - DIGITÁLNE AKTÍVA A ONLINE ÚČTY
{{#each digitalAssets}}
1. {{platform}}: {{instructions}}
{{/each}}
Vykonávateľ je oprávnený pristupovať k týmto účtom a spravovať ich v súlade s uvedenými pokynmi.
{{/if}}

ČLÁNOK VIII. - ZÁVEREČNÉ USTANOVENIA
1. Tento závet nadobúda platnosť dňom môjho úmrtia.
2. Je neplatné len to ustanovenie, ktoré odporuje platnému právu, ostatné ustanovenia zostávajú v platnosti.
3. V prípade právnych sporov rozhoduje slovenské právo a slovenské súdy.

Tento závet čítam pred svedkami a podpisujem vlastnoručne.

Dátum: {{date}}
Miesto: {{city}}

                                    _________________________
                                         {{fullName}}
                                    (vlastnoručný podpis)

POTVRDENIE SVEDKOV:
My, nižšie podpísaní, potvrdzujeme, že sme boli prítomní pri podpise tohto závetu a že pôvodca závetu nám oznámil, že tento dokument obsahuje jeho poslednú vôľu.

Svedok 1:                           Svedok 2:
_____________________              _____________________
{{witness1.name}}                  {{witness2.name}}
{{witness1.address}}               {{witness2.address}}
Dátum: {{date}}                    Dátum: {{date}}`,
    requiredFields: ['fullName', 'birthDate', 'birthPlace', 'address', 'citizenship', 'executor', 'witness1', 'witness2'],
    optionalFields: ['birthNumber', 'spouseName', 'children', 'alternateExecutor', 'guardian', 'specialInstructions', 'funeralWishes', 'digitalAssets'],
    costTier: 'smart',
    legalValidation: true,
    estimatedTokens: 2500
  },

  enhanced_sk_family: {
    id: 'enhanced_sk_family',
    jurisdiction: 'SK',
    scenario: 'complex',
    type: 'notarized',
    userTier: 'family_edition',
    template: `NOTÁRSKY ZÁVET

Ja, {{fullName}}, rodený/á {{birthDate}} v {{birthPlace}}, s trvalým pobytom {{address}}, občan/ka {{citizenship}}, rodné číslo {{birthNumber}}, {{#if maritalStatus}}{{maritalStatus}}{{#if spouseName}}, manžel/ka {{spouseName}}, rodenného/ej {{spouseBirthDate}}{{/if}}{{/if}}, pri plnom vedomí a zdravom rozume, bez donútenia, týmto vyslovujem svoju poslednú vôľu pred notárom:

ČLÁNOK I. - VŠEOBECNÉ USTANOVENIA
1. Týmto odvolávam všetky predchádzajúce závety, kodicily a závetné ustanovenia.
2. Vyhlasuj em, že tento závet bol spísaný na môj výslovný príkaz a obsahuje moju úplnú vôľu.
3. Súčasťou tohto závetu sú aj prílohy označené ako Príloha A (zoznam majetku) a Príloha B (rodinný plán).

ČLÁNOK II. - FAMILY LEGACY PLAN - SPRÁVA RODINNÉHO DEDIČSTVA
1. Ustanovujem Rodinný výbor (Family Council) v zložení:
   - Predseda: {{familyCouncil.chairman}}
   - Členovia: {{#each familyCouncil.members}}{{name}}, {{/each}}
2. Rodinný výbor má právomoc:
   - dozerať na plnenie tohto závetu
   - rozhodovať o sporných otázkach súvisiacich s dedičstvom
   - spravovať rodinný majetok v záujme budúcich generácií

ČLÁNOK III. - DIGITÁLNE RODINNÉ ARCHÍVY A LEGACY ASSETS
1. Všetky digitálne aktíva a rodinné archívy sa prenášajú do správy {{digitalExecutor.name}}.
2. Rodinné videá, fotografie a dokumenty sa uchovávajú pre budúce generácie.
3. Prístup k rodinným archívom majú všetci členovia rodiny podľa pravidiel určených Rodinným výborom.

ČLÁNOK IV. - POSTUPNÉ PREVÁDZANIE MAJETKU (GRADUATED INHERITANCE)
1. OKAMŽITÉ DEDIČSTVO (pri úmrtí):
{{#each immediateInheritance}}
- {{description}} → {{beneficiary}} ({{percentage}}%)
{{/each}}

2. MILNÍKOVÉ DEDIČSTVO (pri dosiahnutí veku/udalosti):
{{#each milestoneInheritance}}
- {{milestone}} (vek {{age}} alebo {{event}}): {{description}} → {{beneficiary}}
{{/each}}

3. PODMIENEČNÉ DEDIČSTVO (na základe kritérií):
{{#each conditionalInheritance}}
- Podmienka: {{condition}}
- Majetok: {{description}} → {{beneficiary}}
{{/each}}

ČLÁNOK V. - EMERGENCY LEGACY PROTOCOL
1. V prípade krízovej situácie (choroba, nehoda) sa aktivuje Emergency Legacy Protocol.
2. Oprávnené osoby na pristúpenie k núdzovým informáciám:
{{#each emergencyContacts}}
- {{name}}, {{relationship}}, kontakt: {{contact}}
{{/each}}
3. Núdzové informácie zahŕňajú: zdravotné záznamy, finančné účty, právne dokumenty, kontakty na špecialitov.

ČLÁNOK VI. - BUSINESS SUCCESSION PLAN
{{#if businessAssets}}
1. Podnikateľské aktíva a ich správa:
{{#each businessAssets}}
- {{businessName}} ({{sharePercentage}}% podiel) → {{successor}}
- Podmienky správy: {{managementConditions}}
{{/each}}
2. Prechodné obdobie správy podniku: {{transitionPeriod}} mesiacov
3. Business mentor pre nástupcov: {{businessMentor.name}}
{{/if}}

ČLÁNOK VII. - CHARITABLE LEGACY AND COMMUNITY IMPACT
{{#if charitableGiving}}
1. Charittatívne odkazy:
{{#each charitableGiving}}
- {{organization}}: {{amount}} EUR alebo {{percentage}}% z majetku
- Účel: {{purpose}}
{{/each}}
2. Rodinná nadácia: {{#if familyFoundation}}{{familyFoundation.name}} s počiatočným kapitálom {{familyFoundation.initialCapital}} EUR{{/if}}
{{/if}}

ČLÁNOK VIII. - PERSONAL LEGACY CAPSULES
1. Osobné odkazy pre jednotlivých členov rodiny:
{{#each personalLegacies}}
- Pre {{recipient}}: {{message}}
- Spôsob doručenia: {{deliveryMethod}}
- Termín doručenia: {{deliveryDate}}
{{/each}}

ČLÁNOK IX. - ROZHODCOVSKÉ KONANIE A RIEŠENIE SPOROV
1. Všetky spory súvisiace s týmto závetom sa riešia rozhodcovským konaním.
2. Rozhodca: {{arbitrator.name}}, advokát, {{arbitrator.address}}
3. Náhradný rozhodca: {{alternateArbitrator.name}}
4. Rozhodcovské konanie sa riadi slovenským právom.

ČLÁNOK X. - ZÁVEREČNÉ USTANOVENIA A ÚČINNOSŤ
1. Tento závet nadobúda platnosť dňom môjho úmrtia.
2. Vykonávateľ je povinný informovať všetkých dedičov do 30 dní od úmrtia.
3. Platnosť tohto závetu je nezávislá na prípadnej zmene rodinného stavu alebo narodení ďalších detí.

Závet som si dal pred podpisom prečítať a vyhlasuj em, že vyjadruje moju vôľu.

Dátum: {{date}}
Miesto: {{city}}

                                    _________________________
                                         {{fullName}}
                                    (vlastnoručný podpis)

NOTÁRSKE OSVEDČENIE:
Potvrdzujem, že závetca {{fullName}} sa pred podpisom tohto závetu preukázal dokladom totožnosti, bol spôsobilý na právne úkony a závet podpísal po jeho prečítaní vo svojej prítomnosti.

                                    _________________________
                                    {{notary.name}}, notár
                                    {{notary.office}}
                                    Dátum: {{date}}
                                    Notárska pečiatka`,
    requiredFields: ['fullName', 'birthDate', 'birthPlace', 'address', 'citizenship', 'birthNumber', 'familyCouncil', 'notary'],
    optionalFields: ['spouseName', 'spouseBirthDate', 'businessAssets', 'charitableGiving', 'personalLegacies', 'emergencyContacts'],
    costTier: 'premium',
    legalValidation: true,
    estimatedTokens: 4000
  },

  // ====================================
  // CZECH REPUBLIC ENHANCED TEMPLATES
  // ====================================

  enhanced_cz_free: {
    id: 'enhanced_cz_free',
    jurisdiction: 'CZ',
    scenario: 'single',
    type: 'holographic',
    userTier: 'free',
    template: `ZÁVĚŤ

Já, {{fullName}}, narozen/a {{birthDate}} v {{birthPlace}}, s trvalým pobytem {{address}}, státní občan/ka {{citizenship}}, při plném vědomí a zdravém rozumu, bez nátlaku a donucení, tímto vyhlašuji svou poslední vůli:

ČLÁNEK I. - ZRUŠENÍ PŘEDCHOZÍCH ZÁVĚTÍ
Tímto ruším všechny závěti a závetní ustanovení, která jsem předtím učinil/a.

ČLÁNEK II. - URČENÍ VYKONAVATELE ZÁVĚTI
Za vykonavatele své závěti určuji {{executor.name}}, s adresou {{executor.address}}.
{{#if alternateExecutor}}
V případě, že jmenovaný vykonavatel nebude moci nebo nechce tuto funkci vykonávat, určuji za náhradního vykonavatele {{alternateExecutor.name}}, s adresou {{alternateExecutor.address}}.
{{/if}}

ČLÁNEK III. - DĚDICTVÍ
{{#each assets}}
{{description}} odkazuji {{beneficiary}}{{#if percentage}} v podílu {{percentage}}%{{/if}}.
{{/each}}

{{#if hasChildren}}
{{#if guardian}}
ČLÁNEK IV. - PORUČNÍK NEZLETILÝCH DĚTÍ
Pro případ potřeby určuji za poručníka svých nezletilých dětí {{guardian.name}}, s adresou {{guardian.address}}.
{{/if}}
{{/if}}

{{#if funeralWishes}}
ČLÁNEK V. - POHŘEBNÍ PŘÁNÍ
{{funeralWishes}}
{{/if}}

Tuto závěť píšu vlastnoručně a podpisuji.

Datum: {{date}}
Místo: {{city}}

                                    _________________________
                                         {{fullName}}`,
    requiredFields: ['fullName', 'birthDate', 'birthPlace', 'address', 'citizenship', 'executor'],
    optionalFields: ['alternateExecutor', 'guardian', 'funeralWishes'],
    costTier: 'free',
    legalValidation: true,
    estimatedTokens: 1000
  },

  enhanced_cz_paid: {
    id: 'enhanced_cz_paid',
    jurisdiction: 'CZ',
    scenario: 'complex',
    type: 'witnessed',
    userTier: 'paid',
    template: `ZÁVĚŤ

Já, {{fullName}}, narozen/a {{birthDate}} v {{birthPlace}}, s trvalým pobytem {{address}}, státní občan/ka {{citizenship}}, rodné číslo {{birthNumber}}, {{#if maritalStatus}}{{maritalStatus}}{{#if spouseName}}, manžel/ka {{spouseName}}{{/if}}{{/if}}, při plném vědomí a zdravém rozumu, bez donucení, tímto vyhlašuji svou poslední vůli:

ČLÁNEK I. - ÚVODNÍ USTANOVENÍ
1. Tímto ruším všechny předchozí závěti a závetní ustanovení.
2. Prohlašuji, že tato závěť obsahuje mou úplnou a konečnou vůli.
3. V případě pochybností o výkladu této závěti rozhoduje vykonavatel závěti.

ČLÁNEK II. - VYKONAVATEL A SPRÁVA DĚDICTVÍ
1. Za vykonavatele závěti určuji {{executor.name}}, s adresou {{executor.address}}.
{{#if alternateExecutor}}
2. Za náhradního vykonavatele určuji {{alternateExecutor.name}}, s adresou {{alternateExecutor.address}}.
{{/if}}
3. Vykonavatel je oprávněn vykonávat všechny právní úkony potřebné k vypořádání dědictví.

ČLÁNEK III. - ROZDĚLENÍ MAJETKU
{{#each assets}}
{{description}} odkazuji {{beneficiary}}{{#if percentage}} v podílu {{percentage}}%{{/if}}{{#if conditions}} za podmínky: {{conditions}}{{/if}}.
{{/each}}

{{#if hasChildren}}
{{#if guardian}}
ČLÁNEK IV. - PORUČNICTVÍ NEZLETILÝCH DĚTÍ
Pro případ, že by zemřel/zemřela dříve, než se mé děti stanou zletilými, určuji za jejich poručníka {{guardian.name}}, s adresou {{guardian.address}}.
{{/if}}
{{/if}}

{{#if funeralWishes}}
ČLÁNEK V. - POHŘEBNÍ PŘÁNÍ
{{funeralWishes}}
{{/if}}

{{#if digitalAssets}}
ČLÁNEK VI. - DIGITÁLNÍ AKTIVA
{{#each digitalAssets}}
Pro účet {{platform}}: {{instructions}}
{{/each}}
{{/if}}

ČLÁNEK VII. - ZÁVĚREČNÁ USTANOVENÍ
Tato závěť nabývá platnosti dnem mého úmrtí.

Tuto závěť čtu před svědky a podpisuji vlastnoručně.

Datum: {{date}}
Místo: {{city}}

                                    _________________________
                                         {{fullName}}

POTVRZENÍ SVĚDKŮ:
My, níže podepsaní, potvrzujeme, že jsme byli přítomni při podpisu této závěti a že původce závěti nám oznámil, že tento dokument obsahuje jeho poslední vůli.

Svědek 1:                          Svědek 2:
_____________________             _____________________
{{witness1.name}}                 {{witness2.name}}
{{witness1.address}}              {{witness2.address}}`,
    requiredFields: ['fullName', 'birthDate', 'birthPlace', 'address', 'citizenship', 'executor', 'witness1', 'witness2'],
    optionalFields: ['birthNumber', 'spouseName', 'children', 'alternateExecutor', 'guardian', 'funeralWishes', 'digitalAssets'],
    costTier: 'smart',
    legalValidation: true,
    estimatedTokens: 2000
  }
};

// Export combined templates
export function getAllTemplates(): Record<string, WillTemplate> {
  // Import original templates dynamically
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { WILL_TEMPLATES } = require('./templates');
    return { ...WILL_TEMPLATES, ...ENHANCED_WILL_TEMPLATES };
  } catch (error) {
    console.warn('Could not load original templates:', error);
    return ENHANCED_WILL_TEMPLATES;
  }
}

export function getEnhancedTemplateById(id: string): WillTemplate | undefined {
  return ENHANCED_WILL_TEMPLATES[id];
}

export function getTemplatesByUserTier(
  jurisdiction: string,
  userTier: 'free' | 'paid' | 'family_edition'
): WillTemplate[] {
  return Object.values(ENHANCED_WILL_TEMPLATES).filter(
    template =>
      template.jurisdiction === jurisdiction &&
      template.userTier === userTier
  );
}

export function getTemplatesByJurisdiction(jurisdiction: string): WillTemplate[] {
  return Object.values(ENHANCED_WILL_TEMPLATES).filter(
    template => template.jurisdiction === jurisdiction
  );
}

export async function getEnhancedWillTemplate(
  jurisdiction: string,
  userTier: string
): Promise<WillTemplate | null> {
  const templates = getTemplatesByUserTier(
    jurisdiction,
    userTier as 'free' | 'paid' | 'family_edition'
  );
  return templates.length > 0 ? templates[0] : null;
}