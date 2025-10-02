export interface LegalValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: LegalIssue[];
  warnings: string[];
  recommendations: string[];
}

export interface LegalIssue {
  severity: 'critical' | 'warning' | 'info';
  code: string;
  message: string;
  jurisdiction: string;
  field?: string;
}

export interface JurisdictionRules {
  code: 'SK' | 'CZ' | 'AT' | 'DE' | 'PL';
  name: string;
  requiredElements: string[];
  witnessRequirements: {
    holographic: { required: false };
    witnessed: { required: true; minWitnesses: number };
    notarized: { required: true; notaryRequired: boolean };
  };
  inheritanceRules: {
    forcedHeirshipApplies: boolean;
    spouseRights: number; // Percentage
    childrenRights: number; // Percentage
  };
  formalRequirements: {
    languageRestrictions: string[];
    dateFormat: string;
    signatureRequirements: string[];
  };
}

export class LegalValidationEngine {
  private jurisdictionRules: Map<string, JurisdictionRules>;

  constructor() {
    this.jurisdictionRules = new Map();
    this.initializeJurisdictionRules();
  }

  /**
   * Validate will according to jurisdiction-specific rules
   */
  async validateWill(userData: any, willContent: string): Promise<string[]> {
    const validationNotes: string[] = [];
    const jurisdiction = userData.jurisdiction || 'SK';
    const rules = this.jurisdictionRules.get(jurisdiction);

    if (!rules) {
      validationNotes.push(`Unknown jurisdiction: ${jurisdiction}`);
      return validationNotes;
    }

    // 1. Check mandatory elements
    const mandatoryCheck = this.checkMandatoryElements(userData);
    if (mandatoryCheck.missing.length > 0) {
      validationNotes.push(`Missing mandatory elements: ${mandatoryCheck.missing.join(', ')}`);
    }

    // 2. Check inheritance rights
    const inheritanceCheck = this.validateInheritanceRights(userData);
    if (inheritanceCheck.issues.length > 0) {
      validationNotes.push(`Inheritance concerns: ${inheritanceCheck.issues.join(', ')}`);
    }

    // 3. Check formal requirements
    const formalCheck = this.validateFormalRequirements(userData, willContent, rules);
    validationNotes.push(...formalCheck);

    // 4. Check witness requirements
    const witnessCheck = this.validateWitnessRequirements(userData, rules);
    validationNotes.push(...witnessCheck);

    return validationNotes;
  }

  /**
   * Check if all mandatory elements are present
   */
  checkMandatoryElements(userData: any): { score: number; missing: string[] } {
    const required = ['fullName', 'birthDate', 'executor'];
    const missing: string[] = [];

    for (const field of required) {
      if (!userData[field]) {
        missing.push(field);
      } else if (field === 'executor' && !userData[field].name) {
        missing.push('executor.name');
      }
    }

    // Check jurisdiction-specific requirements
    const jurisdiction = userData.jurisdiction || 'SK';
    const rules = this.jurisdictionRules.get(jurisdiction);

    if (rules) {
      for (const element of rules.requiredElements) {
        if (element === 'citizenship' && !userData.citizenship) {
          missing.push('citizenship');
        }
        if (element === 'address' && !userData.address) {
          missing.push('address');
        }
      }
    }

    const score = Math.max(0, 100 - (missing.length * 20));
    return { score, missing };
  }

  /**
   * Validate inheritance rights according to jurisdiction
   */
  validateInheritanceRights(userData: any): { score: number; issues: string[] } {
    const issues: string[] = [];
    const jurisdiction = userData.jurisdiction || 'SK';
    const rules = this.jurisdictionRules.get(jurisdiction);

    if (!rules || !rules.inheritanceRules.forcedHeirshipApplies) {
      return { score: 100, issues: [] };
    }

    let score = 100;

    // Check spouse rights
    if (userData.maritalStatus === 'married' && userData.spouseName) {
      const spouseAssets = (userData.assets || []).filter((asset: any) =>
        asset.beneficiary && asset.beneficiary.toLowerCase().includes(userData.spouseName.toLowerCase())
      );

      if (spouseAssets.length === 0) {
        issues.push('Spouse may have inheritance rights that are not addressed');
        score -= 20;
      }
    }

    // Check children rights
    if (userData.hasChildren && userData.children && userData.children.length > 0) {
      const childNames = userData.children.map((c: { name: string }) => c.name.toLowerCase());
      const childrenAssets = (userData.assets || []).filter((asset: { beneficiary?: string }) =>
        childNames.some((name: string) => asset.beneficiary && asset.beneficiary.toLowerCase().includes(name))
      );

      if (childrenAssets.length === 0) {
        issues.push('Children may have inheritance rights that are not addressed');
        score -= 25;
      }
    }

    return { score: Math.max(0, score), issues };
  }

  /**
   * Validate formal requirements
   */
  private validateFormalRequirements(
    userData: any,
    willContent: string,
    rules: JurisdictionRules
  ): string[] {
    const issues: string[] = [];

    // Check language requirements
    if (rules.formalRequirements.languageRestrictions.length > 0) {
      // This would require actual language detection in production
      issues.push('Language compliance not verified automatically');
    }

    // Check if will contains testator name
    if (willContent && userData.fullName) {
      if (!willContent.includes(userData.fullName)) {
        issues.push('Will should explicitly mention testator full name');
      }
    }

    // Check date format (simplified check)
    if (userData.birthDate) {
      const datePattern = /\d{1,2}\.\d{1,2}\.\d{4}/; // DD.MM.YYYY or D.M.YYYY
      if (!datePattern.test(userData.birthDate)) {
        issues.push(`Date format should follow ${rules.formalRequirements.dateFormat} pattern`);
      }
    }

    return issues;
  }

  /**
   * Validate witness requirements
   */
  private validateWitnessRequirements(userData: any, rules: JurisdictionRules): string[] {
    const issues: string[] = [];
    const willType = userData.willType || 'holographic';

    const requirements = rules.witnessRequirements[willType as keyof typeof rules.witnessRequirements];

    if (requirements && requirements.required) {
      if (willType === 'witnessed' && 'minWitnesses' in requirements && requirements.minWitnesses) {
        if (!userData.witnesses || userData.witnesses.length < requirements.minWitnesses) {
          issues.push(`${willType} will requires ${requirements.minWitnesses} witnesses`);
        }
      }

      if (willType === 'notarized' && 'notaryRequired' in requirements && requirements.notaryRequired) {
        if (!userData.notaryInfo) {
          issues.push('Notarized will requires notary information');
        }
      }
    }

    return issues;
  }

  /**
   * Get jurisdiction-specific recommendations
   */
  getJurisdictionRecommendations(jurisdiction: string): string[] {
    const rules = this.jurisdictionRules.get(jurisdiction);
    if (!rules) {
      return ['Unknown jurisdiction - consider consulting local legal expert'];
    }

    const recommendations: string[] = [];

    if (rules.inheritanceRules.forcedHeirshipApplies) {
      recommendations.push('This jurisdiction has forced heirship rules - consider legal consultation');
    }

    if (rules.code === 'CZ') {
      recommendations.push('Czech law requires specific formalities - ensure compliance with Czech Civil Code');
    }

    if (rules.code === 'SK') {
      recommendations.push('Slovak law allows holographic wills - handwritten wills are valid');
    }

    return recommendations;
  }

  /**
   * Initialize jurisdiction-specific rules
   */
  private initializeJurisdictionRules(): void {
    // Slovak Republic
    this.jurisdictionRules.set('SK', {
      code: 'SK',
      name: 'Slovak Republic',
      requiredElements: ['fullName', 'birthDate', 'executor'],
      witnessRequirements: {
        holographic: { required: false },
        witnessed: { required: true, minWitnesses: 2 },
        notarized: { required: true, notaryRequired: true }
      },
      inheritanceRules: {
        forcedHeirshipApplies: true,
        spouseRights: 50, // Percentage varies by situation
        childrenRights: 50
      },
      formalRequirements: {
        languageRestrictions: ['sk', 'cs'],
        dateFormat: 'DD.MM.YYYY',
        signatureRequirements: ['handwritten_signature']
      }
    });

    // Czech Republic
    this.jurisdictionRules.set('CZ', {
      code: 'CZ',
      name: 'Czech Republic',
      requiredElements: ['fullName', 'birthDate', 'citizenship', 'executor'],
      witnessRequirements: {
        holographic: { required: false },
        witnessed: { required: true, minWitnesses: 2 },
        notarized: { required: true, notaryRequired: true }
      },
      inheritanceRules: {
        forcedHeirshipApplies: true,
        spouseRights: 50,
        childrenRights: 50
      },
      formalRequirements: {
        languageRestrictions: ['cs', 'sk'],
        dateFormat: 'DD.MM.YYYY',
        signatureRequirements: ['handwritten_signature', 'witness_signatures']
      }
    });

    // Austria
    this.jurisdictionRules.set('AT', {
      code: 'AT',
      name: 'Austria',
      requiredElements: ['fullName', 'birthDate', 'citizenship', 'executor'],
      witnessRequirements: {
        holographic: { required: false },
        witnessed: { required: true, minWitnesses: 3 },
        notarized: { required: true, notaryRequired: true }
      },
      inheritanceRules: {
        forcedHeirshipApplies: true,
        spouseRights: 33,
        childrenRights: 50
      },
      formalRequirements: {
        languageRestrictions: ['de'],
        dateFormat: 'DD.MM.YYYY',
        signatureRequirements: ['handwritten_signature']
      }
    });

    // Germany
    this.jurisdictionRules.set('DE', {
      code: 'DE',
      name: 'Germany',
      requiredElements: ['fullName', 'birthDate', 'citizenship', 'executor'],
      witnessRequirements: {
        holographic: { required: false },
        witnessed: { required: true, minWitnesses: 2 },
        notarized: { required: true, notaryRequired: true }
      },
      inheritanceRules: {
        forcedHeirshipApplies: true,
        spouseRights: 50,
        childrenRights: 50
      },
      formalRequirements: {
        languageRestrictions: ['de'],
        dateFormat: 'DD.MM.YYYY',
        signatureRequirements: ['handwritten_signature']
      }
    });

    // Poland
    this.jurisdictionRules.set('PL', {
      code: 'PL',
      name: 'Poland',
      requiredElements: ['fullName', 'birthDate', 'citizenship', 'executor'],
      witnessRequirements: {
        holographic: { required: false },
        witnessed: { required: true, minWitnesses: 3 },
        notarized: { required: true, notaryRequired: true }
      },
      inheritanceRules: {
        forcedHeirshipApplies: true,
        spouseRights: 25,
        childrenRights: 50
      },
      formalRequirements: {
        languageRestrictions: ['pl'],
        dateFormat: 'DD.MM.YYYY',
        signatureRequirements: ['handwritten_signature']
      }
    });
  }
}