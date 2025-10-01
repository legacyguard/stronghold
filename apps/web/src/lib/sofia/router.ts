import { WillFormData, WillTemplate, renderTemplate, getTemplateById } from '../will/templates';
import { TrustSeal, TrustSealLevel, calculateTrustScore } from '../trust-seal/calculator';
import { LegalValidationEngine } from '../legal/validation-engine';

export type SofiaCommand = {
  type: 'free' | 'smart' | 'premium';
  action: 'validate_will' | 'suggest_improvements' | 'legal_check' | 'generate_custom' | 'generate_will_single_call' | 'chat';
  data?: WillFormData | string | Record<string, unknown>;
  estimatedCost: number;
  userId: string;
}

export type CompleteWillData = WillFormData & {
  userTier: 'free' | 'paid' | 'family_edition';
  targetTrustLevel?: TrustSealLevel;
  jurisdiction: 'SK' | 'CZ' | 'AT' | 'DE' | 'PL';
}

export type WillGenerationResult = {
  willContent: string;
  trustSeal: TrustSeal;
  validationNotes: string[];
  confidenceScore: number;
  estimatedCost: number;
  actualCost: number;
}

export type SofiaResponse = {
  type: 'response' | 'error' | 'cost_limit_reached' | 'will_generated';
  content: string;
  suggestions?: string[];
  cost: number;
  tierUsed: 'free' | 'smart' | 'premium';
  willResult?: WillGenerationResult;
}

export type CostEvent = {
  id: string;
  userId: string;
  action: string;
  cost: number;
  tier: 'free' | 'smart' | 'premium';
  timestamp: Date;
}

export class SofiaAIRouter {
  private currentCost: number = 0;
  private dailyCostLimit: number = 0.10; // $0.10 daily limit - optimized for single-call strategy
  private costEvents: CostEvent[] = [];

  private legalValidator: LegalValidationEngine;

  constructor(private openAIApiKey: string) {
    this.legalValidator = new LegalValidationEngine();
  }

  async processCommand(command: SofiaCommand): Promise<SofiaResponse> {
    try {
      // 1. Try free tier first for simple operations
      if (command.type === 'free' || this.shouldUseFreeFirst(command)) {
        const freeResult = await this.handleFreeAction(command);
        if (freeResult.type !== 'error') {
          await this.recordCost(command.userId, command.action, 0, 'free');
          return freeResult;
        }
      }

      // 2. Check cost limits before using AI
      if (this.currentCost + command.estimatedCost > this.dailyCostLimit) {
        return {
          type: 'cost_limit_reached',
          content: 'Daily AI cost limit reached. Please try again tomorrow or upgrade to premium.',
          cost: 0,
          tierUsed: 'free'
        };
      }

      // 3. Route to appropriate AI service
      if (command.type === 'smart') {
        return await this.handleSmartAction(command);
      } else if (command.type === 'premium') {
        return await this.handlePremiumAction(command);
      }

      // 4. Fallback to free
      return await this.handleFreeAction(command);

    } catch (error) {
      console.error('Sofia AI Router Error:', error);
      return {
        type: 'error',
        content: 'An error occurred while processing your request.',
        cost: 0,
        tierUsed: 'free'
      };
    }
  }

  private shouldUseFreeFirst(command: SofiaCommand): boolean {
    // Use free tier for simple validations and common scenarios
    const freeActions = ['validate_will', 'basic_check'];
    return freeActions.includes(command.action);
  }

  private async handleFreeAction(command: SofiaCommand): Promise<SofiaResponse> {
    switch (command.action) {
      case 'validate_will':
        return this.validateWillBasic(command.data as WillFormData);

      case 'suggest_improvements':
        return this.suggestImprovementsBasic(command.data as WillFormData);

      case 'chat':
        return this.handleBasicChat(command.data as string);

      default:
        return {
          type: 'error',
          content: 'Action not supported in free tier.',
          cost: 0,
          tierUsed: 'free'
        };
    }
  }

  private async handleSmartAction(command: SofiaCommand): Promise<SofiaResponse> {
    // Use OpenAI for smart features with cost optimization
    switch (command.action) {
      case 'legal_check':
        return await this.performAILegalCheck(command.data as WillFormData);

      case 'suggest_improvements':
        return await this.performAIImprovements(command.data as WillFormData);

      case 'chat':
        return await this.performAIChat(command.data as string);

      default:
        return await this.handleFreeAction(command);
    }
  }

  private async handlePremiumAction(command: SofiaCommand): Promise<SofiaResponse> {
    // Use full AI capabilities for premium features
    switch (command.action) {
      case 'generate_custom':
        return await this.generateCustomWill(command.data as WillFormData);

      case 'generate_will_single_call':
        return await this.generateWillSingleCall(command.data as CompleteWillData);

      case 'legal_check':
        return await this.performAdvancedLegalCheck(command.data as WillFormData);

      default:
        return await this.handleSmartAction(command);
    }
  }

  // FREE TIER IMPLEMENTATIONS
  private validateWillBasic(data: WillFormData): SofiaResponse {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation rules
    if (!data.fullName) errors.push('Full name is required');
    if (!data.birthDate) errors.push('Birth date is required');
    if (!data.executor?.name) errors.push('Executor name is required');
    if (!data.assets || data.assets.length === 0) errors.push('At least one asset must be specified');

    // Basic logic checks
    if (data.maritalStatus === 'married' && !data.spouseName) {
      warnings.push('Spouse name should be specified for married individuals');
    }

    if (data.hasChildren && (!data.children || data.children.length === 0)) {
      warnings.push('Children information should be provided');
    }

    const content = errors.length > 0
      ? `Validation failed: ${errors.join(', ')}`
      : `Will validation passed. ${warnings.length > 0 ? 'Warnings: ' + warnings.join(', ') : 'No issues found.'}`;

    return {
      type: errors.length > 0 ? 'error' : 'response',
      content,
      suggestions: warnings,
      cost: 0,
      tierUsed: 'free'
    };
  }

  private suggestImprovementsBasic(data: WillFormData): SofiaResponse {
    const suggestions: string[] = [];

    // Rule-based suggestions
    if (!data.alternateExecutor) {
      suggestions.push('Consider naming an alternate executor in case your primary executor cannot serve.');
    }

    if (data.hasChildren && !data.guardian) {
      suggestions.push('For minor children, consider appointing a guardian.');
    }

    if (!data.funeralWishes) {
      suggestions.push('You may want to include your funeral and burial preferences.');
    }

    if (!data.digitalAssets || data.digitalAssets.length === 0) {
      suggestions.push('Consider including instructions for your digital assets and online accounts.');
    }

    return {
      type: 'response',
      content: suggestions.length > 0
        ? 'Here are some suggestions to improve your will:'
        : 'Your will looks comprehensive!',
      suggestions,
      cost: 0,
      tierUsed: 'free'
    };
  }

  private handleBasicChat(message: string): SofiaResponse {
    // Simple keyword-based responses
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('executor')) {
      return {
        type: 'response',
        content: 'An executor is someone you trust to carry out your wishes after you pass away. Choose someone responsible and willing to serve.',
        cost: 0,
        tierUsed: 'free'
      };
    }

    if (lowerMessage.includes('guardian')) {
      return {
        type: 'response',
        content: 'A guardian is someone who would care for your minor children if you pass away. This should be someone you trust completely with your children\'s welfare.',
        cost: 0,
        tierUsed: 'free'
      };
    }

    if (lowerMessage.includes('asset')) {
      return {
        type: 'response',
        content: 'Assets include your property, bank accounts, investments, personal belongings, and anything else of value that you own.',
        cost: 0,
        tierUsed: 'free'
      };
    }

    return {
      type: 'response',
      content: 'I can help you with questions about wills, executors, guardians, and estate planning. What would you like to know?',
      cost: 0,
      tierUsed: 'free'
    };
  }

  // SMART TIER IMPLEMENTATIONS
  private async performAILegalCheck(data: WillFormData): Promise<SofiaResponse> {
    const prompt = `As a legal AI assistant, review this will data for potential legal issues in ${data.jurisdiction} jurisdiction:

Personal Info: ${data.fullName}, born ${data.birthDate}
Marital Status: ${data.maritalStatus}
${data.spouseName ? `Spouse: ${data.spouseName}` : ''}
Children: ${data.hasChildren ? data.children?.map(c => c.name).join(', ') : 'None'}
Executor: ${data.executor.name}

Assets:
${data.assets.map(asset => `- ${asset.description} → ${asset.beneficiary}`).join('\n')}

Provide specific legal concerns and suggestions for ${data.jurisdiction} jurisdiction.`;

    try {
      const response = await this.callOpenAI(prompt, 'gpt-4o-mini'); // Use cheaper model for smart tier
      await this.recordCost(data.citizenship, 'legal_check', 0.02, 'smart');

      return {
        type: 'response',
        content: response,
        cost: 0.02,
        tierUsed: 'smart'
      };
    } catch (error) {
      return await this.handleFreeAction({ type: 'free', action: 'validate_will', data, estimatedCost: 0, userId: data.citizenship });
    }
  }

  private async performAIImprovements(data: WillFormData): Promise<SofiaResponse> {
    const prompt = `Review this will and suggest improvements:

${JSON.stringify(data, null, 2)}

Provide specific, actionable suggestions to make this will more comprehensive and legally sound.`;

    try {
      const response = await this.callOpenAI(prompt, 'gpt-4o-mini');
      await this.recordCost(data.citizenship, 'suggest_improvements', 0.015, 'smart');

      return {
        type: 'response',
        content: response,
        cost: 0.015,
        tierUsed: 'smart'
      };
    } catch (error) {
      return this.suggestImprovementsBasic(data);
    }
  }

  private async performAIChat(message: string): Promise<SofiaResponse> {
    const prompt = `You are Sofia, a helpful AI assistant specializing in estate planning and wills.
Answer this question about estate planning: ${message}

Keep your response helpful, accurate, and focused on estate planning topics.`;

    try {
      const response = await this.callOpenAI(prompt, 'gpt-4o-mini');
      await this.recordCost('unknown', 'chat', 0.01, 'smart');

      return {
        type: 'response',
        content: response,
        cost: 0.01,
        tierUsed: 'smart'
      };
    } catch (error) {
      return this.handleBasicChat(message);
    }
  }

  // PREMIUM TIER IMPLEMENTATIONS
  private async generateCustomWill(data: WillFormData): Promise<SofiaResponse> {
    const prompt = `Generate a custom will for ${data.jurisdiction} jurisdiction with these requirements:

${JSON.stringify(data, null, 2)}

Create a complete, legally formatted will that addresses all the specific needs and requests.
Include proper legal language and structure for ${data.jurisdiction}.`;

    try {
      const response = await this.callOpenAI(prompt, 'gpt-4o'); // Use full model for premium
      await this.recordCost(data.citizenship, 'generate_custom', 0.10, 'premium');

      return {
        type: 'response',
        content: response,
        cost: 0.10,
        tierUsed: 'premium'
      };
    } catch (error) {
      // Fallback to template-based generation
      const template = getTemplateById(`simple_single_${data.jurisdiction.toLowerCase()}`);
      if (template) {
        const rendered = renderTemplate(template, data);
        return {
          type: 'response',
          content: rendered,
          cost: 0,
          tierUsed: 'free'
        };
      }

      return {
        type: 'error',
        content: 'Unable to generate custom will. Please try again later.',
        cost: 0,
        tierUsed: 'free'
      };
    }
  }

  private async performAdvancedLegalCheck(data: WillFormData): Promise<SofiaResponse> {
    const prompt = `Perform comprehensive legal analysis of this will for ${data.jurisdiction}:

${JSON.stringify(data, null, 2)}

Analyze:
1. Legal compliance with ${data.jurisdiction} laws
2. Tax implications
3. Potential challenges or disputes
4. Recommendations for optimization
5. Missing legal requirements

Provide detailed legal review.`;

    try {
      const response = await this.callOpenAI(prompt, 'gpt-4o');
      await this.recordCost(data.citizenship, 'advanced_legal_check', 0.08, 'premium');

      return {
        type: 'response',
        content: response,
        cost: 0.08,
        tierUsed: 'premium'
      };
    } catch (error) {
      return await this.performAILegalCheck(data);
    }
  }

  // OpenAI Integration
  private async callOpenAI(prompt: string, model: string = 'gpt-4o-mini'): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response generated';
  }

  // Cost Management
  private async recordCost(userId: string, action: string, cost: number, tier: 'free' | 'smart' | 'premium'): Promise<void> {
    const costEvent: CostEvent = {
      id: crypto.randomUUID(),
      userId,
      action,
      cost,
      tier,
      timestamp: new Date()
    };

    this.costEvents.push(costEvent);
    this.currentCost += cost;

    // In production, save to database
    console.log('💰 Cost recorded:', costEvent);
  }

  public getDailyCost(): number {
    return this.currentCost;
  }

  public getRemainingBudget(): number {
    return Math.max(0, this.dailyCostLimit - this.currentCost);
  }

  // ENHANCED SINGLE-CALL WILL GENERATION
  async generateWillSingleCall(userData: CompleteWillData): Promise<SofiaResponse> {
    try {
      // 1. Build complete context for single AI call
      const completeContext = this.buildCompleteContext(userData);

      // 2. Estimate cost (should be ~$0.02-0.05)
      const estimatedCost = this.estimateTokenCost(completeContext);

      // 3. Check budget
      if (this.currentCost + estimatedCost > this.dailyCostLimit) {
        return {
          type: 'cost_limit_reached',
          content: 'Daily AI budget exceeded. Please try again tomorrow.',
          cost: 0,
          tierUsed: userData.userTier === 'free' ? 'free' : 'premium'
        };
      }

      // 4. Single optimized AI call
      const generatedWill = await this.callOpenAI(completeContext, 'gpt-4o');
      const actualCost = estimatedCost; // In production, calculate actual tokens used

      // 5. Calculate trust score and generate seal
      const trustScore = calculateTrustScore(userData, generatedWill, this.legalValidator);
      const trustSeal = this.generateTrustSeal(userData.userId, trustScore, userData.targetTrustLevel);

      // 6. Validate using legal engine
      const validationNotes = await this.legalValidator.validateWill(userData, generatedWill);

      // 7. Record cost
      await this.recordCost(userData.userId, 'generate_will_single_call', actualCost, userData.userTier === 'free' ? 'free' : 'premium');

      const result: WillGenerationResult = {
        willContent: generatedWill,
        trustSeal,
        validationNotes,
        confidenceScore: trustScore,
        estimatedCost,
        actualCost
      };

      return {
        type: 'will_generated',
        content: `Will successfully generated with ${trustSeal.level} Trust Seal (${trustScore}% confidence)`,
        cost: actualCost,
        tierUsed: userData.userTier === 'free' ? 'free' : 'premium',
        willResult: result
      };

    } catch (error) {
      console.error('Single-call will generation error:', error);

      // Fallback to template-based generation
      return this.fallbackToTemplateGeneration(userData);
    }
  }

  private buildCompleteContext(userData: CompleteWillData): string {
    const template = getTemplateById(`enhanced_${userData.jurisdiction.toLowerCase()}_${userData.userTier}`);

    return `Generate a legally compliant will for ${userData.jurisdiction} jurisdiction with the following consolidated data:

PERSONAL INFORMATION:
- Full Name: ${userData.fullName}
- Birth Date: ${userData.birthDate}
- Citizenship: ${userData.citizenship}
- Marital Status: ${userData.maritalStatus}
- Spouse: ${userData.spouseName || 'N/A'}
- Children: ${userData.hasChildren ? userData.children?.map(c => c.name).join(', ') : 'None'}

EXECUTOR & GUARDIANS:
- Primary Executor: ${userData.executor?.name}
- Alternate Executor: ${userData.alternateExecutor?.name || 'Not specified'}
- Guardian: ${userData.guardian?.name || 'Not specified'}

ASSETS & BENEFICIARIES:
${userData.assets?.map(asset => `- ${asset.description} → ${asset.beneficiary} (${asset.percentage || '100'}%)`).join('\n') || 'No assets specified'}

SPECIAL INSTRUCTIONS:
- Funeral Wishes: ${userData.funeralWishes || 'Not specified'}
- Digital Assets: ${userData.digitalAssets?.length ? userData.digitalAssets.map(d => d.platform).join(', ') : 'Not specified'}
- Special Requests: ${userData.specialRequests || 'None'}

JURISDICTION REQUIREMENTS:
- Legal Framework: ${userData.jurisdiction}
- Document Type: ${template?.type || 'holographic'}
- User Tier: ${userData.userTier}
- Target Trust Level: ${userData.targetTrustLevel || 'Silver'}

REQUIREMENTS:
1. Generate a complete, legally formatted will for ${userData.jurisdiction}
2. Include all mandatory elements according to ${userData.jurisdiction} law
3. Use proper legal language and structure
4. Include confidence assessment (0-100%)
5. Highlight any potential legal issues or missing information
6. Ensure compliance with local inheritance laws

Return the response in the following JSON structure:
{
  "will_text": "Complete legal will document",
  "confidence_score": 85,
  "validation_notes": ["Note 1", "Note 2"],
  "legal_compliance": "compliant|warning|non_compliant",
  "missing_elements": ["Element 1", "Element 2"]
}`;
  }

  private estimateTokenCost(prompt: string): number {
    // Rough estimation: ~4 chars per token, $0.00002 per token for GPT-4o
    const estimatedTokens = Math.ceil(prompt.length / 4) + 1000; // +1000 for response
    return estimatedTokens * 0.00002; // Should be around $0.02-0.05
  }

  private generateTrustSeal(userId: string, trustScore: number, targetLevel?: TrustSealLevel): TrustSeal {
    let level: TrustSealLevel;

    if (trustScore >= 91) level = 'Platinum';
    else if (trustScore >= 71) level = 'Gold';
    else if (trustScore >= 41) level = 'Silver';
    else level = 'Bronze';

    return {
      id: crypto.randomUUID(),
      userId,
      documentId: crypto.randomUUID(),
      level,
      confidenceScore: trustScore,
      validations: {
        aiValidation: { score: trustScore, timestamp: new Date() },
        legalRulesCheck: { score: trustScore, issues: [] }
      },
      issuedAt: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 365 days
      digitalSignature: this.generateDigitalSignature(userId, trustScore)
    };
  }

  private generateDigitalSignature(userId: string, trustScore: number): string {
    // Simple signature generation - in production use proper cryptographic signatures
    const data = `${userId}:${trustScore}:${Date.now()}`;
    return btoa(data); // Base64 encoding as simple signature
  }

  private async fallbackToTemplateGeneration(userData: CompleteWillData): Promise<SofiaResponse> {
    try {
      const template = getTemplateById(`simple_single_${userData.jurisdiction.toLowerCase()}`);
      if (!template) {
        throw new Error(`No template found for jurisdiction: ${userData.jurisdiction}`);
      }

      const rendered = renderTemplate(template, userData);
      const trustScore = calculateTrustScore(userData, rendered, this.legalValidator);
      const trustSeal = this.generateTrustSeal(userData.userId, trustScore);

      const result: WillGenerationResult = {
        willContent: rendered,
        trustSeal,
        validationNotes: ['Generated using template fallback'],
        confidenceScore: trustScore,
        estimatedCost: 0,
        actualCost: 0
      };

      return {
        type: 'will_generated',
        content: `Will generated using template with ${trustSeal.level} Trust Seal (${trustScore}% confidence)`,
        cost: 0,
        tierUsed: 'free',
        willResult: result
      };
    } catch (error) {
      return {
        type: 'error',
        content: 'Unable to generate will. Please check your data and try again.',
        cost: 0,
        tierUsed: 'free'
      };
    }
  }
}