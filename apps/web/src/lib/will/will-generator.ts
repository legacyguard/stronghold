// Will Generator Wizard Manager
// Handles step-by-step will creation with legal compliance

import { createClient } from '@/lib/supabase';
import { PDFGenerator, PDFGenerationOptions, generateWillPDF, validateWillData } from '@/lib/pdf/pdf-generator';
import { getLegalFramework, ASSET_DISTRIBUTION_TEMPLATES, GUARDIANSHIP_TEMPLATES } from './legal-frameworks';
import type { UserProfile, Document } from '@/types';

export interface WillWizardStep {
  step_number: number;
  step_id: string;
  title: string;
  description: string;
  required: boolean;
  fields: WillWizardField[];
  validation_rules: WillStepValidation[];
}

export interface WillWizardField {
  field_id: string;
  field_type: 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'number' | 'beneficiary_list' | 'asset_list';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: FieldValidation;
  help_text?: string;
}

export interface FieldValidation {
  min_length?: number;
  max_length?: number;
  pattern?: string;
  custom_validator?: string;
}

export interface WillStepValidation {
  rule_type: 'required_field' | 'conditional_required' | 'mutual_exclusion' | 'custom';
  field_ids: string[];
  condition?: string;
  error_message: string;
}

export interface WillData {
  // Basic testator info
  testator_name: string;
  birth_date: string;
  birth_place: string;
  address: string;
  citizenship: string;
  id_number?: string;

  // Will metadata
  will_type: 'simple_will' | 'complex_will' | 'mutual_will' | 'trust_will';
  jurisdiction: string;
  language: string;
  creation_date: string;
  location: string;

  // Executor information
  executor_name: string;
  executor_relationship: string;
  executor_address: string;
  executor_phone?: string;
  alternate_executor_name?: string;
  alternate_executor_relationship?: string;

  // Asset distribution
  asset_distribution: string;
  specific_bequests: AssetBequest[];
  residuary_beneficiary: string;
  residuary_relationship: string;

  // Children and guardianship
  has_minor_children: boolean;
  children_names?: string;
  guardian_name?: string;
  guardian_relationship?: string;
  guardian_address?: string;
  alternate_guardian_name?: string;
  alternate_guardian_relationship?: string;
  values_and_beliefs?: string;

  // Special instructions
  special_instructions?: string;
  funeral_wishes?: string;
  charitable_bequests?: CharitableBequest[];

  // Witnesses (if required)
  witnesses?: WillWitness[];

  // Advanced provisions
  trust_provisions?: TrustProvision[];
  business_succession?: BusinessSuccession[];
  digital_assets?: DigitalAsset[];
}

export interface AssetBequest {
  asset_id: string;
  asset_type: 'real_estate' | 'bank_account' | 'investment' | 'personal_property' | 'percentage';
  description: string;
  estimated_value?: number;
  beneficiary_name: string;
  beneficiary_relationship: string;
  conditions?: string;
}

export interface CharitableBequest {
  organization_name: string;
  organization_address: string;
  donation_type: 'fixed_amount' | 'percentage' | 'specific_asset';
  amount_or_percentage?: number;
  asset_description?: string;
  purpose?: string;
}

export interface WillWitness {
  witness_name: string;
  witness_age: number;
  witness_address: string;
  witness_relationship: string;
  can_be_beneficiary: boolean;
}

export interface TrustProvision {
  trust_name: string;
  trustee_name: string;
  beneficiary_names: string[];
  trust_purpose: string;
  distribution_terms: string;
  termination_conditions: string;
}

export interface BusinessSuccession {
  business_name: string;
  business_type: string;
  ownership_percentage: number;
  successor_name: string;
  succession_terms: string;
  valuation_method: string;
}

export interface DigitalAsset {
  asset_type: 'social_media' | 'cryptocurrency' | 'digital_files' | 'online_accounts';
  account_name: string;
  platform: string;
  access_instructions: string;
  beneficiary_name: string;
  special_instructions?: string;
}

export interface WillGenerationResult {
  success: boolean;
  document_id?: string;
  pdf_data?: Uint8Array;
  validation_results: any;
  errors: string[];
  warnings: string[];
  legal_compliance_score: number;
}

export class WillGenerator {
  private supabase;
  private jurisdiction: string;
  private legal_framework;

  constructor(jurisdiction: string) {
    this.supabase = createClient();
    this.jurisdiction = jurisdiction.toUpperCase();
    this.legal_framework = getLegalFramework(this.jurisdiction);
  }

  /**
   * Get wizard steps configuration for jurisdiction
   */
  getWizardSteps(): WillWizardStep[] {
    const base_steps: WillWizardStep[] = [
      {
        step_number: 1,
        step_id: 'testator_info',
        title: this.getLocalizedText('step_1_title'),
        description: this.getLocalizedText('step_1_description'),
        required: true,
        fields: [
          {
            field_id: 'testator_name',
            field_type: 'text',
            label: this.getLocalizedText('testator_name'),
            required: true,
            validation: { min_length: 2, max_length: 100 }
          },
          {
            field_id: 'birth_date',
            field_type: 'date',
            label: this.getLocalizedText('birth_date'),
            required: true
          },
          {
            field_id: 'birth_place',
            field_type: 'text',
            label: this.getLocalizedText('birth_place'),
            required: true
          },
          {
            field_id: 'address',
            field_type: 'textarea',
            label: this.getLocalizedText('current_address'),
            required: true
          },
          {
            field_id: 'id_number',
            field_type: 'text',
            label: this.getLocalizedText('id_number'),
            required: false,
            help_text: this.getLocalizedText('id_number_help')
          }
        ],
        validation_rules: [
          {
            rule_type: 'required_field',
            field_ids: ['testator_name', 'birth_date', 'birth_place', 'address'],
            error_message: this.getLocalizedText('required_fields_error')
          }
        ]
      },
      {
        step_number: 2,
        step_id: 'will_type',
        title: this.getLocalizedText('step_2_title'),
        description: this.getLocalizedText('step_2_description'),
        required: true,
        fields: [
          {
            field_id: 'will_type',
            field_type: 'select',
            label: this.getLocalizedText('will_type'),
            required: true,
            options: ['simple_will', 'complex_will', 'mutual_will', 'trust_will'],
            help_text: this.getLocalizedText('will_type_help')
          }
        ],
        validation_rules: []
      },
      {
        step_number: 3,
        step_id: 'executor',
        title: this.getLocalizedText('step_3_title'),
        description: this.getLocalizedText('step_3_description'),
        required: true,
        fields: [
          {
            field_id: 'executor_name',
            field_type: 'text',
            label: this.getLocalizedText('executor_name'),
            required: true
          },
          {
            field_id: 'executor_relationship',
            field_type: 'text',
            label: this.getLocalizedText('executor_relationship'),
            required: true
          },
          {
            field_id: 'executor_address',
            field_type: 'textarea',
            label: this.getLocalizedText('executor_address'),
            required: true
          },
          {
            field_id: 'alternate_executor_name',
            field_type: 'text',
            label: this.getLocalizedText('alternate_executor_name'),
            required: false,
            help_text: this.getLocalizedText('alternate_executor_help')
          }
        ],
        validation_rules: []
      },
      {
        step_number: 4,
        step_id: 'assets',
        title: this.getLocalizedText('step_4_title'),
        description: this.getLocalizedText('step_4_description'),
        required: true,
        fields: [
          {
            field_id: 'specific_bequests',
            field_type: 'asset_list',
            label: this.getLocalizedText('specific_bequests'),
            required: true,
            help_text: this.getLocalizedText('specific_bequests_help')
          },
          {
            field_id: 'residuary_beneficiary',
            field_type: 'text',
            label: this.getLocalizedText('residuary_beneficiary'),
            required: true
          },
          {
            field_id: 'residuary_relationship',
            field_type: 'text',
            label: this.getLocalizedText('residuary_relationship'),
            required: true
          }
        ],
        validation_rules: []
      }
    ];

    // Add guardianship step if jurisdiction supports it
    if (this.legal_framework.requirements.special_provisions.minor_children_guardianship) {
      base_steps.push({
        step_number: 5,
        step_id: 'guardianship',
        title: this.getLocalizedText('step_5_title'),
        description: this.getLocalizedText('step_5_description'),
        required: false,
        fields: [
          {
            field_id: 'has_minor_children',
            field_type: 'checkbox',
            label: this.getLocalizedText('has_minor_children'),
            required: false
          },
          {
            field_id: 'children_names',
            field_type: 'text',
            label: this.getLocalizedText('children_names'),
            required: false
          },
          {
            field_id: 'guardian_name',
            field_type: 'text',
            label: this.getLocalizedText('guardian_name'),
            required: false
          },
          {
            field_id: 'guardian_relationship',
            field_type: 'text',
            label: this.getLocalizedText('guardian_relationship'),
            required: false
          }
        ],
        validation_rules: [
          {
            rule_type: 'conditional_required',
            field_ids: ['children_names', 'guardian_name'],
            condition: 'has_minor_children',
            error_message: this.getLocalizedText('guardianship_required_error')
          }
        ]
      });
    }

    // Add witness step if required
    if (this.legal_framework.requirements.witnesses_required) {
      base_steps.push({
        step_number: 6,
        step_id: 'witnesses',
        title: this.getLocalizedText('step_6_title'),
        description: this.getLocalizedText('step_6_description'),
        required: true,
        fields: [
          {
            field_id: 'witnesses',
            field_type: 'beneficiary_list',
            label: this.getLocalizedText('witnesses'),
            required: true,
            help_text: this.getLocalizedText('witnesses_help')
          }
        ],
        validation_rules: []
      });
    }

    // Final review step
    base_steps.push({
      step_number: base_steps.length + 1,
      step_id: 'review',
      title: this.getLocalizedText('step_review_title'),
      description: this.getLocalizedText('step_review_description'),
      required: true,
      fields: [
        {
          field_id: 'special_instructions',
          field_type: 'textarea',
          label: this.getLocalizedText('special_instructions'),
          required: false,
          help_text: this.getLocalizedText('special_instructions_help')
        }
      ],
      validation_rules: []
    });

    return base_steps;
  }

  /**
   * Validate will data for current step
   */
  validateStep(step_id: string, data: Partial<WillData>): { valid: boolean; errors: string[] } {
    const step = this.getWizardSteps().find(s => s.step_id === step_id);
    if (!step) {
      return { valid: false, errors: ['Invalid step'] };
    }

    const errors: string[] = [];

    // Validate required fields
    for (const field of step.fields) {
      if (field.required && (!data[field.field_id as keyof WillData] ||
          (data[field.field_id as keyof WillData] as string)?.trim() === '')) {
        errors.push(`${field.label} is required`);
      }

      // Field-specific validation
      if (field.validation && data[field.field_id as keyof WillData]) {
        const value = data[field.field_id as keyof WillData] as string;

        if (field.validation.min_length && value.length < field.validation.min_length) {
          errors.push(`${field.label} must be at least ${field.validation.min_length} characters`);
        }

        if (field.validation.max_length && value.length > field.validation.max_length) {
          errors.push(`${field.label} must be less than ${field.validation.max_length} characters`);
        }

        if (field.validation.pattern && !new RegExp(field.validation.pattern).test(value)) {
          errors.push(`${field.label} format is invalid`);
        }
      }
    }

    // Validate step-specific rules
    for (const rule of step.validation_rules) {
      if (rule.rule_type === 'conditional_required' && rule.condition) {
        const condition_field = data[rule.condition as keyof WillData];
        if (condition_field) {
          for (const field_id of rule.field_ids) {
            if (!data[field_id as keyof WillData] ||
                (data[field_id as keyof WillData] as string)?.trim() === '') {
              errors.push(rule.error_message);
            }
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Generate complete will document
   */
  async generateWill(user_id: string, will_data: WillData): Promise<WillGenerationResult> {
    try {
      // Validate complete will data
      const validation_results = validateWillData(this.jurisdiction, will_data);

      if (!validation_results.is_valid) {
        return {
          success: false,
          validation_results,
          errors: validation_results.errors,
          warnings: validation_results.warnings,
          legal_compliance_score: validation_results.completeness_score
        };
      }

      // Prepare PDF generation data
      const pdf_data = await this.preparePDFData(will_data);

      // Generate PDF
      const pdf_buffer = await generateWillPDF(
        this.jurisdiction,
        pdf_data,
        {
          font_size: 12,
          line_height: 1.5,
          margins: { top: 25, bottom: 25, left: 25, right: 25 },
          page_numbering: true
        }
      );

      // Save to database
      const document_record = await this.saveWillDocument(user_id, will_data, pdf_buffer);

      return {
        success: true,
        document_id: document_record.id,
        pdf_data: pdf_buffer,
        validation_results,
        errors: [],
        warnings: validation_results.warnings,
        legal_compliance_score: validation_results.completeness_score
      };

    } catch (error) {
      console.error('Will generation error:', error);
      return {
        success: false,
        validation_results: { is_valid: false, errors: [], warnings: [], completeness_score: 0 },
        errors: [`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        legal_compliance_score: 0
      };
    }
  }

  /**
   * Save will document to database
   */
  private async saveWillDocument(user_id: string, will_data: WillData, pdf_buffer: Uint8Array): Promise<any> {
    // Upload PDF to Supabase Storage
    const file_name = `will_${user_id}_${Date.now()}.pdf`;
    const { error: upload_error } = await this.supabase.storage
      .from('legal_documents')
      .upload(file_name, pdf_buffer, {
        contentType: 'application/pdf'
      });

    if (upload_error) {
      throw new Error(`PDF upload failed: ${upload_error.message}`);
    }

    // Save document record
    const { data: document_record, error: db_error } = await this.supabase
      .from('documents')
      .insert({
        user_id,
        document_type: 'will',
        title: `${will_data.testator_name} - Závet`,
        file_path: file_name,
        file_size: pdf_buffer.length,
        jurisdiction: this.jurisdiction,
        metadata: {
          will_type: will_data.will_type,
          creation_date: will_data.creation_date,
          executor_name: will_data.executor_name,
          beneficiaries: this.extractBeneficiaries(will_data)
        },
        status: 'completed'
      })
      .select()
      .single();

    if (db_error) {
      throw new Error(`Database save failed: ${db_error.message}`);
    }

    return document_record;
  }

  /**
   * Prepare data for PDF generation
   */
  private preparePDFData(will_data: WillData): Record<string, any> {
    const pdf_data: Record<string, any> = { ...will_data };

    // Format asset distribution
    if (will_data.specific_bequests && will_data.specific_bequests.length > 0) {
      pdf_data.asset_distribution = this.formatAssetDistribution(will_data.specific_bequests);
    }

    // Format guardianship provisions
    if (will_data.has_minor_children && will_data.guardian_name) {
      pdf_data.guardianship_provisions = this.formatGuardianshipProvisions(will_data);
    }

    // Format special instructions
    if (will_data.special_instructions || will_data.funeral_wishes) {
      pdf_data.special_instructions = [
        will_data.special_instructions,
        will_data.funeral_wishes
      ].filter(Boolean).join('\n\n');
    }

    // Set current date if not provided
    if (!pdf_data.date) {
      pdf_data.date = new Date().toLocaleDateString(this.jurisdiction.toLowerCase());
    }

    return pdf_data;
  }

  /**
   * Format asset distribution for PDF
   */
  private formatAssetDistribution(bequests: AssetBequest[]): string {
    const templates = ASSET_DISTRIBUTION_TEMPLATES[this.jurisdiction as keyof typeof ASSET_DISTRIBUTION_TEMPLATES];
    let distribution = '';

    for (let i = 0; i < bequests.length; i++) {
      const bequest = bequests[i];
      let template = '';

      switch (bequest.asset_type) {
        case 'real_estate':
          template = templates.real_estate;
          break;
        case 'bank_account':
          template = templates.bank_account;
          break;
        case 'percentage':
          template = templates.percentage_distribution;
          break;
        default:
          template = templates.personal_property;
      }

      // Replace placeholders
      const formatted = template
        .replace('{{asset_description}}', bequest.description)
        .replace('{{estimated_value}}', bequest.estimated_value?.toString() || 'neuvedená')
        .replace('{{beneficiary_name}}', bequest.beneficiary_name)
        .replace('{{relationship}}', bequest.beneficiary_relationship)
        .replace('{{percentage}}', bequest.estimated_value?.toString() || '');

      distribution += `${i + 1}. ${formatted}\n\n`;
    }

    // Add residuary clause
    if (distribution) {
      const residuary_template = templates.residuary_clause
        .replace('{{residuary_beneficiary}}', '')
        .replace('{{relationship}}', '');
      distribution += residuary_template;
    }

    return distribution.trim();
  }

  /**
   * Format guardianship provisions
   */
  private formatGuardianshipProvisions(will_data: WillData): string {
    const template = GUARDIANSHIP_TEMPLATES[this.jurisdiction as keyof typeof GUARDIANSHIP_TEMPLATES];

    return template
      .replace('{{children_names}}', will_data.children_names || '')
      .replace('{{guardian_name}}', will_data.guardian_name || '')
      .replace('{{guardian_relationship}}', will_data.guardian_relationship || '')
      .replace('{{alternate_guardian_name}}', will_data.alternate_guardian_name || '')
      .replace('{{alternate_guardian_relationship}}', will_data.alternate_guardian_relationship || '')
      .replace('{{values_and_beliefs}}', will_data.values_and_beliefs || '');
  }

  /**
   * Extract beneficiaries for metadata
   */
  private extractBeneficiaries(will_data: WillData): string[] {
    const beneficiaries: string[] = [];

    if (will_data.specific_bequests) {
      for (const bequest of will_data.specific_bequests) {
        if (!beneficiaries.includes(bequest.beneficiary_name)) {
          beneficiaries.push(bequest.beneficiary_name);
        }
      }
    }

    if (will_data.residuary_beneficiary && !beneficiaries.includes(will_data.residuary_beneficiary)) {
      beneficiaries.push(will_data.residuary_beneficiary);
    }

    return beneficiaries;
  }

  /**
   * Get localized text (placeholder - would integrate with i18n)
   */
  private getLocalizedText(key: string): string {
    const texts: Record<string, string> = {
      // Step titles
      step_1_title: this.jurisdiction === 'SK' ? 'Základné údaje závetcu' : 'Základní údaje zůstavitele',
      step_2_title: this.jurisdiction === 'SK' ? 'Typ závetu' : 'Typ závěti',
      step_3_title: this.jurisdiction === 'SK' ? 'Vykonávateľ závetu' : 'Vykonávatel závěti',
      step_4_title: this.jurisdiction === 'SK' ? 'Rozdelenie majetku' : 'Rozdělení majetku',
      step_5_title: this.jurisdiction === 'SK' ? 'Opatrovníctvo detí' : 'Opatrovnictví dětí',
      step_6_title: this.jurisdiction === 'SK' ? 'Svedkovia' : 'Svědci',
      step_review_title: this.jurisdiction === 'SK' ? 'Kontrola a dokončenie' : 'Kontrola a dokončení',

      // Field labels
      testator_name: this.jurisdiction === 'SK' ? 'Meno a priezvisko' : 'Jméno a příjmení',
      birth_date: this.jurisdiction === 'SK' ? 'Dátum narodenia' : 'Datum narození',
      birth_place: this.jurisdiction === 'SK' ? 'Miesto narodenia' : 'Místo narození',
      current_address: this.jurisdiction === 'SK' ? 'Súčasná adresa' : 'Současná adresa',
      executor_name: this.jurisdiction === 'SK' ? 'Meno vykonávateľa' : 'Jméno vykonavatele',

      // Help texts
      id_number_help: this.jurisdiction === 'SK' ? 'Nepovinné - číslo občianskeho preukazu' : 'Nepovinné - číslo občanského průkazu',

      // Error messages
      required_fields_error: this.jurisdiction === 'SK' ? 'Vyplňte všetky povinné polia' : 'Vyplňte všechna povinná pole'
    };

    return texts[key] || key;
  }
}

// Utility functions
export function createWillGenerator(jurisdiction: string): WillGenerator {
  return new WillGenerator(jurisdiction);
}

export async function generateSimpleWill(
  user_id: string,
  jurisdiction: string,
  basic_data: Partial<WillData>
): Promise<WillGenerationResult> {
  const generator = new WillGenerator(jurisdiction);

  const will_data: WillData = {
    will_type: 'simple_will',
    jurisdiction,
    language: jurisdiction.toLowerCase(),
    creation_date: new Date().toLocaleDateString(jurisdiction.toLowerCase()),
    location: basic_data.location || '',
    ...basic_data
  } as WillData;

  return generator.generateWill(user_id, will_data);
}