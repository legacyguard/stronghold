// Template-based will generation for error recovery

import { CompleteWillData, WillGenerationResult } from '@/lib/sofia/router';
import { calculateTrustScore, getTrustSealLevel } from '@/lib/trust-seal/calculator';

export interface WillTemplate {
  id: string;
  jurisdiction: string;
  type: string;
  template: string;
  requiredFields: string[];
}

export async function generateFromTemplate(
  userData: CompleteWillData,
  template: WillTemplate
): Promise<WillGenerationResult> {
  try {
    // Replace template placeholders with user data
    let willContent = template.template;

    // Basic replacements
    const replacements: Record<string, string> = {
      '{{fullName}}': userData.fullName || '',
      '{{birthDate}}': userData.birthDate || '',
      '{{birthPlace}}': userData.birthPlace || '',
      '{{address}}': userData.address || '',
      '{{citizenship}}': userData.citizenship || 'SK',
      '{{spouseName}}': userData.spouseName || '',
      '{{executorName}}': userData.executor?.name || '',
      '{{executorAddress}}': userData.executor?.address || '',
      '{{guardianName}}': userData.guardian?.name || '',
      '{{guardianAddress}}': userData.guardian?.address || '',
      '{{date}}': new Date().toLocaleDateString('sk-SK'),
      '{{place}}': userData.address?.split(',')[1]?.trim() || 'Bratislava'
    };

    // Replace all placeholders
    Object.entries(replacements).forEach(([placeholder, value]) => {
      willContent = willContent.replace(new RegExp(placeholder, 'g'), value);
    });

    // Generate assets section
    if (userData.assets && userData.assets.length > 0) {
      const assetsSection = generateAssetsSection(userData.assets, userData.jurisdiction);
      willContent = willContent.replace('{{assets}}', assetsSection);
    } else {
      willContent = willContent.replace('{{assets}}', 'Žiadne špecifické aktíva nie sú uvedené.');
    }

    // Generate children section
    if (userData.hasChildren && userData.children && userData.children.length > 0) {
      const childrenSection = generateChildrenSection(userData.children);
      willContent = willContent.replace('{{children}}', childrenSection);
    } else {
      willContent = willContent.replace('{{children}}', '');
    }

    // Calculate trust score for template-generated will
    const trustScore = calculateTrustScore(userData, willContent);
    const trustLevel = getTrustSealLevel(trustScore);

    const result: WillGenerationResult = {
      willContent,
      confidenceScore: trustScore,
      trustSeal: {
        id: `template-${Date.now()}`,
        userId: userData.userId,
        documentId: `doc-${Date.now()}`,
        level: trustLevel,
        confidenceScore: trustScore,
        validations: {
          aiValidation: { score: 70, timestamp: new Date() }, // Template baseline
          legalRulesCheck: { score: trustScore, issues: [] }
        },
        issuedAt: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        digitalSignature: `template-sig-${Date.now()}`
      },
      validationNotes: [
        'Dokument bol vygenerovaný pomocou schválenej šablóny',
        'Odporúčame overenie u kvalifikovaného právnika',
        'Uistite sa, že sú splnené všetky formálne požiadavky'
      ],
      generatedBy: 'template',
      templateId: template.id
    };

    return result;

  } catch (error) {
    throw new Error(`Template generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function generateAssetsSection(assets: any[], jurisdiction: string): string {
  const sections: string[] = [];

  assets.forEach((asset, index) => {
    const articleNumber = index + 1;
    let assetText = '';

    switch (jurisdiction) {
      case 'SK':
        assetText = `ČLÁNOK ${articleNumber}\n`;
        assetText += `Môj majetok "${asset.description}" odkazujem dedičovi ${asset.beneficiary}`;
        if (asset.percentage) {
          assetText += ` v podiele ${asset.percentage}%`;
        }
        assetText += '.';
        break;

      case 'CZ':
        assetText = `ČLÁNEK ${articleNumber}\n`;
        assetText += `Svůj majetek "${asset.description}" odkazuji dědici ${asset.beneficiary}`;
        if (asset.percentage) {
          assetText += ` v podílu ${asset.percentage}%`;
        }
        assetText += '.';
        break;

      default:
        assetText = `ARTICLE ${articleNumber}\n`;
        assetText += `I bequeath my asset "${asset.description}" to ${asset.beneficiary}`;
        if (asset.percentage) {
          assetText += ` in the amount of ${asset.percentage}%`;
        }
        assetText += '.';
    }

    sections.push(assetText);
  });

  return sections.join('\n\n');
}

function generateChildrenSection(children: any[]): string {
  if (!children || children.length === 0) {
    return '';
  }

  const childrenNames = children.map(child => child.name).join(', ');
  return `\nMoje deti: ${childrenNames}`;
}

// Error-safe template retrieval
export async function getTemplateWithFallback(
  jurisdiction: string,
  userTier: string
): Promise<WillTemplate> {
  try {
    const { getEnhancedWillTemplate } = await import('@/lib/will/enhanced-templates');
    const template = await getEnhancedWillTemplate(jurisdiction, userTier);

    if (template) {
      return {
        id: template.id,
        jurisdiction: template.jurisdiction,
        type: template.type,
        template: template.content,
        requiredFields: template.requiredFields || []
      };
    }
  } catch (error) {
    console.warn('Enhanced template retrieval failed, using basic fallback:', error);
  }

  // Fallback to basic template
  return getBasicTemplate(jurisdiction);
}

function getBasicTemplate(jurisdiction: string): WillTemplate {
  const templates: Record<string, WillTemplate> = {
    'SK': {
      id: 'basic-sk-holographic',
      jurisdiction: 'SK',
      type: 'holographic',
      template: `ZÁVET

Ja, {{fullName}}, narodený/á {{birthDate}} v {{birthPlace}}, bytom {{address}}, občan/ka {{citizenship}}, pri plnom vedomí a dobrom zdraví, týmto vyhlasujam svoj posledný závet.

ČLÁNOK I - ZRUŠENIE PREDCHÁDZAJÚCICH ZÁVETOV
Týmto zrušujem všetky predchádzajúce závety a kodicily.

ČLÁNOK II - USTANOVENIE VYKONÁVATEĽA ZÁVETU
Za vykonávateľa môjho závetu ustanovujem {{executorName}}, bytom {{executorAddress}}.

ČLÁNOK III - DEDIČSTVO
{{assets}}

ČLÁNOK IV - OSTATNÉ USTANOVENIA
{{children}}

Tento závet píšem vlastnou rukou a vlastnoručne ho podpisujem.

V {{place}}, dňa {{date}}

_________________________
{{fullName}}
podpis`,
      requiredFields: ['fullName', 'birthDate', 'executor']
    },
    'CZ': {
      id: 'basic-cz-holographic',
      jurisdiction: 'CZ',
      type: 'holographic',
      template: `ZÁVĚŤ

Já, {{fullName}}, narozený/á {{birthDate}} v {{birthPlace}}, bytem {{address}}, občan/ka {{citizenship}}, při plném vědomí a dobrém zdraví, tímto vyhlašuji svou poslední vůli.

ČLÁNEK I - ZRUŠENÍ PŘEDCHOZÍCH ZÁVĚTÍ
Tímto ruším všechny předchozí závěti a kodicily.

ČLÁNEK II - USTANOVENÍ VYKONAVATELE ZÁVĚTI
Za vykonavatele své závěti ustanovuji {{executorName}}, bytem {{executorAddress}}.

ČLÁNEK III - DĚDICTVÍ
{{assets}}

ČLÁNEK IV - OSTATNÍ USTANOVENÍ
{{children}}

Tuto závěť píši vlastní rukou a vlastnoručně ji podepisuji.

V {{place}}, dne {{date}}

_________________________
{{fullName}}
podpis`,
      requiredFields: ['fullName', 'birthDate', 'executor']
    }
  };

  return templates[jurisdiction] || templates['SK']; // Default to Slovak
}