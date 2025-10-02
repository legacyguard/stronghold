export type TrustSealLevel = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface TrustSeal {
  id: string;
  userId: string;
  documentId: string;
  level: TrustSealLevel;
  confidenceScore: number; // 0-100
  validations: {
    aiValidation: { score: number; timestamp: Date };
    legalRulesCheck: { score: number; issues: string[] };
    partnerReview?: { score: number; reviewDate: Date; cost: number };
  };
  issuedAt: Date;
  validUntil: Date; // 365 days
  digitalSignature: string; // Internal signature
}

export interface LegalValidationEngine {
  validateWill(userData: any, willContent: string): Promise<string[]>;
  checkMandatoryElements(userData: any): { score: number; missing: string[] };
  validateInheritanceRights(userData: any): { score: number; issues: string[] };
}

/**
 * Calculate Trust Score based on AI validation, legal rules, and data completeness
 * @param userData Complete will form data
 * @param generatedWill Generated will content
 * @param legalValidator Legal validation engine
 * @returns Trust score (0-100)
 */
export function calculateTrustScore(
  userData: Record<string, unknown>,
  generatedWill: string,
  legalValidator?: LegalValidationEngine
): number {
  let score = 0;

  // 1. Data Completeness Score (40%)
  const completenessScore = calculateDataCompleteness(userData);
  score += completenessScore * 0.4;

  // 2. Legal Compliance Score (40%) - rule-based, free
  const legalScore = calculateLegalCompliance(userData, generatedWill);
  score += legalScore * 0.4;

  // 3. AI Confidence Score (20%)
  const aiScore = extractAIConfidence(generatedWill);
  score += aiScore * 0.2;

  return Math.round(score);
}

/**
 * Calculate data completeness based on required and optional fields
 */
function calculateDataCompleteness(userData: Record<string, unknown>): number {
  const requiredFields = [
    'fullName', 'birthDate', 'citizenship', 'executor'
  ];

  const optionalButImportantFields = [
    'spouseName', 'children', 'alternateExecutor', 'guardian',
    'funeralWishes', 'digitalAssets', 'specialRequests'
  ];

  const assets = userData.assets || [];

  // Required fields (60% of completeness score)
  const requiredComplete = requiredFields.filter(field => {
    const value = userData[field] as any;
    if (field === 'executor') {
      return value && value.name;
    }
    return value && typeof value === 'string' && value.trim().length > 0;
  }).length;

  const requiredScore = (requiredComplete / requiredFields.length) * 60;

  // Optional fields (30% of completeness score)
  const optionalComplete = optionalButImportantFields.filter(field => {
    const value = userData[field] as any;
    if (field === 'children') {
      return userData.hasChildren ? (value && Array.isArray(value) && value.length > 0) : true;
    }
    if (field === 'digitalAssets') {
      return value && Array.isArray(value) && value.length > 0;
    }
    if (field === 'guardian') {
      return userData.hasChildren ? (value && value.name) : true;
    }
    return value && typeof value === 'string' && value.trim().length > 0;
  }).length;

  const optionalScore = (optionalComplete / optionalButImportantFields.length) * 30;

  // Assets completeness (10% of completeness score)
  const assetScore = Array.isArray(assets) && assets.length > 0 ? 10 : 0;

  return requiredScore + optionalScore + assetScore;
}

/**
 * Calculate legal compliance score based on jurisdiction rules
 */
function calculateLegalCompliance(userData: any, generatedWill: string): number {
  let score = 100;
  const issues: string[] = [];

  // Basic legal requirements check
  const jurisdiction = userData.jurisdiction || 'SK';

  // 1. Executor requirements
  if (!userData.executor || !userData.executor.name) {
    score -= 30;
    issues.push('Missing executor');
  }

  // 2. Witness requirements for certain jurisdictions
  if (jurisdiction === 'CZ' && userData.willType === 'witnessed') {
    if (!userData.witnesses || userData.witnesses.length < 2) {
      score -= 20;
      issues.push('Missing witnesses for Czech witnessed will');
    }
  }

  // 3. Marital status considerations
  if (userData.maritalStatus === 'married') {
    if (!userData.spouseName) {
      score -= 15;
      issues.push('Spouse name should be specified for married individuals');
    }
  }

  // 4. Children and guardian requirements
  if (userData.hasChildren) {
    if (!userData.children || userData.children.length === 0) {
      score -= 10;
      issues.push('Children information missing');
    }
    if (!userData.guardian || !userData.guardian.name) {
      score -= 15;
      issues.push('Guardian not specified for minor children');
    }
  }

  // 5. Asset distribution completeness
  const assets = userData.assets || [];
  if (assets.length === 0) {
    score -= 20;
    issues.push('No assets specified');
  } else {
    // Check if all assets have beneficiaries
    const assetsWithoutBeneficiaries = assets.filter((asset: any) => !asset.beneficiary);
    if (assetsWithoutBeneficiaries.length > 0) {
      score -= 10;
      issues.push('Some assets lack beneficiary designation');
    }
  }

  // 6. Will content analysis
  if (generatedWill) {
    if (!generatedWill.includes(userData.fullName)) {
      score -= 5;
      issues.push('Will does not properly reference testator name');
    }

    if (!generatedWill.toLowerCase().includes('executor')) {
      score -= 10;
      issues.push('Will does not properly reference executor');
    }
  }

  return Math.max(0, score);
}

/**
 * Extract AI confidence from generated will content
 */
function extractAIConfidence(generatedWill: string): number {
  try {
    // Try to parse JSON response from AI
    const jsonMatch = generatedWill.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.confidence_score) {
        return parsed.confidence_score;
      }
    }
  } catch (e) {
    // Ignore parsing errors
  }

  // Fallback: analyze will quality heuristically
  if (!generatedWill || generatedWill.length < 100) {
    return 20; // Very low confidence for short content
  }

  let confidence = 70; // Base confidence

  // Check for legal language indicators
  const legalTerms = ['hereby', 'testament', 'executor', 'beneficiary', 'assets', 'estate'];
  const foundTerms = legalTerms.filter(term =>
    generatedWill.toLowerCase().includes(term)
  ).length;

  confidence += (foundTerms / legalTerms.length) * 20;

  // Check for structure indicators
  if (generatedWill.includes('ARTICLE') || generatedWill.includes('ČLÁNOK')) {
    confidence += 5;
  }

  if (generatedWill.includes('signature') || generatedWill.includes('podpis')) {
    confidence += 5;
  }

  return Math.min(100, confidence);
}

/**
 * Get Trust Seal level based on confidence score
 */
export function getTrustSealLevel(confidenceScore: number): TrustSealLevel {
  if (confidenceScore >= 91) return 'Platinum';
  if (confidenceScore >= 71) return 'Gold';
  if (confidenceScore >= 41) return 'Silver';
  return 'Bronze';
}

/**
 * Generate Trust Seal description for UI
 */
export function getTrustSealDescription(level: TrustSealLevel): string {
  switch (level) {
    case 'Platinum':
      return 'Exceptional legal compliance with professional review. Highest confidence level.';
    case 'Gold':
      return 'High legal compliance with comprehensive AI validation. Very reliable.';
    case 'Silver':
      return 'Good legal compliance with standard validation. Suitable for most cases.';
    case 'Bronze':
      return 'Basic legal compliance. Consider adding more details for higher confidence.';
  }
}

/**
 * Get recommendations for improving Trust Seal level
 */
export function getTrustSealRecommendations(
  currentLevel: TrustSealLevel,
  userData: any
): string[] {
  const recommendations: string[] = [];

  if (currentLevel === 'Bronze' || currentLevel === 'Silver') {
    if (!userData.alternateExecutor) {
      recommendations.push('Add an alternate executor for redundancy');
    }

    if (userData.hasChildren && (!userData.guardian || !userData.guardian.name)) {
      recommendations.push('Specify a guardian for minor children');
    }

    if (!userData.funeralWishes) {
      recommendations.push('Include funeral and burial preferences');
    }

    if (!userData.digitalAssets || userData.digitalAssets.length === 0) {
      recommendations.push('Add instructions for digital assets and online accounts');
    }
  }

  if (currentLevel !== 'Platinum') {
    recommendations.push('Consider professional legal review for Platinum level certification');
  }

  return recommendations;
}