// Jurisdiction Content Update System
// Manages legal content updates for different jurisdictions

import { supabase } from '@/lib/supabase';

export interface ContentUpdate {
  id: string;
  jurisdiction: 'SK' | 'CZ' | 'AT' | 'DE' | 'PL';
  updateType: 'template' | 'validation_rules' | 'legal_requirements';
  version: string;
  contentHash: string;
  updateDescription: string;
  effectiveFrom: Date;
  appliedAt?: Date;
  createdBy: string;
  content?: Record<string, unknown>;
}

export interface LegalChangeNotification {
  jurisdiction: string;
  changeType: 'law_amendment' | 'court_decision' | 'regulation_update';
  title: string;
  description: string;
  sourceUrl?: string;
  effectiveDate: Date;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export class JurisdictionContentUpdater {
  private static readonly UPDATE_SOURCES = {
    'SK': {
      name: 'Slovenská republika',
      sources: [
        'https://www.slov-lex.sk/',
        'https://www.justice.gov.sk/',
        'https://www.nrsr.sk/'
      ],
      lastChecked: null as Date | null
    },
    'CZ': {
      name: 'Česká republika',
      sources: [
        'https://www.zakonyprolidi.cz/',
        'https://portal.gov.cz/',
        'https://www.psp.cz/'
      ],
      lastChecked: null as Date | null
    },
    'AT': {
      name: 'Österreich',
      sources: [
        'https://www.ris.bka.gv.at/',
        'https://www.parlament.gv.at/'
      ],
      lastChecked: null as Date | null
    },
    'DE': {
      name: 'Deutschland',
      sources: [
        'https://www.gesetze-im-internet.de/',
        'https://www.bundestag.de/'
      ],
      lastChecked: null as Date | null
    },
    'PL': {
      name: 'Polska',
      sources: [
        'https://isap.sejm.gov.pl/',
        'https://www.sejm.gov.pl/'
      ],
      lastChecked: null as Date | null
    }
  };

  // Check for legal updates across all jurisdictions
  static async checkForLegalUpdates(): Promise<ContentUpdate[]> {
    console.log('Starting quarterly legal updates check...');

    const updates: ContentUpdate[] = [];

    for (const jurisdiction of Object.keys(this.UPDATE_SOURCES) as Array<keyof typeof this.UPDATE_SOURCES>) {
      try {
        const lastCheck = await this.getLastUpdateCheck(jurisdiction);
        const jurisdictionUpdates = await this.fetchLegalUpdatesForJurisdiction(jurisdiction, lastCheck);

        updates.push(...jurisdictionUpdates);
        await this.updateLastCheckTimestamp(jurisdiction);

      } catch (error) {
        console.error(`Failed to check updates for ${jurisdiction}:`, error);
        await this.logUpdateError(jurisdiction, error);
      }
    }

    console.log(`Found ${updates.length} potential content updates`);
    return updates;
  }

  // Fetch updates for specific jurisdiction
  private static async fetchLegalUpdatesForJurisdiction(
    jurisdiction: string,
    since: Date | null
  ): Promise<ContentUpdate[]> {
    const updates: ContentUpdate[] = [];

    // In a real implementation, this would:
    // 1. Connect to legal databases or RSS feeds
    // 2. Parse legal change notifications
    // 3. Analyze impact on will generation templates
    // 4. Generate appropriate content updates

    // For now, simulate with known legal changes
    const simulatedUpdates = await this.getSimulatedUpdates(jurisdiction, since);

    for (const update of simulatedUpdates) {
      if (this.requiresTemplateUpdate(update) || this.requiresValidationUpdate(update)) {
        updates.push(update);
      }
    }

    return updates;
  }

  // Check if update requires template changes
  static requiresTemplateUpdate(update: ContentUpdate): boolean {
    const templateImpactKeywords = [
      'závet', 'testament', 'will', 'inheritance', 'dedičstvo', 'dědictví',
      'executor', 'vykonávateľ', 'vykonavatel', 'svedok', 'svědek', 'witness',
      'notár', 'notář', 'notary'
    ];

    return templateImpactKeywords.some(keyword =>
      update.updateDescription.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  // Check if update requires validation rule changes
  static requiresValidationUpdate(update: ContentUpdate): boolean {
    const validationImpactKeywords = [
      'formálne požiadavky', 'formální požadavky', 'formal requirements',
      'platnosť', 'platnost', 'validity', 'podpis', 'signature',
      'osvedčenie', 'osvědčení', 'certification'
    ];

    return validationImpactKeywords.some(keyword =>
      update.updateDescription.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  // Apply content update to system
  static async applyContentUpdate(update: ContentUpdate): Promise<void> {
    try {
      console.log(`Applying content update: ${update.id}`);

      if (update.updateType === 'template') {
        await this.updateWillTemplate(update);
      } else if (update.updateType === 'validation_rules') {
        await this.updateValidationRules(update);
      } else if (update.updateType === 'legal_requirements') {
        await this.updateLegalRequirements(update);
      }

      // Mark as applied
      await this.markUpdateAsApplied(update);

      // Create audit log
      await this.createUpdateLog(update);

      console.log(`Successfully applied update: ${update.id}`);

    } catch (error) {
      console.error(`Failed to apply update ${update.id}:`, error);
      await this.logUpdateError(update.jurisdiction, error);
      throw error;
    }
  }

  // Update will template content
  private static async updateWillTemplate(update: ContentUpdate): Promise<void> {
    // This would update the enhanced will templates
    console.log(`Updating will template for ${update.jurisdiction}`);

    // In real implementation:
    // 1. Load current template
    // 2. Apply changes based on update content
    // 3. Validate new template
    // 4. Deploy updated template

    // For now, log the change
    await supabase.from('audit_logs').insert({
      action: 'template_updated',
      resource_type: 'will_template',
      new_values: {
        jurisdiction: update.jurisdiction,
        version: update.version,
        update_id: update.id,
        description: update.updateDescription
      }
    });
  }

  // Update validation rules
  private static async updateValidationRules(update: ContentUpdate): Promise<void> {
    console.log(`Updating validation rules for ${update.jurisdiction}`);

    // This would update the legal validation engine rules
    await supabase.from('audit_logs').insert({
      action: 'validation_rules_updated',
      resource_type: 'validation_rules',
      new_values: {
        jurisdiction: update.jurisdiction,
        version: update.version,
        update_id: update.id,
        description: update.updateDescription
      }
    });
  }

  // Update legal requirements
  private static async updateLegalRequirements(update: ContentUpdate): Promise<void> {
    console.log(`Updating legal requirements for ${update.jurisdiction}`);

    await supabase.from('audit_logs').insert({
      action: 'legal_requirements_updated',
      resource_type: 'legal_requirements',
      new_values: {
        jurisdiction: update.jurisdiction,
        version: update.version,
        update_id: update.id,
        description: update.updateDescription
      }
    });
  }

  // Get last update check timestamp
  private static async getLastUpdateCheck(jurisdiction: string): Promise<Date | null> {
    try {
      const { data, error } = await supabase
        .from('jurisdiction_content_updates')
        .select('applied_at')
        .eq('jurisdiction', jurisdiction)
        .order('applied_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Failed to get last update check:', error);
        return null;
      }

      return data && data.length > 0 ? new Date(data[0].applied_at) : null;
    } catch (error) {
      console.error('Error getting last update check:', error);
      return null;
    }
  }

  // Update last check timestamp
  private static async updateLastCheckTimestamp(jurisdiction: string): Promise<void> {
    this.UPDATE_SOURCES[jurisdiction as keyof typeof this.UPDATE_SOURCES].lastChecked = new Date();
  }

  // Mark update as applied
  private static async markUpdateAsApplied(update: ContentUpdate): Promise<void> {
    const { error } = await supabase
      .from('jurisdiction_content_updates')
      .insert({
        jurisdiction: update.jurisdiction,
        update_type: update.updateType,
        version: update.version,
        content_hash: update.contentHash,
        update_description: update.updateDescription,
        effective_from: update.effectiveFrom.toISOString(),
        applied_at: new Date().toISOString(),
        created_by: update.createdBy
      });

    if (error) {
      throw new Error(`Failed to mark update as applied: ${error.message}`);
    }
  }

  // Create audit log for update
  private static async createUpdateLog(update: ContentUpdate): Promise<void> {
    await supabase.from('audit_logs').insert({
      action: 'content_update_applied',
      resource_type: 'jurisdiction_content',
      new_values: {
        update_id: update.id,
        jurisdiction: update.jurisdiction,
        update_type: update.updateType,
        version: update.version,
        description: update.updateDescription
      }
    });
  }

  // Log update errors
  private static async logUpdateError(jurisdiction: string, error: unknown): Promise<void> {
    await supabase.from('audit_logs').insert({
      action: 'content_update_error',
      resource_type: 'jurisdiction_content',
      new_values: {
        jurisdiction,
        error_message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }
    });
  }

  // Get simulated updates for testing/demo
  private static async getSimulatedUpdates(
    jurisdiction: string,
    since: Date | null
  ): Promise<ContentUpdate[]> {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Only return updates if we haven't checked recently
    if (since && since > oneWeekAgo) {
      return [];
    }

    // Simulate realistic legal updates
    const updates: ContentUpdate[] = [];

    if (jurisdiction === 'SK') {
      updates.push({
        id: `sk-update-${Date.now()}`,
        jurisdiction: 'SK',
        updateType: 'validation_rules',
        version: '2024.1',
        contentHash: 'sha256-sk-validation-2024-1',
        updateDescription: 'Aktualizácia požiadaviek na holografický závet podľa novely Občianskeho zákonníka',
        effectiveFrom: new Date('2024-01-01'),
        createdBy: 'legal-monitoring-system'
      });
    }

    if (jurisdiction === 'CZ') {
      updates.push({
        id: `cz-update-${Date.now()}`,
        jurisdiction: 'CZ',
        updateType: 'template',
        version: '2024.1',
        contentHash: 'sha256-cz-template-2024-1',
        updateDescription: 'Úprava šablóny závěti v súlade s judikaturou Nejvyššího soudu',
        effectiveFrom: new Date('2024-02-01'),
        createdBy: 'legal-monitoring-system'
      });
    }

    return updates;
  }

  // Get pending updates that need to be applied
  static async getPendingUpdates(): Promise<ContentUpdate[]> {
    try {
      // This would query for updates that have been detected but not yet applied
      const { data, error } = await supabase
        .from('jurisdiction_content_updates')
        .select('*')
        .is('applied_at', null)
        .order('effective_from', { ascending: true });

      if (error) {
        console.error('Failed to get pending updates:', error);
        return [];
      }

      return data?.map(row => ({
        id: row.id,
        jurisdiction: row.jurisdiction,
        updateType: row.update_type,
        version: row.version,
        contentHash: row.content_hash,
        updateDescription: row.update_description,
        effectiveFrom: new Date(row.effective_from),
        appliedAt: row.applied_at ? new Date(row.applied_at) : undefined,
        createdBy: row.created_by
      })) || [];

    } catch (error) {
      console.error('Error getting pending updates:', error);
      return [];
    }
  }

  // Validate content update before applying
  static async validateContentUpdate(update: ContentUpdate): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Basic validation
    if (!update.jurisdiction || !['SK', 'CZ', 'AT', 'DE', 'PL'].includes(update.jurisdiction)) {
      errors.push('Invalid jurisdiction specified');
    }

    if (!update.version || !update.version.match(/^\d{4}\.\d+$/)) {
      errors.push('Invalid version format (expected YYYY.N)');
    }

    if (!update.contentHash || !update.contentHash.startsWith('sha256-')) {
      errors.push('Invalid content hash format');
    }

    if (update.effectiveFrom > new Date()) {
      warnings.push('Update is scheduled for future implementation');
    }

    // Content-specific validation
    if (update.updateType === 'template') {
      recommendations.push('Review template changes with legal team before applying');
    }

    if (update.updateType === 'validation_rules') {
      recommendations.push('Test validation rules with existing user data');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations
    };
  }

  // Schedule automatic content checks (would be called by cron job)
  static async scheduleAutomaticUpdates(): Promise<void> {
    try {
      console.log('Scheduling automatic content updates...');

      // This would typically be called quarterly
      const updates = await this.checkForLegalUpdates();

      for (const update of updates) {
        const validation = await this.validateContentUpdate(update);

        if (validation.isValid) {
          // Auto-apply low-risk updates
          if (update.updateType === 'legal_requirements' &&
              !validation.warnings.length) {
            await this.applyContentUpdate(update);
          } else {
            // Queue for manual review
            await this.queueForManualReview(update, validation);
          }
        } else {
          console.error(`Invalid update ${update.id}:`, validation.errors);
        }
      }

    } catch (error) {
      console.error('Failed to schedule automatic updates:', error);
    }
  }

  // Queue update for manual review
  private static async queueForManualReview(
    update: ContentUpdate,
    validation: ValidationResult
  ): Promise<void> {
    await supabase.from('audit_logs').insert({
      action: 'update_queued_for_review',
      resource_type: 'jurisdiction_content',
      new_values: {
        update_id: update.id,
        jurisdiction: update.jurisdiction,
        validation_warnings: validation.warnings,
        validation_recommendations: validation.recommendations
      }
    });

    console.log(`Update ${update.id} queued for manual review`);
  }

  // Get update statistics
  static async getUpdateStatistics(): Promise<{
    totalUpdates: number;
    appliedUpdates: number;
    pendingUpdates: number;
    lastUpdateDate: Date | null;
    updatesByJurisdiction: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('jurisdiction_content_updates')
        .select('jurisdiction, applied_at');

      if (error) {
        console.error('Failed to get update statistics:', error);
        return {
          totalUpdates: 0,
          appliedUpdates: 0,
          pendingUpdates: 0,
          lastUpdateDate: null,
          updatesByJurisdiction: {}
        };
      }

      const totalUpdates = data?.length || 0;
      const appliedUpdates = data?.filter(row => row.applied_at).length || 0;
      const pendingUpdates = totalUpdates - appliedUpdates;

      const lastUpdateDate = data && data.length > 0
        ? new Date(Math.max(...data
            .filter(row => row.applied_at)
            .map(row => new Date(row.applied_at).getTime())))
        : null;

      const updatesByJurisdiction = data?.reduce((acc, row) => {
        acc[row.jurisdiction] = (acc[row.jurisdiction] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalUpdates,
        appliedUpdates,
        pendingUpdates,
        lastUpdateDate,
        updatesByJurisdiction
      };

    } catch (error) {
      console.error('Error getting update statistics:', error);
      return {
        totalUpdates: 0,
        appliedUpdates: 0,
        pendingUpdates: 0,
        lastUpdateDate: null,
        updatesByJurisdiction: {}
      };
    }
  }
}