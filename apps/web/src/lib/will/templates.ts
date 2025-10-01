export type WillTemplate = {
  id: string;
  jurisdiction: 'SK' | 'CZ' | 'DE' | 'EN' | 'AT' | 'PL';
  scenario: 'single' | 'married' | 'divorced' | 'children' | 'complex';
  type: 'holographic' | 'witnessed' | 'notarized';
  template: string;
  requiredFields: string[];
  optionalFields: string[];
  costTier: 'free' | 'smart' | 'premium';
  legalValidation: boolean;
  userTier: 'free' | 'paid' | 'family_edition';
  estimatedTokens?: number;
}

export type WillFormData = {
  // Personal Information
  fullName: string;
  birthDate: string;
  birthPlace: string;
  address: string;
  citizenship: string;

  // Marital Status
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  spouseName?: string;
  spouseBirthDate?: string;

  // Children
  hasChildren: boolean;
  children?: Array<{
    name: string;
    birthDate: string;
    relationship: 'son' | 'daughter' | 'adopted';
  }>;

  // Executors
  executor: {
    name: string;
    address: string;
    relationship: string;
  };
  alternateExecutor?: {
    name: string;
    address: string;
    relationship: string;
  };

  // Assets Distribution
  assets: Array<{
    type: 'property' | 'financial' | 'personal' | 'business';
    description: string;
    value?: number;
    beneficiary: string;
    percentage?: number;
  }>;

  // Guardians (for minor children)
  guardian?: {
    name: string;
    address: string;
    relationship: string;
  };

  // Special Instructions
  specialInstructions?: string;
  funeralWishes?: string;

  // Digital Assets
  digitalAssets?: Array<{
    platform: string;
    instructions: string;
  }>;

  // Legal specifics
  jurisdiction: 'SK' | 'CZ' | 'DE' | 'EN';
  language: string;
}

export const WILL_TEMPLATES: Record<string, WillTemplate> = {
  // Slovak Templates
  simple_single_sk: {
    id: 'simple_single_sk',
    jurisdiction: 'SK',
    scenario: 'single',
    type: 'holographic',
    userTier: 'free',
    template: `ZÁVET

Ja, {{fullName}}, rodený/á {{birthDate}} v {{birthPlace}}, s trvalým pobytom {{address}}, štátny občan/ka {{citizenship}}, pri plnom vedomí a zdravom rozume, bez nátlaku a prinútenia, týmto vyhlasuju svoju poslednú vôľu:

ČLÁNOK I. - ZRUŠENIE PREDCHÁDZAJÚCICH ZÁVETOV
Týmto zrušujem všetky závetý a závetné ustanovenia, ktoré som predtým učinil/a.

ČLÁNOK II. - URČENIE VYKONÁVATEĽA ZÁVETU
Za vykonávateľa svojho závetu určujem {{executor.name}}, s adresou {{executor.address}}.
V prípade, že vymenovaný vykonávateľ nebude môcť alebo nechce túto funkciu vykonávať, určujem za náhradného vykonávateľa {{alternateExecutor.name}}, s adresou {{alternateExecutor.address}}.

ČLÁNOK III. - DEDIČSTVO
{{#each assets}}
{{description}} prepúšťam {{beneficiary}}{{#if percentage}} v podiele {{percentage}}%{{/if}}.
{{/each}}

{{#if specialInstructions}}
ČLÁNOK IV. - OSOBITNÉ POKYNY
{{specialInstructions}}
{{/if}}

{{#if funeralWishes}}
ČLÁNOK V. - POHREBNÉ PRIANIA
{{funeralWishes}}
{{/if}}

Tento závet píšem vlastnoručně a podpisujem.

V {{city}}, dňa {{date}}

_________________________
{{fullName}}`,
    requiredFields: ['fullName', 'birthDate', 'birthPlace', 'address', 'citizenship', 'executor.name', 'executor.address', 'assets'],
    optionalFields: ['alternateExecutor.name', 'alternateExecutor.address', 'specialInstructions', 'funeralWishes'],
    costTier: 'free',
    legalValidation: true,
    estimatedTokens: 800
  },

  married_with_children_sk: {
    id: 'married_with_children_sk',
    jurisdiction: 'SK',
    scenario: 'married',
    type: 'holographic',
    userTier: 'free',
    template: `ZÁVET

Ja, {{fullName}}, rodený/á {{birthDate}} v {{birthPlace}}, s trvalým pobytom {{address}}, štátny občan/ka {{citizenship}}, manžel/ka {{spouseName}}, pri plnom vedomí a zdravom rozume, bez nátlaku a prinútenia, týmto vyhlasuju svoju poslednú vôľu:

ČLÁNOK I. - ZRUŠENIE PREDCHÁDZAJÚCICH ZÁVETOV
Týmto zrušujem všetky závetý a závetné ustanovenia, ktoré som predtým učinil/a.

ČLÁNOK II. - URČENIE VYKONÁVATEĽA ZÁVETU
Za vykonávateľa svojho závetu určujem {{executor.name}}, s adresou {{executor.address}}.

ČLÁNOK III. - DEDIČSTVO
V prípade, že ma prežije môj manžel/manželka {{spouseName}}, prepúšťam mu/jej:
{{#each assets}}
{{#if spouseInheritance}}
- {{description}}{{#if percentage}} v podiele {{percentage}}%{{/if}}
{{/if}}
{{/each}}

Mojim deťom:
{{#each children}}
- {{name}}, rodené/é {{birthDate}}
{{/each}}
prepúšťam:
{{#each assets}}
{{#if childrenInheritance}}
- {{description}}{{#if percentage}} v podiele {{percentage}}%{{/if}}
{{/if}}
{{/each}}

{{#if guardian}}
ČLÁNOK IV. - PORUČNÍK PRE MALOLETÝCH
V prípade, že by moje deti boli v čase mojej smrti maloletké, určujem za ich poručníka {{guardian.name}}, s adresou {{guardian.address}}.
{{/if}}

{{#if specialInstructions}}
ČLÁNOK V. - OSOBITNÉ POKYNY
{{specialInstructions}}
{{/if}}

Tento závet píšem vlastnoručně a podpisujem.

V {{city}}, dňa {{date}}

_________________________
{{fullName}}`,
    requiredFields: ['fullName', 'birthDate', 'birthPlace', 'address', 'citizenship', 'spouseName', 'children', 'executor.name', 'executor.address', 'assets'],
    optionalFields: ['guardian.name', 'guardian.address', 'specialInstructions', 'funeralWishes'],
    costTier: 'smart',
    legalValidation: true
  },

  // Czech Templates
  simple_single_cz: {
    id: 'simple_single_cz',
    jurisdiction: 'CZ',
    scenario: 'single',
    template: `POSLEDNÍ VŮLE

Já, {{fullName}}, narozený/á {{birthDate}} v {{birthPlace}}, s trvalým pobytem {{address}}, státní občan/ka {{citizenship}}, při plném vědomí a zdravém rozumu, bez nátlaku a donucení, tímto prohlašuji svou poslední vůli:

ČLÁNEK I. - ZRUŠENÍ PŘEDCHOZÍCH ZÁVĚTÍ
Tímto ruším všechny závěti a závetní ustanovení, která jsem dříve učinil/a.

ČLÁNEK II. - URČENÍ VYKONAVATELE ZÁVĚTI
Za vykonavatele své závěti určujem {{executor.name}}, s adresou {{executor.address}}.

ČLÁNEK III. - DĚDICTVÍ
{{#each assets}}
{{description}} odkázuji {{beneficiary}}{{#if percentage}} v podílu {{percentage}}%{{/if}}.
{{/each}}

{{#if specialInstructions}}
ČLÁNEK IV. - ZVLÁŠTNÍ POKYNY
{{specialInstructions}}
{{/if}}

Tuto závěť píši vlastnoručně a podepisuji.

V {{city}}, dne {{date}}

_________________________
{{fullName}}`,
    requiredFields: ['fullName', 'birthDate', 'birthPlace', 'address', 'citizenship', 'executor.name', 'executor.address', 'assets'],
    optionalFields: ['specialInstructions', 'funeralWishes'],
    costTier: 'free',
    legalValidation: true
  },

  // German Templates
  simple_single_de: {
    id: 'simple_single_de',
    jurisdiction: 'DE',
    scenario: 'single',
    template: `TESTAMENT

Ich, {{fullName}}, geboren am {{birthDate}} in {{birthPlace}}, wohnhaft {{address}}, Staatsangehörigkeit {{citizenship}}, bei vollem Bewusstsein und gesundem Verstand, ohne Zwang und Nötigung, erkläre hiermit meinen letzten Willen:

ARTIKEL I. - WIDERRUF FRÜHERER TESTAMENTE
Hiermit widerrufe ich alle Testamente und testamentarischen Verfügungen, die ich früher errichtet habe.

ARTIKEL II. - BESTIMMUNG DES TESTAMENTSVOLLSTRECKERS
Zum Testamentsvollstrecker bestimme ich {{executor.name}}, wohnhaft {{executor.address}}.

ARTIKEL III. - ERBSCHAFT
{{#each assets}}
{{description}} vermache ich {{beneficiary}}{{#if percentage}} zu {{percentage}}%{{/if}}.
{{/each}}

{{#if specialInstructions}}
ARTIKEL IV. - BESONDERE ANWEISUNGEN
{{specialInstructions}}
{{/if}}

Dieses Testament schreibe ich eigenhändig und unterschreibe es.

{{city}}, den {{date}}

_________________________
{{fullName}}`,
    requiredFields: ['fullName', 'birthDate', 'birthPlace', 'address', 'citizenship', 'executor.name', 'executor.address', 'assets'],
    optionalFields: ['specialInstructions', 'funeralWishes'],
    costTier: 'free',
    legalValidation: true
  },

  // English Templates
  simple_single_en: {
    id: 'simple_single_en',
    jurisdiction: 'EN',
    scenario: 'single',
    template: `LAST WILL AND TESTAMENT

I, {{fullName}}, born {{birthDate}} in {{birthPlace}}, residing at {{address}}, citizen of {{citizenship}}, being of sound mind and memory, not under duress or undue influence, hereby declare this to be my Last Will and Testament:

ARTICLE I. - REVOCATION OF PRIOR WILLS
I hereby revoke all wills and testamentary dispositions heretofore made by me.

ARTICLE II. - APPOINTMENT OF EXECUTOR
I appoint {{executor.name}}, residing at {{executor.address}}, as Executor of this my Will.

ARTICLE III. - BEQUESTS
{{#each assets}}
I give, devise and bequeath {{description}} to {{beneficiary}}{{#if percentage}} in the proportion of {{percentage}}%{{/if}}.
{{/each}}

{{#if specialInstructions}}
ARTICLE IV. - SPECIAL INSTRUCTIONS
{{specialInstructions}}
{{/if}}

IN WITNESS WHEREOF, I have hereunto set my hand this {{date}} in {{city}}.

_________________________
{{fullName}}`,
    requiredFields: ['fullName', 'birthDate', 'birthPlace', 'address', 'citizenship', 'executor.name', 'executor.address', 'assets'],
    optionalFields: ['specialInstructions', 'funeralWishes'],
    costTier: 'free',
    legalValidation: true
  }
};

// Template utilities
export function getTemplatesByJurisdiction(jurisdiction: string): WillTemplate[] {
  return Object.values(WILL_TEMPLATES).filter(template => template.jurisdiction === jurisdiction);
}

export function getTemplateByScenario(jurisdiction: string, scenario: string): WillTemplate | undefined {
  return Object.values(WILL_TEMPLATES).find(
    template => template.jurisdiction === jurisdiction && template.scenario === scenario
  );
}

export function getTemplateById(id: string): WillTemplate | undefined {
  return WILL_TEMPLATES[id];
}

// Template rendering function
export function renderTemplate(template: WillTemplate, data: WillFormData): string {
  let rendered = template.template;

  // Simple template replacement (in production, use a proper template engine like Handlebars)
  rendered = rendered.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
    const value = getNestedProperty(data, path);
    return value !== undefined ? String(value) : match;
  });

  // Handle conditional blocks and loops (simplified)
  rendered = rendered.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
    const value = getNestedProperty(data, condition);
    return value ? content : '';
  });

  // Handle arrays (simplified)
  rendered = rendered.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, content) => {
    const array = getNestedProperty(data, arrayName);
    if (!Array.isArray(array)) return '';

    return array.map(item => {
      let itemContent = content;
      Object.keys(item).forEach(key => {
        itemContent = itemContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), item[key]);
      });
      return itemContent;
    }).join('\n');
  });

  // Add current date and location
  const now = new Date();
  rendered = rendered.replace(/\{\{date\}\}/g, now.toLocaleDateString(data.language || 'sk-SK'));
  rendered = rendered.replace(/\{\{city\}\}/g, data.address.split(',')[1]?.trim() || 'Bratislava');

  return rendered;
}

function getNestedProperty(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj as unknown);
}