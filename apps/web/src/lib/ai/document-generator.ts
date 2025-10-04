import { createClient } from '@/lib/supabase';

export interface DocumentTemplate {
  id: string;
  name: string;
  category: 'will' | 'trust' | 'power_of_attorney' | 'advance_directive' | 'contract' | 'legal_form';
  jurisdiction: string;
  language: string;
  version: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  complexity_level: 'basic' | 'intermediate' | 'advanced';
  template_content: string;
  required_fields: TemplateField[];
  conditional_sections: ConditionalSection[];
  validation_rules: ValidationRule[];
  legal_requirements: LegalRequirement[];
  metadata: {
    author: string;
    reviewed_by: string;
    last_legal_review: Date;
    estimated_completion_time: number;
    usage_count: number;
  };
}

export interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'textarea' | 'currency' | 'percentage';
  required: boolean;
  description: string;
  placeholder?: string;
  default_value?: any;
  validation: {
    min_length?: number;
    max_length?: number;
    pattern?: string;
    min_value?: number;
    max_value?: number;
    custom_validation?: string;
  };
  options?: {
    value: string;
    label: string;
    description?: string;
  }[];
  dependencies?: {
    field: string;
    condition: string;
    value: any;
  }[];
  help_text?: string;
  legal_significance?: string;
}

export interface ConditionalSection {
  id: string;
  name: string;
  condition: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
    value: any;
    logic?: 'and' | 'or';
    additional_conditions?: {
      field: string;
      operator: string;
      value: any;
    }[];
  };
  content: string;
  fields?: TemplateField[];
  priority: number;
}

export interface ValidationRule {
  id: string;
  field_name: string;
  rule_type: 'required' | 'format' | 'range' | 'custom' | 'legal_compliance';
  rule_expression: string;
  error_message: string;
  severity: 'error' | 'warning' | 'info';
  jurisdiction_specific: boolean;
}

export interface LegalRequirement {
  id: string;
  jurisdiction: string;
  requirement_type: 'witnessing' | 'notarization' | 'registration' | 'filing' | 'signature' | 'formatting';
  description: string;
  mandatory: boolean;
  penalty_for_non_compliance: string;
  verification_method: string;
  applicable_conditions: string[];
}

export interface DocumentGeneration {
  id: string;
  user_id: string;
  template_id: string;
  status: 'draft' | 'generating' | 'review' | 'completed' | 'failed' | 'archived';
  progress: number;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
  field_values: Record<string, any>;
  generated_content: {
    raw_content: string;
    formatted_content: string;
    legal_warnings: string[];
    completeness_score: number;
    review_notes: string[];
  };
  validation_results: {
    is_valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    suggestions: ValidationSuggestion[];
  };
  metadata: {
    generation_time_ms: number;
    content_length: number;
    complexity_score: number;
    legal_review_required: boolean;
    estimated_attorney_time: number;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  suggestion?: string;
  legal_basis?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
}

export interface ValidationSuggestion {
  field: string;
  current_value: string;
  suggested_value: string;
  reason: string;
  confidence: number;
}

export interface GenerationOptions {
  include_instructions: boolean;
  include_legal_warnings: boolean;
  formatting_style: 'formal' | 'standard' | 'simplified';
  language: string;
  jurisdiction_specific_clauses: boolean;
  auto_optimize: boolean;
  review_level: 'basic' | 'thorough' | 'professional';
}

class AIDocumentGenerator {
  private static instance: AIDocumentGenerator;
  private supabase = createClient();
  private isInitialized = false;
  private templates: Map<string, DocumentTemplate> = new Map();
  private generationQueue: Map<string, DocumentGeneration> = new Map();

  static getInstance(): AIDocumentGenerator {
    if (!AIDocumentGenerator.instance) {
      AIDocumentGenerator.instance = new AIDocumentGenerator();
    }
    return AIDocumentGenerator.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.loadDocumentTemplates();
    await this.startGenerationWorker();
    this.isInitialized = true;
  }

  async getAvailableTemplates(
    category?: string,
    jurisdiction?: string,
    language?: string
  ): Promise<DocumentTemplate[]> {
    let templates = Array.from(this.templates.values()).filter(t => t.is_active);

    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    if (jurisdiction) {
      templates = templates.filter(t => t.jurisdiction === jurisdiction || t.jurisdiction === 'universal');
    }

    if (language) {
      templates = templates.filter(t => t.language === language);
    }

    return templates.sort((a, b) => b.metadata.usage_count - a.metadata.usage_count);
  }

  async startDocumentGeneration(
    userId: string,
    templateId: string,
    fieldValues: Record<string, any>,
    options: Partial<GenerationOptions> = {}
  ): Promise<string> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const generationId = crypto.randomUUID();

    const generation: Partial<DocumentGeneration> = {
      id: generationId,
      user_id: userId,
      template_id: templateId,
      status: 'draft',
      progress: 0,
      created_at: new Date(),
      updated_at: new Date(),
      field_values: fieldValues,
      generated_content: {
        raw_content: '',
        formatted_content: '',
        legal_warnings: [],
        completeness_score: 0,
        review_notes: []
      },
      validation_results: {
        is_valid: false,
        errors: [],
        warnings: [],
        suggestions: []
      },
      metadata: {
        generation_time_ms: 0,
        content_length: 0,
        complexity_score: 0,
        legal_review_required: false,
        estimated_attorney_time: 0
      }
    };

    const { data, error } = await this.supabase
      .from('document_generations')
      .insert(generation)
      .select()
      .single();

    if (error) throw error;

    // Add to processing queue
    this.generationQueue.set(generationId, data);

    // Start generation process
    this.processDocumentGeneration(generationId, options);

    return generationId;
  }

  async validateFieldValues(
    templateId: string,
    fieldValues: Record<string, any>
  ): Promise<{
    is_valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    suggestions: ValidationSuggestion[];
    completeness_score: number;
  }> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Validate required fields
    for (const field of template.required_fields) {
      if (field.required && !fieldValues[field.name]) {
        errors.push({
          field: field.name,
          message: `${field.label} is required`,
          severity: 'critical',
          suggestion: `Please provide a value for ${field.label}`,
          legal_basis: field.legal_significance
        });
        continue;
      }

      const value = fieldValues[field.name];
      if (value !== undefined && value !== null) {
        // Validate field format
        const fieldValidation = this.validateFieldValue(field, value);
        if (fieldValidation.errors.length > 0) {
          errors.push(...fieldValidation.errors);
        }
        if (fieldValidation.warnings.length > 0) {
          warnings.push(...fieldValidation.warnings);
        }
        if (fieldValidation.suggestions.length > 0) {
          suggestions.push(...fieldValidation.suggestions);
        }
      }
    }

    // Validate against template rules
    for (const rule of template.validation_rules) {
      const ruleResult = this.validateRule(rule, fieldValues);
      if (!ruleResult.valid) {
        if (rule.severity === 'error') {
          errors.push({
            field: rule.field_name,
            message: rule.error_message,
            severity: 'high',
            suggestion: ruleResult.suggestion
          });
        } else if (rule.severity === 'warning') {
          warnings.push({
            field: rule.field_name,
            message: rule.error_message,
            recommendation: ruleResult.suggestion || 'Please review this field',
            impact: 'medium'
          });
        }
      }
    }

    // Calculate completeness score
    const requiredFields = template.required_fields.filter(f => f.required);
    const completedFields = requiredFields.filter(f => fieldValues[f.name]);
    const completeness_score = (completedFields.length / requiredFields.length) * 100;

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      completeness_score
    };
  }

  async generateDocument(
    templateId: string,
    fieldValues: Record<string, any>,
    options: Partial<GenerationOptions> = {}
  ): Promise<{
    content: string;
    formatted_content: string;
    legal_warnings: string[];
    metadata: any;
  }> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const startTime = Date.now();

    // Validate field values
    const validation = await this.validateFieldValues(templateId, fieldValues);
    if (!validation.is_valid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Generate content
    let content = template.template_content;

    // Replace field placeholders
    for (const field of template.required_fields) {
      const value = fieldValues[field.name];
      if (value !== undefined) {
        const formattedValue = this.formatFieldValue(field, value);
        const placeholder = `{{${field.name}}}`;
        content = content.replace(new RegExp(placeholder, 'g'), formattedValue);
      }
    }

    // Process conditional sections
    for (const section of template.conditional_sections) {
      const shouldInclude = this.evaluateCondition(section.condition, fieldValues);
      if (shouldInclude) {
        const sectionPlaceholder = `{{CONDITIONAL:${section.id}}}`;
        content = content.replace(sectionPlaceholder, section.content);
      } else {
        const sectionPlaceholder = `{{CONDITIONAL:${section.id}}}`;
        content = content.replace(sectionPlaceholder, '');
      }
    }

    // Generate legal warnings
    const legal_warnings = this.generateLegalWarnings(template, fieldValues, validation);

    // Format content
    const formatted_content = this.formatDocument(content, options);

    // Calculate metadata
    const processingTime = Date.now() - startTime;
    const metadata = {
      generation_time_ms: processingTime,
      content_length: content.length,
      complexity_score: this.calculateComplexityScore(template, fieldValues),
      legal_review_required: this.requiresLegalReview(template, fieldValues),
      estimated_attorney_time: this.estimateAttorneyReviewTime(template, fieldValues)
    };

    return {
      content,
      formatted_content,
      legal_warnings,
      metadata
    };
  }

  async getGenerationStatus(generationId: string): Promise<DocumentGeneration | null> {
    const { data, error } = await this.supabase
      .from('document_generations')
      .select('*')
      .eq('id', generationId)
      .single();

    if (error) return null;
    return data;
  }

  async updateFieldValues(
    generationId: string,
    fieldValues: Record<string, any>
  ): Promise<void> {
    await this.supabase
      .from('document_generations')
      .update({
        field_values: fieldValues,
        updated_at: new Date(),
        status: 'draft'
      })
      .eq('id', generationId);
  }

  async regenerateDocument(
    generationId: string,
    options?: Partial<GenerationOptions>
  ): Promise<void> {
    const generation = await this.getGenerationStatus(generationId);
    if (!generation) {
      throw new Error('Generation not found');
    }

    await this.supabase
      .from('document_generations')
      .update({
        status: 'generating',
        progress: 0,
        updated_at: new Date()
      })
      .eq('id', generationId);

    // Add to processing queue
    this.generationQueue.set(generationId, generation);
    this.processDocumentGeneration(generationId, options);
  }

  async exportDocument(
    generationId: string,
    format: 'pdf' | 'docx' | 'html' | 'txt'
  ): Promise<{
    file_url: string;
    file_name: string;
    file_size: number;
  }> {
    const generation = await this.getGenerationStatus(generationId);
    if (!generation || generation.status !== 'completed') {
      throw new Error('Document not ready for export');
    }

    // In production, this would generate actual files
    const fileName = `document_${generationId}.${format}`;
    const fileUrl = `/generated-documents/${fileName}`;

    return {
      file_url: fileUrl,
      file_name: fileName,
      file_size: generation.generated_content.formatted_content.length
    };
  }

  private async processDocumentGeneration(
    generationId: string,
    options: Partial<GenerationOptions> = {}
  ): Promise<void> {
    try {
      const generation = this.generationQueue.get(generationId);
      if (!generation) return;

      await this.updateGenerationProgress(generationId, 10, 'generating');

      // Generate document
      const result = await this.generateDocument(
        generation.template_id,
        generation.field_values,
        options
      );

      await this.updateGenerationProgress(generationId, 80);

      // Update generation record
      await this.supabase
        .from('document_generations')
        .update({
          status: 'completed',
          progress: 100,
          completed_at: new Date(),
          generated_content: {
            raw_content: result.content,
            formatted_content: result.formatted_content,
            legal_warnings: result.legal_warnings,
            completeness_score: 100,
            review_notes: []
          },
          metadata: result.metadata
        })
        .eq('id', generationId);

      // Update template usage count
      await this.updateTemplateUsageCount(generation.template_id);

      this.generationQueue.delete(generationId);

    } catch (error) {
      await this.supabase
        .from('document_generations')
        .update({
          status: 'failed',
          completed_at: new Date(),
          generated_content: {
            raw_content: '',
            formatted_content: '',
            legal_warnings: [`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
            completeness_score: 0,
            review_notes: []
          }
        })
        .eq('id', generationId);

      this.generationQueue.delete(generationId);
    }
  }

  private validateFieldValue(
    field: TemplateField,
    value: any
  ): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
    suggestions: ValidationSuggestion[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Type validation
    switch (field.type) {
      case 'text':
      case 'textarea':
        if (typeof value !== 'string') {
          errors.push({
            field: field.name,
            message: `${field.label} must be text`,
            severity: 'high'
          });
        } else {
          if (field.validation.min_length && value.length < field.validation.min_length) {
            errors.push({
              field: field.name,
              message: `${field.label} must be at least ${field.validation.min_length} characters`,
              severity: 'medium'
            });
          }
          if (field.validation.max_length && value.length > field.validation.max_length) {
            errors.push({
              field: field.name,
              message: `${field.label} must be no more than ${field.validation.max_length} characters`,
              severity: 'medium'
            });
          }
          if (field.validation.pattern) {
            const regex = new RegExp(field.validation.pattern);
            if (!regex.test(value)) {
              errors.push({
                field: field.name,
                message: `${field.label} format is invalid`,
                severity: 'high'
              });
            }
          }
        }
        break;

      case 'number':
      case 'currency':
      case 'percentage':
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue)) {
          errors.push({
            field: field.name,
            message: `${field.label} must be a valid number`,
            severity: 'high'
          });
        } else {
          if (field.validation.min_value !== undefined && numValue < field.validation.min_value) {
            errors.push({
              field: field.name,
              message: `${field.label} must be at least ${field.validation.min_value}`,
              severity: 'medium'
            });
          }
          if (field.validation.max_value !== undefined && numValue > field.validation.max_value) {
            errors.push({
              field: field.name,
              message: `${field.label} must be no more than ${field.validation.max_value}`,
              severity: 'medium'
            });
          }
        }
        break;

      case 'date':
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          errors.push({
            field: field.name,
            message: `${field.label} must be a valid date`,
            severity: 'high'
          });
        }
        break;

      case 'select':
        if (field.options && !field.options.some(opt => opt.value === value)) {
          errors.push({
            field: field.name,
            message: `${field.label} must be one of the available options`,
            severity: 'high'
          });
        }
        break;
    }

    return { errors, warnings, suggestions };
  }

  private validateRule(
    rule: ValidationRule,
    fieldValues: Record<string, any>
  ): {
    valid: boolean;
    suggestion?: string;
  } {
    try {
      // Simplified rule evaluation
      const value = fieldValues[rule.field_name];

      switch (rule.rule_type) {
        case 'required':
          return {
            valid: value !== undefined && value !== null && value !== '',
            suggestion: 'This field is required for legal compliance'
          };

        case 'format':
          if (typeof value === 'string') {
            const regex = new RegExp(rule.rule_expression);
            return {
              valid: regex.test(value),
              suggestion: 'Please check the format of this field'
            };
          }
          return { valid: true };

        case 'custom':
          // In production, this would evaluate custom rules
          return { valid: true };

        default:
          return { valid: true };
      }
    } catch (error) {
      return { valid: false, suggestion: 'Validation rule error' };
    }
  }

  private formatFieldValue(field: TemplateField, value: any): string {
    switch (field.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(parseFloat(value));

      case 'percentage':
        return `${parseFloat(value)}%`;

      case 'date':
        return new Date(value).toLocaleDateString();

      case 'boolean':
        return value ? 'Yes' : 'No';

      default:
        return String(value);
    }
  }

  private evaluateCondition(
    condition: ConditionalSection['condition'],
    fieldValues: Record<string, any>
  ): boolean {
    const fieldValue = fieldValues[condition.field];

    let result = false;

    switch (condition.operator) {
      case 'equals':
        result = fieldValue === condition.value;
        break;
      case 'not_equals':
        result = fieldValue !== condition.value;
        break;
      case 'contains':
        result = String(fieldValue).includes(String(condition.value));
        break;
      case 'exists':
        result = fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
        break;
      case 'not_exists':
        result = fieldValue === undefined || fieldValue === null || fieldValue === '';
        break;
      case 'greater_than':
        result = parseFloat(fieldValue) > parseFloat(condition.value);
        break;
      case 'less_than':
        result = parseFloat(fieldValue) < parseFloat(condition.value);
        break;
    }

    // Handle additional conditions with logic operators
    if (condition.additional_conditions) {
      for (const additionalCondition of condition.additional_conditions) {
        const additionalResult = this.evaluateCondition(
          { ...additionalCondition, field: additionalCondition.field, operator: additionalCondition.operator as any },
          fieldValues
        );

        if (condition.logic === 'and') {
          result = result && additionalResult;
        } else if (condition.logic === 'or') {
          result = result || additionalResult;
        }
      }
    }

    return result;
  }

  private generateLegalWarnings(
    template: DocumentTemplate,
    fieldValues: Record<string, any>,
    validation: any
  ): string[] {
    const warnings: string[] = [];

    // Check legal requirements
    for (const requirement of template.legal_requirements) {
      if (requirement.mandatory) {
        warnings.push(
          `${requirement.requirement_type}: ${requirement.description}`
        );
      }
    }

    // Add validation warnings
    for (const warning of validation.warnings) {
      warnings.push(`${warning.field}: ${warning.message}`);
    }

    // General legal warnings
    warnings.push(
      'This document should be reviewed by a qualified attorney before execution.',
      'Ensure all legal requirements for your jurisdiction are met.',
      'Consider the tax implications of the provisions in this document.'
    );

    return warnings;
  }

  private formatDocument(
    content: string,
    options: Partial<GenerationOptions>
  ): string {
    let formatted = content;

    // Add legal warnings if requested
    if (options.include_legal_warnings) {
      formatted = `[LEGAL NOTICE: This document has been generated automatically. Please review with a qualified attorney.]\n\n${formatted}`;
    }

    // Apply formatting style
    switch (options.formatting_style) {
      case 'formal':
        formatted = this.applyFormalFormatting(formatted);
        break;
      case 'simplified':
        formatted = this.applySimplifiedFormatting(formatted);
        break;
      default:
        formatted = this.applyStandardFormatting(formatted);
    }

    return formatted;
  }

  private calculateComplexityScore(
    template: DocumentTemplate,
    fieldValues: Record<string, any>
  ): number {
    let score = 0;

    // Base complexity from template
    switch (template.complexity_level) {
      case 'basic':
        score += 1;
        break;
      case 'intermediate':
        score += 3;
        break;
      case 'advanced':
        score += 5;
        break;
    }

    // Add complexity from conditional sections
    score += template.conditional_sections.length * 0.5;

    // Add complexity from field count
    score += template.required_fields.length * 0.1;

    return Math.min(score, 10);
  }

  private requiresLegalReview(
    template: DocumentTemplate,
    fieldValues: Record<string, any>
  ): boolean {
    // High complexity templates always require review
    if (template.complexity_level === 'advanced') {
      return true;
    }

    // Check for high-value assets
    const assetFields = template.required_fields.filter(f =>
      f.type === 'currency' && fieldValues[f.name] > 100000
    );

    return assetFields.length > 0;
  }

  private estimateAttorneyReviewTime(
    template: DocumentTemplate,
    fieldValues: Record<string, any>
  ): number {
    const baseTime = template.metadata.estimated_completion_time || 30;
    const complexityMultiplier = this.calculateComplexityScore(template, fieldValues) / 5;

    return Math.ceil(baseTime * complexityMultiplier);
  }

  private applyFormalFormatting(content: string): string {
    return content
      .replace(/\n\n/g, '\n\n    ')
      .replace(/^/, '    ');
  }

  private applyStandardFormatting(content: string): string {
    return content;
  }

  private applySimplifiedFormatting(content: string): string {
    return content
      .replace(/hereby/gi, '')
      .replace(/aforementioned/gi, 'mentioned above')
      .replace(/heretofore/gi, 'before this')
      .replace(/whereas/gi, 'since');
  }

  private async updateGenerationProgress(
    generationId: string,
    progress: number,
    status?: string
  ): Promise<void> {
    const updates: any = { progress, updated_at: new Date() };
    if (status) updates.status = status;

    await this.supabase
      .from('document_generations')
      .update(updates)
      .eq('id', generationId);
  }

  private async updateTemplateUsageCount(templateId: string): Promise<void> {
    await this.supabase.rpc('increment_template_usage', {
      template_id: templateId
    });
  }

  private async loadDocumentTemplates(): Promise<void> {
    // Load templates from database/configuration
    const basicWillTemplate: DocumentTemplate = {
      id: 'basic-will-us',
      name: 'Basic Will (US)',
      category: 'will',
      jurisdiction: 'US',
      language: 'en',
      version: '1.0.0',
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true,
      complexity_level: 'basic',
      template_content: `
LAST WILL AND TESTAMENT

I, {{testator_name}}, of {{testator_address}}, being of sound mind and disposing memory, do hereby make, publish, and declare this to be my Last Will and Testament.

ARTICLE I - REVOCATION
I hereby revoke all former wills and codicils made by me.

ARTICLE II - EXECUTOR
I nominate {{executor_name}} to serve as Executor of this Will.

ARTICLE III - DISTRIBUTION
I give, devise, and bequeath all of my property to {{primary_beneficiary}}.

{{CONDITIONAL:spouse_provision}}

IN WITNESS WHEREOF, I have hereunto set my hand this {{execution_date}}.

_____________________
{{testator_name}}
      `,
      required_fields: [
        {
          id: 'testator_name',
          name: 'testator_name',
          label: 'Your Full Legal Name',
          type: 'text',
          required: true,
          description: 'Your complete legal name as it appears on official documents',
          validation: { min_length: 2, max_length: 100 },
          legal_significance: 'Required for valid will execution'
        },
        {
          id: 'testator_address',
          name: 'testator_address',
          label: 'Your Current Address',
          type: 'textarea',
          required: true,
          description: 'Your current residential address',
          validation: { min_length: 10, max_length: 200 }
        },
        {
          id: 'executor_name',
          name: 'executor_name',
          label: 'Executor Name',
          type: 'text',
          required: true,
          description: 'Person who will carry out your will',
          validation: { min_length: 2, max_length: 100 }
        },
        {
          id: 'primary_beneficiary',
          name: 'primary_beneficiary',
          label: 'Primary Beneficiary',
          type: 'text',
          required: true,
          description: 'Who will receive your assets',
          validation: { min_length: 2, max_length: 100 }
        },
        {
          id: 'execution_date',
          name: 'execution_date',
          label: 'Execution Date',
          type: 'date',
          required: true,
          description: 'Date when you sign the will'
        }
      ],
      conditional_sections: [],
      validation_rules: [
        {
          id: 'executor_not_self',
          field_name: 'executor_name',
          rule_type: 'custom',
          rule_expression: 'executor_name !== testator_name',
          error_message: 'Executor cannot be the same as testator',
          severity: 'warning',
          jurisdiction_specific: false
        }
      ],
      legal_requirements: [
        {
          id: 'witness_requirement',
          jurisdiction: 'US',
          requirement_type: 'witnessing',
          description: 'Must be signed by two witnesses',
          mandatory: true,
          penalty_for_non_compliance: 'Will may be invalid',
          verification_method: 'Witness signatures and attestation',
          applicable_conditions: ['all_wills']
        }
      ],
      metadata: {
        author: 'LegacyGuard Legal Team',
        reviewed_by: 'Senior Attorney',
        last_legal_review: new Date(),
        estimated_completion_time: 15,
        usage_count: 0
      }
    };

    this.templates.set(basicWillTemplate.id, basicWillTemplate);
  }

  private async startGenerationWorker(): Promise<void> {
    setInterval(async () => {
      try {
        const { data: pendingGenerations } = await this.supabase
          .from('document_generations')
          .select('*')
          .eq('status', 'generating')
          .order('created_at', { ascending: true })
          .limit(5);

        if (pendingGenerations) {
          for (const generation of pendingGenerations) {
            if (!this.generationQueue.has(generation.id)) {
              this.generationQueue.set(generation.id, generation);
              this.processDocumentGeneration(generation.id);
            }
          }
        }
      } catch (error) {
        console.error('Generation worker error:', error);
      }
    }, 10000); // Check every 10 seconds
  }
}

export const documentGenerator = AIDocumentGenerator.getInstance();