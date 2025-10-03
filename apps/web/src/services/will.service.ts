import { BaseService } from './base.service';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface WillDocument {
  id: string;
  user_id: string;
  title: string;
  content: any; // JSONB content
  status: 'draft' | 'completed' | 'notarized' | 'archived';
  version: number;
  created_at: string;
  updated_at: string;
  last_edited_by: string;
  metadata: Record<string, any>;
}

export interface WillFormData {
  title: string;
  personal_info: {
    full_name: string;
    date_of_birth: string;
    place_of_birth: string;
    address: string;
    identification: string;
  };
  beneficiaries: Array<{
    id: string;
    name: string;
    relationship: string;
    percentage: number;
    contact: string;
  }>;
  assets: Array<{
    id: string;
    type: 'property' | 'bank_account' | 'investment' | 'personal_item' | 'other';
    description: string;
    estimated_value: number;
    specific_instructions?: string;
  }>;
  guardians: Array<{
    id: string;
    name: string;
    relationship: string;
    contact: string;
    backup: boolean;
  }>;
  special_instructions: string;
  executor: {
    name: string;
    relationship: string;
    contact: string;
  };
}

export class WillService extends BaseService {
  protected tableName = 'will_documents';

  async createWill(formData: Partial<WillFormData>): Promise<WillDocument> {
    const userId = this.validateUserId();

    // Check usage limits
    const canCreate = await this.checkUsageLimit('wills');
    if (!canCreate) {
      throw new Error('You have reached your will creation limit. Please upgrade to create more wills.');
    }

    const willData = {
      user_id: userId,
      title: formData.title || 'Untitled Will',
      content: formData,
      status: 'draft' as const,
      version: 1,
      last_edited_by: userId,
      metadata: {
        created_via: 'web_app',
        ip_address: this.getClientIP(),
        user_agent: this.getUserAgent()
      }
    };

    const { data, error } = await supabase
      .from('will_documents')
      .insert(willData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create will: ${error.message}`);
    }

    const willDoc = data as WillDocument;
    await this.logAction('create', willDoc.id, null, willData);
    await this.trackMetric('will_created', { will_id: willDoc.id });
    await this.updateUsageCount('wills', 1);

    return willDoc;
  }

  async getWillById(willId: string): Promise<WillDocument> {
    const userId = this.validateUserId();

    // Check permissions
    const isOwner = await this.isResourceOwner(willId);
    if (!isOwner) {
      throw new Error('Access denied');
    }

    const cacheKey = `will_${willId}_${userId}`;
    const cached = await this.getFromCache<WillDocument>(cacheKey);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabase
      .from('will_documents')
      .select('*')
      .eq('id', willId)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to get will: ${error.message}`);
    }

    const willDoc = data as WillDocument;
    this.setCache(cacheKey, willDoc);
    await this.trackMetric('will_viewed', { will_id: willId });

    return willDoc;
  }

  async getUserWills(
    page: number = 1,
    limit: number = 10,
    status?: WillDocument['status']
  ): Promise<{ wills: WillDocument[]; total: number }> {
    const userId = this.validateUserId();
    const { from, to } = this.getPaginationParams(page, limit);

    let query = supabase
      .from('will_documents')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query;

    if (error) {
      throw new Error(`Failed to get user wills: ${error.message}`);
    }

    const wills = (data || []) as WillDocument[];
    const total = count || 0;
    await this.trackMetric('wills_listed', { count: total, status });

    return { wills, total };
  }

  async updateWill(willId: string, updates: Partial<WillFormData>): Promise<WillDocument> {
    const userId = this.validateUserId();

    // Check permissions
    const isOwner = await this.isResourceOwner(willId);
    if (!isOwner) {
      throw new Error('Access denied');
    }

    // Get current will for audit log
    const currentWill = await this.getWillById(willId);

    const updateData = {
      content: updates,
      last_edited_by: userId,
      updated_at: this.getTimestamp(),
      version: currentWill.version + 1,
      metadata: {
        ...currentWill.metadata,
        last_update_via: 'web_app',
        last_update_ip: this.getClientIP(),
        last_update_user_agent: this.getUserAgent()
      }
    };

    const { data, error } = await supabase
      .from('will_documents')
      .update(updateData)
      .eq('id', willId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update will: ${error.message}`);
    }

    const willDoc = data as WillDocument;
    await this.logAction('update', willId, currentWill.content, updates);
    await this.trackMetric('will_updated', { will_id: willId, version: willDoc.version });
    this.clearCache(`will_${willId}`);

    return willDoc;
  }

  async deleteWill(willId: string): Promise<boolean> {
    const userId = this.validateUserId();

    // Check permissions
    const isOwner = await this.isResourceOwner(willId);
    if (!isOwner) {
      throw new Error('Access denied');
    }

    // Get will for audit log
    const will = await this.getWillById(willId);

    const { error } = await supabase
      .from('will_documents')
      .delete()
      .eq('id', willId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete will: ${error.message}`);
    }

    await this.logAction('delete', willId, will, null);
    await this.trackMetric('will_deleted', { will_id: willId });
    await this.updateUsageCount('wills', -1);
    this.clearCache(`will_${willId}`);

    return true;
  }

  async duplicateWill(willId: string, newTitle?: string): Promise<WillDocument> {
    const userId = this.validateUserId();

    // Check usage limits
    const canCreate = await this.checkUsageLimit('wills');
    if (!canCreate) {
      throw new Error('You have reached your will creation limit. Please upgrade to create more wills.');
    }

    // Get original will
    const originalWill = await this.getWillById(willId);

    const duplicateData = {
      ...originalWill.content,
      title: newTitle || `${originalWill.title} (Copy)`
    };

    return this.createWill(duplicateData);
  }

  async generateWillPDF(willId: string): Promise<Buffer> {
    const userId = this.validateUserId();
    const will = await this.getWillById(willId);

    // Track PDF generation
    await this.trackMetric('will_pdf_generated', { will_id: willId });

    // TODO: Implement PDF generation
    // For now, return placeholder
    throw new Error('PDF generation not yet implemented');
  }

  async getWillVersions(willId: string): Promise<Array<{ version: number; updated_at: string; last_edited_by: string }>> {
    const userId = this.validateUserId();

    // Check permissions
    const isOwner = await this.isResourceOwner(willId);
    if (!isOwner) {
      throw new Error('Access denied');
    }

    // This would require a separate versions table in production
    // For now, return current version only
    const will = await this.getWillById(willId);

    return [{
      version: will.version,
      updated_at: will.updated_at,
      last_edited_by: will.last_edited_by
    }];
  }

  async validateWillContent(content: Partial<WillFormData>): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic validation
    if (!content.personal_info?.full_name) {
      errors.push('Full name is required');
    }

    if (!content.beneficiaries || content.beneficiaries.length === 0) {
      errors.push('At least one beneficiary is required');
    }

    if (content.beneficiaries) {
      const totalPercentage = content.beneficiaries.reduce((sum, b) => sum + (b.percentage || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        errors.push('Beneficiary percentages must total 100%');
      }
    }

    if (!content.executor?.name) {
      errors.push('Executor is required');
    }

    return { valid: errors.length === 0, errors };
  }

  private async checkUsageLimit(resource: 'wills'): Promise<boolean> {
    const userId = this.validateUserId();

    // Get user's plan and current usage
    const [plan, usage] = await Promise.all([
      this.getUserPlan(userId),
      this.getCurrentUsage(userId, resource)
    ]);

    const limits = {
      free: { wills: 1 },
      premium: { wills: -1 }, // unlimited
      family: { wills: -1 }   // unlimited
    };

    const limit = limits[plan as keyof typeof limits]?.[resource] || 0;
    return limit === -1 || usage < limit;
  }

  private async getUserPlan(userId: string): Promise<string> {
    const { data } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    return data?.plan || 'free';
  }

  private async getCurrentUsage(userId: string, resource: string): Promise<number> {
    const { data } = await supabase
      .from('usage_tracking')
      .select('current_usage')
      .eq('user_id', userId)
      .eq('resource_type', resource)
      .single();

    return data?.current_usage || 0;
  }

  private async updateUsageCount(resource: string, change: number): Promise<void> {
    const userId = this.validateUserId();

    await supabase
      .from('usage_tracking')
      .upsert({
        user_id: userId,
        resource_type: resource,
        current_usage: change,
        last_updated: this.getTimestamp()
      }, {
        onConflict: 'user_id,resource_type'
      });
  }
}