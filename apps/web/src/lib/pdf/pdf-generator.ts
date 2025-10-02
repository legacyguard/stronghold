// PDF Generation System for Legal Documents
// Zero-cost PDF generation using client-side libraries

import { jsPDF } from 'jspdf';
import { LegalFramework, LEGAL_FRAMEWORKS } from '@/lib/will/legal-frameworks';

export interface PDFGenerationOptions {
  jurisdiction: string;
  document_type: 'will' | 'legal_notice' | 'guardian_appointment' | 'time_capsule';
  language: string;
  template_data: Record<string, any>;
  formatting_options?: PDFFormattingOptions;
}

export interface PDFFormattingOptions {
  font_size: number;
  line_height: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  header?: string;
  footer?: string;
  watermark?: string;
  page_numbering: boolean;
}

export interface PDFValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  completeness_score: number;
}

// Default formatting options based on legal requirements
const DEFAULT_FORMATTING: PDFFormattingOptions = {
  font_size: 12,
  line_height: 1.5,
  margins: {
    top: 25,
    bottom: 25,
    left: 25,
    right: 25
  },
  page_numbering: true
};

export class PDFGenerator {
  private legal_framework: LegalFramework;
  private formatting: PDFFormattingOptions;

  constructor(jurisdiction: string, formatting?: PDFFormattingOptions) {
    this.legal_framework = LEGAL_FRAMEWORKS[jurisdiction.toUpperCase()];
    if (!this.legal_framework) {
      throw new Error(`Unsupported jurisdiction: ${jurisdiction}`);
    }
    this.formatting = { ...DEFAULT_FORMATTING, ...formatting };
  }

  /**
   * Generate PDF document from template and data
   */
  async generatePDF(options: PDFGenerationOptions): Promise<Uint8Array> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set document metadata
    doc.setProperties({
      title: this.getDocumentTitle(options.document_type, options.language),
      subject: 'Legal Document',
      author: 'LegacyGuard Platform',
      creator: 'LegacyGuard PDF Generator'
    });

    // Apply formatting
    this.setupDocumentFormatting(doc);

    // Generate content based on document type
    switch (options.document_type) {
      case 'will':
        await this.generateWillPDF(doc, options);
        break;
      case 'legal_notice':
        await this.generateLegalNoticePDF(doc, options);
        break;
      case 'guardian_appointment':
        await this.generateGuardianAppointmentPDF(doc, options);
        break;
      case 'time_capsule':
        await this.generateTimeCapsulePDF(doc, options);
        break;
      default:
        throw new Error(`Unsupported document type: ${options.document_type}`);
    }

    // Add page numbers if enabled
    if (this.formatting.page_numbering) {
      this.addPageNumbers(doc);
    }

    // Add watermark if specified
    if (this.formatting.watermark) {
      this.addWatermark(doc, this.formatting.watermark);
    }

    return new Uint8Array(doc.output('arraybuffer'));
  }

  /**
   * Validate document before PDF generation
   */
  validateDocument(options: PDFGenerationOptions): PDFValidationResult {
    const result: PDFValidationResult = {
      is_valid: true,
      errors: [],
      warnings: [],
      completeness_score: 0
    };

    const validation_rules = this.legal_framework.validation_rules;
    const template_data = options.template_data;

    // Check required sections
    let completed_sections = 0;
    for (const required_section of validation_rules.required_sections) {
      if (!template_data[required_section] || template_data[required_section].trim() === '') {
        result.errors.push(`Missing required section: ${required_section}`);
        result.is_valid = false;
      } else {
        completed_sections++;
      }
    }

    // Check mandatory clauses
    for (const mandatory_clause of validation_rules.mandatory_clauses) {
      if (!template_data[mandatory_clause]) {
        result.warnings.push(`Missing recommended clause: ${mandatory_clause}`);
      }
    }

    // Check forbidden content
    const content_string = JSON.stringify(template_data).toLowerCase();
    for (const forbidden of validation_rules.forbidden_content) {
      if (content_string.includes(forbidden.toLowerCase())) {
        result.errors.push(`Document contains forbidden content: ${forbidden}`);
        result.is_valid = false;
      }
    }

    // Calculate completeness score
    result.completeness_score = Math.round(
      (completed_sections / validation_rules.required_sections.length) * 100
    );

    // Jurisdiction-specific validations
    if (options.document_type === 'will') {
      this.validateWillSpecific(template_data, result);
    }

    return result;
  }

  /**
   * Generate will PDF content
   */
  private async generateWillPDF(doc: jsPDF, options: PDFGenerationOptions): Promise<void> {
    const template = this.getWillTemplate(options.template_data.will_type || 'simple_will');
    const processed_content = this.processTemplate(template, options.template_data);

    // Add title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const title = options.jurisdiction === 'SK' ? 'ZÁVET' : 'ZÁVĚŤ';
    doc.text(title, 105, 30, { align: 'center' });

    // Add content
    doc.setFontSize(this.formatting.font_size);
    doc.setFont('helvetica', 'normal');

    const lines = processed_content.split('\n');
    let y_position = 50;
    const line_height = this.formatting.font_size * this.formatting.line_height * 0.35;

    for (const line of lines) {
      if (y_position > 270) { // Near bottom of page
        doc.addPage();
        y_position = 30;
      }

      if (line.trim() === '') {
        y_position += line_height / 2;
        continue;
      }

      // Handle long lines with wrapping
      const wrapped_lines = doc.splitTextToSize(line, 160);
      for (const wrapped_line of wrapped_lines) {
        doc.text(wrapped_line, this.formatting.margins.left, y_position);
        y_position += line_height;
      }
    }

    // Add signature section
    this.addSignatureSection(doc, options.template_data);
  }

  /**
   * Generate legal notice PDF
   */
  private async generateLegalNoticePDF(doc: jsPDF, options: PDFGenerationOptions): Promise<void> {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PRÁVNE OZNÁMENIE / LEGAL NOTICE', 105, 30, { align: 'center' });

    doc.setFontSize(this.formatting.font_size);
    doc.setFont('helvetica', 'normal');

    const content = options.template_data.notice_content || '';
    const lines = doc.splitTextToSize(content, 160);

    let y_position = 50;
    for (const line of lines) {
      if (y_position > 270) {
        doc.addPage();
        y_position = 30;
      }
      doc.text(line, this.formatting.margins.left, y_position);
      y_position += this.formatting.font_size * this.formatting.line_height * 0.35;
    }
  }

  /**
   * Generate guardian appointment PDF
   */
  private async generateGuardianAppointmentPDF(doc: jsPDF, options: PDFGenerationOptions): Promise<void> {
    const title = options.jurisdiction === 'SK'
      ? 'VYMENÚVANIE OPATROVNÍKA'
      : 'JMENOVÁNÍ OPATROVNÍKA';

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 105, 30, { align: 'center' });

    doc.setFontSize(this.formatting.font_size);
    doc.setFont('helvetica', 'normal');

    const template_content = this.getGuardianAppointmentTemplate(options.jurisdiction);
    const processed_content = this.processTemplate(template_content, options.template_data);

    const lines = processed_content.split('\n');
    let y_position = 50;
    const line_height = this.formatting.font_size * this.formatting.line_height * 0.35;

    for (const line of lines) {
      if (y_position > 270) {
        doc.addPage();
        y_position = 30;
      }
      doc.text(line, this.formatting.margins.left, y_position);
      y_position += line_height;
    }
  }

  /**
   * Generate time capsule PDF
   */
  private async generateTimeCapsulePDF(doc: jsPDF, options: PDFGenerationOptions): Promise<void> {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ČASOVÁ KAPSULA / TIME CAPSULE', 105, 30, { align: 'center' });

    doc.setFontSize(this.formatting.font_size);
    doc.setFont('helvetica', 'normal');

    const content = options.template_data.capsule_content || '';
    const recipient = options.template_data.recipient_name || '';
    const delivery_date = options.template_data.delivery_date || '';

    let y_position = 50;
    const line_height = this.formatting.font_size * this.formatting.line_height * 0.35;

    // Add recipient and delivery info
    doc.text(`Pre: ${recipient}`, this.formatting.margins.left, y_position);
    y_position += line_height * 2;
    doc.text(`Dátum doručenia: ${delivery_date}`, this.formatting.margins.left, y_position);
    y_position += line_height * 3;

    // Add content
    const lines = doc.splitTextToSize(content, 160);
    for (const line of lines) {
      if (y_position > 270) {
        doc.addPage();
        y_position = 30;
      }
      doc.text(line, this.formatting.margins.left, y_position);
      y_position += line_height;
    }
  }

  /**
   * Setup document formatting
   */
  private setupDocumentFormatting(doc: jsPDF): void {
    doc.setFontSize(this.formatting.font_size);
    doc.setFont('helvetica', 'normal');
  }

  /**
   * Add page numbers to document
   */
  private addPageNumbers(doc: jsPDF): void {
    const page_count = doc.getNumberOfPages();
    for (let i = 1; i <= page_count; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Strana ${i} z ${page_count}`,
        105,
        290,
        { align: 'center' }
      );
    }
  }

  /**
   * Add watermark to all pages
   */
  private addWatermark(doc: jsPDF, watermark: string): void {
    const page_count = doc.getNumberOfPages();
    for (let i = 1; i <= page_count; i++) {
      doc.setPage(i);
      doc.setFontSize(40);
      doc.setTextColor(200, 200, 200);
      doc.text(
        watermark,
        105,
        150,
        {
          align: 'center',
          angle: 45
        }
      );
      doc.setTextColor(0, 0, 0); // Reset color
    }
  }

  /**
   * Add signature section to will documents
   */
  private addSignatureSection(doc: jsPDF, template_data: Record<string, any>): void {
    let y_position = doc.getNumberOfPages() > 1 ? 200 : 240;

    if (y_position > 250) {
      doc.addPage();
      y_position = 50;
    }

    const testator_name = template_data.testator_name || '';
    const location = template_data.location || '';
    const date = template_data.date || new Date().toLocaleDateString('sk');

    doc.setFontSize(this.formatting.font_size);
    doc.text(`V ${location}, dňa ${date}`, this.formatting.margins.left, y_position);

    y_position += 30;
    doc.text('________________________', 130, y_position);
    y_position += 10;
    doc.text(`${testator_name}`, 130, y_position);
    y_position += 8;
    doc.text('(vlastnoručný podpis)', 130, y_position);

    // Add witness section if required
    if (this.legal_framework.requirements.witnesses_required) {
      y_position += 30;
      doc.text('Svedkovia:', this.formatting.margins.left, y_position);

      for (let i = 1; i <= this.legal_framework.witness_requirements.min_witnesses; i++) {
        y_position += 20;
        doc.text(`${i}. ________________________`, this.formatting.margins.left, y_position);
        y_position += 8;
        doc.text('   (meno a podpis)', this.formatting.margins.left + 5, y_position);
      }
    }
  }

  /**
   * Get will template based on type
   */
  private getWillTemplate(will_type: string): string {
    const templates = this.legal_framework.templates;
    switch (will_type) {
      case 'simple_will':
        return templates.simple_will;
      case 'complex_will':
        return templates.complex_will;
      case 'mutual_will':
        return templates.mutual_will;
      case 'trust_will':
        return templates.trust_will;
      default:
        return templates.simple_will;
    }
  }

  /**
   * Get guardian appointment template
   */
  private getGuardianAppointmentTemplate(jurisdiction: string): string {
    if (jurisdiction === 'SK') {
      return `
Ja, {{testator_name}}, narodený/á {{birth_date}} v {{birth_place}},
bytom {{address}}, týmto vymenujem:

{{guardian_name}} ({{guardian_relationship}})
bydliskom {{guardian_address}}

za opatrovníka môjho/mojich dieťaťa/detí {{children_names}}
v prípade môjho úmrtia alebo nespôsobilosti.

Ako náhradného opatrovníka vymenujem:
{{alternate_guardian_name}} ({{alternate_guardian_relationship}})

Odporúčam, aby sa moje deti vychovávali v duchu {{values_and_beliefs}}.

V {{location}}, dňa {{date}}

                    ________________________
                    {{testator_name}}
                    (vlastnoručný podpis)
`;
    } else {
      return `
Já, {{testator_name}}, narozen/a {{birth_date}} v {{birth_place}},
bydliště {{address}}, tímto jmenuji:

{{guardian_name}} ({{guardian_relationship}})
bydliště {{guardian_address}}

opatrovníkem mého/mých dítěte/dětí {{children_names}}
v případě mé smrti nebo nezpůsobilosti.

Jako náhradního opatrovníka jmenuji:
{{alternate_guardian_name}} ({{alternate_guardian_relationship}})

Doporučuji, aby se moje děti vychovávaly v duchu {{values_and_beliefs}}.

V {{location}}, dne {{date}}

                    ________________________
                    {{testator_name}}
                    (vlastnoruční podpis)
`;
    }
  }

  /**
   * Process template with data substitution
   */
  private processTemplate(template: string, data: Record<string, any>): string {
    let processed = template;

    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      processed = processed.replace(new RegExp(placeholder, 'g'), value || '');
    }

    // Clean up any remaining placeholders
    processed = processed.replace(/\{\{[^}]+\}\}/g, '___________');

    return processed.trim();
  }

  /**
   * Get document title based on type and language
   */
  private getDocumentTitle(document_type: string, language: string): string {
    const titles = {
      will: language === 'sk' ? 'Závet' : 'Závěť',
      legal_notice: language === 'sk' ? 'Právne oznámenie' : 'Právní oznámení',
      guardian_appointment: language === 'sk' ? 'Vymenúvanie opatrovníka' : 'Jmenování opatrovníka',
      time_capsule: language === 'sk' ? 'Časová kapsula' : 'Časová kapsula'
    };

    return titles[document_type as keyof typeof titles] || 'Právny dokument';
  }

  /**
   * Will-specific validation
   */
  private validateWillSpecific(template_data: Record<string, any>, result: PDFValidationResult): void {
    // Check age requirement
    if (template_data.testator_age && template_data.testator_age < this.legal_framework.requirements.min_age) {
      result.errors.push(`Testator must be at least ${this.legal_framework.requirements.min_age} years old`);
      result.is_valid = false;
    }

    // Check asset distribution
    if (!template_data.asset_distribution || template_data.asset_distribution.trim() === '') {
      result.errors.push('Asset distribution section is required');
      result.is_valid = false;
    }

    // Check executor appointment
    if (!template_data.executor_name || template_data.executor_name.trim() === '') {
      result.warnings.push('Executor appointment is recommended');
    }

    // Check witness requirements if applicable
    if (this.legal_framework.requirements.witnesses_required) {
      const witness_count = template_data.witnesses ? template_data.witnesses.length : 0;
      if (witness_count < this.legal_framework.witness_requirements.min_witnesses) {
        result.errors.push(
          `Minimum ${this.legal_framework.witness_requirements.min_witnesses} witnesses required`
        );
        result.is_valid = false;
      }
    }
  }
}

// Utility functions for PDF operations
export async function generateWillPDF(
  jurisdiction: string,
  template_data: Record<string, any>,
  formatting?: PDFFormattingOptions
): Promise<Uint8Array> {
  const generator = new PDFGenerator(jurisdiction, formatting);

  return generator.generatePDF({
    jurisdiction,
    document_type: 'will',
    language: jurisdiction.toLowerCase(),
    template_data
  });
}

export async function generateLegalNoticePDF(
  jurisdiction: string,
  notice_content: string,
  formatting?: PDFFormattingOptions
): Promise<Uint8Array> {
  const generator = new PDFGenerator(jurisdiction, formatting);

  return generator.generatePDF({
    jurisdiction,
    document_type: 'legal_notice',
    language: jurisdiction.toLowerCase(),
    template_data: { notice_content }
  });
}

export function validateWillData(
  jurisdiction: string,
  template_data: Record<string, any>
): PDFValidationResult {
  const generator = new PDFGenerator(jurisdiction);

  return generator.validateDocument({
    jurisdiction,
    document_type: 'will',
    language: jurisdiction.toLowerCase(),
    template_data
  });
}

// Download helper function
export function downloadPDF(pdf_data: Uint8Array, filename: string): void {
  const blob = new Blob([pdf_data as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}