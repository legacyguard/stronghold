// Legal Framework Definitions for Will Generation
// Slovak Republic and Czech Republic jurisdictions

export interface LegalFramework {
  jurisdiction: string;
  language: string;
  requirements: WillRequirements;
  templates: WillTemplates;
  validation_rules: ValidationRules;
  witness_requirements: WitnessRequirements;
  notarization: NotarizationRequirements;
}

export interface WillRequirements {
  min_age: number;
  mental_capacity_required: boolean;
  written_form_required: boolean;
  signature_required: boolean;
  date_required: boolean;
  witnesses_required: boolean;
  notarization_required: boolean;
  special_provisions: SpecialProvisions;
}

export interface WillTemplates {
  simple_will: string;
  complex_will: string;
  mutual_will: string;
  trust_will: string;
}

export interface ValidationRules {
  required_sections: string[];
  forbidden_content: string[];
  mandatory_clauses: string[];
  format_requirements: FormatRequirements;
}

export interface WitnessRequirements {
  min_witnesses: number;
  max_witnesses: number;
  witness_eligibility: WitnessEligibility;
  witness_declaration: string;
}

export interface WitnessEligibility {
  min_age: number;
  cannot_be_beneficiary: boolean;
  cannot_be_spouse_of_beneficiary: boolean;
  must_be_mentally_competent: boolean;
  cannot_be_related: boolean;
}

export interface NotarizationRequirements {
  required: boolean;
  optional: boolean;
  notary_declaration: string;
  additional_security: boolean;
}

export interface SpecialProvisions {
  minor_children_guardianship: boolean;
  spouse_inheritance_rights: boolean;
  forced_heirship_rules: boolean;
  charitable_bequests: boolean;
  business_succession: boolean;
}

export interface FormatRequirements {
  font_requirements: string;
  page_numbering: boolean;
  margin_requirements: string;
  signature_placement: string;
}

// Slovak Republic Legal Framework
export const SLOVAKIA_LEGAL_FRAMEWORK: LegalFramework = {
  jurisdiction: 'SK',
  language: 'sk',
  requirements: {
    min_age: 18,
    mental_capacity_required: true,
    written_form_required: true,
    signature_required: true,
    date_required: true,
    witnesses_required: false, // Can be notarized instead
    notarization_required: false, // Recommended but not required
    special_provisions: {
      minor_children_guardianship: true,
      spouse_inheritance_rights: true,
      forced_heirship_rules: true, // Slovak law has forced heirship
      charitable_bequests: true,
      business_succession: true
    }
  },
  templates: {
    simple_will: `
ZÁVET

Ja, {{testator_name}}, narodený/á {{birth_date}} v {{birth_place}},
bytom {{address}}, občan Slovenskej republiky,
pri plnom vedomí a dobrom zdraví vyhlasujam toto za môj posledný závet:

I. VŠEOBECNÉ USTANOVENIA

1. Týmto závetom ruším všetky predchádzajúce závety a kodycily.

2. Vymenujem {{executor_name}} za vykonávateľa môjho závetu s právom
   na odmenu podľa zákona.

II. ROZDELENIE MAJETKU

{{asset_distribution}}

III. OPATROVNÍCTVO DETÍ

{{guardianship_provisions}}

IV. ZÁVEREČNÉ USTANOVENIA

{{special_instructions}}

Vyhlasujam, že tento závet som napísal/a pri plnom vedomí a bez akéhokoľvek
nátlaku alebo prinútenia.

V {{location}}, dňa {{date}}

                                    ________________________
                                    {{testator_name}}
                                    (vlastnoručný podpis)
`,
    complex_will: `
ZÁVET S ROZŠÍRENÝMI USTANOVENIAMI

[Complex will template for Slovak jurisdiction]
`,
    mutual_will: `
VZÁJOMNÝ ZÁVET MANŽELOV

[Mutual will template for Slovak jurisdiction]
`,
    trust_will: `
ZÁVET S TRUSTOVÝMI USTANOVENIAMI

[Trust will template for Slovak jurisdiction]
`
  },
  validation_rules: {
    required_sections: [
      'testator_identification',
      'asset_distribution',
      'executor_appointment',
      'signature_date'
    ],
    forbidden_content: [
      'illegal_bequests',
      'immoral_conditions',
      'contradictory_provisions'
    ],
    mandatory_clauses: [
      'revocation_clause',
      'capacity_declaration',
      'signature_clause'
    ],
    format_requirements: {
      font_requirements: 'Readable font, minimum 12pt',
      page_numbering: true,
      margin_requirements: 'Minimum 2.5cm margins',
      signature_placement: 'End of document, with full name'
    }
  },
  witness_requirements: {
    min_witnesses: 0, // Can be notarized instead
    max_witnesses: 3,
    witness_eligibility: {
      min_age: 18,
      cannot_be_beneficiary: true,
      cannot_be_spouse_of_beneficiary: true,
      must_be_mentally_competent: true,
      cannot_be_related: false // Slovak law allows related witnesses
    },
    witness_declaration: `
Podpísaní svedkovia vyhlasujeme, že závetca {{testator_name}}
tento závet podpísal v našej prítomnosti po tom, ako ho nahlas prečítal
a vyhlásil, že obsahuje jeho poslednú vôľu.
`
  },
  notarization: {
    required: false,
    optional: true,
    notary_declaration: `
Ako notár potvrdzujem, že {{testator_name}} tento závet podpísal/a
v mojej prítomnosti po tom, ako som overil/a jeho/jej totožnosť a spôsobilosť.
`,
    additional_security: true
  }
};

// Czech Republic Legal Framework
export const CZECH_LEGAL_FRAMEWORK: LegalFramework = {
  jurisdiction: 'CZ',
  language: 'cs',
  requirements: {
    min_age: 18,
    mental_capacity_required: true,
    written_form_required: true,
    signature_required: true,
    date_required: true,
    witnesses_required: false,
    notarization_required: false,
    special_provisions: {
      minor_children_guardianship: true,
      spouse_inheritance_rights: true,
      forced_heirship_rules: false, // Czech law doesn't have strict forced heirship
      charitable_bequests: true,
      business_succession: true
    }
  },
  templates: {
    simple_will: `
ZÁVĚŤ

Já, {{testator_name}}, narozen/a {{birth_date}} v {{birth_place}},
bydliště {{address}}, občan České republiky,
při plném vědomí a dobrém zdraví prohlašuji toto za svou poslední vůli:

I. OBECNÁ USTANOVENÍ

1. Tímto závětí ruším všechny předchozí závěti a kodicily.

2. Jmenuji {{executor_name}} vykonavatelem své závěti s právem
   na odměnu podle zákona.

II. ROZDĚLENÍ MAJETKU

{{asset_distribution}}

III. OPATROVNICTVÍ DĚTÍ

{{guardianship_provisions}}

IV. ZÁVĚREČNÁ USTANOVENÍ

{{special_instructions}}

Prohlašuji, že tuto závěť jsem napsal/a při plném vědomí a bez jakéhokoli
nátlaku nebo donucení.

V {{location}}, dne {{date}}

                                    ________________________
                                    {{testator_name}}
                                    (vlastnoruční podpis)
`,
    complex_will: `
ZÁVĚŤ S ROZŠÍŘENÝMI USTANOVENÍMI

[Complex will template for Czech jurisdiction]
`,
    mutual_will: `
VZÁJEMNÁ ZÁVĚŤ MANŽELŮ

[Mutual will template for Czech jurisdiction]
`,
    trust_will: `
ZÁVĚŤ S TRUSTOVÝMI USTANOVENÍMI

[Trust will template for Czech jurisdiction]
`
  },
  validation_rules: {
    required_sections: [
      'testator_identification',
      'asset_distribution',
      'executor_appointment',
      'signature_date'
    ],
    forbidden_content: [
      'illegal_bequests',
      'immoral_conditions',
      'contradictory_provisions'
    ],
    mandatory_clauses: [
      'revocation_clause',
      'capacity_declaration',
      'signature_clause'
    ],
    format_requirements: {
      font_requirements: 'Readable font, minimum 12pt',
      page_numbering: true,
      margin_requirements: 'Minimum 2.5cm margins',
      signature_placement: 'End of document, with full name'
    }
  },
  witness_requirements: {
    min_witnesses: 0,
    max_witnesses: 3,
    witness_eligibility: {
      min_age: 18,
      cannot_be_beneficiary: true,
      cannot_be_spouse_of_beneficiary: true,
      must_be_mentally_competent: true,
      cannot_be_related: false
    },
    witness_declaration: `
Podepsaní svědci prohlašujeme, že zůstavitel {{testator_name}}
tuto závěť podepsal v naší přítomnosti poté, co ji nahlas přečetl
a prohlásil, že obsahuje jeho poslední vůli.
`
  },
  notarization: {
    required: false,
    optional: true,
    notary_declaration: `
Jako notář potvrzuji, že {{testator_name}} tuto závěť podepsal/a
v mé přítomnosti poté, co jsem ověřil/a jeho/její totožnost a způsobilost.
`,
    additional_security: true
  }
};

// Legal Framework Registry
export const LEGAL_FRAMEWORKS: Record<string, LegalFramework> = {
  'SK': SLOVAKIA_LEGAL_FRAMEWORK,
  'CZ': CZECH_LEGAL_FRAMEWORK
};

// Helper functions
export function getLegalFramework(jurisdiction: string): LegalFramework {
  const framework = LEGAL_FRAMEWORKS[jurisdiction.toUpperCase()];
  if (!framework) {
    throw new Error(`Legal framework not available for jurisdiction: ${jurisdiction}`);
  }
  return framework;
}

export function validateJurisdiction(jurisdiction: string): boolean {
  return jurisdiction.toUpperCase() in LEGAL_FRAMEWORKS;
}

export function getSupportedJurisdictions(): string[] {
  return Object.keys(LEGAL_FRAMEWORKS);
}

// Asset distribution templates
export const ASSET_DISTRIBUTION_TEMPLATES = {
  SK: {
    real_estate: `
{{asset_description}} v hodnote približne {{estimated_value}} EUR
odkazujem {{beneficiary_name}} ({{relationship}}).
`,
    bank_account: `
Bankový účet č. {{account_number}} vedený v {{bank_name}}
odkazujem {{beneficiary_name}} ({{relationship}}).
`,
    personal_property: `
{{property_description}} odkazujem {{beneficiary_name}} ({{relationship}}).
`,
    percentage_distribution: `
{{percentage}}% môjho celkového majetku odkazujem
{{beneficiary_name}} ({{relationship}}).
`,
    residuary_clause: `
Zvyšok môjho majetku, ktorý nie je inak rozdelený,
odkazujem {{residuary_beneficiary}} ({{relationship}}).
`
  },
  CZ: {
    real_estate: `
{{asset_description}} v hodnotě přibližně {{estimated_value}} CZK
odkázám {{beneficiary_name}} ({{relationship}}).
`,
    bank_account: `
Bankovní účet č. {{account_number}} vedený v {{bank_name}}
odkázám {{beneficiary_name}} ({{relationship}}).
`,
    personal_property: `
{{property_description}} odkázám {{beneficiary_name}} ({{relationship}}).
`,
    percentage_distribution: `
{{percentage}}% mého celkového majetku odkázám
{{beneficiary_name}} ({{relationship}}).
`,
    residuary_clause: `
Zbytek mého majetku, který není jinak rozdělen,
odkázám {{residuary_beneficiary}} ({{relationship}}).
`
  }
};

// Guardianship provision templates
export const GUARDIANSHIP_TEMPLATES = {
  SK: `
V prípade môjho úmrtia a ak sú moje deti {{children_names}} ešte maloletí,
vymenujem za ich opatrovníka {{guardian_name}} ({{guardian_relationship}}).

Ako náhradného opatrovníka vymenujem {{alternate_guardian_name}}
({{alternate_guardian_relationship}}).

Odporúčam, aby sa moje deti vychovávali v duchu {{values_and_beliefs}}.
`,
  CZ: `
V případě mé smrti a pokud jsou moje děti {{children_names}} ještě nezletilé,
jmenuji jejich opatrovníkem {{guardian_name}} ({{guardian_relationship}}).

Jako náhradního opatrovníka jmenuji {{alternate_guardian_name}}
({{alternate_guardian_relationship}}).

Doporučuji, aby se moje děti vychovávaly v duchu {{values_and_beliefs}}.
`
};

// Common validation errors
export const VALIDATION_ERRORS = {
  SK: {
    missing_signature: 'Závet musí byť podpísaný závetcom.',
    missing_date: 'Závet musí obsahovať dátum vytvorenia.',
    invalid_witness: 'Svedok nesmie byť beneficientom závetu.',
    missing_executor: 'Závet musí obsahovať vymenovaného vykonávateľa.',
    invalid_beneficiary: 'Beneficient musí byť jasne identifikovaný.',
    contradictory_provisions: 'Závet obsahuje protichodné ustanovenia.',
    incomplete_asset_description: 'Opis majetku nie je dostatočne podrobný.'
  },
  CZ: {
    missing_signature: 'Závěť musí být podepsána zůstavitelem.',
    missing_date: 'Závěť musí obsahovat datum vytvoření.',
    invalid_witness: 'Svědek nesmí být příjemcem závěti.',
    missing_executor: 'Závěť musí obsahovat jmenovaného vykonavatele.',
    invalid_beneficiary: 'Příjemce musí být jasně identifikován.',
    contradictory_provisions: 'Závěť obsahuje rozporná ustanovení.',
    incomplete_asset_description: 'Popis majetku není dostatečně podrobný.'
  }
};